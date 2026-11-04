"use strict";
/* Core: helpers, derived stats, header/nav, router, sheets, settings, export. Views live in v-*.js. */
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const pad = n => String(n).padStart(2, "0");
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseISO = s => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const dm = d => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
const addD = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const days = (a, b) => Math.round((b - a) / 864e5);
const fmt = (n, k = 0) => Number(n).toLocaleString("en-US", { minimumFractionDigits: k, maximumFractionDigits: k });
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const WD = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"], WDN = ["Chủ nhật", "thứ Hai", "thứ Ba", "thứ Tư", "thứ Năm", "thứ Sáu", "thứ Bảy"];
const QS = new URLSearchParams(location.search);
const TODAY = QS.get("date") ? parseISO(QS.get("date")) : (n => new Date(n.getFullYear(), n.getMonth(), n.getDate()))(new Date());
const TISO = iso(TODAY);
const toTet = days(TODAY, TET);
const challengeDay = days(START, TODAY) + 1, challengeWeek = Math.max(0, Math.min(12, Math.floor((challengeDay - 1) / 7) + 1));
const phaseAt = d => PHASES.find(p => d >= p.f && d <= p.t);
const freeMode = d => d <= NOMACHINE_UNTIL;
const programFor = (d, name) => PROGRAM[freeMode(d) ? "free" : "machine"][name] || [];
const P = () => Store.personal() || {};
const userName = () => P().name || "bạn";

/* ---------- derived stats from what was logged on this device ---------- */
const weightOn = d => { const x = Store.peekDay(iso(d)); return x && x.w ? +x.w : null; };
function avg7(d) { const v = []; for (let k = 0; k < 7; k++) { const w = weightOn(addD(d, -k)); if (w) v.push(w); } return v.length ? v.reduce((a, b) => a + b) / v.length : null; }
function waistLog() { return Object.entries(Store.all.days).filter(([, x]) => x.waist).map(([k, x]) => [parseISO(k), +x.waist]).sort((a, b) => a[0] - b[0]); }
const waistUntil = d => { const l = waistLog().filter(x => x[0] <= d); return l.length ? l[l.length - 1][1] : null; };
const waistFirst = () => { const l = waistLog(); return l.length ? l[0][1] : null; };
const MOVE_LABEL = d => { const p = WEEK_PLAN[d.getDay()]; return p.k === "gym" ? `${p.t} (${freeMode(d) ? "không máy" : "có máy"})` : p.t; };
function ticksOn(d) {
  const x = Store.peekDay(iso(d)), t = x ? { ...x.ticks } : {};
  const g = Store.gym(iso(d)); if (g && g.finished) t.move = 1;
  return t;
}
const scoreOn = d => Object.values(ticksOn(d)).filter(Boolean).length / CHECKS.length;
const KEEP = 5 / 8;   // a day "keeps the fire" with ≥ 5 of 8 ticks
function streak() {
  let n = 0, d = scoreOn(TODAY) >= KEEP ? TODAY : addD(TODAY, -1);
  while (scoreOn(d) >= KEEP && n < 400) { n++; d = addD(d, -1); }
  return n;
}
function xp() {
  const S = Store.all; let v = 0;
  for (const k in S.days) v += Object.values(S.days[k].ticks || {}).filter(Boolean).length * 10;
  for (const k in S.gym) { const g = S.gym[k]; v += Object.values(g.ex || {}).reduce((a, e) => a + e.sets.filter(s => s.done).length, 0) * 2 + (g.finished ? 40 : 0); }
  for (const k in S.phases) v += Object.values(S.phases[k].done || {}).filter(Boolean).length * 25;
  return v + Object.keys(S.weeksClosed).length * 80;
}
/* gym history */
function lastSets(id, before = TODAY) {
  const ks = Object.keys(Store.all.gym).filter(k => parseISO(k) < before).sort().reverse();
  for (const k of ks) { const e = Object.values(Store.all.gym[k].ex || {}).find(x => x.id === id && x.sets.some(s => s.done)); if (e) return { date: parseISO(k), sets: e.sets.filter(s => s.done) }; }
  return null;
}
function bestSet(id, until = TODAY) {
  let b = null;
  for (const k in Store.all.gym) { if (parseISO(k) > until) continue; for (const e of Object.values(Store.all.gym[k].ex || {})) if (e.id === id) for (const s of e.sets) if (s.done && (!b || s.kg > b.kg || (s.kg === b.kg && s.reps > b.reps))) b = { kg: s.kg, reps: s.reps }; }
  return b;
}
/* double progression: all planned sets reached the top of the range with RIR ≥ 1 → go up next time */
function suggestion(entry, last) {
  if (!last) return { kg: entry.kg, why: "Chưa có log: chọn mức làm được " + entry.hi + " rep còn dư 2 rep (RIR 2). Số gợi ý, chỉnh lại cho đúng sức.", up: false, first: true };
  const top = Math.max(...last.sets.map(s => s.kg)), atTop = last.sets.filter(s => s.kg === top);
  const ready = atTop.length >= entry.sets && atTop.every(s => s.reps >= entry.hi && s.rir >= 1);
  if (ready && entry.step) return { kg: +(top + entry.step).toFixed(2), why: `Lần trước đủ ${entry.hi} rep mọi set → lên ${entry.step > 0 ? "+" : ""}${entry.step} kg.`, up: true };
  if (ready) return { kg: top, why: "Lần trước đủ rep mọi set → thêm rep hoặc biến thể khó hơn.", up: true };
  return { kg: top, why: `Giữ ${top} kg, cố thêm rep cho tới ${entry.hi} rep mọi set.`, up: false };
}

