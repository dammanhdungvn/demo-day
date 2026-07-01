# AI Safety Eval Notes - V4-032

## Muc Dich

V4-032 them lop guardrail nhe cho RAG/AI generation de giam hai nhom loi production:

- Source poisoning / prompt injection trong PDF hoac web page: tai lieu co the chua cau lenh yeu cau AI bo qua system prompt, tiet lo secret, doi role, tao noi dung sai muc tieu.
- Hallucination / weak grounding: lesson block duoc AI tao ra nhung khong co citation hoac citation qua yeu de Teacher/Admin tin cay.

Muc tieu khong phai thay the human review. Muc tieu la bien citation, warning va source safety thanh first-class signal trong Teacher Lesson Studio va Admin review.

## Thiet Ke

Backend co module `backend/app/ai_safety.py`:

- `SOURCE_UNTRUSTED_POLICY`: instruction dua vao prompt de nhac model rang source la reference text khong duoc lam theo.
- `assess_source_text_safety`: deterministic detector cho cac pattern prompt injection/doc poisoning pho bien.
- `sanitize_source_excerpt_for_prompt`: loai bo hoac mask cac segment nguy hiem truoc khi dua vao prompt.
- `evaluate_groundedness`: danh gia block theo citation count, citation score va lexical grounding signal de tao warning.
- Retrieval eval fixture nho trong `backend/tests/fixtures/retrieval_eval_cases.json` de co baseline deterministic.

PDF/web ingestion sanitize source text truoc khi chunk/persist metadata. Outline/lesson/regenerate prompt dua untrusted-source policy va chi dung source excerpt da sanitize.

## UX

Teacher Lesson Studio va Admin review hien warning/citation summary ro hon:

- Block co `warning` hien canh bao ngay tren block rail va citation panel.
- Citation panel co summary `Grounding & citations`, tinh tu citation count/score/warning that.
- Admin review thay warning count va co co so request changes neu lesson thieu nguon.

## Security/Trust Note

Trong cung session, login UI da duoc hotfix theo feedback user:

- Khong hien API base URL tren login/dashboard.
- Khong hien hoac hardcode mat khau demo trong frontend.
- Quick access 3 role van ton tai, nhung dung `POST /auth/demo-login` voi `account_id`; backend gate bang `ENABLE_DEMO_LOGIN` va demo auth mode.

## Evidence

- `cd backend && UV_CACHE_DIR=.uv-cache uv run pytest tests/test_ai_safety.py -q`: 5 passed.
- `cd backend && UV_CACHE_DIR=.uv-cache uv run pytest tests/test_lesson_blocks.py tests/test_knowledge_rag.py tests/test_ai_outline.py -q`: 62 passed.
- `cd backend && UV_CACHE_DIR=.uv-cache uv run pytest tests/test_auth.py tests/test_openapi_contract.py -q`: 22 passed.
- `pnpm --dir frontend typecheck`: pass.
- `pnpm --dir frontend test -- --run`: 14 files / 61 tests passed.
- Playwright fallback QA: Teacher/Admin grounding screenshots pass, login security screenshot pass.
- `./init.sh`: frontend typecheck/lint/test/build pass, backend 160 tests pass.

## Limit

- Chua co LLM judge bat dong bo.
- Chua co storage governance/TTL/quota; pham vi nay la `V4-033`.
- Deterministic evaluator la guardrail/review signal, khong dam bao tuyet doi moi hallucination.
