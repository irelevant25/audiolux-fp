---
name: add-equipment
description: Add, rename or remove a piece of equipment in the Technika section of the Audiolux site, including preparing its photo. Arguments - product name, category, path to the photo.
---

# Add equipment to Technika

Request: `$ARGUMENTS`. If the product name, category or photo is missing, ask for it. Suggest a
category from the table below when it's obvious (e.g. a microphone).

## 1. Pick the category

Categories are `<article>` blocks inside `#technika` in `index.html`, marked with comments (in page
order):

| Marker | Category on the page | For |
|---|---|---|
| `<!-- ZVUKOVÉ SYSTÉMY -->` | Zvukové systémy | speakers, subwoofers, wireless systems, in-ear monitoring |
| `<!-- MIKROFÓNY -->` | Mikrofóny | microphones |
| `<!-- MIXÁŽNE PULTY -->` | Mixážne pulty | mixing consoles, stageboxes |
| `<!-- SVETELNÁ TECHNIKA -->` | Inteligentné a statické svetlá | moving heads, wash/PAR, LED bars |
| `<!-- DOPLNKOVÁ TECHNIKA -->` | Doplnková technika | DI boxes, haze, stage; different layout, see step 3 |

## 2. Prepare the photo

- Look at the photo first (Read tool): the product should be clearly visible, ideally on a white or
  transparent background (cards show photos on white with `object-fit: contain`).
- Convert and resize it into `assets/technika/`:

  ```sh
  npx --yes sharp-cli@5 -i "<photo>" -o assets/technika/ -f webp -q 80 resize 800 800 --fit inside --withoutEnlargement
  ```

  The output keeps the input's base name with a `.webp` extension. Rename it to lowercase kebab-case
  ASCII, e.g. `assets/technika/shure-sm7b.webp`. The target is ≤ 100 KB.
- Use the manufacturer's official product spelling for the visible name (Audio-Technica, Shure,
  Sennheiser EW 100 G4…).

## 3. Add the card

For the first four categories, add the card inside that article's
`<div class="equipment-grid equipment-grid--responsive">`, next to similar items:

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

For **Doplnková technika**, add the photo to the matching group's `.equipment-images-row` (and the
brand to its "Značky:" line). For a new kind of accessory, add a new `.additional-equipment-item`
group that follows the existing ones.

To **remove** equipment, delete its card. Delete the photo only if nothing else uses it.

## 4. Verify

```sh
node tools/check-assets.mjs
```

There must be no errors, and no size warning for the new file. Then run the `/check-site` skill
(at least `--widths 375,1280`) and look at the Technika screenshots to confirm the card shows the
photo and name correctly.

Report the category, file name, file size and the check results.
