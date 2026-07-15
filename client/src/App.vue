<template>
  <div id="app-container">
    <el-container>
      <!-- 顶部导航 -->
      <el-header class="app-header">
        <div class="header-content">
          <router-link to="/" class="logo">
            <el-icon :size="28"><TrendCharts /></el-icon>
            <span class="logo-text">AI 智能选基金</span>
          </router-link>
          <!-- 桌面端导航 -->
          <el-menu
            :default-active="route.path"
            mode="horizontal"
            router
            class="nav-menu desktop-nav"
          >
            <el-menu-item index="/">首页</el-menu-item>
            <el-menu-item index="/rank">基金排行</el-menu-item>
            <el-menu-item index="/smart-select">AI 智能选基</el-menu-item>
            <el-menu-item index="/dingtou">定投工具</el-menu-item>
            <el-menu-item index="/compare">基金对比</el-menu-item>
            <el-menu-item index="/portfolio">智能配置</el-menu-item>
          </el-menu>
          <!-- 移动端汉堡按钮 -->
          <el-button class="hamburger-btn" text @click="drawerVisible = true">
            <el-icon :size="24"><Operation /></el-icon>
          </el-button>
        </div>
      </el-header>

      <!-- 移动端抽屉导航 -->
      <el-drawer
        v-model="drawerVisible"
        direction="ltr"
        size="260px"
        title="导航菜单"
        :with-header="true"
      >
        <el-menu
          :default-active="route.path"
          mode="vertical"
          router
          @select="drawerVisible = false"
        >
          <el-menu-item index="/">
            <el-icon><HomeFilled /></el-icon>
            <span>首页</span>
          </el-menu-item>
          <el-menu-item index="/rank">
            <el-icon><List /></el-icon>
            <span>基金排行</span>
          </el-menu-item>
          <el-menu-item index="/smart-select">
            <el-icon><Cpu /></el-icon>
            <span>AI 智能选基</span>
          </el-menu-item>
          <el-menu-item index="/dingtou">
            <el-icon><Coin /></el-icon>
            <span>定投工具</span>
          </el-menu-item>
          <el-menu-item index="/compare">
            <el-icon><DataAnalysis /></el-icon>
            <span>基金对比</span>
          </el-menu-item>
          <el-menu-item index="/portfolio">
            <el-icon><TrendCharts /></el-icon>
            <span>智能配置</span>
          </el-menu-item>
        </el-menu>
      </el-drawer>

      <!-- 风险提示横幅（可关闭） -->
      <div class="risk-banner" v-if="showRiskBanner">
        <el-icon><WarningFilled /></el-icon>
        <span>投资有风险，入市需谨慎。本平台所有数据仅供参考，不构成任何投资建议。</span>
        <el-button class="risk-close" text size="small" @click="dismissBanner">
          <el-icon><Close /></el-icon>
        </el-button>
      </div>

      <!-- 主内容 -->
      <el-main class="app-main">
        <router-view />
      </el-main>

      <!-- 底部免责声明 -->
      <el-footer class="app-footer">
        <Disclaimer />
      </el-footer>
    </el-container>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import {
  TrendCharts, WarningFilled, Operation, Close,
  HomeFilled, Cpu, DataAnalysis, List, Coin,
} from '@element-plus/icons-vue'
import Disclaimer from './components/Disclaimer.vue'

const route = useRoute()
const drawerVisible = ref(false)
const showRiskBanner = ref(!sessionStorage.getItem('risk_banner_closed'))

function dismissBanner() {
  showRiskBanner.value = false
  sessionStorage.setItem('risk_banner_closed', '1')
}
</script>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background-color: #f5f7fa;
  color: #303133;
}
#app-container { min-height: 100vh; display: flex; flex-direction: column; }

.app-header {
  background: #fff;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
  padding: 0;
  position: sticky;
  top: 0;
  z-index: 100;
}
.header-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  height: 60px;
  padding: 0 20px;
}
.logo {
  display: flex;
  align-items: center;
  text-decoration: none;
  color: #409eff;
  margin-right: 40px;
  flex-shrink: 0;
}
.logo-text {
  font-size: 20px;
  font-weight: 700;
  margin-left: 8px;
  white-space: nowrap;
}
.nav-menu { flex: 1; border-bottom: none !important; }
.nav-menu .el-menu-item { font-size: 14px; }

/* 汉堡按钮 - 默认隐藏 */
.hamburger-btn { display: none; }

/* 风险提示横幅 */
.risk-banner {
  background: linear-gradient(90deg, #fef0e6, #fdf6ec);
  border-bottom: 1px solid #f5d7b5;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 13px;
  color: #b85c1a;
  text-align: center;
  line-height: 1.5;
}
.risk-banner .el-icon { color: #e6a23c; font-size: 14px; flex-shrink: 0; }
.risk-close { margin-left: auto; color: #b85c1a; flex-shrink: 0; }

.app-main {
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 20px;
  flex: 1;
}
.app-footer { padding: 0; }

/* 移动端适配 */
@media (max-width: 768px) {
  .header-content { padding: 0 12px; height: 52px; }
  .logo-text { font-size: 16px; }
  .logo { margin-right: 0; flex: 1; }
  .desktop-nav { display: none; }
  .hamburger-btn { display: inline-flex; }
  .app-main { padding: 12px; }
  .risk-banner { font-size: 12px; padding: 6px 10px; }
}

/* 全局工具类 */
.up { color: #f56c6c; font-weight: 600; }
.down { color: #67c23a; font-weight: 600; }

/* 历史数据标记 */
.history-tag {
  display: inline-block;
  font-size: 11px;
  color: #909399;
  padding: 2px 6px;
  border: 1px dashed #dcdfe6;
  border-radius: 4px;
}
</style>
