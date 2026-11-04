"use strict";
/* Ăn tab (v2): Hôm nay (icons per meal, one pot for lunch + dinner, tap a dish → grams & calories), Thực đơn (FOOD_MENU), Tiến độ (charts).
   Extra items (photo of a dish, history picks, snacks): Store.day(d).food rows { id, m, n, e, g, k, p, c, f, fb, src, t }. */
const r1 = n => Math.round((+n || 0) * 10) / 10;
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const MCOL = { k: "#eb6834", p: "#2a78d6", c: "#e8a317", f: "#6250d6", fb: "#1baf7a" };   // validated set (dataviz validator, light surface)
const mealLabel = m => (MEALS.find(x => x[0] === m) || ["", "", ""])[2];
const deacc = s => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "d").toLowerCase();
function foodList(dIso) { const x = Store.peekDay(dIso); return (x && x.food) || []; }
/* eaten totals (ticked plan meals + extras); n = how many things were logged */
function foodTotals(dIso) {
  const v = dayEaten(dIso), x = Store.peekDay(dIso) || { ticks: {} }, n = ["bf", "lunch", "dinner"].filter(m => (x.ticks || {})[m]).length + extraItems(dIso).length;
  return { k: v[0], p: v[1], c: v[2], f: v[3], fb: v[4], n };
}
const defaultMeal = () => { const h = new Date().getHours() + new Date().getMinutes() / 60; return h < 10.5 ? "bf" : h < 14.5 ? "lunch" : h < 17.5 ? "snack" : "dinner"; };
/* custom foods learned from AI (per 100 g raw), kept on this device */
(Store.all.settings.customFoods && Object.assign(FOODS, Store.all.settings.customFoods));
function learnFood(it) {
  const key = "x_" + deacc(it.n).replace(/[^a-z0-9]+/g, "_").slice(0, 30), g = it.g || 100;
  const x = { e: foodEmoji(it.n), n: it.n, u: "g", k: r1(it.k * 100 / g), p: r1(it.p * 100 / g), c: r1(it.c * 100 / g), f: r1(it.f * 100 / g), fb: r1(it.fb * 100 / g), src: "ai" };
  FOODS[key] = x; (Store.all.settings.customFoods = Store.all.settings.customFoods || {})[key] = x; Store.save(); return key;
}
const nums = v => `<div class="big4"><div><b class="num">${fmt(v[0])}</b><small>kcal</small></div><div><b class="num">${fmt(v[1], 1)}</b><small>Protein</small></div><div><b class="num">${fmt(v[2], 1)}</b><small>Carb</small></div><div><b class="num">${fmt(v[3], 1)}</b><small>Fat</small></div></div>`;

/* ---------- the pop-up for one dish: grams (or units) → calories + macros, live ---------- */
function gramSheet(key, q0, o) {
  const x = FOODS[key], unit = x.u !== "g", step = unit ? (x.u === "phần" ? .5 : 1) : 10;
  const chips = unit ? [1, 2, 3] : [50, 100, 150, 200, 250, 300];
  const mainI = x.main;
  sheet(`${x.e} ${shortN(x.n)}`, `<div class="lbl">${o.pot ? "Cả nồi trưa + tối" + (unit ? "" : key === "com" ? " · cân chín" : " · cân sống") : unit ? "Số lượng" : "Khối lượng" + (key === "com" ? " (chín)" : "")}</div>
    <div class="stepper"><button data-s="-${step}" aria-label="Bớt">−</button><input id="gIn" class="num" inputmode="decimal" value="${q0}" aria-label="${unit ? x.u : "gram"}"><span class="u">${unit ? x.u : "g"}</span><button data-s="${step}" aria-label="Thêm">＋</button></div>
    <div class="chips">${chips.map(c => `<button data-g="${c}">${c}${unit ? "" : " g"}</button>`).join("")}</div>
    <div id="gOut"></div>
    ${mainI != null && o.dIso ? `<label class="fld">Đổi món mặn<select id="gMain" class="sel">${MAINS.map((m, i) => `<option value="${i}" ${i === mainI ? "selected" : ""}>${m[0]} ${m[1]}</option>`).join("")}</select></label>` : ""}
    <p class="note">${unit ? `1 ${x.u}` : `100 g ${key === "com" ? "chín" : "sống"}`}: ${fmt(x.k)} kcal · P ${x.p} · C ${x.c} · F ${x.f} g${x.note ? " · " + x.note : ""}${x.src === "menu" ? " (file Thực đơn 1,540 kcal)" : x.src === "ai" ? " (AI ước, lưu trên máy này)" : " (giá trị trung bình)"}</p>
    <div class="row2">${o.onSave ? `<button class="btn" id="gOk" style="flex:1">${o.okLabel || "Lưu"}</button>` : ""}${o.onDelete ? `<button class="btn ghost" id="gDel">Bỏ món</button>` : ""}</div>`, (bg, close) => {
    const inp = $("#gIn", bg), draw = () => { const q = parseFloat(String(inp.value).replace(",", ".")) || 0, v = fval(key, q);
      $("#gOut", bg).innerHTML = nums(v) + (o.pot ? `<div class="perm">Mỗi bữa (½ nồi): <b>${qtyLabel(key, q / 2)}</b> · ${fmt(v[0] / 2)} kcal · P ${fmt(v[1] / 2, 1)} g</div>` : ""); };
    bg.addEventListener("click", e => { const s = e.target.closest("[data-s]"), c = e.target.closest("[data-g]");
      if (s) inp.value = +Math.max(0, (parseFloat(inp.value) || 0) + +s.dataset.s).toFixed(1); if (c) inp.value = c.dataset.g; if (s || c) draw(); });
    inp.oninput = draw; draw();
    const ok = $("#gOk", bg); if (ok) ok.onclick = () => { close(); o.onSave(parseFloat(String(inp.value).replace(",", ".")) || 0); };
    const del = $("#gDel", bg); if (del) del.onclick = () => { close(); o.onDelete(); };
    const gm = $("#gMain", bg); if (gm) gm.onchange = () => { setMain(o.dIso, +gm.value); close(); FX.cheer(MAINS[+gm.value][0], "Đã đổi món mặn", MAINS[+gm.value][1]); render(); };
  });
}

