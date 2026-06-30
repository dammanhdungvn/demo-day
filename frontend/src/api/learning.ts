import { buildApiUrl, getBackendUrl } from '../config'

export type StudentLevel = 'weak' | 'average' | 'strong'

export type CourseCreatePayload = {
  title: string
  description: string
  learning_goals: string
  teaching_language: string
}

export type Course = CourseCreatePayload & {
  id: string
  teacher_id: string
  organization_id?: string | null
  created_at: string
  updated_at: string
}

export type ClassCreatePayload = {
  name: string
  student_level: StudentLevel
  background_knowledge: string
  session_count: number
  minutes_per_session: number
  teaching_style: string
}

export type ClassProfile = ClassCreatePayload & {
  id: string
  course_id: string
  teacher_id: string
  organization_id?: string | null
  is_active?: boolean
  created_at: string
  updated_at: string
}

export type StudentProfile = {
  id: string
  email: string
  name: string
  role: 'student'
}

export type ClassMembership = {
  id: string
  class_id: string
  student_id: string
  added_by_teacher_id: string
  created_at: string
}

export type StudentClassSummary = {
  class_id: string
  class_name: string
  course_id: string
  course_title: string
  teacher_id: string
  student_level: StudentLevel
  session_count: number
  minutes_per_session: number
}

export type DocumentStatus = 'processing' | 'completed' | 'failed'
export type DocumentUploadJobStatus = DocumentStatus | 'skipped'
export type DocumentIngestionAction =
  | 'ingested'
  | 'skipped'
  | 'reingested'
  | 'failed'
export type DocumentKnowledgeScope = 'library' | 'contextual'
export type DocumentStorageStatus = 'metadata_only' | 'stored' | 'not_applicable'
export type GenerationJobStatus =
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'retrying'
  | 'skipped'

