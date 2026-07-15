<template>
  <div class="home">
    <!-- =============== 1. 搜索区 =============== -->
    <section class="hero-section">
      <h1 class="hero-title">AI 智能选基金</h1>
      <p class="hero-subtitle">基于人工智能算法，为您智能筛选优质场外基金</p>
      <div class="search-wrap" ref="searchWrap">
        <el-input
          v-model="searchQ"
          placeholder="输入基金代码、名称或基金经理搜索..."
          size="large"
          clearable
          @input="onSearchInput"
          @focus="showDropdown = searchResults.length > 0"
          @keyup.enter="doSearch"
          @clear="clearSearch"
          class="search-input"
        >
          <template #prefix><el-icon><Search /></el-icon></template>
          <template #append>
            <el-button @click="doSearch" :loading="searchLoading"><el-icon><Search /></el-icon> 搜索</el-button>
          </template>
        </el-input>
        <!-- 搜索下拉结果 -->
        <transition name="el-zoom-in-top">
          <div v-if="showDropdown && searchResults.length > 0" class="search-dropdown">
            <div
              v-for="item in searchResults.slice(0, 8)"
              :key="item.code"
              class="dropdown-item"
              @click="goToDetail(item)"
            >
              <div class="dropdown-left">
                <span class="dropdown-name">{{ item.name }}</span>
                <span class="dropdown-code">{{ item.code }}</span>
              </div>
              <div class="dropdown-right">
                <el-tag size="small" type="info">{{ item.type }}</el-tag>
                <span :class="changeColor(item.yearReturn)" class="dropdown-ret">{{ formatPercent(item.yearReturn) }}</span>
              </div>
            </div>
            <div class="dropdown-more" @click="doSearch">查看更多结果 <el-icon><ArrowRight /></el-icon></div>
          </div>
        </transition>
      </div>
    </section>

    <!-- =============== 2. 快捷入口 =============== -->
    <section class="section">
      <el-row :gutter="16">
        <el-col :xs="12" :sm="6" v-for="card in entryCards" :key="card.to">
          <el-card class="entry-card" shadow="hover" @click="$router.push(card.to)">
            <el-icon :size="32" :color="card.color"><component :is="card.icon" /></el-icon>
            <h4>{{ card.title }}</h4>
            <p>{{ card.desc }}</p>
          </el-card>
        </el-col>
      </el-row>
    </section>

    <!-- =============== 3. 热门榜单 =============== -->
    <section class="section">
      <el-card class="section-card" shadow="never">
        <template #header>
          <div class="section-header">
            <div class="section-title">
              <el-icon :size="20" color="#e6a23c"><TrendCharts /></el-icon>
              <span>热门榜单</span>
            </div>
            <el-button text type="primary" @click="$router.push('/rank')">查看更多 <el-icon><ArrowRight /></el-icon></el-button>
          </div>
        </template>
        <div class="rank-tabs">
          <el-radio-group v-model="rankTab" size="small" @change="fetchRankData">
            <el-radio-button value="monthReturn">近1月收益 TOP10</el-radio-button>
            <el-radio-button value="yearReturn">近1年收益 TOP10</el-radio-button>
          </el-radio-group>
        </div>
        <el-skeleton :loading="rankLoading" animated :count="5">
          <template #default>
            <div class="rank-list">
              <div
                v-for="(item, idx) in rankData"
                :key="item.code"
                class="rank-item"
                @click="goToDetail(item)"
              >
                <span class="rank-num" :class="{ 'rank-top': idx < 3 }">{{ idx + 1 }}</span>
                <div class="rank-info">
                  <span class="rank-name">{{ item.name }}</span>
                  <span class="rank-meta">{{ item.code }} · {{ item.type }}</span>
                </div>
                <span :class="changeColor(item[rankTab])" class="rank-ret">{{ formatPercent(item[rankTab]) }}</span>
              </div>
            </div>
            <div v-if="rankData.length === 0" class="empty-state">
              <el-icon :size="40" color="#dcdfe6"><Folder /></el-icon>
              <p>暂无数据</p>
            </div>
          </template>
        </el-skeleton>
      </el-card>
    </section>

    <!-- =============== 4. 市场概览（WebSocket 实时） =============== -->
    <section class="section">
      <el-card class="section-card" shadow="never">
        <template #header>
          <div class="section-header">
            <div class="section-title">
              <el-icon :size="20" color="#409eff"><DataBoard /></el-icon>
              <span>市场概览</span>
              <el-tag v-if="marketStore.isLive" size="small" type="danger" effect="dark" class="live-tag">实时</el-tag>
            </div>
            <span v-if="marketStore.updateTime" class="update-time">更新于 {{ marketStore.updateTime }}</span>
          </div>
        </template>
        <el-skeleton :loading="indexLoading" animated :count="4">
          <template #default>
            <el-row :gutter="12">
              <el-col :xs="12" :sm="6" v-for="idx in marketStore.indices" :key="idx.code">
                <div class="index-card" :class="{ 'index-flash': flashedIndices[idx.code] }">
                  <div class="index-name">{{ idx.name }}</div>
                  <div class="index-point">{{ idx.point.toFixed(2) }}</div>
                  <div class="index-change" :class="changeColor(idx.change)">
                    {{ idx.change >= 0 ? '+' : '' }}{{ idx.change.toFixed(2) }}%
                  </div>
                </div>
              </el-col>
            </el-row>
            <div v-if="marketStore.indices.length === 0" class="empty-state">
              <el-icon :size="40" color="#dcdfe6"><Folder /></el-icon>
              <p>暂无指数数据</p>
            </div>
          </template>
        </el-skeleton>
      </el-card>
    </section>

    <!-- =============== 5. 推荐基金 =============== -->
    <section class="section">
      <el-card class="section-card" shadow="never">
        <template #header>
          <div class="section-header">
            <div class="section-title">
              <el-icon :size="20" color="#67c23a"><Cpu /></el-icon>
              <span>精选基金推荐</span>
            </div>
            <el-button text type="primary" @click="$router.push('/smart-select')">AI 智能选基 <el-icon><ArrowRight /></el-icon></el-button>
          </div>
        </template>
        <el-skeleton :loading="recommendLoading" animated :count="4">
          <template #default>
            <el-row :gutter="12">
              <el-col :xs="12" :sm="12" :md="6" v-for="fund in recommendList" :key="fund.code">
                <el-card class="recommend-card" shadow="hover" @click="goToDetail(fund)">
                  <div class="rec-header">
                    <span class="rec-name">{{ fund.name }}</span>
                    <el-tag :type="riskTagType(fund.riskLevel)" size="small">{{ fund.riskLevel }}</el-tag>
                  </div>
                  <div class="rec-type">{{ fund.type }}</div>
                  <div class="rec-ret">
                    <span class="rec-label">近1年收益</span>
                    <span :class="changeColor(fund.yearReturn)" class="rec-ret-val">{{ formatPercent(fund.yearReturn) }}</span>
                  </div>
                  <div class="rec-footer">
                    <el-rate :model-value="fund.rating" disabled size="small" />
                    <span class="rec-scale">{{ fund.fundScale }}</span>
                  </div>
                </el-card>
              </el-col>
            </el-row>
            <div v-if="recommendList.length === 0" class="empty-state">
              <el-icon :size="40" color="#dcdfe6"><Folder /></el-icon>
              <p>暂无推荐</p>
            </div>
          </template>
        </el-skeleton>
      </el-card>
    </section>

    <!-- 底部提示 -->
    <div class="footer-note">历史数据，不代表未来表现。基金有风险，投资需谨慎。</div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  Search, Cpu, Coin, DataAnalysis, List, TrendCharts,
  DataBoard, Folder, ArrowRight,
} from '@element-plus/icons-vue'
import { getFundList } from '../api/fund'
import { getMarketOverview } from '../api/market'
import { formatPercent, changeColor, riskTagType } from '../utils/format'
import { useMarketStore } from '../stores/market'
import { ElMessage } from 'element-plus'

