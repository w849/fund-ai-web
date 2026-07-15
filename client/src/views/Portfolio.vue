<template>
  <div class="portfolio-page">
    <div class="page-header">
      <h1 class="page-title"><el-icon color="#409eff"><TrendCharts /></el-icon> 智能资产配置</h1>
      <p class="page-desc">基于 Markowitz 均值-方差模型，为您提供最优资产配置方案</p>
    </div>

    <el-row :gutter="20">
      <!-- 左侧输入区 -->
      <el-col :xs="24" :md="7">
        <el-card class="input-card" shadow="never">
          <template #header><span class="card-title"><el-icon><Setting /></el-icon> 配置参数</span></template>

          <el-form label-position="top" :model="form">
            <!-- 风险承受能力 -->
            <el-form-item label="风险承受能力">
              <el-radio-group v-model="form.riskLevel" class="risk-group">
                <el-radio value="conservative">保守</el-radio>
                <el-radio value="稳健">稳健</el-radio>
                <el-radio value="balanced">平衡</el-radio>
                <el-radio value="进取">进取</el-radio>
                <el-radio value="aggressive">激进</el-radio>
              </el-radio-group>
              <div class="risk-desc">{{ riskDesc }}</div>
            </el-form-item>

            <!-- 投资期限 -->
            <el-form-item label="投资期限">
              <el-select v-model="form.period" style="width:100%">
                <el-option label="短期（<1年）" value="short" />
                <el-option label="中期（1-3年）" value="mid" />
                <el-option label="长期（3-5年）" value="long" />
                <el-option label="超长期（>5年）" value="very_long" />
              </el-select>
            </el-form-item>

            <!-- 投资金额 -->
            <el-form-item label="投资总金额（元）">
              <el-input-number v-model="form.totalAmount" :min="0" :step="10000" :max="99999999" style="width:100%" />
            </el-form-item>

            <!-- 目标收益率（可选） -->
            <el-form-item label="目标年化收益率（可选）">
              <el-input-number v-model="form.targetReturn" :min="0" :max="50" :step="1" :precision="1" style="width:100%">
                <template #suffix>%</template>
              </el-input-number>
            </el-form-item>

            <el-button type="primary" size="large" class="full-width" :loading="loading" @click="doOptimize">
              <el-icon><TrendCharts /></el-icon> 生成配置方案
            </el-button>

            <div class="compliance-note">本计算结果仅供参考，不构成投资建议</div>
          </el-form>
        </el-card>
      </el-col>

      <!-- 右侧结果区 -->
      <el-col :xs="24" :md="17">
        <!-- 空状态 -->
        <el-card v-if="!loading && !result" class="result-card" shadow="never">
          <div class="placeholder-box">
            <el-icon :size="64" color="#c0c4cc"><TrendCharts /></el-icon>
            <h3>智能资产配置</h3>
            <p>选择风险偏好，点击「生成配置方案」获取最优资产配置建议</p>
          </div>
        </el-card>

        <!-- 加载 -->
        <el-card v-if="loading" class="result-card" shadow="never">
          <div class="loading-box">
            <el-icon class="loading-icon" :size="48" color="#409eff"><TrendCharts /></el-icon>
            <h3>正在计算最优配置...</h3>
            <el-progress :percentage="80" :stroke-width="8" color="#409eff" />
          </div>
        </el-card>

        <!-- 结果 -->
        <template v-if="!loading && result">
          <!-- 风险收益指标卡片组 -->
          <el-row :gutter="16" style="margin-bottom:16px">
            <el-col :span="8">
              <el-card shadow="never" class="metric-card up">
                <div class="metric-label">预期年化收益</div>
                <div class="metric-val">{{ result.expectedReturn }}%</div>
                <div class="metric-bar" :style="{ width: (result.expectedReturn/20*100)+'%' }"></div>
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card shadow="never" class="metric-card risk">
                <div class="metric-label">组合波动率</div>
                <div class="metric-val">{{ result.volatility }}%</div>
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card shadow="never" class="metric-card normal">
                <div class="metric-label">夏普比率</div>
                <div class="metric-val">{{ result.sharpe }}</div>
              </el-card>
            </el-col>
          </el-row>

          <el-row :gutter="16">
            <!-- 大类资产配置饼图 -->
            <el-col :span="12">
              <el-card shadow="never" class="chart-card">
                <template #header><span class="card-title"><el-icon><PieChart /></el-icon> 大类资产配置</span></template>
                <div ref="pieChartRef" class="pie-chart"></div>
                <!-- 图例 -->
                <div class="pie-legend">
                  <div v-for="cat in result.byCategory" :key="cat.type" class="legend-item">
                    <span class="legend-dot" :style="{ background: cat.assets[0]?.color || '#909399' }"></span>
                    <span class="legend-label">{{ cat.label }}</span>
                    <span class="legend-weight">{{ cat.totalWeight }}%</span>
                  </div>
                </div>
              </el-card>
            </el-col>

            <!-- 有效前沿图 -->
            <el-col :span="12">
              <el-card shadow="never" class="chart-card">
                <template #header><span class="card-title"><el-icon><DataLine /></el-icon> 有效前沿</span></template>
                <div ref="frontierChartRef" class="frontier-chart"></div>
              </el-card>
            </el-col>
          </el-row>

          <!-- 配置明细表 -->
          <el-card shadow="never" class="table-card">
            <template #header><span class="card-title"><el-icon><List /></el-icon> 配置明细</span></template>
            <el-table :data="result.allocations.filter(a => a.weight > 0.01)" size="small" stripe border>
              <el-table-column prop="name" label="基金名称" min-width="160" />
              <el-table-column prop="typeLabel" label="类型" width="110">
                <template #default="{ row }">
                  <el-tag :color="row.color" size="small" style="color:#fff">{{ row.typeLabel }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="weight" label="配置比例" width="100" align="right">
                <template #default="{ row }">{{ row.weight }}%</template>
              </el-table-column>
              <el-table-column prop="amount" label="预计金额" width="120" align="right">
                <template #default="{ row }">{{ form.totalAmount ? '¥' + row.amount.toLocaleString() : '-' }}</template>
              </el-table-column>
              <el-table-column prop="expectedReturn" label="预期收益" width="90" align="right">
                <template #default="{ row }">{{ row.expectedReturn }}%</template>
              </el-table-column>
              <el-table-column prop="volatility" label="波动率" width="80" align="right">
                <template #default="{ row }">{{ row.volatility }}%</template>
              </el-table-column>
            </el-table>
          </el-card>

          <!-- 配置建议 -->
          <el-card shadow="never" class="advice-card">
            <template #header>
              <span class="card-title"><el-icon><InfoFilled /></el-icon> 配置建议</span>
            </template>
            <div class="advice-content" v-html="result.summary"></div>
            <el-divider />
            <div class="advice-section">
              <h4>大类资产说明</h4>
              <p>{{ result.catNotes }}</p>
            </div>
            <div class="advice-section">
              <h4>风险提示</h4>
              <p>以上配置基于 Markowitz 均值-方差模型，采用历史数据进行优化。过去表现不代表未来收益。建议每半年进行一次再平衡操作，根据市场变化调整配置比例。</p>
            </div>
          </el-card>
        </template>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, computed, nextTick, watch, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import {
  TrendCharts, Setting, PieChart, DataLine, List, InfoFilled,
} from '@element-plus/icons-vue'
import { recommendPortfolio, getEfficientFrontier } from '../api/portfolio'
import { init as echartsInit } from '../utils/echarts'

const loading = ref(false)
const result = ref(null)
const pieChartRef = ref(null)
const frontierChartRef = ref(null)
let pieChartInstance = null
let frontierChartInstance = null
let pieResizeHandler = null
let frontierResizeHandler = null

const form = reactive({
  riskLevel: 'balanced',
  period: 'mid',
  totalAmount: 100000,
  targetReturn: null,
})

const riskDescMap = {
  conservative: '低风险，可承受5%以内亏损',
  '稳健': '中低风险，可承受5%-10%亏损',
  balanced: '中等风险，可承受10%-15%亏损',
  '进取': '中高风险，可承受15%-25%亏损',
  aggressive: '高风险，可承受25%以上亏损',
}
const riskDesc = computed(() => riskDescMap[form.riskLevel] || '')

// ─── 优化 ───
async function doOptimize() {
  loading.value = true
  result.value = null
  try {
    const [recRes, frontRes] = await Promise.all([
      recommendPortfolio({
        riskLevel: form.riskLevel,
        totalAmount: form.totalAmount,
      }),
      getEfficientFrontier(),
    ])
    if (recRes) {
      recRes._frontier = frontRes?.frontier || []
      recRes._maxSharpe = frontRes?.maxSharpe || null
      recRes._minVariance = frontRes?.minVariance || null
      result.value = recRes
      ElMessage.success('配置方案生成完成')
    }
  } catch (err) {
    console.error(err)
    ElMessage.error(err.response?.data?.msg || '配置计算失败')
  } finally {
    loading.value = false
  }
}

// ─── 饼图 ───
function initPieChart() {
  if (!pieChartRef.value || !result.value) return
  // 清除旧的 resize 监听
  if (pieResizeHandler) window.removeEventListener('resize', pieResizeHandler)
  pieChartInstance?.dispose()
  pieChartInstance = echartsInit(pieChartRef.value)

  const data = result.value.byCategory.map(c => ({
    name: c.label,
    value: c.totalWeight,
    itemStyle: { color: c.assets[0]?.color || '#909399' },
  }))

  pieChartInstance.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c}% ({d}%)' },
    series: [{
      type: 'pie',
      radius: ['35%', '65%'],
      center: ['50%', '50%'],
      data,
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
    }],
  })

  pieResizeHandler = () => {
    if (pieChartInstance && !pieChartInstance.isDisposed()) {
      pieChartInstance.resize()
    }
  }
  window.addEventListener('resize', pieResizeHandler)
}

