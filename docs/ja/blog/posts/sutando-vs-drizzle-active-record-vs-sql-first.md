---
date: 2026-08-25
title: "Sutando vs Drizzle：Active Record と SQL ファーストの対決"
tags: [Sutando, Drizzle, Node.js, ORM, 比較]
author: Dylan Yu
image: https://storage.sutando.org/og-1751395044936.jpg

---

<PostDetail>

Sutando と Drizzle は、Node.js の ORM として異なるアプローチを代表しています。Sutando は Active Record パターンで開発速度を重視し、Drizzle は SQL ファーストで最大限の制御を提供します。

## 核心的な違い

| 側面 | Sutando | Drizzle |
|---------|---------|---------|
| パターン | Active Record | SQL ビルダー |
| スキーマ | モデルクラス | スキーマ定義ファイル |
| クエリ | メソッドチェーン | SQL ライクな API |
| リレーション | 宣言的メソッド | 手動 JOIN |
| ランタイム | ゼロオーバーヘッド | ゼロオーバーヘッド |
| 学習曲線 | 低い（Eloquent ライク） | 中程度（SQL 知識が必要） |

## スキーマ定義

```ts
// Sutando: モデルクラスで定義
class User extends Model {
  table = 'users';
  casts = { is_admin: 'boolean' };
  relationPosts() { return this.hasMany(Post, 'user_id'); }
}

// Drizzle: スキーマファイルで定義
import { pgTable, serial, varchar, boolean } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name').notNull(),
  email: varchar('email').notNull().unique(),
  is_admin: boolean('is_admin').default(false),
});
```

## クエリの比較

### 基本的なクエリ

```ts
// Sutando
const users = await User.query()
  .where('is_admin', true)
  .orderBy('created_at', 'desc')
  .get();

// Drizzle
const result = await db.select()
  .from(users)
  .where(eq(users.is_admin, true))
  .orderBy(desc(users.created_at));
```

### リレーション

```ts
// Sutando: ネストされたリレーションを1行で
const users = await User.query()
  .with('posts.comments.author')
  .get();

// Drizzle: 複数の JOIN が必要
const result = await db.select()
  .from(users)
  .leftJoin(posts, eq(users.id, posts.userId))
  .leftJoin(comments, eq(posts.id, comments.postId))
  .leftJoin(authors, eq(comments.authorId, authors.id));
```

## Sutando の利点

### 1. リレーション管理

Sutando の最大の利点です。Drizzle ではすべてのクエリで明示的な JOIN が必要ですが、Sutando は宣言的なリレーションメソッドで処理します。

### 2. 組み込みのソフトデリート

```ts
// Sutando: deleted_at カラムを追加するだけ
class Post extends Model {
  use = [SoftDeletes];
}
await post.delete(); // ソフトデリート
await post.forceDelete(); // 完全削除
```

Drizzle ではすべてのクエリで手動フィルタリングが必要です。

### 3. 開発速度

CRUD アプリケーションにおいて、Sutando は大幅に少ないコードで済みます。

## Drizzle の利点

### 1. SQL の完全な制御

複雑なクエリやパフォーマンスが重要な場面で、Drizzle は SQL に近い制御を提供します。

### 2. エッジ環境でのパフォーマンス

Drizzle は Cloudflare Workers や Vercel Edge などのエッジ環境で非常に軽量に動作します。

### 3. 型安全性

スキーマから完全な型を生成するため、クエリ結果の型推論が強力です。

## どちらを選ぶべきか？

**Sutando を選ぶ場合：**
- CRUD 中心のアプリケーション
- リレーション管理をシンプルにしたい
- Laravel Eloquent の経験がある
- 開発速度を重視する

**Drizzle を選ぶ場合：**
- SQL の完全な制御が必要
- エッジ環境でのパフォーマンスが重要
- 複雑なクエリが多い
- チームが SQL に精通している

## 結論

Sutando は開発速度を、Drizzle は制御力を優先します。CRUD アプリなら Sutando、複雑なクエリが中心なら Drizzle が適しています。

Sutando を試す：`npm install sutando` — [ドキュメント](https://sutando.org/ja/guide/getting-started.html)

</PostDetail>
