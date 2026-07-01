import { describe, expect, it } from 'vitest'

import { getErrorMessage } from './errors'

describe('getErrorMessage', () => {
  it('maps browser network failures to a user-facing connection message', () => {
    expect(getErrorMessage(new TypeError('Failed to fetch'), 'Không đăng nhập được')).toBe(
      'Không đăng nhập được. Không kết nối được hệ thống.',
    )
  })

  it('does not duplicate connection wording when the fallback already says it', () => {
    expect(
      getErrorMessage(
        new TypeError('Failed to fetch'),
        'Không kết nối được hệ thống',
      ),
    ).toBe('Không kết nối được hệ thống')
  })

  it('maps invalid credential messages to Vietnamese login feedback', () => {
    expect(
      getErrorMessage(
        new Error('Login failed: Invalid demo account credentials'),
        'Đăng nhập thất bại',
      ),
    ).toBe('Email hoặc mật khẩu không đúng.')
  })
})
