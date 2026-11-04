"use strict";
/* Public content only (safe to host). Personal numbers (weight, InBody, targets, rewards, "why") live in the
   personal JSON that each device imports once — never in this file.
   Sources: vault 2. Areas/Health — Challenge.html, Body Recomposition.html, Diet/Thực đơn 1 ngày - 1540 kcal.html,
   Strength Training/*. */
const APP_VERSION = "1.1.0";
const START = new Date(2026, 10, 9), END = new Date(2027, 0, 31), TET = new Date(2027, 1, 6);
const NOMACHINE_UNTIL = new Date(2026, 10, 30);
const TARGET = { kcal: 1540, protein: 118, proteinMin: 110, fiber: 20, water: 2.5, steps: 7000, sleep: 7.5 };
const VIDEO = { V1: "Cpy5lzJRMEI", V2: "uN1Qp64lqOE" };   // V1 "It's Boring, But It Builds An Athletic Physique" · V2 "The ONLY 7 Exercises You Need"

/* ---------- week ---------- */
const WEEK_PLAN = { 1: { k: "gym", t: "Gym A", e: "🏋️" }, 2: { k: "zone2", t: "Zone 2", e: "🚴" }, 3: { k: "gym", t: "Gym B", e: "🏋️" },
  4: { k: "walk", t: "Đi bộ 45'", e: "🚶" }, 5: { k: "gym", t: "Gym C", e: "🏋️" }, 6: { k: "yoga", t: "Yoga 60'", e: "🧘" }, 0: { k: "rest", t: "Nghỉ · chợ · review", e: "🛒" } };

/* ---------- gym program ----------
   entry: [id, name, sets, lo, hi, unit, per, startKg, rest s, step kg]
   unit "rep" | "m" (carry distance) ; per = "mỗi chân" / "mỗi bên" / "mỗi tay" ; step = kg added when ready (0 = add reps / harder variant) */
