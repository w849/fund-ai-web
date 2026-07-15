# AI 智能选基金

![CI](https://github.com/your-org/fund-ai-web/actions/workflows/ci.yml/badge.svg)
![CD](https://github.com/your-org/fund-ai-web/actions/workflows/deploy.yml/badge.svg)
![Docker](https://github.com/your-org/fund-ai-web/actions/workflows/docker-deploy.yml/badge.svg)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

基于 Vue 3 + Node.js + DeepSeek AI 的全栈智能选场外基金平台。内置 50 只主流基金数据，支持智能分析、基金排行、定投回测、基金对比等功能。

## 技术栈

| 模块 | 技术 |
|------|------|
| 前端 | Vue 3 (Composition API) + Vite 5 + Element Plus (按需导入) + ECharts (按需导入) + Axios |
| 后端 | Node.js + Express 4 + helmet + CORS + winston + joi + express-rate-limit + node-cache |
| AI | DeepSeek API (deepseek-chat, JSON mode) / 本地四维评分降级 |
| 数据 | fund-api (天天基金数据接口) + JSON 静态数据池 |
| 状态管理 | Pinia 2 (本地存储持久化) |
| 部署 | Nginx + PM2 |

## 项目文件结构

```
fund-ai-web/
├── client/                                # 前端项目
│   ├── src/
│   │   ├── api/
│   │   │   ├── request.js                # Axios 封装（拦截器、15s 超时、统一错误处理）
│   │   │   ├── fund.js                   # 9 个 API 接口封装（含定投回测）
│   │   │   └── market.js                 # 市场指数 API 封装
│   │   ├── views/
│   │   │   ├── Home.vue                  # 首页（搜索+快捷入口+热门榜单+市场概览+推荐基金）
│   │   │   ├── SmartSelect.vue           # AI 智能选基（5档表单+雷达图卡片+本地评分）
│   │   │   ├── FundDetail.vue            # 基金详情（概览/业绩/持仓/经理/费率 5 Tab）
│   │   │   ├── Rank.vue                  # 基金排行（Tab切换+筛选+排序+分页）
│   │   │   ├── FundCompare.vue           # 基金对比（最多4只+表格+走势图）
│   │   │   └── DingTouTool.vue           # 定投计算器（参数表单+回测结果+走势图+明细表）
│   │   ├── components/
│   │   │   ├── Disclaimer.vue            # 底部免责声明
│   │   │   └── SkeletonWrapper.vue       # 骨架屏组件
│   │   ├── stores/
│   │   │   └── compare.js                # Pinia 基金对比状态（localStorage 持久化）
│   │   ├── router/
│   │   │   └── index.js                  # 6 个路由（全部懒加载）
│   │   ├── utils/
│   │   │   ├── echarts.js                # ECharts 按需注册（Line/Pie/Radar）
│   │   │   └── format.js                 # 格式化工具（百分比/金额/涨跌色等）
│   │   ├── App.vue                       # 根组件（导航+汉堡菜单+风险横幅+路由视图+底部声明）
│   │   └── main.js                       # Vue 入口（Pinia + Router）
│   ├── vite.config.js                    # Vite 配置（代理 /api -> :3000, auto-import, manualChunks）
│   └── package.json
├── server/                                # 后端项目
│   ├── data/
│   │   └── funds.json                    # 50 只基金完整数据（含持仓/行业分布/费率/风格箱等）
│   ├── src/
│   │   ├── routes/
│   │   │   ├── fund.js                   # 基金路由（7 个接口：列表/筛选/排行/净值/回测/详情）
│   │   │   ├── ai.js                     # AI 路由（2 个接口：推荐+状态，含 3次/分钟 限流）
│   │   │   └── market.js                 # 市场指数路由
│   │   ├── controllers/
│   │   │   ├── fundController.js         # 基金控制器（含定投回测计算引擎）
│   │   │   ├── aiController.js           # AI 控制器（含本地四维评分算法）
│   │   │   └── marketController.js       # 市场指数控制器
│   │   ├── services/
│   │   │   ├── fundService.js            # 基金数据服务（缓存+搜索+扩充实数据+七维筛选）
│   │   │   └── deepseekService.js        # DeepSeek AI 分析服务（5档+行业+风格）
│   │   ├── utils/
│   │   │   ├── response.js               # 统一响应 { code, data, msg }
│   │   │   ├── validator.js              # Joi 参数校验（7 个 Schema）
│   │   │   ├── BusinessError.js          # 业务异常类（含 HTTP status）
│   │   │   └── logger.js                 # Winston 日志（控制台+文件轮转）
│   │   └── app.js                        # Express 入口（helmet + CORS + rate-limit + 错误处理）
│   ├── logs/                             # 日志文件目录
│   ├── .env                              # 环境变量（需自行配置）
│   ├── .env.development                  # 开发环境变量
│   ├── .env.production                   # 生产环境变量
│   └── package.json
├── deploy/                                # 部署配置
│   ├── nginx.conf
│   ├── ecosystem.config.js
│   └── deploy.sh
├── CHANGELOG.md                           # 版本更新日志
└── README.md
```

## 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0

### 1. 配置环境变量

```bash
cd server

# 复制环境变量模板
cp .env.example .env
```

编辑 `.env` 文件，填入你的 DeepSeek API Key：

```
DEEPSEEK_API_KEY=sk-your_key_here
DEEPSEEK_BASE_URL=https://api.deepseek.com
CORS_ORIGIN=http://localhost:5173
```

> **提示**：即使不配置 DeepSeek Key，系统也能正常运行，AI 选基功能会自动降级到本地评分模式。

### 2. 安装依赖

```bash
# 终端 1 - 安装后端依赖
cd server
npm install

# 终端 2 - 安装前端依赖
cd client
npm install
```

### 3. 启动服务

```bash
# 终端 1 - 启动后端（端口 3000）
cd server
node src/app.js

# 终端 2 - 启动前端（端口 5173）
cd client
npx vite --host
```

访问 http://localhost:5173 即可使用。

## API 接口文档

### 响应格式

所有接口统一返回格式：

```json
{
  "code": 200,
  "data": {},
  "msg": "操作成功"
}
```

错误时返回格式：

```json
{
  "code": 400,
  "data": null,
  "msg": "参数校验失败: xxx"
}
```

### 接口列表

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| GET | /api/health | 健康检查 | - |
| GET | /api/funds | 基金列表（搜索/筛选/排序） | keyword, type, riskLevel, minRating, establishFrom, sortBy, sortOrder |
| GET | /api/funds/:code | 基金详情（含阶段收益/风险指标/同行对比/行业分布） | code (路径参数) |
| GET | /api/funds/hot-list | 热门基金榜单（规模前8） | - |
| GET | /api/funds/screening | 基金初筛（成立≥3年/规模≥2亿/前50%） | type, riskLevel, limit |
| GET | /api/funds/smart-select | 本地AI智能选基 | riskLevel, type, budget, limit |
| GET | /api/funds/nav-history/:code | 历史净值（近1年） | code (路径参数) |
| GET | /api/funds/backtest/:code | 定投回测 | amount, period, startDate, endDate, dividendType |
| POST | /api/ai/recommend | DeepSeek AI 智能推荐 / 本地评分 | riskLevel, term, targetReturn, industries[], types[], investStyle, budget |
| GET | /api/ai/status | AI 服务状态 | - |
| GET | /api/market | 市场指数行情 | - |

### 定投回测参数说明

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| amount | number | 是 | 每期定投金额（元） |
| period | string | 否 | monthly(默认)/weekly/biweekly |
| startDate | string | 是 | 开始日期 YYYY-MM-DD |
| endDate | string | 是 | 结束日期 YYYY-MM-DD |
| dividendType | string | 否 | reinvest(默认)/cash |

返回数据包含：
- `summary`：累计投入、期末总资产、累计收益、累计/年化收益率、最大回撤、定投次数
- `chartData`：每期净值/投入/份额/总资产
- `lumpSumCompare`：同期一次性投入对比

### AI 推荐参数说明

| 参数 | 类型 | 说明 |
|------|------|------|
| riskLevel | string | conservative(保守)/steady(稳健)/balanced(平衡)/aggressive(进取)/radical(激进) |
| term | string | 1y/1-3y/3-5y/5-10y/10y+(10年+) |
| targetReturn | string | 5/5-10/10-15/15-20/20+(20%以上) |
| industries | string[] | 消费/科技/医药医疗/新能源等，最多5个 |
| types | string[] | 混合型/股票型/指数型/债券型/QDII |
| investStyle | string | value(价值)/growth(成长)/balanced(均衡)/theme(行业主题) |
| budget | number | 预计投资金额（万元，选填） |

### 缓存策略

| 数据 | 缓存时间 |
|------|----------|
| 基金基础信息 | 24 小时 |
| 实时净值 | 12 小时 |
| 历史净值 | 12 小时 |

### 限流策略

| 接口 | 限制 |
|------|------|
| 全局限流 | 单 IP 每分钟 60 次 |
| POST /api/ai/recommend | 单 IP 每分钟 3 次 |

## 数据说明

### 内置基金池

项目内置 **50 只** 主流场外基金数据，覆盖以下类型：

| 类型 | 数量 | 示例 |
|------|------|------|
| 混合型-偏股 | 14 | 易方达中小盘、兴全合润 |
| 混合型-灵活 | 5 | 广发稳健增长、诺安成长 |
| 混合型-平衡 | 1 | 摩根双核平衡 |
| 股票型 | 10 | 易方达消费、华夏能源革新 |
| 指数型-宽基 | 5 | 沪深300增强、中证500 |
| 指数型-行业 | 5 | 白酒、新能源、医药 |
| 债券型 | 5 | 纯债/一级/二级 |
| QDII | 5 | 美股、港股、全球 |

### 数据替换指引

**方法一：替换 JSON 数据文件（推荐）**

编辑 `server/data/funds.json`，按以下格式替换基金数据：

```json
{
  "000001": {
    "name": "基金名称",
    "type": "股票型",                              // 一级分类
    "typeDetail": "股票型-主动管理",                // 二级分类（可选）
    "fundScale": "58.47亿份",
    "fundScaleNum": 58.47,
    "manager": "基金经理",
    "establishDate": "2015-06-19",
    "riskLevel": "中高风险",
    "minBuy": "10元",
    "rating": 4,
    "fee": "管理费1.50%/托管费0.25%",
    "nav": 1.2345,
    "change": -0.56,
    "yearReturn": 12.34,
    "monthReturn": 2.34,
    "quarterReturn": 5.67,
    "sixMonthReturn": 8.90,
    "threeYearReturn": 35.20,
    "maxDrawdown": -18.5,
    "volatility": 22.3,
    "sharpeRatio": 0.85,
    "infoRatio": 0.32,
    "managerTenure": 5,
    "managerReturn": 28.5,
    "managerAum": "156.80亿",
    "managerStyle": ["成长精选", "行业轮动"],
    "managerBio": "基金经理简介文字",
    "purchaseFee": [
      { "maxAmount": 100, "rate": "1.50%" },
      { "minAmount": 100, "maxAmount": 500, "rate": "1.00%" }
    ],
    "redeemFee": [
      { "minDays": 0, "maxDays": 7, "rate": "1.50%" },
      { "minDays": 7, "maxDays": 30, "rate": "0.75%" }
    ],
    "managementFee": "1.50%",
    "custodyFee": "0.25%",
    "serviceFee": "0%",
    "industryDistribution": {
      "消费": 35.2,
      "科技": 28.1,
      "医药医疗": 15.3,
      "金融地产": 8.4,
      "新能源": 5.0,
      "其他": 8.0
    },
    "style": {
      "marketCap": "大盘",
      "strategy": "成长"
    },
    "holdings": [
      { "name": "贵州茅台", "ratio": 9.82 },
      { "name": "五粮液", "ratio": 8.15 }
    ]
  }
}
```

**方法二：扩展代码逻辑**

如需动态数据源，修改 `server/src/services/fundService.js`：

1. `getFundList()` — 基金搜索/排序逻辑
2. `fundScreening()` — 筛选条件（行业/风险/星级等）
3. `getFundDetail()` — 单只基金详情合并
4. `getNavHistory()` — 历史净值获取

**净值数据来源**

实时净值通过 `fund-api` 库从天天基金获取。如需要更多历史数据，可在 `getNavHistory` 中调用 `funds.auto.getNavHistory(code)` 获取更长时间范围。

## 部署

详细部署文档请参阅 [DEPLOY.md](DEPLOY.md)，包含：

- GitHub Actions CI/CD 流水线配置
- Docker 多阶段构建 + docker-compose 一键部署
- PM2 进程管理 + Nginx 反向代理
- Secrets 配置说明（GitHub Actions）
- 环境变量参考
- 故障排查指南

### 生产构建

```bash
# 构建前端
cd client
npm run build

# 后端生产启动
cd server
NODE_ENV=production node src/app.js
```

### Docker 一键部署

```bash
# 启动全套服务（应用 + Redis）
docker-compose up -d --build
```

### CI/CD 流水线

| 工作流 | 触发条件 | 功能 |
|--------|---------|------|
| CI (ci.yml) | push/PR 到 main/dev | 代码检查 + 单元测试 + E2E 测试 + 构建验证 |
| CD (deploy.yml) | 打 tag v* 或手动 | SSH 部署到服务器 + 健康检查 + 通知 |
| Docker (docker-deploy.yml) | 打 tag v* | Docker 镜像构建 + 推送 |

### Nginx 配置

参考 `deploy/nginx.conf` 配置反向代理。关键配置：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    root /path/to/client/dist;
    index index.html;

    # API 反向代理
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 前端路由 SPA 支持
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### PM2 部署

```bash
npm install -g pm2
cd deploy
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 优化记录

完整的项目优化历程详见 [CHANGELOG.md](CHANGELOG.md)，包含：

- P0 安全加固：helmet/express-rate-limit/joi/x-powered-by
- P0 性能优化：路由懒加载/Element Plus按需引入/ECharts树摇/Vite分包/Winston日志
- P1 架构优化：Controller层/BusinessError/Pinia/env环境区分
- P2 体验优化：骨架屏/分步加载/汉堡菜单
- 批次1：数据层重构/基金池扩充(16→50)
- 批次2：首页改版(搜索/快捷入口/榜单/市场概览/推荐基金)/排行页/导航优化
- 批次3：基金详情页5Tab(概览/业绩/持仓/经理/费率)/净值走势/行业饼图/风格箱
- 批次4：AI选基功能优化(5档表单/雷达图/四维评分算法/DeepSeek双模式)
- 批次5：智能投顾 Markowitz(资产池/有效前沿/风险等级配置/前端页面)
- 批次6：单元测试(后端114例+前端54例)/E2E测试(4场景)/测试覆盖率
- 批次7：GitHub Actions CI(三段式流水线)/CD(SSH部署+健康检查+通知)/Docker多阶段构建/docker-compose/ESLint/DEPLOY.md

## 免责声明

**本工具所有内容仅为数据参考，不构成任何投资建议。**
**市场有风险，投资需谨慎。历史业绩不代表未来表现。**

- AI 分析结果由 DeepSeek 模型生成或系统自动计算，仅供参考学习
- 基金数据来源于天天基金公开接口，不保证数据的完整性和准确性
- 任何基于本工具的投资决策，风险由使用者自行承担

## 后续可扩展方向

- [x] **智能投顾**：基于 Markowitz 理论优化资产配置 ✅
- [x] **定投策略对比**：多种定投策略（定额/智能定投/均线定投）的收益对比 ✅
- [x] **实时行情**：WebSocket 推送实时净值更新 ✅
- [x] **性能优化**：后端接入 Redis 替代 node-cache，支持多实例 ✅
- [x] **自动化测试**：集成单元测试和 E2E 测试 ✅
- [x] **CI/CD**：接入 GitHub Actions 自动化构建部署 ✅
- [ ] **用户系统**：注册登录、自选基金、投资组合管理
- [ ] **更多数据源**：接入更多基金数据接口，支持实时行情更新
- [ ] **移动端**：使用 UniApp 打包成 H5/小程序
- [ ] **多语言**：国际化支持（i18n）
- [ ] **基金定投自动化**：对接券商接口实现自动定投执行
- [ ] **投资组合再平衡提醒**：定期检测持仓偏离度，发送再平衡建议
- [ ] **资产配置压力测试**：历史极端行情下的组合回测（2008/2015/2020）
- [ ] **热力图展示**：基金/行业/风格的多维度相关性热力图
- [ ] **可转债/REITs 资产扩展**：在资产池中增加可转债基金和 REITs
- [ ] **ESG 评分集成**：接入 ESG 数据源，提供绿色投资筛选
- [ ] **性能监控**：接入 Sentry/APM 监控生产环境性能
- [ ] **灰度发布**：支持多环境分阶段部署

## License

MIT
