<template>
  <div class="dingtou-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title"><el-icon color="#e6a23c"><DataAnalysis /></el-icon> 定投策略对比</h1>
      <p class="page-desc">多维度对比不同定投策略的历史表现，找到最适合您的投资方式</p>
    </div>

    <el-row :gutter="20">
      <!-- 左侧：参数设置 -->
      <el-col :xs="24" :md="7">
        <el-card class="param-card" shadow="never">
          <template #header>
            <span class="card-title"><el-icon><Setting /></el-icon> 参数设置</span>
          </template>

          <el-form label-position="top" :model="form" class="dingtou-form" ref="formRef">
            <!-- 基金选择 -->
            <el-form-item label="选择基金" prop="code"
              :rules="[{ required: true, message: '请搜索并选择基金', trigger: 'change' }]">
              <el-autocomplete
                v-model="form.code"
                :fetch-suggestions="searchFunds"
                placeholder="输入基金名称或代码"
                :trigger-on-focus="false"
                clearable
                @select="onFundSelect"
                value-key="name"
                class="fund-search"
              >
                <template #default="{ item }">
                  <div class="search-result-item">
                    <span class="sr-name">{{ item.name }}</span>
                    <span class="sr-code">{{ item.code }}</span>
                    <el-tag size="small" type="info">{{ item.type }}</el-tag>
                  </div>
                </template>
              </el-autocomplete>
              <div v-if="selectedFund" class="selected-fund-info">
                <el-tag type="primary">{{ selectedFund.code }}</el-tag>
                <span class="sf-name">{{ selectedFund.name }}</span>
                <span class="sf-type">{{ selectedFund.type }}</span>
              </div>
            </el-form-item>

            <!-- 每期金额 -->
            <el-form-item label="基础定投金额（元）" prop="amount"
              :rules="[{ required: true, message: '请输入定投金额', trigger: 'blur' }]">
              <el-input-number v-model="form.amount" :min="100" :max="100000" :step="100" style="width:100%" />
            </el-form-item>

            <!-- 定投周期 -->
            <el-form-item label="定投周期" prop="period">
              <el-radio-group v-model="form.period">
                <el-radio value="weekly">每周</el-radio>
                <el-radio value="biweekly">每两周</el-radio>
                <el-radio value="monthly">每月</el-radio>
              </el-radio-group>
            </el-form-item>

            <!-- 起始日期 -->
            <el-form-item label="开始日期" prop="startDate"
              :rules="[{ required: true, message: '请选择开始日期', trigger: 'change' }]">
              <el-date-picker v-model="form.startDate" type="date" placeholder="选择开始日期"
                :disabled-date="d => d >= new Date()" value-format="YYYY-MM-DD" style="width:100%" />
            </el-form-item>

            <!-- 结束日期 -->
            <el-form-item label="结束日期" prop="endDate"
              :rules="[{ required: true, message: '请选择结束日期', trigger: 'change' }]">
              <el-date-picker v-model="form.endDate" type="date" placeholder="选择结束日期"
                :disabled-date="d => d >= new Date()" value-format="YYYY-MM-DD" style="width:100%" />
            </el-form-item>

            <!-- 策略选择 -->
            <el-divider content-position="left">对比策略</el-divider>
            <div class="strategy-checkboxes">
              <div v-for="s in strategyOptions" :key="s.key" class="strategy-check-item">
                <el-checkbox v-model="s.checked" :value="s.key">
                  <span class="sc-label">{{ s.label }}</span>
                </el-checkbox>
                <el-tooltip :content="s.desc" placement="right" :show-after="300">
                  <el-icon class="help-icon"><QuestionFilled /></el-icon>
                </el-tooltip>
              </div>
              <div v-if="selectedStrategies.length < 2 && selectedStrategies.length > 0" class="strategy-hint">
                请至少选择 2 种策略
              </div>
            </div>

            <el-button type="danger" size="large" class="full-width" :loading="loading" @click="doCompare">
              <el-icon><DataAnalysis /></el-icon> 开始对比
            </el-button>

            <el-button class="full-width" style="margin-top:8px" @click="clearForm">
              <el-icon><Delete /></el-icon> 清空
            </el-button>

            <div class="compliance-note">历史数据回测，不代表未来收益表现</div>
          </el-form>
        </el-card>
      </el-col>

      <!-- 右侧：结果展示区 -->
      <el-col :xs="24" :md="17">
        <!-- 加载 -->
        <el-card v-if="loading" class="result-card" shadow="never">
          <div class="loading-box">
            <el-icon class="loading-icon" :size="48" color="#e6a23c"><DataAnalysis /></el-icon>
            <h3>正在计算多策略对比...</h3>
            <el-progress :percentage="loadingProgress" :stroke-width="8" color="#e6a23c" />
            <p class="loading-text">{{ loadingText }}</p>
          </div>
        </el-card>

        <!-- 结果 -->
        <template v-if="!loading && compareResult">
          <!-- ========== 1. 对比结论卡片 ========== -->
          <el-card shadow="never" class="conclusion-card">
            <template #header>
              <span class="card-title"><el-icon><Trophy /></el-icon> 对比结论</span>
            </template>
            <div class="conclusion-body">
              <div class="winner-badge">
                <span class="winner-icon">🏆</span>
                <span class="winner-name" :style="{ color: winnerMeta?.color }">{{ winnerMeta?.label }}</span>
              </div>
              <div class="winner-detail">
                <div class="wd-stat">
                  <span class="wd-stat-label">累计收益率</span>
                  <span class="wd-stat-value text-up">{{ comparison.bestReturn }}%</span>
                </div>
                <div class="wd-stat">
                  <span class="wd-stat-label">最大回撤</span>
                  <span class="wd-stat-value" style="color:#409eff">{{ comparison.bestDrawdown }}%</span>
                </div>
              </div>
              <div class="conclusion-summary">
                <!-- 对比 fixed 的收益差 -->
                回测期间 <b :style="{ color: winnerMeta?.color }">{{ winnerMeta?.label }}</b> 收益最高，
                比<span class="text-up">普通定额定投</span>多赚
                <b class="text-up">{{ extraReturnText }}</b>
              </div>
            </div>
          </el-card>

          <!-- ========== 2. 核心指标对比表 ========== -->
          <el-card shadow="never" class="compare-table-card" style="margin-top:16px">
            <template #header>
              <span class="card-title"><el-icon><List /></el-icon> 核心指标对比</span>
            </template>
            <el-table :data="metricsTableData" size="small" stripe border>
              <el-table-column prop="label" label="指标" width="120" fixed>
                <template #default="{ row }">
                  <span style="font-weight:600">{{ row.label }}</span>
                </template>
              </el-table-column>
              <el-table-column v-for="col in metricsColumns" :key="col.key" :label="col.label" align="right" width="140">
                <template #default="{ row }">
                  <span v-if="row.key === 'totalReturn' || row.key === 'annualizedReturn'"
                    :class="col.isWinnerRet ? 'cell-best-ret' : ''">
                    <span :class="col.isWinnerRet ? 'cell-best-ret' : ''">
                      {{ row[col.key] }}
                      <el-tag v-if="col.isWinnerRet" size="small" type="danger" effect="dark" style="margin-left:4px">最佳</el-tag>
                    </span>
                  </span>
                  <span v-else-if="row.key === 'maxDrawdown'"
                    :class="col.isWinnerDrawdown ? 'cell-best-dd' : ''">
                    {{ row[col.key] }}
                    <el-tag v-if="col.isWinnerDrawdown" size="small" type="primary" effect="dark" style="margin-left:4px">最佳</el-tag>
                  </span>
                  <span v-else>{{ row[col.key] }}</span>
                </template>
              </el-table-column>
            </el-table>
          </el-card>

          <!-- ========== 3. 收益对比图 ========== -->
          <el-card shadow="never" class="chart-card" style="margin-top:16px">
            <template #header>
              <span class="card-title"><el-icon><DataLine /></el-icon> 累计市值走势对比</span>
            </template>
            <div ref="compareChartRef" class="compare-chart"></div>
          </el-card>

          <!-- ========== 4. 策略详情 Tabs ========== -->
          <el-card shadow="never" class="detail-tabs-card" style="margin-top:16px">
            <template #header>
              <span class="card-title"><el-icon><InfoFilled /></el-icon> 策略详情</span>
            </template>
            <el-tabs v-model="activeTab" type="card">
              <el-tab-pane v-for="s in detailStrategies" :key="s.key" :label="s.label" :name="s.key">
                <div class="strategy-detail">
                  <!-- 原理 -->
                  <div class="detail-section">
                    <h4 class="ds-title"><el-icon><Reading /></el-icon> 策略原理</h4>
                    <p class="ds-content">{{ s.info.principle }}</p>
                  </div>

                  <!-- 优缺点 -->
                  <el-row :gutter="16">
                    <el-col :span="12">
                      <div class="detail-section">
                        <h4 class="ds-title ds-pros"><el-icon><CircleCheck /></el-icon> 优点</h4>
                        <ul class="ds-list">
                          <li v-for="(item, i) in s.info.pros" :key="i">{{ item }}</li>
                        </ul>
                      </div>
                    </el-col>
                    <el-col :span="12">
                      <div class="detail-section">
                        <h4 class="ds-title ds-cons"><el-icon><CircleClose /></el-icon> 缺点</h4>
                        <ul class="ds-list">
                          <li v-for="(item, i) in s.info.cons" :key="i">{{ item }}</li>
                        </ul>
                      </div>
                    </el-col>
                  </el-row>

                  <!-- 适用人群 -->
                  <div class="detail-section">
                    <h4 class="ds-title"><el-icon><User /></el-icon> 适用人群</h4>
                    <p class="ds-content">{{ s.info.target }}</p>
                  </div>

                  <!-- 定投明细表（可折叠） -->
                  <el-collapse class="detail-collapse">
                    <el-collapse-item title="查看定投明细" name="detail">
                      <el-table :data="s.chartData" size="small" stripe max-height="360">
                        <el-table-column prop="date" label="日期" width="100" />
                        <el-table-column prop="nav" label="净值" width="70" align="right" />
                        <el-table-column prop="invest" label="投入" width="80" align="right">
                          <template #default="{ row }">{{ row.invest.toFixed(0) }}元</template>
                        </el-table-column>
                        <el-table-column prop="shares" label="份额" width="80" align="right" />
                        <el-table-column prop="totalShares" label="累计份额" width="100" align="right" />
                        <el-table-column prop="totalValue" label="总资产" width="100" align="right">
                          <template #default="{ row }">{{ row.totalValue.toFixed(2) }}元</template>
                        </el-table-column>
                        <el-table-column prop="totalInvest" label="累计投入" width="100" align="right">
                          <template #default="{ row }">{{ row.totalInvest.toFixed(0) }}元</template>
                        </el-table-column>
                        <el-table-column v-if="s.key === 'ma'" prop="deviation" label="偏离度" width="80" align="right">
                          <template #default="{ row }">{{ row.deviation?.toFixed(1) }}%</template>
                        </el-table-column>
                        <el-table-column v-if="s.key === 'smart'" prop="percentile" label="百分位" width="80" align="right">
                          <template #default="{ row }">{{ row.percentile?.toFixed(1) }}%</template>
                        </el-table-column>
                        <el-table-column v-if="s.key === 'ma' || s.key === 'smart'" prop="multiple" label="倍数" width="60" align="center" />
                      </el-table>
                    </el-collapse-item>
                  </el-collapse>
                </div>
              </el-tab-pane>
            </el-tabs>
          </el-card>
        </template>

        <!-- 空状态 -->
        <el-card v-if="!loading && !compareResult" class="result-card" shadow="never">
          <div class="placeholder-box">
            <el-icon :size="64" color="#c0c4cc"><DataAnalysis /></el-icon>
            <h3>定投策略对比</h3>
            <p>选择基金和对比策略，点击「开始对比」查看多维度分析结果</p>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, computed, nextTick, onBeforeUnmount, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  TrendCharts, Setting, DataLine, Delete, List, DataAnalysis,
  QuestionFilled, Trophy, InfoFilled, Reading, CircleCheck,
  CircleClose, User,
} from '@element-plus/icons-vue'
import { getFundList, fundStrategyCompare } from '../api/fund'
import { init as echartsInit } from '../utils/echarts'

