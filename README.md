# Tết Body 2027

App cá nhân (PWA) cho challenge body recomposition 09/11/2026 → Tết 06/02/2027. Một bộ code chạy trên cả điện thoại lẫn laptop.

| Tab | Có gì |
|---|---|
| 🏠 Hôm nay | Cân + vòng eo, checklist 8 việc (giữ lửa ≥ 5/8), cốc nước, chọn món mặn (trưa = tối), lịch một ngày chuẩn, xuất tổng kết cho Claude Project |
| 🏋️ Gym | Buổi A/B/C, bản không máy tới 30/11, có máy từ 01/12; log kg × rep × RIR từng set, đổi bài khi máy bận, gợi ý tăng tạ (double progression), đồng hồ nghỉ, hướng dẫn + video từng bài, xuất log |
| 🗓️ Lộ trình | Gantt giai đoạn (target, checklist, phần thưởng, target sức mạnh), Tuần (review Chủ nhật + quy tắc chỉnh calo), Tháng (heatmap, ảnh, đường cân vs target) |
| 🍽️ Ăn | **Nhật ký** 4 bữa (vòng calo + thanh protein/carb/fat/xơ), thêm món bằng 📸 chụp hình · 🔍 gõ tên · 🎤 nói · ✏️ tự nhập, nút ✅ "ăn đúng thực đơn"; **Thực đơn** 1,540 kcal (theo file `Diet/Thực đơn 1 ngày - 1540 kcal.html` trong vault); **Tiến độ** calo, protein, tỉ lệ macro 7/14/30 ngày |

## v2.0 (05/11/2026)
- Dải **mục tiêu tuần / tháng** ở đầu mọi tab (app tự điền, bấm để sửa).
- **Ăn:** nồi nấu chung trưa + tối (nhập tổng gram đồ sống, mỗi bữa ½), icon từng món, bấm món → pop-up gram + calo; 📦 chụp nguyên liệu (AI đọc tên + số trên cân, app tự tính theo bảng 100 g) và 🍽️ chụp món ăn; gõ tên + gram.
- **Gym:** người tập (hình động) + sơ đồ cơ chính cho cả 25 bài; video ngay trong thẻ bài; thứ tự hướng dẫn: cách làm → đúng khi → sai khi → quay 1 set tự so.
- Bản lưu trước khi làm lại: `../archive/v1.1.0-2026-11-04/` và tag git `v1.1.0`.

## AI đọc ảnh (không cần server, không phát sinh phí)
- **Gemini** (chính): key tạo trong **project không bật billing** (AI Studio ghi Plan: Free). Hết lượt → lỗi 429, không tính tiền.
- **OpenRouter** (dự phòng, tự chuyển khi Gemini hết lượt): tài khoản không nạp tiền, chỉ dùng mô hình `:free` đọc được ảnh (khoảng 50 lượt/ngày). App tự lấy danh sách mô hình miễn phí từ `openrouter.ai/api/v1/models`.
- Hai key chỉ lưu trong trình duyệt của máy đó (không vào file sao lưu). Cách cuối, ẩn trong một nút nhỏ: copy lời nhắc sang Claude rồi dán kết quả.
- Cũng dùng để đọc tờ **InBody** (tab Lộ trình → giai đoạn → 📸 Chụp tờ InBody).
| 🔍 Tra cứu | Thẻ bài tập + món ăn, bộ lọc chọn nhiều ô |

## Dữ liệu ở đâu
- Code và nội dung bài tập, thực đơn: công khai (GitHub Pages).
- **Số cá nhân** (InBody, target, phần thưởng, câu "vì sao"): file `2. Areas/Health/Tết Body - dữ liệu cá nhân.json` trong vault. **Không đưa lên GitHub.** Mỗi máy nhập 1 lần: ☰ → Nhập file cá nhân.
- Log, tick, ảnh: lưu trong trình duyệt **của từng máy** (điện thoại và laptop không tự đồng bộ). Chuyển máy hoặc sao lưu: ☰ → Xuất sao lưu, rồi Nhập ở máy kia.
- Về Daily Tracking: nút **Xuất** tạo khối chữ để dán vào Claude Project.

## Cài thành app
- Điện thoại (Chrome): mở link → ⋮ → **Thêm vào màn hình chính**.
- Laptop (Edge): mở link → ⋯ → **Ứng dụng → Cài đặt trang này thành ứng dụng** → tick "tạo lối tắt trên màn hình nền".

## Dành cho dev
- Chạy thử: `python -m http.server 8770` trong thư mục này, mở http://127.0.0.1:8770/. Thêm `?date=2026-11-25` để giả lập ngày, `&nowelcome` để tắt màn chào.
- Mỗi lần sửa code: tăng `VERSION` trong `sw.js` (và `APP_VERSION` trong `js/data.js`) để máy đã cài nhận bản mới.
- Hình người que: `js/ex.js` (copy từ vault `Strength Training - Tóm tắt bài tập.html`) + `js/ex-extra.js` (4 bài không máy).
