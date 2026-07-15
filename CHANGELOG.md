# 更新日志

---

## 批次7/7：GitHub Actions CI/CD 自动化构建部署（2026-07-15）

### 新增文件
- `.github/workflows/ci.yml` — CI 流水线（lint→test→e2e→build）
- `.github/workflows/deploy.yml` — CD 流水线（SSH 部署 + Release + 健康检查 + 通知）
- `.github/workflows/docker-deploy.yml` — Docker 镜像推送（备选方案）
- `Dockerfile` — 多阶段构建（前端→后端）
- `docker-compose.yml` — app + Redis 一键启动
- `DEPLOY.md` — 完整部署文档
- `.env.example` — docker-compose 环境变量模板
- `server/.eslintrc.json` — 后端 ESLint 配置
- `client/.eslintrc.json` — 前端 ESLint 配置（含 vue 插件）

### 修改文件
- `README.md` — 添加 CI/CD 徽章、部署章节、DEPLOY.md 链接

### 关键变更
- CI 三段式流水线：Lint（ESLint）→ Test（Jest+Vitest+覆盖率）→ E2E（Playwright）
- CD 支持 tag 触发和手动触发，自动生成 Release Notes
- SSH 部署使用 appleboy/ssh-action，含 .env 保护机制
- 健康检查轮询 12 次×5 秒，失败自动中断
- 企业微信 Webhook 部署通知
- Docker 多阶段构建（node:18-alpine），前端产物从 builder 阶段复制
- docker-compose 含 Redis 健康检查依赖，应用等待 Redis 就绪后启动
- 后端/前端 ESLint 配置，`no-var`/`eqeqeq` 等规则

---

## 批次6/7：单元测试与 E2E 测试集成（2026-07-15）

### 新增文件
- `server/jest.config.js` — Jest 配置（node 环境、覆盖率规则）
- `server/tests/utils/response.test.js` — 15 个测试用例
- `server/tests/utils/BusinessError.test.js` — 10 个测试用例
- `server/tests/utils/validator.test.js` — 40 个测试用例
- `server/tests/services/cacheService.test.js` — 16 个测试用例（含 Redis 降级）
- `server/tests/services/fundService.test.js` — 7 个测试用例
- `server/tests/routes/health.test.js` — 8 个测试用例（supertest）
- `server/tests/routes/fund.test.js` — 10 个测试用例（supertest）
- `server/tests/routes/ai.test.js` — 5 个测试用例（supertest）
- `client/vitest.config.js` — Vitest 配置（jsdom、vue 插件、v8 覆盖率）
- `client/tests/utils/format.test.js` — 39 个测试用例（7 个函数完整覆盖）
- `client/tests/stores/compare.test.js` — 9 个测试用例（Pinia store）
- `client/tests/components/SkeletonWrapper.test.js` — 3 个测试用例
- `playwright.config.js` — Playwright E2E 配置
- `tests/e2e/home.spec.js` — 首页 E2E 测试
- `tests/e2e/fund-list.spec.js` — 基金列表 E2E 测试
- `tests/e2e/fund-detail.spec.js` — 基金详情 E2E 测试
- `tests/e2e/smart-select.spec.js` — AI 选基 E2E 测试
- `package.json` — 根目录统一 test 命令

### 修改文件
- `server/package.json` — 添加 `test`/`test:watch`/`test:coverage` 脚本
- `client/package.json` — 添加 `test`/`test:watch`/`test:coverage` 脚本
- `client/src/utils/echarts.js` — 新增 ScatterChart 导入

### 测试统计
- 后端 8 个测试套件，114 个测试用例全部通过 ✅
- 前端 3 个测试套件，54 个测试用例全部通过 ✅
- E2E 4 个测试文件，覆盖首页/列表/详情/AI 选基
- 后端工具函数覆盖率 > 90%，服务层 > 70%，接口 > 80%
- 所有测试可在无数据库、无 Redis 环境下运行
- 前端测试运行时间 < 3 秒

---

## 批次5/7：智能投顾 - Markowitz 资产配置优化（2026-07-15）

### 新增文件
- `server/src/services/portfolio/assetPool.js` — 资产池（11 只代表性基金，5 大类）
- `server/src/services/portfolio/markowitz.js` — Markowitz 优化算法（有效前沿/最小方差/最大夏普）
- `server/src/services/portfolioService.js` — 资产配置服务（3 个接口编排）
- `server/src/controllers/portfolioController.js` — 配置控制器
- `server/src/routes/portfolio.js` — 4 个 API 端点
- `client/src/api/portfolio.js` — 前端 API 封装
- `client/src/views/Portfolio.vue` — 智能资产配置页面

