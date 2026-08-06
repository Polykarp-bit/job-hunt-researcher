/**
 * JobRadar viewer — a small, backend-free job list renderer.
 * Reads everything (copy, categories, filters, listings) from data/jobs.json
 * next to this file, so the same viewer works for any dataset the skill produces.
 */

const DATA_URL = "data/jobs.json";
const STORAGE_KEY = "jobradar_checked_v1";

function jobKey(job) {
  let hash = 0;
  const s = job.company + "||" + job.role;
  for (let i = 0; i < s.length; i++) {
    hash = (hash * 31 + s.charCodeAt(i)) | 0;
  }
  return "j" + hash;
}

function loadChecked() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch (e) {
    return {};
  }
}

function saveChecked(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    /* localStorage unavailable (private mode, quota, etc.) — fail silently */
  }
}

function renderHeader(meta, jobCount) {
  document.title = meta.title || "JobRadar";
  document.getElementById("eyebrow").textContent = meta.eyebrow || "";
  document.getElementById("heading").textContent = meta.heading || "";
  document.getElementById("description").textContent = meta.description || "";

  const statsEl = document.getElementById("stats");
  const stats = [
    { value: String(jobCount), label: "Stellen mit Bewerbungslink" },
    ...(meta.statsExtra || []),
  ];
  statsEl.innerHTML = stats
    .map(s => `<div class="stat"><span class="num">${s.value}</span><span class="label">${s.label}</span></div>`)
    .join("");
}

function renderControls(meta) {
  const controlsEl = document.getElementById("chip-row");
  const chips = [];

  if (meta.focusFilter) {
    chips.push(`<button class="chip" data-filter="focus" aria-pressed="true">${meta.focusFilter.label}</button>`);
  }
  (meta.categoryOrder || []).forEach(cat => {
    chips.push(`<button class="chip" data-filter="${cat}">Nur ${meta.categories[cat]}</button>`);
  });
  chips.push(`<button class="chip" data-filter="all">Alle Kategorien</button>`);

  controlsEl.innerHTML = chips.join("");
}

