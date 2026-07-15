import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCompareStore } from '../../src/stores/compare.js'

describe('useCompareStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('addCode 应该添加基金代码', () => {
    const store = useCompareStore()
    store.addCode('000001')
    expect(store.codes).toEqual(['000001'])
  })

  it('addCode 最多只能添加4只基金', () => {
    const store = useCompareStore()
    store.addCode('000001')
    store.addCode('000002')
    store.addCode('000003')
    store.addCode('000004')
    store.addCode('000005')
    expect(store.codes).toHaveLength(4)
    expect(store.codes).toEqual(['000001', '000002', '000003', '000004'])
  })

  it('addCode 应该去重', () => {
    const store = useCompareStore()
    store.addCode('000001')
    store.addCode('000001')
    expect(store.codes).toHaveLength(1)
    expect(store.codes).toEqual(['000001'])
  })

  it('removeCode 应该删除基金代码', () => {
    const store = useCompareStore()
    store.addCode('000001')
    store.addCode('000002')
    store.removeCode('000001')
    expect(store.codes).toEqual(['000002'])
  })

  it('removeCode 删除不存在的代码不应报错', () => {
    const store = useCompareStore()
    store.addCode('000001')
    store.removeCode('999999')
    expect(store.codes).toEqual(['000001'])
  })

  it('clear 应该清空所有基金', () => {
    const store = useCompareStore()
    store.addCode('000001')
    store.addCode('000002')
    store.clear()
    expect(store.codes).toHaveLength(0)
    expect(store.codes).toEqual([])
  })

  it('isFull 在少于4只时返回 false', () => {
    const store = useCompareStore()
    store.addCode('000001')
    expect(store.isFull).toBe(false)
  })

  it('isFull 满4只时返回 true', () => {
    const store = useCompareStore()
    store.addCode('000001')
    store.addCode('000002')
    store.addCode('000003')
    store.addCode('000004')
    expect(store.isFull).toBe(true)
  })

  it('hasCode 判断是否已包含代码', () => {
    const store = useCompareStore()
    store.addCode('000001')
    expect(store.hasCode('000001')).toBe(true)
    expect(store.hasCode('000002')).toBe(false)
  })

  it('count 应正确返回数量', () => {
    const store = useCompareStore()
    expect(store.count).toBe(0)
    store.addCode('000001')
    expect(store.count).toBe(1)
    store.addCode('000002')
    expect(store.count).toBe(2)
  })
})
