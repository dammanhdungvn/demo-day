# User Stories Version 4 - Product Excellence

## Priority

| Priority | Y nghia |
|---|---|
| V4-P0 | Bat buoc de nang chat luong UI/UX va Teacher workflow |
| V4-P1 | Nang Admin/Student experience sau khi Teacher workspace on |
| V4-P2 | Refactor/architecture cleanup sau khi surface moi on dinh |

---

# Epic 1 - App Shell & Design System

## US-401 - App shell moi

**Priority:** V4-P0

As a Teacher/Admin/Student, I want a polished app shell, so that I always know where I am and what context I am working in.

Acceptance Criteria:

- Sidebar co role/context va navigation ro.
- Topbar co selected course/class hoac workspace context.
- Active section ro bang text + icon + color, khong chi bang mau.
- Mobile layout khong overlap.
- Keyboard focus visible.

## US-402 - Design tokens and primitives

**Priority:** V4-P0

As a Developer, I want reusable UI primitives, so that UI can improve without copy-paste fragile CSS.

Acceptance Criteria:

- Co token CSS cho colors, spacing, radius, shadow, typography, motion.
- Co primitives cho Button, Panel, StatusBadge, MetricPanel, WorkflowTimeline, EmptyState.
- Components khong hardcode backend URL/secrets/demo business data.

# Epic 2 - Teacher Workflow Workspace

## US-403 - Workflow timeline

**Priority:** V4-P0

As a Teacher, I want to see the lesson creation workflow status, so that I know the next action.

Acceptance Criteria:

- Timeline gom Course, Sources, Outline, Lesson Studio, Admin Review, Student Publish.
- Step status tinh tu data hien co.
- Step click/focus dua den section lien quan.
- Empty state neu thieu course/class/source/lesson.

## US-404 - Metric panels from real state

**Priority:** V4-P0

As a Teacher, I want useful quality metrics, so that I can know whether a lesson is ready.

Acceptance Criteria:

- Citation coverage tinh tu lesson blocks.
- Review progress tinh tu block status.
- Warning count tinh tu block warnings.
- Pending Admin/submitted status tinh tu lesson status.
- Khong hardcode fake values.

## US-405 - Knowledge source strip

**Priority:** V4-P0

As a Teacher, I want source status visible near generation work, so that I trust the RAG context.

Acceptance Criteria:

- Completed/failed/processing/skipped/reingested source states ro.
- Selected source visible.
- Upload/generation job status ro.
- Failed source co message/action.

# Epic 3 - Premium Lesson Studio

## US-406 - Block list and editor redesign

**Priority:** V4-P0

As a Teacher, I want a focused block editor, so that reviewing AI content feels professional and fast.

Acceptance Criteria:

- Block list co status icon, title, type/subtitle.
- Selected block stable, khong layout shift.
- Editor content readable, toolbar/icon controls ro.
- Save/approve/submit actions ro state.

## US-407 - Citation inspector

**Priority:** V4-P0

As a Teacher/Admin, I want citation evidence visible beside the block, so that I can verify AI output.

Acceptance Criteria:

- Citation panel hien document title, page, excerpt, confidence neu co.
- Warning hien ro va khong chi bang mau.
- Empty citation state than thien.
- Panel responsive/mobile khong che content.

# Epic 4 - Motion & Accessibility

## US-408 - Purposeful motion

**Priority:** V4-P0

As a User, I want smooth state changes, so that the app feels alive but not distracting.

Acceptance Criteria:

- Workspace load co stagger nhe.
- Selected block/source transition nhe.
- Running job pulse nhe.
- `prefers-reduced-motion` tat animation chinh.

## US-409 - Accessible controls

**Priority:** V4-P0

As a User, I want controls that are easy to use by keyboard and on smaller screens, so that the app works in real teaching environments.

Acceptance Criteria:

- Button/input focus visible.
- Text khong overlap tren desktop/mobile.
- Touch targets khong qua nho.
- Form errors/message co text ro.

# Epic 5 - Admin & Student Polish

## US-410 - Admin review surface upgrade

**Priority:** V4-P1

As an Admin, I want a clearer moderation surface, so that I can review quality quickly.