/* ---------- header + nav ---------- */
const TABS = [["today", "🏠", "Hôm nay"], ["gym", "🏋️", "Gym"], ["plan", "🗓️", "Lộ trình"], ["food", "🍽️", "Ăn"], ["lib", "🔍", "Tra cứu"]];
const MAI_SVG = `<svg class="mai" viewBox="0 0 40 40" aria-hidden="true">${[0, 1, 2, 3, 4].map(i => `<ellipse cx="20" cy="11" rx="6" ry="9" fill="#f6c12b" transform="rotate(${i * 72} 20 20)"/>`).join("")}<circle cx="20" cy="20" r="5" fill="#c8302c"/></svg>`;
function drawHeader() {
  $("#hdr").innerHTML = `<div class="in">
    <a class="brand" href="#today">${MAI_SVG}<span>Tết Body</span></a>
    <nav class="tabs" id="topTabs">${TABS.map(([k, e, t]) => `<a href="#${k}" data-v="${k}">${t}</a>`).join("")}</nav>
    <div class="right">
      <span class="pill" title="Streak · XP">🔥 ${streak()} <span class="muted">·</span> ⭐ ${fmt(xp())}</span>
      <span class="pill count"><span class="lantern">🏮</span><b>${toTet}</b><span class="lg"> ngày tới Tết</span></span>
      <button class="iconbtn" id="menuBtn" aria-label="Cài đặt">☰</button>
    </div></div>`;
  $("#bnav").innerHTML = TABS.map(([k, e, t]) => `<a href="#${k}" data-v="${k}"><span class="e">${e}</span>${t}</a>`).join("");
  $("#menuBtn").onclick = openSettings;
  markNav();
}
function markNav() { const v = currentView(); $$("#topTabs a, #bnav a").forEach(a => a.classList.toggle("on", a.dataset.v === v)); }
const refreshHeader = () => { const r = $("#hdr .right .pill"); if (r) r.innerHTML = `🔥 ${streak()} <span class="muted">·</span> ⭐ ${fmt(xp())}`; };

