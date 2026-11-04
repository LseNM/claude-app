"use strict";
/* All user data stays on this device (localStorage). Backup = export/import JSON. */
const Store = (() => {
  const KEY = "tetbody.v1";
  const blank = () => ({ personal: null, days: {}, gym: {}, phases: {}, weeksClosed: {}, photos: {}, settings: {} });
  let S;
  try { S = Object.assign(blank(), JSON.parse(localStorage.getItem(KEY) || "{}")); } catch (e) { S = blank(); }
  let warned = false;
  const save = () => {
    try { localStorage.setItem(KEY, JSON.stringify(S)); }
    catch (e) { if (!warned) { warned = true; alert("Không lưu được dữ liệu (bộ nhớ trình duyệt đầy hoặc bị chặn). Hãy xuất bản sao lưu."); } }
  };
  const day = d => (S.days[d] = S.days[d] || { ticks: {}, water: 0, main: 0 });
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
    exportJSON: () => JSON.stringify({ app: "tet-body", version: APP_VERSION, exported: new Date().toISOString(), data: S }, null, 1),
    importJSON(text) {
      const j = JSON.parse(text);
      if (j.app === "tet-body" && j.data) { S = Object.assign(blank(), j.data); save(); return "backup"; }
      if (j.kind === "tet-body-personal") { S.personal = j; save(); return "personal"; }
      throw new Error("File không đúng định dạng (cần file sao lưu Tết Body hoặc file cá nhân).");
    },
    reset() { S = blank(); save(); }
  };
})();
