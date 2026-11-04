"use strict";
/* No-machine stand-ins (used until 30/11). Same stick-figure engine as ex.js. Load after ex.js. */
Object.assign(EX, {
  dbrow: { name: "One-arm DB row", vi: "Kéo tạ tay một tay, chống ghế (kéo ngang · không máy)", tag: "pull",
    frames: [{ hip: [78, 106], t: 102, foot: [86, 180], foot2: [52, 180], kb2: -1, hand: [127, 152], hand2: [162, 132], eb: 1, eb2: 1 },
             { hand: [102, 122] }],
    back: () => box(150, 132, 62, 8) + ln([158, 140], [158, 180], MS, 4) + ln([204, 140], [204, 180], MS, 4),
    front: (J, P, c) => disc(J.arm.h, c, 7),
    cues: ["Một tay chống ghế, lưng phẳng gần song song sàn, chân trụ hơi chùng.", "Kéo tạ về phía hông, dẫn bằng khuỷu, ép bả vai ra sau.", "Hạ chậm đến khi tay duỗi hẳn; thân không xoay theo tạ."],
    bad: "xoay người hoặc giật tạ bằng lưng." },
  pullover: { name: "DB pullover", vi: "Nằm ghế đưa tạ qua đầu (thay kéo dọc khi chưa dùng máy)", tag: "pull",
    frames: [{ hip: [120, 128], t: -90, foot: [152, 180], foot2: [146, 180], hand: [70, 76], hand2: [68, 76], eb: 1, eb2: 1 },
             { hand: [20, 116], hand2: [18, 116] }],
    back: () => box(30, 136, 112, 8) + ln([42, 144], [42, 180], MS, 4) + ln([130, 144], [130, 180], MS, 4),
    front: (J, P, c) => dbv(J.arm.h, c),
    cues: ["Nằm ngửa trên ghế, hai tay ôm một đầu tạ phía trên ngực.", "Tay hơi chùng, hạ tạ ra sau đầu đến khi căng nách và lưng.", "Kéo tạ về trên ngực bằng lưng; siết bụng để lưng dưới không ưỡn."],
    bad: "ưỡn lưng dưới, hoặc gập khuỷu nhiều thành bài tay sau." },
  birddog: { name: "Bird dog", vi: "Quỳ bốn điểm, duỗi tay và chân đối diện (chống xoay · không máy)", tag: "rot",
    frames: [{ hip: [130, 128], t: -90, ht: 0, foot: [170, 177], foot2: [168, 177], kb: 1, kb2: 1, fang: 90, fang2: 90, hand: [80, 178], hand2: [76, 178], eb: 1, eb2: 1 },
             { hand2: [22, 122], foot: [208, 128], fang: 90 }],
    cues: ["Quỳ bốn điểm: tay dưới vai, gối dưới hông, lưng phẳng.", "Duỗi một tay ra trước và chân bên kia ra sau, giữ 2 giây.", "Hông không xoay, không nghiêng; thu về rồi đổi bên."],
    bad: "xoay hông hoặc ưỡn lưng khi duỗi chân." },
  dbchop: { name: "DB wood chop", vi: "Xoay chéo người với tạ tay (xoay · không máy, nhìn trực diện)", tag: "rot",
    frames: [{ front: true, hip: [100, 102], t: 186, foot: [118, 180], foot2: [82, 180], hand: [62, 54], hand2: [62, 54], eb: -1, eb2: -1 },
             { hip: [100, 110], t: 174, hand: [128, 120], hand2: [128, 120] }],
    front: (J, P, c) => disc(J.arm.h, c, 8),
    cues: ["Hai tay cầm một tạ tay ở trên vai một bên, chân rộng hơn vai.", "Kéo chéo xuống ngoài gối bên kia, xoay từ thân và hông.", "Đi lên chậm, có kiểm soát; đủ rep rồi đổi bên."],
    bad: "chỉ vung bằng tay, thân không xoay." }
});
/* v2: athlete figures for the 5 accessory lifts (were emoji only). tag "extra" = Bài phụ. */
Object.assign(EX, {
  curl: { name: "DB curl", vi: SIMPLE_EX.curl.vi, tag: "extra",
    frames: [{ hip: [100, 102], t: 180, foot: [104, 180], foot2: [96, 180], hand: [104, 106], hand2: [100, 106], eb: -1, eb2: -1 }, { hand: [118, 60], hand2: [114, 60] }],
    front: (J, P, c) => db(J.arm.h, c), cues: SIMPLE_EX.curl.cues, bad: SIMPLE_EX.curl.bad },
  triceps: { name: "Triceps overhead", vi: SIMPLE_EX.triceps.vi, tag: "extra",
    frames: [{ hip: [100, 120], t: 180, foot: [106, 180], foot2: [94, 180], hand: [80, 52], hand2: [80, 52], eb: 1, eb2: 1 }, { hand: [102, 18], hand2: [102, 18] }],
    front: (J, P, c) => dbv(J.arm.h, c), cues: SIMPLE_EX.triceps.cues, bad: SIMPLE_EX.triceps.bad },
  rfly: { name: "DB reverse fly", vi: SIMPLE_EX.rfly.vi, tag: "extra",
    frames: [{ hip: [86, 104], t: 128, foot: [92, 180], foot2: [84, 180], hand: [128, 126], hand2: [124, 126], eb: 1, eb2: 1 }, { hand: [146, 94], hand2: [118, 92] }],
    front: (J, P, c) => db(J.arm.h, c), cues: SIMPLE_EX.rfly.cues, bad: SIMPLE_EX.rfly.bad },
  facepull: { name: "Face pull", vi: SIMPLE_EX.facepull.vi, tag: "extra",
    frames: [{ hip: [90, 102], t: 186, foot: [98, 180], foot2: [80, 180], hand: [146, 50], hand2: [144, 52], eb: -1, eb2: -1 }, { hand: [104, 36], hand2: [102, 38] }],
    back: J => ln([198, 8], [198, 180], MS, 6) + `<circle cx="192" cy="50" r="5" fill="${MF}" stroke="${MS}" stroke-width="2"/>` + ln(J.arm.h, [192, 50], BAR, 2),
    cues: SIMPLE_EX.facepull.cues, bad: SIMPLE_EX.facepull.bad },
  assist: { name: "Assisted pull-up", vi: SIMPLE_EX.assist.vi, tag: "extra",
    frames: [{ hip: [100, 118], t: 180, foot: [62, 158], foot2: [60, 158], kb: -1, kb2: -1, fang: -90, fang2: -90, hand: [104, 12], hand2: [100, 12], eb: -1, eb2: -1 }, { hip: [100, 86], foot: [62, 126], foot2: [60, 126] }],
    back: J => ln([60, 10], [160, 10], MS, 6) + ln([160, 10], [160, 180], MS, 6) + box(62, Math.round(J.leg.k[1] + 6), 56, 8) + ln([150, J.leg.k[1] + 14], [150, 180], MS, 4),
    cues: SIMPLE_EX.assist.cues, bad: SIMPLE_EX.assist.bad }
});
for (const k of ["dbrow", "pullover", "birddog", "dbchop", "curl", "triceps", "rfly", "facepull", "assist"]) { const fr = EX[k].frames; for (let i = 1; i < fr.length; i++) fr[i] = Object.assign({}, fr[i - 1], fr[i]); }
