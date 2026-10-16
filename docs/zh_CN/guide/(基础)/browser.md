# 浏览器支持

Sutando 不仅可以在服务端运行，现在也支持在浏览器环境中使用。浏览器版本支持模型（Model）、属性（Attribute）、关联（Relation）等核心功能，但不支持查询构建器（Query Builder）等与数据库连接相关的功能。

## 在全栈框架中使用

如果你正在使用 Next.js、Nuxt.js 等全栈框架，你可以在项目中只定义一次模型，然后在前端和后端共享使用。这样可以确保代码的一致性，避免重复定义。

不过需要注意的是，如果你的模型中需要使用一些仅在 Node.js 环境下才能使用的特性（如文件系统操作），建议采用以下方式组织代码：

1. 创建一个基础模型类，包含前后端共用的逻辑
2. 创建一个继承自基础模型的服务端模型类，在这里添加仅供服务端使用的功能

```javascript
// models/base/user.js - 前后端共用的基础模型
export class BaseUser extends Model {
  // 共用的属性和方法
}

// models/server/user.js - 仅服务端使用的模型
export class User extends BaseUser {
  // Node.js 特定的功能
}
```

## 主要功能

### make 函数

`make` 函数用于将 API 返回的数据转换为模型实例。这样你就可以使用模型的所有功能，包括访问器（Accessor）和修改器（Mutator）等。

```javascript
const { make } = require('sutando');
const user = make(User, data);
```

### makeCollection 函数

`makeCollection` 函数用于将 API 返回的数组数据转换为模型集合。

```javascript
const { makeCollection } = require('sutando');
const users = makeCollection(User, data);
```

### makePaginator 函数

`makePaginator` 函数用于将通过 API 获取的分页数据转换为 Paginator 实例。

```javascript
const { makePaginator } = require('sutando');
const pageData = makePaginator(User, data);
```

## 使用示例

```javascript
// 从 API 获取用户数据后转换为模型实例
const response = await fetch('/api/users/1');
const data = await response.json();
const user = make(User, data);

// 使用模型的访问器和其他功能
console.log(user.full_name);  // 假设有一个 fullName 访问器

// 处理列表数据
const usersResponse = await fetch('/api/users');
const usersData = await usersResponse.json();
const users = makeCollection(User, usersData);

// 处理分页数据
const pageResponse = await fetch('/api/users?page=1');
const pageData = await response.json();
const paginator = makePaginator(User, pageData);