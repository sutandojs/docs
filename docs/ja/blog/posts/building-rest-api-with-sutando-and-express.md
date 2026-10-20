---
date: 2026-09-15
title: "Sutando と Express で REST API を構築する"
type: blog
description: "Sutando と Express を使って、本格的な REST API を構築する方法を解説します。バリデーション、エラーハンドリング、リレーション、ページネーションまでカバーします。"
authors: ["Dylan Yu"]
mode: center
---


Sutando と Express を使って、本格的な REST API を構築する方法を解説します。バリデーション、エラーハンドリング、リレーション、ページネーションまでカバーします。

## セットアップ

```bash
mkdir blog-api && cd blog-api
npm init -y
npm install sutando mysql2 express
npm install zod  # バリデーション用
```

## データベース設定

```ts
import { sutando } from 'sutando';

sutando.addConnection({
  client: 'mysql2',
  connection: {
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'blog_api'
  }
});

export default sutando;
```

## モデル定義

```ts
import { Model, compose, SoftDeletes } from 'sutando';

class User extends Model {
  table = 'users';
  hidden = ['password'];
  
  relationPosts() {
    return this.hasMany(Post, 'user_id');
  }
}

class Post extends compose(Model, SoftDeletes) {
  table = 'posts';
  casts = { published: 'boolean' };
  
  relationUser() {
    return this.belongsTo(User, 'user_id');
  }
  
  relationComments() {
    return this.hasMany(Comment);
  }
  
  scopePublished(query) {
    return query.where('published', true);
  }
}

class Comment extends Model {
  table = 'comments';
  
  relationUser() {
    return this.belongsTo(User, 'user_id');
  }
}

export { User, Post, Comment };
```

## API ルート

```ts
import express from 'express';
import { z } from 'zod';
import './database';
import { User, Post, Comment } from './models';

const app = express();
app.use(express.json());

// 記事一覧（ページネーション付き）
app.get('/posts', async (req, res) => {
  const page = Number(req.query.page) || 1;
  const posts = await Post.query()
    .with('user')
    .published()
    .orderBy('created_at', 'desc')
    .paginate(page, 15);
  res.json(posts);
});

// 記事詳細
app.get('/posts/:id', async (req, res) => {
  const post = await Post.query()
    .with('user', 'comments.user')
    .find(req.params.id);
  if (!post) return res.status(404).json({ error: '記事が見つかりません' });
  res.json(post);
});

// 記事作成
const createPostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  user_id: z.number().int().positive(),
  published: z.boolean().optional(),
});

app.post('/posts', async (req, res) => {
  const parsed = createPostSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.issues });
  }
  const post = await Post.query().create(parsed.data);
  res.status(201).json(post);
});

// 記事更新
app.put('/posts/:id', async (req, res) => {
  const post = await Post.query().find(req.params.id);
  if (!post) return res.status(404).json({ error: '記事が見つかりません' });
  post.fill(req.body);
  await post.save();
  res.json(post);
});

// 記事削除（ソフトデリート）
app.delete('/posts/:id', async (req, res) => {
  const post = await Post.query().find(req.params.id);
  if (!post) return res.status(404).json({ error: '記事が見つかりません' });
  await post.delete();
  res.json({ success: true });
});

// コメント作成
app.post('/posts/:id/comments', async (req, res) => {
  const post = await Post.query().find(req.params.id);
  if (!post) return res.status(404).json({ error: '記事が見つかりません' });
  const comment = await post.related('comments').create({
    content: req.body.content,
    user_id: req.body.userId,
  });
  res.status(201).json(comment);
});

app.listen(3000, () => console.log('API server running on port 3000'));
```

## エラーハンドリング

```ts
// グローバルエラーハンドラー
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'サーバーエラーが発生しました' });
});
```

## まとめ

Sutando と Express の組み合わせで、シンプルかつ強力な REST API を構築できます。Active Record パターンにより、コード量が少なく、可読性も高いです。

[ドキュメント](https://sutando.org/ja/guide/getting-started) を参照してさらに学びましょう。