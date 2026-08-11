---
date: 2026-10-20
title: "Sutando 插件：扩展你的 ORM"
tags: [Sutando, ORM, Plugins, Extensions, Node.js]
author: Dylan Yu
image: https://storage.sutando.org/og-1751395044936.jpg

---

<PostDetail>

Sutando 设计为可扩展的。无论你需要自定义类型转换、全局查询修改还是可复用的模型行为，Sutando 的插件系统都能满足。

## 自定义类型转换

```ts
import { Model, Cast } from 'sutando';

class EncryptedCast extends Cast {
  get(model, key, value) { return decrypt(value); }
  set(model, key, value) { return encrypt(value); }
}

class User extends Model {
  casts = { ssn: new EncryptedCast() };
}
```

## 自定义 Trait

```ts
const HasUuid = {
  boot(model) {
    model.creating(async (instance) => {
      if (!instance.uuid) instance.uuid = crypto.randomUUID();
    });
  }
};

class User extends Model {
  use = [HasUuid];
}
```

## 全局查询修改

```ts
class Post extends Model {
  static booted() {
    super.booted();
    this.addGlobalScope('tenant', (query) => {
      if (currentTenantId) query.where('tenant_id', currentTenantId);
    });
  }
}

// 跳过全局作用域
const allPosts = await Post.query().withoutGlobalScope('tenant').get();
```

## 宏方法

```ts
QueryBuilder.macro('search', function (term) {
  return this.where('title', 'like', `%${term}%`)
    .orWhere('content', 'like', `%${term}%`);
});

const results = await Post.query().search('laravel').get();
```

## 打包插件

```ts
// my-sutando-plugin/index.ts
export const HasUuid = { /* ... */ };
export const TimestampsCast = new Cast({ /* ... */ });
```

了解更多请查看 [Sutando 文档](https://sutando.org/zh_CN/guide/getting-started.html)。

</PostDetail>
