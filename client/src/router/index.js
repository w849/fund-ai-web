import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue'),
    meta: { title: '首页' },
  },
  {
    path: '/rank',
    name: 'Rank',
    component: () => import('../views/Rank.vue'),
    meta: { title: '基金排行' },
  },
  {
    path: '/smart-select',
    name: 'SmartSelect',
    component: () => import('../views/SmartSelect.vue'),
    meta: { title: 'AI 智能选基' },
  },
  {
    path: '/dingtou',
    name: 'DingTouTool',
    component: () => import('../views/DingTouTool.vue'),
    meta: { title: '定投工具' },
  },
  {
    path: '/compare',
    name: 'FundCompare',
    component: () => import('../views/FundCompare.vue'),
    meta: { title: '基金对比' },
  },
  {
    path: '/portfolio',
    name: 'Portfolio',
    component: () => import('../views/Portfolio.vue'),
    meta: { title: '智能配置' },
  },
  {
    path: '/fund/:code',
    name: 'FundDetail',
    component: () => import('../views/FundDetail.vue'),
    meta: { title: '基金详情' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 动态标题
router.beforeEach((to, _from, next) => {
  document.title = `${to.meta.title} | AI 智能选基金`
  next()
})

export default router
