"use strict";
/* Stick-figure exercise engine + exercise data, copied unchanged from vault "Strength Training - Tóm tắt bài tập.html" (lines 277-534). */
const PATTERNS = [
  { id: "squat", name: "Squat", vi: "ngồi xuống", c: "var(--squat)", hex: "#2a78d6",
    def: "Gối và hông cùng gập, thân tương đối thẳng.", src: "V2 01:33",
    muscles: "Đùi trước, mông, core.", quota: "Ít nhất 1 lần/tuần (khung tuần mẫu).",
    ladder: ["Goblet squat", "Leg press", "Barbell back squat", "Zercher squat"], ladderSrc: "thang theo V1 02:19",
    ex: ["goblet", "legpress"] },
  { id: "hinge", name: "Hinge", vi: "gập hông", c: "var(--hinge)", hex: "#eb6834",
    def: "Gập ở hông, lưng phẳng, gối tương đối thẳng. Hay bị bỏ vì khó vào form và không đốt mông ngay.", src: "V2 02:20, 02:43",
    muscles: "Mông, đùi sau, lưng dưới.", quota: "Ít nhất 1, tốt nhất 2 bài/tuần (V2 03:08).",
    ladder: ["Glute bridge, hip thrust", "Dumbbell RDL", "Single-leg RDL", "Barbell RDL, deadlift"], ladderSrc: "thứ tự gợi ý; bài lấy từ V2",
    ex: ["rdl", "hipthrust"] },
  { id: "lunge", name: "Lunge", vi: "một chân", c: "var(--lunge)", hex: "#1baf7a",
    def: "Mọi bài tập một chân. Cân bằng bên mạnh, bên yếu và rèn ổn định.", src: "V2 03:08, 03:33",
    muscles: "Chân, mông, thăng bằng.", quota: "Video không nêu số; tuần mẫu có 2 lần.",
    ladder: ["Reverse lunge, step-up", "Walking lunge", "Bulgarian split squat (tạ tay)", "Bulgarian split squat (barbell)"], ladderSrc: "người mới bắt đầu từ reverse lunge, step-up (V2 04:00)",
    ex: ["lunge", "stepup"] },
  { id: "push", name: "Push", vi: "đẩy 2 hướng", c: "var(--push)", hex: "#eda100",
    def: "Đẩy ngang: đẩy tạ ra xa ngực. Đẩy dọc: đẩy tạ lên qua đầu. Chỉ tập một hướng là thiếu.", src: "V2 04:44, 05:07",
    muscles: "Ngực, vai, tay sau.", quota: "Mỗi tuần 1 đẩy ngang + 1 đẩy dọc (V2 05:07).",
    ladder: ["Ngang: push-up → DB bench → bench press", "Dọc: DB shoulder press → landmine press → overhead press"], ladderSrc: "bài lấy từ V2",
    ex: ["bench", "ohp", "pushup"] },
  { id: "pull", name: "Pull", vi: "kéo 2 hướng", c: "var(--pull)", hex: "#e87ba4",
    def: "Kéo dọc: kéo tạ xuống hoặc kéo người lên. Kéo ngang: kéo tạ vào người. Hay bị thiếu trong lịch tập của nữ.", src: "V2 05:07, 05:31",
    muscles: "Lưng, vai sau, tay trước; tốt cho tư thế.", quota: "Kéo nhiều hơn đẩy một chút nếu ngồi bàn giấy nhiều (V2 05:56).",
    ladder: ["Dọc: lat pulldown → assisted pull-up → pull-up", "Ngang: cable row → DB row → gorilla row"], ladderSrc: "bài lấy từ V2",
    ex: ["pulldown", "row"] },
  { id: "carry", name: "Carry", vi: "mang tạ đi", c: "var(--carry)", hex: "#008300",
    def: "Cầm tạ và đi. Tay nắm, vai, core, tư thế, nhịp thở cùng làm việc; core học giữ cột sống khi có tải.", src: "V2 06:16, 06:43",
    muscles: "Tay nắm, cẳng tay, vai, core.", quota: "1–2 lần/tuần, ở cuối buổi (V2 06:43).",
    ladder: ["Farmer's carry", "Suitcase carry", "Front-loaded carry", "Waiter walk"], ladderSrc: "bài lấy từ V2",
    ex: ["farmer", "suitcase"] },
  { id: "rot", name: "Rotation", vi: "xoay / chống xoay", c: "var(--rot)", hex: "#6250d6",
    def: "Rotation: xoay thân có tải. Anti-rotation: giữ thân không bị xoay. Crunch chỉ tập được một việc của core.", src: "V2 06:43, 07:34",
    muscles: "Core, cơ chéo bụng.", quota: "Cả xoay và chống xoay mỗi tuần (V2 07:34).",
    ladder: ["Chống xoay: dead bug, bird dog → Pallof press", "Xoay: Russian twist → cable wood chop → rotational slam"], ladderSrc: "bài lấy từ V2",
    ex: ["deadbug", "pallof", "chop"] }
];

