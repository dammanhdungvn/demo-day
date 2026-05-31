# WORKLOG — Team 49

> Technical decisions, task assignments, brainstorming, important bugs.
> Update **mỗi khi** team đưa ra quyết định kỹ thuật hoặc thay đổi hướng đi.

---

## 📌 Format mỗi entry

```
## [YYYY-MM-DD] — Tiêu đề quyết định
**Context:** Vì sao phải quyết định lúc này
**Options:** Các phương án đã cân nhắc (pros/cons)
**Decision:** Chốt phương án nào và lý do
**Owner:** Ai chịu trách nhiệm
**Status:** Active / Reversed / Superseded
```

---

## [2026-05-31] — Chọn nhóm lĩnh vực: AI Literacy (081–091)

**Context:** Cần chọn 1 nhóm lĩnh vực trong 10 nhóm để khoanh vùng đề tài. 250 đề rải khắp các lĩnh vực, không thể đọc kỹ tất cả.

**Options:**
- Y tế (071–080): Volume buyer lớn, social impact rõ — ❌ Loại: team không có domain knowledge y khoa, rủi ro reg/compliance
- Bảo mật (091–100): Tech sexy, hot trend — ❌ Loại: cần background đặc thù
- AI Literacy (081–091): Đào tạo nhân sự dùng AI — ✅ Match: team đang trực tiếp làm tư vấn AI automation + đào tạo SME
- Robotics, BĐS, vận tải, F&B, giáo dục, marketing (5 nhóm còn lại): tương tự — không có competitive advantage rõ ràng

**Decision:** Chọn **AI Literacy** vì 2 lý do:
1. Team có 1+ năm kinh nghiệm tư vấn AI automation cho doanh nghiệp Việt — có case study, workflow mẫu, network khách hàng để phỏng vấn user
2. Lĩnh vực này có nhiều đề liên quan đến nhau (assessment, use case discovery, learning) → dễ pivot giữa các đề trong cùng nhóm nếu Sprint 1 phát hiện vấn đề

**Owner:** Cả team

**Status:** Active

---

## [2026-05-31] — Shortlist 3 phương án trong AI Literacy

**Context:** AI Literacy có 11 đề (081–091). Cần lọc xuống còn 2–3 phương án để team có thể phân tích sâu trước khi chốt.

**Tiêu chí filter:**
1. Có tạo ra giá trị B2B đo lường được không?
2. Demo cuối kỳ có thuyết phục không? (Không chọn đề mà demo chỉ là bảng số liệu)
3. Team có nội dung thật, không phải chỉ "ý tưởng hay"?
4. Có cạnh tranh trực tiếp với sản phẩm SaaS lớn (ChatGPT plugin, Notion AI…) không? Nếu có, định vị khác biệt được không?

**Đề loại sớm:**
- 081, 082, 083: Quá generic ("AI cho công việc văn phòng") — không có chiều sâu để dạy hoặc demo
- 085: Trùng concept với 086 nhưng narrower scope
- 087, 088, 090, 091: Đòi hỏi tài nguyên content lớn (course catalog, video library) — không khả thi trong 4 sprint

**Shortlist còn lại:**
- AI20K-084 — Competency Assessment (đo năng lực AI nhân viên)
- AI20K-086 — Use Case Discovery (gợi ý AI use case theo ngành)
- AI20K-089 — AI Automation Learning (dạy build automation no-code)

**Decision:** 3 phương án này đều có B2B value, demo được, và team có thể làm sâu. Sẽ phân tích kỹ pros/cons trước khi chọn.

**Owner:** Cả team

**Status:** Active

---

## [2026-05-31] — Ưu tiên AI20K-089, để 084 và 086 làm dự phòng

**Context:** Sau khi có 3 phương án shortlist, team cần chốt 1 phương án để bắt đầu Sprint 1 (phỏng vấn user, wireframe). Tuy nhiên team chưa có đủ thông tin để chốt hẳn — cần thêm 1 vòng validate với user thực.

**Phân tích so sánh:**

| Tiêu chí | 084 (Assessment) | 086 (Discovery) | 089 (Automation Learning) |
|---|---|---|---|
| Demo thuyết phục | Trung bình (kết quả là bảng điểm) | Trung bình (list use case) | **Cao** (workflow chạy thật) |
| Match team experience | Cao (đào tạo SME) | Cao (tư vấn use case) | **Cao nhất** (đang làm n8n/Larkbase cho khách) |
| Market validation | Trung bình | Thấp (dễ copy bằng ChatGPT) | **Cao** (Udemy 55K+ students, n8n $2.5B) |
| Tech complexity cho MVP | Cao (cần ML cho personalization) | Thấp (LLM + RAG) | Trung bình (LLM + sandboxing) |
| Sales cycle | Dài (HR/L&D, 1–3 tháng) | Ngắn (consumer) | Trung bình |
| Retention | Thấp (one-time test) | Thấp (one-time gợi ý) | **Cao** (learning loop) |
| Risk lớn nhất | Khó tạo "wow" factor khi demo | Dễ bị copy | Sandbox tech khả thi không? |

