<template>
  <div class="fund-detail" v-loading="loading" element-loading-text="加载中...">
    <el-button class="back-btn" text @click="$router.back()">
      <el-icon><ArrowLeft /></el-icon> 返回
    </el-button>

    <template v-if="detail">
      <!-- ========== 顶部基本信息卡 ========== -->
      <el-card class="info-card" shadow="never">
        <div class="fund-header">
          <div class="fund-header-left">
            <div class="fund-name-row">
              <h1 class="fund-name">{{ detail.name }}</h1>
              <el-rate :model-value="detail.rating" disabled size="small" class="fund-rating" />
            </div>
            <div class="fund-tags">
              <el-tag>{{ detail.code }}</el-tag>
              <el-tag type="success">{{ detail.type }}</el-tag>
              <el-tag :type="riskTagType(detail.riskLevel)">{{ detail.riskLevel }}</el-tag>
              <el-tag type="warning">{{ detail.manager }}</el-tag>
              <el-tag type="info">成立 {{ detail.establishDate }}</el-tag>
            </div>
          </div>
          <div class="fund-header-right">
            <div class="nav-value" :class="{ 'nav-flash': navFlash }">{{ formatNav(detail.nav) }}</div>
            <div class="nav-change-row">
              <span :class="[changeColor(detail.change), { 'nav-flash': navFlash }]" class="nav-change">{{ formatPercent(detail.change) }}</span>
              <span class="nav-date">{{ detail.navDate }}</span>
            </div>
          </div>
        </div>
        <div class="quick-metrics">
          <div class="qm-item" v-for="m in quickMetrics" :key="m.label">
            <span class="qm-label">{{ m.label }}</span>
            <span :class="changeColor(m.val)" class="qm-val">{{ formatPercent(m.val) }}</span>
          </div>
        </div>
        <div class="fund-actions">
          <el-button type="primary" size="small" :icon="Operation" @click="toggleCompare" round>
            {{ compareStore.hasCode(detail.code) ? '移除对比' : '加入对比' }}
          </el-button>
          <el-button size="small" :icon="Back" @click="$router.push('/rank')" round>基金排行</el-button>
        </div>
      </el-card>

      <!-- ========== Tab 切换 ========== -->
      <el-card class="tab-card" shadow="never">
        <el-tabs v-model="activeTab" class="detail-tabs">
          <!-- 概览 Tab -->
          <el-tab-pane label="概览" name="overview">
            <div class="tab-content">
              <h3 class="section-subtitle">核心指标速览</h3>
              <el-row :gutter="16">
                <el-col :xs="12" :sm="6" v-for="m in quickMetrics" :key="m.label">
                  <div class="metric-card">
                    <div class="metric-label">{{ m.label }}</div>
                    <div :class="changeColor(m.val)" class="metric-value">{{ formatPercent(m.val) }}</div>
                  </div>
                </el-col>
              </el-row>
              <el-row :gutter="16" style="margin-top:16px">
                <el-col :xs="12" :sm="6" v-for="item in overviewMetrics" :key="item.label">
                  <div class="metric-card">
                    <div class="metric-label">{{ item.label }}</div>
                    <div class="metric-value">{{ item.val }}</div>
                  </div>
                </el-col>
              </el-row>
            </div>
          </el-tab-pane>

          <!-- 业绩 Tab -->
          <el-tab-pane label="业绩" name="performance">
            <div class="tab-content">
              <!-- 阶段涨幅表 -->
              <h3 class="section-subtitle">阶段涨幅</h3>
              <div class="history-tag-wrap"><span class="history-tag">历史数据，不代表未来表现</span></div>
              <el-table :data="detail.stageReturns" stripe size="small" class="stage-table">
                <el-table-column prop="period" label="时间段" width="100" />
                <el-table-column label="基金收益" width="120" align="right">
                  <template #default="{ row }">
                    <span :class="changeColor(row.return)">{{ formatPercent(row.return) }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="同类平均" width="120" align="right">
                  <template #default="{ row }">
                    <span :class="changeColor(row.avg)">{{ formatPercent(row.avg) }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="rank" label="同类排名" width="100" align="center" />
              </el-table>
              <div v-if="!detail.stageReturns?.length" class="empty-section"><el-empty description="暂无阶段收益数据" :image-size="80" /></div>

              <!-- 净值走势图 -->
              <h3 class="section-subtitle" style="margin-top:24px">净值走势</h3>
              <div class="chart-range">
                <el-radio-group v-model="navRange" size="small" @change="updateNavChart">
                  <el-radio-button value="1M">1月</el-radio-button>
                  <el-radio-button value="3M">3月</el-radio-button>
                  <el-radio-button value="6M">6月</el-radio-button>
                  <el-radio-button value="1Y">1年</el-radio-button>
                </el-radio-group>
              </div>
              <div ref="navChartRef" style="height:360px"></div>
              <div v-if="!detail.navHistory?.length" class="empty-section"><el-empty description="暂无净值数据" :image-size="80" /></div>

              <!-- 风险指标 -->
              <h3 class="section-subtitle" style="margin-top:24px">风险指标</h3>
              <el-row :gutter="16">
                <el-col :xs="12" :sm="6" v-for="item in riskCards" :key="item.label">
                  <div class="metric-card risk-card">
                    <div class="metric-label">{{ item.label }}</div>
                    <div class="metric-value" :class="{ 'dim': item.val === '--' }">{{ item.val }}</div>
                    <div class="metric-tip" v-if="item.tip">{{ item.tip }}</div>
                  </div>
                </el-col>
              </el-row>
            </div>
          </el-tab-pane>

          <!-- 持仓 Tab -->
          <el-tab-pane label="持仓" name="holdings">
            <div class="tab-content">
              <h3 class="section-subtitle">前十大持仓</h3>
              <el-table :data="detail.holdings" stripe size="small">
                <el-table-column type="index" label="#" width="50" align="center" />
                <el-table-column prop="name" label="股票名称" min-width="160" />
                <el-table-column prop="ratio" label="持仓占比" width="200">
                  <template #default="{ row }">
                    <div class="holding-bar">
                      <el-progress :percentage="row.ratio * 6" :stroke-width="14" color="#409eff" :show-text="false" />
                      <span class="holding-ratio">{{ row.ratio }}%</span>
                    </div>
                  </template>
                </el-table-column>
              </el-table>
              <div v-if="detail.holdings?.length" class="holding-summary">
                前十大持仓合计：<strong>{{ totalHoldingRatio }}%</strong>
              </div>
              <div v-else class="empty-section"><el-empty description="暂无持仓数据" :image-size="80" /></div>

              <!-- 行业分布饼图 -->
              <h3 class="section-subtitle" style="margin-top:24px">行业分布</h3>
              <div ref="pieChartRef" style="height:320px"></div>
              <div v-if="!hasIndustryData" class="empty-section"><el-empty description="暂无行业分布数据" :image-size="80" /></div>

              <!-- 风格箱 -->
              <h3 class="section-subtitle" style="margin-top:24px">风格箱</h3>
              <div class="style-box-wrap">
                <div class="style-box">
                  <div class="sb-row"><div class="sb-label"></div><div class="sb-header">价值</div><div class="sb-header">平衡</div><div class="sb-header">成长</div></div>
                  <div class="sb-row" v-for="cap in ['大盘','中盘','小盘']" :key="cap">
                    <div class="sb-label">{{ cap }}</div>
                    <div class="sb-cell" v-for="str in ['价值','平衡','成长']" :key="str" :class="{ active: detail.style?.marketCap === cap && detail.style?.strategy === str }"></div>
                  </div>
                </div>
                <p class="style-note">* 根据持仓股票市值和估值特征判断</p>
              </div>
            </div>
          </el-tab-pane>

          <!-- 基金经理 Tab -->
          <el-tab-pane label="基金经理" name="manager">
            <div class="tab-content">
              <div class="manager-header">
                <el-avatar :size="72" icon="UserFilled" />
                <div class="manager-info">
                  <h3>{{ detail.manager }}</h3>
                  <div class="manager-style-tags">
                    <el-tag v-for="s in detail.managerStyle" :key="s" size="small" type="warning">{{ s }}</el-tag>
                  </div>
                </div>
              </div>
              <el-row :gutter="16" style="margin-top:20px">
                <el-col :xs="12" :sm="6" v-for="item in managerMetrics" :key="item.label">
                  <div class="metric-card">
                    <div class="metric-label">{{ item.label }}</div>
                    <div class="metric-value">{{ item.val }}</div>
                  </div>
                </el-col>
              </el-row>
              <div class="manager-bio" v-if="detail.managerBio">
                <h4>经理简介</h4>
                <p>{{ detail.managerBio }}</p>
              </div>
              <div v-else class="empty-section"><el-empty description="暂无经理简介" :image-size="80" /></div>
            </div>
          </el-tab-pane>

          <!-- 费率信息 Tab -->
          <el-tab-pane label="费率信息" name="fees">
            <div class="tab-content">
              <h3 class="section-subtitle">运作费用（每年）</h3>
              <el-descriptions :column="3" border size="small" class="fee-table">
                <el-descriptions-item label="管理费率">{{ detail.managementFee || '--' }}</el-descriptions-item>
                <el-descriptions-item label="托管费率">{{ detail.custodyFee || '--' }}</el-descriptions-item>
                <el-descriptions-item label="销售服务费">{{ detail.serviceFee || '--' }}</el-descriptions-item>
              </el-descriptions>

              <h3 class="section-subtitle" style="margin-top:24px">申购费率</h3>
              <el-table :data="detail.purchaseFee || []" stripe size="small">
                <el-table-column label="申购金额(万元)" min-width="180">
                  <template #default="{ row }">{{ row.min }}{{ row.max ? ' ≤ 金额 < ' + row.max : '万以上' }}</template>
                </el-table-column>
                <el-table-column prop="rate" label="费率" width="120" align="center" />
              </el-table>
              <div v-if="!detail.purchaseFee?.length" class="empty-section"><el-empty description="暂无申购费率" :image-size="80" /></div>

              <h3 class="section-subtitle" style="margin-top:24px">赎回费率</h3>
              <el-table :data="detail.redeemFee || []" stripe size="small">
                <el-table-column label="持有时间" min-width="180">
                  <template #default="{ row }">{{ row.min }}天{{ row.max ? ' ≤ 持有 < ' + row.max + '天' : '天以上' }}</template>
                </el-table-column>
                <el-table-column prop="rate" label="费率" width="120" align="center" />
              </el-table>
              <div v-if="!detail.redeemFee?.length" class="empty-section"><el-empty description="暂无赎回费率" :image-size="80" /></div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </el-card>
    </template>

    <el-empty v-else-if="!loading" description="基金不存在或数据加载失败" />
    <div class="footer-note">历史数据，不代表未来表现。基金有风险，投资需谨慎。</div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Operation, Back, UserFilled } from '@element-plus/icons-vue'
import { init as echartsInit } from '../utils/echarts'
import { getFundDetail } from '../api/fund'
import { useCompareStore } from '../stores/compare'
import { useMarketStore } from '../stores/market'
import { formatNav, formatPercent, changeColor, riskTagType } from '../utils/format'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const compareStore = useCompareStore()
const marketStore = useMarketStore()
const loading = ref(false)
const detail = ref(null)
const activeTab = ref('overview')
const navRange = ref('1Y')
const navFlash = ref(false)
let navFlashTimer = null

const navChartRef = ref(null)
const pieChartRef = ref(null)
let navChartInstance = null
let pieChartInstance = null

// ===== 概览 =====
const quickMetrics = computed(() => {
  if (!detail.value) return []
  return [
    { label: '近1月', val: detail.value.monthReturn },
    { label: '近3月', val: detail.value.quarterReturn },
    { label: '近6月', val: detail.value.sixMonthReturn },
    { label: '近1年', val: detail.value.yearReturn },
    { label: '近3年', val: detail.value.threeYearReturn },
  ]
})

const overviewMetrics = computed(() => {
  if (!detail.value) return []
  return [
    { label: '基金规模', val: detail.value.fundScale || '--' },
    { label: '累计净值', val: detail.value.accNav ? formatNav(detail.value.accNav) : '--' },
    { label: '成立日期', val: detail.value.establishDate || '--' },
    { label: '最低申购', val: detail.value.minBuy ? detail.value.minBuy + '元' : '--' },
  ]
})

// ===== 业绩 Tab =====
const riskCards = computed(() => {
  if (!detail.value) return []
  return [
    { label: '年化波动率', val: detail.value.volatility ? detail.value.volatility + '%' : '--', tip: detail.value.volatility ? '近1年' : null },
    { label: '最大回撤', val: detail.value.maxDrawdown ? detail.value.maxDrawdown + '%' : '--', tip: detail.value.maxDrawdown ? '近1年' : null },
    { label: '夏普比率', val: detail.value.sharpeRatio ? detail.value.sharpeRatio.toFixed(2) : '--', tip: detail.value.sharpeRatio ? '近1年' : null },
    { label: '信息比率', val: detail.value.infoRatio ? detail.value.infoRatio.toFixed(2) : '--', tip: detail.value.infoRatio ? '近1年' : null },
  ]
})

// ===== 持仓 Tab =====
const totalHoldingRatio = computed(() => {
  if (!detail.value?.holdings?.length) return 0
  return detail.value.holdings.reduce((s, h) => s + h.ratio, 0).toFixed(2)
})

const hasIndustryData = computed(() => {
  return detail.value?.industryDistribution && Object.keys(detail.value.industryDistribution).length > 0
})

// ===== 基金经理 Tab =====
const managerMetrics = computed(() => {
  if (!detail.value) return []
  return [
    { label: '从业年限', val: detail.value.managerTenure ? detail.value.managerTenure + '年' : '--' },
    { label: '任职回报', val: detail.value.managerReturn ? formatPercent(detail.value.managerReturn) : '--' },
    { label: '在管规模', val: detail.value.managerAum ? detail.value.managerAum + '亿' : '--' },
  ]
})

// ===== 操作 =====
function toggleCompare() {
  if (!detail.value) return
  if (compareStore.hasCode(detail.value.code)) {
    compareStore.removeCode(detail.value.code)
    ElMessage.success('已移除对比')
  } else if (compareStore.isFull) {
    ElMessage.warning('对比列表最多添加4只基金')
  } else {
    compareStore.addCode(detail.value.code)
    ElMessage.success('已加入对比')
  }
}

// ===== ECharts 净值图 =====
function getFilteredNavHistory() {
  if (!detail.value?.navHistory?.length) return { data: [], peer: [] }
  const data = detail.value.navHistory
  const peer = detail.value.peerNavHistory || []
  const len = data.length
  let sliceEnd = len
  switch (navRange.value) {
    case '1M': sliceEnd = 22; break
    case '3M': sliceEnd = 66; break
    case '6M': sliceEnd = 132; break
  }
  return {
    data: data.slice(-sliceEnd),
    peer: peer.length ? peer.slice(-sliceEnd) : [],
  }
}

function updateNavChart() {
  if (!navChartInstance) return
  const { data, peer } = getFilteredNavHistory()
  if (data.length === 0) return
  const dates = data.map(d => d.date)
  navChartInstance.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['本基金', '同类平均'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '14%', containLabel: true },
    xAxis: { type: 'category', data: dates, axisLabel: { rotate: 30, fontSize: 10 } },
    yAxis: { type: 'value', scale: true },
    series: [
      {
        name: '本基金',
        data: data.map(d => d.nav),
        type: 'line', smooth: true,
        lineStyle: { width: 2, color: '#409eff' },
        areaStyle: { color: 'rgba(64,158,255,0.15)' },
        itemStyle: { color: '#409eff' },
      },
      {
        name: '同类平均',
        data: peer.map(d => d.nav),
        type: 'line', smooth: true,
        lineStyle: { width: 1.5, color: '#e6a23c', type: 'dashed' },
        itemStyle: { color: '#e6a23c' },
      },
    ],
  }, true)
}

