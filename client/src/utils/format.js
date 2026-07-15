/**
 * 格式化工具函数
 */

/**
 * 金额格式化（亿、万）
 * @param {number|string} val - 数值（单位：亿）
 * @returns {string} 格式化后的金额字符串
 */
export function formatAmount(val) {
  if (val === undefined || val === null || val === '') return '--'
  const num = parseFloat(val)
  if (isNaN(num)) return '--'
  if (num >= 10000) return (num / 10000).toFixed(2) + '万亿'
  if (num >= 1) return num.toFixed(2) + '亿'
  if (num >= 0.01) return (num * 100).toFixed(2) + '亿'
  if (num > 0) return (num * 10000).toFixed(2) + '万'
  return '--'
}

/**
 * 百分比格式化（保留2位小数，带正负号）
 * @param {number} val - 百分比数值
 * @param {boolean} keepSign - 是否保留正负号，默认 true
 * @returns {string}
 */
export function formatPercent(val, keepSign = true) {
  if (val === undefined || val === null) return '--'
  const num = parseFloat(val)
  if (isNaN(num)) return '--'
  if (keepSign) {
    return num >= 0 ? `+${num.toFixed(2)}%` : `${num.toFixed(2)}%`
  }
  return `${num.toFixed(2)}%`
}

/**
 * 净值格式化（保留4位小数）
 * @param {number} val
 * @returns {string}
 */
export function formatNav(val) {
  if (val === undefined || val === null) return '--'
  const num = parseFloat(val)
  if (isNaN(num)) return '--'
  return num.toFixed(4)
}

/**
 * 获取涨跌颜色 class
 * @param {number} val
 * @returns {'up'|'down'|''}
 */
export function changeColor(val) {
  if (val === undefined || val === null) return ''
  const num = parseFloat(val)
  if (isNaN(num)) return ''
  return num >= 0 ? 'up' : 'down'
}

/**
 * 风险等级对应的 tag 类型
 * @param {string} level
 * @returns {'success'|'warning'|'danger'|'info'}
 */
export function riskTagType(level) {
  if (!level) return 'info'
  if (level.includes('低')) return 'success'
  if (level.includes('中')) return 'warning'
  if (level.includes('高')) return 'danger'
  return 'info'
}

/**
 * 数字格式化（千分位）
 * @param {number} val
 * @returns {string}
 */
export function formatNumber(val) {
  if (val === undefined || val === null) return '--'
  const num = parseFloat(val)
  if (isNaN(num)) return '--'
  return num.toLocaleString('zh-CN')
}

/**
 * 格式化日期
 * @param {string} dateStr - YYYY-MM-DD
 * @returns {string}
 */
export function formatDate(dateStr) {
  if (!dateStr) return '--'
  return dateStr
}