// ─── 策略元信息 ───
const STRATEGY_META = {
  fixed: {
    label: '普通定额',
    color: '#e6a23c',
    desc: '每期投入固定金额，简单易操作',
    info: {
      principle: '每期在固定日期投入相同金额，不受市场波动影响。通过长期持续买入，在市场下跌时积累更多份额，上涨时获得收益，最终实现平均成本的效果。',
      pros: ['操作简单，无需判断市场走势', '纪律性强，避免追涨杀跌', '长期坚持效果显著，适合任何市场环境'],
      cons: ['无法在市场低位时主动加仓', '高位时也无法减少投入', '资金利用效率相对较低'],
      target: '适合投资新手、工薪阶层，以及没有时间关注市场的长期投资者。',
    },
  },
  value: {
    label: '价值平均',
    color: '#67c23a',
    desc: '每期确保市值增长固定金额，跌了多买、涨了少买',
    info: {
      principle: '设定每月目标市值（每月增加固定金额）。当基金市值低于目标时补足差额（多投），高于目标时减少投入甚至赎回（少投/不投），自动实现"低买高卖"。',
      pros: ['自动实现低买高卖', '资金利用效率高', '收益通常优于普通定额'],
      cons: ['市场大跌时需投入较多资金', '操作相对复杂', '长期上涨时可能投入过少'],
      target: '适合有一定投资经验、现金流较为充裕、希望提高资金效率的投资者。',
    },
  },
  ma: {
    label: '均线定投',
    color: '#409eff',
    desc: '根据价格与MA200的偏离度调整投入金额',
    info: {
      principle: '参考指数（如沪深300）的250日均线（MA200），计算当前净值与均线的偏离度。偏离度为负（低于均线）时多投，为正（高于均线）时少投，极端偏离时加倍或暂停。',
      pros: ['参考市场趋势调整仓位', '极端行情有明确的加减仓规则', '规则清晰，可量化执行'],
      cons: ['需要参考指数数据', '均线参数选择影响结果', '震荡市中可能频繁调整'],
      target: '适合关注市场趋势、有一定技术分析基础、愿意根据市场信号调整的投资者。',
    },
  },
  smart: {
    label: '估值定投',
    color: '#f56c6c',
    desc: '根据指数PE/PB历史百分位调整投入金额',
    info: {
      principle: '基于标的指数的历史PE/PB估值百分位，判断当前估值水平。低估（百分位≤30%）时加倍投入，正常（30%-70%）时正常投入，高估（70%-90%）时减半，极度高估（>90%）时暂停。',
      pros: ['基于估值判断，逻辑严谨', '低估区域积累更多筹码', '高估区域锁定收益', '长期效果突出'],
      cons: ['需要估值数据支持', '估值可能长期偏离', '不适合短期操作'],
      target: '适合认同价值投资理念、有一定估值分析能力、追求长期超额收益的投资者。',
    },
  },
}

