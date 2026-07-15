<template>
  <div class="disclaimer-bar">
    <div class="disclaimer-content">
      <el-icon><WarningFilled /></el-icon>
      <span>本工具所有内容仅为数据参考，不构成任何投资建议。市场有风险，投资需谨慎。历史业绩不代表未来表现。</span>
    </div>
  </div>
</template>

<script setup>
import { WarningFilled } from '@element-plus/icons-vue'
</script>

<style scoped>
.disclaimer-bar {
  background: #fef0e6;
  border-top: 2px solid #e6a23c;
  padding: 12px 16px;
}
.disclaimer-content {
  max-width: 1200px;
  margin: 0 auto;
  font-size: 13px;
  color: #8a6d3b;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  text-align: center;
  line-height: 1.6;
}
.disclaimer-content .el-icon {
  font-size: 16px;
  flex-shrink: 0;
}
</style>
