<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/img/logo/techeyes-logo-horizontal-white.svg">
    <img src="assets/img/logo/techeyes-logo-horizontal.svg" alt="Techeyes — IT &amp; Telecommunications" width="360">
  </picture>
</p>

<h3 align="center">Techeyes · عيون التقنية (Oyoon Altaqnya)</h3>
<p align="center">Website for Techeyes IT &amp; Telecommunications, Tripoli, Libya</p>

![Techeyes website — English desktop and Arabic mobile](docs/preview.jpg)

A premium, bilingual (English / العربية) single-page site built around the company's own
eye-ring logo, with a prominent **Cybersecurity Assessment** call to action that sends visitors
to **https://cta.techeyes.ly**.

- **Brand:** the original Techeyes logo, vectorized to crisp SVG (`assets/img/logo/`). In the hero,
  the ring of eyes turns slowly and every pupil follows the visitor's pointer.
- **Cybersecurity Assessment:** in the header, the hero, a dedicated assessment section, the
  cybersecurity service card, the closing banner and the footer. `techeyes.ly/assessment` is also a
  short link that redirects to the portal.
- **Bilingual with full RTL:** language switch in the header. The choice is remembered, and Arabic
  browsers open in Arabic. `?lang=ar` / `?lang=en` links work too.
- **Fast and private:** plain HTML/CSS/JS with no build step and no frameworks. Fonts are
  self-hosted, and the site makes no third-party requests.
- **Accessible:** semantic landmarks, keyboard-friendly menu, visible focus, `prefers-reduced-motion`
  support, and no axe-core (WCAG 2.1 AA) violations in either language.
- **Hardened:** a strict Content-Security-Policy and security headers for Cloudflare Pages
  (`_headers`) and Apache (`.htaccess`).

## Project structure

```
index.html                 The page. English copy lives here.
404.html                   Not-found page
assessment/index.html      /assessment → https://cta.techeyes.ly (fallback for static hosts)
assets/
  css/styles.css           Design system + all styles (tokens at the top)
  js/boot.js               Sets language/direction before first paint
  js/i18n.js               Arabic translations (keys match data-i18n in index.html)
  js/main.js               Menu, language switch, reveal animations, watching eyes, form
  fonts/                   Montserrat, Inter, IBM Plex Sans Arabic (SIL OFL, see licenses/)
  img/logo/                Logo SVGs: emblem, stacked and horizontal lockups, light/dark
  img/                     Favicons, app icons, social share image (og-image.png)
_headers, _redirects       Cloudflare Pages / Netlify config
.htaccess                  Same config for Apache / LiteSpeed (cPanel) hosting
tools/check-i18n.mjs       Checks that every English string has an Arabic translation
```

## Run locally

Any static file server works:

```bash
python3 -m http.server 8080     # or: npx serve .
# open http://localhost:8080  (Arabic: http://localhost:8080/?lang=ar)
```

## Editing content

- **English text:** edit it directly in `index.html`.
- **Arabic text:** every translatable element has a `data-i18n="key"`. Put the Arabic for that key
  in `assets/js/i18n.js`. After adding or renaming keys, run:

  ```bash
  node tools/check-i18n.mjs
  ```

- **Assessment link:** `https://cta.techeyes.ly` appears in `index.html`, `404.html`,
  `assessment/index.html`, `_redirects` and `.htaccess`.
- **Contact details:** phone, email and address are in `index.html` (including the structured data
  in `<head>`). The contact form's recipient is the `EMAIL` constant in `assets/js/main.js`.
- **Contact form:** it opens the visitor's email app with the message pre-filled (`mailto:`), so no
  backend is needed. To collect submissions on a server instead, point the form at a form service
  or a Cloudflare Worker, and add that origin to the CSP `connect-src` / `form-action`.
- **Brand colors:** the tokens at the top of `styles.css`. `--brand` (`#1E4CCF`) is sampled from the
  original logo.

## Deploying

The site is fully static: deploy the repository root as-is. No build command is needed.

| Host | How | `/assessment` redirect & security headers |
| --- | --- | --- |
| **Cloudflare Pages** (recommended, since the domain already uses Cloudflare) | Connect this repo, leave the build command empty, output directory `/`. Add `techeyes.ly` as a custom domain. | `_redirects` and `_headers` apply automatically |
| **Existing cPanel / Apache hosting** | Upload the files to the web root, replacing the old WordPress site. | `.htaccess` |
| **GitHub Pages** | Settings → Pages → deploy from this branch, root folder. | Meta-refresh fallback in `assessment/index.html`. Custom headers are not supported. |

If you add analytics, a chat widget or anything else that loads from another domain, add that
origin to the `Content-Security-Policy` in `_headers` / `.htaccess`. Cloudflare Web Analytics is
already allowed. Keep Cloudflare **Rocket Loader** off: it rewrites scripts in a way the CSP blocks.
