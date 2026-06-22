/* ============================================================
   DevKit — Developer Toolkit (vanilla JavaScript, no framework)
   ============================================================ */

/* 1. TOOL REGISTRY -------------------------------------------------- */
const TOOLS = [
  { id: "password", name: "Password Generator", icon: "🔑", category: "generators", desc: "Create strong, customizable passwords." },
  { id: "qr",       name: "QR Code Generator",  icon: "🔳", category: "generators", desc: "Turn text or URLs into downloadable QR codes." },
  { id: "json",     name: "JSON Formatter",     icon: "🧩", category: "converters", desc: "Format, minify and validate JSON." },
  { id: "base64",   name: "Base64 Encode/Decode", icon: "🔁", category: "converters", desc: "Convert text to and from Base64." },
  { id: "colors",   name: "Color Palette",      icon: "🎨", category: "design",     desc: "Generate random color palettes with HEX codes." },
  { id: "uuid",     name: "UUID Generator",     icon: "🆔", category: "generators", desc: "Generate unique RFC-4122 v4 identifiers." },
  { id: "text",     name: "Text Utilities",     icon: "✍️", category: "text",       desc: "Count words and transform text case." },
  { id: "markdown", name: "Markdown Previewer", icon: "📝", category: "text",       desc: "Write Markdown and preview it live." },
];

/* 2. THEME HANDLING ------------------------------------------------- */
const root = document.documentElement;
const themeToggle = document.getElementById("themeToggle");

function applyTheme(theme) {
  root.setAttribute("data-theme", theme);
  themeToggle.querySelector(".theme-icon").textContent = theme === "dark" ? "☀️" : "🌙";
  localStorage.setItem("devkit-theme", theme);
}
(function initTheme() {
  const saved = localStorage.getItem("devkit-theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(saved || (prefersDark ? "dark" : "light"));
})();
themeToggle.addEventListener("click", () => {
  applyTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark");
});

/* 3. USAGE STATISTICS (localStorage) -------------------------------- */
const STATS_KEY = "devkit-stats";
function loadStats() {
  try { return JSON.parse(localStorage.getItem(STATS_KEY)) || { counts: {}, recent: null }; }
  catch { return { counts: {}, recent: null }; }
}
function recordUsage(toolId) {
  const stats = loadStats();
  stats.counts[toolId] = (stats.counts[toolId] || 0) + 1;
  stats.recent = toolId;
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  renderStats();
}
function renderStats() {
  const stats = loadStats();
  const total = Object.values(stats.counts).reduce((a, b) => a + b, 0);
  let mostUsedId = null, max = 0;
  for (const [id, n] of Object.entries(stats.counts)) if (n > max) { max = n; mostUsedId = id; }
  const nameOf = (id) => (TOOLS.find((t) => t.id === id) || {}).name || "—";
  document.getElementById("statTotal").textContent = TOOLS.length;
  document.getElementById("statUsage").textContent = total;
  document.getElementById("statMostUsed").textContent = mostUsedId ? nameOf(mostUsedId) : "—";
  document.getElementById("statRecent").textContent = stats.recent ? nameOf(stats.recent) : "—";
}

/* 4. DASHBOARD: RENDER + SEARCH + FILTERS --------------------------- */
const toolsGrid = document.getElementById("toolsGrid");
const noResults = document.getElementById("noResults");
const searchInput = document.getElementById("searchInput");
let activeCategory = "all";

function renderTools() {
  const query = searchInput.value.trim().toLowerCase();
  const visible = TOOLS.filter((t) => {
    const matchesCat = activeCategory === "all" || t.category === activeCategory;
    const matchesQuery = !query || t.name.toLowerCase().includes(query) || t.desc.toLowerCase().includes(query);
    return matchesCat && matchesQuery;
  });
  toolsGrid.innerHTML = visible.map((t) => `
    <article class="tool-card glass" data-tool="${t.id}">
      <div class="icon">${t.icon}</div>
      <span class="tag">${t.category}</span>
      <h3>${t.name}</h3>
      <p>${t.desc}</p>
    </article>`).join("");
  noResults.hidden = visible.length !== 0;
  toolsGrid.querySelectorAll(".tool-card").forEach((card) => {
    card.addEventListener("click", () => openTool(card.dataset.tool));
  });
}
searchInput.addEventListener("input", renderTools);
document.getElementById("filters").addEventListener("click", (e) => {
  const btn = e.target.closest(".filter-btn");
  if (!btn) return;
  document.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  activeCategory = btn.dataset.category;
  renderTools();
});

/* 5. TOOL VIEW ROUTER ----------------------------------------------- */
const dashboardView = document.getElementById("dashboardView");
const toolView = document.getElementById("toolView");
const toolPanelBody = document.getElementById("toolPanelBody");

function showView(view) {
  dashboardView.classList.toggle("active", view === "dashboard");
  toolView.classList.toggle("active", view === "tool");
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function openTool(toolId) {
  const tool = TOOLS.find((t) => t.id === toolId);
  if (!tool) return;
  document.getElementById("toolPanelIcon").textContent = tool.icon;
  document.getElementById("toolPanelTitle").textContent = tool.name;
  document.getElementById("toolPanelDesc").textContent = tool.desc;
  const tpl = document.getElementById(`tpl-${toolId}`);
  toolPanelBody.innerHTML = "";
  toolPanelBody.appendChild(tpl.content.cloneNode(true));
  toolPanelBody.querySelectorAll("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", () => copyText(document.getElementById(btn.dataset.copy).value));
  });
  TOOL_INIT[toolId]?.();
  recordUsage(toolId);
  showView("tool");
  location.hash = toolId;
}
document.getElementById("backBtn").addEventListener("click", () => { showView("dashboard"); location.hash = ""; });
document.getElementById("brandHome").addEventListener("click", () => { showView("dashboard"); location.hash = ""; });

