import { describe, expect, it, vi } from 'vitest'

import {
  addStudentToClass,
  createClassProfile,
  createCourse,
  fetchAdminReviewQueue,
  fetchClassOutlines,
  fetchCourses,
  fetchDocuments,
  fetchStudentLesson,
  fetchStudentClasses,
  fetchStudentLessons,
  fetchStudents,
  fetchTeacherLessons,
  generateLessonBlocks,
  generateOutline,
  publishLesson,
  regenerateLessonBlock,
  requestLessonChanges,
  retrieveChunks,
  setLessonBlockStatus,
  submitLesson,
  updateLessonBlock,
  updateOutlineSession,
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
    const fetcher = vi.fn(async () => Response.json(response))

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
      `${backendUrl}/student/classes`,
      expect.any(Object),
    )
    expect(fetcher).toHaveBeenNthCalledWith(
      5,
      `${backendUrl}/student/lessons`,
      expect.any(Object),
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
        chunk_count: 12,
        last_ingested_at: '2026-06-28T00:00:00+00:00',
        error_message: null,
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

  it('loads admin review queue, publishes, and requests changes', async () => {
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
})
