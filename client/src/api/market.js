import request from './request'

/** 获取主要市场指数 */
export function getMarketIndices() {
  return request.get('/market/indices')
}

/** 获取板块涨跌排行 */
export function getMarketSectors() {
  return request.get('/market/sectors')
}

/** 获取市场概览（指数 + 板块 + 更新时间） */
export function getMarketOverview() {
  return request.get('/market/overview')
}

/** 获取基金盘中估值 */
export function getFundEstimate(code) {
  return request.get(`/funds/${code}/estimate`)
}
