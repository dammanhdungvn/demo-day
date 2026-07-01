# Version 1 P2 Migration To Version 2/3

## Muc Dich

Version 1 P2 la danh sach "future" khong lam trong MVP. Khi chuyen sang san pham production, khong nen dua tat ca vao version 2 mot cach ngang hang. Tai lieu nay phan loai lai theo gia tri san pham, do phu hop hien tai va rui ro ky thuat.

Nguyen tac:

- Cai nao giup san pham dung that ngay thi dua vao V2.
- Cai nao can production telemetry/data truoc thi dua V3.
- Cai nao enterprise nang thi de V3 hoac Future.
- Moi feature AI moi phai grounded, co citation, co permission va co kill switch.

## Migration Matrix

| V1 P2 item | Quyet dinh moi | Ly do |
|---|---|---|
| Student AI tutor | V2-P1 | Gia tri cao cho Student, phu hop san pham, nhung phai grounded theo published lesson/source citation. |
| Student chatbot hoi dap | Gop vao Student AI Tutor V2-P1 | Khong tao chatbot rieng tu do; chat chi la UI cua tutor co guardrail. |
| Adaptive learning ca nhan | V3-P0 | Can progress data, quiz/submission data va analytics tu V2 truoc khi ca nhan hoa that su. |
| YouTube/link ingestion | V2-P1 ban gioi han | Huu ich cho Teacher; V2 chi ingest web page/transcript text, khong xu ly video/audio nang. |
| Internet research agent | V3-P1 | Rui ro hallucination/source quality; can source governance va citation policy manh hon. |
| Paper research agent | V3-P1 | Huu ich cho higher-ed, nhung can ingestion/search/evaluation tot hon sau V2. |
| GraphRAG production | V3-P1 | Khong can cho <=1000 users giai doan dau; can corpus lon va eval truoc. |
| RAG multimodal phuc tap | V3-P2 | Can pipeline hinh/slide/table, ton cong hon gia tri V2. |
| Multi-agent/multi-router day du | V3/Internal | Nen chi lam khi workflow AI phuc tap hon va co observability tot. |
| LMS gradebook | V2-P2 Gradebook Lite | Ban nhe manual score/comment/CSV du gia tri, khong lam weighted gradebook. |
| LMS diem danh | V2-P2 Attendance Lite | Ban nhe present/absent/CSV phu hop class nho. |
| LMS bai nop sinh vien | V2-P2 Assignment/Submission Lite | Gia tri ro cho Teacher/Student, nhung lam sau production foundation. |
| SCORM/xAPI/LTI | V3-P2 | Enterprise integration, khong can cho <=1000 users ban dau. |
| Collaborative editing realtime | V3-P2 | Huu ich nhung phuc tap; V2 co lesson revision/versioning truoc. |
| Native mobile app | Future sau V3/PWA | Chua nen lam native khi web/PWA chua du usage data. |
| Analytics dashboard nang cao | V2-P2 basic, V3 advanced | V2 lam usage/job/progress basic; V3 moi lam predictive/adaptive analytics. |

## V2 Scope Lay Tu P2 Version 1

Nhung muc duoc dua vao V2:

1. Student AI Tutor grounded.
2. Link ingestion va YouTube transcript ingestion gioi han.
3. Assignment Lite.
4. Submission Lite.
5. Gradebook Lite.
6. Attendance Lite.
7. Analytics Basic.

Nhung muc nay khong duoc lam truoc V2-P0 production foundation.

## V3 Scope Lay Tu P2 Version 1

Nhung muc nen chuyen sang V3:

1. Adaptive learning.
2. Internet/paper research agent.
3. GraphRAG/hybrid advanced retrieval.
4. Multimodal RAG.
5. Multi-agent orchestration.
6. SCORM/xAPI/LTI.
7. Collaborative editing realtime.
8. Advanced analytics.

## Product Manager Recommendation

Thu tu lam hop ly:

```txt
V2-P0: persistence/auth/jobs/permissions
→ V2-P1: student progress + grounded tutor + source ingestion
→ V2-P2: LMS Lite + analytics basic
→ V3: adaptive/advanced RAG/research/integrations/collaboration
```

Neu dao nguoc thu tu va lam tutor/GraphRAG/tracking truoc persistence/auth/job lifecycle, san pham se trong co ve "nhieu feature" nhung khong dung production on dinh.
