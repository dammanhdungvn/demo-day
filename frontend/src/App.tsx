import {
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  BookOpen,
  ChevronRight,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Library,
  LogOut,
  MonitorPlay,
  ShieldCheck,
  UserPlus,
  UserRound,
  UsersRound,
} from 'lucide-react'
import './App.css'
import {
  acceptInvite,
  demoLogin,
  fetchCurrentUser,
  fetchDemoAccounts,
  fetchRoleDashboard,
  getRoleRoute,
  login,
  logout,
  refreshSession,
  type AuthSession,
  type InviteAcceptPayload,
  type LoginCredentials,
  type PublicDemoAccount,
  type RoleDashboard,
} from './api/auth'
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
  getWorkspaceActionTarget,
} from './workspaceActionTargets'

type DemoAccountsState =
  | { status: 'loading' }
  | { status: 'ready'; accounts: PublicDemoAccount[] }
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
function RoleIcon({ role }: { role: PublicDemoAccount['role'] }) {
  if (role === 'admin') {
    return <ShieldCheck aria-hidden="true" size={20} />
  }
  if (role === 'teacher') {
    return <GraduationCap aria-hidden="true" size={20} />
  }
  return <UserRound aria-hidden="true" size={20} />
}

function workflowItems(role: AuthSession['user']['role']) {
  if (role === 'admin') {
    return [
      { icon: ClipboardCheck, label: 'Hàng đợi duyệt' },
      { icon: FileText, label: 'Nguồn dẫn' },
      { icon: CheckCircle2, label: 'Xuất bản' },
    ]
  }

  if (role === 'student') {
    return [
      { icon: UsersRound, label: 'Lớp của tôi' },
      { icon: Library, label: 'Tài liệu ngữ cảnh' },
      { icon: BookOpen, label: 'Lesson đã xuất bản' },
      { icon: ClipboardCheck, label: 'Luyện tập' },
      { icon: MonitorPlay, label: 'Trình chiếu/PDF' },
    ]
  }

  return [
    { icon: LayoutDashboard, label: 'Tổng quan' },
    { icon: Library, label: 'Tài liệu soạn bài' },
    { icon: FileText, label: 'Dàn ý bài giảng' },
    { icon: ClipboardCheck, label: 'Lesson Studio' },
  ]
}

function workspacePrimaryActions(role: AuthSession['user']['role']) {
  if (role === 'admin') {
    return ['Hàng đợi duyệt', 'Nguồn dẫn']
  }

  if (role === 'student') {
    return ['Luyện tập', 'Lesson đã xuất bản']
  }

  return ['Tài liệu soạn bài', 'Lesson Studio']
}

function focusWorkspaceSection(role: AuthSession['user']['role'], label: string) {
  const sectionId = getWorkspaceActionTarget(role, label)
  const section = document.getElementById(sectionId)

  if (!section) {
    return
  }

  section.scrollIntoView({ behavior: 'smooth', block: 'start' })
  section.focus({ preventScroll: true })
}

