/**
 * WebSocket 客户端封装（socket.io-client）
 * 全局单例，支持自动重连、订阅管理
 */
import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000'
const RECONNECT_DELAY = 3000 // 重连间隔
const RECONNECT_ATTEMPTS = 20

let socket = null
let listeners = {}
let subscriptionQueue = [] // 重连后自动恢复的订阅队列
let isConnected = false

/**
 * 获取或创建 Socket 实例
 */
function getSocket() {
  if (socket) return socket

  socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: RECONNECT_DELAY,
    reconnectionAttempts: RECONNECT_ATTEMPTS,
    reconnectionDelayMax: 10000,
    timeout: 10000,
    autoConnect: true,
  })

  socket.on('connect', () => {
    console.log('[WS] 已连接')
    isConnected = true
    // 自动恢复之前的订阅
    if (subscriptionQueue.length > 0) {
      subscriptionQueue.forEach(topic => {
        socket.emit('subscribe', topic)
        console.log(`[WS] 恢复订阅: ${topic}`)
      })
    }
  })

  socket.on('disconnect', (reason) => {
    console.log(`[WS] 断开: ${reason}`)
    isConnected = false
  })

  socket.on('connect_error', (err) => {
    console.warn(`[WS] 连接失败: ${err.message}`)
    isConnected = false
  })

  socket.on('reconnect', (attempt) => {
    console.log(`[WS] 重连成功 (第${attempt}次)`)
    isConnected = true
  })

  socket.on('reconnect_attempt', () => {
    console.log('[WS] 尝试重连...')
  })

  socket.on('error', (err) => {
    console.warn(`[WS] 错误: ${err.message}`)
  })

  return socket
}

/**
 * 订阅主题
 * @param {string} topic - 主题名（如 market:indices, fund:nav:110003）
 * @param {Function} callback - 数据回调
 */
function subscribe(topic, callback) {
  const s = getSocket()

  // 移除旧监听避免重复
  if (listeners[topic]) {
    s.off(topic, listeners[topic])
  }

  listeners[topic] = callback
  s.on(topic, callback)

  // 发送订阅（即使未连接，队列也会在重连后恢复）
  if (s.connected) {
    s.emit('subscribe', topic)
  }
  if (!subscriptionQueue.includes(topic)) {
    subscriptionQueue.push(topic)
  }
}

/**
 * 取消订阅
 */
function unsubscribe(topic) {
  if (socket) {
    socket.off(topic, listeners[topic])
    if (socket.connected) {
      socket.emit('unsubscribe', topic)
    }
  }
  delete listeners[topic]
  subscriptionQueue = subscriptionQueue.filter(t => t !== topic)
}

/**
 * 批量取消订阅（页面卸载时调用）
 */
function unsubscribeAll(topics) {
  if (topics) {
    topics.forEach(t => unsubscribe(t))
  } else {
    Object.keys(listeners).forEach(t => unsubscribe(t))
  }
}

/**
 * 检查连接状态
 */
function getConnectionStatus() {
  return {
    connected: socket ? socket.connected : false,
    id: socket ? socket.id : null,
    queuedSubscriptions: [...subscriptionQueue],
  }
}

/**
 * 断开连接
 */
function disconnect() {
  if (socket) {
    subscriptionQueue = []
    listeners = {}
    socket.disconnect()
    socket = null
    isConnected = false
    console.log('[WS] 已手动断开')
  }
}

export {
  getSocket,
  subscribe,
  unsubscribe,
  unsubscribeAll,
  getConnectionStatus,
  disconnect,
  isConnected,
}