/* ---------- stick-figure engine ---------- */
const L = { torso: 52, thigh: 40, shin: 40, ua: 30, fa: 28, neck: 16, foot: 10 };
const RAD = Math.PI / 180;
const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
const pol = (len, ang) => [len * Math.sin(ang * RAD), len * Math.cos(ang * RAD)];  // ang 0 = down, 90 = forward, 180 = up
const f1 = n => n.toFixed(1);
function ik(root, target, l1, l2, bend) {
  const dx = target[0] - root[0], dy = target[1] - root[1];
  const d = Math.hypot(dx, dy) || .001;
  const dd = Math.min(l1 + l2 - .3, Math.max(Math.abs(l1 - l2) + .3, d));
  const A = Math.acos(Math.max(-1, Math.min(1, (l1 * l1 + dd * dd - l2 * l2) / (2 * l1 * dd))));
  const a = Math.atan2(dy, dx) + bend * A;
  const j = [root[0] + l1 * Math.cos(a), root[1] + l1 * Math.sin(a)];
  const ex = target[0] - j[0], ey = target[1] - j[1], e = Math.hypot(ex, ey) || .001;
  return [j, [j[0] + ex / e * l2, j[1] + ey / e * l2]];
}
function solve(P) {
  const J = { hip: P.hip };
  J.sh = add(P.hip, pol(L.torso, P.t));
  J.head = add(J.sh, pol(L.neck, P.t + (P.ht || 0)));
  const hw = P.front ? 8 : 0, sw = P.front ? 16 : 0;
  const leg = (foot, kb, fang, side) => {
    const root = [P.hip[0] + side * hw, P.hip[1]];
    const [k, a] = ik(root, foot, L.thigh, L.shin, kb);
    return { root, k, a, toe: add(a, pol(P.front ? 6 : L.foot, fang)) };
  };
  const arm = (hand, eb, side) => {
    const root = [J.sh[0] + side * sw, J.sh[1]];
    const [e, h] = ik(root, hand, L.ua, L.fa, eb);
    return { root, e, h };
  };
  J.leg = leg(P.foot, P.kb ?? -1, P.fang ?? 90, 1);
  if (P.foot2) J.leg2 = leg(P.foot2, P.kb2 ?? (P.front ? 1 : (P.kb ?? -1)), P.fang2 ?? (P.front ? -90 : (P.fang ?? 90)), -1);
  if (P.hand) J.arm = arm(P.hand, P.eb ?? 1, 1);
  if (P.hand2) J.arm2 = arm(P.hand2, P.eb2 ?? (P.eb ?? 1), -1);
  return J;
}
const NEAR = "#2f3a48", FAR = "#aab3be", MS = "#c2c7cf", MF = "#eceef1", BAR = "#3b4552";
const ln = (a, b, c, w, extra = "") => `<line x1="${f1(a[0])}" y1="${f1(a[1])}" x2="${f1(b[0])}" y2="${f1(b[1])}" stroke="${c}" stroke-width="${w}" stroke-linecap="round" ${extra}/>`;
const box = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${MF}" stroke="${MS}" stroke-width="2"/>`;
const db = (p, c) => ln([p[0] - 9, p[1]], [p[0] + 9, p[1]], BAR, 3) + `<rect x="${f1(p[0] - 13)}" y="${f1(p[1] - 6)}" width="5" height="12" rx="1.5" fill="${c}"/><rect x="${f1(p[0] + 8)}" y="${f1(p[1] - 6)}" width="5" height="12" rx="1.5" fill="${c}"/>`;
const dbv = (p, c) => ln([p[0], p[1] - 9], [p[0], p[1] + 9], BAR, 3) + `<rect x="${f1(p[0] - 6)}" y="${f1(p[1] - 14)}" width="12" height="5" rx="1.5" fill="${c}"/><rect x="${f1(p[0] - 6)}" y="${f1(p[1] + 9)}" width="12" height="5" rx="1.5" fill="${c}"/>`;
const disc = (p, c, r = 8) => `<circle cx="${f1(p[0])}" cy="${f1(p[1])}" r="${r}" fill="${c}" stroke="#fff" stroke-width="2"/><circle cx="${f1(p[0])}" cy="${f1(p[1])}" r="2.5" fill="${BAR}"/>`;
const txt = (x, y, s, anchor = "start") => `<text x="${x}" y="${y}" font-size="11" fill="#898781" text-anchor="${anchor}">${s}</text>`;
const ground = ln([0, 181], [220, 181], "#dcd9cf", 2);