// ─── 状态 ───
const formRef = ref(null)
const loading = ref(false)
const loadingProgress = ref(0)
const loadingText = ref('')
const selectedFund = ref(null)
const compareResult = ref(null)
const compareChartRef = ref(null)
const activeTab = ref('fixed')
let compareChartInstance = null

const form = reactive({
  code: '',
  amount: 1000,
  period: 'monthly',
  startDate: '',
  endDate: '',
})

// 策略选择状态
const strategyOptions = ref(
  Object.entries(STRATEGY_META).map(([key, meta]) => ({
    key,
    label: meta.label,
    desc: meta.desc,
    checked: true,
  }))
)

const selectedStrategies = computed(() =>
  strategyOptions.value.filter(s => s.checked).map(s => s.key)
)

// ─── 搜索基金 ───
async function searchFunds(queryStr, cb) {
  if (!queryStr || queryStr.length < 1) return cb([])
  try {
    const list = await getFundList({ keyword: queryStr, limit: 20 })
    cb((list || []).map(f => ({ ...f, value: `${f.name} (${f.code})` })))
  } catch {
    cb([])
  }
}

function onFundSelect(item) {
  form.code = item.code
  selectedFund.value = item
}

// ─── 计算属性 ───
const comparison = computed(() => compareResult.value?.comparison || {})
const strategiesData = computed(() => compareResult.value?.strategies || {})

