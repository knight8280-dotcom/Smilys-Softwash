/* =========================================================
   Smilys Softwash — site behavior
   ========================================================= */

/* ---------------------------------------------------------
   CONFIG — the only part of this file that needs editing.

   Two things to fill in. Both are safe to have in this file:
   neither one can move money or read mail on its own.

   1. WEB3FORMS_KEY — emails every quote request straight to
      BUSINESS_EMAIL, within seconds of someone hitting submit.
      Get the key free at web3forms.com: type the business email,
      click the confirmation link it sends, copy the access key.

   2. STRIPE_PAY_LINK — the "Pay Now" button on the site.
      In the Stripe Dashboard (web, not the phone app): Payment Links →
      New → pick "Customers choose what to pay" → Create link, then copy
      the buy.stripe.com URL it gives you.

   Until each one is filled in, the site degrades gracefully
   instead of breaking: the forms fall back to opening the
   visitor's email app, and the Pay Now button becomes a call
   button. Nothing looks broken to a customer either way.
--------------------------------------------------------- */
const CONFIG = {
  WEB3FORMS_KEY: "e8fd2ca4-e82a-416d-938c-f211d2668793",
  STRIPE_PAY_LINK: "",                  // e.g. "https://buy.stripe.com/XXXXXXXX"
  // Share-link form of the page (numeric page id 61551017668250). If a
  // username is ever set on the page, swap in facebook.com/<username> — it's
  // shorter and reads better in the footer.
  FACEBOOK_URL: "https://www.facebook.com/share/1YXxZPPUpR/",
  // Business address of record, shown on the page and used by the mail-app
  // fallback. Note the Web3Forms key above still delivers to the old Yahoo
  // address — the key IS the destination, so moving quote requests here needs
  // a new key registered against this address at web3forms.com.
  BUSINESS_EMAIL: "smilyssoftwash@gmail.com",
  PHONE: "+12254055532",
};

/* ---------- Mobile nav ---------- */
const navToggle = document.getElementById("navToggle");
const siteNav = document.getElementById("siteNav");

navToggle?.addEventListener("click", () => {
  const open = siteNav.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", String(open));
  navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
});

// Close the menu after tapping a link
siteNav?.addEventListener("click", (e) => {
  if (e.target.closest("a") && siteNav.classList.contains("open")) {
    siteNav.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Open menu");
  }
});

/* ---------- Footer year ---------- */
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ---------- Quote forms ---------- */
function readForm(form) {
  const data = new FormData(form);
  const services = data.getAll("services");
  const single = data.get("service");

  return {
    name: (data.get("name") || "").trim(),
    phone: (data.get("phone") || "").trim(),
    email: (data.get("email") || "").trim(),
    city: (data.get("city") || "").trim(),
    services: services.length ? services.join(", ") : (single || "").trim(),
    details: (data.get("details") || "").trim(),
  };
}

function buildMessage(q) {
  const lines = [
    `Name: ${q.name}`,
    `Phone: ${q.phone}`,
    q.email ? `Email: ${q.email}` : null,
    q.city ? `City: ${q.city}` : null,
    q.services ? `Service needed: ${q.services}` : null,
    q.details ? `\nDetails:\n${q.details}` : null,
  ].filter(Boolean);

  return lines.join("\n");
}

// Subject line the owner sees in his inbox — name and job up front so it's
// readable from a phone lock screen without opening the email.
function buildSubject(q) {
  return `New quote request — ${q.name}${q.services ? " — " + q.services : ""}`;
}

function setStatus(form, text, kind) {
  const el = form.querySelector(".form-status");
  if (!el) return;
  el.textContent = text;
  el.className = "form-status" + (kind ? " " + kind : "");
}

async function submitToWeb3Forms(form, q) {
  const res = await fetch("https://api.web3forms.com/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      access_key: CONFIG.WEB3FORMS_KEY,
      subject: buildSubject(q),
      from_name: "Smilys Softwash website",
      // Lets the owner hit reply and land in the customer's inbox.
      replyto: q.email || undefined,

      // Named fields so the email body is laid out, not a blob.
      name: q.name,
      phone: q.phone,
      email: q.email || "(not given)",
      city: q.city || "(not given)",
      service_needed: q.services || "(not specified)",
      details: q.details || "(none)",
      submitted_from: form.classList.contains("quick-form")
        ? "Hero quick-quote form"
        : "Full quote form",

      // Spam trap — Web3Forms drops the submission when this is filled.
      botcheck: form.querySelector('[name="botcheck"]')?.checked || false,
    }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.success === false) {
    throw new Error(body.message || "Request failed: " + res.status);
  }
  return body;
}