// ─── 有效前沿散点图 ───
function initFrontierChart() {
  if (!frontierChartRef.value || !result.value) return
  // 清除旧的 resize 监听
  if (frontierResizeHandler) window.removeEventListener('resize', frontierResizeHandler)
  frontierChartInstance?.dispose()
  frontierChartInstance = echartsInit(frontierChartRef.value)

  const frontier = result.value._frontier || []
  const maxSharpe = result.value._maxSharpe
  const minVar = result.value._minVariance

  const data = frontier.map(p => [p.risk, p.ret])

  const series = [{ type: 'scatter', data, symbolSize: 4, name: '有效前沿' }]

  // 标记最大夏普组合
  if (maxSharpe) {
    series.push({
      type: 'scatter',
      data: [[maxSharpe.risk, maxSharpe.ret]],
      symbol: 'pin',
      symbolSize: 28,
      name: '最大夏普',
      itemStyle: { color: '#f56c6c' },
      label: { show: true, formatter: '最优', position: 'right', fontSize: 10 },
    })
  }

  frontierChartInstance.setOption({
    tooltip: { trigger: 'axis', formatter: p => `风险: ${p[0]?.data?.[0] || 0}%<br/>收益: ${p[0]?.data?.[1] || 0}%` },
    legend: { data: ['有效前沿', '最大夏普'], bottom: 0 },
    grid: { left: 50, right: 16, top: 10, bottom: 36 },
    xAxis: { type: 'value', name: '风险(波动率%)', nameLocation: 'middle', nameGap: 25, axisLabel: { fontSize: 10 } },
    yAxis: { type: 'value', name: '收益(%)', axisLabel: { fontSize: 10 } },
    series,
  })

  frontierResizeHandler = () => {
    if (frontierChartInstance && !frontierChartInstance.isDisposed()) {
      frontierChartInstance.resize()
    }
  }
  window.addEventListener('resize', frontierResizeHandler)
}

