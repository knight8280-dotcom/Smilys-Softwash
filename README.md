# Smilys Softwash

Marketing website for **Smilys Softwash** — pressure washing and soft washing in
Greater Baton Rouge, Louisiana.

> *Don't Replace It, Renew It!* — 225-405-5532

## What's here

```
index.html     single-page site (hero, services, why us, process, areas, reviews, FAQ, quote)
styles.css     all styling, brand colors taken from the sign logo
script.js      mobile nav, quote form handling, scroll reveals
assets/logo.jpeg
```

No build step, no dependencies. It's plain HTML/CSS/JS.

## Running it locally

Just open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Hooking up the quote form

Both quote forms (the one in the hero and the full one at the bottom) currently
work **without a server** — submitting opens the visitor's email app with all the
details pre-filled.

To have submissions delivered to an inbox instead, create a free endpoint with a
form service (Formspree, Basin, Netlify Forms, etc.) and paste the URL into
`script.js`:

```js
const CONFIG = {
  FORM_ENDPOINT: "https://formspree.io/f/xxxxxxx",   // <- paste here
  EMAIL: "knight8280@gmail.com",
  PHONE: "+12254055532",
};
```

Nothing else needs to change — the form posts there and shows a success message
in place.

## Things worth updating

- **Phone/email** — set in `script.js` (`CONFIG`) and in the `tel:` / `sms:`
  links in `index.html`.
- **Reviews** — the three testimonials in the `#reviews` section are
  placeholders written to sound like real local jobs. Swap in actual customer
  quotes (with permission) before going live.
- **Stats** — the "500+ homes renewed" style numbers in the trust strip are
  placeholders. Adjust to real figures.
- **Before/after photos** — the site has no photo gallery yet. Real job photos
  are the single biggest conversion win for this kind of business; drop them in
  `assets/` and a gallery section can be added.
- **Domain** — `<link rel="canonical">` and the Open Graph tags in `index.html`
  point at `smilyssoftwash.com`. Update if the real domain differs.
- **Business details** — hours, service area towns, and the license/insurance
  claims all live in `index.html` and should be confirmed before going live.

## Deploying

Any static host works. Drag the folder onto Netlify, or enable GitHub Pages on
this repo (Settings → Pages → deploy from branch, root folder).
