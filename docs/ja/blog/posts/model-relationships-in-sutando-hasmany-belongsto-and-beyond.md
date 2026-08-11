---
date: 2026-09-22
title: "Sutando のモデルリレーション：hasMany、belongsTo とそれ以降"
tags: [Sutando, モデルリレーション, Node.js, ORM, ガイド]
author: Dylan Yu
image: https://storage.sutando.org/og-1751395044936.jpg

---

<PostDetail>

モデルリレーションは ORM の最も強力な機能の一つです。Sutando では、Laravel Eloquent ライクな直感的な API でリレーションを定義・操作できます。

## リレーションタイプ

Sutando は以下のリレーションタイプをサポートしています：

- **hasOne** — 1対1
- **hasMany** — 1対多
- **belongsTo** — 多対1（逆方向）
- **belongsToMany** — 多対多

## 1対多（hasMany / belongsTo）

最も一般的なリレーションです。ユーザーが複数の投稿を持つ例：

```ts
import { Model } from 'sutando';

class User extends Model {
  table = 'users';
  relationPosts() {
    return this.hasMany(Post, 'user_id');
  }
}

class Post extends Model {
  table = 'posts';
  relationUser() {
    return this.belongsTo(User, 'user_id');
  }
}
```

### 使用例

```ts
// ユーザーの投稿を取得
const user = await User.find(1);
const posts = await user.posts;

// リレーション経由で作成
const post = await user.posts().create({
  title: '新しい投稿',
  content: '内容',
});

// 投稿からユーザーを取得
const post = await Post.find(1);
const author = await post.user;
```

## 1対1（hasOne）

```ts
class User extends Model {
  table = 'users';
  relationProfile() {
    return this.hasOne(Profile, 'user_id');
  }
}

// 使用例
const user = await User.find(1);
const profile = await user.profile;
```

## 多対多（belongsToMany）

ユーザーとロールの例：

```ts
class User extends Model {
  table = 'users';
  relationRoles() {
    return this.belongsToMany(Role, 'role_user', 'user_id', 'role_id');
  }
}

class Role extends Model {
  table = 'roles';
  relationUsers() {
    return this.belongsToMany(User, 'role_user', 'role_id', 'user_id');
  }
}
```

### 使用例

```ts
// ユーザーのロールを取得
const user = await User.find(1);
const roles = await user.roles;

// ロールを付与
await user.roles().attach([1, 2, 3]);

// ロールを解除
await user.roles().detach([2]);

// ロールを同期（不要なものは削除）
await user.roles().sync([1, 3]);
```

## 事前読み込み（Eager Loading）

N+1 問題を回避するために、事前読み込みを使います：

```ts
// N+1 問題（非推奨）
const users = await User.query().get();
for (const user of users) {
  const posts = await user.posts; // 各ユーザーごとにクエリが実行される
}

// 事前読み込み（推奨）
const users = await User.query().with('posts').get();
// 合計2クエリ：ユーザー1回 + 投稿1回

// ネストされた事前読み込み
const users = await User.query()
  .with('posts.comments.user')
  .get();
```

## 遅延読み込み（Lazy Loading）

```ts
const user = await User.find(1);
const posts = await user.posts; // ここでクエリが実行される
```

## 条件付きリレーション

```ts
// 公開済みの投稿のみを事前読み込み
const users = await User.query()
  .with({
    posts: query => query.where('published', true)
  })
  .get();
```

## リレーションのカウント

```ts
// 投稿数と一緒にユーザーを取得
const users = await User.query()
  .withCount('posts')
  .get();

console.log(users[0].posts_count);
```

## まとめ

Sutando のリレーション API は、Laravel Eloquent の直感的な設計を引き継いでいます。宣言的なメソッドでリレーションを定義し、事前読み込みでパフォーマンスを最適化できます。

[ドキュメント](https://sutando.org/ja/guide/relationships.html) でさらに詳しく。

</PostDetail>
