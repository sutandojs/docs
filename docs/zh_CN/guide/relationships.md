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

# 模型关联

Sutando 关联在 Sutando 模型类中以方法的形式呈现。如同 Sutando 模型本身，关联也可以作为强大的 [查询构造器](./query-builder) 使用，提供了强大的链式调用和查询功能。例如，我们可以在 `posts` 关联的链式调用中附加一个约束条件： 

```js
await user.related('posts').where('active', 1).get();
```

不过在深入使用关联之前，让我们先学习如何定义每种关联类型。

## 一对一

一对一是最基本的数据库关系。例如，一个 `User` 模型可能与一个 `Phone` 模型相关联。为了定义这个关联关系，我们要在 `User` 模型中写一个 `relationPhone` 方法，在这个方法中调用 `hasOne` 方法并返回其结果。`hasOne` 方法被定义在 `Model` 这个模型基类中： 

```js
const { Model } = require('sutando');

class Phone extends Model {}

class User extends Model {
  relationPhone() {
    return this.hasOne(Phone);
  }
}
```

传递给 `hasOne` 方法的第一个参数是相关模型类的名称。 一旦定义了关系，我们就可以使用 `getRelated` 方法检索相关记录: 

```js
const user = await User.query().find(1);
const phone = await user.getRelated('phone');
```

Sutando 基于父模型（User）的名称来确定关联模型（Phone）的外键名称。在本例中，会自动假定 `Phone` 模型有一个 `user_id` 的外键。如果你想重写这个约定，可以传递第二个参数给 `hasOne` 方法： 

```js
return this.hasOne(Phone, 'foreign_key');
```

另外，Sutando 假设外键的值是与父模型的主键（Primary Key）相同的。换句话说，Sutando 将会通过 `Phone` 记录的 `user_id` 列中查找与用户表的 `id` 列相匹配的值。如果你希望使用自定义的主键值，而不是使用 `id` 或者模型中的 `primaryKey` 属性，你可以给 `hasOne` 方法传递第三个参数： 

```js
return this.hasOne(Phone, 'foreign_key', 'local_key');
```

### 定义反向关联

我们已经能从 `User` 模型访问到 `Phone` 模型了。接下来，让我们再在 `Phone` 模型上定义一个关联，它能让我们访问到拥有该电话的用户。我们可以使用 `belongsTo` 方法来定义反向关联， `belongsTo` 方法与 `hasOne` 方法相对应： 


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

在调用 `related('user')` 方法时，Sutando 会尝试查找一个 `User` 模型，该 `User` 模型上的 `id` 字段会与 `Phone` 模型上的 `user_id` 字段相匹配。 

Sutando 通过关联方法（user）的名称并使用 _id 作为后缀名来确定外键名称。因此，在本例中，Sutando 会假设 `Phone` 模型有一个 `user_id` 字段。但是，如果 `Phone` 模型的外键不是 `user_id`，这时你可以给 `belongsTo` 方法的第二个参数传递一个自定义键名： 

```js
relationUser() {
  return this.belongsTo(User, 'foreign_key');
}
```

如果父模型不使用 `id` 字段来作为主键，或者您想要使用其他的字段来匹配相关联的模型，那么您可以向 `belongsTo` 方法传递第三个参数，这个参数是在父模型中自己定义的字段：

```js
relationUser() {
  return this.belongsTo(User, 'foreign_key', 'owner_key');
}
```

## 一对多

当要定义一个模型是其他（一个或者多个）模型的父模型这种关系时，可以使用一对多关联。例如，一篇博客可以有很多条评论。和其他模型关联一样，一对多关联也是在 Sutando 模型文件中用一个方法来定义的： 

```js
const { Model } = require('sutando');

class Post extends Model {
  relationComments() {
    return this.hasMany(Comment);
  }
}
```