const E = (id, name, sets, lo, hi, unit, per, kg, rest, step) => ({ id, name, sets, lo, hi, unit, per, kg, rest, step });
const PROGRAM = {
  free: {
    "Gym A": [E("goblet", "Goblet squat", 3, 6, 12, "rep", "", 8, 120, 2), E("bench", "DB bench press", 3, 6, 12, "rep", "mỗi tay", 5, 120, 1), E("pullover", "DB pullover", 3, 8, 12, "rep", "", 6, 90, 1),
      E("lunge", "Reverse lunge", 2, 8, 12, "rep", "mỗi chân", 4, 90, 1), E("farmer", "Farmer's carry", 2, 30, 40, "m", "mỗi tay", 8, 60, 2), E("deadbug", "Dead bug", 2, 8, 8, "rep", "mỗi bên", 0, 45, 0),
      E("curl", "DB curl", 2, 10, 12, "rep", "mỗi tay", 4, 60, 1), E("triceps", "Triceps overhead", 2, 10, 12, "rep", "", 5, 60, 1)],
    "Gym B": [E("rdl", "RDL", 3, 6, 12, "rep", "mỗi tay", 8, 120, 2), E("dbrow", "One-arm DB row", 3, 8, 12, "rep", "mỗi tay", 8, 90, 2), E("ohp", "DB shoulder press", 3, 6, 12, "rep", "mỗi tay", 4, 90, 1),
      E("stepup", "Step-up", 2, 8, 12, "rep", "mỗi chân", 4, 90, 1), E("birddog", "Bird dog", 2, 8, 8, "rep", "mỗi bên", 0, 45, 0), E("rfly", "DB reverse fly", 2, 12, 15, "rep", "mỗi tay", 2, 60, 1)],
    "Gym C": [E("hipthrust", "Hip thrust", 3, 6, 12, "rep", "", 20, 120, 2.5), E("pullover", "DB pullover", 3, 8, 12, "rep", "", 6, 90, 1), E("pushup", "Push-up", 3, 6, 12, "rep", "", 0, 90, 0),
      E("dbrow", "One-arm DB row", 2, 8, 12, "rep", "mỗi tay", 8, 90, 2), E("suitcase", "Suitcase carry", 2, 30, 40, "m", "mỗi tay", 8, 60, 2), E("dbchop", "DB wood chop", 2, 10, 10, "rep", "mỗi bên", 4, 60, 1),
      E("curl", "DB curl", 2, 10, 12, "rep", "mỗi tay", 4, 60, 1), E("triceps", "Triceps overhead", 2, 10, 12, "rep", "", 5, 60, 1)]
  },
  machine: {
    "Gym A": [E("legpress", "Leg press", 3, 6, 12, "rep", "", 40, 120, 5), E("bench", "DB bench press", 3, 6, 12, "rep", "mỗi tay", 5, 120, 1), E("pulldown", "Lat pulldown", 3, 6, 12, "rep", "", 20, 90, 2.5),
      E("lunge", "Reverse lunge", 2, 8, 12, "rep", "mỗi chân", 4, 90, 1), E("farmer", "Farmer's carry", 2, 30, 40, "m", "mỗi tay", 8, 60, 2), E("deadbug", "Dead bug", 2, 8, 8, "rep", "mỗi bên", 0, 45, 0),
      E("curl", "DB curl", 2, 10, 12, "rep", "mỗi tay", 4, 60, 1), E("triceps", "Triceps overhead", 2, 10, 12, "rep", "", 5, 60, 1)],
    "Gym B": [E("rdl", "RDL", 3, 6, 12, "rep", "mỗi tay", 8, 120, 2), E("row", "Seated cable row", 3, 6, 12, "rep", "", 20, 90, 2.5), E("ohp", "Shoulder press", 3, 6, 12, "rep", "mỗi tay", 4, 90, 1),
      E("stepup", "Step-up", 2, 8, 12, "rep", "mỗi chân", 4, 90, 1), E("pallof", "Pallof press", 2, 10, 10, "rep", "mỗi bên", 10, 45, 2.5), E("facepull", "Face pull", 2, 15, 15, "rep", "", 10, 60, 2.5)],
    "Gym C": [E("hipthrust", "Hip thrust", 3, 6, 12, "rep", "", 20, 120, 2.5), E("assist", "Assisted pull-up", 3, 6, 12, "rep", "kg hỗ trợ", 30, 120, -2.5), E("pushup", "Push-up", 3, 6, 12, "rep", "", 0, 90, 0),
      E("dbrow", "One-arm DB row", 2, 8, 12, "rep", "mỗi tay", 8, 90, 2), E("suitcase", "Suitcase carry", 2, 30, 40, "m", "mỗi tay", 8, 60, 2), E("chop", "Cable wood chop", 2, 10, 10, "rep", "mỗi bên", 10, 60, 2.5),
      E("curl", "DB curl", 2, 10, 12, "rep", "mỗi tay", 4, 60, 1), E("triceps", "Triceps overhead", 2, 10, 12, "rep", "", 5, 60, 1)]
  }
};
const MACHINE = new Set(["legpress", "pulldown", "row", "pallof", "chop", "assist", "facepull"]);
/* swap pairs: machine ⇄ no-machine stand-in (shown as "Máy bận? Đổi sang …" / "Có máy trống? Đổi sang …") */
const SWAP = { legpress: "goblet", goblet: "legpress", pulldown: "pullover", assist: "pullover", pullover: "pulldown", row: "dbrow", dbrow: "row", pallof: "birddog", birddog: "pallof", chop: "dbchop", dbchop: "chop", facepull: "rfly", rfly: "facepull" };
const WARMUP = "Đạp xe hoặc đi bộ nhanh 5–8 phút, rồi 1–2 set nhẹ của bài đầu tiên (khởi động tăng dần).";