export type SourceDocument = {
  id: string
  title: string
  file_name: string
  file_hash: string
  source_type: string
  status: DocumentStatus
  organization_id?: string | null
  knowledge_scope?: DocumentKnowledgeScope
  owner_user_id?: string | null
  file_size_bytes?: number | null
  storage_provider?: string | null
  storage_bucket?: string | null
  storage_path?: string | null
  storage_status?: DocumentStorageStatus | null
  retention_expires_at?: string | null
  quota_limit_bytes?: number | null
  quota_used_bytes?: number | null
  provenance?: Record<string, unknown> | null
  chunk_count: number
  last_ingested_at: string | null
  error_message: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type DocumentUploadResponse = {
  generation_job_id: string
  job_status: DocumentUploadJobStatus
  ingestion_action: DocumentIngestionAction
  document: SourceDocument
  message: string
}

export type UrlIngestionPayload = {
  url: string
}

export type DocumentMetadataUpdatePayload = {
  title: string
}

export type GenerationJob = {
  id: string
  job_type: string
  status: GenerationJobStatus
  organization_id?: string | null
  actor_id: string | null
  actor_role: 'admin' | 'teacher' | 'student' | null
  input: Record<string, unknown>
  retrieved_context: Record<string, unknown>[]
  output: Record<string, unknown>
  error_message: string | null
  created_at: string
  updated_at: string
}

export type EmbeddingMetadata = {
  provider: string
  model: string
  dimensions: number
}

export type DocumentReindexResponse = {
  document: SourceDocument
  generation_job: GenerationJob
  chunk_count: number
  embedding: EmbeddingMetadata
  message: string
}

export type RetrievalPayload = {
  topic: string
  selected_document_ids: string[]
  top_k: number
}

export type RetrievedChunk = {
  chunk_id: string
  document_id: string
  document_title: string
  source_url?: string | null
  page_number: number | null
  chunk_index: number
  excerpt: string
  score: number
}

export type RetrievalResponse = {
  topic: string
  selected_document_ids: string[]
  generation_job_id: string
  chunks: RetrievedChunk[]
}

export type OutlineSession = {
  session_index: number
  title: string
  learning_objectives: string[]
  key_topics: string[]
  teaching_activities: string[]
  suggested_exercises: string[]
  adaptation_notes: string
  source_references: RetrievedChunk[]
}

export type CourseOutline = {
  id: string
  course_id: string
  class_id: string
  teacher_id: string
  topic: string
  selected_document_ids: string[]
  generation_job_id: string
  sessions: OutlineSession[]
  created_at: string
  updated_at: string
}

export type OutlineGeneratePayload = {
  course_id: string
  class_id: string
  selected_document_ids: string[]
  topic: string
}

export type OutlineSessionUpdatePayload = {
  title: string
  learning_objectives: string[]
  key_topics: string[]
  teaching_activities: string[]
  suggested_exercises: string[]
  adaptation_notes: string
}

export type LessonBlockType =
  | 'learning_objectives'
  | 'concept_explanation'
  | 'analogy_or_example'
  | 'code_example'
  | 'teaching_activity'
  | 'quiz'
  | 'assignment'
  | 'common_misconception'
  | 'visual_diagram'
  | 'slide'

export type LessonBlock = {
  id: string
  type: LessonBlockType
  title: string
  content: string
  order_index: number
  status: 'needs_review' | 'approved' | 'approved_with_warning' | 'rejected'
  citations: RetrievedChunk[]
  warning: string | null
}

export type LessonSession = {
  id: string
  outline_id: string
  outline_session_index: number
  course_id: string
  class_id: string
  teacher_id: string
  title: string
  status:
    | 'teacher_reviewing'
    | 'submitted_for_admin_review'
    | 'changes_requested'
    | 'admin_rejected'
    | 'published'
  admin_feedback: string | null
  blocks: LessonBlock[]
  is_active?: boolean
  created_at: string
  updated_at: string
}

export type LessonSessionUpdatePayload = {
  title: string
}

export type LessonProgressUpdatePayload = {
  current_block_id?: string | null
  current_slide_index?: number
  completed?: boolean
}

export type LessonProgress = {
  lesson_id: string
  class_id: string
  student_id: string
  current_block_id: string | null
  current_slide_index: number
  progress_percent: number
  started_at: string | null
  last_opened_at: string | null
  completed_at: string | null
}

export type LessonStudyStateUpdatePayload = {
  bookmarked_block_ids?: string[]
  notes_by_block_id?: Record<string, string>
}

export type LessonStudyState = {
  lesson_id: string
  class_id: string
  student_id: string
  bookmarked_block_ids: string[]
  notes_by_block_id: Record<string, string>
  updated_at: string | null
}

export type LessonStudyReviewItem = {
  lesson_id: string
  lesson_title: string
  class_id: string
  block_id: string
  block_title: string
  block_type: LessonBlock['type']
  note: string | null
  bookmarked: boolean
  citation_count: number
  updated_at: string
}

export type LessonPracticeItem = {
  lesson_id: string
  lesson_title: string
  class_id: string
  block_id: string
  block_title: string
  block_type: LessonBlock['type']
  prompt: string
  citation_count: number
  updated_at: string
  self_check_status: PracticeSelfCheckStatus
  attempt_count: number
  attempt_updated_at: string | null
}

export type PracticeSelfCheckStatus = 'not_started' | 'needs_review' | 'got_it'

export type LessonPracticeAttemptUpdatePayload = {
  answer_text: string
  self_check_status: PracticeSelfCheckStatus
}

export type LessonPracticeAttempt = {
  lesson_id: string
  class_id: string
  student_id: string
  block_id: string
  answer_text: string
  self_check_status: PracticeSelfCheckStatus
  attempt_count: number
  updated_at: string | null
}

export type LessonTutorQuestionPayload = {
  question: string
  block_id?: string | null
}

export type LessonTutorAnswer = {
  lesson_id: string
  class_id: string
  student_id: string
  question: string
  answer: string
  citations: RetrievedChunk[]
  cited_block_ids: string[]
  warning: string | null
}

export type TeacherLessonProgressSummary = {
  lesson_id: string
  class_id: string
  title: string
  enrolled_student_count: number
  started_count: number
  completed_count: number
  average_progress_percent: number
}

export type LessonGeneratePayload = {
  outline_id: string
  session_index: number
}

export type LessonBlockUpdatePayload = {
  title: string
  content: string
}

export type LessonBlockStatusPayload = {
  status: LessonBlock['status']
}

export type AdminFeedbackPayload = {
  feedback: string
}

export type LessonAuditEvent = {
  id: string
  lesson_id: string
  block_id: string | null
  actor_id: string
  actor_role: 'admin' | 'teacher' | 'student'
  action: string
  details: string | null
  created_at: string
}

export type LessonExportFormat = 'markdown' | 'pptx' | 'pdf'
export type LessonExportDelivery = 'download' | 'print'

export type LessonExportPayload = {
  export_format: LessonExportFormat
  delivery: LessonExportDelivery
  file_name?: string | null
  client_metadata?: Record<string, unknown>
}

export type LessonExportRecord = {
  id: string
  lesson_id: string
  course_id: string
  class_id: string
  teacher_id: string
  organization_id: string
  actor_id: string
  actor_role: 'admin' | 'teacher' | 'student'
  export_format: LessonExportFormat
  delivery: LessonExportDelivery
  file_name: string | null
  block_count: number
  citation_count: number
  client_metadata: Record<string, unknown>
  created_at: string
}

function authJsonHeaders(token: string): HeadersInit {
  return {
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

function authHeaders(token: string): HeadersInit {
  return {
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
  }
}

async function readJson<T>(response: Response, label: string): Promise<T> {
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, label))
  }

  return response.json() as Promise<T>
}

