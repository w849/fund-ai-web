// ECharts 按需引入 — 只导入用到的组件
import { init, use } from 'echarts/core'
import { LineChart, PieChart, RadarChart, ScatterChart } from 'echarts/charts'
import {
  TooltipComponent,
  GridComponent,
  LegendComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

// 注册必须的组件
use([
  LineChart,
  PieChart,
  RadarChart,
  ScatterChart,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  CanvasRenderer,
])

// 导出 init 方法
export { init }
