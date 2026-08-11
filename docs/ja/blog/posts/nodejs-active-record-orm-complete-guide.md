---
date: 2026-08-18
title: "Node.js Active Record ORM 完全ガイド"
tags: [Node.js, ORM, Active Record, Sutando, ガイド]
author: Dylan Yu
image: https://storage.sutando.org/og-1751395044936.jpg

---

<PostDetail>

Node.js で Active Record パターンの ORM を探しているなら、このガイドはあなたのためのものです。Active Record の基本から Sutando を使った実践的な使い方まで、すべてカバーします。

## Active Record パターンとは？

Active Record は、データベースの各行をモデルオブジェクトとして表現するデザインパターンです。モデルインスタンスは一行のデータを保持し、保存、更新、削除などの操作を直接行えます。

```ts
// Active Record の例
const user = new User();
user.name = '山田太郎';
user.email = 'yamada@example.com';
await user.save(); // データベースに保存
```

対照的に、Data Mapper パターン（Prisma など）では、エンティティとマッパーが分離されています：

```ts
// Data Mapper の例（Prisma）
const user = await prisma.user.create({
  data: { name: '山田太郎', email: 'yamada@example.com' }
});
```

Active Record の利点はシンプルさと直感性です。Laravel の Eloquent や Ruby on Rails の ActiveRecord がこのパターンを採用しています。

## なぜ Node.js で Active Record なのか？

Node.js エコシステムには多くの ORM がありますが、Active Record パターンをちゃんと実装しているものは少ないです：

- **Prisma** — Data Mapper パターン、スキーマファースト
- **Drizzle** — SQL ファースト、軽量
- **TypeORM** — Active Record をサポートしているが、デコレーター依存とメンテナンス問題あり
- **Sutando** — Active Record パターン、Eloquent ライクな API

Sutando は、Laravel Eloquent の開発体験を Node.js にもたらすために作られました。

## Sutando の主な機能

### 1. シンプルなモデル定義

デコレーター不要、プレーンなクラスプロパティでモデルを定義：

```ts
import { Model } from 'sutando';

class User extends Model {
  table = 'users';
  
  casts = {
    is_admin: 'boolean',
    metadata: 'json',
  };
  
  relationPosts() {
    return this.hasMany(Post, 'user_id');
  }
}
```

### 2. 直感的なクエリビルダー

メソッドチェーンでクエリを構築：

```ts
// 公開済みの記事を最新順で取得
const posts = await Post.query()
  .where('published', true)
  .orderBy('created_at', 'desc')
  .limit(10)
  .get();

// リレーションを事前読み込み（N+1 問題を回避）
const users = await User.query().with('posts').get();
```

### 3. リレーション管理

hasMany、belongsTo、hasOne、belongsToMany など、一般的なリレーションタイプをサポート：

```ts
class User extends Model {
  table = 'users';
  relationPosts() { return this.hasMany(Post, 'user_id'); }
}

class Post extends Model {
  table = 'posts';
  relationUser() { return this.belongsTo(User, 'user_id'); }
}

// 使用例
const user = await User.find(1);
const posts = await user.posts; // ユーザーの記事を取得
```

### 4. ソフトデリート

`deleted_at` カラムを追加するだけで、論理削除が有効になります：

```ts
import { Model, SoftDeletes } from 'sutando';

class Post extends Model {
  use = [SoftDeletes];
  table = 'posts';
}

await post.delete(); // ソフトデリート（deleted_at に日付を設定）
await post.forceDelete(); // 完全に削除
```

### 5. モデルイベント（フック）

モデルのライフサイクルにフックできます：

```ts
Post.creating(async (post) => {
  post.slug = post.title.toLowerCase().replace(/\s+/g, '-');
});

Post.updating(async (post) => {
  post.updated_at = new Date();
});
```

### 6. クエリスコープ

再利用可能なクエリ条件を定義：

```ts
class Post extends Model {
  scopePublished(query) {
    return query.where('published', true);
  }
}

// 使用例
const posts = await Post.query().published().get();
```

## 実践例：ブログ API

### セットアップ

```bash
npm install sutando mysql2 express
```

### データベース設定

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

### モデル定義

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

// 作成
app.post('/posts', async (req, res) => {
  const post = new Post();
  post.title = req.body.title;
  post.content = req.body.content;
  post.user_id = req.body.userId;
  await post.save();
  res.json(post);
});

// 一覧取得（リレーション事前読み込み）
app.get('/posts', async (req, res) => {
  const posts = await Post.query()
    .with('author', 'comments')
    .orderBy('created_at', 'desc')
    .limit(20)
    .get();
  res.json(posts);
});

// 個別取得
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

// 削除
app.delete('/posts/:id', async (req, res) => {
  const post = await Post.find(req.params.id);
  if (!post) return res.status(404).json({ error: 'Not found' });
  await post.delete();
  res.json({ success: true });
});

app.listen(3000);
```

## まとめ

Active Record パターンは、特に Laravel や Rails の経験がある開発者にとって、最も直感的な ORM パターンです。Sutando はこのパターンを Node.js でもたらし、デコレーター不要のクリーンな API と豊富な機能を提供します。

次のステップ：
- [スタートガイド](https://sutando.org/ja/guide/getting-started.html)
- [モデルリレーション](https://sutando.org/ja/guide/relationships.html)
- [マイグレーション](https://sutando.org/ja/guide/migrations.html)

</PostDetail>
