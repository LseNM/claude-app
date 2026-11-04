"use strict";
/* Ăn tab: Nhật ký (4 meals, calorie ring + macro bars, add by photo / name / voice / manual), Thực đơn (FOOD_MENU), Tiến độ (charts).
   A food row: { id, m: bf|lunch|dinner|snack, n, g|null, k, p, c, f, fb, src: plan|photo|text|manual|hist, t } stored in Store.day(d).food */
const r1 = n => Math.round((+n || 0) * 10) / 10;
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const MCOL = { k: "#eb6834", p: "#2a78d6", c: "#e8a317", f: "#6250d6", fb: "#1baf7a" };   // validated set (dataviz validator, light surface)
const mealLabel = m => (MEALS.find(x => x[0] === m) || ["", "", ""])[2];
function foodList(dIso) { const x = Store.peekDay(dIso); return (x && x.food) || []; }
function foodTotals(dIso) { return foodList(dIso).reduce((a, f) => { a.k += +f.k || 0; a.p += +f.p || 0; a.c += +f.c || 0; a.f += +f.f || 0; a.fb += +f.fb || 0; a.n++; return a; }, { k: 0, p: 0, c: 0, f: 0, fb: 0, n: 0 }); }
/* the standard menu meal as one row (numbers follow today's món mặn) */
function planItem(m, mi = 0) {
  if (m === "bf") { const s = BREAKFAST_SUM; return { n: "Sáng chuẩn: sinh tố + 2 trứng", g: null, k: Math.round(s[0]), p: r1(s[1]), c: r1(s[3]), f: r1(s[4]), fb: r1(s[2]) }; }
  const M = MAINS[mi], x = meal(m, mi);
  return { n: `${m === "lunch" ? "Trưa" : "Tối"} chuẩn: cơm ${x.rice} g + ${M[1].toLowerCase()} + rau + canh ${m === "lunch" ? "+ ổi" : "+ ½ táo + sữa chua"}`, g: null, k: x.kcal, p: r1(x.prot), c: r1(x.carb), f: r1(x.fat), fb: r1(x.fib) };
}
function setPlanMeal(dIso, m, on) {
  const d = Store.day(dIso); d.food = (d.food || []).filter(f => !(f.src === "plan" && f.m === m));
  if (on) d.food.push(Object.assign(planItem(m, d.main || 0), { id: uid(), m, src: "plan", t: Date.now() }));
  Store.save();
}
/* checklist tick ⇄ food log: ticking a meal adds the standard meal only if nothing is logged for it yet */
function syncPlanFromTick(dIso, m, on) {
  if (!["bf", "lunch", "dinner"].includes(m)) return;
  const L = foodList(dIso).filter(f => f.m === m);
  if (on && !L.length) setPlanMeal(dIso, m, true);
  if (!on && L.some(f => f.src === "plan")) setPlanMeal(dIso, m, false);
}
const refreshPlanMains = dIso => ["lunch", "dinner"].forEach(m => { if (foodList(dIso).some(f => f.src === "plan" && f.m === m)) setPlanMeal(dIso, m, true); });

/* local "database" for typing a name: what you ate before + every item of the menu */
function localFoods() {
  const plan = [...BREAKFAST.map(b => ({ n: b[1], amt: b[2], k: b[3], p: b[4], fb: b[5], c: b[6], f: b[7] })),
    ...MAINS.map(m => ({ n: m[1], g: parseFloat(m[2]), amt: m[2] + " chín", k: m[4], p: 22, c: 0, f: m[6], fb: 0 })),
    { n: "Cơm trắng", g: 130, k: 169, p: 3.5, c: 36, f: .4, fb: .5 },
    ...[PLATE.seasoning, PLATE.veg, PLATE.soup].map(x => ({ n: x[1], amt: x[2], g: x === PLATE.veg ? 100 : null, k: x[3], p: x[4], fb: x[5], c: x[6], f: x[7] })),
    ...EXTRAS.lunch.concat(EXTRAS.dinner).map(x => ({ n: x[1], k: x[2], p: x[3], fb: x[4], c: x[5], f: x[6] }))].map(x => Object.assign(x, { tag: "thực đơn" }));
  return Store.all.foodHist.map(h => Object.assign({}, h, { tag: `đã ăn ×${h.count || 1}` })).concat(plan);
}
const deacc = s => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "d").toLowerCase();
function searchFoods(q) {
  const w = deacc(q).split(/\s+/).filter(Boolean); if (!w.length) return [];
  return localFoods().filter(x => { const n = deacc(x.n); return w.every(t => n.includes(t)); }).slice(0, 8);
}
const defaultMeal = () => { const h = new Date().getHours() + new Date().getMinutes() / 60; return h < 10.5 ? "bf" : h < 14.5 ? "lunch" : h < 17.5 ? "snack" : "dinner"; };