watch(result, (val) => {
  if (val) {
    nextTick(() => { initPieChart(); initFrontierChart() })
  }
})

onBeforeUnmount(() => {
  if (pieResizeHandler) window.removeEventListener('resize', pieResizeHandler)
  if (frontierResizeHandler) window.removeEventListener('resize', frontierResizeHandler)
  pieChartInstance?.dispose()
  frontierChartInstance?.dispose()
})
</script>

<style scoped>
.portfolio-page { min-height: 70vh; }
.page-header { margin-bottom: 20px; }
.page-title { font-size: 22px; font-weight: 700; display: flex; align-items: center; gap: 8px; margin: 0 0 6px; }
.page-desc { color: #909399; margin: 0; font-size: 14px; }

.input-card { border-radius: 12px; position: sticky; top: 80px; }
.card-title { font-size: 15px; font-weight: 600; display: flex; align-items: center; gap: 6px; }
.full-width { width: 100%; }

.risk-group { display: flex; flex-wrap: wrap; gap: 4px; }
.risk-desc { font-size: 12px; color: #909399; margin-top: 4px; }

.compliance-note { font-size: 11px; color: #909399; text-align: center; margin-top: 12px; }

.result-card { border-radius: 12px; min-height: 350px; }
.placeholder-box { text-align: center; padding: 60px 20px; }
.placeholder-box h3 { font-size: 18px; color: #303133; margin: 12px 0 6px; }
.placeholder-box p { color: #909399; font-size: 14px; }

.loading-box { text-align: center; padding: 60px 20px; }
.loading-icon { animation: pulse 1.5s ease-in-out infinite; }
@keyframes pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.1); } }
.loading-box h3 { font-size: 18px; margin: 16px 0; }

/* 指标卡片 */
.metric-card { border-radius: 10px; border-left: 3px solid; }
.metric-card.up { border-left-color: #67c23a; }
.metric-card.risk { border-left-color: #e6a23c; }
.metric-card.normal { border-left-color: #409eff; }
.metric-label { font-size: 12px; color: #909399; margin-bottom: 4px; }
.metric-val { font-size: 22px; font-weight: 700; }
.metric-bar { height: 3px; background: #67c23a; border-radius: 2px; margin-top: 6px; }

/* 图表卡片 */
.chart-card { border-radius: 12px; height: 100%; }
.pie-chart { width: 100%; height: 240px; }
.frontier-chart { width: 100%; height: 240px; }

.pie-legend { display: flex; flex-wrap: wrap; gap: 8px; padding: 0 12px 8px; justify-content: center; }
.legend-item { display: flex; align-items: center; gap: 4px; font-size: 12px; }
.legend-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.legend-weight { font-weight: 600; margin-left: 2px; }

/* 明细表 */
.table-card { border-radius: 12px; margin-top: 16px; }

/* 建议卡片 */
.advice-card { border-radius: 12px; margin-top: 16px; border-left: 3px solid #409eff; }
.advice-content { font-size: 14px; line-height: 1.8; color: #303133; }
.advice-section { margin-top: 12px; }
.advice-section h4 { font-size: 14px; font-weight: 600; margin: 0 0 6px; color: #409eff; }
.advice-section p { font-size: 13px; color: #606266; line-height: 1.7; margin: 0; }

@media (max-width: 768px) {
  .input-card { position: static; }
  .pie-chart, .frontier-chart { height: 200px; }
}
</style>
