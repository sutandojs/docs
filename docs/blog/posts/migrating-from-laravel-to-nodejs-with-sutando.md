---
date: 2026-09-08
title: "Migrating from Laravel to Node.js: A Practical Guide with Sutando"
type: blog
description: "If you're a Laravel developer considering a move to Node.js, the biggest concern is usually leaving Eloquent behind. With Sutando, you don't have to. This…"
authors: ["Dylan Yu"]
mode: center
---


![image](https://storage.sutando.org/og-1751395044936.jpg)

---
If you're a Laravel developer considering a move to Node.js, the biggest concern is usually leaving Eloquent behind. With Sutando, you don't have to. This guide walks through migrating a Laravel application to Node.js, mapping each concept from Eloquent to Sutando.

## Why Migrate from Laravel to Node.js?

Common reasons include:

- **Real-time features**: WebSocket, SSE, streaming — Node.js's event loop handles these natively
- **Full-stack TypeScript**: Share types between frontend and backend
- **Serverless/Edge**: Deploy to Cloudflare Workers, Vercel Edge, or AWS Lambda
- **Team skills**: Your team knows JavaScript better than PHP
- **Ecosystem**: npm's ecosystem is larger than Composer's for certain domains

## Concept Mapping: Laravel → Node.js + Sutando

| Laravel | Node.js + Sutando |
|---------|-------------------|
| Eloquent Model | Sutando Model class |
| Migration | Sutando Schema Builder |
| Seeder | Sutando Seeder |
| Factory | Sutando Factory |
| Route | Express / Fastify route |
| Middleware | Express middleware |
| Blade | React / Vue / API-only |
| Service Container | Manual DI / framework-specific |
| Artisan CLI | Custom npm scripts |

## Eloquent Model → Sutando Model

### Laravel (PHP)

```php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class User extends Model {
    protected $table = 'users';
    
    protected $casts = [
        'is_admin' => 'boolean',
        'metadata' => 'array',
    ];
    
    protected $fillable = ['name', 'email', 'password'];
    
    use SoftDeletes;
    
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
import { Model } from 'sutando';

class User extends Model {
  table = 'users';
  
  casts = {
    is_admin: 'boolean',
    metadata: 'json',
  };
  
  fillable = ['name', 'email', 'password'];
  
  relationPosts() {
    return this.hasMany(Post, 'user_id');
  }
  
  scopeActive(query) {
    return query.where('active', true);
  }
}
```

The mapping is nearly 1:1. The main differences:
- `protected $table` → `table =`
- `protected $casts` → `casts =`
- `$fillable` → `fillable =`
- Relationship methods use `relation` prefix
- Scopes use `scope` prefix
- No `use` statements for traits — soft deletes are configured differently

## Query Comparison

### Basic Query

```php
// Laravel
$users = User::where('active', true)
    ->orderBy('created_at', 'desc')
    ->limit(10)
    ->get();
```

```ts
// Sutando
const users = await User.query()
  .where('active', true)
  .orderBy('created_at', 'desc')
  .limit(10)
  .get();
```

### Eager Loading

```php
// Laravel
$users = User::with('posts.comments')->get();
```

```ts
// Sutando
const users = await User.query().with('posts.comments').get();
```

### Create

```php
// Laravel
$user = User::create(['name' => 'Alice', 'email' => 'alice@example.com']);
```

```ts
// Sutando
const user = await User.create({ name: 'Alice', email: 'alice@example.com' });
```

### Update

```php
// Laravel
$user = User::find(1);
$user->name = 'Bob';
$user->save();
```

```ts
// Sutando
const user = await User.find(1);
user.name = 'Bob';
await user.save();
```

### Model Events

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

### Laravel Migration

```php
Schema::create('users', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->string('email')->unique();
    $table->string('password');
    $table->boolean('active')->default(true);
    $table->timestamps();
});
```

### Sutando Schema Builder

```ts
await sutando.schema().createTable('users', table => {
  table.increments('id').primary();
  table.string('name');
  table.string('email').unique();
  table.string('password');
  table.boolean('active').defaultTo(true);
  table.timestamps();
});
```

## Routes: Laravel → Express

### Laravel

```php
Route::get('/posts', [PostController::class, 'index']);
Route::post('/posts', [PostController::class, 'store']);
Route::get('/posts/{id}', [PostController::class, 'show']);
```

### Express

```ts
app.get('/posts', async (req, res) => {
  const posts = await Post.query().with('user').get();
  res.json(posts);
});

app.post('/posts', async (req, res) => {
  const post = await Post.create(req.body);
  res.status(201).json(post);
});

app.get('/posts/:id', async (req, res) => {
  const post = await Post.query().with('user', 'comments').find(req.params.id);
  res.json(post);
});
```

## Practical Example: Migrating a Blog

Let's say you have a Laravel blog with User, Post, and Comment models. Here's the full Sutando equivalent:

```ts
import { sutando, Model } from 'sutando';
import express from 'express';

// Database setup
sutando.addConnection({
  client: 'mysql2',
  connection: { host: '127.0.0.1', user: 'root', password: '', database: 'blog' }
});

// Models
class User extends Model {
  table = 'users';
  relationPosts() { return this.hasMany(Post, 'user_id'); }
  relationComments() { return this.hasMany(Comment, 'user_id'); }
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
  relationPost() { return this.belongsTo(Post, 'post_id'); }
}

// Express app
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

app.post('/posts', async (req, res) => {
  const post = await Post.create({
    ...req.body,
    published: false,
  });
  res.status(201).json(post);
});

app.listen(3000);
```

## What Doesn't Map Directly

Some Laravel features need manual implementation in Node.js:

- **Authentication**: Laravel's built-in auth → use JWT, Passport.js, or custom middleware
- **Validation**: Laravel's FormRequest → use Zod, Joi, or express-validator
- **Queue/Jobs**: Laravel Queue → use BullMQ, or Cloudflare Queues
- **Mail**: Laravel Mail → use Nodemailer, or Cloudflare Email
- **Artisan commands**: → custom npm scripts or a CLI framework like Commander

## Migration Strategy

1. **Keep the same database** — Sutando works with existing MySQL/PostgreSQL schemas
2. **Migrate route by route** — use Nginx as a reverse proxy to split traffic
3. **Start with read-only routes** — they're lowest risk
4. **Keep sessions in Redis** — both PHP and Node can read from Redis
5. **Don't rewrite everything at once** — the strangler fig pattern works well

## Conclusion

Migrating from Laravel to Node.js doesn't mean abandoning Eloquent. Sutando brings the same Active Record experience to Node.js with nearly identical API. You can keep your database schema, migrate routes incrementally, and your team can be productive from day one.

Start with `npm install sutando` and check the [documentation](https://sutando.org/guide/getting-started.html).