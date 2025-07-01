---
date: 2025-07-02
title: "Sutando ORM: The Laravel Eloquent Experience for Node.js"
tags: [Laravel]
author: Dylan Yu
image: https://storage.sutando.org/og-1751395044936.jpg

---

![image](https://storage.sutando.org/og-1751395044936.jpg)

---


<PostDetail>

## The Familiar Active‑Record You Love, Now for JavaScript

> **Sutando ORM** speaks the same language as Laravel’s Eloquent—methods, naming, and conventions—yet runs anywhere in the Node.js ecosystem, without tying you to a full‑stack framework.

## Nearly Drop‑In Compatible with Laravel Eloquent

If you’ve written an Eloquent query, you already know Sutando:

```ts
// models/User.ts
import { Model, Attribute } from 'sutando';

export class User extends Model {
  table = 'users';

  // cast
  casts = {
    metadata: 'json',
  }

  // 

  // attribute
  attributeFullName() {
    return Attribute.make({
      get: () => {
        return this.first_name + ' ' + this.last_name;
      },
    });
  }

  // relation
  relationPosts() {
    return this.hasMany(Post);
  }
}

const users = await User.query().with('posts').get();
```

- Identical relationship helpers (`hasMany`, `belongsTo`, `morphTo`, etc.)  
- Chainable query builder with `where`, `orderBy`, `limit`, `with`, `has`, `whereHas`, and more  
- Soft deletes, events, global scopes, and eager loading work just like in Laravel  
- Migrations, factories, and seeders share the same philosophies—moving from PHP feels effortless  

## Framework‑Agnostic by Design—A Contrast to AdonisJS

Full‑stack solutions such as **AdonisJS** ship with Lucid ORM, which shines when you commit to the entire framework. **Sutando takes the opposite route**:

| Feature | Sutando ORM | AdonisJS Lucid |
|---------|-------------|----------------|
| Framework dependency | None — plug into Express, Fastify, Next.js, Cloudflare Workers, Bun, or anything else | Tightly integrated with AdonisJS |
| Migration to existing stack | Drop‑in; no need to rewrite your server | Requires adopting AdonisJS conventions |

This decoupled approach lets you adopt Sutando gradually—add it to a legacy Express API, a React server, or even into an AdonisJS project if you prefer its API surface.


## Fluent Query Builder Example

```ts
const latestActive = await User.query()
  .with('posts.comments')
  .where('status', 'active')
  .orderBy('created_at', 'desc')
  .limit(10)
  .get();
```

You read it like a sentence, just as in Laravel—no extra boilerplate, no new mental model.

## Powerful Plugins & Lifecycle Hooks

Need soft deletes, multi‑tenancy, or automatic timestamps? Write it once and apply everywhere:

```ts
User.saving(async (model) => {
  model.last_updated_at = new Date();
});
```

## Quick Start

```bash
npm install sutando --save
```

Configure your database, create your first model, and run queries—no framework migration required. Full docs live at **https://sutando.org/guide/getting-started.html**.

```js
const { sutando, Model } = require('sutando');

// Add SQL Connection Info
sutando.addConnection({
  client: 'mysql2',
  connection: {
    host : '127.0.0.1',
    port : 3306,
    user : 'root',
    password : '',
    database : 'test'
  },
});

const db = sutando.connection();

// Using The Query Builder
const users = await sutando.table('users').where('votes', '>', 100).get();
// or
const users = await db.table('users').where('votes', '>', 100).get();

// Using The Schema Builder
await sutando.schema().createTable('users', table => {
  table.increments('id').primary();
  table.integer('votes');
  table.timestamps();
});

// Using The ORM
class User extends Model {}
const users = await User.query().where('votes', '>', 100).get();
```

## Build Faster, Stay Flexible

Sutando ORM delivers the Eloquent developer experience Laravel fans adore, yet keeps your architecture open. Whether you’re upgrading a JavaScript codebase, experimenting with serverless, or simply want an Active‑Record that feels right, Sutando is ready to power your next app—framework‑free.

</PostDetail>