Acceptance Criteria:

- Queue co warning/citation/status summary.
- Selected review detail dong bo visual voi Lesson Studio.
- Publish/request changes/reject feedback state ro.

## US-411 - Student learning surface upgrade

**Priority:** V4-P1

As a Student, I want a calmer reading and progress surface, so that I can learn without Teacher controls.

Acceptance Criteria:

- Published lessons ro status.
- Reading mode readable desktop/mobile.
- Presentation/PDF controls ro.
- Future progress/tutor surface co slot ro nhung khong fake feature.

## US-414 - Student notes and bookmarks

**Priority:** V4-P1

As a Student, I want to save private notes and bookmarks while reading a published lesson, so that I can return to important blocks and revise with my own context.

Acceptance Criteria:

- Student co the bookmark/unbookmark tung block trong lesson published minh co quyen hoc.
- Student co the luu ghi chu rieng theo block; ghi chu nay khong hien cho Teacher/Admin trong slice nay.
- Backend enforce role `student`, class membership, organization scope, lesson status `published` va block id thuoc lesson.
- Study state persistent qua memory/Postgres repository; khong luu tam tren client.
- UI co loading/saving/error state va khong fake note/bookmark data.

## US-415 - Student personal review hub

**Priority:** V4-P1

As a Student, I want one place to review all bookmarked blocks and notes from published lessons, so that I can revise faster without reopening every lesson manually.

Acceptance Criteria:

- Review hub chi gom bookmark/note cua Student hien tai tren lesson published minh co membership.
- Moi item hien lesson title, block title/type, note neu co, trang thai bookmark va citation count.
- Click item mo dung lesson va focus block tuong ung.
- Empty/loading/error states ro, khong fake review data.
- Backend khong expose private note cho Teacher/Admin hoac Student khac.

## US-416 - Student practice deck from published lessons

**Priority:** V4-P1

As a Student, I want one place to practice quiz/assignment blocks from published lessons, so that I can actively review knowledge instead of only rereading content.

Acceptance Criteria:

- Practice deck chi lay block `quiz`, `assignment`, `common_misconception` tu lesson `published` ma Student co membership.
- Moi item hien lesson title, block title/type, prompt/content va citation count de Student biet nguon.
- Click item mo dung lesson va focus block tuong ung.
- Empty/loading/error states ro, khong fake practice data.
- Backend khong expose practice block tu draft/unpublished lesson, lesson ngoai class, Teacher/Admin workspace hoac Student khac.

## US-417 - Student self-check practice attempts

**Priority:** V4-P1

As a Student, I want to save my answer and self-check result for a practice item, so that practice becomes an active learning workflow instead of a static list of prompts.

Acceptance Criteria:

- Student co the luu cau tra loi/nghi chu ngan cho tung practice block trong lesson `published` minh co membership.
- Student co the danh dau ket qua tu danh gia `not_started`, `needs_review`, `got_it`; khong fake auto-grading neu block chua co answer schema.
- Practice deck hien trang thai da lam/can on lai, so attempt va lan cap nhat gan nhat cho tung item.
- Backend enforce role `student`, class membership, organization scope, lesson status `published`, block id thuoc lesson va block type thuoc practice types.
- Attempt state persistent qua memory/Postgres repository; Teacher/Admin/Student khac khong doc/sua attempt trong slice nay.
- UI co saving/error state va khong hardcode fake attempt data.

# Epic 6 - Architecture Cleanup

## US-412 - Split frontend monolith

**Priority:** V4-P2

As a Developer, I want frontend code split by feature and components, so that future V2/V3 work is maintainable.

Acceptance Criteria:

- `App.tsx` khong giu toan bo UI/detail logic dai han.
- Components co props typed ro.
- Feature helpers duoc test khi co logic.
- No unrelated refactor pha V1 flow.

## US-413 - Backend modularization plan

**Priority:** V4-P2

As a Developer, I want backend module boundaries documented, so that V2/V3 production work can continue cleanly.

Acceptance Criteria:

- Co plan tach auth/learning/content/knowledge/ai/audit/export.
- Khong can tach toan bo trong mot PR neu rui ro cao.
- New repository/service code theo boundary ro.
