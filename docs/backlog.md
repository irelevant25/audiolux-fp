# Backlog

Open findings from the code review of October 2026, most important first. Fixed issues are not
listed; see the git history. Remove an item when it's done, and add new findings here.

## High

1. **Heavy equipment photos.** The 38 photos in Technika weigh 9.4 MB together; 10 of them are over
   300 KB (largest: a 1.3 MB PNG). Lazy loading keeps them off the first visit, but anyone scrolling
   through Technika downloads all of it. Converting to WebP at 800 px cuts them by about 97% with no
   visible difference (measured: 1516 KB → 36 KB, 1276 KB → 52 KB). Command in
   [content-guide.md](content-guide.md#preparing-images); update the `src` paths in `index.html` and
   run `node tools/check-assets.mjs`.
2. **Privacy notice (GDPR).** The form collects name, e-mail and phone, and the e-mail also contains
   the visitor's IP. EU law requires informing visitors how this data is used (Art. 13 GDPR). Add a
   short "Ochrana osobných údajov" text and link it next to the submit button.
3. **E-mail deliverability.** `mail()` sends as `support@audiolux.sk`. Check the domain's SPF/DKIM
   records on the hosting. If messages land in spam, set the envelope sender (`-f` as the 5th `mail()`
   argument, if the hosting allows it) or send through an authenticated mailbox with PHPMailer.

## Medium

4. **Spam protection** relies on a honeypot and a per-session 10 s limit; a script can fetch a token
   and post in a loop. If spam appears, add IP-based rate limiting or a CAPTCHA (e.g. Cloudflare
   Turnstile).
5. **Colour contrast.** White text on the orange buttons (`#ff4500` → `#ff6b35`) reaches at most
   3.4:1, and the copyright text (`#666` on black) about 3.7:1; WCAG AA needs 4.5:1 for normal-size
   text. A darker orange for button backgrounds (e.g. `#c93800`, 5.2:1) and `#999` for the copyright
   (7.4:1) would pass.
6. **Line length on desktop.** The "O nás" and "Kvalita na prvom mieste" paragraphs run about
   180 characters per line at 1280 px. Limit the text width (e.g. `max-width: 75ch`) or bring back the
   two-column layout from the prototype; `.magazine-grid` is no longer a grid, so its `gap` and the
   `grid-column` rules of its children do nothing.
7. **SEO and link previews.** No favicon (browsers get a 404 for `/favicon.ico`), no Open Graph
   tags (shared links on Facebook/WhatsApp have no image), no `LocalBusiness` structured data, and Domov
   has two `<h1>` (the second should be an `<h2>`).
8. **Unused photos.** `node tools/check-assets.mjs` lists five files the page no longer shows:
   `AKG C414.jpg` and `DPA 2028-B-B01.jpg` (also in the commented-out block under Doplnková technika;
   are these microphones still available?), and `FBT Mitus 152.jpg`, `Soundcraft SI Expresion 2.PNG` and
   `WhatsApp Image 2023-12-31 at 23.08.02_44c1353b.webp`, which were taken off the live site. Add them back
   or delete them.
9. **Hover effects on phones.** The `:hover` lift/zoom effects stay "stuck" after a tap on touch
   screens. Wrap them in `@media (hover: hover)`.
10. **Logo isn't a link.** Visitors expect the header logo to lead to Domov
    (`<a href="#domov">` around the `<img>`).

## Low

11. **Slovak copy:** brand names are inconsistent (*SHURE* / *Shure*, *AUDIX* / *Audix*,
    *Sennheiser EW-100-G4 - ME2* / *EW-100-G4-945S*); form label *Email* → *E-mail*; the footer says
    © 2025.
12. **File names** contain spaces, diacritics, WhatsApp-style names and mixed-case extensions
    (`.PNG`, `.jpg`, `.jpeg`). Rename to lowercase kebab-case whenever a file is touched anyway.
13. **Fonts:** "Segoe UI" exists only on Windows, so macOS and iOS show Tahoma/Geneva and Android its
    default font. Consider `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`.
14. **Design tokens:** the accent colour and backgrounds are repeated ~60 times in `styles.css`;
    CSS custom properties (`--accent: #ff4500`) would make changes safer.
15. **Dead code:** unused CSS (`.detail-link`, `.equipment-info p`); `index_prototype.html` can be
    deleted once it's not needed as a reference.
16. **Repetitive markup:** 34 hand-written equipment cards are fine at this size. If the list keeps
    growing, generate the cards from a data list.
