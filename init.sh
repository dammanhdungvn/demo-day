#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

export XDG_CACHE_HOME="$ROOT/.cache"
export XDG_DATA_HOME="$ROOT/.local/share"
export UV_CACHE_DIR="$ROOT/.cache/uv"
export PNPM_HOME="$XDG_DATA_HOME/pnpm"
export PATH="$ROOT/.local/bin:$PNPM_HOME:$PATH"
mkdir -p "$ROOT/.local/bin" "$UV_CACHE_DIR" "$PNPM_HOME"

if ! command -v node >/dev/null 2>&1 && [ -s "$HOME/.nvm/nvm.sh" ]; then
  # Non-interactive shells do not always load nvm from .bashrc.
  # shellcheck disable=SC1090
  . "$HOME/.nvm/nvm.sh"
fi

if command -v corepack >/dev/null 2>&1; then
  pnpm() {
    local cached_pnpm="$HOME/.cache/node/corepack/v1/pnpm/11.9.0/bin/pnpm.mjs"
    if [ -f "$cached_pnpm" ]; then
      node "$cached_pnpm" "$@"
    else
      corepack pnpm@11.9.0 "$@"
    fi
  }
fi

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

has_env_key() {
  local file_path="$1"
  local key="$2"
  grep -qE "^[[:space:]]*(export[[:space:]]+)?${key}[[:space:]]*=" "$file_path"
}

info "Kiem tra harness files"
require_file "AGENTS.md"
require_file "feature_list.json"
require_file "progress.md"
require_file "session-handoff.md"
require_file "docs/version1/MVP.md"
require_file "docs/version1/PRD_MVP.md"
require_file "docs/version1/USER_STORIES_MVP.md"
require_file "docs/version2/README.md"
require_file "docs/version2/PRD_V2_PRODUCTION.md"
require_file "docs/version2/USER_STORIES_V2.md"
require_file "docs/version2/V1_P2_MIGRATION.md"
require_file "docs/version3/README.md"
require_file "docs/version3/PRD_V3_GROWTH.md"
require_file "docs/version3/USER_STORIES_V3.md"
require_file "docs/version4/README.md"
require_file "docs/version4/PRD_V4_PRODUCT_EXCELLENCE.md"
require_file "docs/version4/USER_STORIES_V4.md"
require_file "docs/version4/UX_RESEARCH_NOTES.md"
require_file "docs/version4/PRODUCT_REVIEW.md"
require_file "docs/version4/PRODUCTION_GAP_ANALYSIS.md"
require_file "docs/OVERNIGHT_HANDOFF.md"
require_file "docs/harness/SOP.md"
require_file "docs/harness/TASK_NOTE_TEMPLATE.md"
require_file "docs/harness/ARCHITECTURE.md"
require_file "docs/harness/QUALITY_SCORE.md"
require_file "docs/harness/RELIABILITY_SECURITY.md"
require_file "docs/harness/OPERATIONS_RUNBOOK.md"
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

info "Kiem tra operations runbook co cac section bat buoc"
required_runbook_sections=(
  "Backup Process"
  "Restore Smoke"
  "User Data Export"
  "User Data Delete"
  "Secret Safety"
)

for section in "${required_runbook_sections[@]}"; do
  if ! grep -q "$section" docs/harness/OPERATIONS_RUNBOOK.md; then
    fail "docs/harness/OPERATIONS_RUNBOOK.md thieu section ${section}"
  fi
done

info "Kiem tra .env.example co cac bien bat buoc"
required_env_keys=(
  "URL_BACKEND"
  "URL_SUPABASE"
  "PUBLIC_API_KEY_SUPABASE"
  "SECRET_API_KEY_SUPABASE"
  "OPENAI_API_KEY"
  "OPENAI_MODEL"
)

for key in "${required_env_keys[@]}"; do
  if ! has_env_key ".env.example" "$key"; then
    fail ".env.example thieu bien ${key}"
  fi
done

local_env_file=""
if [ -f ".env.local" ]; then
  local_env_file=".env.local"
elif [ -f ".env" ]; then
  local_env_file=".env"
fi

if [ -n "$local_env_file" ]; then
  info "Tim thay ${local_env_file}; kiem tra ten bien bat buoc"
  for key in "${required_env_keys[@]}"; do
    if ! has_env_key "$local_env_file" "$key"; then
      fail "${local_env_file} thieu bien ${key}; chi kiem tra ten bien, khong in gia tri secret"
    fi
  done
else
  warn "Chua co .env.local/.env; copy tu .env.example khi can chay app"
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
    fail "Frontend source khong duoc hardcode localhost:3000/api/v1; hay dung URL_BACKEND tu env"
  fi
  if grep -R --line-number -E "OPENAI_API_KEY|NVIDIA_OPENAI_API_KEY|SECRET_API_KEY_SUPABASE" frontend/src; then
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
