# 🤖 Team 49 — AI20K Build Cohort 2

> **Chương trình:** Gen AI Engineer — VinUni × Vingroup (AI20K Cohort 2)
> **Team:** 49
> **Mã đề ưu tiên (candidate):** AI20K-089 — *đang shortlist, chốt cuối Sprint 1*
> **Lĩnh vực:** AI Literacy — AI Automation Learning
> **Tech Stack (định hướng):** LLM + Code (n8n, API integration, RAG)

---

## 📋 Mục Lục

- [Thông Tin Team](#-thông-tin-team)
- [Bài Toán & Đề Tài](#-bài-toán--đề-tài)
- [Quá Trình Lọc Đề & Phân Tích Lựa Chọn](#-quá-trình-lọc-đề--phân-tích-lựa-chọn)
- [Nghiên Cứu Thị Trường](#-nghiên-cứu-thị-trường)
- [Định Hướng Sản Phẩm](#-định-hướng-sản-phẩm)
- [Nhật Ký Tiến Độ](#-nhật-ký-tiến-độ)
- [Repo Setup (Cho Thành Viên Mới)](#-repo-setup-cho-thành-viên-mới)

---

## 👥 Thông Tin Team

| | |
|---|---|
| **Team** | 49 |
| **Chương trình** | AI20K Build Phase — Cohort 2 |
| **Repo official** | `AI20K-Build-Cohort-2/C2-App-049` |
| **Mã đề ưu tiên** | AI20K-089 *(candidate, chưa chốt chính thức)* |

> ⚠️ **Lưu ý về việc chốt đề:** Team đang ưu tiên AI20K-089 dựa trên phân tích Sprint 0. Quyết định cuối sẽ được chốt **cuối Sprint 1** sau khi hoàn thành phỏng vấn user và phân tích yêu cầu chi tiết. Trong trường hợp Sprint 1 phát hiện blocker lớn với 089, team sẽ chuyển sang phương án dự phòng là AI20K-086 hoặc AI20K-084 (xem phần phân tích bên dưới).

---

## 📌 Bài Toán & Đề Tài

**Đề ưu tiên hiện tại — AI20K-089:**
"AI Trợ Lý Học Cách Tích Hợp & Tự Động Hóa Với AI (No-Code)"

**Bài toán gốc (từ ngân hàng đề):**

Doanh nghiệp — đặc biệt SME — đang gặp một nghịch lý: AI automation tools ngày càng phổ biến và rẻ (n8n, Make, Zapier, Larkbase), nhưng đội ngũ không tự triển khai được vì thiếu kiến thức kỹ thuật. Thuê developer thì đắt, học qua video rời rạc thì không có lộ trình có cấu trúc, không thực hành được ngay trên use case của doanh nghiệp mình.

**Hướng giải quyết dự kiến:** Xây dựng web app dạy tích hợp và tự động hóa bằng AI theo phương pháp no-code / low-code — có lộ trình cá nhân hóa theo ngành nghề, thực hành ngay trên use case thực tế của người dùng, phản hồi tức thì từ AI tutor.

**Yêu cầu sản phẩm tối thiểu (chung cho mọi đề):**
- Web app hoàn chỉnh, deployed online (có URL truy cập)
- Đăng nhập & phân quyền cơ bản
- Giao diện UI/UX hoàn chỉnh
- Quản lý user
- *(Không chấp nhận: demo notebook, script CLI, prototype localhost)*

---

## 🎯 Quá Trình Lọc Đề & Phân Tích Lựa Chọn

### Quy trình lọc

Team rà soát toàn bộ 250 đề tài thuộc 10 nhóm lĩnh vực của chương trình AI20K Cohort 2. Tiêu chí đánh giá gồm 3 yếu tố:

1. **Tính thực chiến** — Bài toán có tồn tại trong thực tế không?
2. **Khả năng ứng dụng cho doanh nghiệp** — Giải pháp có tạo ra giá trị kinh tế đo lường được không?
3. **Lợi thế của team** — Team có đủ domain knowledge để xây sản phẩm có chiều sâu không?

8/10 nhóm bị loại sớm do đòi hỏi domain knowledge chuyên biệt team không có (y tế, bảo mật, robotics, BĐS, vận tải...). **Nhóm AI Literacy (081–091)** được chọn tiếp tục vì đây là lĩnh vực team đang trực tiếp hoạt động — tư vấn AI automation và đào tạo chủ doanh nghiệp.

Trong nhóm AI Literacy, team rút gọn xuống **3 phương án ứng cử viên** đang được cân nhắc:

---

### 🟡 Phương Án 1 (backup) — AI20K-084
**AI Trợ Lý Đánh Giá & Phát Triển Năng Lực AI Của Nhân Viên**
*[AI Literacy — Competency Assessment] · Tech: LLM + ML*

**Điểm mạnh:**
- Phù hợp với mảng đào tạo doanh nghiệp của team — đo năng lực AI là bước đầu tiên của mọi chương trình upskilling
- Dễ B2B: HR/L&D của công ty 50–500 nhân viên là buyer rõ ràng, có budget đào tạo theo năm
- Tính năng assessment có thể được tái sử dụng làm onboarding cho các sản phẩm khác

**Điểm yếu:**
- Cần thêm ML để cá nhân hóa lộ trình phát triển sau đánh giá — phức tạp hơn dự kiến cho MVP
- Sales cycle dài: HR phải xin phê duyệt ngân sách, mất 1–3 tháng để chốt hợp đồng
- Thiếu tính "wow" khi demo — kết quả là bảng điểm, khó trực quan hóa giá trị ngay lập tức

---

### 🟡 Phương Án 2 (backup) — AI20K-086
**AI Trợ Lý Khám Phá Ứng Dụng AI Theo Đặc Thù Công Việc**
*[AI Literacy — Use Case Discovery] · Tech: LLM + RAG*

**Điểm mạnh:**
- Đây gần như là productize dịch vụ tư vấn của team — map AI use case vào từng ngành/vị trí là việc team làm hàng ngày cho khách
- Có thể làm công cụ freemium để thu hút lead cho dịch vụ tư vấn sau này
- Tech stack đơn giản (LLM + RAG), MVP nhanh, dễ iterate

**Điểm yếu:**
- Dễ bị copy: barrier to entry thấp, một prompt tốt trên ChatGPT làm được 70% giá trị
- Monetization khó: người dùng dùng một lần rồi thôi, không có lý do quay lại → retention thấp
- Không có "learning loop" — người dùng nhận gợi ý xong nhưng không được hỗ trợ triển khai thực tế

---

### 🟢 Phương Án 3 (đang ưu tiên) — AI20K-089
**AI Trợ Lý Học Cách Tích Hợp & Tự Động Hóa Với AI (No-Code)**
*[AI Literacy — AI Automation Learning] · Tech: LLM + Code*

**Điểm mạnh:**
- Giao thoa trực tiếp giữa kỹ thuật (LLM, API, workflow) và nghiệp vụ (dạy học, automation)
- Team có đủ nội dung thật: case studies, workflow n8n/Larkbase đã triển khai cho khách hàng thực
- Thị trường validate rõ: Udemy "n8n AI Automation" có 55,000+ students, bestseller (xem phần Nghiên Cứu Thị Trường)
- Nhiều segment buyer với willingness to pay khác nhau: chủ SME, freelancer consultant, ops executive

**Vượt trội hơn 2 phương án còn lại ở chỗ:**
- Không chỉ gợi ý (như 086) mà dạy và cho thực hành ngay — retention cao hơn
- Không chỉ đánh giá (như 084) mà dẫn người dùng từ zero đến kết quả thật
- Khi demo: người xem thấy ngay một automation workflow chạy được — giá trị trực quan, thuyết phục

**Rủi ro cần xác minh trong Sprint 1:**
- Sandbox thực hành workflow trong web app có khả thi về mặt kỹ thuật không (security, sandboxing, infra cost)?
- Người dùng có đủ động lực hoàn thành lộ trình học không (drop-off rate trong online learning thường rất cao)?
- Cạnh tranh trực tiếp với Udemy / Skillshare / n8n's own learning portal — định vị khác biệt thế nào?

---

### Trạng thái quyết định hiện tại

**Đang ưu tiên: AI20K-089** — vì team có thể trình bày bài bảo vệ với demo thật, số liệu thật, case study thật từ kinh nghiệm thực chiến.

**Sẽ chốt chính thức:** Cuối Sprint 1 (sau khi phỏng vấn 3–5 user thực và validate giả định kỹ thuật về sandbox).

**Phương án dự phòng nếu 089 bị reject:** AI20K-086 (đơn giản hơn, ít rủi ro tech) hoặc AI20K-084 (B2B value rõ hơn).

---

## 📊 Nghiên Cứu Thị Trường

*Thực hiện: 31/05/2026 | Nguồn: Web research có dẫn chứng | Phạm vi: AI20K-089*

### Thị trường No-Code AI Platform toàn cầu

| Chỉ số | Số liệu |
|---|---|
| Giá trị thị trường 2024 | $4.28–6.56 tỷ USD |
| Dự báo 2033–2034 | $44–75 tỷ USD |
| CAGR | 30–38%/năm |
| SME chiếm | 43–60% market share |

> Nguồn: Straits Research, Grand View Research, Fortune Business Insights (2025)

### Thị trường Việt Nam

| Chỉ số | Số liệu |
|---|---|
| Doanh nghiệp VN đã dùng AI tools | 65% SME |
| Muốn đào tạo AI nhưng không biết bắt đầu | **62%** |
| Dự định tăng đầu tư AI trong 2 năm tới | 67% |
| Nhưng có nhân sự đủ năng lực triển khai | chỉ 15% |
| Thị trường AI VN 2024 | $0.75 tỷ USD |
| Dự báo 2033 | $2.81 tỷ USD |

> Nguồn: vista.gov.vn, AWS Vietnam Research 2025, Vietnam Report

**Insight:** 62% muốn nhưng 85% không có người làm — đây là khoảng trống sản phẩm rõ ràng.

### Validation từ thị trường khóa học (proof of demand)

| Sản phẩm tương tự | Quy mô |
|---|---|
| Udemy "n8n AI Automation" (no-code) | **55,000+ students**, bestseller |
| "Master n8n AI Agents: Build & Sell" | 14,453 students, bestseller |
| n8n valuation (Series C, 10/2025) | **$2.5 tỷ USD**, ARR $40M |
| Zapier ARR | $400M |

> Nguồn: medium.com/javarevisited, digitalapplied.com, parseur.com (2025–2026)

### Phân tích Buyer — Ai sẵn sàng chi tiền?

#### 🔴 Buyer chính — Chủ SME 5–50 nhân viên
- **Vấn đề:** Nhiều quy trình lặp lại, không có đội kỹ thuật, không biết bắt đầu từ đâu
- **Quyền lực:** Tự quyết định ngân sách, không cần committee approval
- **Willingness to pay:** $50–200/tháng (SaaS) hoặc 5–15 triệu VND/gói nhóm
- **Benchmark toàn cầu:** SME chi **$1,091/learner/năm** cho training — cao hơn cả doanh nghiệp lớn ($468)

#### 🟠 Buyer dễ convert — Freelancer / AI automation consultant
- **Vấn đề:** Muốn build AI automation service để bán, cần học có hệ thống
- **Quyền lực:** Bỏ tiền túi, ROI từ 1 client đầu là đủ hoàn vốn
- **Willingness to pay:** $100–500 one-time hoặc $20–50/tháng

#### 🟡 Buyer volume — Ops/Marketing executive
- **Vấn đề:** Không muốn bị tụt lại so với đồng nghiệp hoặc đối thủ
- **Willingness to pay:** $15–50 one-time (Udemy pricing psychology)

#### ⚪ Buyer scale-up — L&D Corporate
- **Ticket size:** $2,000–10,000/batch (nhóm 10–30 người)
- **Thách thức:** Sales cycle dài, cần social proof trước
- **Timeline:** Phù hợp giai đoạn scale sau khi sản phẩm có track record

> Nguồn: learnexperts.ai, trainingorchestra.com, techclass.com (2025–2026)

---

## 🛠 Định Hướng Sản Phẩm

> ⚠️ *Phần này áp dụng cho phương án ưu tiên AI20K-089. Sẽ được cập nhật chi tiết sau khi team hoàn thành Sprint 1 (phỏng vấn user + chốt đề chính thức).*

### Tên sản phẩm dự kiến
*(Chưa đặt tên chính thức)*

### Core Value Proposition (dự thảo)
Người dùng không cần biết code — chỉ cần mô tả vấn đề trong công việc, sản phẩm sẽ hướng dẫn từng bước để xây dựng automation workflow phù hợp, thực hành ngay, kết quả dùng được luôn.

### Tính năng MVP (dự kiến)

| # | Tính năng | Mô tả |
|---|---|---|
| 1 | Onboarding theo ngành | Người dùng chọn ngành/vai trò → nhận lộ trình học phù hợp |
| 2 | Thư viện use case | Bộ sưu tập workflow mẫu theo nhóm bài toán (CSKH, báo cáo, nội dung, HR) |
| 3 | AI tutor tương tác | Giải thích từng bước, trả lời câu hỏi trong ngữ cảnh bài học đang học |
| 4 | Sandbox thực hành | Môi trường thử nghiệm workflow không cần cài đặt gì thêm |
| 5 | Theo dõi tiến độ | Dashboard cá nhân, milestone hoàn thành, gợi ý bài học tiếp theo |

### Tech Stack định hướng
- **Backend / AI:** LLM (OpenAI/Claude API), RAG, FastAPI
- **Frontend:** Web app (React hoặc tương đương)
- **Automation engine tham khảo:** n8n (self-hosted), Larkbase API
- **Deployment:** Cloud (có public URL)

---

## 📅 Nhật Ký Tiến Độ

### Sprint 0 — Khởi động & Lọc đề (31/05/2026)

| Hạng mục | Trạng thái | Ghi chú |
|---|---|---|
| Rà soát 250 đề tài ngân hàng đề | ✅ Hoàn thành | 10 nhóm lĩnh vực |
| Phân tích lợi thế team so với đề tài | ✅ Hoàn thành | Chọn nhóm AI Literacy |
| Shortlist 3 phương án (084 / 086 / 089) | ✅ Hoàn thành | Đang ưu tiên 089 |
| Nghiên cứu thị trường (buyer, market size) | ✅ Hoàn thành | Có dẫn chứng, xem phần trên |
| Khởi tạo GitHub repo + setup AI hooks | ✅ Hoàn thành | |

### Sprint 1 — Phân Tích Yêu Cầu & Chốt Đề

| Hạng mục | Trạng thái | Ghi chú |
|---|---|---|
| Phỏng vấn 3–5 potential user | 🔲 Chưa bắt đầu | |
| Validate giả định kỹ thuật về sandbox | 🔲 Chưa bắt đầu | Quyết định khả thi technical |
| **Chốt đề chính thức (089 / 086 / 084)** | 🔲 Chưa bắt đầu | **Milestone quan trọng** |
| Xác định user story đầy đủ | 🔲 Chưa bắt đầu | |
| Wireframe / mockup MVP | 🔲 Chưa bắt đầu | |
| Thiết kế kiến trúc hệ thống | 🔲 Chưa bắt đầu | |
| Phân công task trong team | 🔲 Chưa bắt đầu | |

### Sprint 2 — Build MVP *(Coming soon)*
### Sprint 3 — Test & Deploy *(Coming soon)*
### Sprint 4 — Demo & Submit *(Coming soon)*

---

## 📁 Cấu Trúc Repo *(Cập nhật theo tiến độ)*

```
/
├── README.md               ← Nhật ký dự án (file này)
├── JOURNAL.md              ← Weekly learning journal (bắt buộc update mỗi tuần)
├── WORKLOG.md              ← Technical decisions log (update khi có quyết định)
├── .env.example            ← Template config
├── scripts/                ← AI logging hooks (đã setup sẵn)
├── docs/                   ← Sẽ thêm: user research, design docs
├── src/                    ← Sẽ thêm: source code MVP
└── demo/                   ← Sẽ thêm: screenshots, video demo
```

---

## 🔧 Repo Setup (Cho Thành Viên Mới)

Khi thành viên mới join team, làm theo các bước sau để setup môi trường:

### 1. Clone repo
```bash
git clone https://github.com/AI20K-Build-Cohort-2/C2-App-049.git
cd C2-App-049
```

### 2. Cài pre-push hook (AI logging)
**Windows PowerShell:**
```powershell
powershell -ExecutionPolicy Bypass -File scripts\setup_hooks.ps1
```

**Linux / macOS / Git Bash:**
```bash
bash scripts/setup_hooks.sh
```

### 3. Cấu hình .env
```bash
cp .env.example .env       # macOS / Linux
copy .env.example .env     # Windows
```
Sau đó điền giá trị thật (API keys cá nhân + AI_LOG_SERVER do chương trình cung cấp).

### 4. Yêu cầu Python
Hook system cần **một trong**: `python3`, `python`, hoặc `py` trên PATH.

| OS | Cài đặt |
|---|---|
| Windows | Python 3 từ [python.org](https://www.python.org/downloads/) |
| Ubuntu / Debian | `sudo apt install python3` |
| macOS | `brew install python3` |

### 5. Lưu ý quan trọng

- **JOURNAL.md** phải update mỗi tuần (trước mỗi PR) — đây là learning record của team
- **WORKLOG.md** update mỗi khi có technical decision / brainstorm / bug fix quan trọng
- **AI logging hoạt động tự động** sau khi `setup_hooks` chạy thành công — log gửi về server chương trình khi `git push`
- **Không commit `.env`** — chỉ commit `.env.example`

---

*Repo này được dùng như nhật ký làm việc của team. Mọi quyết định quan trọng, thay đổi hướng đi, và kết quả nghiên cứu đều được ghi lại tại đây.*
