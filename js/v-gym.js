"use strict";
/* Gym logger: session tabs, readiness, warm-up, exercise cards with set rows (kg · reps · RIR · ✓), swaps, rest timer, finish + export. */
(() => {
  const PAT = Object.fromEntries(PATTERNS.map(p => [p.id, p]));
  const SESS = ["Gym A", "Gym B", "Gym C"];
  const todayPlan = WEEK_PLAN[TODAY.getDay()];
  const todaySession = todayPlan.k === "gym" ? todayPlan.t : null;
  const nextSession = () => { for (let k = 1; k < 8; k++) { const p = WEEK_PLAN[addD(TODAY, k).getDay()]; if (p.k === "gym") return p.t; } return "Gym A"; };
  let cur = null, viewing = null, timer = null;

  const findEntry = id => { for (const m of ["free", "machine"]) for (const s of SESS) { const e = PROGRAM[m][s].find(x => x.id === id); if (e) return e; } return null; };
  const info = id => EX[id] ? { name: EX[id].name, vi: EX[id].vi, cues: EX[id].cues, bad: EX[id].bad, pat: PAT[EX[id].tag] } : SIMPLE_EX[id] ? { ...SIMPLE_EX[id], pat: null } : { name: id, vi: "", cues: [], bad: "" };
  function makeEx(en) {
    const last = lastSets(en.id), sg = suggestion(en, last);
    const reps = i => last && last.sets[i] ? Math.min(en.hi, last.sets[i].reps + (sg.up ? 0 : 1)) : en.hi;
    return { id: en.id, sets: Array.from({ length: en.sets }, (_, i) => ({ kg: sg.up ? sg.kg : (last && last.sets[i] ? last.sets[i].kg : sg.kg), reps: sg.up ? en.lo : reps(i), rir: 2, done: false })) };
  }
  function build(session, mode) {
    const list = PROGRAM[mode][session];
    return { session, mode, feel: "ok", ex: Object.fromEntries(list.map((en, i) => [i, makeEx(en)])), finished: false, started: null };
  }
  const anyDone = r => r && Object.values(r.ex).some(e => e.sets.some(s => s.done));
  function open(session, mode) {
    const saved = Store.gym(TISO);
    if (saved && saved.session === session && (!mode || saved.mode === mode)) cur = saved;
    else cur = build(session, mode || (freeMode(TODAY) ? "free" : "machine"));
    viewing = session;
  }
  const persist = () => {
    const saved = Store.gym(TISO);
    if (saved && saved !== cur && saved.session !== cur.session && anyDone(saved) && !confirm(`Hôm nay đã log ${saved.session}. Thay bằng ${cur.session}?`)) return false;
    if (!cur.started) cur.started = new Date().toISOString();
    Store.setGym(TISO, cur); refreshHeader(); return true;
  };
  const entryOf = (i) => { const base = PROGRAM[cur.mode][cur.session][i], e = cur.ex[i]; return e.id === base.id ? base : { ...(findEntry(e.id) || base), id: e.id, name: exName(e.id) }; };

  VIEWS.gym = el => {
    const saved = Store.gym(TISO);
    if (!cur || cur.session !== viewing) open(saved ? saved.session : (todaySession || nextSession()));
    draw(el);
  };
  function draw(el) {
    const list = PROGRAM[cur.mode][cur.session], tot = Object.values(cur.ex).reduce((a, e) => a + e.sets.length, 0), done = Object.values(cur.ex).reduce((a, e) => a + e.sets.filter(s => s.done).length, 0);
    const feelTip = { low: "Mệt / ngủ kém: giữ tạ lần trước, bỏ set cuối, để RIR 3.", ok: "Bình thường: tập theo kế hoạch, RIR 1–3.", high: "Khỏe: bài nào lần trước đủ rep thì lên tạ." }[cur.feel];
    el.innerHTML = `
    <div class="stabs">${SESS.map(s => `<button data-s="${s}" class="${s === cur.session ? "on" : ""}">${s.replace("Gym ", "Buổi ")}${s === todaySession ? "<small>HÔM NAY</small>" : `<small>${WD[[1, 3, 5][SESS.indexOf(s)]]}</small>`}</button>`).join("")}</div>
    <div class="modebar"><span class="chip ${cur.mode === "free" ? "green" : ""}">${cur.mode === "free" ? "🏠 Bản không máy" : "🏋️ Bản có máy"}</span>
      <span class="muted small">${freeMode(TODAY) ? "Tới 30/11 ưu tiên không máy" : "Từ 01/12 dùng bản có máy"}</span>
      <button class="lnk" id="modeT">${cur.mode === "free" ? "Dùng bản có máy" : "Dùng bản không máy"}</button></div>
    <section class="card gcard"><div class="lbl">HÔM NAY THẤY THẾ NÀO?</div>
      <div class="seg3">${[["low", "😴 Mệt"], ["ok", "🙂 Bình thường"], ["high", "💪 Khỏe"]].map(([k, t]) => `<button data-feel="${k}" class="${cur.feel === k ? "on" : ""}">${t}</button>`).join("")}</div>
      <p class="small" style="margin:8px 0 0">${feelTip}</p></section>
    <section class="card gcard"><div class="lbl">KHỞI ĐỘNG</div><p style="margin:4px 0 0">${WARMUP}</p></section>
    <div class="lbl" style="margin:18px 4px 8px">BÀI TẬP · ${list.length} bài</div>
    ${list.map((_, i) => exCard(i)).join("")}
    <div class="gfoot"><div class="gprog"><b>SET ${done}/${tot}</b><div class="bar"><i style="width:${tot ? done / tot * 100 : 0}%"></i></div><b class="pc">${tot ? Math.round(done / tot * 100) : 0}%</b></div>
      <button class="btn" id="finish">${cur.finished ? "📋 Xem / copy log" : "🏁 Xong buổi"}</button></div>`;
    $$("svg[data-ex]", el).forEach(s => FIG.mount(s, s.dataset.ex, s.dataset.c));
  }
  function exCard(i) {
    const en = entryOf(i), e = cur.ex[i], inf = info(e.id), last = lastSets(e.id), sg = suggestion(en, last), col = inf.pat ? inf.pat.hex : "#c8302c";
    const sw = SWAP[e.id], swLbl = sw ? (MACHINE.has(e.id) ? `Máy bận? Đổi sang <b>${exName(sw)}</b>` : `Có máy trống? Đổi sang <b>${exName(sw)}</b>`) : "";
    const allDone = e.sets.every(s => s.done), unit = en.unit === "m" ? "M" : "REPS";
    return `<section class="card excard ${allDone ? "alldone" : ""}" data-i="${i}">
      <div class="exhd"><div class="thumb">${EX[e.id] ? `<svg viewBox="0 0 220 200" data-ex="${e.id}" data-c="${col}" aria-hidden="true"></svg>` : `<span>${inf.e || "💪"}</span>`}</div>
        <div class="ttl"><b>${inf.name}</b><small><span style="color:${col};font-weight:800">${inf.pat ? inf.pat.name : "Bài phụ"}</span> · ${inf.vi}</small></div>
        <button class="ibtn" data-a="info" aria-label="Hướng dẫn ${inf.name}">i</button></div>
      <div class="tgt"><b>${sg.kg} kg × ${en.hi}${en.unit === "m" ? " m" : ""}</b>${en.per ? ` <span class="muted">${en.per}</span>` : ""}<div class="muted small">${en.sets} set · nghỉ ${en.rest}s · khoảng ${en.lo}–${en.hi}${en.unit === "m" ? " m" : " rep"}</div></div>
      <div class="sug ${sg.up ? "up" : ""}">${sg.up ? "⬆ " : sg.first ? "🌱 " : "↻ "}${sg.why}${last ? `<br><span class="muted">Lần trước ${dm(last.date)}: ${last.sets.map(s => `${s.kg}×${s.reps}`).join(" · ")}</span>` : ""}</div>
      ${sw ? `<button class="swap" data-a="swap">⇄ ${swLbl}<span>›</span></button>` : ""}
      <div class="quick">${[-2.5, -1, 1, 2.5, 5].map(v => `<button data-a="q" data-v="${v}">${v > 0 ? "+" : "−"}${Math.abs(v)}</button>`).join("")}</div>
      ${e.sets.map((s, k) => `<div class="setrow ${s.done ? "done" : ""}" data-k="${k}">
        <div class="stp"><button data-a="kg-" aria-label="Giảm kg">−</button><label><input inputmode="decimal" data-f="kg" value="${s.kg}" aria-label="kg set ${k + 1}"><small>KG</small></label><button data-a="kg+" aria-label="Tăng kg">+</button></div>
        <div class="stp"><button data-a="r-" aria-label="Giảm rep">−</button><label><input inputmode="numeric" data-f="reps" value="${s.reps}" aria-label="rep set ${k + 1}"><small>${unit}</small></label><button data-a="r+" aria-label="Tăng rep">+</button></div>
        <button class="rir" data-a="rir" data-tip="RIR = còn dư mấy rep (0 = hết sức)">RIR<b>${s.rir}</b></button>
        <button class="tk" data-a="done" aria-label="Xong set ${k + 1}">${s.done ? "✓" : k + 1}</button></div>`).join("")}
      <div class="setops"><button data-a="add">+ thêm set</button>${e.sets.length > 1 ? `<button data-a="del">− bớt set</button>` : ""}</div>
    </section>`;
  }

  /* ---------- interactions ---------- */
  document.addEventListener("click", e => {
    if (currentView() !== "gym" || !cur) return;
    const el = $("#view"), t = e.target;
    const st = t.closest(".stabs button"); if (st) { open(st.dataset.s); draw(el); return; }
    if (t.closest("#modeT")) { const m = cur.mode === "free" ? "machine" : "free"; if (anyDone(cur) && !confirm("Đổi bản tập sẽ làm lại danh sách bài của buổi này. Tiếp tục?")) return; cur = build(cur.session, m); draw(el); return; }
    const fb = t.closest("[data-feel]"); if (fb) { cur.feel = fb.dataset.feel; persist(); draw(el); return; }
    if (t.closest("#finish")) { finish(); return; }
    if (t.closest("#restSkip")) { stopRest(); return; }
    if (t.closest("#rest15")) { restEnd += 15000; return; }
    const card = t.closest(".excard"); if (!card) return;
    const i = +card.dataset.i, ex = cur.ex[i], en = entryOf(i), b = t.closest("[data-a]"); if (!b) return;
    const a = b.dataset.a, row = t.closest(".setrow"), k = row ? +row.dataset.k : -1, s = k >= 0 ? ex.sets[k] : null;
    const step = Math.abs(en.step) || (MACHINE.has(ex.id) ? 2.5 : 1);
    if (a === "info") { showInfo(ex.id, en); return; }
    if (a === "swap") { if (ex.sets.some(x => x.done) && !confirm("Bài này đã có set xong. Vẫn đổi?")) return; const ne = findEntry(SWAP[ex.id]) || { ...en, id: SWAP[ex.id] }; cur.ex[i] = makeEx({ ...ne, sets: en.sets }); persist(); draw(el); FX.cheer("⇄", "Đã đổi bài", exName(SWAP[ex.id])); return; }
    if (a === "q") { const v = +b.dataset.v; ex.sets.forEach(x => { if (!x.done) x.kg = Math.max(0, +(x.kg + v).toFixed(2)); }); }
    else if (a === "kg-" || a === "kg+") { s.kg = Math.max(0, +(s.kg + (a === "kg+" ? step : -step)).toFixed(2)); }
    else if (a === "r-" || a === "r+") { s.reps = Math.max(0, s.reps + (a === "r+" ? 1 : -1)); }
    else if (a === "rir") { s.rir = (s.rir + 1) % 5; }
    else if (a === "add") { const l = ex.sets[ex.sets.length - 1]; ex.sets.push({ kg: l.kg, reps: l.reps, rir: 2, done: false }); }
    else if (a === "del") { ex.sets.pop(); }
    else if (a === "done") {
      s.done = !s.done;
      if (!persist()) { s.done = !s.done; return; }
      if (s.done) { FX.burst(e.clientX, e.clientY, 40, 8); afterSet(i, k, en); }
      draw(el); return;
    }
    if (!persist()) return;
    draw(el);
  });
  document.addEventListener("change", e => {
    if (currentView() !== "gym" || !cur) return;
    const inp = e.target.closest(".setrow input"); if (!inp) return;
    const i = +inp.closest(".excard").dataset.i, k = +inp.closest(".setrow").dataset.k, v = parseFloat(String(inp.value).replace(",", "."));
    if (!isNaN(v)) { cur.ex[i].sets[k][inp.dataset.f] = Math.max(0, v); persist(); }
  });
  function afterSet(i, k, en) {
    const ex = cur.ex[i], s = ex.sets[k], prev = bestSet(ex.id, addD(TODAY, -1));
    const todayMax = Math.max(0, ...ex.sets.filter((x, j) => x.done && j !== k).map(x => x.kg));   // PR only once per new max
    if (prev && s.kg > prev.kg && s.kg > todayMax && s.kg > 0) setTimeout(() => FX.celebrate({ big: true, emoji: "🏆", title: `Kỷ lục mới: ${shortName(ex.id)} ${s.kg} kg!`, sub: `cũ ${prev.kg} kg · +30 XP` }), 250);
    else if (ex.sets.every(x => x.done)) {
      const ready = ex.sets.every(x => x.reps >= en.hi && x.rir >= 1);
      setTimeout(() => ready ? FX.celebrate({ big: true, emoji: "⬆️", title: "Buổi sau lên tạ!", sub: `${shortName(ex.id)} đủ ${en.hi} rep mọi set` }) : FX.celebrate({ emoji: "✅", title: `Xong ${shortName(ex.id)}`, sub: "" }), 250);
    }
    if (ex.sets.some(x => !x.done) || Object.values(cur.ex).some(x => x.sets.some(y => !y.done))) startRest(en.rest);
  }

  /* ---------- rest timer ---------- */
  let restEnd = 0;
  function startRest(sec) {
    stopRest(); restEnd = Date.now() + sec * 1000;
    let bar = $("#rest"); if (!bar) { bar = document.createElement("div"); bar.id = "rest"; bar.className = "restbar"; document.body.appendChild(bar); }
    bar.hidden = false;
    const tick = () => {
      const r = Math.max(0, Math.round((restEnd - Date.now()) / 1000)), b = $("#rest"); if (!b || currentView() !== "gym") return stopRest();
      b.innerHTML = `<span>⏱ Nghỉ <b>${Math.floor(r / 60)}:${pad(r % 60)}</b></span><button id="rest15">+15s</button><button id="restSkip">Bỏ qua</button>`;
      if (r <= 0) { stopRest(); beep(); FX.cheer("🔔", "Vào set tiếp!", ""); }
    };
    tick(); timer = setInterval(tick, 500);
  }
  function stopRest() { clearInterval(timer); timer = null; const b = $("#rest"); if (b) b.hidden = true; }
  function beep() {
    try { navigator.vibrate && navigator.vibrate([200, 100, 200]); const A = new (window.AudioContext || window.webkitAudioContext)(), o = A.createOscillator(), g = A.createGain();
      o.frequency.value = 880; o.connect(g); g.connect(A.destination); g.gain.setValueAtTime(.2, A.currentTime); o.start(); o.stop(A.currentTime + .35); } catch (e) { }
  }

  /* ---------- info sheet ---------- */
  function showInfo(id, en) {
    const inf = info(id), p = inf.pat, last = lastSets(id), sg = suggestion(en, last), vid = p && PATTERN_VIDEO[p.id];
    sheet(inf.name, `<div class="bigfig">${EX[id] ? `<svg viewBox="0 0 220 200" id="bf" role="img" aria-label="Minh họa ${inf.name}"></svg>` : `<span style="font-size:80px">${inf.e || "💪"}</span>`}</div>
      <div class="muted" style="font-weight:700">${p ? `<span style="color:${p.hex}">${p.name}</span> · ` : ""}${inf.vi}</div>
      <div class="startbox">Bắt đầu <b>${sg.kg} kg × ${en.hi}${en.unit === "m" ? " m" : " rep"}</b> · ${en.sets} set · nghỉ ${en.rest}s</div>
      ${vid ? `<a class="btn ghost vidbtn" href="https://www.youtube.com/watch?v=${VIDEO[vid[0]]}&t=${vid[1]}s" target="_blank" rel="noopener">▶ Xem đoạn video (${vid[0]} ${Math.floor(vid[1] / 60)}:${pad(vid[1] % 60)})</a>` : ""}
      <div class="lbl" style="margin-top:14px">CÁCH LÀM</div><ol>${inf.cues.map(c => `<li>${c}</li>`).join("")}</ol>
      <div class="lbl" style="color:var(--red2)">TRÁNH</div><div class="avoid">• ${inf.bad}</div>
      ${p ? `<div class="quote">🎬 ${p.def} <span class="muted">[${p.src}]</span><br><b>Cơ chính:</b> ${p.muscles}</div>` : ""}
      ${SWAP[id] ? `<p class="small muted">Bài đổi qua lại: ${exName(SWAP[id])} (${MACHINE.has(id) ? "không cần máy" : "dùng máy"}).${["pullover", "dbchop", "rfly"].includes(id) ? " Bài thay thế do Claude chọn, không có trong 2 video." : ""}</p>` : ""}`,
      bg => { const s = $("#bf", bg); if (s) FIG.mount(s, id, p ? p.hex : "#c8302c"); });
  }

  /* ---------- finish ---------- */
  function finish() {
    if (!anyDone(cur)) { FX.cheer("🤔", "Chưa có set nào", "tick ✓ ở set đã tập"); return; }
    const first = !cur.finished; cur.finished = true; persist();
    const d = Store.day(TISO); d.ticks.move = 1; Store.save(); refreshHeader();
    const sets = Object.values(cur.ex).reduce((a, e) => a + e.sets.filter(s => s.done).length, 0);
    const vol = Object.values(cur.ex).reduce((a, e) => a + e.sets.filter(s => s.done).reduce((b, s) => b + s.kg * s.reps, 0), 0);
    if (first) FX.celebrate({ big: true, emoji: "🏋️", title: `Xong ${cur.session}!`, sub: `${sets} set · ${fmt(vol)} kg tổng · +40 XP` });
    const rows = workoutRows(TODAY);
    setTimeout(() => exportSheet(`🏁 ${cur.session} · ${dm(TODAY)}`, [`🏋️ ${cur.session} (${cur.mode === "free" ? "không máy" : "có máy"}) · ${TISO} · cảm giác: ${{ low: "mệt", ok: "bình thường", high: "khỏe" }[cur.feel]}`, "", "## Workout", "| Exercise | Set | kg | Reps | RIR |", "|---|---|---|---|---|", ...rows].join("\n")), first ? 1400 : 0);
    draw($("#view"));
  }
})();
