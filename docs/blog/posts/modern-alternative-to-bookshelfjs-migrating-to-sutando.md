---
date: 2026-09-15
title: "A Modern Alternative to Bookshelf.js: Migrating to Sutando"
type: blog
description: "Bookshelf.js was once the go-to ORM for Node.js developers who wanted a simple, promise-based interface on top of Knex.js. But with no updates since 2022,…"
authors: ["Dylan Yu"]
mode: center
---


<img src="https://storage.sutando.org/og-1751395044936.jpg" alt="" width="1200" height="630" loading="lazy" />

---

Bookshelf.js was once the go-to ORM for Node.js developers who wanted a simple, promise-based interface on top of Knex.js. But with no updates since 2022, no TypeScript support, and the community moving on, it's time to consider a modern alternative. This guide walks through migrating from Bookshelf.js to Sutando.

## The State of Bookshelf.js

Bookshelf.js hasn't seen a release since version 1.2.0 in June 2022. Several signs point to it being effectively abandoned:

- **No releases in years**: The npm package hasn't been updated since 2022
- **No TypeScript support**: The library is pure CommonJS JavaScript with no built-in types — you need `@types/bookshelf` as a separate package
- **Community consensus**: npm-compare, SaaSHub, and multiple blog posts all describe Bookshelf as "legacy" or "maintenance mode"
- **StackOverflow questions**: Developers actively asking ["Is there an actively maintained replacement for Bookshelf.js?"](https://stackoverflow.com/questions/74914728/is-there-an-actively-maintained-replacement-for-bookshelf-js)

## Why Sutando?

Sutando is a modern Active Record ORM for Node.js, inspired by Laravel's Eloquent. Here's how it compares to Bookshelf.js:

| Feature | Bookshelf.js | Sutando |
|---------|-------------|---------|
| Pattern | Active Record (Collection-based) | Active Record (Model-based) |
| TypeScript | None (needs `@types/bookshelf`) | First-class TS support |
| Module System | CommonJS (`require`) | ESM + CommonJS |
| Migrations | Via Knex (separate) | Built-in schema builder |
| Last Release | 2022 | Active |
| Relations | `forge().fetch()` | `hasMany()`, `belongsTo()` |
| Soft Deletes | Manual | Built-in |
| Hooks | `initialize` events | `creating`, `saved` etc. |
| Scopes | Manual | Built-in |

## Concept Mapping: Bookshelf.js → Sutando

### Setup

**Bookshelf.js:**
```typescript
import knex from 'knex';
import bookshelf from 'bookshelf';

const knexInstance = knex({
  client: 'pg',
  connection: process.env.DATABASE_URL,
});

const db = bookshelf(knexInstance);
db.plugin('registry');
db.plugin('virtuals');
db.plugin('pagination');
```

**Sutando:**
```typescript
import { sutando } from 'sutando';

const db = sutando({
  client: 'pg',
  connection: process.env.DATABASE_URL,
});

export default db;
```

No plugins needed — virtuals, pagination, and registry-like behavior are built in.

### Models

**Bookshelf.js:**
```typescript
const User = db.model('User', {
  tableName: 'users',
  
  posts() {
    return this.hasMany('Post');
  },
  
  profile() {
    return this.belongsTo('Profile');
  },
});

// Or using extend
const User = db.Model.extend({
  tableName: 'users',
  
  posts() {
    return this.hasMany('Post');
  },
});
```

**Sutando:**
```typescript
import { Model } from 'sutando';

class User extends Model {
  protected table = 'users';
  
  protected fillable = ['name', 'email'];
  
  posts(): HasMany {
    return this.hasMany(Post);
  }
  
  profile(): BelongsTo {
    return this.belongsTo(Profile);
  }
}
```

### Queries

**Bookshelf.js:**
```typescript
// Fetch all
const users = await new User().fetch();

// Fetch with relations
const user = await new User({ id: 1 }).fetch({
  withRelated: ['posts.comments'],
});

// Where clause
const users = await User.where('age', '>', 18).fetch();

// Insert
const user = await new User({ name: 'Alice', email: 'alice@example.com' }).save();

// Update
const user = await new User({ id: 1 }).fetch();
user.set('name', 'Bob');
await user.save();

// Delete
const user = await new User({ id: 1 }).fetch();
await user.destroy();
```

**Sutando:**
```typescript
// Fetch all
const users = await User.query().get();

// Fetch with relations
const user = await User.query().with('posts.comments').find(1);

// Where clause
const users = await User.query().where('age', '>', 18).get();

// Insert
const user = new User({ name: 'Alice', email: 'alice@example.com' });
await user.save();

// Update
const user = await User.query().find(1);
user.name = 'Bob';
await user.save();

// Delete
const user = await User.query().find(1);
await user.delete();
```

### Pagination

**Bookshelf.js** requires the pagination plugin:
```typescript
db.plugin('pagination');

const results = await new User().fetchPage({
  page: 1,
  pageSize: 20,
});
// results.models, results.pagination
```

**Sutando** has pagination built in:
```typescript
const results = await User.query().paginate(1, 20);
// results.data, results.total, results.currentPage, results.perPage
```

### Transactions

**Bookshelf.js:**
```typescript
await db.transaction(async (t) => {
  const user = await new User({ name: 'Alice' }).save(null, { transacting: t });
  await new Post({ title: 'Hello', user_id: user.id }).save(null, { transacting: t });
});
```

**Sutando:**
```typescript
await db.transaction(async () => {
  const user = new User({ name: 'Alice' });
  await user.save();
  
  const post = new Post({ title: 'Hello', user_id: user.id });
  await post.save();
});
```

### Hooks / Events

**Bookshelf.js:**
```typescript
const User = db.Model.extend({
  tableName: 'users',
  
  initialize() {
    this.on('saving', this.onSaving);
  },
  
  onSaving(model, attrs, options) {
    model.set('updated_at', new Date());
  },
});
```

**Sutando:**
```typescript
class User extends Model {
  protected table = 'users';
  
  static saving(model: User) {
    model.updated_at = new Date();
  }
}
```

## Step-by-Step Migration Guide

### Step 1: Install Sutando

```bash
npm install sutando
```

### Step 2: Replace the Database Connection

Replace your Bookshelf initialization with Sutando:

```typescript
import { sutando } from 'sutando';

const db = sutando({
  client: 'pg',
  connection: process.env.DATABASE_URL,
});

export default db;
```

Remove the `bookshelf` and `@types/bookshelf` packages:

```bash
npm uninstall bookshelf @types/bookshelf
```

### Step 3: Convert Models from `extend` to ES6 Classes

Bookshelf's `Model.extend()` pattern should be converted to ES6 class syntax:

- `tableName` → `protected table`
- `hasMany('Post')` → `this.hasMany(Post)` (using class references, not string names)
- `belongsTo('Profile')` → `this.belongsTo(Profile)`
- `initialize()` with event listeners → static hook methods like `saving`, `creating`

### Step 4: Update Query Patterns

The biggest changes in query patterns:

- `new User().fetch()` → `User.query().get()`
- `new User({ id: 1 }).fetch({ withRelated: [...] })` → `User.query().with('...').find(1)`
- `model.set('key', value)` → `model.key = value` (direct property assignment)
- `model.destroy()` → `model.delete()`
- `.fetchPage()` → `.paginate()`

### Step 5: Migrate Migrations

If you're using Knex migrations, they work with Sutando's schema builder too:

```typescript
import { schema } from 'sutando';

exports.up = function (schema) {
  return schema.createTable('users', (table) => {
    table.increments('id');
    table.string('name');
    table.string('email').unique();
    table.timestamps();
  });
};

exports.down = function (schema) {
  return schema.dropTableIfExists('users');
};
```

## What You Gain After Migration

- **First-class TypeScript**: No more `@types/bookshelf` — types are built in and accurate
- **ESM support**: Use `import`/`export` natively, no more `require()`
- **No plugins needed**: Pagination, virtuals, and registry are built-in features
- **Direct property access**: `user.name = 'Bob'` instead of `user.set('name', 'Bob')`
- **Built-in soft deletes**: Add `softDeletes()` to your model — no manual implementation
- **Built-in scopes**: Define reusable query filters without custom plugin code
- **Eloquent-style API**: Familiar to anyone who's used Laravel
- **Active maintenance**: Regular updates and new features

## Conclusion

Bookshelf.js was a great ORM in its time, but with no updates since 2022 and no TypeScript support, it's become a liability for modern Node.js projects. Sutando offers a natural upgrade path — same Active Record pattern, but with first-class TypeScript, built-in features that required plugins in Bookshelf, and an actively maintained codebase.

The migration is straightforward: convert models from `extend()` to ES6 classes, update query patterns, and remove the Bookshelf dependency. Both ORMs can coexist during the transition, so you can migrate model by model.

👉 [Get started with Sutando](https://sutando.org/guide/getting-started) or run `npm install sutando` to try it out.
