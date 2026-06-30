import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  BookOpen,
  ClipboardCheck,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LockKeyhole,
  Library,
  LogOut,
  Mail,
  MonitorPlay,
  RefreshCcw,
  ShieldCheck,
  Ticket,
  UserPlus,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react'
import './App.css'
import teachflowHeroImage from './assets/teachflow-education-hero.png'
import {
  acceptInvite,
  createSystemAdminInvite,
  createSystemOrganization,
  demoLogin,
  fetchCurrentUser,
  fetchDemoAccounts,
  fetchRoleDashboard,
  fetchSystemOrganizations,
  getRoleRoute,
  login,
  logout,
  refreshSession,
  type AuthSession,
  type InviteAcceptPayload,
  type LoginCredentials,
  type OrganizationInvite,
  type PublicDemoAccount,
  type RoleDashboard,
  type SystemOrganization,
} from './api/auth'
import { fetchHealth } from './api/health'
import { clearAuthSession, loadAuthSession, saveAuthSession } from './auth/session'
import { getWorkspaceConfig } from './auth/workspaces'
import { getBackendUrl } from './config'
import { getErrorMessage } from './errors'
import { AdminWorkspace } from './features/admin/AdminWorkspace'
import { StudentWorkspace } from './features/student/StudentWorkspace'
import { TeacherWorkspace } from './features/teacher/TeacherWorkspace'
import {
  displayName,
  roleLabel,
} from './labels'
import {
  Alert,
  DataTable,
  PaginationControls,
  SkeletonRows,
  Spinner,
  SwitchControl,
  ToastViewport,
  type ToastItem,
} from './ui/application'
import { buildPaginationState } from './ui/pagination'
import {
  getDefaultWorkspacePage,
  getWorkspacePage,
  getWorkspacePageForAction,
  getWorkspacePages,
  isWorkspacePageForRole,
  type WorkspacePageId,
} from './workspacePages'

type DemoAccountsState =
  | { status: 'loading' }
  | { status: 'ready'; accounts: PublicDemoAccount[] }
  | { status: 'error'; message: string }

type BackendConnectionState =
  | { status: 'checking'; message: string }
  | { status: 'ready'; message: string }
  | { status: 'error'; message: string }

type DashboardState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; dashboard: RoleDashboard }
  | { status: 'error'; message: string }

const EMPTY_CREDENTIALS: LoginCredentials = {
  email: '',
  password: '',
}
const EMPTY_INVITE_FORM: InviteAcceptPayload = {
  invite_code: '',
  email: '',
  name: '',
  password: '',
}

const LOGIN_FEATURES: Array<{
  Icon: typeof FileText
  label: string
}> = [
  { Icon: FileText, label: 'Giáo án' },
  { Icon: MonitorPlay, label: 'Slide' },
  { Icon: Library, label: 'Tài liệu' },
  { Icon: ClipboardCheck, label: 'Luyện tập' },
]

function RoleIcon({ role }: { role: PublicDemoAccount['role'] }) {
  if (role === 'system_admin') {
    return <ShieldCheck aria-hidden="true" size={20} />
  }
  if (role === 'admin') {
    return <ShieldCheck aria-hidden="true" size={20} />
  }
  if (role === 'teacher') {
    return <GraduationCap aria-hidden="true" size={20} />
  }
  return <UserRound aria-hidden="true" size={20} />
}

function loginRoleLabel(role: PublicDemoAccount['role']): string {
  if (role === 'admin') {
    return 'Admin'
  }
  if (role === 'teacher') {
    return 'Teacher'
  }
  if (role === 'student') {
    return 'Student'
  }
  return roleLabel(role)
}

function workspacePrimaryActions(role: AuthSession['user']['role']) {
  if (role === 'system_admin') {
    return ['Tạo tổ chức', 'Mời Admin tổ chức']
  }

  if (role === 'admin') {
    return ['Hàng đợi duyệt', 'Tác vụ']
  }

  if (role === 'student') {
    return ['Luyện tập', 'Lesson đã xuất bản']
  }

  return ['Tài liệu soạn bài', 'Lesson Studio']
}

