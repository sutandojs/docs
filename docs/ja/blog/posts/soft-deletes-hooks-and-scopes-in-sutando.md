---
date: 2026-10-13
title: "Sutando のソフトデリート、フック、スコープ"
tags: [Sutando, ソフトデリート, フック, スコープ, Node.js]
author: Dylan Yu
image: https://storage.sutando.org/og-1751395044936.jpg

---

<PostDetail>

Sutando の強力な機能であるソフトデリート、モデルイベント（フック）、クエリスコープについて解説します。

## ソフトデリート

ソフトデリートは、レコードを実際に削除するのではなく、`deleted_at` カラムに日付を設定して論理削除を行う機能です。

### 設定

```ts
import { Model, SoftDeletes } from 'sutando';

class Post extends Model {
  use = [SoftDeletes];
  table = 'posts';
}
```

### 使用例

```ts
// ソフトデリート
const post = await Post.find(1);
await post.delete(); // deleted_at に日付が設定される

// ソフトデリートされたレコードも含めて取得
const allPosts = await Post.query().withTrashed().get();

// ソフトデリートされたレコードのみ取得
const trashedPosts = await Post.query().onlyTrashed().get();

// 復元
const trashedPost = await Post.query().onlyTrashed().find(1);
await trashedPost.restore();

// 完全に削除
await post.forceDelete();
```

## モデルイベント（フック）

モデルのライフサイクルイベントにフックして、カスタムロジックを実行できます。

### 利用可能なイベント

- `creating` — 作成前
- `created` — 作成後
- `updating` — 更新前
- `updated` — 更新後
- `saving` — 保存前（作成・更新共通）
- `saved` — 保存後
- `deleting` — 削除前
- `deleted` — 削除後

### 使用例

```ts
// スラグの自動生成
Post.creating(async (post) => {
  post.slug = post.title.toLowerCase().replace(/\s+/g, '-');
});

// 更新日時の記録
Post.updating(async (post) => {
  post.updated_at = new Date();
});

// 削除時のログ記録
Post.deleting(async (post) => {
  console.log(`記事を削除: ${post.title}`);
});
```

## クエリスコープ

クエリスコープを使うと、再利用可能なクエリ条件を定義できます。

### ローカルスコープ

```ts
class Post extends Model {
  table = 'posts';
  
  scopePublished(query) {
    return query.where('published', true);
  }
  
  scopeRecent(query) {
    return query.orderBy('created_at', 'desc');
  }
  
  scopeByUser(query, userId) {
    return query.where('user_id', userId);
  }
}

// 使用例
const posts = await Post.query().published().recent().get();
const userPosts = await Post.query().byUser(1).published().get();
```

### グローバルスコープ

```ts
class Post extends Model {
  table = 'posts';
  
  static booted = false;
  
  static boot() {
    super.boot();
    if (!Post.booted) {
      Post.addGlobalScope('published', (query) => {
        query.where('published', true);
      });
      Post.booted = true;
    }
  }
}

// すべてのクエリに published = true が自動的に適用される
const posts = await Post.query().get();
```

## まとめ

ソフトデリート、フック、クエリスコープを組み合わせることで、データ整合性を保ちながら開発効率を大幅に向上できます。これらの機能は Laravel Eloquent から直接インスピレーションを得ており、直感的に使えます。

[ドキュメント](https://sutando.org/ja/guide/hooks.html) でさらに詳しく。

</PostDetail>
