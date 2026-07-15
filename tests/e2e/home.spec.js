const { test, expect } = require('@playwright/test')

test.describe('首页', () => {
  test('页面标题和导航栏', async ({ page }) => {
    await page.goto('/')

    // 检查页面标题包含 "AI 智能选基金"
    await expect(page).toHaveTitle(/AI 智能选基金/)

    // 检查页面中存在标题文字 "AI 智能选基金"（hero-section 中的 h1）
    const heroTitle = page.locator('.hero-title')
    await expect(heroTitle).toBeVisible()
    await expect(heroTitle).toHaveText('AI 智能选基金')

    // 检查导航栏（快捷入口卡片）存在
    const entryCards = page.locator('.entry-card')
    await expect(entryCards.first()).toBeVisible()
    await expect(entryCards).toHaveCount(4)
  })
})
