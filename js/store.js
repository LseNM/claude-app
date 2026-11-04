"use strict";
/* All user data stays on this device (localStorage). Backup = export/import JSON.
   The Gemini key is kept under its own localStorage key so it never goes into a backup file. */
const Store = (() => {
  const KEY = "tetbody.v1", GKEY = "tetbody.gemini";
  const blank = () => ({ personal: null, days: {}, gym: {}, phases: {}, weeksClosed: {}, photos: {}, settings: {}, foodHist: [], inbodyLog: [] });
  let S;
  try { S = Object.assign(blank(), JSON.parse(localStorage.getItem(KEY) || "{}")); } catch (e) { S = blank(); }
  let warned = false;
  const save = () => {
    try { localStorage.setItem(KEY, JSON.stringify(S)); }
    catch (e) { if (!warned) { warned = true; alert("Không lưu được dữ liệu (bộ nhớ trình duyệt đầy hoặc bị chặn). Hãy xuất bản sao lưu."); } }
  };
  const day = d => (S.days[d] = S.days[d] || { ticks: {}, water: 0, main: 0 });
  const norm = s => String(s || "").trim().toLowerCase();
  /* remember a food for autocomplete: one row per name, newest numbers win, count = times used */
  function remember(f, count = 1) {
    const n = String(f.n || "").trim(); if (!n || f.src === "plan") return;
    const i = S.foodHist.findIndex(x => norm(x.n) === norm(n)), row = { n, g: f.g || null, k: f.k, p: f.p, c: f.c, f: f.f, fb: f.fb };
    if (i >= 0) { row.count = (S.foodHist[i].count || 1) + count; S.foodHist[i] = Object.assign(S.foodHist[i], row, { last: Date.now() }); }
    else S.foodHist.push(Object.assign(row, { count, last: Date.now() }));
    S.foodHist.sort((a, b) => b.count - a.count || b.last - a.last); if (S.foodHist.length > 400) S.foodHist.length = 400;
  }
  return {
    get all() { return S; },
    save,
    day,
    peekDay: d => S.days[d],
    gym: d => S.gym[d],
    setGym(d, v) { S.gym[d] = v; save(); },
    phase: id => (S.phases[id] = S.phases[id] || { done: {} }),
    personal: () => S.personal,
    setPersonal(p) { S.personal = p; save(); },
    remember(f) { remember(f); save(); },
    importFoods(list) { let n = 0; (list || []).forEach(f => { if (f && f.n) { remember(f, f.count || 1); n++; } }); save(); return n; },
    geminiKey() { try { return localStorage.getItem(GKEY) || ""; } catch (e) { return ""; } },
    setGeminiKey(k) { try { k ? localStorage.setItem(GKEY, k) : localStorage.removeItem(GKEY); } catch (e) { } },
    exportJSON: () => JSON.stringify({ app: "tet-body", version: APP_VERSION, exported: new Date().toISOString(), data: S }, null, 1),
    importJSON(text) {
      const j = JSON.parse(text);
      if (j.app === "tet-body" && j.data) { S = Object.assign(blank(), j.data); save(); return "backup"; }
      if (j.kind === "tet-body-personal") {
        /* merge (file wins key by key) so re-importing never wipes InBody/rewards typed in the app */
        const foods = j.foods; delete j.foods; const cur = S.personal || {}, out = Object.assign({}, cur);
        for (const k in j) { const v = j[k], o = cur[k]; out[k] = v && o && typeof v === "object" && typeof o === "object" && !Array.isArray(v) ? Object.assign({}, o, v) : v; }
        S.personal = out; if (foods) this.importFoods(foods); save(); return "personal";
      }
      throw new Error("File không đúng định dạng (cần file sao lưu Tết Body hoặc file cá nhân).");
    },
    reset() { S = blank(); save(); }
  };
})();