注意，Sutando 将会自动为 `Comment` 模型选择一个合适的外键。通常，这个外键是通过使用父模型的「蛇形命名」方式，然后再加上 `_id` 的方式来命名的。因此，在上面这个例子中，Sutando 将会默认 `Comment` 模型的外键是 `post_id` 字段。

如果关联方法被定义，那么我们就可以通过 `getRelated('comments')` 方法来访问相关的评论 集合： 

```js
const { Post } = require('./models');

const post = await Post.query().find(1);
const comments = await post.getRelated('comments');
 
comments.map(comment => {
  //
});
```

由于所有的关系都可以看成是查询构造器，所以您也可以通过链式调用的方式，在 `related('comments')` 方法中继续添加条件约束：

```js
const post = await Post.query().find(1);
const comment = await post.related('comments')
  .where('title', 'foo')
  .first();
```

像 `hasOne` 方法一样，`hasMany` 方法中也可以接受额外的参数，从而来覆盖外键和本地键： 

```js
return this.hasMany(Comment, 'foreign_key');
 
return this.hasMany(Comment, 'foreign_key', 'local_key');
```

## 一对多 (反向) / Belongs To

目前我们可以访问一篇博客的所有评论，下面我们可以定义一个关联关系，从而让我们可以通过一条评论来获取到它所属的博客。这个关联关系是 `hasMany` 的反向，可以子模型中通过 `belongsTo` 方法来定义这种关联关系： 

```js
const { Model } = require('sutando');

class Comment extends Model {
  relationPost() {
    return this.belongsTo(Post);
  }
}
```

在上面这个例子中，Sutando 将会尝试寻找 `Post` 模型中的 `id` 字段与 `Comment` 模型中的 `post_id` 字段相匹配。

Sutando 通过检查关联方法的名称，从而在关联方法名称后面加上 `_` ，然后再加上父模型（Post）的主键名称，以此来作为默认的外键名。因此，在上面这个例子中，Sutando 将会默认 `Post` 模型在 `comments` 表中的外键是 `post_id。`

但是，如果您的外键不遵循这种约定的话，那么您可以传递一个自定义的外键名来作为 `belongsTo` 方法的第二个参数： 

```js
relationPost() {
  return this.belongsTo(Post, 'foreign_key');
}
```

如果您的父表（Post 表）不使用 `id` 来作为它的主键的话，或者您希望通过其他列来关联相关模型的话，那么您可以传递一个参数来作为 `belongsTo` 方法的第三个参数，这个参数是父表（Post 表）中想要作为关联关系的字段的名称。 

```js
relationPost() {
  return this.belongsTo(Post, 'foreign_key', 'owner_key');
}
```

#### 默认模型

当 `belongsTo`，`hasOne` 这些关联方法返回 null 的时候，你可以定义一个默认的模型返回。该模式通常被称为 空对象模式，它可以帮你省略代码中的一些条件判断。在下面这个例子中，如果 `Post` 模型中没有用户，那么 `user` 关联关系将会返回一个空的 `User` 实例：

```js
reLationUser() {
  return this.belongsTo(User).withDefault();
}
```

可以向 `withDefault` 方法传递对象或者闭包来填充默认模型的属性。

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

## 多对多关联

多对多关联比 `hasOne` 和 `hasMany` 关联稍微复杂些。举个例子，一个用户可以拥有多个角色，同时这些角色也可以分配给其他用户。例如，一个用户可是「作者」和「编辑」；当然，这些角色也可以分配给其他用户。所以，一个用户可以拥有多个角色，一个角色可以分配给多个用户。 

#### 表结构

要定义这种关联，需要三个数据库表: `users`,`roles` 和 `role_user`。`role_user` 表的命名是由关联的两个模型按照字母顺序来的，并且包含了 `user_id` 和 `role_id` 字段。该表用作链接 users 和 roles 的中间表

特别提醒，由于角色可以属于多个用户，因此我们不能简单地在 `roles` 表上放置 `user_id` 列。如果这样，这意味着角色只能属于一个用户。为了支持将角色分配给多个用户，需要使用 `role_user` 表。我们可以这样定义表结构： 

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

