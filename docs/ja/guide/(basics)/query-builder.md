---
description: "Sutando の流暢なクエリビルダは、対応するすべてのデータベースで select、insert、update、delete 文を作成・実行します。"
---

# クエリビルダ

Sutando のクエリビルダは、データベースクエリの作成と実行のための便利で流暢なインターフェイスを提供します。アプリケーションにおけるほとんどのデータベース操作に使用でき、Sutando がサポートするすべてのデータベースシステムで問題なく動作します。

Sutando のクエリビルダでは SQL クエリを記述して実行できます。これは [Knex.js](https://knexjs.org/) の上に構築されており、いくつかの独自の変更が加えられています。

クエリビルダは次のカテゴリに分かれています

- 標準クエリビルダでは、select、update、delete 操作のための SQL クエリを構築できます。
- 挿入クエリビルダでは、insert 操作のための SQL クエリを構築できます。
- 生クエリビルダでは、生の SQL 文字列からクエリを記述して実行できます。


## データベースクエリの実行

### SQL クエリの実行

データベース接続を設定したら、`raw` メソッドを使って基本的なクエリを実行できます：

```ts
const db = sutando.connection();

const response = await db.raw('SET TIME_ZONE = ?', ['UTC']);
```
レスポンスは、基盤となる SQL ライブラリ（たとえば mysql2）が通常のクエリで返す内容そのままです。したがって、レスポンスの扱い方を判断するには、クエリを実行する基盤ライブラリのドキュメントを参照するとよいでしょう。

### テーブルからすべての行を取得する

DB が提供する `table` メソッドを使ってクエリを開始できます。`table` メソッドは指定したテーブルの流暢なクエリビルダインスタンスを返すので、さらに制約をチェーンして、最後に `get` メソッドでクエリの結果を取得できます：

```ts
const db = sutando.connection();

const users = await db.table('users').get();
```

`get` メソッドはクエリ結果を含む配列を返し、各結果はオブジェクトです。オブジェクトのプロパティとしてカラムにアクセスすることで、各カラムの値を取得できます：

```ts
const users = await db.table('users').get();
 
users.map(user => {
  console.log(user.name);
})
```

### テーブルから単一行／単一カラムを取得する {#retrieving-a-single-row-column-from-a-table}

データベーステーブルから 1 行だけを取得したい場合は、`first` メソッドを使用できます：

```ts
const user = await db.table('users').where('name', 'John').first();
 
console.log(user.email);
```

`id` カラムの値で 1 行を取得するには、`find` メソッドを使用します：

```ts
const user = await db.table('users').find(3);
```

### カラム値のリストを取得する

単一カラムの値を含む配列を取得したい場合は、`pluck` メソッドを使用できます。この例では、ユーザーの title のコレクションを取得します：

```ts
const titles = await db.table('users').pluck('title');
 
titles.map(title => {
  console.log(title)
});
```

## 結果のチャンク

数千件のデータベースレコードを扱う必要がある場合は、`chunk` メソッドの使用を検討してください。このメソッドは一度に少ないチャンク単位で結果を取得し、各チャンクを処理のためにクロージャに渡します。たとえば、`users` テーブル全体を一度に 100 レコードずつのチャンクで取得してみましょう：

```ts
await db.table('users').orderBy('id').chunk(100, users => {
  users.map(user => {
    // do something...
  })
});
```

クロージャから `false` を返すことで、以降のチャンクの処理を停止できます：

```ts
await db.table('users').orderBy('id').chunk(100, users => {
  // Process the records...
 
  return false;
});
```

## 集計 [#aggregates]

クエリビルダは、count、`max`、`min`、`avg`、`sum` などの集計値を取得するためのさまざまなメソッドも提供します。クエリを構築した後にこれらのメソッドのいずれかを呼び出せます：

```ts
const count = await db.table('users').count();
 
const price = await db.table('orders').max('price');
```

もちろん、これらのメソッドを他の句と組み合わせて、集計値の計算方法を細かく調整できます：

```ts
const price = await db.table('orders')
  .where('finalized', 1)
  .avg('price');
```

### レコードが存在するかの判定

クエリの制約に一致するレコードが存在するかを判定するために `count` メソッドを使う代わりに、`exists` メソッドを使用できます：

```ts
const isExists = await table('orders').where('finalized', 1).exists()
if (isExists) {
    // ...
}
```

## Select 文

### Select 句の指定

データベーステーブルから常にすべてのカラムを取得したいとは限りません。`select` メソッドを使うと、クエリにカスタムの「select」句を指定できます：

```ts
const users = await db.table('users')
  .select('name', 'email as user_email')
  .get();
```

`distinct` メソッドを使うと、クエリが重複しない結果を返すように強制できます：

```ts
const users = await db.table('users').distinct().get();
```

## 生の式

クエリに任意の文字列を挿入する必要がある場合があります。生の文字列式を作成するには、`raw` メソッドを使用できます：

```ts
const users = await db.table('users')
  .select(db.raw('count(*) as user_count, status'))
  .where('status', '<>', 1)
  .groupBy('status')
  .get();
```

### 生のメソッド

`raw` メソッドの代わりに、次のメソッドを使ってクエリのさまざまな部分に生の式を挿入することもできます。生の式を使用したクエリが SQL インジェクションの脆弱性から保護されていることを Sutando は保証できません。

#### whereRaw

`whereRaw` メソッドは、生の「where」句をクエリに挿入するために使用できます。これらのメソッドは、第 2 引数としてバインディングの配列を任意で受け取ります：

```ts
const orders = await db.table('orders')
  .whereRaw('price > IF(state = "TX", ?, 100)', [200])
  .get();
```

#### havingRaw

`havingRaw` メソッドと `orHavingRaw` メソッドは、「having」句の値として生の文字列を指定するために使用できます。これらのメソッドは、第 2 引数としてバインディングの配列を任意で受け取ります：

```ts
const orders = await db.table('orders')
  .select('department', db.raw('SUM(price) as total_sales'))
  .groupBy('department')
  .havingRaw('SUM(price) > ?', [2500])
  .get();
```

#### orderByRaw

`orderByRaw` メソッドは、「order by」句の値として生の文字列を指定するために使用できます：

```ts
const orders = await db.table('orders')
  .orderByRaw('updated_at - created_at DESC')
  .get();
```

#### groupByRaw

`groupByRaw` メソッドは、「group by」句の値として生の文字列を指定するために使用できます：

```ts
const orders = await db.table('orders')
  .select('city', 'state')
  .groupByRaw('city, state')
  .get();
```

## ジョイン

### 内部ジョイン句

クエリビルダは、クエリにジョイン句を追加するためにも使用できます。基本的な「内部ジョイン」を実行するには、クエリビルダインスタンスで `join` メソッドを使用します。`join` メソッドに渡す第 1 引数はジョイン先のテーブル名で、残りの引数はジョインのカラム制約を指定します。1 つのクエリで複数のテーブルをジョインすることもできます：

```ts
const users = await db.table('users')
  .join('contacts', 'users.id', '=', 'contacts.user_id')
  .join('orders', 'users.id', '=', 'orders.user_id')
  .select('users.*', 'contacts.phone', 'orders.price')
  .get();
```

### 左ジョイン / 右ジョイン句 {#left-join-right-join-clause}

「内部ジョイン」の代わりに「左ジョイン」または「右ジョイン」を実行したい場合は、`leftJoin` メソッドまたは `rightJoin` メソッドを使用します。これらのメソッドは join メソッドと同じシグネチャを持ちます：

```ts
const users = await db.table('users')
  .leftJoin('posts', 'users.id', '=', 'posts.user_id')
  .get();
 
const users = await db.table('users')
  .rightJoin('posts', 'users.id', '=', 'posts.user_id')
  .get();
```

### クロスジョイン句

「クロスジョイン」を実行するには `crossJoin` メソッドを使用できます。クロスジョインは、最初のテーブルとジョインするテーブルとの間で直積を生成します：

```ts
const sizes = await db.table('sizes')
  .crossJoin('colors')
  .get();
```

### 高度なジョイン句

より高度なジョイン句を指定することもできます。まず、`join` メソッドの第 2 引数としてクロージャを渡します。

```ts
await db.table('users')
  .join('contacts', () => {
    this.on('users.id', '=', 'contacts.user_id').orOn(/* ... */);
  })
  .get();
```

## Union

クエリビルダは、2 つ以上のクエリを「union」する便利なメソッドも提供します。たとえば、最初のクエリを作成し、`union` メソッドを使ってさらにクエリを union できます：

```ts
const first = db.table('users')
  .whereNull('first_name');
 
const users = await db.table('users')
  .whereNull('last_name')
  .union(first)
  .get();
```

`union` メソッドに加えて、クエリビルダは `unionAll` メソッドも提供します。`unionAll` メソッドを使って結合されたクエリでは、重複する結果は削除されません。`unionAll` メソッドは `union` メソッドと同じシグネチャを持ちます。

## 基本的な Where 句

### Where 句

クエリビルダの `where` メソッドを使ってクエリに「where」句を追加できます。`where` メソッドの最も基本的な呼び出しには 3 つの引数が必要です。第 1 引数はカラム名です。第 2 引数は演算子で、データベースがサポートする任意の演算子を使用できます。第 3 引数はカラムの値と比較する値です。

たとえば、次のクエリは `votes` カラムの値が `100` に等しく、`age` カラムの値が `35` より大きいユーザーを取得します：

```ts
const users = await db.table('users')
  .where('votes', '=', 100)
  .where('age', '>', 35)
  .get();
```

便宜上、カラムが指定した値と等しい（=）ことを確認したい場合は、その値を `where` メソッドの第 2 引数として渡せます。Sutando は `=` 演算子を使用したいものと見なします：

```ts
const users = await db.table('users').where('votes', 100).get();
```

前述のとおり、データベースシステムがサポートする任意の演算子を使用できます：

```ts
const users = await db.table('users')
  .where('votes', '>=', 100)
  .get();
 
const users = await db.table('users')
  .where('votes', '<>', 100)
  .get();
 
const users = await db.table('users')
  .where('name', 'like', 'T%')
  .get();
```

### Or Where 句

クエリビルダの `where` メソッドの呼び出しをチェーンすると、「where」句は `and` 演算子で結合されます。ただし、`orWhere` メソッドを使うと、`or` 演算子で句をクエリに結合できます。`orWhere` メソッドは `where` メソッドと同じ引数を受け取ります：

```ts
const users = await db.table('users')
  .where('votes', '>', 100)
  .orWhere('name', 'John')
  .get();
```

「or」条件を括弧でグループ化する必要がある場合は、`orWhere` メソッドの第 1 引数としてクロージャを渡せます：

```ts
const users = await db.table('users')
  .where('votes', '>', 100)
  .orWhere(query => {
    query.where('name', 'Abigail')
      .where('votes', '>', 50);
  })
  .get();
```

上記の例は次の SQL を生成します：

```SQL
select * from users where votes > 100 or (name = 'Abigail' and votes > 50)
```

### Where Not 句

`whereNot` メソッドと `orWhereNot` メソッドは、指定したクエリ制約のグループを否定するために使用できます。たとえば、次のクエリはクリアランス対象の商品、または価格が 10 未満の商品を除外します：

```ts
const products = await db.table('products')
  .whereNot(() => {
    this.where('clearance', true).orWhere('price', '<', 10);
  })
  .get();
```

### 追加の Where 句
 
 
#### whereBetween / orWhereBetween {#wherebetween-orwherebetween}

`whereBetween` メソッドは、カラムの値が 2 つの値の間にあることを検証します：

```ts
const users = await db.table('users')
  .whereBetween('votes', [1, 100])
  .get();
```

#### whereNotBetween / orWhereNotBetween {#wherenotbetween-orwherenotbetween}

`whereNotBetween` メソッドは、カラムの値が 2 つの値の範囲外にあることを検証します：

```ts
const users = await db.table('users')
  .whereNotBetween('votes', [1, 100])
  .get();
```

#### whereIn / whereNotIn / orWhereIn / orWhereNotIn {#wherein-wherenotin-orwherein-orwherenotin}

`whereIn` メソッドは、指定したカラムの値が指定した配列に含まれていることを検証します：

```ts
const users = await db.table('users')
  .whereIn('id', [1, 2, 3])
  .get();
```

`whereNotIn` メソッドは、指定したカラムの値が指定した配列に含まれていないことを検証します：

```ts
const users = await db.table('users')
  .whereNotIn('id', [1, 2, 3])
  .get();
```

#### whereNull / whereNotNull / orWhereNull / orWhereNotNull {#wherenull-wherenotnull-orwherenull-orwherenotnull}

`whereNull` メソッドは、指定したカラムの値が NULL であることを検証します：

```ts
const users = await db.table('users')
  .whereNull('updated_at')
  .get();
```

`whereNotNull` メソッドは、カラムの値が NULL でないことを検証します：

```ts
const users = await db.table('users')
  .whereNotNull('updated_at')
  .get();
```

### WhereX

これをよりエレガントに書く方法があります：

```ts
const users = await User.query().where('approved', 1).get();
const posts = await Post.query().where('views_count', '>', 100).get();
```

次のように書けます：

```ts
const users = await User.query().whereApproved(1).get();
const posts = await Post.query().whereViewsCount('>', 100).get();
```


### 論理的なグループ化

クエリで目的の論理的なグループ化を実現するために、複数の「where」句を括弧でグループ化する必要がある場合があります。実際、予期しないクエリの挙動を避けるために、`orWhere` メソッドの呼び出しは常に括弧でグループ化することをお勧めします。これを行うには、`where` メソッドにクロージャを渡します：

```ts
const users = await db.table('users')
  .where('name', '=', 'John')
  .where(() => {
    this.where('votes', '>', 100).orWhere('title', '=', 'Admin');
  })
  .get();
```

ご覧のとおり、`where` メソッドにクロージャを渡すと、クエリビルダに制約グループを開始するよう指示します。クロージャはクエリビルダインスタンスを受け取り、これを使って括弧グループ内に含める制約を設定できます。上記の例は次の SQL を生成します：

```SQL
select * from users where name = 'John' and (votes > 100 or title = 'Admin')
```

## 並べ替え、グループ化

### 並べ替え

#### `orderBy` メソッド

`orderBy` メソッドを使うと、指定したカラムでクエリの結果を並べ替えられます。`orderBy` メソッドが受け取る第 1 引数は並べ替えに使用するカラムで、第 2 引数は並べ替えの方向を決定し、`asc` または `desc` のいずれかです：

```ts
const users = await db.table('users')
  .orderBy('name', 'desc')
  .get();
```

複数のカラムで並べ替えるには、必要なだけ `orderBy` を呼び出します：

```ts
const users = await db.table('users')
  .orderBy('name', 'desc')
  .orderBy('email', 'asc')
  .get();
```

#### `latest` と `oldest` メソッド {#the-latest-oldest-methods}
`latest` メソッドと `oldest` メソッドを使うと、日付で簡単に結果を並べ替えられます。デフォルトでは、結果はテーブルの `created_at` カラムで並べ替えられます。または、並べ替えたいカラム名を渡すこともできます：

```ts
const user = await db.table('users')
  .latest()
  .first();
```

<!-- #### ランダムな並べ替え
`inRandomOrder` メソッドは、クエリ結果をランダムに並べ替えるために使用できます。たとえば、このメソッドを使ってランダムなユーザーを取得できます：

```ts
const randomUser = await db.table('users')
  .inRandomOrder()
  .first();
``` -->

#### 既存の並べ替えの削除
`clearOrder` メソッドは、以前にクエリに適用されたすべての「order by」句を削除します：

```ts
const query = db.table('users').orderBy('name');
 
const unorderedUsers = await query.clearOrder().get();
```

### グループ化

#### `groupBy` と `having` メソッド {#the-groupby-having-methods}

ご想像のとおり、`groupBy` メソッドと `having` メソッドはクエリ結果をグループ化するために使用できます。`having` メソッドのシグネチャは `where` メソッドとよく似ています：

```ts
const users = await db.table('users')
  .groupBy('account_id')
  .having('account_id', '>', 100)
  .get();
```

`havingBetween` メソッドを使うと、指定した範囲内の結果を絞り込めます：

```ts
const report = await db.table('orders')
  .selectRaw('count(id) as number_of_orders, customer_id')
  .groupBy('customer_id')
  .havingBetween('number_of_orders', [5, 15])
  .get();
```

`groupBy` メソッドに複数の引数を渡すと、複数のカラムでグループ化できます：

```ts
const users = await db.table('users')
  .groupBy('first_name', 'status')
  .having('account_id', '>', 100)
  .get();
```

より高度な having 文を構築するには、`havingRaw` メソッドを参照してください。

## Limit と Offset {#limit-offset}

### `skip` と `take` メソッド {#the-skip-take-methods}

`skip` メソッドと `take` メソッドを使うと、クエリから返される結果の数を制限したり、クエリ内の指定した数の結果をスキップしたりできます：

```ts
const users = await db.table('users').skip(10).take(5).get();
```

または、`limit` メソッドと `offset` メソッドを使用できます。これらのメソッドは、それぞれ `take` メソッドと `skip` メソッドと機能的に同等です：

```ts
const users = await db.table('users')
  .offset(10)
  .limit(5)
  .get();
```

## Insert 文

クエリビルダは、データベーステーブルにレコードを挿入するために使用できる `insert` メソッドも提供します。`insert` メソッドは、カラム名と値の配列を受け取ります：

```ts
await db.table('users').insert({
  email: 'kayla@example.com',
  votes: 0
});
```

配列の配列を渡すことで、複数のレコードを一度に挿入できます。各配列はテーブルに挿入するレコードを表します：

```ts
await db.table('users').insert([
  { email: 'picard@example.com', votes: 0 },
  { email: 'janeway@example.com', votes: 0 },
]);
```

## Update 文

データベースにレコードを挿入するだけでなく、クエリビルダは `update` メソッドを使って既存のレコードを更新することもできます。`update` メソッドは `insert` メソッドと同様に、更新するカラムを示すカラムと値のペアの配列を受け取ります。`update` メソッドは影響を受けた行数を返します。where 句を使って update クエリを制約できます：

```ts
await db.table('users')
  .where('id', 1)
  .update({
    votes: 1
  });
```

## インクリメントとデクリメント {#increment-decrement}

クエリビルダは、指定したカラムの値をインクリメントまたはデクリメントする便利なメソッドも提供します。どちらのメソッドも少なくとも 1 つの引数（変更するカラム）を受け取ります。第 2 引数を指定すると、カラムをインクリメントまたはデクリメントする量を指定できます：

```ts
await db.table('users').increment('votes');
 
await db.table('users').increment('votes', 5);
 
await db.table('users').decrement('votes');
 
await db.table('users').decrement('votes', 5);
```

## Delete 文

クエリビルダの `delete` メソッドは、テーブルからレコードを削除するために使用できます。`delete` メソッドは影響を受けた行数を返します。`delete` メソッドを呼び出す前に「where」句を追加して、delete 文を制約できます：

```ts
const deleted = await db.table('users').delete();
 
const deleted = await db.table('users').where('votes', '>', 100).delete();
```

## 悲観的ロック
クエリビルダには、`select` 文を実行するときに「悲観的ロック」を実現するためのいくつかの関数も含まれています。「共有ロック」を付けて文を実行するには、`forShare` メソッドを呼び出します。共有ロックは、トランザクションがコミットされるまで選択した行が変更されるのを防ぎます：

```ts
await db.table('users')
  .where('votes', '>', 100)
  .forShare()
  .get();
```

代わりに、`forUpdate` メソッドを使用できます。「for update」ロックは、選択したレコードが変更されたり、別の共有ロックで選択されたりするのを防ぎます：

```ts
await db.table('users')
  .where('votes', '>', 100)
  .forUpdate()
  .get();
```