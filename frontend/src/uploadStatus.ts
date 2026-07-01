import type { DocumentUploadResponse } from './api/learning'

export function documentUploadStatusMessage(
  response: DocumentUploadResponse,
): string {
  if (response.ingestion_action === 'skipped') {
    return `${response.document.title} không đổi; đã skip ingest.`
  }

  if (response.job_status === 'processing' || response.document.status === 'processing') {
    return `${response.document.title} đang xử lý. Danh sách nguồn sẽ cập nhật khi ingestion hoàn tất.`
  }

  if (response.ingestion_action === 'reingested') {
    return response.document.status === 'completed'
      ? `Đã re-ingest ${response.document.title}: ${response.document.chunk_count} chunk.`
      : `${response.document.title} đang xử lý lại. Danh sách nguồn sẽ cập nhật khi ingestion hoàn tất.`
  }

  if (response.ingestion_action === 'failed' || response.document.status === 'failed') {
    return `Upload ${response.document.title} failed: ${response.message}. Vui lòng upload lại file để retry ingestion.`
  }

  return `Đã ingest ${response.document.title}: ${response.document.chunk_count} chunk.`
}
