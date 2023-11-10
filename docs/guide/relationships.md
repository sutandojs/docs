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

# Relationships

Sutando relationships are defined as methods on your Sutando model classes. Since relationships also serve as powerful [query builders](query-builder), defining relationships as methods provides powerful method chaining and querying capabilities. For example, we may chain additional query constraints on this `posts` relationship:

```js
await user.related('posts').where('active', 1).get();
```

But, before diving too deep into using relationships, let's learn how to define each type of relationship supported by Sutando.

## One To One

A one-to-one relationship is a very basic type of database relationship. For example, a `User` model might be associated with one `Phone` model. To define this relationship, we will place a phone method on the `User` model. The `relationPhone` method should call the `hasOne` method and return its result. The `hasOne` method is available to your model via the model's `Model` base class:

```js
const { Model } = require('sutando');

class Phone extends Model {}

class User extends Model {
  relationPhone() {
    return this.hasOne(Phone);
  }
}
```

The first argument passed to the `hasOne` method is the name of the related model class. Once the relationship is defined, we may retrieve the related record using `getRelated` method

```js
const user = await User.query().find(1);
const phone = await user.getRelated('phone');
```

Sutando determines the foreign key of the relationship based on the parent model name. In this case, the `Phone` model is automatically assumed to have a `user_id` foreign key. If you wish to override this convention, you may pass a second argument to the `hasOne` method:

```js
return this.hasOne(Phone, 'foreign_key');
```

Additionally, Sutando assumes that the foreign key should have a value matching the primary key column of the parent. In other words, Sutando will look for the value of the user's `id` column in the `user_id` column of the `Phone` record. If you would like the relationship to use a primary key value other than id or your model's `primaryKey` property, you may pass a third argument to the `hasOne` method:

```js
return this.hasOne(Phone, 'foreign_key', 'local_key');
```

### Defining The Inverse Of The Relationship
So, we can access the `Phone` model from our `User` model. Next, let's define a relationship on the `Phone` model that will let us access the user that owns the phone. We can define the inverse of a `hasOne` relationship using the `belongsTo` method:


```js
const { Model } = require('sutando');

class User extends Model {
  relationPhone() {
    return this.hasOne(Phone);
  }
}

class Phone extends Model {
  relationUser() {
    return this.belongsTo(User);
  }
}
```

When invoking the `related('user')`, Sutando will attempt to find a `User` model that has an `id` which matches the `user_id` column on the `Phone` model.

Sutando determines the foreign key name by examining the name of the relationship method and suffixing the method name with `_id`. So, in this case, Sutando assumes that the `Phone` model has a user_id column. However, if the foreign key on the `Phone` model is not `user_id`, you may pass a custom key name as the second argument to the `belongsTo` method:

```js
relationUser() {
  return this.belongsTo(User, 'foreign_key');
}
```

If the parent model does not use id as its primary key, or you wish to find the associated model using a different column, you may pass a third argument to the `belongsTo` method specifying the parent table's custom key:

```js
relationUser() {
  return this.belongsTo(User, 'foreign_key', 'owner_key');
}
```

## One To Many

A one-to-many relationship is used to define relationships where a single model is the parent to one or more child models. For example, a blog post may have an infinite number of comments. Like all other Sutando relationships, one-to-many relationships are defined by defining a method on your Sutando model:

```js
const { Model } = require('sutando');

class Post extends Model {
  relationComments() {
    return this.hasMany(Comment);
  }
}
```

Remember, Sutando will automatically determine the proper foreign key column for the `Comment` model. By convention, Sutando will take the "snake case" name of the parent model and suffix it with `_id`. So, in this example, Sutando will assume the foreign key column on the `Comment` model is `post_id`.

Once the relationship method has been defined, we can access the collection of related comments by accessing the `getRelated('comments')` method:

```js
const { Post } = require('./models');

const post = await Post.query().find(1);
const comments = await post.getRelated('comments');
 
comments.map(comment => {
  //
});
```

Since all relationships also serve as query builders, you may add further constraints to the relationship query by calling the `related('comments')` method and continuing to chain conditions onto the query:

```js
const post = await Post.query().find(1);
const comment = await post.related('comments')
  .where('title', 'foo')
  .first();
```

Like the `hasOne` method, you may also override the foreign and local keys by passing additional arguments to the `hasMany` method:

