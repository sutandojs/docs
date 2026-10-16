---
date: 2026-10-13
title: "Soft Deletes, Hooks, and Scopes in Sutando"
type: blog
description: "Sutando includes several powerful features that go beyond basic CRUD: soft deletes, model events (hooks), and query scopes. This guide covers all three…"
authors: ["Dylan Yu"]
mode: center
---


![image](https://storage.sutando.org/og-1751395044936.jpg)

---
Sutando includes several powerful features that go beyond basic CRUD: soft deletes, model events (hooks), and query scopes. This guide covers all three with practical examples.

## Soft Deletes

Soft deletes allow you to "delete" records without actually removing them from the database. A `deleted_at` column marks records as deleted.

### Setup

Add a `deleted_at` column to your table:

```ts
await sutando.schema().table('posts', table => {
  table.timestamp('deleted_at').nullable();
});
```

Enable soft deletes on your model:

```ts
import { Model, SoftDeletes } from 'sutando';

class Post extends Model {
  table = 'posts';
  use = [SoftDeletes];
}
```

### Usage

```ts
// Soft delete — sets deleted_at instead of removing
const post = await Post.find(1);
await post.delete();
// Record still exists in the database with deleted_at set

// Normal queries exclude soft-deleted records
const posts = await Post.query().get(); // deleted records excluded

// Include soft-deleted records
const allPosts = await Post.query().withTrashed().get();

// Only soft-deleted records
const trashedPosts = await Post.query().onlyTrashed().get();

// Restore a soft-deleted record
const post = await Post.query().withTrashed().find(1);
await post.restore();

// Permanently delete
await post.forceDelete();
```

## Model Events (Hooks)

Sutando fires events throughout a model's lifecycle, letting you hook into create, update, and delete operations.

### Available Events

| Event | When |
|-------|------|
| `creating` | Before a new record is created |
| `created` | After a new record is created |
| `updating` | Before a record is updated |
| `updated` | After a record is updated |
| `saving` | Before save (create or update) |
| `saved` | After save (create or update) |
| `deleting` | Before a record is deleted |
| `deleted` | After a record is deleted |
| `restoring` | Before a soft-deleted record is restored |
| `restored` | After a soft-deleted record is restored |

### Registering Hooks

```ts
// Hash password before creating a user
User.creating(async (user) => {
  user.password = await bcrypt.hash(user.password, 10);
});

// Generate slug before saving a post
Post.saving(async (post) => {
  if (post.isDirty('title')) {
    post.slug = post.title.toLowerCase().replace(/\s+/g, '-');
  }
});

// Cascade delete comments when a post is deleted
Post.deleting(async (post) => {
  await post.comments().delete();
});

// Log after creation
Post.created(async (post) => {
  console.log(`Post created: ${post.title}`);
});
```

### Stopping an Operation

Return `false` from a `creating` or `updating` hook to abort:

```ts
User.creating(async (user) => {
  const exists = await User.query().where('email', user.email).exists();
  if (exists) return false; // prevents creation
});
```

## Query Scopes

Scopes are reusable query constraints that you can chain together.

### Defining Scopes

```ts
class Post extends Model {
  table = 'posts';
  
  scopePublished(query) {
    return query.where('published', true);
  }
  
  scopePopular(query) {
    return query.where('views', '>', 1000);
  }
  
  scopeRecent(query, days = 7) {
    return query.where('created_at', '>', new Date(Date.now() - days * 86400000));
  }
  
  scopeByUser(query, userId) {
    return query.where('user_id', userId);
  }
}
```

### Using Scopes

```ts
// Chain multiple scopes
const posts = await Post.query()
  .published()
  .popular()
  .recent(30)
  .orderBy('views', 'desc')
  .limit(10)
  .get();

// With parameters
const userPosts = await Post.query()
  .byUser(5)
  .published()
  .get();
```

### Global Scopes

Global scopes apply to all queries on a model automatically:

```ts
class Post extends Model {
  table = 'posts';
  
  static booted() {
    super.booted();
    this.addGlobalScope('published', (query) => {
      query.where('published', true);
    });
  }
}

// All queries now exclude unpublished posts
const posts = await Post.query().get();

// Skip global scope when needed
const allPosts = await Post.query().withoutGlobalScope('published').get();
```

## Combining All Three

Here's a real-world example combining soft deletes, hooks, and scopes:

```ts
import { Model, SoftDeletes } from 'sutando';

class Post extends Model {
  table = 'posts';
  use = [SoftDeletes];
  casts = { published: 'boolean' };
  
  // Scopes
  scopePublished(query) {
    return query.where('published', true);
  }
  
  scopePopular(query) {
    return query.where('views', '>', 1000);
  }
  
  // Hooks
  static booted() {
    super.booted();
    
    this.creating(async (post) => {
      post.slug = post.title.toLowerCase().replace(/\s+/g, '-');
    });
    
    this.deleting(async (post) => {
      await post.comments().delete();
    });
  }
  
  // Relationships
  relationComments() {
    return this.hasMany(Comment, 'post_id');
  }
  relationUser() {
    return this.belongsTo(User, 'user_id');
  }
}

// Usage
const popularPosts = await Post.query()
  .with('user')
  .published()
  .popular()
  .recent(30)
  .orderBy('views', 'desc')
  .limit(10)
  .get();
```

## Conclusion

Soft deletes, model events, and query scopes are three features that make Sutando more than just a query builder. They let you encode business logic directly into your models, keeping your controllers clean and your data consistent.

Learn more in the [Sutando documentation](https://sutando.org/guide/hooks).