#### 模型结构

多对多关系是通过编写一个返回 `belongsToMany` 方法结果的方法来定义的。 `belongsToMany` 方法由 Model 基类提供，您的应用程序的所有 Sutando 模型都使用该基类。 例如，让我们在 `User` 模型上定义一个 `relationRoles` 方法。 传递给此方法的第一个参数是相关模型类的名称：

```js
const { Model } = require('sutando');

class User extends Model {
  relationRoles() {
    return this.belongsToMany(Role);
  }
}
```

由于所有的关系也可以作为查询构建器，你可以通过调用 `related('roles')` 方法并继续将条件链接到查询上来为关系查询添加更多约束： 

```js
const user = await User.query().find(1);
const roles = await user.related('roles').orderBy('name').get();
```

正如前面所提到的，为了确定关联连接表的表名，Sutando 会按照字母顺序连接两个关联模型的名字。当然，你也可以不使用这种约定，传递第二个参数到 `belongsToMany` 方法即可: 

```js
return this.belongsToMany(Role, 'role_user');
```

除了自定义连接表的表名，你还可以通过传递额外的参数到 `belongsToMany` 方法来定义该表中字段的键名。第三个参数是定义此关联的模型在连接表里的外键名，第四个参数是另一个模型在连接表里的外键名:

```js
return this.belongsToMany(Role, 'role_user', 'user_id', 'role_id');
```

#### 定义反向关联

要定义多对多关系的反向关联，您应该在相关模型上定义一个方法，该方法也返回 `belongsToMany` 方法的结果。 为了完成我们的 `user` / `role` 示例，让我们在 `Role` 模型上定义 `relationUsers` 方法：

```js
const { Model } = require('sutando');

class Role extends Model {
  relationUsers() {
    return this.belongsToMany(User);
  }
}
```

如你所见，除了引入模型 `User` 外，其它与在 `User` 模型中定义的完全一样。由于我们重用了 `belongsToMany` 方法，自定义连接表表名和自定义连接表里的键的字段名称在这里同样适用。 

### 获取中间表字段

正如你刚才所了解的一样，多对多的关联关系需要一个中间表来提供支持， Sutando 提供了一些有用的方法来和这张表进行交互。例如，假设我们的 `User` 对象关联了多个 `Role` 对象。在获得这些关联对象后，可以使用模型的 `pivot` 属性访问中间表的属性： 

```js
const { User } = require('./models');

const user = await User.query().find(1);
const roles = await user.getRelated('roles');

roles.map(role => {
  console.log(role.pivot.created_at);
});
```

需要注意的是，我们获取的每个 `Role` 模型对象，都会被自动赋予 `pivot` 属性，它代表中间表的一个模型对象，并且可以像其他的 Sutando 模型一样使用。 

默认情况下，`pivot` 对象只包含两个关联模型的主键，如果你的中间表里还有其他额外字段，你必须在定义关联时明确指出： 

```js
return this.belongsToMany(Role).withPivot('active', 'created_by');
```

如果你想让中间表自动维护 `created_at` 和 `updated_at` 时间戳，那么在定义关联时附加上 `withTimestamps` 方法即可：

```js
return this.belongsToMany(Role).withTimestamps();
```

#### 自定义 `pivot` 属性名称

如前所述，可以通过 `pivot` 属性在模型上访问中间表中的属性。 但是，你可以随意自定义此属性的名称，以更好地反映其在应用程序中的用途。

例如，如果你的应用程序包含可能订阅播客的用户，则用户和播客之间可能存在多对多关系。 如果是这种情况，你可能希望将中间表属性重命名为 `subscription` 而不是 `pivot`。 这可以在定义关系时使用 `as` 方法来完成： 

```js
return this.belongsToMany(Podcast)
    .as('subscription')
    .withTimestamps();
```