/* 6. SHARED HELPERS ------------------------------------------------- */
const toastEl = document.getElementById("toast");
let toastTimer;
function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), 1800);
}
async function copyText(text) {
  if (!text) { showToast("Nothing to copy"); return; }
  try { await navigator.clipboard.writeText(text); showToast("Copied to clipboard ✓"); }
  catch {
    const ta = document.createElement("textarea");
    ta.value = text; document.body.appendChild(ta); ta.select();
    document.execCommand("copy"); ta.remove(); showToast("Copied to clipboard ✓");
  }
}

/* 7. TOOL LOGIC (A–H) ----------------------------------------------- */
const TOOL_INIT = {
  /* A. Password Generator */
  password() {
    const len = document.getElementById("pwLength");
    const label = document.getElementById("pwLenLabel");
    const out = document.getElementById("pwOutput");
    len.addEventListener("input", () => (label.textContent = len.value));
    function generate() {
      const sets = {
        upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
        lower: "abcdefghijklmnopqrstuvwxyz",
        numbers: "0123456789",
        symbols: "!@#$%^&*()_+-=[]{}|;:,.<>?",
      };
      let pool = "";
      if (document.getElementById("pwUpper").checked) pool += sets.upper;
      if (document.getElementById("pwLower").checked) pool += sets.lower;
      if (document.getElementById("pwNumbers").checked) pool += sets.numbers;
      if (document.getElementById("pwSymbols").checked) pool += sets.symbols;
      if (!pool) { showToast("Select at least one option"); return; }
      const length = +len.value;
      const arr = new Uint32Array(length);
      crypto.getRandomValues(arr);
      let pw = "";
      for (let i = 0; i < length; i++) pw += pool[arr[i] % pool.length];
      out.value = pw;
    }
    document.getElementById("pwGenerate").addEventListener("click", generate);
    generate();
  },

  /* B. QR Code Generator */
  qr() {
    const input = document.getElementById("qrText");
    const result = document.getElementById("qrResult");
    const downloadBtn = document.getElementById("qrDownload");
    document.getElementById("qrGenerate").addEventListener("click", () => {
      const text = input.value.trim();
      if (!text) { showToast("Enter some text first"); return; }
      result.innerHTML = "";
      new QRCode(result, { text, width: 220, height: 220, correctLevel: QRCode.CorrectLevel.H });
      downloadBtn.hidden = false;
    });
    downloadBtn.addEventListener("click", () => {
      const img = result.querySelector("img");
      const canvas = result.querySelector("canvas");
      const src = img ? img.src : canvas ? canvas.toDataURL("image/png") : null;
      if (!src) { showToast("Generate a QR code first"); return; }
      const a = document.createElement("a");
      a.href = src; a.download = "qrcode.png"; a.click();
    });
  },

  /* C. JSON Formatter */
  json() {
    const input = document.getElementById("jsonInput");
    const output = document.getElementById("jsonOutput");
    const msg = document.getElementById("jsonMessage");
    function setMessage(text, ok) { msg.hidden = false; msg.textContent = text; msg.className = "message " + (ok ? "ok" : "err"); }
    const parse = () => JSON.parse(input.value);
    document.getElementById("jsonFormat").addEventListener("click", () => {
      try { output.value = JSON.stringify(parse(), null, 2); setMessage("Valid JSON — formatted ✓", true); }
      catch (e) { setMessage("Invalid JSON: " + e.message, false); }
    });
    document.getElementById("jsonMinify").addEventListener("click", () => {
      try { output.value = JSON.stringify(parse()); setMessage("Valid JSON — minified ✓", true); }
      catch (e) { setMessage("Invalid JSON: " + e.message, false); }
    });
    document.getElementById("jsonValidate").addEventListener("click", () => {
      try { parse(); setMessage("Valid JSON ✓", true); }
      catch (e) { setMessage("Invalid JSON: " + e.message, false); }
    });
  },

  /* D. Base64 Encoder / Decoder */
  base64() {
    const input = document.getElementById("b64Input");
    const output = document.getElementById("b64Output");
    const msg = document.getElementById("b64Message");
    function setMessage(text, ok) { msg.hidden = false; msg.textContent = text; msg.className = "message " + (ok ? "ok" : "err"); }
    document.getElementById("b64Encode").addEventListener("click", () => {
      try { output.value = btoa(unescape(encodeURIComponent(input.value))); setMessage("Encoded ✓", true); }
      catch (e) { setMessage("Could not encode: " + e.message, false); }
    });
    document.getElementById("b64Decode").addEventListener("click", () => {
      try { output.value = decodeURIComponent(escape(atob(input.value.trim()))); setMessage("Decoded ✓", true); }
      catch { setMessage("Invalid Base64 string", false); }
    });
  },

  /* E. Color Palette Generator */
  colors() {
    const palette = document.getElementById("palette");
    const randomHex = () => "#" + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0").toUpperCase();
    function render() {
      const colors = Array.from({ length: 5 }, randomHex);
      palette.innerHTML = colors.map((c) => `<div class="swatch" style="background:${c}" data-hex="${c}">${c}</div>`).join("");
      palette.querySelectorAll(".swatch").forEach((sw) => sw.addEventListener("click", () => copyText(sw.dataset.hex)));
    }
    document.getElementById("colorsGenerate").addEventListener("click", render);
    render();
  },

  /* F. UUID Generator */
  uuid() {
    const count = document.getElementById("uuidCount");
    const label = document.getElementById("uuidCountLabel");
    const out = document.getElementById("uuidOutput");
    count.addEventListener("input", () => (label.textContent = count.value));
    const makeUUID = () => crypto.randomUUID
      ? crypto.randomUUID()
      : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0;
          return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
        });
    function generate() { out.value = Array.from({ length: +count.value }, makeUUID).join("\n"); }
    document.getElementById("uuidGenerate").addEventListener("click", generate);
    generate();
  },

  /* G. Text Utilities */
  text() {
    const input = document.getElementById("textInput");
    const words = document.getElementById("textWords");
    const chars = document.getElementById("textChars");
    const sentences = document.getElementById("textSentences");
    function updateStats() {
      const val = input.value;
      words.textContent = (val.trim().match(/\S+/g) || []).length;
      chars.textContent = val.length;
      sentences.textContent = (val.match(/[^.!?]+[.!?]+/g) || []).length;
    }
    input.addEventListener("input", updateStats);
    document.getElementById("textUpper").addEventListener("click", () => { input.value = input.value.toUpperCase(); updateStats(); });
    document.getElementById("textLower").addEventListener("click", () => { input.value = input.value.toLowerCase(); updateStats(); });
    document.getElementById("textTitle").addEventListener("click", () => {
      input.value = input.value.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase());
      updateStats();
    });
    document.getElementById("textTrim").addEventListener("click", () => { input.value = input.value.replace(/\s+/g, " ").trim(); updateStats(); });
    updateStats();
  },

  /* H. Markdown Previewer */
  markdown() {
    const input = document.getElementById("mdInput");
    const preview = document.getElementById("mdPreview");
    function render() { preview.innerHTML = marked.parse(input.value || "*Nothing to preview yet…*"); }
    input.addEventListener("input", render);
    input.value = "# Hello, DevKit 👋\n\nType **markdown** on the left and watch it render live.\n\n- Lists\n- `code`\n- [links](https://example.com)";
    render();
  },
};

/* 8. BOOTSTRAP ------------------------------------------------------ */
document.getElementById("year").textContent = new Date().getFullYear();
renderStats();
renderTools();
(function handleHash() {
  const id = location.hash.replace("#", "");
  if (id && TOOLS.some((t) => t.id === id)) openTool(id);
})();
