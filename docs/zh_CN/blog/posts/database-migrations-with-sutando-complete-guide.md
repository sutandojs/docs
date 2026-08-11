---
date: 2026-09-29
title: "Sutando 数据库迁移完整指南"
tags: [Sutando, Database, Migrations, Schema, Node.js]
author: Dylan Yu
image: https://storage.sutando.org/og-1751395044936.jpg

---

<PostDetail>

数据库迁移是表结构的版本控制。Sutando 内置强大的 Schema 构造器，可以用代码创建和修改表。

## Schema 构造器

```ts
import { sutando } from 'sutando';

// 创建表
await sutando.schema().createTable('users', table => {
  table.increments('id').primary();
  table.string('name').notNullable();
  table.string('email').notNullable().unique();
  table.timestamps();
});

// 修改表
await sutando.schema().table('users', table => {
  table.string('avatar').nullable();
});

// 删除表
await sutando.schema().dropTableIfExists('old_table');
```

## 列类型

| 方法 | SQL 类型 |
|--------|---------|
| `increments('id')` | AUTO_INCREMENT INTEGER |
| `string('name')` | VARCHAR(255) |
| `text('content')` | TEXT |
| `integer('views')` | INTEGER |
| `boolean('active')` | BOOLEAN |
| `decimal('price', 10, 2)` | DECIMAL(10, 2) |
| `json('metadata')` | JSON |
| `timestamp('created_at')` | TIMESTAMP |

## 外键

```ts
await sutando.schema().createTable('posts', table => {
  table.increments('id').primary();
  table.integer('user_id').unsigned();
  table.foreign('user_id')
    .references('id')
    .inTable('users')
    .onDelete('CASCADE');
});
```

## 索引

```ts
table.index('name');
table.index(['status', 'created_at']);
```

## 组织迁移文件

```
migrations/
  001_create_users_table.ts
  002_create_posts_table.ts
  003_add_avatar_to_users.ts
```

```ts
export async function up() {
  await sutando.schema().createTable('users', table => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.timestamps();
  });
}

export async function down() {
  await sutando.schema().dropTableIfExists('users');
}
```

## 生产环境最佳实践

1. **始终写 `down` 函数**——以便回滚
2. **先在 staging 数据库测试**
3. **生产环境跑迁移前备份数据库**
4. **谨慎添加索引**——加速读取但减慢写入

了解更多请查看 [Sutando 文档](https://sutando.org/zh_CN/guide/migrations.html)。

</PostDetail>
