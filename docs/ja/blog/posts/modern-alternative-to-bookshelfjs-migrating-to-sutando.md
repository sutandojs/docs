---
date: 2026-09-15
title: "Bookshelf.js のモダンな代替：Sutando への移行"
type: blog
description: "Bookshelf.js はかつて、Knex.js の上にシンプルで Promise ベースのインターフェースを求める Node.js 開発者の定番 ORM でした。しかし 2022 年以降アップデートがなく、TypeScript…"
authors: ["Dylan Yu"]
mode: center
---


<img src="https://storage.sutando.org/og-1751395044936.jpg" alt="" width="1200" height="630" loading="lazy" />

---

Bookshelf.js はかつて、Knex.js の上にシンプルで Promise ベースのインターフェースを求める Node.js 開発者の定番 ORM でした。しかし 2022 年以降アップデートがなく、TypeScript サポートもなく、コミュニティも移行してしまいました。モダンな代替を検討する時が来ています。このガイドでは、Bookshelf.js から Sutando への移行手順を解説します。

## Bookshelf.js の現状

Bookshelf.js は 2022 年 6 月のバージョン 1.2.0 以降、新リリースがありません。事実上放置されていることを示す複数の兆候があります：

- **長年リリースなし**：npm パッケージが 2022 年以降更新されていない
- **TypeScript サポートなし**：ライブラリは純粋な CommonJS JavaScript で、組み込み型がない——`@types/bookshelf` の別パッケージが必要
- **コミュニティのコンセンサス**：npm-compare、SaaSHub、多数のブログが Bookshelf を「レガシー」または「メンテナンスモード」と表現
- **StackOverflow の質問**：開発者が「[Bookshelf.js の積極的にメンテナンスされている代替はありますか？](https://stackoverflow.com/questions/74914728/is-there-an-actively-maintained-replacement-for-bookshelf-js)」と活発に質問

## なぜ Sutando なのか？

Sutando は Laravel の Eloquent にインスピレーションを受けた、モダンな Node.js 向け Active Record ORM です。Bookshelf.js との比較：

| 機能 | Bookshelf.js | Sutando |
|------|-------------|---------|
| パターン | Active Record（Collection ベース） | Active Record（Model ベース） |
| TypeScript | なし（`@types/bookshelf` が必要） | ファーストクラス TS サポート |
| モジュールシステム | CommonJS (`require`) | ESM + CommonJS |
| マイグレーション | Knex 経由（別ツール） | 組み込み schema builder |
| 最終リリース | 2022 | 活発 |
| リレーション | `forge().fetch()` | `hasMany()`, `belongsTo()` |
| ソフトデリート | 手動 | 組み込み |
| フック | `initialize` イベント | `creating`, `saved` 等 |
| スコープ | 手動 | 組み込み |

## 概念マッピング：Bookshelf.js → Sutando

### 初期化

**Bookshelf.js:**
```typescript
import knex from 'knex';
import bookshelf from 'bookshelf';

const knexInstance = knex({
  client: 'pg',
  connection: process.env.DATABASE_URL,
});

const db = bookshelf(knexInstance);
db.plugin('registry');
db.plugin('virtuals');
db.plugin('pagination');
```

**Sutando:**
```typescript
import { sutando } from 'sutando';

const db = sutando({
  client: 'pg',
  connection: process.env.DATABASE_URL,
});

export default db;
```

プラグイン不要——virtuals、pagination、registry のような機能は組み込み済みです。

### モデル

**Bookshelf.js:**
```typescript
const User = db.model('User', {
  tableName: 'users',
  
  posts() {
    return this.hasMany('Post');
  },
  
  profile() {
    return this.belongsTo('Profile');
  },
});

// または extend を使用
const User = db.Model.extend({
  tableName: 'users',
  
  posts() {
    return this.hasMany('Post');
  },
});
```

**Sutando:**
```typescript
import { Model } from 'sutando';

class User extends Model {
  protected table = 'users';
  
  protected fillable = ['name', 'email'];
  
  posts(): HasMany {
    return this.hasMany(Post);
  }
  
  profile(): BelongsTo {
    return this.belongsTo(Profile);
  }
}
```

### クエリ

**Bookshelf.js:**
```typescript
// 全件取得
const users = await new User().fetch();

// リレーション付き取得
const user = await new User({ id: 1 }).fetch({
  withRelated: ['posts.comments'],
});

// 条件クエリ
const users = await User.where('age', '>', 18).fetch();

// 挿入
const user = await new User({ name: 'Alice', email: 'alice@example.com' }).save();

// 更新
const user = await new User({ id: 1 }).fetch();
user.set('name', 'Bob');
await user.save();

// 削除
const user = await new User({ id: 1 }).fetch();
await user.destroy();
```

**Sutando:**
```typescript
// 全件取得
const users = await User.query().get();

// リレーション付き取得
const user = await User.query().with('posts.comments').find(1);

// 条件クエリ
const users = await User.query().where('age', '>', 18).get();

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

### ページネーション

**Bookshelf.js** はページネーションプラグインが必要：
```typescript
db.plugin('pagination');

const results = await new User().fetchPage({
  page: 1,
  pageSize: 20,
});
// results.models, results.pagination
```

**Sutando** はページネーションが組み込み：
```typescript
const results = await User.query().paginate(1, 20);
// results.data, results.total, results.currentPage, results.perPage
```

### トランザクション

**Bookshelf.js:**
```typescript
await db.transaction(async (t) => {
  const user = await new User({ name: 'Alice' }).save(null, { transacting: t });
  await new Post({ title: 'Hello', user_id: user.id }).save(null, { transacting: t });
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

**Bookshelf.js:**
```typescript
const User = db.Model.extend({
  tableName: 'users',
  
  initialize() {
    this.on('saving', this.onSaving);
  },
  
  onSaving(model, attrs, options) {
    model.set('updated_at', new Date());
  },
});
```

**Sutando:**
```typescript
class User extends Model {
  protected table = 'users';
  
  static saving(model: User) {
    model.updated_at = new Date();
  }
}
```

## ステップバイステップ移行ガイド

### ステップ 1：Sutando のインストール

```bash
npm install sutando
```

### ステップ 2：データベース接続の置き換え

Bookshelf の初期化を Sutando に置き換え：

```typescript
import { sutando } from 'sutando';

const db = sutando({
  client: 'pg',
  connection: process.env.DATABASE_URL,
});

export default db;
```

`bookshelf` と `@types/bookshelf` パッケージを削除：

```bash
npm uninstall bookshelf @types/bookshelf
```

### ステップ 3：モデルを `extend` から ES6 クラスに変換

Bookshelf の `Model.extend()` パターンは ES6 クラス構文に変換：

- `tableName` → `protected table`
- `hasMany('Post')` → `this.hasMany(Post)`（文字列名ではなくクラス参照を使用）
- `belongsTo('Profile')` → `this.belongsTo(Profile)`
- `initialize()` とイベントリスナー → `saving`、`creating` 等の静的フックメソッド

### ステップ 4：クエリパターンの更新

クエリパターンの主な変更点：

- `new User().fetch()` → `User.query().get()`
- `new User({ id: 1 }).fetch({ withRelated: [...] })` → `User.query().with('...').find(1)`
- `model.set('key', value)` → `model.key = value`（直接プロパティ代入）
- `model.destroy()` → `model.delete()`
- `.fetchPage()` → `.paginate()`

### ステップ 5：マイグレーションの移行

Knex マイグレーションを使用している場合、Sutando の schema builder と互換性があります：

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

## 移行後に得られるもの

- **ファーストクラス TypeScript**：`@types/bookshelf` は不要——型が組み込みで正確
- **ESM サポート**：`import`/`export` をネイティブに使用、`require()` は不要
- **プラグイン不要**：ページネーション、virtuals、registry は組み込み機能
- **直接プロパティアクセス**：`user.set('name', 'Bob')` ではなく `user.name = 'Bob'`
- **組み込みソフトデリート**：モデルに `softDeletes()` を追加するだけ——手動実装不要
- **組み込みスコープ**：カスタムプラグインなしで再利用可能なクエリフィルターを定義
- **Eloquent スタイル API**：Laravel を使ったことがある人に馴染みやすい
- **活発なメンテナンス**：定期的なアップデートと新機能

## 結論

Bookshelf.js はその時代において優れた ORM でしたが、2022 年以降のアップデート停止と TypeScript サポートの欠如により、モダンな Node.js プロジェクトではリスクとなります。Sutando は自然なアップグレードパスを提供します——同じ Active Record パターンでありながら、ファーストクラスの TypeScript サポート、Bookshelf でプラグインが必要だった機能の組み込み、そして活発にメンテナンスされたコードベースを備えています。

移行はシンプルです：モデルを `extend()` から ES6 クラスに変換し、クエリパターンを更新し、Bookshelf の依存を削除します。両方の ORM は移行期間中に共存できるため、モデルごとに段階的に移行できます。

👉 [Sutando を始める](https://sutando.org/ja/guide/getting-started) または `npm install sutando` を実行して試してみましょう。
