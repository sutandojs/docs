---
date: 2026-09-29
title: "Database Migrations with Sutando: A Complete Guide"
type: blog
description: "Database migrations are version control for your schema. Sutando includes a powerful schema builder that lets you create and modify tables…"
authors: ["Dylan Yu"]
mode: center
---


![image](https://storage.sutando.org/og-1751395044936.jpg)

---
Database migrations are version control for your schema. Sutando includes a powerful schema builder that lets you create and modify tables programmatically. This guide covers everything from creating your first table to running migrations in production.

## The Schema Builder

Sutando's schema builder provides a fluent API for table manipulation:

```ts
import { sutando } from 'sutando';

// Create a table
await sutando.schema().createTable('users', table => {
  table.increments('id').primary();
  table.string('name').notNullable();
  table.string('email').notNullable().unique();
  table.string('password');
  table.boolean('active').defaultTo(true);
  table.timestamps();
});

// Modify an existing table
await sutando.schema().table('users', table => {
  table.string('avatar').nullable();
  table.integer('role_id').unsigned().references('id').inTable('roles');
});

// Drop a table
await sutando.schema().dropTableIfExists('old_table');
```

## Column Types

| Method | SQL Type |
|--------|---------|
| `increments('id')` | AUTO_INCREMENT INTEGER |
| `string('name')` | VARCHAR(255) |
| `text('content')` | TEXT |
| `integer('views')` | INTEGER |
| `bigInteger('count')` | BIGINT |
| `boolean('active')` | BOOLEAN / TINYINT |
| `decimal('price', 10, 2)` | DECIMAL(10, 2) |
| `date('birthday')` | DATE |
| `datetime('published_at')` | DATETIME |
| `timestamp('created_at')` | TIMESTAMP |
| `json('metadata')` | JSON / TEXT |
| `uuid('uuid')` | UUID / CHAR(36) |

## Column Modifiers

```ts
await sutando.schema().createTable('products', table => {
  table.increments('id').primary();
  table.string('name').notNullable();
  table.string('sku').unique();
  table.decimal('price', 10, 2).defaultTo(0);
  table.text('description').nullable();
  table.integer('category_id').unsigned().references('id').inTable('categories');
  table.timestamps();
  table.softDeletes();
});
```

## Foreign Keys

```ts
await sutando.schema().createTable('posts', table => {
  table.increments('id').primary();
  table.string('title').notNullable();
  table.integer('user_id').unsigned();
  
  // Foreign key
  table.foreign('user_id')
    .references('id')
    .inTable('users')
    .onDelete('CASCADE')
    .onUpdate('CASCADE');
});

// Add foreign key to existing table
await sutando.schema().table('posts', table => {
  table.foreign('category_id').references('id').inTable('categories');
});

// Drop foreign key
await sutando.schema().table('posts', table => {
  table.dropForeign('posts_category_id_foreign');
});
```

## Indexes

```ts
await sutando.schema().createTable('users', table => {
  table.increments('id').primary();
  table.string('email').unique();
  table.string('name');
  
  // Single column index
  table.index('name');
  
  // Composite index
  table.index(['status', 'created_at']);
});
```

## Organizing Migrations

For larger projects, organize migrations as separate files:

```
migrations/
  001_create_users_table.ts
  002_create_posts_table.ts
  003_create_comments_table.ts
  004_add_avatar_to_users.ts
```

```ts
// migrations/001_create_users_table.ts
import { sutando } from 'sutando';

export async function up() {
  await sutando.schema().createTable('users', table => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.string('email').notNullable().unique();
    table.timestamps();
  });
}

export async function down() {
  await sutando.schema().dropTableIfExists('users');
}
```

```ts
// run-migrations.ts
import * as migration1 from './migrations/001_create_users_table';
import * as migration2 from './migrations/002_create_posts_table';

const migrations = [migration1, migration2];

async function run() {
  for (const m of migrations) {
    await m.up();
    console.log(`Ran: ${m.name}`);
  }
}

run();
```

## Production Best Practices

1. **Always have a `down` function** — so you can rollback
2. **Test migrations on a staging database first**
3. **Back up your database before running migrations in production**
4. **Never use `dropTable` in production without `IfExists`**
5. **Add indexes thoughtfully** — they speed up reads but slow down writes

## Conclusion

Sutando's schema builder gives you full control over your database schema with a clean, chainable API. Whether you're creating tables, adding columns, or managing foreign keys, it's all straightforward and readable.

Learn more in the [Sutando documentation](https://sutando.org/guide/migrations).