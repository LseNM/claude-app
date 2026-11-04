"use strict";
/* Hôm nay (v2): one screen — today's session, 3 tiles (cân · checklist · ăn), 8 tick chips + water, meal icons. Schedule and export behind small links. */
VIEWS.today = el => {
  const plan = WEEK_PLAN[TODAY.getDay()], d = Store.day(TISO), g = Store.gym(TISO), w7 = avg7(TODAY);
  const CK = { weigh: ["⚖️", "Cân"], water: ["💧", "2.5 L"], steps: ["👟", "7k bước"], bf: ["☀️", "Sáng"], lunch: ["🌤️", "Trưa"], move: [plan.e, plan.t.replace(" · chợ · review", "")], dinner: ["🌙", "Tối"], sleep: ["😴", "22:30"] };
  const sub = plan.k === "gym" ? `18:30 · ${programFor(TODAY, plan.t).length} bài · ${g && g.finished ? "đã xong ✓" : g ? "đang tập dở" : "chưa tập"}` : { zone2: "Zone 2 · 40–45 phút · nhịp tim 125–140", walk: "Đi bộ nhanh 45 phút", yoga: "Yoga 60 phút buổi sáng", rest: "Nghỉ · đi chợ · nấu sẵn · review tuần" }[plan.k];
  const draw = () => {
    const t = ticksOn(TODAY), on = Object.values(t).filter(Boolean).length, E = dayEaten(TISO), p = dayPlan(TISO);
    const ms = (m, lab) => { const icons = m === "bf" ? Object.keys(p.bf).map(k => FOODS[k].e) : [...Object.keys(p.pot).filter(k => k !== "giavi").map(k => FOODS[k].e), ...Object.keys(p[m]).map(k => FOODS[k].e)];
      const ex = extraItems(TISO, m).map(f => f.e || foodEmoji(f.n)); return `<a class="ms ${t[m] ? "on" : ""}" href="#food/log"><span class="n">${lab}</span><span class="ic">${[...icons, ...ex].join("")}</span><span class="k num">${t[m] ? "✓" : fmt(mealVal(p, m)[0])}</span></a>`; };
    el.innerHTML = `<div class="screen">
      <section class="card hero2"><div class="t"><small>${WDN[TODAY.getDay()][0].toUpperCase() + WDN[TODAY.getDay()].slice(1)} ${dm(TODAY)}</small><b>${MOVE_LABEL(TODAY)}</b><small>${sub}</small></div>
        ${plan.k === "gym" ? `<a class="btn" href="#gym">${g && g.finished ? "Xem" : g ? "Tiếp tục" : "Bắt đầu"}</a>` : ""}</section>
      <div class="tiles3">
        <button class="tile" id="wTile"><span class="lbl">Cân sáng</span><b class="num">${d.w ? fmt(d.w, 1) : "—"} <small>kg</small></b><span class="small num">${w7 ? "TB 7 ngày " + fmt(w7, 1) : "bấm để ghi"}</span></button>
        <div class="tile"><span class="lbl">Checklist</span><b class="num">${on}<small>/8</small></b><span class="small">${on === 8 ? "hoàn hảo 🎆" : on >= 5 ? "đã giữ lửa 🔥" : `thêm ${5 - on} việc`}</span></div>
        <a class="tile" href="#food/log"><span class="lbl">Đã ăn</span><b class="num">${fmt(E[0])}</b><span class="small num">P ${fmt(E[1])} g</span></a>
      </div>
      <section class="card"><div class="checks" id="cks">${CHECKS.map(([k]) => `<button class="ck ${t[k] ? "on" : ""}" data-k="${k}" aria-pressed="${!!t[k]}"><span>${CK[k][0]}</span>${esc(CK[k][1])}</button>`).join("")}</div>
        <div class="cups" id="cups">${Array.from({ length: 10 }, (_, i) => `<button data-c="${i}" aria-label="Cốc ${i + 1} (${(i + 1) * 250} ml)"><svg viewBox="0 0 24 28"><path d="M3 3h18l-2 22H5z" fill="${i < d.water ? "#cfe6fb" : "#fff"}" stroke="${i < d.water ? "#2a78d6" : "#e6d5bf"}" stroke-width="2" stroke-linejoin="round"/></svg></button>`).join("")}<span class="wl num">${fmt((d.water || 0) * .25, 2).replace(/\.?0+$/, "") || 0} / 2.5 L</span></div></section>
      <section class="card"><div class="h"><b>Bữa hôm nay</b><span>${fmt(dayPlanned(TISO)[0])} kcal theo kế hoạch</span></div><div class="mealstrip">${ms("bf", "Sáng")}${ms("lunch", "Trưa")}${ms("dinner", "Tối")}</div></section>
      <div class="minil"><button id="sched">Lịch một ngày chuẩn</button><button id="expDay">Xuất cho Claude Project</button></div></div>`;
  };
  draw();
  el.onclick = e => {
    const c = e.target.closest("[data-c]");
    if (c) { const i = +c.dataset.c, full0 = d.water >= 10; d.water = i + 1 === d.water ? i : i + 1; d.ticks.water = d.water >= 10 ? 1 : 0; Store.save(); if (!full0 && d.water >= 10) FX.celebrate({ emoji: "💧", title: "Đủ 2.5 L!", sub: "+10 XP" }); draw(); refreshHeader(); return; }
    const r = e.target.closest(".ck");
    if (r) { const k = r.dataset.k;
      if (k === "move" && plan.k === "gym" && g && g.finished) { FX.cheer("🏋️", "Buổi tập đã xong", "tick tự động từ tab Gym"); return; }
      const before = Object.values(ticksOn(TODAY)).filter(Boolean).length; if (["bf", "lunch", "dinner"].includes(k)) dayPlan(TISO, true);
      d.ticks[k] = d.ticks[k] ? 0 : 1; Store.save(); const after = Object.values(ticksOn(TODAY)).filter(Boolean).length;
      if (d.ticks[k]) { if (after === CHECKS.length) FX.celebrate({ big: true, emoji: "🎆", title: "Ngày hoàn hảo!", sub: `🔥 ${streak()} ngày giữ lửa · +80 XP` });
        else if (before < KEEP * CHECKS.length && after >= KEEP * CHECKS.length) FX.celebrate({ emoji: "🔥", title: "Đã giữ lửa hôm nay!", sub: `${streak()} ngày liên tiếp` }); else FX.celebrate({ xp: 10 }); }
      draw(); refreshHeader(); return; }
    if (e.target.closest("#wTile")) weightSheet();
    if (e.target.closest("#expDay")) exportSheet(`Tổng kết ${dm(TODAY)}`, dayExport(TODAY));
    if (e.target.closest("#sched")) schedSheet();
  };
  function weightSheet() {
    const mon = TODAY.getDay() === 1;
    sheet("Cân sáng nay", `<div class="stepper"><button data-s="-0.1" aria-label="Bớt 0.1">−</button><input id="wIn" class="num" inputmode="decimal" value="${d.w || (w7 ? fmt(w7, 1) : "")}" aria-label="kg"><span class="u">kg</span><button data-s="0.1" aria-label="Thêm 0.1">＋</button></div>
      <p class="note">Cân sau khi đi vệ sinh, trước khi ăn. App tự tính trung bình 7 ngày.</p>
      ${mon ? `<label class="fld">Vòng eo ngang rốn (thứ Hai)<input id="waIn" inputmode="decimal" value="${d.waist || ""}" placeholder="cm"></label>` : ""}
      <button class="btn wide" id="wOk">Lưu</button>`, (bg, close) => {
      const num = v => { const n = parseFloat(String(v).replace(",", ".")); return isNaN(n) ? null : n; };
      bg.addEventListener("click", e => { const s = e.target.closest("[data-s]"); if (s) $("#wIn", bg).value = ((num($("#wIn", bg).value) || 54) + +s.dataset.s).toFixed(1); });
      $("#wOk", bg).onclick = () => { const v = num($("#wIn", bg).value); d.w = v; if (v) d.ticks.weigh = 1; const wa = $("#waIn", bg); if (wa) d.waist = num(wa.value); Store.save(); close(); FX.cheer("⚖️", "Đã ghi cân", v ? v + " kg" : ""); draw(); refreshHeader(); };
    });
  }
  function schedSheet() {
    const kind = plan.k, sched = kind === "yoga" ? [DAY_COMMON.morning[0], DAY_COMMON.morning[1], ...DAY_MID.yoga, ...DAY_COMMON.evening]
      : kind === "rest" ? [...DAY_COMMON.morning.slice(0, 3), ...DAY_MID.rest, ...DAY_COMMON.evening] : [...DAY_COMMON.morning, ...DAY_MID[kind], ...DAY_COMMON.evening];
    const toH = s => { const [h, m] = s.split(":").map(Number); return h + m / 60; }, nowH = new Date().getHours() + new Date().getMinutes() / 60, isReal = !QS.get("date");
    const ni = isReal ? sched.reduce((a, s, i) => toH(s[0]) <= nowH ? i : a, -1) : -1;
    sheet("Lịch một ngày chuẩn", `<div class="sched">${sched.map((s, i) => `<div class="sl ${i === ni ? "now" : i < ni ? "past" : ""} k-${s[1]}"><b>${s[0]}</b><span>${s[2]}</span></div>`).join("")}</div>`);
  }
};
