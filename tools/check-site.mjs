#!/usr/bin/env node
// Browser check of the running site: for every section (#domov, #technika, ...) at several
// screen widths it scrolls through like a visitor and checks that every scroll-reveal element
// appears, looks for horizontal overflow, JavaScript errors and failed requests, saves a
// full-page screenshot, and reports how much the home page downloads on first visit.
//
// Usage:   php -S 127.0.0.1:8000            (in another terminal, from the repo root)
//          node tools/check-site.mjs [--base http://127.0.0.1:8000] [--widths 320,375,768,1280] [--out .check] [--no-shots]
// Needs:   Node 22+ and Microsoft Edge or Google Chrome (or set BROWSER=/path/to/chromium-browser).
// Exit code is 1 when any check fails.

import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const args = process.argv.slice(2);
const option = (name, fallback) => {
    const i = args.indexOf(name);
    return i >= 0 ? args[i + 1] : fallback;
};
const BASE = option('--base', 'http://127.0.0.1:8000').replace(/\/$/, '');
const WIDTHS = option('--widths', '320,375,768,1280').split(',').map(Number);
const OUT = path.resolve(option('--out', '.check'));
const SHOTS = !args.includes('--no-shots');
const sleep = ms => new Promise(r => setTimeout(r, ms));

function findBrowser() {
    const candidates = [
        process.env.BROWSER,
        'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
        'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
        'C:/Program Files/Google/Chrome/Application/chrome.exe',
        process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Google/Chrome/Application/chrome.exe'),
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
        '/Applications/Chromium.app/Contents/MacOS/Chromium',
    ].filter(Boolean);
    const found = candidates.find(p => fs.existsSync(p));
    if (found) return found;
    for (const name of ['google-chrome', 'chromium', 'chromium-browser', 'microsoft-edge']) {
        if (spawnSync(name, ['--version']).status === 0) return name;
    }
    throw new Error('No Chromium-based browser found; set BROWSER=/path/to/chrome');
}

async function launchBrowser() {
    const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'audiolux-check-'));
    const proc = spawn(findBrowser(), [
        '--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`,
        '--no-first-run', '--no-default-browser-check', '--disable-extensions', '--hide-scrollbars', 'about:blank',
    ], { stdio: 'ignore' });
    // The browser writes the port it picked into DevToolsActivePort
    for (let i = 0; i < 100; i++) {
        try {
            const port = fs.readFileSync(path.join(profile, 'DevToolsActivePort'), 'utf8').split('\n')[0];
            const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
            const page = targets.find(t => t.type === 'page');
            if (page) return { proc, port, profile, wsUrl: page.webSocketDebuggerUrl };
        } catch { /* not ready yet */ }
        await sleep(100);
    }
    proc.kill();
    throw new Error('Browser did not start');
}

// Browser.close shuts down the whole process tree (killing the main process leaves children running on Windows)
async function closeBrowser({ proc, port }) {
    const exited = new Promise(resolve => proc.once('exit', resolve));
    try {
        const { webSocketDebuggerUrl } = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();
        const session = await connect(webSocketDebuggerUrl);
        session.send('Browser.close').catch(() => { });
    } catch { /* fall through to kill */ }
    if (await Promise.race([exited.then(() => true), sleep(3000)]) !== true) proc.kill();
}

function connect(wsUrl) {
    return new Promise((resolve, reject) => {
        const ws = new WebSocket(wsUrl);
        const pending = new Map();
        const listeners = [];
        let id = 0;
        ws.onerror = reject;
        ws.onopen = () => resolve({
            send: (method, params = {}) => new Promise((res, rej) => {
                pending.set(++id, { res, rej });
                ws.send(JSON.stringify({ id, method, params }));
            }),
            on: fn => listeners.push(fn),
            close: () => ws.close(),
        });
        ws.onmessage = ({ data }) => {
            const msg = JSON.parse(data);
            const p = pending.get(msg.id);
            if (p) {
                pending.delete(msg.id);
                msg.error ? p.rej(new Error(msg.error.message)) : p.res(msg.result);
            } else listeners.forEach(fn => fn(msg));
        };
    });
}

// Elements sticking out of the viewport horizontally (ignores ones clipped by an overflow:hidden parent)
const OVERFLOW_JS = `(() => {
    const vw = document.documentElement.clientWidth, out = [];
    for (const el of document.querySelectorAll('body *')) {
        const r = el.getBoundingClientRect();
        if ((!r.width && !r.height) || (r.right <= vw + 1 && r.left >= -1)) continue;
        let p = el.parentElement, clipped = false;
        while (p && p !== document.body && !clipped) {
            const pr = p.getBoundingClientRect();
            clipped = getComputedStyle(p).overflowX !== 'visible' && pr.right <= vw + 1 && pr.left >= -1;
            p = p.parentElement;
        }
        if (!clipped) out.push(el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') +
            (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\\s+/).join('.') : '') +
            ' [' + Math.round(r.left) + '..' + Math.round(r.right) + 'px]');
    }
    return out;
})()`;

// Scroll through the page like a visitor (real animations): every .reveal element of the section and
// the footer must become visible at some point. Catches elements the IntersectionObserver never sees,
// e.g. ones the 150px slide-in pushes outside an overflow:hidden parent.
const neverRevealedJs = id => `(async () => {
    const targets = Array.from(document.querySelectorAll('#${id} .reveal, footer .reveal'));
    const seen = new Set();
    const record = () => targets.forEach(el => { if (el.classList.contains('active')) seen.add(el); });
    for (let y = 0; ; y += Math.max(200, innerHeight / 2)) {
        scrollTo(0, y);
        await new Promise(r => setTimeout(r, 120));
        record();
        if (y >= document.documentElement.scrollHeight - innerHeight) break;
    }
    await new Promise(r => setTimeout(r, 400));
    record();
    scrollTo(0, 0);
    return targets.filter(el => !seen.has(el)).map(el => el.tagName.toLowerCase() + '.' + el.className.trim().split(/\\s+/).join('.'));
})()`;

