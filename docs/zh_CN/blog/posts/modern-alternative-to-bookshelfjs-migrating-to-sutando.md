---
date: 2026-09-15
title: "Bookshelf.js 的现代替代方案：迁移到 Sutando"
type: blog
description: "Bookshelf.js 曾经是 Node.js 开发者的首选 ORM，它在 Knex.js 之上提供了简单、基于 Promise 的接口。但自 2022 年以来没有更新，没有 TypeScript 支持，社区也已经转移，是时候考虑现代替代方案了。本指南将带你从 Bookshelf.js 迁移到…"
authors: ["Dylan Yu"]
mode: center
---


<img src="https://storage.sutando.org/og-1751395044936.jpg" alt="" width="1200" height="630" loading="lazy" />

---

Bookshelf.js 曾经是 Node.js 开发者的首选 ORM，它在 Knex.js 之上提供了简单、基于 Promise 的接口。但自 2022 年以来没有更新，没有 TypeScript 支持，社区也已经转移，是时候考虑现代替代方案了。本指南将带你从 Bookshelf.js 迁移到 Sutando。

## Bookshelf.js 的现状

Bookshelf.js 自 2022 年 6 月发布 1.2.0 版本以来再没有新版本。多个迹象表明它实际上已被放弃：

- **多年未发布**：npm 包自 2022 年以来未更新
- **没有 TypeScript 支持**：库是纯 CommonJS JavaScript，没有内置类型——需要单独安装 `@types/bookshelf`
- **社区共识**：npm-compare、SaaSHub 和多篇博客都将 Bookshelf 描述为"遗留"或"维护模式"
- **StackOverflow 问题**：开发者积极提问["有没有积极维护的 Bookshelf.js 替代品？"](https://stackoverflow.com/questions/74914728/is-there-an-actively-maintained-replacement-for-bookshelf-js)

## 为什么选择 Sutando？

Sutando 是一个现代的 Node.js Active Record ORM，灵感来自 Laravel 的 Eloquent。以下是与 Bookshelf.js 的对比：

| 特性 | Bookshelf.js | Sutando |
|------|-------------|---------|
| 模式 | Active Record（Collection 基础） | Active Record（Model 基础） |
| TypeScript | 无（需要 `@types/bookshelf`） | 一等公民 TS 支持 |
| 模块系统 | CommonJS (`require`) | ESM + CommonJS |
| 迁移 | 通过 Knex（独立工具） | 内置 schema builder |
| 最后发布 | 2022 | 活跃 |
| 关联 | `forge().fetch()` | `hasMany()`, `belongsTo()` |
| 软删除 | 手动实现 | 内置 |
| 钩子 | `initialize` 事件 | `creating`, `saved` 等 |
| 作用域 | 手动实现 | 内置 |

## 概念映射：Bookshelf.js → Sutando

### 初始化

**Bookshelf.js:**
```typescript
import knex from 'knex';
import bookshelf from 'bookshelf';

const knexInstance = knex({
  client: 'pg',
  connection: process.env.DATABASE_URL,
});

const db = bookshelf(knexInstance);
db.plugin('registry');
db.plugin('virtuals');
db.plugin('pagination');
```

**Sutando:**
```typescript
import { sutando } from 'sutando';

sutando.addConnection({
  client: 'pg',
  connection: process.env.DATABASE_URL,
});

export default sutando;
```

不需要插件——virtuals、pagination 和 registry 类似的行为都是内置的。

### 模型

**Bookshelf.js:**
```typescript
const User = db.model('User', {
  tableName: 'users',
  
  posts() {
    return this.hasMany('Post');
  },
  
  profile() {
    return this.belongsTo('Profile');
  },
});

// 或使用 extend
const User = db.Model.extend({
  tableName: 'users',
  
  posts() {
    return this.hasMany('Post');
  },
});
```

**Sutando:**
```typescript
import { Model } from 'sutando';

class User extends Model {
  protected table = 'users';
  
  relationPosts() {
    return this.hasMany(Post);
  }
  
  relationProfile() {
    return this.belongsTo(Profile);
  }
}
```

### 查询

**Bookshelf.js:**
```typescript
// 获取全部
const users = await new User().fetch();

// 带关联获取
const user = await new User({ id: 1 }).fetch({
  withRelated: ['posts.comments'],
});

// 条件查询
const users = await User.where('age', '>', 18).fetch();

// 插入
const user = await new User({ name: 'Alice', email: 'alice@example.com' }).save();

// 更新
const user = await new User({ id: 1 }).fetch();
user.set('name', 'Bob');
await user.save();

// 删除
const user = await new User({ id: 1 }).fetch();
await user.destroy();
```

**Sutando:**
```typescript
// 获取全部
const users = await User.query().get();

// 带关联获取
const user = await User.query().with('posts.comments').find(1);

// 条件查询
const users = await User.query().where('age', '>', 18).get();

// 插入
const user = new User({ name: 'Alice', email: 'alice@example.com' });
await user.save();

// 更新
const user = await User.query().find(1);
user.name = 'Bob';
await user.save();

// 删除
const user = await User.query().find(1);
await user.delete();
```

### 分页

**Bookshelf.js** 需要分页插件：
```typescript
db.plugin('pagination');

const results = await new User().fetchPage({
  page: 1,
  pageSize: 20,
});
// results.models, results.pagination
```

**Sutando** 内置分页：
```typescript
const results = await User.query().paginate(1, 20);
// results.items(), results.total(), results.currentPage(), results.perPage()
```

### 事务

**Bookshelf.js:**
```typescript
await db.transaction(async (t) => {
  const user = await new User({ name: 'Alice' }).save(null, { transacting: t });
  await new Post({ title: 'Hello', user_id: user.id }).save(null, { transacting: t });
});
```

**Sutando:**
```typescript
const db = sutando.connection();

await db.transaction(async (trx) => {
  const user = new User({ name: 'Alice' });
  await user.save({ client: trx });
  
  const post = new Post({ title: 'Hello', user_id: user.id });
  await post.save({ client: trx });
});
```

### 钩子 / 事件

**Bookshelf.js:**
```typescript
const User = db.Model.extend({
  tableName: 'users',
  
  initialize() {
    this.on('saving', this.onSaving);
  },
  
  onSaving(model, attrs, options) {
    model.set('updated_at', new Date());
  },
});
```

**Sutando:**
```typescript
class User extends Model {
  protected table = 'users';
  
  static booted() {
    this.saving(model => {
      model.updated_at = new Date();
    });
  }
}
```

## 逐步迁移指南

### 第 1 步：安装 Sutando

```bash
npm install sutando
```

### 第 2 步：替换数据库连接

用 Sutando 替换 Bookshelf 初始化：

```typescript
import { sutando } from 'sutando';

sutando.addConnection({
  client: 'pg',
  connection: process.env.DATABASE_URL,
});

export default sutando;
```

移除 `bookshelf` 和 `@types/bookshelf` 包：

```bash
npm uninstall bookshelf @types/bookshelf
```

### 第 3 步：将模型从 `extend` 转换为 ES6 类

Bookshelf 的 `Model.extend()` 模式应转换为 ES6 类语法：

- `tableName` → `protected table`
- `hasMany('Post')` → `this.hasMany(Post)`（使用类引用，不是字符串名称）
- `belongsTo('Profile')` → `this.belongsTo(Profile)`
- `initialize()` 配合事件监听 → 在 `static booted()` 中注册 `saving`、`creating` 等钩子

### 第 4 步：更新查询模式

查询模式的主要变化：

- `new User().fetch()` → `User.query().get()`
- `new User({ id: 1 }).fetch({ withRelated: [...] })` → `User.query().with('...').find(1)`
- `model.set('key', value)` → `model.key = value`（直接属性赋值）
- `model.destroy()` → `model.delete()`
- `.fetchPage()` → `.paginate()`

### 第 5 步：迁移数据库迁移

如果你在使用 Knex 迁移，它们也兼容 Sutando 的 schema builder：

```javascript
const { Migration } = require('sutando');

module.exports = class extends Migration {
  async up(schema) {
    await schema.createTable('users', (table) => {
      table.increments('id');
      table.string('name');
      table.string('email').unique();
      table.timestamps();
    });
  }

  async down(schema) {
    await schema.dropTableIfExists('users');
  }
};
```

## 迁移后你获得了什么

- **一等公民 TypeScript**：不再需要 `@types/bookshelf`——类型内置且准确
- **ESM 支持**：原生使用 `import`/`export`，不再需要 `require()`
- **无需插件**：分页、虚拟字段和 registry 都是内置功能
- **直接属性访问**：`user.name = 'Bob'` 代替 `user.set('name', 'Bob')`
- **内置软删除**：用 `SoftDeletes` 插件（`compose(Model, SoftDeletes)`）即可——无需手动实现
- **内置作用域**：定义可复用的查询过滤器，无需自定义插件
- **Eloquent 风格 API**：用过 Laravel 的人都熟悉
- **活跃维护**：定期更新和新功能

## 结论

Bookshelf.js 在它的时代是一个优秀的 ORM，但自 2022 年停止更新且没有 TypeScript 支持，它已成为现代 Node.js 项目的隐患。Sutando 提供了自然的升级路径——相同的 Active Record 模式，但有一等公民 TypeScript 支持、Bookshelf 中需要插件的内置功能，以及活跃维护的代码库。

迁移过程简单直接：将模型从 `extend()` 转换为 ES6 类，更新查询模式，移除 Bookshelf 依赖。两个 ORM 在过渡期间可以共存，因此你可以逐个模型地迁移。

👉 [开始使用 Sutando](https://sutando.org/zh_CN/guide/getting-started) 或运行 `npm install sutando` 来试试。
