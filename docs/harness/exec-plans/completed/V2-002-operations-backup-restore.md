# Exec Plan - V2-002 Backup, restore, export, and delete runbook

## Muc Tieu

- Feature: `V2-002 Backup, restore, export, and delete runbook`
- User stories: `US-227`
- Ket qua user can validate: repo co runbook ngan gon de operator biet backup/restore/export/delete production data, khong in secrets va co restore smoke.
- Vertical slice: docs operations + mechanical check trong `init.sh`.

## Scope V2-P0

- Lam:
  - Tao `docs/harness/OPERATIONS_RUNBOOK.md`.
  - Ghi quy trinh backup, restore smoke, export/delete user data va secret-safe logging.
  - Cap nhat `init.sh` require file va section chinh.
- Khong lam:
  - Tu dong restore database production.
  - Tao Supabase CLI migration/history.
  - UI admin ops page.
- Dependencies da xong:
  - `V2-001`
- Source-of-truth da doc:
  - `docs/version2/PRD_V2_PRODUCTION.md`
  - `docs/version2/USER_STORIES_V2.md`
  - Supabase official docs `https://supabase.com/docs/guides/platform/backups.md`
- Khong dung: `README.md`

## Cau Hoi / Context Chua Ro

- [x] Khong co blocker business rule. Runbook ghi ro nhung thao tac destructive can operator confirm ngoai app.
- [ ] Can hoi user:

## Test Plan Truoc Khi Code

### Automated tests

- Backend:
  - Khong doi backend.
- Frontend:
  - Khong doi frontend.
- Integration/e2e:
  - `./init.sh` pass.
- Security/access:
  - `init.sh` check runbook co section `Secret Safety`.
  - `git diff --check` pass.

### Manual validation

Prerequisite:
- Co Supabase project va quyen truy cap dashboard/CLI neu can backup/restore that.

Steps:
1. Mo `docs/harness/OPERATIONS_RUNBOOK.md`.
2. Kiem tra cac section Backup, Restore Smoke, User Data Export, User Data Delete, Secret Safety.
3. Xac nhan command mau khong in secret value.

Expected:
- Operator biet backup bang dashboard/CLI, restore smoke tren project/staging, export/delete user data va khong log secrets.

Negative check:
- Runbook khong yeu cau commit token, service role key, database password hoac raw backup vao repo.

## Implementation Plan Theo Vertical Slice

Backend:
- Khong doi.

Frontend:
- Khong doi.

Tests:
- Cap nhat `init.sh` require runbook va section chinh.
- Chay `./init.sh`, `git diff --check`.

Docs / Env:
- Tao `docs/harness/OPERATIONS_RUNBOOK.md`.
- Cap nhat `feature_list.json`, `progress.md`, `session-handoff.md`, `docs/OVERNIGHT_HANDOFF.md`.

## Evidence Sau Khi Lam

Commands da chay:
- `curl -L https://supabase.com/docs/guides/platform/backups.md`
- `./init.sh`
- `git diff --check`

Ket qua:
- Da doc docs Supabase backup official: managed backups/PITR, free tier logical dump, restore downtime, Storage objects khong nam trong DB backup.
- Tao `docs/harness/OPERATIONS_RUNBOOK.md`.
- `init.sh` require runbook va check cac section bat buoc.
- Final `./init.sh` pass: frontend 11 files/43 tests + build, backend 63 tests.
- `git diff --check` pass.

Manual validation da huong dan user:
- Mo `docs/harness/OPERATIONS_RUNBOOK.md`.
- Kiem tra cac section Backup Process, Restore Smoke, User Data Export, User Data Delete, Secret Safety.
- Xac nhan command mau khong yeu cau commit/in secret.

## Files Changed

- `docs/harness/OPERATIONS_RUNBOOK.md`
- `init.sh`
- `feature_list.json`
- `docs/harness/exec-plans/completed/V2-002-operations-backup-restore.md`

## Blockers / Next Step

- V2-P0 tiep theo nen la production auth/organization hoac persistence outlines/lesson/jobs.

## Quality Gate

- [x] Khong vuot V2-P0 scope.
- [x] Co evidence test hoac ly do chua co test automation.
- [x] Co manual validation steps cho user.
- [x] Khong hardcode secrets/backend URL.
- [x] Neu co shortcut/debt, da ghi vao `docs/harness/exec-plans/tech-debt-tracker.md`.
