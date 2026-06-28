# Quality Score - TeachFlow AI MVP

Scorecard này giúp agent tự đánh giá mỗi vertical slice. Mục tiêu MVP không phải 100/100 tuyệt đối, mà là đủ tốt để demo end-to-end và không tạo rủi ro lớn.

## Cách Chấm

Mỗi feature P0 cần đạt tối thiểu:

- Product fit: 4/5
- Scope discipline: 5/5
- Test evidence: 3/5 trở lên
- Security/access: 4/5 với feature liên quan role/class/data
- Manual validation: 5/5

Nếu một mục dưới ngưỡng, không đánh dấu feature `done`; ghi blocker hoặc debt.

## Product Fit

5: Giải quyết đúng user story P0 và nằm trong demo flow chính.  
3: Chạy được nhưng còn thiếu UX hoặc state phụ.  
1: Lệch khỏi P0 hoặc không giúp demo flow.

## Scope Discipline

5: Không chạm P1/P2, không thêm abstraction nặng.  
3: Có thêm helper/abstraction nhỏ nhưng chứng minh được cần thiết.  
1: Xây feature ngoài MVP hoặc framework nặng chưa cần.

## Test Evidence

5: Có automated tests cho logic chính và `./init.sh` pass.  
3: Có test plan rõ, một phần automated, manual validation đủ cụ thể.  
1: Chỉ nói đã test, không có evidence.

## Security / Access

5: Role, ownership, membership, status checks đều có test/negative check.  
3: Có guard chính, còn một số negative check manual.  
1: Chỉ ẩn UI, backend không check quyền.

## Manual Validation

5: Có prerequisite, steps, expected, negative check.  
3: Có steps nhưng thiếu negative check.  
1: User không tự kiểm tra được.

## UX Reliability

5: Loading/empty/error/toast cho flow chính.  
3: Có happy path và error message cơ bản.  
1: Fail im lặng hoặc UI không rõ bước tiếp theo.
