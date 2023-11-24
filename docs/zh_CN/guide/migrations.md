---
outline: [2, 4]
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

# 数据迁移

数据迁移是数据库的版本控制，帮助开发者完成日常工作中的表结构变更与数据迁移。

## 快速开始

### 生成迁移

首先，需要安装 Sutando 的命令行工具，并生成一个配置文件。

```bash
$ npm install -g sutando
$ sutando init
```

这会在项目目录生成一个 `sutando.config.js` 文件，用来设置数据库连接等信息。

```js
// Update with your config settings.

module.exports = {
  client: 'mysql2',
  connection: {
    host: 'localhost',
    database: 'database',
    user:     'root',
    password: 'password'
  },
  migrations: {
    table: 'migrations',
    path: 'migrations'
  },
  models: {
    path: 'models',
  }
};
```

之后你就可以使用 `migrate:make` 命令来生成数据库迁移。新的迁移文件默认放在你的 `migrations` 目录下。每个迁移文件名都包含一个时间戳来使 Sutando 确定迁移的顺序：

```bash
$ sutando migrate:make create_flights_table
```

Sutando 将使用迁移文件的名称来猜测表名以及迁移是否会创建一个新表。如果 Sutando 能够从迁移文件的名称中确定表的名称，它将在生成的迁移文件中预填入指定的表，或者，你也可以直接在迁移文件中手动指定表名。

如果要为生成的迁移指定自定义路径，你可以在执行 `migrate:make` 命令时使用 `--path` 选项。给定的路径应该相对于执行命令的路径。

### 迁移结构

迁移类包含两个方法：`up` 和 `down` 。`up` 方法用于向数据库中添加新表、列或索引，而 `down` 方法用于撤销 `up` 方法执行的操作。.

在这两种方法中，可以使用 Schema 构建器来富有表现力地创建和修改表。要了解 Schema 构建器上可用的所有方法，查看其文档。例如，以下迁移会创建一个 `flights` 表：

```js
const { Migration } = require('sutando');

module.exports = class extends Migration {
  /**
    * Run the migrations.
    */
  async up(schema) {
    await schema.createTable('flights', (table) => {
      table.increments('id');
      table.string('name');
      table.string('airline');
      table.timestamps();
    });
  }

  /**
    * Reverse the migrations.
    */
  async down(schema) {
    await schema.dropTableIfExists('flights');
  }
};
```

### 执行迁移

执行 `migrate:run` 命令，来运行所有未执行过的迁移：

```bash
$ sutando migrate:run
```

如果你想查看目前已经执行了哪些迁移，可以使用 `migrate:status` 命令：

```bash
$ sutando migrate:status
```

### 回滚迁移

如果要回滚最后一次迁移操作，可以使用 `migrate:rollback`。该命令会回滚最后「一批」的迁移，这可能包含多个迁移文件：

```bash
$ sutando migrate:rollback
```

通过向 `rollback` 命令加上 `step` 参数，可以回滚指定数量的迁移。例如，以下命令将回滚最后五个迁移：

```bash
$ sutando migrate:rollback --step=5
```

## 数据表

### 创建数据表

接下来我们将使用 `createTable` 方法创建一个新的数据表。`createTable` 接受两个参数：第一个参数是表名，而第二个参数是一个回调函数：

```js
const { Migration } = require('sutando');

module.exports = class extends Migration {
  /**
    * Run the migrations.
    */
  async up(schema) {
    await schema.createTable('users', (table) => {
      table.increments('id');
      table.string('name');
      table.string('email');
      table.timestamps();
    });
  }

  /**
    * Reverse the migrations.
    */
  async down(schema) {
    await schema.dropTableIfExists('users');
  }
};
```

创建表时，可以使用数据库结构构建器的 列方法 来定义表的列。

#### 检查表 / 列是否存在

你可以使用 `hasTable` 和 `hasColumn` 方法检查表或列是否存在：

```js
if (await schema.hasTable('users')) {
  // 「users」表存在...
}

if (await schema.hasColumn('users', 'email')) {
  // 「users」表存在，并且有「email」列...
}
```

此外，还可以使用其他一些属性和方法来定义表创建的其他地方。使用 MySQL 时，可以使用 engine 方法指定表的存储引擎：

```js
await schema.createTable('users', (table) => {
  table.engine('InnoDB');

  // ...
});
```

`charset` 和 `collate` 方法可用于在使用 MySQL 时为创建的表指定字符集和排序规则：

```js
await schema.createTable('users', (table) => {
  table.charset('utf8mb4');
  table.collate('utf8mb4_unicode_ci');

  // ...
});
```

如果你想给数据库表添加「注释」，你可以在表实例上调用 `comment` 方法。目前只有 MySQL 和 Postgres 支持表注释：

