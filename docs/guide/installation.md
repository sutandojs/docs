---
outline: deep
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

# Installation

The primary target environment for Sutando is Node.js, you will need to install the sutando library, and then install the appropriate database library: `pg` for PostgreSQL, CockroachDB and Amazon Redshift, `pg-native` for PostgreSQL with native C++ `libpq` bindings (requires PostgresSQL installed to link against), `mysql` for MySQL or MariaDB, `sqlite3` for SQLite3, or `tedious` for MSSQL.

## Installing

Sutando is available via npm (or yarn/pnpm).

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

You also need to install one of the following depending on the database you want to use:

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

## Configuration

To connect to the database, you must add a connection. The client parameter is required and determines which client adapter will be used with the library.

### MySQL

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

// And you can add multiple connections, just specify the connection name.
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

The connection options are passed directly to the appropriate database client to create the connection, and may be either an object, a connection string, or a function returning an object:

### SQLite3 or Better-SQLite3

When you use the SQLite3 or Better-SQLite3 adapter, there is a filename required, not a network connection. For example:

```js
sutando.addConnection({
  client: 'sqlite3', // or 'better-sqlite3'
  connection: {
    filename: "./mydb.sqlite"
  }
});
```

You can also run either SQLite3 or Better-SQLite3 with an in-memory database by providing `:memory:` as the filename. For example:

```js
sutando.addConnection({
  client: 'sqlite3', // or 'better-sqlite3'
  connection: {
    filename: ":memory:"
  }
});
```

When you use the SQLite3 adapter, you can set flags used to open the connection. For example:

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

The database version can be added in sutando configuration, when you use the PostgreSQL adapter to connect a non-standard database.

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
