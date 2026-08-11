---
date: 2026-09-15
title: "Sutando vs TypeORM：モダンな Active Record の代替"
tags: [Sutando, TypeORM, Node.js, ORM, 比較]
author: Dylan Yu
image: https://storage.sutando.org/og-1751395044936.jpg

---

<PostDetail>

TypeORM は長年 Node.js で最も人気のある ORM の一つでしたが、デコレーター依存やメンテナンス問題により、多くの開発者が代替を探しています。Sutando はその代替となります。

## TypeORM の問題点

### 1. デコレーター依存

TypeORM は `@Entity`、`@Column`、`@OneToMany` などのデコレーターに大きく依存しています：

```ts
// TypeORM: デコレーターだらけ
@Entity()
class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @OneToMany(() => Post, post => post.user)
  posts: Post[];
}
```

これにより、`tsconfig` の `emitDecoratorMetadata` と `experimentalDecorators` が必要になり、バンドルサイズも増加します。

### 2. 文字列ベースのクエリビルダー

```ts
// TypeORM: 文字列ベース
const posts = await repository
  .createQueryBuilder('post')
  .leftJoinAndSelect('post.user', 'user')
  .where('post.published = :published', { published: true })
  .orderBy('post.created_at', 'DESC')
  .getMany();
```

### 3. メンテナンスの停滞

TypeORM のリリースサイクルは遅く、バグ修正に時間がかかることが多いです。

## Sutando：よりクリーンな代替

### デコレーター不要

```ts
// Sutando: プレーンなクラスプロパティ
class User extends Model {
  table = 'users';
  
  relationPosts() {
    return this.hasMany(Post, 'user_id');
  }
}
```

### メソッドチェーンのクエリ

```ts
// Sutando
const posts = await Post.query()
  .with('user')
  .where('published', true)
  .orderBy('created_at', 'desc')
  .get();
```

## 機能比較

| 機能 | Sutando | TypeORM |
|---------|---------|---------|
| パターン | Active Record | Active Record + Data Mapper |
| デコレーター | 不要 | 必須 |
| スキーマ定義 | クラスプロパティ | デコレーター（`@Entity`, `@Column`） |
| クエリビルダー | メソッドチェーン | 文字列ベース |
| リレーション | メソッドベース（`hasMany` など） | デコレーターベース（`@OneToMany` など） |
| ソフトデリート | 組み込み | 手動実装 |
| モデルイベント | 組み込み | `Subscriber` パターン |
| クエリスコープ | 組み込み | サポートなし |

## TypeORM から Sutando への移行

### モデルの変換

```ts
// Before: TypeORM
@Entity()
class Post {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ default: false })
  published: boolean;

  @ManyToOne(() => User)
  user: User;
}

// After: Sutando
class Post extends Model {
  table = 'posts';
  casts = { published: 'boolean' };
  
  relationUser() {
    return this.belongsTo(User, 'user_id');
  }
}
```

### クエリの変換

```ts
// Before: TypeORM
const posts = await repository
  .createQueryBuilder('post')
  .leftJoinAndSelect('post.user', 'user')
  .where('post.published = :val', { val: true })
  .getMany();

// After: Sutando
const posts = await Post.query()
  .with('user')
  .where('published', true)
  .get();
```

## 結論

TypeORM は Node.js コミュニティに貢献してきましたが、デコレーター依存、文字列ベースのクエリ、メンテナンスの停滞により、新規プロジェクトには推奨しづらい状況です。Sutando は同じ Active Record パターンを提供しつつ、よりクリーンな API と TypeORM に欠けている機能を備えています。

`npm install sutando` — または [ドキュメント](https://sutando.org/ja/guide/getting-started.html) をお読みください。

</PostDetail>
