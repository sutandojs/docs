---
date: 2026-08-04
title: "Node.js Active Record ORM 完整指南"
tags: [Node.js, ORM, Active Record, TypeScript, Database]
author: Dylan Yu
image: https://storage.sutando.org/og-1751395044936.jpg
---

![image](https://storage.sutando.org/og-1751395044936.jpg)

---

<PostDetail>

Active Record 是最直观的数据库交互模式之一。如果你用过 Laravel 的 Eloquent 或 Ruby on Rails，你就已经知道它有多高效。在本指南中，我们将探讨什么是 Active Record、它与其他 ORM 模式的区别，以及如何在 Node.js 中使用 Sutando 来实践这一模式。

## 什么是 Active Record 模式？

Active Record 是一种设计模式，每个模型类对应一张数据库表，每个实例代表一行记录。模型本身负责持久化——你直接在实例上调用 `save()`、`delete()`、`update()` 等方法。

```ts
const user = new User();
user.name = 'Alice';
user.email = 'alice@example.com';
await user.save(); // INSERT INTO users ...
```

这与 Data Mapper 模式（如 Prisma、TypeORM 的 EntityRepository 或 Java 的 Hibernate）有本质区别——后者由独立的映射器/仓库层来处理数据库操作：

```ts
// Data Mapper 风格（如 Prisma）
const user = await prisma.user.create({
  data: { name: 'Alice', email: 'alice@example.com' }
});
```

### Active Record vs Data Mapper：哪个更好？

没有绝对的"更好"，各有取舍：

| 维度 | Active Record | Data Mapper |
|--------|--------------|-------------|
| 简洁性 | 高——方法直接在模型上 | 中等——需要独立的仓库层 |
| 可测试性 | 好——可以 mock 模型方法 | 优秀——可以注入仓库 |
| 耦合度 | 模型知道数据库的存在 | 模型不感知持久化层 |
| 学习曲线 | 低，适合初学者 | 较高——概念更多 |
| 最适合 | 快速开发、CRUD 应用 | 复杂领域、企业级应用 |

对于大多数 Node.js 项目——尤其是 API、SaaS 产品和原型开发——Active Record 的简洁性是巨大优势。你写的代码更少，迭代更快，认知负担更低。

## Node.js 中的 Active Record 实现

Node.js 生态有几个 Active Record 实现：

### 1. Sutando ORM

[Sutando](https://sutando.org/zh_CN/guide/getting-started.html) 是 Laravel Eloquent 在 Node.js 中最忠实的移植。它支持 MySQL、PostgreSQL 和 SQLite，功能包括：

- 流畅的查询构造器，支持 `where`、`orderBy`、`with`（预加载）
- 模型关联：`hasMany`、`belongsTo`、`hasOne`、`morphTo`
- 软删除、模型事件/钩子、全局作用域
- 数据库迁移和 Schema 构造器
- 工厂和种子用于测试

```ts
import { Model } from 'sutando';

class User extends Model {
  table = 'users';
  
  relationPosts() {
    return this.hasMany(Post);
  }
}

// 查询
const users = await User.query().where('active', true).get();

// 创建
const user = new User();
user.name = 'Alice';
await user.save();

// 关联
const user = await User.query().with('posts').find(1);
```

### 2. AdonisJS Lucid

Lucid 是 AdonisJS 框架内置的 ORM，同样是 Active Record 风格，也受 Eloquent 启发。但它与 AdonisJS 生态紧密耦合——无法在独立的 Express 或 Fastify 项目中使用。

### 3. TypeORM（Active Record 模式）

TypeORM 同时支持 Active Record 和 Data Mapper 两种模式。在 Active Record 模式下，模型继承 `BaseEntity`：

```ts
import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from 'typeorm';

@Entity()
class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;
  
  @Column()
  name: string;
}

const user = new User();
user.name = 'Alice';
await user.save();
```

TypeORM 可以用，但它严重依赖装饰器，而且因维护问题和 TypeScript 装饰器的不稳定性受到批评。

## 用 Active Record 构建 CRUD 应用

让我们用 Sutando 构建一个简单的博客 API，演示 Active Record 的实际用法。

### 安装

```bash
npm install sutando mysql2 express
```

### 数据库配置

```ts
import { sutando } from 'sutando';

sutando.addConnection({
  client: 'mysql2',
  connection: {
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'blog'
  }
});
```

### 定义模型

```ts
import { Model } from 'sutando';

class Post extends Model {
  table = 'posts';
  
  relationAuthor() {
    return this.belongsTo(User, 'user_id');
  }
  
  relationComments() {
    return this.hasMany(Comment);
  }
}

class Comment extends Model {
  table = 'comments';
  
  relationPost() {
    return this.belongsTo(Post);
  }
}

class User extends Model {
  table = 'users';
  
  relationPosts() {
    return this.hasMany(Post, 'user_id');
  }
}
```

### CRUD 操作

```ts
import express from 'express';
const app = express();
app.use(express.json());

// 创建
app.post('/posts', async (req, res) => {
  const post = new Post();
  post.title = req.body.title;
  post.content = req.body.content;
  post.user_id = req.body.userId;
  await post.save();
  res.json(post);
});

// 查询列表（带预加载）
app.get('/posts', async (req, res) => {
  const posts = await Post.query()
    .with('author', 'comments')
    .orderBy('created_at', 'desc')
    .limit(20)
    .get();
  res.json(posts);
});

// 查询单条
app.get('/posts/:id', async (req, res) => {
  const post = await Post.query().with('author', 'comments').find(req.params.id);
  if (!post) return res.status(404).json({ error: 'Not found' });
  res.json(post);
});

// 更新
app.put('/posts/:id', async (req, res) => {
  const post = await Post.find(req.params.id);
  if (!post) return res.status(404).json({ error: 'Not found' });
  post.title = req.body.title;
  post.content = req.body.content;
  await post.save();
  res.json(post);
});

// 删除
app.delete('/posts/:id', async (req, res) => {
  const post = await Post.find(req.params.id);
  if (!post) return res.status(404).json({ error: 'Not found' });
  await post.delete();
  res.json({ success: true });
});

app.listen(3000);
```

## 高级 Active Record 功能

### 预加载

Active Record 最强大的功能之一是预加载——在单次查询中加载关联，避免 N+1 问题：

```ts
// 不好：N+1 查询
const users = await User.query().get();
for (const user of users) {
  const posts = await user.posts; // 每个用户一次查询
}

// 好：总共 2 次查询
const users = await User.query().with('posts').get();
```

### 查询作用域

作用域让你定义可复用的查询约束：

```ts
class Post extends Model {
  scopePublished(query) {
    return query.where('published', true);
  }
}

// 使用
const posts = await Post.query().published().get();
```

### 模型事件

在模型生命周期中插入自定义逻辑：

```ts
Post.creating(async (post) => {
  post.slug = post.title.toLowerCase().replace(/\s+/g, '-');
});

Post.deleting(async (post) => {
  await post.comments.delete(); // 级联删除
});
```

## 何时选择 Active Record

**Active Record 适合以下场景：**

- 你希望快速开发，尽量少写样板代码
- 你的应用以 CRUD 为主
- 你从 Laravel、Rails 等框架迁移过来
- 你重视代码的可读性和自文档化
- 你在构建原型或 MVP

**考虑 Data Mapper 的场景：**

- 你有复杂的领域逻辑，需要与持久化层解耦
- 你在构建大型企业应用，需要严格关注点分离
- 你需要轻松替换持久化层

## 总结

Active Record 仍然是 Node.js 中最高产的数据库交互模式之一。通过 Sutando，你可以获得忠实的 Eloquent 风格体验——框架无关、轻量且直观。无论你是从 Laravel 迁移还是开始新的 Node.js 项目，Active Record + Sutando 都能让你专注于业务逻辑，而不是与 ORM 搏斗。

准备好试试了吗？查看 [Sutando 文档](https://sutando.org/zh_CN/guide/getting-started.html) 或运行 `npm install sutando` 立即开始。

</PostDetail>
