import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { chromium } from 'playwright'

const repoRoot = path.resolve(import.meta.dirname, '..', '..')
const screenshotsDir = path.resolve(
  process.env.TEACHFLOW_QA_SCREENSHOT_DIR || '/tmp/teachflow-admin-real-qa',
)

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {}
  }
  const values = {}
  for (const rawLine of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#') || !line.includes('=')) {
      continue
    }
    const [rawKey, ...rest] = line.split('=')
    const key = rawKey.replace(/^export\s+/, '').trim()
    values[key] = rest.join('=').trim().replace(/^['"]|['"]$/g, '')
  }
  return values
}

const localEnv = {
  ...readEnvFile(path.join(repoRoot, '.env')),
  ...readEnvFile(path.join(repoRoot, '.env.local')),
  ...process.env,
}

function envValue(...keys) {
  for (const key of keys) {
    const value = localEnv[key]
    if (value && value.trim()) {
      return value.trim()
    }
  }
  return ''
}

const frontendUrl = envValue('TEACHFLOW_QA_FRONTEND_URL') || 'http://127.0.0.1:5173'
const adminEmail = envValue(
  'TEACHFLOW_QA_ADMIN_EMAIL',
  'TEACHFLOW_BOOTSTRAP_ADMIN_EMAIL',
)
const adminPassword = envValue(
  'TEACHFLOW_QA_ADMIN_PASSWORD',
  'TEACHFLOW_BOOTSTRAP_ADMIN_PASSWORD',
)

if (!adminEmail || !adminPassword) {
  console.error(
    'Missing TEACHFLOW_QA_ADMIN_EMAIL/TEACHFLOW_QA_ADMIN_PASSWORD ' +
      'or TEACHFLOW_BOOTSTRAP_ADMIN_EMAIL/TEACHFLOW_BOOTSTRAP_ADMIN_PASSWORD.',
  )
  process.exit(2)
}

const adminPages = [
  {
    label: 'Tổng quan',
    marker: 'admin-overview',
    selector: '.admin-design-overview',
  },
  {
    label: 'Hàng đợi duyệt',
    marker: 'admin-review',
    heading: 'Duyệt bài học',
  },
  {
    label: 'Bài giảng mẫu',
    marker: 'admin-lesson-library',
    selector: '.admin-design-lesson-library',
  },
  {
    label: 'Kho tri thức',
    marker: 'admin-knowledge',
    selector: '.admin-design-knowledge-part2',
  },
  {
    label: 'Người dùng',
    marker: 'admin-users',
    selector: '.admin-design-users',
  },
  {
    label: 'Tác vụ',
    marker: 'admin-jobs',
    selector: '.job-center-shell',
  },
  {
    label: 'Báo cáo',
    marker: 'admin-reports',
    selector: '.admin-design-reports',
  },
  {
    label: 'Nhật ký',
    marker: 'admin-activity-log',
    selector: '.admin-design-activity-log',
  },
  {
    label: 'Cài đặt',
    marker: 'admin-settings',
    selector: '.admin-design-settings',
  },
]

function slugFor(label) {
  return label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

async function assertNoHorizontalOverflow(page) {
  const overflow = await page.evaluate(() => {
    const root = document.documentElement
    return {
      clientWidth: root.clientWidth,
      scrollWidth: root.scrollWidth,
    }
  })
  if (overflow.scrollWidth > overflow.clientWidth + 2) {
    throw new Error(
      `Horizontal overflow: scrollWidth=${overflow.scrollWidth}, clientWidth=${overflow.clientWidth}`,
    )
  }
}

async function clickAdminPage(page, label) {
  const taskbarButton = page
    .locator('.workspace-taskbar button:visible')
    .filter({ hasText: label })
    .first()
  if ((await taskbarButton.count()) > 0) {
    await taskbarButton.click()
    return
  }
  await page
    .getByRole('button', { name: new RegExp(`^${escapeRegex(label)}$`) })
    .first()
    .click()
}

async function waitForAdminPage(page, pageSpec) {
  if (pageSpec.selector) {
    await page.locator(pageSpec.selector).first().waitFor({ timeout: 15000 })
    return
  }
  await page
    .getByRole('heading', { name: pageSpec.heading || pageSpec.label })
    .first()
    .waitFor({
      timeout: 15000,
    })
}

async function main() {
  fs.mkdirSync(screenshotsDir, { recursive: true })
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  const page = await context.newPage()
  const issues = []

  page.on('console', (message) => {
    if (['error', 'warning'].includes(message.type())) {
      issues.push(`console:${message.type()}:${message.text()}`)
    }
  })
  page.on('pageerror', (error) => {
    issues.push(`pageerror:${error.message}`)
  })
  page.on('response', (response) => {
    const url = response.url()
    if (url.includes('/api/') && response.status() >= 400) {
      issues.push(`api:${response.status()}:${url}`)
    }
  })

  try {
    await page.goto(frontendUrl, { waitUntil: 'networkidle' })
    await page.locator('input[name="email"]').fill(adminEmail)
    await page.locator('input[name="password"]').fill(adminPassword)
    await page.getByRole('button', { name: /^Đăng nhập$/ }).click()
    await page.waitForURL(/\/admin/, { timeout: 30000 })
    await page.getByText('Tổng quan').first().waitFor({ timeout: 30000 })

    for (const pageSpec of adminPages) {
      const { label, marker } = pageSpec
      await clickAdminPage(page, label)
      await waitForAdminPage(page, pageSpec)
      await assertNoHorizontalOverflow(page)
      const bodyText = await page.locator('body').innerText()
      if (bodyText.includes('OPENAI_API_KEY') || bodyText.includes('SECRET_API_KEY_SUPABASE')) {
        throw new Error(`Secret key name is visible on Admin page ${label}`)
      }
      await page.screenshot({
        fullPage: true,
        path: path.join(screenshotsDir, `${marker}-${slugFor(label)}.png`),
      })
    }

    if (issues.length > 0) {
      throw new Error(`Rendered QA issues:\n${issues.join('\n')}`)
    }

    console.log(`Admin real-account QA passed. Screenshots: ${screenshotsDir}`)
  } finally {
    await context.close()
    await browser.close()
  }
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
