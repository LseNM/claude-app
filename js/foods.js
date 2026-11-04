"use strict";
/* Food table + the day's plan (v2).
   FOODS[key] = { e, n, u, k, p, c, f, fb, src }: u "g" → numbers per 100 g (raw/sống unless the name says chín), other units → per 1 unit.
   Menu items come from Diet/Thực đơn 1 ngày - 1540 kcal.html (món mặn converted to per 100 g RAW using its "Sống" column).
   General items: average values (USDA / bảng thành phần thực phẩm VN) — labels say "trung bình".
   A day: d.plan = { mode: "plan"|"gram", bf: {key: qty}, pot: {key: qty}, lunch: {key: qty}, dinner: {key: qty} }
   — one pot cooked for lunch + dinner, each meal eats ½. A meal counts once its tick (bf/lunch/dinner) is on.
   Extra things eaten (photo of a dish, snacks, history picks) stay in d.food as before. */
const rawG = s => String(s).split("+").reduce((a, x) => a + (parseFloat(x) || 0), 0);
const FOODS = {
  com: { e: "🍚", n: "Cơm trắng (chín)", u: "g", k: 130, p: 2.7, c: 27.7, f: .3, fb: .4, src: "menu" },
  rau: { e: "🥦", n: "Rau luộc 4 loại", u: "g", k: 44, p: 2.5, c: 8.5, f: .3, fb: 3.4, src: "menu" },
  cu: { e: "🥕", n: "Củ nấu canh", u: "g", k: 25, p: 1, c: 6.3, f: .3, fb: 1.5, src: "menu" },
  bam: { e: "🍖", n: "Thịt nạc bằm (canh)", u: "g", k: 140, p: 19, c: 0, f: 6.7, fb: 0, src: "menu" },
  giavi: { e: "🧂", n: "Gia vị kho", u: "phần", k: 38, p: 0, c: 4, f: 2.3, fb: 0, src: "menu", note: "½ muỗng cà phê dầu + 1 đường + 1 nước mắm" },
  sinhto: { e: "🥤", n: "Sinh tố sáng", u: "ly", k: 294, p: 23.3, c: 34, f: 7.9, fb: 6.3, src: "menu", note: "½ muỗng whey · 200 ml sữa đậu nành · ½ chuối · 1 muỗng cà phê chia · 20 g yến mạch" },
  trung: { e: "🥚", n: "Trứng luộc", u: "quả", k: 78, p: 6.5, c: .55, f: 5.3, fb: 0, src: "menu" },
  oi: { e: "🍈", n: "Ổi", u: "g", k: 68, p: 2.5, c: 14.3, f: .9, fb: 5.4, src: "menu" },
  tao: { e: "🍎", n: "Táo", u: "g", k: 52, p: .2, c: 13.8, f: .2, fb: 2.4, src: "menu" },
  sua: { e: "🥣", n: "Sữa chua Vinamilk không đường", u: "hũ", k: 65, p: 4, c: 5.3, f: 3.2, fb: 0, src: "menu" },
  bachi: { e: "🥓", n: "Ba chỉ heo", u: "g", k: 518, p: 9.3, c: 0, f: 53, fb: 0 }, suon: { e: "🍖", n: "Sườn heo", u: "g", k: 277, p: 15.5, c: 0, f: 23.4, fb: 0 },
  dauphu: { e: "🧈", n: "Đậu phụ", u: "g", k: 76, p: 8, c: 1.9, f: 4.8, fb: .3 }, bun: { e: "🍜", n: "Bún tươi", u: "g", k: 110, p: 1.7, c: 25, f: .2, fb: .3 },
  pho: { e: "🍜", n: "Bánh phở tươi", u: "g", k: 140, p: 2.3, c: 31, f: .3, fb: .5 }, khoailang: { e: "🍠", n: "Khoai lang", u: "g", k: 86, p: 1.6, c: 20, f: .1, fb: 3 },
  khoaitay: { e: "🥔", n: "Khoai tây", u: "g", k: 77, p: 2, c: 17, f: .1, fb: 2.2 }, yenmach: { e: "🌾", n: "Yến mạch", u: "g", k: 379, p: 13, c: 68, f: 6.5, fb: 10 },
  chuoi: { e: "🍌", n: "Chuối", u: "g", k: 89, p: 1.1, c: 23, f: .3, fb: 2.6 }, suatuoi: { e: "🥛", n: "Sữa tươi không đường (ml)", u: "g", k: 62, p: 3.2, c: 4.8, f: 3.3, fb: 0 },
  whey: { e: "🥄", n: "Whey (xem nhãn)", u: "g", k: 400, p: 80, c: 8, f: 6, fb: 0 }, bongcai: { e: "🥦", n: "Bông cải xanh", u: "g", k: 34, p: 2.8, c: 7, f: .4, fb: 2.6 },
  raumuong: { e: "🥬", n: "Rau muống", u: "g", k: 19, p: 2.6, c: 3.1, f: .2, fb: 2.1 }, cachua: { e: "🍅", n: "Cà chua", u: "g", k: 18, p: .9, c: 3.9, f: .2, fb: 1.2 },
  dau: { e: "🫒", n: "Dầu ăn", u: "g", k: 884, p: 0, c: 0, f: 100, fb: 0, note: "1 muỗng canh ≈ 13 g · 1 muỗng cà phê ≈ 4.5 g" }
};
/* món mặn from the menu → per 100 g raw */
MAINS.forEach((m, i) => { const r = rawG(m[3]); FOODS["main" + i] = { e: m[0], n: m[1], u: "g", k: +(m[4] * 100 / r).toFixed(1), p: +(2200 / r).toFixed(1), c: 0, f: +(m[6] * 100 / r).toFixed(1), fb: 0, src: "menu", main: i }; });
const isUnit = key => FOODS[key] && FOODS[key].u !== "g";
/* [kcal, protein, carb, fat, fiber] for qty of a food */
function fval(key, q) { const x = FOODS[key]; if (!x) return [0, 0, 0, 0, 0]; const r = x.u === "g" ? q / 100 : q; return [x.k * r, x.p * r, x.c * r, x.f * r, x.fb * r]; }
const vsum = L => L.reduce((a, v) => a.map((x, i) => x + (v[i] || 0)), [0, 0, 0, 0, 0]);
const qtyLabel = (key, q) => isUnit(key) ? `${fmt(q, q % 1 ? 1 : 0)} ${FOODS[key].u}` : `${fmt(q)} g`;
const shortN = n => String(n).replace(" (chín)", "").replace(" (canh)", "").replace(" không đường", "").replace(" (xem nhãn)", "").replace(/ \(.*\)$/, "");

