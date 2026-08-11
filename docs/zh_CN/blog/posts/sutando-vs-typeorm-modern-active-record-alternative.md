---
date: 2026-09-01
title: "Sutando vs TypeORM：更现代的 Active Record 替代方案"
tags: [Sutando, TypeORM, Node.js, ORM, Comparison]
author: Dylan Yu
image: https://storage.sutando.org/og-1751395044936.jpg
---

![image](https://storage.sutando.org/og-1751395044936.jpg)

---

<PostDetail>

TypeORM 在 Node.js 生态中存在多年。但随着 TypeScript 的进化和新 ORM 的涌现，TypeORM 的局限性越来越难以忽视。本文将对比 TypeORM 与 Sutando，说明为什么开发者正在切换。

## TypeORM 的问题

在对比功能之前，先看看开发者为什么寻找 TypeORM 的替代品：

### 1. 装饰器不稳定

TypeORM 严重依赖 TypeScript 装饰器（`@Entity`、`@Column`、`@OneToMany`）。TC39 装饰器提案多次变更，而 TypeORM 仍在使用旧的实验性装饰器语法，这带来了持续的兼容性隐患。

### 2. 维护缓慢

TypeORM 的开发节奏明显放缓。Issue 不断堆积，PR 需要数月才能合并，社区对缺乏积极维护表示不满。

### 3. QueryBuilder 基于字符串

TypeORM 的 QueryBuilder 使用字符串形式的列名和表名，拼写错误只能在运行时发现：

```ts
// TypeORM：基于字符串——拼写错误运行时才报错
const users = await getRepository(User)
  .createQueryBuilder('user')
  .where('user.namme = :name', { name: 'Alice' }) // 拼写错误："namme"
  .getMany();
```

## Sutando：更干净的替代方案

Sutando 解决了这些问题，同时保留了 TypeORM 用户熟悉的 Active Record 模式。

### 无需装饰器

```ts
// Sutando：干净，无装饰器
class User extends Model {
  table = 'users';
  
  casts = {
    is_admin: 'boolean',
    metadata: 'json',
  };
  
  relationPosts() {
    return this.hasMany(Post, 'user_id');
  }
}
```

```ts
// TypeORM：装饰器繁多
@Entity()
class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;
  
  @Column()
  name: string;
  
  @OneToMany(() => Post, post => post.user)
  posts: Post[];
}
```

### 查询对比

**Sutando:**
```ts
const users = await User.query()
  .where('active', true)
  .with('posts')
  .orderBy('created_at', 'desc')
  .limit(10)
  .get();
```

**TypeORM:**
```ts
const users = await User.createQueryBuilder('user')
  .leftJoinAndSelect('user.posts', 'posts')
  .where('user.active = :active', { active: true })
  .orderBy('user.created_at', 'DESC')
  .take(10)
  .getMany();
```

## 功能对比

| 功能 | Sutando | TypeORM |
|---------|---------|---------|
| 装饰器 | 不需要 | 必须 |
| 查询构造器 | 方法链 | 基于字符串 |
| 关联 | 方法（`hasMany` 等） | 装饰器（`@OneToMany` 等） |
| 预加载 | `with('posts.comments')` | `leftJoinAndSelect`（手动） |
| 模型事件 | 内置 | Subscriber / Listener 类 |
| 软删除 | 内置 | `@DeleteDateColumn` 装饰器 |
| 查询作用域 | 内置 | 无 |
| 维护 | 积极 | 缓慢 |
| 包体积 | 小 | 大 |

## 从 TypeORM 迁移到 Sutando

### 第 1 步：替换实体定义

```ts
// 之前（TypeORM）
@Entity()
class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;
  
  @Column()
  name: string;
  
  @OneToMany(() => Post, post => post.user)
  posts: Post[];
}

// 之后（Sutando）
class User extends Model {
  table = 'users';
  
  relationPosts() {
    return this.hasMany(Post, 'user_id');
  }
}
```

### 第 2 步：替换查询

```ts
// 之前（TypeORM）
const user = await User.findOne({ where: { id: 1 }, relations: ['posts'] });

// 之后（Sutando）
const user = await User.query().with('posts').find(1);
```

### 第 3 步：替换增删改

```ts
// 之前（TypeORM）
const user = User.create({ name: 'Alice' });
await user.save();

// 之后（Sutando）
const user = new User();
user.name = 'Alice';
await user.save();
```

## 何时从 TypeORM 切换到 Sutando

- 你厌倦了装饰器相关的问题
- 你想要更简洁、可读性更强的查询语法
- 你需要内置的查询作用域和模型事件
- 你想要一个更积极维护的 ORM
- 你在寻找 Laravel Eloquent 风格的体验

## 总结

TypeORM 曾为 Node.js 社区做出了贡献，但它对装饰器的依赖、基于字符串的查询和维护问题使其难以推荐用于新项目。Sutando 提供了同样的 Active Record 模式，但 API 更干净、无需装饰器，且内置了 TypeORM 缺少的功能。

试试 Sutando：`npm install sutando`——或阅读[文档](https://sutando.org/zh_CN/guide/getting-started.html)。

</PostDetail>
