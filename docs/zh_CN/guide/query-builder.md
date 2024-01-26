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

# 查询构造器

Sutando 的数据库查询构造器为创建和运行数据库查询提供了一个方便的接口。它可以用于支持大部分数据库操作，并与 Sutando 支持的所有数据库系统完美运行。

Sutando 查询构造器允许你编写和执行 SQL 查询。 它建立在 [Knex.js](https://knexjs.org/) 之上，几乎没有改动。

我们将查询构造器分为以下几类

- 标准查询构造器允许您为选择、更新和删除操作构建 SQL 查询。
- 插入查询构造器允许您为插入操作构建 SQL 查询。
- 原始查询构造器允许您从原始 SQL 字符串编写和执行查询。


## 运行数据库查询

### 执行原生 SQL 查询

一旦配置好数据库连接，你可以使用 `raw` 方法来执行原生 SQL 语句：

```js
const db = sutando.connection();

const response = await db.raw('SET TIME_ZONE = ?', ['UTC']);
```
响应将是底层 SQL 库(例如 mysql2)通常在正常查询中返回的任何内容，因此您可能需要查看查询正在执行的基础库的文档，以确定如何处理响应。

### 从表中检索所有行

你可以使用 `table` 方法来开始查询。`table` 方法为给定的表返回一个查询构造器实例，允许你在查询上链式调用更多的约束，最后使用 `get` 方法获取结果：

```js
const db = sutando.connection();

const users = await db.table('users').get();
```

`get` 方法返回一个包含查询结果的数组，其中每个结果都是对象。你可以访问字段作为对象的属性来访问每列的值：

```js
const users = await db.table('users').get();
 
users.map(user => {
  console.log(user.name);
})
```

### 从数据表中获取单行或单列

如果你只需要从数据表中获取一行数据，你可以使用 `first` 方法：

```js
const user = await db.table('users').where('name', 'John').first();
 
console.log(user.email);
```

如果是通过 `id` 字段值获取一行数据，可以使用 `find` 方法：

```js
const user = await db.table('users').find(3);
```

### 获取一列的值

如果你想获取包含单列值的集合，则可以使用 `pluck` 方法。在下面的例子中，我们将获取角色表中标题的集合：

```js
const titles = await db.table('users').pluck('title');
 
titles.map(title => {
  console.log(title)
});
```

## 分块结果

如果您需要处理成千上万的数据库记录，请考虑使用 `chunk` 方法。 这个方法一次检索一小块结果，并将每个块反馈到闭包函数中进行处理。 例如，让我们以一次 100 条记录的块为单位检索整个 `users` 表:

```js
await db.table('users').orderBy('id').chunk(100, users => {
  users.map(user => {
    // do something...
  })
});
```

您可以通过从闭包中返回 `false` 来停止处理其他块:

```js
await db.table('users').orderBy('id').chunk(100, users => {
  // Process the records...
 
  return false;
});
```

## 聚合

查询构造器还提供了各种聚合方法，比如 `count`，`max`，`min`，`avg`，还有 `sum`。你可以在构造查询后调用任何方法:

```js
const count = await db.table('users').count();
 
const price = await db.table('orders').max('price');
```

当然，你也可以将这些聚合方法与其他的查询语句相结合: 

```js
const price = await db.table('orders')
  .where('finalized', 1)
  .avg('price');
```

### 判断记录是否存在

除了通过 `count` 方法可以确定查询条件的结果是否存在之外，还可以使用 `exists` 方法：

```js
const isExists = await table('orders').where('finalized', 1).exists()
if (isExists) {
    // ...
}
```

## Select 说明

### 指定一个 Select 语句

当然你可能不是总是希望从数据库表中获取所有列。使用 `select` 方法，你可以自定义一个 select 查询语句来查询指定的字段：

```js
const users = await db.table('users')
  .select('name', 'email as user_email')
  .get();
```

`distinct` 方法会强制让查询返回的结果不重复: 

```js
const users = await db.table('users').distinct().get();
```

## 原生表达式

有时候你可能需要在查询中使用原生表达式。你可以使用 `raw` 创建一个原生表达式：

```js
const users = await db.table('users')
  .select(db.raw('count(*) as user_count, status'))
  .where('status', '<>', 1)
  .groupBy('status')
  .get();
```

### 原生方法

可以使用以下方法代替 `raw`，将原生表达式插入查询的各个部分。 注意，Sutando 无法保证所有使用原生表达式的查询都受到防 SQL 注入漏洞保护。

#### whereRaw

`whereRaw` 方法将原生的 where 注入到你的查询中。这两个方法的第二个参数是可选项，值是一个绑定参数的数组：

```js
const orders = await db.table('orders')
  .whereRaw('price > IF(state = "TX", ?, 100)', [200])
  .get();
```

#### havingRaw

`havingRaw` 方法可以用于将原生字符串作为 having 语句的值。这两个方法的第二个参数是可选项，值是一个绑定参数的数组：

```js
const orders = await db.table('orders')
  .select('department', db.raw('SUM(price) as total_sales'))
  .groupBy('department')
  .havingRaw('SUM(price) > ?', [2500])
  .get();
```

#### orderByRaw

`orderByRaw` 方法可用于将原生字符串设置为 order by 语句的值：

```js
const orders = await db.table('orders')
  .orderByRaw('updated_at - created_at DESC')
  .get();
```

#### groupByRaw

`groupByRaw` 方法可以用于将原生字符串设置为 group by 语句的值：

```js
const orders = await db.table('orders')
  .select('city', 'state')
  .groupByRaw('city, state')
  .get();
```

## Joins

### Inner Join 语句

查询构造器也可以编写 `join` 方法。若要执行基本的「内链接」，你可以在查询构造器实例上使用 `join` 方法。传递给 `join` 方法的第一个参数是你需要连接的表的名称，而其他参数则使用指定连接的字段约束。你还可以在单个查询中连接多个数据表：

```js
const users = await db.table('users')
  .join('contacts', 'users.id', '=', 'contacts.user_id')
  .join('orders', 'users.id', '=', 'orders.user_id')
  .select('users.*', 'contacts.phone', 'orders.price')
  .get();
```

### Left Join / Right Join 语句

如果你想使用 「左连接」或者 「右连接」代替「内连接」 ，可以使用 `leftJoin` 或者 `rightJoin` 方法。这两个方法与 `join` 方法用法相同：

```js
const users = await db.table('users')
  .leftJoin('posts', 'users.id', '=', 'posts.user_id')
  .get();
 
const users = await db.table('users')
  .rightJoin('posts', 'users.id', '=', 'posts.user_id')
  .get();
```

### Cross Join 语句

你可以使用 `crossJoin` 方法和你想要连接的表名做「交叉连接」: 

```js
const sizes = await db.table('sizes')
  .crossJoin('colors')
  .get();
```

### 高级 Join 语句

你还可以指定更高级的 join 语句。比如传递一个闭包作为 `join` 方法的第二个参数。 

```js
await db.table('users')
  .join('contacts', () => {
    this.on('users.id', '=', 'contacts.user_id').orOn(/* ... */);
  })
  .get();
```

## Unions

查询构造器还提供了一种简洁的方式将两个或者多个查询联合在一起。例如，你可以先创建一个查询，然后使用 `union` 方法来连接更多的查询： 

```js
const first = db.table('users')
  .whereNull('first_name');
 
const users = await db.table('users')
  .whereNull('last_name')
  .union(first)
  .get();
```

查询构造器不仅提供了 `union` 方法，还提供了一个 `unionAll` 方法。当查询结合 `unionAll` 方法使用时，将不会删除重复的结果。`unionAll` 方法的用法和 `union` 方法一样。

## 基础 Where 语句

### Where 语句

你可以在 where 语句中使用查询构造器的 `where` 方法。调用 `where` 方法需要三个基本参数。第一个参数是字段的名称。第二个参数是一个操作符，它可以是数据库中支持的任意操作符。第三个参数是与字段比较的值。

例如。在 `users` 表中查询 `votes` 字段等于 100 并且 `age` 字段大于 `35` 的数据： 

```js
const users = await db.table('users')
  .where('votes', '=', 100)
  .where('age', '>', 35)
  .get();
```

为了方便起见。如果你想要比较一个字段的值是否等于给定的值。你可以将这个给定的值作为第二个参数传递给 `where` 方法。那么，Sutando 会默认使用 `=` 操作符

```js
const users = await db.table('users').where('votes', 100).get();
```

如上所述，您可以使用数据库支持的任意操作符: 

```js
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

### Or Where 语句

当链式调用多个 `where` 方法的时候，这些 where 语句将会被看成是 `and` 关系。另外，您也可以在查询语句中使用 `orWhere` 方法来表示 `or` `关系。orWhere` 方法接收的参数和 `where` 方法接收的参数一样： 

```js
const users = await db.table('users')
  .where('votes', '>', 100)
  .orWhere('name', 'John')
  .get();
```

如果您需要在括号内对 `or` 条件进行分组，那么可以传递一个闭包作为 `orWhere` 方法的第一个参数： 

```js
const users = await db.table('users')
  .where('votes', '>', 100)
  .orWhere(query => {
    query.where('name', 'Abigail')
      .where('votes', '>', 50);
  })
  .get();
```

上面的例子将会生成下面的 SQL：

```SQL
select * from users where votes > 100 or (name = 'Abigail' and votes > 50)
```

### Where Not 语句

`whereNot` 和 `orWhereNot` 方法可用于否定一组给定的查询条件。例如，下面的查询排除了正在清仓甩卖或价格低于 10 的产品：

```js
const products = await db.table('products')
  .whereNot(() => {
    this.where('clearance', true).orWhere('price', '<', 10);
  })
  .get();
```

### 其他 Where 语句
 
 
#### whereBetween / orWhereBetween

`whereBetween` 方法是用来验证字段的值是否在给定的两个值之间： 

```js
const users = await db.table('users')
  .whereBetween('votes', [1, 100])
  .get();
```

#### whereNotBetween / orWhereNotBetween

`whereNotBetween` 方法是用来验证字段的值是否不在给定的两个值之间： 

```js
const users = await db.table('users')
  .whereNotBetween('votes', [1, 100])
  .get();
```

#### whereIn / whereNotIn / orWhereIn / orWhereNotIn

`whereIn` 方法是用来验证一个字段的值是否在给定的数组中： 

```js
const users = await db.table('users')
  .whereIn('id', [1, 2, 3])
  .get();
```

`whereNotIn` 方法是用来验证一个字段的值是否不在给定的数组中： 

```js
const users = await db.table('users')
  .whereNotIn('id', [1, 2, 3])
  .get();
```

#### whereNull / whereNotNull / orWhereNull / orWhereNotNull

`whereNull` 方法是用来验证给定字段的值是否为 `null`： 

```js
const users = await db.table('users')
  .whereNull('updated_at')
  .get();
```

`whereNotNull` 方法是用来验证给定字段的值是否不为 `null`： 

```js
const users = await db.table('users')
  .whereNotNull('updated_at')
  .get();
```

### WhereX

有一种简便的方式来改变这些查询： 

```js
const users = await User.query().where('approved', 1).get();
const posts = await Post.query().where('views_count', '>', 100).get();
```

用下面的替代： 

```js
const users = await User.query().whereApproved(1).get();
const posts = await Post.query().whereViewsCount('>', 100).get();
```


### 逻辑分组

有时您可能需要将括号内的几个 “where” 子句分组，以实现查询所需的逻辑分组。实际上应该将 `orWhere` 方法的调用分组到括号中，以避免不可预料的查询逻辑误差。因此可以传递闭包给 `where` 方法： 

```js
const users = await db.table('users')
  .where('name', '=', 'John')
  .where(() => {
    this.where('votes', '>', 100).orWhere('title', '=', 'Admin');
  })
  .get();
```

如您所见，将闭包传递到 `where` 方法将指示查询生成器构造一个约束组。闭包将接收一个查询生成器实例，您可以使用该实例设置应包含在括号组中的条件。上面的示例将生成以下 SQL: 

```SQL
select * from users where name = 'John' and (votes > 100 or title = 'Admin')
```

## Ordering, Grouping

### Ordering

#### `orderBy` 方法

`orderBy` 方法允许你通过给定字段对结果集进行排序。 `orderBy` 的第一个参数应该是你希望排序的字段，第二个参数控制排序的方向，可以是 `asc` 或 `desc`： 

```js
const users = await db.table('users')
  .orderBy('name', 'desc')
  .get();
```

如果你需要使用多个字段进行排序，你可以多次引用 `orderBy`: 

```js
const users = await db.table('users')
  .orderBy('name', 'desc')
  .orderBy('email', 'asc')
  .get();
```

#### `latest` & `oldest` 方法 
 
`latest` 和 `oldest` 方法让你以一种便捷的方式通过日期进行排序。它们默认使用 `created_at` 列作为排序依据。当然，你也可以传递自定义的列名： 

```js
const user = await db.table('users')
  .latest()
  .first();
```

#### 随机排序

`inRandomOrder` 方法被用来将结果进行随机排序。例如，你可以使用此方法随机找到一个用户： 

```js
const randomUser = await db.table('users')
  .inRandomOrder()
  .first();
```

#### 删除已经存在的所有排序

`clearOrder` 方法允许你删除已经存在的所有排序，如果你愿意，可以在之后附加一个新的排序。例如，你可以删除所有已存在的排序： 

```js
const query = db.table('users').orderBy('name');
 
const unorderedUsers = await query.clearOrder().get();
```

### Grouping

#### `groupBy` & `having` 方法

如您所料，`groupBy` 和 `having` 方法用于将结果分组。 `having` 方法的使用与 `where` 方法十分相似：

```js
const users = await db.table('users')
  .groupBy('account_id')
  .having('account_id', '>', 100)
  .get();
```

You can use the `havingBetween` method to filter the results within a given range:

```js
const report = await db.table('orders')
  .selectRaw('count(id) as number_of_orders, customer_id')
  .groupBy('customer_id')
  .havingBetween('number_of_orders', [5, 15])
  .get();
```

你可以向 `groupBy` 方法传递多个参数，来对结果使用多个字段进行分组： 

```js
const users = await db.table('users')
  .groupBy('first_name', 'status')
  .having('account_id', '>', 100)
  .get();
```

对于更高级的 `having` 语法，参见 `havingRaw` 方法。

## Limit & Offset

#### `skip` & `take` 方法

要限制结果的返回数量，或跳过指定数量的结果，你可以使用 `skip` 和 `take` 方法： 

```js
const users = await db.table('users').skip(10).take(5).get();
```

或者你也可以使用 `limit` 和 `offset` 方法，这些方法在功能上分别等效于 `take` 和 `skip` 方法：

```js
const users = await db.table('users')
  .offset(10)
  .limit(5)
  .get();
```

## 插入语句

查询构造器还提供了 `insert` 方法用于插入记录到数据库中。 `insert` 方法接收数组形式的字段名和字段值进行插入操作：

```js
await db.table('users').insert({
  email: 'kayla@example.com',
  votes: 0
});
```

你甚至可以将数组传递给 `insert` 方法，依次将多个记录插入到表中：

```js
await db.table('users').insert([
  { email: 'picard@example.com', votes: 0 },
  { email: 'janeway@example.com', votes: 0 },
]);
```

## 更新语句

当然， 除了插入记录到数据库中，查询构造器也可以通过 `update` 方法更新已有的记录。 `update` 方法和 `insert` 方法一样，接受包含要更新的字段及值的数组。你可以通过 `where` 子句对 `update` 查询进行约束：

```js
await db.table('users')
  .where('id', 1)
  .update({
    votes: 1
  });
```

## 自增与自减

查询构造器还提供了方便的方法来递增或递减给定列的值。这两个方法都至少接受一个参数：要修改的列。可以提供第二个参数来指定列的递增或递减量：

```js
await db.table('users').increment('votes');
 
await db.table('users').increment('votes', 5);
 
await db.table('users').decrement('votes');
 
await db.table('users').decrement('votes', 5);
```

## 删除语句

查询构造器也可以使用 `delete` 方法从表中删除记录。 在使用 `delete` 前，可以添加 `where` 子句来约束 `delete` 语法：

```js
const deleted = await db.table('users').delete();
 
const deleted = await db.table('users').where('votes', '>', 100).delete();
```

## 悲观锁

查询构造器也包含了一些能够帮助您在 `select` 语句中实现「悲观锁」的函数。要执行一个含有「共享锁」的语句，您可以在查询中使用 `forShare` 方法。共享锁可防止指定的数据列被篡改，直到事务被提交为止： 

```js
await db.table('users')
  .where('votes', '>', 100)
  .forShare()
  .get();
```

或者，您亦可使用 `forUpdate` 方法。使用「 update 」锁可以避免数据行被其他共享锁修改或选定：

```js
await db.table('users')
  .where('votes', '>', 100)
  .forUpdate()
  .get();
```