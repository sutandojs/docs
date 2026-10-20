---
date: 2026-10-20
title: "Sutando Plugins: Extending Your ORM"
type: blog
description: "Sutando is designed to be extensible. Whether you need custom cast types, global query modifications, or reusable model behaviors, Sutando's plugin system…"
authors: ["Dylan Yu"]
mode: center
---


<img src="https://storage.sutando.org/og-1751395044936.jpg" alt="" width="1200" height="630" loading="lazy" />

---
Sutando is designed to be extensible. Whether you need custom cast types, global query modifications, or reusable model behaviors, Sutando's plugin system has you covered.

## Custom Casts

Casts transform attribute values when reading from or writing to the database. Sutando includes built-in casts for `boolean`, `json`, `collection`, `date`, and `datetime`. You can create your own by extending `CastsAttributes`:

```ts
import { Model, CastsAttributes } from 'sutando';

class EncryptedCast extends CastsAttributes {
  // Cast the given value.
  static get(model, key, value) {
    return decrypt(value); // decrypt when reading
  }

  // Prepare the given value for storage.
  static set(model, key, value) {
    return encrypt(value); // encrypt when writing
  }
}

class User extends Model {
  table = 'users';
  casts = {
    ssn: EncryptedCast,
    metadata: 'json',
    is_admin: 'boolean',
  };
}
```

## Custom Plugins

Plugins are reusable pieces of model behavior. Sutando's `SoftDeletes` and `HasUniqueIds` are built-in plugins. You can create your own — a plugin is a mixin that takes a model class and returns a subclass:

```ts
import { Model, compose } from 'sutando';

const HasSlug = (Model) => {
  return class extends Model {
    static booted() {
      // Execute booted of the parent class
      Model.booted();

      this.creating(model => {
        if (model.slug === undefined) {
          model.slug = model.title.toLowerCase().replace(/\s+/g, '-');
        }
      });
    }
  };
};

class Post extends compose(Model, HasSlug) {
  table = 'posts';
}
```

For string primary keys, apply the built-in `HasUniqueIds` plugin and generate the id yourself:

```ts
import { Model, compose, HasUniqueIds } from 'sutando';
import uuid from 'uuid';

class User extends compose(Model, HasUniqueIds) {
  newUniqueId() {
    return uuid.v4();
  }
}
```

## Global Query Modifications

If you need to modify all queries for a model (e.g., multi-tenant filtering), use global scopes:

```ts
import { Model, Scope } from 'sutando';

class TenantScope extends Scope {
  apply(builder, model) {
    if (currentTenantId) {
      builder.where('tenant_id', currentTenantId);
    }
  }
}

class Post extends Model {
  table = 'posts';
  
  static booted() {
    super.booted();
    this.addGlobalScope('tenant', new TenantScope());
  }
}

// Skip when needed
const allPosts = await Post.query().withoutGlobalScope('tenant').get();
```

## Macro Methods

You can add custom methods to the query builder with a scope's `extend` hook:

```ts
import { Scope } from 'sutando';

class SearchScope extends Scope {
  // The scope itself adds no constraints
  apply(builder, model) {}

  extend(builder) {
    builder.macro('search', (builder, term) => {
      return builder.where('title', 'like', `%${term}%`)
        .orWhere('content', 'like', `%${term}%`);
    });
  }
}

Post.addGlobalScope(new SearchScope());

// Usage
const results = await Post.query().search('laravel').get();
```

## Creating a Plugin Package

Package your extensions for reuse:

```ts
// my-sutando-plugin/index.ts
import { CastsAttributes } from 'sutando';

export class TimestampsCast extends CastsAttributes {
  static get(model, key, value) {
    return value ? new Date(value) : null;
  }

  static set(model, key, value) {
    return value ? value.toISOString() : null;
  }
}

export const HasSlug = (Model) => {
  return class extends Model {
    static booted() {
      // Execute booted of the parent class
      Model.booted();

      this.creating(model => {
        if (model.slug === undefined) {
          model.slug = model.title.toLowerCase().replace(/\s+/g, '-');
        }
      });
    }
  };
};

export function setupPaginationPerPage(defaultPerPage = 20) {
  // Add perPage method to query builder
}
```

```ts
// Usage in your app
import { Model, compose } from 'sutando';
import { TimestampsCast, HasSlug } from 'my-sutando-plugin';

class Event extends compose(Model, HasSlug) {
  table = 'events';
  casts = {
    start_time: TimestampsCast,
    end_time: TimestampsCast,
  };
}
```

## Conclusion

Sutando's extension points — custom casts, plugins, global scopes, and macros — let you build reusable functionality that integrates naturally with the ORM. This makes it easy to share patterns across projects and teams.

Learn more in the [Sutando documentation](https://sutando.org/guide/getting-started).