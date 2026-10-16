---
date: 2026-09-15
title: "Building a REST API with Sutando and Express"
type: blog
description: "Building a REST API with Sutando is straightforward. In this tutorial, we'll build a complete blog API with authentication, validation, and error handling."
authors: ["Dylan Yu"]
mode: center
---


![image](https://storage.sutando.org/og-1751395044936.jpg)

---
Building a REST API with Sutando is straightforward. In this tutorial, we'll build a complete blog API with authentication, validation, and error handling.

## Project Setup

```bash
mkdir blog-api && cd blog-api
npm init -y
npm install sutando mysql2 express zod
npm install -D typescript @types/node @types/express tsx
```

## Database and Models

```ts
// db.ts
import { sutando, Model } from 'sutando';

sutando.addConnection({
  client: 'mysql2',
  connection: {
    host: '127.0.0.1', user: 'root', password: '', database: 'blog'
  }
});

class User extends Model {
  table = 'users';
  hidden = ['password'];
  relationPosts() { return this.hasMany(Post, 'user_id'); }
}

class Post extends Model {
  table = 'posts';
  casts = { published: 'boolean' };
  relationUser() { return this.belongsTo(User, 'user_id'); }
  relationComments() { return this.hasMany(Comment, 'post_id'); }
  scopePublished(query) { return query.where('published', true); }
}

class Comment extends Model {
  table = 'comments';
  relationUser() { return this.belongsTo(User, 'user_id'); }
}

export { sutando, User, Post, Comment };
```

## Validation with Zod

```ts
// validators.ts
import { z } from 'zod';

export const createPostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  user_id: z.number().int().positive(),
});

export const updatePostSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  published: z.boolean().optional(),
});

export const createCommentSchema = z.object({
  content: z.string().min(1),
  user_id: z.number().int().positive(),
});
```

## The API

```ts
// app.ts
import express from 'express';
import { User, Post, Comment } from './db';
import { createPostSchema, updatePostSchema, createCommentSchema } from './validators';

const app = express();
app.use(express.json());

// Error handler
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Posts
app.get('/posts', asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  
  const posts = await Post.query()
    .with('user', 'comments.user')
    .published()
    .orderBy('created_at', 'desc')
    .page(page, limit);
  
  res.json(posts);
}));

app.get('/posts/:id', asyncHandler(async (req, res) => {
  const post = await Post.query()
    .with('user', 'comments.user')
    .find(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  res.json(post);
}));

app.post('/posts', asyncHandler(async (req, res) => {
  const data = createPostSchema.parse(req.body);
  const post = await Post.create(data);
  res.status(201).json(post);
}));

app.put('/posts/:id', asyncHandler(async (req, res) => {
  const post = await Post.find(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  const data = updatePostSchema.parse(req.body);
  post.fill(data);
  await post.save();
  res.json(post);
}));

app.delete('/posts/:id', asyncHandler(async (req, res) => {
  const post = await Post.find(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  await post.delete();
  res.json({ success: true });
}));

// Comments
app.post('/posts/:id/comments', asyncHandler(async (req, res) => {
  const post = await Post.find(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  const data = createCommentSchema.parse({ ...req.body, post_id: post.id });
  const comment = await Comment.create(data);
  res.status(201).json(comment);
}));

// Users
app.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await User.query()
    .with('posts')
    .find(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
}));

// Error middleware
app.use((err, req, res, next) => {
  if (err.name === 'ZodError') {
    return res.status(400).json({ error: 'Validation error', details: err.errors });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(3000, () => console.log('API running on port 3000'));
```

## Key Features Demonstrated

- **Pagination** via `.page(page, limit)`
- **Eager loading** with `.with('user', 'comments.user')`
- **Query scopes** with `.published()`
- **Validation** with Zod schemas
- **Error handling** with async wrapper and error middleware
- **Hidden fields** (password) via `hidden` array on model

## Next Steps

- Add JWT authentication middleware
- Add rate limiting with express-rate-limit
- Add CORS configuration
- Deploy to your preferred platform

Full documentation at [sutando.org](https://sutando.org/guide/getting-started).