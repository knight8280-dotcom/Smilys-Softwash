/* =========================================================
   Smilys Softwash — admin console

   Talks to Supabase over plain REST so the site keeps its no-build,
   no-dependency setup. Access is enforced server-side by row level security:
   this file holds no secret, and signing in as a non-admin returns nothing.
   ========================================================= */

const SB = {
  url: "https://lzqcnqqytconglqqlliy.supabase.co",
  key: "sb_publishable_NBoxThVxs0Nm94JTF45hig_0o59Pmlq",
};
const BUCKET = "job-photos";
const TOKEN_KEY = "smilys_admin_token";

const $ = (id) => document.getElementById(id);
let token = sessionStorage.getItem(TOKEN_KEY) || null;
let leads = [];
let filter = "all";

/* ---------- REST helpers ---------- */
function authHeaders(extra = {}) {
  return {
    apikey: SB.key,
    Authorization: `Bearer ${token}`,
    ...extra,
  };
}

async function api(path, options = {}) {
  const res = await fetch(SB.url + path, {
    ...options,
    headers: authHeaders(options.headers),
  });
  if (res.status === 401) {       // token expired or revoked
    signOut("Session expired — please sign in again.");
    throw new Error("unauthorised");
  }
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.status === 204 ? null : res.json();
}

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* ---------- Auth ---------- */
$("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = new FormData(e.target);
  const status = $("loginStatus");
  status.textContent = "Signing in…";
  status.className = "form-status";

  try {
    const res = await fetch(`${SB.url}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: SB.key, "Content-Type": "application/json" },
      body: JSON.stringify({
        email: data.get("email"),
        password: data.get("password"),
      }),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error_description || body.msg || "Sign in failed");

    token = body.access_token;
    sessionStorage.setItem(TOKEN_KEY, token);

    // Signing in is not the same as being allowed in — the account still has
    // to be in the admins table, which only the database owner can grant.
    const admin = await api("/rest/v1/rpc/is_admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    if (admin !== true) {
      signOut("");
      status.textContent = "That account isn't an admin for this site.";
      status.className = "form-status err";
      return;
    }

    $("whoami").textContent = body.user?.email || "";
    showDashboard();
  } catch (err) {
    status.textContent = err.message;
    status.className = "form-status err";
  }
});

function signOut(message) {
  token = null;
  sessionStorage.removeItem(TOKEN_KEY);
  $("dashboard").hidden = true;
  $("barActions").hidden = true;
  $("loginPanel").hidden = false;
  if (message) {
    $("loginStatus").textContent = message;
    $("loginStatus").className = "form-status err";
  }
}
$("signOut").addEventListener("click", () => signOut(""));

function showDashboard() {
  $("loginPanel").hidden = true;
  $("dashboard").hidden = false;
  $("barActions").hidden = false;
  loadLeads();
  loadPhotos();
}

/* ---------- Tabs ---------- */
document.querySelectorAll(".admin-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".admin-tab").forEach((t) => {
      const on = t === tab;
      t.classList.toggle("is-on", on);
      t.setAttribute("aria-selected", String(on));
    });
    document.querySelectorAll(".admin-panel").forEach((p) => {
      p.classList.toggle("is-on", p.id === "panel-" + tab.dataset.tab);
    });
  });
});

/* ---------- Leads ---------- */
const STATUSES = ["new", "quoted", "scheduled", "done", "lost"];

async function loadLeads() {
  try {
    leads = await api("/rest/v1/leads?select=*&order=created_at.desc");
    renderLeads();
  } catch (err) {
    console.error(err);
  }
}

function renderLeads() {
  const list = $("leadsList");
  const shown = filter === "all" ? leads : leads.filter((l) => l.status === filter);
  $("leadCount").textContent = leads.filter((l) => l.status === "new").length;
  $("leadsEmpty").hidden = shown.length > 0;

  list.innerHTML = shown.map((l) => {
    const when = new Date(l.created_at).toLocaleString(undefined, {
      dateStyle: "medium", timeStyle: "short",
    });
    const tel = String(l.phone || "").replace(/[^\d+]/g, "");
    return `
      <article class="lead lead-${esc(l.status)}">
        <div class="lead-head">
          <div>
            <h3>${esc(l.name)}</h3>
            <p class="lead-meta">${esc(when)}${l.city ? " &middot; " + esc(l.city) : ""}${l.source ? " &middot; " + esc(l.source) : ""}</p>
          </div>
          <select class="lead-status" data-id="${esc(l.id)}" aria-label="Status for ${esc(l.name)}">
            ${STATUSES.map((s) => `<option value="${s}"${s === l.status ? " selected" : ""}>${s[0].toUpperCase() + s.slice(1)}</option>`).join("")}
          </select>
        </div>

        <div class="lead-contact">
          <a href="tel:${esc(tel)}">${esc(l.phone)}</a>
          <a href="sms:${esc(tel)}">Text</a>
          ${l.email ? `<a href="mailto:${esc(l.email)}">${esc(l.email)}</a>` : ""}
        </div>

        ${l.services ? `<p class="lead-services">${esc(l.services)}</p>` : ""}
        ${l.details ? `<p class="lead-details">${esc(l.details)}</p>` : ""}
      </article>`;
  }).join("");

  list.querySelectorAll(".lead-status").forEach((sel) => {
    sel.addEventListener("change", async () => {
      const id = sel.dataset.id;
      const previous = leads.find((l) => l.id === id)?.status;
      try {
        await api(`/rest/v1/leads?id=eq.${encodeURIComponent(id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
          body: JSON.stringify({ status: sel.value }),
        });
        const lead = leads.find((l) => l.id === id);
        if (lead) lead.status = sel.value;
        renderLeads();
      } catch (err) {
        sel.value = previous;      // put the control back rather than lie
        alert("Could not update that status. " + err.message);
      }
    });
  });
}

