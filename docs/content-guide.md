# Content guide

All content lives in `index.html`; all visible text is Slovak. After any change run

```sh
node tools/check-assets.mjs
```

It reports missing or wrongly-cased image paths, missing `alt` texts, missing lazy loading and
oversized files.

## Preparing images

Optimise every new image before adding it. Product photos straight from manufacturers are often
1–1.5 MB PNGs, while a WebP of the same photo at display size is 30–60 KB with no visible difference.

| Kind | Format | Max size (fit inside) | Quality | Target file size |
|---|---|---|---|---|
| Equipment photo | WebP | 800 × 800 px | 80 | ≤ 100 KB |
| Gallery photo | WebP | 1600 × 1600 px | 78 | ≤ 300 KB |
| Client logo | WebP (or PNG with transparency) | 400 px wide | 85 | ≤ 30 KB |

With Node installed, [sharp-cli](https://www.npmjs.com/package/sharp-cli) does it in one command
(downloaded on first use by `npx`):

```sh
npx --yes sharp-cli@5 -i "Downloads/Shure SM7B.png" -o assets/technika/ -f webp -q 80 resize 800 800 --fit inside --withoutEnlargement
```

The output keeps the input's base name (`assets/technika/Shure SM7B.webp`). Rename it as described
below. Without Node, use [squoosh.app](https://squoosh.app) in the browser with the same settings.

**File names for new files:** lowercase ASCII, words separated by hyphens, no spaces or diacritics,
e.g. `shure-sm7b.webp`, `galeria-2026-06-dni-mesta.webp`. Spaces and diacritics work in browsers but
make URLs fragile, and the hosting is case-sensitive (`Photo.PNG` ≠ `photo.png`). Existing files still
use their old names; renaming them means updating `index.html` too.

**Alt text:** describe what the photo shows in one short Slovak sentence, without "obrázok" or
"fotka" (e.g. `alt="Kapela na zastrešenom pódiu na námestí"`). For equipment, the product name is
enough.

## Adding equipment (Technika)

The Technika section has one `<article>` per category, marked with comments in `index.html`
(listed in page order):

| Comment marker | Category | What belongs there |
|---|---|---|
| `<!-- ZVUKOVÉ SYSTÉMY -->` | Zvukové systémy | speakers, subwoofers, wireless systems, in-ear monitoring |
| `<!-- MIKROFÓNY -->` | Mikrofóny | microphones |
| `<!-- MIXÁŽNE PULTY -->` | Mixážne pulty | mixing consoles, stageboxes |
| `<!-- SVETELNÁ TECHNIKA -->` | Inteligentné a statické svetlá | moving heads, wash/PAR, LED bars |
| `<!-- DOPLNKOVÁ TECHNIKA -->` | Doplnková technika | DI boxes, haze, mobile stage (different card layout) |

Add a card inside the category's `<div class="equipment-grid equipment-grid--responsive">`:

```html
<div class="equipment-item reveal">
    <div class="equipment-image">
        <img loading="lazy" decoding="async" src="./assets/technika/shure-sm7b.webp" alt="Shure SM7B">
    </div>
    <div class="equipment-info">
        <h4>Shure SM7B</h4>
    </div>
</div>
```

- Use the manufacturer's official spelling: Audio-Technica, Shure, Sennheiser EW 100 G4, Audix…
- Photos are shown on white with `object-fit: contain` in a 200 px tall box, so a product on a white
  or transparent background looks best.
- In **Doplnková technika** a group is one `.additional-equipment-item` (icon, title, "Značky:" line,
  description) with its photos in `.equipment-images-row`.

To remove equipment, delete its card. You can also delete the photo, but `check-assets` lists unused
files, so leaving it is harmless.

## Adding gallery photos (Galéria)

Add a button inside `<div class="gallery-grid">`. The order in the HTML is the order on the page and
in the lightbox; new photos usually go first:

```html
<button type="button" class="gallery-item reveal">
    <img loading="lazy" decoding="async" src="./assets/galeria-2026-06-dni-mesta.webp" alt="Koncert na námestí počas Dní mesta">
</button>
```

Nothing else is needed. The lightbox (`script.js`) picks up every photo in the grid. Thumbnails are
cropped to 300 px height (`object-fit: cover`), so keep the subject near the centre.

## Clients, numbers and contact details

- **Client logos:** `<div class="clients-masonry">` in Domov, one
  `<img loading="lazy" decoding="async" src="..." alt="<name of the client>" />` each.
- **Numbers in the hero** (500+ projektov, 30+ rokov…): `<div class="stats">` at the top of Domov.
  "30+ rokov" is repeated in the "Skúsený tím" box below; keep them in sync.
- **Phone, e-mail, address:** footer `<div class="contact-info">`. The phone link must stay in the
  international format `tel:+421…`. The address the form sends to is in `api.php` (see
  [contact-form.md](contact-form.md)).

## Slovak copy conventions

- Comma before relative and subordinate clauses: *Atmosféra, ktorá zostane*; *…, že…*; *…, aby…*.
- Slovak, not Czech, vocabulary: *odbor* (not *obor*, which means "giant" in Slovak).
- An en dash with spaces for asides (*Naša filozofia je jednoduchá – každý event…*), a hyphen only
  inside words (*audio-vizuálne*).
- Formal address is lowercase everywhere (*vám, vášho, vaše*), as is usual on websites. Keep it
  that way.
- The `slovak-copy-editor` agent (`.claude/agents/`) can proofread new text.
