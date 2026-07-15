<template>
  <div class="rank-page">
    <!-- 类型 Tab 切换 -->
    <el-card class="rank-card" shadow="never">
      <template #header>
        <div class="rank-header">
          <h2 class="rank-title">基金排行</h2>
          <el-radio-group v-model="activeTab" size="small" @change="handleTabChange">
            <el-radio-button value="">全部</el-radio-button>
            <el-radio-button value="混合型">混合型</el-radio-button>
            <el-radio-button value="股票型">股票型</el-radio-button>
            <el-radio-button value="指数型">指数型</el-radio-button>
            <el-radio-button value="债券型">债券型</el-radio-button>
            <el-radio-button value="QDII">QDII</el-radio-button>
          </el-radio-group>
        </div>
      </template>

      <!-- 筛选栏 -->
      <div class="filter-bar">
        <div class="filter-item">
          <span class="filter-label">风险等级</span>
          <el-select v-model="filterRisk" size="small" placeholder="全部" clearable @change="fetchRankData" style="width:110px">
            <el-option label="低风险" value="低风险" />
            <el-option label="中风险" value="中风险" />
            <el-option label="中高风险" value="中高风险" />
            <el-option label="高风险" value="高风险" />
          </el-select>
        </div>
        <div class="filter-item">
          <span class="filter-label">最低星级</span>
          <el-select v-model="filterRating" size="small" placeholder="不限" clearable @change="fetchRankData" style="width:100px">
            <el-option label="3星以上" :value="3" />
            <el-option label="4星以上" :value="4" />
            <el-option label="5星" :value="5" />
          </el-select>
        </div>
        <div class="filter-item">
          <span class="filter-label">成立时间</span>
          <el-select v-model="filterEstYear" size="small" placeholder="不限" clearable @change="fetchRankData" style="width:120px">
            <el-option label="3年内" :value="2023" />
            <el-option label="5年内" :value="2021" />
            <el-option label="10年内" :value="2016" />
            <el-option label="10年以上" :value="2000" />
          </el-select>
        </div>
        <div class="filter-item">
          <span class="filter-label">排序方式</span>
          <el-select v-model="sortBy" size="small" @change="fetchRankData" style="width:130px">
            <el-option label="默认排序" value="" />
            <el-option label="近1月收益" value="monthReturn" />
            <el-option label="近3月收益" value="quarterReturn" />
            <el-option label="近1年收益" value="yearReturn" />
            <el-option label="近3年收益" value="yearReturn3" />
            <el-option label="基金规模" value="fundScale" />
            <el-option label="评级" value="rating" />
          </el-select>
          <el-button
            :icon="sortOrder === 'desc' ? SortDown : SortUp"
            size="small"
            circle
            @click="toggleSort"
          />
        </div>
        <el-button size="small" text type="primary" @click="resetFilters">重置</el-button>
      </div>

      <!-- 表格 -->
      <div style="text-align:right;font-size:11px;color:#909399;margin-bottom:6px">
        <span class="history-tag">历史数据，不代表未来表现</span>
      </div>
      <el-table
        :data="pageData"
        stripe
        v-loading="loading"
        class="rank-table"
      >
        <el-table-column label="#" width="55" align="center" type="index" :index="pageIndex" />
        <el-table-column prop="code" label="代码" width="100" />
        <el-table-column prop="name" label="基金名称" min-width="170" />
        <el-table-column prop="type" label="类型" width="110" />
        <el-table-column label="风险等级" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="riskTagType(row.riskLevel)" size="small">{{ row.riskLevel }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="近1月" width="80" align="right">
          <template #default="{ row }">
            <span :class="row.monthReturn >= 0 ? 'up' : 'down'">{{ row.monthReturn >= 0 ? '+' : '' }}{{ row.monthReturn?.toFixed(2) }}%</span>
          </template>
        </el-table-column>
        <el-table-column label="近3月" width="80" align="right">
          <template #default="{ row }">
            <span :class="row.quarterReturn >= 0 ? 'up' : 'down'">{{ row.quarterReturn >= 0 ? '+' : '' }}{{ row.quarterReturn?.toFixed(2) }}%</span>
          </template>
        </el-table-column>
        <el-table-column label="近1年" width="80" align="right">
          <template #default="{ row }">
            <span :class="row.yearReturn >= 0 ? 'up' : 'down'">{{ row.yearReturn >= 0 ? '+' : '' }}{{ row.yearReturn?.toFixed(2) }}%</span>
          </template>
        </el-table-column>
        <el-table-column label="近3年" width="80" align="right">
          <template #default="{ row }">
            <span :class="row.yearReturn3 >= 0 ? 'up' : 'down'">{{ row.yearReturn3 >= 0 ? '+' : '' }}{{ row.yearReturn3?.toFixed(2) }}%</span>
          </template>
        </el-table-column>
        <el-table-column prop="fundScale" label="规模" width="90" align="right" />
        <el-table-column label="星级" width="85" align="center">
          <template #default="{ row }">
            <el-rate :model-value="row.rating" disabled size="small" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" align="center" fixed="right">
          <template #default="{ row }">
            <el-button text type="primary" size="small" @click.stop="goToDetail(row)">详情</el-button>
            <el-button
              text
              :type="compareStore.hasCode(row.code) ? 'danger' : 'primary'"
              size="small"
              @click.stop="toggleCompare(row)"
            >
              {{ compareStore.hasCode(row.code) ? '移除' : '对比' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrap" v-if="total > 0">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="total"
          layout="total, prev, pager, next"
          size="small"
        />
      </div>
      <div v-else-if="!loading" style="text-align:center;padding:40px;color:#909399">暂无符合条件的基金</div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { SortUp, SortDown } from '@element-plus/icons-vue'
import { getFundList } from '../api/fund'
import { useCompareStore } from '../stores/compare'
import { ElMessage } from 'element-plus'

const router = useRouter()
const compareStore = useCompareStore()

// Tab & 筛选
const activeTab = ref('')
const filterRisk = ref('')
const filterRating = ref(null)
const filterEstYear = ref(null)
const sortBy = ref('')
const sortOrder = ref('desc')

// 数据
const allData = ref([])
const loading = ref(false)

// 分页
const currentPage = ref(1)
const pageSize = 20

const total = computed(() => allData.value.length)
const pageData = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return allData.value.slice(start, start + pageSize)
})
const pageIndex = computed(() => (currentPage.value - 1) * pageSize + 1)

function riskTagType(level) {
  if (level?.includes('低')) return 'success'
  if (level?.includes('中')) return 'warning'
  return 'danger'
}

function goToDetail(row) {
  router.push(`/fund/${row.code}`)
}

function toggleCompare(row) {
  if (compareStore.hasCode(row.code)) {
    compareStore.removeCode(row.code)
    ElMessage.success('已从对比列表移除')
  } else if (compareStore.isFull) {
    ElMessage.warning('对比列表最多添加4只基金')
  } else {
    compareStore.addCode(row.code)
    ElMessage.success('已加入对比列表')
  }
}

function toggleSort() {
  sortOrder.value = sortOrder.value === 'desc' ? 'asc' : 'desc'
  fetchRankData()
}

function handleTabChange() {
  currentPage.value = 1
  fetchRankData()
}

function resetFilters() {
  activeTab.value = ''
  filterRisk.value = ''
  filterRating.value = null
  filterEstYear.value = null
  sortBy.value = ''
  sortOrder.value = 'desc'
  currentPage.value = 1
  fetchRankData()
}

async function fetchRankData() {
  loading.value = true
  try {
    const params = {}
    if (activeTab.value) params.type = activeTab.value
    if (filterRisk.value) params.riskLevel = filterRisk.value
    if (filterRating.value) params.minRating = filterRating.value
    if (filterEstYear.value) params.establishFrom = filterEstYear.value
    if (sortBy.value) {
      params.sortBy = sortBy.value
      params.sortOrder = sortOrder.value
    }
    allData.value = await getFundList(params)
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

onMounted(fetchRankData)
</script>

<style scoped>
.rank-page { display: flex; flex-direction: column; gap: 20px; }
.rank-card { border-radius: 12px; }
.rank-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
.rank-title { font-size: 18px; font-weight: 600; margin: 0; }

.filter-bar { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; margin-bottom: 16px; }
.filter-item { display: flex; align-items: center; gap: 6px; }
.filter-label { font-size: 13px; color: #909399; white-space: nowrap; }

.rank-table { width: 100%; }
.pagination-wrap { display: flex; justify-content: flex-end; margin-top: 16px; }
.up { color: #f56c6c; font-weight: 600; }
.down { color: #67c23a; font-weight: 600; }

@media (max-width: 768px) {
  .filter-bar { flex-direction: column; align-items: stretch; }
  .filter-item { flex-wrap: wrap; }
}
</style>