async function readErrorMessage(response: Response, label: string): Promise<string> {
  try {
    const body = (await response.json()) as unknown
    const detail = isRecord(body) ? body.detail : null
    if (typeof detail === 'string') {
      return `${label} failed: ${detail}`
    }
    if (isRecord(detail) && typeof detail.message === 'string') {
      const retryAfter =
        typeof detail.retry_after_seconds === 'number'
          ? ` Retry after ${detail.retry_after_seconds}s.`
          : ''
      return `${label} failed: ${detail.message}.${retryAfter}`
    }
  } catch {
    // Fall back to the status-only message below when the backend returns no JSON.
  }
  return `${label} failed with status ${response.status}`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export async function fetchCourses(
  token: string,
  fetcher: typeof fetch = fetch,
  backendUrl = getBackendUrl(),
): Promise<Course[]> {
  const response = await fetcher(buildApiUrl('/courses', backendUrl), {
    headers: authHeaders(token),
  })

  return readJson<Course[]>(response, 'Courses')
}

export async function createCourse(
  payload: CourseCreatePayload,
  token: string,
  fetcher: typeof fetch = fetch,
  backendUrl = getBackendUrl(),
): Promise<Course> {
  const response = await fetcher(buildApiUrl('/courses', backendUrl), {
    method: 'POST',
    headers: authJsonHeaders(token),
    body: JSON.stringify(payload),
  })

  return readJson<Course>(response, 'Create course')
}

export async function fetchCourseClasses(
  courseId: string,
  token: string,
  fetcher: typeof fetch = fetch,
  backendUrl = getBackendUrl(),
): Promise<ClassProfile[]> {
  const response = await fetcher(buildApiUrl(`/courses/${courseId}/classes`, backendUrl), {
    headers: authHeaders(token),
  })

  return readJson<ClassProfile[]>(response, 'Course classes')
}

export async function createClassProfile(
  courseId: string,
  payload: ClassCreatePayload,
  token: string,
  fetcher: typeof fetch = fetch,
  backendUrl = getBackendUrl(),
): Promise<ClassProfile> {
  const response = await fetcher(buildApiUrl(`/courses/${courseId}/classes`, backendUrl), {
    method: 'POST',
    headers: authJsonHeaders(token),
    body: JSON.stringify(payload),
  })

  return readJson<ClassProfile>(response, 'Create class')
}

export async function updateClassProfile(
  classId: string,
  payload: ClassCreatePayload,
  token: string,
  fetcher: typeof fetch = fetch,
  backendUrl = getBackendUrl(),
): Promise<ClassProfile> {
  const response = await fetcher(buildApiUrl(`/classes/${classId}`, backendUrl), {
    method: 'PATCH',
    headers: authJsonHeaders(token),
    body: JSON.stringify(payload),
  })

  return readJson<ClassProfile>(response, 'Update class')
}

export async function archiveClassProfile(
  classId: string,
  token: string,
  fetcher: typeof fetch = fetch,
  backendUrl = getBackendUrl(),
): Promise<ClassProfile> {
  const response = await fetcher(buildApiUrl(`/classes/${classId}`, backendUrl), {
    method: 'DELETE',
    headers: authHeaders(token),
  })

  return readJson<ClassProfile>(response, 'Archive class')
}

export async function fetchStudents(
  token: string,
  fetcher: typeof fetch = fetch,
  backendUrl = getBackendUrl(),
): Promise<StudentProfile[]> {
  const response = await fetcher(buildApiUrl('/students', backendUrl), {
    headers: authHeaders(token),
  })

  return readJson<StudentProfile[]>(response, 'Students')
}

export async function fetchTeacherLessons(
  classId: string,
  token: string,
  fetcher: typeof fetch = fetch,
  backendUrl = getBackendUrl(),
): Promise<LessonSession[]> {
  const response = await fetcher(
    buildApiUrl(`/teacher/lessons?class_id=${classId}`, backendUrl),
    {
      headers: authHeaders(token),
    },
  )

  return readJson<LessonSession[]>(response, 'Teacher lessons')
}

export async function fetchTeacherClassProgress(
  classId: string,
  token: string,
  fetcher: typeof fetch = fetch,
  backendUrl = getBackendUrl(),
): Promise<TeacherLessonProgressSummary[]> {
  const response = await fetcher(
    buildApiUrl(`/teacher/classes/${classId}/progress`, backendUrl),
    {
      headers: authHeaders(token),
    },
  )

  return readJson<TeacherLessonProgressSummary[]>(
    response,
    'Teacher class progress',
  )
}

export async function fetchLessonAuditEvents(
  lessonId: string,
  token: string,
  fetcher: typeof fetch = fetch,
  backendUrl = getBackendUrl(),
): Promise<LessonAuditEvent[]> {
  const response = await fetcher(
    buildApiUrl(`/lessons/${lessonId}/audit-events`, backendUrl),
    {
      headers: authHeaders(token),
    },
  )

  return readJson<LessonAuditEvent[]>(response, 'Lesson audit events')
}

export async function recordLessonExport(
  lessonId: string,
  payload: LessonExportPayload,
  token: string,
  fetcher: typeof fetch = fetch,
  backendUrl = getBackendUrl(),
): Promise<LessonExportRecord> {
  const response = await fetcher(
    buildApiUrl(`/lessons/${lessonId}/exports`, backendUrl),
    {
      method: 'POST',
      headers: authJsonHeaders(token),
      body: JSON.stringify(payload),
    },
  )

  return readJson<LessonExportRecord>(response, 'Record lesson export')
}

export async function fetchLessonExportRecords(
  lessonId: string,
  token: string,
  fetcher: typeof fetch = fetch,
  backendUrl = getBackendUrl(),
): Promise<LessonExportRecord[]> {
  const response = await fetcher(
    buildApiUrl(`/lessons/${lessonId}/exports`, backendUrl),
    {
      headers: authHeaders(token),
    },
  )

  return readJson<LessonExportRecord[]>(response, 'Lesson export records')
}

export async function askStudentLessonTutor(
  lessonId: string,
  payload: LessonTutorQuestionPayload,
  token: string,
  fetcher: typeof fetch = fetch,
  backendUrl = getBackendUrl(),
): Promise<LessonTutorAnswer> {
  const response = await fetcher(
    buildApiUrl(`/student/lessons/${lessonId}/tutor`, backendUrl),
    {
      method: 'POST',
      headers: authJsonHeaders(token),
      body: JSON.stringify(payload),
    },
  )

  return readJson<LessonTutorAnswer>(response, 'Student tutor')
}

export async function fetchGenerationJobs(
  token: string,
  fetcher: typeof fetch = fetch,
  backendUrl = getBackendUrl(),
): Promise<GenerationJob[]> {
  const response = await fetcher(buildApiUrl('/generation-jobs', backendUrl), {
    headers: authHeaders(token),
  })

  return readJson<GenerationJob[]>(response, 'Generation jobs')
}

export async function addStudentToClass(
  classId: string,
  studentId: string,
  token: string,
  fetcher: typeof fetch = fetch,
  backendUrl = getBackendUrl(),
): Promise<ClassMembership> {
  const response = await fetcher(buildApiUrl(`/classes/${classId}/students`, backendUrl), {
    method: 'POST',
    headers: authJsonHeaders(token),
    body: JSON.stringify({ student_id: studentId }),
  })

  return readJson<ClassMembership>(response, 'Add student')
}

export async function fetchStudentClasses(
  token: string,
  fetcher: typeof fetch = fetch,
  backendUrl = getBackendUrl(),
): Promise<StudentClassSummary[]> {
  const response = await fetcher(buildApiUrl('/student/classes', backendUrl), {
    headers: authHeaders(token),
  })

  return readJson<StudentClassSummary[]>(response, 'Student classes')
}

export async function fetchStudentLessons(
  token: string,
  fetcher: typeof fetch = fetch,
  backendUrl = getBackendUrl(),
): Promise<LessonSession[]> {
  const response = await fetcher(buildApiUrl('/student/lessons', backendUrl), {
    headers: authHeaders(token),
  })

  return readJson<LessonSession[]>(response, 'Student lessons')
}

export async function fetchStudentLesson(
  lessonId: string,
  token: string,
  fetcher: typeof fetch = fetch,
  backendUrl = getBackendUrl(),
): Promise<LessonSession> {
  const response = await fetcher(
    buildApiUrl(`/student/lessons/${lessonId}`, backendUrl),
    {
      headers: authHeaders(token),
    },
  )

  return readJson<LessonSession>(response, 'Student lesson detail')
}

export async function fetchStudentLessonProgress(
  lessonId: string,
  token: string,
  fetcher: typeof fetch = fetch,
  backendUrl = getBackendUrl(),
): Promise<LessonProgress> {
  const response = await fetcher(
    buildApiUrl(`/student/lessons/${lessonId}/progress`, backendUrl),
    {
      headers: authHeaders(token),
    },
  )

  return readJson<LessonProgress>(response, 'Student lesson progress')
}

export async function updateStudentLessonProgress(
  lessonId: string,
  payload: LessonProgressUpdatePayload,
  token: string,
  fetcher: typeof fetch = fetch,
  backendUrl = getBackendUrl(),
): Promise<LessonProgress> {
  const response = await fetcher(
    buildApiUrl(`/student/lessons/${lessonId}/progress`, backendUrl),
    {
      method: 'PUT',
      headers: authJsonHeaders(token),
      body: JSON.stringify(payload),
    },
  )

  return readJson<LessonProgress>(response, 'Update student lesson progress')
}

export async function fetchStudentLessonStudyState(
  lessonId: string,
  token: string,
  fetcher: typeof fetch = fetch,
  backendUrl = getBackendUrl(),
): Promise<LessonStudyState> {
  const response = await fetcher(
    buildApiUrl(`/student/lessons/${lessonId}/study-state`, backendUrl),
    {
      headers: authHeaders(token),
    },
  )

  return readJson<LessonStudyState>(response, 'Student lesson study state')
}

export async function updateStudentLessonStudyState(
  lessonId: string,
  payload: LessonStudyStateUpdatePayload,
  token: string,
  fetcher: typeof fetch = fetch,
  backendUrl = getBackendUrl(),
): Promise<LessonStudyState> {
  const response = await fetcher(
    buildApiUrl(`/student/lessons/${lessonId}/study-state`, backendUrl),
    {
      method: 'PUT',
      headers: authJsonHeaders(token),
      body: JSON.stringify(payload),
    },
  )

  return readJson<LessonStudyState>(response, 'Update student lesson study state')
}

export async function fetchStudentStudyReview(
  token: string,
  fetcher: typeof fetch = fetch,
  backendUrl = getBackendUrl(),
): Promise<LessonStudyReviewItem[]> {
  const response = await fetcher(buildApiUrl('/student/study-review', backendUrl), {
    headers: authHeaders(token),
  })

  return readJson<LessonStudyReviewItem[]>(response, 'Student study review')
}

export async function fetchStudentPracticeItems(
  token: string,
  fetcher: typeof fetch = fetch,
  backendUrl = getBackendUrl(),
): Promise<LessonPracticeItem[]> {
  const response = await fetcher(buildApiUrl('/student/practice-items', backendUrl), {
    headers: authHeaders(token),
  })

  return readJson<LessonPracticeItem[]>(response, 'Student practice items')
}

export async function fetchStudentPracticeAttempt(
  lessonId: string,
  blockId: string,
  token: string,
  fetcher: typeof fetch = fetch,
  backendUrl = getBackendUrl(),
): Promise<LessonPracticeAttempt> {
  const response = await fetcher(
    buildApiUrl(
      `/student/lessons/${lessonId}/practice-attempts/${blockId}`,
      backendUrl,
    ),
    {
      headers: authHeaders(token),
    },
  )

  return readJson<LessonPracticeAttempt>(response, 'Student practice attempt')
}

export async function updateStudentPracticeAttempt(
  lessonId: string,
  blockId: string,
  payload: LessonPracticeAttemptUpdatePayload,
  token: string,
  fetcher: typeof fetch = fetch,
  backendUrl = getBackendUrl(),
): Promise<LessonPracticeAttempt> {
  const response = await fetcher(
    buildApiUrl(
      `/student/lessons/${lessonId}/practice-attempts/${blockId}`,
      backendUrl,
    ),
    {
      method: 'PUT',
      headers: authJsonHeaders(token),
      body: JSON.stringify(payload),
    },
  )

  return readJson<LessonPracticeAttempt>(response, 'Update student practice attempt')
}

export async function fetchDocuments(
  token: string,
  fetcher: typeof fetch = fetch,
  backendUrl = getBackendUrl(),
): Promise<SourceDocument[]> {
  const response = await fetcher(buildApiUrl('/documents', backendUrl), {
    headers: authHeaders(token),
  })

  return readJson<SourceDocument[]>(response, 'Documents')
}

export async function uploadDocument(
  file: File,
  token: string,
  fetcher: typeof fetch = fetch,
  backendUrl = getBackendUrl(),
): Promise<DocumentUploadResponse> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetcher(buildApiUrl('/documents/upload', backendUrl), {
    method: 'POST',
    headers: authHeaders(token),
    body: formData,
  })

  return readJson<DocumentUploadResponse>(response, 'Document upload')
}

