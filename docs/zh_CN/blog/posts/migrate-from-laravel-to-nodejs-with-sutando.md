---
date: 2026-11-03
title: "从 Laravel 迁移到 Node.js：用 Sutando 无缝切换"
type: blog
description: "很多 Laravel 开发者想尝试 Node.js，但舍不得 Eloquent。好消息是，Sutando 几乎完美复刻了 Eloquent 的 API，让你可以无缝切换。本文将从实际迁移角度，详细对比 Laravel 和 Node.js + Sutando 的开发体验。"
authors: ["Dylan Yu"]
mode: center
---


很多 Laravel 开发者想尝试 Node.js，但舍不得 Eloquent。好消息是，Sutando 几乎完美复刻了 Eloquent 的 API，让你可以无缝切换。本文将从实际迁移角度，详细对比 Laravel 和 Node.js + Sutando 的开发体验。

## 为什么要从 Laravel 迁移到 Node.js？

- **全栈 TypeScript**：前后端共享类型，减少沟通成本
- **实时能力**：WebSocket、SSE 在 Node.js 事件循环中更自然
- **Serverless/Edge**：部署到 Cloudflare Workers、Vercel Edge
- **npm 生态**：在某些领域（前端工具链、AI SDK）npm 比 Composer 更丰富
- **团队技能**：团队更熟悉 JavaScript

## Eloquent vs Sutando 概念映射

| Laravel Eloquent | Sutando |
|------------------|---------|
| `Model` 基类 | `Model` 基类 |
| `protected $table` | `table =` |
| `protected $casts` | `casts =` |
| `protected $fillable` | `fillable =` |
| `protected $hidden` | `hidden =` |
| `hasMany` | `hasMany` |
| `belongsTo` | `belongsTo` |
| `hasOne` | `hasOne` |
| `belongsToMany` | `belongsToMany` |
| `morphTo` / `morphMany` | `morphTo` / `morphMany` |
| `with()` 预加载 | `with()` 预加载 |
| `scope` 查询作用域 | `scope` 查询作用域 |
| 模型事件 (`creating`, `saving` 等) | 模型事件（相同） |
| `SoftDeletes` trait | `SoftDeletes` trait |
| `Factory` | `Factory` |
| `Seeder` | `Seeder` |

## 代码对比

### 模型定义

```php
// Laravel
class User extends Model {
    protected $table = 'users';
    protected $casts = ['is_admin' => 'boolean', 'metadata' => 'array'];
    protected $fillable = ['name', 'email', 'password'];
    
    public function posts(): HasMany {
        return $this->hasMany(Post::class);
    }
    
    public function scopeActive($query) {
        return $query->where('active', true);
    }
}
```

```ts
// Sutando
class User extends Model {
  table = 'users';
  casts = { is_admin: 'boolean', metadata: 'json' };
  fillable = ['name', 'email', 'password'];
  
  relationPosts() {
    return this.hasMany(Post, 'user_id');
  }
  
  scopeActive(query) {
    return query.where('active', true);
  }
}
```

### 查询

```php
// Laravel
$users = User::with('posts.comments')
    ->where('active', true)
    ->active()
    ->orderBy('created_at', 'desc')
    ->limit(10)
    ->get();
```

```ts
// Sutando
const users = await User.query()
  .with('posts.comments')
  .where('active', true)
  .active()
  .orderBy('created_at', 'desc')
  .limit(10)
  .get();
```

### 创建

```php
// Laravel
$user = User::create(['name' => 'Alice', 'email' => 'alice@example.com']);
```

```ts
// Sutando
const user = await User.create({ name: 'Alice', email: 'alice@example.com' });
```

### 模型事件

```php
// Laravel
User::creating(function ($user) {
    $user->password = bcrypt($user->password);
});
```

```ts
// Sutando
User.creating(async (user) => {
  user.password = await bcrypt.hash(user.password, 10);
});
```

## 路由迁移

```php
// Laravel
Route::get('/posts', [PostController::class, 'index']);
Route::post('/posts', [PostController::class, 'store']);
```

```ts
// Express
app.get('/posts', async (req, res) => {
  const posts = await Post.query().with('user').published().get();
  res.json(posts);
});

app.post('/posts', async (req, res) => {
  const post = await Post.create(req.body);
  res.status(201).json(post);
});
```

## 无法直接映射的部分

| Laravel 功能 | Node.js 替代方案 |
|-------------|-----------------|
| Blade 模板 | React / Vue / 纯 API |
| 认证系统 | JWT / Passport.js |
| FormRequest 验证 | Zod / Joi / express-validator |
| 队列（Queue） | BullMQ / Cloudflare Queues |
| 邮件（Mail） | Nodemailer / Cloudflare Email |
| Artisan 命令 | npm scripts / Commander |
| Service Container | 手动 DI / 框架内置 |

## 迁移策略

### 1. 绞杀者模式（推荐）

不要一次性全部重写。用 Nginx 做反向代理，逐路由迁移：

```
/api/posts → Node.js 服务
/api/users → 暂时还是 Laravel
```

### 2. 共享数据库

Sutando 可以直接操作 Laravel 创建的数据库 schema，无需迁移数据。

### 3. Session 共享

把 Session 放到 Redis，Laravel 和 Node.js 都能读写，实现渐进式迁移。

### 4. 从只读 API 开始

先迁移 GET 路由（风险最低），验证通过后再迁移写操作。

## 实战：迁移一个博客

假设有一个 Laravel 博客，包含 User、Post、Comment 三个模型：

```ts
// Node.js + Sutando 等价实现
import { sutando, Model } from 'sutando';
import express from 'express';

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

const app = express();
app.use(express.json());

app.get('/posts', async (req, res) => {
  const posts = await Post.query()
    .with('user', 'comments.user')
    .published()
    .orderBy('created_at', 'desc')
    .limit(20)
    .get();
  res.json(posts);
});

app.listen(3000);
```

## 总结

从 Laravel 迁移到 Node.js 不意味着放弃 Eloquent 的开发体验。Sutando 几乎是 Eloquent 在 Node.js 中的镜像——相同的 API、相同的思维模式、相同的功能集。你可以保持现有数据库，逐路由迁移，团队从第一天就能高效工作。

从 `npm install sutando` 开始，查看[中文文档](https://sutando.org/zh_CN/guide/getting-started.html)。