```js
return this.hasMany(Comment, 'foreign_key');
 
return this.hasMany(Comment, 'foreign_key', 'local_key');
```

## One To Many (Inverse) / Belongs To

Now that we can access all of a post's comments, let's define a relationship to allow a comment to access its parent post. To define the inverse of a `hasMany` relationship, define a relationship method on the child model which calls the `belongsTo` method:

```js
const { Model } = require('sutando');

class Comment extends Model {
  relationPost() {
    return this.belongsTo(Post);
  }
}
```

In the example above, Sutando will attempt to find a Post model that has an id which matches the `post_id` column on the `Comment` model.

Sutando determines the default foreign key name by examining the name of the relationship method and suffixing the method name with a _ followed by the name of the parent model's primary key column. So, in this example, Sutando will assume the `Post` model's foreign key on the `comments` table is `post_id`.

However, if the foreign key for your relationship does not follow these conventions, you may pass a custom foreign key name as the second argument to the belongsTo method:

```js
relationPost() {
  return this.belongsTo(Post, 'foreign_key');
}
```

If your parent model does not use id as its primary key, or you wish to find the associated model using a different column, you may pass a third argument to the `belongsTo` method specifying your parent table's custom key:

```js
relationPost() {
  return this.belongsTo(Post, 'foreign_key', 'owner_key');
}
```

#### Default Models

The `belongsTo`, `hasOne` relationships allow you to define a default model that will be returned if the given relationship is null. This pattern is often referred to as the Null Object pattern and can help remove conditional checks in your code. In the following example, the `user` relation will return an empty `User` model if no user is attached to the `Post` model:

```js
reLationUser() {
  return this.belongsTo(User).withDefault();
}
```

To populate the default model with attributes, you may pass a object or closure to the `withDefault` method:

```js
reLationUser() {
  return this.belongsTo(User).withDefault({
    name: 'Guest Author'
  });
}

reLationUser() {
  return this.belongsTo(User).withDefault((user, post) => ({
    name: `Post ${post.id} Author`
  }));
}
```

## Many To Many Relationships

Many-to-many relations are slightly more complicated than `hasOne` and `hasMany` relationships. An example of a many-to-many relationship is a user that has many roles and those roles are also shared by other users in the application. For example, a user may be assigned the role of "Author" and "Editor"; however, those roles may also be assigned to other users as well. So, a user has many roles and a role has many users.

#### Table Structure

To define this relationship, three database tables are needed: `users`, `roles`, and `role_user`. The `role_user` table is derived from the alphabetical order of the related model names and contains `user_id` and `role_id` columns. This table is used as an intermediate table linking the users and roles.

Remember, since a role can belong to many users, we cannot simply place a `user_id` column on the `roles` table. This would mean that a role could only belong to a single user. In order to provide support for roles being assigned to multiple users, the `role_user` table is needed. We can summarize the relationship's table structure like so:

```
users
  id - integer
  name - string
 
roles
  id - integer
  name - string
 
role_user
  user_id - integer
  role_id - integer
```

#### Model Structure

Many-to-many relationships are defined by writing a method that returns the result of the `belongsToMany` method. The `belongsToMany` method is provided by the Model base class that is used by all of your application's Sutando models. For example, let's define a `relationRoles` method on our `User` model. The first argument passed to this method is the name of the related model class:

```js
const { Model } = require('sutando');

class User extends Model {
  relationRoles() {
    return this.belongsToMany(Role);
  }
}
```

Since all relationships also serve as query builders, you may add further constraints to the relationship query by calling the `related('roles')` method and continuing to chain conditions onto the query:

```js
const user = await User.query().find(1);
const roles = await user.related('roles').orderBy('name').get();
```

To determine the table name of the relationship's intermediate table, Sutando will join the two related model names in alphabetical order. However, you are free to override this convention. You may do so by passing a second argument to the `belongsToMany` method:

```js
return this.belongsToMany(Role, 'role_user');
```

In addition to customizing the name of the intermediate table, you may also customize the column names of the keys on the table by passing additional arguments to the `belongsToMany` method. The third argument is the foreign key name of the model on which you are defining the relationship, while the fourth argument is the foreign key name of the model that you are joining to:

```js
return this.belongsToMany(Role, 'role_user', 'user_id', 'role_id');
```

#### Defining The Inverse Of The Relationship

