# Deployment

The site runs in production at **<https://audiolux.sk>** on PHP hosting. The server answers with
`Server: openresty`, an nginx-based proxy. There is no automatic deployment: files are uploaded to
the hosting by hand.

## Keep git and production in sync

**Commit first, then upload.** In October 2026 the live site had a whole round of changes that were
never committed (equipment, gallery photos, copy, footer); they had to be recovered from the live
pages. Before uploading, make sure the files come from a committed state, and push.

The PHP source can't be read from outside (the server executes it), so the live `api.php` and
`get-token.php` can't be compared with git that way. Before replacing them, compare them over
FTP/SFTP or in the hosting's file manager. In particular, check the recipient address in `api.php`.

## Uploading

Upload these files to the web root:

```
index.html  styles.css  menu.js  script.js  get-token.php  api.php  assets/
```

Do **not** upload `.git/`, `.claude/`, `.check/`, `docs/`, `tools/`, `CLAUDE.md`, `README.md`,
`LICENSE` or `index_prototype.html`.

Requirements:

- PHP 7.3+ (8.x recommended) with sessions and a working `mail()`. See
  [contact-form.md](contact-form.md) for what to check after the first deploy.
- HTTPS. The session cookie gets the `Secure` flag automatically when PHP sees HTTPS.
- The mail server of the hosting must be allowed to send as `support@audiolux.sk` (SPF/DKIM),
  otherwise form messages land in spam.

After uploading, open the live site and press Ctrl+F5 so the browser fetches the new CSS and JS.
Check every page at phone and desktop width, and send a test message through the form.

## GitHub Pages

The repository used to publish a preview through a GitHub Actions workflow. The workflow was
removed in October 2026. The last preview stays online until Pages is switched off in the GitHub
repository under **Settings → Pages**. Note that Pages can't run PHP, so the form never worked
there.

## Recommended HTTP headers

These headers are not set yet. `.htaccess` files only work if Apache runs behind the openresty
proxy, so ask the hosting, or test it: add the file and check the response headers in the browser's
DevTools. If the hosting is nginx-only, it has to set these headers itself.

For Apache, an `.htaccess` file in the web root:

```apache
<IfModule mod_headers.c>
    Header always set X-Content-Type-Options "nosniff"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set Permissions-Policy "camera=(), microphone=(), geolocation=()"
    # 'unsafe-inline' for styles is only needed by the <noscript> fallback in index.html
    Header always set Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; form-action 'self'; frame-ancestors 'self'; base-uri 'self'; object-src 'none'"
</IfModule>

<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/webp "access plus 1 month"
    ExpiresByType image/jpeg "access plus 1 month"
    ExpiresByType image/png "access plus 1 month"
</IfModule>
```

Test on the live site afterwards: the page, the gallery and the form must still work, with no errors
in the browser console. The CSP works because the page has no inline scripts, inline event handlers
or `style=""` attributes; keep it that way (see [architecture.md](architecture.md)). Once HTTPS works
for the whole domain, also add `Header always set Strict-Transport-Security "max-age=31536000"`.

CSS and JS file names are not versioned, so they are left out of the long cache rules above. If you
cache them too, change the reference on every deploy (`styles.css?v=2`) so visitors get the new
version.