function figure(J, P) {
  const limb = (l, c) => ln(l.root, l.k, c, 7) + ln(l.k, l.a, c, 7) + ln(l.a, l.toe, c, 5);
  const farC = P.front ? NEAR : FAR;
  let s = "";
  if (J.leg2) s += limb(J.leg2, farC);
  if (J.arm2) s += ln(J.arm2.root, J.arm2.e, farC, 6) + ln(J.arm2.e, J.arm2.h, farC, 6);
  s += ln(J.hip, J.sh, NEAR, 9);
  if (P.front) s += ln([J.sh[0] - 16, J.sh[1]], [J.sh[0] + 16, J.sh[1]], NEAR, 8) + ln([J.hip[0] - 8, J.hip[1]], [J.hip[0] + 8, J.hip[1]], NEAR, 8);
  s += `<circle cx="${f1(J.head[0])}" cy="${f1(J.head[1])}" r="10" fill="${NEAR}"/>`;
  s += limb(J.leg, NEAR);
  return s;
}
const nearArm = J => J.arm ? ln(J.arm.root, J.arm.e, NEAR, 6) + ln(J.arm.e, J.arm.h, NEAR, 6) : "";

/* exercises: frames are merged onto the previous frame, so only changes are listed */
const EX = {
  goblet: { name: "Goblet squat", vi: "Squat ôm tạ trước ngực", tag: "squat",
    frames: [{ hip: [100, 101], t: 180, foot: [100, 180], foot2: [94, 180], hand: [118, 64], hand2: [116, 64] },
             { hip: [78, 140], t: 150, hand: [124, 106], hand2: [122, 106] }],
    front: (J, P, c) => dbv(J.arm.h, c),
    cues: ["Ôm một đầu tạ sát ngực, chân rộng bằng vai, mũi chân hơi mở.", "Ngồi xuống giữa hai gót, gối đi theo hướng mũi chân.", "Ngực thẳng, đạp cả bàn chân để đứng lên."],
    bad: "gối sụp vào trong, gót nhấc khỏi sàn." },
  legpress: { name: "Leg press", vi: "Đạp đùi trên máy", tag: "squat",
    frames: [{ hip: [80, 140], t: -140, foot: [140, 90], foot2: [137, 93], fang: -140, hand: [90, 150], eb: -1 },
             { foot: [118, 108], foot2: [115, 111] }],
    back: (J) => {
      const d = [0.766, -0.643], n = [0.643, 0.766];
      const f = J.leg.a, pc = add(f, [d[0] * 6, d[1] * 6]);
      return ln([76, 152], [36, 106], MS, 10) + ln([60, 156], [100, 156], MS, 8) + ln([92, 168], [196, 81], MS, 3) +
        ln(add(pc, [-n[0] * 22, -n[1] * 22]), add(pc, [n[0] * 14, n[1] * 14]), BAR, 6) + ground;
    },
    cues: ["Lưng và hông áp sát đệm, chân rộng bằng hông giữa bàn đạp.", "Hạ đến khi hông vẫn còn dính đệm.", "Đẩy bằng cả bàn chân, không khóa thẳng gối ở trên."],
    bad: "hạ quá sâu làm mông cuộn khỏi đệm." },
  rdl: { name: "Romanian deadlift (RDL)", vi: "Gập hông với tạ tay", tag: "hinge",
    frames: [{ hip: [100, 102], t: 180, foot: [100, 180], foot2: [94, 180], hand: [104, 108], hand2: [102, 108] },
             { hip: [80, 110], t: 118, hand: [114, 140], hand2: [112, 140] }],
    front: (J, P, c) => db(J.arm.h, c),
    cues: ["Gối hơi chùng, đẩy hông ra sau như đóng cửa bằng mông.", "Tạ trượt sát đùi, lưng phẳng suốt động tác.", "Hạ đến khi căng đùi sau, siết mông để đứng lên."],
    bad: "cong lưng, hoặc gập gối nhiều thành squat." },
  hipthrust: { name: "Hip thrust", vi: "Đẩy hông, lưng tựa ghế", tag: "hinge",
    frames: [{ hip: [90, 160], t: -112, foot: [140, 180], foot2: [134, 180], hand: [98, 149], hand2: [96, 149] },
             { hip: [100, 138], t: -90, hand: [104, 128], hand2: [102, 128] }],
    back: () => box(0, 144, 50, 10) + ln([8, 154], [8, 180], MS, 4) + ln([42, 154], [42, 180], MS, 4),
    front: (J, P, c) => disc([J.hip[0], J.hip[1] - 9], c, 9),
    cues: ["Mép ghế ngay dưới bả vai, tạ đặt trên nếp hông.", "Ở đỉnh, cẳng chân thẳng đứng; cằm hơi cúi.", "Đạp gót, siết mông ở đỉnh, không ưỡn lưng dưới."],
    bad: "ưỡn lưng thay vì duỗi hông." },
  lunge: { name: "Reverse lunge", vi: "Bước lùi", tag: "lunge",
    frames: [{ hip: [100, 101], t: 180, foot: [106, 180], foot2: [98, 180], hand: [103, 108], hand2: [101, 108] },
             { hip: [84, 136], t: 178, foot: [108, 180], foot2: [44, 171], fang2: 60, hand: [87, 142], hand2: [85, 142] }],
    front: (J, P, c) => db(J.arm.h, c),
    cues: ["Bước lùi một bước dài, gối sau hạ gần sàn.", "Phần lớn lực đặt ở chân trước.", "Đạp gót chân trước để về vị trí."],
    bad: "gối trước sụp vào trong, thân đổ nhiều về trước." },
  stepup: { name: "Step-up", vi: "Bước lên bục", tag: "lunge",
    frames: [{ hip: [100, 104], t: 180, foot: [132, 160], foot2: [96, 180], hand: [103, 110], hand2: [101, 110] },
             { hip: [120, 90], foot2: [110, 150], hand: [123, 96], hand2: [121, 96] },
             { hip: [134, 82], foot: [134, 160], foot2: [128, 160], hand: [137, 88], hand2: [135, 88] }],
    back: () => box(118, 160, 62, 21),
    front: (J, P, c) => db(J.arm.h, c),
    cues: ["Đặt cả bàn chân lên bục.", "Đẩy người lên bằng chân trên, hạn chế bật chân dưới.", "Bước xuống chậm, có kiểm soát."],
    bad: "bật chân dưới để lấy đà." },
  bench: { name: "Dumbbell bench press", vi: "Đẩy ngực tạ tay (đẩy ngang)", tag: "push",
    frames: [{ hip: [120, 128], t: -90, foot: [152, 180], foot2: [146, 180], hand: [70, 72], hand2: [68, 72] },
             { hand: [76, 122], hand2: [74, 122] }],
    back: () => box(30, 136, 112, 8) + ln([42, 144], [42, 180], MS, 4) + ln([130, 144], [130, 180], MS, 4),
    front: (J, P, c) => disc(J.arm.h, c),
    cues: ["Ép bả vai ra sau và xuống, bàn chân vững trên sàn.", "Hạ tạ ngang ngực giữa, khuỷu khoảng 45° so với thân.", "Đẩy lên thẳng phía trên vai."],
    bad: "dang khuỷu 90°, mông nhấc khỏi ghế." },
  ohp: { name: "Seated shoulder press", vi: "Đẩy vai ngồi (đẩy dọc)", tag: "push",
    frames: [{ hip: [92, 148], t: 180, foot: [128, 180], foot2: [124, 180], hand: [104, 92], hand2: [102, 92] },
             { hand: [96, 40], hand2: [94, 40] }],
    back: () => box(72, 152, 46, 8) + ln([95, 160], [95, 180], MS, 4) + ln([76, 152], [76, 92], MS, 8),
    front: (J, P, c) => disc(J.arm.h, c),
    cues: ["Lưng tựa ghế, tạ bắt đầu ngang vai.", "Đẩy thẳng lên, không ưỡn lưng.", "Hạ chậm về ngang vai."],
    bad: "ưỡn lưng để đẩy tạ quá nặng." },
  pushup: { name: "Push-up", vi: "Hít đất (đẩy ngang)", tag: "push",
    frames: [{ hip: [102.6, 145.3], t: 114.2, foot: [29.6, 172], foot2: [27, 172], fang: 20, hand: [150, 178], hand2: [146, 178] },
             { hip: [109.2, 169.5], t: 96 }],
    cues: ["Tay rộng hơn vai một chút.", "Thân thẳng một đường từ đầu đến gót.", "Ngực xuống gần sàn, khuỷu khoảng 45°. Chưa đủ sức thì chống gối."],
    bad: "võng hông hoặc chổng mông." },
  pulldown: { name: "Lat pulldown", vi: "Kéo xô trên máy (kéo dọc)", tag: "pull",
    frames: [{ hip: [88, 148], t: 188, foot: [124, 180], foot2: [120, 180], hand: [94, 43], hand2: [92, 43] },
             { hand: [94, 104], hand2: [92, 104] }],
    back: (J) => ln([160, 8], [160, 180], MS, 6) + ln([96, 10], [160, 10], MS, 6) + box(70, 152, 46, 8) + ln([93, 160], [93, 180], MS, 4) +
      box(108, 124, 22, 8) + ln([96, 12], J.arm.h, BAR, 2),
    front: (J) => `<circle cx="${f1(J.arm.h[0])}" cy="${f1(J.arm.h[1])}" r="4.5" fill="${BAR}"/>`,
    cues: ["Kẹp đùi dưới đệm, ngồi thẳng, ngả nhẹ ra sau.", "Kéo thanh về ngực trên, dẫn bằng khuỷu.", "Ép bả vai xuống; thả lên chậm."],
    bad: "giật cả người ra sau để kéo." },
  row: { name: "Seated cable row", vi: "Kéo cáp ngồi (kéo ngang)", tag: "pull",
    frames: [{ hip: [80, 148], t: 165, foot: [150, 160], foot2: [147, 162], fang: 160, hand: [144, 114], hand2: [142, 114] },
             { t: 186, hand: [100, 118], hand2: [98, 118] }],
    back: (J) => box(40, 152, 72, 8) + ln([60, 160], [60, 180], MS, 4) + ln([96, 160], [96, 180], MS, 4) + box(162, 60, 14, 121) +
      ln([156, 146], [156, 178], MS, 6) + ln(J.arm.h, [162, 114], BAR, 2),
    front: (J) => ln([J.arm.h[0], J.arm.h[1] - 6], [J.arm.h[0], J.arm.h[1] + 6], BAR, 4),
    cues: ["Ngồi thẳng, gối hơi chùng.", "Kéo tay cầm về bụng, ép bả vai ra sau.", "Thả ra chậm, không cúi cả người theo."],
    bad: "đánh lưng ra trước, sau để lấy đà." },
  farmer: { name: "Farmer's carry", vi: "Xách tạ hai tay đi", tag: "carry",
    frames: [{ hip: [100, 102], t: 180, foot: [86, 180], foot2: [116, 180], hand: [104, 110], hand2: [102, 110] },
             { hip: [102, 101], foot: [118, 180], foot2: [86, 180], hand: [106, 109], hand2: [104, 109] }],
    back: () => ln([150, 40], [196, 40], "#c2c7cf", 2, 'stroke-dasharray="4 5"') + `<path d="M196 35 L204 40 L196 45" fill="none" stroke="#c2c7cf" stroke-width="2"/>` + txt(150, 30, "20–40 m"),
    front: (J, P, c) => db(J.arm.h, c),
    cues: ["Hai tay cầm tạ nặng, đứng thẳng, vai hạ.", "Bước ngắn, đều; siết bụng.", "Đi 20–40 m rồi mới đặt xuống."],
    bad: "rụt vai, người đổ về trước." },
  suitcase: { name: "Suitcase carry", vi: "Xách tạ một tay đi (nhìn trực diện)", tag: "carry",
    frames: [{ front: true, hip: [100, 100], t: 180, foot: [110, 180], foot2: [90, 174], hand: [124, 108], hand2: [78, 106], eb: -1, eb2: 1 },
             { foot: [110, 174], foot2: [90, 180] }],
    back: () => ln([100, 6], [100, 180], "#d9d6cc", 2, 'stroke-dasharray="4 5"') + txt(104, 14, "thân thẳng"),
    front: (J, P, c) => disc(J.arm.h, c, 9),
    cues: ["Một tay cầm tạ, tay kia thả lỏng.", "Thân không nghiêng về bên có tạ.", "Đi hết quãng rồi đổi tay."],
    bad: "nghiêng người về phía tạ." },
  deadbug: { name: "Dead bug", vi: "Nằm ngửa duỗi tay chân đối diện (chống xoay)", tag: "rot",
    frames: [{ hip: [112, 170], t: -90, foot: [152, 132], foot2: [150, 134], fang: 180, fang2: 180, hand: [60, 114], hand2: [56, 114] },
             { hand: [4, 160], foot2: [190, 164], fang2: 150 }],
    cues: ["Nằm ngửa, lưng dưới áp sàn, tay hướng trần, chân gập 90°.", "Duỗi một tay ra sau và chân đối diện ra trước.", "Thở ra khi duỗi, làm chậm, đổi bên."],
    bad: "lưng dưới cong lên khỏi sàn." },
  pallof: { name: "Pallof press", vi: "Đẩy cáp chống xoay (nhìn từ trên xuống)", tag: "rot",
    frames: [{ ext: 0 }, { ext: 1 }],
    custom: (P, c) => {
      const hand = [130, 108 + P.ext * 46], shL = [106, 92], shR = [154, 92];
      const [eL, hL] = ik(shL, hand, 30, 28, 1), [eR, hR] = ik(shR, hand, 30, 28, -1);
      return box(10, 84, 22, 32) + txt(8, 132, "cột cáp") +
        ln([32, 100], hand, c, 2.5) +
        `<path d="M 158 66 A 40 40 0 0 0 100 64" fill="none" stroke="#c2c7cf" stroke-width="2"/><path d="M 104 58 L 98 64 L 106 68" fill="none" stroke="#c2c7cf" stroke-width="2"/>` +
        txt(130, 50, "cáp muốn kéo thân xoay", "middle") +
        ln(shL, eL, FAR, 6) + ln(eL, hL, FAR, 6) + ln(shR, eR, NEAR, 6) + ln(eR, hR, NEAR, 6) +
        ln(shL, shR, NEAR, 14) + `<circle cx="130" cy="92" r="12" fill="${NEAR}"/>` +
        `<circle cx="${f1(hand[0])}" cy="${f1(hand[1])}" r="5" fill="${BAR}"/>` + txt(130, 192, "ngực luôn hướng thẳng", "middle");
    },
    cues: ["Đứng ngang cột cáp, tay cầm ở giữa ngực.", "Đẩy thẳng ra trước, giữ 1–2 giây.", "Thân không xoay về phía cột, rồi thu tay về."],
    bad: "để thân xoay theo cáp." },
  chop: { name: "Cable wood chop", vi: "Kéo cáp chéo người (xoay, nhìn trực diện)", tag: "rot",
    frames: [{ front: true, hip: [100, 102], t: 186, foot: [118, 180], foot2: [82, 180], hand: [62, 54], hand2: [62, 54], eb: -1, eb2: -1 },
             { hip: [100, 110], t: 174, hand: [128, 108], hand2: [128, 108] }],
    back: (J) => box(4, 4, 18, 177) + ln([22, 22], J.arm.h, BAR, 2),
    front: (J) => `<circle cx="${f1(J.arm.h[0])}" cy="${f1(J.arm.h[1])}" r="5" fill="${BAR}"/>`,
    cues: ["Ròng rọc đặt cao, đứng ngang cột, chân rộng.", "Kéo chéo từ cao bên này xuống thấp bên kia.", "Xoay từ thân và hông, tay gần như thẳng."],
    bad: "chỉ kéo bằng tay, thân không xoay." }
};
for (const k in EX) { const fr = EX[k].frames; for (let i = 1; i < fr.length; i++) fr[i] = Object.assign({}, fr[i - 1], fr[i]); }

