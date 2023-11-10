---
outline: [2, 3]
---

<script setup>
import { useRoute } from 'vitepress'

const route = useRoute()

if (typeof _hmt != "undefined") {
  if (route?.path) {
    window._hmt.push(['_trackPageview', route.path]);
  }
}
</script>

# 安装

Sutando 的主要目标环境是 Node.js，你需要安装 sutando 库，然后安装适当的数据库包：`pg` 用于 PostgreSQL、CockroachDB 和 Amazon Redshift，`pg-native` 用于带有原生 C++ 的 PostgreSQL ` libpq` 绑定（需要安装 PostgresSQL 才能链接），`mysql` 用于 MySQL 或 MariaDB，`sqlite3` 用于 SQLite3，或 `tedious` 用于 MSSQL。

## 安装

Sutando 可通过 npm（或 yarn/pnpm）获得。

::: code-group

```sh [npm]
$ npm install sutando --save
```

```sh [yarn]
$ yarn add sutando
```

```sh [pnpm]
$ pnpm add sutando
```

:::

你还需要根据要使用的数据库安装以下其中一项：

::: code-group

```sh [npm]
$ npm install pg --save
$ npm install sqlite3 --save
$ npm install better-sqlite3 --save
$ npm install mysql --save
$ npm install mysql2 --save
$ npm install tedious --save
```

```sh [yarn]
$ yarn add pg
$ yarn add sqlite3
$ yarn add better-sqlite3
$ yarn add mysql
$ yarn add mysql2
$ yarn add tedious
```

```sh [pnpm]
$ pnpm add pg
$ pnpm add sqlite3
$ pnpm add better-sqlite3
$ pnpm add mysql
$ pnpm add mysql2
$ pnpm add tedious
```
:::

## 配置

### MySQL

要连接到数据库，你必须添加一个连接。 `client` 参数是必需的，它决定了哪个客户端适配器将与 Sutando 一起使用。

```js
const { sutando } = require('./sutando');

sutando.addConnection({
  client: 'mysql2',
  connection: {
    host : '127.0.0.1',
    port : 3306,
    user : 'your_database_user',
    password : 'your_database_password',
    database : 'myapp_test'
  },
});

// 你可以添加多个连接，只需指定连接名称即可。
sutando.addConnection({
  client: 'mysql2',
  connection: {
    host : '127.0.0.1',
    port : 3306,
    user : 'another_database_user',
    password : 'another_database_password',
    database : 'myapp_another'
  },
}, 'another_mysql');

const db = sutando.connection('another_mysql');
```

连接选项直接传递给适当的数据库客户端以创建连接，并且可以是对象、连接字符串或返回对象的函数：

### SQLite3 or Better-SQLite3

当你使用 `SQLite3` 或 `Better-SQLite3` 适配器时，需要一个文件名，而不是网络连接。 例如：

```js
sutando.addConnection({
  client: 'sqlite3', // or 'better-sqlite3'
  connection: {
    filename: "./mydb.sqlite"
  }
});
```

你还可以通过提供 `:memory:` 作为文件名来使用内存数据库运行 `SQLite3` 或 `Better-SQLite3`。 例如：

```js
sutando.addConnection({
  client: 'sqlite3', // or 'better-sqlite3'
  connection: {
    filename: ":memory:"
  }
});
```

当你使用 `SQLite3` 适配器时，你可以设置用于打开连接的标志。 例如：

```js
sutando.addConnection({
  client: 'sqlite3',
  connection: {
    filename: "file:memDb1?mode=memory&cache=shared",
    flags: ['OPEN_URI', 'OPEN_SHAREDCACHE']
  }
});
```

### PostgreSQL

当你使用 PostgreSQL 适配器连接非标准数据库时，可以在 sutando 配置中添加数据库版本。

```js
sutando.addConnection({
  client: 'pg',
  version: '7.2',
  connection: {
    host : '127.0.0.1',
    port : 3306,
    user : 'your_database_user',
    password : 'your_database_password',
    database : 'myapp_test'
  }
});
```

