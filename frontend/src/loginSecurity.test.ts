import { describe, expect, it } from 'vitest'

import appSource from './App.tsx?raw'

describe('login security UI', () => {
  it('does not expose backend URLs or demo passwords in the login/workspace UI', () => {
    expect(appSource).not.toContain('Mật khẩu demo')
    expect(appSource).not.toContain('teachflow-demo')
    expect(appSource).not.toContain('URL_BACKEND missing')
    expect(appSource).not.toContain('api-strip')
  })

  it('uses user-friendly invite wording instead of developer-style activation copy', () => {
    expect(appSource).not.toContain('Kích hoạt invite')
    expect(appSource).not.toContain('kích hoạt invite')
    expect(appSource).toContain('Có mã mời?')
    expect(appSource).toContain('Tham gia bằng mã mời')
    expect(appSource).toContain('Tạo tài khoản')
  })
})
