# TeachFlow AI Version 5 - Market-Fit Product Bets

## Muc Tieu

Version 5 dua TeachFlow AI tu “workflow tao bai giang co citation” sang san pham co ngach ro tren thi truong:

```txt
Trung tam dao tao / department nho
-> co tai lieu noi bo rieng
-> can bien thanh lesson co citation
-> can Student hoi-dap co kiem soat
-> khong muon mua LMS/AI platform enterprise nang
```

## Nguyen Tac

- Khong canh tranh truc tiep voi LMS lon, district AI platform hoac consumer tutor rong.
- Loi the cua TeachFlow la private knowledge, citation, teacher/admin governance va workflow nhe cho nhom nho.
- Feature moi phai giam thoi gian tao-bai-va-hoc-that, khong chi them UI.
- Student AI phai grounded theo lesson/tai lieu da publish; neu thieu citation thi noi ro khong du bang chung.

## Feature Dau Tien

- `V5-001`: Student grounded tutor cho lesson da publish.
  - Student hoi dap trong lesson dang hoc.
  - Backend enforce Student role, lesson `published`, class membership va organization scope.
  - Prompt chi dung lesson blocks + citations da sanitize.
  - Response tra citation va warning neu cau tra loi chua du grounded.

## Trang Thai Sau V5-001

- Backend da co `POST /api/v1/student/lessons/{lesson_id}/tutor`.
- Frontend Student reader da co panel `AI Tutor co citation`.
- Future disabled tutor slot da duoc go bo vi tutor da la workflow that.
- Tests va rendered QA desktop/mobile da pass; evidence nam trong `feature_list.json`, `progress.md` va exec plan completed.