To define the "inverse" of a many-to-many relationship, you should define a method on the related model which also returns the result of the `belongsToMany` method. To complete our `user` / `role` example, let's define the `relationUsers` method on the `Role` model:

```js
const { Model } = require('sutando');

class Role extends Model {
  relationUsers() {
    return this.belongsToMany(User);
  }
}
```

As you can see, the relationship is defined exactly the same as its `User` model counterpart with the exception of referencing the `User` model. Since we're reusing the `belongsToMany` method, all of the usual table and key customization options are available when defining the "inverse" of many-to-many relationships.

### Retrieving Intermediate Table Columns

As you have already learned, working with many-to-many relations requires the presence of an intermediate table. Sutando provides some very helpful ways of interacting with this table. For example, let's assume our `User` model has many Role models that it is related to. After accessing this relationship, we may access the intermediate table using the `pivot` attribute on the models:

```js
const { User } = require('./models');

const user = await User.query().find(1);
const roles = await user.getRelated('roles');

roles.map(role => {
  console.log(role.pivot.created_at);
});
```

Notice that each `Role` model we retrieve is automatically assigned a pivot attribute. This attribute contains a model representing the intermediate table.

By default, only the model keys will be present on the pivot model. If your intermediate table contains extra attributes, you must specify them when defining the relationship:

```js
return this.belongsToMany(Role).withPivot('active', 'created_by');
```

If you would like your intermediate table to have `created_at` and `updated_at` timestamps that are automatically maintained by Sutando, call the `withTimestamps` method when defining the relationship:

```js
return this.belongsToMany(Role).withTimestamps();
```

#### Customizing The `pivot` Attribute Name

As noted previously, attributes from the intermediate table may be accessed on models via the `pivot` attribute. However, you are free to customize the name of this attribute to better reflect its purpose within your application.

For example, if your application contains users that may subscribe to podcasts, you likely have a many-to-many relationship between users and podcasts. If this is the case, you may wish to rename your intermediate table attribute to `subscription` instead of `pivot`. This can be done using the `as` method when defining the relationship:

```js
return this.belongsToMany(Podcast)
    .as('subscription')
    .withTimestamps();
```

### Filtering Queries Via Intermediate Table Columns

You can also filter the results returned by `belongsToMany` relationship queries using the `wherePivot`, `wherePivotIn`, `wherePivotNotIn`, `wherePivotBetween`, `wherePivotNotBetween`, `wherePivotNull`, and `wherePivotNotNull` methods when defining the relationship:

```js
return this.belongsToMany(Role)
  .wherePivot('approved', 1);
 
return this.belongsToMany(Role)
  .wherePivotIn('priority', [1, 2]);
 
return this.belongsToMany(Role)
  .wherePivotNotIn('priority', [1, 2]);
 
return this.belongsToMany(Podcast)
  .as('subscriptions')
  .wherePivotBetween('created_at', ['2020-01-01 00:00:00', '2020-12-31 00:00:00']);
 
return this.belongsToMany(Podcast)
  .as('subscriptions')
  .wherePivotNotBetween('created_at', ['2020-01-01 00:00:00', '2020-12-31 00:00:00']);
 
return this.belongsToMany(Podcast)
  .as('subscriptions')
  .wherePivotNull('expired_at');
 
return this.belongsToMany(Podcast)
  .as('subscriptions')
  .wherePivotNotNull('expired_at');
```

### Ordering Queries Via Intermediate Table Columns

You can order the results returned by `belongsToMany` relationship queries using the `orderByPivot` method. In the following example, we will retrieve all of the latest badges for the user:

```js
return this.belongsToMany(Badge)
  .where('rank', 'gold')
  .orderByPivot('created_at', 'desc');
```

## Querying Relations

Since all Sutando relationships are defined via methods, you may call those methods to obtain an instance of the relationship without actually executing a query to load the related models. In addition, all types of Sutando relationships also serve as query builders, allowing you to continue to chain constraints onto the relationship query before finally executing the SQL query against your database.

For example, imagine a blog application in which a `User` model has many associated `Post` models:

```js
const { Model } = require('sutando');

class User extends Model {
  relationPosts() {
    return this.hasMany(Post);
  }
}
```

You may query the posts relationship and add additional constraints to the relationship like so:

```js
const { User } = require('./models');
 
const user = await User.query().find(1);
 
await user.related('posts').where('active', 1).get();
```