export async function ingestUrlDocument(
  payload: UrlIngestionPayload,
  token: string,
  fetcher: typeof fetch = fetch,
  backendUrl = getBackendUrl(),
): Promise<DocumentUploadResponse> {
  const response = await fetcher(buildApiUrl('/documents/ingest-url', backendUrl), {
    method: 'POST',
    headers: {
      ...authHeaders(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  return readJson<DocumentUploadResponse>(response, 'URL ingestion')
}

export async function updateDocumentMetadata(
  documentId: string,
  payload: DocumentMetadataUpdatePayload,
  token: string,
  fetcher: typeof fetch = fetch,
  backendUrl = getBackendUrl(),
): Promise<SourceDocument> {
  const response = await fetcher(buildApiUrl(`/documents/${documentId}`, backendUrl), {
    method: 'PATCH',
    headers: authJsonHeaders(token),
    body: JSON.stringify(payload),
  })

  return readJson<SourceDocument>(response, 'Update document metadata')
}

export async function archiveDocument(
  documentId: string,
  token: string,
  fetcher: typeof fetch = fetch,
  backendUrl = getBackendUrl(),
): Promise<SourceDocument> {
  const response = await fetcher(
    buildApiUrl(`/documents/${documentId}/archive`, backendUrl),
    {
      method: 'POST',
      headers: authHeaders(token),
    },
  )

  return readJson<SourceDocument>(response, 'Document archive')
}

export async function reindexDocument(
  documentId: string,
  token: string,
  fetcher: typeof fetch = fetch,
  backendUrl = getBackendUrl(),
): Promise<DocumentReindexResponse> {
  const response = await fetcher(
    buildApiUrl(`/documents/${documentId}/reindex`, backendUrl),
    {
      method: 'POST',
      headers: authHeaders(token),
    },
  )

  return readJson<DocumentReindexResponse>(response, 'Document re-index')
}

export async function retrieveChunks(
  payload: RetrievalPayload,
  token: string,
  fetcher: typeof fetch = fetch,
  backendUrl = getBackendUrl(),
): Promise<RetrievalResponse> {
  const response = await fetcher(buildApiUrl('/rag/retrieve', backendUrl), {
    method: 'POST',
    headers: authJsonHeaders(token),
    body: JSON.stringify(payload),
  })

  return readJson<RetrievalResponse>(response, 'RAG retrieval')
}

export async function generateOutline(
  payload: OutlineGeneratePayload,
  token: string,
  fetcher: typeof fetch = fetch,
  backendUrl = getBackendUrl(),
): Promise<CourseOutline> {
  const response = await fetcher(buildApiUrl('/outlines/generate', backendUrl), {
    method: 'POST',
    headers: authJsonHeaders(token),
    body: JSON.stringify(payload),
  })

  return readJson<CourseOutline>(response, 'Generate outline')
}

export async function fetchClassOutlines(
  classId: string,
  token: string,
  fetcher: typeof fetch = fetch,
  backendUrl = getBackendUrl(),
): Promise<CourseOutline[]> {
  const response = await fetcher(buildApiUrl(`/outlines?class_id=${classId}`, backendUrl), {
    headers: authHeaders(token),
  })

  return readJson<CourseOutline[]>(response, 'Class outlines')
}

export async function updateOutlineSession(
  outlineId: string,
  sessionIndex: number,
  payload: OutlineSessionUpdatePayload,
  token: string,
  fetcher: typeof fetch = fetch,
  backendUrl = getBackendUrl(),
): Promise<CourseOutline> {
  const response = await fetcher(
    buildApiUrl(`/outlines/${outlineId}/sessions/${sessionIndex}`, backendUrl),
    {
      method: 'PATCH',
      headers: authJsonHeaders(token),
      body: JSON.stringify(payload),
    },
  )

  return readJson<CourseOutline>(response, 'Update outline session')
}

export async function generateLessonBlocks(
  payload: LessonGeneratePayload,
  token: string,
  fetcher: typeof fetch = fetch,
  backendUrl = getBackendUrl(),
): Promise<LessonSession> {
  const response = await fetcher(buildApiUrl('/lessons/generate', backendUrl), {
    method: 'POST',
    headers: authJsonHeaders(token),
    body: JSON.stringify(payload),
  })

  return readJson<LessonSession>(response, 'Generate lesson blocks')
}

export async function updateLessonSession(
  lessonId: string,
  payload: LessonSessionUpdatePayload,
  token: string,
  fetcher: typeof fetch = fetch,
  backendUrl = getBackendUrl(),
): Promise<LessonSession> {
  const response = await fetcher(buildApiUrl(`/lessons/${lessonId}`, backendUrl), {
    method: 'PATCH',
    headers: authJsonHeaders(token),
    body: JSON.stringify(payload),
  })

  return readJson<LessonSession>(response, 'Update lesson')
}

export async function archiveLessonSession(
  lessonId: string,
  token: string,
  fetcher: typeof fetch = fetch,
  backendUrl = getBackendUrl(),
): Promise<LessonSession> {
  const response = await fetcher(buildApiUrl(`/lessons/${lessonId}`, backendUrl), {
    method: 'DELETE',
    headers: authHeaders(token),
  })

  return readJson<LessonSession>(response, 'Archive lesson')
}

export async function updateLessonBlock(
  blockId: string,
  payload: LessonBlockUpdatePayload,
  token: string,
  fetcher: typeof fetch = fetch,
  backendUrl = getBackendUrl(),
): Promise<LessonSession> {
  const response = await fetcher(buildApiUrl(`/lesson-blocks/${blockId}`, backendUrl), {
    method: 'PATCH',
    headers: authJsonHeaders(token),
    body: JSON.stringify(payload),
  })

  return readJson<LessonSession>(response, 'Update lesson block')
}

export async function setLessonBlockStatus(
  blockId: string,
  payload: LessonBlockStatusPayload,
  token: string,
  fetcher: typeof fetch = fetch,
  backendUrl = getBackendUrl(),
): Promise<LessonSession> {
  const response = await fetcher(
    buildApiUrl(`/lesson-blocks/${blockId}/status`, backendUrl),
    {
      method: 'POST',
      headers: authJsonHeaders(token),
      body: JSON.stringify(payload),
    },
  )

  return readJson<LessonSession>(response, 'Set lesson block status')
}

export async function regenerateLessonBlock(
  blockId: string,
  token: string,
  fetcher: typeof fetch = fetch,
  backendUrl = getBackendUrl(),
): Promise<LessonSession> {
  const response = await fetcher(
    buildApiUrl(`/lesson-blocks/${blockId}/regenerate`, backendUrl),
    {
      method: 'POST',
      headers: authHeaders(token),
    },
  )

  return readJson<LessonSession>(response, 'Regenerate lesson block')
}

export async function submitLesson(
  lessonId: string,
  token: string,
  fetcher: typeof fetch = fetch,
  backendUrl = getBackendUrl(),
): Promise<LessonSession> {
  const response = await fetcher(buildApiUrl(`/lessons/${lessonId}/submit`, backendUrl), {
    method: 'POST',
    headers: authHeaders(token),
  })

  return readJson<LessonSession>(response, 'Submit lesson')
}

export async function fetchAdminReviewQueue(
  token: string,
  fetcher: typeof fetch = fetch,
  backendUrl = getBackendUrl(),
): Promise<LessonSession[]> {
  const response = await fetcher(buildApiUrl('/admin/review-queue', backendUrl), {
    headers: authHeaders(token),
  })

  return readJson<LessonSession[]>(response, 'Admin review queue')
}

export async function publishLesson(
  lessonId: string,
  token: string,
  fetcher: typeof fetch = fetch,
  backendUrl = getBackendUrl(),
): Promise<LessonSession> {
  const response = await fetcher(
    buildApiUrl(`/admin/lessons/${lessonId}/publish`, backendUrl),
    {
      method: 'POST',
      headers: authHeaders(token),
    },
  )

  return readJson<LessonSession>(response, 'Publish lesson')
}

export async function requestLessonChanges(
  lessonId: string,
  payload: AdminFeedbackPayload,
  token: string,
  fetcher: typeof fetch = fetch,
  backendUrl = getBackendUrl(),
): Promise<LessonSession> {
  const response = await fetcher(
    buildApiUrl(`/admin/lessons/${lessonId}/request-changes`, backendUrl),
    {
      method: 'POST',
      headers: authJsonHeaders(token),
      body: JSON.stringify(payload),
    },
  )

  return readJson<LessonSession>(response, 'Request lesson changes')
}

export async function rejectLesson(
  lessonId: string,
  payload: AdminFeedbackPayload,
  token: string,
  fetcher: typeof fetch = fetch,
  backendUrl = getBackendUrl(),
): Promise<LessonSession> {
  const response = await fetcher(
    buildApiUrl(`/admin/lessons/${lessonId}/reject`, backendUrl),
    {
      method: 'POST',
      headers: authJsonHeaders(token),
      body: JSON.stringify(payload),
    },
  )

  return readJson<LessonSession>(response, 'Reject lesson')
}
