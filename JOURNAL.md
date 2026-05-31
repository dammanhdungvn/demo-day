# JOURNAL — Team 49

> Weekly learning journal. **Update bắt buộc trước mỗi PR.**
> Format mỗi entry: features đã ship, AI tool đã dùng, vấn đề khó nhất tuần, plan tuần tới.

---

## Sprint 0 — Tuần khởi động (24/05/2026 – 31/05/2026)

### 🎯 Mục tiêu tuần
Khởi động dự án — chọn được nhóm đề tài + shortlist 3 phương án ứng cử + nghiên cứu thị trường + setup hạ tầng GitHub.

### ✅ Đã hoàn thành (shipped)

1. **Rà soát ngân hàng đề 250 đề tài × 10 nhóm lĩnh vực.**
   - Loại 8/10 nhóm sớm vì thiếu domain knowledge (y tế, bảo mật, robotics, BĐS, vận tải…).
   - Khoanh vùng nhóm AI Literacy (081–091) làm nhóm chính.

2. **Shortlist 3 phương án trong nhóm AI Literacy:**
   - AI20K-084 (Competency Assessment) — backup
   - AI20K-086 (Use Case Discovery) — backup
   - AI20K-089 (AI Automation Learning) — **candidate ưu tiên**

3. **Nghiên cứu thị trường có dẫn chứng (cho AI20K-089):**
   - Market size global no-code AI: $4.28–6.56B (2024) → $44–75B (2033), CAGR 30–38%.
   - Insight VN: 62% SME muốn đào tạo AI nhưng chỉ 15% có người làm — **gap rõ ràng**.
   - Validation cầu thị trường: Udemy n8n course có 55,000+ students; n8n vừa raise Series C định giá $2.5B.
   - Phân tích 4 buyer segment (SME owner / freelancer / ops exec / L&D corporate).

4. **Khởi tạo GitHub repo cá nhân (nháp)** — `lucasaivn/ai20k-team49` (public).

5. **Setup repo official `C2-App-049`:**
   - Clone về máy, chạy `setup_hooks.ps1` thành công (pre-push hook đã cài).
   - Tạo `.env` từ `.env.example` với AI_LOG_SERVER + API_KEY chương trình cung cấp.
   - Migrate README chi tiết sang repo official.
   - Khởi tạo JOURNAL.md + WORKLOG.md (file này).

### 🤖 AI tools đã dùng tuần này

| Tool | Mục đích | Đánh giá hiệu quả |
|---|---|---|
| **Claude Code (Sonnet 4.7)** | Phân tích 250 đề, lọc xuống 3 phương án, soạn README, market research với citation | Cực hiệu quả — tiết kiệm ~3 buổi research nếu làm tay. Đặc biệt tốt ở khâu phân tích pros/cons có hệ thống và format output thành bảng |
| **ChatGPT (web)** | Hỏi nhanh về thị trường no-code, đối chiếu chéo số liệu | Phù hợp khi cần answer nhanh, nhưng số liệu cần check lại từ nguồn gốc |

**Bài học về cách dùng AI hiệu quả tuần này:**
- Khi đưa AI việc "phân tích 3 phương án", phải cho đầy đủ context (background team, tiêu chí đánh giá, ràng buộc) thì output mới sắc — nếu chỉ nói "phân tích pros/cons" sẽ ra danh sách generic.
- Phân chia task lớn thành các bước nhỏ giúp AI làm sâu hơn từng bước thay vì làm rộng nhưng nông.

### 🔥 Vấn đề khó nhất tuần — và cách giải

**Vấn đề:** Trong nhóm AI Literacy có 11 đề (081–091), khó phân biệt vì cùng lĩnh vực và tên gần giống nhau. Đọc đề thô không đủ để chọn.

**Cách giải:**
1. Xây 3 tiêu chí filter cứng (thực chiến / B2B value / team advantage) → loại được 8 đề ngay.
2. Với 3 đề còn lại, không chọn theo gut feel mà **viết pros/cons có cấu trúc** rồi so sánh.
3. Đặc biệt cho từng phương án, hỏi câu kiểm tra: *"Nếu chọn đề này, demo cuối kỳ sẽ trông thế nào? Demo đó có thuyết phục không?"* — giúp loại được những đề khó demo.

**Kết quả:** Có được lý do giải thích được tại sao ưu tiên 089, không phải "vì nó hay" mà vì có ràng buộc demo + market validation rõ ràng.

### 🔁 Nếu làm lại tuần này, sẽ làm khác chỗ nào?

- **Đặt deadline cứng cho khâu lọc đề** (3 giờ thay vì kéo dài cả ngày). Việc lọc đề có "diminishing return" — sau 3 tiếng ra 3 phương án thì dừng lại analysis paralysis.
- **Phỏng vấn ít nhất 1 user thực ngay tuần này**, đừng đợi đến Sprint 1. Có 1 cuộc phỏng vấn 30 phút với chủ SME bất kỳ sẽ thay đổi cách team đánh giá 3 phương án.
- **Setup repo official sớm hơn**, không tạo repo cá nhân trước. Đỡ phải migrate.

### 📅 Plan tuần tới — Sprint 1

| Việc | Người làm | Deadline |
|---|---|---|
| Phỏng vấn 3–5 SME owner / freelancer về pain point AI automation | TBD | Hết tuần |
| Validate giả định kỹ thuật: sandbox workflow có khả thi không? (POC nhỏ) | TBD | T4 |
| **Quyết định chính thức: chốt 089 hoặc đổi sang 086/084** | Cả team | T5 |
| Vẽ user journey map cho 2 persona chính | TBD | T6 |
| Wireframe lo-fi cho 3 screen quan trọng nhất | TBD | T7 |
| Chốt tech stack chính thức | Cả team | CN |

### 📊 Metrics tuần này

| Chỉ số | Giá trị |
|---|---|
| Số giờ team đã làm | TBD (chưa có timesheet) |
| Số đề đã review | 250 |
| Số phương án shortlist | 3 |
| Số nguồn tham khảo (market research) | 9 |
| Số PR đã merge | 1 (initial setup) |

---

<!-- Sprint tiếp theo sẽ thêm entry mới ở đây, theo cùng format trên -->