/* ---------- result editor: AI results, a picked history item, manual entry, or editing a logged row ---------- */
function foodEditor(items, meta) {
  meta = Object.assign({ date: TISO, m: defaultMeal(), src: "manual" }, meta);
  const rows = items.map(x => ({ on: true, n: x.n || "", g: x.g || null, q: 1, k: +x.k || 0, p: +x.p || 0, c: +x.c || 0, f: +x.f || 0, fb: +x.fb || 0, note: x.note || "" }));
  rows.forEach(r => { r.base = { g: r.g, k: r.k, p: r.p, c: r.c, f: r.f, fb: r.fb }; });
  const editing = !!meta.editId, dD = parseISO(meta.date);
  const head = meta.desc ? `<div class="quote">🤖 ${esc(meta.desc)}${meta.conf ? ` <span class="chip ${meta.conf === "high" ? "green" : meta.conf === "low" ? "red" : "gold"}">độ chắc: ${{ high: "cao", medium: "vừa", low: "thấp" }[meta.conf] || meta.conf}</span>` : ""}</div>` : "";
  sheet(editing ? "✏️ Sửa món" : meta.src === "manual" ? "✏️ Tự nhập món" : "🍽️ Kiểm tra trước khi thêm", `${head}
    <p class="small muted" style="margin-top:0">${meta.src === "photo" || meta.src === "text" ? "Số do AI ước, có thể lệch 10–30%. Sửa gram cho đúng phần bạn ăn: các số khác tự tính lại." : "Sửa gram (hoặc số phần) thì calo và macro tự tính lại theo tỉ lệ."}</p>
    <div id="fedRows"></div>
    ${editing ? "" : `<button class="lnk" id="fedAdd">＋ Thêm một dòng</button>`}
    <div class="fedtot" id="fedTot"></div>
    <label class="fld">Bữa<select id="fedM" class="sel">${MEALS.map(([k, e, t]) => `<option value="${k}" ${k === meta.m ? "selected" : ""}>${e} ${t}</option>`).join("")}</select></label>
    <button class="btn big wide" id="fedOk"></button>`,
    (bg, close) => {
      const R = $("#fedRows", bg);
      const draw = () => {
        R.innerHTML = rows.map((r, i) => `<div class="fed ${r.on ? "" : "off"}" data-i="${i}">
          <div class="fed1">${editing ? "" : `<input type="checkbox" data-f="on" ${r.on ? "checked" : ""} aria-label="Lấy món này">`}<input class="fn" data-f="n" value="${esc(r.n)}" placeholder="Tên món"></div>
          <div class="fed2">${r.base.g ? `<label>Gram<input inputmode="decimal" data-f="g" value="${r.g ?? ""}"></label>` : `<label>Số phần<input inputmode="decimal" data-f="q" value="${r.q}"></label>`}
            ${[["k", "kcal"], ["p", "P"], ["c", "C"], ["f", "F"], ["fb", "Xơ"]].map(([k, l]) => `<label style="--mc:${MCOL[k]}">${l}<input inputmode="decimal" data-f="${k}" value="${k === "k" ? Math.round(r[k]) : r1(r[k])}"></label>`).join("")}</div>
          ${r.note ? `<div class="small muted">${esc(r.note)}</div>` : ""}</div>`).join("");
        tot();
      };
      const tot = () => { const s = rows.filter(r => r.on && r.n.trim()).reduce((a, r) => { ["k", "p", "c", "f", "fb"].forEach(k => a[k] += +r[k] || 0); a.n++; return a; }, { k: 0, p: 0, c: 0, f: 0, fb: 0, n: 0 });
        $("#fedTot", bg).innerHTML = `Tổng: <b>${fmt(s.k)} kcal</b> · P ${fmt(s.p, 1)} · C ${fmt(s.c, 1)} · F ${fmt(s.f, 1)} · xơ ${fmt(s.fb, 1)} g`;
        $("#fedOk", bg).textContent = editing ? "💾 Lưu" : `✅ Thêm ${s.n} món vào bữa ${mealLabel($("#fedM", bg).value).toLowerCase()} (${dm(dD)})`; $("#fedOk", bg).disabled = !s.n; };
      const scale = (r, ratio) => ["k", "p", "c", "f", "fb"].forEach(k => r[k] = k === "k" ? Math.round(r.base[k] * ratio) : r1(r.base[k] * ratio));
      R.addEventListener("input", e => {
        const el = e.target, i = +el.closest(".fed").dataset.i, r = rows[i], k = el.dataset.f; if (!k) return;
        if (k === "on") { r.on = el.checked; el.closest(".fed").classList.toggle("off", !r.on); return tot(); }
        if (k === "n") { r.n = el.value; return tot(); }
        const v = parseFloat(el.value.replace(",", ".")); if (isNaN(v)) return;
        if (k === "g" && r.base.g) { r.g = v; scale(r, v / r.base.g); }
        else if (k === "q") { r.q = v; scale(r, v); }
        else { r[k] = v; r.base[k] = r.base.g ? v / (r.g / r.base.g || 1) : v / (r.q || 1); return tot(); }
        $$("input[data-f]", el.closest(".fed")).forEach(x => { const f = x.dataset.f; if (["k", "p", "c", "f", "fb"].includes(f)) x.value = f === "k" ? Math.round(r[f]) : r1(r[f]); });
        tot();
      });
      $("#fedM", bg).onchange = tot;
      const add = $("#fedAdd", bg); if (add) add.onclick = () => { const r = { on: true, n: "", g: 100, q: 1, k: 0, p: 0, c: 0, f: 0, fb: 0 }; r.base = { g: 100, k: 0, p: 0, c: 0, f: 0, fb: 0 }; rows.push(r); draw(); };
      $("#fedOk", bg).onclick = () => {
        const m = $("#fedM", bg).value, d = Store.day(meta.date), before = foodTotals(meta.date);
        d.food = d.food || [];
        const keep = rows.filter(r => r.on && r.n.trim()).map(r => ({ n: r.n.trim(), g: r.base.g ? r1(r.g) : null, k: Math.round(r.k), p: r1(r.p), c: r1(r.c), f: r1(r.f), fb: r1(r.fb) }));
        if (editing) { const i = d.food.findIndex(x => x.id === meta.editId); if (i >= 0) { const old = d.food[i]; d.food[i] = Object.assign({}, old, keep[0], { m, src: old.src === "plan" ? "manual" : old.src }); if (old.src === "plan") d.ticks[old.m] = 0; } }
        else keep.forEach(x => d.food.push(Object.assign(x, { id: uid(), m, src: meta.src, t: Date.now() })));
        keep.forEach(x => Store.remember(x)); Store.save(); close();
        const after = foodTotals(meta.date);
        if (before.p < MACRO_T.p.lo && after.p >= MACRO_T.p.lo) FX.celebrate({ emoji: "💪", title: "Đủ protein hôm nay!", sub: `${fmt(after.p)} g ≥ ${MACRO_T.p.lo} g · giữ cơ khi giảm mỡ` });
        else if (before.k <= MACRO_T.k.hi && after.k > MACRO_T.k.hi) FX.cheer("🫣", `Đã ${fmt(after.k)} kcal`, `quá ${fmt(after.k - MACRO_T.k.t)} so với 1,540: bữa sau nhẹ hơn chút, không sao`);
        else FX.cheer("🍽️", editing ? "Đã lưu" : `Đã thêm ${keep.length} món`, `hôm đó: ${fmt(after.k)} kcal · ${fmt(after.p)} g protein`);
        if (location.hash.startsWith("#food")) render(); else location.hash = "#food/log";
      };
      draw();
    });
}
AI.on("food", (obj, meta) => { const L = AI.foods(obj); if (!L.length) return FX.cheer("⚠️", "AI không thấy món nào", "thử chụp gần hơn hoặc gõ tên"); foodEditor(L, Object.assign({}, meta, { desc: obj.desc, conf: obj.confidence })); });

