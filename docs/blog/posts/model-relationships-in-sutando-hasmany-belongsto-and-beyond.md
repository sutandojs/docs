---
date: 2026-09-22
title: "Model Relationships in Sutando: hasMany, belongsTo, and Beyond"
type: blog
description: "Relationships are the heart of any ORM. Sutando brings Laravel Eloquent's relationship system to Node.js, making it easy to define and query complex data…"
authors: ["Dylan Yu"]
mode: center
---


![image](https://storage.sutando.org/og-1751395044936.jpg)

---
Relationships are the heart of any ORM. Sutando brings Laravel Eloquent's relationship system to Node.js, making it easy to define and query complex data relationships. This guide covers every relationship type with practical examples.

## Defining Relationships

In Sutando, relationships are defined as methods on your model with a `relation` prefix:

```ts
class User extends Model {
  table = 'users';
  
  relationPosts() {
    return this.hasMany(Post, 'user_id');
  }
}
```

## One-to-Many: hasMany

A user has many posts:

```ts
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
```

### Querying

```ts
// Eager load
const user = await User.query().with('posts').find(1);
console.log(user.posts); // Post[]

// Query the relationship
const user = await User.find(1);
const publishedPosts = await user.posts().where('published', true).get();

// Create related
const post = await user.posts().create({
  title: 'New Post',
  content: 'Hello!',
});

// Save related
const post = new Post();
post.title = 'New Post';
await user.posts().save(post);
```

## One-to-One: hasOne

A user has one profile:

```ts
class User extends Model {
  table = 'users';
  relationProfile() {
    return this.hasOne(Profile, 'user_id');
  }
}

class Profile extends Model {
  table = 'profiles';
  relationUser() {
    return this.belongsTo(User, 'user_id');
  }
}
```

```ts
const user = await User.query().with('profile').find(1);
console.log(user.profile); // Profile
```

## Many-to-Many: belongsToMany

A user belongs to many roles through a pivot table:

```ts
class User extends Model {
  table = 'users';
  relationRoles() {
    return this.belongsToMany(Role, 'user_roles', 'user_id', 'role_id');
  }
}

class Role extends Model {
  table = 'roles';
  relationUsers() {
    return this.belongsToMany(User, 'user_roles', 'role_id', 'user_id');
  }
}
```

```ts
// Get user with roles
const user = await User.query().with('roles').find(1);
console.log(user.roles); // Role[]

// Attach / detach
await user.roles().attach([1, 2, 3]); // attach role IDs
await user.roles().detach([2]); // detach role ID 2
await user.roles().sync([1, 3]); // sync: detach all others, attach these

// With pivot data
await user.roles().attach(1, { expires_at: '2026-12-31' });
```

## Polymorphic Relationships

A tag can belong to either a Post or a Video:

```ts
class Tag extends Model {
  table = 'tags';
  relationTaggable() {
    return this.morphTo();
  }
}

class Post extends Model {
  table = 'posts';
  relationTags() {
    return this.morphMany(Tag, 'taggable');
  }
}

class Video extends Model {
  table = 'videos';
  relationTags() {
    return this.morphMany(Tag, 'taggable');
  }
}
```

```ts
// Add tags to a post
await post.tags().create({ name: 'laravel' });
await post.tags().create({ name: 'nodejs' });

// Get tags with their taggable parent
const tags = await Tag.query().with('taggable').get();
```

## Nested Eager Loading

Load relationships across multiple levels:

```ts
// Load user → posts → comments → user
const users = await User.query()
  .with('posts.comments.user')
  .get();

// Load specific relationships at each level
const users = await User.query()
  .with({
    posts: query => query.with('comments.user').where('published', true)
  })
  .get();
```

## Preventing N+1 Queries

The N+1 problem is the most common ORM performance issue. Sutando solves it with eager loading:

```ts
// BAD: N+1 (1 + N queries)
const users = await User.query().get();
for (const user of users) {
  console.log(await user.posts); // 1 query per user
}

// GOOD: 2 queries total
const users = await User.query().with('posts').get();
for (const user of users) {
  console.log(user.posts); // already loaded
}
```

## Relationship Methods Summary

| Method | Use Case | Example |
|--------|---------|---------|
| `hasMany` | One-to-Many | User → Posts |
| `belongsTo` | Inverse One-to-Many | Post → User |
| `hasOne` | One-to-One | User → Profile |
| `belongsToMany` | Many-to-Many | User ↔ Roles |
| `morphMany` | Polymorphic One-to-Many | Post/Video → Tags |
| `morphTo` | Polymorphic Inverse | Tag → Post/Video |

## Conclusion

Sutando's relationship system mirrors Eloquent's, making complex data relationships simple to define and query. With eager loading, you avoid N+1 problems while keeping your code clean and readable.

Learn more in the [Sutando documentation](https://sutando.org/guide/relationships).