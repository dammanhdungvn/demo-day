# Tech Debt Tracker - TeachFlow AI

Ghi mọi shortcut hoặc debt được chấp nhận trong MVP. Debt không được dùng để che lấp lỗi role permission, class membership, secret exposure, hoặc business rule chưa rõ.

| ID | Ngày | Feature | Debt / Shortcut | Lý do chấp nhận | Rủi ro | Điều kiện xử lý |
|---|---|---|---|---|---|---|
| TD-001 | 2026-06-28 | Harness | Chưa có frontend/backend nên `init.sh` chỉ verify harness và cảnh báo scaffold còn thiếu. | P0-001 sẽ tạo app scaffold chính thức. | Agent có thể quên bật checks app-level. | Khi tạo `frontend/` và `backend/`, `init.sh` phải chạy typecheck/test/build/compile tương ứng. |