const winnerMeta = computed(() => {
  const key = comparison.value.winner_ret
  return key ? STRATEGY_META[key] : null
})

const extraReturnText = computed(() => {
  const s = strategiesData.value
  const fixedRet = s.fixed?.summary?.totalReturn
  const winnerRet = comparison.value.bestReturn
  if (fixedRet != null && winnerRet != null) {
    const diff = (winnerRet - fixedRet).toFixed(2)
    return diff > 0 ? `${diff}%` : '0%'
  }
  return '--'
})

// 核心指标对比表（转置：指标为行，策略为列）
const metricsColumns = computed(() => {
  return Object.entries(strategiesData.value).map(([key]) => ({
    key,
    label: STRATEGY_META[key]?.label || key,
    isWinnerRet: comparison.value.winner_ret === key,
    isWinnerDrawdown: comparison.value.winner_drawdown === key,
    isWinnerCost: comparison.value.winner_cost === key,
  }))
})

const metricsTableData = computed(() => {
  const rows = [
    { key: 'totalInvest', label: '累计投入', isMoney: true },
    { key: 'totalValue', label: '期末资产', isMoney: true },
    { key: 'totalProfit', label: '累计收益', isMoney: true },
    { key: 'totalReturn', label: '累计收益率', suffix: '%' },
    { key: 'annualizedReturn', label: '年化收益率', suffix: '%' },
    { key: 'maxDrawdown', label: '最大回撤', suffix: '%' },
    { key: 'totalTimes', label: '定投次数', suffix: '次' },
  ]
  return rows.map(row => {
    const obj = { ...row }
    metricsColumns.value.forEach(col => {
      const s = strategiesData.value[col.key]?.summary || {}
      let val = s[row.key]
      if (val == null) val = 0
      if (row.isMoney) {
        obj[col.key] = val.toFixed(0) + ' 元'
      } else if (row.suffix === '%') {
        obj[col.key] = (val >= 0 ? '+' : '') + val.toFixed(2) + '%'
      } else {
        obj[col.key] = val + row.suffix
      }
    })
    return obj
  })
})