function openMailFallback(q) {
  const href =
    `mailto:${CONFIG.BUSINESS_EMAIL}` +
    `?subject=${encodeURIComponent(buildSubject(q))}` +
    `&body=${encodeURIComponent(buildMessage(q))}`;
  window.location.href = href;
}

document.querySelectorAll("[data-quote-form]").forEach((form) => {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const q = readForm(form);
    if (!q.name || !q.phone) {
      setStatus(form, "Please add your name and phone number.", "err");
      return;
    }

    const btn = form.querySelector("button[type=submit]");
    const label = btn?.textContent;

    if (CONFIG.WEB3FORMS_KEY) {
      if (btn) { btn.disabled = true; btn.textContent = "Sending…"; }
      try {
        await submitToWeb3Forms(form, q);
        form.reset();
        setStatus(form, "Got it! We'll be in touch shortly — usually the same day.", "ok");
      } catch (err) {
        setStatus(
          form,
          `Something went wrong sending that. Please call or text us at ${formatPhone(CONFIG.PHONE)}.`,
          "err"
        );
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = label; }
      }
      return;
    }

    // No form key configured yet — hand off to the visitor's email app.
    openMailFallback(q);
    setStatus(
      form,
      `Your email app should open with the details filled in. Prefer to talk? Call ${formatPhone(CONFIG.PHONE)}.`,
      "ok"
    );
  });
});

function formatPhone(e164) {
  const d = e164.replace(/\D/g, "").slice(-10);
  return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
}

/* ---------- Facebook links ----------
   Every Facebook link on the page is driven by CONFIG.FACEBOOK_URL. Until one
   is set they're removed rather than left pointing nowhere. */
const fbLinks = document.querySelectorAll("[data-facebook-link]");
fbLinks.forEach((el) => {
  if (CONFIG.FACEBOOK_URL) {
    el.href = CONFIG.FACEBOOK_URL;
    return;
  }
  // Drop the whole wrapper when there is one, so no empty row is left behind.
  (el.closest("[data-facebook-wrap]") || el).remove();
});

/* ---------- Pay Now button ----------
   Points at the Stripe checkout link once one is configured. Until then it
   becomes a call button, so a customer never taps a dead link. */
document.querySelectorAll("[data-pay-link]").forEach((el) => {
  if (CONFIG.STRIPE_PAY_LINK) {
    el.href = CONFIG.STRIPE_PAY_LINK;
    el.target = "_blank";
    el.rel = "noopener";
    return;
  }

  el.href = "tel:" + CONFIG.PHONE;
  el.textContent = `Call ${formatPhone(CONFIG.PHONE)} to Pay`;

  const card = el.closest(".pay-card");
  if (!card) return;
  card.classList.add("pay-pending");

  const note = card.querySelector(".pay-card-head p");
  if (note) note.textContent = "Card payments are being set up. Give us a call and we'll take it over the phone or send an invoice.";
});

/* ---------- Photo zoom ----------
   Job photos are detail shots — a rust stain or a shingle line is hard to
   judge at gallery size, so tapping one opens it full screen. */
const zoomTriggers = document.querySelectorAll("[data-zoom]");
if (zoomTriggers.length) {
  const overlay = document.createElement("div");
  overlay.className = "zoom";
  overlay.innerHTML =
    '<button class="zoom-close" type="button" aria-label="Close photo">&times;</button><img alt="">';
  document.body.appendChild(overlay);

  const overlayImg = overlay.querySelector("img");
  let lastFocused = null;

  const open = (img) => {
    overlayImg.src = img.src;
    overlayImg.alt = img.alt;
    overlay.classList.add("open");
    document.body.style.overflow = "hidden";
    overlay.querySelector(".zoom-close").focus();
  };

  const close = () => {
    overlay.classList.remove("open");
    document.body.style.overflow = "";
    overlayImg.removeAttribute("src");
    lastFocused?.focus();
  };

  zoomTriggers.forEach((btn) => {
    btn.addEventListener("click", () => {
      lastFocused = btn;
      open(btn.querySelector("img"));
    });
  });

  overlay.addEventListener("click", close);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.classList.contains("open")) close();
  });
}

/* ---------- Reveal on scroll ---------- */
const reveals = document.querySelectorAll(".card, .steps li, .quote, .why-list li");
if ("IntersectionObserver" in window &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  reveals.forEach((el) => el.classList.add("reveal"));

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      el.style.transitionDelay = `${Math.min(i * 60, 240)}ms`;
      el.classList.add("in");
      io.unobserve(el);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px" });

  reveals.forEach((el) => io.observe(el));
}
