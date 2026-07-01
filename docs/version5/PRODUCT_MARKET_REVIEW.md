# Product & Market Review - TeachFlow AI V5

Ngay cap nhat: 2026-06-30

## Ket Luan Ngach

TeachFlow AI khong nen canh tranh truc tiep voi:

- LMS enterprise day du.
- AI teacher assistant cho district/school quy mo lon.
- Consumer AI tutor rong cho moi mon hoc.

Ngach nen tap trung:

```txt
Small training centers / department training teams / bo mon nho
co tai lieu noi bo, syllabus, PDF, SOP, slide cu
can tao lesson co citation va cho learner hoi-dap grounded
nhung khong co instructional designer/team LMS rieng.
```

Ly do:

- Project da co Admin library hidden + Teacher/Student contextual docs + citation + moderation.
- Doi thu lon manh o scale, marketplace hoac district procurement; nhom nho can speed, trust va setup nhe hon.
- Pain point that la chuyen tai lieu noi bo thanh bai giang co the day/hoc ngay, sau do learner hoi lai dung theo nguon.

## Benchmark Thi Truong

- MagicSchool va Khanmigo dai dien nhom AI education assistant lon cho school/district/teacher workflows.
- Diffit/Eduaide dai dien nhom tao tai lieu day hoc nhanh tu source/topic.
- Easygenerator/360Learning/Docebo/Articulate dai dien nhom authoring/LMS corporate training.

TeachFlow khong nen copy rong cac nhom nay. San pham nen di vao “private cited lesson workspace + grounded student support” cho nhom nho.

Nguon tham khao:

- https://www.magicschool.ai/
- https://www.khanmigo.ai/
- https://web.diffit.me/
- https://www.eduaide.ai/
- https://www.easygenerator.com/

## Review Code/Product Hien Tai

### Diem Manh

- Core flow dung huong: Teacher -> source/citation -> Lesson Studio -> Admin publish -> Student learn.
- Backend co guard role/membership/status va regression tests manh.
- Knowledge lifecycle da hop ly hon: Admin `library`, user `contextual`.
- Student da co progress, notes, bookmarks, review hub, practice deck va self-check.
- OpenAPI, logging, job lifecycle, AI safety va storage governance da co foundation.

### Diem Yeu

- `backend/app/main.py` van qua lon, con nhieu content/knowledge/student route va service logic chua tach.
- `TeacherWorkspace.tsx`, `StudentWorkspace.tsx` va `App.css` con lon, lam toc do polish/giam bug sau nay cham.
- Student value van thieu “hoi dap ngay trong luc hoc”; practice/self-check tot nhung chua du de learner quay lai hang ngay.
- Teacher solo/trung tam nho co the thay Admin approval la friction; can publish policy linh hoat sau V5-001.
- Retrieval production van phu thuoc env embedding; neu de local-hash trong runtime that thi chat luong semantic khong du canh tranh.
- Durable worker/retry/cancel cho AI/ingestion van la debt production.

## Feature Nen Lam

### P0 - Phai co de tang gia tri user

1. Student grounded tutor theo lesson da publish.
2. Teacher insight: cau hoi nao Student hoi nhieu, block nao hay bi `needs_review`.
3. Solo/institution publish mode: Teacher self-publish cho solo/trung tam nho; Admin approval cho institution.
4. Guided first lesson: template theo use case training center, SOP, onboarding, compliance, bo mon.

### P1 - Nen lam sau khi co usage

1. Rubric/answer-key practice: Teacher them answer key, Student duoc feedback co citation.
2. Class-level weak point report tu attempts/notes/tutor questions.
3. Citation quality scoring theo course/org threshold.
4. Durable async worker cho ingestion/generation/tutor logs.

### Nen Tam Chua Lam

- LMS day du: gradebook, attendance, assignment submission.
- Marketplace content.
- Social/community feed.
- Realtime collaborative editing.
- Mobile app native.

## V5-001 Quyet Dinh

Bat dau bang Student grounded tutor vi no:

- Tang gia tri truc tiep cho learner, khong chi cho Teacher/Admin.
- Tan dung citation/safety/permission da co.
- Khac biet voi AI tutor tong quat vi bi gioi han trong lesson da publish va source co provenance.
- Phu hop ngach nhom nho: learner co the hoi ve tai lieu noi bo ma AI public khong biet.

