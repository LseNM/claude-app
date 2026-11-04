"use strict";
/* Tết-style celebrations: confetti + falling mai blossoms, fireworks, cheer card, new-day welcome, big phase win.
   Adapted from Second Brain App web/fx.js. No libraries. */
const FX = (() => {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const COLORS = ["#c8302c", "#e8a317", "#f4c430", "#ff7a59", "#ffd166", "#e0533a", "#ffffff", "#1f9a63"];
  const rnd = (a, b) => a + Math.random() * (b - a), pick = a => a[Math.floor(Math.random() * a.length)];
  let cv, ctx, parts = [], raf = null;
  const last = { x: innerWidth / 2, y: innerHeight / 2 };
  addEventListener("pointerdown", e => { last.x = e.clientX; last.y = e.clientY; }, true);

  function ensure() {
    if (cv) return;
    cv = document.createElement("canvas"); cv.className = "fx-canvas"; document.body.appendChild(cv);
    ctx = cv.getContext("2d");
    const size = () => { const r = devicePixelRatio || 1; cv.width = innerWidth * r; cv.height = innerHeight * r; ctx.setTransform(r, 0, 0, r, 0, 0); };
    addEventListener("resize", size); size();
  }
  function mai(s) {            /* 5-petal mai blossom */
    ctx.fillStyle = "#f6c12b";
    for (let i = 0; i < 5; i++) { ctx.save(); ctx.rotate(i * Math.PI * 2 / 5); ctx.beginPath(); ctx.ellipse(0, -s * .42, s * .3, s * .42, 0, 0, 7); ctx.fill(); ctx.restore(); }
    ctx.fillStyle = "#c8302c"; ctx.beginPath(); ctx.arc(0, 0, s * .16, 0, 7); ctx.fill();
  }
  function loop() {
    if (raf) return;
    const step = () => {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      parts = parts.filter(p => p.life < p.max && p.y < innerHeight + 40);
      for (const p of parts) {
        p.vy += p.g; p.vx *= p.drag; p.vy *= p.drag; p.x += p.vx + (p.sway ? Math.sin(p.life / 18 + p.ph) * .6 : 0); p.y += p.vy; p.rot += p.vr; p.life++;
        ctx.save(); ctx.globalAlpha = Math.max(0, 1 - (p.life / p.max) ** 2); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.color;
        if (p.shape === "rect") ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        else if (p.shape === "spark") { ctx.beginPath(); ctx.arc(0, 0, p.size / 3, 0, 7); ctx.fill(); }
        else if (p.shape === "mai") mai(p.size);
        else { ctx.beginPath(); ctx.arc(0, 0, p.size / 2, 0, 7); ctx.fill(); }
        ctx.restore();
      }
      if (parts.length) raf = requestAnimationFrame(step); else { raf = null; ctx.clearRect(0, 0, innerWidth, innerHeight); }
    };
    raf = requestAnimationFrame(step);
  }
  function burst(x = last.x, y = last.y, n = 80, power = 11) {
    if (reduced) return; ensure();
    for (let i = 0; i < n; i++) {
      const a = rnd(-Math.PI * .92, -Math.PI * .08), v = power * rnd(.35, 1), m = Math.random() < .25;
      parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: .32, drag: .985, life: 0, max: rnd(60, 110), size: m ? rnd(12, 18) : rnd(6, 11),
        rot: rnd(0, 6), vr: rnd(-.3, .3), color: pick(COLORS), shape: m ? "mai" : Math.random() < .6 ? "rect" : "circle" });
    }
    loop();
  }
  function fireworks(shells = 5) {
    if (reduced) return; ensure();
    for (let k = 0; k < shells; k++) setTimeout(() => {
      const x = rnd(innerWidth * .15, innerWidth * .85), y = rnd(innerHeight * .12, innerHeight * .45), c = pick(["#c8302c", "#e8a317", "#f4c430", "#ff7a59"]), n = 70;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2, v = rnd(3.5, 6.5);
        parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: .07, drag: .975, life: 0, max: rnd(55, 85), size: rnd(4, 7), rot: 0, vr: 0, color: Math.random() < .8 ? c : "#fff", shape: "spark" });
      }
      loop();
    }, k * 320);
  }
  function blossoms(n = 90) {  /* mai petals drifting down */
    if (reduced) return; ensure();
    for (let i = 0; i < n; i++) parts.push({ x: rnd(0, innerWidth), y: rnd(-innerHeight * .7, -10), vx: rnd(-.6, .6), vy: rnd(1.2, 2.8), g: .01, drag: .998, sway: 1, ph: rnd(0, 6),
      life: 0, max: 520, size: rnd(12, 20), rot: rnd(0, 6), vr: rnd(-.04, .04), color: "#f6c12b", shape: Math.random() < .75 ? "mai" : "rect" });
    loop();
  }

  const CHEERS = [["💪", "Đỉnh quá!"], ["🌸", "Thêm 1 bước tới Tết!"], ["🔥", "Giữ lửa nhé!"], ["✨", "Body đang lên form!"], ["✅", "Xong thêm một việc!"],
    ["🧧", "Lì xì cho chính mình!"], ["🙌", "Grace của Tết sẽ cảm ơn bạn!"], ["🏮", "Đều đặn là thắng!"], ["⚡", "Giữ đà này!"]];
  function cheer(emoji, title, sub) {
    document.querySelectorAll(".fx-cheer").forEach(x => x.remove());
    const el = document.createElement("div"); el.className = "fx-cheer";
    el.innerHTML = `<div class="e">${emoji}</div><b>${title}</b>${sub ? `<span>${sub}</span>` : ""}`;
    document.body.appendChild(el);
    setTimeout(() => el.classList.add("out"), reduced ? 1400 : 1700);
    setTimeout(() => el.remove(), 2300);
  }
  function celebrate({ big = false, xp = 10, title, sub, emoji } = {}) {
    if (big) { fireworks(6); burst(innerWidth / 2, innerHeight * .75, 120, 14); cheer(emoji || "🏆", title || "Xuất sắc!", sub || `+${xp} XP`); }
    else { const [e, t] = pick(CHEERS); burst(); cheer(emoji || e, title || t, sub || (xp ? `+${xp} XP` : "")); }
  }
  function overlay(html, cls = "") {
    const el = document.createElement("div"); el.className = "fx-full " + cls; el.innerHTML = html;
    document.body.appendChild(el); requestAnimationFrame(() => el.classList.add("in"));
    const close = () => { el.classList.add("out"); setTimeout(() => el.remove(), 550); };
    return { el, close };
  }

  /* new-day welcome */
  const QUOTES = ["Không cần hoàn hảo, chỉ cần không bỏ 2 ngày liền.", "Mỗi buổi tập là một phong bao lì xì gửi Grace của Tết.", "Kỷ luật là chọn điều mình muốn nhất thay vì điều mình muốn ngay.",
    "Tạ nhẹ mà đều thắng tạ nặng mà bỏ.", "Never miss twice.", "Cơ lên chậm, nhưng lên thật.", "Ăn đủ protein hôm nay là đầu tư cho áo dài ngày Tết."];
  function welcome({ name = "Grace", days = 0, streak = 0, warn = false, today = "", first = "", when = "", date = new Date(), hour = new Date().getHours() } = {}, onGo) {
    const h = hour, night = h < 5 || h >= 19;
    const hello = h < 5 ? "Dậy sớm thế" : h < 12 ? "Chào buổi sáng" : h < 18 ? "Chào buổi chiều" : "Chào buổi tối";
    const o = overlay(`<div class="fx-card">
        <div class="kick">${date.toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long" })}</div>
        <h1>${hello}, ${name}! ${night ? "🌙" : "☀️"}</h1>
        <div class="big"><span class="lantern">🏮</span> ${days}<small>ngày nữa là Tết · body ngon đón Tết 2027</small></div>
        <blockquote>“${pick(QUOTES)}”</blockquote>
        <div class="row"><span class="chip red">🔥 ${streak} ngày liên tiếp</span>${today ? `<span class="chip gold">${today}</span>` : ""}${warn ? `<span class="chip">⚠️ Hôm qua lỡ · đừng lỡ 2 lần</span>` : ""}</div>
        ${first ? `<div class="first"><small>VIỆC ĐẦU TIÊN${when ? " · " + when : ""}</small><b>${first}</b></div>` : ""}
        <button class="btn go">Bắt đầu thôi →</button><button class="skip">Để sau</button></div>`, night ? "night" : "");
    setTimeout(() => blossoms(70), 300);
    o.el.querySelector(".go").onclick = () => { burst(innerWidth / 2, innerHeight * .7, 120, 15); fireworks(2); o.close(); onGo && onGo(); };
    o.el.querySelector(".skip").onclick = o.close;
    o.el.querySelector(".go").focus();
  }
  /* big win: a phase finished or a target reached */
  function phaseWin({ phase = "", title = "Qua giai đoạn!", lines = [], reward = "" } = {}) {
    document.querySelectorAll(".fx-cheer").forEach(x => x.remove());
    const o = overlay(`<div class="fx-card">
        <div class="kick">Hoàn thành ${phase}</div>
        <svg class="badge" viewBox="0 0 120 120" aria-hidden="true">
          <circle cx="60" cy="60" r="54" fill="#fff1d2" stroke="#e8a317" stroke-width="5"/>
          ${[0, 1, 2, 3, 4].map(i => `<ellipse cx="60" cy="38" rx="12" ry="19" fill="#f6c12b" transform="rotate(${i * 72} 60 60)"/>`).join("")}
          <circle cx="60" cy="60" r="10" fill="#c8302c"/>
        </svg>
        <h1>${title}</h1>
        <div style="text-align:left;margin:12px 0">${lines.map(l => `<div style="padding:6px 0;border-bottom:1px dashed #f0e3d2;font-weight:600">${l}</div>`).join("")}</div>
        ${reward ? `<div class="first"><small>🎁 PHẦN THƯỞNG BẠN TỰ ĐẶT · ĐÃ MỞ KHÓA</small><b>${reward}</b></div>` : ""}
        <button class="btn go">Nhận thưởng 🧧</button></div>`);
    blossoms(120); fireworks(7); setTimeout(() => burst(innerWidth / 2, innerHeight * .8, 140, 15), 400);
    o.el.querySelector(".go").onclick = () => { burst(innerWidth / 2, innerHeight * .6, 100, 13); o.close(); };
  }
  return { burst, fireworks, blossoms, cheer, celebrate, welcome, phaseWin, overlay };
})();
