"use strict";
/* Today: hero + CTA, weight/waist, checklist + water, today's menu (one món mặn for lunch and dinner), schedule, export. */
VIEWS.today = el => {
  const plan = WEEK_PLAN[TODAY.getDay()], ph = phaseAt(TODAY), d = Store.day(TISO), isReal = !QS.get("date");
  const nowH = new Date().getHours() + new Date().getMinutes() / 60;
  const w7 = avg7(TODAY), w7p = avg7(addD(TODAY, -7));
  const kind = plan.k === "gym" ? "gym" : plan.k;
  const sched = kind === "yoga" ? [DAY_COMMON.morning[0], DAY_COMMON.morning[1], ...DAY_MID.yoga, ...DAY_COMMON.evening]
    : kind === "rest" ? [...DAY_COMMON.morning.slice(0, 3), ...DAY_MID.rest, ...DAY_COMMON.evening] : [...DAY_COMMON.morning, ...DAY_MID[kind], ...DAY_COMMON.evening];
  const toH = t => { const [h, m] = t.split(":").map(Number); return h + m / 60; };
  const nowIdx = isReal ? sched.reduce((a, s, i) => toH(s[0]) <= nowH ? i : a, -1) : -1;
  const g = Store.gym(TISO);
  el.innerHTML = `${vision()}
  <div class="tgrid">
    <section class="card hero">
      <div class="kick">${WDN[TODAY.getDay()]}, ${dm(TODAY)}${ph ? ` · ${ph.name}` : ""}</div>
      <h2>${plan.e} ${MOVE_LABEL(TODAY)}</h2>
      <p class="muted" style="margin:4px 0 12px">${plan.k === "gym" ? `18:30 · ${programFor(TODAY, plan.t).length} bài · ${g && g.finished ? "✅ đã xong" : g ? "đang tập dở" : "chưa tập"}` : { zone2: "Zone 2 40–45 phút, nhịp tim 125–140", walk: "Đi bộ nhanh 45 phút", yoga: "Yoga 60 phút buổi sáng", rest: "Nghỉ hẳn · đi chợ · nấu sẵn · review tuần" }[plan.k]}</p>
      ${plan.k === "gym" ? `<a class="btn big" href="#gym">${g ? "Tiếp tục tập →" : "Bắt đầu tập →"}</a>` : `<a class="btn ghost" href="#gym">Xem buổi tập kế tiếp</a>`}
    </section>
    <section class="card">
      <h3>⚖️ Số đo sáng nay</h3>
      <div class="meas">
        <label>Cân (kg)<input id="inW" inputmode="decimal" placeholder="vd 54.2" value="${d.w || ""}"></label>
        <label>Vòng eo (cm)${TODAY.getDay() === 1 ? ' <span class="chip gold">thứ Hai</span>' : ""}<input id="inWaist" inputmode="decimal" placeholder="${TODAY.getDay() === 1 ? "đo ngang rốn" : "chỉ cần thứ Hai"}" value="${d.waist || ""}"></label>
      </div>
      <div class="small muted" style="margin-top:8px">${w7 ? `TB 7 ngày: <b style="color:var(--ink)">${fmt(w7, 1)} kg</b>${w7p ? ` · ${w7 <= w7p ? "▼" : "▲"} ${fmt(Math.abs(w7p - w7), 1)} so với 7 ngày trước` : ""}` : "Cân sau khi đi vệ sinh, trước khi ăn. App tự tính trung bình 7 ngày."}</div>
    </section>
    <section class="card" id="chk"></section>
    <section class="card" id="mnu"></section>
    <section class="card sched"><h3>🕐 Lịch hôm nay <span class="sub">một ngày chuẩn</span></h3>
      ${sched.map((s, i) => `<div class="sl ${i === nowIdx ? "now" : i < nowIdx ? "past" : ""} k-${s[1]}"><b>${s[0]}</b><span>${s[2]}</span></div>`).join("")}</section>
    <section class="card expc"><h3>📋 Tổng kết cho Claude Project</h3><p class="small muted">Tối nay copy khối này dán vào Claude Project (thay cho việc gõ lại từng thứ).</p>
      <button class="btn" id="expDay" style="width:100%">📋 Xuất tổng kết hôm nay</button></section>
  </div>`;
  drawChecks(); drawMenu();
  const num = v => { const n = parseFloat(String(v).replace(",", ".")); return isNaN(n) ? null : n; };
  $("#inW").onchange = e => { const v = num(e.target.value); d.w = v; if (v) d.ticks.weigh = 1; Store.save(); FX.cheer("⚖️", "Đã ghi cân", v ? v + " kg" : ""); render(); };
  $("#inWaist").onchange = e => { d.waist = num(e.target.value); Store.save(); FX.cheer("📏", "Đã ghi vòng eo", d.waist ? d.waist + " cm" : ""); render(); };
  $("#expDay").onclick = () => exportSheet(`📋 Tổng kết ${dm(TODAY)}`, dayExport(TODAY));

  function drawChecks() {
    const t = ticksOn(TODAY), on = Object.values(t).filter(Boolean).length, n = CHECKS.length, C = 2 * Math.PI * 30, pct = on / n;
    $("#chk").innerHTML = `<div class="ring-hd"><svg width="78" height="78" viewBox="0 0 78 78" aria-hidden="true"><circle cx="39" cy="39" r="30" fill="none" stroke="#fdf0e0" stroke-width="10"/><circle cx="39" cy="39" r="30" fill="none" stroke="${pct === 1 ? "#1f9a63" : "#e8a317"}" stroke-width="10" stroke-linecap="round" stroke-dasharray="${C * pct} ${C}" transform="rotate(-90 39 39)"/><text x="39" y="45" text-anchor="middle" font-size="18" font-weight="800" fill="#2b1d14">${on}/${n}</text></svg>
      <div><h3>✅ Checklist hôm nay</h3><div class="muted small" style="font-weight:600">${pct === 1 ? "Hoàn hảo! 🎆" : pct >= KEEP ? "Đã giữ lửa 🔥 hôm nay" : `Thêm ${Math.ceil(KEEP * n) - on} việc để giữ lửa 🔥`}</div></div></div>
      ${CHECKS.map(([k, label, m]) => `<div class="tick ${t[k] ? "on" : ""}" data-k="${k}"><span class="box"></span><span class="t">${k === "move" ? MOVE_LABEL(TODAY) : label}</span><span class="meta">${m}</span></div>${k === "water" ? `<div class="cups" id="cups"></div>` : ""}`).join("")}`;
    const w = d.water || 0;
    $("#cups").innerHTML = Array.from({ length: 10 }, (_, i) => `<button data-c="${i}" aria-label="Cốc ${i + 1} (${(i + 1) * 250} ml)"><svg viewBox="0 0 34 40"><path d="M5 4 H29 L26 37 H8 Z" fill="${i < w ? "#cfe6fb" : "#fff"}" stroke="${i < w ? "#2a78d6" : "#e6d5bf"}" stroke-width="2.5" stroke-linejoin="round"/>${i < w ? `<path d="M7 14 H27 L25.5 35 H8.5 Z" fill="#2a78d6" opacity=".55"/>` : ""}</svg></button>`).join("") +
      `<span class="wl">${fmt(w * .25, 2).replace(/\.?0+$/, "")} / 2.5 L</span>`;
  }
  $("#chk").onclick = e => {
    const c = e.target.closest("[data-c]");
    if (c) { const i = +c.dataset.c, was = d.water || 0; d.water = i + 1 === was ? i : i + 1; const full = d.water >= 10; if (full && !d.ticks.water) FX.celebrate({ emoji: "💧", title: "Đủ 2.5 L!", sub: "+10 XP" }); d.ticks.water = full ? 1 : 0; Store.save(); drawChecks(); refreshHeader(); return; }
    const r = e.target.closest(".tick"); if (!r) return;
    const k = r.dataset.k;
    if (k === "move" && plan.k === "gym" && g && g.finished) { FX.cheer("🏋️", "Buổi tập đã xong", "tick tự động từ tab Gym"); return; }
    const before = Object.values(ticksOn(TODAY)).filter(Boolean).length;
    d.ticks[k] = d.ticks[k] ? 0 : 1; Store.save();
    const after = Object.values(ticksOn(TODAY)).filter(Boolean).length;
    if (d.ticks[k]) {
      if (after === CHECKS.length) FX.celebrate({ big: true, emoji: "🎆", title: "Ngày hoàn hảo!", sub: `🔥 ${streak()} ngày giữ lửa · +80 XP` });
      else if (before < KEEP * CHECKS.length && after >= KEEP * CHECKS.length) FX.celebrate({ emoji: "🔥", title: "Đã giữ lửa hôm nay!", sub: `${streak()} ngày liên tiếp` });
      else FX.celebrate({ xp: 10 });
    }
    drawChecks(); refreshHeader();
  };
  function drawMenu() {
    const mi = d.main || 0, mm = MAINS[mi], L = meal("lunch", mi), Dn = meal("dinner", mi);
    const K = BREAKFAST_SUM[0] + L.kcal + Dn.kcal, Pr = BREAKFAST_SUM[1] + L.prot + Dn.prot, F = BREAKFAST_SUM[2] + L.fib + Dn.fib;
    const m = (lab, v, t, max, col, unit) => `<div><div class="l"><span>${lab}</span><span>${fmt(v)} / ${fmt(t)} ${unit}</span></div><div class="meter"><i style="width:${Math.min(100, v / max * 100)}%;background:${col}"></i><s style="left:${t / max * 100}%"></s></div></div>`;
    $("#mnu").innerHTML = `<h3>🍽️ Thực đơn hôm nay <a class="sub" href="#food">chi tiết →</a></h3>
      <div class="meal"><div class="mh2"><b>☀️ Sáng chuẩn</b><span class="k">${Math.round(BREAKFAST_SUM[0])} kcal · ${Math.round(BREAKFAST_SUM[1])} g</span></div><div class="items">Sinh tố (½ whey, 200 ml sữa đậu nành, ½ chuối, chia, 20 g yến mạch) + 2 trứng luộc</div></div>
      <div class="meal"><div class="mh2"><b>🍖 Món mặn</b><span class="chip gold">trưa = tối</span></div>
        <select id="mainSel" aria-label="Món mặn cho cả trưa và tối">${MAINS.map((x, i) => `<option value="${i}" ${i === mi ? "selected" : ""}>${x[0]} ${x[1]} ${x[2]} · cơm ${x[5]} g</option>`).join("")}</select>
        <div class="items">Mỗi bữa: cơm <b>${mm[5]} g</b> + ${mm[1].toLowerCase()} ${mm[2]} (~22 g đạm) + rau luộc 100 g + 1 chén canh củ thịt bằm${mm[6] >= 10 ? `<br><b style="color:var(--c2)">⚠️ ${mm[6]} g fat/phần: chỉ 1 bữa/ngày${mm[6] >= 14 ? ", 1–2 lần/tuần" : ""}</b>` : ""}</div></div>
      <div class="meal two"><div><b>🌤️ Trưa</b> <span class="k">${L.kcal} kcal · ${Math.round(L.prot)} g</span><div class="items">+ 🍈 1 trái ổi</div></div><div><b>🌙 Tối</b> <span class="k">${Dn.kcal} kcal · ${Math.round(Dn.prot)} g</span><div class="items">+ 🍎 ½ táo · 🥣 sữa chua Vinamilk</div></div></div>
      <div class="tot">${m("Calo", K, 1540, 1800, K > 1600 ? "#eb6834" : "#e8a317", "kcal")}${m("Protein", Pr, 118, 140, Pr >= 110 ? "#1f9a63" : "#eb6834", "g")}${m("Chất xơ", F, 20, 30, F >= 20 ? "#1f9a63" : "#eb6834", "g")}</div>`;
    $("#mainSel").onchange = e => { d.main = +e.target.value; Store.save(); drawMenu(); FX.cheer(MAINS[d.main][0], "Đã đổi món mặn", `cơm ${MAINS[d.main][5]} g mỗi bữa để vẫn ~540 kcal`); };
  }
};
