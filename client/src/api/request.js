import axios from 'axios'
import { ElMessage } from 'element-plus'

const request = axios.create({
  baseURL: '/api',
  timeout: 15000,
})

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    const res = response.data
    if (res.code !== 200) {
      ElMessage.error(res.msg || '请求失败')
      return Promise.reject(new Error(res.msg))
    }
    return res.data
  },
  (error) => {
    let msg = '网络错误'
    if (error.response) {
      const status = error.response.status
      if (status === 404) msg = '请求的资源不存在'
      else if (status === 500) msg = '服务器内部错误'
      else if (status === 503) msg = '服务暂不可用'
      else msg = error.response.data?.msg || `请求失败 (${status})`
    } else if (error.code === 'ECONNABORTED') {
      msg = '请求超时，请稍后重试'
    }
    ElMessage.error(msg)
    return Promise.reject(error)
  }
)

export default request
