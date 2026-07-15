const { test, expect } = require('@playwright/test')

test.describe('基金详情页', () => {
  test('基金详情页正常加载', async ({ page }) => {
    // 使用固定基金代码 110011（易方达中小盘混合）
    await page.goto('/fund/110011')

    // 等待页面加载完成（v-loading 消失）
    await page.waitForSelector('.el-loading-mask', { state: 'hidden', timeout: 15000 }).catch(() => {})
    // 等待详情卡片出现
    await page.waitForSelector('.info-card', { timeout: 15000 })

    // 检查基金详情卡片存在
    const infoCard = page.locator('.info-card')
    await expect(infoCard).toBeVisible()

    // 检查基金名称显示
    const fundName = page.locator('.fund-name')
    await expect(fundName).toBeVisible()

    // 检查基金代码标签存在
    const codeTag = page.locator('.el-tag', { hasText: '110011' })
    await expect(codeTag).toBeVisible()
  })
})