/* ---------- InBody result → phase "Hiện tại" + a dated log ---------- */
AI.on("inbody", (o, meta) => {
  const F = [["w", "Cân (kg)"], ["pbf", "PBF (%)"], ["smm", "SMM (kg)"], ["fat", "Mỡ (kg)"], ["vfl", "Mỡ nội tạng (VFL)"], ["whr", "Eo/hông (WHR)"], ["score", "Điểm InBody"]];
  const date = /^\d{4}-\d{2}-\d{2}$/.test(o.date || "") ? o.date : TISO, ph0 = (phaseAt(parseISO(date)) || PHASES.find(p => p.id === meta.ph) || PHASES[0]).id;
  sheet("📊 Kiểm tra số InBody", `<p class="small muted" style="margin-top:0">So từng số với tờ giấy rồi sửa nếu AI đọc nhầm.</p>
    <div class="ibgrid"><label class="fld">Ngày đo<input id="ibD" type="date" value="${date}"></label>
      <label class="fld">Giai đoạn<select id="ibP" class="sel">${PHASES.filter(p => !p.faded).map(p => `<option value="${p.id}" ${p.id === ph0 ? "selected" : ""}>${p.name}</option>`).join("")}</select></label>
      ${F.map(([k, l]) => `<label class="fld">${l}<input inputmode="decimal" data-k="${k}" value="${o[k] ?? ""}"></label>`).join("")}</div>
    <button class="btn big wide" id="ibOk">💾 Lưu vào Lộ trình</button>`, (bg, close) => {
    $("#ibOk", bg).onclick = () => {
      const v = {}; $$("input[data-k]", bg).forEach(i => { const n = parseFloat(i.value.replace(",", ".")); v[i.dataset.k] = isNaN(n) ? null : n; });
      const p = Store.personal() || { kind: "tet-body-personal" }; p.inbody = p.inbody || {}; p.inbodyLog = p.inbodyLog || [];
      const ph = $("#ibP", bg).value, d = $("#ibD", bg).value || TISO;
      p.inbody[ph] = Object.assign({}, p.inbody[ph], { pbf: v.pbf, smm: v.smm, fat: v.fat });
      p.inbodyLog = p.inbodyLog.filter(x => x.date !== d).concat([Object.assign({ date: d }, v)]).sort((a, b) => a.date < b.date ? -1 : 1);
      Store.setPersonal(p); close(); FX.celebrate({ emoji: "📊", title: "Đã lưu InBody", sub: [v.pbf != null ? `PBF ${v.pbf}%` : "", v.smm != null ? `SMM ${v.smm} kg` : ""].filter(Boolean).join(" · ") }); render();
    };
  });
});

