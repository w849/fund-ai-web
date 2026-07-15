const { test, expect } = require('@playwright/test')

test.describe('基金列表 / 排行页', () => {
  test('基金排行页面加载', async ({ page }) => {
    await page.goto('/rank')

    // 检查页面标题
    await expect(page).toHaveTitle(/基金排行/)

    // 检查筛选/分类区域存在（类型 Tab 切换）
    const rankHeader = page.locator('.rank-header')
    await expect(rankHeader).toBeVisible()

    // 检查基金表格区域存在
    const table = page.locator('.el-table')
    await expect(table).toBeVisible()

    // 检查表格包含基金代码列
    const codeColumn = page.locator('.el-table__header-wrapper th', { hasText: '代码' })
    await expect(codeColumn).toBeVisible()
  })
})