function pageIcon(pageId: WorkspacePageId) {
  const iconMap: Partial<Record<WorkspacePageId, typeof LayoutDashboard>> = {
    'admin-knowledge': Library,
    'admin-jobs': MonitorPlay,
    'admin-review': ClipboardCheck,
    'admin-users': UserPlus,
    'student-classes': UsersRound,
    'student-documents': Library,
    'student-lessons': BookOpen,
    'student-practice': ClipboardCheck,
    'system-admin-invites': UserPlus,
    'system-organizations': ShieldCheck,
    'teacher-documents': Library,
    'teacher-jobs': MonitorPlay,
    'teacher-outline': FileText,
    'teacher-overview': LayoutDashboard,
    'teacher-setup': UsersRound,
    'teacher-studio': ClipboardCheck,
  }

  return iconMap[pageId] ?? LayoutDashboard
}

function initialWorkspacePage(role: AuthSession['user']['role']): WorkspacePageId {
  const hashPage = window.location.hash.replace('#', '')
  if (isWorkspacePageForRole(role, hashPage)) {
    return hashPage
  }

  return getDefaultWorkspacePage(role)
}

function LoginPanel({
  accountsState,
  backendConnection,
  credentials,
  inviteForm,
  inviteError,
  loginError,
  isAcceptingInvite,
  isInvitePanelOpen,
  isSubmitting,
  onChangeCredentials,
  onChangeInviteForm,
  onAcceptInviteSubmit,
  onCloseInvitePanel,
  onOpenInvitePanel,
  onRetryConnection,
  onSelectAccount,
  onSubmit,
}: {
  accountsState: DemoAccountsState
  backendConnection: BackendConnectionState
  credentials: LoginCredentials
  inviteForm: InviteAcceptPayload
  inviteError: string | null
  loginError: string | null
  isAcceptingInvite: boolean
  isInvitePanelOpen: boolean
  isSubmitting: boolean
  onChangeCredentials: (credentials: LoginCredentials) => void
  onChangeInviteForm: (payload: InviteAcceptPayload) => void
  onAcceptInviteSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCloseInvitePanel: () => void
  onOpenInvitePanel: () => void
  onRetryConnection: () => void
  onSelectAccount: (account: PublicDemoAccount) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  const canUseAuth = backendConnection.status === 'ready'

  return (
    <section className="login-layout" aria-labelledby="login-title">
      <div className="product-panel">
        <div className="product-panel-copy">
          <div className="brand-lockup">
            <span className="brand-mark">
              <GraduationCap aria-hidden="true" size={22} />
            </span>
            <strong>TeachFlow AI</strong>
          </div>
          <h1 id="login-title">AI Teaching Assistant</h1>
          <div className="login-feature-strip" aria-label="Điểm mạnh TeachFlow AI">
            {LOGIN_FEATURES.map(({ Icon, label }) => (
              <span className="login-feature-chip" key={label}>
                <Icon aria-hidden="true" size={18} />
                {label}
              </span>
            ))}
          </div>
        </div>
        <div className="product-hero-visual" aria-hidden="true">
          <img src={teachflowHeroImage} alt="" />
        </div>
      </div>

      <div className="auth-panel-stack">
        <form className="login-card" onSubmit={onSubmit}>
          <div className={`login-system-status ${backendConnection.status}`}>
            {backendConnection.status === 'checking' ? (
              <Spinner label="Đang kết nối" />
            ) : (
              <ShieldCheck aria-hidden="true" size={17} />
            )}
            <span>{backendConnection.message}</span>
            {backendConnection.status === 'error' && (
              <button
                aria-label="Thử lại kết nối"
                className="ghost-button icon-button"
                title="Thử lại"
                type="button"
                onClick={onRetryConnection}
              >
                <RefreshCcw aria-hidden="true" size={16} />
              </button>
            )}
          </div>

          <div>
            <p className="section-label">Chọn vai trò</p>
            <div className="account-list" aria-live="polite">
              {accountsState.status === 'loading' && (
                <p className="muted">Đang tải...</p>
              )}

              {accountsState.status === 'error' && (
                <p className="error-text">{accountsState.message}</p>
              )}

              {accountsState.status === 'ready' &&
                accountsState.accounts.length === 0 && (
                  <p className="muted">
                    Chưa bật truy cập nhanh.
                  </p>
                )}

              {accountsState.status === 'ready' &&
                accountsState.accounts.map((account) => (
                  <button
                    aria-label={`Mở ${loginRoleLabel(account.role)} (${account.email})`}
                    className={`account-button${
                      credentials.email === account.email ? ' selected' : ''
                    }`}
                    disabled={!canUseAuth || isSubmitting || isAcceptingInvite}
                    key={account.id}
                    title={account.email}
                    type="button"
                    onClick={() => onSelectAccount(account)}
                  >
                    <RoleIcon role={account.role} />
                    <span>
                      <strong>{loginRoleLabel(account.role)}</strong>
                    </span>
                  </button>
                ))}
            </div>
          </div>

          <div className="login-divider" aria-hidden="true">
            <span>hoặc</span>
          </div>

          <label className="field login-field">
            <span>Email</span>
            <span className="login-input-frame">
              <Mail aria-hidden="true" size={18} />
              <input
                autoComplete="username"
                disabled={!canUseAuth || isSubmitting || isAcceptingInvite}
                name="email"
                type="email"
                value={credentials.email}
                onChange={(event) =>
                  onChangeCredentials({
                    ...credentials,
                    email: event.target.value,
                  })
                }
              />
            </span>
          </label>

          <label className="field login-field">
            <span>Mật khẩu</span>
            <span className="login-input-frame">
              <LockKeyhole aria-hidden="true" size={18} />
              <input
                autoComplete="current-password"
                disabled={!canUseAuth || isSubmitting || isAcceptingInvite}
                name="password"
                type="password"
                value={credentials.password}
                onChange={(event) =>
                  onChangeCredentials({
                    ...credentials,
                    password: event.target.value,
                  })
                }
              />
            </span>
          </label>

          {loginError && <p className="error-text">{loginError}</p>}

          <button
            className="primary-button"
            disabled={!canUseAuth || isSubmitting || isAcceptingInvite}
            type="submit"
          >
            <ShieldCheck aria-hidden="true" size={18} />
            {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>

          <div className="invite-entry">
            <button
              aria-label="Có mã mời?"
              className="ghost-button invite-toggle-button"
              disabled={!canUseAuth || isSubmitting || isAcceptingInvite}
              type="button"
              onClick={onOpenInvitePanel}
            >
              <Ticket aria-hidden="true" size={17} />
              Mã mời
            </button>
          </div>
        </form>

        {isInvitePanelOpen && (
          <form
            aria-label="Tham gia bằng mã mời"
            className="login-card invite-accept-card"
            onSubmit={onAcceptInviteSubmit}
          >
            <div className="invite-card-header">
              <div>
                <p className="section-label">Tham gia bằng mã mời</p>
                <p className="invite-card-description">
                  Dành cho Teacher hoặc Student đã được Admin mời vào tổ chức.
                </p>
              </div>
              <button
                aria-label="Đóng form mã mời"
                className="ghost-button icon-button invite-close-button"
                disabled={isAcceptingInvite}
                type="button"
                onClick={onCloseInvitePanel}
              >
                <X aria-hidden="true" size={17} />
              </button>
            </div>

            <label className="field">
              <span>Mã mời</span>
              <input
                autoComplete="one-time-code"
                disabled={!canUseAuth || isAcceptingInvite}
                name="invite_code"
                type="text"
                value={inviteForm.invite_code}
                onChange={(event) =>
                  onChangeInviteForm({
                    ...inviteForm,
                    invite_code: event.target.value,
                  })
                }
              />
            </label>

            <div className="invite-grid">
              <label className="field">
                <span>Email</span>
                <input
                  autoComplete="email"
                  disabled={!canUseAuth || isAcceptingInvite}
                  name="invite_email"
                  type="email"
                  value={inviteForm.email}
                  onChange={(event) =>
                    onChangeInviteForm({
                      ...inviteForm,
                      email: event.target.value,
                    })
                  }
                />
              </label>

              <label className="field">
                <span>Họ tên</span>
                <input
                  autoComplete="name"
                  disabled={!canUseAuth || isAcceptingInvite}
                  name="invite_name"
                  type="text"
                  value={inviteForm.name}
                  onChange={(event) =>
                    onChangeInviteForm({
                      ...inviteForm,
                      name: event.target.value,
                    })
                  }
                />
              </label>
            </div>

            <label className="field">
              <span>Mật khẩu mới</span>
              <input
                autoComplete="new-password"
                disabled={!canUseAuth || isAcceptingInvite}
                name="invite_password"
                type="password"
                value={inviteForm.password}
                onChange={(event) =>
                  onChangeInviteForm({
                    ...inviteForm,
                    password: event.target.value,
                  })
                }
              />
            </label>

            {inviteError && <p className="error-text">{inviteError}</p>}

            <button
              className="primary-button invite-button"
              disabled={!canUseAuth || isSubmitting || isAcceptingInvite}
              type="submit"
            >
              <UserPlus aria-hidden="true" size={18} />
              {isAcceptingInvite ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
            </button>
          </form>
        )}
      </div>
    </section>
  )
}

function SystemAdminWorkspace({
  activePage,
  token,
}: {
  activePage: WorkspacePageId
  token: string
}) {
  const [organizations, setOrganizations] = useState<SystemOrganization[]>([])
  const [selectedOrganizationId, setSelectedOrganizationId] = useState('')
  const [organizationPage, setOrganizationPage] = useState(1)
  const [organizationForm, setOrganizationForm] = useState({
    id: '',
    name: '',
  })
  const [adminEmail, setAdminEmail] = useState('')
  const [createdInvite, setCreatedInvite] = useState<OrganizationInvite | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingOrganization, setIsSavingOrganization] = useState(false)
  const [isCreatingInvite, setIsCreatingInvite] = useState(false)
  const paginatedOrganizations = useMemo(
    () =>
      buildPaginationState(organizations, {
        page: organizationPage,
        pageSize: 5,
      }),
    [organizationPage, organizations],
  )

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    fetchSystemOrganizations(token)
      .then((nextOrganizations) => {
        if (cancelled) {
          return
        }
        setOrganizations(nextOrganizations)
        setSelectedOrganizationId(
          (current) => current || nextOrganizations[0]?.id || '',
        )
        setErrorMessage(null)
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setErrorMessage(
            getErrorMessage(error, 'Không tải được danh sách tổ chức'),
          )
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [token])

  async function handleCreateOrganization(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSavingOrganization(true)
    setErrorMessage(null)
    setStatusMessage(null)

    try {
      const organization = await createSystemOrganization(
        {
          id: organizationForm.id || null,
          name: organizationForm.name,
        },
        token,
      )
      setOrganizations((current) => {
        const existing = current.filter((item) => item.id !== organization.id)
        return [...existing, organization].sort((a, b) =>
          a.name.localeCompare(b.name),
        )
      })
      setSelectedOrganizationId(organization.id)
      setOrganizationForm({ id: '', name: '' })
      setStatusMessage(`Đã tạo tổ chức ${organization.name}.`)
    } catch (error: unknown) {
      setErrorMessage(getErrorMessage(error, 'Không tạo được tổ chức'))
    } finally {
      setIsSavingOrganization(false)
    }
  }

  async function handleCreateAdminInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedOrganizationId) {
      setErrorMessage('Chọn tổ chức trước khi mời Admin.')
      return
    }

    setIsCreatingInvite(true)
    setErrorMessage(null)
    setStatusMessage(null)

    try {
      const invite = await createSystemAdminInvite(
        selectedOrganizationId,
        { email: adminEmail },
        token,
      )
      setCreatedInvite(invite)
      setAdminEmail('')
      setStatusMessage(`Đã tạo mã mời Admin cho ${invite.email}.`)
    } catch (error: unknown) {
      setErrorMessage(getErrorMessage(error, 'Không tạo được mã mời Admin'))
    } finally {
      setIsCreatingInvite(false)
    }
  }

  return (
    <section
      aria-labelledby="system-owner-title"
      className="panel learning-panel system-admin-workspace"
      id="system-organizations"
      tabIndex={-1}
    >
      <div className="v4-teacher-hero">
        <div>
          <p className="section-label">Owner hệ thống</p>
          <h2 id="system-owner-title">Thiết lập tổ chức mới</h2>
          <p className="muted">
            Tạo tổ chức và gửi mã mời cho Admin đầu tiên của tổ chức đó. Owner
            hệ thống không xuất hiện trong truy cập nhanh demo.
          </p>
        </div>
      </div>

      {isLoading && <SkeletonRows columns={3} rows={4} />}
      {errorMessage && (
        <Alert title="Không hoàn tất thao tác" tone="danger">
          {errorMessage}
        </Alert>
      )}
      {statusMessage && (
        <Alert title="Thao tác thành công" tone="success">
          {statusMessage}
        </Alert>
      )}

      <div className="system-admin-grid">
        {activePage === 'system-organizations' && (
          <form className="system-admin-form" onSubmit={handleCreateOrganization}>
            <div>
              <h3>Tổ chức</h3>
              <p className="muted">Tên tổ chức nên là tên trung tâm, khoa hoặc bộ môn.</p>
            </div>
            <label className="field">
              <span>Tên tổ chức</span>
              <input
                required
                type="text"
                value={organizationForm.name}
                onChange={(event) =>
                  setOrganizationForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
              />
            </label>
            <label className="field">
              <span>Mã tổ chức tuỳ chọn</span>
              <input
                type="text"
                value={organizationForm.id}
                onChange={(event) =>
                  setOrganizationForm((current) => ({
                    ...current,
                    id: event.target.value,
                  }))
                }
              />
            </label>
            <button
              className="primary-button"
              disabled={isSavingOrganization}
              type="submit"
            >
              {isSavingOrganization ? (
                <Spinner label="Đang tạo..." />
              ) : (
                'Tạo tổ chức'
              )}
            </button>
          </form>
        )}

        {activePage === 'system-admin-invites' && (
          <form className="system-admin-form" onSubmit={handleCreateAdminInvite}>
            <div>
              <h3>Mời Admin tổ chức</h3>
              <p className="muted">
                Admin tổ chức sẽ quản lý thư viện kiến thức, giáo viên và duyệt
                bài học trong phạm vi tổ chức đó.
              </p>
            </div>
            <label className="field">
              <span>Chọn tổ chức</span>
              <select
                required
                value={selectedOrganizationId}
                onChange={(event) => setSelectedOrganizationId(event.target.value)}
              >
                <option value="" disabled>
                  Chọn tổ chức
                </option>
                {organizations.map((organization) => (
                  <option key={organization.id} value={organization.id}>
                    {organization.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Email Admin</span>
              <input
                required
                type="email"
                value={adminEmail}
                onChange={(event) => setAdminEmail(event.target.value)}
              />
            </label>
            <button
              className="primary-button"
              disabled={isCreatingInvite || !selectedOrganizationId}
              type="submit"
            >
              {isCreatingInvite ? (
                <Spinner label="Đang tạo mã..." />
              ) : (
                'Tạo mã mời Admin'
              )}
            </button>
            {createdInvite && (
              <div className="system-invite-result">
                <span>Mã mời Admin</span>
                <strong>{createdInvite.invite_code}</strong>
              </div>
            )}
          </form>
        )}
      </div>

      <div className="system-organization-list">
        <DataTable
          columns={[
            {
              header: 'Tổ chức',
              key: 'name',
              render: (organization) => <strong>{organization.name}</strong>,
            },
            {
              header: 'Mã',
              key: 'id',
              render: (organization) => organization.id,
            },
            {
              header: 'Trạng thái',
              key: 'selected',
              render: (organization) =>
                selectedOrganizationId === organization.id ? 'Đang chọn' : 'Có thể chọn',
            },
          ]}
          emptyState={<p className="muted">Chưa có tổ chức nào.</p>}
          getRowKey={(organization) => organization.id}
          isLoading={isLoading}
          rows={paginatedOrganizations.items}
        />
        <PaginationControls
          state={paginatedOrganizations}
          onPageChange={setOrganizationPage}
        />
      </div>
    </section>
  )
}

function DashboardShell({
  dashboardState,
  isLoggingOut,
  session,
  onLogout,
}: {
  dashboardState: DashboardState
  isLoggingOut: boolean
  session: AuthSession
  onLogout: () => void
}) {
  const workspace = getWorkspaceConfig(session.user.role)
  const pages = getWorkspacePages(session.user.role)
  const [activePage, setActivePage] = useState<WorkspacePageId>(() =>
    initialWorkspacePage(session.user.role),
  )
  const [isFocusMode, setIsFocusMode] = useState(false)
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const currentPage = getWorkspacePage(session.user.role, activePage)

  useEffect(() => {
    if (!isWorkspacePageForRole(session.user.role, activePage)) {
      setActivePage(getDefaultWorkspacePage(session.user.role))
    }
  }, [activePage, session.user.role])

  function dismissToast(id: string) {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }

  function selectWorkspacePage(pageId: WorkspacePageId) {
    setActivePage(pageId)
    window.history.replaceState(null, '', `${getRoleRoute(session.user.role)}#${pageId}`)
  }

  function selectWorkspaceAction(label: string) {
    selectWorkspacePage(getWorkspacePageForAction(session.user.role, label))
  }

  return (
    <section className="workspace" aria-labelledby="workspace-title">
      <div className="workspace-grid">
        <aside className="sidebar">
          <div className="sidebar-brand">
            <span className="brand-mark">
              <GraduationCap aria-hidden="true" size={20} />
            </span>
            <strong>TeachFlow AI</strong>
          </div>
          <p className="section-label">Không gian làm việc</p>
          <strong>{workspace.focus}</strong>
          <nav className="workspace-nav" aria-label="Điều hướng workspace">
            {pages.map((page) => {
              const Icon = pageIcon(page.id)
              const isActive = page.id === activePage
              return (
                <button
                  aria-current={isActive ? 'page' : undefined}
                  className={isActive ? 'active' : ''}
                  key={page.id}
                  type="button"
                  onClick={() => selectWorkspacePage(page.id)}
                >
                  <Icon aria-hidden="true" size={18} />
                  <span>
                    <strong>{page.label}</strong>
                    <small>{page.description}</small>
                  </span>
                </button>
              )
            })}
          </nav>
        </aside>

        <div className={`workspace-content${isFocusMode ? ' focus-mode' : ''}`}>
          <header
            className={`workspace-header${
              session.user.role === 'teacher' ? ' teacher-workspace-header' : ''
            }`}
          >
            <div className="workspace-title-group">
              <div>
                <p className="eyebrow">{workspace.eyebrow}</p>
                <h1 id="workspace-title">{workspace.title}</h1>
              </div>
            </div>
            <div className="workspace-header-actions">
              <SwitchControl
                checked={isFocusMode}
                description="Ẩn bớt nhiễu thị giác khi làm việc"
                label="Chế độ tập trung"
                onChange={setIsFocusMode}
              />
              <div className="workspace-quick-actions" aria-label="Thao tác nhanh">
                {workspacePrimaryActions(session.user.role).map((label, index) => (
                  <button
                    className={index === 0 ? 'ghost-button' : 'primary-button'}
                    key={label}
                    type="button"
                    onClick={() => selectWorkspaceAction(label)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="identity">
                <span>{displayName(session.user.name)}</span>
                <strong>{roleLabel(session.user.role)}</strong>
                <button
                  className="ghost-button icon-button"
                  disabled={isLoggingOut}
                  title={isLoggingOut ? 'Đang đăng xuất' : 'Đăng xuất'}
                  type="button"
                  onClick={onLogout}
                >
                  <LogOut aria-hidden="true" size={17} />
                  <span>{isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}</span>
                </button>
              </div>
            </div>
          </header>

          <div className="workspace-taskbar" aria-label="Thanh tác vụ workspace">
            {pages.map((page) => {
              const Icon = pageIcon(page.id)
              const isActive = page.id === activePage
              return (
                <button
                  aria-current={isActive ? 'page' : undefined}
                  className={isActive ? 'active' : ''}
                  key={page.id}
                  type="button"
                  onClick={() => selectWorkspacePage(page.id)}
                >
                  <Icon aria-hidden="true" size={17} />
                  <span>{page.label}</span>
                </button>
              )
            })}
          </div>

          <div className="workspace-main" aria-live="polite">
            <div className="page-heading">
              <div>
                <p className="section-label">Trang đang mở</p>
                <h2>{currentPage.label}</h2>
              </div>
            </div>

            {dashboardState.status === 'loading' && (
              <div className="state-panel">
                <SkeletonRows columns={3} rows={4} />
              </div>
            )}

            {dashboardState.status === 'error' && (
              <Alert title="Không tải được workspace" tone="danger">
                {dashboardState.message}
              </Alert>
            )}

            {dashboardState.status === 'ready' && (
              <>
                {session.user.role === 'system_admin' && (
                  <SystemAdminWorkspace
                    activePage={activePage}
                    token={session.access_token}
                  />
                )}

                {session.user.role === 'teacher' && (
                  <TeacherWorkspace
                    activePage={activePage}
                    onPageChange={selectWorkspacePage}
                    token={session.access_token}
                  />
                )}

                {session.user.role === 'admin' && (
                  <AdminWorkspace
                    activePage={activePage}
                    token={session.access_token}
                  />
                )}

                {session.user.role === 'student' && (
                  <StudentWorkspace
                    activePage={activePage}
                    token={session.access_token}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <ToastViewport onDismiss={dismissToast} toasts={toasts} />
    </section>
  )
}

function App() {
  const backendUrl = useMemo(() => {
    try {
      return getBackendUrl()
    } catch {
      return ''
    }
  }, [])
  const [accountsState, setAccountsState] = useState<DemoAccountsState>({
    status: 'loading',
  })
  const [backendConnection, setBackendConnection] =
    useState<BackendConnectionState>({
      status: 'checking',
      message: 'Đang kết nối hệ thống',
    })
  const [credentials, setCredentials] =
    useState<LoginCredentials>(EMPTY_CREDENTIALS)
  const [inviteForm, setInviteForm] =
    useState<InviteAcceptPayload>(EMPTY_INVITE_FORM)
  const [dashboardState, setDashboardState] = useState<DashboardState>({
    status: 'idle',
  })
  const [isInvitePanelOpen, setIsInvitePanelOpen] = useState(false)
  const [isAcceptingInvite, setIsAcceptingInvite] = useState(false)
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [session, setSession] = useState<AuthSession | null>(() =>
    loadAuthSession(),
  )

  const refreshLoginConnection = useCallback(async () => {
    if (!backendUrl) {
      setBackendConnection({
        status: 'error',
        message: 'Chưa cấu hình hệ thống',
      })
      setAccountsState({
        status: 'error',
        message: 'Chưa thể tải truy cập nhanh.',
      })
      return
    }

    setBackendConnection({
      status: 'checking',
      message: 'Đang kết nối hệ thống',
    })
    setAccountsState({ status: 'loading' })

    try {
      const [, accounts] = await Promise.all([
        fetchHealth(),
        fetchDemoAccounts(),
      ])
      setAccountsState({ status: 'ready', accounts })
      setBackendConnection({
        status: 'ready',
        message: 'Sẵn sàng',
      })
    } catch (error: unknown) {
      const message = getErrorMessage(error, 'Không kết nối được hệ thống')
      setBackendConnection({
        status: 'error',
        message,
      })
      setAccountsState({
        status: 'error',
        message: 'Không tải được truy cập nhanh.',
      })
    }
  }, [backendUrl])

  useEffect(() => {
    if (session) {
      return
    }

    const params = new URLSearchParams(window.location.search)
    const inviteCode = params.get('invite_code') ?? params.get('code')
    if (!inviteCode) {
      return
    }

    setInviteForm((current) => ({
      ...current,
      invite_code: current.invite_code || inviteCode,
    }))
    setIsInvitePanelOpen(true)
  }, [session])

  useEffect(() => {
    if (!session) {
      void refreshLoginConnection()
    }
  }, [refreshLoginConnection, session])

  useEffect(() => {
    if (!session) {
      setDashboardState({ status: 'idle' })
      return
    }

    let cancelled = false
    setDashboardState({ status: 'loading' })

    Promise.all([
      fetchCurrentUser(session.access_token),
      fetchRoleDashboard(session.user.role, session.access_token),
    ])
      .then(([currentUser, dashboard]) => {
        if (cancelled) {
          return
        }

        const verifiedSession = { ...session, user: currentUser }
        if (
          currentUser.id !== session.user.id ||
          currentUser.role !== session.user.role
        ) {
          saveAuthSession(verifiedSession)
          setSession(verifiedSession)
        }
        setDashboardState({ status: 'ready', dashboard })
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          if (session.refresh_token) {
            refreshSession(session.refresh_token)
              .then((nextSession) => {
                if (cancelled) {
                  return
                }
                saveAuthSession(nextSession)
                setSession(nextSession)
              })
              .catch((refreshError: unknown) => {
                if (cancelled) {
                  return
                }
                clearAuthSession()
                setSession(null)
                setLoginError(
                  getErrorMessage(refreshError, 'Phiên đăng nhập đã hết hạn'),
                )
              })
            return
          }
          clearAuthSession()
          setSession(null)
          setLoginError(getErrorMessage(error, 'Phiên đăng nhập đã hết hạn'))
        }
      })

    return () => {
      cancelled = true
    }
  }, [session])

  async function authenticate(nextCredentials: LoginCredentials) {
    setIsLoggingIn(true)
    setLoginError(null)

    try {
      const nextSession = await login(nextCredentials)
      saveAuthSession(nextSession)
      setSession(nextSession)
      setCredentials(EMPTY_CREDENTIALS)
      setInviteError(null)
      setIsInvitePanelOpen(false)
      window.history.pushState(null, '', getRoleRoute(nextSession.user.role))
    } catch (error: unknown) {
      setLoginError(getErrorMessage(error, 'Đăng nhập thất bại'))
    } finally {
      setIsLoggingIn(false)
    }
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (backendConnection.status !== 'ready') {
      setLoginError('Hệ thống chưa sẵn sàng.')
      return
    }
    await authenticate(credentials)
  }

  async function handleAcceptInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (backendConnection.status !== 'ready') {
      setInviteError('Hệ thống chưa sẵn sàng.')
      return
    }
    setIsAcceptingInvite(true)
    setInviteError(null)
    setLoginError(null)

    try {
      const nextSession = await acceptInvite(inviteForm)
      saveAuthSession(nextSession)
      setSession(nextSession)
      setInviteForm(EMPTY_INVITE_FORM)
      setCredentials(EMPTY_CREDENTIALS)
      setIsInvitePanelOpen(false)
      window.history.pushState(null, '', getRoleRoute(nextSession.user.role))
    } catch (error: unknown) {
      setInviteError(getErrorMessage(error, 'Không tạo được tài khoản từ mã mời'))
    } finally {
      setIsAcceptingInvite(false)
    }
  }

  function handleSelectAccount(account: PublicDemoAccount) {
    if (backendConnection.status !== 'ready') {
      setLoginError('Hệ thống chưa sẵn sàng.')
      return
    }
    setIsLoggingIn(true)
    setLoginError(null)

    demoLogin({ account_id: account.id })
      .then((nextSession) => {
        saveAuthSession(nextSession)
        setSession(nextSession)
        setCredentials(EMPTY_CREDENTIALS)
        setInviteError(null)
        setIsInvitePanelOpen(false)
        window.history.pushState(null, '', getRoleRoute(nextSession.user.role))
      })
      .catch((error: unknown) => {
        setLoginError(getErrorMessage(error, 'Không mở được truy cập nhanh'))
      })
      .finally(() => {
        setIsLoggingIn(false)
      })
  }

  async function handleLogout() {
    if (!session) {
      return
    }

    setIsLoggingOut(true)

    try {
      await logout(session.access_token)
    } catch {
      // Local session cleanup still runs if the demo backend was restarted.
    } finally {
      clearAuthSession()
      setSession(null)
      setDashboardState({ status: 'idle' })
      window.history.pushState(null, '', '/')
      setIsLoggingOut(false)
    }
  }

  return (
    <main className="app-shell">
      {session ? (
        <DashboardShell
          dashboardState={dashboardState}
          isLoggingOut={isLoggingOut}
          session={session}
          onLogout={handleLogout}
        />
      ) : (
        <LoginPanel
          accountsState={accountsState}
          backendConnection={backendConnection}
          credentials={credentials}
          inviteError={inviteError}
          inviteForm={inviteForm}
          isAcceptingInvite={isAcceptingInvite}
          isInvitePanelOpen={isInvitePanelOpen}
          isSubmitting={isLoggingIn}
          loginError={loginError}
          onAcceptInviteSubmit={handleAcceptInvite}
          onChangeCredentials={setCredentials}
          onChangeInviteForm={setInviteForm}
          onCloseInvitePanel={() => setIsInvitePanelOpen(false)}
          onOpenInvitePanel={() => setIsInvitePanelOpen(true)}
          onRetryConnection={() => void refreshLoginConnection()}
          onSelectAccount={handleSelectAccount}
          onSubmit={handleLogin}
        />
      )}
    </main>
  )
}

export default App
