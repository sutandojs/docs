---
date: 2026-08-18
title: "Sutando vs Prisma：どの Node.js ORM が適しているか？"
type: blog
description: "Node.js プロジェクトで ORM を選ぶ際、Sutando と Prisma は有力な候補です。この記事では、設計思想、クエリ構文、機能、そしてどのようなケースにどちらが適しているかを比較します。"
authors: ["Dylan Yu"]
mode: center
---


Node.js プロジェクトで ORM を選ぶ際、Sutando と Prisma は有力な候補です。この記事では、設計思想、クエリ構文、機能、そしてどのようなケースにどちらが適しているかを比較します。

## 設計思想の違い

| 側面 | Sutando | Prisma |
|---------|---------|--------|
| パターン | Active Record | Data Mapper |
| スキーマ定義 | TypeScript クラス | `.prisma` DSL ファイル |
| コード生成 | 不要 | `prisma generate` ステップが必要 |
| クエリスタイル | メソッドチェーン | オブジェクトベースのフィルタ API |
| リレーション | `hasMany`, `belongsTo` など | `include` / ネストされた書き込み |

## クエリ構文の比較

### データの作成

```ts
// Sutando
const post = await Post.create({
  title: '新しい投稿',
  content: '内容',
  published: true,
});

// Prisma
const post = await prisma.post.create({
  data: {
    title: '新しい投稿',
    content: '内容',
    published: true,
  },
});
```

### データの読み取り

```ts
// Sutando
const posts = await Post.query()
  .where('published', true)
  .orderBy('created_at', 'desc')
  .limit(10)
  .get();

// Prisma
const posts = await prisma.post.findMany({
  where: { published: true },
  orderBy: { created_at: 'desc' },
  take: 10,
});
```

### リレーション

```ts
// Sutando
const user = await User.query().with('posts.comments').find(1);

// Prisma
const user = await prisma.user.findUnique({
  where: { id: 1 },
  include: {
    posts: {
      include: { comments: true },
    },
  },
});
```

## Sutando の利点

### 1. コード生成が不要

Prisma はスキーマを変更するたびに `prisma generate` を実行する必要があります。Sutando のモデルはプレーンな TypeScript クラスで、ビルドステップも生成ファイルも不要です。

### 2. モデルイベントとフック

```ts
// Sutando: シンプルなイベントフック
Post.creating(async (post) => {
  post.slug = post.title.toLowerCase().replace(/\s+/g, '-');
});

// Prisma: ミドルウェアが必要
prisma.$use(async (params, next) => {
  if (params.model === 'Post' && params.action === 'create') {
    params.args.data.slug = params.args.data.title
      .toLowerCase().replace(/\s+/g, '-');
  }
  return next(params);
});
```

### 3. ソフトデリート

Sutando は `deleted_at` カラムを追加して `SoftDeletes` トレイトを使うだけです。Prisma ではカスタムミドルウェアが必要です。

### 4. Laravel/Rails の経験がある場合

Laravel や Rails からの移行者にとって、Sutando の API はすぐに馴染みます。Prisma のスキーマファーストのアプローチは新しい学習コストがあります。

## Prisma の利点

### 1. 型安全性

Prisma はスキーマから完全な型を自動生成するため、クエリ結果の型推論が強力です。

### 2. マイグレーションツール

Prisma Migrate は宣言的なスキーマベースのマイグレーションを提供します。

### 3. 大規模なエコシステム

Prisma はより大きなコミュニティと豊富な統合を持ちます。

## パフォーマンス

Prisma 7 は Rust クエリエンジンを TypeScript/WASM 実装に置き換え、バンドルサイズを約 14MB から約 1.6MB に削減しました。しかし、Sutando はコード生成やエンジンのオーバーヘッドがないため、さらに小さなフットプリントを持ちます。

ほとんどのアプリケーションでは、パフォーマンスの違いは無視できます。データベースクエリの時間が支配的だからです。

## どちらを選ぶべきか？

**Sutando を選ぶ場合：**
- Laravel や Rails の経験がある
- Active Record パターンを好む
- モデルイベント、ソフトデリート、クエリスコープが必要
- コード生成ステップを避けたい
- 小さくシンプルな API を好む

**Prisma を選ぶ場合：**
- 最大限の型安全性が必要
- スキーマファーストのアプローチを好む
- 大規模なエコシステムを重視する
- Data Mapper パターンを好む

## 結論

どちらの ORM も優れていますが、設計思想が異なります。Sutando は開発者体験（DX）とシンプルさを重視し、Prisma は型安全性とエコシステムを重視します。

Sutando を試す準備ができたら：`npm install sutando` — または [ドキュメント](https://sutando.org/ja/guide/getting-started) を読んでください。