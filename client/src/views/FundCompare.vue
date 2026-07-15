<template>
  <div class="fund-compare">
    <el-card class="select-card" shadow="never">
      <template #header>
        <span class="card-title">
          <el-icon><DataAnalysis /></el-icon> 基金对比
        </span>
      </template>
      <div class="select-area">
        <el-row :gutter="12">
          <el-col :span="6" v-for="(slot, idx) in compareSlots" :key="idx">
            <div class="slot-box" :class="{ active: slot.code }">
              <div class="slot-label">基金 {{ slotLabels[idx] }}</div>
              <el-select
                v-model="slot.code"
                filterable
                remote
                :remote-method="(kw) => searchFunds(kw, idx)"
                :loading="slot.loading"
                placeholder="搜索基金..."
                style="width: 100%"
                @change="doCompare"
                :disabled="slot.code && !canRemove(idx)"
              >
                <el-option v-for="f in slot.results" :key="f.code" :label="`${f.code} - ${f.name}`" :value="f.code" />
              </el-select>
              <el-button v-if="slot.code" class="remove-btn" size="small" circle @click="removeSlot(idx)">
                <el-icon><Close /></el-icon>
              </el-button>
            </div>
          </el-col>
          <el-col :span="6">
            <el-button v-if="compareSlots.length < 4" class="add-btn" @click="addSlot">
              <el-icon><Plus /></el-icon> 添加基金
            </el-button>
          </el-col>
        </el-row>
      </div>
    </el-card>

    <template v-if="funds.length >= 2">
      <el-card class="result-card" shadow="never">
        <template #header>
          <span class="card-title">核心指标对比</span>
          <el-tag size="small" type="warning" style="margin-left:8px">历史数据，不代表未来表现</el-tag>
        </template>
        <el-table :data="compareRows" border stripe>
          <el-table-column prop="metric" label="指标" width="140" />
          <el-table-column v-for="(f, idx) in funds" :key="idx" :label="f.name" min-width="180">
            <template #default="{ row }">
              <span :class="getHighlightClass(row, idx)">{{ row.values[idx] }}</span>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- 净值走势对比 -->
      <el-card class="chart-card" shadow="never">
        <template #header>
          <span class="card-title">净值走势对比</span>
          <el-tag size="small" type="warning" style="margin-left:8px">历史数据，不代表未来表现</el-tag>
        </template>
        <div ref="compareChartRef" style="height: 400px"></div>
        <div style="text-align:center;font-size:12px;color:#909399;margin-top:12px;padding-top:8px;border-top:1px solid #ebeef5">
          * 以上对比数据均为历史数据，不代表未来表现。基金有风险，投资需谨慎。
        </div>
      </el-card>
    </template>

    <el-empty v-else description="请选择至少 2 只基金进行对比" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onBeforeUnmount, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { DataAnalysis, Plus, Close } from '@element-plus/icons-vue'
import { init as echartsInit } from '../utils/echarts'
import { getFundList, getFundDetail } from '../api/fund'

const colors = ['#409eff', '#e6a23c', '#67c23a', '#f56c6c']
const slotLabels = ['A', 'B', 'C', 'D']

const compareSlots = reactive([
  { code: '', loading: false, results: [] },
  { code: '', loading: false, results: [] },
])
const funds = ref([])
const compareChartRef = ref(null)
let chartInstance = null

const compareRows = computed(() => {
  if (funds.value.length < 2) return []
  const rows = [
    { metric: '基金代码', values: funds.value.map(f => f.code) },
    { metric: '基金类型', values: funds.value.map(f => f.type || '-') },
    { metric: '最新净值', values: funds.value.map(f => f.nav?.toFixed(4) || '-') },
    { metric: '日涨跌幅', values: funds.value.map(f => `${(f.change || 0) >= 0 ? '+' : ''}${(f.change || 0).toFixed(2)}%`) },
    { metric: '近1年收益', values: funds.value.map(f => f.yearReturn ? `${f.yearReturn >= 0 ? '+' : ''}${f.yearReturn.toFixed(2)}%` : '-') },
    { metric: '基金规模', values: funds.value.map(f => f.fundScale || '-') },
    { metric: '基金经理', values: funds.value.map(f => f.manager || '-') },
    { metric: '风险等级', values: funds.value.map(f => f.riskLevel || '-') },
    { metric: '管理费率', values: funds.value.map(f => f.fee || '-') },
    { metric: '成立日期', values: funds.value.map(f => f.establishDate || '-') },
    { metric: '最低申购', values: funds.value.map(f => `${f.minBuy}元`) },
  ]
  return rows
})

