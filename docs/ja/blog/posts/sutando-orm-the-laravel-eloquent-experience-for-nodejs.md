---
date: 2025-07-02
title: "Sutando ORM：Node.js のための Laravel Eloquent エクスペリエンス"
type: blog
description: "Node.js 向けの ORM を探しているなら、Sutando を知っておくべきです。Laravel Eloquent の開発体験を Node.js にもたらす、モダンな Active Record ORM です。"
authors: ["Dylan Yu"]
mode: center
---


Node.js 向けの ORM を探しているなら、Sutando を知っておくべきです。Laravel Eloquent の開発体験を Node.js にもたらす、モダンな Active Record ORM です。

## Sutando とは？

Sutando は Node.js 向けのモダンな ORM で、Laravel Eloquent の API パターンを直接参考にして設計されています。Active Record パターンを採用し、MySQL、PostgreSQL、SQLite などに対応しています。

### 主な特徴

- **Active Record パターン** — モデルインスタンスが保存・更新・削除を直接行う
- **デコレーター不要** — プレーンな TypeScript クラスでモデルを定義
- **リレーション管理** — `hasMany`、`belongsTo`、`belongsToMany` など
- **ソフトデリート** — 組み込みサポート
- **モデルイベント** — 作成・更新・削除のライフサイクルにフック
- **クエリスコープ** — 再利用可能なクエリ条件
- **タイプキャスト** — 属性の自動型変換
- **マイグレーション** — スキーマビルダー付き

## なぜ Sutando なのか？ {#なぜ-sutando-なのか}

Node.js エコシステムには多くの ORM がありますが、それぞれ課題があります：

- **Prisma** — 優秀だが、Data Mapper パターンでコード生成ステップが必要
- **TypeORM** — デコレーター依存とメンテナンスの停滞
- **Drizzle** — 軽量だが、リレーション管理が手動で煩雑

Sutando は、Laravel Eloquent のシンプルさと開発速度を Node.js にもたらします。

## クイックスタート

```bash
npm install sutando --save
```

データベースを設定し、最初のモデルを作成して、クエリを実行しましょう。完全なドキュメントは **https://sutando.org/ja/guide/getting-started** にあります。

```ts
import { sutando, Model } from 'sutando';

// データベース接続情報を追加
sutando.addConnection({
  client: 'mysql2',
  connection: {
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'test'
  }
});

// モデルを定義
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

// クエリを実行
const users = await User.query().with('posts').get();
console.log(users);
```

## Eloquent との比較

| 機能 | Laravel Eloquent | Sutando |
|---------|-----------------|---------|
| パターン | Active Record | Active Record |
| モデル定義 | PHP クラス | TypeScript クラス |
| リレーション | メソッドベース | メソッドベース |
| ソフトデリート | トレイト | トレイト |
| イベント | 静的メソッド | 静的メソッド |
| スコープ | メソッド | メソッド |

## まとめ

Sutando は、Laravel Eloquent の開発体験を Node.js でもたらす ORM です。Active Record パターン、デコレーター不要のモデル定義、豊富な機能により、高速な開発が可能になります。

[スタートガイド](https://sutando.org/ja/guide/getting-started) を読んで始めましょう。