/*
 * ORAR – orar școlar interactiv pentru Home Assistant
 *  <orar-board>        tabla de orar (randare + interacțiune)
 *  <orar-panel>        panoul din sidebar (editor complet)
 *  <orar-card>         card Lovelace (week | today | now | backpack)
 */
const ORAR_VERSION = "1.1.0";
const BASE_URL = new URL(".", import.meta.url).href;

const DAYS = [
  { key: "mon", name: "Luni" },
  { key: "tue", name: "Marți" },
  { key: "wed", name: "Miercuri" },
  { key: "thu", name: "Joi" },
  { key: "fri", name: "Vineri" },
];
const DAY_KEYS = DAYS.map((d) => d.key);
const DAY_NAME = Object.fromEntries(DAYS.map((d) => [d.key, d.name]));
const MONTHS = ["ian", "feb", "mar", "apr", "mai", "iun", "iul", "aug", "sep", "oct", "nov", "dec"];
const FONT_LIST = ["Bebas Neue", "Bangers", "Baloo 2", "Fredoka", "Patrick Hand", "Nunito", "system"];

(function loadFonts() {
  if (document.getElementById("orar-fonts")) return;
  const link = document.createElement("link");
  link.id = "orar-fonts";
  link.rel = "stylesheet";
  link.href =
    "https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;600;800&family=Bangers&family=Bebas+Neue" +
    "&family=Fredoka:wght@400;600&family=Nunito:wght@400;700;800&family=Patrick+Hand&display=swap";
  document.head.appendChild(link);
})();

const BG_PRESETS = {
  galaxy: { label: "Galaxie", css: `url("${BASE_URL}backgrounds/galaxy.svg") center / cover no-repeat, #0b1340` },
  ocean: {
    label: "Ocean",
    css: "radial-gradient(circle at 20% 10%, rgba(255,255,255,.28), transparent 40%), linear-gradient(165deg,#0f4c75 0%,#3282b8 55%,#7fd1e8 100%)",
  },
  sunset: { label: "Apus", css: "linear-gradient(170deg,#2b1055 0%,#7a4fd6 35%,#ff8a80 70%,#ffd194 100%)" },
  forest: {
    label: "Pădure",
    css: "radial-gradient(circle at 80% 0%, rgba(255,255,200,.3), transparent 45%), linear-gradient(160deg,#134e5e 0%,#3f8f5a 60%,#a8d672 100%)",
  },
  chalkboard: {
    label: "Tablă",
    css: "radial-gradient(ellipse at 50% 40%, #3f7350 0%, #23432d 75%, #1a3322 100%)",
  },
  notebook: {
    label: "Caiet",
    css: "linear-gradient(90deg, transparent 70px, #f3a6a6 70px, #f3a6a6 72px, transparent 72px), repeating-linear-gradient(180deg, #fffdf6 0 31px, #c7d8f3 31px 32px)",
  },
  candy: {
    label: "Bomboane",
    css: "radial-gradient(circle at 12% 18%, rgba(255,255,255,.45) 0 70px, transparent 71px), radial-gradient(circle at 88% 82%, rgba(255,255,255,.35) 0 110px, transparent 111px), linear-gradient(135deg,#fbc2eb 0%,#a6c1ee 100%)",
  },
  aurora: {
    label: "Auroră",
    css: "radial-gradient(at 15% 20%, rgba(45,226,166,.65) 0, transparent 45%), radial-gradient(at 85% 25%, rgba(59,140,255,.65) 0, transparent 45%), radial-gradient(at 50% 95%, rgba(162,59,255,.65) 0, transparent 55%), #070b1f",
  },
};

const mkDays = (colors, win, opacity, text) =>
  Object.fromEntries(DAY_KEYS.map((k, i) => [k, { color: colors[i], window: win, opacity, text }]));

const DEFAULT_APPEARANCE = {
  title: "ORAR",
  subtitle: "",
  footer: "Învățătura este o comoară care își urmează stăpânul pretutindeni ✨",
  bg_type: "preset",
  bg_preset: "galaxy",
  bg_image: "",
  bg_color: "#101a4f",
  bg_size: "cover",
  bg_dim: 0,
  bg_blur: 0,
  stars: true,
  title_color: "#f6ae3b",
  text_color: "#ffffff",
  title_font: "Bebas Neue",
  body_font: "Baloo 2",
  layout: "rows",
  cell_style: "stripe",
  cell_radius: 14,
  window_blur: 6,
  show_times: true,
  show_icons: true,
  show_room: true,
  show_teacher: false,
  show_dates: true,
  show_now: true,
  show_clock: true,
  show_footer: true,
  days: mkDays(["#63c5ee", "#128b92", "#e2512f", "#f8ac3e", "#ee84ae"], "#ffffff", 0.94, "#1d2340"),
};

const THEMES = [
  { id: "galaxie", label: "Galaxie", emoji: "🚀", a: { bg_type: "preset", bg_preset: "galaxy", stars: true, title_color: "#f6ae3b", text_color: "#ffffff", title_font: "Bebas Neue", body_font: "Baloo 2", cell_style: "stripe", days: mkDays(["#63c5ee", "#128b92", "#e2512f", "#f8ac3e", "#ee84ae"], "#ffffff", 0.94, "#1d2340") } },
  { id: "pastel", label: "Pastel", emoji: "🍬", a: { bg_type: "preset", bg_preset: "candy", stars: false, title_color: "#6c5ce7", text_color: "#3d3d6b", title_font: "Fredoka", body_font: "Nunito", cell_style: "tinted", days: mkDays(["#a29bfe", "#4fc3c8", "#fa8f7d", "#f5c242", "#f06fa4"], "#ffffff", 0.7, "#2d3436") } },
  { id: "ocean", label: "Ocean", emoji: "🐳", a: { bg_type: "preset", bg_preset: "ocean", stars: false, title_color: "#ffffff", text_color: "#ffffff", title_font: "Baloo 2", body_font: "Baloo 2", cell_style: "stripe", days: mkDays(["#00a8cc", "#0c7b93", "#27496d", "#f08a5d", "#00909e"], "#ffffff", 0.6, "#0b2239") } },
  { id: "tabla", label: "Tablă", emoji: "🧑‍🏫", a: { bg_type: "preset", bg_preset: "chalkboard", stars: false, title_color: "#fffbe6", text_color: "#fffbe6", title_font: "Patrick Hand", body_font: "Patrick Hand", cell_style: "stripe", days: mkDays(["#ffd166", "#ef476f", "#06d6a0", "#4cc9f0", "#f78c6b"], "#16301f", 0.55, "#fffbe6") } },
  { id: "caiet", label: "Caiet", emoji: "📓", a: { bg_type: "preset", bg_preset: "notebook", stars: false, title_color: "#e63946", text_color: "#1d3557", title_font: "Patrick Hand", body_font: "Patrick Hand", cell_style: "tinted", days: mkDays(["#457b9d", "#e63946", "#2a9d8f", "#f4a261", "#9b5de5"], "#ffffff", 0.75, "#1d3557") } },
  { id: "neon", label: "Neon", emoji: "🌌", a: { bg_type: "preset", bg_preset: "aurora", stars: true, title_color: "#39ff14", text_color: "#e0e0ff", title_font: "Bangers", body_font: "Nunito", cell_style: "tinted", days: mkDays(["#ff00e5", "#00c8ff", "#39ff14", "#ffe600", "#ff6b00"], "#0b0b1e", 0.6, "#f0f0ff") } },
  { id: "apus", label: "Apus", emoji: "🌅", a: { bg_type: "preset", bg_preset: "sunset", stars: true, title_color: "#fff3c4", text_color: "#ffffff", title_font: "Bangers", body_font: "Baloo 2", cell_style: "stripe", days: mkDays(["#ff7aa2", "#ffb86b", "#7a4fd6", "#4a3aa8", "#ff5e62"], "#ffffff", 0.85, "#2b1055") } },
  { id: "padure", label: "Pădure", emoji: "🌲", a: { bg_type: "preset", bg_preset: "forest", stars: false, title_color: "#fff8d6", text_color: "#ffffff", title_font: "Fredoka", body_font: "Nunito", cell_style: "solid", days: mkDays(["#2e7d32", "#558b2f", "#f9a825", "#6d4c41", "#00897b"], "#fffef5", 0.85, "#1b3a1b") } },
];

const SUBJECT_COLORS = ["#e2512f", "#3f7be0", "#27ae60", "#8e44ad", "#f39c12", "#16a085", "#e84393", "#0097a7", "#d35400", "#6c5ce7", "#c0392b", "#2e86de"];

const ICONS = [
  "mdi:calculator-variant", "mdi:book-open-page-variant", "mdi:alphabet-latin", "mdi:translate", "mdi:earth",
  "mdi:castle", "mdi:leaf", "mdi:atom", "mdi:flask", "mdi:laptop", "mdi:run", "mdi:music", "mdi:palette",
  "mdi:church", "mdi:tools", "mdi:account-group", "mdi:microscope", "mdi:brain", "mdi:chess-knight",
  "mdi:basketball", "mdi:soccer", "mdi:swim", "mdi:drama-masks", "mdi:guitar-acoustic", "mdi:piano",
  "mdi:pencil-ruler", "mdi:compass-outline", "mdi:dna", "mdi:telescope", "mdi:rocket-launch", "mdi:robot",
  "mdi:code-braces", "mdi:map", "mdi:scale-balance", "mdi:cash", "mdi:sprout", "mdi:food-apple",
  "mdi:heart-pulse", "mdi:feather", "mdi:bookshelf", "mdi:school", "mdi:human-male-board", "mdi:flag",
  "mdi:account-voice", "mdi:sigma", "mdi:shape", "mdi:lightbulb-on", "mdi:book-education",
];

/* ------------------------------------------------------------------ utilitare */

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const pad = (n) => String(n).padStart(2, "0");
const clone = (o) => JSON.parse(JSON.stringify(o));
const uid = () => Math.random().toString(36).slice(2, 10);
const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const splitItems = (s) => (s || "").split(/[,;\n]/).map((x) => x.trim()).filter(Boolean);
const slugify = (s) =>
  String(s).normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
const emptyCell = () => ({ subject: null, start: "", end: "", note: "" });
const fontStack = (f) =>
  f === "system" ? "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" : `'${f}', 'Segoe UI', Roboto, sans-serif`;

