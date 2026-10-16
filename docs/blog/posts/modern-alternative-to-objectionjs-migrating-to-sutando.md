---
date: 2026-09-08
title: "A Modern Alternative to Objection.js: Migrating to Sutando"
type: blog
description: "Objection.js has been a popular ORM in the Node.js ecosystem for years. Built on top of Knex.js, it offered a flexible, SQL-friendly approach to database…"
authors: ["Dylan Yu"]
mode: center
---


<img src="https://storage.sutando.org/og-1751395044936.jpg" alt="" width="1200" height="630" loading="lazy" />

---

Objection.js has been a popular ORM in the Node.js ecosystem for years. Built on top of Knex.js, it offered a flexible, SQL-friendly approach to database operations. But with the original maintainer stepping away and TypeScript support lagging, many teams are looking for a modern alternative. This guide walks through migrating from Objection.js to Sutando.

## Why Move Away from Objection.js?

Objection.js remains a capable library, but several factors make migration worth considering:

### Maintenance Status

In [a GitHub discussion](https://github.com/Vincit/objection.js/discussions/2463), the original author Sami Koskimäki announced he would no longer actively maintain the project. Key points:

- **No active maintainer**: The project has a single bus factor, and that person has stepped away
- **No new features**: Only community forks are receiving updates
- **Slow releases**: Months between patch releases, if any

### TypeScript Support

Objection.js was designed before TypeScript was widely adopted. The type system works, but it requires manual type declarations and doesn't provide the seamless inference that modern TypeScript-first ORMs offer.

### No Built-in Migrations

Objection.js relies entirely on Knex for migrations. While Knex is solid, you're managing two separate tools with different APIs and mental models.

## Why Sutando?

Sutando is a modern Active Record ORM for Node.js, inspired by Laravel's Eloquent. It addresses the pain points Objection.js users face:

| Feature | Objection.js | Sutando |
|---------|-------------|---------|
| Pattern | Query Builder + ORM | Active Record |
| TypeScript | Manual types | First-class TS support |
| Migrations | Via Knex (separate) | Built-in schema builder |
| Maintenance | Stalled | Active |
| Relations | `withGraphFetched` | `with()`, `hasMany()`, `belongsTo()` |
| Soft Deletes | Manual | Built-in |
| Hooks | `$beforeInsert` etc. | `creating`, `saved` etc. |
| Scopes | Manual | Built-in |

## Concept Mapping: Objection.js → Sutando

### Models

**Objection.js:**
```typescript
import { Model } from 'objection';
import knex from 'knex';

const db = knex({
  client: 'pg',
  connection: process.env.DATABASE_URL,
});

Model.knex(db);

class User extends Model {
  static tableName = 'users';
  
  static jsonSchema = {
    type: 'object',
    required: ['name', 'email'],
    properties: {
      id: { type: 'integer' },
      name: { type: 'string', minLength: 1, maxLength: 255 },
      email: { type: 'string', format: 'email' },
    },
  };
  
  static relationMappings = {
    posts: {
      relation: Model.HasManyRelation,
      modelClass: Post,
      join: { from: 'users.id', to: 'posts.user_id' },
    },
  };
}
```

**Sutando:**
```typescript
import { sutando, Model } from 'sutando';

const db = sutando({
  client: 'pg',
  connection: process.env.DATABASE_URL,
});

class User extends Model {
  protected table = 'users';
  
  protected fillable = ['name', 'email'];
  
  posts(): HasMany {
    return this.hasMany(Post);
  }
}
```

### Queries

**Objection.js:**
```typescript
// Simple query
const users = await User.query().where('age', '>', 18);

// With relations
const user = await User.query()
  .withGraphFetched('[posts.comments]')
  .findById(1);

// Insert
const user = await User.query().insert({ name: 'Alice', email: 'alice@example.com' });

// Update
await User.query().patch({ name: 'Bob' }).where('id', 1);

// Delete
await User.query().deleteById(1);
```

**Sutando:**
```typescript
// Simple query
const users = await User.query().where('age', '>', 18).get();

// With relations
const user = await User.query().with('posts.comments').find(1);

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

### Relations

**Objection.js** uses `relationMappings` with a declarative object syntax:

```typescript
static relationMappings = {
  posts: {
    relation: Model.HasManyRelation,
    modelClass: Post,
    join: { from: 'users.id', to: 'posts.user_id' },
  },
  profile: {
    relation: Model.BelongsToOneRelation,
    modelClass: Profile,
    join: { from: 'users.profile_id', to: 'profiles.id' },
  },
};
```

**Sutando** uses method-based definitions, similar to Eloquent:

```typescript
posts(): HasMany {
  return this.hasMany(Post);
}

profile(): BelongsTo {
  return this.belongsTo(Profile);
}
```

### Transactions

**Objection.js:**
```typescript
await User.transaction(async (trx) => {
  const user = await User.query(trx).insert({ name: 'Alice' });
  await Post.query(trx).insert({ title: 'Hello', user_id: user.id });
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

**Objection.js:**
```typescript
class User extends Model {
  static tableName = 'users';
  
  $beforeInsert() {
    this.created_at = new Date().toISOString();
  }
  
  $beforeUpdate() {
    this.updated_at = new Date().toISOString();
  }
}
```

**Sutando:**
```typescript
import { Model } from 'sutando';

class User extends Model {
  protected table = 'users';
  
  static creating(model: User) {
    model.created_at = new Date();
  }
  
  static updating(model: User) {
    model.updated_at = new Date();
  }
}
```

## Step-by-Step Migration Guide

### Step 1: Install Sutando

```bash
npm install sutando
```

### Step 2: Set Up the Database Connection

Create a `db.ts` file:

```typescript
import { sutando } from 'sutando';

export const db = sutando({
  client: 'pg',
  connection: process.env.DATABASE_URL,
});

export default db;
```

### Step 3: Convert Models Gradually

You don't need to migrate everything at once. Both ORMs can coexist in the same project:

1. Start by converting the simplest models (no complex relations)
2. Move on to models with `hasMany` / `belongsTo` relations
3. Finally, convert models with complex graph operations

### Step 4: Migrate Migrations

If you're using Knex migrations, Sutando's schema builder is compatible:

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

### Step 5: Replace Queries

Go through your codebase and replace Objection.js queries with Sutando equivalents. The main changes:

- `Model.query()` in Objection returns a query builder; in Sutando, you chain `.get()` or `.first()` to execute
- `withGraphFetched('[posts.comments]')` becomes `with('posts.comments')`
- `insert()` / `patch()` / `deleteById()` become Active Record style `save()` / `delete()`

## What You Gain After Migration

- **Active Record pattern**: No more separate query builder and model — operate on model instances directly
- **Built-in soft deletes**: Add `softDeletes()` to your model and get `deleted_at` handling out of the box
- **Built-in scopes**: Define reusable query filters with `scope` methods
- **First-class TypeScript**: Type inference works naturally with class-based models
- **Eloquent-style API**: If you've ever used Laravel, the learning curve is nearly zero
- **Active maintenance**: Regular releases and new features

## Conclusion

Objection.js served the Node.js community well, but its maintenance status and TypeScript limitations make it a liability for long-term projects. Sutando offers a familiar, well-maintained alternative with an Active Record pattern that reduces boilerplate and improves developer experience.

The migration can be done incrementally — both ORMs can coexist while you transition model by model. Start with a single model today and see the difference for yourself.

👉 [Get started with Sutando](https://sutando.org/guide/getting-started) or run `npm install sutando` to try it out.
