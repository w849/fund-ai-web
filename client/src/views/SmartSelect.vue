<template>
  <div class="smart-select">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">AI 智能选基</h1>
      <p class="page-desc">填写投资偏好，AI 为您推荐最合适的基金组合</p>
    </div>

    <el-row :gutter="24">
      <!-- 左侧表单区 -->
      <el-col :xs="24" :md="8">
        <el-card class="form-card" shadow="never">
          <template #header>
            <div class="form-header">
              <span class="card-title"><el-icon><MagicStick /></el-icon> 我的投资偏好</span>
            </div>
          </template>

          <el-form :model="form" label-position="top" class="filter-form" ref="formRef" @submit.prevent="doRecommend">

            <!-- ======== 基本信息 ======== -->
            <div class="form-section">
              <div class="section-label">基本信息</div>

              <el-form-item label="风险承受能力" prop="riskLevel"
                :rules="[{ required: true, message: '请选择风险承受能力', trigger: 'change' }]">
                <el-radio-group v-model="form.riskLevel" class="risk-group">
                  <el-radio value="conservative" class="risk-option">
                    <span class="option-label">保守型</span>
                    <span class="option-desc">本金安全第一，可接受小幅波动</span>
                  </el-radio>
                  <el-radio value="steady" class="risk-option">
                    <span class="option-label">稳健型</span>
                    <span class="option-desc">追求稳健增值，可接受中等波动</span>
                  </el-radio>
                  <el-radio value="balanced" class="risk-option">
                    <span class="option-label">平衡型</span>
                    <span class="option-desc">收益风险平衡，可承受一定回撤</span>
                  </el-radio>
                  <el-radio value="aggressive" class="risk-option">
                    <span class="option-label">进取型</span>
                    <span class="option-desc">追求较高收益，可承受较大波动</span>
                  </el-radio>
                  <el-radio value="radical" class="risk-option">
                    <span class="option-label">激进型</span>
                    <span class="option-desc">追求高收益，能承受大幅回撤</span>
                  </el-radio>
                </el-radio-group>
              </el-form-item>

              <el-form-item label="投资期限" prop="term"
                :rules="[{ required: true, message: '请选择投资期限', trigger: 'change' }]">
                <el-radio-group v-model="form.term" class="term-group">
                  <el-radio value="1y" class="term-option">1年以内 <small>短期</small></el-radio>
                  <el-radio value="1-3y" class="term-option">1-3年 <small>中短期</small></el-radio>
                  <el-radio value="3-5y" class="term-option">3-5年 <small>中期</small></el-radio>
                  <el-radio value="5-10y" class="term-option">5-10年 <small>中长期</small></el-radio>
                  <el-radio value="10y+" class="term-option">10年以上 <small>长期</small></el-radio>
                </el-radio-group>
              </el-form-item>

              <el-form-item label="目标年化收益" prop="targetReturn"
                :rules="[{ required: true, message: '请选择目标收益', trigger: 'change' }]">
                <el-radio-group v-model="form.targetReturn" class="return-group">
                  <el-radio value="5" class="return-option">5%以内</el-radio>
                  <el-radio value="5-10" class="return-option">5%-10%</el-radio>
                  <el-radio value="10-15" class="return-option">10%-15%</el-radio>
                  <el-radio value="15-20" class="return-option">15%-20%</el-radio>
                  <el-radio value="20+" class="return-option">20%以上</el-radio>
                </el-radio-group>
              </el-form-item>
            </div>

            <!-- ======== 投资偏好 ======== -->
            <el-divider />
            <div class="form-section">
              <div class="section-label">投资偏好</div>

              <el-form-item label="行业偏好（最多5个）" prop="industries">
                <el-checkbox-group v-model="form.industries" :max="5" class="tag-group">
                  <el-checkbox value="消费" class="tag-checkbox">消费</el-checkbox>
                  <el-checkbox value="科技" class="tag-checkbox">科技</el-checkbox>
                  <el-checkbox value="医药医疗" class="tag-checkbox">医药医疗</el-checkbox>
                  <el-checkbox value="新能源" class="tag-checkbox">新能源</el-checkbox>
                  <el-checkbox value="金融地产" class="tag-checkbox">金融地产</el-checkbox>
                  <el-checkbox value="军工" class="tag-checkbox">军工</el-checkbox>
                  <el-checkbox value="周期资源" class="tag-checkbox">周期资源</el-checkbox>
                  <el-checkbox value="不限" class="tag-checkbox">不限</el-checkbox>
                </el-checkbox-group>
              </el-form-item>

              <el-form-item label="基金类型偏好" prop="types">
                <el-checkbox-group v-model="form.types" class="tag-group">
                  <el-checkbox value="混合型" class="tag-checkbox">混合型</el-checkbox>
                  <el-checkbox value="股票型" class="tag-checkbox">股票型</el-checkbox>
                  <el-checkbox value="指数型" class="tag-checkbox">指数型</el-checkbox>
                  <el-checkbox value="债券型" class="tag-checkbox">债券型</el-checkbox>
                  <el-checkbox value="QDII" class="tag-checkbox">QDII</el-checkbox>
                  <el-checkbox value="不限" class="tag-checkbox">不限</el-checkbox>
                </el-checkbox-group>
              </el-form-item>

              <el-form-item label="投资风格" prop="investStyle">
                <el-radio-group v-model="form.investStyle" class="style-group">
                  <el-radio value="value" class="style-option">价值风格</el-radio>
                  <el-radio value="growth" class="style-option">成长风格</el-radio>
                  <el-radio value="balanced" class="style-option">均衡风格</el-radio>
                  <el-radio value="theme" class="style-option">行业主题</el-radio>
                </el-radio-group>
              </el-form-item>
            </div>

            <!-- ======== 投资金额 ======== -->
            <el-divider />
            <div class="form-section">
              <div class="section-label">投资金额</div>
              <el-form-item label="预计投资金额（选填）" prop="budget">
                <el-input-number v-model="form.budget" :min="0" :max="9999" :step="1" />
                <span class="budget-unit">万元</span>
              </el-form-item>
            </div>

            <div class="compliance-notice" style="font-size:11px;color:#909399;margin:8px 0">
              * 历史数据，不代表未来表现
            </div>

            <el-button type="primary" size="large" class="full-width" :loading="loading" @click="doRecommend">
              <el-icon><Cpu /></el-icon> 开始智能分析
            </el-button>

            <el-button class="full-width" style="margin-top:8px" @click="clearForm">
              <el-icon><Delete /></el-icon> 清空条件
            </el-button>
          </el-form>
        </el-card>
      </el-col>

      <!-- 右侧结果区 -->
      <el-col :xs="24" :md="16">
        <!-- 加载动画 -->
        <el-card v-if="loading" class="result-card" shadow="never">
          <div class="loading-container">
            <div class="ai-loading">
              <div class="brain-animation">
                <el-icon class="brain-icon" :size="56"><Cpu /></el-icon>
                <div class="pulse-rings">
                  <span class="ring-1"></span><span class="ring-2"></span><span class="ring-3"></span>
                </div>
              </div>
              <h3>{{ loadingTitle }}</h3>
              <p class="loading-subtext">{{ loadingText }}</p>
              <el-progress :percentage="loadingProgress" :stroke-width="8" color="linear-gradient(90deg, #409eff, #67c23a)" />
              <div class="loading-steps">
                <div class="step" :class="{ done: step >= 1 }">
                  <el-icon><Check /></el-icon> 正在筛选基金池...
                </div>
                <div class="step" :class="{ done: step >= 2 }">
                  <el-icon><Check /></el-icon> 匹配用户偏好...
                </div>
                <div class="step" :class="{ done: step >= 3 }">
                  <el-icon><Check /></el-icon> {{ aiConfigured ? '调用 DeepSeek AI 分析...' : '本地评分分析中...' }}
                </div>
                <div class="step" :class="{ done: step >= 4 }">
                  <el-icon><Check /></el-icon> 生成推荐方案...
                </div>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 结果区 -->
        <template v-else-if="aiResult.recommendations && aiResult.recommendations.length > 0">
          <!-- 功能栏 -->
          <el-card class="result-toolbar" shadow="never">
            <div class="toolbar-inner">
              <div class="toolbar-left">
                <el-icon class="header-icon" color="#409eff" :size="22"><TrophyBase /></el-icon>
                <span class="toolbar-title">推荐结果</span>
                <el-tag type="success" effect="plain" size="small">Top {{ aiResult.recommendations.length }} 推荐</el-tag>
                <el-tag v-if="!aiConfigured" type="warning" effect="plain" size="small">本地评分</el-tag>
              </div>
              <div class="toolbar-actions">
                <el-button size="small" @click="$router.push('/compare')">
                  <el-icon><DataAnalysis /></el-icon> 去对比
                </el-button>
                <el-button size="small" @click="doRecommend">
                  <el-icon><Refresh /></el-icon> 重新筛选
                </el-button>
              </div>
            </div>
          </el-card>

          <!-- 推荐基金卡片 -->
          <div class="result-list">
            <el-card v-for="(rec, idx) in aiResult.recommendations" :key="rec.fund_code"
              class="fund-result-card" shadow="hover">
              <!-- 卡片头部 -->
              <div class="card-header">
                <div class="card-rank" :style="{ background: rankColors[idx] }">#{{ idx + 1 }}</div>
                <div class="card-fund-info">
                  <div class="card-fund-name" @click="$router.push(`/fund/${rec.fund_code}`)">
                    {{ rec.fund_name || rec.fund_code }}
                    <el-tag size="small" class="fund-code-tag">{{ rec.fund_code }}</el-tag>
                  </div>
                  <div class="card-fund-meta">
                    <span>{{ rec.type || '-' }}</span>
                    <el-tag size="small" :type="riskTagType(rec.riskLevel)">{{ rec.riskLevel || '-' }}</el-tag>
                    <span>{{ rec.manager || '-' }}</span>
                    <span>{{ rec.fundScale || '-' }}</span>
                  </div>
                </div>
                <div class="card-score">
                  <el-progress type="circle" :percentage="Math.round(rec.total_score / 40 * 100)" :width="64" color="#409eff">
                    <span class="score-num">{{ rec.total_score }}</span>
                  </el-progress>
                  <span class="score-label">综合评分</span>
                </div>
              </div>

              <!-- 主体：雷达图 + 收益指标 -->
              <div class="card-body">
                <div class="radar-wrapper">
                  <div :ref="el => setRadarRef(el, idx)" class="radar-chart"></div>
                </div>
                <div class="stats-wrapper">
                  <div class="stat-grid">
                    <div class="stat-cell" v-for="s in statItems(rec)" :key="s.label">
                      <span class="stat-label">{{ s.label }}</span>
                      <span :class="['stat-value', s.color]">{{ s.value }}</span>
                    </div>
                  </div>
                  <!-- 评分标签 -->
                  <div class="score-tags">
                    <el-tag size="small" type="primary">{{ (rec.scores?.earnings || 0).toFixed(1) }} 收益</el-tag>
                    <el-tag size="small" type="success">{{ (rec.scores?.risk_control || 0).toFixed(1) }} 风控</el-tag>
                    <el-tag size="small" type="warning">{{ (rec.scores?.manager || 0).toFixed(1) }} 经理</el-tag>
                    <el-tag size="small" type="danger">{{ (rec.scores?.liquidity || 0).toFixed(1) }} 流动性</el-tag>
                  </div>
                </div>
              </div>

              <!-- 推荐理由 -->
              <div class="card-reason" v-if="rec.reason">
                <el-icon color="#e6a23c"><WarningFilled /></el-icon>
                <div class="reason-text"><strong>推荐理由：</strong>{{ rec.reason }}</div>
              </div>

              <!-- 风险提示 -->
              <div class="card-risk" v-if="rec.risk_warning">
                <el-icon color="#f56c6c"><WarningFilled /></el-icon>
                <div class="risk-text"><strong>风险提示：</strong>{{ rec.risk_warning }}</div>
              </div>

              <!-- 操作栏 -->
              <div class="card-actions">
                <el-button size="small" @click="$router.push(`/fund/${rec.fund_code}`)">
                  <el-icon><DataBoard /></el-icon> 查看详情
                </el-button>
                <el-button size="small" :type="isCompared(rec.fund_code) ? 'danger' : 'default'"
                  @click="toggleCompare(rec.fund_code)">
                  <el-icon>{{ isCompared(rec.fund_code) ? 'Remove' : 'Plus' }}</el-icon>
                  {{ isCompared(rec.fund_code) ? '移除对比' : '加入对比' }}
                </el-button>
              </div>

              <div class="card-disclaimer">以上分析由{{ aiConfigured ? ' AI 生成' : '系统自动生成' }}，仅供参考。历史业绩不代表未来表现。</div>
            </el-card>
          </div>

          <!-- 整体配置建议 -->
          <el-card v-if="aiResult.overall_advice" class="advice-card" shadow="never">
            <template #header>
              <span class="card-title"><el-icon color="#e6a23c"><Tickets /></el-icon> 整体配置建议</span>
            </template>
            <div class="advice-content">{{ aiResult.overall_advice }}</div>
            <div v-if="aiResult.market_outlook" class="outlook-content">
              <strong>市场展望：</strong>{{ aiResult.market_outlook }}
            </div>
            <div class="advice-disclaimer">
              免责声明：以上配置建议由{{ aiConfigured ? ' AI 模型生成' : '系统自动生成' }}，仅供参考学习，不构成任何投资建议。市场有风险，投资需谨慎。
            </div>
          </el-card>
        </template>

        <!-- 空状态 -->
        <el-card v-else class="result-card" shadow="never">
          <el-empty v-if="searched" description="未匹配到符合条件的基金，请调整参数" />
          <el-empty v-else description="填写左侧偏好参数，点击「开始智能分析」">
            <template #image>
              <el-icon :size="80" color="#c0c4cc"><Cpu /></el-icon>
            </template>
          </el-empty>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, nextTick, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  MagicStick, Cpu, TrophyBase, DataAnalysis, Refresh,
  Check, WarningFilled, Delete, Plus, Remove, DataBoard, Tickets,
} from '@element-plus/icons-vue'
import { aiRecommend, aiStatus } from '../api/fund'
import { useCompareStore } from '../stores/compare'
import { init as echartsInit } from '../utils/echarts'