You are able to use any of the Sutando [query builder](query-builder)'s methods on the relationship, so be sure to explore the query builder documentation to learn about all of the methods that are available to you.

#### Chaining `orWhere` Clauses After Relationships

As demonstrated in the example above, you are free to add additional constraints to relationships when querying them. However, use caution when chaining `orWhere` clauses onto a relationship, as the `orWhere` clauses will be logically grouped at the same level as the relationship constraint:

```js
await user.related('posts')
  .where('active', 1)
  .orWhere('votes', '>=', 100)
  .get();
```

The example above will generate the following SQL. As you can see, the or clause instructs the query to return any user with greater than 100 votes. The query is no longer constrained to a specific user:

```SQL
select *
from posts
where user_id = ? and active = 1 or votes >= 100
```

In most situations, you should use logical groups to group the conditional checks between parentheses:

```js
await user.related('posts')
  .where(query => {
    return query.where('active', 1).orWhere('votes', '>=', 100);
  })
  .get();
```

The example above will produce the following SQL. Note that the logical grouping has properly grouped the constraints and the query remains constrained to a specific user:

```SQL
select *
from posts
where user_id = ? and (active = 1 or votes >= 100)
```

### Querying Relationship Existence

When retrieving model records, you may wish to limit your results based on the existence of a relationship. For example, imagine you want to retrieve all blog posts that have at least one comment. To do so, you may pass the name of the relationship to the `has` and `orHas` methods:

```js
const { Post } = require('./models');
// Retrieve all posts that have at least one comment...
const posts = await Post.query().has('comments').get();
```

You may also specify an operator and count value to further customize the query:

```js
// Retrieve all posts that have three or more comments...
const posts = await Post.query().has('comments', '>=', 3).get();
```

Nested has statements may be constructed using "dot" notation. For example, you may retrieve all posts that have at least one comment that has at least one image:

```js
// Retrieve posts that have at least one comment with images...
const posts = await Post.query().has('comments.images').get();
```

If you need even more power, you may use the `whereHas` and `orWhereHas` methods to define additional query constraints on your has queries, such as inspecting the content of a comment:

```js
// Retrieve posts with at least one comment containing words like code%...
const posts = await Post.query().whereHas('comments', query => {
  query.where('content', 'like', 'code%');
}).get();
 
// Retrieve posts with at least ten comments containing words like code%...
const posts = await Post.query().whereHas('comments', query => {
  query.where('content', 'like', 'code%');
}, '>=', 10).get();
```

## Aggregating Related Models

### Counting Related Models

Sometimes you may want to count the number of related models for a given relationship without actually loading the models. To accomplish this, you may use the `withCount` method. The `withCount` method will place a `{relation}_count` attribute on the resulting models:

```js
const { Post } = require('./models');

const posts = await Post.query().withCount('comments').get();

posts.map(post => {
  console.log(post.comments_count);
});
```

By passing an array to the `withCount` method, you may add the "counts" for multiple relations as well as add additional constraints to the queries:

```js
const posts = await Post.query().withCount({
  comments: query => query.where('content', 'like', 'code%');
}).get();

console.log(posts.get(0).comments_count);
```

### Deferred Count Loading

Using the `loadCount` method, you may load a relationship count after the parent model has already been retrieved:

```js
const book = await Book.query().first();
 
await book.loadCount('genres');
```

If you need to set additional query constraints on the count query, you may pass an array keyed by the relationships you wish to count. The array values should be closures which receive the query builder instance:

```js
await book.loadCount({
  reviews: query => query.where('rating', 5);
})
```

### Relationship Counting & Custom Select Statements

If you're combining `withCount` with a select statement, ensure that you call `withCount` after the `select` method:

```js
const posts = await Post.query().select(['title', 'body'])
  .withCount('comments')
  .get();
```

### Other Aggregate Functions

In addition to the `withCount` method, Sutando provides `withMin`, `withMax`, `withAvg`, `withSum`, and `withExists` methods. These methods will place a `{relation}_{function}_{column}` attribute on your resulting models:

```js
const { Post } = require('./models');

const posts = await Post.query().withSum('comments', 'votes').get();
 
posts.map(post => {
  console.log(post.comments_sum_votes);
});
```

Like the `loadCount` method, deferred versions of these methods are also available. These additional aggregate operations may be performed on Sutando models that have already been retrieved:

```js
const post = await Post.query().first();
 
await post.loadSum('comments', 'votes');
```

