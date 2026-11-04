"use strict";
/* Ăn → Thực đơn: the full menu (Diet/Thực đơn 1 ngày - 1540 kcal.html). Tra cứu: searchable cards with multi-select filters.
   (The Ăn tab itself — Nhật ký / Thực đơn / Tiến độ — lives in v-food.js.) */
const FOOD_MENU = el => {
  const L = meal("lunch", 0), Dn = meal("dinner", 0), tot = [BREAKFAST_SUM[0] + L.kcal + Dn.kcal, BREAKFAST_SUM[1] + L.prot + Dn.prot, BREAKFAST_SUM[2] + L.fib + Dn.fib];
  const row = (e, n, a, k, p, f) => `<tr><td>${e} ${n}</td><td>${a}</td><td class="n">${k}</td><td class="n">${p} g</td><td class="n">${f} g</td></tr>`;
  el.innerHTML = `
  <section class="card"><div class="kick">Thực đơn 1 ngày · chốt 03/11/2026</div><h2>~${fmt(tot[0])} kcal · ~${fmt(tot[1])} g protein · ~${fmt(tot[2])} g xơ</h2>
    <p class="muted" style="margin:6px 0 0">Thâm hụt ~500 kcal/ngày: ăn bớt 300 kcal (TDEE ước 1,840) + vận động thêm ~200 kcal. Bữa sáng và rau cố định; <b>trưa và tối ăn cùng món chính</b> (cơm + 3 món), chỉ khác trái cây.</p>
    <div class="meals3">${[["☀️ Sáng", "Sinh tố + 2 trứng", BREAKFAST_SUM[0], BREAKFAST_SUM[1], BREAKFAST_SUM[2]], ["🌤️ Trưa", "Cơm + 3 món + 1 trái ổi", L.kcal, L.prot, L.fib], ["🌙 Tối", "Cơm + 3 món + ½ táo + sữa chua Vinamilk", Dn.kcal, Dn.prot, Dn.fib]]
      .map(([t, s, k, p, f]) => `<div class="m3"><b>${t}</b><span>${s}</span><div><b>${fmt(k)}</b> kcal · <b>${fmt(p)}</b> g đạm · ${fmt(f)} g xơ</div></div>`).join("")}</div>
    <p class="small muted" style="margin:8px 0 0">Cả ngày (món mặn thịt heo nạc): ${fmt(tot[0])} kcal · ${fmt(tot[1])} g protein · ${fmt(tot[2])} g xơ.</p></section>
  <div class="row2c">
    <section class="card"><h3>☀️ Bữa sáng <span class="chip green">cố định</span></h3><table class="nt"><tr><th>Món</th><th>Lượng</th><th class="n">Kcal</th><th class="n">Đạm</th><th class="n">Xơ</th></tr>${BREAKFAST.map(b => row(...b)).join("")}</table>
      <ol class="small"><li>Ngâm yến mạch + hạt chia trong sữa đậu nành 10–15 phút (hoặc từ tối hôm trước).</li><li>Thêm chuối và ½ muỗng whey, xay mịn. Uống chậm ~10 phút.</li><li>Ăn 2 trứng luộc riêng. Dùng ¼ bơ thay chuối: ~457 kcal, 7 g xơ.</li></ol></section>
    <section class="card"><h3>🍽️ Trưa = tối: cơm + 3 món</h3><table class="nt"><tr><th>Phần</th><th>Lượng</th><th class="n">Kcal</th><th class="n">Đạm</th><th class="n">Xơ</th></tr>
      ${row("🍚", "Cơm trắng", "130 g (gần 1 chén)", 169, 3.5, .5)}${row("🐖", "Món mặn: thịt heo nạc kho (ví dụ)", "~85 g chín", 123, 22, 0)}${row(...PLATE.seasoning)}${row(...PLATE.veg)}${row(...PLATE.soup)}
      <tr class="sep"><td colspan="5">+ phần khác nhau</td></tr>${row("🌤️ 🍈", "Trưa: ổi (cố định)", "1 trái ~150 g", 102, 3.8, 8.1)}${row("🌙 🍎", "Tối: ½ táo", "~90 g", 47, .2, 2.2)}${row("🌙 🥣", "Tối: sữa chua Vinamilk không đường", "1 hũ 100 g", 65, 4, 0)}</table>
      <p class="small muted">Món mặn ~22 g protein + canh ~6 g = ~28 g thịt cá mỗi bữa.</p></section></div>
  <section class="card"><h3>🔁 Đổi món mặn (~22 g protein mỗi phần)</h3><p class="small muted" style="margin-top:0">Món nhiều calo hơn thịt heo nạc thì bớt cơm, ít hơn thì thêm cơm, để món mặn + cơm ≈ 292 kcal và bữa vẫn ~540 kcal. Kho hay áp chảo đều tính ~40 kcal dầu, gia vị.</p>
    <div class="tscroll"><table class="nt"><tr><th>Món mặn</th><th class="n">Chín</th><th class="n">Sống (ước)</th><th class="n">Kcal</th><th class="n">Fat</th><th class="n">Cơm nên ăn</th></tr>
      ${MAINS.map(m => `<tr class="${m[6] >= 10 ? "hi" : ""}"><td>${m[0]} ${m[1]}</td><td class="n">${m[2]}</td><td class="n">${m[3]}</td><td class="n">${m[4]}</td><td class="n">~${m[6]} g</td><td class="n"><b>${m[5]} g</b></td></tr>`).join("")}</table></div>
    <div class="note-warn">⚠️ Bò nạc, đùi gà, cá hồi có 10–14 g fat mỗi phần (gấp ~3 lần thịt heo nạc). Fat cả ngày ~41 g: thay 1 bữa bằng cá hồi hoặc đùi gà ≈ 48 g ✅; bằng bò nạc ≈ 51 g, chạm mức trên, nên chỉ 1–2 lần/tuần. Ăn cả 2 bữa thì vượt 50 g ❌. Ba chỉ, sườn: không dùng hằng ngày.</div></section>
  <div class="row2c">
    <section class="card"><h3>🥦 Rau 100 g mỗi bữa <span class="chip green">cố định</span></h3><div class="veg4">${VEG.map(v => `<div><span>${v[0]}</span><b>${v[1]}</b><small>25 g · ${v[2]} kcal · ${v[3]} g xơ</small></div>`).join("")}</div>
      <p class="small">Luộc / hấp: ~44 kcal/đĩa, chấm nước kho của món mặn. Xào nhanh 1 muỗng cà phê dầu: ~85 kcal → bớt 30 g cơm. Chấm 1 viên chao: +20 kcal, ~450 mg natri.</p></section>
    <section class="card"><h3>🍲 Canh & 🧂 nêm</h3><ul class="small"><li><b>Canh mỗi bữa:</b> 80 g củ + 30 g thịt nạc bằm (sống). Củ ít tinh bột: bí đỏ, bí xanh, su su, củ cải, cà rốt. Khoai tây, khoai môn thì bớt 30–50 g cơm.</li>
      <li><b>Natri cả ngày ≤ 2,000 mg</b> (~5 g muối, WHO). Mỗi bữa trưa, tối nêm ≤ 700 mg ≈ <b>1½ muỗng cà phê nước mắm cho cả 3 món</b>.</li>
      <li>Ngày món kho: kho 1 muỗng + canh ½ muỗng + rau chấm nước kho ≈ 690 mg. Ngày món chiên: ướp ½ + canh ½ + chấm ½ ≈ 690 mg.</li>
      <li>Đường: 1 muỗng cà phê cho món kho mỗi bữa (đã tính). Thêm 1 muỗng thì bớt ~12 g cơm. Ăn cái, chừa bớt nước canh, nước kho.</li></ul></section></div>
  <p class="small muted">Nguồn: vault <i>2. Areas/Health/Diet/Thực đơn 1 ngày - 1540 kcal.html</i>. Khi file đó đổi, app cần cập nhật lại.</p>`;
};