```js
await schema.createTable('calculations', (table) => {
  table.comment('Business calculations');

  // ...
});
```

### 更新数据表

Schema 的 `table` 方法可用于更新现有表。与 `createTable` 方法一样，`table` 方法接受两个参数：表的名称和接收可用于向表添加列或索引的回调函数：

```js
await schema.createTable('users', (table) => {
  table.integer('votes');
});
```

### 重命名 / 删除表

要重命名已存在的数据表，使用 `renameTable` 方法：

```js
await schema.renameTable(from, to);
```

要删除已存在的表，你可以使用 `dropTable` 或 `dropTableIfExists` 方法：

```js
await schema.dropTable('users');

await schema.dropTableIfExists('users');
```

## 字段

### 创建字段

Schema 的 `table` 方法可用于更新表。与 `createTable` 方法一样， `table` 方法接受两个参数：表名和一个回调函数，可以使用该实例向表中添加列：

```js
await schema.table('users', (table) => {
  table.integer('votes');
});
```

### 可用的字段类型

Schema 构建器提供了多种方法，用来创建表中对应类型的列。下面列出了所有可用的方法：

#### bigIncrements

`bigIncrements` 方法用于在数据表中创建一个自增的 `UNSIGNED BIGINT` 类型（主键）的列：

```js
table.bigIncrements('id');
```

#### bigInteger

`bigInteger` 方法用于在数据表中创建一个 `BIGINT` 类型的列：

```js
table.bigInteger('votes');
```

#### binary

`binary` 方法用于在数据表中创建一个 `BLOB` 类型的列：

```js
table.binary('photo');
```

#### boolean

`boolean` 方法用于在数据表中创建一个 `BOOLEAN` 类型的列：

```js
table.boolean('confirmed');
```

#### datetime

`datetime` 方法用于在数据表中创建一个 `DATETIME` 类型的列，可选参数为精度的总位数：

```js
table.datetime('created_at', { precision: 6 });
```

#### date

`date` 方法用于在数据表中创建一个 `DATE` 类型的列：

```js
table.date('date');
```

#### decimal

`decimal` 方法用于在数据表中创建一个 `DECIMAL` 类型的列，可选参数分别为有效字数总位数、小数部分总位数：

```js
table.decimal('amount');
table.decimal('amount', 8, 2);
```

#### double

`double` 方法用于在数据表中创建一个 `DOUBLE` 类型的列，可选参数分别为有效字数总位数、小数部分总位数：

```js
table.double('amount', 8, 2);
```

#### enum

`enum` 方法用于在数据表中创建一个 `ENUM` 类型的列：

```js
table.enum('difficulty', ['easy', 'hard']);
```

#### float

`float` 方法用于在数据表中创建一个 `FLOAT` 类型的列，可选参数分别为有效字数总位数、小数部分总位数：

```js
table.float('amount', 8, 2);
```

#### geometry

`geometry` 方法相当于 `GEOMETRY`：

```js
table.geometry('positions');
```

#### increments

`increments` 方法创建一个自动递增相当于 `UNSIGNED INTEGER` 的列作为主键：

```js
table.increments('id');
```

#### integer

`integer` 方法用于在数据表中创建一个 `INTEGER` 类型的列：

```js
table.integer('votes');
```

#### json

`json` 方法用于在数据表中创建一个 `JSON` 类型的列：

```js
table.json('options');
```

#### jsonb

`jsonb` 方法用于在数据表中创建一个 `JSONB` 类型的列：

```js
table.jsonb('options');
```

#### point

`point` 方法用于在数据表中创建一个 `POINT` 类型的列：

```js
table.point('position');
```

#### smallint

`smallint` 方法用于在数据表中创建一个 `SMALLINT` 类型的列：

```js
table.smallint('votes');
```

#### string

`string` 方法创建一个给定长度的 `VARCHAR` 等效列，相当于指定长度的 VARCHAR：

```js
table.string('name', 100);
```

#### text

`text` 方法用于在数据表中创建一个 `TEXT` 类型的列：

```js
table.text('description');
```

#### time

`time` 方法创建一个具有可选精度（总位数）的 `TIME` 等效列：

```js
table.time('sunrise', { precision: 6 });
```

#### timestamp

`timestamp` 方法创建一个具有可选精度（总位数）的 `TIMESTAMP` 类型的列：

```js
table.timestamp('sunrise', { precision: 6 });
```

#### timestamps

`timestamps` 方法创建 `created_at` 和 `updated_at` `TIMESTAMP`等效列：

```js
table.timestamps();
```

#### tinyint

`tinyint` 方法用于在数据表中创建一个 `TINYINT` 类型的列：

```js
table.tinyint('votes');
```

