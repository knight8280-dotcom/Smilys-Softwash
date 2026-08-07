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
  FACEBOOK_URL: "",                     // every Facebook link on the page
  BUSINESS_EMAIL: "Smilys_softwash@yahoo.com",
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

1. Go to **web3forms.com** and enter `Smilys_softwash@yahoo.com`.
2. Open that inbox and click the confirmation link it sends.
3. Copy the access key it shows and paste it into `WEB3FORMS_KEY`.

That inbox is already set as `BUSINESS_EMAIL`, so the mail-app fallback points
there too. Yahoo filters new senders aggressively — after the first test
submission, check Spam and mark it "not spam" so later requests land in the
inbox.

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

The link type must be **Collect a payment** with the buyer-entered amount
option switched on. Job prices vary, so a fixed-price link would mean creating
a new link for every customer. The option is labelled differently depending on
where you make it:

**On a phone (Square Point of Sale app):**

1. `☰ More` → `Payment links`. Not there? `☰ More` → `Add-ons` →
   `Payment links` → `Add for free`.
2. Tap `+`, choose **Collect a payment**.
3. Name it `Smilys Softwash — Invoice Payment` (this is what the customer sees
   at checkout, so avoid anything cryptic).
4. Toggle **Allow buyer to enter amount** ON — it sits at the bottom of the
   form and is easy to scroll past.
5. `Save` → open the link → `Share link` → `Copy link`.

**On a computer (Square Dashboard):**

1. `Payments & orders` → `Payment links` → `Create link`.
2. **Collect a payment** → `Continue`.
3. Tick **Allow buyer to set the price**.
4. Title it, `Save`, then `Share` → copy the URL.

Either way you end up with a `square.link/u/XXXXXXXX` URL. Paste it into
`SQUARE_PAY_LINK`.

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

## Deploying

Any static host works. Drag the folder onto Netlify, or enable GitHub Pages on
this repo (Settings → Pages → deploy from branch, root folder).