const router = useRouter()
const compareStore = useCompareStore()
const formRef = ref(null)

const loading = ref(false)
const searched = ref(false)
const step = ref(0)
const loadingProgress = ref(0)
const loadingText = ref('')
const loadingTitle = ref('正在初始化...')
const aiConfigured = ref(true)
const aiResult = ref({})

const rankColors = ['#f56c6c', '#e6a23c', '#409eff', '#67c23a', '#909399']

// 表单数据
const form = reactive({
  riskLevel: undefined,
  term: undefined,
  targetReturn: undefined,
  industries: [],
  types: [],
  investStyle: 'balanced',
  budget: 0,
})

// 雷达图实例 & refs
const radarInstances = []
const radarRefs = {}

function setRadarRef(el, idx) {
  if (el) radarRefs[idx] = el
}

const loadingTexts = [
  '正在分析市场数据...',
  '评估基金风险收益特征...',
  '匹配您的投资偏好...',
  '生成个性化推荐方案...',
  '优化配置建议...',
]

function isCompared(code) {
  return compareStore.hasCode(code)
}

function toggleCompare(code) {
  if (compareStore.hasCode(code)) {
    compareStore.removeCode(code)
    ElMessage.info('已移除对比')
  } else if (compareStore.isFull) {
    ElMessage.warning('最多对比4只基金')
  } else {
    compareStore.addCode(code)
    ElMessage.success('已加入对比列表')
  }
}

