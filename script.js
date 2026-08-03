/* =========================================================
   Smilys Softwash — site behavior
   ========================================================= */

/* ---------------------------------------------------------
   CONFIG

   The quote forms work with no server. Until a form service is
   hooked up, submitting opens the visitor's email (or texting)
   app with everything already filled in.

   To send quotes straight to an inbox instead:
     1. Make a free form endpoint (Formspree, Basin, Netlify Forms…)
     2. Paste the URL into FORM_ENDPOINT below.
   Everything else keeps working as-is.
--------------------------------------------------------- */
const CONFIG = {
  FORM_ENDPOINT: "",                    // e.g. "https://formspree.io/f/xxxxxxx"
  EMAIL: "knight8280@gmail.com",        // fallback inbox for quote requests
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

function setStatus(form, text, kind) {
  const el = form.querySelector(".form-status");
  if (!el) return;
  el.textContent = text;
  el.className = "form-status" + (kind ? " " + kind : "");
}

async function submitToEndpoint(form, q) {
  const res = await fetch(CONFIG.FORM_ENDPOINT, {
    method: "POST",
    headers: { Accept: "application/json" },
    body: new FormData(form),
  });
  if (!res.ok) throw new Error("Request failed: " + res.status);
  return q;
}

function openMailFallback(q) {
  const subject = `Quote request${q.services ? " — " + q.services : ""}`;
  const href =
    `mailto:${CONFIG.EMAIL}` +
    `?subject=${encodeURIComponent(subject)}` +
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

    if (CONFIG.FORM_ENDPOINT) {
      if (btn) { btn.disabled = true; btn.textContent = "Sending…"; }
      try {
        await submitToEndpoint(form, q);
        form.reset();
        setStatus(form, "Got it! We'll be in touch shortly — usually the same day.", "ok");
      } catch (err) {
        setStatus(
          form,
          `Something went wrong sending that. Please call us at ${formatPhone(CONFIG.PHONE)}.`,
          "err"
        );
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = label; }
      }
      return;
    }

    // No endpoint configured — hand off to the visitor's email app.
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
