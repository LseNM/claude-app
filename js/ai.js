"use strict";
/* AI estimates without a server or a bill.
   Default: Claude (your own Claude app/subscription). The app copies a prompt, shares the photo to the Claude app,
   and you paste Claude's JSON answer back. Optional: a free-tier Gemini key (project WITHOUT billing) for one-tap results;
   over the free quota Google returns 429 instead of charging. The key lives only in this browser (never in backups). */
const AI = (() => {
  const H = {};                      // result handlers by kind: H.food(obj, meta), H.inbody(obj, meta)
  const FOOD_JSON = `{"desc":"mô tả ngắn","confidence":"high|medium|low","foods":[{"name":"Cơm trắng","g":150,"kcal":195,"p":4,"c":42,"f":0.6,"fib":0.6,"note":""}]}`;
  const PROMPT = {
    photo: extra => `Bạn là chuyên gia dinh dưỡng. Ảnh đính kèm là bữa ăn của mình (thường là món Việt nhà nấu).
1. Tách TỪNG thành phần riêng: cơm/bún/bánh, thịt cá trứng, rau, nước sốt, dầu mỡ thấy được.
2. Ước khối lượng đã nấu chín (gram) dựa vào kích thước chén, đĩa, muỗng, đũa trong ảnh.
3. Tính kcal, protein (p), carb (c), fat (f), chất xơ (fib) cho đúng số gram đó, theo bảng thành phần thực phẩm Việt Nam hoặc USDA. Nhớ tính dầu chiên/xào.${extra ? `\nGhi chú của mình: ${extra}` : ""}
Chỉ trả về đúng 1 khối JSON như mẫu, không giải thích thêm:
${FOOD_JSON}`,
    text: desc => `Bạn là chuyên gia dinh dưỡng. Mình vừa ăn: "${desc}".
Tách từng thành phần (cơm, thịt cá, rau, sốt, dầu…). Nếu mình có nói gram/số lượng thì dùng đúng số đó, không thì ước theo khẩu phần phổ biến ở Việt Nam. Tính kcal, protein (p), carb (c), fat (f), chất xơ (fib) theo bảng thành phần thực phẩm Việt Nam hoặc USDA.
Chỉ trả về đúng 1 khối JSON như mẫu, không giải thích thêm:
${FOOD_JSON}`,
    inbody: () => `Ảnh đính kèm là tờ kết quả InBody của mình. Đọc đúng số in trên tờ giấy (không ước tính), chỗ nào không có thì để null.
Chỉ trả về đúng 1 khối JSON, không giải thích:
{"date":"YYYY-MM-DD","w":0,"pbf":0,"smm":0,"fat":0,"vfl":0,"whr":0,"score":0}
w = Weight (kg), pbf = Percent Body Fat (%), smm = Skeletal Muscle Mass (kg), fat = Body Fat Mass (kg), vfl = Visceral Fat Level, whr = Waist-Hip Ratio, score = InBody Score.`
  };

  /* ---------- parsing whatever Claude/Gemini sends back ---------- */
  function parse(text) {
    let t = String(text || "").trim();
    const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i); if (fence) t = fence[1];
    const a = t.indexOf("{"), b = t.lastIndexOf("}"), a2 = t.indexOf("[");
    if (a2 >= 0 && (a < 0 || a2 < a)) { const e2 = t.lastIndexOf("]"); return { foods: JSON.parse(t.slice(a2, e2 + 1)) }; }
    if (a < 0 || b < a) throw new Error("Không thấy khối JSON. Hãy copy cả câu trả lời của Claude (có dấu { … }).");
    return JSON.parse(t.slice(a, b + 1).replace(/,\s*([}\]])/g, "$1"));
  }
  const num = v => { if (v == null || v === "") return null; const n = parseFloat(String(v).replace(",", ".").replace(/[^\d.\-]/g, "")); return isNaN(n) ? null : n; };
  const pick = (o, ks) => { for (const k of ks) if (o[k] != null) return o[k]; return null; };
  function foods(obj) {
    const L = Array.isArray(obj) ? obj : obj.foods || obj.items || [];
    return L.map(x => ({ n: String(pick(x, ["name", "n", "food", "ten"]) || "Món").trim(), g: num(pick(x, ["g", "grams", "gram", "serving_g", "serving_size"])),
      k: Math.round(num(pick(x, ["kcal", "calories", "k", "cal"])) || 0), p: r1(num(pick(x, ["p", "protein"])) || 0), c: r1(num(pick(x, ["c", "carb", "carbs"])) || 0),
      f: r1(num(pick(x, ["f", "fat"])) || 0), fb: r1(num(pick(x, ["fib", "fiber", "fb", "xo"])) || 0), note: x.note || x.notes || "" })).filter(x => x.n);
  }
  const r1 = n => Math.round(n * 10) / 10;

  /* ---------- Gemini (optional, free tier) ---------- */
  const MODELS = ["gemini-flash-latest", "gemini-2.5-flash", "gemini-flash-lite-latest"];
  async function gemini(prompt, dataURL) {
    const key = Store.geminiKey(); if (!key) throw new Error("Chưa có key Gemini (☰ Cài đặt).");
    const parts = [{ text: prompt }];
    if (dataURL) parts.push({ inline_data: { mime_type: "image/jpeg", data: dataURL.split(",")[1] } });
    let last = null, quota = false;
    for (const m of MODELS) {
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`, { method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": key },
          body: JSON.stringify({ contents: [{ role: "user", parts }], generationConfig: { temperature: .2, responseMimeType: "application/json" } }) });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) {
          const msg = (j.error && j.error.message) || "Lỗi " + res.status;
          if (res.status === 429) { quota = true; last = new Error(msg); continue; }
          if (res.status === 404) { last = new Error(msg); continue; }
          if (/API key not valid|API_KEY_INVALID|PERMISSION_DENIED/i.test(msg)) throw new Error("Key Gemini không hợp lệ hoặc bị chặn. Kiểm tra lại trong ☰ Cài đặt.");
          throw new Error(msg);
        }
        const text = j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts.map(p => p.text || "").join("");
        if (!text) throw new Error("Gemini không trả lời (có thể ảnh bị chặn). Thử Claude nhé.");
        return parse(text);
      } catch (e) { last = e; if (/không hợp lệ/.test(e.message)) throw e; }
    }
    if (quota) throw new Error("Gemini hết lượt miễn phí (phút này hoặc hôm nay). Không bị trừ tiền. Dùng nút Claude bên dưới nhé.");
    throw last || new Error("Gemini lỗi");
  }

  /* ---------- helpers ---------- */
  const dataURLtoFile = (u, name) => { const [h, b] = u.split(","), bin = atob(b), a = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return new File([a], name, { type: (h.match(/:(.*?);/) || [])[1] || "image/jpeg" }); };
  const canShareFile = f => { try { return !!(navigator.canShare && navigator.canShare({ files: [f] })); } catch (e) { return false; } };
  const setPending = p => { Store.all.settings.pending = p; Store.save(); };
  const pending = () => Store.all.settings.pending || null;
  function finish(obj, meta, kind, close) {
    setPending(null); close && close();
    const b = document.getElementById("aiPend"); if (b) b.remove();
    H[kind] ? H[kind](obj, meta) : alert("Không biết xử lý kết quả này.");
  }

  /* ---------- the main sheet ---------- */
  /* opts: { kind: "food"|"inbody", title, img (dataURL), text (description for kind food without photo), meta } */
  function open(opts) {
    const hasKey = !!Store.geminiKey(), isPhoto = !!opts.img;
    const prompt0 = () => opts.kind === "inbody" ? PROMPT.inbody() : isPhoto ? PROMPT.photo(($("#aiNote") || {}).value || "") : PROMPT.text(opts.text);
    sheet(opts.title, `
      ${isPhoto ? `<img class="aiimg" src="${opts.img}" alt="Ảnh vừa chụp">` : `<div class="quote">🗣️ “${esc(opts.text)}”</div>`}
      ${isPhoto && opts.kind === "food" ? `<label class="fld">Ghi chú thêm cho AI (tùy chọn)<input id="aiNote" placeholder="vd: ăn hết nửa đĩa · thịt kho có mỡ · 1 muỗng dầu"></label>` : ""}
      ${hasKey ? `<button class="btn big wide" id="aiGem">⚡ Gemini tự động <small>(miễn phí, key trên máy này)</small></button><div class="aistat" id="aiGemS"></div>
        <div class="orline"><span>hoặc dùng Claude</span></div>` : ""}
      <div class="aistep"><b>1</b><div>${isPhoto
        ? `<button class="btn ${hasKey ? "ghost" : "big"} wide" id="aiShare">🤖 Gửi ảnh sang app Claude</button><button class="lnk" id="aiWeb">Trên laptop: tải ảnh + mở claude.ai</button>`
        : `<button class="btn ${hasKey ? "ghost" : "big"} wide" id="aiWeb">🤖 Hỏi Claude (mở claude.ai)</button>`}
        <div class="small muted">Lời nhắc được copy sẵn. Nếu Claude chưa có chữ, giữ ô chat → <b>Dán</b>, rồi gửi.</div></div></div>
      <div class="aistep"><b>2</b><div>Claude trả lời xong: bấm <b>Copy</b> dưới câu trả lời, quay lại app này.</div></div>
      <div class="aistep"><b>3</b><div><button class="btn gold wide" id="aiPaste">📋 Dán kết quả từ Claude</button>
        <textarea class="exp aitxt" id="aiTxt" placeholder="…hoặc dán tay vào đây rồi bấm Đọc"></textarea><button class="btn ghost" id="aiRead">Đọc kết quả</button></div></div>
      ${hasKey ? "" : `<p class="small muted">Muốn bấm một lần là ra số? Thêm key Gemini miễn phí trong ☰ Cài đặt.</p>`}`,
      (bg, close) => {
        const go = obj => finish(obj, opts.meta, opts.kind, close);
        const err = m => FX.cheer("⚠️", "Chưa đọc được", m);
        const mark = () => setPending({ kind: opts.kind, meta: opts.meta, title: opts.title, at: Date.now() });
        const g = $("#aiGem", bg);
        if (g) g.onclick = async () => { g.disabled = true; $("#aiGemS", bg).textContent = "🤖 Gemini đang xem…";
          try { go(await gemini(prompt0(), opts.img)); } catch (e) { $("#aiGemS", bg).textContent = "⚠️ " + e.message; g.disabled = false; } };
        const sh = $("#aiShare", bg);
        if (sh) sh.onclick = async () => {
          const p = prompt0(); await copyText(p); mark();
          const f = dataURLtoFile(opts.img, opts.kind === "inbody" ? "inbody.jpg" : "bua-an.jpg");
          if (canShareFile(f)) { try { await navigator.share({ files: [f], text: p, title: "Ước tính macro" }); } catch (e) { } }
          else { webFlow(p); }
        };
        $("#aiWeb", bg).onclick = async () => { const p = prompt0(); await copyText(p); mark(); webFlow(p); };
        function webFlow(p) {
          if (isPhoto) { const a = document.createElement("a"); a.href = opts.img; a.download = opts.kind === "inbody" ? "inbody.jpg" : "bua-an.jpg"; a.click(); FX.cheer("📋", "Đã copy lời nhắc + tải ảnh", "kéo ảnh vào claude.ai rồi dán lời nhắc"); }
          window.open(isPhoto ? "https://claude.ai/new" : "https://claude.ai/new?q=" + encodeURIComponent(p), "_blank", "noopener");
        }
        $("#aiPaste", bg).onclick = async () => {
          let t = ""; try { t = await navigator.clipboard.readText(); } catch (e) { }
          if (!t) { $("#aiTxt", bg).focus(); return err("Trình duyệt không cho đọc clipboard: giữ vào ô bên dưới → Dán."); }
          $("#aiTxt", bg).value = t; try { go(parse(t)); } catch (e) { err(e.message); }
        };
        $("#aiRead", bg).onclick = () => { try { go(parse($("#aiTxt", bg).value)); } catch (e) { err(e.message); } };
      });
  }

  /* paste-only sheet, used from the "waiting for Claude" banner (e.g. the app was closed while you were in Claude) */
  function pasteSheet() {
    const p = pending(); if (!p) return;
    sheet("📋 Dán kết quả từ Claude", `<p class="muted" style="margin-top:0">Đang chờ: <b>${esc(p.title || "")}</b></p>
      <button class="btn gold wide" id="aiPaste">📋 Dán từ clipboard</button><textarea class="exp aitxt" id="aiTxt" placeholder="…hoặc dán tay vào đây"></textarea>
      <div class="row2"><button class="btn ghost" id="aiRead">Đọc kết quả</button><button class="btn ghost" id="aiDrop">Bỏ lượt này</button></div>`, (bg, close) => {
      const go = t => { try { finish(parse(t), p.meta, p.kind, close); } catch (e) { FX.cheer("⚠️", "Chưa đọc được", e.message); } };
      $("#aiPaste", bg).onclick = async () => { let t = ""; try { t = await navigator.clipboard.readText(); } catch (e) { } if (t) { $("#aiTxt", bg).value = t; go(t); } else $("#aiTxt", bg).focus(); };
      $("#aiRead", bg).onclick = () => go($("#aiTxt", bg).value);
      $("#aiDrop", bg).onclick = () => { setPending(null); close(); const b = document.getElementById("aiPend"); if (b) b.remove(); };
    });
  }
  function banner() {
    const p = pending(); if (!p || Date.now() - p.at > 864e5) { if (p) setPending(null); return ""; }
    return `<button class="aipend" id="aiPend">🤖 Đang chờ kết quả Claude · <b>${esc(p.title || "")}</b> <span>Dán kết quả →</span></button>`;
  }
  document.addEventListener("click", e => { if (e.target.closest("#aiPend")) pasteSheet(); });

  /* small key test for Settings */
  async function testKey() { const o = await gemini('Trả về JSON {"ok":true}'); return !!o; }

  return { on: (k, fn) => { H[k] = fn; }, open, parse, foods, gemini, banner, pasteSheet, testKey, PROMPT };
})();