const router = useRouter()
const marketStore = useMarketStore()

// ===== 搜索 =====
const searchQ = ref('')
const searchLoading = ref(false)
const searchResults = ref([])
const showDropdown = ref(false)
const searchWrap = ref(null)
let searchTimer = null

function onSearchInput() {
  if (!searchQ.value.trim()) {
    searchResults.value = []
    showDropdown.value = false
    return
  }
  clearTimeout(searchTimer)
  searchTimer = setTimeout(async () => {
    searchLoading.value = true
    try {
      searchResults.value = await getFundList({ keyword: searchQ.value.trim() })
      showDropdown.value = searchResults.value.length > 0
    } catch { /* ignore */ } finally {
      searchLoading.value = false
    }
  }, 300)
}

async function doSearch() {
  if (!searchQ.value.trim()) return
  showDropdown.value = false
  searchLoading.value = true
  try {
    searchResults.value = await getFundList({ keyword: searchQ.value.trim() })
    if (searchResults.value.length === 0) {
      ElMessage.info('未找到匹配的基金')
    }
  } catch { /* ignore */ } finally {
    searchLoading.value = false
  }
}

function clearSearch() {
  searchQ.value = ''
  searchResults.value = []
  showDropdown.value = false
}

function goToDetail(row) {
  showDropdown.value = false
  router.push(`/fund/${row.code}`)
}