$("statusFilters").addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if (!chip) return;
  filter = chip.dataset.status;
  document.querySelectorAll("#statusFilters .chip")
    .forEach((c) => c.classList.toggle("is-on", c === chip));
  renderLeads();
});

$("refreshLeads").addEventListener("click", loadLeads);

/* ---------- Photos ---------- */
const publicUrl = (path) =>
  `${SB.url}/storage/v1/object/public/${BUCKET}/${encodeURIComponent(path)}`;

async function uploadFile(file) {
  // Collision-proof name; keeps the extension so the CDN serves the right type.
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const res = await fetch(`${SB.url}/storage/v1/object/${BUCKET}/${path}`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": file.type }),
    body: file,
  });
  if (!res.ok) throw new Error(`Upload failed: ${res.status} ${await res.text()}`);
  return path;
}

$("photoForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const data = new FormData(form);
  const status = $("photoStatus");
  const after = data.get("after");
  const before = data.get("before");
  const btn = form.querySelector("button[type=submit]");

  if (!after || !after.size) {
    status.textContent = "Pick an “after” photo.";
    status.className = "form-status err";
    return;
  }

  btn.disabled = true;
  status.textContent = "Uploading…";
  status.className = "form-status";

  try {
    const afterPath = await uploadFile(after);
    const beforePath = before && before.size ? await uploadFile(before) : null;

    await api("/rest/v1/photos", {
      method: "POST",
      headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({
        title: data.get("title"),
        caption: data.get("caption") || null,
        alt_text: data.get("title"),
        after_path: afterPath,
        before_path: beforePath,
      }),
    });

    form.reset();
    status.textContent = "Uploaded. It's on the site now.";
    status.className = "form-status ok";
    loadPhotos();
  } catch (err) {
    status.textContent = err.message;
    status.className = "form-status err";
  } finally {
    btn.disabled = false;
  }
});

async function loadPhotos() {
  try {
    const rows = await api("/rest/v1/photos?select=*&order=sort_order.asc,created_at.desc");
    const list = $("photoList");
    $("photosEmpty").hidden = rows.length > 0;

    list.innerHTML = rows.map((p) => `
      <article class="photo-row">
        <img src="${publicUrl(p.after_path)}" alt="${esc(p.alt_text || p.title)}" loading="lazy">
        <div class="photo-info">
          <h3>${esc(p.title)}</h3>
          <p>${esc(p.caption || "")}</p>
          <p class="photo-flags">
            ${p.before_path ? "Before &amp; after pair" : "Single photo"}
            &middot; ${p.published ? "Live on the site" : "Hidden"}
          </p>
        </div>
        <div class="photo-actions">
          <button class="btn btn-ghost" type="button" data-toggle="${esc(p.id)}" data-published="${p.published}">
            ${p.published ? "Hide" : "Show"}
          </button>
          <button class="btn btn-danger" type="button" data-delete="${esc(p.id)}">Delete</button>
        </div>
      </article>`).join("");

    list.querySelectorAll("[data-toggle]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        await api(`/rest/v1/photos?id=eq.${encodeURIComponent(btn.dataset.toggle)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
          body: JSON.stringify({ published: btn.dataset.published !== "true" }),
        });
        loadPhotos();
      });
    });

    list.querySelectorAll("[data-delete]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!confirm("Delete this photo from the website?")) return;
        await api(`/rest/v1/photos?id=eq.${encodeURIComponent(btn.dataset.delete)}`, {
          method: "DELETE",
        });
        loadPhotos();
      });
    });
  } catch (err) {
    console.error(err);
  }
}

/* ---------- Resume an existing session ---------- */
if (token) {
  api("/rest/v1/rpc/is_admin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  })
    .then((isAdmin) => (isAdmin === true ? showDashboard() : signOut("")))
    .catch(() => signOut(""));
}
