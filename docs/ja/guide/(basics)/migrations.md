---
description: "データベースのバージョン管理：マイグレーションファイルでテーブルを作成・変更し、Sutando CLI で実行して、あらゆる環境のスキーマを同期させます。"
---

# データベースマイグレーション

マイグレーションはデータベースのバージョン管理であり、日々の作業におけるテーブル構造の変更やデータ移行を開発者が進めるのを助けます。

## クイックスタート

### マイグレーションの生成

まず、設定ファイルを生成します。

```bash
$ npx sutando init
```

Sutando のコマンドラインツールをグローバルにインストールしたい場合は、次のコマンドを使用します：

```bash
$ npm install -g sutando
$ sutando init
```

これによりプロジェクトディレクトリに `sutando.config.js` ファイルが生成され、データベース接続などの情報を設定するために使用します。

```ts
// Update with your config settings.

export default 
   client: 'mysql2',
   connection: {
     host: 'localhost',
     database: 'database',
     user: 'root',
     password: 'password'
   },
  // You can add multiple connections, just specify the connection name.
  connections: {
    pgsql: {
      client: 'pg',
      connection: {
        host: 'localhost',
        database: 'another_database',
        user:     'root',
        password: 'password'
      }
    }
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

その後、`migrate:make` コマンドを使用してデータベースのマイグレーションを生成できます。新しいマイグレーションファイルはデフォルトで `migrations` ディレクトリに配置されます。各マイグレーションファイル名にはタイムスタンプが含まれており、Sutando がマイグレーションの順序を判断できるようになっています：

```bash
$ npx sutando migrate:make create_flights_table
```

Sutando はマイグレーションファイルの名前を使って、テーブル名と、そのマイグレーションが新しいテーブルを作成するかどうかを推測します。マイグレーションファイルの名前からテーブル名を判断できる場合、生成されたマイグレーションファイル内でそのテーブルが事前に入力されます。あるいは、マイグレーションファイル内でテーブル名を直接手動で指定することもできます。

生成されるマイグレーションにカスタムパスを指定したい場合は、`migrate:make` コマンドの実行時に `--path` オプションを使用します。指定するパスは、コマンドを実行するディレクトリからの相対パスである必要があります。

### マイグレーションの構造

マイグレーションクラスには `up` と `down` という 2 つのメソッドがあります。`up` メソッドはデータベースに新しいテーブル、カラム、インデックスを追加するために使用し、`down` メソッドは `up` メソッドで実行した操作を元に戻すために使用します。 .

どちらのメソッドでも、Schema ビルダーを使って表現豊かにテーブルを作成・変更できます。Schema ビルダーで利用可能なすべてのメソッドについては、そのドキュメントを参照してください。例えば、次のマイグレーションは `flights` テーブルを作成します：

```ts
import { Migration } from 'sutando';

export default 
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

### マイグレーションの接続

マイグレーションがアプリケーションのデフォルトのデータベース接続以外のデータベース接続を扱う場合は、マイグレーションの `connection` プロパティを設定して、使用するデータベース接続を指定する必要があります。

```ts
export default 
  connection = 'pgsql';

  /**
   * Run the migrations.
   */
  async up(schema) {
    // ...
  }
}
```

### マイグレーションの実行

`migrate:run` コマンドを実行すると、まだ実行されていないすべてのマイグレーションを実行します：

```bash
$ npx sutando migrate:run
```

これまでにどのマイグレーションが実行されたかを確認したい場合は、`migrate:status` コマンドを使用します：

```bash
$ npx sutando migrate:status
```

### マイグレーションのロールバック

最後のマイグレーション操作をロールバックしたい場合は、`migrate:rollback` を使用します。このコマンドは最後の「バッチ」のマイグレーションをロールバックします。これには複数のマイグレーションファイルが含まれる場合があります：

```bash
$ npx sutando migrate:rollback
```

`rollback` コマンドに `step` パラメータを追加すると、指定した数のマイグレーションをロールバックできます。例えば、次のコマンドは最後の 5 つのマイグレーションをロールバックします：

```bash
$ npx sutando migrate:rollback --step=5
```

## テーブル

