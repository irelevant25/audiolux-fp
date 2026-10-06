# Contact form

The form in the **Kontakt** section is sent by `script.js` to two small PHP endpoints. There is no
database: every valid submission becomes one plain-text e-mail.

## Flow

1. On page load `script.js` calls **`get-token.php`**, which starts a PHP session and returns its
   CSRF token (`{"csrf_token": "..."}`). The token is put into the hidden `csrf_token` field.
2. On submit, `script.js` posts the form as `multipart/form-data` (`FormData`) to **`api.php`**.
   If the answer is `403` (the session expired, e.g. after ~24 minutes of typing), it fetches a fresh
   token and retries once.
3. `api.php` validates the input and calls PHP `mail()`. It always answers JSON
   `{"success": bool, "message": string}`; `message` is Slovak and is shown to the visitor.

| Status | Meaning |
|---|---|
| 200 | Sent (or the honeypot was filled, see below) |
| 400 | Validation error: missing field, invalid e-mail, line break in a single-line field, too long |
| 403 | Missing or wrong CSRF token |
| 405 | Not a POST request |
| 429 | Second message from the same session within 10 seconds |
| 500 | `mail()` failed (logged with `error_log`) |

## Configuration

Both live at the bottom of `api.php`:

- **Recipient and sender:** `$host_email = "support@audiolux.sk"`. The message is sent *to* and
  *from* this address; `Reply-To` is the visitor's e-mail, so "Reply" in the mail client answers the
  visitor directly.
- **Subject:** `Kontaktny formular od: <visitor e-mail>` (ASCII only, so it needs no MIME encoding).

The e-mail body contains name, e-mail, phone, subject, message, visitor IP and the time
(`Europe/Bratislava`). It is sent as `text/plain; charset=UTF-8`, quoted-printable encoded, so long
lines and diacritics survive any mail server.

Never put SMTP passwords or other secrets into these files: the repository is public and the PHP
source is readable on GitHub.

## Fields and limits

| Field | Required | Limit (server) | Notes |
|---|---|---|---|
| `name` (Meno) | yes | 100 characters | no line breaks |
| `email` | yes | 254 characters | `FILTER_VALIDATE_EMAIL` |
| `phone` (Telefón) | no | 30 characters | free text, no line breaks |
| `subject` (Predmet) | yes | 200 characters | goes into the body, not the e-mail subject |
| `message` (Správa) | yes | 5000 characters | line breaks allowed |

The `maxlength` attributes in `index.html` mirror these limits; change both together.

## Security measures

1. **CSRF token** per session, compared with `hash_equals`.
2. **Session cookie** is `HttpOnly`, `SameSite=Strict`, and `Secure` when the site runs on HTTPS
   (same settings in both PHP files).
3. **Honeypot:** the hidden `website` field. Bots that fill it get a fake success and no e-mail.
4. **Rate limiting:** one message per 10 seconds per session. This only slows down naive bots;
   see [backlog.md](backlog.md) for stronger options.
5. **Header injection:** the visitor's e-mail is the only user input in a mail header (`Reply-To`)
   and is validated; line breaks are rejected in all single-line fields.
6. **Input handling:** non-string values (`name[]=x`) and invalid UTF-8 are rejected; nothing is
   HTML-escaped because the e-mail is plain text.
7. **Clean JSON:** `display_errors` is switched off in `api.php`, so PHP notices can't break the
   response (they still go to the PHP error log).

## Server requirements

- PHP **7.3 or newer** (tested with 7.4 and 8.5); `mbstring` is used when available.
- Sessions enabled (default).
- A working `mail()`: on typical Linux hosting this is the local `sendmail`/MTA. The hosting must be
  allowed to send as `support@audiolux.sk` (SPF/DKIM for the domain), otherwise the messages end
  up in spam.

## Testing

Automated, without sending real e-mail:

```sh
node tools/test-form.mjs              # uses `php` from PATH
node tools/test-form.mjs --php php8   # or a specific PHP binary
```

It starts its own PHP server, captures `mail()` locally (SMTP sink on Windows, `sendmail_path` on
Linux/macOS) and runs regression cases: every status code above, header injection, array input,
honeypot, rate limit, expired session, and that the e-mail arrives with the exact text that was typed
(no `&amp;`, phone included). Extend the `cases` list when you change validation.

Manually on the real hosting: fill in the form on the live site, submit, and check the
`support@audiolux.sk` inbox (and its spam folder).

## Troubleshooting

**"✗ Chyba pri odosielaní správy"** (generic error): the response was not JSON. Usually the page runs
somewhere without PHP (opened as a file, or on a static host) or PHP crashed. Open the browser
DevTools → Network → `api.php` to see the raw response, and check the PHP error log.

**"Neplatný bezpečnostný token"**: sessions don't work (check `session.save_path` is writable) or
cookies are blocked for the site.

**Success message, but no e-mail:** `mail()` returned true but the mail server dropped or junked the
message. Check the hosting's mail log, the spam folder, and the SPF/DKIM records of audiolux.sk.

## Possible improvements

See [backlog.md](backlog.md): SMTP sending via an authenticated mailbox (PHPMailer), a privacy
notice for the form (GDPR), IP-based rate limiting or a CAPTCHA (e.g. Cloudflare Turnstile).