### 通过中间表过滤查询

您还可以在定义关系时使用 `wherePivot`、`wherePivotIn`、`wherePivotNotIn`、`wherePivotBetween`、`wherePivotNotBetween`、`wherePivotNull` 和 `wherePivotNotNull` 方法过滤由 `belongsToMany` 关系查询返回的结果：


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

### 通过中间表列对查询排序

您可以使用 `orderByPivot` 方法对 `belongsToMany` 关系查询返回的结果进行排序。 在以下示例中，我们将检索用户的所有最新徽章：

```js
return this.belongsToMany(Badge)
  .where('rank', 'gold')
  .orderByPivot('created_at', 'desc');
```

## 查询关联

因为所有的 Sutando 关联都是通过方法定义的，你可以调用这些方法来获取关联的实例，而无需真实执行查询来获取相关的模型。此外，所有的 Sutando 关联也可以用作查询生成器，允许你在最终对数据库执行 SQL 查询之前，继续通过链式调用添加约束条件。

例如，假设有一个博客系统，它的 `User` 模型有许多关联的 `Post` 模型： 

```js
const { Model } = require('sutando');

class User extends Model {
  relationPosts() {
    return this.hasMany(Post);
  }
}
```

你可以查询 `posts` 关联，并给它添加额外的约束条件，如下例所示：

```js
const { User } = require('./models');
 
const user = await User.query().find(1);
 
await user.related('posts').where('active', 1).get();
```

你可以在关联上使用任意的 [查询构造器](./query-builder) 方法，所以一定要阅读查询构造器的文档，了解它的所有方法，这会对你非常有用。

#### 在关联之后链式添加 `orWhere` 子句

如上例所示，你可以在查询关联时，自由的给关联添加额外的约束条件。但是，在将 `orWhere` 子句链接到关联上时，一定要小心，因为 `orWhere` 子句将在逻辑上与关联约束处于同一级别： 

```js
await user.related('posts')
  .where('active', 1)
  .orWhere('votes', '>=', 100)
  .get();
```

上面的例子将生成以下 SQL。像你看到的那样， 这个 `or` 子句的查询指令，将返回大于 100 票的任一用户，查询不再限于特定的用户：

```SQL
select *
from posts
where user_id = ? and active = 1 or votes >= 100
```

在大多数情况下，你应该使用逻辑组在括号中对条件检查进行分组：

```js
await user.related('posts')
  .where(query => {
    return query.where('active', 1).orWhere('votes', '>=', 100);
  })
  .get();
```

上面的示例将生成以下 SQL。 请注意，逻辑分组已对约束进行了正确分组，并且查询仍然限定于特定用户: 

```SQL
select *
from posts
where user_id = ? and (active = 1 or votes >= 100)
```

### 查询已存在的关联

检索模型记录时，您可能希望根据关系的存在限制结果。 例如，假设您要检索至少有一条评论的所有博客文章。 为此，您可以将关系的名称传递给 `has` 和 `orHas` 方法：

```js
const { Post } = require('./models');
// 查出至少有一条评论的文章...
const posts = await Post.query().has('comments').get();
```

也可以指定运算符和数量来进一步自定义查询： 

```js
// 查出至少有三条评论的文章...
const posts = await Post.query().has('comments', '>=', 3).get();
```

也可以用「点」语法构造嵌套的 `has` 语句。例如，查出至少有一条评论和图片的文章：

```js
// 查出至少有一条带图片的评论的文章...
const posts = await Post.query().has('comments.images').get();
```

如果需要更多功能，可以使用 `whereHas` 和 `orWhereHas` 方法将「where」条件放到 `has` 查询上。这些方法允许你向关联加入自定义约束，比如检查评论内容：