/* exercises without a stick figure: short guide only */
const SIMPLE_EX = {
  curl: { name: "DB curl", vi: "Cuốn tạ tay (tay trước)", e: "💪", cues: ["Đứng thẳng, khuỷu sát hông.", "Cuốn tạ lên, không đung đưa người.", "Hạ chậm 2–3 giây."], bad: "vung lưng để kéo tạ." },
  triceps: { name: "Triceps overhead", vi: "Đưa tạ sau đầu (tay sau)", e: "💪", cues: ["Hai tay ôm một tạ, đưa lên trên đầu.", "Hạ tạ ra sau đầu, khuỷu hướng lên trần.", "Duỗi tay lên, siết tay sau."], bad: "khuỷu bè rộng, ưỡn lưng." },
  rfly: { name: "DB reverse fly", vi: "Gập người dang tạ (vai sau · thay face pull)", e: "🦋", cues: ["Gập hông, lưng phẳng, tay buông thẳng xuống.", "Dang hai tay sang ngang, ép bả vai.", "Hạ chậm; tạ nhẹ, đủ 15 rep."], bad: "nhún vai, dùng đà." },
  facepull: { name: "Face pull", vi: "Kéo dây cáp về mặt (vai sau, tư thế)", e: "🎯", cues: ["Ròng rọc ngang mặt, cầm dây thừng.", "Kéo về phía trán, khuỷu cao, xoay tay ra ngoài.", "Thả chậm."], bad: "kéo bằng lưng dưới, ngả người." },
  assist: { name: "Assisted pull-up", vi: "Hít xà có máy hỗ trợ (kéo dọc)", e: "🧗", cues: ["Quỳ lên đệm, kg càng lớn thì càng được đỡ nhiều.", "Kéo ngực lên xà, ép bả vai xuống.", "Hạ chậm đến khi tay duỗi."], bad: "đung đưa, kéo nửa động tác." }
};
/* timestamps (seconds) in the two videos for each pattern, from the Strength Training notes */
const PATTERN_VIDEO = { squat: ["V2", 93], hinge: ["V2", 140], lunge: ["V2", 188], push: ["V2", 284], pull: ["V2", 307], carry: ["V2", 376], rot: ["V2", 403] };

