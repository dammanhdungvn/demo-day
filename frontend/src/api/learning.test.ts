import { describe, expect, it, vi } from 'vitest'

import {
  addStudentToClass,
  cancelGenerationJob,
  createClassProfile,
  createCourse,
  fetchAdminReviewQueue,
  fetchClassOutlines,
  fetchCourses,
  fetchDocuments,
  fetchGenerationJobs,
  fetchLessonAuditEvents,
  fetchStudentLesson,
  fetchStudentClasses,
  fetchStudentLessonProgress,
  fetchStudentLessonStudyState,
  askStudentLessonTutor,
  fetchStudentPracticeAttempt,
  fetchStudentLessons,
  fetchStudentPracticeItems,
  fetchStudentStudyReview,
  fetchStudents,
  fetchTeacherClassProgress,
  fetchTeacherLessons,
  fetchLessonExportRecords,
  generateLessonBlocks,
  generateOutline,
  archiveDocument,
  archiveClassProfile,
  archiveLessonSession,
  ingestUrlDocument,
  publishLesson,
  recordLessonExport,
  reindexDocument,
  regenerateLessonBlock,
  rejectLesson,
  requestLessonChanges,
  retryGenerationJob,
  retrieveChunks,
  setLessonBlockStatus,
  submitLesson,
  updateClassProfile,
  updateDocumentMetadata,
  updateLessonSession,
  updateLessonBlock,
  updateStudentPracticeAttempt,
  updateStudentLessonProgress,
  updateStudentLessonStudyState,
  updateOutlineSession,
  uploadDocument,
} from './learning'

const backendUrl = 'https://api.example.test/api/v1'
const token = 'teacher-token'