### テーブルの作成

次に、`createTable` メソッドを使って新しいデータテーブルを作成します。`createTable` は 2 つのパラメータを受け取ります。1 つ目のパラメータはテーブル名で、2 つ目のパラメータはコールバック関数です：

```ts
import { Migration } from 'sutando';

export default 
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

テーブルを作成するときは、データベース構造ビルダーのカラムメソッドを使ってテーブルのカラムを定義できます。

#### テーブル / カラムの存在確認 {#check-if-table-column-exists}

`hasTable` と `hasColumn` メソッドを使って、テーブルやカラムが存在するかを確認できます：

```ts
if (await schema.hasTable('users')) {
   // "users" table exists...
}

if (await schema.hasColumn('users', 'email')) {
   // The "users" table exists and has the "email" column...
}
```

さらに、テーブルを作成する際のその他の設定を定義するためのプロパティやメソッドもいくつか用意されています。MySQL を使用する場合、engine メソッドでテーブルのストレージエンジンを指定できます：

```ts
await schema.createTable('users', (table) => {
   table.engine('InnoDB');

   // ...
});
```

`charset` と `collate` メソッドは、MySQL を使用するときに作成するテーブルの文字セットと照合順序を指定するために使用できます：

```ts
await schema.createTable('users', (table) => {
   table.charset('utf8mb4');
   table.collate('utf8mb4_unicode_ci');

   // ...
});
```

データベーステーブルに「コメント」を追加したい場合は、テーブルインスタンスで `comment` メソッドを呼び出します。現在、テーブルのコメントは MySQL と Postgres のみがサポートしています：

```ts
await schema.createTable('calculations', (table) => {
   table.comment('Business calculations');

   // ...
});
```

### テーブルの更新

Schema の `table` メソッドは、既存のテーブルを更新するために使用できます。`createTable` メソッドと同様に、`table` メソッドは 2 つのパラメータを受け取ります。テーブル名と、テーブルにカラムやインデックスを追加するために使用できるコールバック関数です：

```ts
await schema.table('users', (table) => {
   table.integer('votes');
});
```

### テーブルの名前変更 / 削除 {#rename-delete-tables}

既存のテーブルの名前を変更するには、`renameTable` メソッドを使用します：

```ts
await schema.renameTable(from, to);
```

既存のテーブルを削除するには、`dropTable` または `dropTableIfExists` メソッドを使用できます：

```ts
await schema.dropTable('users');

