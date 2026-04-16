# dashboard

dashboard 是一个基于 Vue 3 和 Vite 的经营看板前端，已经从通用模板演化为业务项目页面。当前只有一个主路由 /，页面包含公司经营指标、公司本部指标、生产部门概览、风险提示和聊天问答入口。

## 技术栈

- Vue 3
- Vite 6
- Vue Router 4
- Tailwind CSS 4
- Chart.js
- Axios
- Flatpickr

## 当前功能

- 公司整体经营指标卡片和趋势展示
- 公司本部经营指标卡片
- 生产部门经营概览与明细弹窗
- 经营问题预警面板
- 经营分析聊天机器人入口

主页面入口在 [src/pages/Dashboard.vue](src/pages/Dashboard.vue)，聊天组件在 [src/components/ChatBot.vue](src/components/ChatBot.vue)。

## 安装依赖

推荐使用 pnpm，因为仓库中已经提交了 pnpm-lock.yaml。

```powershell
pnpm install
```

如果 PowerShell 对脚本执行有限制，也可以使用：

```powershell
pnpm.cmd install
```

## 本地开发

### 1. 配置后端地址

前端通过 [src/utils/Utils.js](src/utils/Utils.js) 读取环境变量：

- VITE_SERVER_BASE_URL
- VITE_API_BASE_URL

当前代码默认回退为：

- SERVER_BASE_URL = http://localhost:5000
- API_BASE_URL = http://localhost:5000/api

但 eppei_backend 默认通常运行在 8000 端口，所以本地联调时建议显式配置。

可以在项目根目录创建 .env.local，并写入：

```env
VITE_SERVER_BASE_URL=http://127.0.0.1:8000
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

### 2. 启动开发服务器

```powershell
pnpm run dev
```

默认由 Vite 启动本地开发服务。

### 3. 生产构建

```powershell
pnpm run build
pnpm run preview
```

## 与后端的接口关系

该项目会直接请求 eppei_backend 暴露的 HTTP 接口，没有内置代理。

### 经营看板接口

主要使用以下后端接口：

- GET /api/dates
- GET /api/organizations
- GET /api/company-lastyear
- GET /api/department-performance
- GET /api/department-cost-stack
- GET /api/unit-performance
- GET /api/performance-analysis/issues

### 聊天机器人接口

聊天组件会调用：

- GET /api/chat/suggestions/
- GET /api/chat/learning-stats/
- GET /api/chat/metrics/accuracy/
- GET /api/chat/metrics/feedback/
- POST /api/chat/query/
- POST /api/chat/feedback/

如果这些接口返回 404 或跨域错误，优先检查前端环境变量是否正确指向后端服务。

## 项目结构

```text
dashboard/
├─ src/
│  ├─ components/              # 聊天、日期选择、弹窗、通用组件
│  ├─ pages/                   # 页面入口
│  ├─ partials/dashboard/      # 经营卡片和图表模块
│  ├─ charts/                  # Chart.js 封装
│  ├─ utils/                   # 全局配置和工具函数
│  └─ router.js                # 当前仅配置根路由
├─ public/
├─ package.json
├─ vite.config.js
└─ README.md
```

## 开发说明

- 当前路由配置在 [src/router.js](src/router.js)，仅包含根路径
- 后端地址配置在 [src/utils/Utils.js](src/utils/Utils.js)
- 页面没有配置 Vite 代理，所以所有接口地址都依赖环境变量或默认值
- 看板和聊天都依赖后端真实数据，单独启动前端时部分区域会因接口不可用而无数据显示

## 常见问题

1. 页面能打开但没有数据：检查后端是否启动，以及 VITE_API_BASE_URL 是否指向正确端口
2. 聊天组件报网络错误：确认 eppei_backend 已启动，并且 /api/chat/query/ 可访问
3. PowerShell 无法执行 pnpm：改用 pnpm.cmd install 和 pnpm.cmd run dev
4. 构建后静态站点接口仍然请求错误地址：重新检查构建时使用的环境变量

## 联调建议

推荐本地启动方式：

1. 在 eppei_backend 中启动 Django：py manage.py runserver 0.0.0.0:8000
2. 在 dashboard 中设置 .env.local 指向 8000 端口
3. 再启动前端开发服务

这样可以避免默认 5000 端口导致的接口请求失败。

