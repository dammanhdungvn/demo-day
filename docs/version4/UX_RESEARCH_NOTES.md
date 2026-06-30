# UX Research Notes - TeachFlow AI Version 4

## Muc Dich

Tai lieu nay tom tat nghien cuu cho Version 4. Muc tieu la cai thien san pham dua tren trai nghiem nguoi dung that, khong thiet ke lung tung.

## Nguon Da Tham Khao

- UNESCO - Guidance for generative AI in education and research: https://www.unesco.org/en/articles/guidance-generative-ai-education-and-research
- U.S. Department of Education - Artificial Intelligence and Future of Teaching and Learning: https://www.ed.gov/documents/ai-report/artificial-intelligence-and-future-teaching-and-learning
- CAST UDL Guidelines: https://udlguidelines.cast.org/
- Nielsen Norman Group - 10 Usability Heuristics: https://www.nngroup.com/articles/ten-usability-heuristics/
- W3C WCAG 2.2: https://www.w3.org/TR/WCAG22/
- MagicSchool AI product surface: https://www.magicschool.ai/
- Khanmigo for teachers: https://www.khanmigo.ai/teachers
- SchoolAI product surface: https://schoolai.com/
- Diffit product surface: https://web.diffit.me/

Ghi chu: cac nguon web dung de lay design/product benchmark va guardrail tong quat; yeu cau nghiep vu chinh cua TeachFlow AI van nam trong `docs/version1/`, `docs/version2/`, `docs/version3/`, `docs/version4/`.

## Insight Chinh

### 1. Teacher can workflow ro hon la can theme dep

Teacher khong can mot hero/landing page. Teacher can biet:

- Dang lam course/class nao.
- Buoc tiep theo trong flow la gi.
- Source nao san sang.
- AI job nao dang chay/loi.
- Block nao chua review.
- Citation/warning nao can xu ly truoc khi gui Admin.

He qua thiet ke:

- First screen sau login phai la workspace.
- Timeline flow phai hien trang thai tung buoc.
- Lesson Studio phai gom block list, editor, citation panel trong cung mot surface.

### 2. AI education UX phai giu human-in-the-loop

AI khong duoc bien thanh hop den. Teacher/Admin can thay nguon, warning, confidence va lich su thay doi.

He qua thiet ke:

- Citation panel la first-class surface.
- Warning khong duoc an trong tooltip.
- Nut generate/regenerate phai co job state, loi than thien va retry.
- Admin review phai thay du approval status, warning count, citation coverage.

### 3. Student UX can learning continuity, khong chi la viewer

V2/V3 da de cap progress/tutor/adaptive. V4 UI phai chuan bi surface cho:

- continue where left off.
- note/bookmark.
- question grounded in current lesson.
- review recommendation.

He qua thiet ke:

- Student dashboard can "Tiep tuc hoc" va progress.
- Reading view can co navigation block ro, citation readable, mobile-friendly.

### 4. Good AI app UX can status visibility va error recovery

Tu usability heuristics, AI-heavy app phai hien system status ro hon app CRUD thuong.

He qua thiet ke:

- Job queue/status strip trong Teacher workspace.
- Autosave/draft state visible.
- Error message co next action: retry, change source, reduce file size, contact admin.

### 5. Accessibility la product quality

Teacher va Student dung app trong nhieu moi truong: may chieu, laptop nho, mobile, lop hoc sang/toi.

He qua thiet ke:

- Contrast ro.
- Focus states nhin duoc.
- Controls co target size du.
- Motion co `prefers-reduced-motion`.
- Khong dua thong tin chi bang mau sac.

## Benchmark Tinh Nang Huu Ich

| Nhom tinh nang | Gia tri | TeachFlow AI nen lam |
|---|---|---|
| Lesson planning | Giam thoi gian chuan bi | Giữ outline/lesson generation nhung lam UI ro buoc hon |
| Differentiation | Phu hop trinh do lop | Hien adaptation notes ro trong outline/block |
| Rubric/assessment | Teacher danh gia nhanh hon | V3/V4 later: rubric block, quiz/practice, feedback assistant |
| Grounded tutor | Student hoc sau lesson | V2-P1/V3-P0: tutor theo published lesson va citation |
| Analytics | Teacher biet lop dang ket o dau | V2-P2/V3: progress + concept difficulty |
| Governance | Giam rui ro AI | Citation, warning, audit, permission, kill switch |

## Ket Luan Cho V4

Version 4 uu tien:

1. Rebuild UI architecture va design system.
2. Teacher workspace moi theo actual workflow.
3. Lesson Studio moi: block list + editor + citation inspector + job queue.
4. Student/Admin surfaces dong bo visual language.
5. Motion nhe, co muc dich, accessible.
6. Sau khi UI foundation tot, tiep tuc V2/V3 features tren surface moi.