function renderGroups(meta, jobs) {
  const groupsEl = document.getElementById("groups");
  const order = meta.categoryOrder || [...new Set(jobs.map(j => j.cat))];

  order.forEach(cat => {
    const rows = jobs.filter(j => j.cat === cat).sort((a, b) => a.loc.localeCompare(b.loc, "de"));
    if (!rows.length) return;

    const section = document.createElement("div");
    section.className = "group";
    section.dataset.cat = cat;
    section.innerHTML = `
      <div class="group-head">
        <h2>${meta.categories[cat] || cat}</h2>
        <span class="count">${rows.length} Stellen</span>
      </div>
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th class="check-head" style="width:34px" title="Schon geprüft">✓</th>
              <th style="width:36%">Position</th>
              <th style="width:26%">Unternehmen</th>
              <th>Ort</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(r => {
              const id = jobKey(r);
              const roleCell = r.url
                ? `<a href="${r.url}" target="_blank" rel="noopener">${r.role} ↗</a>`
                : r.role;
              const gradBadge = r.gradWelcome ? `<span class="grad-badge">🎓 Absolventen willkommen</span>` : "";
              const note = r.note ? `<div class="row-note">${r.note}</div>` : "";
              return `
                <tr data-search="${(r.company + " " + r.loc).toLowerCase()}" data-cat="${r.cat}" data-grad="${r.gradWelcome ? "1" : "0"}" data-job-id="${id}">
                  <td class="check-cell"><input type="checkbox" class="check-box" data-job-id="${id}" aria-label="Als geprüft markieren"></td>
                  <td class="role">${roleCell}${gradBadge}${note}</td>
                  <td class="company">${r.company}</td>
                  <td class="loc">${r.loc}</td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
    `;
    groupsEl.appendChild(section);
  });
}

function renderSources(meta) {
  const el = document.getElementById("sources");
  if (!meta.sources && !meta.notes) { el.style.display = "none"; return; }

  const sourcesList = (meta.sources || [])
    .map(s => `<li><a href="${s.url}" target="_blank" rel="noopener">${s.label}</a> ${s.extra || ""}</li>`)
    .join("");

  const directList = (meta.directSources || []).map(s => `<li>${s}</li>`).join("");

  const notesHtml = (meta.notes || []).map(n => `<div class="note">${n}</div>`).join("");

  el.innerHTML = `
    <h3>${meta.sourcesTitle || "Quellen"}</h3>
    <ul>${sourcesList}</ul>
    ${directList ? `<p class="subhead">${meta.directSourcesTitle || "Weitere Quellen"}</p><ul>${directList}</ul>` : ""}
    ${notesHtml}
  `;

  document.getElementById("footer-text").textContent = meta.footer || "";
}

function wireInteractivity() {
  const chips = document.querySelectorAll(".chip[data-filter]");
  const searchInput = document.getElementById("search");
  const hideCheckedToggle = document.getElementById("hide-checked-toggle");
  let activeFilter = chips[0] ? chips[0].dataset.filter : "all";
  let checkedState = loadChecked();

  function updateCheckedCount() {
    const total = document.querySelectorAll(".check-box").length;
    const checked = document.querySelectorAll(".check-box:checked").length;
    document.getElementById("checked-count").textContent = `${checked} / ${total} geprüft`;
  }

  document.querySelectorAll(".check-box").forEach(box => {
    const id = box.dataset.jobId;
    const isChecked = !!checkedState[id];
    box.checked = isChecked;
    box.closest("tr").classList.toggle("row-checked", isChecked);

    box.addEventListener("change", () => {
      if (box.checked) checkedState[id] = true;
      else delete checkedState[id];
      saveChecked(checkedState);
      box.closest("tr").classList.toggle("row-checked", box.checked);
      updateCheckedCount();
      applyFilters();
    });
  });
  updateCheckedCount();

  function rowMatchesFilter(row, meta) {
    if (hideCheckedToggle?.getAttribute("aria-pressed") === "true" && row.classList.contains("row-checked")) {
      return false;
    }
    if (activeFilter === "all") return true;
    if (activeFilter === "focus" && meta.focusFilter) {
      const inCat = meta.focusFilter.categories.includes(row.dataset.cat);
      const isGrad = meta.focusFilter.includeGradWelcome && row.dataset.grad === "1";
      return inCat || isGrad;
    }
    return row.dataset.cat === activeFilter;
  }

  function applyFilters() {
    const q = searchInput.value.trim().toLowerCase();
    let anyVisible = false;
    document.querySelectorAll(".group").forEach(group => {
      let groupHasVisible = false;
      group.querySelectorAll("tbody tr").forEach(row => {
        const matchesSearch = !q || row.dataset.search.includes(q) || row.querySelector(".role").textContent.toLowerCase().includes(q);
        const visible = rowMatchesFilter(row, window.__jobradarMeta) && matchesSearch;
        row.classList.toggle("hidden-row", !visible);
        if (visible) groupHasVisible = true;
      });
      group.classList.toggle("hidden-row", !groupHasVisible);
      if (groupHasVisible) anyVisible = true;
    });
    document.getElementById("empty-state").style.display = anyVisible ? "none" : "block";
  }

  chips.forEach(chip => {
    chip.addEventListener("click", () => {
      chips.forEach(c => c.setAttribute("aria-pressed", "false"));
      chip.setAttribute("aria-pressed", "true");
      activeFilter = chip.dataset.filter;
      applyFilters();
    });
  });

  hideCheckedToggle?.addEventListener("click", () => {
    const pressed = hideCheckedToggle.getAttribute("aria-pressed") === "true";
    hideCheckedToggle.setAttribute("aria-pressed", String(!pressed));
    applyFilters();
  });

  searchInput.addEventListener("input", applyFilters);
  applyFilters();
}

async function init() {
  const root = document.getElementById("app-root");
  try {
    const res = await fetch(DATA_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { meta, jobs } = await res.json();
    window.__jobradarMeta = meta;

    renderHeader(meta, jobs.length);
    renderControls(meta);
    renderGroups(meta, jobs);
    renderSources(meta);
    wireInteractivity();

    root.classList.remove("is-loading");
  } catch (err) {
    root.innerHTML = `<p class="error-state">Konnte ${DATA_URL} nicht laden. Läuft die Seite über einen lokalen Server? (Direktes Öffnen als Datei blockiert fetch() in den meisten Browsern.)<br><small>${err.message}</small></p>`;
  }
}

init();
