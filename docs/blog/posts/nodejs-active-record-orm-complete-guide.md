---
date: 2026-08-04
title: "Node.js Active Record ORM: A Complete Guide"
type: blog
description: "The Active Record pattern is one of the most intuitive ways to interact with a database. If you've ever used Laravel's Eloquent or Ruby on Rails, you…"
authors: ["Dylan Yu"]
mode: center
---


![image](https://storage.sutando.org/og-1751395044936.jpg)

---
The Active Record pattern is one of the most intuitive ways to interact with a database. If you've ever used Laravel's Eloquent or Ruby on Rails, you already know how productive it can be. In this guide, we'll explore what Active Record is, how it differs from other ORM patterns, and how to use it in Node.js with Sutando.

## What Is the Active Record Pattern?

Active Record is a design pattern where each model class corresponds to a database table, and each instance represents a row. The model itself handles persistence — you call methods like `save()`, `delete()`, and `update()` directly on the instance.

```ts
const user = new User();
user.name = 'Alice';
user.email = 'alice@example.com';
await user.save(); // INSERT INTO users ...
```

This is fundamentally different from the Data Mapper pattern (used by Prisma, TypeORM's EntityRepository, or Java's Hibernate), where a separate mapper/repository handles database operations:

```ts
// Data Mapper style (e.g., Prisma)
const user = await prisma.user.create({
  data: { name: 'Alice', email: 'alice@example.com' }
});
```

### Active Record vs Data Mapper: Which Is Better?

Neither is universally "better." Each has trade-offs:

| Aspect | Active Record | Data Mapper |
|--------|--------------|-------------|
| Simplicity | High — methods on the model | Medium — separate repository layer |
| Testability | Good — mock model methods | Excellent — inject repositories |
| Coupling | Model knows about DB | Model is persistence-ignorant |
| Learning curve | Low for beginners | Higher — more concepts |
| Best for | Rapid development, CRUD apps | Complex domains, enterprise apps |

For most Node.js projects — especially APIs, SaaS products, and prototyping — Active Record's simplicity wins. You write less code, iterate faster, and the cognitive overhead is minimal.

## Active Record Implementations in Node.js {#active-record-implementations-in-node-js}

The Node.js ecosystem has several Active Record implementations:

### 1. Sutando ORM {#_1-sutando-orm}

[Sutando](https://sutando.org) is the most faithful port of Laravel's Eloquent to Node.js. It supports MySQL, PostgreSQL, and SQLite, with features like:

- Fluent query builder with `where`, `orderBy`, `with` (eager loading)
- Model relationships: `hasMany`, `belongsTo`, `hasOne`, `morphTo`
- Soft deletes, model events/hooks, and global scopes
- Database migrations and schema builder
- Factories and seeders for testing

```ts
import { Model } from 'sutando';

class User extends Model {
  table = 'users';
  
  relationPosts() {
    return this.hasMany(Post);
  }
}

// Query
const users = await User.query().where('active', true).get();

// Create
const user = new User();
user.name = 'Alice';
await user.save();

// Relationships
const user = await User.query().with('posts').find(1);
```

### 2. AdonisJS Lucid {#_2-adonisjs-lucid}

Lucid is the built-in ORM for the AdonisJS framework. It's also Active Record and inspired by Eloquent. However, it's tightly coupled to the AdonisJS ecosystem — you can't use it in a standalone Express or Fastify project.

### 3. TypeORM (Active Record mode) {#_3-typeorm-active-record-mode}

TypeORM supports both Active Record and Data Mapper patterns. In Active Record mode, models extend a base `BaseEntity` class:

```ts
import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from 'typeorm';

@Entity()
class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;
  
  @Column()
  name: string;
}

const user = new User();
user.name = 'Alice';
await user.save();
```

TypeORM works, but it relies heavily on decorators and has faced criticism for maintenance issues and TypeScript decorator instability.

## Building a CRUD App with Active Record

Let's build a simple blog API using Sutando to demonstrate Active Record in action.

### Setup

```bash
npm install sutando mysql2 express
```

### Database Configuration

```ts
import { sutando } from 'sutando';

sutando.addConnection({
  client: 'mysql2',
  connection: {
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'blog'
  }
});
```

### Define Models

```ts
import { Model } from 'sutando';

class Post extends Model {
  table = 'posts';
  
  relationAuthor() {
    return this.belongsTo(User, 'user_id');
  }
  
  relationComments() {
    return this.hasMany(Comment);
  }
}

class Comment extends Model {
  table = 'comments';
  
  relationPost() {
    return this.belongsTo(Post);
  }
}

class User extends Model {
  table = 'users';
  
  relationPosts() {
    return this.hasMany(Post, 'user_id');
  }
}
```

### CRUD Operations

```ts
import express from 'express';
const app = express();
app.use(express.json());

// Create
app.post('/posts', async (req, res) => {
  const post = new Post();
  post.title = req.body.title;
  post.content = req.body.content;
  post.user_id = req.body.userId;
  await post.save();
  res.json(post);
});

// Read (with eager loading)
app.get('/posts', async (req, res) => {
  const posts = await Post.query()
    .with('author', 'comments')
    .orderBy('created_at', 'desc')
    .limit(20)
    .get();
  res.json(posts);
});

// Read single
app.get('/posts/:id', async (req, res) => {
  const post = await Post.query().with('author', 'comments').find(req.params.id);
  if (!post) return res.status(404).json({ error: 'Not found' });
  res.json(post);
});

// Update
app.put('/posts/:id', async (req, res) => {
  const post = await Post.find(req.params.id);
  if (!post) return res.status(404).json({ error: 'Not found' });
  post.title = req.body.title;
  post.content = req.body.content;
  await post.save();
  res.json(post);
});

// Delete
app.delete('/posts/:id', async (req, res) => {
  const post = await Post.find(req.params.id);
  if (!post) return res.status(404).json({ error: 'Not found' });
  await post.delete();
  res.json({ success: true });
});

app.listen(3000);
```

## Advanced Active Record Features

### Eager Loading

One of the most powerful Active Record features is eager loading — loading relationships in a single query to avoid N+1 problems:

```ts
// Bad: N+1 queries
const users = await User.query().get();
for (const user of users) {
  const posts = await user.posts; // 1 query per user
}

// Good: 2 queries total
const users = await User.query().with('posts').get();
```

### Scopes

Scopes let you define reusable query constraints:

```ts
class Post extends Model {
  scopePublished(query) {
    return query.where('published', true);
  }
}

// Usage
const posts = await Post.query().published().get();
```

### Model Events

Hook into the model lifecycle to run custom logic:

```ts
Post.creating(async (post) => {
  post.slug = post.title.toLowerCase().replace(/\s+/g, '-');
});

Post.deleting(async (post) => {
  await post.comments.delete(); // cascade delete
});
```

## When to Choose Active Record

**Active Record is a great fit when:**

- You want rapid development with minimal boilerplate
- Your app is primarily CRUD-oriented
- You're coming from Laravel, Rails, or similar frameworks
- You value readable, self-documenting code
- You're building prototypes or MVPs

**Consider Data Mapper when:**

- You have complex domain logic that needs to be persistence-ignorant
- You're building a large enterprise application with strict separation of concerns
- You need to swap out persistence layers easily

## Conclusion

Active Record remains one of the most productive patterns for database interaction in Node.js. With Sutando, you get a faithful Eloquent-style experience that's framework-agnostic, lightweight, and intuitive. Whether you're migrating from Laravel or just starting a new Node.js project, Active Record with Sutando lets you focus on your application logic rather than fighting your ORM.

Ready to try it? Check out the [Sutando documentation](https://sutando.org/guide/getting-started) or run `npm install sutando` to get started.