let pieTimer = null
function initPieChart() {
  if (!pieChartRef.value || !hasIndustryData.value) return
  pieChartInstance?.dispose()
  pieChartInstance = echartsInit(pieChartRef.value)
  const dist = detail.value.industryDistribution
  const data = Object.entries(dist).map(([name, value]) => ({ name, value: parseFloat(value.toFixed(1)) }))
  const colors = ['#409eff','#67c23a','#e6a23c','#f56c6c','#909399','#b37feb','#5cdbd3','#ff85c0']
  pieChartInstance.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c}% ({d}%)' },
    series: [{
      type: 'pie',
      radius: ['35%', '60%'],
      center: ['50%', '50%'],
      data: data.map((d, i) => ({ ...d, itemStyle: { color: colors[i % colors.length] } })),
      label: { formatter: '{b}\n{d}%', fontSize: 11 },
      emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.2)' } },
    }],
  })
  pieChartInstance?.resize()
}

const navResizeHandler = () => navChartInstance?.resize()

function initNavChart() {
  if (!navChartRef.value) return
  window.removeEventListener('resize', navResizeHandler)
  navChartInstance?.dispose()
  navChartInstance = echartsInit(navChartRef.value)
  updateNavChart()
  window.addEventListener('resize', navResizeHandler)
}