If you're combining these aggregate methods with a `select` statement, ensure that you call the aggregate methods after the `select` method:

```js
const posts = await Post.query().select(['title', 'body'])
  .withExists('comments')
  .get();
```

## Eager Loading

When accessing Sutando relationships as properties, the related models are "lazy loaded". This means the relationship data is not actually loaded until you first access the property. However, Sutando can "eager load" relationships at the time you query the parent model. Eager loading alleviates the `N + 1` query problem. To illustrate the `N + 1` query problem, consider a `Book` model that "belongs to" to an `Author` model:

```js
const { Model } = require('sutando');

class Book extends Model {
  relationAuthor() {
    return this.belongsTo(Author);
  }
}
```

Now, let's retrieve all books and their authors:

```js
const { Book } = require('./models');

const books = await Book.query().all();
books.map(async book => {
  const author = await book.getRelated('author');
  console.log(author.name);
});
```

This loop will execute one query to retrieve all of the books within the database table, then another query for each book in order to retrieve the book's author. So, if we have 25 books, the code above would run 26 queries: one for the original book, and 25 additional queries to retrieve the author of each book.

Thankfully, we can use eager loading to reduce this operation to just two queries. When building a query, you may specify which relationships should be eager loaded using the `with` method:

```js
const books = await Book.query().with('author').get();

books.map(book => {
  console.log(book.author.name);
});
```

For this operation, only two queries will be executed - one query to retrieve all of the books and one query to retrieve all of the authors for all of the books:

```SQL
select * from books
 
select * from authors where id in (1, 2, 3, 4, 5, ...)
```

#### Eager Loading Multiple Relationships

Sometimes you may need to eager load several different relationships. To do so, just pass an array of relationships to the `with` method:

```js
const books = await Book.query().with(['author', 'publisher']).get();
```

#### Nested Eager Loading

To eager load a relationship's relationships, you may use "dot" syntax. For example, let's eager load all of the book's authors and all of the author's personal contacts:

```js
const books = await Book.query().with('author.contacts').get();
```

#### Eager Loading Specific Columns

You may not always need every column from the relationships you are retrieving. For this reason, Sutando allows you to specify which columns of the relationship you would like to retrieve:

```js
const books = await Book.query().with('author:id,name,book_id').get();
```

### Constraining Eager Loads

Sometimes you may wish to eager load a relationship but also specify additional query conditions for the eager loading query. You can accomplish this by passing an array of relationships to the `with` method where the object key is a relationship name and the object value is a closure that adds additional constraints to the eager loading query:

```js
const users = await User::with({
  posts: query => query.where('title', 'like', '%code%')
}).get();
// or
const users = await User::with('posts', query => {
  query.where('title', 'like', '%code%');
}).get();
```

In this example, Sutando will only eager load posts where the post's `title` column contains the word code. You may call other query builder methods to further customize the eager loading operation:

```js
const users = await User.query().with({
  posts: query => query.orderBy('created_at', 'desc')
}).get();
```

### Lazy Eager Loading

Sometimes you may need to eager load a relationship after the parent model has already been retrieved. For example, this may be useful if you need to dynamically decide whether to load related models:

```js
const { Book } = require('./models');
const books = await Book.query().all();
 
if (someCondition) {
  await books.load('author', 'publisher');
}
```

If you need to set additional query constraints on the eager loading query, you may pass an object keyed by the relationships you wish to load. The object values should be closure instances which receive the query instance:

```js
await author.load({
  books: query => query.orderBy('published_date', 'asc')
});
```

## Inserting & Updating Related Models

### The `save` Method

Sutando provides convenient methods for adding new models to relationships. For example, perhaps you need to add a new comment to a post. Instead of manually setting the `post_id` attribute on the `Comment` model you may insert the comment using the relationship's `save` method:

```js
const { Post, Comment } = require('./models');

const comment = new Comment({
  message: 'A new comment.'
});

const post = await Post.query().find(1);

await post.related('comments').save(comment);
```

Note that we did not access the `comments` relationship as a dynamic property. Instead, we called the `related('comments')` method to obtain an instance of the relationship. The `save` method will automatically add the appropriate `post_id` value to the new `Comment` model.

If you need to save multiple related models, you may use the `saveMany` method:

```js
await post.related('comments').saveMany([
  new Comment({ message: 'A new comment.' }),
  new Comment({ message: 'Another new comment.' }),
]);
```

