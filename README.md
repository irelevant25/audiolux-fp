# Audiolux website

Website of **Audiolux**, technical production (sound, lighting, mobile stage) for concerts,
festivals, theatre and corporate events, based in Nové Mesto nad Váhom, Slovakia. The site is in
Slovak.

It is one static page (HTML, CSS, vanilla JavaScript) with four sections: **Domov** (about us,
clients), **Technika** (equipment), **Galéria** (photos with a lightbox) and **Kontakt** (contact
form). Two small PHP scripts handle the contact form and e-mail each message. There is no build
step and there are no dependencies.

## Run locally

Requirements: PHP 7.3+ (8.x recommended). Node.js 22+ is only needed for the checks below.

```sh
php -S 127.0.0.1:8000
```

Open <http://127.0.0.1:8000>. Every section has its own URL: `/#technika`, `/#galeria`,
`/#kontakt`. Opening `index.html` straight from disk works for browsing, but the contact form needs
PHP.

## Checks

| Command | What it checks |
|---|---|
| `node tools/check-assets.mjs` | Image paths (case-sensitive, like the hosting), `#id` links, missing `alt` texts and lazy loading, oversized and unused images |
| `node tools/check-site.mjs --base http://127.0.0.1:8000` | In headless Edge or Chrome: every section at 320, 375, 768 and 1280 px for horizontal overflow, JavaScript errors and failed requests; first-visit download size; full-page screenshots in `.check/` |
| `node tools/test-form.mjs` | Contact form backend: status codes, validation, CSRF, header injection, honeypot, rate limit, and the exact e-mail content. Mail is captured locally, nothing is sent. `--php <binary>` picks the PHP version. |

Each command exits with code 1 when something fails.

## Project structure

```
index.html            page content and markup
styles.css            styles
menu.js               section routing (URL hash), mobile menu
script.js             contact form, gallery lightbox, scroll animations
get-token.php         CSRF token for the contact form
api.php               contact form validation and e-mail
assets/               images (assets/technika/ = equipment photos)
docs/                 documentation, see below
tools/                developer checks (not deployed)
.claude/              Claude Code agents and skills
CLAUDE.md             project instructions for Claude Code
index_prototype.html  original design prototype (not deployed)
```

## Updating content

How to add equipment, gallery photos or client logos, prepare images and keep the Slovak copy
consistent: [docs/content-guide.md](docs/content-guide.md).

## Deployment

The site runs at **<https://audiolux.sk>** on PHP hosting. There is no automatic deployment:
commit and push first, then upload `index.html`, `styles.css`, `menu.js`, `script.js`,
`get-token.php`, `api.php` and `assets/`, and send a test message through the form.

Details, including recommended security headers: [docs/deployment.md](docs/deployment.md).

## Documentation

| Document | Contents |
|---|---|
| [docs/architecture.md](docs/architecture.md) | How the page works: routing, header, gallery, animations, design tokens, compatibility rules |
| [docs/content-guide.md](docs/content-guide.md) | Adding and changing content, image preparation, Slovak copy conventions |
| [docs/contact-form.md](docs/contact-form.md) | Contact form flow, configuration, security measures, testing, troubleshooting |
| [docs/deployment.md](docs/deployment.md) | Production hosting, keeping git in sync with the live site, files to upload, HTTP headers |
| [docs/backlog.md](docs/backlog.md) | Known open issues and improvements, prioritised |

## Working with Claude Code

[CLAUDE.md](CLAUDE.md) gives Claude Code the project context and rules. The repository also
includes these skills and agents:

| Type | Name | Purpose |
|---|---|---|
| Skill | `/check-site` | Start the site locally and run all checks, including reviewing the screenshots |
| Skill | `/add-equipment` | Add equipment to Technika: optimise the photo, add the card, verify |
| Skill | `/add-gallery-photo` | Add photos to the gallery: optimise, write the Slovak alt text, verify |
| Agent | `frontend-reviewer` | Reviews HTML/CSS/JS changes for behaviour, responsive layout, accessibility and performance |
| Agent | `form-security-reviewer` | Reviews the PHP contact form for security and reliability |
| Agent | `slovak-copy-editor` | Proofreads the Slovak text |

## License

[MIT](LICENSE)