function planPot(mi) { const M = MAINS[mi]; return { ["main" + mi]: rawG(M[3]) * 2, com: M[5] * 2, rau: 200, cu: 160, bam: 60, giavi: 2 }; }
const defaultPlan = mi => ({ mode: "plan", bf: { sinhto: 1, trung: 2 }, pot: planPot(mi || 0), lunch: { oi: 150 }, dinner: { tao: 90, sua: 1 } });
/* the day's plan; stored only when `create` (so browsing old days doesn't write) */
function dayPlan(dIso, create) {
  const x = create ? Store.day(dIso) : Store.peekDay(dIso);
  if (x && x.plan) { const p = x.plan; for (const m of ["bf", "lunch", "dinner"]) for (const k in p[m]) if (isUnit(k) && p[m][k] > 20) p[m][k] = 1; return p; }
  const p = defaultPlan(x ? x.main : 0); if (create) { x.plan = p; Store.save(); } return p;
}
function setMain(dIso, mi) { const d = Store.day(dIso), p = dayPlan(dIso, true); d.main = mi; const old = Object.keys(p.pot).find(k => /^main\d+$/.test(k));
  if (p.mode === "plan") p.pot = planPot(mi); else { const g = old ? p.pot[old] : rawG(MAINS[mi][3]) * 2; if (old) delete p.pot[old]; p.pot["main" + mi] = g; } Store.save(); }
const potVal = p => vsum(Object.entries(p.pot).map(([k, q]) => fval(k, q)));
function mealVal(p, m) {
  if (m === "bf") return vsum(Object.entries(p.bf).map(([k, q]) => fval(k, q)));
  if (m === "lunch" || m === "dinner") return vsum([potVal(p).map(x => x / 2), ...Object.entries(p[m]).map(([k, q]) => fval(k, q))]);
  return [0, 0, 0, 0, 0];
}
const extraItems = (dIso, m) => foodList(dIso).filter(f => f.src !== "plan" && (!m || f.m === m));
const itemVal = f => [+f.k || 0, +f.p || 0, +f.c || 0, +f.f || 0, +f.fb || 0];
/* what was actually eaten that day: ticked plan meals + every extra item */
function dayEaten(dIso) {
  const x = Store.peekDay(dIso) || { ticks: {} }, p = dayPlan(dIso), t = (x.ticks || {});
  return vsum([...["bf", "lunch", "dinner"].filter(m => t[m]).map(m => mealVal(p, m)), ...extraItems(dIso).map(itemVal)]);
}
const dayPlanned = dIso => { const p = dayPlan(dIso); return vsum(["bf", "lunch", "dinner"].map(m => mealVal(p, m))); };
/* emoji for a free-text food name */
function foodEmoji(n) {
  const s = deacc(n); const R = [["banh mi", "🥖"], ["com", "🍚"], ["bun", "🍜"], ["pho", "🍜"], ["mi ", "🍜"], ["ga", "🍗"], ["bo", "🥩"], ["heo", "🥩"], ["thit", "🥩"], ["suon", "🍖"], ["ca ", "🐟"], ["ca hoi", "🐟"], ["tom", "🦐"], ["muc", "🦑"],
    ["trung", "🥚"], ["rau", "🥬"], ["canh", "🍲"], ["chuoi", "🍌"], ["sua chua", "🥣"], ["sua", "🥛"], ["banh mi", "🥖"], ["banh", "🥮"], ["tra", "🧋"], ["ca phe", "☕"], ["dau phu", "🧈"], ["khoai", "🍠"], ["tao", "🍎"], ["oi", "🍈"]];
  for (const [k, e] of R) if ((" " + s + " ").includes(" " + k) || s.startsWith(k)) return e; return "🍽️";
}
/* match an AI ingredient name to a FOODS key */
function matchFood(name, key) {
  if (key && FOODS[key]) return key;
  const s = deacc(name); let best = null;
  for (const [k, x] of Object.entries(FOODS)) { const n = deacc(shortN(x.n)); if (s.includes(n) || n.includes(s)) { if (!best || n.length > deacc(shortN(FOODS[best].n)).length) best = k; } }
  const alias = [["bo", "main5"], ["thit bo", "main5"], ["heo", "main0"], ["thit heo", "main0"], ["ga", "main6"], ["uc ga", "main6"], ["dui ga", "main9"], ["ca hoi", "main10"], ["ca basa", "main7"], ["ca thu", "main1"], ["ca ngu", "main2"], ["tom", "main4"], ["muc", "main3"], ["trung", "trung"], ["com", "com"]];
  if (!best) for (const [a, k] of alias) if (s === a || s.startsWith(a + " ")) return k;
  return best;
}