The `save` and `saveMany` methods will persist the given model instances, but will not add the newly persisted models to any in-memory relationships that are already loaded onto the parent model. If you plan on accessing the relationship after using the `save` or `saveMany` methods, you may wish to use the `refresh` method to reload the model and its relationships:

```js
await post.related('comments').save(comment);
await post.refresh();
 
// All comments, including the newly saved comment...
post.comments;
```

#### Recursively Saving Models & Relationships

If you would like to save your model and all of its associated relationships, you may use the `push` method. In this example, the `Post` model will be saved as well as its comments and the comment's authors:

```js
post.comments.get(0).message = 'Message';
post.comments.get(0).author.name = 'Author Name';
 
await post.push();
```

### The `create` Method

In addition to the `save` and `saveMany` methods, you may also use the `create` method, which accepts an object of attributes, creates a model, and inserts it into the database. The difference between `save` and `create` is that `save` accepts a full Sutando model instance while create accepts a plain `object`. The newly created model will be returned by the `create` method:

```js
const { Post } = require('./models');

const post = await Post.query().find(1);

const comment = await post.related('comments').create({
  message: 'A new comment.',
});
```

You may use the `createMany` method to create multiple related models:

```js
await post.related('comments').createMany([
  { message: 'A new comment.' },
  { message: 'Another new comment.' },
]);
```

You may also use the `findOrNew`, `firstOrNew`, `firstOrCreate`, and `updateOrCreate` methods to create and update models on relationships.

### Belongs To Relationships

If you would like to assign a child model to a new parent model, you may use the `associate` method. In this example, the `User` model defines a `belongsTo` relationship to the `Account` model. This `associate` method will set the foreign key on the child model:

```js
const { Account } = require('./models');

const account = await Account.query().find(10);
user.related('account').associate(account);

await user.save();
```

To remove a parent model from a child model, you may use the `dissociate` method. This method will set the relationship's foreign key to null:

```js
user.related('account').dissociate();
 
await user->save();
```

### Many To Many Relationships

#### Attaching / Detaching

Sutando also provides methods to make working with many-to-many relationships more convenient. For example, let's imagine a user can have many roles and a role can have many users. You may use the attach method to attach a role to a user by inserting a record in the relationship's intermediate table:

```js
const { User } = require('./models');

const user = await User.query().find(1);

await user.related('roles').attach(roleId);
```

When attaching a relationship to a model, you may also pass an array of additional data to be inserted into the intermediate table:

```js
await user.related('roles').attach(roleId, {
  expires: expires,
});
```

Sometimes it may be necessary to remove a role from a user. To remove a many-to-many relationship record, use the `detach` method. The `detach` method will delete the appropriate record out of the intermediate table; however, both models will remain in the database:

```js
// Detach a single role from the user...
await user.related('roles').detach(roleId);
 
// Detach all roles from the user...
await user.related('roles').detach();
```

For convenience, `attach` and `detach` also accept arrays of IDs as input:

```js
const user = await User.query().find(1);
 
await user.related('roles').detach([1, 2, 3]);
 
await user.related('roles').attach([1, 2]);
```

#### Syncing Associations

You may also use the `sync` method to construct many-to-many associations. The `sync` method accepts an array of IDs to place on the intermediate table. Any IDs that are not in the given array will be removed from the intermediate table. So, after this operation is complete, only the IDs in the given array will exist in the intermediate table:

```js
await user.related('roles').sync([1, 2, 3]);
```

You may also pass additional intermediate table values with the IDs:

```js
await user.related('roles').sync({ 1: { expires: true }, 2: {}, 3: {} });
```

If you would like to insert the same intermediate table values with each of the synced model IDs, you may use the `syncWithPivotValues` method:

```js
await user.related('roles').syncWithPivotValues([1, 2, 3], { active: true });
```

If you do not want to detach existing IDs that are missing from the given array, you may use the `syncWithoutDetaching` method:

```js
await user.related('roles').syncWithoutDetaching([1, 2, 3]);
```

#### Updating A Record On The Intermediate Table

If you need to update an existing row in your relationship's intermediate table, you may use the `updateExistingPivot` method. This method accepts the intermediate record foreign key and an object of attributes to update:

```js
await user.related('roles').updateExistingPivot(roleId, {
  active: false,
});
```