(() => {
  let sub = "log", off = 0, curM = null, range = 7, pick = null;
  VIEWS.food = el => {
    const h = location.hash.split("/")[1]; if (["log", "menu", "stats"].includes(h)) sub = h;
    el.innerHTML = `<div class="subtabs">${[["log", "📝 Nhật ký"], ["menu", "📖 Thực đơn"], ["stats", "📈 Tiến độ"]].map(([k, t]) => `<a href="#food/${k}" class="${k === sub ? "on" : ""}">${t}</a>`).join("")}</div><div id="sub"></div>`;
    ({ log, menu: FOOD_MENU, stats })[sub]($("#sub"));
  };

  /* ---------------- Nhật ký ---------------- */
  function ring(k) {
    const T = MACRO_T.k, C = 2 * Math.PI * 52, pct = Math.min(1, k / T.t), col = k > T.hi ? "#eb6834" : k >= T.lo ? "#1f9a63" : "#e8a317", left = Math.round(T.t - k);
    return `<div class="fring"><svg viewBox="0 0 132 132" aria-hidden="true"><circle cx="66" cy="66" r="52" fill="none" stroke="#fdf0e0" stroke-width="14"/>
      ${k > 0 ? `<circle cx="66" cy="66" r="52" fill="none" stroke="${col}" stroke-width="14" stroke-linecap="round" stroke-dasharray="${C * pct} ${C}" transform="rotate(-90 66 66)"/>` : ""}</svg>
      <div class="c"><b>${fmt(k)}</b><span>/ ${fmt(T.t)} kcal</span><em class="${left < 0 ? "over" : ""}">${left >= 0 ? `còn ${fmt(left)}` : `quá ${fmt(-left)}`}</em></div></div>`;
  }
  function meter(key, v) {
    v = Math.round(v); const T = MACRO_T[key], ok = v >= T.lo && v <= T.hi, rng = T.hi < 999 ? `${T.lo}–${T.hi}` : `≥ ${T.lo}`;
    const st = v === 0 ? "" : ok ? "✅" : v < T.lo ? `thiếu ${fmt(T.lo - v)}` : `dư ${fmt(v - T.hi)}`;
    return `<div><div class="l"><span>${T.lab}</span><span>${fmt(v)} / ${rng} ${T.u} <small class="${ok ? "okc" : ""}">${st}</small></span></div>
      <div class="meter"><i style="width:${Math.min(100, v / T.max * 100)}%;background:${MCOL[key]}"></i><s style="left:${T.lo / T.max * 100}%"></s>${T.hi < 999 ? `<s style="left:${T.hi / T.max * 100}%"></s>` : ""}</div></div>`;
  }
  function log(el) {
    const D = addD(TODAY, off), dI = iso(D), T = foodTotals(dI), L = foodList(dI), d = Store.peekDay(dI) || {};
    if (!curM) curM = defaultMeal();
    const dayName = off === 0 ? "Hôm nay" : off === -1 ? "Hôm qua" : WDN[D.getDay()][0].toUpperCase() + WDN[D.getDay()].slice(1);
    el.innerHTML = `
    <section class="card fsum"><div class="dnav"><button data-o="-1" aria-label="Ngày trước">‹</button><b>${dayName}, ${dm(D)}</b><button data-o="1" aria-label="Ngày sau" ${off >= 0 ? "disabled" : ""}>›</button></div>
      <div class="fsum-in">${ring(T.k)}<div class="tot">${["p", "c", "f", "fb"].map(k => meter(k, T[k])).join("")}</div></div></section>
    <section class="card fadd"><div class="mpick" role="group" aria-label="Thêm vào bữa">${MEALS.map(([k, e, t]) => `<button data-m="${k}" class="${k === curM ? "on" : ""}" aria-pressed="${k === curM}">${e} ${t}</button>`).join("")}</div>
      <div class="addgrid"><button data-a="photo"><span>📸</span>Chụp hình</button><button data-a="text"><span>🔍</span>Gõ tên</button><button data-a="voice"><span>🎤</span>Nói</button><button data-a="manual"><span>✏️</span>Tự nhập</button></div>
      <div class="small muted">Thêm vào bữa <b>${mealLabel(curM).toLowerCase()}</b>. Ăn đúng thực đơn thì bấm ✅ ở bữa đó, chỉ cần chụp món ăn ngoài.</div></section>
    ${MEALS.map(([k, e, t]) => { const it = L.filter(f => f.m === k), s = it.reduce((a, f) => [a[0] + (+f.k || 0), a[1] + (+f.p || 0)], [0, 0]), hasPlan = it.some(f => f.src === "plan");
      const pi = k !== "snack" ? planItem(k, d.main || 0) : null;
      return `<section class="card fmeal"><div class="fmh"><b>${e} ${t}</b><span class="k">${it.length ? `${fmt(s[0])} kcal · ${fmt(s[1])} g P` : "chưa ghi"}</span></div>
        ${it.map(f => `<div class="fi" data-id="${f.id}"><div class="fit"><b>${esc(f.n)}</b>${f.g ? ` <span class="muted">${fmt(f.g)} g</span>` : ""}${f.src === "plan" ? ` <span class="chip green">thực đơn</span>` : f.src === "photo" || f.src === "text" ? ` <span class="chip blue">AI ước</span>` : ""}
          <small>P ${fmt(f.p, 1)} · C ${fmt(f.c, 1)} · F ${fmt(f.f, 1)} · xơ ${fmt(f.fb, 1)}</small></div><span class="kc">${fmt(f.k)}</span>
          <button class="ib" data-ed="${f.id}" aria-label="Sửa ${esc(f.n)}">✏️</button><button class="ib" data-del="${f.id}" aria-label="Xóa ${esc(f.n)}">🗑</button></div>`).join("")}
        ${pi && !it.length ? `<button class="planbtn" data-plan="${k}">✅ Ăn đúng thực đơn <span>${fmt(pi.k)} kcal · ${fmt(pi.p)} g P</span></button>`
          : pi && !hasPlan ? `<button class="lnk" data-plan="${k}">＋ Thêm cả phần thực đơn chuẩn (${fmt(pi.k)} kcal)</button>` : ""}</section>`; }).join("")}`;
    $(".dnav", el).onclick = e => { const b = e.target.closest("button[data-o]"); if (!b || b.disabled) return; off = Math.min(0, off + +b.dataset.o); log(el); };
    $(".mpick", el).onclick = e => { const b = e.target.closest("button[data-m]"); if (b) { curM = b.dataset.m; log(el); } };
    $(".addgrid", el).onclick = e => { const b = e.target.closest("button[data-a]"); if (!b) return; const meta = { date: dI, m: curM }, a = b.dataset.a;
      if (a === "photo") pickImage(img => AI.open({ kind: "food", title: `📸 Bữa ${mealLabel(curM).toLowerCase()} ${dm(D)}`, img, meta: Object.assign(meta, { src: "photo" }) }));
      else if (a === "manual") foodEditor([{ n: "", g: 100, k: 0, p: 0, c: 0, f: 0, fb: 0 }], Object.assign(meta, { src: "manual" }));
      else textSheet(meta, a === "voice");
    };
    el.onclick = e => {
      const p = e.target.closest("[data-plan]"), ed = e.target.closest("[data-ed]"), del = e.target.closest("[data-del]");
      if (p) { const m = p.dataset.plan, dd = Store.day(dI); setPlanMeal(dI, m, true); dd.ticks[m] = 1; Store.save(); const t = foodTotals(dI);
        FX.celebrate({ emoji: "✅", title: `${mealLabel(m)} đúng thực đơn`, sub: `+10 XP · hôm đó ${fmt(t.k)} kcal, ${fmt(t.p)} g protein` }); refreshHeader(); log(el); }
      else if (ed) { const f = foodList(dI).find(x => x.id === ed.dataset.ed); if (f) foodEditor([f], { date: dI, m: f.m, src: f.src, editId: f.id }); }
      else if (del) { const dd = Store.day(dI), f = dd.food.find(x => x.id === del.dataset.del); if (!f || !confirm(`Xóa "${f.n}"?`)) return;
        dd.food = dd.food.filter(x => x.id !== f.id); if (f.src === "plan") dd.ticks[f.m] = 0; Store.save(); refreshHeader(); log(el); }
    };
  }

  /* type a name (or say it): local matches first, AI when it's something new */
  function textSheet(meta, voice) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    sheet(voice ? "🎤 Nói món bạn ăn" : "🔍 Gõ tên món", `
      <div class="tsrow"><input id="tsQ" class="tsq" placeholder="vd: 1 tô phở bò, 200g cá hồi áp chảo…" autocomplete="off">${SR ? `<button class="btn ghost mic" id="tsMic" aria-label="Nói">🎤</button>` : ""}</div>
      <div class="small muted" id="tsHint">${SR ? "Nói tiếng Việt, càng rõ gram/số lượng càng chuẩn. " : ""}Món từng ăn và món trong thực đơn hiện ngay bên dưới.</div>
      <div id="tsList" class="tslist"></div>
      <button class="btn big wide" id="tsAI" disabled>🤖 Hỏi AI món này</button>`, (bg, close) => {
      const q = $("#tsQ", bg), list = $("#tsList", bg), ai = $("#tsAI", bg); let found = [];
      const upd = () => { found = searchFoods(q.value); ai.disabled = !q.value.trim();
        list.innerHTML = found.map((x, i) => `<button class="tsi" data-i="${i}"><b>${esc(x.n)}</b><span>${x.g ? fmt(x.g) + " g · " : x.amt ? esc(x.amt) + " · " : ""}${fmt(x.k)} kcal · P ${fmt(x.p, 1)}</span><em>${x.tag}</em></button>`).join("") ||
          (q.value.trim() ? `<div class="muted small">Chưa có trong lịch sử, bấm "Hỏi AI".</div>` : ""); };
      q.oninput = upd; setTimeout(() => q.focus(), 50);
      list.onclick = e => { const b = e.target.closest(".tsi"); if (!b) return; const x = found[+b.dataset.i]; close(); foodEditor([x], Object.assign({}, meta, { src: "hist" })); };
      ai.onclick = () => { const t = q.value.trim(); if (!t) return; close(); AI.open({ kind: "food", title: `🔍 ${t}`, text: t, meta: Object.assign({}, meta, { src: "text" }) }); };
      const mic = $("#tsMic", bg);
      if (mic) { let rec = null;
        const start = () => { if (rec) { rec.stop(); return; } rec = new SR(); rec.lang = "vi-VN"; rec.interimResults = true; rec.continuous = false;
          mic.classList.add("rec"); $("#tsHint", bg).textContent = "🔴 Đang nghe… nói xong tự dừng.";
          rec.onresult = e => { q.value = [...e.results].map(r => r[0].transcript).join(" "); upd(); };
          rec.onerror = e => { if (e.error !== "no-speech") FX.cheer("⚠️", "Micro lỗi", e.error === "not-allowed" ? "cho phép micro trong cài đặt trình duyệt" : e.error); };
          rec.onend = () => { rec = null; mic.classList.remove("rec"); $("#tsHint", bg).textContent = q.value ? "Sửa chữ nếu nghe nhầm, rồi bấm Hỏi AI." : "Không nghe được, bấm 🎤 nói lại."; };
          try { rec.start(); } catch (e) { rec = null; } };
        mic.onclick = start; if (voice) setTimeout(start, 250);
      } else if (voice) $("#tsHint", bg).textContent = "Trình duyệt này không hỗ trợ giọng nói (dùng Chrome/Edge). Gõ tên món nhé.";
    });
  }

  /* ---------------- Tiến độ ---------------- */
  function stats(el) {
    const D = Array.from({ length: range }, (_, i) => addD(TODAY, i - range + 1)), V = D.map(d => { const t = foodTotals(iso(d)); return t.n ? t : null; });
    const got = V.filter(Boolean), avg = k => got.length ? got.reduce((a, t) => a + t[k], 0) / got.length : 0;
    const okP = got.filter(t => t.p >= MACRO_T.p.lo).length, okK = got.filter(t => t.k >= MACRO_T.k.lo && t.k <= MACRO_T.k.hi).length;
    const kc = got.reduce((a, t) => [a[0] + t.p * 4, a[1] + t.c * 4, a[2] + t.f * 9], [0, 0, 0]), ks = kc[0] + kc[1] + kc[2] || 1, sh = kc.map(x => Math.round(x / ks * 100));
    el.innerHTML = `<section class="card"><div class="whd"><h3>📈 Ăn ${range} ngày qua</h3><div class="seg" id="rg">${[7, 14, 30].map(n => `<button data-n="${n}" class="${n === range ? "on" : ""}">${n} ngày</button>`).join("")}</div></div>
      ${got.length ? `<div class="stats"><div class="stat"><small>TB calo</small><b>${fmt(avg("k"))} <span>kcal</span></b><div class="d ${avg("k") <= MACRO_T.k.hi ? "good" : ""}">mục tiêu 1,540</div></div>
        <div class="stat"><small>TB protein</small><b>${fmt(avg("p"))} <span>g</span></b><div class="d ${avg("p") >= MACRO_T.p.lo ? "good" : ""}">mục tiêu ≥ 110</div></div>
        <div class="stat"><small>Ngày đủ protein</small><b>${okP}<span>/${got.length}</span></b><div class="d">ngày có ghi</div></div>
        <div class="stat"><small>Calo đúng khoảng</small><b>${okK}<span>/${got.length}</span></b><div class="d">1,440–1,640</div></div></div>` : `<p class="muted">Chưa có ngày nào ghi món ăn trong ${range} ngày qua. Ghi ở <a href="#food/log">Nhật ký</a> (bấm ✅ thực đơn là nhanh nhất).</p>`}</section>
    ${got.length ? `<section class="card"><h3>🔥 Calo mỗi ngày <span class="sub">vạch = 1,540 · dải xanh = 1,440–1,640</span></h3>${bars(D, V, "k", { band: [MACRO_T.k.lo, MACRO_T.k.hi], line: MACRO_T.k.t, max: 2000 })}</section>
    <section class="card"><h3>💪 Protein mỗi ngày <span class="sub">vạch = 110 g tối thiểu</span></h3>${bars(D, V, "p", { line: MACRO_T.p.lo, max: 150 })}</section>
    <section class="card"><h3>🥗 Calo đến từ đâu</h3>
      <div class="split" role="img" aria-label="Trung bình: protein ${sh[0]}%, carb ${sh[1]}%, fat ${sh[2]}% calo">${["p", "c", "f"].map((k, i) => `<i style="width:${sh[i]}%;background:${MCOL[k]}"></i>`).join("")}</div>
      <div class="legend3">${[["p", "Protein", 0, "~29%"], ["c", "Carb", 1, "~47%"], ["f", "Fat", 2, "~24%"]].map(([k, l, i, t]) => `<span><i style="background:${MCOL[k]}"></i>${l} <b>${sh[i]}%</b> <small>(thực đơn ${t})</small></span>`).join("")}</div>
      <p class="small muted">Trung bình các ngày có ghi. Protein, carb × 4 kcal/g; fat × 9 kcal/g.</p>
      <details class="small"><summary>Xem bảng số từng ngày</summary><div class="tscroll"><table class="nt"><tr><th>Ngày</th><th class="n">Kcal</th><th class="n">P</th><th class="n">C</th><th class="n">F</th><th class="n">Xơ</th></tr>
        ${D.map((d, i) => V[i] ? `<tr><td>${WD[d.getDay()]} ${dm(d)}</td><td class="n">${fmt(V[i].k)}</td><td class="n">${fmt(V[i].p)}</td><td class="n">${fmt(V[i].c)}</td><td class="n">${fmt(V[i].f)}</td><td class="n">${fmt(V[i].fb)}</td></tr>` : "").join("")}</table></div></details></section>` : ""}`;
    $("#rg", el).onclick = e => { const b = e.target.closest("button[data-n]"); if (b) { range = +b.dataset.n; stats(el); } };
    $$(".bchart", el).forEach(c => c.addEventListener("click", e => { const b = e.target.closest("[data-i]"); if (!b) return; const i = +b.dataset.i, v = V[i], o = $(".readout", c.parentNode);
      $$("[data-i].sel", c).forEach(x => x.classList.remove("sel")); $$(`[data-i="${i}"]`, c).forEach(x => x.classList.add("sel"));
      o.innerHTML = v ? `<b>${WDN[D[i].getDay()]} ${dm(D[i])}</b>: ${fmt(v.k)} kcal · P ${fmt(v.p)} · C ${fmt(v.c)} · F ${fmt(v.f)} · xơ ${fmt(v.fb)} g` : `<b>${dm(D[i])}</b>: chưa ghi`; }));
  }
  /* single-series bar chart: rounded data-end, baseline-anchored, recessive grid, target line(s), tap/hover readout */
  function bars(D, V, key, o) {
    const W = 440, Hh = 200, L = 40, R = 8, T = 14, B = 26, n = D.length, cw = (W - L - R) / n, bw = Math.max(4, Math.min(34, cw * .62)), y = v => T + (Hh - T - B) * (1 - Math.min(v, o.max) / o.max);
    const ticks = key === "k" ? [0, 500, 1000, 1500, 2000] : [0, 50, 100, 150];
    let s = ticks.map(t => `<line x1="${L}" x2="${W - R}" y1="${y(t)}" y2="${y(t)}" stroke="#f0e3d2"/><text x="${L - 6}" y="${y(t) + 4}" text-anchor="end" font-size="12" fill="#9a8a7e">${fmt(t)}</text>`).join("");
    if (o.band) s += `<rect x="${L}" width="${W - L - R}" y="${y(o.band[1])}" height="${y(o.band[0]) - y(o.band[1])}" fill="#e2f4ea" opacity=".8"/>`;
    D.forEach((d, i) => { const x = L + i * cw + (cw - bw) / 2, v = V[i] && V[i][key], tip = V[i] ? `${dm(d)}: ${fmt(v)} ${key === "k" ? "kcal" : "g"}` : `${dm(d)}: chưa ghi`;
      s += `<rect data-i="${i}" x="${L + i * cw}" y="${T}" width="${cw}" height="${Hh - T - B}" fill="transparent" data-tip="${tip}"/>`;
      if (v) { const top = y(v), h = y(0) - top, rr = Math.min(4, bw / 2, h); s += `<path data-i="${i}" class="bar" d="M${x} ${y(0)} V${top + rr} Q${x} ${top} ${x + rr} ${top} H${x + bw - rr} Q${x + bw} ${top} ${x + bw} ${top + rr} V${y(0)} Z" fill="${MCOL[key]}" data-tip="${tip}"/>`; }
      else s += `<rect x="${x}" y="${y(0) - 3}" width="${bw}" height="3" rx="1.5" fill="#e6d5bf"/>`;
      if (n <= 14 || i % 5 === n % 5 || i === n - 1) s += `<text x="${L + i * cw + cw / 2}" y="${Hh - 8}" text-anchor="middle" font-size="12" fill="${iso(d) === TISO ? "#2b1d14" : "#9a8a7e"}" font-weight="${iso(d) === TISO ? 800 : 400}">${n <= 7 ? WD[d.getDay()] + " " : ""}${d.getDate()}</text>`; });
    if (o.line) s += `<line x1="${L}" x2="${W - R}" y1="${y(o.line)}" y2="${y(o.line)}" stroke="#2b1d14" stroke-width="2"/><text x="${W - R}" y="${y(o.line) - 5}" text-anchor="end" font-size="12" font-weight="700" fill="#6b5a4e">${fmt(o.line)}</text>`;
    return `<svg class="bchart" viewBox="0 0 ${W} ${Hh}" role="img" aria-label="${MACRO_T[key].lab} mỗi ngày, ${range} ngày">${s}</svg><div class="readout small muted">Chạm vào một cột để xem số.</div>`;
  }
})();
