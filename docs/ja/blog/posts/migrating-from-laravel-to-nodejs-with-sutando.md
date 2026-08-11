---
date: 2026-09-08
title: "Laravel から Node.js へ：Sutando で移行する"
tags: [Laravel, Node.js, Sutando, 移行, Eloquent]
author: Dylan Yu
image: https://storage.sutando.org/og-1751395044936.jpg

---

<PostDetail>

Laravel 開発者として、Node.js への移行を検討しているなら、Sutando は最もスムーズな移行パスを提供します。このガイドでは、Eloquent から Sutando への移行を詳しく説明します。

## なぜ Sutando なのか？

Sutando は Laravel Eloquent の API を直接参考にして作られています。Eloquent の概念がそのまま使えます：

- Active Record パターン
- モデルリレーション（`hasMany`, `belongsTo` など）
- クエリスコープ
- モデルイベント（フック）
- ソフトデリート
- タイプキャスト
- コレクション

## クイックマッピング

| Laravel Eloquent | Sutando |
|------------------|---------|
| `Model::find($id)` | `Model.find(id)` |
| `Model::where('x', 'y')->get()` | `Model.query().where('x', 'y').get()` |
| `$model->hasMany(Post::class)` | `this.hasMany(Post, 'user_id')` |
| `Model::creating(fn)` | `Model.creating(fn)` |
| `SoftDeletes` trait | `SoftDeletes` trait |

## モデルの移行

```ts
// Laravel: app/Models/User.php
class User extends Authenticatable {
  use HasFactory, SoftDeletes;

  protected $table = 'users';
  protected $casts = ['is_admin' => 'boolean'];
  protected $hidden = ['password'];

  public function posts() {
    return $this->hasMany(Post::class);
  }
}

// Sutando: models/User.ts
import { Model, SoftDeletes } from 'sutando';

class User extends Model {
  use = [SoftDeletes];
  table = 'users';
  casts = { is_admin: 'boolean' };
  hidden = ['password'];

  relationPosts() {
    return this.hasMany(Post, 'user_id');
  }
}
```

## クエリの移行

```ts
// Laravel
$posts = Post::with('user', 'comments')
  ->where('published', true)
  ->orderBy('created_at', 'desc')
  ->paginate(15);

// Sutando
const posts = await Post.query()
  .with('user', 'comments')
  .where('published', true)
  .orderBy('created_at', 'desc')
  .paginate(15);
```

## リレーションの移行

```ts
// Laravel: 1対多
public function posts() {
  return $this->hasMany(Post::class);
}

// Sutando
relationPosts() {
  return this.hasMany(Post, 'user_id');
}
```

```ts
// Laravel: 多対多
public function roles() {
  return $this->belongsToMany(Role::class);
}

// Sutando
relationRoles() {
  return this.belongsToMany(Role, 'role_user', 'user_id', 'role_id');
}
```

## モデルイベントの移行

```ts
// Laravel
protected static function booted() {
  static::creating(function ($post) {
    $post->slug = Str::slug($post->title);
  });
}

// Sutando
Post.creating(async (post) => {
  post.slug = post.title.toLowerCase().replace(/\s+/g, '-');
});
```

## 実践例：ブログの移行

```ts
import { sutando, Model } from 'sutando';
import express from 'express';

sutando.addConnection({
  client: 'mysql2',
  connection: { host: '127.0.0.1', user: 'root', password: '', database: 'blog' }
});

class User extends Model {
  table = 'users';
  hidden = ['password'];
  relationPosts() { return this.hasMany(Post, 'user_id'); }
}

class Post extends Model {
  table = 'posts';
  relationUser() { return this.belongsTo(User, 'user_id'); }
  relationComments() { return this.hasMany(Comment); }
}

class Comment extends Model {
  table = 'comments';
  relationUser() { return this.belongsTo(User, 'user_id'); }
}

const app = express();
app.use(express.json());

app.get('/posts', async (req, res) => {
  const posts = await Post.query()
    .with('user', 'comments')
    .where('published', true)
    .orderBy('created_at', 'desc')
    .paginate(15);
  res.json(posts);
});

app.get('/posts/:id', async (req, res) => {
  const post = await Post.query()
    .with('user', 'comments')
    .find(req.params.id);
  res.json(post);
});

app.listen(3000);
```

## 移行のヒント

1. **段階的に移行** — すべて一度に移行する必要はありません
2. **読み取り専用 API から始める** — GET ルートを先に移行し、検証してから書き込み操作へ
3. **マイグレーションは既存のものを維持** — Sutando のスキーマビルダーは Laravel と互換性があります

## 結論

Laravel 開発者にとって、Sutando は Node.js への最も自然な移行パスです。Eloquent の概念がそのまま使えるため、学習コストが最小限に抑えられます。

[ドキュメント](https://sutando.org/ja/guide/getting-started.html) を読んで始めましょう。

</PostDetail>