// 策略详情数据
const detailStrategies = computed(() => {
  return Object.entries(strategiesData.value).map(([key, data]) => {
    const meta = STRATEGY_META[key] || { label: key, color: '#909399', info: {} }
    return {
      key,
      label: meta.label,
      info: meta.info,
      summary: data.summary,
      chartData: data.chartData || [],
    }
  })
})

// ─── 对比 ───
async function doCompare() {
  if (!form.code) {
    ElMessage.warning('请先搜索并选择基金')
    return
  }
  if (selectedStrategies.value.length < 2) {
    ElMessage.warning('请至少选择 2 种策略进行对比')
    return
  }
  if (!form.startDate || !form.endDate) {
    ElMessage.warning('请选择起始和结束日期')
    return
  }

  loading.value = true
  loadingProgress.value = 0
  compareResult.value = null
  const timer = setInterval(() => {
    if (loadingProgress.value < 90) loadingProgress.value += Math.random() * 8
  }, 500)
  loadingText.value = '正在获取历史净值数据...'

  try {
    await new Promise(r => setTimeout(r, 600))
    loadingText.value = '执行多策略回测计算...'
    const res = await fundStrategyCompare({
      code: form.code,
      amount: form.amount,
      period: form.period,
      startDate: form.startDate,
      endDate: form.endDate,
      strategies: selectedStrategies.value,
    })
    loadingText.value = '生成对比报告...'
    await new Promise(r => setTimeout(r, 300))

    if (res) {
      console.log('[策略对比] API返回:', res)
      compareResult.value = res
      // 默认选中收益最高的策略 tab
      if (res.comparison?.winner_ret) {
        activeTab.value = res.comparison.winner_ret
      }
      ElMessage.success('策略对比完成')
    }
  } catch (err) {
    console.error(err)
    ElMessage.error(err.response?.data?.msg || '策略对比失败')
  } finally {
    clearInterval(timer)
    loadingProgress.value = 100
    setTimeout(() => { loading.value = false }, 400)
  }
}

