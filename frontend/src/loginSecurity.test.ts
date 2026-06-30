import { describe, expect, it } from 'vitest'

import appSource from './App.tsx?raw'

describe('login security UI', () => {
  it('does not expose backend URLs or demo passwords in the login/workspace UI', () => {
    expect(appSource).not.toContain('Mật khẩu demo')
    expect(appSource).not.toContain('teachflow-demo')
    expect(appSource).not.toContain('URL_BACKEND missing')
    expect(appSource).not.toContain('api-strip')
  })
})