(() => {
  const PAT = Object.fromEntries(PATTERNS.map(p => [p.id, p]));
  const DAYOF = { "Gym A": "T2", "Gym B": "T4", "Gym C": "T6" };
  const inSess = id => ["free", "machine"].flatMap(m => Object.entries(PROGRAM[m]).filter(([, l]) => l.some(x => x.id === id)).map(([s]) => [s, m === "free" ? "tới 30/11" : "từ 01/12"]));
  const ITEMS = [
    ...Object.entries(EX).map(([id, e]) => ({ kind: "ex", id, name: e.name, vi: e.vi, cat: e.tag })),
    ...Object.entries(SIMPLE_EX).filter(([id]) => !EX[id]).map(([id, e]) => ({ kind: "ex", id, name: e.name, vi: e.vi, cat: "extra", emo: e.e })),
    ...BREAKFAST.map(b => ({ kind: "food", cat: "bf", emo: b[0], name: b[1], amt: b[2], k: b[3], p: b[4], f: b[5] })),
    ...MAINS.map(m => ({ kind: "food", cat: "prot", emo: m[0], name: m[1], amt: `${m[2]} chín (~${m[3]} sống)`, k: m[4], p: 22, f: 0, fat: m[6], rice: m[5] })),
    { kind: "food", cat: "plate", emo: "🍚", name: "Cơm trắng", amt: "130 g · mốc khi ăn thịt heo nạc", k: 169, p: 3.5, f: .5 },
    { kind: "food", cat: "plate", emo: "🥦", name: "Rau luộc 4 loại", amt: "100 g · bông cải xanh, đậu Hà Lan, cà rốt, bắp cải", k: 44, p: 2.5, f: 3.4, note: VEG.map(v => `${v[0]} ${v[1]} 25 g · ${v[2]} kcal · ${v[3]} g xơ`).join("<br>") + "<br>Xào nhanh 1 muỗng cà phê dầu: ~85 kcal/đĩa → bớt 30 g cơm." },
    { kind: "food", cat: "plate", emo: "🍲", name: "Canh: củ + thịt nạc bằm", amt: "80 g củ + 30 g thịt sống", k: 62, p: 6.5, f: 1.2, note: "Củ ít tinh bột: bí đỏ, bí xanh, su su, củ cải, cà rốt. Khoai tây, khoai môn thì bớt 30–50 g cơm." },
    { kind: "food", cat: "plate", emo: "🧂", name: "Gia vị kho", amt: "½ muỗng dầu + 1 đường + 1 nước mắm", k: 38, p: 0, f: 0, note: "Nước kho dùng chấm rau luộc. Nêm ≤ 700 mg natri mỗi bữa." },
    { kind: "food", cat: "fruit", emo: "🍈", name: "Ổi", amt: "1 trái (~150 g) · trưa, cố định", k: 102, p: 3.8, f: 8.1 },
    { kind: "food", cat: "fruit", emo: "🍎", name: "Táo", amt: "½ trái (~90 g) · tối", k: 47, p: .2, f: 2.2 },
    { kind: "food", cat: "fruit", emo: "🥣", name: "Sữa chua Vinamilk không đường", amt: "1 hũ 100 g · tối", k: 65, p: 4, f: 0, note: "Theo nhãn phổ biến: ~65 kcal, 4 g protein, 5.3 g carb, 3.2 g fat. Xem lại bảng dinh dưỡng trên hũ bạn mua." }];
  const GROUPS = [
    { id: "kind", label: "Loại", one: true, opts: [["train", "🏋️ Bài tập"], ["diet", "🍽️ Món ăn"]] },
    { id: "pat", label: "Pattern", opts: [...PATTERNS.map(p => [p.id, p.name]), ["extra", "Bài phụ"]] },
    { id: "gear", label: "Dụng cụ", opts: [["free", "🏠 Không máy"], ["machine", "🏋️ Cần máy/cáp"]] },
    { id: "sess", label: "Buổi", opts: [["Gym A", "Gym A · T2"], ["Gym B", "Gym B · T4"], ["Gym C", "Gym C · T6"]] },
    { id: "food", label: "Món ăn", opts: [["bf", "Bữa sáng"], ["prot", "Món mặn (đổi món)"], ["plate", "Cơm · rau · canh"], ["fruit", "Trái cây · sữa chua"]] }];
  const SEL = Object.fromEntries(GROUPS.map(g => [g.id, new Set()])), EXG = ["pat", "gear", "sess"];
  let q = "";
  const norm = s => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").toLowerCase();
  function pass(it) {
    const k = SEL.kind, anyEx = EXG.some(g => SEL[g].size), anyFood = SEL.food.size > 0;
    if (it.kind === "ex") {
      if ((k.size && !k.has("train")) || (!k.size && anyFood && !anyEx)) return false;
      if (SEL.pat.size && !SEL.pat.has(it.cat)) return false;
      if (SEL.gear.size && !SEL.gear.has(MACHINE.has(it.id) ? "machine" : "free")) return false;
      if (SEL.sess.size && !inSess(it.id).some(x => SEL.sess.has(x[0]))) return false;
    } else { if ((k.size && !k.has("diet")) || (!k.size && anyEx && !anyFood)) return false; if (SEL.food.size && !SEL.food.has(it.cat)) return false; }
    if (!q) return true;
    const p = PAT[it.cat], ex = EX[it.id] || SIMPLE_EX[it.id];
    return norm([it.name, it.vi, it.amt, p ? [p.name, p.vi, p.muscles].join(" ") : "", ex ? ex.cues.join(" ") : "", it.kind === "ex" && !MACHINE.has(it.id) ? "khong may" : "", it.cat === "prot" ? "mon man dam protein" : ""].join(" ")).includes(norm(q));
  }
  const chips = it => {
    if (it.kind === "food") return `<span class="chip ${it.cat === "prot" ? "green" : "gold"}">${{ bf: "Bữa sáng · cố định", prot: "Món mặn · trưa = tối", plate: "Trưa + tối", fruit: "Trái cây · sữa chua" }[it.cat]}</span>${it.rice ? `<span class="chip">+ cơm ${it.rice} g</span>` : ""}${it.fat >= 10 ? `<span class="chip warnc">${it.fat} g fat</span>` : ""}`;
    const p = PAT[it.cat];
    return `${p ? `<span class="chip" style="background:${p.hex}22;color:${p.hex}">${p.name}</span>` : `<span class="chip">Bài phụ</span>`}${MACHINE.has(it.id) ? `<span class="chip">🏋️ Cần máy</span>` : `<span class="chip green">🏠 Không máy</span>`}` +
      inSess(it.id).map(([s, per]) => `<span class="chip ${per === "tới 30/11" ? "green" : "red"}">${s} · ${DAYOF[s]} · ${per}</span>`).join("");
  };
  VIEWS.lib = el => {
    el.innerHTML = `<section class="card"><div class="bar2"><div class="search"><input id="q" value="${esc(q)}" placeholder="Tìm bài hoặc món… (squat, cá hồi, lưng, xơ)" aria-label="Tìm"></div><span class="count" id="count"></span></div><div class="filters" id="filters"></div></section><div class="cards" id="cards"></div>`;
    drawF(); list();
    $("#q").oninput = e => { q = e.target.value; list(); };
    $("#filters").onclick = e => {
      if (e.target.closest("#clearF")) { GROUPS.forEach(g => SEL[g.id].clear()); drawF(); list(); return; }
      const b = e.target.closest("button[data-g]"); if (!b) return; const g = GROUPS.find(x => x.id === b.dataset.g), s = SEL[g.id], k = b.dataset.f;
      if (s.has(k)) s.delete(k); else { if (g.one) s.clear(); s.add(k); } drawF(); list();
    };
    $("#cards").onclick = e => { const c = e.target.closest(".lc"); if (c) openItem(ITEMS[c.dataset.i]); };
  };
  function drawF() {
    const n = GROUPS.reduce((a, g) => a + SEL[g.id].size, 0);
    $("#filters").innerHTML = GROUPS.map(g => `<div class="frow"><small>${g.label}</small>${g.opts.map(([k, t]) => `<button data-g="${g.id}" data-f="${k}" class="${SEL[g.id].has(k) ? "on" : ""}" aria-pressed="${SEL[g.id].has(k)}">${t}</button>`).join("")}</div>`).join("") +
      `<div class="fbar">${n ? `<span>Đang lọc: ${GROUPS.flatMap(g => g.opts.filter(o => SEL[g.id].has(o[0])).map(o => o[1])).join(" + ")}</span><button class="clear" id="clearF">✕ Bỏ lọc</button>` : `<span class="muted">Chọn nhiều ô cùng lúc được: trong một hàng là "hoặc", giữa các hàng là "và".</span>`}</div>`;
  }
  function list() {
    const L = ITEMS.filter(pass); $("#count").textContent = `${L.length} thẻ`;
    $("#cards").innerHTML = L.length ? L.map(it => `<div class="lc" data-i="${ITEMS.indexOf(it)}"><div class="vis">${it.kind === "ex" && EX[it.id] ? `<svg viewBox="0 0 220 200" data-ex="${it.id}" data-c="${PAT[it.cat] ? PAT[it.cat].hex : "#c8302c"}" aria-hidden="true"></svg>` : `<span class="emo">${it.emo || "💪"}</span>`}</div>
      <b>${it.name}</b><span class="vi">${it.kind === "ex" ? it.vi : it.amt}</span>${it.kind === "food" ? `<div class="nut"><span><b>${it.k}</b> kcal</span><span><b>${it.p}</b> g đạm</span><span><b>${it.f}</b> g xơ</span></div>` : ""}<div class="tags">${chips(it)}</div></div>`).join("")
      : `<div class="none">Không thấy thẻ nào. Thử bỏ bớt bộ lọc nhé 🌸</div>`;
    $$("#cards svg[data-ex]").forEach(s => FIG.mount(s, s.dataset.ex, s.dataset.c));
  }
  function openItem(it) {
    if (it.kind === "ex") {
      const e = EX[it.id] || SIMPLE_EX[it.id], p = PAT[it.cat], v = p && PATTERN_VIDEO[p.id];
      sheet(it.name, `<div class="bigfig">${EX[it.id] ? `<svg viewBox="0 0 220 200" id="bf" role="img" aria-label="Minh họa ${it.name}"></svg>` : `<span style="font-size:80px">${it.emo}</span>`}</div>
        <div class="muted" style="font-weight:700">${it.vi}</div><div class="tags" style="margin:8px 0">${chips(it)}</div>
        ${SWAP[it.id] ? `<div class="quote ok">⇄ Đổi qua lại với <b>${exName(SWAP[it.id])}</b> (${MACHINE.has(it.id) ? "không cần máy" : "dùng máy"}).${["pullover", "dbchop", "rfly"].includes(it.id) ? " Bài thay thế do Claude chọn, không có trong 2 video." : ""}</div>` : ""}
        ${v ? `<a class="btn ghost vidbtn" href="https://www.youtube.com/watch?v=${VIDEO[v[0]]}&t=${v[1]}s" target="_blank" rel="noopener">▶ Xem đoạn video (${v[0]} ${Math.floor(v[1] / 60)}:${pad(v[1] % 60)})</a>` : ""}
        <div class="lbl" style="margin-top:12px">CÁCH LÀM</div><ol>${e.cues.map(c => `<li>${c}</li>`).join("")}</ol><div class="lbl" style="color:var(--red2)">TRÁNH</div><div class="avoid">• ${e.bad}</div>
        ${p ? `<div class="quote">🎬 Theo video: ${p.def} <span class="muted">[${p.src}]</span><br><b>Cơ chính:</b> ${p.muscles}<br><b>Mỗi tuần:</b> ${p.quota}</div><div class="lbl">THANG TIẾN ĐỘ</div><div class="ladder">${p.ladder.map(x => `<span>${x}</span>`).join("")}</div>` : ""}`,
        bg => { const s = $("#bf", bg); if (s) FIG.mount(s, it.id, p ? p.hex : "#c8302c"); });
    } else {
      const extra = it.cat === "prot" ? `<div class="quote">🍽️ Ăn cả trưa và tối: ${it.name} ${it.amt} cho ~22 g protein (canh thêm ~6 g). Ăn kèm <b>cơm ${it.rice} g</b> để bữa vẫn ~540 kcal.</div>${it.fat >= 10 ? `<div class="note-warn">⚠️ ${it.fat} g fat mỗi phần: chỉ 1 bữa/ngày${it.fat >= 14 ? " và 1–2 lần/tuần (cả ngày ≈ 51 g fat)" : " (cả ngày ≈ 48 g fat ✅)"}.</div>` : ""}` : it.note ? `<div class="quote">${it.note}</div>` : "";
      sheet(`${it.emo} ${it.name}`, `<table class="nt"><tr><td>Lượng</td><td class="n">${it.amt}</td></tr><tr><td>Calo</td><td class="n">${it.k} kcal</td></tr><tr><td>Protein</td><td class="n">${it.p} g</td></tr><tr><td>Chất xơ</td><td class="n">${it.f} g</td></tr>${it.fat != null ? `<tr><td>Fat</td><td class="n">~${it.fat} g</td></tr>` : ""}</table>${extra}`);
    }
  }
})();
