"use strict";
/* AI without a server or a bill (v2): photo → numbers in one tap.
   1) Gemini free key (project WITHOUT billing: over quota = error 429, never a charge)
   2) OpenRouter free key (only ":free" models that read images; 50 requests/day without buying credits, so nothing to charge)
   App tries 1 then 2. Last resort, hidden behind a small link: copy the prompt to Claude and paste the answer back.
   Keys live only in this browser (never in backups). */
const AI = (() => {
  const H = {};
  const KEYS = Object.keys(FOODS).filter(k => FOODS[k].u === "g" && !/^main/.test(k) || /^main/.test(k)).map(k => `${k}=${shortN(FOODS[k].n)}`).join(", ");
  const PROMPT = {
    raw: extra => `Bạn là chuyên gia dinh dưỡng. Ảnh là NGUYÊN LIỆU SỐNG mình sắp nấu (thịt, cá, hải sản, rau củ), có thể đặt trên cân hoặc còn bao bì.
Với từng nguyên liệu: gọi tên tiếng Việt, cho số gram. Nếu thấy số trên cân hoặc khối lượng in trên bao bì thì dùng đúng số đó ("source":"scale" hoặc "package"), không thì ước ("source":"estimate").
Nếu nguyên liệu khớp một mã trong danh sách sau thì điền "key": ${KEYS}.
Tính luôn kcal, p (protein), c (carb), f (fat), fib (xơ) cho đúng số gram ĐỒ SỐNG đó.${extra ? `\nGhi chú: ${extra}` : ""}
Chỉ trả về 1 khối JSON: {"desc":"mô tả ngắn","foods":[{"name":"Thịt bò nạc","key":"main5","g":212,"source":"scale","kcal":390,"p":40,"c":0,"f":26,"fib":0}]}`,
    dish: extra => `Bạn là chuyên gia dinh dưỡng. Ảnh là MÓN ĂN đã nấu (thường là món Việt).
Tách từng thành phần (cơm/bún, thịt cá trứng, rau, nước sốt, dầu mỡ). Ước gram đã nấu theo kích thước chén, đĩa, muỗng, đũa. Tính kcal, p, c, f, fib cho đúng số gram đó (bảng thành phần thực phẩm VN hoặc USDA), nhớ tính dầu.${extra ? `\nGhi chú: ${extra}` : ""}
Chỉ trả về 1 khối JSON: {"desc":"mô tả ngắn","confidence":"high|medium|low","foods":[{"name":"Cơm trắng","g":150,"kcal":195,"p":4,"c":42,"f":0.6,"fib":0.6}]}`,
    text: desc => `Bạn là chuyên gia dinh dưỡng. Mình vừa ăn: "${desc}". Tách từng thành phần; nếu mình nói gram/số lượng thì dùng đúng số đó, không thì ước theo khẩu phần phổ biến ở Việt Nam. Tính kcal, p, c, f, fib.
Chỉ trả về 1 khối JSON: {"desc":"mô tả ngắn","foods":[{"name":"Phở bò","g":500,"kcal":450,"p":25,"c":60,"f":10,"fib":2}]}`,
    inbody: () => `Ảnh là tờ kết quả InBody. Đọc đúng số in trên tờ (không ước), chỗ nào không có để null. Chỉ trả về 1 khối JSON:
{"date":"YYYY-MM-DD","w":0,"pbf":0,"smm":0,"fat":0,"vfl":0,"whr":0,"score":0}
w = Weight (kg), pbf = Percent Body Fat (%), smm = Skeletal Muscle Mass (kg), fat = Body Fat Mass (kg), vfl = Visceral Fat Level, whr = Waist-Hip Ratio, score = InBody Score.`
  };

  /* ---------- parse ---------- */
  function parse(text) {
    let t = String(text || "").trim();
    const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i); if (fence) t = fence[1];
    const a = t.indexOf("{"), b = t.lastIndexOf("}"), a2 = t.indexOf("[");
    if (a2 >= 0 && (a < 0 || a2 < a)) return { foods: JSON.parse(t.slice(a2, t.lastIndexOf("]") + 1)) };
    if (a < 0 || b < a) throw new Error("AI không trả về đúng dạng số liệu. Thử lại hoặc chụp rõ hơn.");
    return JSON.parse(t.slice(a, b + 1).replace(/,\s*([}\]])/g, "$1"));
  }
  const num = v => { if (v == null || v === "") return null; const n = parseFloat(String(v).replace(",", ".").replace(/[^\d.\-]/g, "")); return isNaN(n) ? null : n; };
  const pick = (o, ks) => { for (const k of ks) if (o[k] != null) return o[k]; return null; };
  const r1 = n => Math.round(n * 10) / 10;
  function foods(obj) {
    const L = Array.isArray(obj) ? obj : obj.foods || obj.items || [];
    return L.map(x => ({ n: String(pick(x, ["name", "n", "food"]) || "Món").trim(), key: x.key || null, source: x.source || "", g: num(pick(x, ["g", "grams", "gram", "serving_g"])),
      k: Math.round(num(pick(x, ["kcal", "calories", "k"])) || 0), p: r1(num(pick(x, ["p", "protein"])) || 0), c: r1(num(pick(x, ["c", "carb", "carbs"])) || 0),
      f: r1(num(pick(x, ["f", "fat"])) || 0), fb: r1(num(pick(x, ["fib", "fiber", "fb"])) || 0), note: x.note || "" })).filter(x => x.n);
  }

  /* ---------- providers ---------- */
  const GM = ["gemini-flash-latest", "gemini-2.5-flash", "gemini-flash-lite-latest"];
  async function gemini(prompt, img) {
    const key = Store.geminiKey(); if (!key) throw new Error("no-key");
    const parts = [{ text: prompt }]; if (img) parts.push({ inline_data: { mime_type: "image/jpeg", data: img.split(",")[1] } });
    let last = null, quota = false;
    for (const m of GM) {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`, { method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({ contents: [{ role: "user", parts }], generationConfig: { temperature: .2, responseMimeType: "application/json" } }) }).catch(e => ({ ok: false, status: 0, json: async () => ({ error: { message: "Không có mạng" } }) }));
      const j = await res.json().catch(() => ({}));
      if (res.ok) { const t = j.candidates && j.candidates[0] && j.candidates[0].content && (j.candidates[0].content.parts || []).map(p => p.text || "").join(""); if (t) return parse(t); last = new Error("Gemini không trả lời"); continue; }
      const msg = (j.error && j.error.message) || "Lỗi " + res.status;
      if (res.status === 429) { quota = true; continue; }
      if (/API key not valid|API_KEY_INVALID|PERMISSION_DENIED/i.test(msg)) throw new Error("Key Gemini không hợp lệ (☰ Cài đặt).");
      last = new Error(msg); if (res.status === 0) break;
    }
    throw quota ? new Error("Gemini hết lượt miễn phí") : last;
  }
  const OR_PREF = ["google/gemma-4-31b-it:free", "nvidia/nemotron-3.5-super-vl:free", "google/gemma-4-26b-a4b-it:free"];
  async function orModels() {
    try { const c = JSON.parse(localStorage.getItem("tetbody.ormodels") || "null"); if (c && Date.now() - c.at < 864e5 && c.list.length) return c.list; } catch (e) { }
    try {
      const j = await (await fetch("https://openrouter.ai/api/v1/models")).json();
      const free = j.data.filter(m => m.id.endsWith(":free") && ((m.architecture || {}).input_modalities || []).includes("image") && !/safety|guard/i.test(m.id)).map(m => m.id);
      const list = [...OR_PREF.filter(x => free.includes(x)), ...free.filter(x => !OR_PREF.includes(x))];
      try { localStorage.setItem("tetbody.ormodels", JSON.stringify({ at: Date.now(), list })); } catch (e) { }
      return list.length ? list : OR_PREF;
    } catch (e) { return OR_PREF; }
  }
  async function openrouter(prompt, img) {
    const key = Store.orKey(); if (!key) throw new Error("no-key");
    const content = [{ type: "text", text: prompt }]; if (img) content.push({ type: "image_url", image_url: { url: img } });
    let last = null;
    for (const m of (await orModels()).slice(0, 4)) {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + key, "HTTP-Referer": location.origin, "X-Title": "Tet Body" },
        body: JSON.stringify({ model: m, temperature: .2, messages: [{ role: "user", content }] }) }).catch(() => ({ ok: false, status: 0, json: async () => ({}) }));
      const j = await res.json().catch(() => ({}));
      if (res.ok && j.choices && j.choices[0]) { try { return parse(j.choices[0].message.content); } catch (e) { last = e; continue; } }
      if (res.status === 401) throw new Error("Key OpenRouter không hợp lệ (☰ Cài đặt).");
      last = new Error(res.status === 429 ? "OpenRouter hết lượt miễn phí hôm nay" : (j.error && j.error.message) || "OpenRouter lỗi " + res.status);
    }
    throw last || new Error("OpenRouter lỗi");
  }
  /* try every provider with a key, in order */
  async function ask(prompt, img, onStep) {
    const errs = [];
    for (const [name, fn, has] of [["Gemini", gemini, Store.geminiKey()], ["OpenRouter", openrouter, Store.orKey()]]) {
      if (!has) continue; onStep && onStep(name);
      try { return { obj: await fn(prompt, img), by: name }; } catch (e) { errs.push(`${name}: ${e.message}`); }
    }
    throw new Error(errs.length ? errs.join(" · ") : "no-key");
  }

  /* ---------- UI ---------- */
  const TITLES = { raw: "📦 Nguyên liệu", dish: "🍽️ Món ăn", text: "🔍 Món ăn", inbody: "📊 Tờ InBody" };
  /* opts: { kind: raw|dish|text|inbody, img?, text?, meta } → H[kind](obj, meta) */
  function run(opts) {
    const has = Store.geminiKey() || Store.orKey(), prompt = opts.kind === "text" ? PROMPT.text(opts.text) : PROMPT[opts.kind](opts.note || "");
    const close = sheet(opts.title || TITLES[opts.kind], `${opts.img ? `<img class="aiimg" src="${opts.img}" alt="Ảnh vừa chụp">` : opts.text ? `<div class="quote">“${esc(opts.text)}”</div>` : ""}
      <div class="aiwait" id="aiW">${has ? `<span class="spin" aria-hidden="true"></span><b id="aiS">AI đang đọc…</b>` : `<b>Chưa có key AI miễn phí trên máy này.</b><p class="small">Vào ☰ Cài đặt → AI, dán key Gemini (và key OpenRouter dự phòng). Làm một lần là xong.</p><button class="btn" id="aiSet">Mở Cài đặt</button>`}</div>
      <details class="small aiclaude"><summary>Không dùng được AI? Hỏi Claude (copy và dán)</summary>
        <p>1. Bấm Copy lời nhắc, mở app Claude, đính kèm ảnh, dán lời nhắc, gửi. 2. Copy câu trả lời, dán vào ô dưới.</p>
        <div class="row2"><button class="btn ghost" id="aiCp">📋 Copy lời nhắc</button></div><textarea class="exp aitxt" id="aiTxt" placeholder="Dán câu trả lời của Claude"></textarea><button class="btn ghost" id="aiRead">Đọc kết quả</button></details>`,
      (bg, close) => {
        const go = (obj, by) => { close(); H[opts.kind === "text" ? "dish" : opts.kind](obj, Object.assign({}, opts.meta, { by })); };
        const set = $("#aiSet", bg); if (set) set.onclick = () => { close(); openSettings(); };
        $("#aiCp", bg).onclick = async () => { const ok = await copyText(prompt); FX.cheer(ok ? "📋" : "⚠️", ok ? "Đã copy lời nhắc" : "Không copy được", ""); };
        $("#aiRead", bg).onclick = () => { try { go(parse($("#aiTxt", bg).value), "Claude"); } catch (e) { FX.cheer("⚠️", "Chưa đọc được", e.message); } };
        if (has) ask(prompt, opts.img, name => { const s = $("#aiS", bg); if (s) s.textContent = `${name} đang đọc…`; })
          .then(r => { if (document.body.contains(bg)) go(r.obj, r.by); })
          .catch(e => { const w = $("#aiW", bg); if (w) w.innerHTML = `<b>⚠️ Chưa đọc được</b><p class="small">${esc(e.message)}</p><p class="small">Thử lại sau ít phút, hoặc mở phần "Hỏi Claude" bên dưới.</p>`; });
      });
    return close;
  }
  async function testKeys() {
    const out = [];
    if (Store.geminiKey()) out.push(await gemini('Trả về JSON {"ok":true}').then(() => "Gemini ✅").catch(e => "Gemini ⚠️ " + e.message));
    if (Store.orKey()) out.push(await openrouter('Trả về JSON {"ok":true}').then(() => "OpenRouter ✅").catch(e => "OpenRouter ⚠️ " + e.message));
    return out.join(" · ") || "Chưa có key";
  }
  /* v1 kept a "waiting for Claude" flag; v2 runs in one sheet, so just clear it */
  function banner() { if (Store.all.settings.pending) { Store.all.settings.pending = null; Store.save(); } return ""; }

  return { on: (k, fn) => { H[k] = fn; }, run, parse, foods, ask, testKeys, banner, PROMPT };
})();
