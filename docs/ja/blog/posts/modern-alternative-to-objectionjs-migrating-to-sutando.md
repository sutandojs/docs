---
date: 2026-09-08
title: "Objection.js のモダンな代替：Sutando への移行"
type: blog
description: "Objection.js は長年 Node.js エコシステムで人気のある ORM でした。Knex.js の上に構築され、柔軟で SQL に近いデータベース操作を提供してきました。しかし、原作者がメンテナンスを終了し、TypeScript…"
authors: ["Dylan Yu"]
mode: center
---


<img src="https://storage.sutando.org/og-1751395044936.jpg" alt="" width="1200" height="630" loading="lazy" />

---

Objection.js は長年 Node.js エコシステムで人気のある ORM でした。Knex.js の上に構築され、柔軟で SQL に近いデータベース操作を提供してきました。しかし、原作者がメンテナンスを終了し、TypeScript サポートも時代遅れになり、多くのチームがモダンな代替を探しています。このガイドでは、Objection.js から Sutando への移行手順を解説します。

## Objection.js から移行すべき理由

Objection.js は依然として有用なライブラリですが、以下の理由から移行を検討する価値があります：

### メンテナンス状況

[GitHub ディスカッション](https://github.com/Vincit/objection.js/discussions/2463) で、原作者の Sami Koskimäki がプロジェクトの積極的なメンテナンスを終了することを発表しました：

- **アクティブなメンテナー不在**：プロジェクトの bus factor が極めて高く、唯一のメンテナーが離脱
- **新機能なし**：コミュニティの fork のみが更新を受信
- **リリースの遅延**：パッチリリース間に数ヶ月、あるいはそれ以上の間隔

### TypeScript サポート

Objection.js は TypeScript が広く普及する前に設計されました。型システムは機能しますが、手動での型宣言が必要で、モダンな TypeScript ファースト ORM が提供するシームレスな型推論は得られません。

### 組み込みマイグレーションなし

Objection.js はマイグレーションに完全に Knex に依存しています。Knex は堅実ですが、異なる API とメンタルモデルを持つ 2 つのツールを管理する必要があります。

## なぜ Sutando なのか？

Sutando は Laravel の Eloquent にインスピレーションを受けた、モダンな Node.js 向け Active Record ORM です。Objection.js ユーザーが直面する痛点を解決します：

| 機能 | Objection.js | Sutando |
|------|-------------|---------|
| パターン | Query Builder + ORM | Active Record |
| TypeScript | 手動型 | ファーストクラス TS サポート |
| マイグレーション | Knex 経由（別ツール） | 組み込み schema builder |
| メンテナンス | 停滞 | 活発 |
| リレーション | `withGraphFetched` | `with()`, `hasMany()`, `belongsTo()` |
| ソフトデリート | 手動 | 組み込み |
| フック | `$beforeInsert` 等 | `creating`, `saved` 等 |
| スコープ | 手動 | 組み込み |

## 概念マッピング：Objection.js → Sutando

### モデル

**Objection.js:**
```typescript
import { Model } from 'objection';
import knex from 'knex';

const db = knex({
  client: 'pg',
  connection: process.env.DATABASE_URL,
});

Model.knex(db);

class User extends Model {
  static tableName = 'users';
  
  static jsonSchema = {
    type: 'object',
    required: ['name', 'email'],
    properties: {
      id: { type: 'integer' },
      name: { type: 'string', minLength: 1, maxLength: 255 },
      email: { type: 'string', format: 'email' },
    },
  };
  
  static relationMappings = {
    posts: {
      relation: Model.HasManyRelation,
      modelClass: Post,
      join: { from: 'users.id', to: 'posts.user_id' },
    },
  };
}
```

**Sutando:**
```typescript
import { sutando, Model } from 'sutando';

const db = sutando({
  client: 'pg',
  connection: process.env.DATABASE_URL,
});

class User extends Model {
  protected table = 'users';
  
  protected fillable = ['name', 'email'];
  
  posts(): HasMany {
    return this.hasMany(Post);
  }
}
```

### クエリ

**Objection.js:**
```typescript
// シンプルなクエリ
const users = await User.query().where('age', '>', 18);

// リレーション付き
const user = await User.query()
  .withGraphFetched('[posts.comments]')
  .findById(1);

// 挿入
const user = await User.query().insert({ name: 'Alice', email: 'alice@example.com' });

// 更新
await User.query().patch({ name: 'Bob' }).where('id', 1);

// 削除
await User.query().deleteById(1);
```

**Sutando:**
```typescript
// シンプルなクエリ
const users = await User.query().where('age', '>', 18).get();

// リレーション付き
const user = await User.query().with('posts.comments').find(1);

// 挿入
const user = new User({ name: 'Alice', email: 'alice@example.com' });
await user.save();

// 更新
const user = await User.query().find(1);
user.name = 'Bob';
await user.save();

// 削除
const user = await User.query().find(1);
await user.delete();
```

### リレーション

**Objection.js** は `relationMappings` で宣言的オブジェクト構文を使用：

```typescript
static relationMappings = {
  posts: {
    relation: Model.HasManyRelation,
    modelClass: Post,
    join: { from: 'users.id', to: 'posts.user_id' },
  },
  profile: {
    relation: Model.BelongsToOneRelation,
    modelClass: Profile,
    join: { from: 'users.profile_id', to: 'profiles.id' },
  },
};
```

**Sutando** はメソッドベースの定義を使用、Eloquent に類似：

```typescript
posts(): HasMany {
  return this.hasMany(Post);
}

profile(): BelongsTo {
  return this.belongsTo(Profile);
}
```

### トランザクション

**Objection.js:**
```typescript
await User.transaction(async (trx) => {
  const user = await User.query(trx).insert({ name: 'Alice' });
  await Post.query(trx).insert({ title: 'Hello', user_id: user.id });
});
```

**Sutando:**
```typescript
await db.transaction(async () => {
  const user = new User({ name: 'Alice' });
  await user.save();
  
  const post = new Post({ title: 'Hello', user_id: user.id });
  await post.save();
});
```

### フック / イベント

**Objection.js:**
```typescript
class User extends Model {
  static tableName = 'users';
  
  $beforeInsert() {
    this.created_at = new Date().toISOString();
  }
  
  $beforeUpdate() {
    this.updated_at = new Date().toISOString();
  }
}
```

**Sutando:**
```typescript
import { Model } from 'sutando';

class User extends Model {
  protected table = 'users';
  
  static creating(model: User) {
    model.created_at = new Date();
  }
  
  static updating(model: User) {
    model.updated_at = new Date();
  }
}
```

## ステップバイステップ移行ガイド

### ステップ 1：Sutando のインストール

```bash
npm install sutando
```

### ステップ 2：データベース接続の設定

`db.ts` ファイルを作成：

```typescript
import { sutando } from 'sutando';

export const db = sutando({
  client: 'pg',
  connection: process.env.DATABASE_URL,
});

export default db;
```

### ステップ 3：モデルを段階的に変換

すべてを一度に移行する必要はありません。両方の ORM は同じプロジェクトで共存できます：

1. まず最もシンプルなモデル（複雑なリレーションなし）を変換
2. 次に `hasMany` / `belongsTo` リレーションを持つモデルを変換
3. 最後に複雑なグラフ操作を持つモデルを変換

### ステップ 4：マイグレーションの移行

Knex マイグレーションを使用している場合、Sutando の schema builder は互換性があります：

```typescript
import { schema } from 'sutando';

exports.up = function (schema) {
  return schema.createTable('users', (table) => {
    table.increments('id');
    table.string('name');
    table.string('email').unique();
    table.timestamps();
  });
};

exports.down = function (schema) {
  return schema.dropTableIfExists('users');
};
```

### ステップ 5：クエリの置き換え

コードベースを巡回し、Objection.js クエリを Sutando の等価コードに置き換えます。主な変更点：

- Objection の `Model.query()` はクエリビルダーを返します；Sutando では `.get()` または `.first()` をチェーンして実行
- `withGraphFetched('[posts.comments]')` が `with('posts.comments')` に
- `insert()` / `patch()` / `deleteById()` が Active Record スタイルの `save()` / `delete()` に

## 移行後に得られるもの

- **Active Record パターン**：クエリビルダーとモデルを分離する必要なし——モデルインスタンスを直接操作
- **組み込みソフトデリート**：モデルに `softDeletes()` を追加するだけで `deleted_at` の処理が自動化
- **組み込みスコープ**：`scope` メソッドで再利用可能なクエリフィルターを定義
- **ファーストクラス TypeScript**：クラスベースのモデルで型推論が自然に機能
- **Eloquent スタイル API**：Laravel を使ったことがあれば、学習曲線はほぼゼロ
- **活発なメンテナンス**：定期的なリリースと新機能

## 結論

Objection.js は Node.js コミュニティに貢献してきましたが、メンテナンス状況と TypeScript の制限により、長期プロジェクトではリスクとなります。Sutando は馴染みのある、よくメンテナンスされた代替を提供し、Active Record パターンでボイラープレートを削減し、開発体験を向上させます。

移行は段階的に行えます——両方の ORM が共存しながら、モデルごとに移行できます。今日からひとつのモデルで始めて、違いを実感してください。

👉 [Sutando を始める](https://sutando.org/ja/guide/getting-started) または `npm install sutando` を実行して試してみましょう。
