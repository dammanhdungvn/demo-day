import { describe, expect, it } from 'vitest'

import appSource from './App.tsx?raw'
import heroAssetUrl from './assets/teachflow-login-education-hero-asset-v2.png?url'
import adminRealAccountQaSource from '../scripts/admin-real-account-qa.mjs?raw'

describe('login security UI', () => {
  it('does not expose backend URLs or demo passwords in the login/workspace UI', () => {
    expect(appSource).not.toContain('Mật khẩu demo')
    expect(appSource).not.toContain('teachflow-demo')
    expect(appSource).not.toContain('URL_BACKEND missing')
    expect(appSource).not.toContain('api-strip')
  })

  it('does not render or call demo quick-login from the production login UI', () => {
    expect(appSource).not.toContain('fetchDemoAccounts')
    expect(appSource).not.toContain('demoLogin')
    expect(appSource).not.toContain('account-button login-role-')
    expect(appSource).not.toContain('Chưa bật truy cập nhanh')
  })

  it('renders real database account shortcuts without demo auth endpoints', () => {
    expect(appSource).toContain('real-account-shortcuts')
    expect(appSource).toContain('Tài khoản thật')
    expect(appSource).toContain('Admin thật')
    expect(appSource).toContain('Teacher thật')
    expect(appSource).toContain('Student thật')
    expect(appSource).toContain('getRealAccountShortcuts')
    expect(appSource).toContain('onSelectRealAccount')
  })

  it('keeps referenced clean-checkout frontend assets and QA script present', () => {
    expect(heroAssetUrl).toContain('teachflow-login-education-hero-asset-v2')
    expect(adminRealAccountQaSource).toContain('Admin real-account QA')
  })

  it('uses user-friendly invite wording instead of developer-style activation copy', () => {
    expect(appSource).not.toContain('Kích hoạt invite')
    expect(appSource).not.toContain('kích hoạt invite')
    expect(appSource).toContain('Có mã mời?')
    expect(appSource).toContain('Tham gia bằng mã mời')
    expect(appSource).toContain('Tạo tài khoản')
  })
})
