# PRD Version 3 - TeachFlow AI Growth

## 1. Muc Dich

Version 3 mo rong TeachFlow AI tu "production lesson creation platform" thanh "learning workflow platform" co kha nang ca nhan hoa, ho tro hoc tap sau lesson va tich hop voi he sinh thai giao duc.

Version 3 chi nen bat dau khi Version 2 da:

- auth production.
- persistent DB cho core objects.
- job lifecycle AI/RAG.
- student progress data.
- basic analytics.
- production monitoring.

## 2. Product Thesis

Sau Version 2, TeachFlow AI co du lieu that ve:

- Teacher tao lesson nhu the nao.
- Student hoc lesson nao, bo qua block nao.
- Student hoi tutor cau gi.
- Assignment/submission nao kho voi lop.

Version 3 dung du lieu nay de tao gia tri moi:

```txt
Teacher khong chi tao bai giang nhanh hon
→ Teacher hieu lop hoc hon
→ Student co duong hoc va tro giup phu hop hon
```

## 3. V3 Product Pillars

### Pillar 1 - Adaptive Learning

Ca nhan hoa dua tren evidence that, khong dua tren doan mo ho.

Scope:

- learner profile tu progress, quiz, assignment, tutor questions.
- recommended review blocks.
- personalized practice questions.
- weak concept detection.
- Teacher approve/adjust recommendations.

### Pillar 2 - Advanced Tutor & Practice

Tutor khong chi Q&A, ma ho tro hoc co cau truc:

- Socratic hints.
- practice quiz generation.
- explain again with level/style.
- study plan for a lesson/module.
- tutor summaries for Teacher.

Tat ca van phai grounded hoac noi ro khi khong co du source.

### Pillar 3 - Advanced Knowledge & Research

Mo rong source nhung co governance:

- hybrid search/vector + keyword.
- GraphRAG cho corpus lon/co quan he.
- paper research workspace.
- web research co source allowlist.
- multimodal extraction cho slide/table/image khi co nhu cau that.

### Pillar 4 - Collaboration & Integrations

Chi lam khi co user demand:

- collaborative lesson editing.
- template library/team library.
- SCORM/xAPI/LTI export/integration.
- calendar/LMS sync.
- PWA/mobile-first improvements before native app.

### Pillar 5 - Advanced Analytics

Khong chi dashboard vanity metrics:

- concept difficulty per class.
- lesson effectiveness signals.
- assignment misconception clusters.
- AI usage/cost optimization insight.
- Admin quality/compliance dashboard.

## 4. V3 Priorities

| Priority | Y nghia |
|---|---|
| V3-P0 | Gia tri hoc tap truc tiep, dua tren data V2 |
| V3-P1 | Advanced source/research/tutor capabilities |
| V3-P2 | Collaboration/integrations/mobile sau khi co nhu cau ro |

## 5. Scope V3-P0

### 5.1 Adaptive Review Recommendations

Student nhan recommended blocks/practice dua tren progress, quiz, tutor questions va submission signals.

### 5.2 Personalized Practice

AI tao practice questions theo lesson va muc do Student, co answer/explanation/citation.

### 5.3 Teacher Insight Dashboard

Teacher thay:

- concept nao nhieu Student hoi lai.
- lesson nao completion thap.
- assignment nao nhieu loi chung.
- goi y review session.

### 5.4 AI Feedback Assistant

AI goi y feedback cho submission, nhung Teacher la nguoi final.

Non-goal:

- Khong auto-grade final diem khong co human review.

## 6. Scope V3-P1

### 6.1 Hybrid/Graph Retrieval

Dung khi corpus lon hon va citation can lien ket concept:

- keyword + vector hybrid.
- concept graph/doc relationship.
- retrieval eval set.

### 6.2 Paper/Web Research Workspace

Teacher co the gom source moi cho course:

- search/import paper metadata.
- source quality labels.
- citation tracking.
- generated reading notes.

### 6.3 Multimodal Source Extraction

Mo rong ingestion:

- slide decks.
- images/diagrams in PDF.
- tables.

Chi lam khi V2 source ingestion da on.

## 7. Scope V3-P2

### 7.1 Collaborative Editing

Teacher team co the cung sua lesson:

- comments/suggestions.
- lock or merge simple.
- audit trail.

Realtime editing chi lam neu async collaboration khong du.

### 7.2 Integrations

- SCORM export.
- xAPI events.
- LTI launch.
- LMS sync.

Chi lam khi co customer/user can.

### 7.3 Mobile Strategy

Thu tu:

1. Responsive web polish.
2. PWA/offline reading neu can.
3. Native mobile app chi khi co usage va retention signal.

## 8. V3 Non-goals

- Khong bien TeachFlow AI thanh LMS enterprise day du neu chua co nhu cau.
- Khong auto-grade high-stakes assignments.
- Khong cho AI research tu do khong citation/source quality.
- Khong lam native mobile truoc khi web/PWA du data.

## 9. Success Metrics

Learning value:

- Student quay lai lesson/practice tang.
- Tutor answer citation coverage cao.
- Teacher su dung insight de tao review session.
- Completion rate lesson/class tang.

Quality:

- Tutor hallucination reports giam.
- Retrieval eval pass tren bo test.
- Teacher override recommendations duoc ghi nhan de cai tien.

Operational:

- Advanced jobs co status/retry/logs.
- AI cost per active class nam trong budget.

## 10. Release Criteria V3

V3 release dau tien nen gom:

1. Adaptive review recommendations.
2. Personalized practice grounded.
3. Teacher insight dashboard.
4. AI feedback assistant with human approval.
5. Retrieval eval improvements neu tutor/practice phu thuoc source moi.

GraphRAG, multimodal, SCORM/LTI, realtime collaboration nen la later milestones, khong phai V3 first release.
