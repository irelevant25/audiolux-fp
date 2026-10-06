---
name: add-gallery-photo
description: Add (or remove/reorder) photos in the Galéria section of the Audiolux site - optimise them, write Slovak alt texts and insert them into the gallery grid. Arguments - path(s) to the photo(s), optional event description.
---

# Add photos to the gallery

Request: `$ARGUMENTS`. If no photo path is given, ask for it. The user may also say what event the
photo is from, which helps with the alt text and the file name.

## 1. Look at each photo

Open it with the Read tool. Check that it's sharp, not a screenshot, and doesn't show private details
the client wouldn't want published (car plates and faces in close-up are worth asking about).
Thumbnails are cropped to 300 px height (`object-fit: cover`), so the subject should be near the
centre.

## 2. Optimise and name

```sh
npx --yes sharp-cli@5 -i "<photo>" -o assets/ -f webp -q 78 resize 1600 1600 --fit inside --withoutEnlargement
```

Rename the output to lowercase kebab-case ASCII that says what it is, e.g.
`assets/galeria-2026-06-dni-mesta.webp`. The target is ≤ 300 KB; if it's bigger, use `-q 70`.

## 3. Write the alt text

Write one short, factual Slovak sentence about what is visible, e.g. *Kapela na zastrešenom pódiu
na námestí* or *Farebné lúče pohyblivých hlavíc nad publikom*. Don't use "obrázok/fotka", and don't
invent event names or places you can't see or weren't told. If the text is longer than a short phrase,
have the `slovak-copy-editor` agent check it.

## 4. Insert

In `index.html`, inside `<div class="gallery-grid">` (section `#galeria`). New photos go **first**
unless the user says otherwise; the order in the HTML is the order on the page and in the lightbox.

```html
<button type="button" class="gallery-item reveal">
    <img loading="lazy" decoding="async" src="./assets/galeria-2026-06-dni-mesta.webp" alt="Koncert na námestí počas Dní mesta">
</button>
```

Nothing else is needed: the lightbox in `script.js` reads the photos from the grid. To remove a photo,
delete its `<button>`; to reorder, move it.

## 5. Verify

```sh
node tools/check-assets.mjs
```

There must be no errors. Then run the `/check-site` skill and look at the Galéria screenshots at 375
and 1280 px to confirm the new thumbnails are cropped well. The lightbox needs no separate check,
because it reads the photos from the grid.

Report the file names, sizes, alt texts and the check results.