/* ---------- vision strip ---------- */
function vision(compact) {
  const p = P(), ph = phaseAt(TODAY);
  const photo = Store.all.photos.vision;
  const prog = challengeDay < 1 ? `Challenge bắt đầu sau <b>${1 - challengeDay}</b> ngày (09/11)` : challengeDay > 84 ? "Đã xong 12 tuần challenge 🎉" : `Ngày ${challengeDay}/84 · tuần ${challengeWeek}/12`;
  return `<section class="vision ${compact ? "compact" : ""}">
    <button class="ph" id="visionPh" aria-label="Đổi ảnh vision">${photo ? `<img src="${photo}" alt="Ảnh vision">` : `<span>📷<br>ảnh vision</span>`}</button>
    <div class="why"><q>${esc(p.vision || "Gõ câu \"vì sao\" của bạn trong ☰ Cài đặt")}</q><small>${ph ? ph.name + " · " + ph.focus : ""}</small></div>
    <div class="prog"><div class="lbl"><span>${prog}</span></div><div class="bar"><i style="width:${Math.max(0, Math.min(100, challengeDay / 84 * 100)).toFixed(1)}%"></i></div></div>
  </section>`;
}
document.addEventListener("click", e => { if (e.target.closest("#visionPh")) pickPhoto("vision"); });
function pickPhoto(key, done) {
  const inp = document.createElement("input"); inp.type = "file"; inp.accept = "image/*";
  inp.onchange = () => { const f = inp.files[0]; if (!f) return; shrink(f, 520).then(url => { Store.all.photos[key] = url; Store.save(); FX.cheer("📸", "Đã lưu ảnh", "chỉ lưu trên máy này"); done ? done() : render(); }); };
  inp.click();
}
function shrink(file, max) {
  return new Promise(res => { const img = new Image(), r = new FileReader();
    r.onload = () => { img.onload = () => { const k = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement("canvas"); c.width = img.width * k; c.height = img.height * k;
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); res(c.toDataURL("image/jpeg", .8)); }; img.src = r.result; }; r.readAsDataURL(file); });
}