function LoginPanel({
  accountsState,
  credentials,
  inviteForm,
  inviteError,
  loginError,
  isAcceptingInvite,
  isSubmitting,
  onChangeCredentials,
  onChangeInviteForm,
  onAcceptInviteSubmit,
  onSelectAccount,
  onSubmit,
}: {
  accountsState: DemoAccountsState
  credentials: LoginCredentials
  inviteForm: InviteAcceptPayload
  inviteError: string | null
  loginError: string | null
  isAcceptingInvite: boolean
  isSubmitting: boolean
  onChangeCredentials: (credentials: LoginCredentials) => void
  onChangeInviteForm: (payload: InviteAcceptPayload) => void
  onAcceptInviteSubmit: (event: FormEvent<HTMLFormElement>) => void
  onSelectAccount: (account: PublicDemoAccount) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  return (
    <section className="login-layout" aria-labelledby="login-title">
      <div className="product-panel">
        <div className="brand-lockup">
          <span className="brand-mark">
            <GraduationCap aria-hidden="true" size={22} />
          </span>
          <strong>TeachFlow AI</strong>
        </div>
        <h1 id="login-title">Đăng nhập không gian làm việc</h1>
        <p className="lead">
          Chọn nhanh vai trò dùng thử hoặc đăng nhập bằng tài khoản được cấp để
          kiểm thử luồng tạo bài giảng bằng AI.
        </p>
      </div>

      <div className="auth-panel-stack">
        <form className="login-card" onSubmit={onSubmit}>
          <div>
            <p className="section-label">Truy cập nhanh</p>
            <div className="account-list" aria-live="polite">
              {accountsState.status === 'loading' && (
                <p className="muted">Đang tải quyền truy cập nhanh...</p>
              )}

              {accountsState.status === 'error' && (
                <p className="error-text">{accountsState.message}</p>
              )}

              {accountsState.status === 'ready' &&
                accountsState.accounts.length === 0 && (
                  <p className="muted">
                    Truy cập nhanh chưa bật. Dùng tài khoản được cấp hoặc kích
                    hoạt invite.
                  </p>
                )}

              {accountsState.status === 'ready' &&
                accountsState.accounts.map((account) => (
                  <button
                    className={`account-button${
                      credentials.email === account.email ? ' selected' : ''
                    }`}
                    disabled={isSubmitting || isAcceptingInvite}
                    key={account.id}
                    type="button"
                    onClick={() => onSelectAccount(account)}
                  >
                    <RoleIcon role={account.role} />
                    <span>
                      <strong>{roleLabel(account.role)}</strong>
                      <small>{account.email}</small>
                    </span>
                    <ChevronRight aria-hidden="true" size={18} />
                  </button>
                ))}
            </div>
          </div>

          <label className="field">
            <span>Email</span>
            <input
              autoComplete="username"
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
          </label>

          <label className="field">
            <span>Mật khẩu</span>
            <input
              autoComplete="current-password"
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
          </label>

          {loginError && <p className="error-text">{loginError}</p>}

          <button
            className="primary-button"
            disabled={isSubmitting || isAcceptingInvite}
            type="submit"
          >
            <ShieldCheck aria-hidden="true" size={18} />
            {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <form
          className="login-card invite-accept-card"
          onSubmit={onAcceptInviteSubmit}
        >
          <div className="panel-heading">
            <p className="section-label">Kích hoạt invite</p>
            <span className="status-pill neutral-pill">Teacher/Student</span>
          </div>

          <label className="field">
            <span>Mã mời</span>
            <input
              autoComplete="one-time-code"
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
            disabled={isSubmitting || isAcceptingInvite}
            type="submit"
          >
            <UserPlus aria-hidden="true" size={18} />
            {isAcceptingInvite ? 'Đang kích hoạt...' : 'Kích hoạt'}
          </button>
        </form>
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
  const navItems = workflowItems(session.user.role)

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
            {navItems.map((item, index) => {
              const Icon = item.icon
              return (
                <button
                  aria-controls={getWorkspaceActionTarget(
                    session.user.role,
                    item.label,
                  )}
                  className={index === 0 ? 'active' : ''}
                  key={item.label}
                  type="button"
                  onClick={() =>
                    focusWorkspaceSection(session.user.role, item.label)
                  }
                >
                  <Icon aria-hidden="true" size={18} />
                  {item.label}
                </button>
              )
            })}
          </nav>
        </aside>

        <div className="workspace-content">
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
              <div className="workspace-quick-actions" aria-label="Thao tác nhanh">
                {workspacePrimaryActions(session.user.role).map((label, index) => (
                  <button
                    className={index === 0 ? 'ghost-button' : 'primary-button'}
                    key={label}
                    type="button"
                    onClick={() => focusWorkspaceSection(session.user.role, label)}
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
            {navItems.map((item, index) => {
              const Icon = item.icon
              return (
                <button
                  aria-controls={getWorkspaceActionTarget(
                    session.user.role,
                    item.label,
                  )}
                  className={index === 0 ? 'active' : ''}
                  key={item.label}
                  type="button"
                  onClick={() =>
                    focusWorkspaceSection(session.user.role, item.label)
                  }
                >
                  <Icon aria-hidden="true" size={17} />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </div>

          <div className="workspace-main" aria-live="polite">
            {dashboardState.status === 'loading' && (
              <div className="state-panel">Đang xác thực vai trò...</div>
            )}

            {dashboardState.status === 'error' && (
              <div className="state-panel error">{dashboardState.message}</div>
            )}

            {dashboardState.status === 'ready' && (
              <>
                {session.user.role === 'teacher' && (
                  <TeacherWorkspace token={session.access_token} />
                )}

                {session.user.role === 'admin' && (
                  <AdminWorkspace token={session.access_token} />
                )}

                {session.user.role === 'student' && (
                  <StudentWorkspace token={session.access_token} />
                )}
              </>
            )}
          </div>
        </div>
      </div>
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
  const [credentials, setCredentials] =
    useState<LoginCredentials>(EMPTY_CREDENTIALS)
  const [inviteForm, setInviteForm] =
    useState<InviteAcceptPayload>(EMPTY_INVITE_FORM)
  const [dashboardState, setDashboardState] = useState<DashboardState>({
    status: 'idle',
  })
  const [isAcceptingInvite, setIsAcceptingInvite] = useState(false)
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [session, setSession] = useState<AuthSession | null>(() =>
    loadAuthSession(),
  )

  useEffect(() => {
    if (!backendUrl) {
      setAccountsState({
        status: 'error',
        message: 'Chưa cấu hình địa chỉ backend',
      })
      return
    }

    let cancelled = false

    fetchDemoAccounts()
      .then((accounts) => {
        if (!cancelled) {
          setAccountsState({ status: 'ready', accounts })
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setAccountsState({
            status: 'error',
            message: getErrorMessage(error, 'Không tải được tài khoản demo'),
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [backendUrl])

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
      window.history.pushState(null, '', getRoleRoute(nextSession.user.role))
    } catch (error: unknown) {
      setLoginError(getErrorMessage(error, 'Đăng nhập thất bại'))
    } finally {
      setIsLoggingIn(false)
    }
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await authenticate(credentials)
  }

  async function handleAcceptInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsAcceptingInvite(true)
    setInviteError(null)
    setLoginError(null)

    try {
      const nextSession = await acceptInvite(inviteForm)
      saveAuthSession(nextSession)
      setSession(nextSession)
      setInviteForm(EMPTY_INVITE_FORM)
      setCredentials(EMPTY_CREDENTIALS)
      window.history.pushState(null, '', getRoleRoute(nextSession.user.role))
    } catch (error: unknown) {
      setInviteError(getErrorMessage(error, 'Không kích hoạt được invite'))
    } finally {
      setIsAcceptingInvite(false)
    }
  }

  function handleSelectAccount(account: PublicDemoAccount) {
    setIsLoggingIn(true)
    setLoginError(null)

    demoLogin({ account_id: account.id })
      .then((nextSession) => {
        saveAuthSession(nextSession)
        setSession(nextSession)
        setCredentials(EMPTY_CREDENTIALS)
        setInviteError(null)
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
          credentials={credentials}
          inviteError={inviteError}
          inviteForm={inviteForm}
          isAcceptingInvite={isAcceptingInvite}
          isSubmitting={isLoggingIn}
          loginError={loginError}
          onAcceptInviteSubmit={handleAcceptInvite}
          onChangeCredentials={setCredentials}
          onChangeInviteForm={setInviteForm}
          onSelectAccount={handleSelectAccount}
          onSubmit={handleLogin}
        />
      )}
    </main>
  )
}

export default App
