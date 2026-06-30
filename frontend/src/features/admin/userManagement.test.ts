import { describe, expect, it } from 'vitest'

import type { ManagedUser } from '../../api/auth'
import {
  buildManagedUserSummary,
  filterManagedUsers,
} from './userManagement'

const users: ManagedUser[] = [
  {
    id: 'teacher-1',
    email: 'teacher@example.edu',
    name: 'Teacher One',
    role: 'teacher',
    status: 'active',
    organization_id: 'org-demo',
  },
  {
    id: 'student-1',
    email: 'student@example.edu',
    name: 'Student One',
    role: 'student',
    status: 'disabled',
    organization_id: 'org-demo',
  },
  {
    id: 'student-2',
    email: 'active.student@example.edu',
    name: 'Active Student',
    role: 'student',
    status: 'active',
    organization_id: 'org-demo',
  },
]

describe('admin user management helpers', () => {
  it('summarizes managed users by role and status', () => {
    expect(buildManagedUserSummary(users)).toEqual({
      total: 3,
      active: 2,
      disabled: 1,
      teachers: 1,
      students: 2,
    })
  })

  it('filters managed users by query role and status', () => {
    expect(
      filterManagedUsers(users, {
        query: 'student',
        role: 'student',
        status: 'active',
      }).map((user) => user.id),
    ).toEqual(['student-2'])
  })
})
