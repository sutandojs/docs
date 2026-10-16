---
date: 2026-09-29
title: "Sutando でデータベースマイグレーション：完全ガイド"
type: blog
description: "データベーススキーマの管理は、アプリケーション開発において重要な要素です。Sutando のスキーマビルダーとマイグレーション機能を使って、バージョン管理可能なスキーマ管理を実現しましょう。"
authors: ["Dylan Yu"]
mode: center
---


データベーススキーマの管理は、アプリケーション開発において重要な要素です。Sutando のスキーマビルダーとマイグレーション機能を使って、バージョン管理可能なスキーマ管理を実現しましょう。

## スキーマビルダーの基本

Sutando のスキーマビルダーは、Knex.js の上に構築されており、データベースに依存しないスキーマ操作を提供します。

### テーブルの作成

```ts
import { sutando } from 'sutando';

await sutando.schema().createTable('users', table => {
  table.increments('id').primary();
  table.string('name').notNullable();
  table.string('email').notNullable().unique();
  table.string('password');
  table.boolean('is_admin').defaultTo(false);
  table.timestamps();
});
```

### カラムタイプ

```ts
await sutando.schema().createTable('posts', table => {
  table.increments('id').primary();
  table.string('title', 200).notNullable();
  table.text('content');
  table.integer('user_id').unsigned().references('id').inTable('users');
  table.boolean('published').defaultTo(false);
  table.json('metadata');
  table.timestamp('published_at').nullable();
  table.timestamps();
});
```

### テーブルの変更

```ts
await sutando.schema().alterTable('users', table => {
  table.string('avatar').nullable();
  table.dropColumn('password');
  table.renameColumn('name', 'display_name');
});
```

### テーブルの削除

```ts
await sutando.schema().dropTableIfExists('old_table');
```

## マイグレーションファイル

Sutando では、マイグレーションをファイルとして管理できます：

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
// migrations/002_create_posts_table.ts
import { sutando } from 'sutando';

export async function up() {
  await sutando.schema().createTable('posts', table => {
    table.increments('id').primary();
    table.string('title').notNullable();
    table.text('content');
    table.integer('user_id').unsigned().references('id').inTable('users');
    table.boolean('published').defaultTo(false);
    table.timestamps();
  });
}

export async function down() {
  await sutando.schema().dropTableIfExists('posts');
}
```

## インデックス

```ts
await sutando.schema().alterTable('posts', table => {
  table.index(['user_id', 'published'], 'posts_user_published_index');
});
```

## 外部キー

```ts
await sutando.schema().createTable('comments', table => {
  table.increments('id').primary();
  table.text('content').notNullable();
  table.integer('post_id').unsigned()
    .references('id').inTable('posts')
    .onDelete('CASCADE');
  table.integer('user_id').unsigned()
    .references('id').inTable('users');
  table.timestamps();
});
```

## まとめ

Sutando のスキーマビルダーを使えば、データベースに依存しないマイグレーションを簡単に作成できます。バージョン管理とロールバック機能で、チーム開発でも安全にスキーマを管理できます。

[ドキュメント](https://sutando.org/ja/guide/migrations.html) でさらに詳しく。