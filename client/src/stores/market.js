/**
 * 市场行情 Pinia Store
 * 管理指数行情、板块数据，提供 WebSocket 订阅/取消订阅方法
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { subscribe, unsubscribe, getConnectionStatus } from '../utils/websocket'

export const useMarketStore = defineStore('market', () => {
  // ===== State =====
  const indices = ref([])            // 指数行情
  const hotSectors = ref([])         // 板块排行
  const lastUpdate = ref(null)       // 最后更新时间
  const connected = ref(false)       // WebSocket 连接状态
  const fundNavUpdates = ref({})     // { code: { nav, change, timestamp } }

  // ===== Getters =====
  const updateTime = computed(() => {
    if (!lastUpdate.value) return ''
    const d = new Date(lastUpdate.value)
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`
  })

  const isLive = computed(() => {
    if (!lastUpdate.value) return false
    return Date.now() - lastUpdate.value < 60000
  })

  // ===== Actions =====

  /** 订阅指数行情 */
  function subscribeIndices() {
    subscribe('market:indices', (payload) => {
      if (payload && payload.data) {
        indices.value = payload.data
      }
      lastUpdate.value = payload.timestamp || Date.now()
      connected.value = true
    })
  }

  /** 取消订阅指数行情 */
  function unsubscribeIndices() {
    unsubscribe('market:indices')
  }

  /** 订阅板块排行 */
  function subscribeSectors() {
    subscribe('market:sectors', (payload) => {
      if (payload && payload.data) {
        hotSectors.value = payload.data
      }
      lastUpdate.value = payload.timestamp || Date.now()
    })
  }

  /** 取消订阅板块排行 */
  function unsubscribeSectors() {
    unsubscribe('market:sectors')
  }

  /** 订阅单只基金净值 */
  function subscribeFundNav(code) {
    const topic = `fund:nav:${code}`
    subscribe(topic, (payload) => {
      if (payload && payload.data) {
        fundNavUpdates.value = {
          ...fundNavUpdates.value,
          [code]: {
            ...payload.data,
            timestamp: payload.timestamp || Date.now(),
          },
        }
      }
    })
  }

  /** 取消订阅基金净值 */
  function unsubscribeFundNav(code) {
    unsubscribe(`fund:nav:${code}`)
  }

  /** 批量订阅热门基金净值（排行页） */
  function subscribeFundNavList(codes) {
    codes.forEach(code => subscribeFundNav(code))
  }

  /** 批量取消订阅 */
  function unsubscribeAllFundNav() {
    Object.keys(fundNavUpdates.value).forEach(code => {
      unsubscribeFundNav(code)
    })
    fundNavUpdates.value = {}
  }

  /** 获取指定基金的实时净值更新 */
  function getNavUpdate(code) {
    return fundNavUpdates.value[code] || null
  }

  /** 重置状态 */
  function reset() {
    unsubscribeAllFundNav()
    unsubscribeIndices()
    unsubscribeSectors()
    indices.value = []
    hotSectors.value = []
    lastUpdate.value = null
    connected.value = false
    fundNavUpdates.value = {}
  }

  return {
    // state
    indices, hotSectors, lastUpdate, connected, fundNavUpdates,
    // getters
    updateTime, isLive,
    // actions
    subscribeIndices, unsubscribeIndices,
    subscribeSectors, unsubscribeSectors,
    subscribeFundNav, unsubscribeFundNav,
    subscribeFundNavList, unsubscribeAllFundNav,
    getNavUpdate, reset,
  }
})
