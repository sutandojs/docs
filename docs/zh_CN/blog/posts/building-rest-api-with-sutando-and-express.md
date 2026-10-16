---
date: 2026-09-15
title: "用 Sutando 和 Express 构建 REST API"
type: blog
description: "用 Sutando 构建 REST API 非常简单。本教程将构建一个完整的博客 API，包含验证和错误处理。"
authors: ["Dylan Yu"]
mode: center
---


![image](https://storage.sutando.org/og-1751395044936.jpg)

---
用 Sutando 构建 REST API 非常简单。本教程将构建一个完整的博客 API，包含验证和错误处理。

## 项目搭建

```bash
mkdir blog-api && cd blog-api
npm init -y
npm install sutando mysql2 express zod
```

## 数据库和模型

```ts
import { sutando, Model } from 'sutando';

sutando.addConnection({
  client: 'mysql2',
  connection: { host: '127.0.0.1', user: 'root', password: '', database: 'blog' }
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
```

## API 路由

```ts
// 文章列表（分页 + 预加载）
app.get('/posts', async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const posts = await Post.query()
    .with('user', 'comments.user')
    .published()
    .orderBy('created_at', 'desc')
    .page(page, limit);
  res.json(posts);
});

// 创建文章（带验证）
app.post('/posts', async (req, res) => {
  const data = createPostSchema.parse(req.body);
  const post = await Post.create(data);
  res.status(201).json(post);
});

// 更新文章
app.put('/posts/:id', async (req, res) => {
  const post = await Post.find(req.params.id);
  if (!post) return res.status(404).json({ error: '文章不存在' });
  post.fill(updatePostSchema.parse(req.body));
  await post.save();
  res.json(post);
});

// 删除文章
app.delete('/posts/:id', async (req, res) => {
  const post = await Post.find(req.params.id);
  if (!post) return res.status(404).json({ error: '文章不存在' });
  await post.delete();
  res.json({ success: true });
});

// 添加评论
app.post('/posts/:id/comments', async (req, res) => {
  const post = await Post.find(req.params.id);
  if (!post) return res.status(404).json({ error: '文章不存在' });
  const comment = await Comment.create({ ...req.body, post_id: post.id });
  res.status(201).json(comment);
});
```

## 展示的关键功能

- **分页**：`.page(page, limit)`
- **预加载**：`.with('user', 'comments.user')`
- **查询作用域**：`.published()`
- **验证**：用 Zod schema
- **错误处理**：async 包装器 + 错误中间件
- **隐藏字段**：模型上的 `hidden` 数组隐藏密码

完整文档请访问 [sutando.org](https://sutando.org/zh_CN/guide/getting-started.html)。