/* ---------- editor for free-form items (photo of a dish, history, manual, editing) ---------- */
function foodEditor(items, meta) {
  meta = Object.assign({ date: TISO, m: defaultMeal(), src: "manual" }, meta);
  const rows = items.map(x => ({ on: true, n: x.n || "", e: x.e, g: x.g || null, q: 1, k: +x.k || 0, p: +x.p || 0, c: +x.c || 0, f: +x.f || 0, fb: +x.fb || 0 }));
  rows.forEach(r => { r.base = { g: r.g, k: r.k, p: r.p, c: r.c, f: r.f, fb: r.fb }; });
  const editing = !!meta.editId, dD = parseISO(meta.date);
  sheet(editing ? "Sửa món" : meta.src === "manual" ? "Tự nhập món" : "Kiểm tra trước khi thêm", `${meta.desc ? `<div class="quote">${esc(meta.desc)}${meta.by ? ` <span class="chip">${esc(meta.by)}</span>` : ""}</div>` : ""}
    <div id="fedRows"></div>${editing ? "" : `<button class="lnk" id="fedAdd">＋ Thêm một dòng</button>`}
    <div class="fedtot" id="fedTot"></div>
    <div class="mseg" id="fedM">${MEALS.map(([k, , t]) => `<button data-m="${k}" class="${k === meta.m ? "on" : ""}">${t}</button>`).join("")}</div>
    <div class="row2"><button class="btn" id="fedOk" style="flex:1"></button>${editing ? `<button class="btn ghost" id="fedDel">Xóa</button>` : ""}</div>`,
    (bg, close) => {
      const R = $("#fedRows", bg); let m = meta.m;
      const draw = () => { R.innerHTML = rows.map((r, i) => `<div class="fed ${r.on ? "" : "off"}" data-i="${i}">
          <div class="fed1">${editing ? "" : `<input type="checkbox" data-f="on" ${r.on ? "checked" : ""} aria-label="Lấy món này">`}<input class="fn" data-f="n" value="${esc(r.n)}" placeholder="Tên món"></div>
          <div class="fed2">${r.base.g ? `<label>Gram<input inputmode="decimal" data-f="g" value="${r.g ?? ""}"></label>` : `<label>Số phần<input inputmode="decimal" data-f="q" value="${r.q}"></label>`}
            ${[["k", "kcal"], ["p", "P"], ["c", "C"], ["f", "F"], ["fb", "Xơ"]].map(([k, l]) => `<label style="--mc:${MCOL[k]}">${l}<input inputmode="decimal" data-f="${k}" value="${k === "k" ? Math.round(r[k]) : r1(r[k])}"></label>`).join("")}</div></div>`).join(""); tot(); };
      const tot = () => { const s = rows.filter(r => r.on && r.n.trim()).reduce((a, r) => { ["k", "p", "c", "f", "fb"].forEach(k => a[k] += +r[k] || 0); a.n++; return a; }, { k: 0, p: 0, c: 0, f: 0, fb: 0, n: 0 });
        $("#fedTot", bg).innerHTML = `Tổng <b>${fmt(s.k)} kcal</b> · P ${fmt(s.p, 1)} · C ${fmt(s.c, 1)} · F ${fmt(s.f, 1)} g`;
        $("#fedOk", bg).textContent = editing ? "Lưu" : `Thêm ${s.n} món vào bữa ${mealLabel(m).toLowerCase()} ${dm(dD)}`; $("#fedOk", bg).disabled = !s.n; };
      const scale = (r, ratio) => ["k", "p", "c", "f", "fb"].forEach(k => r[k] = k === "k" ? Math.round(r.base[k] * ratio) : r1(r.base[k] * ratio));
      R.addEventListener("input", e => {
        const el = e.target, r = rows[+el.closest(".fed").dataset.i], k = el.dataset.f; if (!k) return;
        if (k === "on") { r.on = el.checked; el.closest(".fed").classList.toggle("off", !r.on); return tot(); }
        if (k === "n") { r.n = el.value; return tot(); }
        const v = parseFloat(el.value.replace(",", ".")); if (isNaN(v)) return;
        if (k === "g" && r.base.g) { r.g = v; scale(r, v / r.base.g); } else if (k === "q") { r.q = v; scale(r, v); }
        else { r[k] = v; r.base[k] = r.base.g ? v / (r.g / r.base.g || 1) : v / (r.q || 1); return tot(); }
        $$("input[data-f]", el.closest(".fed")).forEach(x => { const f = x.dataset.f; if (["k", "p", "c", "f", "fb"].includes(f)) x.value = f === "k" ? Math.round(r[f]) : r1(r[f]); }); tot();
      });
      $("#fedM", bg).onclick = e => { const b = e.target.closest("[data-m]"); if (!b) return; m = b.dataset.m; $$("#fedM button", bg).forEach(x => x.classList.toggle("on", x === b)); tot(); };
      const add = $("#fedAdd", bg); if (add) add.onclick = () => { const r = { on: true, n: "", g: 100, q: 1, k: 0, p: 0, c: 0, f: 0, fb: 0 }; r.base = { g: 100, k: 0, p: 0, c: 0, f: 0, fb: 0 }; rows.push(r); draw(); };
      const del = $("#fedDel", bg); if (del) del.onclick = () => { const d = Store.day(meta.date); d.food = (d.food || []).filter(x => x.id !== meta.editId); Store.save(); close(); render(); };
      $("#fedOk", bg).onclick = () => {
        const d = Store.day(meta.date), before = foodTotals(meta.date); d.food = d.food || [];
        const keep = rows.filter(r => r.on && r.n.trim()).map(r => ({ n: r.n.trim(), e: r.e || foodEmoji(r.n), g: r.base.g ? r1(r.g) : null, k: Math.round(r.k), p: r1(r.p), c: r1(r.c), f: r1(r.f), fb: r1(r.fb) }));
        if (editing) { const i = d.food.findIndex(x => x.id === meta.editId); if (i >= 0) d.food[i] = Object.assign({}, d.food[i], keep[0], { m }); }
        else keep.forEach(x => d.food.push(Object.assign(x, { id: uid(), m, src: meta.src, t: Date.now() })));
        keep.forEach(x => Store.remember(x)); Store.save(); close(); afterAdd(meta.date, before, editing ? "Đã lưu" : `Đã thêm ${keep.length} món`);
      };
      draw();
    });
}
function afterAdd(dIso, before, msg) {
  const after = foodTotals(dIso);
  if (before.p < MACRO_T.p.lo && after.p >= MACRO_T.p.lo) FX.celebrate({ emoji: "💪", title: "Đủ protein hôm nay!", sub: `${fmt(after.p)} g ≥ ${MACRO_T.p.lo} g` });
  else FX.cheer("🍽️", msg, `${fmt(after.k)} kcal · ${fmt(after.p)} g protein`);
  if (location.hash.startsWith("#food")) render(); else location.hash = "#food/log";
}
AI.on("dish", (obj, meta) => { const L = AI.foods(obj); if (!L.length) return FX.cheer("⚠️", "AI không thấy món nào", "thử chụp gần hơn hoặc gõ tên"); foodEditor(L.map(x => Object.assign(x, { e: foodEmoji(x.n) })), Object.assign({}, meta, { desc: obj.desc })); });
/* raw ingredients → into the pot (default) or a meal; known foods use the 100 g table, unknown ones are learned from the AI numbers */
AI.on("raw", (obj, meta) => {
  const L = AI.foods(obj).map(x => Object.assign(x, { key: matchFood(x.n, x.key) })); if (!L.length) return FX.cheer("⚠️", "AI không thấy nguyên liệu nào", "chụp gần hơn, đủ sáng");
  const val = it => it.key ? fval(it.key, it.g || 0) : [it.k, it.p, it.c, it.f, it.fb];
  sheet("📦 Nguyên liệu", `${obj.desc ? `<div class="quote">${esc(obj.desc)} <span class="chip">${esc(meta.by || "")}</span></div>` : ""}
    <div class="rawl" id="rawL">${L.map((it, i) => `<div class="rawi" data-i="${i}"><span class="e">${it.key ? FOODS[it.key].e : foodEmoji(it.n)}</span><div class="t"><b>${esc(it.key ? shortN(FOODS[it.key].n) : it.n)}</b><small>${it.source === "scale" ? "đọc từ cân" : it.source === "package" ? "đọc từ bao bì" : "ước theo ảnh"} · <span class="kc">${fmt(val(it)[0])}</span> kcal${it.key ? "" : " · AI ước macro"}</small></div><label class="gq"><input class="num" inputmode="decimal" data-i="${i}" value="${it.g || ""}" aria-label="gram">g</label></div>`).join("")}</div>
    <p class="note">Món có trong bảng dinh dưỡng thì app tự tính theo 100 g đồ sống; AI chỉ đọc tên và số gram.</p>
    <div class="mseg" id="rawT">${[["pot", "Nồi trưa + tối"], ["bf", "Sáng"], ["snack", "Vặt"]].map(([k, t]) => `<button data-t="${k}" class="${k === "pot" ? "on" : ""}">${t}</button>`).join("")}</div>
    <button class="btn wide" id="rawOk">Thêm</button>`, (bg, close) => {
    let tgt = "pot";
    $("#rawL", bg).addEventListener("input", e => { const i = +e.target.dataset.i, it = L[i], g = parseFloat(e.target.value.replace(",", ".")) || 0;
      if (!it.key && it.g) { const r = g / it.g; ["k", "p", "c", "f", "fb"].forEach(k => it[k] = it[k] * r); } it.g = g; $(".kc", e.target.closest(".rawi")).textContent = fmt(val(it)[0]); });
    $("#rawT", bg).onclick = e => { const b = e.target.closest("[data-t]"); if (!b) return; tgt = b.dataset.t; $$("#rawT button", bg).forEach(x => x.classList.toggle("on", x === b)); };
    $("#rawOk", bg).onclick = () => {
      const dI = meta.date || TISO, before = foodTotals(dI);
      if (tgt === "pot") { const p = dayPlan(dI, true);
        if (p.mode === "plan") { p.pot = { com: p.pot.com || 260, giavi: p.pot.giavi || 2 }; p.mode = "gram"; FX.cheer("🍲", "Nồi chuyển sang Tự cân", "giữ cơm + gia vị, thay bằng nguyên liệu vừa chụp"); }
        L.forEach(it => { if (!it.g) return; const k = it.key || learnFood(it); p.pot[k] = it.g; }); Store.save(); close(); afterAdd(dI, before, `Đã thêm ${L.length} nguyên liệu vào nồi`); }
      else { const d = Store.day(dI); d.food = d.food || [];
        L.forEach(it => { if (!it.g) return; const v = val(it), x = it.key ? FOODS[it.key] : null; d.food.push({ id: uid(), m: tgt, n: x ? shortN(x.n) : it.n, e: x ? x.e : foodEmoji(it.n), g: it.g, k: Math.round(v[0]), p: r1(v[1]), c: r1(v[2]), f: r1(v[3]), fb: r1(v[4]), src: "photo", t: Date.now() }); });
        Store.save(); close(); afterAdd(dI, before, "Đã thêm"); }
    };
  });
});
/* InBody result → phase "Hiện tại" + dated log */
AI.on("inbody", (o, meta) => {
  const F = [["w", "Cân (kg)"], ["pbf", "PBF (%)"], ["smm", "SMM (kg)"], ["fat", "Mỡ (kg)"], ["vfl", "Mỡ nội tạng"], ["whr", "Eo/hông"], ["score", "Điểm"]];
  const date = /^\d{4}-\d{2}-\d{2}$/.test(o.date || "") ? o.date : TISO, ph0 = (phaseAt(parseISO(date)) || PHASES.find(p => p.id === meta.ph) || PHASES[0]).id;
  sheet("📊 Kiểm tra số InBody", `<p class="small" style="margin-top:0">So từng số với tờ giấy, sửa nếu AI đọc nhầm.</p>
    <div class="ibgrid"><label class="fld">Ngày đo<input id="ibD" type="date" value="${date}"></label>
      <label class="fld">Giai đoạn<select id="ibP" class="sel">${PHASES.filter(p => !p.faded).map(p => `<option value="${p.id}" ${p.id === ph0 ? "selected" : ""}>${p.name}</option>`).join("")}</select></label>
      ${F.map(([k, l]) => `<label class="fld">${l}<input inputmode="decimal" data-k="${k}" value="${o[k] ?? ""}"></label>`).join("")}</div>
    <button class="btn wide" id="ibOk">Lưu vào Lộ trình</button>`, (bg, close) => {
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
  let sub = "log", off = 0, range = 7;
  VIEWS.food = el => {
    const h = location.hash.split("/")[1]; if (["log", "menu", "stats"].includes(h)) sub = h;
    el.innerHTML = `<div class="subtabs">${[["log", "Hôm nay"], ["menu", "Thực đơn"], ["stats", "Tiến độ"]].map(([k, t]) => `<a href="#food/${k}" class="${k === sub ? "on" : ""}">${t}</a>`).join("")}</div><div id="sub"></div>`;
    ({ log, menu: FOOD_MENU, stats })[sub]($("#sub"));
  };
  const tile = (e, n, q, sub, attr) => `<button class="fic" ${attr}><span class="e">${e}</span><b>${esc(n)}</b><span class="q num">${q}${sub ? `<small>${sub}</small>` : ""}</span></button>`;
  const ftile = (key, q, attr, sub) => tile(FOODS[key].e, shortN(FOODS[key].n), qtyLabel(key, q), sub, attr);
  const xtile = f => tile(f.e || foodEmoji(f.n), f.n, f.g ? fmt(f.g) + " g" : fmt(f.k) + " kcal", "", `data-x="${f.id}"`);
  const mini = (lab, v, T, col) => `<div class="mac"><span>${lab} <b class="num">${fmt(v)}</b>/${T.hi < 999 ? T.lo + "–" + T.hi : "≥" + T.lo}</span><div class="meter"><i style="width:${Math.min(100, v / T.max * 100)}%;background:${col}"></i></div></div>`;

  function log(el) {
    const D = addD(TODAY, off), dI = iso(D), x = Store.peekDay(dI) || { ticks: {} }, t = x.ticks || {}, p = dayPlan(dI), E = dayEaten(dI), P = dayPlanned(dI), left = MACRO_T.k.t - E[0];
    const eat = m => `<button class="eat ${t[m] ? "on" : ""}" data-eat="${m}" aria-pressed="${!!t[m]}">${t[m] ? "✓ Đã ăn" : "Đánh dấu đã ăn"}</button>`;
    const xs = m => extraItems(dI, m);
    const dayName = off === 0 ? "Hôm nay" : off === -1 ? "Hôm qua" : WD[D.getDay()];
    el.innerHTML = `
    <section class="card kbar"><div class="dnav"><button data-o="-1" aria-label="Ngày trước">‹</button><span>${dayName} ${dm(D)}</span><button data-o="1" aria-label="Ngày sau" ${off >= 0 ? "disabled" : ""}>›</button></div>
      <div class="top2"><b class="num">${fmt(E[0])}</b><span class="num">/ ${fmt(MACRO_T.k.t)} kcal</span><em class="num ${left < 0 ? "over" : ""}">${left >= 0 ? "còn " + fmt(left) : "quá " + fmt(-left)}</em></div>
      <div class="meter"><i style="width:${Math.min(100, E[0] / MACRO_T.k.t * 100)}%;background:${MCOL.k}"></i></div>
      <div class="macros">${mini("P", E[1], MACRO_T.p, MCOL.p)}${mini("C", E[2], MACRO_T.c, MCOL.c)}${mini("F", E[3], MACRO_T.f, MCOL.f)}</div>
      <div class="small muted">Nếu ăn đúng kế hoạch cả ngày: ${fmt(P[0])} kcal · ${fmt(P[1])} g protein</div></section>
    <div class="cap2"><button class="cap" id="capRaw"><span>📦</span>Chụp nguyên liệu<small>thịt cá rau trước khi nấu</small></button><button class="cap alt" id="capDish"><span>🍽️</span>Chụp món ăn<small>ăn ngoài, món đã nấu</small></button></div>
    <div class="minil"><button id="byName">Gõ tên + gram</button><button id="byVoice">Nói</button></div>
    <section class="card"><div class="h"><b>Sáng</b><span class="num">${fmt(mealVal(p, "bf")[0])} kcal</span>${eat("bf")}</div>
      <div class="icons">${Object.entries(p.bf).map(([k, q]) => ftile(k, q, `data-plan="bf:${k}"`)).join("")}${xs("bf").map(xtile).join("")}<button class="fic add" data-add="bf" aria-label="Thêm món sáng">＋</button></div></section>
    <section class="card"><div class="h"><b>Nồi trưa + tối</b><div class="seg" id="potMode"><button data-m="plan" class="${p.mode === "plan" ? "on" : ""}">Thực đơn</button><button data-m="gram" class="${p.mode === "gram" ? "on" : ""}">Tự cân</button></div></div>
      <div class="icons">${Object.entries(p.pot).map(([k, q]) => ftile(k, q, `data-pot="${k}"`, "mỗi bữa " + qtyLabel(k, q / 2))).join("")}<button class="fic add" data-add="pot" aria-label="Thêm vào nồi">＋</button></div>
      <div class="split2">${["lunch", "dinner"].map(m => { const v = mealVal(p, m)[0] + xs(m).reduce((a, f) => a + (+f.k || 0), 0);
        return `<div class="half ${t[m] ? "on" : ""}"><button class="hb" data-half="${m}"><b>${mealLabel(m)} · ½ nồi</b><span class="x">+ ${[...Object.keys(p[m]).map(k => FOODS[k].e), ...xs(m).map(f => f.e || foodEmoji(f.n))].join(" ") || "—"}</span><span class="k num">${fmt(v)} kcal</span></button>${eat(m)}</div>`; }).join("")}</div></section>
    <section class="card"><div class="h"><b>Vặt</b><span class="num">${xs("snack").length ? fmt(xs("snack").reduce((a, f) => a + (+f.k || 0), 0)) + " kcal" : ""}</span></div>
      <div class="icons">${xs("snack").map(xtile).join("")}<button class="fic add" data-add="snack" aria-label="Thêm món vặt">＋</button></div></section>`;
    const pick = kind => pickImage(img => AI.run({ kind, img, meta: { date: dI, m: kind === "raw" ? "pot" : defaultMeal(), src: "photo" } }));
    $("#capRaw", el).onclick = () => pick("raw"); $("#capDish", el).onclick = () => pick("dish");
    $("#byName", el).onclick = () => nameSheet(dI, "pot"); $("#byVoice", el).onclick = () => nameSheet(dI, "pot", true);
    $(".dnav", el).onclick = e => { const b = e.target.closest("button[data-o]"); if (!b || b.disabled) return; off = Math.min(0, off + +b.dataset.o); log(el); };
    $("#potMode", el).onclick = e => { const b = e.target.closest("button[data-m]"); if (!b) return; const pp = dayPlan(dI, true);
      if (b.dataset.m === "plan") { pp.pot = planPot(Store.day(dI).main || 0); pp.mode = "plan"; FX.cheer("🍲", "Nồi theo thực đơn chuẩn", "đã nhân 2 cho trưa + tối"); } else { pp.mode = "gram"; FX.cheer("⚖️", "Tự cân", "bấm từng món để sửa gram"); }
      Store.save(); log(el); };
    el.onclick = e => {
      const eb = e.target.closest("[data-eat]"), pt = e.target.closest("[data-pot]"), pl = e.target.closest("[data-plan]"), hb = e.target.closest("[data-half]"), xb = e.target.closest("[data-x]"), ad = e.target.closest("[data-add]");
      if (eb) { const m = eb.dataset.eat, d = Store.day(dI); dayPlan(dI, true); d.ticks[m] = d.ticks[m] ? 0 : 1; Store.save(); if (d.ticks[m]) FX.celebrate({ xp: 10 }); refreshHeader(); log(el); }
      else if (pt) { const k = pt.dataset.pot, pp = dayPlan(dI, true);
        gramSheet(k, pp.pot[k], { pot: true, dIso: dI, onSave: q => { pp.pot[k] = q; pp.mode = "gram"; Store.save(); log(el); }, onDelete: () => { delete pp.pot[k]; pp.mode = "gram"; Store.save(); log(el); } }); }
      else if (pl) { const [m, k] = pl.dataset.plan.split(":"), pp = dayPlan(dI, true);
        gramSheet(k, pp[m][k], { onSave: q => { pp[m][k] = q; Store.save(); log(el); }, onDelete: () => { delete pp[m][k]; Store.save(); log(el); } }); }
      else if (hb) halfSheet(dI, hb.dataset.half, el);
      else if (xb) { const f = foodList(dI).find(z => z.id === xb.dataset.x); if (f) foodEditor([f], { date: dI, m: f.m, src: f.src, editId: f.id }); }
      else if (ad) nameSheet(dI, ad.dataset.add);
    };
  }
  /* one meal of the pot: ½ of every pot item + that meal's own extras */
  function halfSheet(dI, m, el) {
    const p = dayPlan(dI, true), v = vsum([mealVal(p, m), ...extraItems(dI, m).map(itemVal)]);
    sheet(`Bữa ${mealLabel(m).toLowerCase()}`, `${nums(v)}<div class="lbl">½ nồi</div><div class="icons">${Object.entries(p.pot).map(([k, q]) => `<div class="fic"><span class="e">${FOODS[k].e}</span><b>${esc(shortN(FOODS[k].n))}</b><span class="q num">${qtyLabel(k, q / 2)}</span></div>`).join("")}</div>
      <div class="lbl" style="margin-top:10px">Thêm riêng bữa này</div><div class="icons" id="hx">${Object.entries(p[m]).map(([k, q]) => ftile(k, q, `data-plan="${m}:${k}"`)).join("")}${extraItems(dI, m).map(xtile).join("")}<button class="fic add" data-add="${m}" aria-label="Thêm">＋</button></div>`, (bg, close) => {
      $("#hx", bg).onclick = e => { const pl = e.target.closest("[data-plan]"), xb = e.target.closest("[data-x]"), ad = e.target.closest("[data-add]"); close();
        if (pl) { const k = pl.dataset.plan.split(":")[1]; gramSheet(k, p[m][k], { onSave: q => { p[m][k] = q; Store.save(); log(el); }, onDelete: () => { delete p[m][k]; Store.save(); log(el); } }); }
        else if (xb) { const f = foodList(dI).find(z => z.id === xb.dataset.x); if (f) foodEditor([f], { date: dI, m: f.m, src: f.src, editId: f.id }); }
        else if (ad) nameSheet(dI, m); };
    });
  }
  /* type a name (or say it) + grams: food table first, history next, AI when it's new */
  function nameSheet(dI, where, voice) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const T = [["pot", "Nồi trưa + tối"], ["bf", "Sáng"], ["lunch", "Trưa"], ["dinner", "Tối"], ["snack", "Vặt"]];
    sheet(voice ? "🎤 Nói món ăn" : "Gõ tên + gram", `<div class="tsrow"><input id="tsQ" class="tsq" placeholder="vd: bò, cá basa, 1 tô phở…" autocomplete="off">${SR ? `<button class="btn ghost mic" id="tsMic" aria-label="Nói">🎤</button>` : ""}</div>
      <div class="mseg" id="tsT">${T.map(([k, t]) => `<button data-t="${k}" class="${k === where ? "on" : ""}">${t}</button>`).join("")}</div>
      <div class="icons" id="tsF"></div><div id="tsH" class="tslist"></div>
      <button class="btn ghost wide" id="tsAI" hidden>🤖 Hỏi AI món này</button>`, (bg, close) => {
      const q = $("#tsQ", bg); let tgt = where;
      const draw = () => { const s = deacc(q.value.trim()), keys = Object.keys(FOODS).filter(k => !s || deacc(FOODS[k].n).includes(s)).slice(0, s ? 12 : 16);
        $("#tsF", bg).innerHTML = keys.map(k => `<button class="fic" data-k="${k}"><span class="e">${FOODS[k].e}</span><b>${esc(shortN(FOODS[k].n))}</b><span class="q num">${fmt(FOODS[k].k)}<small>kcal/${isUnit(k) ? FOODS[k].u : "100 g"}</small></span></button>`).join("");
        const H = s ? Store.all.foodHist.filter(h => deacc(h.n).includes(s)).slice(0, 5) : [];
        $("#tsH", bg).innerHTML = H.map((h, i) => `<button class="tsi" data-h="${i}"><b>${esc(h.n)}</b><span>${h.g ? fmt(h.g) + " g · " : ""}${fmt(h.k)} kcal · P ${fmt(h.p, 1)}</span><em>đã ăn ×${h.count || 1}</em></button>`).join("");
        $("#tsH", bg)._h = H; $("#tsAI", bg).hidden = !s; };
      q.oninput = draw; draw(); setTimeout(() => q.focus(), 50);
      $("#tsT", bg).onclick = e => { const b = e.target.closest("[data-t]"); if (!b) return; tgt = b.dataset.t; $$("#tsT button", bg).forEach(x => x.classList.toggle("on", x === b)); };
      $("#tsF", bg).onclick = e => { const b = e.target.closest("[data-k]"); if (!b) return; const k = b.dataset.k; close();
        const pot = tgt === "pot", q0 = isUnit(k) ? 1 : pot ? 200 : 100;
        gramSheet(k, q0, { pot, okLabel: pot ? "Thêm vào nồi" : `Thêm vào bữa ${mealLabel(tgt).toLowerCase()}`, onSave: g => {
          const before = foodTotals(dI);
          if (pot) { const pp = dayPlan(dI, true); pp.pot[k] = (pp.pot[k] || 0) + g; pp.mode = "gram"; Store.save(); }
          else { const v = fval(k, g), d = Store.day(dI); (d.food = d.food || []).push({ id: uid(), m: tgt, n: shortN(FOODS[k].n), e: FOODS[k].e, g: isUnit(k) ? null : g, k: Math.round(v[0]), p: r1(v[1]), c: r1(v[2]), f: r1(v[3]), fb: r1(v[4]), src: "table", t: Date.now() }); Store.save(); }
          afterAdd(dI, before, pot ? "Đã thêm vào nồi" : "Đã thêm"); } }); };
      $("#tsH", bg).onclick = e => { const b = e.target.closest("[data-h]"); if (!b) return; const h = $("#tsH", bg)._h[+b.dataset.h]; close(); foodEditor([h], { date: dI, m: tgt === "pot" ? defaultMeal() : tgt, src: "hist" }); };
      $("#tsAI", bg).onclick = () => { const s = q.value.trim(); close(); AI.run({ kind: "text", text: s, meta: { date: dI, m: tgt === "pot" ? defaultMeal() : tgt, src: "text" } }); };
      const mic = $("#tsMic", bg);
      if (mic) { let rec = null; const start = () => { if (rec) { rec.stop(); return; } rec = new SR(); rec.lang = "vi-VN"; rec.interimResults = true; mic.classList.add("rec");
          rec.onresult = e => { q.value = [...e.results].map(r => r[0].transcript).join(" "); draw(); };
          rec.onerror = e => { if (e.error !== "no-speech") FX.cheer("⚠️", "Micro lỗi", e.error === "not-allowed" ? "cho phép micro trong cài đặt trình duyệt" : e.error); };
          rec.onend = () => { rec = null; mic.classList.remove("rec"); }; try { rec.start(); } catch (e) { rec = null; } };
        mic.onclick = start; if (voice) setTimeout(start, 250); }
    });
  }

  /* ---------------- Tiến độ ---------------- */
  function stats(el) {
    const D = Array.from({ length: range }, (_, i) => addD(TODAY, i - range + 1)), V = D.map(d => { const t = foodTotals(iso(d)); return t.n ? t : null; });
    const got = V.filter(Boolean), avg = k => got.length ? got.reduce((a, t) => a + t[k], 0) / got.length : 0;
    const okP = got.filter(t => t.p >= MACRO_T.p.lo).length, okK = got.filter(t => t.k >= MACRO_T.k.lo && t.k <= MACRO_T.k.hi).length;
    const kc = got.reduce((a, t) => [a[0] + t.p * 4, a[1] + t.c * 4, a[2] + t.f * 9], [0, 0, 0]), ks = kc[0] + kc[1] + kc[2] || 1, sh = kc.map(x => Math.round(x / ks * 100));
    el.innerHTML = `<section class="card"><div class="whd"><h3>Ăn ${range} ngày qua</h3><div class="seg" id="rg">${[7, 14, 30].map(n => `<button data-n="${n}" class="${n === range ? "on" : ""}">${n} ngày</button>`).join("")}</div></div>
      ${got.length ? `<div class="stats"><div class="stat"><small>TB calo</small><b>${fmt(avg("k"))} <span>kcal</span></b><div class="d ${avg("k") <= MACRO_T.k.hi ? "good" : ""}">mục tiêu 1,540</div></div>
        <div class="stat"><small>TB protein</small><b>${fmt(avg("p"))} <span>g</span></b><div class="d ${avg("p") >= MACRO_T.p.lo ? "good" : ""}">mục tiêu ≥ 110</div></div>
        <div class="stat"><small>Ngày đủ protein</small><b>${okP}<span>/${got.length}</span></b></div>
        <div class="stat"><small>Calo đúng khoảng</small><b>${okK}<span>/${got.length}</span></b><div class="d">1,440–1,640</div></div></div>` : `<p class="muted">Chưa có ngày nào ghi bữa ăn trong ${range} ngày qua.</p>`}</section>
    ${got.length ? `<section class="card"><h3>Calo mỗi ngày <span class="sub">vạch 1,540 · dải xanh 1,440–1,640</span></h3>${bars(D, V, "k", { band: [MACRO_T.k.lo, MACRO_T.k.hi], line: MACRO_T.k.t, max: 2000 })}</section>
    <section class="card"><h3>Protein mỗi ngày <span class="sub">vạch 110 g tối thiểu</span></h3>${bars(D, V, "p", { line: MACRO_T.p.lo, max: 150 })}</section>
    <section class="card"><h3>Calo đến từ đâu</h3>
      <div class="split" role="img" aria-label="Trung bình: protein ${sh[0]}%, carb ${sh[1]}%, fat ${sh[2]}% calo">${["p", "c", "f"].map((k, i) => `<i style="width:${sh[i]}%;background:${MCOL[k]}"></i>`).join("")}</div>
      <div class="legend3">${[["p", "Protein", 0, "~29%"], ["c", "Carb", 1, "~47%"], ["f", "Fat", 2, "~24%"]].map(([k, l, i, t]) => `<span><i style="background:${MCOL[k]}"></i>${l} <b>${sh[i]}%</b> <small>(thực đơn ${t})</small></span>`).join("")}</div>
      <details class="small"><summary>Bảng số từng ngày</summary><div class="tscroll"><table class="nt"><tr><th>Ngày</th><th class="n">Kcal</th><th class="n">P</th><th class="n">C</th><th class="n">F</th><th class="n">Xơ</th></tr>
        ${D.map((d, i) => V[i] ? `<tr><td>${WD[d.getDay()]} ${dm(d)}</td><td class="n">${fmt(V[i].k)}</td><td class="n">${fmt(V[i].p)}</td><td class="n">${fmt(V[i].c)}</td><td class="n">${fmt(V[i].f)}</td><td class="n">${fmt(V[i].fb)}</td></tr>` : "").join("")}</table></div></details></section>` : ""}`;
    $("#rg", el).onclick = e => { const b = e.target.closest("button[data-n]"); if (b) { range = +b.dataset.n; stats(el); } };
    $$(".bchart", el).forEach(c => c.addEventListener("click", e => { const b = e.target.closest("[data-i]"); if (!b) return; const i = +b.dataset.i, v = V[i], o = $(".readout", c.parentNode);
      $$("[data-i].sel", c).forEach(x => x.classList.remove("sel")); $$(`[data-i="${i}"]`, c).forEach(x => x.classList.add("sel"));
      o.innerHTML = v ? `<b>${WDN[D[i].getDay()]} ${dm(D[i])}</b>: ${fmt(v.k)} kcal · P ${fmt(v.p)} · C ${fmt(v.c)} · F ${fmt(v.f)} g` : `<b>${dm(D[i])}</b>: chưa ghi`; }));
  }
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
