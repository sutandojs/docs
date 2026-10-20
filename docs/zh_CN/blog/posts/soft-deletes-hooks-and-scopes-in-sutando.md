---
date: 2026-10-13
title: "Sutando 中的软删除、钩子和作用域"
type: blog
description: "Sutando 包含几个超越基础 CRUD 的强大功能：软删除、模型事件（钩子）和查询作用域。"
authors: ["Dylan Yu"]
mode: center
---


Sutando 包含几个超越基础 CRUD 的强大功能：软删除、模型事件（钩子）和查询作用域。

## 软删除

软删除允许你"删除"记录而不真正从数据库中移除。`deleted_at` 列标记记录为已删除。

### 设置

```ts
import { Model, compose, SoftDeletes } from 'sutando';

class Post extends compose(Model, SoftDeletes) {
  table = 'posts';
}
```

### 使用

```ts
// 软删除——设置 deleted_at 而非删除
await post.delete();

// 普通查询排除已删除记录
const posts = await Post.query().get();

// 包含已删除记录
const allPosts = await Post.query().withTrashed().get();

// 仅已删除记录
const trashed = await Post.query().onlyTrashed().get();

// 恢复
const post = await Post.query().withTrashed().find(1);
await post.restore();

// 永久删除
await post.forceDelete();
```

## 模型事件（钩子）

| 事件 | 时机 |
|-------|------|
| `creating` | 创建记录前 |
| `created` | 创建记录后 |
| `updating` | 更新记录前 |
| `saving` | 保存前（创建或更新） |
| `deleting` | 删除记录前 |
| `restoring` | 恢复软删除记录前 |

### 注册钩子

```ts
// 创建用户前加密密码
User.creating(async (user) => {
  user.password = await bcrypt.hash(user.password, 10);
});

// 保存文章前生成 slug
Post.saving(async (post) => {
  post.slug = post.title.toLowerCase().replace(/\s+/g, '-');
});

// 删除文章时级联删除评论
Post.deleting(async (post) => {
  await post.related('comments').delete();
});
```

### 中止操作

从 `creating` 或 `updating` 钩子返回 `false` 可中止操作：

```ts
User.creating(async (user) => {
  const exists = await User.query().where('email', user.email).exists();
  if (exists) return false;
});
```

## 查询作用域

### 定义作用域

```ts
class Post extends Model {
  scopePublished(query) {
    return query.where('published', true);
  }
  
  scopePopular(query) {
    return query.where('views', '>', 1000);
  }
  
  scopeRecent(query, days = 7) {
    return query.where('created_at', '>', new Date(Date.now() - days * 86400000));
  }
}
```

### 使用作用域

```ts
// 链式调用多个作用域
const posts = await Post.query()
  .published()
  .popular()
  .recent(30)
  .orderBy('views', 'desc')
  .limit(10)
  .get();
```

### 全局作用域

```ts
import { Model, Scope } from 'sutando';

class PublishedScope extends Scope {
  apply(builder, model) {
    builder.where('published', true);
  }
}

class Post extends Model {
  static booted() {
    super.booted();
    this.addGlobalScope('published', new PublishedScope());
  }
}

// 跳过全局作用域
const allPosts = await Post.query().withoutGlobalScope('published').get();
```

## 总结

软删除、模型事件和查询作用域让 Sutando 不仅仅是一个查询构造器。它们让你将业务逻辑直接编码到模型中，保持控制器简洁、数据一致。

了解更多请查看 [Sutando 文档](https://sutando.org/zh_CN/guide/hooks)。