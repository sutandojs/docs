---
date: 2026-09-08
title: "Sutando vs Drizzle：Active Record 与 SQL 优先的对决"
tags: [Sutando, Drizzle, Node.js, ORM, Comparison]
author: Dylan Yu
image: https://storage.sutando.org/og-1751395044936.jpg
---

![image](https://storage.sutando.org/og-1751395044936.jpg)

---

<PostDetail>

Drizzle ORM 已经成为追求 SQL 级别控制和 TypeScript 类型安全的开发者的首选。Sutando 则走相反的路线——将 Active Record 的优雅带入 Node.js。让我们正面对比一下。

## 核心区别

- **Drizzle** 是 SQL 优先的：查询构造器镜像 SQL 语法，schema 用 TypeScript 定义，看起来像 `CREATE TABLE`
- **Sutando** 是 Active Record 优先的：模型是类，有 `save()`、`delete()` 和 `hasMany()` 等方法

Drizzle 说："如果你懂 SQL，你就懂 Drizzle。"
Sutando 说："如果你懂 Laravel Eloquent，你就懂 Sutando。"

## Schema 定义

**Drizzle:**
```ts
import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow(),
});
```

**Sutando:**
```ts
import { Model } from 'sutando';

class User extends Model {
  table = 'users';
  
  relationPosts() {
    return this.hasMany(Post, 'user_id');
  }
}
```

Drizzle 的 schema 更接近 SQL，Sutando 的模型更接近业务领域。

## 查询对比

### 关联查询

**Drizzle:**
```ts
const result = await db.select()
  .from(users)
  .leftJoin(posts, eq(users.id, posts.userId))
  .where(eq(users.id, 1));
```

**Sutando:**
```ts
const user = await User.query().with('posts').find(1);
// user.posts 是 Post 模型数组
```

关键区别：Drizzle 要求你手写 join，Sutando 通过预加载自动处理关联。

## 功能对比

| 功能 | Sutando | Drizzle |
|---------|---------|---------|
| 模式 | Active Record | SQL 查询构造器 |
| 关联 | `hasMany`、`belongsTo`、`morphTo` | 手动 join |
| 预加载 | `with('posts.comments')` | 手动配置 join |
| 模型事件 | 内置 | 无 |
| 软删除 | 内置 | 无 |
| 包体积 | 小 | 极小（~7.4kb min+gzip） |
| Raw SQL | 通过查询构造器 | 一等公民 `sql` 模板标签 |
| 类型安全 | 基于类 | 从 schema 推断 |

## Sutando 的优势

### 1. 关联管理

这是 Sutando 最大的优势。Drizzle 中管理关联需要每次查询都写 join，Sutando 通过声明式关联方法自动处理：

```ts
// Sutando：一行搞定嵌套关联
const users = await User.query()
  .with('posts.comments.author')
  .get();
```

### 2. 模型生命周期

```ts
User.creating(async (user) => {
  user.password = await bcrypt.hash(user.password, 10);
});
```

Drizzle 没有类似功能——你需要在每个查询外包裹自定义逻辑。

### 3. 快速开发

对于 CRUD 应用，Sutando 需要的代码量明显更少。

### 4. 内置软删除

```ts
const posts = await Post.query().onlyTrashed().get();
await post.delete(); // 软删除
await post.forceDelete(); // 硬删除
```

## Drizzle 的优势

### 1. SQL 控制

如果你需要精确控制生成的 SQL，Drizzle 无可匹敌。

### 2. 包体积

Drizzle 极其轻量（~7.4kb min+gzip），对 Cloudflare Workers 的严格体积限制来说很重要。

### 3. 性能

Drizzle 直接生成 SQL，开销极小。在基准测试中始终优于其他 ORM。

### 4. 类型安全的 Raw SQL

Drizzle 的 `sql` 模板标签让你写原生 SQL 的同时保持列引用的类型安全。

### 5. Serverless 优先

Drizzle 为 Serverless 时代而生，与 Turso、Neon、Supabase 等现代无服务器数据库无缝协作。

## 何时选择 Sutando

- 你的应用有复杂的关联关系
- 你想要 Active Record 的生产力
- 你需要模型事件、软删除或作用域
- 你从 Laravel 或 Rails 迁移过来

## 何时选择 Drizzle

- 你想要完全的 SQL 控制
- 你在为 Cloudflare Workers 或边缘运行时构建
- 包体积至关重要
- 你习惯写 join

## 总结

Drizzle 和 Sutando 服务于不同需求。Drizzle 适合热爱 SQL、想要最小抽象的开发者。Sutando 适合想要 Active Record 优雅和自动关联管理的开发者。如果你的应用关联密集且重视开发速度，Sutando 是更好的选择。如果你需要 SQL 级别的控制和最小开销，选 Drizzle。

试试 Sutando：`npm install sutando`——或阅读[文档](https://sutando.org/zh_CN/guide/getting-started.html)。

</PostDetail>
