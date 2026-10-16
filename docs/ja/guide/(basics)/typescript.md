---
description: "Sutando の TypeScript サポートは実用主義です。完全な型安全性よりも直感的で使いやすい API を優先し、ジェネリクスで不足を補います。"
---

# TypeScript サポート

Sutando は実用主義的なアプローチで TypeScript をサポートしています。つまり、使いやすさと型安全性のバランスを取るということです。私たちは完全な型安全性よりも、直感的で扱いやすい API を優先します。

## 基本的な使い方

基本的な例をいくつか示します：

```typescript
import { Model } from 'sutando'

// Define a basic model
class User extends Model {
  // Optional: declare model property types
  declare id: number
  declare name: string
  declare email: string
}

// Using the model
const user = new User()
user.name = 'John'
await user.save()

// Query example
const users = await User.query()
  .where('age', '>', 18)
  .get()

// Relationship example
class Post extends Model {
  declare title: string
  declare content: string
  declare user_id: number

  relationUser() {
    return this.belongsTo(User)
  }
}
```

## 型安全性に関する注意

Sutando は TypeScript をサポートしていますが、完全な型安全性を目指しているわけではありません。これは次のことを意味します：

1. 一部の動的な機能では、完全な型推論が得られないことがあります
2. クエリビルダの一部の操作は `any` 型を返すことがあります
3. リレーションの型推論が不完全な場合があります

例えば：

```typescript
// Dynamic queries may not have accurate type inference
const result = await User.query()
  .select(['name', 'email'])
  .where('age', '>', 18)
  .first()

// Relationship query type inference might be incomplete
const userWithPosts = await User.query()
  .with('posts')
  .first()
```

## ジェネリクスで型安全性を高める

上記の型推論の制限に対処するため、Sutando のクエリメソッドはジェネリック型をサポートしています。これにより次のことができます：

1. モデルの型定義を拡張する
2. リレーションデータの型を指定する
3. カスタムフィールドの型を追加する

例えば：

```typescript
// Basic query with generics
const user = await User.query()
  .first<User & {
    computed_field: string;
  }>()

// Relationship query with generics
const post = await Post.query()
  .with('user')
  .first<Post & {
    user: User;
  }>()

// Custom query result type
interface CustomUserResult extends User {
  total_posts: number;
  latest_login: Date;
}

const result = await User.query()
  .select(['*'])
  .selectRaw('COUNT(posts.id) as total_posts')
  .first<CustomUserResult>()

// Complex relationship query types
const userWithPosts = await User.query()
  .with('posts')
  .first<CustomUserResult & {
    posts: Post[];
  }>()
```

## なぜこの設計なのか？

私たちの設計思想は次のとおりです：

1. **開発者体験を優先する**：複雑な型定義に悩まされるよりも、API はシンプルで直感的であり続けることを望んでいます
2. **実用性を第一に**：特定のシナリオでは、より柔軟な API のために多少の型安全性を犠牲にすることを選択します
3. **段階的な型サポート**：必要に応じて型定義を徐々に追加できます

## ベストプラクティス

このようなアプローチを取っていますが、次のことは引き続き推奨します：

1. モデルの主要な属性に型を宣言する
2. 重要なビジネスロジックのコードに型アノテーションを追加する
3. 型安全性が必要な箇所では型アサーションやカスタム型ガードを使用する

```typescript
// Declare types for important model properties
class Product extends Model {
  declare id: number
  declare name: string
  declare price: number
  declare stock: number

  // Use explicit types for custom methods
  async updateStock(quantity: number): Promise<void> {
    this.stock += quantity
    await this.save()
  }
}