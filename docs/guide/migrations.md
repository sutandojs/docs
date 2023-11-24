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

# Database Migration

Migration is database version control, which helps developers complete table structure changes and data migration in daily work.

## Quick start

### Generate migration

First, you need to install Sutando's command line tool and generate a configuration file.

```bash
$ npm install -g sutando
$ sutando init
```

This will generate a `sutando.config.js` file in the project directory, which is used to set database connection and other information.

```js
// Update with your config settings.

module.exports = {
   client: 'mysql2',
   connection: {
     host: 'localhost',
     database: 'database',
     user: 'root',
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

You can then use the `migrate:make` command to generate database migrations. New migration files are placed in your `migrations` directory by default. Each migration file name contains a timestamp to allow Sutando to determine the order of migrations:

```bash
$ sutando migrate:make create_flights_table
```

Sutando will use the name of the migration file to guess the table name and whether the migration will create a new table. If Sutando is able to determine the name of the table from the name of the migration file, it will prepopulate the specified table in the generated migration file, or you can manually specify the table name directly in the migration file.

If you want to specify a custom path for the generated migrations, you can use the `--path` option when executing the `migrate:make` command. The given path should be relative to the path where the command is executed.

### Migration structure

The migration class contains two methods: `up` and `down`. The `up` method is used to add a new table, column or index to the database, while the `down` method is used to undo the operation performed by the `up` method. .

In both methods, you can use Schema builders to expressively create and modify tables. To learn about all the methods available on the Schema builder, check out its documentation. For example, the following migration creates a `flights` table:

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

### Execute migration

Execute the `migrate:run` command to run all unexecuted migrations:

```bash
$ sutando migrate:run
```

If you want to see which migrations have been performed so far, you can use the `migrate:status` command:

```bash
$ sutando migrate:status
```

### Rollback migration

If you want to roll back the last migration operation, you can use `migrate:rollback`. This command will roll back the last "batch" of migrations, which may include multiple migration files:

```bash
$ sutando migrate:rollback
```

You can roll back a specified number of migrations by adding the `step` parameter to the `rollback` command. For example, the following command will roll back the last five migrations:

```bash
$ sutando migrate:rollback --step=5
```

## Tables

### Create tables

Next we will create a new data table using the `createTable` method. `createTable` accepts two parameters: the first parameter is the table name, and the second parameter is a callback function:

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

When you create a table, you can use the Database Structure Builder's columns method to define the table's columns.

#### Check if table/column exists

You can check whether a table or column exists using the `hasTable` and `hasColumn` methods:

```js
if (await schema.hasTable('users')) {
   // "users" table exists...
}

if (await schema.hasColumn('users', 'email')) {
   // The "users" table exists and has the "email" column...
}
```

Additionally, a number of other properties and methods are available to define other places where the table is created. When using MySQL, you can use the engine method to specify the storage engine of the table:

```js
await schema.createTable('users', (table) => {
   table.engine('InnoDB');

   // ...
});
```

The `charset` and `collate` methods can be used to specify the character set and collation for tables created when using MySQL:

```js
await schema.createTable('users', (table) => {
   table.charset('utf8mb4');
   table.collate('utf8mb4_unicode_ci');

   // ...
});
```

If you want to add a "comment" to a database table, you can call the `comment` method on the table instance. Currently only MySQL and Postgres support table comments:

```js
await schema.createTable('calculations', (table) => {
   table.comment('Business calculations');

   // ...
});
```

### Update tables

Schema's `table` method can be used to update an existing table. Like the `createTable` method, the `table` method accepts two parameters: the name of the table and a callback function that can be used to add columns or indexes to the table:

```js
await schema.createTable('users', (table) => {
   table.integer('votes');
});
```

### Rename/delete tables

To rename an existing table, use the `renameTable` method:

```js
await schema.renameTable(from, to);
```

To drop an existing table, you can use the `dropTable` or `dropTableIfExists` method:

```js
await schema.dropTable('users');