```js
// 获取至少带有一条评论内容包含 code% 关键词的文章...
const posts = await Post.query().whereHas('comments', query => {
  query.where('content', 'like', 'code%');
}).get();
 
// 获取至少带有十条评论内容包含 code% 关键词的文章...
const posts = await Post.query().whereHas('comments', query => {
  query.where('content', 'like', 'code%');
}, '>=', 10).get();
```

## 聚合关联模型

### 关联模型计数

有时您可能需要计算给定关系的相关模型的数量，而不实际加载模型。 为此，您可以使用 `withCount` 方法。 `withCount` 方法将在生成的模型上放置 `{relation}_count` 属性： 

```js
const { Post } = require('./models');

const posts = await Post.query().withCount('comments').get();

posts.map(post => {
  console.log(post.comments_count);
});
```

通过将数组传递到 `withCount` 方法，可以为多个关系添加「计数」，并向查询添加附加约束：

```js
const posts = await Post.query().withCount({
  comments: query => query.where('content', 'like', 'code%');
}).get();

console.log(posts.get(0).comments_count);
```

### 延迟加载计数

使用 `loadCount` 可以在模型获取后加载关联关系的数量。

```js
const book = await Book.query().first();
 
await book.loadCount('genres');
```

如果你需要在统计时设置额外查询条件，可以通过传递键为关联关系名、值为查询闭包的数组来实现： 

```js
await book.loadCount({
  reviews: query => query.where('rating', 5);
})
```

### 关联关系计数与自定义获取字段

如果你的查询同时包含 `withCount` 和 `select`，请确保 `withCount` 一定在 `select` 之后调用： 

```js
const posts = await Post.query().select(['title', 'body'])
  .withCount('comments')
  .get();
```

### 其他聚合函数

除了 `withCount` 方法外，Sutando 还提供了 `withMin`, `withMax`, `withAvg`, `withSum` 和 `withExists` 等聚合方法。
这些方法会通过 `{relation}_{function}_{column}` 的命名方式将聚合结果添加到获取到的模型属性中：

```js
const { Post } = require('./models');

const posts = await Post.query().withSum('comments', 'votes').get();
 
posts.map(post => {
  console.log(post.comments_sum_votes);
});
```

与 `loadCount` 方法类似，这些方法也有延迟调用的方法。这些延迟方法可在已获取到的 Sutando 模型上调用： 

```js
const post = await Post.query().first();
 
await post.loadSum('comments', 'votes');
```

如果您将这些聚合方法与 `select` 语句结合使用，请确保在 `select` 方法之后调用聚合方法：

```js
const posts = await Post.query().select(['title', 'body'])
  .withExists('comments')
  .get();
```

## 预加载

当将 Sutando 关系作为属性访问时，相关模型是延迟加载的。 这意味着在您第一次访问该属性之前不会实际加载关联数据。 但是，Sutando 可以在您查询父模型时主动加载关联关系。 预加载减轻了 `N + 1` 查询问题。 为了说明 `N + 1` 查询问题，请参考属于 `Author` 模型的 `Book` 模型： 

```js
const { Model } = require('sutando');

class Book extends Model {
  relationAuthor() {
    return this.belongsTo(Author);
  }
}
```

我们检索所有书籍及其作者：

```js
const { Book } = require('./models');

const books = await Book.query().all();
books.map(async book => {
  const author = await book.getRelated('author');
  console.log(author.name);
});
```

该循环将执行一个查询以检索数据库表中的所有书籍，然后对每本书执行另一个查询以检索该书的作者。 因此，如果我们有 25 本书，上面的代码将运行 26 个查询：一个查询原本的书籍信息，另外 25 个查询来检索每本书的作者。

值得庆幸的是，我们可以使用预加载将这个操作减少到两个查询。 在构建查询时，您可以使用 1 方法指定应该预加载哪些关系：

```js
const books = await Book.query().with('author').get();

books.map(book => {
  console.log(book.author.name);
});
```

对于此操作，将只执行两个查询 - 一个查询检索所有书籍，一个查询检索所有书籍的所有作者： 