/* ---------- sheet / modal ---------- */
function sheet(title, body, onMount) {
  const bg = document.createElement("div"); bg.className = "modal-bg";
  bg.innerHTML = `<div class="modal" role="dialog" aria-modal="true"><div class="grab"></div><div class="mh"><h2>${title}</h2><button class="x" aria-label="Đóng">✕</button></div><div class="mb">${body}</div></div>`;
  document.body.appendChild(bg); requestAnimationFrame(() => bg.classList.add("in"));
  const close = () => { bg.classList.remove("in"); setTimeout(() => bg.remove(), 220); removeEventListener("keydown", k); };
  const k = e => { if (e.key === "Escape") close(); };
  addEventListener("keydown", k);
  bg.addEventListener("click", e => { if (e.target === bg || e.target.closest(".x")) close(); });
  onMount && onMount(bg, close);
  return close;
}
async function copyText(t) {
  try { await navigator.clipboard.writeText(t); return true; }
  catch (e) { const a = document.createElement("textarea"); a.value = t; document.body.appendChild(a); a.select(); let ok = false; try { ok = document.execCommand("copy"); } catch (_) { } a.remove(); return ok; }
}
function exportSheet(title, text) {
  sheet(title, `<p class="muted" style="margin-top:0">Copy rồi dán vào Claude Project. Định dạng giống mẫu <b>Daily Tracking/_template.md</b>.</p>
    <textarea class="exp" readonly>${esc(text)}</textarea>
    <div class="row2"><button class="btn" id="cpy">📋 Copy</button>${navigator.share ? `<button class="btn ghost" id="shr">📤 Chia sẻ</button>` : ""}<a class="btn ghost" href="https://claude.ai/projects" target="_blank" rel="noopener">Mở Claude ↗</a></div>`,
    bg => {
      $("#cpy", bg).onclick = async () => { const ok = await copyText(text); FX.cheer(ok ? "📋" : "⚠️", ok ? "Đã copy" : "Không copy được", ok ? "dán vào Claude Project nhé" : "giữ chọn chữ rồi copy tay"); };
      const s = $("#shr", bg); if (s) s.onclick = () => navigator.share({ title, text }).catch(() => { });
    });
}
/* the text block for Claude Project */
function workoutRows(d) {
  const g = Store.gym(iso(d)); if (!g) return [];
  const rows = [];
  Object.values(g.ex || {}).forEach(e => e.sets.forEach((s, i) => { if (s.done) rows.push(`| ${shortName(e.id)} | ${i + 1} | ${s.kg} | ${s.reps} | ${s.rir} |`); }));
  return rows;
}
function dayExport(d) {
  const x = Store.peekDay(iso(d)) || { ticks: {}, main: 0 }, mi = x.main || 0, m = MAINS[mi], L = meal("lunch", mi), Dn = meal("dinner", mi);
  const t = ticksOn(d), miss = CHECKS.filter(c => !t[c[0]]).map(c => c[0] === "move" ? MOVE_LABEL(d) : c[1]);
  const g = Store.gym(iso(d)), rows = workoutRows(d);
  const kcal = Math.round(BREAKFAST_SUM[0] + L.kcal + Dn.kcal), prot = Math.round(BREAKFAST_SUM[1] + L.prot + Dn.prot);
  return [`📋 Tết Body · ${iso(d)} (${WD[d.getDay()]}) · ${MOVE_LABEL(d)}`,
    `Cân sáng: ${x.w ? x.w + " kg" : "—"}${x.waist ? ` · Eo: ${x.waist} cm` : ""}`,
    `Ăn theo thực đơn chuẩn: sáng chuẩn; trưa = tối món mặn ${m[1]} ${m[2]}, cơm ${m[5]} g, rau luộc 100 g, canh; trưa 1 ổi; tối ½ táo + sữa chua (ước ~${fmt(kcal)} kcal, ~${prot} g protein nếu ăn đúng). Ghi thêm phần nào ăn khác.`,
    `Nước: ${fmt((x.water || 0) * .25, 2).replace(/0$/, "")} L · Checklist: ${Object.values(t).filter(Boolean).length}/${CHECKS.length}${miss.length ? " (chưa: " + miss.join(", ") + ")" : ""}`,
    ...(g ? [`Cảm giác trước tập: ${{ low: "mệt", ok: "bình thường", high: "khỏe" }[g.feel] || "—"}`] : []),
    ...(rows.length ? ["", "## Workout", "| Exercise | Set | kg | Reps | RIR |", "|---|---|---|---|---|", ...rows] : [])].join("\n");
}
const exName = id => (EX[id] && EX[id].name) || (SIMPLE_EX[id] && SIMPLE_EX[id].name) || id;
/* short program name ("RDL", "Leg press") — used in exports so they match the Daily Tracking template */
const shortName = id => { for (const m of ["free", "machine"]) for (const s in PROGRAM[m]) { const e = PROGRAM[m][s].find(x => x.id === id); if (e) return e.name; } return exName(id); };