await schema.dropTableIfExists('users');
```

## カラム

### カラムの作成

Schema の `table` メソッドは、テーブルを更新するために使用できます。`createTable` メソッドと同様に、`table` メソッドは 2 つのパラメータを受け取ります。テーブル名と、テーブルにカラムを追加するために使用できるコールバック関数です：

```ts
await schema.table('users', (table) => {
   table.integer('votes');
});
```

### 利用可能なカラム型

Schema ビルダーは、テーブルに対応する型のカラムを作成するためのさまざまなメソッドを提供します。利用可能なメソッドはすべて以下に示します：

#### bigIncrements

`bigIncrements` メソッドは、データテーブルに自動インクリメントする `UNSIGNED BIGINT` 型（主キー）のカラムを作成するために使用します：

```ts
table.bigIncrements('id');
```

#### bigInteger

`bigInteger` メソッドは、データテーブルに `BIGINT` 型のカラムを作成するために使用します：

```ts
table.bigInteger('votes');
```

#### binary

`binary` メソッドは、データテーブルに `BLOB` 型のカラムを作成するために使用します：

```ts
table.binary('photo');
```

#### boolean

`boolean` メソッドは、データテーブルに `BOOLEAN` 型のカラムを作成するために使用します：

```ts
table.boolean('confirmed');
```

#### datetime

`datetime` メソッドは、データテーブルに `DATETIME` 型のカラムを作成するために使用します。省略可能なパラメータは精度の総桁数です：

```ts
table.datetime('created_at', { precision: 6 });
```

#### date

`date` メソッドは、データテーブルに `DATE` 型のカラムを作成するために使用します：

```ts
table.date('date');
```

#### decimal

`decimal` メソッドは、データテーブルに `DECIMAL` 型のカラムを作成するために使用します。省略可能なパラメータは、有効桁数の総数と小数部の総桁数です：

```ts
table.decimal('amount');
table.decimal('amount', 8, 2);
```

#### double

`double` メソッドは、データテーブルに `DOUBLE` 型のカラムを作成するために使用します。省略可能なパラメータは、有効桁数の総数と小数部の総桁数です：

```ts
table.double('amount', 8, 2);
```

#### enum

`enum` メソッドは、データテーブルに `ENUM` 型のカラムを作成するために使用します：

```ts
table.enum('difficulty', ['easy', 'hard']);
```

#### float

`float` メソッドは、データテーブルに `FLOAT` 型のカラムを作成するために使用します。省略可能なパラメータは、有効桁数の総数と小数部の総桁数です：

```ts
table.float('amount', 8, 2);
```

#### geometry

`geometry` メソッドは `GEOMETRY` と同等です：

```ts
table.geometry('positions');
```

#### increments

`increments` メソッドは、主キーとして `UNSIGNED INTEGER` に相当する自動インクリメントのカラムを作成します：

```ts
table.increments('id');
```

#### integer

`integer` メソッドは、データテーブルに `INTEGER` 型のカラムを作成するために使用します：

```ts
table.integer('votes');
```

#### json

`json` メソッドは、データテーブルに `JSON` 型のカラムを作成するために使用します：

```ts
table.json('options');
```

#### jsonb

`jsonb` メソッドは、データテーブルに `JSONB` 型のカラムを作成するために使用します：

```ts
table.jsonb('options');
```

#### point

`point` メソッドは、データテーブルに `POINT` 型のカラムを作成するために使用します：

```ts
table.point('position');
```

#### smallint

`smallint` メソッドは、データテーブルに `SMALLINT` 型のカラムを作成するために使用します：

```ts
table.smallint('votes');
```

#### string

`string` メソッドは、指定された長さの `VARCHAR` に相当するカラムを作成します：

```ts
table.string('name', 100);
```

#### text

`text` メソッドは、データテーブルに `TEXT` 型のカラムを作成するために使用します：

```ts
table.text('description');
```

#### time

`time` メソッドは、省略可能な精度（総桁数）を持つ `TIME` に相当するカラムを作成します：

```ts
table.time('sunrise', { precision: 6 });
```

#### timestamp

`timestamp` メソッドは、省略可能な精度（総桁数）を持つ `TIMESTAMP` 型のカラムを作成します：

```ts
table.timestamp('sunrise', { precision: 6 });
```

#### timestamps

`timestamps` メソッドは、`created_at` と `updated_at` の `TIMESTAMP` に相当するカラムを作成します：

```ts
table.timestamps();
```

#### tinyint

`tinyint` メソッドは、データテーブルに `TINYINT` 型のカラムを作成するために使用します：

```ts
table.tinyint('votes');
```

#### uuid

`uuid` メソッドは、データテーブルに `UUID` 型のカラムを作成するために使用します：

```ts
table.uuid('id');
```

### カラム修飾子

上記のカラム型に加えて、データベーステーブルにカラムを追加するときに使用できるいくつかの「修飾子」があります。例えば、カラムを「null 許容」に設定したい場合は、`nullable` メソッドを使用します：

```ts
await schema.table('users', (table) => {
   table.string('email').nullable();
})
```

次の表は、利用可能なカラム修飾子をすべて示しています。このリストにはインデックス修飾子は含まれていません：

| 修飾子 | 説明 |
| ---- | ---- |
| `.after('column')` | 他のカラムの「後ろ」にカラムを配置します (MySQL) |
| `.charset('utf8mb4')` | このカラムの文字セットを指定します (MySQL) |
| `.collate('utf8_unicode_ci')` | このカラムの照合順序を指定します (MySQL/PostgreSQL/SQL Server) |
| `.comment('my comment')` | カラムにコメントを追加します (MySQL/PostgreSQL) |
| `.defaultTo(value)` | カラムの「デフォルト値」を指定します |
| `.first()` | テーブルの「先頭」にカラムを配置します (MySQL) |
| `.nullable()` | このカラムに NULL 値を挿入できるようにします |
| `.unsigned()` | INTEGER 型のカラムを UNSIGNED に設定します (MySQL) |

### カラムの変更

`alter` メソッドは、既存のカラムの型を新しい型に変更したり、属性を変更したりできます。例えば、`string` カラムの長さを増やしたいとします。`alter` メソッドを使って `name` カラムの長さを 25 から 50 に増やせます。そのためには、カラムのプロパティを更新して `alter` メソッドを呼び出すだけです：

```ts
await schema.table('users', (table) => {
   table.string('name', 50).alter();
});
```

カラムを変更するときは、カラム定義に残したいすべての修飾子を明示的に含める必要があります。指定しなかった属性は破棄されます。例えば、unsigned、default、comment の各属性を保持するには、カラムを変更する際にそれぞれの属性を明示的に指定する必要があります。

```ts
await schema.table('users', (table) => {
   table.integer('votes').unsigned().defaultTo(1).comment('my comment').alter();
});
```

#### カラムの名前変更

カラムの名前を変更するには、schema ビルダーが提供する `renameColumn` メソッドを使用します：

```ts
await schema.table('users', (table) => {
   table.renameColumn('from', 'to');
});
```

### カラムの削除

カラムを削除するには、`dropColumn` メソッドを使用できます。

```ts
await schema.table('users', (table) => {
   table.dropColumn('votes');
});
```

複数のカラムを削除したい場合は、`dropColumns` メソッドを使用できます。

```ts
await schema.table('users', (table) => {
   table.dropColumns('votes', 'avatar', 'location');
});
```

## インデックス

### インデックスの作成

構造ビルダーはいくつかの種類のインデックスをサポートしています。次の例では、値が一意である新しい `email` カラムを作成します。カラム定義に `unique` メソッドをチェーンしてインデックスを作成できます：

```ts
await schema.table('users', (table) => {
   table.string('email').unique();
});
```
あるいは、カラムを定義した後にインデックスを作成することもできます。そのためには、構造ビルダーで `unique` メソッドを呼び出し、一意インデックスのカラム名を渡します：

```ts
table.unique('email');
```

インデックスメソッドに配列を渡して、複合（または合成）インデックスを作成することもできます：

```ts
table.index(['account_id', 'created_at']);
```

インデックスを作成するとき、Sutando は適切なインデックス名を自動的に生成しますが、パラメータを渡してインデックス名をカスタマイズすることもできます：

```ts
table.index(['name', 'last_name'], 'idx_name_last_name');
table.unique('email', {
   indexName: 'unique_email'
});
```

#### 利用可能なインデックスの種類

以下は、利用可能なインデックスメソッドのすべてです：

| コマンド | 説明 |
| ---- | ---- |
| `table.primary('id');` | 主キーを追加します |
| `table.primary(['id', 'parent_id']);` | 複合主キーを追加します |
| `table.unique('email');` | 一意インデックスを追加します |
| `table.index('state');` | 通常のインデックスを追加します |

### インデックスの削除

インデックスを削除するには、カラムの配列を `dropIndex` メソッドに渡します。これにより、テーブル名、カラム、キーの種類に基づいて生成されたインデックス名が削除されます。2 つ目のパラメータでインデックス名を指定することもできます：

| コマンド | 説明 |
| ---- | ---- |
| `table.dropPrimary('users', 'users_id_primary');` | 「users」テーブルから主キーを削除します |
| `table.dropUnique('users', 'users_email_unique');` | 「users」テーブルから一意インデックスを削除します |
| `table.dropIndex('geo', 'geo_state_index');` | 「geo」テーブルから基本インデックスを削除します |

### 外部キー制約

Sutando は、データベース層で参照整合性を強制するための外部キー制約の作成もサポートしています。例えば、`posts` テーブルに、`users` テーブルの `id` カラムを参照する `user_id` カラムを定義してみましょう：

```ts
await schema.createTable('posts', (table) => {
   table.integer('user_id').unsigned().notNullable();
   table.string('title', 30);
   table.string('content');

   table.foreign('user_id').references('id').inTable('users');
});
```