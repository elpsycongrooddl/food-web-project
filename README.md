# 美食厨房 - FoodChose

一个面向厨师和吃货的菜谱分享与点餐平台。

## 功能特点

### 👩🍳 厨师端
- 浏览和搜索主流菜谱网站数据
- 添加自制菜谱（名称、做法、食材、调料）
- 维护菜谱价格（支持任意支付形式：元、拳、家务等）
- 查看吃货用户的下单内容
- 备菜清单管理
- 个人中心：管理收藏/创建的菜谱

### 🍔 吃货端
- 浏览厨师发布的菜谱
- 点菜下单
- 线下支付后线上确认
- 个人中心：查看历史订单

## 技术栈

- **前端框架**: React 18
- **构建工具**: Vite 5
- **UI 组件库**: Ant Design 5
- **路由**: React Router 6
- **后端**: Supabase
- **表单验证**: Formik + Yup

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置 Supabase

1. 在 [Supabase](https://supabase.com/) 创建一个新项目
2. 创建以下数据库表：

```sql
-- users 表
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  email TEXT NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('chef', 'foodie')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- recipes 表
CREATE TABLE recipes (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  ingredients TEXT,
  steps TEXT,
  price NUMERIC,
  price_type TEXT,
  chef_id TEXT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- orders 表
CREATE TABLE orders (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- order_items 表
CREATE TABLE order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT REFERENCES orders(id),
  recipe_id BIGINT REFERENCES recipes(id),
  quantity INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);
```

3. 更新 `src/supabase.js` 文件中的配置：

```javascript
const supabaseUrl = 'https://ebtcpxgszzyedmdthebv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVidGNweGdzenp5ZWRtZHRoZWJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1NDI0MDYsImV4cCI6MjA5NDExODQwNn0.QR5InKGwA3vx9WtjyScTmUcbxQkzY4pxe43jooNvlXA'
```

### 3. 启动开发服务器

```bash
npm run dev
```

### 4. 构建生产版本

```bash
npm run build
```

## 项目结构

```
foodChose/
├── src/
│   ├── pages/
│   │   ├── Home.jsx        # 首页（厨师/吃货不同视图）
│   │   ├── Login.jsx       # 登录页
│   │   ├── Register.jsx    # 注册页
│   │   └── Profile.jsx     # 个人中心
│   ├── supabase.js         # Supabase 配置
│   ├── App.jsx             # 应用入口
│   ├── main.jsx            # React 渲染入口
│   └── index.css           # 全局样式
├── index.html              # HTML 模板
├── vite.config.js          # Vite 配置
├── jsconfig.json           # JavaScript 路径别名配置
└── package.json            # 项目依赖配置
```

## 路由结构

| 路径 | 组件 | 说明 |
|------|------|------|
| `/` | Home | 首页（需登录） |
| `/login` | Login | 登录页 |
| `/register` | Register | 注册页 |
| `/profile` | Profile | 个人中心（需登录） |

## 移动端适配

项目已针对移动端进行适配，支持响应式布局。

## 许可证

MIT License