# Architecture

A single static page. No build step, no package manager, no framework; the browser loads the
files exactly as they are in the repository.

| File | Role |
|---|---|
| `index.html` | All content and markup (Slovak). Four "pages" plus header, gallery dialog and footer. |
| `styles.css` | All styles. Flat selectors, no CSS nesting (see Compatibility). |
| `menu.js` | Hash router (which section is visible), mobile hamburger menu, back-to-top button. |
| `script.js` | Contact form submission, gallery dialog, scroll-reveal animations. |
| `get-token.php`, `api.php` | Contact form backend, see [contact-form.md](contact-form.md). |
| `assets/` | Images. `assets/technika/` holds the equipment photos. |
| `tools/` | Developer checks (Node 22+). Not uploaded to the hosting. |
| `index_prototype.html` | Old design prototype, not linked. Not uploaded to the hosting. |

## Sections and routing

`index.html` contains four top-level `<div class="content">` elements inside `<main>`:
`#domov`, `#technika`, `#galeria` and `#kontakt`. CSS hides them all except the one with `.active`.

`menu.js` makes the **URL hash** the only source of truth:

- `showSection()` reads `location.hash`, finds the element with that id, and shows the `.content`
  section that contains it (falls back to `#domov` for an empty or unknown hash). It sets
  `aria-current="page"` on the matching header link, closes the mobile menu and scrolls to the top,
  or to the element itself when the id belongs to an element inside a section.
- It runs on load and on every `hashchange`, so any plain link works: header, footer, the Kontakt
  button, deep links shared by visitors, and the browser back/forward buttons.

To link to something, write `href="#some-id"`; no JavaScript is needed. The target must not be a
`.reveal` element, or be inside one: its slide-in transform shifts the element, so the jump lands
150 px off. Put the id on a plain wrapper `<div>` around it instead (`tools/check-assets.mjs`
reports the first case). To add a new page, add a `<div class="content" id="...">` inside `<main>`
and a link in `<nav id="nav">`.

Without JavaScript a `<noscript>` style shows all sections one below another.

## Header

- Logo, `<nav id="nav">` with three links (Domov, Technika, Galéria) and the orange **Kontakt**
  button (`<a class="cta" href="#kontakt">`, the only link to the contact page in the header).
- At ≤ 768 px the nav collapses behind the hamburger button. The `.nav-wrapper` animates
  `grid-template-rows` from `0fr` to `1fr`; while closed, its content is `visibility: hidden` so the
  links are not reachable by Tab or screen readers. `aria-expanded` on the button mirrors the state.
- The header is `position: fixed`; `.content` has `padding-top: 90px` to start below it, and
  `.content [id]` has `scroll-margin-top` so anchor targets aren't hidden behind it.

## Gallery

- Each photo is a `<button class="gallery-item">` containing an `<img>` with a Slovak `alt`.
- Clicking one (or Enter/Space) opens the native `<dialog id="galleryModal">` with `showModal()`.
  The browser provides the focus trap, Esc to close and the inert page behind it. Arrow keys and the
  ‹ › buttons change the photo (wrapping around); clicking the dark area closes the dialog, and focus
  returns to the photo that opened it.
- The photo list is read from the DOM, so adding a `<button>` is all it takes (see
  [content-guide.md](content-guide.md)).

## Scroll-reveal animation

Elements with `.reveal` start transparent and 150 px lower; an `IntersectionObserver` in `script.js`
adds `.active` when they enter the viewport and removes it when they leave (the animation replays).
Users with "reduce motion" enabled get no animation (`prefers-reduced-motion` in `styles.css`).

The observer only sees the part of an element that its `overflow: hidden` parents don't clip. A
`.reveal` element shorter than the 150 px slide that sits at the bottom of such a parent starts
completely clipped and never appears. That's why `.footer-bottom.reveal` only fades
(`transform: none`): the footer has `overflow: hidden`, and on wide screens the bar is ~105 px tall.
`tools/check-site.mjs` scrolls through every page like a visitor and fails if any `.reveal` element
never becomes visible.

## Images and performance

Every image except the header logo has `loading="lazy" decoding="async"`. This matters because all
four sections are in one HTML file: without lazy loading the browser downloads the photos of hidden
sections too (13.7 MB on the first visit before this was added; now about 0.4 MB).

## Design tokens

There are no CSS variables yet; these values are repeated in `styles.css`:

| Use | Value |
|---|---|
| Accent (headings, links, borders) | `#ff4500` |
| Button gradient | `linear-gradient(45deg, #ff4500, #ff6b35)` |
| Backgrounds | `#000`, `#0a0a0a`, `#1a1a1a`; tinted panels `rgba(255, 69, 0, 0.05–0.1)` |
| Text | `#fff` headings, `#ccc` body, `#888` secondary |
| Font | `"Segoe UI", Tahoma, Geneva, Verdana, sans-serif` (system fonts, nothing downloaded) |

Breakpoints used in media queries: 1050, 1000, 840 (min-width), 768, 550 and 480 px.

## Compatibility rules

- **No CSS nesting.** Older Safari/Chrome ignore nested rules; with the old nested
  `.content { &.active {...} }` those browsers showed a blank page.
- **No inline event handlers or `style=""` attributes.** All behaviour is attached in the JS files,
  so a strict Content-Security-Policy can be added later without changes to the markup.
- Grid tracks use `minmax(min(<size>, 100%), 1fr)` so they never force horizontal scrolling on
  narrow phones (checked down to 280 px).
