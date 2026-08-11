---
date: 2026-09-22
title: "Sutando 模型关联指南：hasMany、belongsTo 及更多"
tags: [Sutando, ORM, Relationships, Tutorial, Node.js]
author: Dylan Yu
image: https://storage.sutando.org/og-1751395044936.jpg
---

![image](https://storage.sutando.org/og-1751395044936.jpg)

---

<PostDetail>

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
const publishedPosts = await user.posts().where('published', true).get();

// 创建关联记录
const post = await user.posts().create({ title: '新文章', content: '内容' });
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
await user.roles().attach([1, 2, 3]);
await user.roles().detach([2]);
await user.roles().sync([1, 3]); // 同步：分离其他，附加这些
```

## 多态关联

```ts
class Tag extends Model {
  relationTaggable() { return this.morphTo(); }
}

class Post extends Model {
  relationTags() { return this.morphMany(Tag, 'taggable'); }
}
```

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
  console.log(await user.posts); // 每个用户一次查询
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
| `morphMany` | 多态一对多 | Post/Video → Tags |
| `morphTo` | 多态反向 | Tag → Post/Video |

了解更多请查看 [Sutando 文档](https://sutando.org/zh_CN/guide/relationships.html)。

</PostDetail>