function riskTagType(level) {
  if (!level) return 'info'
  if (level.includes('低')) return 'success'
  if (level.includes('中高') || level.includes('高')) return 'danger'
  if (level.includes('中')) return 'warning'
  return 'info'
}

function statItems(rec) {
  return [
    { label: '近1月', value: rec.monthReturn != null ? (rec.monthReturn >= 0 ? '+' : '') + rec.monthReturn.toFixed(2) + '%' : '-', color: rec.monthReturn >= 0 ? 'up' : 'down' },
    { label: '近1年', value: rec.yearReturn != null ? (rec.yearReturn >= 0 ? '+' : '') + rec.yearReturn.toFixed(2) + '%' : '-', color: rec.yearReturn >= 0 ? 'up' : 'down' },
    { label: '近3年', value: rec.threeYearReturn != null ? (rec.threeYearReturn >= 0 ? '+' : '') + rec.threeYearReturn.toFixed(2) + '%' : '-', color: rec.threeYearReturn >= 0 ? 'up' : 'down' },
    { label: '最大回撤', value: rec.maxDrawdown != null ? -rec.maxDrawdown.toFixed(1) + '%' : '-', color: 'down' },
    { label: '波动率', value: rec.volatility != null ? rec.volatility.toFixed(1) + '%' : '-', color: '' },
    { label: '夏普比率', value: rec.sharpeRatio != null ? rec.sharpeRatio.toFixed(2) : '-', color: (rec.sharpeRatio || 0) > 1 ? 'up' : '' },
  ]
}

