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
  STRIPE_PAY_LINK: "",                  // the Pay Now button
  FACEBOOK_URL: "",                     // every Facebook link on the page
  BUSINESS_EMAIL: "Smilys_softwash@yahoo.com",
  PHONE: "+12254055532",
};
```

Both are safe to keep in this file. Neither one can move money or read mail on
its own — the form key only lets a submission be *sent* to the verified address,
and the Stripe link is the same public URL you'd text a customer.

Until each is filled in, the site degrades gracefully rather than breaking:
the forms fall back to opening the visitor's email app, and Pay Now becomes a
call button. A customer never hits a dead end either way.

### 1. Quote requests → email (Web3Forms) — done

`WEB3FORMS_KEY` is set, delivering to `Smilys_softwash@yahoo.com`. Both forms
post to Web3Forms from the browser and the email arrives within seconds.

Note that Web3Forms rejects **server-side** posts on the free plan — the API
only accepts submissions from a browser. That's fine for how the site uses it,
but it does mean the integration can't be smoke-tested with `curl`; a real
submission from a browser is the only way to verify it.

Yahoo filters unfamiliar senders hard. After the first test submission, check
the Spam folder and mark it "not spam" so later requests land in the inbox.

**Changing the destination address** means re-registering the new address at
web3forms.com and swapping in the key it gives you — the key *is* the
destination. Update `BUSINESS_EMAIL` to match, since that's the fallback used
if the key is ever removed.

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

### 2. Pay Now button (Stripe)

Job prices vary, so the link has to let the customer type in the amount from
their invoice. A fixed-price link would mean creating a new one per customer.

**Use the web dashboard, not the phone app.** The Stripe iOS app can't create
customer-chooses-the-amount links at all — the option isn't there. This is the
step to get wrong, so start at dashboard.stripe.com in a browser.

1. Go to **dashboard.stripe.com** → `Payment Links` → **New**.
2. Select **Customers choose what to pay**.
3. Title it `Smilys Softwash — Invoice Payment`. This is what the customer
   reads at checkout and roughly what shows on their statement, so keep it
   recognisable.
4. Optionally set a minimum. The maximum defaults to $10,000 — fine for
   residential work, but it needs raising via Stripe support if a commercial
   job ever exceeds it.
5. **Create link**, then copy the `buy.stripe.com/...` URL into
   `STRIPE_PAY_LINK`.

The button opens Stripe's hosted checkout in a new tab. Card details are entered
on Stripe's page, never on this site — that keeps the business out of PCI scope
entirely, which is exactly why it's built this way. **Don't** replace this with a
card form on the site.

Stripe emails the customer a receipt automatically. Note payouts land in the
bank account attached to Stripe, which is separate from any Square invoicing
still in use — worth deciding which one is the system of record before both are
running.

## Things worth updating

- **Phone/email** — set in `script.js` (`CONFIG`) and in the `tel:` / `sms:`
  links in `index.html`.
- **Payment copy** — the Pay Online section promises Apple Pay and Google Pay.
  Stripe supports both, but they only appear at checkout once the domain is
  registered under Payment method domains in the Stripe dashboard.
- **Reviews** — the three testimonials in the `#reviews` section are
  placeholders written to sound like real local jobs. Swap in actual customer
  quotes (with permission) before going live.
- **Stats** — the "500+ homes renewed" style numbers in the trust strip are
  placeholders. Adjust to real figures.
- **More before/after photos** — the `#work` section holds one driveway job so
  far. Real job photos are the biggest conversion win for this business, so
  keep adding them.
- **Domain** — `<link rel="canonical">` and the Open Graph tags in `index.html`
  point at `smilyssoftwash.com`. Update if the real domain differs.
- **Business details** — hours, service area towns, and the license/insurance
  claims all live in `index.html` and should be confirmed before going live.

### 3. Facebook link — done

`FACEBOOK_URL` is set to `https://www.facebook.com/share/1YXxZPPUpR/`, the
share-link form of the page (numeric page id `61551017668250`). It drives all
four Facebook links at once — the footer follow button, the footer nav item,
the contact list in the quote section, and the "more before-and-afters" line
under the gallery. It's also in the `sameAs` field of the JSON-LD block in
`index.html`, which is how Google ties the site and the page together as one
business.

If a username is ever claimed on the page (Settings → Page setup → Username),
swap both spots to `https://www.facebook.com/<username>`. It's shorter, reads
better in the footer, and is worth doing for search.

## Adding more before/after photos

Photos straight off a phone are 1–4 MB each, which is slow on mobile data.
Shrink them before committing (Pillow is the quickest way):

```python
from PIL import Image, ImageOps
im = ImageOps.exif_transpose(Image.open("IMG_1234.jpg")).convert("RGB")
im.thumbnail((1200, 1200))
im.save("assets/roof-before.jpg", "JPEG", quality=80, optimize=True, progressive=True)
```

That takes a ~1 MB phone photo down to roughly 200 KB with no visible loss at
the size it's displayed. `exif_transpose` matters — without it, portrait phone
photos show up rotated in some browsers.

There are two layouts in the `#work` section, depending on what you have:

- **Two separate files** (a before shot and an after shot) → copy the
  `<figure class="ba">` block and swap the two image paths, alt text and
  caption. It renders them side by side with Before/After badges.
- **One image with before and after already in it** (the collages from
  Facebook) → copy a `<figure class="shot">` block in the `.gallery` grid and
  swap the path, alt text, title and caption. The grid uses CSS columns, so
  portrait and square photos each keep their own shape instead of being
  cropped to match.

Gallery photos open full screen when tapped — that's `[data-zoom]` in
`index.html` wired up at the bottom of `script.js`. Detail shots like the rust
stain are unreadable at thumbnail size otherwise.

**Shooting them well** — the pair sells the job, so:
- Same spot, same framing, same time of day. Matching light is what makes the
  difference read as *cleaning* rather than *weather*.
- Take the "before" from a marked position so the "after" lines up.
- Get low and close to the surface rather than shooting the whole street.
- Write alt text describing the surface and its condition, not "before photo" —
  it's what a screen reader announces and what Google indexes.

## Getting found on Google

`robots.txt` and `sitemap.xml` are in the repo root and served at
`smilyssoftwash.com/robots.txt` and `/sitemap.xml`. **Update `<lastmod>` in the
sitemap when the page changes meaningfully** — new services, new photos, a
rewrite. It's a hint to Google that there's something new to re-crawl.

The page already carries the on-page basics: a descriptive `<title>`, a meta
description, a canonical URL, Open Graph tags for link previews, and a
`HomeAndConstructionBusiness` JSON-LD block with the phone number, hours and
the list of towns served.

Two things that actually move the needle, in order:

1. **Google Business Profile** (google.com/business) — free. This is what puts
   a local service business in the map pack for "pressure washing near me",
   which is where the calls come from. It matters more than the website's
   organic ranking, and it's the one place customer reviews accumulate.
2. **Google Search Console** (search.google.com/search-console) — verify the
   domain, submit the sitemap, and use URL Inspection → Request Indexing to
   push the page into the queue instead of waiting to be discovered.

Don't add review or rating markup to the JSON-LD until there are real reviews
to point at. Fake review schema is a manual-penalty risk, and the three
testimonials currently on the page are placeholders.

## Deploying

Any static host works. Drag the folder onto Netlify, or enable GitHub Pages on
this repo (Settings → Pages → deploy from branch, root folder).
