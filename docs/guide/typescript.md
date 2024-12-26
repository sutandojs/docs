# TypeScript Support

Sutando provides TypeScript support with a pragmatic approach - balancing usability and type safety. We prioritize intuitive and easy-to-use APIs over complete type safety.

## Basic Usage

Here are some basic examples:

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

## Type Safety Notes

While Sutando provides TypeScript support, we don't aim for complete type safety. This means:

1. Some dynamic features may not have complete type inference
2. Certain query builder operations might return `any` type
3. Relationship type inference may be incomplete

For example:

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

## Enhancing Type Safety with Generics

To address the above type inference limitations, Sutando's query methods support generic types, allowing you to:

1. Extend model type definitions
2. Specify relationship data types
3. Add custom field types

For example:

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

## Why This Design?

Our design philosophy is:

1. **Prioritize Developer Experience**: We want our API to remain simple and intuitive, rather than being bogged down by complex type definitions
2. **Practicality First**: In certain scenarios, we choose to sacrifice some type safety for more flexible APIs
3. **Progressive Type Support**: You can gradually add more type definitions as needed

## Best Practices

Despite our approach, we still recommend:

1. Declaring types for main model properties
2. Adding type annotations to critical business logic code
3. Using type assertions or custom type guards where type safety is needed

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