function clearForm() {
  form.riskLevel = undefined
  form.term = undefined
  form.targetReturn = undefined
  form.industries = []
  form.types = []
  form.investStyle = 'balanced'
  form.budget = 0
  searched.value = false
  aiResult.value = {}
}

// 加载动画
let progressTimer = null

function startProgress() {
  step.value = 0
  loadingProgress.value = 0
  loadingTitle.value = aiConfigured.value ? 'AI 正在深度分析中...' : '系统正在分析中...'
  progressTimer = setInterval(() => {
    if (loadingProgress.value < 90) loadingProgress.value += Math.random() * 10
  }, 600)
  setTimeout(() => { step.value = 1; loadingText.value = loadingTexts[0] }, 400)
  setTimeout(() => { step.value = 2; loadingText.value = loadingTexts[1] }, 1800)
  setTimeout(() => { step.value = 3; loadingText.value = aiConfigured.value ? loadingTexts[2] : '正在计算多维评分...' }, 3500)
  setTimeout(() => { step.value = 4; loadingText.value = loadingTexts[3] }, 5500)
}

function stopProgress() {
  if (progressTimer) { clearInterval(progressTimer); progressTimer = null }
  loadingProgress.value = 100
  step.value = 4
}

// 初始化雷达图
function initRadarCharts() {
  nextTick(() => {
    const recs = aiResult.value.recommendations || []
    recs.forEach((rec, idx) => {
      const el = radarRefs[idx]
      if (!el) return
      if (radarInstances[idx]) radarInstances[idx].dispose()
      const chart = echartsInit(el)
      const scores = rec.scores || {}
      chart.setOption({
        radar: {
          indicator: [
            { name: '收益能力', max: 10 },
            { name: '风险控制', max: 10 },
            { name: '基金经理', max: 10 },
            { name: '规模流动性', max: 10 },
          ],
          center: ['50%', '50%'],
          radius: '65%',
          axisName: { color: '#606266', fontSize: 10 },
          splitArea: { areaStyle: { color: ['rgba(64,158,255,0.02)'] } },
        },
        series: [{
          type: 'radar',
          data: [{
            value: [scores.earnings || 0, scores.risk_control || 0, scores.manager || 0, scores.liquidity || 0],
            name: rec.fund_name || rec.fund_code,
            areaStyle: { color: 'rgba(64,158,255,0.2)' },
            lineStyle: { color: '#409eff', width: 2 },
            itemStyle: { color: '#409eff' },
          }],
        }],
      })
      radarInstances[idx] = chart
    })
  })
}

