# PRD Version 4 - Product Excellence

## 1. Muc Dich

Version 4 tap trung vao chat luong san pham: UI/UX dep hon, de dung hon, code frontend/backend sach hon, va san pham trong giong mot cong cu giao duc AI production thay vi demo chay duoc.

User feedback hien tai:

```txt
Frontend va backend hien tai chi khoang 4/10.
Can dep hon, hien dai hon, co animation, nghien cuu UX that ky.
Can ap dung software architecture: khong hardcode, khong harddata, clean architecture.
```

## 2. Product Quality Thesis

TeachFlow AI phai tro thanh workspace ma Teacher co the dung lap lai hang ngay:

```txt
Khong chi generate noi dung
→ Ma giup Teacher kiem soat nguon, chat luong, trang thai, publish va student learning
→ Voi UI ro rang, dang tin cay va dep du de demo/ban san pham
```

## 3. V4 Pillars

### Pillar 1 - Workflow-Centric Interface

App sau login phai hien actual workspace:

- selected course/class context.
- workflow timeline.
- source/document readiness.
- generation/review status.
- next action.

Khong tao landing page hoac hero marketing cho user da login.

### Pillar 2 - Premium Lesson Studio

Lesson Studio la surface quan trong nhat cua TeachFlow AI:

- block list voi status ro.
- editor/canvas ro rang.
- citation/evidence inspector.
- warnings va confidence visible.
- autosave/draft state.
- export actions.
- job queue/regenerate status.

### Pillar 3 - Design System & Motion

Can mot design system nhe:

- tokens: color, spacing, radius, shadow, typography.
- primitives: AppShell, Sidebar, Topbar, Button, Panel, Metric, StatusBadge, WorkflowStep, BlockList, CitationPanel, JobQueue.
- motion: stagger reveal, selected state, slide-in drawer, progress/status pulse.
- support `prefers-reduced-motion`.

### Pillar 4 - Clean Frontend Architecture

Giam monolith frontend:

- Tach UI primitives va feature components khoi `App.tsx`.
- API client khong chua demo data.
- Labels/status mapping tach rieng.
- Component props doc tu state/API, khong hardcode business-critical data trong JSX.
- Tests cho helper logic quan trong.

### Pillar 5 - Production Trust

UI phai lam ro:

- Nguon nao dang duoc dung.
- Block nao co/khong co citation.
- AI job nao thanh cong/that bai.
- Ai co quyen lam action nao.
- Data nao la draft/submitted/published.

Sau audit V4-028, production trust con bao gom:

- Long-term AI `library` la tai san tri thuc cua organization, Admin-only management, hidden voi Teacher/Student nhung duoc AI dung de grounding khi phu hop.
- Teacher/Student van upload duoc `contextual` documents ngan han cua rieng minh; chung khong duoc nhap vao long-term library neu Admin khong duyet/chuyen scope.
- Auth/register/JWT lifecycle da co V4-029 foundation; API docs/Swagger contract da co V4-030 foundation. Structured logging/observability, AI safety/evaluation va storage governance la P0 production gap tiep theo, theo `docs/version4/PRODUCTION_GAP_ANALYSIS.md`.

## 4. Non-goals V4

V4 khong duoc:

- Bo qua V2 production foundation.
- Them chatbot tu do khong citation.
- Lam animation nang lam cham app.
- Lam dark/purple/gradient theme de trang tri.
- Hardcode fake metrics hoac fake product data trong UI.
- Doi tech stack lon neu khong can.
- Pha V1 demo flow.

## 5. V4-P0 Scope - UI Foundation & Teacher Workspace

### 5.1 App Shell Redesign

Acceptance:

- Sidebar ro section va role.
- Topbar co course/class context va backend/system status.
- Responsive mobile/tablet co navigation collapse hop ly.
- Focus states va keyboard access khong bi mat.

### 5.2 Teacher Workflow Dashboard

Acceptance:

- Timeline hien Course -> Sources -> Outline -> Lesson Studio -> Admin Review -> Student Publish.
- Metric panels hien citation coverage, review progress, pending Admin, warnings.
- Action states ro: loading, disabled, empty, error.
- Khong dung fake hardcoded metrics; metric tinh tu data hien co.

### 5.3 Premium Lesson Studio

Acceptance:

- Block list co selected state, status icon, warning/citation hint.
- Editor co toolbar visual, content area ro, note area.
- Citation panel co document title, page, excerpt, confidence/warning.
- Export actions ro.
- Empty state neu chua co lesson.

### 5.4 Knowledge Source & Job Queue Strip

Acceptance:

- Source cards hien status/chunk count/action.
- Job queue/status list hien completed/running/failed/skipped/reingested neu data co.
- Upload/generate errors co message va next action.

### 5.5 Motion & Interaction Polish

Acceptance:

- Section reveal nhe khi load workspace.
- Selected block/source transition nhe.
- Status pulse chi dung cho running job.
- Respect `prefers-reduced-motion`.
- Khong lam layout shift.

## 6. V4-P1 Scope - Admin & Student Experience Upgrade

### 6.1 Admin Review Experience

- Moderation queue ro warning/citation/status.
- Review panel dong bo voi Teacher Lesson Studio.
- Publish/request changes/reject action co confirmation/feedback clarity.

### 6.2 Student Learning Experience

- Student dashboard co continue learning, published lessons, class context.
- Reading/presentation UI de doc hon tren mobile.
- Citation visible nhung khong lam roi noi dung.
- Hoc vien co study state ca nhan: bookmark block quan trong va ghi chu rieng theo block, persistent backend, khong chi la UI local.

## 7. V4-P2 Scope - Architecture Cleanup

- Tach `frontend/src/components/`.
- Tach `frontend/src/features/teacher`, `admin`, `student`.
- Tach design tokens CSS.
- Giam kich thuoc `App.tsx`.
- Khuyen nghi backend route/module split sau khi V2 persistence/job on.

## 8. Quality Gates

- `./init.sh` pass.
- Desktop rendered QA cho Teacher workspace.
- Mobile rendered QA cho login/Teacher workspace.
- No relevant console error/warning.
- `git diff --check` pass.
- V1 demo flow khong bi pha.
- UI khong hardcode backend URL/secrets.
- Product review V4 cap nhat sau implementation.

## 9. Success Metrics

Product:

- Teacher biet next action trong 5 giay sau khi vao workspace.
- Citation/warning visible trong Lesson Studio/Admin review.
- Student khong bi lan voi draft/submitted status.

UX:

- No clipped text/overlap tren desktop/mobile target.
- Loading/empty/error states ro.
- Motion khong can thiet co the tat qua reduced motion.

Engineering:

- Reusable UI primitives duoc dung lap lai.
- Business data den tu API/state/helper, khong nam rai rac hardcoded trong JSX.
- Test helper/UI logic pass.