#### uuid

`uuid` 方法用于在数据表中创建一个 `UUID` 类型的列：

```js
table.uuid('id');
```

### 字段修饰符

除了上面列出的列类型外，在向数据库表添加列时还有几个可以使用的「修饰符」。例如，如果要把列设置为要使列为「可空」，你可以使用 `nullable` 方法：

```js
await schema.table('users', (table) => {
  table.string('email').nullable();
})
```

下表时所有可用的列修饰符。此列表不包括索引修饰符:

| 修饰符 | 说明 |
| ---- | ---- |
| `.after('column')` | 将该列放在其它字段「之后」(MySQL) |
| `.charset('utf8mb4')` | 为该列指定字符集 (MySQL) |
| `.collate('utf8_unicode_ci')` | 为该列指定排序规则 (MySQL/PostgreSQL/SQL Server) |
| `.comment('my comment')` | 为该列添加注释 (MySQL/PostgreSQL) |
| `.defaultTo(value)` | 为该列指定一个「默认值」 |
| `.first()` | 将该列放在该表「首位」 (MySQL) |
| `.nullable()` | 允许 NULL 值插入到该列 |
| `.unsigned()` | 设置 INTEGER 类型的字段为 UNSIGNED (MySQL) |

### 修改字段

`alter` 方法可以将现有的字段类型修改为新的类型或修改属性。比如，你可能想增加 `string` 字段的长度，可以使用 `alter` 方法把 `name` 字段的长度从 25 增加到 50。所以，我们可以简单的更新字段属性然后调用 `alter` 方法：

```js
await schema.table('users', (table) => {
  table.string('name', 50).alter();
});
```

当修改一个列时，你必须明确包括所有你想在列定义上保留的修改器 —— 任何缺失的属性都将被丢弃。例如，为了保留 unsigned、default 和 comment 属性，你必须在修改列时明确每个属性的修改。

```js
await schema.table('users', (table) => {
  table.integer('votes').unsigned().defaultTo(1).comment('my comment').alter();
});
```

#### 重命名字段

要重命名一个列，你可以使用模式构建器提供的 `renameColumn` 方法：

```js
await schema.table('users', (table) => {
  table.renameColumn('from', 'to');
});
```

### 删除字段

要删除一个列，你可以使用 `dropColumn` 方法。

```js
await schema.table('users', (table) => {
  table.dropColumn('votes');
});
```

如果要删除多个列，你可以使用 `dropColumns` 方法。

```js
await schema.table('users', (table) => {
  table.dropColumns('votes', 'avatar', 'location');
});
```

## 索引

### 创建索引

结构生成器支持多种类型的索引。下面的例子中新建了一个值唯一的 `email` 字段。我们可以将 `unique` 方法链式地添加到字段定义上来创建索引：

```js
await schema.table('users', (table) => {
  table.string('email').unique();
});
```
或者，你也可以在定义完字段之后创建索引。为此，你应该调用结构生成器上的 `unique` 方法，此方法应该传入唯一索引的列名称：

```js
table.unique('email');
```

你甚至可以将数组传递给索引方法来创建一个复合（或合成）索引：

```js
table.index(['account_id', 'created_at']);
```

创建索引时，Sutando 会自动生成一个合理的索引名称，但你也可以传递参数来自定义索引名称：

```js
table.index(['name', 'last_name'], 'idx_name_last_name');
table.unique('email', {
  indexName: 'unique_email'
});
```

#### 可用的索引类型

下面是所有可用的索引方法：

| 命令 | 说明 |
| ---- | ---- |
| `table.primary('id');` | 添加主键 |
| `table.primary(['id', 'parent_id']);` | 添加复合主键 |
| `table.unique('email');` | 添加唯一索引 |
| `table.index('state');` | 添加普通索引 |

### 删除索引

若要删除索引，将字段数组传给 `dropIndex` 方法，会删除根据表名、字段和键类型生成的索引名称，也可以第二个参数指定索引名称：

| 命令 | 说明 |
| ---- | ---- |
| `table.dropPrimary('users', 'users_id_primary');` | 从「users」表中删除主键 |
| `table.dropUnique('users', 'users_email_unique');` | 从「users」表中删除 unique 索引 |
| `table.dropIndex('geo', 'geo_state_index');` | 从「geo」表中删除基本索引 |

### 外键约束

Sutando 还支持创建用于在数据库层中的强制引用完整性的外键约束。例如，让我们在 `posts` 表上定义一个引用 `users` 表的 `id` 字段的 `user_id` 字段：

```js
await schema.createTable('posts', (table) => {
  table.integer('user_id').unsigned().notNullable();
  table.string('title', 30);
  table.string('content');

  table.foreign('user_id').references('id').inTable('users');
});
```