/* ---------- challenge phases (dates from Challenge.html). Numbers for targets come from the personal file. ---------- */
const PHASES = [
  { id: "prep", name: "Chuẩn bị", from: [2026, 10, 2], to: [2026, 10, 8], color: "#9a8a7e", focus: "Mua đồ, cài Claude Project, đo mốc 0",
    checklist: ["Mua whey, yến mạch, hạt chia, sữa chua Vinamilk không đường, rau 4 loại", "Cài Claude Project + mẫu tổng kết", "Đặt 4 báo thức điện thoại", "Chụp ảnh tháng 0, đo eo lần đầu"] },
  { id: "p1", name: "GĐ1 · Làm quen", from: [2026, 10, 9], to: [2026, 10, 22], color: "#2a78d6", weeks: "Tuần 1–2", focus: "Làm quen tạ, kỹ thuật 7 pattern (bản không máy)",
    checklist: ["Đủ 6/6 buổi tập", "Quay video form 7 pattern, tự soi lỗi", "Log đủ kg × rep × RIR mọi set", "1,540 kcal không đầy hơi ≥ 10/14 ngày"] },
  { id: "p2", name: "GĐ2 · Độ nặng đúng", from: [2026, 10, 23], to: [2026, 11, 6], color: "#eb6834", weeks: "Tuần 3–4", focus: "Đoán RIR đúng, thử 1 set tới failure an toàn",
    checklist: ["Thử 1 set tới failure an toàn (goblet squat, DB row, push-up)", "Đủ 6/6 buổi tập", "Protein ≥ 110 g ít nhất 12/14 ngày", "Từ 01/12: làm quen máy (leg press, lat pulldown, cable row)"] },
  { id: "p3", name: "GĐ3 · Tăng tải", from: [2026, 11, 7], to: [2027, 0, 3], color: "#1baf7a", weeks: "Tuần 5–8", focus: "Double progression, InBody tuần 6",
    checklist: ["Mỗi bài lớn tăng tạ ít nhất 2 lần", "InBody 19/12 (9:30, chưa ăn)", "Nghỉ lễ 24/12–01/01: không lỡ quá 1 buổi/tuần", "Không bỏ 2 ngày liền"] },
  { id: "p4", name: "GĐ4 · Nâng biến thể", from: [2027, 0, 4], to: [2027, 0, 31], color: "#6250d6", weeks: "Tuần 9–12", focus: "Biến thể khó hơn, tự lập chương trình, InBody tuần 12",
    checklist: ["Mỗi pattern lên 1 biến thể khó hơn", "Tự viết chương trình 1 trang", "Push-up chuẩn 3 × 8", "InBody 30/01"] },
  { id: "keep", name: "Giữ phong độ", from: [2027, 1, 1], to: [2027, 1, 5], color: "#c8302c", focus: "Giữ 1,540 kcal + 3 buổi, ảnh trước Tết",
    checklist: ["Đủ 3 buổi tập tuần cuối", "Chụp ảnh trước Tết", "Lên kế hoạch ăn Tết vẫn đủ protein"] },
  { id: "s2", name: "Chặng 2 sau Tết", from: [2027, 1, 7], to: [2027, 3, 30], color: "#c9b8a6", faded: true, focus: "Lập chi tiết sau Tết", checklist: [] }
];
PHASES.forEach(p => { p.f = new Date(...p.from); p.t = new Date(...p.to); });
const MILESTONES = [[new Date(2026, 11, 19), "InBody tuần 6", "📊"], [new Date(2027, 0, 30), "InBody tuần 12", "📊"], [TET, "Tết", "🏮"], [new Date(2027, 3, 30), "Mốc PBF ~24%", "🎯"]];
/* metric keys a phase can target (values in personal file): w = cân TB 7 ngày, waistD = eo so với lần đo đầu (cm), pbf, smm, fat */
const METRIC_DEF = { w: ["Cân TB 7 ngày", "kg", -1], waistD: ["Vòng eo (so với lần đo đầu)", "cm", -1], pbf: ["PBF (InBody)", "%", -1], smm: ["SMM (InBody)", "kg", 1], fat: ["Mỡ (InBody)", "kg", -1] };