function getHighlightClass(row, idx) {
  const val = row.values[idx]
  if (!val || val === '-') return ''
  if (row.metric === '日涨跌幅' || row.metric === '近1年收益') {
    return parseFloat(val) >= 0 ? 'up' : 'down'
  }
  return ''
}

function addSlot() {
  if (compareSlots.length >= 4) return
  compareSlots.push({ code: '', loading: false, results: [] })
}

function canRemove(idx) {
  return compareSlots.filter(s => s.code).length > 2
}

function removeSlot(idx) {
  compareSlots.splice(idx, 1)
  doCompare()
}

async function searchFunds(keyword, idx) {
  if (!keyword) return
  compareSlots[idx].loading = true
  try {
    compareSlots[idx].results = await getFundList({ keyword })
  } catch (err) {
    console.error(err)
  } finally {
    compareSlots[idx].loading = false
  }
}

async function doCompare() {
  const codes = compareSlots.map(s => s.code).filter(Boolean)
  if (codes.length < 2) {
    funds.value = []
    return
  }
  if (new Set(codes).size !== codes.length) {
    ElMessage.warning('请选择不同的基金')
    return
  }
  try {
    const details = await Promise.all(codes.map(c => getFundDetail(c)))
    funds.value = details.filter(Boolean)
    nextTick(initCompareChart)
  } catch (err) {
    console.error(err)
  }
}

function initCompareChart() {
  if (!compareChartRef.value || funds.value.length < 2) return
  chartInstance?.dispose()
  chartInstance = echartsInit(compareChartRef.value)

  const series = funds.value.map((f, idx) => {
    const data = f.navHistory || []
    return {
      name: f.name,
      type: 'line',
      data: data.map(d => d.nav),
      smooth: true,
      lineStyle: { width: 2, color: colors[idx] },
      itemStyle: { color: colors[idx] },
    }
  })

  const dates = (funds.value[0]?.navHistory || []).map(d => d.date)
  const option = {
    tooltip: { trigger: 'axis' },
    legend: { data: funds.value.map(f => f.name) },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: dates, axisLabel: { rotate: 30, fontSize: 11 } },
    yAxis: { type: 'value', scale: true },
    series,
  }
  chartInstance.setOption(option)
  window.addEventListener('resize', () => chartInstance?.resize())
}

onBeforeUnmount(() => {
  chartInstance?.dispose()
  window.removeEventListener('resize', () => chartInstance?.resize())
})
</script>

<style scoped>
.fund-compare { display: flex; flex-direction: column; gap: 20px; }
.select-card, .result-card, .chart-card { border-radius: 12px; }
.card-title { font-size: 16px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
.select-area { padding: 8px 0; }
.slot-box { position: relative; padding: 12px; border: 1px dashed #dcdfe6; border-radius: 8px; transition: all .2s; min-height: 80px; }
.slot-box.active { border-color: #409eff; border-style: solid; background: #f0f7ff; }
.slot-label { font-size: 13px; font-weight: 600; margin-bottom: 8px; color: #606266; }
.remove-btn { position: absolute; top: -8px; right: -8px; }
.add-btn { width: 100%; height: 100%; min-height: 80px; border: 1px dashed #dcdfe6; border-radius: 8px; font-size: 14px; }
.up { color: #f56c6c; font-weight: 600; }
.down { color: #67c23a; font-weight: 600; }
@media (max-width: 768px) {
  .select-area .el-row .el-col { margin-bottom: 12px; }
  .slot-box { min-height: auto; padding: 8px; }
  .add-btn { min-height: 60px; }
}
</style>
