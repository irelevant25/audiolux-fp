#!/usr/bin/env node
// Regression test of the contact form backend (get-token.php + api.php).
// Starts its own PHP built-in server whose mail() is captured locally (nothing is really sent),
// submits the form the way the browser does (multipart FormData + session cookie) and checks
// every answer is clean JSON with the right status, and that the e-mail arrives intact.
//
// Usage: node tools/test-form.mjs [--php php8]     Needs Node 22+ and PHP (>= 7.3) on PATH.
// Exit code is 1 when a case fails.

import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const phpIndex = process.argv.indexOf('--php');
const PHP = phpIndex >= 0 ? process.argv[phpIndex + 1] : 'php';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'audiolux-form-'));
const mailFile = path.join(tmp, 'mail.eml');
fs.writeFileSync(mailFile, '');

// Mail capture. Windows PHP talks SMTP, so run a tiny SMTP server that appends every message to mailFile;
// elsewhere PHP pipes mail to sendmail_path, so point that at "cat >> mailFile" (tmp paths have no spaces).
const freePort = () => new Promise(resolve => {
    const s = net.createServer().listen(0, '127.0.0.1', () => { const { port } = s.address(); s.close(() => resolve(port)); });
});
const mailSettings = [];
let smtp;
if (process.platform === 'win32') {
    // Windows PHP only uses SMTP while sendmail_path is unset (even an empty override switches it to sendmail)
    const ini = spawnSync(PHP, ['-r', 'echo "[[", ini_get("sendmail_path"), "]]";'], { encoding: 'utf8' });
    const sendmailPath = ini.stdout?.match(/\[\[(.*)\]\]/)?.[1];
    if (sendmailPath === undefined) { console.error(`Cannot run "${PHP}"`); process.exit(1); }
    if (sendmailPath) {
        console.error(`php.ini sets sendmail_path="${sendmailPath}"; unset it so this test can capture mail (otherwise it would really send).`);
        process.exit(1);
    }
    smtp = net.createServer(socket => {
        let buffer = '', inData = false;
        const reply = line => socket.write(line + '\r\n');
        reply('220 test-form ESMTP');
        socket.on('data', chunk => {
            buffer += chunk.toString('latin1');
            for (;;) {
                if (inData) {
                    const end = buffer.indexOf('\r\n.\r\n');
                    if (end < 0) return;
                    fs.appendFileSync(mailFile, Buffer.from(buffer.slice(0, end) + '\r\n', 'latin1'));
                    buffer = buffer.slice(end + 5);
                    inData = false;
                    reply('250 OK');
                    continue;
                }
                const eol = buffer.indexOf('\r\n');
                if (eol < 0) return;
                const command = buffer.slice(0, 4).toUpperCase();
                buffer = buffer.slice(eol + 2);
                if (command === 'DATA') { inData = true; reply('354 End data with <CR><LF>.<CR><LF>'); }
                else if (command === 'QUIT') { reply('221 Bye'); socket.end(); }
                else reply('250 OK');
            }
        });
    });
    await new Promise(resolve => smtp.listen(0, '127.0.0.1', resolve));
    mailSettings.push('-d', 'SMTP=127.0.0.1', '-d', `smtp_port=${smtp.address().port}`);
} else {
    mailSettings.push('-d', `sendmail_path=cat >> ${mailFile}`);
}

const port = await freePort();
const BASE = `http://127.0.0.1:${port}`;
const php = spawn(PHP, [...mailSettings, '-S', `127.0.0.1:${port}`], { cwd: ROOT, stdio: 'ignore' });
php.on('error', e => { console.error(`Cannot start "${PHP}": ${e.message}`); process.exit(1); });

let cookie = '';
async function request(url, options = {}) {
    const response = await fetch(BASE + url, { ...options, headers: { cookie } });
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) cookie = setCookie.split(';')[0];
    return { status: response.status, text: await response.text() };
}
async function getToken() {
    return JSON.parse((await request('/get-token.php')).text).csrf_token;
}
async function submit(fields, { token = true } = {}) {
    const form = new FormData();
    if (token) form.append('csrf_token', await getToken());
    for (const [key, value] of Object.entries(fields)) {
        if (value !== undefined) form.append(key, value);
    }
    return request('/api.php', { method: 'POST', body: form });
}

