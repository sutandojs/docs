---
date: 2026-09-22
title: "Sutando 模型关联指南：hasMany、belongsTo 及更多"
type: blog
description: "关联是任何 ORM 的核心。Sutando 将 Laravel Eloquent 的关联系统带入 Node.js，让定义和查询复杂数据关系变得简单。"
authors: ["Dylan Yu"]
mode: center
---


<img src="https://storage.sutando.org/og-1751395044936.jpg" alt="" width="1200" height="630" loading="lazy" />

---
关联是任何 ORM 的核心。Sutando 将 Laravel Eloquent 的关联系统带入 Node.js，让定义和查询复杂数据关系变得简单。

## 定义关联

在 Sutando 中，关联定义为模型上以 `relation` 为前缀的方法：

```ts
class User extends Model {
  table = 'users';
  relationPosts() {
    return this.hasMany(Post, 'user_id');
  }
}
```

## 一对多：hasMany

```ts
class User extends Model {
  relationPosts() { return this.hasMany(Post, 'user_id'); }
}

class Post extends Model {
  relationUser() { return this.belongsTo(User, 'user_id'); }
}
```

### 查询

```ts
// 预加载
const user = await User.query().with('posts').find(1);

// 查询关联
const publishedPosts = await user.related('posts').where('published', true).get();

// 创建关联记录
const post = await user.related('posts').create({ title: '新文章', content: '内容' });
```

## 一对一：hasOne

```ts
class User extends Model {
  relationProfile() { return this.hasOne(Profile, 'user_id'); }
}
```

## 多对多：belongsToMany

```ts
class User extends Model {
  relationRoles() {
    return this.belongsToMany(Role, 'user_roles', 'user_id', 'role_id');
  }
}
```

```ts
// 附加/分离
await user.related('roles').attach([1, 2, 3]);
await user.related('roles').detach([2]);
await user.related('roles').sync([1, 3]); // 同步：分离其他，附加这些
```

## 多态关联

Sutando 暂不支持多态关联（`morphTo` / `morphMany`）。

## 嵌套预加载

```ts
// 加载 user → posts → comments → user
const users = await User.query()
  .with('posts.comments.user')
  .get();
```

## 避免 N+1 查询

```ts
// 不好：N+1（1 + N 次查询）
const users = await User.query().get();
for (const user of users) {
  console.log(await user.getRelated('posts')); // 每个用户一次查询
}

// 好：总共 2 次查询
const users = await User.query().with('posts').get();
```

## 关联方法总结

| 方法 | 用途 | 示例 |
|--------|---------|---------|
| `hasMany` | 一对多 | User → Posts |
| `belongsTo` | 一对多反向 | Post → User |
| `hasOne` | 一对一 | User → Profile |
| `belongsToMany` | 多对多 | User ↔ Roles |

了解更多请查看 [Sutando 文档](https://sutando.org/zh_CN/guide/relationships)。