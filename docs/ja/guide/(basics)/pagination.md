---
description: "オフセットベースのページネーション：paginate メソッドをチェーンして、合計件数・ページ数・ページリンクと共に 1 ページ分のモデルを取得します。"
---

# ページネーション

Sutando はオフセットベースのページネーションを標準でサポートしています。`paginate` メソッドをチェーンすることで、クエリの結果をページ分割できます。

`paginate` メソッドは、第 1 引数にページ番号、第 2 引数に取得する行数を受け取ります。内部的には、総行数をカウントするための追加のクエリを実行します。

## 基本的な使い方

```ts
const users = await db.table('users')
  .where('vote', '>', 1)
  .paginate(2, 15); // instanceof Paginator

const users = await User.query()
  .where('vote', '>', 1)
  .paginate(1, 15); // instanceof Paginator

const users = await db.table('users')
  .where('vote', '>', 1)
  .forPage(2, 15)
  .get(); // instanceof Array

const users = await User.query()
  .where('vote', '>', 1)
  .forPage(1, 15)
  .get(); // instanceof Collection

users.map(user => {
  //
});
```

指定しない場合、1 ページあたりの行数はデフォルトで 15 です。モデルを使用する場合は、`perPage` 属性を設定してモデルごとの 1 ページあたりのデフォルト件数にすることもできます。

```ts
class Post extends Model {}
class User extends Model {
  perPage = 20;
}

const posts = await Post.query().paginate();
console.log(posts.perPage()); // 15

const users = await User.query().paginate();
console.log(users.perPage()); // 20
```

`paginate` メソッドは `Paginator` のインスタンスを返します。これは取得した行に加えて、ページネーションのメタデータを保持します。

各ページネーターインスタンスは、次のメソッドを通じて追加のページネーション情報を提供します：

|  メソッド | 説明 |
|  ----  | ----  |
| `paginator.count()` | 現在のページのアイテム数を取得します。 |
| `paginator.currentPage()` | 現在のページ番号を取得します。 |
| `paginator.hasMorePages()` | データストアにさらにアイテムがあるかどうかを判定します。 |
| `paginator.items()` | 現在のページのアイテムを取得します。 |
| `paginator.lastPage()` | 利用可能な最後のページのページ番号を取得します。 |
| `paginator.perPage()` | 1 ページあたりに表示するアイテム数。 |
| `paginator.total()` | データストア内の一致するアイテムの総数を判定します。 |


## オブジェクト/JSON へのシリアライズ {#serializing-to-object-json}

`toData` または `toJson` メソッドを呼び出すことで、ページネーターの結果をオブジェクト/JSON にシリアライズすることもできます。デフォルトではキー名をスネークケースで返します。ただし、命名戦略を渡すことでデフォルトの規約を上書きできます。

```JSON
{
  "total": 45,
  "per_page": 15,
  "current_page": 1,
  "last_page": 3,
  "count": 15,
  "data": [
    {
      // Record...
    },
    {
      // Record...
    }
  ],
}
```

### カスタムフォーマット

`Paginator.setFormatter` メソッドを呼び出すことで、デフォルトのフォーマットを上書きできます。

```ts
import { Paginator } from 'sutando';

Paginator.setFormatter((paginator) => {
  return {
    meta: {
      total: paginator.total(),
      per_page: paginator.perPage(),
      current_page: paginator.currentPage(),
      last_page: paginator.lastPage(),
    },
    data: paginator.items().toData(),
  };
});
```

ページネーターは文字列に変換する際に JSON に変換されるため、ルートからそのまま返すことができます。Hono が自動的に JSON にシリアライズします：

```ts
import { Hono } from 'hono';

const app = new Hono();

app.get('/', async (c) => {
  const users = await User.query().paginate(Number(c.req.query('page')) || 1);

  return c.json(users);
});
```