await schema.dropTableIfExists('users');
```

## Columns

### Create Columns

Schema's `table` method can be used to update a table. Like the `createTable` method, the `table` method accepts two parameters: the table name and a callback function that can be used to add columns to the table:

```js
await schema.table('users', (table) => {
   table.integer('votes');
});
```

### Available column types

Schema builders provide a variety of methods for creating columns of corresponding types in tables. All available methods are listed below:

#### bigIncrements

The `bigIncrements` method is used to create an auto-incrementing `UNSIGNED BIGINT` type (primary key) column in the data table:

```js
table.bigIncrements('id');
```

#### bigInteger

The `bigInteger` method is used to create a `BIGINT` type column in the data table:

```js
table.bigInteger('votes');
```

#### binary

The `binary` method is used to create a `BLOB` type column in the data table:

```js
table.binary('photo');
```

#### boolean

The `boolean` method is used to create a `BOOLEAN` type column in the data table:

```js
table.boolean('confirmed');
```

#### datetime

The `datetime` method is used to create a `DATETIME` type column in the data table. The optional parameter is the total number of digits of precision:

```js
table.datetime('created_at', { precision: 6 });
```

#### date

The `date` method is used to create a `DATE` type column in the data table:

```js
table.date('date');
```

#### decimal

The `decimal` method is used to create a `DECIMAL` type column in the data table. The optional parameters are the total number of valid words and the total number of decimal places:

```js
table.decimal('amount');
table.decimal('amount', 8, 2);
```

#### double

The `double` method is used to create a `DOUBLE` type column in the data table. The optional parameters are the total number of valid words and the total number of decimal places:

```js
table.double('amount', 8, 2);
```

#### enum

The `enum` method is used to create a column of type `ENUM` in the data table:

```js
table.enum('difficulty', ['easy', 'hard']);
```

#### float

The `float` method is used to create a `FLOAT` type column in the data table. The optional parameters are the total number of valid words and the total number of decimal places:

```js
table.float('amount', 8, 2);
```

#### geometry

The `geometry` method is equivalent to `GEOMETRY`:

```js
table.geometry('positions');
```

#### increments

The `increments` method creates an auto-incrementing column equivalent to `UNSIGNED INTEGER` as the primary key:

```js
table.increments('id');
```

#### integer

The `integer` method is used to create a column of type `INTEGER` in the data table:

```js
table.integer('votes');
```

#### json

The `json` method is used to create a `JSON` type column in the data table:

```js
table.json('options');
```

#### jsonb

The `jsonb` method is used to create a `JSONB` type column in the data table:

```js
table.jsonb('options');
```

#### point

The `point` method is used to create a `POINT` type column in the data table:

```js
table.point('position');
```

#### smallint

The `smallint` method is used to create a `SMALLINT` type column in the data table:

```js
table.smallint('votes');
```

#### string

The `string` method creates a `VARCHAR` equivalent column of a given length, equivalent to a VARCHAR of the specified length:

```js
table.string('name', 100);
```

#### text

The `text` method is used to create a `TEXT` type column in the data table:

```js
table.text('description');
```

#### time

The `time` method creates a `TIME` equivalent column with optional precision (total number of digits):

```js
table.time('sunrise', { precision: 6 });
```

#### timestamp

The `timestamp` method creates a column of type `TIMESTAMP` with an optional precision (total number of digits):

```js
table.timestamp('sunrise', { precision: 6 });
```

#### timestamps

The `timestamps` method creates `created_at` and `updated_at` `TIMESTAMP` equivalent columns:

```js
table.timestamps();
```

#### tinyint

The `tinyint` method is used to create a `TINYINT` type column in the data table:

```js
table.tinyint('votes');
```

#### uuid

The `uuid` method is used to create a `UUID` type column in the data table:

```js
table.uuid('id');
```

### Columns modifiers

In addition to the column types listed above, there are several "modifiers" that can be used when adding columns to a database table. For example, if you want to set a column to be "nullable", you can use the `nullable` method:

```js
await schema.table('users', (table) => {
   table.string('email').nullable();
})
```

The following table shows all available column modifiers. This list does not include index modifiers:

| Modifier | Description |
| ---- | ---- |
| `.after('column')` | Place the column "after" other columns (MySQL) |
| `.charset('utf8mb4')` | Specify the character set for this column (MySQL) |
| `.collate('utf8_unicode_ci')` | Specify the collation for this column (MySQL/PostgreSQL/SQL Server) |
| `.comment('my comment')` | Add a comment to the column (MySQL/PostgreSQL) |
| `.defaultTo(value)` | Specify a "default value" for the column |
| `.first()` | Place the column "first" in the table (MySQL) |
| `.nullable()` | Allows NULL values to be inserted into this column |
| `.unsigned()` | Set a column of type INTEGER to UNSIGNED (MySQL) |

### Modify columns

The `alter` method can modify an existing column type to a new type or modify attributes. For example, you might want to increase the length of the `string` column by using the `alter` method to increase the length of the `name` column from 25 to 50. So, we can simply update the column properties and call the `alter` method:

```js
await schema.table('users', (table) => {
   table.string('name', 50).alter();
});
```

When modifying a column, you must explicitly include all modifiers that you want to retain on the column definition - any missing attributes will be discarded. For example, in order to preserve the unsigned, default, and comment attributes, you must explicitly modify each attribute when modifying the column.

```js
await schema.table('users', (table) => {
   table.integer('votes').unsigned().defaultTo(1).comment('my comment').alter();
});
```

#### Rename columns

To rename a column, you can use the `renameColumn` method provided by the schema builder:

```js
await schema.table('users', (table) => {
   table.renameColumn('from', 'to');
});
```

### Delete columns

To drop a column, you can use the `dropColumn` method.

```js
await schema.table('users', (table) => {
   table.dropColumn('votes');
});
```

If you want to delete multiple columns, you can use the `dropColumns` method.

```js
await schema.table('users', (table) => {
   table.dropColumns('votes', 'avatar', 'location');
});
```

## Indexes

### Create indexes

The structure builder supports several types of indexes. The following example creates a new `email` column with a unique value. We can chain the `unique` method to the column definition to create an index:

```js
await schema.table('users', (table) => {
   table.string('email').unique();
});
```
Alternatively, you can create the index after defining the columns. To do this, you should call the `unique` method on the structure builder, which should be passed the column name of the unique index:

```js
table.unique('email');
```

You can even pass an array to the index method to create a compound (or synthetic) index:

```js
table.index(['account_id', 'created_at']);
```

When creating an index, Sutando will automatically generate a reasonable index name, but you can also pass parameters to customize the index name:

```js
table.index(['name', 'last_name'], 'idx_name_last_name');
table.unique('email', {
   indexName: 'unique_email'
});
```

#### Available index types

Below are all available indexing methods:

| Command | Description |
| ---- | ---- |
| `table.primary('id');` | Add primary key |
| `table.primary(['id', 'parent_id']);` | Add composite primary key |
| `table.unique('email');` | Add unique index |
| `table.index('state');` | Add a normal index |

### Delete indexes

To delete an index, pass the column array to the `dropIndex` method, which will delete the index name generated based on the table name, column and key type. You can also specify the index name as the second parameter:

| Command | Description |
| ---- | ---- |
| `table.dropPrimary('users', 'users_id_primary');` | Delete the primary key from the "users" table |
| `table.dropUnique('users', 'users_email_unique');` | Delete the unique index from the "users" table |
| `table.dropIndex('geo', 'geo_state_index');` | Drop the base index from the "geo" table |

### Foreign key constraints

Sutando also supports the creation of foreign key constraints for enforcing referential integrity in the database layer. For example, let's define a `user_id` column on the `posts` table that references the `id` column of the `users` table:

```js
await schema.createTable('posts', (table) => {
   table.integer('user_id').unsigned().notNullable();
   table.string('title', 30);
   table.string('content');

   table.foreign('user_id').references('id').inTable('users');
});
```