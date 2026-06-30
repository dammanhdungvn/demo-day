# User Stories Version 2 - Production Conversion

## Priority

| Priority | Y nghia |
|---|---|
| V2-P0 | Bat buoc de san pham dung production |
| V2-P1 | Feature huu ich sau khi production foundation on |
| V2-P2 | Mo rong nhe, co the defer neu production chua on |

---

# Epic 1 - Production Auth & Organization

## US-201 - Production login

**Priority:** V2-P0

As a user, I want to login with a real production account, so that I can keep using TeachFlow AI across restarts/deploys.

Acceptance Criteria:

- User login/logout duoc bang auth production.
- Session refresh hoat dong.
- Password reset hoac invite flow co UI ro.
- Backend khong dung demo token in-memory lam auth chinh.
- Frontend khong co secret key.

## US-202 - Organization workspace

**Priority:** V2-P0

As an Admin, I want users/data scoped to my organization, so that one school/team cannot see another team's data.

Acceptance Criteria:

- User thuoc mot organization.
- Course/class/document/lesson scoped theo organization.
- Admin chi quan ly organization cua minh.
- Negative tests cho cross-organization access.

## US-203 - Invite Teacher/Student

**Priority:** V2-P0

As an Admin or Teacher, I want to invite users, so that classes can use real accounts instead of seeded demo users.

Acceptance Criteria:

- Invite user by email hoac invite code.
- Teacher co the add Student da accepted invite vao class.
- Pending invite co status.
- Duplicate invite duoc xu ly ro.

# Epic 2 - Persistent Core Data

## US-204 - Persist courses/classes/membership

**Priority:** V2-P0

As a Teacher, I want my courses/classes/memberships saved permanently, so that backend restart does not lose my work.

Acceptance Criteria:

- Course/class/class_students luu DB.
- Teacher ownership enforced.
- Student class list doc tu DB.
- Restart backend khong mat data.

## US-205 - Persist outlines and lesson blocks

**Priority:** V2-P0

As a Teacher, I want generated outlines and lesson blocks saved permanently, so that I can continue editing later.

Acceptance Criteria:

- Course outlines, outline sessions, lesson sessions, lesson blocks luu DB.
- Lesson status transition luu DB.
- Block citations luu thanh records hoac JSON co schema ro.
- Restart backend khong mat lesson.

## US-206 - Persistent audit events

**Priority:** V2-P0

As an Admin or Teacher, I want audit history to survive restarts, so that moderation and content changes are traceable.

Acceptance Criteria:

- Audit events luu DB.
- Events include actor, role, action, entity id, timestamp, details.
- Teacher chi xem audit lesson minh so huu.
- Admin xem audit trong organization.

# Epic 3 - Authorization & Data Protection

## US-207 - Backend permission matrix tests

**Priority:** V2-P0

As a System, I want automated permission tests, so that production users cannot access data outside their role.

Acceptance Criteria:

- Tests cover Admin/Teacher/Student.
- Tests cover cross-Teacher access.
- Tests cover Student direct lesson URL.
- Tests cover unpublished/rejected lesson hidden from Student.

## US-208 - RLS or service-layer policy

**Priority:** V2-P0

As a System, I want one explicit authorization strategy, so that DB access cannot drift into unsafe patterns.

Acceptance Criteria:

- Repo documents whether enforcement is backend-only, RLS-only, or hybrid.
- Service role key never reaches frontend.
- Policy tests or repository tests cover critical tables.

# Epic 4 - Reliable AI/RAG Jobs

## US-209 - Async document ingestion jobs

**Priority:** V2-P0

As a Teacher/Admin, I want document upload to create a background job, so that large PDFs do not block the browser request.

Acceptance Criteria:

- Upload creates `generation_jobs` or `ingestion_jobs` record.
- UI shows queued/processing/completed/failed.
- User can retry failed ingestion.
- File type/size/role guards remain.

## US-210 - Production embeddings and re-index

**Priority:** V2-P0

As a System, I want semantic embeddings, so that RAG retrieval is useful in real teaching content.

Acceptance Criteria:

- Embedding provider read from backend env.
- Existing documents can be re-indexed.
- Retrieval returns citation metadata.
- Smoke eval verifies expected chunks for known topics.

## US-211 - AI generation job lifecycle

**Priority:** V2-P0

As a Teacher, I want outline/lesson generation to have job status, so that I can recover from slow or failed AI calls.

Acceptance Criteria:

- Outline/lesson/block regeneration creates job record.
- UI can poll status.
- Failed job stores safe error message.
- Retry/cancel is supported where practical.

## US-212 - AI cost and rate guards

**Priority:** V2-P0

As an Admin, I want AI usage limited, so that one user cannot accidentally burn budget.

Acceptance Criteria:

- Per-user or per-organization rate limit for expensive actions.
- Job metadata stores model/provider and rough token/cost fields when available.
- UI explains cooldown/limit errors.

# Epic 5 - Knowledge Base Production Library

## US-213 - Document lifecycle management

**Priority:** V2-P0

As a Teacher/Admin, I want to manage uploaded documents, so that old or failed documents do not pollute generation.

Acceptance Criteria:

