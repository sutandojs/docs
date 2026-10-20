---
date: 2026-10-20
title: "Sutando 插件：扩展你的 ORM"
type: blog
description: "Sutando 设计为可扩展的。无论你需要自定义类型转换、全局查询修改还是可复用的模型行为，Sutando 的插件系统都能满足。"
authors: ["Dylan Yu"]
mode: center
---


Sutando 设计为可扩展的。无论你需要自定义类型转换、全局查询修改还是可复用的模型行为，Sutando 的插件系统都能满足。

## 自定义类型转换

```ts
import { Model, CastsAttributes } from 'sutando';

class EncryptedCast extends CastsAttributes {
  static get(model, key, value, attributes) { return decrypt(value); }
  static set(model, key, value, attributes) { return encrypt(value); }
}

class User extends Model {
  casts = { ssn: EncryptedCast };
}
```

## 自定义插件

```ts
import { Model, compose } from 'sutando';

const HasUuid = (Model) => {
  return class extends Model {
    static booted() {
      Model.booted();

      this.creating(model => {
        if (!model.uuid) model.uuid = crypto.randomUUID();
      });
    }
  }
};

class User extends compose(Model, HasUuid) {}
```

## 全局查询修改

```ts
import { Model, Scope } from 'sutando';

class TenantScope extends Scope {
  apply(builder, model) {
    if (currentTenantId) builder.where('tenant_id', currentTenantId);
  }
}

class Post extends Model {
  static booted() {
    super.booted();
    this.addGlobalScope('tenant', new TenantScope());
  }
}

// 跳过全局作用域
const allPosts = await Post.query().withoutGlobalScope('tenant').get();
```

## 宏方法

```ts
const query = Post.query();

query.macro('search', function (builder, term) {
  return builder.where('title', 'like', `%${term}%`)
    .orWhere('content', 'like', `%${term}%`);
});

const results = await query.search('laravel').get();
```

## 打包插件

```ts
// my-sutando-plugin/index.ts
export const HasUuid = (Model) => { /* ... */ };
export class TimestampsCast extends CastsAttributes { /* ... */ }
```

了解更多请查看 [Sutando 文档](https://sutando.org/zh_CN/guide/getting-started)。