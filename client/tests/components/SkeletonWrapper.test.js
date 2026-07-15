import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SkeletonWrapper from '../../src/components/SkeletonWrapper.vue'

describe('SkeletonWrapper', () => {
  it('组件名称应为 SkeletonWrapper', () => {
    const wrapper = mount(SkeletonWrapper)
    expect(wrapper.findComponent({ name: 'SkeletonWrapper' }).exists()).toBe(true)
  })

  it('应渲染默认 slot 内容', () => {
    const wrapper = mount(SkeletonWrapper, {
      slots: {
        default: '<div class="test-content">内容</div>',
      },
    })
    expect(wrapper.find('.test-content').exists()).toBe(true)
    expect(wrapper.text()).toContain('内容')
  })

  it('wrapper class 应存在', () => {
    const wrapper = mount(SkeletonWrapper)
    expect(wrapper.classes()).toContain('skeleton-wrapper')
  })
})