describe('learning API client', () => {
  it('creates a course with bearer token', async () => {
    const payload = {
      title: 'Introduction to Artificial Intelligence',
      description: 'Demo course',
      learning_goals: 'Understand AI basics',
      teaching_language: 'Vietnamese',
    }
    const response = { id: 'course-1', teacher_id: 'demo-teacher', ...payload }
    const fetcher = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      Response.json(response),
    )

    await expect(createCourse(payload, token, fetcher, backendUrl)).resolves.toEqual(
      response,
    )

    expect(fetcher).toHaveBeenCalledWith(`${backendUrl}/courses`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
  })

  it('creates a class profile under a course', async () => {
    const payload = {
      name: 'KTPM-K18',
      student_level: 'average' as const,
      background_knowledge: 'Basic programming',
      session_count: 12,
      minutes_per_session: 90,
      teaching_style: 'Practical examples',
    }
    const fetcher = vi.fn(async () => Response.json({ id: 'class-1', ...payload }))

    await createClassProfile('course-1', payload, token, fetcher, backendUrl)

    expect(fetcher).toHaveBeenCalledWith(
      `${backendUrl}/courses/course-1/classes`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    )
  })

  it('updates and archives a class profile', async () => {
    const payload = {
      name: 'KTPM-K18 Advanced',
      student_level: 'strong' as const,
      background_knowledge: 'OOP and database',
      session_count: 10,
      minutes_per_session: 75,
      teaching_style: 'Workshop',
    }
    const archived = { id: 'class-1', is_active: false, ...payload }
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ id: 'class-1', is_active: true, ...payload }))
      .mockResolvedValueOnce(Response.json(archived))

    await updateClassProfile('class-1', payload, token, fetcher, backendUrl)
    await expect(
      archiveClassProfile('class-1', token, fetcher, backendUrl),
    ).resolves.toEqual(archived)

    expect(fetcher).toHaveBeenNthCalledWith(
      1,
      `${backendUrl}/classes/class-1`,
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
    )
    expect(fetcher).toHaveBeenNthCalledWith(
      2,
      `${backendUrl}/classes/class-1`,
      expect.objectContaining({
        method: 'DELETE',
      }),
    )
  })

  it('adds an existing student to a class', async () => {
    const fetcher = vi.fn(async () =>
      Response.json({ id: 'membership-1', student_id: 'demo-student' }),
    )

    await addStudentToClass('class-1', 'demo-student', token, fetcher, backendUrl)

    expect(fetcher).toHaveBeenCalledWith(
      `${backendUrl}/classes/class-1/students`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ student_id: 'demo-student' }),
      }),
    )
  })

  it('loads teacher and student resources through the backend URL', async () => {
    const fetcher = vi.fn(async () => Response.json([]))

    await fetchCourses(token, fetcher, backendUrl)
    await fetchStudents(token, fetcher, backendUrl)
    await fetchTeacherLessons('class-1', token, fetcher, backendUrl)
    await fetchTeacherClassProgress('class-1', token, fetcher, backendUrl)
    await fetchStudentClasses('student-token', fetcher, backendUrl)
    await fetchStudentLessons('student-token', fetcher, backendUrl)

    expect(fetcher).toHaveBeenNthCalledWith(
      1,
      `${backendUrl}/courses`,
      expect.any(Object),
    )
    expect(fetcher).toHaveBeenNthCalledWith(
      2,
      `${backendUrl}/students`,
      expect.any(Object),
    )
    expect(fetcher).toHaveBeenNthCalledWith(
      3,
      `${backendUrl}/teacher/lessons?class_id=class-1`,
      expect.any(Object),
    )
    expect(fetcher).toHaveBeenNthCalledWith(
      4,
      `${backendUrl}/teacher/classes/class-1/progress`,
      expect.any(Object),
    )
    expect(fetcher).toHaveBeenNthCalledWith(
      5,
      `${backendUrl}/student/classes`,
      expect.any(Object),
    )
    expect(fetcher).toHaveBeenNthCalledWith(
      6,
      `${backendUrl}/student/lessons`,
      expect.any(Object),
    )
  })

  it('loads generation jobs with bearer token', async () => {
    const payload = [
      {
        id: 'job-1',
        job_type: 'outline_generation',
        status: 'completed',
        actor_id: 'demo-teacher',
        actor_role: 'teacher' as const,
        input: { course_id: 'course-1' },
        retrieved_context: [],
        output: { outline_id: 'outline-1' },
        error_message: null,
        created_at: '2026-06-28T00:00:00+00:00',
        updated_at: '2026-06-28T00:00:01+00:00',
      },
    ]
    const fetcher = vi.fn(async () => Response.json(payload))

    await expect(fetchGenerationJobs(token, fetcher, backendUrl)).resolves.toEqual(
      payload,
    )

    expect(fetcher).toHaveBeenCalledWith(`${backendUrl}/generation-jobs`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })
  })

  it('retries and cancels generation jobs through protected action endpoints', async () => {
    const retryPayload = {
      generation_job: {
        id: 'job-1',
        job_type: 'outline_generation',
        status: 'retrying',
        actor_id: 'demo-teacher',
        actor_role: 'teacher' as const,
        input: { course_id: 'course-1' },
        retrieved_context: [],
        output: { retry_requested_by: 'demo-teacher' },
        error_message: null,
        created_at: '2026-06-28T00:00:00+00:00',
        updated_at: '2026-06-28T00:01:00+00:00',
      },
      message: 'Da dua tac vu vao hang cho thu lai.',
    }
    const cancelPayload = {
      generation_job: {
        ...retryPayload.generation_job,
        status: 'cancelled' as const,
        output: { cancelled_by: 'demo-teacher' },
      },
      message: 'Da huy tac vu.',
    }
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(Response.json(retryPayload))
      .mockResolvedValueOnce(Response.json(cancelPayload))

    await expect(
      retryGenerationJob('job-1', token, fetcher, backendUrl),
    ).resolves.toEqual(retryPayload)
    await expect(
      cancelGenerationJob('job-1', token, fetcher, backendUrl),
    ).resolves.toEqual(cancelPayload)

    expect(fetcher).toHaveBeenNthCalledWith(
      1,
      `${backendUrl}/generation-jobs/job-1/retry`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      },
    )
    expect(fetcher).toHaveBeenNthCalledWith(
      2,
      `${backendUrl}/generation-jobs/job-1/cancel`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      },
    )
  })

  it('loads lesson audit events through a protected endpoint', async () => {
    const payload = [
      {
        id: 'audit-1',
        lesson_id: 'lesson-1',
        block_id: 'block-1',
        actor_id: 'demo-teacher',
        actor_role: 'teacher' as const,
        action: 'block_edited',
        details: 'Updated block content.',
        created_at: '2026-06-28T00:00:00+00:00',
      },
    ]
    const fetcher = vi.fn(async () => Response.json(payload))

    await expect(
      fetchLessonAuditEvents('lesson-1', token, fetcher, backendUrl),
    ).resolves.toEqual(payload)

    expect(fetcher).toHaveBeenCalledWith(
      `${backendUrl}/lessons/lesson-1/audit-events`,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${token}`,
        }),
      }),
    )
  })

  it('records and lists lesson exports through protected endpoints', async () => {
    const exportRecord = {
      id: 'export-1',
      lesson_id: 'lesson-1',
      course_id: 'course-1',
      class_id: 'class-1',
      teacher_id: 'demo-teacher',
      organization_id: 'org-demo',
      actor_id: 'demo-teacher',
      actor_role: 'teacher' as const,
      export_format: 'markdown' as const,
      delivery: 'download' as const,
      file_name: 'lesson.md',
      block_count: 5,
      citation_count: 4,
      client_metadata: { source: 'teacher_workspace' },
      created_at: '2026-06-29T00:00:00+00:00',
    }
    const fetcher = vi.fn(async () => Response.json(exportRecord))

    await expect(
      recordLessonExport(
        'lesson-1',
        {
          export_format: 'markdown',
          delivery: 'download',
          file_name: 'lesson.md',
          client_metadata: { source: 'teacher_workspace' },
        },
        token,
        fetcher,
        backendUrl,
      ),
    ).resolves.toEqual(exportRecord)
    await fetchLessonExportRecords('lesson-1', token, fetcher, backendUrl)

    expect(fetcher).toHaveBeenNthCalledWith(
      1,
      `${backendUrl}/lessons/lesson-1/exports`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          export_format: 'markdown',
          delivery: 'download',
          file_name: 'lesson.md',
          client_metadata: { source: 'teacher_workspace' },
        }),
      }),
    )
    expect(fetcher).toHaveBeenNthCalledWith(
      2,
      `${backendUrl}/lessons/lesson-1/exports`,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${token}`,
        }),
      }),
    )
  })

  it('updates and archives a lesson session', async () => {
    const lesson = {
      id: 'lesson-1',
      outline_id: 'outline-1',
      outline_session_index: 1,
      course_id: 'course-1',
      class_id: 'class-1',
      teacher_id: 'demo-teacher',
      title: 'Renamed lesson',
      status: 'teacher_reviewing' as const,
      admin_feedback: null,
      blocks: [],
      is_active: true,
      created_at: '2026-06-28T00:00:00+00:00',
      updated_at: '2026-06-30T00:00:00+00:00',
    }
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(Response.json(lesson))
      .mockResolvedValueOnce(Response.json({ ...lesson, is_active: false }))

    await updateLessonSession(
      'lesson-1',
      { title: 'Renamed lesson' },
      token,
      fetcher,
      backendUrl,
    )
    await expect(
      archiveLessonSession('lesson-1', token, fetcher, backendUrl),
    ).resolves.toEqual({ ...lesson, is_active: false })

    expect(fetcher).toHaveBeenNthCalledWith(
      1,
      `${backendUrl}/lessons/lesson-1`,
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ title: 'Renamed lesson' }),
      }),
    )
    expect(fetcher).toHaveBeenNthCalledWith(
      2,
      `${backendUrl}/lessons/lesson-1`,
      expect.objectContaining({
        method: 'DELETE',
      }),
    )
  })

  it('asks the student grounded tutor through a protected lesson endpoint', async () => {
    const payload = {
      question: 'Tai sao can citation?',
      block_id: 'block-1',
    }
    const tutorResponse = {
      lesson_id: 'lesson-1',
      class_id: 'class-1',
      student_id: 'demo-student',
      question: payload.question,
      answer: 'Citation giup kiem chung noi dung.',
      citations: [],
      cited_block_ids: ['block-1'],
      warning: null,
    }
    const fetcher = vi.fn(async () => Response.json(tutorResponse))

    await expect(
      askStudentLessonTutor('lesson-1', payload, token, fetcher, backendUrl),
    ).resolves.toEqual(tutorResponse)

    expect(fetcher).toHaveBeenCalledWith(
      `${backendUrl}/student/lessons/lesson-1/tutor`,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify(payload),
      }),
    )
  })

  it('loads knowledge source documents with bearer token', async () => {
    const payload = [
      {
        id: 'doc-1',
        title: 'Building Applications with AI Agents',
        file_name: 'building applications with ai agents.pdf',
        file_hash: 'hash-a',
        source_type: 'pdf',
        status: 'completed' as const,
        knowledge_scope: 'contextual' as const,
        owner_user_id: 'demo-teacher',
        chunk_count: 12,
        last_ingested_at: '2026-06-28T00:00:00+00:00',
        error_message: null,
        is_active: true,
        created_at: '2026-06-28T00:00:00+00:00',
        updated_at: '2026-06-28T00:00:00+00:00',
      },
    ]
    const fetcher = vi.fn(async () => Response.json(payload))

    await expect(fetchDocuments(token, fetcher, backendUrl)).resolves.toEqual(payload)

    expect(fetcher).toHaveBeenCalledWith(`${backendUrl}/documents`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })
  })

  it('updates source document metadata with bearer token', async () => {
    const response = {
      id: 'doc-1',
      title: 'Renamed AI Library',
      file_name: 'building applications with ai agents.pdf',
      file_hash: 'hash-a',
      source_type: 'pdf',
      status: 'completed' as const,
      knowledge_scope: 'library' as const,
      owner_user_id: null,
      chunk_count: 12,
      last_ingested_at: '2026-06-28T00:00:00+00:00',
      error_message: null,
      is_active: true,
      created_at: '2026-06-28T00:00:00+00:00',
      updated_at: '2026-06-30T00:00:00+00:00',
    }
    const fetcher = vi.fn(async () => Response.json(response))

    await expect(
      updateDocumentMetadata(
        'doc-1',
        { title: 'Renamed AI Library' },
        token,
        fetcher,
        backendUrl,
      ),
    ).resolves.toEqual(response)

    expect(fetcher).toHaveBeenCalledWith(`${backendUrl}/documents/doc-1`, {
      method: 'PATCH',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title: 'Renamed AI Library' }),
    })
  })

  it('uploads a PDF source document as multipart form data', async () => {
    const response = {
      generation_job_id: 'job-upload',
      job_status: 'completed' as const,
      ingestion_action: 'ingested' as const,
      document: {
        id: 'doc-upload',
        title: 'Uploaded Knowledge',
        file_name: 'uploaded-knowledge.pdf',
        file_hash: 'hash-upload',
        source_type: 'pdf',
        status: 'completed' as const,
        knowledge_scope: 'contextual' as const,
        owner_user_id: 'demo-teacher',
        chunk_count: 3,
        last_ingested_at: '2026-06-28T00:00:00+00:00',
        error_message: null,
        is_active: true,
        created_at: '2026-06-28T00:00:00+00:00',
        updated_at: '2026-06-28T00:00:00+00:00',
      },
      message: 'Upload processed.',
    }
    const fetcher = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      Response.json(response),
    )
    const file = new File(['%PDF-1.7 tiny payload'], 'uploaded-knowledge.pdf', {
      type: 'application/pdf',
    })

    await expect(uploadDocument(file, token, fetcher, backendUrl)).resolves.toEqual(
      response,
    )

    const [, options] = fetcher.mock.calls[0]
    expect(options).toBeDefined()
    const requestOptions = options as RequestInit
    expect(fetcher).toHaveBeenCalledWith(
      `${backendUrl}/documents/upload`,
      expect.objectContaining({
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }),
    )
    expect(requestOptions.body).toBeInstanceOf(FormData)
    expect((requestOptions.body as FormData).get('file')).toBe(file)
  })

  it('ingests a trusted URL source document as JSON', async () => {
    const payload = { url: 'https://docs.example.edu/agents' }
    const response = {
      generation_job_id: 'job-web',
      job_status: 'completed' as const,
      ingestion_action: 'ingested' as const,
      document: {
        id: 'doc-web',
        title: 'Agent Docs',
        file_name: payload.url,
        file_hash: 'hash-web',
        source_type: 'web',
        status: 'completed' as const,
        organization_id: 'org-demo',
        knowledge_scope: 'library' as const,
        owner_user_id: null,
        chunk_count: 4,
        last_ingested_at: '2026-06-28T00:00:00+00:00',
        error_message: null,
        is_active: true,
        created_at: '2026-06-28T00:00:00+00:00',
        updated_at: '2026-06-28T00:00:00+00:00',
      },
      message: 'Web page ingested.',
    }
    const fetcher = vi.fn(async () => Response.json(response))

    await expect(
      ingestUrlDocument(payload, token, fetcher, backendUrl),
    ).resolves.toEqual(response)

    expect(fetcher).toHaveBeenCalledWith(`${backendUrl}/documents/ingest-url`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
  })

  it('archives a source document with bearer token', async () => {
    const response = {
      id: 'doc-1',
      title: 'Building Applications with AI Agents',
      file_name: 'building applications with ai agents.pdf',
      file_hash: 'hash-a',
      source_type: 'pdf',
      status: 'completed' as const,
      knowledge_scope: 'library' as const,
      owner_user_id: null,
      chunk_count: 12,
      last_ingested_at: '2026-06-28T00:00:00+00:00',
      error_message: null,
      is_active: false,
      created_at: '2026-06-28T00:00:00+00:00',
      updated_at: '2026-06-28T00:00:00+00:00',
    }
    const fetcher = vi.fn(async () => Response.json(response))

    await expect(
      archiveDocument('doc-1', token, fetcher, backendUrl),
    ).resolves.toEqual(response)

    expect(fetcher).toHaveBeenCalledWith(`${backendUrl}/documents/doc-1/archive`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })
  })

  it('re-indexes a source document with bearer token', async () => {
    const response = {
      document: {
        id: 'doc-1',
        title: 'Building Applications with AI Agents',
        file_name: 'building applications with ai agents.pdf',
        file_hash: 'hash-a',
        source_type: 'pdf',
        status: 'completed' as const,
        knowledge_scope: 'library' as const,
        owner_user_id: null,
        chunk_count: 12,
        last_ingested_at: '2026-06-28T00:00:00+00:00',
        error_message: null,
        is_active: true,
        created_at: '2026-06-28T00:00:00+00:00',
        updated_at: '2026-06-28T00:00:00+00:00',
      },
      generation_job: {
        id: 'job-reindex',
        job_type: 'embedding_reindex',
        status: 'completed' as const,
        actor_id: 'demo-teacher',
        actor_role: 'teacher' as const,
        input: { document_id: 'doc-1' },
        retrieved_context: [],
        output: { chunk_count: 12 },
        error_message: null,
        created_at: '2026-06-28T00:00:00+00:00',
        updated_at: '2026-06-28T00:00:00+00:00',
      },
      chunk_count: 12,
      embedding: {
        provider: 'local-hash',
        model: 'local-hash-v1',
        dimensions: 384,
      },
      message: 'Re-indexed 12 chunks.',
    }
    const fetcher = vi.fn(async () => Response.json(response))

    await expect(
      reindexDocument('doc-1', token, fetcher, backendUrl),
    ).resolves.toEqual(response)

    expect(fetcher).toHaveBeenCalledWith(`${backendUrl}/documents/doc-1/reindex`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })
  })

  it('runs RAG retrieval with selected documents and topic', async () => {
    const payload = {
      topic: 'Transformer Architecture',
      selected_document_ids: ['doc-1'],
      top_k: 5,
    }
    const response = {
      topic: payload.topic,
      selected_document_ids: payload.selected_document_ids,
      generation_job_id: 'job-1',
      chunks: [
        {
          chunk_id: 'chunk-1',
          document_id: 'doc-1',
          document_title: 'Building Applications with AI Agents',
          page_number: 42,
          chunk_index: 3,
          excerpt: 'Transformer agents use context windows and tool calls.',
          score: 0.91,
        },
      ],
    }
    const fetcher = vi.fn(async () => Response.json(response))

    await expect(
      retrieveChunks(payload, token, fetcher, backendUrl),
    ).resolves.toEqual(response)

    expect(fetcher).toHaveBeenCalledWith(`${backendUrl}/rag/retrieve`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
  })

  it('generates a course outline from course, class, and source documents', async () => {
    const payload = {
      course_id: 'course-1',
      class_id: 'class-1',
      selected_document_ids: ['doc-1'],
      topic: 'AI Agents',
    }
    const response = {
      id: 'outline-1',
      course_id: 'course-1',
      class_id: 'class-1',
      teacher_id: 'demo-teacher',
      topic: 'AI Agents',
      selected_document_ids: ['doc-1'],
      generation_job_id: 'job-1',
      sessions: [],
      created_at: '2026-06-28T00:00:00+00:00',
      updated_at: '2026-06-28T00:00:00+00:00',
    }
    const fetcher = vi.fn(async () => Response.json(response))

    await expect(generateOutline(payload, token, fetcher, backendUrl)).resolves.toEqual(
      response,
    )

    expect(fetcher).toHaveBeenCalledWith(`${backendUrl}/outlines/generate`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
  })

  it('surfaces structured rate limit errors from AI generation endpoints', async () => {
    const payload = {
      course_id: 'course-1',
      class_id: 'class-1',
      selected_document_ids: ['doc-1'],
      topic: 'AI Agents',
    }
    const fetcher = vi.fn(async () =>
      Response.json(
        {
          detail: {
            message: 'AI action rate limit reached',
            retry_after_seconds: 120,
          },
        },
        { status: 429 },
      ),
    )

    await expect(generateOutline(payload, token, fetcher, backendUrl)).rejects.toThrow(
      'AI action rate limit reached',
    )
  })

  it('loads and updates class outlines', async () => {
    const fetcher = vi.fn(async () => Response.json([]))
    const updatePayload = {
      title: 'Updated session',
      learning_objectives: ['Explain agent loops'],
      key_topics: ['planning'],
      teaching_activities: ['Source review'],
      suggested_exercises: ['Map workflow'],
      adaptation_notes: 'Use visual examples.',
    }

    await fetchClassOutlines('class-1', token, fetcher, backendUrl)
    await updateOutlineSession(
      'outline-1',
      1,
      updatePayload,
      token,
      fetcher,
      backendUrl,
    )

    expect(fetcher).toHaveBeenNthCalledWith(
      1,
      `${backendUrl}/outlines?class_id=class-1`,
      expect.any(Object),
    )
    expect(fetcher).toHaveBeenNthCalledWith(
      2,
      `${backendUrl}/outlines/outline-1/sessions/1`,
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify(updatePayload),
      }),
    )
  })

  it('generates lesson blocks from an outline session', async () => {
    const payload = {
      outline_id: 'outline-1',
      session_index: 1,
    }
    const response = {
      id: 'lesson-1',
      outline_id: 'outline-1',
      outline_session_index: 1,
      course_id: 'course-1',
      class_id: 'class-1',
      teacher_id: 'demo-teacher',
      title: 'AI Agent Architecture',
      status: 'teacher_reviewing' as const,
      blocks: [],
      created_at: '2026-06-28T00:00:00+00:00',
      updated_at: '2026-06-28T00:00:00+00:00',
    }
    const fetcher = vi.fn(async () => Response.json(response))

    await expect(
      generateLessonBlocks(payload, token, fetcher, backendUrl),
    ).resolves.toEqual(response)

    expect(fetcher).toHaveBeenCalledWith(`${backendUrl}/lessons/generate`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
  })

  it('updates, regenerates, approves, and submits lesson blocks', async () => {
    const response = {
      id: 'lesson-1',
      outline_id: 'outline-1',
      outline_session_index: 1,
      course_id: 'course-1',
      class_id: 'class-1',
      teacher_id: 'demo-teacher',
      title: 'AI Agent Architecture',
      status: 'teacher_reviewing' as const,
      blocks: [],
      created_at: '2026-06-28T00:00:00+00:00',
      updated_at: '2026-06-28T00:00:00+00:00',
    }
    const fetcher = vi.fn(async () => Response.json(response))

    await updateLessonBlock(
      'block-1',
      { title: 'Updated', content: 'Updated content' },
      token,
      fetcher,
      backendUrl,
    )
    await setLessonBlockStatus(
      'block-1',
      { status: 'approved' },
      token,
      fetcher,
      backendUrl,
    )
    await regenerateLessonBlock('block-1', token, fetcher, backendUrl)
    await submitLesson('lesson-1', token, fetcher, backendUrl)

    expect(fetcher).toHaveBeenNthCalledWith(
      1,
      `${backendUrl}/lesson-blocks/block-1`,
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ title: 'Updated', content: 'Updated content' }),
      }),
    )
    expect(fetcher).toHaveBeenNthCalledWith(
      2,
      `${backendUrl}/lesson-blocks/block-1/status`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ status: 'approved' }),
      }),
    )
    expect(fetcher).toHaveBeenNthCalledWith(
      3,
      `${backendUrl}/lesson-blocks/block-1/regenerate`,
      expect.objectContaining({ method: 'POST' }),
    )
    expect(fetcher).toHaveBeenNthCalledWith(
      4,
      `${backendUrl}/lessons/lesson-1/submit`,
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('loads admin review queue, publishes, requests changes, and rejects', async () => {
    const response = {
      id: 'lesson-1',
      outline_id: 'outline-1',
      outline_session_index: 1,
      course_id: 'course-1',
      class_id: 'class-1',
      teacher_id: 'demo-teacher',
      title: 'AI Agent Architecture',
      status: 'submitted_for_admin_review' as const,
      admin_feedback: null,
      blocks: [],
      created_at: '2026-06-28T00:00:00+00:00',
      updated_at: '2026-06-28T00:00:00+00:00',
    }
    const fetcher = vi.fn(async () => Response.json([response]))

    await fetchAdminReviewQueue(token, fetcher, backendUrl)
    await publishLesson('lesson-1', token, fetcher, backendUrl)
    await requestLessonChanges(
      'lesson-1',
      { feedback: 'Clarify citations before publish.' },
      token,
      fetcher,
      backendUrl,
    )
    await rejectLesson(
      'lesson-1',
      { feedback: 'Sources do not support this lesson.' },
      token,
      fetcher,
      backendUrl,
    )

    expect(fetcher).toHaveBeenNthCalledWith(
      1,
      `${backendUrl}/admin/review-queue`,
      expect.any(Object),
    )
    expect(fetcher).toHaveBeenNthCalledWith(
      2,
      `${backendUrl}/admin/lessons/lesson-1/publish`,
      expect.objectContaining({ method: 'POST' }),
    )
    expect(fetcher).toHaveBeenNthCalledWith(
      3,
      `${backendUrl}/admin/lessons/lesson-1/request-changes`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ feedback: 'Clarify citations before publish.' }),
      }),
    )
    expect(fetcher).toHaveBeenNthCalledWith(
      4,
      `${backendUrl}/admin/lessons/lesson-1/reject`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ feedback: 'Sources do not support this lesson.' }),
      }),
    )
  })

  it('loads a student published lesson detail', async () => {
    const response = {
      id: 'lesson-1',
      outline_id: 'outline-1',
      outline_session_index: 1,
      course_id: 'course-1',
      class_id: 'class-1',
      teacher_id: 'demo-teacher',
      title: 'AI Agent Architecture',
      status: 'published' as const,
      admin_feedback: null,
      blocks: [],
      created_at: '2026-06-28T00:00:00+00:00',
      updated_at: '2026-06-28T00:00:00+00:00',
    }
    const fetcher = vi.fn(async () => Response.json(response))

    await expect(
      fetchStudentLesson('lesson-1', 'student-token', fetcher, backendUrl),
    ).resolves.toEqual(response)

    expect(fetcher).toHaveBeenCalledWith(
      `${backendUrl}/student/lessons/lesson-1`,
      expect.any(Object),
    )
  })

  it('reads and updates student lesson progress', async () => {
    const progress = {
      lesson_id: 'lesson-1',
      class_id: 'class-1',
      student_id: 'demo-student',
      current_block_id: 'block-2',
      current_slide_index: 3,
      progress_percent: 100,
      started_at: '2026-06-28T00:00:00+00:00',
      last_opened_at: '2026-06-28T00:05:00+00:00',
      completed_at: '2026-06-28T00:05:00+00:00',
    }
    const fetcher = vi.fn(async () => Response.json(progress))

    await expect(
      fetchStudentLessonProgress('lesson-1', 'student-token', fetcher, backendUrl),
    ).resolves.toEqual(progress)
    await expect(
      updateStudentLessonProgress(
        'lesson-1',
        {
          current_block_id: 'block-2',
          current_slide_index: 3,
          completed: true,
        },
        'student-token',
        fetcher,
        backendUrl,
      ),
    ).resolves.toEqual(progress)

    expect(fetcher).toHaveBeenNthCalledWith(
      1,
      `${backendUrl}/student/lessons/lesson-1/progress`,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer student-token',
        }),
      }),
    )
    expect(fetcher).toHaveBeenNthCalledWith(
      2,
      `${backendUrl}/student/lessons/lesson-1/progress`,
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({
          current_block_id: 'block-2',
          current_slide_index: 3,
          completed: true,
        }),
      }),
    )
  })

  it('reads and updates student lesson study state', async () => {
    const studyState = {
      lesson_id: 'lesson-1',
      class_id: 'class-1',
      student_id: 'demo-student',
      bookmarked_block_ids: ['block-1'],
      notes_by_block_id: {
        'block-1': 'Can on lai vi du nay.',
      },
      updated_at: '2026-06-29T00:05:00+00:00',
    }
    const fetcher = vi.fn(async () => Response.json(studyState))

    await expect(
      fetchStudentLessonStudyState('lesson-1', 'student-token', fetcher, backendUrl),
    ).resolves.toEqual(studyState)
    await expect(
      updateStudentLessonStudyState(
        'lesson-1',
        {
          bookmarked_block_ids: ['block-1'],
          notes_by_block_id: {
            'block-1': 'Can on lai vi du nay.',
          },
        },
        'student-token',
        fetcher,
        backendUrl,
      ),
    ).resolves.toEqual(studyState)

    expect(fetcher).toHaveBeenNthCalledWith(
      1,
      `${backendUrl}/student/lessons/lesson-1/study-state`,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer student-token',
        }),
      }),
    )
    expect(fetcher).toHaveBeenNthCalledWith(
      2,
      `${backendUrl}/student/lessons/lesson-1/study-state`,
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({
          bookmarked_block_ids: ['block-1'],
          notes_by_block_id: {
            'block-1': 'Can on lai vi du nay.',
          },
        }),
      }),
    )
  })

  it('loads student personal study review items', async () => {
    const reviewItems = [
      {
        lesson_id: 'lesson-1',
        lesson_title: 'AI Agent Architecture',
        class_id: 'class-1',
        block_id: 'block-1',
        block_title: 'Agent loop',
        block_type: 'concept_explanation',
        note: 'Can on lai vi du nay.',
        bookmarked: true,
        citation_count: 2,
        updated_at: '2026-06-29T00:05:00+00:00',
      },
    ]
    const fetcher = vi.fn(async () => Response.json(reviewItems))

    await expect(
      fetchStudentStudyReview('student-token', fetcher, backendUrl),
    ).resolves.toEqual(reviewItems)

    expect(fetcher).toHaveBeenCalledWith(
      `${backendUrl}/student/study-review`,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer student-token',
        }),
      }),
    )
  })

  it('loads student practice items from published lessons', async () => {
    const practiceItems = [
      {
        lesson_id: 'lesson-1',
        lesson_title: 'AI Agent Architecture',
        class_id: 'class-1',
        block_id: 'block-2',
        block_title: 'Checkpoint',
        block_type: 'quiz',
        prompt: 'Which signal should stop an unsafe tool call?',
        citation_count: 1,
        updated_at: '2026-06-29T00:05:00+00:00',
      },
    ]
    const fetcher = vi.fn(async () => Response.json(practiceItems))

    await expect(
      fetchStudentPracticeItems('student-token', fetcher, backendUrl),
    ).resolves.toEqual(practiceItems)

    expect(fetcher).toHaveBeenCalledWith(
      `${backendUrl}/student/practice-items`,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer student-token',
        }),
      }),
    )
  })

  it('reads and updates student practice attempt self-check state', async () => {
    const attempt = {
      lesson_id: 'lesson-1',
      class_id: 'class-1',
      student_id: 'demo-student',
      block_id: 'block-2',
      answer_text: 'I would stop the unsafe tool call.',
      self_check_status: 'needs_review' as const,
      attempt_count: 1,
      updated_at: '2026-06-29T00:05:00+00:00',
    }
    const payload = {
      answer_text: 'I would stop the unsafe tool call.',
      self_check_status: 'needs_review' as const,
    }
    const fetcher = vi.fn(async () => Response.json(attempt))

    await expect(
      fetchStudentPracticeAttempt(
        'lesson-1',
        'block-2',
        'student-token',
        fetcher,
        backendUrl,
      ),
    ).resolves.toEqual(attempt)
    await expect(
      updateStudentPracticeAttempt(
        'lesson-1',
        'block-2',
        payload,
        'student-token',
        fetcher,
        backendUrl,
      ),
    ).resolves.toEqual(attempt)

    expect(fetcher).toHaveBeenNthCalledWith(
      1,
      `${backendUrl}/student/lessons/lesson-1/practice-attempts/block-2`,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer student-token',
        }),
      }),
    )
    expect(fetcher).toHaveBeenNthCalledWith(
      2,
      `${backendUrl}/student/lessons/lesson-1/practice-attempts/block-2`,
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    )
  })
})