### 修改文件
- `client/src/router/index.js` — 新增 `/portfolio` 路由
- `client/src/App.vue` — 导航栏添加「智能配置」菜单项
- `server/src/app.js` — 注册 `/api/portfolio` 路由
- `server/package.json` — 新增 `numeric` 依赖

### 后端 API
- `GET /api/portfolio/asset-pool` — 获取可选资产池
- `POST /api/portfolio/optimize` — 计算最优配置
- `GET /api/portfolio/efficient-frontier` — 获取有效前沿数据（30 个点）
- `POST /api/portfolio/recommend` — 基于风险等级推荐配置

### 关键变更
- 收益/波动率/夏普比率计算正确，权重总和为 1
- 有效前沿从 minVar（7.35%）到 maxRet（11.43%），30 个点分布清晰
- 风险等级梯度明显：保守（债 44%/股 38%）→ 激进（股 52%/海外 33%）
- 权重约束使用不等式约束 + 后处理归一化，避免 numeric.solveQP 的 meq 兼容性问题
- 前端 ECharts 散点图展示有效前沿，饼图展示大类配置，明细表、指标卡、建议文字

---

## 批次5/5：定投计算器（2026-07-15）

### 修改文件
- `client/src/views/DingTouTool.vue` — 完全重写，从占位页变为完整定投回测工具
- `client/src/api/fund.js` — 新增 `fundBacktest()` API 封装
- `server/src/controllers/fundController.js` — 新增 `fundBacktest` 控制器 + `calculateBacktest` 计算引擎 + `generateInvestDates` 日期生成器
- `server/src/routes/fund.js` — 新增 `GET /api/funds/backtest/:code` 路由（双校验：code param + query schema）
- `server/src/utils/validator.js` — 新增 `backtestSchema`

### 后端 API
- `GET /api/funds/backtest/:code` 支持参数：amount（金额）、period（monthly/weekly/biweekly）、startDate/endDate（日期范围）、dividendType（reinvest/cash）
- 定投日期生成：按周期（月/周/双周）生成投资日，查找最近可用的净值数据
- 回报计算：累计投入、期末资产、累计收益、累计收益率、年化收益率（简化几何年化）、最大回撤
- 一次性投入对比：同期买入持有的收益对比
- 净值数据不足时的友好提示

### 前端页面
- 基金搜索选择（el-autocomplete，支持名称/代码搜索）
- 定投参数表单：金额（100-100000）、周期3选1、日期范围选择、分红方式
- 8项摘要指标卡片：累计投入、期末总资产、累计收益、累计收益率、年化收益率、最大回撤、定投次数、回测区间
- ECharts 走势图：总资产曲线（橙色填充）+ 累计投入虚线（蓝色）+ 净值曲线（灰色，右轴）
- 定投明细分页表格：日期、净值、投入金额、买入份额、累计份额、总资产、累计投入
- 数据不足时的 warning 提示

---

## 批次4/5：AI智能选基功能优化（2026-07-15）

### 修改文件
- `client/src/views/SmartSelect.vue` — 完全重写，表单分3个模块 + 卡片式结果 + 雷达图
- `server/src/services/deepseekService.js` — Prompt 升级（5档风险/期限 + 行业/风格/金额）
- `server/src/controllers/aiController.js` — 新增 `localScoring()` 四维评分算法（收益/风控/经理/流动性）
- `server/src/utils/validator.js` — Schema 更新为5档 riskLevel/term + 新字段
- `client/src/utils/echarts.js` — 新增 RadarChart 按需引入

### 关键变更
- 表单分为3个模块：基本信息（5档风险+期限+收益）/ 投资偏好（行业多选+类型多选+投资风格）/ 投资金额
- 风险承受能力5档：保守型/稳健型/平衡型/进取型/激进型，每项含描述说明
- 行业偏好8选N（最多5个），类型偏好6选N，胶囊标签多选样式
- 表单必填项校验，提交自动验证
- 本地评分算法 `localScoring`：从收益能力/风险控制/基金经理/规模流动性4个维度加权评分
- 权重根据用户风险偏好自适应（保守型收益15%风控45%，激进型收益40%风控15%）
- 推荐结果卡片式布局，每张含四维雷达图（ECharts）、6项收益指标、评分标签
- 本地评分/DeepSeek 双模式，加载步骤提示区分显示
- 加入/移除对比使用 Pinia store，清空条件按钮
- 页面首次加载时检测 AI 服务状态

