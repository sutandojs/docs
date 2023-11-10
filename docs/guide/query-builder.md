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

# Query Builder

Sutando query builder provides a convenient, fluent interface to creating and running database queries. It can be used to perform most database operations in your application and works perfectly with all of Sutando's supported database systems.

Sutando query builder allows you to write and execute SQL queries. It is built on top of [Knex.js](https://knexjs.org/) with few opinionated changes.

We have divided the query builders into following categories

- The standard query builder allows you to construct SQL queries for select, update and delete operations.
- The insert query builder allows you to construct SQL queries for the insert operations.
- The raw query builder let you write and execute queries from a raw SQL string.


## Running Database Queries

#### Retrieving All Rows From A Table

You may use the `table` method provided by the DB to begin a query. The `table` method returns a fluent query builder instance for the given table, allowing you to chain more constraints onto the query and then finally retrieve the results of the query using the `get` method:

```js
const db = sutando.connection();

const users = await db.table('users').get();
```

The `get` method returns an array containing the results of the query where each result is an object. You may access each column's value by accessing the column as a property of the object:

```js
const users = await db.table('users').get();
 
users.map(user => {
  console.log(user.name);
})
```

### Retrieving A Single Row / Column From A Table

If you just need to retrieve a single row from a database table, you may use the `first` method:

```js
const user = await db.table('users').where('name', 'John').first();
 
console.log(user.email);
```

To retrieve a single row by its `id` column value, use the `find` method:

```js
const user = await db.table('users').find(3);
```

### Retrieving A List Of Column Values

If you would like to retrieve an array containing the values of a single column, you may use the `pluck` method. In this example, we'll retrieve a collection of user titles:

```js
const titles = await db.table('users').pluck('title');
 
titles.map(title => {
  console.log(title)
});
```

## Chunking Results

If you need to work with thousands of database records, consider using the `chunk` method. This method retrieves a small chunk of results at a time and feeds each chunk into a closure for processing. For example, let's retrieve the entire `users` table in chunks of 100 records at a time:

```js
await db.table('users').orderBy('id').chunk(100, users => {
  users.map(user => {
    // do something...
  })
});
```

You may stop further chunks from being processed by returning `false` from the closure:

```js
await db.table('users').orderBy('id').chunk(100, users => {
  // Process the records...
 
  return false;
});
```

## Aggregates

The query builder also provides a variety of methods for retrieving aggregate values like count, `max`, `min`, `avg`, and `sum`. You may call any of these methods after constructing your query:

```js
const count = await db.table('users').count();
 
const price = await db.table('orders').max('price');
```

Of course, you may combine these methods with other clauses to fine-tune how your aggregate value is calculated:

```js
const price = await db.table('orders')
  .where('finalized', 1)
  .avg('price');
```

### Determining If Records Exist

Instead of using the `count` method to determine if any records exist that match your query's constraints, you may use the `exists` methods:

```js
const isExists = await table('orders').where('finalized', 1).exists()
if (isExists) {
    // ...
}
```

## Select Statements

### Specifying A Select Clause

You may not always want to select all columns from a database table. Using the `select` method, you can specify a custom "select" clause for the query:

```js
const users = await db.table('users')
  .select('name', 'email as user_email')
  .get();
```

The `distinct` method allows you to force the query to return distinct results:

```js
const users = await db.table('users').distinct().get();
```

## Raw Expressions

Sometimes you may need to insert an arbitrary string into a query. To create a raw string expression, you may use the `raw` method:

```js
const users = await db.table('users')
  .select(db.raw('count(*) as user_count, status'))
  .where('status', '<>', 1)
  .groupBy('status')
  .get();
```

### Raw Methods

Instead of using the `raw` method, you may also use the following methods to insert a raw expression into various parts of your query. Sutando can not guarantee that any query using raw expressions is protected against SQL injection vulnerabilities.

#### whereRaw

The `whereRaw` methods can be used to inject a raw "where" clause into your query. These methods accept an optional array of bindings as their second argument:

```js
const orders = await db.table('orders')
  .whereRaw('price > IF(state = "TX", ?, 100)', [200])
  .get();
```

#### havingRaw

The `havingRaw` and `orHavingRaw` methods may be used to provide a raw string as the value of the "having" clause. These methods accept an optional array of bindings as their second argument:

```js
const orders = await db.table('orders')
  .select('department', db.raw('SUM(price) as total_sales'))
  .groupBy('department')
  .havingRaw('SUM(price) > ?', [2500])
  .get();
```

#### orderByRaw

The `orderByRaw` method may be used to provide a raw string as the value of the "order by" clause:

```js
const orders = await db.table('orders')
  .orderByRaw('updated_at - created_at DESC')
  .get();
```

#### groupByRaw

The `groupByRaw` method may be used to provide a raw string as the value of the "group by" clause:

```js
const orders = await db.table('orders')
  .select('city', 'state')
  .groupByRaw('city, state')
  .get();
```

## Joins

### Inner Join Clause

The query builder may also be used to add join clauses to your queries. To perform a basic "inner join", you may use the `join` method on a query builder instance. The first argument passed to the `join` method is the name of the table you need to join to, while the remaining arguments specify the column constraints for the join. You may even join multiple tables in a single query:

```js
const users = await db.table('users')
  .join('contacts', 'users.id', '=', 'contacts.user_id')
  .join('orders', 'users.id', '=', 'orders.user_id')
  .select('users.*', 'contacts.phone', 'orders.price')
  .get();
```

### Left Join / Right Join Clause

If you would like to perform a "left join" or "right join" instead of an "inner join", use the `leftJoin` or `rightJoin` methods. These methods have the same signature as the join method:

```js
const users = await db.table('users')
  .leftJoin('posts', 'users.id', '=', 'posts.user_id')
  .get();
 
const users = await db.table('users')
  .rightJoin('posts', 'users.id', '=', 'posts.user_id')
  .get();
```

### Cross Join Clause

You may use the `crossJoin` method to perform a "cross join". Cross joins generate a cartesian product between the first table and the joined table:

```js
const sizes = await db.table('sizes')
  .crossJoin('colors')
  .get();
```

### Advanced Join Clauses

You may also specify more advanced join clauses. To get started, pass a closure as the second argument to the `join` method. 

```js
await db.table('users')
  .join('contacts', () => {
    this.on('users.id', '=', 'contacts.user_id').orOn(/* ... */);
  })
  .get();
```

## Unions

The query builder also provides a convenient method to "union" two or more queries together. For example, you may create an initial query and use the `union` method to union it with more queries:

```js
const first = db.table('users')
  .whereNull('first_name');
 
const users = await db.table('users')
  .whereNull('last_name')
  .union(first)
  .get();
```

In addition to the `union` method, the query builder provides a `unionAll` method. Queries that are combined using the `unionAll` method will not have their duplicate results removed. The `unionAll` method has the same method signature as the `union` method.

## Basic Where Clauses

### Where Clauses

You may use the query builder's `where` method to add "where" clauses to the query. The most basic call to the `where` method requires three arguments. The first argument is the name of the column. The second argument is an operator, which can be any of the database's supported operators. The third argument is the value to compare against the column's value.

For example, the following query retrieves users where the value of the `votes` column is equal to `100` and the value of the `age` column is greater than `35`:

```js
const users = await db.table('users')
  .where('votes', '=', 100)
  .where('age', '>', 35)
  .get();
```

For convenience, if you want to verify that a column is = to a given value, you may pass the value as the second argument to the `where` method. Sutando will assume you would like to use the `=` operator:

```js
const users = await db.table('users').where('votes', 100).get();
```

As previously mentioned, you may use any operator that is supported by your database system:

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

### Or Where Clauses

When chaining together calls to the query builder's `where` method, the "where" clauses will be joined together using the `and` operator. However, you may use the `orWhere` method to join a clause to the query using the `or` operator. The `orWhere` method accepts the same arguments as the `where` method:

```js
const users = await db.table('users')
  .where('votes', '>', 100)
  .orWhere('name', 'John')
  .get();
```

If you need to group an "or" condition within parentheses, you may pass a closure as the first argument to the `orWhere` method:

```js
const users = await db.table('users')
  .where('votes', '>', 100)
  .orWhere(query => {
    query.where('name', 'Abigail')
      .where('votes', '>', 50);
  })
  .get();
```

The example above will produce the following SQL:

```SQL
select * from users where votes > 100 or (name = 'Abigail' and votes > 50)
```

### Where Not Clauses

The `whereNot` and `orWhereNot` methods may be used to negate a given group of query constraints. For example, the following query excludes products that are on clearance or which have a price that is less than ten:

```js
const products = await db.table('products')
  .whereNot(() => {
    this.where('clearance', true).orWhere('price', '<', 10);
  })
  .get();
```

### Additional Where Clauses
 
 
#### whereBetween / orWhereBetween

The `whereBetween` method verifies that a column's value is between two values:

```js
const users = await db.table('users')
  .whereBetween('votes', [1, 100])
  .get();
```

#### whereNotBetween / orWhereNotBetween

The `whereNotBetween` method verifies that a column's value lies outside of two values:

```js
const users = await db.table('users')
  .whereNotBetween('votes', [1, 100])
  .get();
```

#### whereIn / whereNotIn / orWhereIn / orWhereNotIn

The `whereIn` method verifies that a given column's value is contained within the given array:

```js
const users = await db.table('users')
  .whereIn('id', [1, 2, 3])
  .get();
```

The `whereNotIn` method verifies that the given column's value is not contained in the given array:

```js
const users = await db.table('users')
  .whereNotIn('id', [1, 2, 3])
  .get();
```

#### whereNull / whereNotNull / orWhereNull / orWhereNotNull

The `whereNull` method verifies that the value of the given column is NULL:

```js
const users = await db.table('users')
  .whereNull('updated_at')
  .get();
```

The `whereNotNull` method verifies that the column's value is not NULL:

```js
const users = await db.table('users')
  .whereNotNull('updated_at')
  .get();
```

### WhereX

There's an elegant way to turn this:

```js
const users = await User.query().where('approved', 1).get();
const posts = await Post.query().where('views_count', '>', 100).get();
```

Into this:

```js
const users = await User.query().whereApproved(1).get();
const posts = await Post.query().whereViewsCount('>', 100).get();
```


### Logical Grouping

Sometimes you may need to group several "where" clauses within parentheses in order to achieve your query's desired logical grouping. In fact, you should generally always group calls to the `orWhere` method in parentheses in order to avoid unexpected query behavior. To accomplish this, you may pass a closure to the `where` method:

```js
const users = await db.table('users')
  .where('name', '=', 'John')
  .where(() => {
    this.where('votes', '>', 100).orWhere('title', '=', 'Admin');
  })
  .get();
```

As you can see, passing a closure into the `where` method instructs the query builder to begin a constraint group. The closure will receive a query builder instance which you can use to set the constraints that should be contained within the parenthesis group. The example above will produce the following SQL:

```SQL
select * from users where name = 'John' and (votes > 100 or title = 'Admin')
```

## Ordering, Grouping

### Ordering

#### The `orderBy` Method

The `orderBy` method allows you to sort the results of the query by a given column. The first argument accepted by the `orderBy` method should be the column you wish to sort by, while the second argument determines the direction of the sort and may be either `asc` or `desc`:

```js
const users = await db.table('users')
  .orderBy('name', 'desc')
  .get();
```

To sort by multiple columns, you may simply invoke `orderBy` as many times as necessary:

```js
const users = await db.table('users')
  .orderBy('name', 'desc')
  .orderBy('email', 'asc')
  .get();
```

#### The `latest` & `oldest` Methods
The `latest` and `oldest` methods allow you to easily order results by date. By default, the result will be ordered by the table's `created_at` column. Or, you may pass the column name that you wish to sort by:

```js
const user = await db.table('users')
  .latest()
  .first();
```

#### Random Ordering
The `inRandomOrder` method may be used to sort the query results randomly. For example, you may use this method to fetch a random user:

```js
const randomUser = await db.table('users')
  .inRandomOrder()
  .first();
```

#### Removing Existing Orderings
The `clearOrder` method removes all of the "order by" clauses that have previously been applied to the query:

```js
const query = db.table('users').orderBy('name');
 
const unorderedUsers = await query.clearOrder().get();
```

### Grouping

#### The `groupBy` & `having` Methods

As you might expect, the `groupBy` and `having` methods may be used to group the query results. The `having` method's signature is similar to that of the `where` method:

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

You may pass multiple arguments to the `groupBy` method to group by multiple columns:

```js
const users = await db.table('users')
  .groupBy('first_name', 'status')
  .having('account_id', '>', 100)
  .get();
```

To build more advanced having statements, see the `havingRaw` method.

## Limit & Offset

#### The `skip` & `take` Methods

You may use the `skip` and `take` methods to limit the number of results returned from the query or to skip a given number of results in the query:

```js
const users = await db.table('users').skip(10).take(5).get();
```

Alternatively, you may use the `limit` and `offset` methods. These methods are functionally equivalent to the `take` and `skip` methods, respectively:

```js
const users = await db.table('users')
  .offset(10)
  .limit(5)
  .get();
```

## Insert Statements

The query builder also provides an `insert` method that may be used to insert records into the database table. The `insert` method accepts an array of column names and values:

```js
await db.table('users').insert({
  email: 'kayla@example.com',
  votes: 0
});
```

You may insert several records at once by passing an array of arrays. Each array represents a record that should be inserted into the table:

```js
await db.table('users').insert([
  { email: 'picard@example.com', votes: 0 },
  { email: 'janeway@example.com', votes: 0 },
]);
```

## Update Statements

In addition to inserting records into the database, the query builder can also update existing records using the `update` method. The `update` method, like the `insert` method, accepts an array of column and value pairs indicating the columns to be updated. The `update` method returns the number of affected rows. You may constrain the update query using where clauses:

```js
await db.table('users')
  .where('id', 1)
  .update({
    votes: 1
  });
```

## Increment & Decrement

The query builder also provides convenient methods for incrementing or decrementing the value of a given column. Both of these methods accept at least one argument: the column to modify. A second argument may be provided to specify the amount by which the column should be incremented or decremented:

```js
await db.table('users').increment('votes');
 
await db.table('users').increment('votes', 5);
 
await db.table('users').decrement('votes');
 
await db.table('users').decrement('votes', 5);
```

## Delete Statements

The query builder's `delete` method may be used to delete records from the table. The `delete` method returns the number of affected rows. You may constrain delete statements by adding "where" clauses before calling the `delete` method:

```js
const deleted = await db.table('users').delete();
 
const deleted = await db.table('users').where('votes', '>', 100).delete();
```

## Pessimistic Locking
The query builder also includes a few functions to help you achieve "pessimistic locking" when executing your `select` statements. To execute a statement with a "shared lock", you may call the `forShare` method. A shared lock prevents the selected rows from being modified until your transaction is committed:

```js
await db.table('users')
  .where('votes', '>', 100)
  .forShare()
  .get();
```

Alternatively, you may use the `forUpdate` method. A "for update" lock prevents the selected records from being modified or from being selected with another shared lock:

```js
await db.table('users')
  .where('votes', '>', 100)
  .forUpdate()
  .get();
```