function lerp(a, b, t) {
  if (typeof a === "number") return a + (b - a) * t;
  if (Array.isArray(a)) return a.map((v, i) => lerp(v, b[i], t));
  return t < .5 ? a : b;
}
function lerpPose(A, B, t) { const o = {}; for (const k in A) o[k] = k in B ? lerp(A[k], B[k], t) : A[k]; return o; }
function scene(ex, P, color) {
  if (ex.custom) return ex.custom(P, color);
  const J = solve(P);
  return (ex.back ? ex.back(J, P, color) : "") + (ex.back && ex.back.toString().includes("ground") ? "" : ground) + figure(J, P) + nearArm(J) + (ex.front ? ex.front(J, P, color) : "");
}

let MOTION = !matchMedia("(prefers-reduced-motion: reduce)").matches && !/[?&]static/.test(location.search);
const live = [];
function mountEx(id, el, color) {
  const ex = EX[id];
  live.push({ ex, el, color, t0: performance.now() + Math.random() * 300 });
}
function drawStatic(o) {
  const fr = o.ex.frames;
  o.el.innerHTML = `<g opacity=".28">${scene(o.ex, fr[0], o.color)}</g>` + scene(o.ex, fr[fr.length - 1], o.color);
}
const SEG = 1300, HOLD = 380;
function tick(now) {
  for (const o of live) {
    if (!MOTION) continue;
    const fr = o.ex.frames, n = fr.length, seq = [];
    for (let i = 0; i < n; i++) seq.push(i);
    for (let i = n - 2; i > 0; i--) seq.push(i);
    const steps = seq.length, per = SEG + HOLD, T = ((now - o.t0) % (steps * per) + steps * per) % (steps * per), s = Math.floor(T / per), u = Math.min(1, (T % per) / SEG);
    const e = (1 - Math.cos(Math.PI * u)) / 2;
    o.el.innerHTML = scene(o.ex, lerpPose(fr[seq[s]], fr[seq[(s + 1) % steps]], e), o.color);
  }
  requestAnimationFrame(tick);
}

/* ---------- small API for the preview pages ---------- */
const FIG = {
  mount(el, id, color = "#c8302c") {
    const o = { ex: EX[id], el, color, t0: performance.now() + Math.random() * 300 };
    if (!o.ex) return;
    live.push(o); drawStatic(o);
  }
};
setInterval(() => { for (let i = live.length - 1; i >= 0; i--) if (!live[i].el.isConnected) live.splice(i, 1); }, 1500);
requestAnimationFrame(tick);
