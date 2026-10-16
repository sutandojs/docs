---
date: 2026-11-10
title: "Node.js ORM 入门教程：用 Sutando 构建你的第一个应用"
type: blog
description: "如果你刚开始接触 Node.js 的数据库操作，这篇教程就是为你准备的。我们将从零开始，用 Sutando 构建一个完整的应用，涵盖安装、配置、模型定义、CRUD 操作和关联查询。"
authors: ["Dylan Yu"]
mode: center
---


如果你刚开始接触 Node.js 的数据库操作，这篇教程就是为你准备的。我们将从零开始，用 Sutando 构建一个完整的应用，涵盖安装、配置、模型定义、CRUD 操作和关联查询。

## 什么是 ORM？

ORM（对象关系映射）让你用代码对象操作数据库，而不是直接写 SQL。比如，不用写 `SELECT * FROM users WHERE active = 1`，而是写：

```ts
const users = await User.query().where('active', true).get();
```

Sutando 使用 Active Record 模式，每个模型类对应一张表，每个实例代表一行记录。

## 第 1 步：安装

```bash
mkdir my-app && cd my-app
npm init -y
npm install sutando mysql2
```

## 第 2 步：连接数据库

创建 `db.ts`：

```ts
import { sutando } from 'sutando';

sutando.addConnection({
  client: 'mysql2',
  connection: {
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '你的密码',
    database: 'my_app'
  }
});

export default sutando;
```

## 第 3 步：创建表

用 Schema 构造器创建表：

```ts
import sutando from './db';

async function setup() {
  await sutando.schema().createTable('users', table => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.string('email').notNullable().unique();
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

  console.log('表创建成功');
}

setup();
```

运行 `npx tsx db.ts` 创建表。

## 第 4 步：定义模型

创建 `models.ts`：

```ts
import { Model } from 'sutando';

class User extends Model {
  table = 'users';
  
  // 定义关联：一个用户有多篇文章
  relationPosts() {
    return this.hasMany(Post, 'user_id');
  }
}

class Post extends Model {
  table = 'posts';
  
  // 类型转换
  casts = {
    published: 'boolean',
  };
  
  // 定义关联：一篇文章属于一个用户
  relationUser() {
    return this.belongsTo(User, 'user_id');
  }
  
  // 查询作用域：只查已发布的
  scopePublished(query) {
    return query.where('published', true);
  }
}

export { User, Post };
```

## 第 5 步：CRUD 操作

### 创建

```ts
import { User, Post } from './models';

// 方式一：实例化后保存
const user = new User();
user.name = '张三';
user.email = 'zhangsan@example.com';
await user.save();

// 方式二：用 create 方法
const post = await Post.create({
  title: '我的第一篇文章',
  content: 'Hello World!',
  user_id: user.id,
  published: true,
});
```

### 查询

```ts
// 查询所有
const allPosts = await Post.query().get();

// 条件查询
const published = await Post.query()
  .where('published', true)
  .orderBy('created_at', 'desc')
  .limit(10)
  .get();

// 按 ID 查找
const post = await Post.find(1);

// 使用作用域
const publishedPosts = await Post.query().published().get();

// 预加载关联（避免 N+1 问题）
const users = await User.query().with('posts').get();
// users[0].posts → 该用户的所有文章
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

## 第 6 步：关联操作

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

### 嵌套预加载

```ts
// 一次查询加载用户 → 文章 → 评论 → 评论作者
const users = await User.query()
  .with('posts.comments.user')
  .get();
```

## 第 7 步：完整 API 示例

```ts
import express from 'express';
import './db';
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
  const post = await Post.query().with('user').find(req.params.id);
  if (!post) return res.status(404).json({ error: '文章不存在' });
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
  if (!post) return res.status(404).json({ error: '文章不存在' });
  post.fill(req.body);
  await post.save();
  res.json(post);
});

// 删除文章
app.delete('/posts/:id', async (req, res) => {
  const post = await Post.find(req.params.id);
  if (!post) return res.status(404).json({ error: '文章不存在' });
  await post.delete();
  res.json({ success: true });
});

app.listen(3000, () => console.log('服务器运行在 http://localhost:3000'));
```

## 常见问题

### 什么是 N+1 问题？

```ts
// 不好：N+1 查询（1 次查用户 + N 次查每个用户的文章）
const users = await User.query().get();
for (const user of users) {
  console.log(await user.posts); // 每个用户一次查询
}

// 好：2 次查询
const users = await User.query().with('posts').get();
```

### 什么是查询作用域？

作用域是可复用的查询条件，避免到处重复写 `where('published', true)`：

```ts
// 定义
scopePublished(query) {
  return query.where('published', true);
}

// 使用
const posts = await Post.query().published().get();
```

### 什么是模型事件？

在模型创建、更新、删除时自动执行的逻辑：

```ts
Post.creating(async (post) => {
  post.slug = post.title.toLowerCase().replace(/\s+/g, '-');
});
```

## 下一步

- [模型关联文档](https://sutando.org/zh_CN/guide/relationships.html)
- [数据库迁移文档](https://sutando.org/zh_CN/guide/migrations.html)
- [软删除和事件文档](https://sutando.org/zh_CN/guide/soft-deletes.html)

你现在已经有了一个完整的 Sutando 应用。完整文档请访问 [sutando.org](https://sutando.org/zh_CN/guide/getting-started.html)。