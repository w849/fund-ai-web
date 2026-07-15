import request from './request'

export function getAssetPool() {
  return request.get('/portfolio/asset-pool')
}

export function optimizePortfolio(data) {
  return request.post('/portfolio/optimize', data)
}

export function getEfficientFrontier() {
  return request.get('/portfolio/efficient-frontier')
}

export function recommendPortfolio(data) {
  return request.post('/portfolio/recommend', data)
}
