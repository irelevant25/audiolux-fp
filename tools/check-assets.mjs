#!/usr/bin/env node
// Static checks of index.html and assets/ (no browser or server needed):
//   errors   - local src/href pointing to a missing file (case-sensitive, like Linux hosting),
//              "#id" links without a matching id, <img> without alt
//   warnings - <img> outside the header without loading="lazy", used image files over 300 KB
//   info     - files in assets/ that index.html doesn't use
// Usage: node tools/check-assets.mjs        Exit code is 1 when there are errors.

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const MAX_IMAGE_KB = 300;

const source = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const html = source.replace(/<!--[\s\S]*?-->/g, ''); // commented-out markup doesn't count
const errors = [];
const warnings = [];

// Exact-case existence check, segment by segment (Windows/macOS file systems ignore case, Linux doesn't)
function existsExactCase(relative) {
    let dir = ROOT;
    for (const segment of relative.split('/').filter(s => s && s !== '.')) {
        if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory() || !fs.readdirSync(dir).includes(segment)) return false;
        dir = path.join(dir, segment);
    }
    return true;
}

const used = new Set();
for (const [, attr, url] of html.matchAll(/\b(src|href)="([^"]*)"/g)) {
    if (/^(https?:|mailto:|tel:|#|data:)/.test(url) || url === '') continue;
    let file;
    try {
        file = decodeURI(url).replace(/^\.\//, '');
    } catch {
        errors.push(`${attr}="${url}": malformed URL encoding`);
        continue;
    }
    if (file.includes('//')) errors.push(`${attr}="${url}": double slash in path`);
    if (!existsExactCase(file)) errors.push(`${attr}="${url}": file not found (check spelling and upper/lower case)`);
    used.add(file.replace(/\/{2,}/g, '/'));
}

// id -> its start tag
const idTags = new Map([...html.matchAll(/<[a-z][^>]*\bid="([^"]+)"[^>]*>/g)].map(m => [m[1], m[0]]));
for (const id of new Set([...html.matchAll(/\bhref="#([^"]+)"/g)].map(m => m[1]))) {
    const tag = idTags.get(id);
    if (!tag) errors.push(`href="#${id}": no element with id="${id}"`);
    // The reveal animation's transform shifts the element, so jumps to it end up 150px off
    else if (/\bclass="[^"]*\breveal\b/.test(tag)) errors.push(`href="#${id}": the target has class "reveal"; put the id on a wrapper element instead`);
}

const headerEnd = html.indexOf('</header>');
for (const match of html.matchAll(/<img\b[^>]*>/g)) {
    const tag = match[0];
    const src = tag.match(/\bsrc="([^"]*)"/)?.[1];
    if (!src) continue; // e.g. the gallery modal image, filled in by JavaScript
    if (!/\balt="/.test(tag)) errors.push(`<img src="${src}">: missing alt (describe the photo in Slovak)`);
    if (match.index > headerEnd && !/\bloading="lazy"/.test(tag)) warnings.push(`<img src="${src}">: add loading="lazy" decoding="async"`);
}

const assets = [];
(function walk(dir) {
    for (const name of fs.readdirSync(dir)) {
        const full = path.join(dir, name);
        if (fs.statSync(full).isDirectory()) walk(full);
        else assets.push(path.relative(ROOT, full).split(path.sep).join('/'));
    }
})(path.join(ROOT, 'assets'));

// Only files the page loads cost visitors anything (unused ones are listed separately below)
const heavy = assets
    .filter(file => used.has(file))
    .map(file => ({ file, kb: Math.round(fs.statSync(path.join(ROOT, file)).size / 1024) }))
    .filter(a => a.kb > MAX_IMAGE_KB)
    .sort((a, b) => b.kb - a.kb);
for (const { file, kb } of heavy) warnings.push(`${file}: ${kb} KB (aim for < ${MAX_IMAGE_KB} KB: resize and convert to WebP)`);

const unused = assets.filter(file => !used.has(file));

const print = (title, list) => list.length && console.log(`\n${title} (${list.length}):\n  ${list.join('\n  ')}`);
print('Errors', errors);
print('Warnings', warnings);
print('Unused files in assets/', unused);
console.log(`\nChecked ${used.size} referenced files and ${assets.length} assets: ${errors.length} error(s), ${warnings.length} warning(s).`);
process.exit(errors.length ? 1 : 0);