function toMin(t) {
  if (typeof t !== "string" || !/^\d{2}:\d{2}$/.test(t)) return null;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
const fromMin = (m) => `${pad(Math.floor(m / 60) % 24)}:${pad(m % 60)}`;

function rgba(hex, alpha) {
  const n = parseInt((hex || "#000000").slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

function contrastColor(hex) {
  const n = parseInt((hex || "#000000").slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.45 ? "#1d2340" : "#ffffff";
}

function setPath(obj, path, val) {
  const keys = path.split(".");
  let o = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (o[keys[i]] == null) o[keys[i]] = /^\d+$/.test(keys[i + 1]) ? [] : {};
    o = o[keys[i]];
  }
  o[keys[keys.length - 1]] = val;
}

const localGet = (k) => {
  try { return localStorage.getItem(k); } catch (e) { return null; }
};
const localSet = (k, v) => {
  try { localStorage.setItem(k, v); } catch (e) { /* stocare indisponibilă */ }
};

function appearanceOf(d) {
  const src = d?.appearance || {};
  const a = { ...DEFAULT_APPEARANCE, ...src, days: {} };
  for (const k of DAY_KEYS) a.days[k] = { ...DEFAULT_APPEARANCE.days[k], ...(src.days?.[k] || {}) };
  return a;
}

function backgroundCss(a) {
  if (a.bg_type === "image" && a.bg_image) {
    const url = String(a.bg_image).replace(/["\\\n\r]/g, "");
    const size = a.bg_size === "tile" ? "auto repeat" : `${a.bg_size} no-repeat`;
    return `url("${url}") center / ${size}, #111`;
  }
  if (a.bg_type === "color") return a.bg_color;
  return (BG_PRESETS[a.bg_preset] || BG_PRESETS.galaxy).css;
}

const subjectMap = (d) => Object.fromEntries((d.subjects || []).map((s) => [s.id, s]));

function holidayFor(d, iso) {
  for (const h of d.holidays || []) if (h.start && h.start <= iso && iso <= (h.end || h.start)) return h.name;
  return null;
}

/** Toate celulele unei zile, cu orele efective (personalizate sau din Clopoțel). */
function resolveDay(d, dayKey) {
  const subj = subjectMap(d);
  return (d.schedule?.[dayKey] || []).map((cell, idx) => {
    const p = d.periods?.[idx] || {};
    const start = cell.start || p.start || "";
    const end = cell.end || p.end || "";
    const s = toMin(start);
    const e = toMin(end);
    return { idx, cell, subject: subj[cell.subject] || null, start, end, s, e, valid: s != null && e != null && e > s };
  });
}

const dayLessons = (d, dayKey) =>
  resolveDay(d, dayKey).filter((l) => l.subject && l.valid).sort((x, y) => x.s - y.s);

function nowInfo(d, now = new Date()) {
  const iso = isoDate(now);
  const wd = (now.getDay() + 6) % 7;
  const dayKey = wd < 5 ? DAY_KEYS[wd] : null;
  const holiday = holidayFor(d, iso);
  const nm = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  const lessons = dayKey && !holiday ? dayLessons(d, dayKey) : [];
  const current = lessons.find((l) => l.s <= nm && nm < l.e) || null;
  const next = lessons.find((l) => l.s > nm) || null;
  let status;
  if (holiday) status = "holiday";
  else if (!dayKey) status = "weekend";
  else if (!lessons.length) status = "free";
  else if (current) status = "lesson";
  else if (nm < lessons[0].s) status = "before";
  else if (nm >= lessons[lessons.length - 1].e) status = "after";
  else status = "break";
  return { iso, dayKey, holiday, nm, lessons, current, next, status };
}

function nextSchoolDay(d, from = new Date()) {
  for (let i = 1; i <= 45; i++) {
    const day = new Date(from);
    day.setHours(12, 0, 0, 0);
    day.setDate(day.getDate() + i);
    const wd = (day.getDay() + 6) % 7;
    if (wd > 4 || holidayFor(d, isoDate(day))) continue;
    const lessons = dayLessons(d, DAY_KEYS[wd]);
    if (lessons.length) return { date: day, dayKey: DAY_KEYS[wd], lessons };
  }
  return null;
}

/** Datele săptămânii afișate (în weekend arătăm săptămâna următoare). */
function weekDates(now = new Date()) {
  const wd = (now.getDay() + 6) % 7;
  const monday = new Date(now);
  monday.setHours(12, 0, 0, 0);
  monday.setDate(now.getDate() - wd + (wd > 4 ? 7 : 0));
  return DAY_KEYS.map((_, i) => {
    const x = new Date(monday);
    x.setDate(monday.getDate() + i);
    return x;
  });
}

function statusText(info) {
  switch (info.status) {
    case "lesson":
      return { emoji: "⏱️", text: `${info.current.subject.name} · încă ${Math.max(0, Math.ceil(info.current.e - info.nm))} min` };
    case "break":
      return { emoji: "☕", text: `Pauză · urmează ${info.next.subject.name} la ${info.next.start}` };
    case "before":
      return { emoji: "🌅", text: `Prima oră: ${info.next.subject.name} la ${info.next.start}` };
    case "after":
      return { emoji: "✅", text: "Gata pe azi! Spor la teme 📚" };
    case "weekend":
      return { emoji: "🎉", text: "Weekend! Odihnă plăcută" };
    case "holiday":
      return { emoji: "🏖️", text: info.holiday };
    default:
      return { emoji: "😴", text: "Azi nu sunt ore" };
  }
}

function readAsDataURL(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

async function downscaleImage(file, maxSide = 2400, quality = 0.86) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("Imaginea nu poate fi citită"));
      i.src = url;
    });
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", quality);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/* ------------------------------------------------------------------ <orar-board> */

const BOARD_CSS = `
:host{display:block;container-type:inline-size}
*{box-sizing:border-box}
.loading{padding:40px;text-align:center;opacity:.7;font-family:sans-serif}
.board{position:relative;overflow:hidden;isolation:isolate;border-radius:20px;padding:clamp(14px,2.6cqw,36px);color:var(--txt);font-family:var(--font-body);min-height:200px}
.bg{position:absolute;inset:calc(var(--bgblur) * -2);z-index:-3;filter:blur(var(--bgblur));background-color:#0b1340}
.dim{position:absolute;inset:0;z-index:-2;background:rgba(0,0,0,var(--dim))}
.twinkle,.twinkle::after{position:absolute;inset:0;z-index:-1;pointer-events:none;background-repeat:no-repeat}
.twinkle{background-image:radial-gradient(2px 2px at 8% 14%,#fff,transparent 70%),radial-gradient(2px 2px at 27% 7%,#fff,transparent 70%),radial-gradient(1.6px 1.6px at 46% 22%,#fff,transparent 70%),radial-gradient(2.4px 2.4px at 66% 9%,#ffe9a8,transparent 70%),radial-gradient(1.8px 1.8px at 88% 18%,#fff,transparent 70%),radial-gradient(2px 2px at 95% 52%,#fff,transparent 70%),radial-gradient(1.6px 1.6px at 4% 60%,#fff,transparent 70%),radial-gradient(2.2px 2.2px at 18% 92%,#ffe9a8,transparent 70%),radial-gradient(1.6px 1.6px at 52% 96%,#fff,transparent 70%),radial-gradient(2px 2px at 78% 90%,#fff,transparent 70%);animation:tw 3.2s ease-in-out infinite alternate}
.twinkle::after{content:"";background-image:radial-gradient(1.8px 1.8px at 15% 35%,#fff,transparent 70%),radial-gradient(2.2px 2.2px at 36% 15%,#ffe9a8,transparent 70%),radial-gradient(1.6px 1.6px at 58% 4%,#fff,transparent 70%),radial-gradient(2px 2px at 77% 30%,#fff,transparent 70%),radial-gradient(1.6px 1.6px at 92% 75%,#fff,transparent 70%),radial-gradient(2px 2px at 9% 80%,#fff,transparent 70%),radial-gradient(2.2px 2.2px at 40% 88%,#fff,transparent 70%),radial-gradient(1.8px 1.8px at 64% 82%,#ffe9a8,transparent 70%);animation:tw 4.1s ease-in-out -2s infinite alternate-reverse}
@keyframes tw{from{opacity:.15}to{opacity:1}}
header{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:10px 22px;margin-bottom:clamp(10px,2cqw,26px);text-align:center}
.titles{display:flex;flex-direction:column;align-items:center}
.title{margin:0;font-family:var(--font-title);font-weight:800;font-size:clamp(34px,7cqw,84px);line-height:.95;color:var(--title);letter-spacing:.04em;text-shadow:0 4px 0 rgba(0,0,0,.25),0 0 30px color-mix(in srgb,var(--title) 40%,transparent)}
.subtitle{font-size:clamp(13px,1.6cqw,18px);opacity:.9;margin-top:4px;font-weight:600}
.chip{display:inline-flex;align-items:center;gap:10px;padding:6px 14px 6px 6px;border-radius:999px;background:rgba(255,255,255,.14);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.25);font-weight:600;font-size:clamp(12px,1.4cqw,15px);box-shadow:0 6px 20px rgba(0,0,0,.18)}
.clock{background:var(--title);color:#1d2340;border-radius:999px;padding:3px 10px;font-weight:800;font-variant-numeric:tabular-nums}
.grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:clamp(8px,1.8cqw,24px);align-items:start}
.grid.with-axis{grid-template-columns:40px repeat(5,minmax(0,1fr))}
.day{display:flex;flex-direction:column;min-width:0}
.pill{background:var(--day);color:#fff;border-radius:999px;text-align:center;font-family:var(--font-title);font-style:italic;font-weight:800;letter-spacing:.08em;font-size:clamp(14px,2.1cqw,26px);padding:.35em .4em;box-shadow:0 5px 0 rgba(0,0,0,.18),inset 0 -3px 0 rgba(0,0,0,.12);text-shadow:0 2px 0 rgba(0,0,0,.28);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transition:transform .3s}
.date{text-align:center;font-size:12px;font-weight:600;opacity:.85;margin-top:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.window{margin-top:10px;background:var(--win);backdrop-filter:blur(var(--wblur));-webkit-backdrop-filter:blur(var(--wblur));border-radius:var(--r);overflow:hidden;color:var(--wtxt);box-shadow:0 12px 28px rgba(0,0,0,.25);border:1px solid rgba(255,255,255,.18)}
.day.today .pill{transform:translateY(-3px) scale(1.05);box-shadow:0 0 0 3px rgba(255,255,255,.75),0 0 26px var(--day)}
.day.today .window{box-shadow:0 0 0 3px color-mix(in srgb,var(--day) 70%,transparent),0 14px 34px rgba(0,0,0,.35)}
.day.holiday .window{opacity:.55;filter:grayscale(.4)}
.cell{position:relative;display:flex;align-items:center;gap:8px;min-height:clamp(48px,6cqw,64px);padding:6px 10px 6px 14px;border-bottom:2px solid color-mix(in srgb,var(--day) 30%,transparent);transition:background .2s,transform .15s}
.cell:last-child{border-bottom:none}
.st-stripe::before{content:"";position:absolute;left:0;top:7px;bottom:7px;width:5px;border-radius:0 5px 5px 0;background:var(--subj)}
.st-tinted{background:color-mix(in srgb,var(--subj) 20%,transparent)}
.st-solid{background:var(--subj);color:var(--subj-fg)}
.st-solid .ico{background:rgba(255,255,255,.22);color:inherit}
.cell.past{opacity:.6}
.time{display:flex;flex-direction:column;font-size:11px;line-height:1.15;font-weight:700;opacity:.7;font-variant-numeric:tabular-nums;flex:none}
.ico{flex:none;width:30px;height:30px;border-radius:50%;display:grid;place-items:center;background:color-mix(in srgb,var(--subj) 18%,transparent);color:var(--subj)}
.ico ha-icon{--mdc-icon-size:18px}
.info{min-width:0;flex:1}
.name{font-weight:800;font-size:clamp(12px,1.35cqw,16px);line-height:1.15;overflow-wrap:anywhere}
.meta{font-size:11px;opacity:.72;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cell.current{background:color-mix(in srgb,var(--subj) 16%,transparent);animation:pulse 2.4s ease-in-out infinite;opacity:1}
.st-solid.current{background:var(--subj)}
@keyframes pulse{0%,100%{box-shadow:inset 0 0 0 2px color-mix(in srgb,var(--subj) 70%,transparent)}50%{box-shadow:inset 0 0 0 4px var(--subj),0 0 18px var(--subj)}}
.prog{position:absolute;left:0;bottom:0;height:4px;background:var(--subj);border-radius:0 4px 4px 0;box-shadow:0 0 8px var(--subj)}
.st-solid .prog{background:#fff}
.now-badge{position:absolute;top:4px;right:6px;font-size:9px;font-weight:800;letter-spacing:.08em;background:var(--subj);color:var(--subj-fg);padding:1px 6px;border-radius:999px}
.st-solid .now-badge{background:#fff;color:#1d2340}
.cell.empty .name,.filler .name{opacity:.45;font-weight:600}
.editing .cell{cursor:pointer}
.editing .cell:hover{transform:scale(1.02);background:color-mix(in srgb,var(--day) 14%,transparent)}
.editing .st-solid:hover{background:var(--subj);filter:brightness(1.08)}
.brushing .cell{cursor:copy}
.cell.drop{outline:3px dashed var(--day);outline-offset:-4px;background:color-mix(in srgb,var(--day) 22%,transparent)}
.view .cell:not(.empty):not(.filler){cursor:pointer}
.add{margin-top:8px;border:2px dashed rgba(255,255,255,.6);background:rgba(255,255,255,.12);border-radius:12px;padding:6px;font-size:18px;cursor:pointer;color:var(--txt)}
footer{margin-top:clamp(12px,2cqw,28px);text-align:center;font-family:var(--font-title);font-size:clamp(13px,1.9cqw,24px);letter-spacing:.03em;opacity:.95;text-shadow:0 2px 6px rgba(0,0,0,.35)}
.timeline .window{position:relative}
.tl{position:relative}
.hline{position:absolute;left:0;right:0;border-top:1px dashed color-mix(in srgb,var(--wtxt) 22%,transparent)}
.tcell{position:absolute;left:4px;right:4px;border-radius:calc(var(--r) * .6);border-bottom:none;min-height:0;padding:4px 8px 4px 12px;overflow:hidden}
.tcell.small .meta,.tcell.small .time,.tcell.small .ico{display:none}
.nowline{position:absolute;left:-2px;right:-2px;height:0;border-top:3px solid #ff3d6e;z-index:3;box-shadow:0 0 10px #ff3d6e;pointer-events:none}
.nowline::before{content:"";position:absolute;left:-2px;top:-7px;width:11px;height:11px;border-radius:50%;background:#ff3d6e}
.axis{display:flex;flex-direction:column}
.axis .ghost{visibility:hidden}
.axis-body{position:relative;margin-top:10px}
.axis-body span{position:absolute;right:4px;transform:translateY(-50%);font-size:11px;font-weight:700;opacity:.85;font-variant-numeric:tabular-nums}
.narrow .grid{grid-template-columns:none;grid-auto-flow:column;grid-auto-columns:82%;overflow-x:auto;scroll-snap-type:x mandatory;padding:8px 10px 10px;margin:0 -10px;scroll-padding:0 10px;scrollbar-width:none}
.narrow .grid::-webkit-scrollbar{display:none}
.narrow .day{scroll-snap-align:center}
.narrow .axis{display:none}
.narrow .name{font-size:15px}
.pop-bg{position:absolute;inset:0;z-index:10;display:grid;place-items:center;background:rgba(5,10,30,.45);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);padding:16px}
.pop{width:min(360px,100%);background:#fff;color:#1d2340;border-radius:20px;padding:18px;box-shadow:0 20px 60px rgba(0,0,0,.4);border-top:8px solid var(--subj);animation:popin .25s cubic-bezier(.2,1.4,.5,1);font-family:var(--font-body)}
@keyframes popin{from{transform:scale(.85);opacity:0}}
.pop-head{display:flex;gap:12px;align-items:center;margin-bottom:10px}
.ico.big{width:46px;height:46px}.ico.big ha-icon{--mdc-icon-size:26px}
.pop-title{font-weight:800;font-size:19px;line-height:1.1}
.pop-sub{font-size:12px;opacity:.6}
.pop-row{padding:6px 0;border-top:1px solid #eef0f6;font-size:14px;display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.tag{background:color-mix(in srgb,var(--subj) 15%,#fff);border-radius:999px;padding:2px 9px;font-size:12px;font-weight:600}
.muted{opacity:.7;font-size:13px}
.pop-close{margin-top:10px;width:100%;border:none;border-radius:12px;padding:10px;font-weight:700;background:var(--subj);color:var(--subj-fg);cursor:pointer;font-family:inherit;font-size:14px}
`;

class OrarBoard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._data = null;
    this._editable = false;
    this._brush = null;
    this._width = 0;
    this._pop = null;
    this._scrolledToday = false;
    const root = this.shadowRoot;
    root.addEventListener("click", (e) => this._onClick(e));
    root.addEventListener("dragstart", (e) => this._onDragStart(e));
    root.addEventListener("dragover", (e) => this._onDragOver(e));
    root.addEventListener("dragleave", (e) => e.target.closest?.(".cell")?.classList.remove("drop"));
    root.addEventListener("drop", (e) => this._onDrop(e));
  }

  set data(v) {
    this._data = v;
    this._render();
  }
  get data() {
    return this._data;
  }

  /** Setează mai multe proprietăți cu o singură randare. */
  configure({ data, editable, brush }) {
    if (data !== undefined) this._data = data;
    if (editable !== undefined) this._editable = !!editable;
    if (brush !== undefined) this._brush = brush;
    this._render();
  }

  connectedCallback() {
    this._timer = setInterval(() => {
      if (!this._pop) this._render();
    }, 30000);
    this._ro = new ResizeObserver((entries) => {
      const w = Math.round(entries[0].contentRect.width);
      if (Math.abs(w - this._width) > 8) {
        this._width = w;
        cancelAnimationFrame(this._raf);
        this._raf = requestAnimationFrame(() => this._render());
      }
    });
    this._ro.observe(this);
  }

  disconnectedCallback() {
    clearInterval(this._timer);
    cancelAnimationFrame(this._raf);
    this._ro?.disconnect();
  }

  _emit(name, detail) {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }

  _render() {
    const root = this.shadowRoot;
    const d = this._data;
    if (!d) {
      root.innerHTML = `<style>${BOARD_CSS}</style><div class="loading">Se încarcă orarul…</div>`;
      return;
    }
    const a = appearanceOf(d);
    const now = new Date();
    const info = nowInfo(d, now);
    const w = this._width || this.clientWidth || 1200;
    const narrow = w < 640;
    const timeline = a.layout === "timeline";
    const opts = {
      useShort: w < 1000,
      timeline,
      range: timeline ? this._range(d) : null,
      maxRows: Math.max(d.periods?.length || 0, ...DAY_KEYS.map((k) => d.schedule?.[k]?.length || 0), 1),
    };
    const dates = weekDates(now);
    const prevScroll = root.querySelector(".grid")?.scrollLeft;
    const vars = [
      `--title:${a.title_color}`, `--txt:${a.text_color}`,
      `--font-title:${fontStack(a.title_font)}`, `--font-body:${fontStack(a.body_font)}`,
      `--dim:${a.bg_dim}`, `--bgblur:${a.bg_blur}px`, `--wblur:${a.window_blur}px`, `--r:${a.cell_radius}px`,
    ].join(";");
    const chip = statusText(info);
    const classes = ["board", narrow && "narrow", this._editable ? "editing" : "view", timeline && "timeline", this._brush && "brushing"];

    root.innerHTML = `<style>${BOARD_CSS}</style>
      <div class="${classes.filter(Boolean).join(" ")}" style="${esc(vars)}">
        <div class="bg" style="background:${esc(backgroundCss(a))}"></div>
        <div class="dim"></div>
        ${a.stars ? `<div class="twinkle"></div>` : ""}
        <header>
          <div class="titles">
            <h1 class="title">${esc(a.title)}</h1>
            ${a.subtitle ? `<div class="subtitle">${esc(a.subtitle)}</div>` : ""}
          </div>
          ${a.show_clock ? `<div class="chip"><span class="clock">${pad(now.getHours())}:${pad(now.getMinutes())}</span><span>${chip.emoji} ${esc(chip.text)}</span></div>` : ""}
        </header>
        <div class="grid ${timeline ? "with-axis" : ""}">
          ${timeline ? this._axisHtml(a, opts.range) : ""}
          ${DAYS.map((day, i) => this._dayHtml(d, a, day, info, dates[i], opts)).join("")}
        </div>
        ${a.show_footer && a.footer ? `<footer>${esc(a.footer)}</footer>` : ""}
        ${this._pop ? this._popHtml() : ""}
      </div>`;

    const grid = root.querySelector(".grid");
    if (narrow && grid) {
      if (prevScroll != null && this._scrolledToday) grid.scrollLeft = prevScroll;
      else {
        const today = root.querySelector(".day.today");
        if (today) grid.scrollLeft = today.offsetLeft - 16;
        this._scrolledToday = true;
      }
    }
  }

  _range(d) {
    let min = Infinity;
    let max = -Infinity;
    for (const k of DAY_KEYS) {
      for (const c of resolveDay(d, k)) {
        if (!c.valid || (!c.subject && !this._editable)) continue;
        min = Math.min(min, c.s);
        max = Math.max(max, c.e);
      }
    }
    if (!isFinite(min)) [min, max] = [8 * 60, 14 * 60];
    min = Math.floor(min / 60) * 60;
    max = Math.ceil(max / 60) * 60;
    return { min, max, ppm: 1.15 };
  }

  _axisHtml(a, range) {
    const labels = [];
    for (let m = range.min; m <= range.max; m += 60) {
      labels.push(`<span style="top:${(m - range.min) * range.ppm}px">${fromMin(m)}</span>`);
    }
    return `<div class="axis">
      <div class="pill ghost">.</div>${a.show_dates ? `<div class="date ghost">.</div>` : ""}
      <div class="axis-body" style="height:${(range.max - range.min) * range.ppm}px">${labels.join("")}</div>
    </div>`;
  }

  _dayHtml(d, a, day, info, date, o) {
    const ds = a.days[day.key];
    const isToday = info.dayKey === day.key && !info.holiday;
    const holiday = holidayFor(d, isoDate(date));
    const cells = resolveDay(d, day.key);
    const style = `--day:${ds.color};--win:${rgba(ds.window, ds.opacity)};--wtxt:${ds.text}`;
    let body;
    if (o.timeline) {
      const { min, max, ppm } = o.range;
      const lines = [];
      for (let m = min + 60; m < max; m += 60) lines.push(`<div class="hline" style="top:${(m - min) * ppm}px"></div>`);
      const items = cells
        .filter((c) => c.valid && (c.subject || this._editable))
        .map((c) => {
          const h = Math.max(18, (c.e - c.s) * ppm - 3);
          return this._cellHtml(c, day.key, info, a, o, isToday, `top:${(c.s - min) * ppm + 1}px;height:${h}px`, h < 44);
        })
        .join("");
      const nowLine =
        isToday && info.nm >= min && info.nm <= max ? `<div class="nowline" style="top:${(info.nm - min) * ppm}px"></div>` : "";
      body = `<div class="tl" style="height:${(max - min) * ppm}px">${lines.join("")}${items}${nowLine}</div>`;
    } else {
      const rows = [];
      for (let r = 0; r < o.maxRows; r++) {
        rows.push(r < cells.length ? this._cellHtml(cells[r], day.key, info, a, o, isToday) : this._fillerHtml(day.key, r));
      }
      body = rows.join("");
    }
    return `<section class="day ${isToday ? "today" : ""} ${holiday ? "holiday" : ""}" style="${esc(style)}">
      <div class="pill">${esc(day.name.toUpperCase())}</div>
      ${a.show_dates ? `<div class="date">${date.getDate()} ${MONTHS[date.getMonth()]}${holiday ? ` · 🏖️ ${esc(holiday)}` : ""}</div>` : ""}
      <div class="window">${body}</div>
      ${this._editable ? `<button class="add" data-add="${day.key}" title="Adaugă o oră">＋</button>` : ""}
    </section>`;
  }

  _cellHtml(c, dayKey, info, a, o, isToday, posStyle = "", small = false) {
    const s = c.subject;
    const isCur = a.show_now && isToday && info.current?.idx === c.idx;
    const isPast = isToday && s && c.valid && info.nm >= c.e;
    const color = s?.color || "#9aa0b5";
    const cls = ["cell", s ? `st-${a.cell_style}` : "empty", isCur && "current", isPast && "past", posStyle && "tcell", small && "small"];
    const style = `--subj:${color};--subj-fg:${contrastColor(color)};${posStyle}`;
    let inner = "";
    if (s || this._editable) {
      const name = s ? (o.useShort && s.short ? s.short : s.name) : "＋ alege";
      const meta = s
        ? [a.show_room && s.room ? `🚪 ${s.room}` : "", a.show_teacher && s.teacher ? s.teacher : "", c.cell.note ? `📝 ${c.cell.note}` : ""]
            .filter(Boolean)
            .join(" · ")
        : "";
      const progress = isCur ? Math.min(100, Math.max(0, ((info.nm - c.s) / (c.e - c.s)) * 100)) : 0;
      inner = `
        ${a.show_times && (s || this._editable) ? `<div class="time"><span>${esc(c.start || "--:--")}</span><span>${esc(c.end || "--:--")}</span></div>` : ""}
        ${a.show_icons && s?.icon ? `<div class="ico"><ha-icon icon="${esc(s.icon)}"></ha-icon></div>` : ""}
        <div class="info"><div class="name">${esc(name)}</div>${meta ? `<div class="meta">${esc(meta)}</div>` : ""}</div>
        ${isCur ? `<div class="prog" style="width:${progress.toFixed(1)}%"></div><div class="now-badge">ACUM</div>` : ""}`;
    }
    return `<div class="${cls.filter(Boolean).join(" ")}" style="${esc(style)}" data-day="${dayKey}" data-idx="${c.idx}" ${this._editable ? 'draggable="true"' : ""}>${inner}</div>`;
  }

  _fillerHtml(dayKey, idx) {
    return `<div class="cell filler" data-day="${dayKey}" data-idx="${idx}" data-filler="1">${
      this._editable ? `<div class="info"><div class="name">＋</div></div>` : ""
    }</div>`;
  }

  _popHtml() {
    const { c, dayKey } = this._pop;
    const s = c.subject;
    const items = splitItems(s.items);
    return `<div class="pop-bg" data-close="1">
      <div class="pop" style="--subj:${s.color};--subj-fg:${contrastColor(s.color)}">
        <div class="pop-head">
          ${s.icon ? `<div class="ico big"><ha-icon icon="${esc(s.icon)}"></ha-icon></div>` : ""}
          <div><div class="pop-title">${esc(s.name)}</div><div class="pop-sub">${DAY_NAME[dayKey]} · ora ${c.idx + 1}</div></div>
        </div>
        <div class="pop-row">🕐 ${esc(c.start)} – ${esc(c.end)} ${c.valid ? `(${c.e - c.s} min)` : ""}</div>
        ${s.teacher ? `<div class="pop-row">👩‍🏫 ${esc(s.teacher)}</div>` : ""}
        ${s.room ? `<div class="pop-row">🚪 ${esc(s.room)}</div>` : ""}
        ${c.cell.note ? `<div class="pop-row">📝 ${esc(c.cell.note)}</div>` : ""}
        ${items.length ? `<div class="pop-row">🎒 ${items.map((i) => `<span class="tag">${esc(i)}</span>`).join("")}</div>` : ""}
        ${s.notes ? `<div class="pop-row muted">${esc(s.notes)}</div>` : ""}
        <button class="pop-close" data-close="1">Închide</button>
      </div>
    </div>`;
  }

  _onClick(e) {
    const t = e.target;
    if (t.dataset?.close) {
      this._pop = null;
      this._render();
      return;
    }
    if (t.closest(".pop")) return;
    const add = t.closest("[data-add]");
    if (add) {
      this._emit("orar-cell-add", { day: add.dataset.add });
      return;
    }
    const cell = t.closest(".cell");
    if (!cell) return;
    const day = cell.dataset.day;
    const idx = Number(cell.dataset.idx);
    if (this._editable) {
      this._emit("orar-cell-click", { day, idx });
      return;
    }
    const c = resolveDay(this._data, day)[idx];
    if (c?.subject) {
      this._pop = { c, dayKey: day };
      this._render();
    }
  }

  _onDragStart(e) {
    const cell = e.target.closest?.(".cell");
    if (!cell || !this._editable || cell.dataset.filler) return;
    e.dataTransfer.setData("text/orar-cell", `${cell.dataset.day}:${cell.dataset.idx}`);
    e.dataTransfer.effectAllowed = "move";
  }

  _onDragOver(e) {
    const cell = e.target.closest?.(".cell");
    if (!cell || !this._editable) return;
    e.preventDefault();
    cell.classList.add("drop");
  }

  _onDrop(e) {
    const cell = e.target.closest?.(".cell");
    if (!cell || !this._editable) return;
    e.preventDefault();
    cell.classList.remove("drop");
    this._emit("orar-drop", {
      day: cell.dataset.day,
      idx: Number(cell.dataset.idx),
      subject: e.dataTransfer.getData("text/orar-subject") || null,
      from: e.dataTransfer.getData("text/orar-cell") || null,
    });
  }
}

/* ------------------------------------------------------------------ <orar-panel> */

const TABS = [
  { id: "board", icon: "🗓️", label: "Orar" },
  { id: "days", icon: "✏️", label: "Zile" },
  { id: "subjects", icon: "📚", label: "Materii" },
  { id: "bells", icon: "🔔", label: "Clopoțel" },
  { id: "look", icon: "🎨", label: "Themes" },
  { id: "holidays", icon: "🏖️", label: "Vacanțe" },
  { id: "settings", icon: "⚙️", label: "Setări" },
];

const PANEL_NARROW = `
  .look{grid-template-columns:1fr}
  .preview{position:static;order:-1}
  .slot{grid-template-columns:32px 1fr auto;grid-template-areas:"n s t" "n tm tm" "n no no"}
  .slot-n{grid-area:n;align-self:start}
  .slot select{grid-area:s}
  .slot-tools{grid-area:t}
  .slot-times{grid-area:tm}
  .slot-note{grid-area:no}
  .dayrow{grid-template-columns:1fr 1fr 1fr}
  .dayrow .pill-sm{grid-column:1 / -1}
  .hol{grid-template-columns:1fr 1fr}
  .hol input:first-child{grid-column:1 / -1}
  .fields{grid-template-columns:1fr}
  main{padding:10px}
`;

const PANEL_CSS = `
:host{display:block;height:100%;--accent:var(--primary-color,#3f7be0);color:var(--primary-text-color,#1d2340);background:var(--primary-background-color,#f2f4f8);font-family:var(--paper-font-body1_-_font-family,Roboto,sans-serif)}
*{box-sizing:border-box}
.shell{display:flex;flex-direction:column;height:100vh}
.topbar{display:flex;align-items:center;gap:12px;padding:0 16px;height:56px;flex:none;background:var(--app-header-background-color,var(--primary-color));color:var(--app-header-text-color,#fff);box-shadow:0 2px 6px rgba(0,0,0,.15)}
.brand{font-family:'Bebas Neue','Baloo 2',sans-serif;font-size:28px;letter-spacing:.06em;display:flex;align-items:center;gap:8px}
.entry-select{background:rgba(255,255,255,.15);color:inherit;border:1px solid rgba(255,255,255,.35);border-radius:10px;padding:6px 10px;font:inherit}
.entry-select option{color:#222}
.spacer{flex:1}
.save-state{font-size:13px;opacity:.9;white-space:nowrap}
.tabs{display:flex;gap:6px;padding:10px 16px;overflow-x:auto;flex:none;border-bottom:1px solid var(--divider-color,rgba(0,0,0,.12));background:var(--card-background-color,#fff);scrollbar-width:thin}
.tab{border:none;background:transparent;color:var(--primary-text-color,#1d2340);padding:8px 14px;border-radius:999px;font:inherit;font-weight:600;cursor:pointer;white-space:nowrap;transition:background .2s}
.tab:hover{background:color-mix(in srgb,var(--accent) 12%,transparent)}
.tab.active{background:var(--accent);color:var(--text-primary-color,#fff)}
main{flex:1;overflow:auto;padding:16px}
.wrap{max-width:1400px;margin:0 auto}
.card{background:var(--card-background-color,#fff);border-radius:16px;padding:16px;box-shadow:var(--ha-card-box-shadow,0 2px 8px rgba(0,0,0,.08));border:1px solid var(--divider-color,rgba(0,0,0,.12));margin-bottom:16px}
.card h3{margin:0 0 12px;font-size:16px;display:flex;align-items:center;gap:8px}
.muted{color:var(--secondary-text-color,#5f6680);font-size:13px}
.empty-state{text-align:center;padding:60px 20px;color:var(--secondary-text-color,#5f6680);font-size:16px}
button{font:inherit;cursor:pointer}
.btn,.primary,.ghost,.danger{border-radius:10px;padding:8px 14px;font-weight:600;border:1px solid var(--divider-color,rgba(0,0,0,.12));background:var(--card-background-color,#fff);color:var(--primary-text-color,#1d2340);transition:transform .1s,background .2s}
.btn:active,.primary:active,.ghost:active{transform:scale(.97)}
.primary{background:var(--accent);border-color:var(--accent);color:var(--text-primary-color,#fff)}
.ghost{background:transparent}
.danger{color:var(--error-color,#db4437)}
.danger.solid{background:var(--error-color,#db4437);color:#fff;border-color:transparent}
.row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
input,select,textarea{font:inherit;color:var(--primary-text-color,#1d2340);background:var(--secondary-background-color,#f5f5f5);border:1px solid var(--divider-color,rgba(0,0,0,.12));border-radius:10px;padding:8px 10px;min-width:0}
input:focus,select:focus,textarea:focus{outline:2px solid var(--accent);outline-offset:0}
input[type=color]{padding:2px;width:42px;height:36px;cursor:pointer}
input[type=range]{padding:0;accent-color:var(--accent);background:none;border:none}
input[type=checkbox]{width:18px;height:18px;accent-color:var(--accent)}
textarea{resize:vertical;min-height:54px;width:100%}
label{display:flex;flex-direction:column;gap:4px;font-size:12px;font-weight:600;color:var(--secondary-text-color,#5f6680)}
label.inline{flex-direction:row;align-items:center;gap:8px;font-size:14px;color:var(--primary-text-color,#1d2340);font-weight:500}
.note{padding:10px 14px;border-radius:12px;background:color-mix(in srgb,var(--accent) 10%,transparent);margin-bottom:12px;font-size:14px}
.board-tools{display:flex;flex-direction:column;gap:10px;margin-bottom:14px}
.palette{background:var(--card-background-color,#fff);border:1px solid var(--divider-color,rgba(0,0,0,.12));border-radius:16px;padding:10px 12px}
.hint{display:block;font-size:13px;color:var(--secondary-text-color,#5f6680);margin-bottom:8px}
.pal-chips{display:flex;flex-wrap:wrap;gap:6px}
.pchip,.schip{display:inline-flex;align-items:center;gap:6px;border:2px solid var(--c,#999);background:color-mix(in srgb,var(--c,#999) 14%,var(--card-background-color,#fff));color:var(--primary-text-color,#1d2340);border-radius:999px;padding:5px 12px 5px 8px;font-weight:600;font-size:13px;user-select:none;transition:transform .12s, box-shadow .2s}
.pchip ha-icon,.schip ha-icon{--mdc-icon-size:18px;color:var(--c)}
.pchip:hover,.schip:hover{transform:translateY(-2px)}
.pchip.sel,.schip.sel{background:var(--c);color:#fff;box-shadow:0 4px 14px color-mix(in srgb,var(--c) 60%,transparent)}
.pchip.sel ha-icon,.schip.sel ha-icon{color:#fff}
.pchip.erase{--c:#888}
.daypills{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}
.daypill{border:none;background:var(--c);color:#fff;border-radius:999px;padding:8px 18px;font-family:'Bebas Neue','Baloo 2',sans-serif;font-size:20px;letter-spacing:.06em;font-style:italic;opacity:.55;display:flex;flex-direction:column;align-items:center;line-height:1;transition:opacity .2s,transform .2s}
.daypill small{font-family:Roboto,sans-serif;font-style:normal;font-size:11px;letter-spacing:0;opacity:.9;margin-top:2px}
.daypill.sel{opacity:1;transform:scale(1.06);box-shadow:0 6px 16px color-mix(in srgb,var(--c) 50%,transparent)}
.slot{display:grid;grid-template-columns:36px minmax(160px,1.4fr) auto minmax(120px,1fr) auto;gap:10px;align-items:center;padding:10px;border-radius:14px;background:color-mix(in srgb,var(--c) 10%,var(--card-background-color,#fff));border-left:6px solid var(--c);margin-bottom:8px}
.slot-n{width:30px;height:30px;border-radius:50%;background:var(--c);color:#fff;display:grid;place-items:center;font-weight:800}
.slot-times{display:flex;align-items:flex-end;gap:6px}
.slot-times input{width:108px}
.slot-times label{font-size:11px}
.slot-times input.ovr{border-color:var(--accent);box-shadow:0 0 0 1px var(--accent)}
.slot-tools{display:flex;gap:4px}
.icon-btn{border:none;background:transparent;border-radius:8px;width:32px;height:32px;display:grid;place-items:center;font-size:16px;color:var(--primary-text-color,#1d2340)}
.icon-btn:hover{background:color-mix(in srgb,var(--accent) 14%,transparent)}
.icon-btn:disabled{opacity:.3;cursor:default}
.stats{display:flex;gap:12px;flex-wrap:wrap;margin:12px 0 4px}
.stat{padding:8px 12px;border-radius:12px;background:var(--secondary-background-color,#f3f4f8);font-size:13px}
.stat b{font-size:16px}
.sgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px}
.scard{border-radius:16px;background:var(--card-background-color,#fff);border:1px solid var(--divider-color,rgba(0,0,0,.12));overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.05)}
.scard-top{display:flex;gap:10px;align-items:center;padding:12px;background:linear-gradient(135deg,var(--c),color-mix(in srgb,var(--c) 70%,#000))}
.scard-top .ico-btn{width:44px;height:44px;border-radius:50%;border:none;background:rgba(255,255,255,.25);color:#fff;display:grid;place-items:center;flex:none;font-size:20px}
.scard-top .ico-btn ha-icon{--mdc-icon-size:26px}
.scard-name{flex:1;background:rgba(255,255,255,.92);color:#1d2340;font-weight:700;border:none}
.scard-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:12px}
.scard-grid .wide{grid-column:1 / -1}
.scard-foot{display:flex;align-items:center;justify-content:space-between;padding:0 12px 12px}
.uses{font-size:12px;font-weight:700;color:var(--c);background:color-mix(in srgb,var(--c) 14%,transparent);padding:3px 10px;border-radius:999px}
.periods .prow{display:grid;grid-template-columns:70px auto auto auto 1fr auto;gap:10px;align-items:center;padding:8px 0;border-bottom:1px dashed var(--divider-color,rgba(0,0,0,.12))}
.dur{font-size:12px;color:var(--secondary-text-color,#5f6680)}
.gen{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px;align-items:end}
.look{display:grid;grid-template-columns:minmax(320px,460px) minmax(0,1fr);gap:16px;align-items:start}
.preview{position:sticky;top:0}
.themes{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:8px}
.theme{border:2px solid var(--divider-color,rgba(0,0,0,.12));border-radius:14px;padding:6px;background:var(--card-background-color,#fff);display:flex;flex-direction:column;gap:6px;align-items:stretch;color:var(--primary-text-color,#1d2340);font-weight:600;font-size:13px}
.theme:hover{border-color:var(--accent)}
.theme .sw{height:42px;border-radius:9px;display:flex;align-items:flex-end;gap:3px;padding:5px;background-size:cover !important}
.theme .sw i{flex:1;height:10px;border-radius:4px}
.presets{display:grid;grid-template-columns:repeat(auto-fill,minmax(84px,1fr));gap:8px}
.preset{height:58px;border-radius:12px;border:3px solid transparent;position:relative;overflow:hidden;color:#fff;font-size:12px;font-weight:700;display:flex;align-items:flex-end;padding:4px 6px;text-shadow:0 1px 3px rgba(0,0,0,.7);background-size:cover !important}
.preset.sel{border-color:var(--accent);box-shadow:0 0 0 2px var(--card-background-color,#fff) inset}
.seg{display:inline-flex;border:1px solid var(--divider-color,rgba(0,0,0,.12));border-radius:12px;overflow:hidden}
.seg button{border:none;background:transparent;padding:8px 14px;color:var(--primary-text-color,#1d2340);font-weight:600}
.seg button.sel{background:var(--accent);color:var(--text-primary-color,#fff)}
.slider{flex-direction:row;align-items:center;gap:10px}
.slider input{flex:1}
.slider output{min-width:44px;text-align:right;font-variant-numeric:tabular-nums;color:var(--primary-text-color,#1d2340)}
.dayrow{display:grid;grid-template-columns:92px repeat(3,minmax(0,1fr));gap:8px 10px;align-items:center;padding:10px 0;border-bottom:1px dashed var(--divider-color,rgba(0,0,0,.12))}
.dayrow .slider{grid-column:1 / -1}
.dayrow label{flex-direction:row;align-items:center;gap:6px}
.pill-sm{background:var(--c);color:#fff;border-radius:999px;padding:4px 10px;font-family:'Bebas Neue','Baloo 2',sans-serif;font-size:17px;letter-spacing:.05em;font-style:italic;text-align:center}
.toggles{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:8px}
.fields{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.fields .wide{grid-column:1 / -1}
.hol{display:grid;grid-template-columns:minmax(140px,1fr) auto auto auto auto;gap:10px;align-items:center;padding:8px 0;border-bottom:1px dashed var(--divider-color,rgba(0,0,0,.12))}
.badge{font-size:12px;font-weight:700;padding:3px 10px;border-radius:999px;background:color-mix(in srgb,var(--accent) 15%,transparent)}
pre{background:var(--secondary-background-color,#f3f4f8);border-radius:12px;padding:12px;overflow:auto;font-size:12.5px;line-height:1.45}
.modal-bg{position:fixed;inset:0;z-index:100;background:rgba(0,0,0,.5);display:grid;place-items:center;padding:16px;animation:fade .2s}
@keyframes fade{from{opacity:0}}
.modal{width:min(620px,100%);max-height:calc(100vh - 32px);overflow:auto;background:var(--card-background-color,#fff);border-radius:22px;box-shadow:0 30px 80px rgba(0,0,0,.4);animation:rise .25s cubic-bezier(.2,1.3,.5,1)}
@keyframes rise{from{transform:translateY(30px) scale(.96);opacity:0}}
.modal-head{padding:16px 18px;display:flex;align-items:center;gap:10px;font-size:18px;font-weight:700;background:linear-gradient(135deg,var(--c),color-mix(in srgb,var(--c) 65%,#000));color:#fff}
.modal-head .pill-sm{background:rgba(255,255,255,.25)}
.modal-body{padding:16px 18px;display:flex;flex-direction:column;gap:14px}
.chip-grid{display:flex;flex-wrap:wrap;gap:8px;max-height:260px;overflow:auto;padding:2px}
.dlg-times{display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap}
.modal-foot{display:flex;gap:8px;padding:0 18px 18px;flex-wrap:wrap}
.icon-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(48px,1fr));gap:6px}
.icon-grid button{height:48px;border-radius:12px;border:1px solid var(--divider-color,rgba(0,0,0,.12));background:var(--secondary-background-color,#f3f4f8);color:var(--primary-text-color,#1d2340);display:grid;place-items:center}
.icon-grid button:hover{background:var(--accent);color:#fff}
#toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%) translateY(120px);background:#1d2340;color:#fff;padding:12px 20px;border-radius:14px;font-weight:600;box-shadow:0 10px 30px rgba(0,0,0,.3);transition:transform .35s cubic-bezier(.2,1.3,.5,1);z-index:200;max-width:90vw}
#toast.show{transform:translateX(-50%) translateY(0)}
/* reguli pentru ecrane înguste: se aplică după fereastră (panou) și după lățimea containerului (card) */
@media (max-width:900px){${PANEL_NARROW}}
@container orar (max-width:900px){${PANEL_NARROW}}
:host([embed]){height:auto;background:transparent}
.shell{container:orar / inline-size}
.shell.embed{height:auto}
.embed main{overflow:visible;padding:0}
.embed .card{box-shadow:none}
.embed .look{grid-template-columns:1fr}
.embed .preview{display:none}
.ehead{display:flex;align-items:center;gap:10px;margin-bottom:12px}
.etitle{flex:1;font-size:17px;font-weight:800;display:flex;align-items:center;gap:8px}
.etitle ha-icon{color:var(--accent)}
.embed .save-state{font-size:12px;color:var(--secondary-text-color,#5f6680)}

`;

class OrarPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._tab = localGet("orar.tab") || "board";
    this._editDay = DAY_KEYS[Math.min(4, (new Date().getDay() + 6) % 7)];
    this._editMode = false;
    this._brush = null;
    this._dirty = new Set();
    this._lastEdit = 0;
    this._subFilter = "";
    this._gen = { first: "08:00", len: 50, brk: 10, bigAfter: 3, bigLen: 20, count: 6 };
    const root = this.shadowRoot;
    root.addEventListener("click", (e) => this._onClick(e));
    root.addEventListener("input", (e) => this._onInput(e));
    root.addEventListener("change", (e) => this._onInput(e));
    root.addEventListener("dragstart", (e) => {
      const chip = e.target.closest?.("[data-drag-subject]");
      if (chip) e.dataTransfer.setData("text/orar-subject", chip.dataset.dragSubject);
    });
    root.addEventListener("orar-cell-click", (e) => this._onCellClick(e.detail));
    root.addEventListener("orar-cell-add", (e) => this._onCellAdd(e.detail));
    root.addEventListener("orar-drop", (e) => this._onDrop(e.detail));
    this._onKey = (e) => {
      if (e.key === "Escape" && this._dlg) this._closeModal();
    };
  }

  set hass(h) {
    const first = !this._hass;
    this._hass = h;
    if (this._menu) this._menu.hass = h;
    if (first) this._init();
  }
  get hass() {
    return this._hass;
  }
  set narrow(n) {
    this._narrow = n;
    if (this._menu) this._menu.narrow = n;
  }
  set panel(p) {
    this._panel = p;
  }
  set route(r) {
    this._route = r;
  }

  get isAdmin() {
    return !!this._hass?.user?.is_admin;
  }

  /**
   * Mod încorporat în cardul Lovelace: un singur tab (Themes / Materii / Orar), fără bara de sus.
   * Se poate apela din nou ca să schimbi tabul.
   */
  setEmbed({ tab, entryId, linked = false }) {
    const changedEntry = this._embed && entryId && entryId !== this._entryId;
    this._embed = true;
    this._tab = tab;
    this._embedLinked = linked;
    this._fixedEntry = entryId;
    this.setAttribute("embed", "");
    if (!this._hass) return;
    if (changedEntry) {
      this._entryId = entryId;
      this._subscribe();
    }
    this._renderShell();
  }

  /** În modul încorporat, cardul primește datele modificate imediat (fără să aștepte serverul). */
  _emitPreview() {
    if (this._embed && this._data) this.dispatchEvent(new CustomEvent("orar-preview", { detail: this._data }));
  }

  connectedCallback() {
    window.addEventListener("keydown", this._onKey);
    if (this._hass && this._entryId && !this._unsub) this._subscribe();
  }

  disconnectedCallback() {
    window.removeEventListener("keydown", this._onKey);
    this._unsub?.then((u) => u()).catch(() => {});
    this._unsub = null;
  }

  async _init() {
    this._renderShell();
    try {
      this._entries = await this._hass.callWS({ type: "orar/list" });
    } catch (err) {
      this._entries = [];
    }
    if (this._entries.length) {
      const saved = this._fixedEntry || localGet("orar.entry");
      this._entryId = (this._entries.find((e) => e.entry_id === saved) || this._entries[0]).entry_id;
      this._subscribe();
    }
    this._renderShell();
  }

  async _subscribe() {
    if (this._unsub) {
      const old = this._unsub;
      this._unsub = null;
      old.then((u) => u()).catch(() => {});
    }
    this._data = null;
    this._renderTab();
    this._unsub = this._hass.connection.subscribeMessage((m) => this._onData(m), {
      type: "orar/subscribe",
      entry_id: this._entryId,
    });
  }

  _onData(m) {
    // Modificările locale nesalvate au prioritate față de ecoul de la server.
    if (this._data && (this._dirty.size || this._saving || Date.now() - this._lastEdit < 2000)) return;
    if (this._data && JSON.stringify(m.data) === JSON.stringify(this._data)) return;
    this._data = clone(m.data);
    if (!this._dlg) this._renderTab();
  }

  /* ---------------------------------------------------------------- schelet */

  _renderShell() {
    if (this._embed) {
      const t = TABS.find((x) => x.id === this._tab) || TABS[0];
      const icon = { look: "mdi:palette-outline", subjects: "mdi:bookshelf", days: "mdi:clock-edit-outline" }[t.id] || "mdi:timetable";
      this.shadowRoot.innerHTML = `<style>${PANEL_CSS}</style>
        <div class="shell embed">
          <div class="ehead">
            <span class="etitle"><ha-icon icon="${icon}"></ha-icon>${t.id === "days" ? "Orar: materii și ore" : t.label}</span>
            <span class="save-state" id="save-state"></span>
            <button class="icon-btn" data-action="embed-close" title="Închide">✕</button>
          </div>
          <main id="content"></main>
          <div id="modal"></div>
          <div id="toast"></div>
        </div>`;
      this._renderTab();
      return;
    }
    const entries = this._entries || [];
    const tabs = this.isAdmin ? TABS : TABS.slice(0, 1);
    this.shadowRoot.innerHTML = `<style>${PANEL_CSS}</style>
      <div class="shell">
        <div class="topbar">
          <div class="menu-slot"></div>
          <div class="brand">🗓️ ORAR</div>
          ${entries.length > 1 ? `<select class="entry-select" data-entry>${entries
            .map((e) => `<option value="${e.entry_id}" ${e.entry_id === this._entryId ? "selected" : ""}>${esc(e.title)}</option>`)
            .join("")}</select>` : ""}
          <div class="spacer"></div>
          <span class="save-state" id="save-state"></span>
        </div>
        <nav class="tabs">${tabs
          .map((t) => `<button class="tab ${t.id === this._tab ? "active" : ""}" data-tab="${t.id}">${t.icon} ${t.label}</button>`)
          .join("")}</nav>
        <main id="content"></main>
        <div id="modal"></div>
        <div id="toast"></div>
      </div>`;
    this._menu = document.createElement("ha-menu-button");
    this._menu.hass = this._hass;
    this._menu.narrow = this._narrow;
    this.shadowRoot.querySelector(".menu-slot").appendChild(this._menu);
    this._renderTab();
  }

  _renderTab() {
    const root = this.shadowRoot;
    const content = root.getElementById("content");
    if (!content) return;
    root.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === this._tab));
    if (this._entries && !this._entries.length) {
      content.innerHTML = `<div class="empty-state">📭 Nu există niciun orar.<br><br>Adaugă integrarea <b>ORAR</b> din
        <i>Setări → Dispozitive și servicii → Adaugă integrare</i>.</div>`;
      return;
    }
    if (!this._data) {
      content.innerHTML = `<div class="empty-state">⏳ Se încarcă orarul…</div>`;
      return;
    }
    const tab = this.isAdmin ? this._tab : "board";
    const scroll = content.scrollTop;
    content.innerHTML = `<div class="wrap">${this[`_tab_${tab}`]()}</div>`;
    content.scrollTop = scroll;
    if (tab === "board") {
      root.getElementById("main-board")?.configure({ data: this._data, editable: this._editMode, brush: this._brush });
    }
    if (tab === "look") root.getElementById("preview-board")?.configure({ data: this._data });
  }

  _refreshBoards() {
    this.shadowRoot.querySelectorAll("orar-board").forEach((b) => (b.data = this._data));
    this._emitPreview();
  }

  /* ---------------------------------------------------------------- salvare */

  _touch(...keys) {
    keys.forEach((k) => this._dirty.add(k));
    this._lastEdit = Date.now();
    this._setSaveState("pending");
    queueMicrotask(() => this._emitPreview());
    clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => this._flush(), 600);
  }

  async _flush() {
    if (!this._dirty.size || this._saving) return;
    const payload = {};
    this._dirty.forEach((k) => (payload[k] = this._data[k]));
    this._dirty.clear();
    this._saving = true;
    this._setSaveState("saving");
    try {
      await this._hass.callWS({ type: "orar/save", entry_id: this._entryId, data: payload });
      this._setSaveState("ok");
    } catch (err) {
      this._setSaveState("err");
      this._toast(`❌ Eroare la salvare: ${err.message || err.code || err}`);
    } finally {
      this._saving = false;
      this._lastEdit = Date.now();
      if (this._dirty.size) this._flush();
    }
  }

  _setSaveState(s) {
    const el = this.shadowRoot.getElementById("save-state");
    if (!el) return;
    el.textContent = { pending: "✏️ Modificat…", saving: "💾 Se salvează…", ok: "✅ Salvat", err: "⚠️ Nesalvat" }[s] || "";
    clearTimeout(this._stateTimer);
    if (s === "ok") this._stateTimer = setTimeout(() => (el.textContent = ""), 2500);
  }

  _toast(msg) {
    const t = this.shadowRoot.getElementById("toast");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => t.classList.remove("show"), 2800);
  }

  /* ---------------------------------------------------------------- ajutoare de date */

  _cells(day) {
    return (this._data.schedule[day] = this._data.schedule[day] || []);
  }

  _ensureCell(day, idx) {
    const cells = this._cells(day);
    while (cells.length <= idx) cells.push(emptyCell());
    return cells[idx];
  }

  _trim(day) {
    const cells = this._cells(day);
    while (cells.length) {
      const c = cells[cells.length - 1];
      if (c.subject || c.start || c.end || c.note) break;
      cells.pop();
    }
  }

  _uses(id) {
    return DAY_KEYS.reduce((n, k) => n + this._cells(k).filter((c) => c.subject === id).length, 0);
  }

  _subjectChip(s, cls, attrs) {
    return `<button class="${cls}" style="--c:${s.color}" ${attrs}>${s.icon ? `<ha-icon icon="${esc(s.icon)}"></ha-icon>` : ""}<span>${esc(s.short || s.name)}</span></button>`;
  }

  /* ---------------------------------------------------------------- tab: Orar */

  _tab_board() {
    const d = this._data;
    if (!this.isAdmin) {
      return `<div class="note">👀 Poți vedea orarul; doar administratorii îl pot modifica. Atinge o materie pentru detalii.</div>
        <orar-board id="main-board"></orar-board>`;
    }
    const hint = this._brush === "__erase"
      ? "🧽 Radiera e activă: atinge celulele pe care vrei să le golești."
      : this._brush
        ? `🖌️ Pensula „${esc(d.subjects.find((s) => s.id === this._brush)?.name || "")}” e activă: atinge celulele ca să pui materia.`
        : "Trage o materie pe o celulă, alege o „pensulă” sau atinge o celulă pentru meniul complet. Poți trage și celulele între ele ca să le schimbi.";
    return `<div class="board-tools">
        <div class="row">
          <button class="${this._editMode ? "primary" : "btn"}" data-action="toggle-edit">${this._editMode ? "✅ Gata cu editarea" : "✏️ Editează orarul"}</button>
          ${this._editMode ? "" : `<span class="muted">Atinge o materie pentru detalii (profesor, sală, ce iei în ghiozdan).</span>`}
        </div>
        ${this._editMode ? `<div class="palette">
          <span class="hint">${hint}</span>
          <div class="pal-chips">
            ${d.subjects.map((s) => this._subjectChip(s, `pchip ${this._brush === s.id ? "sel" : ""}`, `draggable="true" data-drag-subject="${s.id}" data-action="brush" data-id="${s.id}"`)).join("")}
            <button class="pchip erase ${this._brush === "__erase" ? "sel" : ""}" data-action="brush" data-id="__erase">🧽 Radieră</button>
          </div>
        </div>` : ""}
      </div>
      <orar-board id="main-board"></orar-board>`;
  }

  _onCellClick({ day, idx }) {
    if (this._brush) {
      this._paint(day, idx, this._brush === "__erase" ? null : this._brush);
      return;
    }
    this._openCellDialog(day, idx);
  }

  _onCellAdd({ day }) {
    const idx = this._cells(day).length;
    this._openCellDialog(day, idx);
  }

  _onDrop({ day, idx, subject, from }) {
    if (subject) {
      this._paint(day, idx, subject);
      return;
    }
    if (!from) return;
    const [fd, fi] = from.split(":");
    const fidx = Number(fi);
    if (fd === day && fidx === idx) return;
    const a = this._ensureCell(fd, fidx);
    const b = this._ensureCell(day, idx);
    [a.subject, b.subject] = [b.subject, a.subject];
    [a.note, b.note] = [b.note, a.note];
    this._trim(fd);
    this._trim(day);
    this._touch("schedule");
    this._refreshBoards();
    this._toast("🔀 Ore schimbate între ele");
  }

  _paint(day, idx, subjectId) {
    const cell = this._ensureCell(day, idx);
    cell.subject = subjectId;
    if (!subjectId) cell.note = "";
    this._trim(day);
    this._touch("schedule");
    this._refreshBoards();
  }

  /* ---------------------------------------------------------------- dialog celulă */

  _openCellDialog(day, idx) {
    const cell = this._data.schedule[day]?.[idx] || emptyCell();
    this._dlg = { kind: "cell", day, idx, subject: cell.subject, note: cell.note, start: cell.start, end: cell.end };
    this._renderModal();
  }

  _renderModal() {
    const m = this.shadowRoot.getElementById("modal");
    if (!this._dlg) {
      m.innerHTML = "";
      return;
    }
    m.innerHTML = this._dlg.kind === "cell" ? this._cellDialogHtml() : this._iconDialogHtml();
    m.querySelector("[data-dlg-search]")?.focus();
  }

  _cellDialogHtml() {
    const { day, idx, subject, note, start, end } = this._dlg;
    const p = this._data.periods[idx] || {};
    const color = appearanceOf(this._data).days[day].color;
    return `<div class="modal-bg" data-modal-bg>
      <div class="modal" role="dialog" aria-label="Editează ora">
        <div class="modal-head" style="--c:${color}"><span class="pill-sm">${DAY_NAME[day].toUpperCase()}</span> Ora ${idx + 1}</div>
        <div class="modal-body">
          <input placeholder="🔍 Caută materia…" data-dlg-search>
          <div class="chip-grid">
            <button class="schip ${!subject ? "sel" : ""}" style="--c:#8a8fa3" data-action="dlg-subj" data-id="" data-name="liber">— Liber —</button>
            ${this._data.subjects.map((s) => `<button class="schip ${s.id === subject ? "sel" : ""}" style="--c:${s.color}" data-action="dlg-subj" data-id="${s.id}" data-name="${esc(`${s.name} ${s.short}`.toLowerCase())}">${s.icon ? `<ha-icon icon="${esc(s.icon)}"></ha-icon>` : ""}<span>${esc(s.name)}</span></button>`).join("")}
          </div>
          <div class="dlg-times">
            <label>Început<input type="time" data-dlg="start" value="${esc(start || p.start || "")}"></label>
            <label>Sfârșit<input type="time" data-dlg="end" value="${esc(end || p.end || "")}"></label>
            <button class="ghost" data-action="dlg-reset-times" title="Folosește orele din Clopoțel">↺ Ore standard</button>
          </div>
          <label>Notiță<input data-dlg="note" maxlength="200" placeholder="📝 ex: test, temă, sală schimbată" value="${esc(note)}"></label>
        </div>
        <div class="modal-foot">
          <button class="danger ghost" data-action="dlg-clear">🧽 Golește</button>
          <span class="spacer"></span>
          <button class="ghost" data-action="dlg-close">Anulează</button>
          <button class="primary" data-action="dlg-save">💾 Salvează</button>
        </div>
      </div>
    </div>`;
  }

  _saveCellDialog() {
    const m = this.shadowRoot.getElementById("modal");
    const { day, idx } = this._dlg;
    const p = this._data.periods[idx] || {};
    const start = m.querySelector('[data-dlg="start"]').value;
    const end = m.querySelector('[data-dlg="end"]').value;
    if (start && end && toMin(end) <= toMin(start)) {
      this._toast("⚠️ Ora de sfârșit trebuie să fie după cea de început");
      return;
    }
    const cell = this._ensureCell(day, idx);
    cell.subject = this._dlg.subject || null;
    // ore egale cu cele standard = fără personalizare
    cell.start = start && start !== p.start ? start : "";
    cell.end = end && end !== p.end ? end : "";
    cell.note = m.querySelector('[data-dlg="note"]').value;
    this._trim(day);
    this._touch("schedule");
    this._closeModal();
    this._renderTab();
  }

  _closeModal() {
    this._dlg = null;
    this._renderModal();
  }

  _iconDialogHtml() {
    const s = this._data.subjects.find((x) => x.id === this._dlg.id);
    return `<div class="modal-bg" data-modal-bg>
      <div class="modal" role="dialog" aria-label="Alege iconița">
        <div class="modal-head" style="--c:${s?.color || "#3f7be0"}">🎨 Iconiță pentru ${esc(s?.name || "")}</div>
        <div class="modal-body">
          <div class="icon-grid">${ICONS.map((i) => `<button data-action="icon-pick" data-icon="${i}" title="${i}"><ha-icon icon="${i}"></ha-icon></button>`).join("")}</div>
          <label>Sau scrie orice iconiță MDI (ex: mdi:chess-queen)
            <div class="row"><input data-dlg="icon" value="${esc(s?.icon || "")}" style="flex:1"><button class="primary" data-action="icon-custom">Folosește</button></div>
          </label>
        </div>
        <div class="modal-foot"><span class="spacer"></span><button class="ghost" data-action="dlg-close">Închide</button></div>
      </div>
    </div>`;
  }

  _setIcon(icon) {
    const s = this._data.subjects.find((x) => x.id === this._dlg.id);
    if (s) {
      s.icon = icon;
      this._touch("subjects");
    }
    this._closeModal();
    this._renderTab();
  }

  /* ---------------------------------------------------------------- tab: Zile */

  _tab_days() {
    const d = this._data;
    const day = this._editDay;
    const a = appearanceOf(d);
    const smap = subjectMap(d);
    const cells = this._cells(day);
    const lessons = dayLessons(d, day);
    const minutes = lessons.reduce((n, l) => n + (l.e - l.s), 0);
    const pills = DAYS.map((x) => `<button class="daypill ${x.key === day ? "sel" : ""}" style="--c:${a.days[x.key].color}" data-action="day-select" data-day="${x.key}">${x.name.toUpperCase()}<small>${dayLessons(d, x.key).length} ore</small></button>`).join("");

    const rows = cells.map((c, i) => {
      const p = d.periods[i] || {};
      const s = smap[c.subject];
      return `<div class="slot" style="--c:${s?.color || "#a0a4b8"}">
        <div class="slot-n">${i + 1}</div>
        <select data-bind="schedule.${day}.${i}.subject" data-type="nullable" data-rerender>
          <option value="">— liber —</option>
          ${d.subjects.map((x) => `<option value="${x.id}" ${x.id === c.subject ? "selected" : ""}>${esc(x.name)}</option>`).join("")}
        </select>
        <div class="slot-times">
          <label>Început<input type="time" class="${c.start ? "ovr" : ""}" value="${esc(c.start || p.start || "")}" data-time="start" data-i="${i}"></label>
          <label>Sfârșit<input type="time" class="${c.end ? "ovr" : ""}" value="${esc(c.end || p.end || "")}" data-time="end" data-i="${i}"></label>
          ${c.start || c.end ? `<button class="icon-btn" data-action="slot-reset" data-i="${i}" title="Revino la orele standard">↺</button>` : ""}
        </div>
        <input class="slot-note" maxlength="200" placeholder="📝 notiță" value="${esc(c.note)}" data-bind="schedule.${day}.${i}.note" data-live>
        <div class="slot-tools">
          <button class="icon-btn" data-action="slot-move" data-i="${i}" data-dir="-1" ${i === 0 ? "disabled" : ""} title="Mută în sus">⬆️</button>
          <button class="icon-btn" data-action="slot-move" data-i="${i}" data-dir="1" ${i === cells.length - 1 ? "disabled" : ""} title="Mută în jos">⬇️</button>
          <button class="icon-btn" data-action="slot-del" data-i="${i}" title="Șterge rândul">🗑️</button>
        </div>
      </div>`;
    }).join("");

    return `<div class="card">
        <h3>✏️ Editează orarul pe zile</h3>
        <div class="daypills">${pills}</div>
        ${this._embedLinked ? `<div class="note">👆 Poți atinge și direct o celulă din orarul de mai sus ca să alegi materia, ora de început și ora de sfârșit.</div>` : ""}
        ${rows || `<div class="empty-state">Nicio oră în ${DAY_NAME[day]}. Adaugă prima oră 👇</div>`}
        <div class="row" style="margin-top:12px">
          <button class="primary" data-action="slot-add">＋ Adaugă oră</button>
          <button class="btn" data-action="day-standard" title="Șterge orele personalizate din această zi">🔔 Ore standard</button>
          <select data-copy-day>
            <option value="">📋 Copiază ziua în…</option>
            ${DAYS.filter((x) => x.key !== day).map((x) => `<option value="${x.key}">${x.name}</option>`).join("")}
            <option value="__all">Toate celelalte zile</option>
          </select>
          <button class="danger ghost" data-action="day-clear">🧹 Golește ziua</button>
        </div>
        <div class="stats">
          <div class="stat">📚 <b>${lessons.length}</b> ore</div>
          <div class="stat">⏱️ <b>${Math.floor(minutes / 60)}h ${minutes % 60}m</b> la clasă</div>
          ${lessons.length ? `<div class="stat">🕗 <b>${lessons[0].start} – ${lessons[lessons.length - 1].end}</b></div>` : ""}
        </div>
        <p class="muted">Orele cu chenar colorat sunt personalizate; celelalte vin automat din tabul 🔔 Clopoțel.</p>
      </div>`;
  }

  /* ---------------------------------------------------------------- tab: Materii */

  _tab_subjects() {
    const d = this._data;
    const q = this._subFilter.toLowerCase();
    const cards = d.subjects
      .map((s, i) => ({ s, i }))
      .filter(({ s }) => !q || `${s.name} ${s.short} ${s.teacher}`.toLowerCase().includes(q))
      .map(({ s, i }) => `<div class="scard live-c" style="--c:${s.color}" data-sid="${s.id}">
        <div class="scard-top">
          <button class="ico-btn" data-action="subj-icon" data-id="${s.id}" title="Alege iconița">${s.icon ? `<ha-icon icon="${esc(s.icon)}"></ha-icon>` : "＋"}</button>
          <input class="scard-name" maxlength="80" value="${esc(s.name)}" data-bind="subjects.${i}.name" placeholder="Nume materie">
          <input type="color" value="${s.color}" data-bind="subjects.${i}.color" title="Culoare">
        </div>
        <div class="scard-grid">
          <label>Prescurtare<input maxlength="24" value="${esc(s.short)}" data-bind="subjects.${i}.short" placeholder="ex: Mate"></label>
          <label>Sala<input maxlength="40" value="${esc(s.room)}" data-bind="subjects.${i}.room" placeholder="ex: 12"></label>
          <label class="wide">Profesor<input maxlength="80" value="${esc(s.teacher)}" data-bind="subjects.${i}.teacher" placeholder="ex: Prof. Popescu"></label>
          <label class="wide">🎒 De luat în ghiozdan<input maxlength="500" value="${esc(s.items)}" data-bind="subjects.${i}.items" placeholder="separă cu virgulă: atlas, compas"></label>
          <label class="wide">Observații<textarea maxlength="500" data-bind="subjects.${i}.notes">${esc(s.notes)}</textarea></label>
        </div>
        <div class="scard-foot">
          <span class="uses">${this._uses(s.id)} ore / săptămână</span>
          <button class="danger ghost" data-action="subj-del" data-id="${s.id}">🗑️ Șterge</button>
        </div>
      </div>`)
      .join("");
    return `<div class="card">
        <h3>📚 Baza de date de materii <span class="badge">${d.subjects.length}</span></h3>
        <div class="row">
          <button class="primary" data-action="subj-add">＋ Materie nouă</button>
          <button class="btn" data-action="subj-sort">🔤 Sortează A-Z</button>
          <input data-subj-filter placeholder="🔍 Caută…" value="${esc(this._subFilter)}" style="flex:1;min-width:160px">
        </div>
      </div>
      <div class="sgrid">${cards || `<div class="empty-state">Nicio materie găsită.</div>`}</div>`;
  }

  /* ---------------------------------------------------------------- tab: Clopoțel */

  _tab_bells() {
    const d = this._data;
    const g = this._gen;
    const rows = d.periods.map((p, i) => {
      const dur = toMin(p.end) - toMin(p.start);
      const prevEnd = i > 0 ? toMin(d.periods[i - 1].end) : null;
      const brk = prevEnd != null && toMin(p.start) != null ? toMin(p.start) - prevEnd : null;
      return `<div class="prow">
        <b>Ora ${i + 1}</b>
        <input type="time" value="${esc(p.start)}" data-bind="periods.${i}.start" data-bells>
        <span>–</span>
        <input type="time" value="${esc(p.end)}" data-bind="periods.${i}.end" data-bells>
        <span class="dur">${isFinite(dur) && dur > 0 ? `${dur} min` : ""}${brk != null && brk > 0 ? ` · pauză ${brk} min înainte` : ""}</span>
        <button class="icon-btn" data-action="per-del" data-i="${i}" title="Șterge">🗑️</button>
      </div>`;
    }).join("");
    return `<div class="card">
        <h3>⚡ Generator de ore</h3>
        <div class="gen">
          <label>Prima oră începe la<input type="time" value="${g.first}" data-gen="first"></label>
          <label>Durata orei (min)<input type="number" min="10" max="120" value="${g.len}" data-gen="len"></label>
          <label>Pauză (min)<input type="number" min="0" max="60" value="${g.brk}" data-gen="brk"></label>
          <label>Pauza mare după ora<input type="number" min="0" max="13" value="${g.bigAfter}" data-gen="bigAfter"></label>
          <label>Pauza mare (min)<input type="number" min="0" max="90" value="${g.bigLen}" data-gen="bigLen"></label>
          <label>Număr de ore<input type="number" min="1" max="14" value="${g.count}" data-gen="count"></label>
          <button class="primary" data-action="per-generate">⚡ Generează</button>
        </div>
      </div>
      <div class="card periods">
        <h3>🔔 Orele standard (clopoțelul)</h3>
        ${rows || `<div class="muted">Nu există ore standard.</div>`}
        <div class="row" style="margin-top:12px">
          <button class="btn" data-action="per-add">＋ Adaugă oră</button>
          <button class="btn" data-action="per-apply">🔁 Aplică tuturor zilelor</button>
        </div>
        <p class="muted">Fiecare celulă din orar care nu are ore personalizate folosește automat ora standard de pe același rând.
          „Aplică tuturor zilelor” șterge orele personalizate din toate celulele.</p>
      </div>`;
  }

  _generatePeriods() {
    const g = this._gen;
    let t = toMin(g.first) ?? 480;
    const periods = [];
    for (let i = 0; i < Math.min(14, Math.max(1, g.count)); i++) {
      if (t + g.len >= 24 * 60) break;
      periods.push({ start: fromMin(t), end: fromMin(t + g.len) });
      t += g.len + (i + 1 === g.bigAfter ? g.bigLen : g.brk);
    }
    this._data.periods = periods;
    this._touch("periods");
    this._renderTab();
    this._toast(`⚡ ${periods.length} ore generate`);
  }

  /* ---------------------------------------------------------------- tab: Aspect */

  _tab_look() {
    const a = appearanceOf(this._data);
    this._data.appearance = a;
    const toggle = (key, label) =>
      `<label class="inline"><input type="checkbox" data-bind="appearance.${key}" ${a[key] ? "checked" : ""}> ${label}</label>`;
    const slider = (key, label, min, max, step, fmt) =>
      `<label class="slider">${label}<input type="range" min="${min}" max="${max}" step="${step}" value="${a[key]}" data-bind="appearance.${key}" data-type="num" data-fmt="${fmt}"><output>${this._fmt(a[key], fmt)}</output></label>`;
    const fontSel = (key) =>
      `<select data-bind="appearance.${key}">${FONT_LIST.map((f) => `<option ${a[key] === f ? "selected" : ""} value="${f}" style="font-family:${fontStack(f)}">${f === "system" ? "Fontul sistemului" : f}</option>`).join("")}</select>`;

    return `<div class="look">
      <div>
        <div class="card">
          <h3>✨ Teme rapide</h3>
          <div class="themes">${THEMES.map((t) => `<button class="theme" data-action="theme" data-id="${t.id}">
            <div class="sw" style="background:${esc(BG_PRESETS[t.a.bg_preset].css)}">${DAY_KEYS.map((k) => `<i style="background:${t.a.days[k].color}"></i>`).join("")}</div>
            ${t.emoji} ${t.label}</button>`).join("")}</div>
        </div>

        <div class="card">
          <h3>🖼️ Fundal</h3>
          <div class="seg" style="margin-bottom:12px">
            ${[["preset", "🌈 Teme"], ["image", "📷 Imagine"], ["color", "🎨 Culoare"]].map(([v, l]) => `<button class="${a.bg_type === v ? "sel" : ""}" data-action="bg-type" data-v="${v}">${l}</button>`).join("")}
          </div>
          ${a.bg_type === "preset" ? `<div class="presets">${Object.entries(BG_PRESETS).map(([k, p]) => `<button class="preset ${a.bg_preset === k ? "sel" : ""}" style="background:${esc(p.css)}" data-action="bg-preset" data-id="${k}">${p.label}</button>`).join("")}</div>` : ""}
          ${a.bg_type === "image" ? `<div class="row">
              <button class="primary" data-action="bg-upload">📤 Încarcă imagine</button>
              <input type="file" accept="image/*" id="bg-file" hidden>
              ${a.bg_image ? `<button class="danger ghost" data-action="bg-remove">Elimină</button>` : ""}
            </div>
            <label style="margin-top:10px">sau adresă URL<input value="${esc(a.bg_image)}" data-bind="appearance.bg_image" placeholder="https://… sau /local/fundal.jpg"></label>
            <label style="margin-top:10px">Potrivire<select data-bind="appearance.bg_size">
              <option value="cover" ${a.bg_size === "cover" ? "selected" : ""}>Umple tot (cover)</option>
              <option value="contain" ${a.bg_size === "contain" ? "selected" : ""}>Întreagă (contain)</option>
              <option value="tile" ${a.bg_size === "tile" ? "selected" : ""}>Repetată (mozaic)</option>
            </select></label>` : ""}
          ${a.bg_type === "color" ? `<label class="inline"><input type="color" value="${a.bg_color}" data-bind="appearance.bg_color"> Culoarea fundalului</label>` : ""}
          <div style="margin-top:12px;display:flex;flex-direction:column;gap:8px">
            ${slider("bg_dim", "Întunecare", 0, 0.9, 0.05, "pct")}
            ${slider("bg_blur", "Estompare", 0, 20, 1, "px")}
            ${toggle("stars", "⭐ Stele sclipitoare animate")}
          </div>
        </div>

        <div class="card">
          <h3>🪟 Ferestrele zilelor</h3>
          ${DAYS.map((x) => {
            const ds = a.days[x.key];
            return `<div class="dayrow live-c" style="--c:${ds.color}">
              <span class="pill-sm">${x.name.toUpperCase()}</span>
              <label title="Culoarea antetului zilei"><input type="color" value="${ds.color}" data-bind="appearance.days.${x.key}.color"> antet</label>
              <label title="Culoarea ferestrei"><input type="color" value="${ds.window}" data-bind="appearance.days.${x.key}.window"> fereastră</label>
              <label title="Culoarea textului"><input type="color" value="${ds.text}" data-bind="appearance.days.${x.key}.text"> text</label>
              <label class="slider" title="Transparența ferestrei">💧 Transparență<input type="range" min="0" max="100" step="1" value="${Math.round((1 - ds.opacity) * 100)}" data-bind="appearance.days.${x.key}.opacity" data-type="inv-pct" data-fmt="int-pct"><output>${Math.round((1 - ds.opacity) * 100)}%</output></label>
            </div>`;
          }).join("")}
          <div class="row" style="margin-top:12px">
            <button class="btn" data-action="days-copy">📋 Copiază setările de Luni la toate</button>
          </div>
          <div style="margin-top:12px;display:flex;flex-direction:column;gap:8px">
            ${slider("window_blur", "Efect de sticlă (blur)", 0, 24, 1, "px")}
            ${slider("cell_radius", "Rotunjire colțuri", 0, 30, 1, "px")}
          </div>
        </div>

        <div class="card">
          <h3>🔤 Texte și fonturi</h3>
          <div class="fields">
            <label>Titlu<input maxlength="60" value="${esc(a.title)}" data-bind="appearance.title"></label>
            <label>Subtitlu<input maxlength="120" value="${esc(a.subtitle)}" data-bind="appearance.subtitle" placeholder="ex: Clasa a V-a B · Ana"></label>
            <label class="wide">Motto (subsol)<input maxlength="200" value="${esc(a.footer)}" data-bind="appearance.footer"></label>
            <label>Font titlu${fontSel("title_font")}</label>
            <label>Font text${fontSel("body_font")}</label>
            <label class="inline"><input type="color" value="${a.title_color}" data-bind="appearance.title_color"> Culoare titlu</label>
            <label class="inline"><input type="color" value="${a.text_color}" data-bind="appearance.text_color"> Culoare text</label>
          </div>
        </div>

        <div class="card">
          <h3>🧩 Afișare</h3>
          <div class="row" style="margin-bottom:12px">
            <div class="seg">${[["rows", "📋 Rânduri"], ["timeline", "📏 Cronologic"]].map(([v, l]) => `<button class="${a.layout === v ? "sel" : ""}" data-action="layout" data-v="${v}">${l}</button>`).join("")}</div>
            <select data-bind="appearance.cell_style">
              ${[["stripe", "Celule cu dungă"], ["tinted", "Celule colorate pal"], ["solid", "Celule pline"]].map(([v, l]) => `<option value="${v}" ${a.cell_style === v ? "selected" : ""}>${l}</option>`).join("")}
            </select>
          </div>
          <div class="toggles">
            ${toggle("show_times", "🕐 Orele")}
            ${toggle("show_icons", "🎨 Iconițele")}
            ${toggle("show_room", "🚪 Sala")}
            ${toggle("show_teacher", "👩‍🏫 Profesorul")}
            ${toggle("show_dates", "📅 Datele")}
            ${toggle("show_now", "✨ Evidențiază ora curentă")}
            ${toggle("show_clock", "⏱️ Ceas și numărătoare")}
            ${toggle("show_footer", "💬 Motto")}
          </div>
        </div>
        <div class="row"><button class="danger ghost" data-action="look-reset">↺ Resetează aspectul</button></div>
      </div>
      <div class="preview"><orar-board id="preview-board"></orar-board></div>
    </div>`;
  }

  _fmt(v, fmt) {
    if (fmt === "pct") return `${Math.round(v * 100)}%`;
    if (fmt === "int-pct") return `${Math.round(v)}%`;
    if (fmt === "px") return `${v}px`;
    return String(v);
  }

  async _uploadBackground(file) {
    if (!file) return;
    try {
      this._toast("⏳ Se încarcă imaginea…");
      const ext = (file.name.split(".").pop() || "").toLowerCase();
      let filename = file.name;
      let content;
      if (file.size <= 1500000 && ["jpg", "jpeg", "png", "webp", "gif"].includes(ext)) {
        content = await readAsDataURL(file);
      } else {
        content = await downscaleImage(file);
        filename = `${file.name.replace(/\.[^.]*$/, "") || "fundal"}.jpg`;
      }
      const res = await this._hass.callWS({ type: "orar/upload", entry_id: this._entryId, filename, content });
      const a = this._data.appearance;
      a.bg_type = "image";
      a.bg_image = res.url;
      this._touch("appearance");
      this._renderTab();
      this._toast("🖼️ Fundal nou setat!");
    } catch (err) {
      this._toast(`❌ ${err.message || err}`);
    }
  }

  /* ---------------------------------------------------------------- tab: Vacanțe */

  _tab_holidays() {
    const d = this._data;
    const today = isoDate(new Date());
    const rows = d.holidays.map((h, i) => {
      const active = h.start && h.start <= today && today <= (h.end || h.start);
      const days = h.start && h.end ? Math.round((new Date(h.end) - new Date(h.start)) / 864e5) + 1 : 0;
      return `<div class="hol">
        <input maxlength="80" value="${esc(h.name)}" data-bind="holidays.${i}.name" placeholder="Numele vacanței">
        <input type="date" value="${esc(h.start)}" data-bind="holidays.${i}.start" data-rerender>
        <input type="date" value="${esc(h.end)}" data-bind="holidays.${i}.end" data-rerender>
        <span class="badge">${active ? "🏖️ acum" : days ? `${days} zile` : ""}</span>
        <button class="icon-btn" data-action="hol-del" data-i="${i}" title="Șterge">🗑️</button>
      </div>`;
    }).join("");
    return `<div class="card">
      <h3>🏖️ Vacanțe și zile libere</h3>
      <p class="muted">În aceste zile orarul nu se aplică: senzorii arată „Liber”, calendarul nu are evenimente și nu se declanșează evenimente de început de oră.</p>
      ${rows || `<div class="muted" style="padding:12px 0">Nicio vacanță adăugată.</div>`}
      <div class="row" style="margin-top:12px">
        <button class="primary" data-action="hol-add">＋ Adaugă vacanță</button>
        <button class="btn" data-action="hol-day">＋ Zi liberă azi</button>
      </div>
    </div>`;
  }

  /* ---------------------------------------------------------------- tab: Setări */

  _tab_settings() {
    const title = (this._entries.find((e) => e.entry_id === this._entryId) || {}).title || "Orar";
    return `<div class="card">
        <h3>💾 Copie de siguranță</h3>
        <div class="row">
          <button class="primary" data-action="export">⬇️ Exportă JSON</button>
          <button class="btn" data-action="import">⬆️ Importă JSON</button>
          <input type="file" accept="application/json,.json" id="import-file" hidden>
        </div>
        <p class="muted">Exportul conține materiile, orarul, clopoțelul, vacanțele și aspectul (imaginea de fundal încărcată rămâne pe server).</p>
      </div>
      <div class="card">
        <h3>🧹 Curățenie</h3>
        <div class="row">
          <button class="danger ghost" data-action="clear-schedule">Golește tot orarul</button>
        </div>
      </div>
      <div class="card">
        <h3>🏠 Entități create pentru „${esc(title)}”</h3>
        <p class="muted">Le găsești în <i>Setări → Dispozitive și servicii → ORAR → ${esc(title)}</i>.</p>
        <ul>
          <li><b>Materia curentă</b> – materia de acum, „Pauză” sau „Liber” (+ minute rămase, progres)</li>
          <li><b>Următoarea materie</b> – cu ora de început și minutele până atunci</li>
          <li><b>Ore azi</b> – numărul de ore și lista lor</li>
          <li><b>Final ore azi</b> – ora la care se termină școala</li>
          <li><b>Ghiozdan</b> – materiile și lucrurile de luat pentru următoarea zi de școală</li>
          <li><b>La școală</b> – pornit cât timp durează orele</li>
          <li><b>Orar</b> (calendar) – toate orele ca evenimente</li>
        </ul>
      </div>
      <div class="card">
        <h3>🧱 Card pentru dashboard</h3>
        <pre>type: custom:orar-card
mode: week      # week | today | now | backpack</pre>
      </div>
      <div class="card">
        <h3>🤖 Idei de automatizări</h3>
        <pre># Anunță începutul fiecărei ore
trigger:
  - platform: event
    event_type: orar_lesson_start
action:
  - service: notify.notify
    data:
      message: "📚 Începe {{ trigger.event.data.subject }} ({{ trigger.event.data.start }}–{{ trigger.event.data.end }})"

# Seara: ce pun în ghiozdan?
trigger:
  - platform: time
    at: "20:00:00"
action:
  - service: notify.notify
    data:
      title: "🎒 Ghiozdan pentru {{ state_attr('sensor.${esc(slugify(title))}_ghiozdan', 'day') }}"
      message: "{{ state_attr('sensor.${esc(slugify(title))}_ghiozdan', 'items') | join(', ') }}"</pre>
      </div>
      <p class="muted" style="text-align:center">ORAR v${ORAR_VERSION} · făcut cu ❤️ pentru elevi</p>`;
  }

  _export() {
    const title = (this._entries.find((e) => e.entry_id === this._entryId) || {}).title || "orar";
    const blob = new Blob([JSON.stringify({ orar_version: ORAR_VERSION, ...this._data }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `orar-${slugify(title)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  async _import(file) {
    if (!file) return;
    try {
      const obj = JSON.parse(await file.text());
      const keys = ["subjects", "periods", "schedule", "appearance", "holidays"].filter((k) => k in obj);
      if (!keys.length) throw new Error("Fișierul nu conține un orar");
      if (!confirm(`Importul înlocuiește: ${keys.join(", ")}. Continui?`)) return;
      keys.forEach((k) => (this._data[k] = obj[k]));
      this._touch(...keys);
      this._renderTab();
      this._toast("✅ Orar importat");
    } catch (err) {
      this._toast(`❌ ${err.message || err}`);
    }
  }

  /* ---------------------------------------------------------------- evenimente */

  _onInput(e) {
    const el = e.target;
    const d = this._data;

    if (el.dataset.entry !== undefined && e.type === "change") {
      this._entryId = el.value;
      localSet("orar.entry", el.value);
      this._subscribe();
      return;
    }
    if (el.dataset.dlgSearch !== undefined) {
      const q = el.value.toLowerCase().trim();
      this.shadowRoot.querySelectorAll(".chip-grid .schip").forEach((c) => {
        c.style.display = !q || c.dataset.name.includes(q) ? "" : "none";
      });
      return;
    }
    if (el.dataset.subjFilter !== undefined) {
      this._subFilter = el.value;
      clearTimeout(this._filterTimer);
      this._filterTimer = setTimeout(() => {
        this._renderTab();
        const f = this.shadowRoot.querySelector("[data-subj-filter]");
        f?.focus();
        f?.setSelectionRange(f.value.length, f.value.length);
      }, 250);
      return;
    }
    if (el.dataset.gen) {
      this._gen[el.dataset.gen] = el.type === "number" ? Number(el.value) : el.value;
      return;
    }
    if (el.id === "bg-file" && e.type === "change") {
      this._uploadBackground(el.files[0]);
      return;
    }
    if (el.id === "import-file" && e.type === "change") {
      this._import(el.files[0]);
      el.value = "";
      return;
    }
    if (el.dataset.copyDay !== undefined && e.type === "change") {
      if (el.value) this._copyDay(el.value);
      return;
    }
    if (el.dataset.time && e.type === "change") {
      const i = Number(el.dataset.i);
      const p = d.periods[i] || {};
      const cell = this._ensureCell(this._editDay, i);
      cell[el.dataset.time] = el.value && el.value !== p[el.dataset.time] ? el.value : "";
      this._touch("schedule");
      this._renderTab();
      return;
    }

    const path = el.dataset.bind;
    if (!path) return;
    const isDiscrete = el.tagName === "SELECT" || el.type === "checkbox" || el.type === "date";
    if (e.type === "input" && isDiscrete) return;
    if (e.type === "change" && !isDiscrete && el.type !== "time") return;

    let v = el.type === "checkbox" ? el.checked : el.value;
    if (el.dataset.type === "num") v = Number(v);
    if (el.dataset.type === "inv-pct") v = Math.round((1 - Number(v) / 100) * 100) / 100;
    if (el.dataset.type === "nullable") v = v || null;
    setPath(d, path, v);
    this._touch(path.split(".")[0]);

    if (el.dataset.fmt) {
      const out = el.parentElement.querySelector("output");
      if (out) out.textContent = this._fmt(Number(el.value), el.dataset.fmt);
    }
    if (path.endsWith(".color")) el.closest(".live-c")?.style.setProperty("--c", v);
    if (el.dataset.rerender !== undefined) this._renderTab();
    else this._refreshBoards();
  }

  _onClick(e) {
    const t = e.target;
    if (t.dataset?.modalBg !== undefined && t === e.target && t.classList.contains("modal-bg")) {
      this._closeModal();
      return;
    }
    const tabBtn = t.closest("[data-tab]");
    if (tabBtn) {
      this._tab = tabBtn.dataset.tab;
      localSet("orar.tab", this._tab);
      this._renderTab();
      return;
    }
    const btn = t.closest("[data-action]");
    if (!btn) return;
    const d = this._data;
    const a = btn.dataset;
    const i = Number(a.i);
    const day = this._editDay;

    switch (a.action) {
      case "embed-close":
        this.dispatchEvent(new CustomEvent("orar-embed-close"));
        break;

      /* orar */
      case "toggle-edit":
        this._editMode = !this._editMode;
        this._brush = null;
        this._renderTab();
        break;
      case "brush":
        this._brush = this._brush === a.id ? null : a.id;
        this._renderTab();
        break;

      /* dialoguri */
      case "dlg-subj":
        this._dlg.subject = a.id || null;
        this.shadowRoot.querySelectorAll(".chip-grid .schip").forEach((c) => c.classList.toggle("sel", c === btn));
        break;
      case "dlg-reset-times": {
        const p = d.periods[this._dlg.idx] || {};
        const m = this.shadowRoot.getElementById("modal");
        m.querySelector('[data-dlg="start"]').value = p.start || "";
        m.querySelector('[data-dlg="end"]').value = p.end || "";
        break;
      }
      case "dlg-clear": {
        const cell = this._ensureCell(this._dlg.day, this._dlg.idx);
        Object.assign(cell, emptyCell());
        this._trim(this._dlg.day);
        this._touch("schedule");
        this._closeModal();
        this._renderTab();
        break;
      }
      case "dlg-save":
        this._saveCellDialog();
        break;
      case "dlg-close":
        this._closeModal();
        break;
      case "icon-pick":
        this._setIcon(a.icon);
        break;
      case "icon-custom": {
        const v = this.shadowRoot.querySelector('[data-dlg="icon"]').value.trim();
        if (v && !/^[a-z0-9_-]+:[a-z0-9-]+$/.test(v)) {
          this._toast("⚠️ Format: mdi:nume-iconita");
          break;
        }
        this._setIcon(v);
        break;
      }

      /* zile */
      case "day-select":
        this._editDay = a.day;
        this._renderTab();
        break;
      case "slot-add":
        this._cells(day).push(emptyCell());
        this._touch("schedule");
        this._renderTab();
        break;
      case "slot-del":
        this._cells(day).splice(i, 1);
        this._touch("schedule");
        this._renderTab();
        break;
      case "slot-move": {
        const cells = this._cells(day);
        const j = i + Number(a.dir);
        if (j < 0 || j >= cells.length) break;
        // mutăm materia și notița; orele rămân pe rând
        const [x, y] = [cells[i], cells[j]];
        [x.subject, y.subject] = [y.subject, x.subject];
        [x.note, y.note] = [y.note, x.note];
        this._touch("schedule");
        this._renderTab();
        break;
      }
      case "slot-reset": {
        const cell = this._cells(day)[i];
        cell.start = "";
        cell.end = "";
        this._touch("schedule");
        this._renderTab();
        break;
      }
      case "day-standard":
        this._cells(day).forEach((c) => {
          c.start = "";
          c.end = "";
        });
        this._touch("schedule");
        this._renderTab();
        this._toast(`🔔 ${DAY_NAME[day]} folosește orele standard`);
        break;
      case "day-clear":
        if (!confirm(`Golești toate orele din ${DAY_NAME[day]}?`)) break;
        d.schedule[day] = [];
        this._touch("schedule");
        this._renderTab();
        break;

      /* materii */
      case "subj-add": {
        const id = uid();
        d.subjects.push({
          id, name: "Materie nouă", short: "", color: SUBJECT_COLORS[d.subjects.length % SUBJECT_COLORS.length],
          icon: "mdi:book-education", teacher: "", room: "", items: "", notes: "",
        });
        this._subFilter = "";
        this._touch("subjects");
        this._renderTab();
        const input = this.shadowRoot.querySelector(`[data-sid="${id}"] .scard-name`);
        input?.scrollIntoView({ behavior: "smooth", block: "center" });
        input?.focus();
        input?.select();
        break;
      }
      case "subj-del": {
        const s = d.subjects.find((x) => x.id === a.id);
        const uses = this._uses(a.id);
        if (!s || !confirm(`Ștergi „${s.name}”?${uses ? ` Va fi scoasă din ${uses} ore.` : ""}`)) break;
        d.subjects = d.subjects.filter((x) => x.id !== a.id);
        DAY_KEYS.forEach((k) => this._cells(k).forEach((c) => {
          if (c.subject === a.id) c.subject = null;
        }));
        this._touch("subjects", "schedule");
        this._renderTab();
        break;
      }
      case "subj-sort":
        d.subjects.sort((x, y) => x.name.localeCompare(y.name, "ro"));
        this._touch("subjects");
        this._renderTab();
        break;
      case "subj-icon":
        this._dlg = { kind: "icon", id: a.id };
        this._renderModal();
        break;

      /* clopoțel */
      case "per-add": {
        const last = d.periods[d.periods.length - 1];
        const start = last ? toMin(last.end) + 10 : 480;
        if (d.periods.length >= 14 || start + 50 >= 1440) break;
        d.periods.push({ start: fromMin(start), end: fromMin(start + 50) });
        this._touch("periods");
        this._renderTab();
        break;
      }
      case "per-del":
        d.periods.splice(i, 1);
        this._touch("periods");
        this._renderTab();
        break;
      case "per-generate":
        this._generatePeriods();
        break;
      case "per-apply":
        if (!confirm("Ștergi orele personalizate din toate celulele, ca toate să folosească orele standard?")) break;
        DAY_KEYS.forEach((k) => this._cells(k).forEach((c) => {
          c.start = "";
          c.end = "";
        }));
        this._touch("schedule");
        this._toast("🔁 Toate zilele folosesc orele standard");
        break;

      /* aspect */
      case "theme": {
        const theme = THEMES.find((x) => x.id === a.id);
        Object.assign(d.appearance, clone(theme.a));
        this._touch("appearance");
        this._renderTab();
        this._toast(`${theme.emoji} Tema „${theme.label}” aplicată`);
        break;
      }
      case "bg-type":
        d.appearance.bg_type = a.v;
        this._touch("appearance");
        this._renderTab();
        break;
      case "bg-preset":
        d.appearance.bg_preset = a.id;
        this._touch("appearance");
        this._renderTab();
        break;
      case "bg-upload":
        this.shadowRoot.getElementById("bg-file").click();
        break;
      case "bg-remove":
        d.appearance.bg_image = "";
        d.appearance.bg_type = "preset";
        this._touch("appearance");
        this._renderTab();
        break;
      case "layout":
        d.appearance.layout = a.v;
        this._touch("appearance");
        this._renderTab();
        break;
      case "days-copy": {
        const src = d.appearance.days.mon;
        DAY_KEYS.forEach((k) => {
          d.appearance.days[k] = { ...d.appearance.days[k], window: src.window, opacity: src.opacity, text: src.text };
        });
        this._touch("appearance");
        this._renderTab();
        this._toast("📋 Fereastra, textul și transparența de Luni copiate (culorile anteturilor rămân)");
        break;
      }
      case "look-reset":
        if (!confirm("Resetezi tot aspectul la tema implicită?")) break;
        d.appearance = clone(DEFAULT_APPEARANCE);
        this._touch("appearance");
        this._renderTab();
        break;

      /* vacanțe */
      case "hol-add": {
        const today = isoDate(new Date());
        d.holidays.push({ name: "Vacanță", start: today, end: today });
        this._touch("holidays");
        this._renderTab();
        break;
      }
      case "hol-day": {
        const today = isoDate(new Date());
        d.holidays.push({ name: "Zi liberă", start: today, end: today });
        this._touch("holidays");
        this._renderTab();
        break;
      }
      case "hol-del":
        d.holidays.splice(i, 1);
        this._touch("holidays");
        this._renderTab();
        break;

      /* setări */
      case "export":
        this._export();
        break;
      case "import":
        this.shadowRoot.getElementById("import-file").click();
        break;
      case "clear-schedule":
        if (!confirm("Golești orarul pentru toate zilele? Materiile rămân în baza de date.")) break;
        DAY_KEYS.forEach((k) => (d.schedule[k] = []));
        this._touch("schedule");
        this._toast("🧹 Orar golit");
        break;
    }
  }

  _copyDay(target) {
    const src = clone(this._cells(this._editDay));
    const targets = target === "__all" ? DAY_KEYS.filter((k) => k !== this._editDay) : [target];
    if (!confirm(`Înlocuiești orele din ${targets.map((k) => DAY_NAME[k]).join(", ")} cu cele din ${DAY_NAME[this._editDay]}?`)) {
      this._renderTab();
      return;
    }
    targets.forEach((k) => (this._data.schedule[k] = clone(src)));
    this._touch("schedule");
    this._renderTab();
    this._toast("📋 Zi copiată");
  }
}

/* ------------------------------------------------------------------ <orar-card> */

const CARD_CSS = `
:host{display:block}
*{box-sizing:border-box}
ha-card{background:transparent;border:none;box-shadow:none}
.mini{position:relative;isolation:isolate;overflow:hidden;border-radius:var(--ha-card-border-radius,16px);padding:16px;color:var(--txt);font-family:var(--font-body);min-height:120px}
.bg{position:absolute;inset:0;z-index:-2}
.dim{position:absolute;inset:0;z-index:-1;background:rgba(0,0,0,var(--dim))}
.mhead{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px}
.mtitle{font-family:var(--font-title);font-size:30px;line-height:1;color:var(--title);letter-spacing:.04em;text-shadow:0 3px 0 rgba(0,0,0,.25)}
.mday{background:var(--day);color:#fff;border-radius:999px;padding:4px 14px;font-family:var(--font-title);font-style:italic;font-size:18px;letter-spacing:.06em;box-shadow:0 3px 0 rgba(0,0,0,.18)}
.panel{background:var(--win);color:var(--wtxt);border-radius:16px;overflow:hidden;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);box-shadow:0 10px 24px rgba(0,0,0,.25)}
.lrow{position:relative;display:flex;align-items:center;gap:10px;padding:9px 12px 9px 16px;border-bottom:1px solid color-mix(in srgb,var(--day) 25%,transparent)}
.lrow:last-child{border-bottom:none}
.lrow::before{content:"";position:absolute;left:0;top:8px;bottom:8px;width:5px;border-radius:0 4px 4px 0;background:var(--subj)}
.lrow.past{opacity:.5}
.lrow.cur{background:color-mix(in srgb,var(--subj) 16%,transparent)}
.t{font-size:12px;font-weight:700;opacity:.75;font-variant-numeric:tabular-nums;width:86px;flex:none}
.ico{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;background:color-mix(in srgb,var(--subj) 18%,transparent);color:var(--subj);flex:none}
.ico ha-icon{--mdc-icon-size:18px}
.n{font-weight:800;flex:1;min-width:0}
.n small{display:block;font-weight:500;opacity:.7;font-size:12px}
.badge{font-size:10px;font-weight:800;background:var(--subj);color:var(--subj-fg);border-radius:999px;padding:2px 8px}
.bar{position:absolute;left:0;bottom:0;height:3px;background:var(--subj)}
.empty{padding:22px;text-align:center;font-size:17px;font-weight:700}
.empty small{display:block;font-weight:500;opacity:.8;margin-top:6px;font-size:13px}
.now{display:flex;align-items:center;gap:16px;padding:16px}
.big-ico{width:72px;height:72px;border-radius:50%;display:grid;place-items:center;background:var(--subj);color:var(--subj-fg);flex:none;box-shadow:0 0 0 6px color-mix(in srgb,var(--subj) 25%,transparent);animation:breathe 2.6s ease-in-out infinite}
.big-ico ha-icon{--mdc-icon-size:40px}
@keyframes breathe{50%{box-shadow:0 0 0 12px color-mix(in srgb,var(--subj) 10%,transparent)}}
.now-lbl{font-size:12px;font-weight:800;letter-spacing:.12em;opacity:.7}
.now-name{font-size:24px;font-weight:800;line-height:1.1}
.now-sub{font-size:14px;opacity:.8;margin-top:2px}
.pbar{height:8px;border-radius:99px;background:color-mix(in srgb,var(--wtxt) 15%,transparent);margin:0 16px 14px;overflow:hidden}
.pbar i{display:block;height:100%;background:var(--subj);border-radius:99px}
.next{padding:10px 16px;border-top:1px dashed color-mix(in srgb,var(--wtxt) 25%,transparent);font-size:14px}
.chips{display:flex;flex-wrap:wrap;gap:6px;padding:12px}
.chip{display:inline-flex;align-items:center;gap:5px;background:color-mix(in srgb,var(--subj) 18%,transparent);border:2px solid var(--subj);border-radius:999px;padding:3px 10px 3px 6px;font-weight:700;font-size:13px}
.chip ha-icon{--mdc-icon-size:16px;color:var(--subj)}
.check{display:flex;align-items:center;gap:10px;padding:8px 14px;border-top:1px solid color-mix(in srgb,var(--wtxt) 12%,transparent);cursor:pointer;user-select:none}
.check input{width:20px;height:20px;accent-color:var(--day)}
.check.done span{text-decoration:line-through;opacity:.5}
.packbar{padding:10px 14px;font-weight:700;font-size:13px;display:flex;justify-content:space-between}
.err{padding:16px;border-radius:var(--ha-card-border-radius,16px);background:var(--ha-card-background,var(--card-background-color,#fff))}
.tools{display:flex;flex-wrap:wrap;gap:6px;justify-content:flex-end;margin-bottom:8px}
.tools[hidden],.editor[hidden]{display:none}
.tbtn{display:inline-flex;align-items:center;gap:6px;padding:6px 14px 6px 10px;border-radius:999px;border:1px solid var(--divider-color,rgba(0,0,0,.12));background:var(--ha-card-background,var(--card-background-color,#fff));color:var(--primary-text-color,#1d2340);font:inherit;font-size:13px;font-weight:600;cursor:pointer;transition:background .2s,color .2s,border-color .2s}
.tbtn ha-icon{--mdc-icon-size:18px;color:var(--primary-color,#3f7be0)}
.tbtn:hover{border-color:var(--primary-color,#3f7be0)}
.tbtn[aria-pressed="true"]{background:var(--primary-color,#3f7be0);border-color:var(--primary-color,#3f7be0);color:var(--text-primary-color,#fff)}
.tbtn[aria-pressed="true"] ha-icon{color:inherit}
.editor{margin-top:10px;padding:14px;border-radius:var(--ha-card-border-radius,16px);background:var(--ha-card-background,var(--card-background-color,#fff));border:1px solid var(--primary-color,#3f7be0);box-shadow:var(--ha-card-box-shadow,none)}
`;

const CARD_BUTTONS = [
  { id: "look", icon: "mdi:palette-outline", label: "Themes", title: "Teme, fundal, culorile și transparența zilelor" },
  { id: "subjects", icon: "mdi:bookshelf", label: "Materii", title: "Baza de date de materii" },
  { id: "days", icon: "mdi:clock-edit-outline", label: "Orar", title: "Materia, ora de început și ora de sfârșit pentru fiecare oră" },
];

class OrarCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    const root = this.shadowRoot;
    root.innerHTML = `<style>${CARD_CSS}</style>
      <ha-card>
        <div class="tools" hidden></div>
        <div class="view"></div>
        <div class="editor" hidden></div>
      </ha-card>`;
    this._el = {
      tools: root.querySelector(".tools"),
      view: root.querySelector(".view"),
      editor: root.querySelector(".editor"),
    };
    this._open = null;
    root.addEventListener("change", (e) => this._onCheck(e));
    this._el.tools.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-open]");
      if (btn) this._toggleEditor(btn.dataset.open);
    });
    // În modul „Orar”, celulele din tabla cardului deschid dialogul de editare din editor.
    const forward = (method) => (e) => {
      if (this._open === "days" && this._panel && e.target === this._board) this._panel[method](e.detail);
    };
    root.addEventListener("orar-cell-click", forward("_onCellClick"));
    root.addEventListener("orar-cell-add", forward("_onCellAdd"));
    root.addEventListener("orar-drop", forward("_onDrop"));
  }

  static getConfigElement() {
    return document.createElement("orar-card-editor");
  }

  static getStubConfig() {
    return { mode: "week" };
  }

  setConfig(config) {
    const changedEntry = this._config && this._config.entry_id !== config.entry_id;
    this._config = { mode: "week", ...config };
    this._board = null;
    this._el.view.innerHTML = "";
    if (changedEntry) {
      this._closeEditor();
      this._resubscribe();
    } else this._render();
    this._renderTools();
  }

  set hass(h) {
    const wasAdmin = this._isAdmin;
    this._hass = h;
    if (this._panel) this._panel.hass = h;
    if (!this._unsub && this.isConnected) this._connect();
    if (wasAdmin !== this._isAdmin) this._renderTools();
  }

  get _isAdmin() {
    return !!this._hass?.user?.is_admin;
  }

  get _showButtons() {
    return this._isAdmin && (this._config?.buttons ?? this._config?.mode === "week");
  }

  connectedCallback() {
    if (this._hass && !this._unsub) this._connect();
    this._timer = setInterval(() => {
      if (this._config?.mode !== "week") this._render();
    }, 30000);
  }

  disconnectedCallback() {
    clearInterval(this._timer);
    this._unsub?.then((u) => u && u()).catch(() => {});
    this._unsub = null;
  }

  getCardSize() {
    return { week: 9, today: 5, now: 3, backpack: 4 }[this._config?.mode] || 5;
  }

  _resubscribe() {
    this._unsub?.then((u) => u && u()).catch(() => {});
    this._unsub = null;
    this._data = null;
    if (this._hass) this._connect();
  }

  _connect() {
    this._unsub = (async () => {
      let id = this._config?.entry_id;
      if (!id) {
        const list = await this._hass.callWS({ type: "orar/list" });
        id = list[0]?.entry_id;
      }
      if (!id) {
        this._error("Nu există niciun orar. Adaugă integrarea ORAR.");
        return null;
      }
      this._entryId = id;
      return this._hass.connection.subscribeMessage(
        (m) => {
          this._data = m.data;
          this._render();
        },
        { type: "orar/subscribe", entry_id: id },
      );
    })().catch((err) => {
      this._error(err.message || "Orarul nu poate fi încărcat");
      return null;
    });
  }

  _error(msg) {
    this._board = null;
    this._el.view.innerHTML = `<div class="err">⚠️ ${esc(msg)}</div>`;
  }

  /* ---------------------------------------------------------------- butoane și editor */

  _renderTools() {
    const tools = this._el.tools;
    const show = this._showButtons;
    tools.hidden = !show;
    if (!show) {
      if (this._open) this._closeEditor();
      tools.innerHTML = "";
      return;
    }
    tools.innerHTML = CARD_BUTTONS.map((b) => `<button class="tbtn" data-open="${b.id}" title="${esc(b.title)}" aria-pressed="${this._open === b.id}">
        <ha-icon icon="${b.icon}"></ha-icon><span>${b.label}</span></button>`).join("");
  }

  _toggleEditor(id) {
    if (this._open === id) this._closeEditor();
    else this._openEditor(id);
  }

  _openEditor(id) {
    if (!this._entryId) return;
    this._open = id;
    const linked = id === "days" && this._config.mode === "week";
    if (!this._panel) {
      this._panel = document.createElement("orar-panel");
      this._panel.addEventListener("orar-preview", (e) => {
        this._data = clone(e.detail);
        this._render();
      });
      this._panel.addEventListener("orar-embed-close", () => this._closeEditor());
      this._panel.setEmbed({ tab: id, entryId: this._entryId, linked });
      this._el.editor.appendChild(this._panel);
      this._panel.hass = this._hass;
    } else {
      this._panel.setEmbed({ tab: id, entryId: this._entryId, linked });
    }
    this._el.editor.hidden = false;
    this._renderTools();
    this._render();
    // Pe telefon editorul poate fi sub ecran: îl aducem în față.
    requestAnimationFrame(() => {
      const box = this._el.editor.getBoundingClientRect();
      if (box.top < 0 || box.top > window.innerHeight * 0.6) {
        (linked ? this._el.tools : this._el.editor).scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  _closeEditor() {
    this._open = null;
    this._panel?.remove();
    this._panel = null;
    this._el.editor.hidden = true;
    this._renderTools();
    this._render();
  }

  /* ---------------------------------------------------------------- afișare */

  _render() {
    if (!this._data || !this._config) return;
    const mode = this._config.mode;
    if (mode === "week") {
      if (!this._board) {
        this._el.view.innerHTML = `<orar-board></orar-board>`;
        this._board = this._el.view.querySelector("orar-board");
      }
      this._board.configure({ data: this._data, editable: this._open === "days" });
      return;
    }
    this._board = null;
    const d = this._data;
    const a = appearanceOf(d);
    const info = nowInfo(d);
    const dayKey = info.dayKey || "mon";
    const ds = a.days[dayKey];
    const vars = [
      `--title:${a.title_color}`, `--txt:${a.text_color}`, `--font-title:${fontStack(a.title_font)}`,
      `--font-body:${fontStack(a.body_font)}`, `--dim:${a.bg_dim}`, `--day:${ds.color}`,
      `--win:${rgba(ds.window, ds.opacity)}`, `--wtxt:${ds.text}`,
    ].join(";");
    const body = mode === "now" ? this._nowHtml(d, info) : mode === "backpack" ? this._packHtml(d, a) : this._todayHtml(d, info);
    const label = mode === "backpack" ? "🎒 Ghiozdan" : info.dayKey ? DAY_NAME[info.dayKey].toUpperCase() : "WEEKEND";
    this._el.view.innerHTML = `<div class="mini" style="${esc(vars)}">
        <div class="bg" style="background:${esc(backgroundCss(a))}"></div><div class="dim"></div>
        <div class="mhead"><span class="mtitle">${esc(a.title)}</span><span class="mday">${esc(label)}</span></div>
        <div class="panel">${body}</div>
      </div>`;
  }

  _lessonStyle(s) {
    return `--subj:${s.color};--subj-fg:${contrastColor(s.color)}`;
  }

  _todayHtml(d, info) {
    if (!info.lessons.length) {
      const chip = statusText(info);
      const nxt = nextSchoolDay(d);
      return `<div class="empty">${chip.emoji} ${esc(chip.text)}${nxt ? `<small>${DAY_NAME[nxt.dayKey]}: ${nxt.lessons.map((l) => esc(l.subject.short || l.subject.name)).join(", ")}</small>` : ""}</div>`;
    }
    return info.lessons.map((l) => {
      const cur = info.current?.idx === l.idx;
      const past = info.nm >= l.e;
      const pct = cur ? ((info.nm - l.s) / (l.e - l.s)) * 100 : 0;
      return `<div class="lrow ${cur ? "cur" : ""} ${past ? "past" : ""}" style="${this._lessonStyle(l.subject)}">
        <span class="t">${l.start} – ${l.end}</span>
        ${l.subject.icon ? `<span class="ico"><ha-icon icon="${esc(l.subject.icon)}"></ha-icon></span>` : ""}
        <span class="n">${esc(l.subject.name)}${l.subject.room || l.cell.note ? `<small>${esc([l.subject.room && `🚪 ${l.subject.room}`, l.cell.note && `📝 ${l.cell.note}`].filter(Boolean).join(" · "))}</small>` : ""}</span>
        ${cur ? `<span class="badge">ACUM</span><span class="bar" style="width:${pct.toFixed(1)}%"></span>` : ""}
      </div>`;
    }).join("");
  }

  _nowHtml(d, info) {
    const cur = info.current;
    if (cur) {
      const s = cur.subject;
      const rem = Math.max(0, Math.ceil(cur.e - info.nm));
      const pct = ((info.nm - cur.s) / (cur.e - cur.s)) * 100;
      return `<div style="${this._lessonStyle(s)}">
        <div class="now">
          <div class="big-ico">${s.icon ? `<ha-icon icon="${esc(s.icon)}"></ha-icon>` : "📚"}</div>
          <div><div class="now-lbl">ACUM</div><div class="now-name">${esc(s.name)}</div>
          <div class="now-sub">${cur.start} – ${cur.end} · încă <b>${rem} min</b>${s.room ? ` · 🚪 ${esc(s.room)}` : ""}</div></div>
        </div>
        <div class="pbar"><i style="width:${pct.toFixed(1)}%"></i></div>
        ${info.next ? `<div class="next">⏭️ Urmează <b>${esc(info.next.subject.name)}</b> la ${info.next.start}</div>` : `<div class="next">🏁 Ultima oră de azi!</div>`}
      </div>`;
    }
    const chip = statusText(info);
    const nxt = info.next ? { l: info.next, day: "azi" } : (() => {
      const n = nextSchoolDay(d);
      return n ? { l: n.lessons[0], day: DAY_NAME[n.dayKey] } : null;
    })();
    return `<div class="empty">${chip.emoji} ${esc(chip.text)}
      ${nxt && info.status !== "break" && info.status !== "before" ? `<small>⏭️ ${esc(nxt.day)}: ${esc(nxt.l.subject.name)} la ${nxt.l.start}</small>` : ""}</div>`;
  }

  _packKey(iso) {
    return `orar.pack.${this._entryId}.${iso}`;
  }

  _packHtml(d) {
    const nxt = nextSchoolDay(d);
    if (!nxt) return `<div class="empty">🎒 Nu urmează ore curând</div>`;
    const iso = isoDate(nxt.date);
    let done = [];
    try { done = JSON.parse(localGet(this._packKey(iso)) || "[]"); } catch (e) { done = []; }
    const subjects = [];
    const items = [];
    for (const l of nxt.lessons) {
      if (!subjects.find((s) => s.id === l.subject.id)) subjects.push(l.subject);
      for (const it of splitItems(l.subject.items)) {
        if (!items.some((x) => x.toLowerCase() === it.toLowerCase())) items.push(it);
      }
    }
    const checklist = [...subjects.map((s) => `📘 ${s.short || s.name}`), ...items];
    const count = checklist.filter((x) => done.includes(x)).length;
    return `<div class="packbar"><span>Pentru ${DAY_NAME[nxt.dayKey]}, ${nxt.date.getDate()} ${MONTHS[nxt.date.getMonth()]}</span><span>${count === checklist.length ? "🎉 Gata!" : `${count}/${checklist.length}`}</span></div>
      <div class="chips">${subjects.map((s) => `<span class="chip" style="${this._lessonStyle(s)}">${s.icon ? `<ha-icon icon="${esc(s.icon)}"></ha-icon>` : ""}${esc(s.short || s.name)}</span>`).join("")}</div>
      ${checklist.map((x) => `<label class="check ${done.includes(x) ? "done" : ""}"><input type="checkbox" data-pack="${esc(x)}" data-iso="${iso}" ${done.includes(x) ? "checked" : ""}><span>${esc(x)}</span></label>`).join("")}`;
  }

  _onCheck(e) {
    const el = e.target;
    if (!el.dataset.pack) return;
    const key = this._packKey(el.dataset.iso);
    let done = [];
    try { done = JSON.parse(localGet(key) || "[]"); } catch (err) { done = []; }
    done = el.checked ? [...new Set([...done, el.dataset.pack])] : done.filter((x) => x !== el.dataset.pack);
    localSet(key, JSON.stringify(done));
    this._render();
  }
}

class OrarCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = { mode: "week", ...config };
    this._render();
  }

  set hass(h) {
    this._hass = h;
    if (!this._entries) {
      this._entries = [];
      h.callWS({ type: "orar/list" }).then((list) => {
        this._entries = list;
        this._render();
      }).catch(() => {});
    }
  }

  _render() {
    if (!this._config) return;
    const c = this._config;
    const modes = [["week", "🗓️ Săptămâna întreagă"], ["today", "📋 Orele de azi"], ["now", "⏱️ Ora curentă"], ["backpack", "🎒 Ghiozdanul de mâine"]];
    this.innerHTML = `<div style="display:flex;flex-direction:column;gap:12px;padding:4px 0">
      <label style="display:flex;flex-direction:column;gap:4px;font-weight:600">Orar
        <select data-k="entry_id" style="padding:8px;border-radius:8px">
          <option value="">(primul orar)</option>
          ${(this._entries || []).map((e) => `<option value="${e.entry_id}" ${c.entry_id === e.entry_id ? "selected" : ""}>${esc(e.title)}</option>`).join("")}
        </select></label>
      <label style="display:flex;flex-direction:column;gap:4px;font-weight:600">Mod de afișare
        <select data-k="mode" style="padding:8px;border-radius:8px">
          ${modes.map(([v, l]) => `<option value="${v}" ${c.mode === v ? "selected" : ""}>${l}</option>`).join("")}
        </select></label>
      <label style="display:flex;flex-direction:row;align-items:center;gap:8px;font-weight:600">
        <input type="checkbox" data-k="buttons" ${c.buttons ?? c.mode === "week" ? "checked" : ""} style="width:18px;height:18px">
        Butoanele Themes / Materii / Orar (vizibile doar pentru administratori)</label>
    </div>`;
    this.querySelectorAll("select, input").forEach((s) =>
      s.addEventListener("change", () => {
        const cfg = { ...this._config, [s.dataset.k]: s.type === "checkbox" ? s.checked : s.value };
        if (!cfg.entry_id) delete cfg.entry_id;
        this._config = cfg;
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: cfg }, bubbles: true, composed: true }));
      }),
    );
  }
}

/* ------------------------------------------------------------------ înregistrare */

const define = (name, cls) => {
  if (!customElements.get(name)) customElements.define(name, cls);
};
define("orar-board", OrarBoard);
define("orar-panel", OrarPanel);
define("orar-card", OrarCard);
define("orar-card-editor", OrarCardEditor);

window.customCards = window.customCards || [];
if (!window.customCards.some((c) => c.type === "orar-card")) {
  window.customCards.push({
    type: "orar-card",
    name: "ORAR",
    description: "Orarul școlar: săptămâna, ziua de azi, ora curentă sau ghiozdanul de mâine.",
    preview: true,
  });
}

console.info(`%c ORAR %c v${ORAR_VERSION} `, "background:#f6ae3b;color:#101a4f;font-weight:700;border-radius:4px 0 0 4px", "background:#101a4f;color:#fff;border-radius:0 4px 4px 0");