---

## 批次3/5：基金详情页信息增强（2026-07-15）

### 新增文件
- 无

### 修改文件
- `client/src/views/FundDetail.vue` — 完全重写，5个Tab专业详情页，含净值走势图+同行对比、行业分布饼图、风格箱九宫格
- `server/src/services/fundService.js` — 阶段涨幅结构化输出、同类平均数据、同行净值对比数据
- `server/data/funds.json` — 50只基金新增 ~20 个字段（sixMonthReturn、volatility、maxDrawdown、sharpeRatio、infoRatio、managerInfo、industryDistribution、style、purchaseFee、redeemFee 等）
- `client/src/utils/echarts.js` — 新增 PieChart 按需引入

### 关键变更
- FundDetail.vue 5个Tab：概览 / 业绩 / 持仓 / 基金经理 / 费率信息
- 阶段涨幅表（基金收益/同类平均/同类排名）
- 净值走势图含同类平均虚线对比
- 行业分布饼图（ECharts），持仓按行业归类
- 风格箱九宫格（大盘/中盘/小盘 × 价值/平衡/成长）
- 基金经理信息卡片 + 简介
- 费率信息（运作费用/申购费率/赎回费率）
- 数据缺失友好显示 "--" 或空状态组件
- 加入/移除对比与 Pinia compareStore 联动
- ECharts Tab 切换懒初始化

---

## 批次2/5：首页改版与导航优化（2026-07-15）

### 新增文件
- `client/src/utils/format.js` — 格式化工具函数库（formatPercent/formatNav/changeColor/riskTagType/formatAmount/formatNumber/formatDate）
- `server/src/routes/market.js` — 市场指数路由
- `server/src/controllers/marketController.js` — 市场指数控制器（沪深300/中证500/创业板指/上证指数）
- `client/src/api/market.js` — 市场指数 API 封装

### 修改文件
- `client/src/views/Home.vue` — 完全重写，5个功能模块（搜索区/快捷入口/热门榜单/市场概览/推荐基金）
- `client/src/App.vue` — 风险横幅可关闭（sessionStorage 持久化）
- `server/src/app.js` — 注册 `/api/market` 路由

### 关键变更
- Home.vue 搜索区：紫色渐变横幅 + 大搜索框 + 下拉结果（防抖300ms）
- 快捷入口：AI智能选基 / 定投计算器 / 基金对比 / 基金排行 四个卡片
- 热门榜单：Tab切换近1月/近1年收益 TOP10，前3名铜牌样式
- 市场概览：4大指数点位+涨跌幅展示
- 推荐基金：8只不同类型精选基金卡片
- 骨架屏：所有列表加载中显示 el-skeleton
- 空状态：统一图标 + 文字提示
- 风险横幅新增关闭按钮，同一会话不再显示
- 移动端 <=768px 响应式适配

### 补充优化（批次2/5补充）
- `client/src/views/Rank.vue` — 完全重写，完整排行页面（类型Tab/风险/星级/成立时间筛选/排序切换/20条分页/详情+对比操作列）
- `client/src/router/index.js` — 新增 `/rank` 和 `/dingtou` 路由（均为懒加载）
- `server/src/services/fundService.js` — sortFieldMap 新增 quarterReturn；新增 establishFrom 参数筛选
- `server/src/utils/validator.js` — sortBy 新增 quarterReturn；新增 establishFrom 参数校验
- `server/data/funds.json` — 50只基金新增 quarterReturn 字段

---

## 批次1/5：数据层重构与基金池扩充（2026-07-15）

### 新增文件
- `server/data/funds.json` — 50只基金完整数据（原16只 → 50只）

### 修改文件
- `server/src/services/fundService.js` — 改为从 JSON 读取数据，增强筛选逻辑（多选类型/风险等级/最低星级/成立时间），增加排序字段
- `server/src/utils/validator.js` — 适配新增筛选参数
- `client/src/views/Home.vue` — 筛选栏升级（类型多选标签/风险等级/星级/排序+升降序切换）

### 基金池分布（50只）
| 类型 | 数量 |
|------|------|
| 混合型-偏股 | 14 |
| 混合型-灵活 | 5 |
| 混合型-平衡 | 1 |
| 股票型 | 10 |
| 指数型-宽基 | 5 |
| 指数型-行业 | 5 |
| 债券型 | 5 |
| QDII | 5 |

---

## P2 - 体验优化（2026-07-15）

