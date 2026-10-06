---
name: check-site
description: Run the Audiolux site locally and verify it - asset checks, responsive screenshots, overflow/JS-error checks and the contact-form test. Use after changes, before committing, or to preview the site.
---

# Check the site

Optional arguments are passed on to `tools/check-site.mjs`, e.g. `--widths 320,1280` or `--no-shots`:
`$ARGUMENTS`

1. **Static checks** (no server needed):

   ```sh
   node tools/check-assets.mjs
   ```

   Errors (missing or wrongly-cased files, broken `#id` links, missing `alt`) must be fixed. Warnings
   about large images are known (see `docs/backlog.md`), unless they're about a file you just added.

2. **Server.** Check whether something already answers on port 8000
   (`curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8000/`). If not, start PHP from the repo
   root **in the background** and remember that you started it:

   ```sh
   php8 -S 127.0.0.1:8000   # or `php -S 127.0.0.1:8000` if php8 doesn't exist
   ```

3. **Browser checks:**

   ```sh
   node tools/check-site.mjs --base http://127.0.0.1:8000 $ARGUMENTS
   ```

   This reports the home page's first-load size (should stay well under 1 MB), and for every section
   at 320/375/768/1280 px it reports horizontal overflow, JS errors and failed requests. It saves
   full-page screenshots as `.check/<section>-<width>.png`.

4. **Look at the screenshots** with the Read tool, at least for the sections and widths the change
   affects, and always at 375 px (phone) and 1280 px (desktop). Look for clipped or overlapping text,
   misaligned cards, empty areas and broken images. Passing checks don't prove it looks right.

5. **Contact form**, if `api.php`, `get-token.php`, the form markup or the form part of `script.js`
   changed:

   ```sh
   node tools/test-form.mjs --php php8   # or --php php
   ```

   It starts its own server and captures mail, so nothing is really sent.

6. **Clean up:** stop the PHP server if you started it. Leave `.check/` (it's gitignored).

7. **Report:** each command with pass or fail, the problems found (with the screenshot that shows
   them), and what you looked at. If something failed, don't call it done; fix it or say exactly
   what's still broken.