// Scroll-reveal elements start invisible; show them all so screenshots and checks see the final layout
const FORCE_REVEAL_JS = `(() => {
    const style = document.createElement('style');
    style.textContent = '.reveal{opacity:1!important;transform:none!important;transition:none!important}';
    document.head.appendChild(style);
})()`;

const browser = await launchBrowser();
const cdp = await connect(browser.wsUrl);
const problems = [];
let requests = new Map();
let errors = [];

cdp.on(({ method, params }) => {
    if (method === 'Runtime.exceptionThrown') {
        errors.push('exception: ' + (params.exceptionDetails.exception?.description ?? params.exceptionDetails.text).split('\n')[0]);
    }
    if (method === 'Runtime.consoleAPICalled' && params.type === 'error') {
        errors.push('console.error: ' + params.args.map(a => a.value ?? a.description).join(' '));
    }
    // Only requests started by the current page are tracked (late events of the previous page are ignored)
    if (method === 'Network.requestWillBeSent') {
        requests.set(params.requestId, { url: params.request.url, type: params.type, status: 0, bytes: 0 });
    }
    const request = requests.get(params?.requestId);
    if (!request) return;
    if (method === 'Network.responseReceived') request.status = params.response.status;
    if (method === 'Network.loadingFinished') request.bytes = params.encodedDataLength;
    // ERR_ABORTED = lazy image cancelled because we navigated away, not a real failure
    if (method === 'Network.loadingFailed' && params.errorText !== 'net::ERR_ABORTED') request.status = params.errorText;
});

async function evaluate(expression) {
    const r = await cdp.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.text);
    return r.result.value;
}

async function open(url, width, height = 800) {
    await cdp.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 800 });
    await cdp.send('Page.navigate', { url: 'about:blank' });
    requests = new Map();
    errors = [];
    await cdp.send('Page.navigate', { url });
    await sleep(1500);
}

function collectFailures(label) {
    for (const e of errors) problems.push(`${label}: ${e}`);
    for (const r of requests.values()) {
        if (r.url.startsWith('data:')) continue;
        if (typeof r.status === 'string' || r.status >= 400) problems.push(`${label}: request failed (${r.status}) ${decodeURI(r.url)}`);
    }
}

try {
    for (const domain of ['Page', 'Runtime', 'Network']) await cdp.send(`${domain}.enable`);
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });

    // 1) What a first-time visitor downloads on the home page
    await open(`${BASE}/`, 1280, 900);
    await sleep(2500);
    collectFailures('home');
    const all = [...requests.values()].filter(r => !r.url.startsWith('data:'));
    const images = all.filter(r => r.type === 'Image');
    const mb = list => list.reduce((sum, r) => sum + r.bytes, 0) / 1048576;
    console.log(`Home page first load: ${all.length} requests, ${mb(all).toFixed(2)} MB (images: ${images.length}, ${mb(images).toFixed(2)} MB)`);
    if (mb(all) > 2) problems.push(`home: first load is ${mb(all).toFixed(2)} MB (> 2 MB) - missing loading="lazy" or oversized images?`);

    const sections = await evaluate(`Array.from(document.querySelectorAll('.content'), s => s.id)`);
    if (SHOTS) fs.mkdirSync(OUT, { recursive: true });

    // 2) Every section at every width
    for (const width of WIDTHS) {
        for (const id of sections) {
            const label = `#${id} @ ${width}px`;
            await open(`${BASE}/#${id}`, width);
            const visible = await evaluate(`getComputedStyle(document.getElementById('${id}')).display !== 'none'`);
            if (!visible) problems.push(`${label}: section is not shown when opening /#${id}`);
            const neverRevealed = await evaluate(neverRevealedJs(id));
            if (neverRevealed.length) problems.push(`${label}: ${neverRevealed.length} .reveal element(s) never became visible while scrolling, e.g. ${neverRevealed.slice(0, 3).join(', ')}`);
            await evaluate(FORCE_REVEAL_JS);
            await sleep(200);
            const overflow = await evaluate(OVERFLOW_JS);
            if (overflow.length) problems.push(`${label}: ${overflow.length} element(s) overflow horizontally, e.g. ${overflow.slice(0, 3).join(', ')}`);
            collectFailures(label);
            const failed = overflow.length || neverRevealed.length || !visible;

            let shot = '';
            if (SHOTS) {
                const { cssContentSize } = await cdp.send('Page.getLayoutMetrics');
                const scale = width >= 768 ? 0.5 : 0.75;
                const clip = { x: 0, y: 0, width, height: Math.min(Math.ceil(cssContentSize.height), 16000), scale };
                const { data } = await cdp.send('Page.captureScreenshot', { format: 'png', clip, captureBeyondViewport: true });
                shot = path.join(OUT, `${id}-${width}.png`);
                fs.writeFileSync(shot, Buffer.from(data, 'base64'));
            }
            console.log(`${failed ? 'FAIL' : 'ok  '} ${label}${shot ? `  -> ${path.relative(process.cwd(), shot)}` : ''}`);
        }
    }
} finally {
    cdp.close();
    await closeBrowser(browser);
    await sleep(300);
    try { fs.rmSync(browser.profile, { recursive: true, force: true }); } catch { /* browser may still hold files */ }
}

if (problems.length) {
    console.log(`\n${problems.length} problem(s):\n- ${problems.join('\n- ')}`);
    process.exit(1);
}
console.log('\nAll checks passed.');