/* ---------- standard day (Body Recomposition "Một ngày chuẩn", meals updated to the current menu file) ---------- */
const DAY_COMMON = {
  morning: [["06:30", "care", "Thức dậy, 500 ml nước, ra nắng 10–15 phút"], ["06:45", "care", "Cân nặng và ghi vào app (thứ Hai đo thêm vòng eo ngang rốn)"],
    ["07:00", "eat", "Bữa sáng · ~450 kcal · 36 g protein: sinh tố + 2 trứng luộc, uống chậm"], ["09:00", "work", "Làm việc · cứ 50 phút đứng dậy 2–3 phút · 400 ml nước"],
    ["12:00", "eat", "Bữa trưa · ~540 kcal · 38 g: cơm + 3 món + 1 trái ổi"], ["12:30", "move", "Đi bộ 10–15 phút sau ăn"], ["12:45", "work", "Làm việc · cà phê chỉ trước 14:00"]],
  evening: [["22:00", "care", "Thư giãn, ngâm yến mạch + chia cho sáng mai"], ["22:30", "sleep", "Lên giường 22:30, ngủ trước 23:00"]]
};
const DAY_MID = {
  gym: [["18:00", "care", "Tan làm, 300 ml nước (đói thì ăn ổi lúc này, tổng calo không đổi)"], ["18:30", "move", "Tập · khởi động tăng dần → bài lớn → bài phụ → carry/core · RIR 1–3"],
    ["20:00", "eat", "Bữa tối · ~550 kcal · 39 g: cơm + 3 món (giống trưa) + ½ táo + sữa chua Vinamilk"], ["20:30", "own", "Thời gian riêng"]],
  zone2: [["18:00", "care", "Tan làm, 300 ml nước"], ["18:30", "move", "Zone 2 40–45 phút (đi bộ dốc / chạy chậm, nhịp tim 125–140)"], ["19:30", "eat", "Bữa tối · ~550 kcal · 39 g"], ["20:00", "own", "Thời gian riêng"]],
  walk: [["18:00", "care", "Tan làm, 300 ml nước"], ["18:30", "move", "Đi bộ nhanh 45 phút"], ["19:30", "eat", "Bữa tối · ~550 kcal · 39 g"], ["20:00", "own", "Thời gian riêng"]],
  yoga: [["07:00", "move", "Yoga 60 phút (giãn cơ, linh hoạt hông và vai)"], ["08:15", "eat", "Bữa sáng sau yoga"], ["09:00", "own", "Học 9–12h · đứng dậy mỗi 50 phút"], ["12:00", "eat", "Bữa trưa + ổi"],
    ["14:00", "own", "Học / YouTube 14–18h"], ["18:00", "move", "Đi bộ nhẹ, giữ 7–8k bước"], ["19:00", "eat", "Bữa tối"]],
  rest: [["09:00", "care", "Đi chợ, nấu sẵn đồ đạm cho tuần"], ["12:00", "eat", "Bữa trưa + ổi"], ["16:00", "own", "Review tuần trong app (tab Lộ trình → Tuần)"], ["19:00", "eat", "Bữa tối"]]
};

/* ---------- menu: copied from Diet/Thực đơn 1 ngày - 1540 kcal.html ----------
   Breakfast fixed. Lunch = dinner: cơm + 3 món. Only extras differ: lunch always 1 guava; dinner ½ apple + Greek yogurt. */
/* columns: emoji, name, amount, kcal, protein, fiber, carb, fat (carb/fat from the same file's tables) */
const BREAKFAST = [["🥄", "Whey", "½ muỗng (~15 g)", 60, 12, 0, 1.5, .8], ["🥛", "Sữa đậu nành không đường", "200 ml", 80, 7, 1, 3.5, 4], ["🍌", "Chuối (hoặc ¼ bơ)", "½ trái (~60 g)", 53, .6, 1.6, 13.7, .2],
  ["⚫", "Hạt chia", "1 muỗng cà phê (~5 g)", 25, 1, 1.7, 2.1, 1.5], ["🌾", "Yến mạch", "20 g (~2 muỗng canh)", 76, 2.7, 2, 13.2, 1.4], ["🥚", "Trứng luộc", "2 quả", 156, 13, 0, 1.1, 10.6]];
const MAINS = [["🐖", "Thịt heo nạc (thăn, đùi)", "85 g", "115 g", 123, 130, 4], ["🐟", "Cá thu", "93 g", "125 g", 147, 110, 6], ["🐟", "Cá ngừ", "76 g", "105 g", 99, 150, 1],
  ["🦑", "Mực", "105 g", "140 g", 130, 125, 2], ["🦐", "Tôm (bóc vỏ)", "92 g", "125 g", 91, 155, .5], ["🥩", "Thịt bò nạc", "85 g", "115 g", 212, 60, 14], ["🍗", "Ức gà", "71 g", "95 g", 117, 135, 3],
  ["🐟", "Cá basa", "96 g", "130 g", 125, 130, 4], ["🥢", "Đậu phụ 100 g + ức gà 45 g", "145 g", "100 + 60 g", 151, 110, 7], ["🍗", "Đùi gà bỏ da", "85 g", "115 g", 178, 90, 10], ["🐟", "Cá hồi", "88 g", "120 g", 183, 85, 11]];
