---
date: 2026-09-08
title: "Objection.js 的现代替代方案：迁移到 Sutando"
tags: [Objection.js, Sutando, Node.js, ORM, 迁移, Knex]
author: Dylan Yu
image: https://storage.sutando.org/og-1751395044936.jpg
---

![image](https://storage.sutando.org/og-1751395044936.jpg)

---

<PostDetail>

Objection.js 多年来一直是 Node.js 生态中流行的 ORM。基于 Knex.js 构建，它提供了灵活的、SQL 友好的数据库操作方式。但随着原作者宣布不再维护，TypeScript 支持也落后于时代，许多团队开始寻找现代替代方案。本指南将带你从 Objection.js 迁移到 Sutando。

## 为什么离开 Objection.js？

Objection.js 仍然是一个可用的库，但以下几个因素让迁移值得考虑：

### 维护状态

在 [GitHub 讨论区](https://github.com/Vincit/objection.js/discussions/2463) 中，原作者 Sami Koskimäki 宣布不再积极维护该项目：

- **没有活跃维护者**：项目的 bus factor 极高，唯一的维护者已经离开
- **没有新功能**：只有社区 fork 在接收更新
- **发布缓慢**：补丁版本之间间隔数月，甚至更久

### TypeScript 支持

Objection.js 设计于 TypeScript 普及之前。类型系统可以工作，但需要手动声明类型，无法提供现代 TypeScript 优先 ORM 的无缝类型推断。

### 没有内置迁移

Objection.js 完全依赖 Knex 进行迁移。虽然 Knex 很可靠，但你需要管理两个独立的工具，它们有不同的 API 和心智模型。

## 为什么选择 Sutando？

Sutando 是一个现代的 Node.js Active Record ORM，灵感来自 Laravel 的 Eloquent。它解决了 Objection.js 用户面临的痛点：

| 特性 | Objection.js | Sutando |
|------|-------------|---------|
| 模式 | Query Builder + ORM | Active Record |
| TypeScript | 手动类型 | 一等公民 TS 支持 |
| 迁移 | 通过 Knex（独立工具） | 内置 schema builder |
| 维护 | 停滞 | 活跃 |
| 关联 | `withGraphFetched` | `with()`, `hasMany()`, `belongsTo()` |
| 软删除 | 手动实现 | 内置 |
| 钩子 | `$beforeInsert` 等 | `creating`, `saved` 等 |
| 作用域 | 手动实现 | 内置 |

## 概念映射：Objection.js → Sutando

### 模型

**Objection.js:**
```typescript
import { Model } from 'objection';
import knex from 'knex';

const db = knex({
  client: 'pg',
  connection: process.env.DATABASE_URL,
});

Model.knex(db);

class User extends Model {
  static tableName = 'users';
  
  static jsonSchema = {
    type: 'object',
    required: ['name', 'email'],
    properties: {
      id: { type: 'integer' },
      name: { type: 'string', minLength: 1, maxLength: 255 },
      email: { type: 'string', format: 'email' },
    },
  };
  
  static relationMappings = {
    posts: {
      relation: Model.HasManyRelation,
      modelClass: Post,
      join: { from: 'users.id', to: 'posts.user_id' },
    },
  };
}
```

**Sutando:**
```typescript
import { sutando, Model } from 'sutando';

const db = sutando({
  client: 'pg',
  connection: process.env.DATABASE_URL,
});

class User extends Model {
  protected table = 'users';
  
  protected fillable = ['name', 'email'];
  
  posts(): HasMany {
    return this.hasMany(Post);
  }
}
```

### 查询

**Objection.js:**
```typescript
// 简单查询
const users = await User.query().where('age', '>', 18);

// 带关联
const user = await User.query()
  .withGraphFetched('[posts.comments]')
  .findById(1);

// 插入
const user = await User.query().insert({ name: 'Alice', email: 'alice@example.com' });

// 更新
await User.query().patch({ name: 'Bob' }).where('id', 1);

// 删除
await User.query().deleteById(1);
```

**Sutando:**
```typescript
// 简单查询
const users = await User.query().where('age', '>', 18).get();

// 带关联
const user = await User.query().with('posts.comments').find(1);

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

### 关联

**Objection.js** 使用 `relationMappings` 声明式对象语法：

```typescript
static relationMappings = {
  posts: {
    relation: Model.HasManyRelation,
    modelClass: Post,
    join: { from: 'users.id', to: 'posts.user_id' },
  },
  profile: {
    relation: Model.BelongsToOneRelation,
    modelClass: Profile,
    join: { from: 'users.profile_id', to: 'profiles.id' },
  },
};
```

**Sutando** 使用基于方法的定义，类似 Eloquent：

```typescript
posts(): HasMany {
  return this.hasMany(Post);
}

profile(): BelongsTo {
  return this.belongsTo(Profile);
}
```

### 事务

**Objection.js:**
```typescript
await User.transaction(async (trx) => {
  const user = await User.query(trx).insert({ name: 'Alice' });
  await Post.query(trx).insert({ title: 'Hello', user_id: user.id });
});
```

**Sutando:**
```typescript
await db.transaction(async () => {
  const user = new User({ name: 'Alice' });
  await user.save();
  
  const post = new Post({ title: 'Hello', user_id: user.id });
  await post.save();
});
```

### 钩子 / 事件

**Objection.js:**
```typescript
class User extends Model {
  static tableName = 'users';
  
  $beforeInsert() {
    this.created_at = new Date().toISOString();
  }
  
  $beforeUpdate() {
    this.updated_at = new Date().toISOString();
  }
}
```

**Sutando:**
```typescript
import { Model } from 'sutando';

class User extends Model {
  protected table = 'users';
  
  static creating(model: User) {
    model.created_at = new Date();
  }
  
  static updating(model: User) {
    model.updated_at = new Date();
  }
}
```

## 逐步迁移指南

### 第 1 步：安装 Sutando

```bash
npm install sutando
```

### 第 2 步：设置数据库连接

创建 `db.ts` 文件：

```typescript
import { sutando } from 'sutando';

export const db = sutando({
  client: 'pg',
  connection: process.env.DATABASE_URL,
});

export default db;
```

### 第 3 步：逐步转换模型

不需要一次性迁移所有内容。两个 ORM 可以在同一个项目中共存：

1. 先转换最简单的模型（没有复杂关联的）
2. 再转换有 `hasMany` / `belongsTo` 关联的模型
3. 最后转换有复杂图操作的模型

### 第 4 步：迁移数据库迁移

如果你在使用 Knex 迁移，Sutando 的 schema builder 是兼容的：

```typescript
import { schema } from 'sutando';

exports.up = function (schema) {
  return schema.createTable('users', (table) => {
    table.increments('id');
    table.string('name');
    table.string('email').unique();
    table.timestamps();
  });
};

exports.down = function (schema) {
  return schema.dropTableIfExists('users');
};
```

### 第 5 步：替换查询

遍历代码库，将 Objection.js 查询替换为 Sutando 等价代码。主要变化：

- Objection 的 `Model.query()` 返回查询构建器；Sutando 中需要链式调用 `.get()` 或 `.first()` 来执行
- `withGraphFetched('[posts.comments]')` 变成 `with('posts.comments')`
- `insert()` / `patch()` / `deleteById()` 变成 Active Record 风格的 `save()` / `delete()`

## 迁移后你获得了什么

- **Active Record 模式**：不再需要分离的查询构建器和模型——直接操作模型实例
- **内置软删除**：在模型中添加 `softDeletes()` 即可获得 `deleted_at` 自动处理
- **内置作用域**：通过 `scope` 方法定义可复用的查询过滤器
- **一等公民 TypeScript**：类型推断与基于类的模型自然配合
- **Eloquent 风格 API**：如果你用过 Laravel，学习曲线几乎为零
- **活跃维护**：定期发布和新功能

## 结论

Objection.js 为 Node.js 社区做出了贡献，但它的维护状态和 TypeScript 局限性使其成为长期项目的隐患。Sutando 提供了一个熟悉的、维护良好的替代方案，Active Record 模式减少了样板代码，提升了开发体验。

迁移可以增量进行——两个 ORM 可以共存，你逐个模型地过渡。今天就从一个模型开始，亲自感受差异。

👉 [开始使用 Sutando](https://sutando.org/zh_CN/guide/getting-started.html) 或运行 `npm install sutando` 来试试。

</PostDetail>
