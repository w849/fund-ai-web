import { describe, it, expect } from 'vitest'
import {
  formatAmount,
  formatPercent,
  formatNav,
  changeColor,
  riskTagType,
  formatNumber,
  formatDate,
} from '../../src/utils/format.js'

describe('formatAmount', () => {
  it('应该返回 "--" 当值为 undefined', () => {
    expect(formatAmount(undefined)).toBe('--')
  })

  it('应该返回 "--" 当值为 null', () => {
    expect(formatAmount(null)).toBe('--')
  })

  it('应该返回 "--" 当值为空字符串', () => {
    expect(formatAmount('')).toBe('--')
  })

  it('应该返回 "--" 当值为 NaN', () => {
    expect(formatAmount(NaN)).toBe('--')
  })

  it('应该返回 "--" 当值为 0', () => {
    expect(formatAmount(0)).toBe('--')
  })

  it('小于 0.01 的值应转为万为单位', () => {
    expect(formatAmount(0.005)).toBe('50.00万')
  })

  it('等于 0.01 的值应转为亿为单位', () => {
    expect(formatAmount(0.01)).toBe('1.00亿')
  })

  it('1 亿以上应显示亿为单位', () => {
    expect(formatAmount(1)).toBe('1.00亿')
  })

  it('10000 亿以上应显示万亿为单位', () => {
    expect(formatAmount(10000)).toBe('1.00万亿')
  })
})

describe('formatPercent', () => {
  it('正数应保留正号', () => {
    expect(formatPercent(5.5)).toBe('+5.50%')
  })

  it('负数应保留负号', () => {
    expect(formatPercent(-3.2)).toBe('-3.20%')
  })

  it('零应显示正号', () => {
    expect(formatPercent(0)).toBe('+0.00%')
  })

  it('不保留正负号时返回纯数字加百分号', () => {
    expect(formatPercent(5.5, false)).toBe('5.50%')
  })

  it('不保留正负号时负值不显示正负号', () => {
    expect(formatPercent(-3.2, false)).toBe('-3.20%')
  })

  it('undefined 应返回 "--"', () => {
    expect(formatPercent(undefined)).toBe('--')
  })

  it('null 应返回 "--"', () => {
    expect(formatPercent(null)).toBe('--')
  })
})

describe('formatNav', () => {
  it('正常值保留4位小数', () => {
    expect(formatNav(1.2345)).toBe('1.2345')
  })

  it('整数补充小数位', () => {
    expect(formatNav(2)).toBe('2.0000')
  })

  it('undefined 应返回 "--"', () => {
    expect(formatNav(undefined)).toBe('--')
  })

  it('null 应返回 "--"', () => {
    expect(formatNav(null)).toBe('--')
  })

  it('字符串数字也能正常格式化', () => {
    expect(formatNav('3.1415')).toBe('3.1415')
  })
})

describe('changeColor', () => {
  it('正数返回 up', () => {
    expect(changeColor(1)).toBe('up')
  })

  it('负数返回 down', () => {
    expect(changeColor(-1)).toBe('down')
  })

  it('零返回 up', () => {
    expect(changeColor(0)).toBe('up')
  })

  it('null 返回空字符串', () => {
    expect(changeColor(null)).toBe('')
  })

  it('undefined 返回空字符串', () => {
    expect(changeColor(undefined)).toBe('')
  })
})

describe('riskTagType', () => {
  it('低风险返回 success', () => {
    expect(riskTagType('低风险')).toBe('success')
  })

  it('中风险返回 warning', () => {
    expect(riskTagType('中风险')).toBe('warning')
  })

  it('高风险返回 danger', () => {
    expect(riskTagType('高风险')).toBe('danger')
  })

  it('undefined 返回 info', () => {
    expect(riskTagType(undefined)).toBe('info')
  })

  it('空字符串返回 info', () => {
    expect(riskTagType('')).toBe('info')
  })

  it('不匹配的等级返回 info', () => {
    expect(riskTagType('其他')).toBe('info')
  })
})

describe('formatNumber', () => {
  it('千分位格式化', () => {
    expect(formatNumber(1234567)).toBe('1,234,567')
  })

  it('小数保留千分位', () => {
    expect(formatNumber(1234.56)).toBe('1,234.56')
  })

  it('undefined 返回 "--"', () => {
    expect(formatNumber(undefined)).toBe('--')
  })

  it('null 返回 "--"', () => {
    expect(formatNumber(null)).toBe('--')
  })

  it('NaN 返回 "--"', () => {
    expect(formatNumber(NaN)).toBe('--')
  })
})

describe('formatDate', () => {
  it('正常日期字符串原样返回', () => {
    expect(formatDate('2024-01-15')).toBe('2024-01-15')
  })

  it('空字符串返回 "--"', () => {
    expect(formatDate('')).toBe('--')
  })

  it('null 返回 "--"', () => {
    expect(formatDate(null)).toBe('--')
  })

  it('undefined 返回 "--"', () => {
    expect(formatDate(undefined)).toBe('--')
  })
})
