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

  // Supabase. This key is *meant* to be public — it identifies the project,
  // it does not grant access. What it can do is decided entirely by row
  // level security on the server: submit a quote request, and read photos
  // marked published. It cannot read a single lead back. Everything else
  // requires an admin login.
  SUPABASE_URL: "https://lzqcnqqytconglqqlliy.supabase.co",
  SUPABASE_KEY: "sb_publishable_NBoxThVxs0Nm94JTF45hig_0o59Pmlq",
};

const SUPABASE_READY = Boolean(CONFIG.SUPABASE_URL && CONFIG.SUPABASE_KEY);
const PHOTO_BASE = `${CONFIG.SUPABASE_URL}/storage/v1/object/public/job-photos/`;

/* ---------- Mobile nav ---------- */
const navToggle = document.getElementById("navToggle");
const siteNav = document.getElementById("siteNav");
const navScrim = document.getElementById("navScrim");

function setNav(open) {
  siteNav.classList.toggle("open", open);
  document.body.classList.toggle("nav-open", open);
  navToggle.setAttribute("aria-expanded", String(open));
  navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  if (navScrim) navScrim.hidden = !open;
}

navToggle?.addEventListener("click", () => {
  setNav(!siteNav.classList.contains("open"));
});

navScrim?.addEventListener("click", () => setNav(false));

// Close after tapping a link, so the anchor scroll is visible
siteNav?.addEventListener("click", (e) => {
  if (e.target.closest("a")) setNav(false);
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && siteNav?.classList.contains("open")) {
    setNav(false);
    navToggle.focus();
  }
});

/* ---------- Header: compact once past the hero ---------- */
const header = document.querySelector(".site-header");
const onScroll = () => header?.classList.toggle("is-stuck", window.scrollY > 40);
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

/* ---------- Scroll spy ----------
   Highlights whichever section is currently under the header. Uses the
   section nearest the top of the viewport rather than IntersectionObserver
   ratios, which get unreliable with sections of wildly different heights. */
const navLinks = [...document.querySelectorAll("[data-nav-link]")];
const sections = navLinks
  .map((a) => document.querySelector(a.getAttribute("href")))
  .filter(Boolean);

if (sections.length) {
  let ticking = false;
  const spy = () => {
    ticking = false;
    const line = window.scrollY + (header?.offsetHeight || 80) + 40;
    let current = -1;
    sections.forEach((sec, i) => {
      if (sec.offsetTop <= line) current = i;
    });
    // Past the bottom of the page, pin to the last section
    if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 4) {
      current = sections.length - 1;
    }
    navLinks.forEach((a, i) => a.classList.toggle("is-active", i === current));
  };
  window.addEventListener("scroll", () => {
    if (!ticking) { ticking = true; requestAnimationFrame(spy); }
  }, { passive: true });
  window.addEventListener("resize", spy);
  spy();
}

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

