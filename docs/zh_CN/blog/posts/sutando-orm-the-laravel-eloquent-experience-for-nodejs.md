---
date: 2025-07-02
title: "Sutando ORM：为 Node.js 带来 Laravel Eloquent 的开发体验"
type: blog
description: "Sutando ORM 与 Laravel Eloquent 一脉相承——相同的方法、命名和约定——同时可以在 Node.js 生态中的任何地方运行，无需绑定全栈框架。"
authors: ["Dylan Yu"]
mode: center
---


![image](https://storage.sutando.org/og-1751395044936.jpg)

---
## 你熟悉的 Active Record，现在来到了 JavaScript {#你熟悉的-active-record-现在来到了-javascript}

> **Sutando ORM** 与 Laravel Eloquent 一脉相承——相同的方法、命名和约定——同时可以在 Node.js 生态中的任何地方运行，无需绑定全栈框架。

## 几乎可以无缝替换 Laravel Eloquent

如果你写过 Eloquent 查询，你就已经会使用 Sutando 了：

```ts
// models/User.ts
import { Model, Attribute } from 'sutando';

export class User extends Model {
  table = 'users';

  // cast
  casts = {
    metadata: 'json',
  }

  // 

  // attribute
  attributeFullName() {
    return Attribute.make({
      get: () => {
        return this.first_name + ' ' + this.last_name;
      },
    });
  }

  // relation
  relationPosts() {
    return this.hasMany(Post);
  }
}

const users = await User.query().with('posts').get();
```

- 相同的关联方法（`hasMany`、`belongsTo`、`morphTo` 等）
- 可链式调用的查询构造器，支持 `where`、`orderBy`、`limit`、`with`、`has`、`whereHas` 等
- 软删除、事件、全局作用域和预加载的工作方式与 Laravel 完全一致
- 迁移、工厂和种子遵循相同的理念——从 PHP 迁移轻而易举

## 框架无关设计——与 AdonisJS 对比 {#框架无关设计——与-adonisjs-对比}

**AdonisJS** 这类全栈方案自带 Lucid ORM，在你全面采用该框架时表现出色。**Sutando 则走了一条不同的路**：

| 特性 | Sutando ORM | AdonisJS Lucid |
|---------|-------------|----------------|
| 框架依赖 | 无——可接入 Express、Fastify、Next.js、Cloudflare Workers、Bun 或任何其他环境 | 与 AdonisJS 紧密集成 |
| 迁移到现有项目 | 即插即用；无需重写你的服务器 | 需要采用 AdonisJS 的约定 |

这种解耦设计让你可以逐步引入 Sutando——加到现有的 Express API、React 服务端中，甚至如果你更喜欢它的 API，也可以集成到 AdonisJS 项目里。


## 流畅的查询构造器示例

```ts
const latestActive = await User.query()
  .with('posts.comments')
  .where('status', 'active')
  .orderBy('created_at', 'desc')
  .limit(10)
  .get();
```

就像在 Laravel 中一样，这段代码读起来就像一句话——没有多余的样板代码，不需要重新适应新的思维模式。

## 强大的插件与生命周期钩子

需要软删除、多租户或自动时间戳？写一次，到处适用：

```ts
User.saving(async (model) => {
  model.last_updated_at = new Date();
});
```

## 快速开始

```bash
npm install sutando --save
```

配置你的数据库，创建你的第一个模型，然后运行查询——无需框架迁移。完整文档请访问 **https://sutando.org/zh_CN/guide/getting-started**。

```ts
import { sutando, Model } from 'sutando';

// 添加数据库连接信息
sutando.addConnection({
  client: 'mysql2',
  connection: {
    host : '127.0.0.1',
    port : 3306,
    user : 'root',
    password : '',
    database : 'test'
  },
});

const db = sutando.connection();

// 使用查询构造器
const users = await sutando.table('users').where('votes', '>', 100).get();
// 或
const users = await db.table('users').where('votes', '>', 100).get();

// 使用 Schema 构造器
await sutando.schema().createTable('users', table => {
  table.increments('id').primary();
  table.integer('votes');
  table.timestamps();
});

// 使用 ORM
class User extends Model {}
const users = await User.query().where('votes', '>', 100).get();
```

## 更快地开发，保持灵活性 {#更快地开发-保持灵活性}

Sutando ORM 带来了 Laravel 爱好者钟爱的 Eloquent 开发体验，同时保持架构的开放性。无论你是在升级 JavaScript 代码库、尝试 Serverless 架构，还是只是想要一个用起来顺手的 Active Record，Sutando 都已准备好为你的下一个应用赋能——无需框架。