// Mail captured since `offset` (each case sends at most one): count, headers and decoded body
function mailSince(offset) {
    const raw = fs.readFileSync(mailFile).subarray(offset).toString('latin1');
    const count = (raw.match(/^Subject: /gm) ?? []).length;
    const [head, ...rest] = raw.split(/\r?\n\r?\n/);
    let body = rest.join('\r\n\r\n');
    if (/quoted-printable/i.test(head)) {
        const bytes = body.replace(/=\r?\n/g, '').replace(/=([0-9A-F]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
        body = Buffer.from(bytes, 'latin1').toString('utf8');
    }
    return { count, head, body };
}

const valid = {
    name: "Ján O'Brien", email: 'jan@example.com', phone: '+421 900 123 456',
    subject: 'Svadba "jún"', message: 'Dobrý deň,\r\nozvučenie & svetlá <3 – ďakujem', website: '',
};
const cases = [
    { name: 'GET is rejected', run: () => request('/api.php'), status: 405 },
    { name: 'missing CSRF token', run: () => submit({ ...valid }, { token: false }), status: 403 },
    { name: 'missing required fields', run: () => submit({ name: 'Ján' }), status: 400 },
    { name: 'array instead of text (no PHP crash)', run: () => submit({ ...valid, 'name[]': 'x', name: undefined }), status: 400 },
    { name: 'invalid email', run: () => submit({ ...valid, email: 'not-an-email' }), status: 400 },
    { name: 'line break in name (header injection)', run: () => submit({ ...valid, name: 'Ján\r\nBcc: x@example.com' }), status: 400 },
    { name: 'message too long', run: () => submit({ ...valid, message: 'x'.repeat(5001) }), status: 400 },
    { name: 'honeypot filled -> fake success, no mail', run: () => submit({ ...valid, website: 'http://spam.example' }), status: 200, success: true, mails: 0 },
    {
        name: 'valid message is e-mailed intact', run: () => submit(valid), status: 200, success: true, mails: 1,
        mail: ({ head, body }) => [
            /^Reply-To: jan@example\.com$/m.test(head) || 'Reply-To header missing',
            !/^X-Mailer:/m.test(head) || 'X-Mailer header leaks the PHP version',
            body.includes("Meno: Ján O'Brien") || 'name not intact',
            body.includes('Telefón: +421 900 123 456') || 'phone missing',
            body.includes('Predmet: Svadba "jún"') || 'subject not intact',
            body.includes('ozvučenie & svetlá <3 – ďakujem') || 'message not intact',
            !/&(amp|lt|gt|quot|#\d+);/.test(body) || 'HTML entities in a plain-text e-mail',
        ],
    },
    { name: 'second message within 10 s is rate limited', run: () => submit(valid), status: 429, mails: 0 },
    { name: 'new session (expired cookie) works again', run: () => { cookie = ''; return submit(valid); }, status: 200, success: true, mails: 1 },
];

let failed = 0;
try {
    for (let i = 0; ; i++) { // wait for the PHP server
        try { await request('/get-token.php'); break; } catch { if (i > 50) throw new Error('PHP server did not start'); await sleep(200); }
    }
    for (const c of cases) {
        const offset = fs.statSync(mailFile).size;
        const response = await c.run();
        await sleep(300); // let the mail capture finish writing
        const problems = [];
        let json;
        try { json = JSON.parse(response.text); } catch { problems.push(`response is not clean JSON: ${response.text.slice(0, 120)}`); }
        if (response.status !== c.status) problems.push(`HTTP ${response.status}, expected ${c.status}`);
        if (json && c.success !== undefined && json.success !== c.success) problems.push(`success=${json.success}`);
        const mail = mailSince(offset);
        if (c.mails !== undefined && mail.count !== c.mails) problems.push(`${mail.count} e-mail(s) sent, expected ${c.mails}`);
        if (c.mail && mail.count) problems.push(...c.mail(mail).filter(r => r !== true));
        if (problems.length) failed++;
        console.log(`${problems.length ? 'FAIL' : 'ok  '} ${c.name}${json?.message ? `  (${json.message})` : ''}${problems.length ? `\n     - ${problems.join('\n     - ')}` : ''}`);
    }
} finally {
    php.kill();
    smtp?.close();
    await sleep(200);
    fs.rmSync(tmp, { recursive: true, force: true });
}

console.log(failed ? `\n${failed} case(s) failed.` : `\nAll ${cases.length} cases passed (PHP binary: ${PHP}).`);
process.exit(failed ? 1 : 0);