// Writes the lead to the database. This is the durable copy — email can be
// filtered, deleted or bounce, and then the lead is simply gone.
async function saveLead(form, q) {
  const res = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/leads`, {
    method: "POST",
    headers: {
      apikey: CONFIG.SUPABASE_KEY,
      "Content-Type": "application/json",
      // Don't ask for the row back: the public role has no read access, so
      // requesting a representation would fail the insert.
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      name: q.name,
      phone: q.phone,
      email: q.email || null,
      city: q.city || null,
      services: q.services || null,
      details: q.details || null,
      source: form.classList.contains("quick-form")
        ? "Hero quick-quote form"
        : "Full quote form",
    }),
  });
  if (!res.ok) throw new Error("Supabase insert failed: " + res.status);
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

    if (CONFIG.WEB3FORMS_KEY || SUPABASE_READY) {
      if (btn) { btn.disabled = true; btn.textContent = "Sending…"; }

      // Two independent destinations: the database is the durable record,
      // the email is the notification. Send to both and treat the request as
      // captured if either lands — losing a customer because one service was
      // having a bad morning is not an acceptable outcome.
      const jobs = [];
      if (SUPABASE_READY) jobs.push(saveLead(form, q));
      if (CONFIG.WEB3FORMS_KEY) jobs.push(submitToWeb3Forms(form, q));

      const results = await Promise.allSettled(jobs);
      const captured = results.some((r) => r.status === "fulfilled");

      results
        .filter((r) => r.status === "rejected")
        .forEach((r) => console.warn("Quote request delivery failed:", r.reason));

      if (captured) {
        form.reset();
        setStatus(form, "Got it! We'll be in touch shortly — usually the same day.", "ok");
      } else {
        setStatus(
          form,
          `Something went wrong sending that. Please call or text us at ${formatPhone(CONFIG.PHONE)}.`,
          "err"
        );
      }

      if (btn) { btn.disabled = false; btn.textContent = label; }
      return;
    }

    // Nothing configured yet — hand off to the visitor's email app.
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

/* ---------- Drag-to-reveal before/after ----------
   Pointer events cover mouse, touch and pen in one path. The position lives
   in a CSS custom property so the clip and the handle stay in lockstep
   without touching layout. */
function initReveal(wrap) {
  if (wrap.dataset.revealReady) return;   // photos added later must not double-bind
  wrap.dataset.revealReady = "1";
  let dragging = false;

  const set = (pct) => {
    const v = Math.max(0, Math.min(100, pct));
    wrap.style.setProperty("--pos", v + "%");
    wrap.setAttribute("aria-valuenow", Math.round(v));
    wrap.setAttribute("aria-valuetext", Math.round(v) + "% revealed");
  };

  const fromEvent = (e) => {
    const r = wrap.getBoundingClientRect();
    set(((e.clientX - r.left) / r.width) * 100);
  };

  wrap.addEventListener("pointerdown", (e) => {
    dragging = true;
    wrap.setPointerCapture(e.pointerId);
    fromEvent(e);
  });
  wrap.addEventListener("pointermove", (e) => { if (dragging) fromEvent(e); });
  const stop = (e) => {
    if (!dragging) return;
    dragging = false;
    try { wrap.releasePointerCapture(e.pointerId); } catch {}
  };
  wrap.addEventListener("pointerup", stop);
  wrap.addEventListener("pointercancel", stop);

  wrap.addEventListener("keydown", (e) => {
    const now = parseFloat(wrap.getAttribute("aria-valuenow")) || 50;
    const step = e.shiftKey ? 10 : 4;
    if (e.key === "ArrowLeft")       { set(now - step); e.preventDefault(); }
    else if (e.key === "ArrowRight") { set(now + step); e.preventDefault(); }
    else if (e.key === "Home")       { set(0);  e.preventDefault(); }
    else if (e.key === "End")        { set(100); e.preventDefault(); }
  });

  set(50);

  // Nudge it once on first view so it reads as draggable rather than as a
  // static photo with a line down the middle.
  if ("IntersectionObserver" in window &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const tick = (t) => {
          const p = Math.min(1, (t - start) / 1400);
          // out → back, so it lands where it started
          const eased = Math.sin(p * Math.PI);
          set(50 + eased * 22);
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.45 });
    io.observe(wrap);
  }
}

document.querySelectorAll("[data-reveal]").forEach(initReveal);

/* ---------- Gallery photos from Supabase ----------
   The photos already in the markup stay put; anything published in the
   database is appended to them. That way the gallery degrades to exactly
   what it is today if the request fails, JS is off, or the table is empty —
   the section is never empty and never flashes. */
async function loadPhotos() {
  const gallery = document.querySelector(".gallery");
  if (!gallery || !SUPABASE_READY) return;

  let rows;
  try {
    const res = await fetch(
      `${CONFIG.SUPABASE_URL}/rest/v1/photos` +
      `?select=title,caption,alt_text,after_path,before_path` +
      `&published=is.true&order=sort_order.asc,created_at.desc`,
      { headers: { apikey: CONFIG.SUPABASE_KEY } }
    );
    if (!res.ok) throw new Error("HTTP " + res.status);
    rows = await res.json();
  } catch (err) {
    console.warn("Could not load gallery photos:", err);
    return;
  }
  if (!Array.isArray(rows) || !rows.length) return;

  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  rows.forEach((row) => {
    const fig = document.createElement("figure");
    fig.className = "shot";
    const alt = esc(row.alt_text || row.title);
    const after = PHOTO_BASE + encodeURIComponent(row.after_path);

    if (row.before_path) {
      // A pair renders as its own drag-to-reveal comparison.
      const before = PHOTO_BASE + encodeURIComponent(row.before_path);
      fig.innerHTML = `
        <div class="reveal-wrap" data-reveal tabindex="0" role="slider"
             aria-label="Drag to compare ${alt}"
             aria-valuemin="0" aria-valuemax="100" aria-valuenow="50">
          <div class="reveal-after"><img src="${after}" alt="${alt} — after cleaning" loading="lazy" decoding="async"></div>
          <div class="reveal-before"><img src="${before}" alt="${alt} — before cleaning" loading="lazy" decoding="async"></div>
          <span class="reveal-tag reveal-tag-before">Before</span>
          <span class="reveal-tag reveal-tag-after">After</span>
          <div class="reveal-handle"><span class="reveal-grip">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 7 5 12l4.5 5 1.4-1.4L7.8 12l3.1-3.6L9.5 7zm5 0-1.4 1.4 3.1 3.6-3.1 3.6L14.5 17 19 12l-4.5-5z"/></svg>
          </span></div>
        </div>
        <figcaption><b>${esc(row.title)}</b>${esc(row.caption || "")}</figcaption>`;
    } else {
      fig.innerHTML = `
        <button class="shot-btn" type="button" data-zoom aria-label="Enlarge: ${alt}">
          <img src="${after}" alt="${alt}" loading="lazy" decoding="async">
        </button>
        <figcaption><b>${esc(row.title)}</b>${esc(row.caption || "")}</figcaption>`;
    }
    gallery.appendChild(fig);
  });

  // Newly inserted nodes need the same behaviour as the markup ones.
  gallery.querySelectorAll("[data-reveal]").forEach(initReveal);
  gallery.querySelectorAll("[data-zoom]").forEach(initZoom);
}

/* ---------- Stat counters ---------- */
const counters = document.querySelectorAll("[data-count]");
if (counters.length && "IntersectionObserver" in window &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      io.unobserve(entry.target);
      const el = entry.target;
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || "";
      const start = performance.now();
      const tick = (t) => {
        const p = Math.min(1, (t - start) / 1100);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.5 });
  counters.forEach((el) => io.observe(el));
}

/* ---------- Photo zoom ----------
   Job photos are detail shots — a rust stain or a shingle line is hard to
   judge at gallery size, so tapping one opens it full screen. */
const zoomOverlay = document.createElement("div");
zoomOverlay.className = "zoom";
zoomOverlay.innerHTML =
  '<button class="zoom-close" type="button" aria-label="Close photo">&times;</button><img alt="">';
document.body.appendChild(zoomOverlay);

const zoomImg = zoomOverlay.querySelector("img");
let zoomLastFocused = null;

function closeZoom() {
  zoomOverlay.classList.remove("open");
  document.body.style.overflow = "";
  zoomImg.removeAttribute("src");
  zoomLastFocused?.focus();
}

function initZoom(btn) {
  if (btn.dataset.zoomReady) return;
  btn.dataset.zoomReady = "1";
  btn.addEventListener("click", () => {
    const img = btn.querySelector("img");
    zoomLastFocused = btn;
    zoomImg.src = img.src;
    zoomImg.alt = img.alt;
    zoomOverlay.classList.add("open");
    document.body.style.overflow = "hidden";
    zoomOverlay.querySelector(".zoom-close").focus();
  });
}

document.querySelectorAll("[data-zoom]").forEach(initZoom);
zoomOverlay.addEventListener("click", closeZoom);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && zoomOverlay.classList.contains("open")) closeZoom();
});

// Kick off the gallery fetch now that initReveal/initZoom exist.
loadPhotos();

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