/* ---------- settings ---------- */
function openSettings() {
  const p = P(), has = !!Store.personal();
  sheet("☰ Cài đặt", `
    <h4>👤 Dữ liệu cá nhân ${has ? '<span class="chip green">đã nhập</span>' : '<span class="chip gold">chưa nhập</span>'}</h4>
    <p class="muted small">Số InBody, target, phần thưởng và câu "vì sao" không nằm trong app (vì app để công khai trên mạng). Nhập file <b>Tết Body - dữ liệu cá nhân.json</b> trong vault Health một lần trên mỗi máy.</p>
    <div class="row2"><button class="btn" id="impP">📥 Nhập file cá nhân / sao lưu</button></div>
    <label class="fld">Tên<input id="sName" value="${esc(p.name || "")}" placeholder="Grace"></label>
    <label class="fld">Câu "vì sao"<input id="sWhy" value="${esc(p.vision || "")}" placeholder="Diện áo dài đón Tết…"></label>
    <h4>💾 Sao lưu</h4>
    <p class="muted small">Dữ liệu chỉ nằm trong trình duyệt của máy này. Thỉnh thoảng xuất bản sao lưu vào OneDrive.</p>
    <div class="row2"><button class="btn ghost" id="expB">📤 Xuất sao lưu (.json)</button></div>
    <h4>📲 Cài thành app</h4>
    <p class="small">Điện thoại (Chrome): ⋮ → <b>Thêm vào màn hình chính</b>. Laptop (Edge): ⋯ → <b>Ứng dụng → Cài đặt trang này thành ứng dụng</b> → bật "tạo lối tắt trên màn hình nền".</p>
    <h4>⚠️ Khác</h4>
    <div class="row2"><button class="btn ghost" id="rst" style="color:var(--red2)">Xóa toàn bộ dữ liệu trên máy này</button></div>
    <p class="muted small">Phiên bản ${APP_VERSION}${QS.get("date") ? ` · đang giả lập ngày ${TISO}` : ""}</p>`,
    (bg, close) => {
      const saveP = () => { const q = Object.assign({ kind: "tet-body-personal" }, Store.personal() || {}); q.name = $("#sName", bg).value.trim(); q.vision = $("#sWhy", bg).value.trim(); Store.setPersonal(q); };
      $("#sName", bg).onchange = $("#sWhy", bg).onchange = () => { saveP(); render(); drawHeader(); };
      $("#impP", bg).onclick = () => { const inp = document.createElement("input"); inp.type = "file"; inp.accept = ".json,application/json";
        inp.onchange = () => { const f = inp.files[0]; if (!f) return; f.text().then(t => { try { const k = Store.importJSON(t); close(); FX.celebrate({ emoji: "✅", title: k === "personal" ? "Đã nhập dữ liệu cá nhân" : "Đã khôi phục sao lưu", sub: "" }); drawHeader(); render(); } catch (err) { alert(err.message); } }); };
        inp.click(); };
      $("#expB", bg).onclick = () => { const b = new Blob([Store.exportJSON()], { type: "application/json" }), a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = `tet-body-saoluu-${TISO}.json`; a.click(); };
      $("#rst", bg).onclick = () => { if (confirm("Xóa hết log, tick, ảnh và dữ liệu cá nhân trên máy này? Không hoàn tác được.")) { Store.reset(); close(); drawHeader(); render(); } };
    });
}

/* ---------- tooltips ---------- */
(() => {
  const t = document.createElement("div"); t.className = "tipbox"; document.addEventListener("DOMContentLoaded", () => document.body.appendChild(t));
  const noHover = matchMedia("(hover: none)").matches;
  addEventListener("hashchange", () => { t.style.opacity = 0; });
  document.addEventListener("pointermove", e => {
    if (noHover) return;
    const el = e.target.closest && e.target.closest("[data-tip]");
    if (!el || e.pointerType === "touch") { t.style.opacity = 0; return; }
    t.textContent = el.dataset.tip; t.style.opacity = 1;
    t.style.left = Math.min(e.clientX + 14, innerWidth - t.offsetWidth - 8) + "px"; t.style.top = (e.clientY + 16) + "px";
  });
})();

/* ---------- router ---------- */
const VIEWS = {};
const currentView = () => { const v = (location.hash || "#today").slice(1).split("/")[0]; return VIEWS[v] ? v : "today"; };
function render() { const v = currentView(); markNav(); const el = $("#view"); el.innerHTML = ""; el.className = "wrap v-" + v; VIEWS[v](el); window.scrollTo(0, 0); }
addEventListener("hashchange", render);
addEventListener("DOMContentLoaded", () => {
  drawHeader(); render();
  if (Store.all.settings.welcomed !== TISO && !QS.has("nowelcome")) {
    Store.all.settings.welcomed = TISO; Store.save();
    const p = WEEK_PLAN[TODAY.getDay()];
    setTimeout(() => FX.welcome({ name: userName(), days: toTet, streak: streak(), warn: scoreOn(addD(TODAY, -1)) < KEEP && scoreOn(addD(TODAY, -2)) >= KEEP && challengeDay > 1,
      today: `${p.e} Hôm nay: ${MOVE_LABEL(TODAY)}`, first: "Cân + 500 ml nước, rồi sáng chuẩn", when: "06:45" }, () => { location.hash = "#today"; }), 350);
  }
  if ("serviceWorker" in navigator && location.protocol !== "file:") navigator.serviceWorker.register("sw.js").catch(() => { });
});
