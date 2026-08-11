---
date: 2026-08-11
title: "Sutando 入門：最初の Node.js アプリを構築しよう"
tags: [Sutando, Node.js, チュートリアル, ORM, 初心者]
author: Dylan Yu
image: https://storage.sutando.org/og-1751395044936.jpg

---

<PostDetail>

Sutando を初めて使う？このチュートリアルでは、インストールから CRUD API の構築まで、すべてを順を追って説明します。

## 前提条件

- Node.js 18+ がインストール済み
- データベース（MySQL、PostgreSQL、または SQLite）
- 基本的な JavaScript/TypeScript の知識

## ステップ 1：インストール

```bash
mkdir my-app && cd my-app
npm init -y
npm install sutando
```

データベースドライバーをインストール：

```bash
# MySQL
npm install mysql2

# PostgreSQL
npm install pg

# SQLite
npm install better-sqlite3
```

## ステップ 2：データベース設定

`database.ts` ファイルを作成して接続を設定：

```ts
import { sutando } from 'sutando';

sutando.addConnection({
  client: 'mysql2',
  connection: {
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'my_app'
  }
});

export default sutando;
```

### 複数接続の使用

```ts
sutando.addConnection({ /* ... */ }, 'primary');
sutando.addConnection({ /* ... */ }, 'replica');

// 特定の接続を使用
const db = sutando.connection('replica');
```

## ステップ 3：スキーマビルダーでテーブル作成

Sutando にはスキーマビルダーが組み込まれています：

```ts
import { sutando } from './database';

async function setup() {
  await sutando.schema().createTable('users', table => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.string('email').notNullable().unique();
    table.string('password');
    table.timestamps();
  });

  await sutando.schema().createTable('posts', table => {
    table.increments('id').primary();
    table.string('title').notNullable();
    table.text('content');
    table.integer('user_id').unsigned().references('id').inTable('users');
    table.boolean('published').defaultTo(false);
    table.timestamps();
  });
}

setup();
```

## ステップ 4：モデルの定義

モデルは Sutando の心臓部です。各モデルはデータベーステーブルに対応します：

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

class Post extends Model {
  table = 'posts';
  
  casts = {
    published: 'boolean',
  };
  
  relationUser() {
    return this.belongsTo(User, 'user_id');
  }
  
  scopePublished(query) {
    return query.where('published', true);
  }
}

export { User, Post };
```

## ステップ 5：基本的な CRUD 操作

### 作成

```ts
const user = new User();
user.name = 'Alice';
user.email = 'alice@example.com';
user.password = 'hashed_password';
await user.save();

const post = await Post.create({
  title: '最初の投稿',
  content: 'Hello World!',
  user_id: user.id,
  published: true,
});
```

### 読み取り

```ts
const posts = await Post.query().get();
const post = await Post.find(1);

const published = await Post.query()
  .where('published', true)
  .orderBy('created_at', 'desc')
  .limit(10)
  .get();

const count = await Post.query().where('published', true).count();
```

### 更新

```ts
const post = await Post.find(1);
post.title = '更新されたタイトル';
post.published = true;
await post.save();

await Post.query().where('user_id', 1).update({ published: true });
```

### 削除

```ts
const post = await Post.find(1);
await post.delete();

await Post.query().where('published', false).delete();
```

## ステップ 6：リレーションの操作

### 事前読み込み

```ts
const user = await User.query().with('posts').find(1);
console.log(user.posts);

const users = await User.query().with('posts.comments').get();
```

### リレーション先のレコード作成

```ts
const user = await User.find(1);
const post = await user.posts().create({
  title: '新しい投稿',
  content: 'コンテンツ',
});
```

## ステップ 7：すべてを組み合わせる

```ts
import express from 'express';
import './database';
import { User, Post } from './models';

const app = express();
app.use(express.json());

app.get('/posts', async (req, res) => {
  const posts = await Post.query()
    .with('user')
    .published()
    .orderBy('created_at', 'desc')
    .limit(20)
    .get();
  res.json(posts);
});

app.get('/posts/:id', async (req, res) => {
  const post = await Post.query().with('user', 'comments').find(req.params.id);
  if (!post) return res.status(404).json({ error: 'Not found' });
  res.json(post);
});

app.post('/posts', async (req, res) => {
  const post = await Post.create(req.body);
  res.status(201).json(post);
});

app.put('/posts/:id', async (req, res) => {
  const post = await Post.find(req.params.id);
  if (!post) return res.status(404).json({ error: 'Not found' });
  post.fill(req.body);
  await post.save();
  res.json(post);
});

app.delete('/posts/:id', async (req, res) => {
  const post = await Post.find(req.params.id);
  if (!post) return res.status(404).json({ error: 'Not found' });
  await post.delete();
  res.json({ success: true });
});

app.listen(3000, () => console.log('Server running on port 3000'));
```

## 次のステップ

- [モデルリレーション](https://sutando.org/ja/guide/relationships.html)
- [マイグレーション](https://sutando.org/ja/guide/migrations.html)
- [モデルイベント](https://sutando.org/ja/guide/hooks.html)

Sutando を使った Node.js アプリが完成しました。完全なドキュメントは [sutando.org](https://sutando.org/ja/guide/getting-started.html) にあります。

</PostDetail>