async function fetchDetail() {
  loading.value = true
  try {
    detail.value = await getFundDetail(route.params.code)
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

// 使用 watch 监听 Tab 切换
watch(activeTab, () => {
  nextTick(() => {
    if (activeTab.value === 'performance' && navChartRef.value) {
      navChartInstance?.dispose()
      initNavChart()
    } else if (activeTab.value === 'holdings' && pieChartRef.value) {
      initPieChart()
    }
  })
})

// 监听 WebSocket 实时净值更新
watch(() => marketStore.getNavUpdate(route.params.code), (update) => {
  if (!update || !detail.value) return
  // 高亮闪烁
  navFlash.value = true
  clearTimeout(navFlashTimer)
  navFlashTimer = setTimeout(() => { navFlash.value = false }, 800)
  // 更新显示
  detail.value.nav = update.nav
  detail.value.change = update.change
  if (update.navDate) detail.value.navDate = update.navDate
})

onMounted(() => {
  fetchDetail().then(() => nextTick(() => {
    // 默认显示概览，首次不初始化图表
  }))
  // 订阅 WebSocket 实时净值
  marketStore.subscribeFundNav(route.params.code)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', navResizeHandler)
  navChartInstance?.dispose()
  pieChartInstance?.dispose()
  clearTimeout(navFlashTimer)
  // 取消订阅
  marketStore.unsubscribeFundNav(route.params.code)
})
</script>

<style scoped>
.fund-detail { display: flex; flex-direction: column; gap: 20px; }
.back-btn { align-self: flex-start; }

/* ===== 顶部信息卡 ===== */
.info-card { border-radius: 12px; }
.fund-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px; }
.fund-name-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.fund-name { font-size: 22px; font-weight: 700; margin: 0; }
.fund-rating { flex-shrink: 0; }
.fund-tags { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 10px; }
.fund-header-right { text-align: right; }
.nav-value { font-size: 36px; font-weight: 700; }
.nav-change-row { display: flex; align-items: center; gap: 10px; justify-content: flex-end; margin-top: 4px; }
.nav-change { font-size: 18px; font-weight: 600; }
.nav-date { font-size: 12px; color: #909399; }

.quick-metrics { display: flex; gap: 12px; margin-top: 20px; flex-wrap: wrap; border-top: 1px solid #ebeef5; padding-top: 16px; }
.qm-item { text-align: center; min-width: 80px; flex: 1; }
.qm-label { font-size: 12px; color: #909399; display: block; }
.qm-val { font-size: 16px; font-weight: 700; display: block; margin-top: 4px; }

.fund-actions { margin-top: 16px; display: flex; gap: 8px; }
.nav-flash { animation: navHighlight 0.8s ease; }
@keyframes navHighlight { 0% { color: #e6a23c; transform: scale(1.1); } 100% { color: inherit; transform: scale(1); } }

/* ===== Tab ===== */
.tab-card { border-radius: 12px; }
.detail-tabs :deep(.el-tabs__header) { margin-bottom: 20px; }

/* ===== 通用 ===== */
.tab-content { min-height: 200px; }
.section-subtitle { font-size: 16px; font-weight: 600; margin-bottom: 12px; }
.history-tag-wrap { text-align: right; margin-bottom: 6px; }
.history-tag { display: inline-block; font-size: 11px; color: #909399; padding: 2px 6px; border: 1px dashed #dcdfe6; border-radius: 4px; }

.metric-card {
  background: #f5f7fa; border-radius: 10px; padding: 16px; text-align: center;
  margin-bottom: 12px;
}
.metric-label { font-size: 12px; color: #909399; }
.metric-value { font-size: 20px; font-weight: 700; margin-top: 6px; }
.metric-value.dim { color: #909399; }
.metric-tip { font-size: 11px; color: #c0c4cc; margin-top: 4px; }

.risk-card { background: #fef8f0; }
.empty-section { padding: 16px 0; }

/* ===== 业绩 Tab ===== */
.chart-range { text-align: right; margin-bottom: 8px; }
.stage-table { margin-bottom: 8px; }
.up { color: #f56c6c; }
.down { color: #67c23a; }

/* ===== 持仓 Tab ===== */
.holding-bar { display: flex; align-items: center; gap: 12px; }
.holding-bar .el-progress { flex: 1; }
.holding-ratio { font-size: 13px; font-weight: 600; min-width: 50px; text-align: right; }
.holding-summary { text-align: right; font-size: 13px; color: #606266; margin-top: 8px; }

/* 风格箱 */
.style-box-wrap { max-width: 360px; }
.style-box { display: flex; flex-direction: column; border: 1px solid #dcdfe6; border-radius: 8px; overflow: hidden; }
.sb-row { display: flex; }
.sb-label, .sb-header, .sb-cell {
  flex: 1; padding: 12px 8px; text-align: center; font-size: 13px; border: 1px solid #ebeef5;
}
.sb-label { background: #f5f7fa; font-weight: 600; color: #606266; }
.sb-header { background: #409eff; color: #fff; font-weight: 600; }
.sb-cell { background: #fff; min-height: 44px; }
.sb-cell.active { background: #409eff; position: relative; }
.sb-cell.active::after {
  content: '●'; color: #fff; font-size: 16px; position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%);
}
.style-note { font-size: 11px; color: #909399; margin-top: 6px; }

/* ===== 基金经理 Tab ===== */
.manager-header { display: flex; align-items: center; gap: 20px; }
.manager-info h3 { font-size: 20px; margin: 0 0 6px; }
.manager-style-tags { display: flex; gap: 6px; flex-wrap: wrap; }
.manager-bio { margin-top: 20px; padding: 16px; background: #f5f7fa; border-radius: 10px; }
.manager-bio h4 { font-size: 14px; font-weight: 600; margin-bottom: 8px; }
.manager-bio p { font-size: 13px; color: #606266; line-height: 1.8; }

/* ===== 费率 Tab ===== */
.fee-table { margin-bottom: 8px; }

.footer-note { text-align: center; font-size: 12px; color: #909399; padding: 4px 0; }

@media (max-width: 768px) {
  .fund-header { flex-direction: column; align-items: stretch; }
  .fund-header-right { text-align: left; }
  .nav-change-row { justify-content: flex-start; }
  .nav-value { font-size: 28px; }
  .fund-name { font-size: 18px; }
  .quick-metrics { gap: 6px; }
  .qm-item { min-width: 60px; }
  .metric-card { padding: 12px 8px; }
  .metric-value { font-size: 16px; }
}
</style>