function clearForm() {
  form.code = ''
  form.amount = 1000
  form.period = 'monthly'
  form.startDate = ''
  form.endDate = ''
  selectedFund.value = null
  compareResult.value = null
  strategyOptions.value.forEach(s => (s.checked = true))
}

// ─── 对比图表 ───
function initCompareChart() {
  if (!compareChartRef.value) return
  compareChartInstance?.dispose()
  compareChartInstance = echartsInit(compareChartRef.value)

  const series = []
  const legendData = []
  const allDatesSet = new Set()

  // 收集所有策略的日期
  const strategyChartData = {}
  for (const [key, data] of Object.entries(strategiesData.value)) {
    const chart = data.chartData || []
    if (chart.length === 0) continue
    strategyChartData[key] = chart
    chart.forEach(d => allDatesSet.add(d.date))
  }

  const sortedDates = [...allDatesSet].sort()
  if (sortedDates.length === 0) return

  // 累计本金参考线（取 fixed 的总投入）
  const investMap = {}
  if (strategyChartData['fixed']) {
    strategyChartData['fixed'].forEach(d => { investMap[d.date] = d.totalInvest })
  }

  // 各策略曲线
  for (const [key, chart] of Object.entries(strategyChartData)) {
    const meta = STRATEGY_META[key] || { label: key, color: '#909399' }
    legendData.push(meta.label)

    const valueMap = {}
    chart.forEach(d => { valueMap[d.date] = d.totalValue })

    series.push({
      name: meta.label,
      type: 'line',
      data: sortedDates.map(d => valueMap[d] ?? null),
      smooth: false,
      symbol: 'none',
      lineStyle: { color: meta.color, width: 2 },
    })
  }

  // 累计本金参考线（灰色虚线）
  legendData.push('累计本金')
  series.push({
    name: '累计本金',
    type: 'line',
    data: sortedDates.map(d => investMap[d] ?? null),
    smooth: false,
    symbol: 'none',
    lineStyle: { color: '#909399', width: 2, type: 'dashed' },
    z: 1,
  })

  compareChartInstance.setOption({
    tooltip: {
      trigger: 'axis',
      valueFormatter: v => (v != null ? v.toFixed(2) + ' 元' : '-'),
    },
    legend: { data: legendData, bottom: 0 },
    grid: { left: 55, right: 16, top: 10, bottom: 36 },
    xAxis: { type: 'category', data: sortedDates, axisLabel: { rotate: 45, fontSize: 10 } },
    yAxis: { type: 'value', name: '金额(元)', axisLabel: { fontSize: 10 } },
    series,
  })

  const handler = () => compareChartInstance?.resize()
  window.addEventListener('resize', handler)
  watch(
    () => compareChartInstance,
    () => window.removeEventListener('resize', handler),
    { once: true },
  )
}

// 监听结果和 loading 状态，两者就绪后初始化图表
watch([compareResult, loading], ([result, isLoading]) => {
  if (result && !isLoading && Object.keys(result.strategies || {}).length > 0) {
    nextTick(initCompareChart)
  }
})

onBeforeUnmount(() => {
  compareChartInstance?.dispose()
})
</script>