- Documents can be archived/deactivated.
- Failed documents can be retried.
- Completed-only documents can be selected for generation.
- Existing citations remain readable even if source is archived.

## US-214 - Web page/link ingestion

**Priority:** V2-P1

As a Teacher, I want to ingest a trusted web page or documentation URL, so that I can use non-PDF course sources.

Acceptance Criteria:

- User submits URL.
- Backend extracts readable text with title/source URL.
- Job status shown in UI.
- Citation includes URL and excerpt.
- Unsafe/unsupported URLs fail clearly.

## US-215 - YouTube transcript ingestion

**Priority:** V2-P1

As a Teacher, I want to ingest a YouTube transcript when available, so that video lectures can become source material.

Acceptance Criteria:

- Ingest transcript/caption text only.
- No heavy audio/video processing in V2.
- Citation includes video URL and timestamp if available.
- Missing transcript returns clear error.

# Epic 6 - Teacher Production Workflow

## US-216 - Lesson revision after publish

**Priority:** V2-P1

As a Teacher, I want to revise a published lesson without breaking the current published version, so that students keep a stable lesson until Admin approves changes.

Acceptance Criteria:

- Teacher can create draft revision from published lesson.
- Revision has version number/status.
- Admin reviews revision.
- Student sees last published version until new version published.

## US-217 - Scheduled publishing

**Priority:** V2-P2

As a Teacher/Admin, I want to schedule when a lesson becomes visible, so that class release timing is controlled.

Acceptance Criteria:

- Published lesson can have `visible_from`.
- Student list hides lessons before `visible_from`.
- Admin/Teacher see scheduled status.

# Epic 7 - Student Learning Experience

## US-218 - Student progress tracking

**Priority:** V2-P1

As a Student, I want my lesson progress saved, so that I can continue where I left off.

Acceptance Criteria:

- Track opened/completed lesson.
- Track current slide/block progress.
- Student dashboard shows next lesson.
- Teacher can view aggregate progress.

## US-219 - Student notes/bookmarks

**Priority:** V2-P1

As a Student, I want to bookmark or note lesson blocks, so that I can review important concepts later.

Acceptance Criteria:

- Student can add private note/bookmark to a block.
- Student can list notes by lesson.
- Teacher/Admin cannot edit Student private notes.

## US-220 - Grounded Student AI Tutor

**Priority:** V2-P1

As a Student, I want to ask questions about a published lesson, so that I can understand the material without leaving the course context.

Acceptance Criteria:

- Tutor only answers from published lesson and allowed source chunks.
- Answer includes citations.
- If not enough evidence, tutor says it cannot answer from current sources.
- Teacher/Admin can enable/disable tutor per class or lesson.
- Chat history is stored with user and lesson scope.

# Epic 8 - LMS Lite

## US-221 - Assignment Lite

**Priority:** V2-P2

As a Teacher, I want to create a simple assignment from a lesson, so that students can practice after learning.

Acceptance Criteria:

- Teacher creates assignment title/instructions/due date.
- Assignment linked to class/lesson.
- Student sees assigned work.

## US-222 - Student submission

**Priority:** V2-P2

As a Student, I want to submit text or a file/link, so that Teacher can review my work.

Acceptance Criteria:

- Student submits before/after due date with status.
- Teacher sees submission list.
- Student can view submitted status.

## US-223 - Gradebook Lite

**Priority:** V2-P2

As a Teacher, I want to enter score/comment, so that students receive basic feedback.

Acceptance Criteria:

- Manual score/comment per submission.
- Student sees feedback.
- Teacher exports CSV.
- No weighted gradebook in V2.

## US-224 - Attendance Lite

**Priority:** V2-P2

As a Teacher, I want to mark attendance for a session, so that class participation is tracked lightly.

Acceptance Criteria:

- Teacher marks present/absent.
- Attendance linked to class/session.
- CSV export.
- No geolocation/realtime check-in in V2.

# Epic 9 - Analytics & Ops

## US-225 - Teacher class analytics

**Priority:** V2-P2

As a Teacher, I want basic class analytics, so that I know whether students are opening lessons.

Acceptance Criteria:

- Lesson view count.
- Completion count/rate.
- Student progress aggregate.
- No predictive scoring in V2.

## US-226 - Admin usage dashboard

**Priority:** V2-P2

As an Admin, I want usage and job health metrics, so that I can operate a small production workspace.

Acceptance Criteria:

- Active users.
- Lessons generated/published.
- AI jobs completed/failed.
- Document ingestion status.

## US-227 - Backup/export/delete runbook

**Priority:** V2-P0

As an Operator, I want documented backup/export/delete procedures, so that production data can be recovered or removed safely.

Acceptance Criteria:

- Backup process documented.
- Restore smoke documented.
- User data delete/export process documented.
- Secrets are not printed in logs.

# V2 Production Acceptance Flow

```txt
Admin creates organization
→ Admin invites Teacher and Student
→ Teacher creates course/class
→ Teacher adds Student to class
→ Teacher uploads/ingests document as background job
→ Teacher generates outline/lesson through job lifecycle
→ Teacher submits lesson revision
→ Admin reviews and publishes
→ Student opens lesson and progress is saved
→ Student asks grounded tutor question with citations
→ Backend restart
→ All core data remains available
```
