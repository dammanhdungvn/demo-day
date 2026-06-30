export function getErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) {
    return fallback
  }

  const message = error.message.trim()
  if (!message) {
    return fallback
  }

  if (/failed to fetch|load failed|networkerror|network request failed/i.test(message)) {
    if (/không kết nối được hệ thống/i.test(fallback)) {
      return fallback
    }
    return `${fallback}. Không kết nối được hệ thống.`
  }

  if (/invalid .*credentials|invalid login credentials/i.test(message)) {
    return 'Email hoặc mật khẩu không đúng.'
  }

  return message
}
