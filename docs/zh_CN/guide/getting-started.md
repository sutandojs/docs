<script setup>
import { useRoute } from 'vitepress'

const route = useRoute()

if (typeof _hmt != "undefined") {
  if (route?.path) {
    window._hmt.push(['_trackPageview', route.path]);
  }
}
</script>

# 开始

## 什么是 Sutando

Sutando (发音类似 stand) 是一个对象关系映射器（ORM），可以让您轻松地与数据库进行交互。使用 Sutando 时，每个数据库表都有一个对应的「模型」，用于与该表进行交互。除了从数据库表中检索记录外，Sutando 模型还允许您从表中插入，更新和删除记录。

Sutando 深受 Laravel 框架的 ORM [Eloquent](https://laravel.com/docs/9.x/eloquent) 启发，使用方式几乎相同。

"sutando" 这个名字来自于日本漫画《JOJO 的奇妙冒险》中的替身（Stand）。就像替身为角色提供力量一样，希望 Sutando 为你的应用程序提供强大的功能和灵活性。

## 快速开始

安装 Sutando 和 mysql 数据库包

::: code-group

```sh [npm]
$ npm install sutando mysql2 --save
```

```sh [yarn]
$ yarn add sutando mysql2
```

```sh [pnpm]
$ pnpm add sutando mysql2
```

:::

进行 SQL 查询的最简单方法是使用数据库查询构建器。 它允许您使用 JavaScript 方法构造简单和复杂的 SQL 查询。

在以下示例中，我们从用户表中选择数据。

```js
const { sutando, Model } = require('sutando');

// 添加数据库连接信息
sutando.addConnection({
  client: 'mysql2',
  connection: {
    host : '127.0.0.1',
    port : 3306,
    user : 'root',
    password : '',
    database : 'test'
  },
});

const db = sutando.connection();

// 使用查询构建器
const users = await sutando.table('users').where('votes', '>', 100).get();
// or
const users = await db.table('users').where('votes', '>', 100).get();

// 使用 Schema Builder
await sutando.schema().createTable('users', table => {
  table.increments('id').primary();
  table.integer('votes');
  table.timestamps();
});

// 使用 ORM
class User extends Model {}
const users = await User.query().where('votes', '>', 100).get();
```