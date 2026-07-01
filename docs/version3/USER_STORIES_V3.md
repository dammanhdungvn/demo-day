# User Stories Version 3 - Growth Features

## Priority

| Priority | Y nghia |
|---|---|
| V3-P0 | Huu ich truc tiep cho hoc tap va day hoc |
| V3-P1 | Nang cao AI/RAG/source capabilities |
| V3-P2 | Collaboration/integration/mobile khi co demand that |

---

# Epic 1 - Adaptive Learning

## US-301 - Learner profile

**Priority:** V3-P0

As a Student, I want the system to remember my learning signals, so that recommendations fit my needs.

Acceptance Criteria:

- Profile derives from lesson progress, practice results, tutor questions, submissions.
- Student can see a simple "areas to review" view.
- Teacher sees aggregate class patterns, not private sensitive detail by default.

## US-302 - Adaptive review recommendation

**Priority:** V3-P0

As a Student, I want recommended blocks to review, so that I can focus on weak concepts.

Acceptance Criteria:

- Recommendations link to lesson blocks.
- Reason is explainable: incomplete, quiz miss, repeated tutor question, Teacher flag.
- Student can mark recommendation helpful/not helpful.

## US-303 - Personalized practice

**Priority:** V3-P0

As a Student, I want practice questions based on a lesson, so that I can test understanding.

Acceptance Criteria:

- Questions generated from published lesson/source chunks.
- Answer/explanation includes citation.
- Difficulty can adapt to learner level.
- Teacher can disable practice for a lesson/class.

# Epic 2 - Advanced Tutor

## US-304 - Socratic tutor mode

**Priority:** V3-P0

As a Student, I want hints before direct answers, so that I learn actively.

Acceptance Criteria:

- Tutor can respond with hints.
- Student can ask for full explanation.
- Tutor remains grounded in current lesson/source.

## US-305 - Study plan for a lesson

**Priority:** V3-P0

As a Student, I want a short study plan, so that I know what to review before class or exam.

Acceptance Criteria:

- Plan uses lesson blocks, progress and weak areas.
- Plan is scoped to one class/course.
- Plan does not invent unavailable materials.

## US-306 - Teacher tutor insights

**Priority:** V3-P0

As a Teacher, I want to know what students ask the tutor most, so that I can adjust teaching.

Acceptance Criteria:

- Dashboard groups common question themes.
- No raw private chat shown unless policy permits.
- Teacher sees related lesson concepts and citations.

# Epic 3 - AI Feedback & Assessment Support

## US-307 - AI feedback suggestion

**Priority:** V3-P0

As a Teacher, I want AI to suggest feedback on submissions, so that I can respond faster while staying in control.

Acceptance Criteria:

- AI suggestion references rubric/assignment/lesson source where relevant.
- Teacher must approve/edit before Student sees it.
- System marks AI-assisted feedback.

## US-308 - Misconception clustering

**Priority:** V3-P0

As a Teacher, I want common misconceptions summarized, so that I can plan review activities.

Acceptance Criteria:

- Clusters from quiz/submission/tutor signals.
- Each cluster links to affected lesson concepts.
- Teacher can dismiss or convert to review block.

# Epic 4 - Advanced Knowledge & Research

## US-309 - Hybrid retrieval

**Priority:** V3-P1

As a System, I want hybrid keyword/vector retrieval, so that citations improve for technical terms and exact concepts.

Acceptance Criteria:

- Retrieval combines vector and keyword signals.
- Evaluation set compares old/new retrieval.
- API response still includes citation metadata.

## US-310 - GraphRAG for course concepts

**Priority:** V3-P1

As a Teacher, I want concepts connected across documents, so that lessons can reference prerequisite and related ideas.

Acceptance Criteria:

- Concept graph built from approved documents.
- Graph is used only when it improves retrieval/explanation.
- Teacher can inspect concept/source relationship.

## US-311 - Paper research workspace

**Priority:** V3-P1

As a Teacher, I want to collect papers and source notes, so that course material stays academically grounded.

Acceptance Criteria:

- Teacher imports paper metadata/source.
- System extracts summary and key concepts with citation.
- Teacher approves source before it enters class knowledge base.

## US-312 - Multimodal extraction

**Priority:** V3-P1

As a Teacher, I want diagrams/tables/slides extracted when useful, so that visual learning material is not lost.

Acceptance Criteria:

- Supports selected source types first.
- Extracted visual/table content has source reference.
- Fallback error is clear when unsupported.

# Epic 5 - Collaboration

## US-313 - Lesson comments and suggestions

**Priority:** V3-P2

As a Teacher team, I want comments/suggestions on lesson blocks, so that we can collaborate without overwriting each other.

Acceptance Criteria:

- Comment on a block.
- Suggest edit.
- Accept/reject suggestion.
- Audit event records collaboration action.

## US-314 - Shared template library

**Priority:** V3-P2

As a Teacher, I want reusable lesson templates, so that I can standardize quality across classes.

Acceptance Criteria:

- Save a lesson/block structure as template.
- Use template for a new lesson.
- Organization-level templates can be managed by Admin.

# Epic 6 - Integrations

## US-315 - SCORM export

**Priority:** V3-P2

As an Admin, I want SCORM export when needed, so that content can move to an external LMS.

Acceptance Criteria:

- Export selected published lesson.
- Export job has status.
- Permission checked.

## US-316 - LTI launch

**Priority:** V3-P2

As an institution, I want LTI integration, so that users can open TeachFlow AI from an LMS.

Acceptance Criteria:

- Only after a real integration need is confirmed.
- Role/class mapping is documented.
- Auth/security review is required.

# Epic 7 - Mobile Strategy

## US-317 - PWA reading mode

**Priority:** V3-P2

As a Student, I want a mobile-friendly reading experience, so that I can review lessons away from desktop.

Acceptance Criteria:

- Responsive lesson reading polished.
- Installable PWA considered before native.
- Offline reading only for published lessons if feasible.

# V3 First Release Recommendation

V3 first release should include:

```txt
US-301 Learner profile
US-302 Adaptive review recommendation
US-303 Personalized practice
US-306 Teacher tutor insights
US-307 AI feedback suggestion
US-308 Misconception clustering
```

Defer SCORM/LTI, native mobile, realtime collaboration and GraphRAG until there is clear user demand and V2 production metrics are stable.