**Options:**
- **A — Chốt hẳn 089 ngay:** Lợi: tập trung được Sprint 1 vào 1 hướng. Hại: Nếu sandbox không khả thi (Sprint 1 phát hiện), phải pivot mất 1 sprint.
- **B — Ưu tiên 089, giữ 086 làm fallback:** Lợi: Có plan B nếu 089 fail. Hại: Team chia sức cho 2 hướng → kém sâu.
- **C — Phỏng vấn user trước, chốt sau:** Lợi: Quyết định data-driven. Hại: Mất 1 tuần.

**Decision:** Chọn **B — Ưu tiên AI20K-089, để 084 và 086 làm phương án dự phòng**.
- Sprint 1 sẽ tập trung 80% effort vào validate 089 (phỏng vấn user, POC sandbox).
- 20% effort review lại 084/086 để nếu phải pivot thì không mất quá nhiều thời gian.
- **Chốt chính thức cuối Sprint 1** sau khi có data từ phỏng vấn user và POC technical.

**Trigger để pivot khỏi 089:**
- Sandbox workflow không khả thi technical/cost trong 4 sprint (→ pivot 086)
- 0/5 user phỏng vấn quan tâm topic automation learning (→ pivot 084 hoặc 086)
- Team phát hiện đối thủ Việt Nam đã có sản phẩm tương tự ở mức MVP (→ xem lại positioning)

**Owner:** Cả team. Lucas chịu trách nhiệm Sprint 1 research lead.

**Status:** Active *(sẽ được superseded bằng quyết định chốt đề cuối Sprint 1)*

---

## [2026-05-31] — Setup hạ tầng: GitHub repo + AI logging hook

**Context:** Chương trình AI20K Cohort 2 yêu cầu mỗi team có repo official với pre-configured AI logging hooks. Hooks này tự động log mọi prompt team gửi cho AI tools (Claude / Cursor / Codex / Gemini / Copilot) → gửi về server chương trình để chấm điểm AI literacy.

**Options:**
- **A — Setup ngay từ Sprint 0:** Lợi: Mọi commit đều được log từ đầu. Hại: Mất thời gian khi chưa code thật.
- **B — Setup khi bắt đầu Sprint 2 (Build MVP):** Lợi: Đỡ overhead khi chưa cần. Hại: Mất log cho Sprint 0–1, có thể bị nghi ngờ "không dùng AI" cho phần research.

**Decision:** Chọn **A — Setup ngay từ Sprint 0**.
Lý do: Phần research/lựa chọn đề tài cũng dùng nhiều AI (Claude Code phân tích 250 đề, ChatGPT cross-check market data). Nếu không log từ đầu, log sẽ thiếu mảng "AI cho strategic thinking" — đây chính là phần thầy chấm AI literacy.

**Setup đã làm:**
1. Clone `AI20K-Build-Cohort-2/C2-App-049` về máy
2. Chạy `scripts/setup_hooks.ps1` — pre-push hook đã cài
3. Tạo `.env` từ `.env.example` (AI_LOG_SERVER và AI_LOG_API_KEY đã có sẵn từ chương trình)
4. Verify: file `.git/hooks/pre-push` tồn tại (227 bytes)

**Owner:** Lucas

**Status:** Active

---

## [2026-05-31] — Khởi tạo bộ document: README + JOURNAL + WORKLOG

**Context:** README đề bài yêu cầu maintain 3 file: `README.md` (project info), `JOURNAL.md` (weekly learning log), `WORKLOG.md` (decision log, file này).

**Options:**
- **A — Gộp hết vào 1 file README dài:** ❌ Loại — vi phạm yêu cầu chương trình
- **B — Theo đúng template 3 file:** ✅ Chọn

**Decision:** Tạo cả 3 file theo đúng template chương trình:
- `README.md`: Project info, market research, định hướng sản phẩm, sprint plan
- `JOURNAL.md`: Weekly entry (tuần này là Sprint 0)
- `WORKLOG.md`: Decision log (file này)

**Quy ước update từ giờ:**
- README: Cập nhật khi có major change về định hướng sản phẩm hoặc chốt quyết định lớn
- JOURNAL: Update **mỗi tuần**, trước mỗi PR — bắt buộc theo template chương trình
- WORKLOG: Update **mỗi khi có decision/brainstorm/bug** — không đợi định kỳ

**Owner:** Lucas khởi tạo, cả team duy trì.

**Status:** Active

---

<!-- Decision tiếp theo thêm ở đây, mới nhất ở dưới cùng -->
