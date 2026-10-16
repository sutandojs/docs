# TypeScript 支持

Sutando 提供了 TypeScript 支持，但我们采取了实用主义的方式 - 在易用性和类型安全性之间取得平衡。我们更注重提供直观、易用的 API，而不是追求完全的类型安全。

## 基本用法

以下是一些基本示例：

```typescript
import { Model } from 'sutando'

// 定义一个基本的模型
class User extends Model {
  // 可选：声明模型属性类型
  declare id: number
  declare name: string
  declare email: string
}

// 使用模型
const user = new User()
user.name = 'John'
await user.save()

// 查询示例
const users = await User.query()
  .where('age', '>', 18)
  .get()

// 关联关系示例
class Post extends Model {
  declare title: string
  declare content: string
  declare user_id: number

  relationUser() {
    return this.belongsTo(User)
  }
}
```

## 类型安全说明

虽然 Sutando 提供了 TypeScript 支持，但我们并不追求完全的类型安全。这意味着：

1. 某些动态特性可能无法获得完整的类型推导
2. 查询构建器的某些操作可能返回 `any` 类型
3. 关联关系的类型推导可能不够完善

例如：

```typescript
// 这样的动态查询可能无法获得准确的类型推导
const result = await User.query()
  .select(['name', 'email'])
  .where('age', '>', 18)
  .first()

// 关联关系查询的类型推导可能不够完善
const userWithPosts = await User.query()
  .with('posts')
  .first()
```

## 使用泛型增强类型安全

为了解决上述类型推导的限制，Sutando 的查询方法支持泛型类型，这让你可以：

1. 扩展模型的类型定义
2. 指定关联数据的类型
3. 添加自定义字段的类型

例如：

```typescript
// 基础查询使用泛型
const user = await User.query()
  .first<User & {
    computed_field: string;
  }>()

// 关联查询使用泛型
const post = await Post.query()
  .with('user')
  .first<Post & {
    user: User;
  }>()

// 自定义查询结果类型
interface CustomUserResult extends User {
  total_posts: number;
  latest_login: Date;
}

const result = await User.query()
  .select(['*'])
  .selectRaw('COUNT(posts.id) as total_posts')
  .first<CustomUserResult>()

// 复杂的关联查询类型
const userWithPosts = await User.query()
  .with('posts')
  .first<CustomUserResult & {
    posts: Post[];
  }>()
```

## 为什么这样设计？

我们的设计理念是：

1. **优先考虑开发体验**：我们希望 API 保持简单直观，而不是被复杂的类型定义所困扰
2. **实用性优先**：在某些场景下，我们选择牺牲一定的类型安全性来换取更灵活的 API
3. **渐进式类型支持**：你可以根据需要逐步添加更多类型定义

## 最佳实践

尽管如此，我们仍然建议：

1. 为模型的主要属性声明类型
2. 对关键的业务逻辑代码添加类型注解
3. 在需要类型安全的地方使用类型断言或自定义类型守卫

```typescript
// 为重要的模型属性声明类型
class Product extends Model {
  declare id: number
  declare name: string
  declare price: number
  declare stock: number

  // 自定义方法使用明确的类型
  async updateStock(quantity: number): Promise<void> {
    this.stock += quantity
    await this.save()
  }
}