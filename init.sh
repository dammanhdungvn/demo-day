#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

fail() {
  echo "FAIL: $*" >&2
  exit 1
}

warn() {
  echo "WARN: $*" >&2
}

info() {
  echo "==> $*"
}

require_file() {
  [ -f "$1" ] || fail "Thieu file bat buoc: $1"
}

run_frontend_script_if_present() {
  local script_name="$1"
  if ! command -v node >/dev/null 2>&1; then
    fail "Can Node.js de kiem tra frontend scripts"
  fi

  if node -e "const fs=require('fs'); const pkg=JSON.parse(fs.readFileSync('frontend/package.json','utf8')); process.exit(pkg.scripts && pkg.scripts[process.argv[1]] ? 0 : 1)" "$script_name"; then
    pnpm --dir frontend run "$script_name"
  else
    warn "frontend/package.json chua co script '$script_name', skip"
  fi
}

info "Kiem tra harness files"
require_file "AGENTS.md"
require_file "feature_list.json"
require_file "progress.md"
require_file "session-handoff.md"
require_file "docs/version1/MVP.md"
require_file "docs/version1/PRD_MVP.md"
require_file "docs/version1/USER_STORIES_MVP.md"
require_file "docs/harness/SOP.md"
require_file "docs/harness/TASK_NOTE_TEMPLATE.md"
require_file "docs/harness/ARCHITECTURE.md"
require_file "docs/harness/QUALITY_SCORE.md"
require_file "docs/harness/RELIABILITY_SECURITY.md"
require_file "docs/harness/exec-plans/tech-debt-tracker.md"
require_file ".env.example"

info "Kiem tra feature_list.json hop le"
if command -v python3 >/dev/null 2>&1; then
  python3 -m json.tool feature_list.json >/tmp/teachflow_feature_list_check.json
elif command -v python >/dev/null 2>&1; then
  python -m json.tool feature_list.json >/tmp/teachflow_feature_list_check.json
else
  warn "Khong tim thay python/python3 de validate JSON"
fi

info "Kiem tra .env.example co cac bien bat buoc"
required_env_keys=(
  "VITE_BACKEND_URL"
  "BACKEND_URL"
  "SUPABASE_URL"
  "SUPABASE_ANON_KEY"
  "SUPABASE_SERVICE_ROLE_KEY"
  "DATABASE_URL"
  "AI_PROVIDER"
  "AI_API_KEY"
  "GENERATION_MODEL"
  "EMBEDDING_MODEL"
)

for key in "${required_env_keys[@]}"; do
  if ! grep -qE "^${key}=" .env.example; then
    fail ".env.example thieu bien ${key}"
  fi
done

if [ -f ".env" ]; then
  info "Tim thay .env local"
else
  warn "Chua co .env local; copy tu .env.example khi can chay app"
fi

info "Kiem tra frontend neu da ton tai"
if [ -f "frontend/package.json" ]; then
  command -v pnpm >/dev/null 2>&1 || fail "Frontend dung pnpm nhung chua tim thay pnpm"

  if [ -f "frontend/pnpm-lock.yaml" ]; then
    pnpm --dir frontend install --frozen-lockfile
  else
    pnpm --dir frontend install
  fi

  run_frontend_script_if_present "typecheck"
  run_frontend_script_if_present "lint"
  run_frontend_script_if_present "test"
  run_frontend_script_if_present "build"
else
  warn "Chua co frontend/package.json; P0-001 can tao frontend Vite React TSX"
fi

if [ -d "frontend/src" ]; then
  info "Kiem tra frontend khong hardcode backend URL hoac secret keys"
  if grep -R --line-number "localhost:3000/api/v1" frontend/src; then
    fail "Frontend source khong duoc hardcode localhost:3000/api/v1; hay dung VITE_BACKEND_URL"
  fi
  if grep -R --line-number -E "AI_API_KEY|OPENAI_API_KEY|NVIDIA_OPENAI_API_KEY|SUPABASE_SERVICE_ROLE_KEY" frontend/src; then
    fail "Frontend source dang expose secret key name; kiem tra lai env boundary"
  fi
fi

info "Kiem tra backend neu da ton tai"
if [ -f "backend/pyproject.toml" ]; then
  command -v uv >/dev/null 2>&1 || fail "Backend dung uv nhung chua tim thay uv"
  (
    cd backend
    uv sync
    if [ -d "tests" ]; then
      uv run pytest
      uv run python -m compileall tests
    else
      warn "backend/tests chua ton tai; task backend tiep theo phai tao tests hoac test plan"
    fi
    if [ -d "app" ]; then
      uv run python -m compileall app
    elif [ -f "main.py" ]; then
      uv run python -m compileall main.py
    else
      warn "backend/app hoac backend/main.py chua ton tai; P0-001 can tao FastAPI app"
    fi
  )
else
  warn "Chua co backend/pyproject.toml; P0-001 can tao backend FastAPI bang uv"
fi

info "Harness verification complete"
echo "Next: doc feature_list.json, chon dung mot P0 feature, va viet test/test plan truoc khi code."