### 修改文件
- `client/src/views/Home.vue` — 骨架屏加载
- `client/src/components/SkeletonWrapper.vue` — 新建骨架屏包裹组件
- `client/src/App.vue` — 移动端汉堡菜单 + el-drawer 侧边导航

### 关键变更
- 基金列表和详情增加骨架屏加载动画
- 导航栏小屏改为汉堡菜单（<=768px），含桌面导航全部菜单项
- 移动端侧边抽屉点击菜单项后自动关闭

---

## P1 - 架构优化（2026-07-15）

### 新增文件
- `server/src/controllers/fundController.js` — 基金 Controller（7个方法）
- `server/src/controllers/aiController.js` — AI Controller（2个方法）
- `server/src/utils/BusinessError.js` — 自定义业务异常类（HTTP状态码 + data）
- `client/src/stores/compare.js` — Pinia 对比状态管理（localStorage 持久化，上限4只）
- `server/.env.development` — 开发环境变量文件
- `server/.env.production` — 生产环境变量文件

### 修改文件
- `server/src/routes/fund.js` — 路由精简，只做路由注册+中间件编排
- `server/src/routes/ai.js` — 同上
- `server/src/app.js` — 全局错误处理器感知 BusinessError，返回正确 HTTP 状态码
- `client/src/main.js` — 注册 Pinia

### 关键变更
- Controller 层抽取，路由层不再包含业务逻辑
- BusinessError 区分 400/401/404/500 等状态码
- 错误处理器识别 BusinessError 返回对应 HTTP 状态码
- Pinia compareStore 支持 addCode/removeCode/toggleCode/hasCode/isFull
- NODE_ENV 区分环境配置加载

---

## P0 - 安全加固（2026-07-15）

### 新增依赖
- `helmet@8.3.0` — 安全响应头
- `express-rate-limit@7.5.1` — 请求限流
- `joi@17.13.3` — 参数校验

### 修改文件
- `server/src/app.js` — 启用 helmet（12个安全响应头）、CORS 白名单配置、禁用 x-powered-by
- `server/src/routes/ai.js` — express-rate-limit 替代手写限流（AI接口每分钟3次）
- `server/src/utils/validator.js` — 新建 Joi 校验中间件（5个 Schema）

### 关键变更
- CORS 从 `origin: '*'` 改为环境变量白名单 + credentials
- helmet 增加 X-Content-Type-Options/X-Frame-Options/Strict-Transport-Security 等
- AI推荐接口限流每分钟3次
- 参数校验覆盖 fundList/screening/smartSelect/codeParam/aiRecommend
- 校验失败返回 400 状态码 + 友好错误信息

---

## P0 - 性能优化（2026-07-15）

### 新增依赖
- `unplugin-auto-import` — Element Plus 自动导入
- `unplugin-vue-components` — 组件自动导入
- `winston@3.17.0` — 日志系统
- `winston-daily-rotate-file@5.0.0` — 日志轮转

### 修改文件
- `client/src/router/index.js` — 4个页面组件全部改为动态导入（() => import(...)）
- `client/vite.config.js` — Element Plus 按需引入插件、manualChunks 代码分割
- `client/src/main.js` — 移除全量 ECharts/Element Plus 导入
- `client/src/utils/echarts.js` — ECharts 按需注册（LineChart/TooltipComponent/GridComponent/LegendComponent/CanvasRenderer）
- `client/src/views/FundDetail.vue` — ECharts 改用按需导入
- `client/src/views/FundCompare.vue` — 同上
- `server/src/utils/logger.js` — 新建 Winston 日志配置

### 关键变更
- 路由懒加载，首屏包体积降低
- Element Plus 按需自动引入，体积减少
- ECharts 1071KB → 481KB（减少55%）
- Vite manualChunks: vue-vendor 分离
- Winston 4级日志（error/warn/info/debug）+ error.log + combined.log + requestLogger 中间件

---

## 项目初始化（2026-07-14）

### 核心搭建
- Vue 3 + Vite 5 + Element Plus + ECharts 5 + Axios 前端项目
- Node.js + Express 4 + CORS + dotenv + node-cache 后端项目
- 4个路由页面：首页/智能选基/基金详情/基金对比
- 前端代理配置（/api → localhost:3000）
- 统一响应格式 + 全局错误处理 + 风险提示横幅
- 后端 fundService.js 16只基金数据 + 8个 API 端点
- DeepSeek API 智能选基集成（deepseek-chat/JSON模式/temperature 0.2）
- 部署配置：nginx.conf / ecosystem.config.js / deploy.sh
- README 文档
