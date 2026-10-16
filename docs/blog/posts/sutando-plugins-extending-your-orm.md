---
date: 2026-10-20
title: "Sutando Plugins: Extending Your ORM"
type: blog
description: "Sutando is designed to be extensible. Whether you need custom cast types, global query modifications, or reusable model behaviors, Sutando's plugin system…"
authors: ["Dylan Yu"]
mode: center
---


![image](https://storage.sutando.org/og-1751395044936.jpg)

---
Sutando is designed to be extensible. Whether you need custom cast types, global query modifications, or reusable model behaviors, Sutando's plugin system has you covered.

## Custom Casts

Casts transform attribute values when reading from or writing to the database. Sutando includes built-in casts for `boolean`, `json`, `array`, `date`, and `datetime`. You can create your own:

```ts
import { Model, Cast } from 'sutando';

class EncryptedCast extends Cast {
  get(model, key, value) {
    return decrypt(value); // decrypt when reading
  }
  
  set(model, key, value) {
    return encrypt(value); // encrypt when writing
  }
}

class User extends Model {
  table = 'users';
  casts = {
    ssn: new EncryptedCast(),
    metadata: 'json',
    is_admin: 'boolean',
  };
}
```

## Custom Traits

Traits are reusable pieces of model behavior. Sutando's `SoftDeletes` is a built-in trait. You can create your own:

```ts
import { Model } from 'sutando';

const HasUuid = {
  boot(model) {
    model.creating(async (instance) => {
      if (!instance.uuid) {
        instance.uuid = crypto.randomUUID();
      }
    });
  }
};

class User extends Model {
  table = 'users';
  use = [HasUuid];
}
```

## Global Query Modifications

If you need to modify all queries for a model (e.g., multi-tenant filtering), use global scopes:

```ts
class Post extends Model {
  table = 'posts';
  
  static booted() {
    super.booted();
    this.addGlobalScope('tenant', (query) => {
      if (currentTenantId) {
        query.where('tenant_id', currentTenantId);
      }
    });
  }
}

// Skip when needed
const allPosts = await Post.query().withoutGlobalScope('tenant').get();
```

## Macro Methods

You can add custom methods to the query builder:

```ts
import { QueryBuilder } from 'sutando';

QueryBuilder.macro('search', function (term) {
  return this.where('title', 'like', `%${term}%`)
    .orWhere('content', 'like', `%${term}%`);
});

// Usage
const results = await Post.query().search('laravel').get();
```

## Creating a Plugin Package

Package your extensions for reuse:

```ts
// my-sutando-plugin/index.ts
import { Model, Cast } from 'sutando';

export const TimestampsCast = new Cast({
  get: (model, key, value) => value ? new Date(value) : null,
  set: (model, key, value) => value ? value.toISOString() : null,
});

export const HasUuid = {
  boot(model) {
    model.creating(async (instance) => {
      if (!instance.uuid) instance.uuid = crypto.randomUUID();
    });
  }
};

export function setupPaginationPerPage(defaultPerPage = 20) {
  // Add perPage method to query builder
}
```

```ts
// Usage in your app
import { TimestampsCast, HasUuid } from 'my-sutando-plugin';

class Event extends Model {
  table = 'events';
  use = [HasUuid];
  casts = {
    start_time: TimestampsCast,
    end_time: TimestampsCast,
  };
}
```

## Conclusion

Sutando's extension points — custom casts, traits, global scopes, and macros — let you build reusable functionality that integrates naturally with the ORM. This makes it easy to share patterns across projects and teams.

Learn more in the [Sutando documentation](https://sutando.org/guide/getting-started).