function handleClickOutside(e) {
  if (searchWrap.value && !searchWrap.value.contains(e.target)) {
    showDropdown.value = false
  }
}
onMounted(() => document.addEventListener('click', handleClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', handleClickOutside))

// ===== 快捷入口 =====
const entryCards = [
  { to: '/smart-select', icon: Cpu, title: 'AI 智能选基', desc: 'AI 算法智能推荐', color: '#409eff' },
  { to: '/dingtou', icon: Coin, title: '定投计算器', desc: '定投收益模拟', color: '#67c23a' },
  { to: '/compare', icon: DataAnalysis, title: '基金对比', desc: '多维度横向对比', color: '#e6a23c' },
  { to: '/rank', icon: List, title: '基金排行', desc: '全市场基金排行', color: '#f56c6c' },
]

// ===== 热门榜单 =====
const rankTab = ref('monthReturn')
const rankData = ref([])
const rankLoading = ref(false)

async function fetchRankData() {
  rankLoading.value = true
  try {
    const data = await getFundList({ sortBy: rankTab.value, sortOrder: 'desc' })
    rankData.value = data.slice(0, 10)
  } catch { /* ignore */ } finally {
    rankLoading.value = false
  }
}

// ===== 市场概览（WebSocket 实时） =====
const indexLoading = ref(false)
const flashedIndices = ref({})
let flashTimer = null

// 数据变化时触发闪烁动画
watch(() => marketStore.indices, (newVal, oldVal) => {
  const flash = {}
  newVal.forEach((item, i) => {
    const old = oldVal?.[i]
    if (old && old.point !== item.point) {
      flash[item.code] = true
    }
  })
  if (Object.keys(flash).length > 0) {
    flashedIndices.value = flash
    clearTimeout(flashTimer)
    flashTimer = setTimeout(() => { flashedIndices.value = {} }, 600)
  }
}, { deep: true })

async function fetchMarketOverview() {
  indexLoading.value = true
  try {
    const overview = await getMarketOverview()
    // 初始加载时设置数据，后续由 WebSocket 更新
    if (marketStore.indices.length === 0) {
      marketStore.indices = overview.indices || []
    }
  } catch { /* ignore */ } finally {
    indexLoading.value = false
  }
}

// ===== 推荐基金 =====
const recommendList = ref([])
const recommendLoading = ref(false)

async function fetchRecommend() {
  recommendLoading.value = true
  try {
    const all = await getFundList({ sortBy: 'rating', sortOrder: 'desc' })
    // 精选 8 只：取评级最高且不同基金类型
    const seen = new Set()
    recommendList.value = all.filter(f => {
      const t = f.type?.split('-')[0] || f.type
      if (seen.has(t)) return false
      seen.add(t)
      return true
    }).slice(0, 8)
  } catch { /* ignore */ } finally {
    recommendLoading.value = false
  }
}

onMounted(() => {
  fetchRankData()
  fetchMarketOverview()
  fetchRecommend()
  // 订阅 WebSocket 实时指数
  marketStore.subscribeIndices()
})

onBeforeUnmount(() => {
  // 页面离开时取消订阅
  marketStore.unsubscribeIndices()
  clearTimeout(flashTimer)
})
</script>

<style scoped>
.home { display: flex; flex-direction: column; gap: 20px; }

/* ===== 搜索区 ===== */
.hero-section {
  text-align: center;
  padding: 52px 24px 44px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  color: #fff;
}
.hero-title { font-size: 32px; margin-bottom: 8px; }
.hero-subtitle { font-size: 15px; opacity: 0.9; margin-bottom: 28px; }
.search-wrap { position: relative; max-width: 560px; margin: 0 auto; }
.search-input :deep(.el-input-group__append) { background: #409eff; border-color: #409eff; }
.search-input :deep(.el-input-group__append .el-button) { color: #fff; }

.search-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
  z-index: 200;
  overflow: hidden;
  color: #303133;
  text-align: left;
}
.dropdown-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  cursor: pointer;
  border-bottom: 1px solid #f5f5f5;
  transition: background .15s;
}
.dropdown-item:hover { background: #f5f7fa; }
.dropdown-left { display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1; }
.dropdown-name { font-size: 14px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dropdown-code { font-size: 11px; color: #909399; }
.dropdown-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.dropdown-ret { font-size: 13px; font-weight: 600; white-space: nowrap; }
.dropdown-more {
  padding: 10px 14px;
  text-align: center;
  font-size: 13px;
  color: #409eff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}
.dropdown-more:hover { background: #f5f7fa; }

/* ===== 通用 ===== */
.section { margin: 0; }
.section-card { border-radius: 12px; }
.section-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; }
.section-title { display: flex; align-items: center; gap: 8px; font-size: 16px; font-weight: 600; }
.update-time { font-size: 12px; color: #909399; }
.live-tag { animation: pulse 2s infinite; }
@keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.6 } }
.empty-state { text-align: center; padding: 32px 0; color: #909399; }
.empty-state p { margin-top: 8px; font-size: 14px; }

/* ===== 快捷入口 ===== */
.entry-card {
  text-align: center; padding: 24px 12px; border-radius: 12px;
  cursor: pointer; transition: transform .2s;
}
.entry-card:hover { transform: translateY(-4px); }
.entry-card h4 { font-size: 15px; margin: 10px 0 6px; }
.entry-card p { font-size: 12px; color: #909399; }

/* ===== 热门榜单 ===== */
.rank-tabs { margin-bottom: 12px; }
.rank-list { display: flex; flex-direction: column; }
.rank-item {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 8px; cursor: pointer; border-radius: 8px; transition: background .15s;
}
.rank-item:hover { background: #f5f7fa; }
.rank-item + .rank-item { border-top: 1px solid #f2f2f2; }
.rank-num {
  width: 24px; height: 24px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 700; background: #f0f2f5; color: #909399; flex-shrink: 0;
}
.rank-num.rank-top { background: linear-gradient(135deg,#f5a623,#f56c6c); color: #fff; }
.rank-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.rank-name { font-size: 14px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rank-meta { font-size: 11px; color: #909399; }
.rank-ret { font-size: 15px; font-weight: 700; white-space: nowrap; flex-shrink: 0; }

/* ===== 市场概览 ===== */
.index-card {
  background: linear-gradient(135deg, #f5f7fa 0%, #eef1f6 100%);
  border-radius: 10px; padding: 16px; text-align: center;
  margin-bottom: 8px;
}
.index-name { font-size: 13px; color: #606266; margin-bottom: 4px; }
.index-point { font-size: 22px; font-weight: 700; margin-bottom: 4px; }
.index-change { font-size: 14px; font-weight: 600; }
.index-flash { animation: flashBg 0.6s ease; }
@keyframes flashBg { 0% { background: rgba(64,158,255,0.25) } 100% { background: transparent } }

/* ===== 推荐基金 ===== */
.recommend-card { cursor: pointer; border-radius: 10px; margin-bottom: 12px; transition: transform .2s; }
.recommend-card:hover { transform: translateY(-3px); }
.rec-header { display: flex; justify-content: space-between; align-items: center; gap: 6px; margin-bottom: 4px; }
.rec-name { font-size: 13px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
.rec-type { font-size: 11px; color: #909399; margin-bottom: 8px; }
.rec-ret { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.rec-label { font-size: 12px; color: #909399; }
.rec-ret-val { font-size: 16px; font-weight: 700; }
.rec-footer { display: flex; justify-content: space-between; align-items: center; }
.rec-scale { font-size: 11px; color: #909399; }

.footer-note { text-align: center; font-size: 12px; color: #909399; padding: 4px 0 8px; }

/* ===== 移动端 ===== */
@media (max-width: 768px) {
  .hero-section { padding: 36px 16px 32px; }
  .hero-title { font-size: 24px; }
  .entry-card { padding: 16px 8px; }
  .entry-card h4 { font-size: 13px; }
  .index-card { padding: 12px 8px; }
  .index-point { font-size: 18px; }
}
</style>
