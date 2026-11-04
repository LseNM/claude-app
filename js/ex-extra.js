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
for (const k of ["dbrow", "pullover", "birddog", "dbchop"]) { const fr = EX[k].frames; for (let i = 1; i < fr.length; i++) fr[i] = Object.assign({}, fr[i - 1], fr[i]); }
