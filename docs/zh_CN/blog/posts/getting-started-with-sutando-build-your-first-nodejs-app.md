---
date: 2026-08-11
title: "Sutando 入门教程：构建你的第一个 Node.js 应用"
type: blog
description: "刚接触 Sutando？本教程将带你从安装到构建一个可用的 CRUD API，一步步上手 Sutando ORM。"
authors: ["Dylan Yu"]
mode: center
---


![image](https://storage.sutando.org/og-1751395044936.jpg

---
刚接触 Sutando？本教程将带你从安装到构建一个可用的 CRUD API，一步步上手 Sutando ORM。

## 前置条件

- Node.js 18+ 已安装
- 一个数据库（MySQL、PostgreSQL 或 SQLite）
- 基本的 JavaScript/TypeScript 知识

## 第 1 步：安装

创建新项目并安装 Sutando：

```bash
mkdir my-app && cd my-app
npm init -y
npm install sutando
```

安装数据库驱动：

```bash
# MySQL
npm install mysql2

# PostgreSQL
npm install pg

# SQLite
npm install better-sqlite3
```

## 第 2 步：数据库配置

创建 `database.ts` 文件配置连接：

```ts
import { sutando } from 'sutando';

sutando.addConnection({
  client: 'mysql2',
  connection: {
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'my_app'
  }
});

export default sutando;
```

### 多连接配置

```ts
sutando.addConnection({ /* ... */ }, 'primary');
sutando.addConnection({ /* ... */ }, 'replica');

// 使用指定连接
const db = sutando.connection('replica');
```

## 第 3 步：用 Schema 构造器创建表

Sutando 内置 Schema 构造器，可以创建和修改表结构：

```ts
import { sutando } from './database';

async function setup() {
  await sutando.schema().createTable('users', table => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.string('email').notNullable().unique();
    table.string('password');
    table.timestamps();
  });

  await sutando.schema().createTable('posts', table => {
    table.increments('id').primary();
    table.string('title').notNullable();
    table.text('content');
    table.integer('user_id').unsigned().references('id').inTable('users');
    table.boolean('published').defaultTo(false);
    table.timestamps();
  });
}

setup();
```

## 第 4 步：定义模型

模型是 Sutando 的核心，每个模型对应一张数据库表：

```ts
import { Model } from 'sutando';

class User extends Model {
  table = 'users';
  
  // 类型转换
  casts = {
    is_admin: 'boolean',
    metadata: 'json',
  };
  
  // 关联
  relationPosts() {
    return this.hasMany(Post, 'user_id');
  }
}

class Post extends Model {
  table = 'posts';
  
  casts = {
    published: 'boolean',
  };
  
  relationUser() {
    return this.belongsTo(User, 'user_id');
  }
  
  // 查询作用域
  scopePublished(query) {
    return query.where('published', true);
  }
}

export { User, Post };
```

## 第 5 步：基础 CRUD 操作

### 创建

```ts
// 创建新用户
const user = new User();
user.name = 'Alice';
user.email = 'alice@example.com';
user.password = 'hashed_password';
await user.save();

// 或使用 create 方法
const post = await Post.create({
  title: '我的第一篇文章',
  content: 'Hello World!',
  user_id: user.id,
  published: true,
});
```

### 查询

```ts
// 获取所有文章
const posts = await Post.query().get();

// 按 ID 查找
const post = await Post.find(1);

// 条件查询
const published = await Post.query()
  .where('published', true)
  .orderBy('created_at', 'desc')
  .limit(10)
  .get();

// 查找第一条匹配
const first = await Post.query().where('title', '我的第一篇文章').first();

// 计数
const count = await Post.query().where('published', true).count();
```

### 更新

```ts
const post = await Post.find(1);
post.title = '更新后的标题';
post.published = true;
await post.save();

// 批量更新
await Post.query().where('user_id', 1).update({ published: true });
```

### 删除

```ts
const post = await Post.find(1);
await post.delete();

// 批量删除
await Post.query().where('published', false).delete();
```

## 第 6 步：使用关联

### 预加载

```ts
// 加载用户及其文章（总共 2 次查询）
const user = await User.query().with('posts').find(1);
console.log(user.posts); // Post 模型数组

// 嵌套预加载
const users = await User.query()
  .with('posts.comments')
  .get();
```

### 创建关联记录

```ts
const user = await User.find(1);
const post = await user.posts().create({
  title: '新文章',
  content: '内容',
});
```

### 查询关联

```ts
const user = await User.find(1);
const publishedPosts = await user.posts().where('published', true).get();
```

## 第 7 步：整合到一起

完整的 Express API：

```ts
import express from 'express';
import './database';
import { User, Post } from './models';

const app = express();
app.use(express.json());

// 文章列表
app.get('/posts', async (req, res) => {
  const posts = await Post.query()
    .with('user')
    .published()
    .orderBy('created_at', 'desc')
    .limit(20)
    .get();
  res.json(posts);
});

// 文章详情
app.get('/posts/:id', async (req, res) => {
  const post = await Post.query()
    .with('user', 'comments')
    .find(req.params.id);
  if (!post) return res.status(404).json({ error: 'Not found' });
  res.json(post);
});

// 创建文章
app.post('/posts', async (req, res) => {
  const post = await Post.create(req.body);
  res.status(201).json(post);
});

// 更新文章
app.put('/posts/:id', async (req, res) => {
  const post = await Post.find(req.params.id);
  if (!post) return res.status(404).json({ error: 'Not found' });
  post.fill(req.body);
  await post.save();
  res.json(post);
});

// 删除文章
app.delete('/posts/:id', async (req, res) => {
  const post = await Post.find(req.params.id);
  if (!post) return res.status(404).json({ error: 'Not found' });
  await post.delete();
  res.json({ success: true });
});

app.listen(3000, () => console.log('服务器运行在 3000 端口'));
```

## 下一步

- [模型关联](https://sutando.org/zh_CN/guide/relationships.html) — 掌握 `hasMany`、`belongsTo` 等
- [数据库迁移](https://sutando.org/zh_CN/guide/migrations.html) — 版本控制你的表结构
- [模型事件](https://sutando.org/zh_CN/guide/events.html) — 在模型生命周期中插入逻辑

你现在已经有了一个可用的 Sutando Node.js 应用。完整文档请访问 [sutando.org](https://sutando.org/zh_CN/guide/getting-started.html)。