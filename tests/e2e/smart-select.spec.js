const { test, expect } = require('@playwright/test')

test.describe('AI 智能选基', () => {
  test('AI 选基页面表单存在', async ({ page }) => {
    await page.goto('/smart-select')

    // 检查页面标题
    await expect(page).toHaveTitle(/AI 智能选基/)

    // 检查表单区域存在
    const form = page.locator('.filter-form')
    await expect(form).toBeVisible()

    // 检查风险承受能力单选组存在
    const riskGroup = page.locator('.risk-group')
    await expect(riskGroup).toBeVisible()

    // 检查投资期限单选组存在
    const termGroup = page.locator('.term-group')
    await expect(termGroup).toBeVisible()

    // 检查"开始智能分析"按钮存在
    const submitBtn = page.locator('button', { hasText: '开始智能分析' })
    await expect(submitBtn).toBeVisible()
  })
})
