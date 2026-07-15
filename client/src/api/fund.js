import request from './request'

/** 获取基金列表（搜索/筛选/排序） */
export function getFundList(params) {
  return request.get('/funds', { params })
}

/** 获取基金详情 */
export function getFundDetail(code) {
  return request.get(`/funds/${code}`)
}

/** 获取历史净值 */
export function getNavHistory(code) {
  return request.get(`/funds/nav-history/${code}`)
}

/** 基金初筛 */
export function fundScreening(params) {
  return request.get('/funds/screening', { params })
}

/** AI 智能选基（旧版-本地评分） */
export function smartSelect(params) {
  return request.get('/funds/smart-select', { params })
}

/** 获取热门基金榜单 */
export function getHotList() {
  return request.get('/funds/hot-list')
}

/** AI 智能推荐（DeepSeek 驱动） */
export function aiRecommend(data) {
  return request.post('/ai/recommend', data, { timeout: 60000 })
}

/** AI 服务状态 */
export function aiStatus() {
  return request.get('/ai/status')
}

/** 定投回测 */
export function fundBacktest(code, params) {
  return request.get(`/funds/backtest/${code}`, { params })
}

/** 多策略定投对比 */
export function fundStrategyCompare(data) {
  return request.post('/funds/strategy-compare', data)
}