const PLATE = { seasoning: ["🧂", "Gia vị kho: dầu + đường + nước mắm", "½ + 1 + 1 muỗng cà phê", 38, 0, 0, 4, 2.3], veg: ["🥦", "Rau luộc 4 loại", "100 g", 44, 2.5, 3.4, 8.5, .3],
  soup: ["🍲", "Canh: củ + thịt nạc bằm", "1 chén: 80 g củ + 30 g thịt sống", 62, 6.5, 1.2, 5, 2.2] };
const VEG = [["🥦", "Bông cải xanh", 9, .8], ["🫛", "Đậu Hà Lan", 21, 1.4], ["🥕", "Cà rốt", 9, .8], ["🥬", "Bắp cải", 6, .5]];
/* columns: emoji, name, kcal, protein, fiber, carb, fat */
const EXTRAS = { lunch: [["🍈", "Ổi 1 trái (~150 g)", 102, 3.8, 8.1, 21.5, 1.4]], dinner: [["🍎", "½ trái táo (~90 g)", 47, .2, 2.2, 12.4, .2], ["🥣", "Sữa chua Vinamilk không đường 1 hũ 100 g", 65, 4, 0, 5.3, 3.2]] };
/* cooked white rice per gram: 1.3 kcal, 3.5/130 g protein, 0.28 g carb, 0.4/130 g fat, 0.5/130 g fiber (file: 130 g = 169 kcal, 3.5 g P, 36 g C, 0.4 g F) */
function meal(which, i) {
  const [, , , , k, rice, mf] = MAINS[i], ex = EXTRAS[which], f = [PLATE.seasoning, PLATE.veg, PLATE.soup];
  const sum = j => f.reduce((a, x) => a + x[j], 0) + ex.reduce((a, e) => a + e[j - 1], 0);
  return { kcal: Math.round(k + rice * 1.3 + sum(3)), prot: 22 + rice * 3.5 / 130 + sum(4), fib: rice * .5 / 130 + sum(5), carb: rice * .28 + sum(6), fat: mf + rice * .4 / 130 + sum(7), rice };
}
/* [kcal, protein, fiber, carb, fat] */
const BREAKFAST_SUM = BREAKFAST.reduce((a, b) => [a[0] + b[3], a[1] + b[4], a[2] + b[5], a[3] + b[6], a[4] + b[7]], [0, 0, 0, 0, 0]);
/* daily macro targets (menu file: protein 110–118 g, carb 150–180 g, fat 35–50 g, fiber ≥ 20 g) */
const MACRO_T = { k: { lab: "Calo", u: "kcal", lo: 1440, t: 1540, hi: 1640, max: 1900 }, p: { lab: "Protein", u: "g", lo: 110, t: 118, hi: 999, max: 140 },
  c: { lab: "Carb", u: "g", lo: 150, t: 165, hi: 180, max: 220 }, f: { lab: "Fat", u: "g", lo: 35, t: 42, hi: 50, max: 65 }, fb: { lab: "Chất xơ", u: "g", lo: 20, t: 25, hi: 999, max: 35 } };
const MEALS = [["bf", "☀️", "Sáng"], ["lunch", "🌤️", "Trưa"], ["dinner", "🌙", "Tối"], ["snack", "🍪", "Vặt"]];

/* ---------- daily checklist ---------- */
const CHECKS = [["weigh", "Cân buổi sáng", "06:45"], ["water", "Uống 2.5 L nước", ""], ["steps", "Đi đủ 7,000 bước", ""], ["bf", "Sáng chuẩn (450 kcal · 36 g)", "07:00"],
  ["lunch", "Trưa: cơm + 3 món + ổi", "12:30"], ["move", "", "18:30"], ["dinner", "Tối: cơm + 3 món + táo, sữa chua", "19:45"], ["sleep", "Lên giường 22:30", ""]];