<style scoped>
.dingtou-page { min-height: 70vh; }
.page-header { margin-bottom: 20px; }
.page-title { font-size: 22px; font-weight: 700; display: flex; align-items: center; gap: 8px; margin: 0 0 6px; }
.page-desc { color: #909399; margin: 0; font-size: 14px; }

/* 参数区 */
.param-card { border-radius: 12px; position: sticky; top: 80px; }
.card-title { font-size: 15px; font-weight: 600; display: flex; align-items: center; gap: 6px; }
.full-width { width: 100%; }

.fund-search { width: 100%; }
.search-result-item { display: flex; gap: 8px; align-items: center; font-size: 13px; }
.sr-name { font-weight: 600; }
.sr-code { color: #909399; font-size: 11px; }

.selected-fund-info { display: flex; align-items: center; gap: 8px; margin-top: 8px; padding: 6px 10px; background: #f5f7fa; border-radius: 6px; }
.sf-name { font-weight: 600; font-size: 14px; }
.sf-type { color: #909399; font-size: 12px; }

.compliance-note { font-size: 11px; color: #909399; text-align: center; margin-top: 12px; }

/* 策略选择 */
.strategy-checkboxes { padding: 0 4px; }
.strategy-check-item { display: flex; align-items: center; gap: 6px; margin-bottom: 10px; }
.strategy-check-item .sc-label { font-size: 14px; }
.help-icon { color: #c0c4cc; cursor: help; font-size: 15px; }
.help-icon:hover { color: #409eff; }
.strategy-hint { font-size: 12px; color: #f56c6c; margin-top: 2px; }

/* 结果区 */
.result-card { border-radius: 12px; min-height: 350px; }

/* 结论卡片 */
.conclusion-card { border-radius: 12px; border-left: 4px solid #e6a23c; }
.conclusion-card :deep(.el-card__header) { border-bottom: none; padding-bottom: 0; }
.conclusion-body { text-align: center; padding: 8px 0 16px; }
.winner-badge { display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 12px; }
.winner-icon { font-size: 32px; }
.winner-name { font-size: 24px; font-weight: 700; }
.winner-detail { display: flex; justify-content: center; gap: 40px; margin-bottom: 12px; }
.wd-stat { text-align: center; }
.wd-stat-label { font-size: 12px; color: #909399; display: block; margin-bottom: 4px; }
.wd-stat-value { font-size: 20px; font-weight: 700; }
.conclusion-summary { font-size: 14px; color: #606266; padding: 8px 16px; background: #f5f7fa; border-radius: 8px; display: inline-block; }

/* 对比表 */
.compare-table-card { border-radius: 12px; }
.compare-table-card :deep(.el-table th.el-table__cell) { background: #f5f7fa; font-weight: 600; }
.cell-best-ret { color: #67c23a; font-weight: 700; }
.cell-best-dd { color: #409eff; font-weight: 700; }

/* 对比图表 */
.chart-card { border-radius: 12px; }
.compare-chart { width: 100%; height: 360px; }

/* 策略详情 */
.detail-tabs-card { border-radius: 12px; }
.detail-tabs-card :deep(.el-tabs__item) { font-weight: 600; }
.strategy-detail { padding: 4px 0; }
.detail-section { margin-bottom: 16px; }
.ds-title { font-size: 15px; font-weight: 600; display: flex; align-items: center; gap: 6px; margin: 0 0 8px; }
.ds-title.ds-pros { color: #67c23a; }
.ds-title.ds-cons { color: #f56c6c; }
.ds-content { font-size: 14px; color: #606266; line-height: 1.7; margin: 0; }
.ds-list { padding-left: 20px; margin: 0; font-size: 14px; color: #606266; line-height: 1.8; }
.detail-collapse { margin-top: 8px; }
.detail-collapse :deep(.el-collapse-item__header) { font-size: 14px; font-weight: 500; }

/* 通用 */
.text-up { color: #f56c6c; font-weight: 600; }
.text-down { color: #67c23a; }

/* 加载 */
.loading-box { text-align: center; padding: 60px 20px; }
.loading-icon { animation: pulse 1.5s ease-in-out infinite; }
@keyframes pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.1); } }
.loading-box h3 { font-size: 18px; margin: 16px 0; }
.loading-text { color: #909399; font-size: 14px; margin-top: 12px; }

.placeholder-box { text-align: center; padding: 60px 20px; }
.placeholder-box h3 { font-size: 18px; color: #303133; margin: 12px 0 6px; }
.placeholder-box p { color: #909399; font-size: 14px; }

@media (max-width: 768px) {
  .param-card { position: static; }
  .compare-chart { height: 240px; }
  .winner-detail { flex-direction: column; gap: 8px; }
}
</style>