```SQL
select * from books
 
select * from authors where id in (1, 2, 3, 4, 5, ...)
```

#### 预加载多个关联

有时，你可能需要在单一操作中预加载几个不同的关联。要达成此目的，只要向 `with` 方法传递多个关联名称构成的数组参数： 

```js
const books = await Book.query().with(['author', 'publisher']).get();
```

#### 嵌套预加载

可以使用 「点」 语法预加载嵌套关联。比如在一个 Sutando 语句中预加载所有书籍作者及其联系方式：

```js
const books = await Book.query().with('author.contacts').get();
```

#### 预加载指定列

并不是总需要获取关系的每一列。在这种情况下，Sutando 允许你为关联指定想要获取的列: 

```js
const books = await Book.query().with('author:id,name,book_id').get();
```

### 约束预加载

有时您可能希望预先加载关系，但也希望为预先加载查询指定额外的查询条件。 您可以通过将关系数组传递给 `with` 方法来完成此操作，其中对象键是关系名称，对象值是向急切加载查询添加额外约束的闭包：

```js
const users = await User.query().with({
  posts: query => query.where('title', 'like', '%code%')
}).get();
// or
const users = await User.query().with('posts', query => {
  query.where('title', 'like', '%code%');
}).get();
```

在此示例中，Sutando 只会预加载帖子的“标题”列包含单词代码的帖子。 您可以调用其他查询构建器方法来进一步自定义预加载操作：

```js
const users = await User.query().with({
  posts: query => query.orderBy('created_at', 'desc')
}).get();
```

### 延迟预加载

有可能你还希望在模型加载完成后在进行渴求式加载。举例来说，如果你想要根据某个条件动态决定是否加载关联数据，那么 load 方法对你来说会非常有用：

```js
const { Book } = require('./models');
const books = await Book.query().all();
 
if (someCondition) {
  await books.load('author', 'publisher');
}
```

如果你想要在渴求式加载的查询语句中进行条件约束，你可以通过数组的形式去加载，键为对应的关联关系，值为闭包函数，该闭包的参数为一个查询实例：

```js
await author.load({
  books: query => query.orderBy('published_date', 'asc')
});
```

## 插入 & 更新关联模型

### `save` 方法

Sutando 提供了向关系中添加新模型的便捷方法。例如，你可能需要向一篇文章（Post 模型）添加一条新的评论（Comment 模型），你不用手动设置 `Comment` 模型上的 `post_id` 属性，你可以直接使用关联模型中的 `save` 方法： 

```js
const { Post, Comment } = require('./models');

const comment = new Comment({
  message: 'A new comment.'
});

const post = await Post.query().find(1);

await post.related('comments').save(comment);
```

注意，我们没有将 `comments` 关联作为动态属性访问，相反，我们调用了 `related('comments')` 方法来来获得关联实例， `save` 方法会自动添加适当的 `post_id` 值到新的 `Comment` 模型中。

如果需要保存多个关联模型，你可以使用 `saveMany` 方法：

```js
await post.related('comments').saveMany([
  new Comment({ message: 'A new comment.' }),
  new Comment({ message: 'Another new comment.' }),
]);
```

`save` 和 `saveMany` 方法不会将新模型（Comment）加载到父模型（Post) 上， 如果你计划在使用 `save` 或 `saveMany` 方法后访问该关联模型（Comment），你需要使用 `refresh` 方法重新加载模型及其关联，这样你就可以访问到所有评论，包括新保存的评论了： 

```js
await post.related('comments').save(comment);
await post.refresh();
 
// 所有评论，包括新保存的评论...
post.comments;
```

#### 递归保存模型和关联数据

如果你想 save 你的模型及其所有关联数据，你可以使用 `push` 方法，在此示例中，将保存 `Post` 模型及其评论和评论作者：

```js
post.comments.get(0).message = 'Message';
post.comments.get(0).author.name = 'Author Name';
 
await post.push();
```