// 校验并提交
async function doRecommend() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    ElMessage.warning('请填写完整的投资偏好信息')
    return
  }

  loading.value = true
  searched.value = true
  aiResult.value = {}
  startProgress()

  try {
    const result = await aiRecommend({
      riskLevel: form.riskLevel,
      term: form.term,
      targetReturn: form.targetReturn,
      industries: form.industries.includes('不限') ? [] : form.industries,
      types: form.types.includes('不限') ? [] : form.types,
      investStyle: form.investStyle,
      budget: form.budget || undefined,
    })

    if (result && result.recommendations && result.recommendations.length > 0) {
      aiResult.value = result
      await nextTick()
      initRadarCharts()
    } else {
      ElMessage.warning('未匹配到符合条件的基金，请调整参数')
    }
  } catch (err) {
    console.error(err)
    ElMessage.error('推荐服务异常，请稍后重试')
  } finally {
    stopProgress()
    setTimeout(() => { loading.value = false }, 500)
  }
}

// 生命周期
onBeforeUnmount(() => {
  radarInstances.forEach(chart => chart?.dispose())
})

// 初始化
;(async () => {
  try {
    const status = await aiStatus()
    aiConfigured.value = status?.configured ?? true
  } catch {
    aiConfigured.value = false
  }
})()
</script>

