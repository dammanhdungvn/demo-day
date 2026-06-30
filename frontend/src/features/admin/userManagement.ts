import type {
  ManagedUser,
  ManagedUserRole,
  ManagedUserStatus,
} from '../../api/auth'

export type ManagedUserFilterState = {
  query: string
  role: ManagedUserRole | 'all'
  status: ManagedUserStatus | 'all'
}

export type ManagedUserSummary = {
  total: number
  active: number
  disabled: number
  teachers: number
  students: number
}

export function buildManagedUserSummary(users: ManagedUser[]): ManagedUserSummary {
  return users.reduce<ManagedUserSummary>(
    (summary, user) => ({
      total: summary.total + 1,
      active: summary.active + (user.status === 'active' ? 1 : 0),
      disabled: summary.disabled + (user.status === 'disabled' ? 1 : 0),
      teachers: summary.teachers + (user.role === 'teacher' ? 1 : 0),
      students: summary.students + (user.role === 'student' ? 1 : 0),
    }),
    {
      total: 0,
      active: 0,
      disabled: 0,
      teachers: 0,
      students: 0,
    },
  )
}

export function filterManagedUsers(
  users: ManagedUser[],
  filters: ManagedUserFilterState,
): ManagedUser[] {
  const query = filters.query.trim().toLowerCase()
  return users.filter((user) => {
    const matchesRole = filters.role === 'all' || user.role === filters.role
    const matchesStatus = filters.status === 'all' || user.status === filters.status
    const matchesQuery =
      !query ||
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)

    return matchesRole && matchesStatus && matchesQuery
  })
}
