# Audiolux website

One-page website of **Audiolux**, technical production (sound, lighting, mobile stage) for cultural
events, based in Nové Mesto nad Váhom, Slovakia. All visitor-facing text is **Slovak**; code
comments and docs are English.

## Stack

- Static `index.html` + `styles.css` + `menu.js` + `script.js`: no build step, no npm packages, no
  framework. Don't introduce any without asking.
- Contact form backend: `get-token.php` (CSRF token) and `api.php` (validates, sends with `mail()`),
  PHP ≥ 7.3.
- `tools/*.mjs`: dependency-free dev checks (Node 22+). They are never deployed.

## Run and verify

```sh
php -S 127.0.0.1:8000                                  # from the repo root (PHP 8 may be installed as `php8`)
node tools/check-assets.mjs                            # paths, alt texts, lazy loading, image sizes
node tools/check-site.mjs --base http://127.0.0.1:8000 # overflow/JS errors at 320–1280 px, screenshots in .check/
node tools/test-form.mjs --php php8                    # contact form regression test, captures mail locally
```

The `/check-site` skill runs all of this. After a visual change, open the screenshots in `.check/`
and look at them. Passing checks don't prove the layout looks right.

## How the page works

Details in [docs/architecture.md](docs/architecture.md).

- Four sections `<div class="content" id="domov|technika|galeria|kontakt">` inside `<main>`.
  `menu.js` shows the section that matches `location.hash` or contains the element it points to.
  Link with a plain `href="#id"`; no `onclick` is needed.
- Header: Domov / Technika / Galéria links plus the orange **Kontakt** button (`a.cta`). There is
  deliberately no second "Kontakt" link in the nav.
- Gallery: `<button class="gallery-item">` thumbnails open the native `<dialog id="galleryModal">`.
- `.reveal` elements fade in through an `IntersectionObserver` in `script.js`.

## Rules

- Every `<img>` needs a Slovak `alt` and `loading="lazy" decoding="async"` (the header logo is the
  only exception). Optimise images before adding them; see [docs/content-guide.md](docs/content-guide.md).
- New asset file names: lowercase kebab-case ASCII. The hosting is case-sensitive.
- CSS stays flat: no CSS nesting (older Safari showed a blank page). Grid tracks use
  `minmax(min(Npx, 100%), 1fr)`.
- No inline event handlers or `style=""` attributes (keeps a strict CSP possible). Attach listeners in
  the JS files.
- Form limits exist twice, as `maxlength` in `index.html` and in `api.php`: change them together.
  `api.php` must always answer JSON `{success, message}` with a Slovak `message`. Run
  `tools/test-form.mjs` after any PHP change.
- The repository is public: never commit passwords, SMTP credentials or other secrets.
- Commit messages follow the existing history: short Slovak sentences without diacritics.

## Deployment

Production is <https://audiolux.sk> (PHP hosting); files are uploaded by hand, with no CI. Git must
match the live site: in October 2026 uncommitted production edits had to be recovered from the
live pages. If production might have changed, compare the live files with git before editing. See
[docs/deployment.md](docs/deployment.md).

## Knowledge base

- [docs/architecture.md](docs/architecture.md): routing, header, gallery, animations, design tokens, compatibility rules
- [docs/content-guide.md](docs/content-guide.md): adding equipment, gallery photos and clients; image preparation; Slovak copy conventions
- [docs/contact-form.md](docs/contact-form.md): form flow, security measures, configuration, troubleshooting
- [docs/deployment.md](docs/deployment.md): production hosting, keeping git in sync, files to upload, recommended headers
- [docs/backlog.md](docs/backlog.md): open review findings, prioritised. Check it before starting improvements.
- Agents in `.claude/agents/`: `frontend-reviewer`, `form-security-reviewer`, `slovak-copy-editor`
- Skills in `.claude/skills/`: `/check-site`, `/add-equipment`, `/add-gallery-photo`