<style scoped>
.smart-select { min-height: 70vh; }
.page-header { text-align: center; margin-bottom: 24px; }
.page-title { font-size: 24px; font-weight: 700; margin: 0 0 8px; }
.page-desc { color: #909399; margin: 0; font-size: 14px; }

/* 表单卡片 */
.form-card { border-radius: 12px; position: sticky; top: 80px; }
.card-title { font-size: 15px; font-weight: 600; display: flex; align-items: center; gap: 6px; }
.form-header { display: flex; align-items: center; gap: 8px; }
.full-width { width: 100%; }
.filter-form { padding: 4px 0; }
.form-section { margin-bottom: 8px; }
.section-label { font-size: 13px; font-weight: 600; color: #303133; margin-bottom: 12px; padding-left: 8px; border-left: 3px solid #409eff; }

/* Radio 样式 */
.risk-group { display: flex; flex-direction: column; gap: 4px; width: 100%; }
.risk-option { display: flex; align-items: flex-start; padding: 8px 12px; border: 1px solid #e4e7ed; border-radius: 8px; margin: 0 !important; transition: all .2s; }
.risk-option:hover { border-color: #409eff; background: #f5f7fa; }
.risk-option :deep(.el-radio__label) { display: flex; flex-direction: column; }
.option-label { font-weight: 600; font-size: 14px; color: #303133; }
.option-desc { font-size: 11px; color: #909399; margin-top: 2px; }

.term-group, .return-group, .style-group { display: flex; flex-wrap: wrap; gap: 6px; width: 100%; }
.term-option :deep(.el-radio__label), .return-option :deep(.el-radio__label), .style-option :deep(.el-radio__label) { font-size: 13px; }
.term-option small { color: #909399; }

/* Checkbox 标签样式 */
.tag-group { display: flex; flex-wrap: wrap; gap: 8px; }
.tag-checkbox { border: 1px solid #dcdfe6; border-radius: 16px; padding: 4px 12px; margin: 0 !important; transition: all .2s; }
.tag-checkbox:hover { border-color: #409eff; }
.tag-checkbox :deep(.el-checkbox__label) { font-size: 13px; }

.budget-unit { margin-left: 8px; color: #909399; font-size: 13px; }

/* 结果卡片 */
.result-card { border-radius: 12px; min-height: 400px; }
.result-toolbar { border-radius: 12px; margin-bottom: 12px; }
.toolbar-inner { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; }
.toolbar-left { display: flex; align-items: center; gap: 8px; }
.toolbar-title { font-size: 15px; font-weight: 600; }
.result-list { display: flex; flex-direction: column; gap: 16px; }

/* 基金卡片 */
.fund-result-card { border-radius: 12px; }
.card-header { display: flex; gap: 14px; align-items: flex-start; margin-bottom: 14px; }
.card-rank { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 16px; font-weight: 800; flex-shrink: 0; }
.card-fund-info { flex: 1; min-width: 0; }
.card-fund-name { font-size: 15px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; }
.card-fund-name:hover { color: #409eff; }
.fund-code-tag { font-size: 11px; }
.card-fund-meta { font-size: 12px; color: #909399; display: flex; gap: 10px; flex-wrap: wrap; margin-top: 3px; }
.card-score { text-align: center; flex-shrink: 0; }
.score-num { font-size: 15px; font-weight: 700; color: #409eff; }
.score-label { font-size: 11px; color: #909399; display: block; margin-top: 2px; }

.card-body { display: flex; gap: 16px; margin-bottom: 12px; }
.radar-wrapper { width: 140px; flex-shrink: 0; }
.radar-chart { width: 140px; height: 140px; }
.stats-wrapper { flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 8px; }
.stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
.stat-cell { text-align: center; }
.stat-label { font-size: 11px; color: #909399; display: block; }
.stat-value { font-size: 14px; font-weight: 600; display: block; }
.score-tags { display: flex; flex-wrap: wrap; gap: 4px; justify-content: center; }

.up { color: #f56c6c; }
.down { color: #67c23a; }

/* 推荐理由 */
.card-reason, .card-risk { display: flex; gap: 8px; padding: 10px 12px; border-radius: 8px; margin-bottom: 8px; font-size: 13px; line-height: 1.6; }
.card-reason { background: #fdf6ec; }
.card-risk { background: #fef0f0; }
.risk-text strong { color: #f56c6c; }

.card-actions { display: flex; gap: 8px; padding-top: 12px; border-top: 1px solid #f0f0f0; }
.card-disclaimer { font-size: 11px; color: #909399; margin-top: 8px; padding-top: 6px; border-top: 1px dashed #ebeef5; }

/* 整体建议 */
.advice-card { border-radius: 12px; margin-top: 16px; }
.advice-content, .outlook-content { font-size: 14px; line-height: 1.8; color: #606266; }
.outlook-content { margin-top: 12px; padding-top: 12px; border-top: 1px solid #f0f0f0; }
.advice-disclaimer { margin-top: 12px; padding: 8px; background: #fef0e6; border-radius: 6px; font-size: 12px; color: #b85c1a; text-align: center; }

/* 加载动画 */
.loading-container { text-align: center; padding: 50px 20px; }
.ai-loading { max-width: 480px; margin: 0 auto; }
.brain-animation { position: relative; display: inline-block; margin-bottom: 20px; }
.brain-icon { color: #409eff; animation: pulse 1.5s ease-in-out infinite; }
@keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
.pulse-rings { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); }
.pulse-rings span { position: absolute; border-radius: 50%; border: 2px solid #409eff; animation: ring-expand 2s ease-out infinite; }
.pulse-rings .ring-1 { width: 80px; height: 80px; animation-delay: 0s; }
.pulse-rings .ring-2 { width: 100px; height: 100px; animation-delay: 0.3s; }
.pulse-rings .ring-3 { width: 120px; height: 120px; animation-delay: 0.6s; }
@keyframes ring-expand { 0% { opacity: 0.8; transform: scale(0.8); } 100% { opacity: 0; transform: scale(1.5); } }
.ai-loading h3 { font-size: 20px; margin: 16px 0 8px; }
.loading-subtext { color: #909399; margin-bottom: 20px; font-size: 14px; min-height: 20px; }
.loading-steps { margin-top: 24px; display: flex; justify-content: center; gap: 20px; flex-wrap: wrap; }
.step { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #c0c4cc; transition: all .3s; }
.step.done { color: #67c23a; }

@media (max-width: 768px) {
  .card-body { flex-direction: column; align-items: center; }
  .radar-wrapper, .radar-chart { width: 160px; height: 160px; }
  .stat-grid { grid-template-columns: repeat(3, 1fr); }
  .form-card { position: static; }
  .page-title { font-size: 20px; }
}
</style>
