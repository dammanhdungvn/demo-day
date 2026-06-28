from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from dataclasses import dataclass
from pathlib import Path

import psycopg
from pypdf import PdfReader

sys.path.append(str(Path(__file__).resolve().parents[1]))

from main import create_text_embedding, vector_to_sql  # noqa: E402


DEFAULT_BOOK_ROOT = Path(__file__).resolve().parents[2] / "data" / "books"
CHUNK_PATTERN = re.compile(r"\s+")


@dataclass(frozen=True)
class PdfChunk:
    content: str
    page_number: int
    chunk_index: int
    metadata: dict[str, str | int]


def parse_env_file(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    if not path.exists():
        return values

    for line in path.read_text().splitlines():
        raw = line.strip()
        if not raw or raw.startswith("#") or "=" not in raw:
            continue

        key, value = raw.split("=", 1)
        key = key.strip()
        if key.startswith("export "):
            key = key[7:].strip()
        values[key] = value.strip().strip('"').strip("'")

    return values


def database_conninfo() -> str:
    root = Path(__file__).resolve().parents[2]
    values = parse_env_file(root / ".env")
    conninfo = (
        values.get("SUPABASE_POOLER_CONNECTING_STRING")
        or values.get("DATABASE_URL")
        or values.get("SUPABASE_DIRECT_CONNECTING_STRING")
    )
    if not conninfo:
        raise RuntimeError("Missing SUPABASE_POOLER_CONNECTING_STRING or DATABASE_URL")
    return conninfo


def normalize_text(text: str) -> str:
    return CHUNK_PATTERN.sub(" ", text.replace("\x00", " ")).strip()


def file_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def title_from_path(path: Path) -> str:
    return path.stem.replace("_", " ").replace("-", " ").title()


def source_path_label(path: Path) -> str:
    try:
        return str(path.relative_to(DEFAULT_BOOK_ROOT.parent))
    except ValueError:
        return str(path)


def split_text(text: str, chunk_chars: int, overlap_chars: int) -> list[str]:
    if len(text) <= chunk_chars:
        return [text]

    chunks: list[str] = []
    start = 0
    while start < len(text):
        end = min(start + chunk_chars, len(text))
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        if end == len(text):
            break
        start = max(0, end - overlap_chars)
    return chunks


def extract_pdf_chunks(
    path: Path,
    *,
    chunk_chars: int,
    overlap_chars: int,
    max_pages: int | None,
) -> list[PdfChunk]:
    reader = PdfReader(str(path))
    chunks: list[PdfChunk] = []
    page_limit = min(len(reader.pages), max_pages) if max_pages else len(reader.pages)

    for page_index in range(page_limit):
        page = reader.pages[page_index]
        page_text = normalize_text(page.extract_text() or "")
        if not page_text:
            continue

        for text_chunk in split_text(page_text, chunk_chars, overlap_chars):
            chunks.append(
                PdfChunk(
                    content=text_chunk,
                    page_number=page_index + 1,
                    chunk_index=len(chunks),
                    metadata={
                        "source_path": source_path_label(path),
                        "embedding_model": "local-hash-v1",
                        "chunk_chars": chunk_chars,
                    },
                )
            )

    return chunks


def ensure_schema(conn: psycopg.Connection) -> None:
    statements = [
        "create extension if not exists pgcrypto",
        "create extension if not exists vector",
        """
        create table if not exists documents (
          id uuid primary key default gen_random_uuid(),
          title text not null,
          file_name text not null,
          file_hash text not null unique,
          source_type text not null default 'pdf',
          status text not null default 'processing'
            check (status in ('processing', 'completed', 'failed')),
          chunk_count integer not null default 0 check (chunk_count >= 0),
          last_ingested_at timestamptz,
          error_message text,
          created_at timestamptz not null default now(),
          updated_at timestamptz not null default now()
        )
        """,
        """
        create table if not exists document_chunks (
          id uuid primary key default gen_random_uuid(),
          document_id uuid not null references documents(id) on delete cascade,
          content text not null,
          page_number integer,
          chunk_index integer not null,
          embedding vector(384) not null,
          metadata jsonb not null default '{}'::jsonb,
          created_at timestamptz not null default now(),
          unique (document_id, chunk_index)
        )
        """,
        """
        create table if not exists generation_jobs (
          id uuid primary key default gen_random_uuid(),
          job_type text not null,
          status text not null,
          input jsonb not null default '{}'::jsonb,
          retrieved_context jsonb not null default '[]'::jsonb,
          created_at timestamptz not null default now(),
          updated_at timestamptz not null default now()
        )
        """,
        "alter table documents enable row level security",
        "alter table document_chunks enable row level security",
        "alter table generation_jobs enable row level security",
        "create index if not exists documents_status_idx on documents (status)",
        "create index if not exists document_chunks_document_id_idx on document_chunks (document_id)",
        "create index if not exists generation_jobs_type_status_idx on generation_jobs (job_type, status)",
        """
        do $$
        begin
          if exists (select 1 from pg_roles where rolname = 'anon') then
            revoke all on table documents from anon;
            revoke all on table document_chunks from anon;
            revoke all on table generation_jobs from anon;
          end if;
          if exists (select 1 from pg_roles where rolname = 'authenticated') then
            revoke all on table documents from authenticated;
            revoke all on table document_chunks from authenticated;
            revoke all on table generation_jobs from authenticated;
          end if;
        end $$;
        """,
    ]

    with conn.cursor() as cur:
        for statement in statements:
            cur.execute(statement)
    conn.commit()

    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                create index if not exists document_chunks_embedding_hnsw_idx
                on document_chunks using hnsw (embedding vector_cosine_ops)
                """
            )
        conn.commit()
    except psycopg.Error as exc:
        conn.rollback()
        print(f"WARN: skip vector index: {exc.__class__.__name__}", flush=True)


def reset_knowledge_base(conn: psycopg.Connection) -> None:
    with conn.cursor() as cur:
        cur.execute("truncate table generation_jobs, document_chunks, documents restart identity cascade")
    conn.commit()


def upsert_document(
    conn: psycopg.Connection,
    *,
    path: Path,
    file_hash: str,
) -> str:
    with conn.cursor() as cur:
        cur.execute(
            """
            insert into documents (
              title,
              file_name,
              file_hash,
              source_type,
              status,
              chunk_count,
              last_ingested_at,
              error_message,
              updated_at
            )
            values (%s, %s, %s, 'pdf', 'processing', 0, null, null, now())
            on conflict (file_hash) do update set
              title = excluded.title,
              file_name = excluded.file_name,
              status = 'processing',
              chunk_count = 0,
              error_message = null,
              updated_at = now()
            returning id::text
            """,
            (title_from_path(path), path.name, file_hash),
        )
        row = cur.fetchone()
        if row is None:
            raise RuntimeError(f"Could not upsert document for {path.name}")
        return str(row[0])


def mark_document_failed(
    conn: psycopg.Connection,
    *,
    document_id: str,
    error_message: str,
) -> None:
    with conn.cursor() as cur:
        cur.execute(
            """
            update documents
            set status = 'failed',
                chunk_count = 0,
                error_message = %s,
                last_ingested_at = now(),
                updated_at = now()
            where id = %s::uuid
            """,
            (error_message[:500], document_id),
        )


def insert_chunks(
    conn: psycopg.Connection,
    *,
    document_id: str,
    chunks: list[PdfChunk],
    batch_size: int,
) -> None:
    rows = [
        (
            document_id,
            chunk.content,
            chunk.page_number,
            chunk.chunk_index,
            vector_to_sql(create_text_embedding(chunk.content)),
            json.dumps(chunk.metadata),
        )
        for chunk in chunks
    ]

    with conn.cursor() as cur:
        cur.execute("delete from document_chunks where document_id = %s::uuid", (document_id,))
        for start in range(0, len(rows), batch_size):
            cur.executemany(
                """
                insert into document_chunks (
                  document_id,
                  content,
                  page_number,
                  chunk_index,
                  embedding,
                  metadata
                )
                values (%s::uuid, %s, %s, %s, %s::vector, %s::jsonb)
                """,
                rows[start : start + batch_size],
            )
        cur.execute(
            """
            update documents
            set status = 'completed',
                chunk_count = %s,
                error_message = null,
                last_ingested_at = now(),
                updated_at = now()
            where id = %s::uuid
            """,
            (len(rows), document_id),
        )


def ingest_pdf(
    conn: psycopg.Connection,
    *,
    path: Path,
    chunk_chars: int,
    overlap_chars: int,
    max_pages: int | None,
    batch_size: int,
) -> tuple[str, int]:
    file_hash = file_sha256(path)
    chunks = extract_pdf_chunks(
        path,
        chunk_chars=chunk_chars,
        overlap_chars=overlap_chars,
        max_pages=max_pages,
    )

    with conn.transaction():
        document_id = upsert_document(conn, path=path, file_hash=file_hash)
        if not chunks:
            mark_document_failed(
                conn,
                document_id=document_id,
                error_message="No extractable text found in PDF",
            )
            return document_id, 0
        insert_chunks(
            conn,
            document_id=document_id,
            chunks=chunks,
            batch_size=batch_size,
        )
        return document_id, len(chunks)


def list_pdf_paths(
    book_root: Path,
    *,
    start_index: int,
    max_files: int | None,
) -> list[Path]:
    paths = sorted(book_root.rglob("*.pdf"))
    paths = paths[start_index:]
    if max_files is not None:
        return paths[:max_files]
    return paths


def main() -> None:
    parser = argparse.ArgumentParser(description="Pre-ingest TeachFlow AI PDFs")
    parser.add_argument("--book-root", type=Path, default=DEFAULT_BOOK_ROOT)
    parser.add_argument("--start-index", type=int, default=0)
    parser.add_argument("--max-files", type=int)
    parser.add_argument("--max-pages-per-file", type=int)
    parser.add_argument("--chunk-chars", type=int, default=1200)
    parser.add_argument("--overlap-chars", type=int, default=180)
    parser.add_argument("--batch-size", type=int, default=200)
    parser.add_argument("--reset", action="store_true")
    parser.add_argument("--schema-only", action="store_true")
    args = parser.parse_args()

    conninfo = database_conninfo()
    with psycopg.connect(conninfo, connect_timeout=20, prepare_threshold=None) as conn:
        ensure_schema(conn)
        if args.reset:
            reset_knowledge_base(conn)
            print("reset_done", flush=True)
        if args.schema_only:
            print("schema_ready", flush=True)
            return

        pdf_paths = list_pdf_paths(
            args.book_root,
            start_index=args.start_index,
            max_files=args.max_files,
        )
        if not pdf_paths:
            raise RuntimeError(f"No PDF files found under {args.book_root}")

        total_chunks = 0
        for path in pdf_paths:
            try:
                document_id, chunk_count = ingest_pdf(
                    conn,
                    path=path,
                    chunk_chars=args.chunk_chars,
                    overlap_chars=args.overlap_chars,
                    max_pages=args.max_pages_per_file,
                    batch_size=args.batch_size,
                )
                total_chunks += chunk_count
                print(
                    f"ingested {path.name}: document_id={document_id} chunks={chunk_count}",
                    flush=True,
                )
            except Exception as exc:
                conn.rollback()
                print(
                    f"failed {path.name}: {exc.__class__.__name__}: {exc}",
                    flush=True,
                )

        print(
            f"ingest_complete documents={len(pdf_paths)} chunks={total_chunks}",
            flush=True,
        )


if __name__ == "__main__":
    main()