### `create` 方法

除了 `save` 和 `saveMany` 方法外，你还可以使用 `create` 方法。它接受一个属性对象，同时会创建模型并插入到数据库中。 还有， `save` 方法和 `create` 方法的不同之处在于， `save` 方法接受一个完整的 Sutando 模型实例，而 `create` 则接受普通的对象： 

```js
const { Post } = require('./models');

const post = await Post.query().find(1);

const comment = await post.related('comments').create({
  message: 'A new comment.',
});
```

你还可以使用 `createMany` 方法去创建多个关联模型：

```js
await post.related('comments').createMany([
  { message: 'A new comment.' },
  { message: 'Another new comment.' },
]);
```

你还可以使用 `findOrNew`、`firstOrNew`、`firstOrCreate` 和 `updateOrCreate` 方法来 创建和更新关系模型。

### 更新 `belongsTo` 关联

当更新 `belongsTo` 关联时，可以使用 `associate` 方法。此方法将会在子模型中设置外键。在这个例子中，`User` 模型定义了一个与 `Account` 模型的 `belongsTo` 关系。 这个 `associate` 方法将在子模型上设置外键： 

```js
const { Account } = require('./models');

const account = await Account.query().find(10);
user.related('account').associate(account);

await user.save();
```

当移除 `belongsTo` 关联时，可以使用 `dissociate` 方法。此方法会将关联外键设置为 null ：

```js
user.related('account').dissociate();
 
await user->save();
```

### 多对多关联

#### 附加 / 分离

Sutando 也提供了一些额外的辅助方法，使相关模型的使用更加方便。例如，我们假设一个用户可以拥有多个角色，并且每个角色都可以被多个用户共享。给某个用户附加一个角色是通过向中间表插入一条记录实现的，可以使用 `attach` 方法完成该操作： 

```js
const { User } = require('./models');

const user = await User.query().find(1);

await user.related('roles').attach(roleId);
```

在将关系附加到模型时，还可以传递一组要插入到中间表中的附加数据： 

```js
await user.related('roles').attach(roleId, {
  expires: expires,
});
```

当然，有时也需要移除用户的角色。可以使用 `detach` 移除多对多关联记录。`detach` 方法将会移除中间表对应的记录；但是这两个模型都将会保留在数据库中：

```js
// 移除用户的一个角色...
await user.related('roles').detach(roleId);
 
// 移除用户的所有角色...
await user.related('roles').detach();
```

为了方便起见，`attach` 和 `detach` 也允许传递一个 ID 数组：

```js
const user = await User.query().find(1);
 
await user.related('roles').detach([1, 2, 3]);
 
await user.related('roles').attach([1, 2]);
```

#### 同步关联

你也可以使用 `sync` 方法构建多对多关联。`sync` 方法接收一个 ID 数组以替换中间表的记录。中间表记录中，所有未在 ID 数组中的记录都将会被移除。所以该操作结束后，只有给出数组的 ID 会被保留在中间表中： 

```js
await user.related('roles').sync([1, 2, 3]);
```

你也可以通过 ID 传递额外的附加数据到中间表：

```js
await user.related('roles').sync({ 1: { expires: true }, 2: {}, 3: {} });
```

如果您想为每个同步的模型 ID 插入相同的中间表值，您可以使用 `syncWithPivotValues` 方法：

```js
await user.related('roles').syncWithPivotValues([1, 2, 3], { active: true });
```

如果你不想移除现有的 ID，可以使用 `syncWithoutDetaching` 方法： 

```js
await user.related('roles').syncWithoutDetaching([1, 2, 3]);
```

#### 更新中间表上的记录

如果你需要在中间表中更新一条已存在的记录，可以使用 `updateExistingPivot` 。此方法接收中间表的外键与要更新的数据对象进行更新：

```js
await user.related('roles').updateExistingPivot(roleId, {
  active: false,
});
```
