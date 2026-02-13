# Kanban Board 部署指南

## 📋 專案簡介
這是 Sabrina & 小鄭 的溝通工具，使用 React + Vite + TailwindCSS + Supabase。

## 🚀 快速部署

### 1. Supabase 設置

1. 打開 [Supabase Dashboard](https://supabase.com/dashboard)
2. 進入你的專案 `fastwork-db`
3. 點擊 **SQL Editor**
4. 複製並執行 `supabase-setup.sql` 中的 SQL 語法

### 2. 獲取環境變量

在 Supabase 專案設定中找到：
- **Project URL** → `VITE_SUPABASE_URL`
- **anon public key** → `VITE_SUPABASE_ANON_KEY`

### 3. 本地運行

```bash
cd kanban-board
cp .env.example .env
# 編輯 .env 填入你的 Supabase 資訊
npm install
npm run dev
```

訪問 http://localhost:5173

### 4. 部署到 Vercel

#### 方法一：GitHub（推薦）

1. **推送 Git**
```bash
cd kanban-board
git init
git add .
git commit -m "Init kanban with Supabase"
gh repo create kanban-board --public --source=. --push
```

2. **Vercel 部署**
- 訪問 [Vercel Dashboard](https://vercel.com/dashboard)
- 點擊 **Add New...** → **Project**
- 選擇 `kanban-board` repo
- 點擊 **Environment Variables**
- 添加：
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- 點擊 **Deploy**

#### 方法二：Vercel CLI

```bash
npm i -g vercel
vercel
# 按提示登入並部署
```

## 📁 專案結構

```
kanban-board/
├── src/
│   ├── App.jsx         # 主要元件
│   ├── main.jsx        # 入口點
│   ├── supabase.js     # Supabase 客戶端
│   └── index.css       # TailwindCSS
├── index.html
├── vite.config.js
├── tailwind.config.js
├── vercel.json
├── supabase-setup.sql  # 資料庫設置
└── .env.example
```

## 🔧 功能說明

- 📋 待辦 / 🔥 進行中 / ✅ 完成
- ➕ 新增任務（標題 + 描述 + 優先級）
- 🖱️ 拖拽移動任務
- 🔴🟡🟢 優先級標籤
- ☁️ 雲端同步（Supabase）
- 📱 響應式設計

## 🎨 自定義

修改 `src/App.jsx` 來自定義：
- 欄位標題
- 顏色主題
- 優先級選項

## 📝 備注

- 資料會同步到 Supabase 雲端
- 清除瀏覽器暫存不會影響資料
- 手機和電腦可以看到同一份資料
