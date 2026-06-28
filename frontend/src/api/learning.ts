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

export type SourceDocument = {
  id: string
  title: string
  file_name: string
  file_hash: string
  source_type: string
  status: DocumentStatus
  chunk_count: number
  last_ingested_at: string | null
  error_message: string | null
  created_at: string
  updated_at: string
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
    | 'published'
  admin_feedback: string | null
  blocks: LessonBlock[]
  created_at: string
  updated_at: string
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
    throw new Error(`${label} failed with status ${response.status}`)
  }

  return response.json() as Promise<T>
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
