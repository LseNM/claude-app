"use strict";
/* Gym logger (v2): compact session header, one expanded exercise at a time (sets kg · reps · RIR · ✓, video, guide), swaps, rest timer, finish + export.
   Guide sheet order: athlete figure + target muscles → video → cách làm → đúng khi → sai khi → tự so (record a set). */
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
  let openI = null, openFor = null;   // only the exercise in progress is expanded
  const firstOpen = () => { const ks = Object.keys(cur.ex).map(Number); const k = ks.find(i => cur.ex[i].sets.some(s => !s.done)); return k == null ? null : k; };
  function draw(el) {
    const list = PROGRAM[cur.mode][cur.session], tot = Object.values(cur.ex).reduce((a, e) => a + e.sets.length, 0), done = Object.values(cur.ex).reduce((a, e) => a + e.sets.filter(s => s.done).length, 0);
    if (openFor !== cur) { openFor = cur; openI = firstOpen(); }
    const C = 2 * Math.PI * 20;
    el.innerHTML = `<div class="screen">
    <section class="card gsess"><div class="gs1"><div class="t"><b>${cur.session} · ${cur.mode === "free" ? "không máy" : "có máy"}</b><small>${list.length} bài · khởi động 5–8 phút (đạp xe hoặc đi bộ nhanh)</small></div>
      <svg class="ring" viewBox="0 0 52 52" role="img" aria-label="${done}/${tot} set"><circle cx="26" cy="26" r="20" fill="none" stroke="#fdf0e0" stroke-width="7"/>${done ? `<circle cx="26" cy="26" r="20" fill="none" stroke="#1f9a63" stroke-width="7" stroke-linecap="round" stroke-dasharray="${C * done / tot} ${C}" transform="rotate(-90 26 26)"/>` : ""}<text x="26" y="30" text-anchor="middle" font-size="12" font-weight="800" fill="#2b1d14">${done}/${tot}</text></svg></div>
      <div class="gs2"><div class="seg">${SESS.map(s => `<button data-s="${s}" class="${s === cur.session ? "on" : ""}">${s.replace("Gym ", "")}${s === todaySession ? " · nay" : ""}</button>`).join("")}</div>
        <div class="seg">${[["low", "Mệt"], ["ok", "Ổn"], ["high", "Khỏe"]].map(([k, t]) => `<button data-feel="${k}" class="${cur.feel === k ? "on" : ""}" aria-label="Cảm giác: ${t}">${t}</button>`).join("")}</div>
        <button class="lnk" id="modeT">${cur.mode === "free" ? "Bản có máy" : "Bản không máy"}</button></div></section>
    <div class="exl">${list.map((_, i) => exCard(i)).join("")}</div>
    <button class="btn wide ${done ? "" : "ghost"}" id="finish">${cur.finished ? "Xem / copy log" : "Xong buổi"}</button></div>`;
    $$("svg[data-ex]", el).forEach(s => FIG.mount(s, s.dataset.ex, s.dataset.c));
  }
  function exCard(i) {
    const en = entryOf(i), e = cur.ex[i], inf = info(e.id), last = lastSets(e.id), sg = suggestion(en, last), col = inf.pat ? inf.pat.hex : "#c8302c";
    const sw = SWAP[e.id], n = e.sets.filter(s => s.done).length, allDone = n === e.sets.length, unit = en.unit === "m" ? "MÉT" : "REP", open = i === openI, v = formVideo(e.id);
    const lastTxt = last ? `Lần trước ${last.sets.map(s => s.kg ? `${s.kg}×${s.reps}` : s.reps).join(" · ")}` : `${en.sets} set · ${en.lo === en.hi ? en.lo : en.lo + "–" + en.hi} ${en.unit === "m" ? "m" : "rep"}`;
    return `<section class="exr excard ${open ? "open" : ""} ${allDone ? "done" : ""}" data-i="${i}">
      <div class="exh"><button class="hd" data-a="open" aria-expanded="${open}"><span class="nm"><b>${inf.name}</b><small class="num">${lastTxt}${en.per ? " · " + en.per : ""}</small></span><span class="st num">${allDone ? "✓" : n + "/" + e.sets.length}</span></button>
        <button class="info" data-a="info" aria-label="Cách làm, đúng hay sai: ${inf.name}">?</button></div>
      ${open ? `<div class="body">
        <table class="sets"><tr><th>SET</th><th>KG</th><th>${unit}</th><th>RIR</th><th></th></tr>${e.sets.map((s, k) => `<tr class="setrow ${s.done ? "ok" : ""}" data-k="${k}"><td>${k + 1}</td>
          <td><input class="num" inputmode="decimal" data-f="kg" value="${s.kg}" aria-label="kg set ${k + 1}"></td><td><input class="num" inputmode="numeric" data-f="reps" value="${s.reps}" aria-label="${unit.toLowerCase()} set ${k + 1}"></td>
          <td><button class="rirb num" data-a="rir" aria-label="RIR set ${k + 1}: ${s.rir}">${s.rir}</button></td><td><button class="tk" data-a="done" aria-label="Xong set ${k + 1}">✓</button></td></tr>`).join("")}</table>
        ${sg.up ? `<div class="up">↑ ${sg.why}</div>` : ""}
        <div class="exlinks"><a class="vlink" href="${v.url}" target="_blank" rel="noopener">▶ ${v.label}</a><button class="lnk2" data-a="info">Cách làm · đúng/sai</button></div>
        <div class="exops">${sw ? `<button class="lnk" data-a="swap">⇄ ${MACHINE.has(e.id) ? "Máy bận" : "Có máy trống"}: ${exName(sw)}</button>` : ""}<button class="lnk" data-a="add">+ set</button>${e.sets.length > 1 ? `<button class="lnk" data-a="del">− set</button>` : ""}</div>
      </div>` : ""}</section>`;
  }

  /* ---------- interactions ---------- */
  document.addEventListener("click", e => {
    if (currentView() !== "gym" || !cur) return;
    const el = $("#view"), t = e.target;
    const st = t.closest(".gs2 [data-s]"); if (st) { open(st.dataset.s); draw(el); return; }
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
    if (a === "open") { openI = openI === i ? null : i; draw(el); return; }
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
      if (s.done) { FX.burst(e.clientX, e.clientY, 40, 8); afterSet(i, k, en); if (ex.sets.every(x => x.done)) openI = firstOpen(); }
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
  /* guide: athlete figure + target muscles + sets → video → cách làm → đúng khi → sai khi → tự so (record a set) */
  function showInfo(id, en) {
    const inf = info(id), p = inf.pat, f = FORM[id] || { steps: inf.cues || [], ok: [], bad: inf.bad ? [inf.bad] : [], look: [] }, v = formVideo(id), hasFig = !!EX[id], col = p ? p.hex : "#c8302c";
    const figBox = n => hasFig ? `<svg viewBox="0 0 220 200" id="${n}" role="img" aria-label="Người tập ${inf.name}"></svg>` : `<span class="bigemo">${inf.e || "💪"}</span>`;
    sheet(inf.name, `<div class="gpanel"><div class="gfig2">${figBox("bf")}</div>
        <div class="gside"><div class="mmap">${muscleSVG(id)}</div><div class="small"><b>Cơ chính:</b> ${muscleText(id) || (p ? p.muscles : "")}</div>
          <span class="setb num">${en.sets} set · ${en.lo === en.hi ? en.lo : en.lo + "–" + en.hi} ${en.unit === "m" ? "m" : "rep"}${en.per ? " " + en.per : ""}</span><span class="small muted">nghỉ ${en.rest} giây</span></div></div>
      <a class="vlink wide" href="${v.url}" target="_blank" rel="noopener">▶ ${v.label}</a>
      <div class="lbl">Cách làm</div><ol class="steps">${f.steps.map(t => `<li>${t}</li>`).join("")}</ol>
      ${f.ok.length ? `<div class="lbl">Đúng khi</div><ul class="ok-list">${f.ok.map(t => `<li>${t}</li>`).join("")}</ul>` : ""}
      ${f.bad.length ? `<div class="lbl">Sai khi</div><ul class="bad-list">${f.bad.map(t => `<li>${t}</li>`).join("")}</ul>` : ""}
      <div class="lbl">Tự so: quay 1 set</div>
      <div class="cmp"><div>${figBox("bf2")}<span class="cap3">Hình mẫu</span></div><div id="vidBox"><button class="btn ghost" id="rec">🎥 Quay 1 set</button><span class="cap3">Video của bạn</span></div></div>
      ${f.look.length ? `<div class="lbl">Xem lại video: 3 điểm cần nhìn</div><ol class="look">${f.look.map((t, i) => `<li><label for="lk${i}">${t}<input type="checkbox" id="lk${i}"></label></li>`).join("")}</ol>` : ""}
      <p class="note">Đặt điện thoại ngang hông, quay từ bên cạnh. Video chỉ nằm trên máy này, không gửi đi đâu.</p>`,
      bg => { ["#bf", "#bf2"].forEach(s => { const el = $(s, bg); if (el) FIG.mount(el, id, col); });
        $("#rec", bg).onclick = () => { const i = document.createElement("input"); i.type = "file"; i.accept = "video/*"; i.setAttribute("capture", "environment");
          i.onchange = () => { const file = i.files[0]; if (!file) return; $("#vidBox", bg).innerHTML = `<video src="${URL.createObjectURL(file)}" controls playsinline muted loop></video><span class="cap3">Video của bạn</span>`; }; i.click(); }; });
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
