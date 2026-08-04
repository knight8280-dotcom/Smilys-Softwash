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

## Setup: two values to fill in

Everything configurable lives in one place — the `CONFIG` block at the top of
`script.js`:

```js
const CONFIG = {
  WEB3FORMS_KEY: "",                    // quote requests → email
  SQUARE_PAY_LINK: "",                  // the Pay Now button
  BUSINESS_EMAIL: "knight8280@gmail.com",
  PHONE: "+12254055532",
};
```

Both are safe to keep in this file. Neither one can move money or read mail on
its own — the form key only lets a submission be *sent* to the verified address,
and the Square link is the same public URL you'd text a customer.

Until each is filled in, the site degrades gracefully rather than breaking:
the forms fall back to opening the visitor's email app, and Pay Now becomes a
call button. A customer never hits a dead end either way.

### 1. Quote requests → email (Web3Forms)

1. Go to **web3forms.com** and enter the business email address.
2. Click the confirmation link in the email it sends.
3. Copy the access key and paste it into `WEB3FORMS_KEY`.

Every submission from either form then emails that address within seconds.
Subject lines read `New quote request — Jane Doe — Roof, Driveway`, so the job
is readable from a phone lock screen. Hitting reply goes to the customer if they
left an email address.

Both forms carry a hidden honeypot field that Web3Forms uses to drop bot
submissions. Free tier covers 250 submissions a month.

**Change the destination address** by re-registering that address at
web3forms.com and swapping in the new key — the key *is* the destination.
Update `BUSINESS_EMAIL` to match, since that's the fallback used when the key
is missing.

### 2. Pay Now button (Square)

1. In the Square Dashboard, go to **Payments → Payment Links → Create**.
2. Choose **Collect a payment**.
3. Turn on **Let customer enter the amount** — job prices vary, so a fixed
   amount would mean a new link for every customer.
4. Name it something the customer will recognize on their statement, e.g.
   "Smilys Softwash — Invoice Payment".
5. Copy the `square.link` URL and paste it into `SQUARE_PAY_LINK`.

The button opens Square's hosted checkout in a new tab. Card details are entered
on Square's page, never on this site — that keeps the business out of PCI scope
entirely, which is exactly why it's built this way. **Don't** replace this with a
card form on the site.

Square emails the customer a receipt automatically and the payment lands in the
same Square account as invoices and card-reader sales.

## Things worth updating

- **Phone/email** — set in `script.js` (`CONFIG`) and in the `tel:` / `sms:`
  links in `index.html`.
- **Payment copy** — the Pay Online section promises Apple Pay, Google Pay and
  Cash App Pay. Square supports all three, but confirm they're switched on in
  the Square account before going live.
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
