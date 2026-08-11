---
date: 2026-09-22
title: "从 Laravel 迁移到 Node.js：用 Sutando 无缝切换"
tags: [Laravel, Node.js, Sutando, Migration, Eloquent]
author: Dylan Yu
image: https://storage.sutando.org/og-1751395044936.jpg
---

![image](https://storage.sutando.org/og-1751395044936.jpg)

---

<PostDetail>

如果你是 Laravel 开发者，考虑转向 Node.js，最大的顾虑通常是离开 Eloquent。有了 Sutando，你不必放弃。本指南将带你逐步迁移 Laravel 应用到 Node.js，将 Eloquent 的每个概念映射到 Sutando。

## 为什么从 Laravel 迁移到 Node.js？

常见原因：

- **实时功能**：WebSocket、SSE、流式传输——Node.js 的事件循环原生支持
- **全栈 TypeScript**：前后端共享类型
- **Serverless/Edge**：部署到 Cloudflare Workers、Vercel Edge 或 AWS Lambda
- **团队能力**：团队更熟悉 JavaScript 而非 PHP
- **生态**：npm 生态在某些领域比 Composer 更丰富

## 概念映射：Laravel → Node.js + Sutando

| Laravel | Node.js + Sutando |
|---------|-------------------|
| Eloquent Model | Sutando Model 类 |
| Migration | Sutando Schema Builder |
| Seeder | Sutando Seeder |
| Factory | Sutando Factory |
| Route | Express / Fastify 路由 |
| Middleware | Express 中间件 |
| Blade | React / Vue / 纯 API |
| Artisan CLI | 自定义 npm 脚本 |

## Eloquent Model → Sutando Model

### Laravel (PHP)

```php
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

### Sutando (TypeScript)

```ts
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

映射几乎是 1:1 的。主要区别：
- `protected $table` → `table =`
- `protected $casts` → `casts =`
- 关联方法使用 `relation` 前缀
- 作用域使用 `scope` 前缀

## 查询对比

### 预加载

```php
// Laravel
$users = User::with('posts.comments')->get();
```

```ts
// Sutando
const users = await User.query().with('posts.comments').get();
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

## Migration: Laravel → Sutando Schema Builder

```php
// Laravel
Schema::create('users', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->string('email')->unique();
    $table->timestamps();
});
```

```ts
// Sutando
await sutando.schema().createTable('users', table => {
  table.increments('id').primary();
  table.string('name');
  table.string('email').unique();
  table.timestamps();
});
```

## 路由：Laravel → Express

```php
// Laravel
Route::get('/posts', [PostController::class, 'index']);
```

```ts
// Express
app.get('/posts', async (req, res) => {
  const posts = await Post.query().with('user').get();
  res.json(posts);
});
```

## 无法直接映射的部分

一些 Laravel 功能需要在 Node.js 中手动实现：

- **认证**：Laravel 内置认证 → 使用 JWT、Passport.js 或自定义中间件
- **验证**：Laravel FormRequest → 使用 Zod、Joi 或 express-validator
- **队列/任务**：Laravel Queue → 使用 BullMQ 或 Cloudflare Queues
- **邮件**：Laravel Mail → 使用 Nodemailer 或 Cloudflare Email
- **Artisan 命令** → 自定义 npm 脚本或 Commander 等 CLI 框架

## 迁移策略

1. **保持同一个数据库**——Sutando 可以直接操作现有的 MySQL/PostgreSQL schema
2. **逐路由迁移**——用 Nginx 做反向代理分流
3. **从只读路由开始**——风险最低
4. **Session 放 Redis**——PHP 和 Node 都能读取
5. **不要一次性全部重写**——绞杀者模式（strangler fig）是好方法

## 总结

从 Laravel 迁移到 Node.js 不意味着放弃 Eloquent。Sutando 带来了几乎相同的 Active Record 体验。你可以保持现有数据库 schema，逐路由迁移，团队从第一天就能高效工作。

从 `npm install sutando` 开始，查看[文档](https://sutando.org/zh_CN/guide/getting-started.html)。

</PostDetail>
