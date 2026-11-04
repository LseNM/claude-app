"use strict";
/* Lộ trình: Gantt (phase targets, checklist, strength, reward) · Tuần (7 days + Sunday review) · Tháng (heatmap, photos, progress). */
(() => {
  let sub = "gantt", sel = (phaseAt(TODAY) || PHASES[0]).id, zoom = "tet", weekOff = 0, monthOff = 0;
  const personal = () => { const p = Store.personal() || { kind: "tet-body-personal" }; p.targets = p.targets || {}; p.rewards = p.rewards || {}; p.strength = p.strength || {}; p.inbody = p.inbody || {}; return p; };
  const savePersonal = p => Store.setPersonal(p);
  /* every InBody sheet so far (from the personal file or "Chụp tờ InBody") */
  const ibHistory = () => { const L = personal().inbodyLog || []; if (!L.length) return "";
    const d = s => `${s.slice(8)}/${s.slice(5, 7)}/${s.slice(2, 4)}`, c = v => v == null ? "—" : fmt(v, 1);
    return `<div class="ibh"><div class="lbl">Lịch sử InBody</div><div class="tscroll"><table class="nt"><tr><th>Ngày</th><th class="n">Cân</th><th class="n">PBF %</th><th class="n">SMM</th><th class="n">Mỡ kg</th><th class="n">Điểm</th></tr>
      ${L.map(x => `<tr><td>${d(x.date)}</td><td class="n">${c(x.w)}</td><td class="n">${c(x.pbf)}</td><td class="n">${c(x.smm)}</td><td class="n">${c(x.fat)}</td><td class="n">${x.score ?? "—"}</td></tr>`).join("")}</table></div></div>`; };
  const minD = (a, b) => a < b ? a : b;

  VIEWS.plan = el => {
    const h = location.hash.split("/")[1]; if (["gantt", "week", "month"].includes(h)) sub = h;
    el.innerHTML = `${vision(true)}<div class="subtabs">${[["gantt", "🗓️ Gantt"], ["week", "📅 Tuần"], ["month", "🗓 Tháng"]].map(([k, t]) => `<a href="#plan/${k}" class="${k === sub ? "on" : ""}">${t}</a>`).join("")}</div><div id="sub"></div>`;
    ({ gantt, week, month })[sub]($("#sub"));
  };
  const noPersonal = () => Store.personal() && Store.personal().baseline ? "" : `<div class="note-warn">Chưa có dữ liệu cá nhân (số InBody mốc 0, target). Vào <b>☰ Cài đặt → Nhập file cá nhân</b>, hoặc gõ trực tiếp vào các ô target bên dưới.</div>`;

  /* ---------------- Gantt ---------------- */
  function gantt(el) {
    el.innerHTML = `${noPersonal()}<section class="card gantt-card"><div class="hd"><h3>🗓️ Lộ trình tới Tết</h3><span class="muted small">Bấm một giai đoạn để xem và sửa target</span>
      <div class="seg"><button data-z="tet" class="${zoom === "tet" ? "on" : ""}">Tới Tết</button><button data-z="all" class="${zoom === "all" ? "on" : ""}">Cả chặng 2</button></div></div>
      <div class="gscroll"><svg id="gantt" role="img" aria-label="Gantt các giai đoạn tới Tết"></svg></div></section><div class="detail" id="detail"></div>`;
    drawGantt(); detail();
    $(".seg", el).onclick = e => { const b = e.target.closest("button"); if (!b) return; zoom = b.dataset.z; gantt(el); };
    $("#gantt").onclick = e => { const g = e.target.closest(".bar"); if (g) { sel = g.dataset.id; drawGantt(); detail(); $("#detail").scrollIntoView({ behavior: "smooth", block: "start" }); } };
  }
  function drawGantt() {
    const W = 1280, X0 = 200, X1 = W - 24, RH = 44, TOP = 74, a = new Date(2026, 10, 2), b = zoom === "tet" ? new Date(2027, 1, 12) : new Date(2027, 4, 3), span = days(a, b);
    const X = d => X0 + days(a, d) / span * (X1 - X0), H = TOP + (PHASES.length + 1) * RH + 34; let s = "";
    for (let m = new Date(a.getFullYear(), a.getMonth() + 1, 1); m < b; m = new Date(m.getFullYear(), m.getMonth() + 1, 1))
      s += `<line x1="${X(m)}" y1="16" x2="${X(m)}" y2="${H - 6}" stroke="#e6d5bf" stroke-width="1.5"/><text x="${X(m) + 6}" y="22" font-size="14" font-weight="700" fill="#6b5a4e">Th${m.getMonth() + 1}${m.getMonth() === 0 ? " · 2027" : ""}</text>`;
    if (zoom === "tet") for (let w = 0; w < 12; w++) { const d0 = addD(START, w * 7), x = X(d0), x2 = X(addD(d0, 7)), on = w + 1 === challengeWeek && challengeDay >= 1;
      s += `<rect x="${x + 1}" y="32" width="${x2 - x - 2}" height="18" rx="5" fill="${on ? "#c8302c" : w % 2 ? "#fdf0e0" : "#fbe7cf"}"/><text x="${(x + x2) / 2}" y="45" font-size="12" font-weight="700" text-anchor="middle" fill="${on ? "#fff" : "#6b5a4e"}">T${w + 1}</text>`; }
    s += `<text x="12" y="45" font-size="13" font-weight="700" fill="#9a8a7e">Tuần challenge</text>`;
    const h1 = X(new Date(2026, 11, 24)), h2 = X(new Date(2027, 0, 2));
    s += `<defs><pattern id="hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" fill="#fff4e2"/><line x1="0" y1="0" x2="0" y2="8" stroke="#f3d9b0" stroke-width="3"/></pattern></defs>
      <rect x="${h1}" y="${TOP - 8}" width="${h2 - h1}" height="${H - TOP}" fill="url(#hatch)" data-tip="Nghỉ lễ 24/12–01/01"/><text x="${(h1 + h2) / 2}" y="${H - 8}" font-size="12" text-anchor="middle" fill="#b57d08" font-weight="700">Nghỉ lễ</text>`;
    const p = personal();
    PHASES.forEach((ph, i) => {
      const y = TOP + i * RH, x = X(ph.f), x2 = Math.min(X(addD(ph.t, 1)), X1), wd = Math.max(8, x2 - x - 2), done = Object.values(Store.phase(ph.id).done).filter(Boolean).length, tot = ph.checklist.length;
      const past = TODAY > ph.t, now = TODAY >= ph.f && TODAY <= ph.t, pct = now ? days(ph.f, TODAY) / (days(ph.f, ph.t) + 1) : past ? 1 : 0;
      s += `<text x="12" y="${y + (ph.weeks ? 20 : 27)}" font-size="15" font-weight="${now ? 800 : 700}" fill="${ph.faded ? "#9a8a7e" : "#2b1d14"}">${ph.name}</text>${ph.weeks ? `<text x="12" y="${y + 37}" font-size="12" fill="#9a8a7e">${ph.weeks}</text>` : ""}`;
      s += `<g class="bar ${ph.id === sel ? "sel" : ""}" data-id="${ph.id}" data-tip="${ph.name} · ${dm(ph.f)} → ${dm(ph.t)} · ${ph.focus}"><rect class="main" x="${x + 1}" y="${y + 6}" width="${wd}" height="${RH - 12}" rx="10" fill="${ph.color}" opacity="${ph.faded ? .35 : past ? .55 : 1}" ${ph.faded ? 'stroke-dasharray="6 4" stroke="#9a8a7e"' : ""}/>
        ${now ? `<rect x="${x + 1}" y="${y + RH - 12}" width="${wd * pct}" height="6" rx="3" fill="#fff" opacity=".8"/>` : ""}${wd > 110 ? `<text x="${x + 12}" y="${y + 27}" font-size="13" font-weight="700" fill="#fff">${dm(ph.f)} – ${dm(ph.t)}${past ? " ✓" : ""}</text>` : ""}
        ${tot && wd > 230 ? `<text x="${x2 - 10}" y="${y + 27}" font-size="13" font-weight="800" text-anchor="end" fill="#fff">${done}/${tot} mục</text>` : ""}</g>`;
      if (p.rewards[ph.id] && x2 + 30 < X1) s += `<text x="${x2 + 6}" y="${y + 28}" font-size="18" data-tip="Phần thưởng: ${esc(p.rewards[ph.id])}">🎁</text>`;
      if (ph.faded && zoom === "tet") s += `<text x="${X1 - 4}" y="${y + 27}" font-size="13" text-anchor="end" fill="#6b5a4e" font-weight="700">→ 30/04</text>`;
    });
    { const y = TOP + PHASES.length * RH;
      s += `<line x1="12" x2="${X1}" y1="${y + 2}" y2="${y + 2}" stroke="#f0e3d2"/><text x="12" y="${y + 20}" font-size="15" font-weight="700" fill="#2b1d14">Kiểu tập</text><text x="12" y="${y + 37}" font-size="12" fill="#9a8a7e">A · B · C</text>`;
      [[new Date(2026, 10, 4), NOMACHINE_UNTIL, "#8a6d5a", "🏠 Không máy", "Tới 30/11: tạ tay, ghế, thảm"], [addD(NOMACHINE_UNTIL, 1), new Date(2027, 1, 5), "#3b4552", "🏋️ Có máy · A/B/C gốc (leg press, lat pulldown, cable row…)", "Từ 01/12"]].forEach(([f, t, c, lab, tip]) => {
        const x = X(f), x2 = Math.min(X(addD(t, 1)), X1); s += `<g data-tip="${tip}"><rect x="${x + 1}" y="${y + 10}" width="${x2 - x - 2}" height="${RH - 20}" rx="8" fill="${c}"/><text x="${x + 10}" y="${y + 27}" font-size="12.5" font-weight="700" fill="#fff">${lab}</text></g>`; }); }
    MILESTONES.forEach(([d, t, e]) => { if (d > b) return; const x = X(d), tet = t === "Tết";
      s += `<line x1="${x}" y1="${TOP - 10}" x2="${x}" y2="${H - 14}" stroke="${tet ? "#c8302c" : "#b57d08"}" stroke-width="${tet ? 2.5 : 1.5}" stroke-dasharray="${tet ? "" : "3 4"}"/><g data-tip="${t} · ${dm(d)}"><circle cx="${x}" cy="${TOP - 12}" r="${tet ? 14 : 11}" fill="${tet ? "#c8302c" : "#fff1d2"}" stroke="${tet ? "#fff" : "#e8a317"}" stroke-width="2"/><text x="${x}" y="${TOP - 7}" font-size="${tet ? 15 : 12}" text-anchor="middle">${e}</text></g>`; });
    if (TODAY >= a && TODAY <= b) { const xt = X(TODAY); s += `<line x1="${xt}" y1="${TOP - 4}" x2="${xt}" y2="${H - 10}" stroke="#c8302c" stroke-width="2.5"/><rect x="${xt - 56}" y="${H - 24}" width="112" height="22" rx="7" fill="#c8302c"/><text x="${xt}" y="${H - 8}" font-size="12" font-weight="800" fill="#fff" text-anchor="middle">Hôm nay ${dm(TODAY)}</text>`; }
    const g = $("#gantt"); g.setAttribute("viewBox", `0 0 ${W} ${H + 4}`); g.innerHTML = s;
  }
  function metricRows(ph) {
    const p = personal(), tg = p.targets[ph.id] || {}, keys = Object.keys(tg).length ? Object.keys(tg) : ph.id === "prep" ? ["w"] : ["w", "waistD"], idx = PHASES.indexOf(ph), until = minD(TODAY, ph.t), started = TODAY >= ph.f;
    const base = p.baseline || {}, prevT = idx > 0 ? (p.targets[PHASES[idx - 1].id] || {}) : {};
    return keys.map(k => {
      const [label, unit, dir] = METRIC_DEF[k] || [k, "", -1];
      const start = prevT[k] ?? (k === "w" ? base.weight : k === "waistD" ? 0 : base[k]);
      let now = null;
      if (started) { if (k === "w") now = avg7(until); else if (k === "waistD") { const f = waistFirst(), c = waistUntil(until); now = f != null && c != null ? +(c - f).toFixed(1) : null; } else now = (p.inbody[ph.id] || {})[k] ?? null; }
      const t = tg[k], ok = now != null && t != null && (dir < 0 ? now <= t : now >= t);
      const prog = now != null && t != null && start != null && start !== t ? Math.max(0, Math.min(1, (start - now) / (start - t))) : 0;
      const nowCell = ["pbf", "smm", "fat"].includes(k) ? `<input class="mi" data-ib="${k}" value="${now ?? ""}" placeholder="nhập" aria-label="Kết quả ${label}">` : `<b>${now == null ? "—" : fmt(now, 1)}</b>`;
      return `<div class="mrow"><div class="l1"><b>${label}</b>${now == null ? `<span class="chip">chưa có số</span>` : t == null ? "" : ok ? `<span class="chip green">✓ đạt</span>` : `<span class="chip gold">còn ${fmt(Math.abs(t - now), 1)}</span>`}</div>
        <div class="nums"><span>Bắt đầu <b>${start == null ? "—" : fmt(start, 1)}</b></span><span>Target <input class="mi" data-tg="${k}" value="${t ?? ""}" placeholder="—" aria-label="Target ${label}"> ${unit}</span><span>Hiện tại ${nowCell}</span></div>
        <div class="track"><i style="width:${(prog * 100).toFixed(0)}%"></i></div></div>`;
    }).join("");
  }
  function detail() {
    const ph = PHASES.find(x => x.id === sel), st = Store.phase(ph.id), done = ph.checklist.filter((_, i) => st.done[i]).length, tot = ph.checklist.length, p = personal();
    const state = TODAY > ph.t ? "Đã qua" : TODAY < ph.f ? `Bắt đầu sau ${days(TODAY, ph.f)} ngày` : `Còn ${days(TODAY, ph.t)} ngày`, pct = tot ? Math.round(done / tot * 100) : 0, C = 2 * Math.PI * 24;
    const str = p.strength[ph.id] || [];
    $("#detail").innerHTML = `
    <div class="card phase-head"><span class="dot" style="background:${ph.color}"></span><div><h2>${ph.name}</h2><div class="meta">${dm(ph.f)} → ${dm(ph.t)}${ph.weeks ? " · " + ph.weeks : ""} · ${ph.focus}</div></div>
      <span class="chip ${TODAY >= ph.f && TODAY <= ph.t ? "red" : ""}">${TODAY >= ph.f && TODAY <= ph.t ? "📍 Đang ở đây · " : ""}${state}</span>
      <div class="ring"><svg width="62" height="62" viewBox="0 0 62 62" aria-hidden="true"><circle cx="31" cy="31" r="24" fill="none" stroke="#fdf0e0" stroke-width="8"/><circle cx="31" cy="31" r="24" fill="none" stroke="${ph.color}" stroke-width="8" stroke-linecap="round" stroke-dasharray="${C * pct / 100} ${C}" transform="rotate(-90 31 31)"/><text x="31" y="36" text-anchor="middle" font-size="15" font-weight="800" fill="#2b1d14">${pct}%</text></svg><span class="muted small" style="font-weight:600">checklist<br>${done}/${tot} xong</span></div></div>
    <div class="card"><h3>🎯 Target số đo <span class="sub">sửa ô đỏ được</span></h3>${metricRows(ph)}${ibHistory()}<p class="muted small" style="margin:10px 0 0">Cân TB 7 ngày và eo lấy từ số bạn ghi ở tab Hôm nay. PBF/SMM/Mỡ: gõ kết quả InBody vào ô "Hiện tại", hoặc chụp tờ kết quả để AI đọc giúp.</p>
      <button class="btn ghost" id="ibScan" style="margin-top:10px">📸 Chụp tờ InBody → AI đọc số</button></div>
    <div class="card"><h3>✅ Checklist mục tiêu <span class="sub">tick → 🎉</span></h3>
      <div id="cl">${tot ? ph.checklist.map((c, i) => `<div class="tick ${st.done[i] ? "on" : ""}" data-i="${i}"><span class="box"></span><span class="t">${c}</span></div>`).join("") : `<div class="muted">Chặng 2 sẽ lập chi tiết sau Tết.</div>`}</div>
      <div class="reward"><span class="g">🎁</span><div style="flex:1"><small>PHẦN THƯỞNG KHI QUA GIAI ĐOẠN · BẠN TỰ ĐẶT</small><input id="rw" value="${esc(p.rewards[ph.id] || "")}" placeholder="Gõ phần thưởng…" aria-label="Phần thưởng"></div></div></div>
    <div class="card"><h3>💪 Target sức mạnh <span class="sub">kg × rep cuối giai đoạn</span></h3>
      ${str.length ? `<table class="str"><tr><th>Bài</th><th class="n">Target</th><th class="n">Tốt nhất</th><th></th></tr>${str.map(([id, kg, r], j) => { const b = bestSet(id, minD(TODAY, ph.t)), ok = b && (b.kg > kg || (b.kg === kg && b.reps >= r));
        return `<tr class="${ok ? "ok" : ""}"><td>${exName(id)}</td><td class="n"><input class="mi sm" data-sk="${j}" value="${kg}" aria-label="Target kg ${exName(id)}"> × ${r}</td><td class="n">${b ? `${b.kg} × ${b.reps}` : "—"}</td><td class="n">${ok ? "✓" : ""}</td></tr>`; }).join("")}</table>`
        : `<div class="muted">Chưa đặt target sức mạnh cho giai đoạn này (file cá nhân có sẵn bản nháp).</div>`}
      <p class="muted small" style="margin:10px 0 0">"Tốt nhất" lấy từ set đã tick ✓ ở tab Gym.${ph.f <= NOMACHINE_UNTIL ? " Giai đoạn này đo bằng bài không máy (tới 30/11)." : ""}</p></div>`;
    $("#ibScan").onclick = () => pickImage(img => AI.open({ kind: "inbody", title: "📊 Đọc tờ InBody", img, meta: { ph: ph.id } }), 1600);
    $("#cl").onclick = e => { const r = e.target.closest(".tick"); if (!r) return; const i = +r.dataset.i; st.done[i] = st.done[i] ? 0 : 1; Store.save(); refreshHeader();
      if (st.done[i]) { if (ph.checklist.every((_, j) => st.done[j])) { FX.cheer("✅", "Xong mục tiêu", ""); setTimeout(() => win(ph), 900); } else FX.celebrate({ xp: 25 }); } drawGantt(); detail(); };
    $("#detail").onchange = e => {
      const t = e.target, q = personal(), num = v => { const n = parseFloat(String(v).replace(",", ".")); return isNaN(n) ? null : n; };
      if (t.id === "rw") q.rewards[ph.id] = t.value.trim();
      else if (t.dataset.tg) { (q.targets[ph.id] = q.targets[ph.id] || {})[t.dataset.tg] = num(t.value); }
      else if (t.dataset.ib) { (q.inbody[ph.id] = q.inbody[ph.id] || {})[t.dataset.ib] = num(t.value); }
      else if (t.dataset.sk) { q.strength[ph.id][+t.dataset.sk][1] = num(t.value) ?? 0; }
      else return;
      savePersonal(q); FX.cheer("✏️", "Đã lưu", "trên máy này"); drawGantt(); detail();
    };
  }
  function win(ph) {
    const p = personal(), str = p.strength[ph.id] || [];
    FX.phaseWin({ phase: ph.name, title: "Qua giai đoạn! 🎉", reward: p.rewards[ph.id] || "",
      lines: [`📅 ${dm(ph.f)} → ${dm(ph.t)} · ${ph.checklist.length}/${ph.checklist.length} mục tiêu`, ...(avg7(minD(TODAY, ph.t)) ? [`⚖️ Cân TB 7 ngày: ${fmt(avg7(minD(TODAY, ph.t)), 1)} kg`] : []),
        ...(str.length ? [`💪 ${str.filter(([id, kg, r]) => { const b = bestSet(id, minD(TODAY, ph.t)); return b && (b.kg > kg || (b.kg === kg && b.reps >= r)); }).length}/${str.length} bài đạt target sức mạnh`] : [])] });
  }

  /* ---------------- Week ---------------- */
  function week(el) {
    const mon = addD(TODAY, -((TODAY.getDay() + 6) % 7) + weekOff * 7), sun = addD(mon, 6), wk = [...Array(7)].map((_, i) => addD(mon, i));
    const endRef = minD(sun, TODAY), w = avg7(endRef), wp = avg7(addD(endRef, -7));
    const waistIn = waistLog().filter(x => x[0] >= mon && x[0] <= sun), waistPrev = waistLog().filter(x => x[0] < mon);
    const gymDone = wk.filter(d => { const g = Store.gym(iso(d)); return g && g.finished; }).length;
    const past = wk.filter(d => d <= TODAY), avgScore = past.length ? past.reduce((a, d) => a + scoreOn(d), 0) / past.length : 0;
    const wn = days(START, mon) / 7 + 1, wlabel = wn >= 1 && wn <= 12 ? `Tuần ${wn}/12` : "Tuần";
    /* calorie rule (note Body Fat): 3 weeks with no drop → −100 kcal or +2,000 steps; > 0.5 kg/week drop → +100–150 kcal */
    const wa = [0, 1, 2, 3].map(k => avg7(addD(endRef, -7 * k)));
    let rule;
    if (wa.slice(0, 2).some(v => v == null)) rule = ["", "Chưa đủ số cân để áp quy tắc chỉnh calo (cần cân ít nhất vài ngày mỗi tuần)."];
    else if (wa[1] - wa[0] > .5) rule = ["warn", `Cân TB giảm ${fmt(wa[1] - wa[0], 1)} kg/tuần, nhanh hơn 0.5 kg → <b>thêm 100–150 kcal</b>, chủ yếu từ cơm.`];
    else if (wa.every(v => v != null) && wa[0] >= wa[1] && wa[1] >= wa[2] && wa[2] >= wa[3]) rule = ["warn", "3 tuần liền cân TB không giảm → <b>bớt 100 kcal/ngày hoặc thêm 2,000 bước</b> (xem cả vòng eo trước khi chỉnh)."];
    else rule = ["ok", `Cân TB ${wa[0] <= wa[1] ? "giảm" : "tăng"} ${fmt(Math.abs(wa[1] - wa[0]), 1)} kg so với tuần trước → <b>giữ 1,540 kcal</b>.`];
    const nextMon = addD(sun, 1), ready = [];
    ["Gym A", "Gym B", "Gym C"].forEach((s, j) => programFor(addD(nextMon, [0, 2, 4][j]), s).forEach(en => { const sg = suggestion(en, lastSets(en.id, nextMon)); if (sg.up && !sg.first && !ready.some(r => r[0] === en.id)) ready.push([en.id, sg.kg]); }));
    const st = (lab, v, unit, d, cls) => `<div class="stat"><small>${lab}</small><b>${v} <span>${unit}</span></b><div class="d ${cls || ""}">${d}</div></div>`;
    el.innerHTML = `<section class="card"><div class="whd"><div class="nav"><button id="wPrev" aria-label="Tuần trước">‹</button><button id="wNext" aria-label="Tuần sau">›</button></div>
        <h2>${wlabel} · ${dm(mon)} – ${dm(sun)}</h2>${phaseAt(mon) ? `<span class="chip">${phaseAt(mon).name}</span>` : ""}${mon <= NOMACHINE_UNTIL ? '<span class="chip green">🏠 không máy</span>' : ""}</div>
      <div class="stats">${st("Cân TB 7 ngày", w ? fmt(w, 1) : "—", "kg", w && wp ? `${w <= wp ? "▼" : "▲"} ${fmt(Math.abs(wp - w), 1)} so với tuần trước` : "cần số cân", w && wp && w <= wp ? "good" : "")}
        ${st("Vòng eo", waistIn.length ? fmt(waistIn[waistIn.length - 1][1], 1) : "—", "cm", waistIn.length && waistPrev.length ? `${waistIn[waistIn.length - 1][1] <= waistPrev[waistPrev.length - 1][1] ? "▼" : "▲"} ${fmt(Math.abs(waistPrev[waistPrev.length - 1][1] - waistIn[waistIn.length - 1][1]), 1)} cm` : "đo thứ Hai", "good")}
        ${st("Buổi gym", gymDone, "/ 3", gymDone >= 3 ? "✓ đủ buổi" : "", gymDone >= 3 ? "good" : "")}${st("Checklist TB", Math.round(avgScore * 100), "%", past.length ? `${past.length} ngày đã qua` : "", avgScore >= KEEP ? "good" : "")}</div></section>
    <div class="days">${wk.map(d => { const p = WEEK_PLAN[d.getDay()], sc = scoreOn(d), isT = +d === +TODAY, fut = d > TODAY, g = Store.gym(iso(d)), wt = weightOn(d);
      return `<div class="day ${isT ? "today" : fut ? "future" : sc >= KEEP ? "done" : "miss"}"><div class="h"><b>${WD[d.getDay()]}</b><small>${dm(d)}</small></div><div class="act">${p.e} ${p.t}</div>
        <div class="st">${isT ? "📍 Hôm nay" : fut ? "sắp tới" : sc >= KEEP ? "🔥 giữ lửa" : "chưa đủ"}</div>${g ? `<div class="kv"><span>Set xong</span><b>${Object.values(g.ex).reduce((a, e) => a + e.sets.filter(s => s.done).length, 0)}${g.finished ? " ✓" : ""}</b></div>` : ""}${wt ? `<div class="kv"><span>Cân</span><b>${fmt(wt, 1)}</b></div>` : ""}
        <div class="mini" data-tip="Checklist ${Math.round(sc * 100)}%"><i style="width:${sc * 100}%"></i></div></div>`; }).join("")}</div>
    <section class="card rv"><h3>📝 Review Chủ nhật <span class="sub">app tự soạn</span></h3>
      <div class="rule ${rule[0]}">${rule[0] === "ok" ? "✅" : rule[0] === "warn" ? "⚠️" : "ℹ️"} ${rule[1]}</div>
      <b>⬆ Tuần sau lên tạ</b><div class="ready">${ready.length ? ready.map(([id, kg]) => `<span class="chip green">${exName(id)} → ${kg} kg</span>`).join("") : '<span class="muted small">Chưa có bài nào đủ rep (hoặc chưa có log).</span>'}</div>
      ${nextMon <= addD(NOMACHINE_UNTIL, 7) && nextMon > addD(NOMACHINE_UNTIL, -7) ? `<p class="small">🏋️ Tuần sau có ngày <b>01/12</b>: từ đó chuyển sang bản có máy (leg press, lat pulldown, cable row), tạ máy bắt đầu nhẹ để học form.</p>` : ""}
      <button class="btn" id="closeW" style="width:100%;font-size:17px">${Store.all.weeksClosed[iso(mon)] ? "✓ Đã chốt tuần · xem lại" : "🧧 Chốt tuần"}</button></section>`;
    $("#wPrev").onclick = () => { weekOff--; week(el); }; $("#wNext").onclick = () => { weekOff++; week(el); };
    $("#closeW").onclick = () => {
      const first = !Store.all.weeksClosed[iso(mon)]; Store.all.weeksClosed[iso(mon)] = 1; Store.save(); refreshHeader();
      if (first) { FX.burst(innerWidth / 2, innerHeight * .7, 120, 14); FX.fireworks(3); }
      const txt = [`🧧 Review ${wlabel} (${dm(mon)}–${dm(sun)})`, `Cân TB 7 ngày: ${w ? fmt(w, 1) + " kg" : "—"}${w && wp ? ` (${w <= wp ? "−" : "+"}${fmt(Math.abs(wp - w), 1)})` : ""}`, `Vòng eo: ${waistIn.length ? waistIn[waistIn.length - 1][1] + " cm" : "—"}`,
        `Buổi gym: ${gymDone}/3 · Checklist TB: ${Math.round(avgScore * 100)}%`, `Quy tắc calo: ${rule[1].replace(/<[^>]+>/g, "")}`, `Tuần sau lên tạ: ${ready.map(([id, kg]) => `${exName(id)} ${kg} kg`).join(", ") || "—"}`].join("\n");
      exportSheet(`🧧 ${wlabel}`, txt);
    };
  }

  /* ---------------- Month ---------------- */
  function month(el) {
    const m0 = new Date(TODAY.getFullYear(), TODAY.getMonth() + monthOff, 1), dim = new Date(m0.getFullYear(), m0.getMonth() + 1, 0).getDate(), key = `m-${m0.getFullYear()}-${pad(m0.getMonth() + 1)}`;
    const ds = [...Array(dim)].map((_, i) => new Date(m0.getFullYear(), m0.getMonth(), i + 1)), past = ds.filter(d => d <= TODAY && d >= START);
    const good = past.filter(d => scoreOn(d) >= KEEP).length, gym = ds.filter(d => { const g = Store.gym(iso(d)); return g && g.finished; }).length;
    const col = v => v >= 1 ? "#1f9a63" : v >= KEEP ? "#a7dcbd" : v >= .4 ? "#f8d58f" : v > 0 ? "#fde1d6" : null;
    const lead = (m0.getDay() + 6) % 7, pm = new Date(m0.getFullYear(), m0.getMonth() - 1, 1), pkey = `m-${pm.getFullYear()}-${pad(pm.getMonth() + 1)}`;
    const wEnd = avg7(minD(new Date(m0.getFullYear(), m0.getMonth(), dim), TODAY));
    el.innerHTML = `<section class="card"><div class="whd"><div class="nav"><button id="mPrev" aria-label="Tháng trước">‹</button><button id="mNext" aria-label="Tháng sau">›</button></div><h2>Tháng ${m0.getMonth() + 1}/${m0.getFullYear()}</h2></div>
      <div class="stats four">${[["Ngày giữ lửa 🔥", `${good}/${past.length}`, past.length ? Math.round(good / past.length * 100) + "% số ngày" : ""], ["Buổi gym xong", gym, ""], ["Cân TB 7 ngày", wEnd ? fmt(wEnd, 1) + " kg" : "—", ""], ["Ảnh tháng", Store.all.photos[key] ? "✓" : "—", ""]].map(([a, b, c]) => `<div class="stat"><small>${a}</small><b>${b}</b><div class="d good">${c}</div></div>`).join("")}</div></section>
    <div class="row2c">
      <section class="card"><h3>🗓️ Mức hoàn thành mỗi ngày</h3><div class="cal">${["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map(w => `<div class="wd">${w}</div>`).join("")}${"<div></div>".repeat(lead)}
        ${ds.map(d => { const sc = scoreOn(d), c = d <= TODAY ? col(sc) : null, p = WEEK_PLAN[d.getDay()], isT = +d === +TODAY;
          return `<div class="c ${!c && !isT ? "out" : ""} ${isT ? "today" : ""}" style="${c ? `background:${c};color:${sc >= 1 ? "#fff" : "#2b1d14"}` : ""}" data-tip="${dm(d)} · ${p.t} · ${Math.round(sc * 100)}%">${d.getDate()}<span>${d >= START && d <= END ? p.e : ""}</span></div>`; }).join("")}</div>
        <div class="scale"><span><i style="background:#fde1d6"></i>&lt; 40%</span><span><i style="background:#f8d58f"></i>40–62%</span><span><i style="background:#a7dcbd"></i>giữ lửa</span><span><i style="background:#1f9a63"></i>100%</span></div></section>
      <section class="card"><h3>📸 Ảnh thân hình <span class="sub">chỉ lưu trên máy này</span></h3><div class="photos">
        ${[[pkey, `Tháng ${pm.getMonth() + 1}`], [key, `Tháng ${m0.getMonth() + 1}`]].map(([k, t]) => `<button class="photo" data-pk="${k}">${Store.all.photos[k] ? `<img src="${Store.all.photos[k]}" alt="${t}">` : `<span class="ph">📷<br>Chọn ảnh</span>`}<span class="cap"><b>${t}</b>${Store.all.photos[k] ? "bấm để đổi" : "chụp cùng chỗ, cùng giờ sáng"}</span></button>`).join("")}</div></section></div>
    <section class="card"><h3>🎯 Cân TB 7 ngày vs đường target tới Tết</h3><svg id="prog" viewBox="0 0 1240 300" role="img" aria-label="Cân trung bình 7 ngày so với target"></svg>
      <div class="legend"><span><i style="background:#2a78d6"></i>Cân TB 7 ngày (bạn ghi)</span><span><i style="background:#c8302c;height:3px;vertical-align:4px"></i>Đường target</span><span><i style="background:#fde8e3"></i>±0.3 kg</span></div></section>`;
    $("#mPrev").onclick = () => { monthOff--; month(el); }; $("#mNext").onclick = () => { monthOff++; month(el); };
    $$(".photo", el).forEach(b => b.onclick = () => pickPhoto(b.dataset.pk, () => month(el)));
    progress();
  }
  function progress() {
    const p = personal(), b0 = p.baseline && p.baseline.weight, b1 = (p.targets.p4 || {}).w, svg = $("#prog");
    if (!b0 || !b1) { svg.innerHTML = `<text x="620" y="150" text-anchor="middle" font-size="18" fill="#9a8a7e">Cần dữ liệu cá nhân (cân mốc 0 và target cân GĐ4) để vẽ đường target.</text>`; return; }
    const W = 1240, H = 300, L = 54, R = 120, T = 30, B = 34, a = START, b = TET;
    const pts = []; for (let d = START; d <= minD(TODAY, TET); d = addD(d, 1)) { const v = avg7(d); if (v && weightOn(d)) pts.push([d, v]); }
    const vals = [b0, b1, ...pts.map(x => x[1])], lo = Math.floor((Math.min(...vals) - .4) * 2) / 2, hi = Math.ceil((Math.max(...vals) + .4) * 2) / 2;
    const X = d => L + days(a, d) / days(a, b) * (W - L - R), Y = v => T + (hi - v) / (hi - lo) * (H - T - B), tgt = d => b0 - (b0 - b1) * Math.min(1, Math.max(0, days(START, d) / days(START, END)));
    let s = ""; for (let v = lo; v <= hi + .01; v += .5) s += `<line x1="${L}" x2="${W - R}" y1="${Y(v)}" y2="${Y(v)}" stroke="#f0e3d2"/><text x="${L - 8}" y="${Y(v) + 4}" font-size="12" text-anchor="end" fill="#9a8a7e">${v.toFixed(1)}</text>`;
    PHASES.slice(1, 6).forEach(ph => { const x1 = X(ph.f), x2 = X(addD(ph.t, 1)); s += `<rect x="${x1}" y="${H - B + 4}" width="${x2 - x1 - 2}" height="8" rx="4" fill="${ph.color}" data-tip="${ph.name}"/>`; });
    const band = []; for (let d = START; d <= TET; d = addD(d, 7)) band.push(d); band.push(TET);
    s += `<path d="M${band.map(d => `${X(d).toFixed(1)} ${Y(tgt(d) + .3).toFixed(1)}`).join(" L")} L${band.slice().reverse().map(d => `${X(d).toFixed(1)} ${Y(tgt(d) - .3).toFixed(1)}`).join(" L")} Z" fill="#fde8e3" opacity=".8"/>`;
    s += `<path d="M${band.map(d => `${X(d).toFixed(1)} ${Y(tgt(d)).toFixed(1)}`).join(" L")}" fill="none" stroke="#c8302c" stroke-width="2" stroke-dasharray="6 5"/><text x="${X(TET) + 8}" y="${Y(b1) + 5}" font-size="14" font-weight="800" fill="#c8302c">${fmt(b1, 1)} kg 🏮</text>`;
    MILESTONES.slice(0, 3).forEach(([d, t, e]) => { const x = X(d); s += `<line x1="${x}" x2="${x}" y1="${T - 6}" y2="${H - B}" stroke="#e8a317" stroke-dasharray="3 4"/><text x="${x}" y="${T - 10}" font-size="12" font-weight="700" text-anchor="middle" fill="#b57d08">${e} ${t}</text>`; });
    if (pts.length) { s += `<path d="M${pts.map(([d, v]) => `${X(d).toFixed(1)} ${Y(v).toFixed(1)}`).join(" L")}" fill="none" stroke="#2a78d6" stroke-width="3.5" stroke-linecap="round"/>` + pts.map(([d, v]) => `<circle cx="${X(d)}" cy="${Y(v)}" r="6" fill="transparent" data-tip="${dm(d)} · TB ${fmt(v, 2)} · target ${fmt(tgt(d), 2)}"/>`).join("");
      const [ld, lv] = pts[pts.length - 1]; s += `<circle cx="${X(ld)}" cy="${Y(lv)}" r="6" fill="#2a78d6"/><text x="${X(ld) + 10}" y="${Y(lv) - 8}" font-size="14" font-weight="800" fill="#2a78d6">${fmt(lv, 1)} kg</text>`; }
    else s += `<text x="620" y="150" text-anchor="middle" font-size="16" fill="#9a8a7e">Ghi cân ở tab Hôm nay để thấy đường của bạn.</text>`;
    svg.innerHTML = s;
  }
})();
