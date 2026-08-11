---
date: 2026-08-11
title: "Getting Started with Sutando: Build Your First Node.js App"
tags: [Sutando, Node.js, Tutorial, ORM, Beginner]
author: Dylan Yu
image: https://storage.sutando.org/og-1751395044936.jpg
---

![image](https://storage.sutando.org/og-1751395044936.jpg)

---

<PostDetail>

New to Sutando? This tutorial walks you through everything you need to build your first Node.js application with Sutando ORM — from installation to a working CRUD API.

## Prerequisites

- Node.js 18+ installed
- A database (MySQL, PostgreSQL, or SQLite)
- Basic JavaScript/TypeScript knowledge

## Step 1: Installation

Create a new project and install Sutando:

```bash
mkdir my-app && cd my-app
npm init -y
npm install sutando
```

Install your database driver:

```bash
# MySQL
npm install mysql2

# PostgreSQL
npm install pg

# SQLite
npm install better-sqlite3
```

## Step 2: Database Configuration

Create a `database.ts` file to set up your connection:

```ts
import { sutando } from 'sutando';

sutando.addConnection({
  client: 'mysql2',
  connection: {
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'my_app'
  }
});

export default sutando;
```

### Using Multiple Connections

```ts
sutando.addConnection({ /* ... */ }, 'primary');
sutando.addConnection({ /* ... */ }, 'replica');

// Use a specific connection
const db = sutando.connection('replica');
```

## Step 3: Creating Tables with Schema Builder

Sutando includes a schema builder for creating and modifying tables:

```ts
import { sutando } from './database';

async function setup() {
  await sutando.schema().createTable('users', table => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.string('email').notNullable().unique();
    table.string('password');
    table.timestamps();
  });

  await sutando.schema().createTable('posts', table => {
    table.increments('id').primary();
    table.string('title').notNullable();
    table.text('content');
    table.integer('user_id').unsigned().references('id').inTable('users');
    table.boolean('published').defaultTo(false);
    table.timestamps();
  });
}

setup();
```

## Step 4: Defining Models

Models are the heart of Sutando. Each model corresponds to a database table:

```ts
import { Model } from 'sutando';

class User extends Model {
  table = 'users';
  
  // Type casts
  casts = {
    is_admin: 'boolean',
    metadata: 'json',
  };
  
  // Relationships
  relationPosts() {
    return this.hasMany(Post, 'user_id');
  }
}

class Post extends Model {
  table = 'posts';
  
  casts = {
    published: 'boolean',
  };
  
  relationUser() {
    return this.belongsTo(User, 'user_id');
  }
  
  // Scope
  scopePublished(query) {
    return query.where('published', true);
  }
}

export { User, Post };
```

## Step 5: Basic CRUD Operations

### Create

```ts
// Create a new user
const user = new User();
user.name = 'Alice';
user.email = 'alice@example.com';
user.password = 'hashed_password';
await user.save();

// Or use the create method
const post = await Post.create({
  title: 'My First Post',
  content: 'Hello World!',
  user_id: user.id,
  published: true,
});
```

### Read

```ts
// Get all posts
const posts = await Post.query().get();

// Find by ID
const post = await Post.find(1);

// Query with conditions
const published = await Post.query()
  .where('published', true)
  .orderBy('created_at', 'desc')
  .limit(10)
  .get();

// Find first matching
const first = await Post.query().where('title', 'My First Post').first();

// Count
const count = await Post.query().where('published', true).count();
```

### Update

```ts
const post = await Post.find(1);
post.title = 'Updated Title';
post.published = true;
await post.save();

// Bulk update
await Post.query().where('user_id', 1).update({ published: true });
```

### Delete

```ts
const post = await Post.find(1);
await post.delete();

// Bulk delete
await Post.query().where('published', false).delete();
```

## Step 6: Working with Relationships

### Eager Loading

```ts
// Load user with their posts (2 queries total)
const user = await User.query().with('posts').find(1);
console.log(user.posts); // array of Post models

// Nested eager loading
const users = await User.query()
  .with('posts.comments')
  .get();
```

### Creating Related Records

```ts
const user = await User.find(1);
const post = await user.posts().create({
  title: 'New Post',
  content: 'Content here',
});
```

### Querying Relationships

```ts
const user = await User.find(1);
const publishedPosts = await user.posts().where('published', true).get();
```

## Step 7: Putting It All Together

Here's a complete Express API:

```ts
import express from 'express';
import './database';
import { User, Post } from './models';

const app = express();
app.use(express.json());

// List published posts
app.get('/posts', async (req, res) => {
  const posts = await Post.query()
    .with('user')
    .published()
    .orderBy('created_at', 'desc')
    .limit(20)
    .get();
  res.json(posts);
});

// Get single post
app.get('/posts/:id', async (req, res) => {
  const post = await Post.query()
    .with('user', 'comments')
    .find(req.params.id);
  if (!post) return res.status(404).json({ error: 'Not found' });
  res.json(post);
});

// Create post
app.post('/posts', async (req, res) => {
  const post = await Post.create(req.body);
  res.status(201).json(post);
});

// Update post
app.put('/posts/:id', async (req, res) => {
  const post = await Post.find(req.params.id);
  if (!post) return res.status(404).json({ error: 'Not found' });
  post.fill(req.body);
  await post.save();
  res.json(post);
});

// Delete post
app.delete('/posts/:id', async (req, res) => {
  const post = await Post.find(req.params.id);
  if (!post) return res.status(404).json({ error: 'Not found' });
  await post.delete();
  res.json({ success: true });
});

app.listen(3000, () => console.log('Server running on port 3000'));
```

## Next Steps

- [Model Relationships](https://sutando.org/guide/relationships.html) — master `hasMany`, `belongsTo`, and more
- [Database Migrations](https://sutando.org/guide/migrations.html) — version-control your schema
- [Model Events](https://sutando.org/guide/events.html) — hook into the model lifecycle

You now have a working Node.js app with Sutando. The full documentation is at [sutando.org](https://sutando.org/guide/getting-started.html).

</PostDetail>
