---
description: "hasOne、hasMany、belongsTo、多対多のリレーションをモデルのメソッドとして定義し、クエリの制約をチェーンする方法を説明します。"
---

# リレーション

Sutando のリレーションは、Sutando モデルクラスのメソッドとして定義します。リレーションは強力な[クエリビルダ](query-builder)としても機能するため、メソッドとして定義することで強力なメソッドチェーンとクエリ機能を利用できます。たとえば、次のように `posts` リレーションに追加のクエリ制約をチェーンできます:

```ts
await user.related('posts').where('active', 1).get();
```

ただし、リレーションの使用を深く掘り下げる前に、Sutando がサポートする各リレーションタイプの定義方法を学びましょう。

## 1 対 1

1 対 1 リレーションは、データベースリレーションの最も基本的なタイプです。たとえば、`User` モデルを 1 つの `Phone` モデルに関連付けることができます。このリレーションを定義するには、`User` モデルに phone メソッドを配置します。`relationPhone` メソッドは `hasOne` メソッドを呼び出し、その結果を返す必要があります。`hasOne` メソッドは、モデルの `Model` 基底クラスを通じてモデルで利用できます:

```ts
import { Model } from 'sutando';

class Phone extends Model {}

class User extends Model {
  relationPhone() {
    return this.hasOne(Phone);
  }
}
```

`hasOne` メソッドに渡す最初の引数は、関連するモデルクラスの名前です。リレーションを定義すると、`getRelated` メソッドを使用して関連レコードを取得できます。

```ts
const user = await User.query().find(1);
const phone = await user.getRelated('phone');
```

Sutando は、親モデル名に基づいてリレーションの外部キーを決定します。この場合、`Phone` モデルには自動的に `user_id` 外部キーがあると想定されます。この規約を上書きしたい場合は、`hasOne` メソッドに 2 番目の引数を渡します:

```ts
return this.hasOne(Phone, 'foreign_key');
```

さらに、Sutando は外部キーが親の主キーカラムと一致する値を持つと想定します。言い換えると、Sutando は `Phone` レコードの `user_id` カラムでユーザーの `id` カラムの値を探します。リレーションで id やモデルの `primaryKey` プロパティ以外の主キー値を使用したい場合は、`hasOne` メソッドに 3 番目の引数を渡します:

```ts
return this.hasOne(Phone, 'foreign_key', 'local_key');
```

### 逆リレーションの定義
これで、`User` モデルから `Phone` モデルにアクセスできます。次に、電話を所有するユーザーにアクセスできるリレーションを `Phone` モデルに定義しましょう。`hasOne` リレーションの逆は、`belongsTo` メソッドを使用して定義できます:


```ts
import { Model } from 'sutando';

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

`related('user')` を呼び出すと、Sutando は `Phone` モデルの `user_id` カラムと一致する `id` を持つ `User` モデルを探そうとします。

Sutando は、リレーションメソッドの名前に `_id` を付加して外部キー名を決定します。したがって、この場合、Sutando は `Phone` モデルに user_id カラムがあると想定します。ただし、`Phone` モデルの外部キーが `user_id` でない場合は、`belongsTo` メソッドの 2 番目の引数としてカスタムキー名を渡します:

```ts
relationUser() {
  return this.belongsTo(User, 'foreign_key');
}
```

親モデルが id を主キーとして使用していない場合、または別のカラムを使用して関連モデルを検索したい場合は、`belongsTo` メソッドに 3 番目の引数を渡して親テーブルのカスタムキーを指定します:

```ts
relationUser() {
  return this.belongsTo(User, 'foreign_key', 'owner_key');
}
```

## 1 対多

1 対多リレーションは、1 つのモデルが 1 つ以上の子モデルの親となるリレーションを定義するために使用します。たとえば、ブログの投稿には無数のコメントがある場合があります。他のすべての Sutando リレーションと同様に、1 対多リレーションは Sutando モデルにメソッドを定義することで定義します:

```ts
import { Model } from 'sutando';

class Post extends Model {
  relationComments() {
    return this.hasMany(Comment);
  }
}
```

Sutando は `Comment` モデルに適切な外部キーカラムを自動的に決定することを覚えておいてください。慣例により、Sutando は親モデルの「スネークケース」名に `_id` を付加します。したがって、この例では、Sutando は `Comment` モデルの外部キーカラムが `post_id` であると想定します。

リレーションメソッドを定義すると、`getRelated('comments')` メソッドにアクセスして関連するコメントのコレクションを取得できます:

```ts
import { Post } from './models';

const post = await Post.query().find(1);
const comments = await post.getRelated('comments');
 
comments.map(comment => {
  //
});
```

すべてのリレーションはクエリビルダとしても機能するため、`related('comments')` メソッドを呼び出し、クエリに条件をチェーンし続けることで、リレーションクエリにさらに制約を追加できます:

```ts
const post = await Post.query().find(1);
const comment = await post.related('comments')
  .where('title', 'foo')
  .first();
```

`hasOne` メソッドと同様に、`hasMany` メソッドに追加の引数を渡すことで外部キーとローカルキーを上書きできます:

```ts
return this.hasMany(Comment, 'foreign_key');
 
return this.hasMany(Comment, 'foreign_key', 'local_key');
```

## 1 対多 (逆) / Belongs To {#one-to-many-inverse-belongs-to}

投稿のすべてのコメントにアクセスできるようになったので、コメントから親の投稿にアクセスできるリレーションを定義しましょう。`hasMany` リレーションの逆を定義するには、子モデルに `belongsTo` メソッドを呼び出すリレーションメソッドを定義します:

```ts
import { Model } from 'sutando';

class Comment extends Model {
  relationPost() {
    return this.belongsTo(Post);
  }
}
```

上記の例では、Sutando は `Comment` モデルの `post_id` カラムと一致する id を持つ Post モデルを探そうとします。

Sutando は、リレーションメソッドの名前に _ と親モデルの主キーカラム名を付加してデフォルトの外部キー名を決定します。したがって、この例では、Sutando は `comments` テーブルの `Post` モデルの外部キーが `post_id` であると想定します。

ただし、リレーションの外部キーがこれらの規約に従っていない場合は、belongsTo メソッドの 2 番目の引数としてカスタム外部キー名を渡します:

```ts
relationPost() {
  return this.belongsTo(Post, 'foreign_key');
}
```

親モデルが id を主キーとして使用していない場合、または別のカラムを使用して関連モデルを検索したい場合は、`belongsTo` メソッドに 3 番目の引数を渡して親テーブルのカスタムキーを指定します:

```ts
relationPost() {
  return this.belongsTo(Post, 'foreign_key', 'owner_key');
}
```

### デフォルトモデル

`belongsTo`、`hasOne` リレーションでは、指定されたリレーションが null の場合に返されるデフォルトモデルを定義できます。このパターンはしばしば Null Object パターンと呼ばれ、コード内の条件チェックを削除するのに役立ちます。次の例では、`Post` モデルにユーザーが関連付けられていない場合、`user` リレーションは空の `User` モデルを返します:

```ts
reLationUser() {
  return this.belongsTo(User).withDefault();
}
```

デフォルトモデルに属性を設定するには、`withDefault` メソッドにオブジェクトまたはクロージャを渡します:

```ts
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

## 多対多リレーション

多対多リレーションは、`hasOne` および `hasMany` リレーションよりも少し複雑です。多対多リレーションの例として、多くのロールを持ち、それらのロールがアプリケーション内の他のユーザーとも共有されるユーザーが挙げられます。たとえば、ユーザーに「Author」と「Editor」のロールを割り当てることができますが、それらのロールは他のユーザーにも割り当てることができます。つまり、ユーザーは多くのロールを持ち、ロールは多くのユーザーを持ちます。

### テーブル構造

このリレーションを定義するには、`users`、`roles`、`role_user` の 3 つのデータベーステーブルが必要です。`role_user` テーブルは、関連するモデル名をアルファベット順に並べたものから導出され、`user_id` および `role_id` カラムを含みます。このテーブルは、ユーザーとロールをリンクする中間テーブルとして使用されます。

ロールは多くのユーザーに属することができるため、`roles` テーブルに単純に `user_id` カラムを配置することはできません。それはロールが 1 人のユーザーにしか属することができないことを意味するからです。ロールを複数のユーザーに割り当てるサポートを提供するには、`role_user` テーブルが必要です。リレーションのテーブル構造は次のように要約できます:

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

### モデル構造

多対多リレーションは、`belongsToMany` メソッドの結果を返すメソッドを記述することで定義します。`belongsToMany` メソッドは、アプリケーションのすべての Sutando モデルが使用する Model 基底クラスによって提供されます。たとえば、`User` モデルに `relationRoles` メソッドを定義しましょう。このメソッドに渡す最初の引数は、関連するモデルクラスの名前です:

```ts
import { Model } from 'sutando';

class User extends Model {
  relationRoles() {
    return this.belongsToMany(Role);
  }
}
```

すべてのリレーションはクエリビルダとしても機能するため、`related('roles')` メソッドを呼び出し、クエリに条件をチェーンし続けることで、リレーションクエリにさらに制約を追加できます:

```ts
const user = await User.query().find(1);
const roles = await user.related('roles').orderBy('name').get();
```

リレーションの中間テーブルのテーブル名を決定するために、Sutando は 2 つの関連するモデル名をアルファベット順に連結します。ただし、この規約は自由に上書きできます。`belongsToMany` メソッドに 2 番目の引数を渡すことで行えます:

```ts
return this.belongsToMany(Role, 'role_user');
```

中間テーブルの名前をカスタマイズするだけでなく、`belongsToMany` メソッドに追加の引数を渡すことでテーブル上のキーのカラム名もカスタマイズできます。3 番目の引数はリレーションを定義しているモデルの外部キー名で、4 番目の引数は結合先のモデルの外部キー名です:

```ts
return this.belongsToMany(Role, 'role_user', 'user_id', 'role_id');
```

### 逆リレーションの定義

多対多リレーションの「逆」を定義するには、関連するモデルに `belongsToMany` メソッドの結果も返すメソッドを定義します。`user` / `role` の例を完成させるために、`Role` モデルに `relationUsers` メソッドを定義しましょう:

```ts
import { Model } from 'sutando';

class Role extends Model {
  relationUsers() {
    return this.belongsToMany(User);
  }
}
```

ご覧のとおり、`User` モデルを参照する点を除いて、リレーションは `User` モデルの対応するものとまったく同じように定義されます。`belongsToMany` メソッドを再利用しているため、多対多リレーションの「逆」を定義する際にも通常のテーブルとキーのカスタマイズオプションをすべて利用できます。

### 中間テーブルのカラムの取得

すでに学んだように、多対多リレーションを扱うには中間テーブルの存在が必要です。Sutando は、このテーブルとやり取りするための非常に便利な方法を提供します。たとえば、`User` モデルが関連する多くの Role モデルを持っていると仮定します。このリレーションにアクセスした後、モデルの `pivot` 属性を使用して中間テーブルにアクセスできます:

```ts
import { User } from './models';

const user = await User.query().find(1);
const roles = await user.getRelated('roles');

roles.map(role => {
  console.log(role.pivot.created_at);
});
```

取得した各 `Role` モデルには、自動的に pivot 属性が割り当てられることに注意してください。この属性には、中間テーブルを表すモデルが含まれます。

デフォルトでは、pivot モデルにはモデルのキーのみが存在します。中間テーブルに追加の属性が含まれている場合は、リレーションを定義するときにそれらを指定する必要があります:

```ts
return this.belongsToMany(Role).withPivot('active', 'created_by');
```

中間テーブルに Sutando によって自動的に維持される `created_at` および `updated_at` タイムスタンプを持たせたい場合は、リレーションを定義するときに `withTimestamps` メソッドを呼び出します:

```ts
return this.belongsToMany(Role).withTimestamps();
```

#### `pivot` 属性名のカスタマイズ

前述のように、中間テーブルの属性には `pivot` 属性を介してモデル上でアクセスできます。ただし、アプリケーション内での目的をよりよく反映するために、この属性の名前を自由にカスタマイズできます。

たとえば、アプリケーションにポッドキャストを購読できるユーザーが含まれている場合、ユーザーとポッドキャストの間に多対多リレーションがある可能性があります。その場合は、中間テーブルの属性を `pivot` ではなく `subscription` に名前変更するとよいでしょう。これはリレーションを定義するときに `as` メソッドを使用して行えます:

```ts
return this.belongsToMany(Podcast)
    .as('subscription')
    .withTimestamps();
```

### 中間テーブルのカラムによるクエリのフィルタリング

リレーションを定義するときに `wherePivot`、`wherePivotIn`、`wherePivotNotIn`、`wherePivotBetween`、`wherePivotNotBetween`、`wherePivotNull`、`wherePivotNotNull` メソッドを使用して、`belongsToMany` リレーションクエリが返す結果をフィルタリングすることもできます:

```ts
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

### 中間テーブルのカラムによるクエリの並び替え

`orderByPivot` メソッドを使用して、`belongsToMany` リレーションクエリが返す結果を並び替えることができます。次の例では、ユーザーの最新のバッジをすべて取得します:

```ts
return this.belongsToMany(Badge)
  .where('rank', 'gold')
  .orderByPivot('created_at', 'desc');
```

## リレーションのクエリ

すべての Sutando リレーションはメソッドを介して定義されるため、関連モデルをロードするクエリを実際に実行することなく、それらのメソッドを呼び出してリレーションのインスタンスを取得できます。さらに、すべてのタイプの Sutando リレーションはクエリビルダとしても機能し、データベースに対して最終的に SQL クエリを実行する前に、リレーションクエリに制約をチェーンし続けることができます。

たとえば、`User` モデルが多くの関連する `Post` モデルを持つブログアプリケーションを想像してください:

```ts
import { Model } from 'sutando';

class User extends Model {
  relationPosts() {
    return this.hasMany(Post);
  }
}
```

次のように posts リレーションをクエリし、リレーションに追加の制約を加えることができます:

```ts
import { User } from './models';
 
const user = await User.query().find(1);
 
await user.related('posts').where('active', 1).get();
```

リレーションでは Sutando の[クエリビルダ](query-builder)の任意のメソッドを使用できるため、クエリビルダのドキュメントを参照して、利用可能なすべてのメソッドを確認してください。

### リレーションの後に `orWhere` 句をチェーンする

上記の例で示したように、リレーションをクエリするときに追加の制約を自由に加えることができます。ただし、リレーションに `orWhere` 句をチェーンするときは注意してください。`orWhere` 句はリレーションの制約と同じレベルで論理的にグループ化されるためです:

```ts
await user.related('posts')
  .where('active', 1)
  .orWhere('votes', '>=', 100)
  .get();
```

上記の例は、次の SQL を生成します。ご覧のとおり、or 句はクエリに 100 票を超える任意のユーザーを返すように指示します。クエリは特定のユーザーに制約されなくなります:

```SQL
select *
from posts
where user_id = ? and active = 1 or votes >= 100
```

ほとんどの状況では、論理グループを使用して条件チェックを括弧で囲む必要があります:

```ts
await user.related('posts')
  .where(query => {
    return query.where('active', 1).orWhere('votes', '>=', 100);
  })
  .get();
```

上記の例は、次の SQL を生成します。論理グループによって制約が適切にグループ化され、クエリは特定のユーザーに制約されたままであることに注意してください:

```SQL
select *
from posts
where user_id = ? and (active = 1 or votes >= 100)
```

### リレーションの存在をクエリする

モデルレコードを取得するときに、リレーションの存在に基づいて結果を制限したい場合があります。たとえば、少なくとも 1 つのコメントを持つすべてのブログ投稿を取得したいとします。そのためには、リレーションの名前を `has` および `orHas` メソッドに渡します:

```ts
import { Post } from './models';
// Retrieve all posts that have at least one comment...
const posts = await Post.query().has('comments').get();
```

演算子とカウント値を指定してクエリをさらにカスタマイズすることもできます:

```ts
// Retrieve all posts that have three or more comments...
const posts = await Post.query().has('comments', '>=', 3).get();
```

ネストされた has ステートメントは「ドット」記法を使用して構築できます。たとえば、少なくとも 1 つの画像を持つコメントを少なくとも 1 つ持つすべての投稿を取得できます:

```ts
// Retrieve posts that have at least one comment with images...
const posts = await Post.query().has('comments.images').get();
```

さらに強力な機能が必要な場合は、`whereHas` および `orWhereHas` メソッドを使用して、コメントの内容を検査するなど、has クエリに追加のクエリ制約を定義できます:

```ts
// Retrieve posts with at least one comment containing words like code%...
const posts = await Post.query().whereHas('comments', query => {
  query.where('content', 'like', 'code%');
}).get();
 
// Retrieve posts with at least ten comments containing words like code%...
const posts = await Post.query().whereHas('comments', query => {
  query.where('content', 'like', 'code%');
}, '>=', 10).get();
```

## 関連モデルの集計

### 関連モデルのカウント

実際にモデルをロードせずに、特定のリレーションの関連モデルの数をカウントしたい場合があります。これを行うには、`withCount` メソッドを使用します。`withCount` メソッドは、結果のモデルに `{relation}_count` 属性を配置します:

```ts
import { Post } from './models';

const posts = await Post.query().withCount('comments').get();

posts.map(post => {
  console.log(post.comments_count);
});
```

`withCount` メソッドに配列を渡すことで、複数のリレーションの「カウント」を追加したり、クエリに追加の制約を加えたりできます:

```ts
const posts = await Post.query().withCount({
  comments: query => query.where('content', 'like', 'code%');
}).get();

console.log(posts.get(0).comments_count);
```

### 遅延カウントのロード

`loadCount` メソッドを使用すると、親モデルをすでに取得した後にリレーションのカウントをロードできます:

```ts
const book = await Book.query().first();
 
await book.loadCount('genres');
```

カウントクエリに追加のクエリ制約を設定する必要がある場合は、カウントしたいリレーションをキーとする配列を渡します。配列の値は、クエリビルダのインスタンスを受け取るクロージャである必要があります:

```ts
await book.loadCount({
  reviews: query => query.where('rating', 5);
})
```

### リレーションのカウントとカスタム SELECT 文 {#relationship-counting-custom-select-statements}

`withCount` を select ステートメントと組み合わせる場合は、`select` メソッドの後に `withCount` を呼び出すようにしてください:

```ts
const posts = await Post.query().select(['title', 'body'])
  .withCount('comments')
  .get();
```

### その他の集計関数

`withCount` メソッドに加えて、Sutando は `withMin`、`withMax`、`withAvg`、`withSum`、`withExists` メソッドを提供します。これらのメソッドは、結果のモデルに `{relation}_{function}_{column}` 属性を配置します:

```ts
import { Post } from './models';

const posts = await Post.query().withSum('comments', 'votes').get();
 
posts.map(post => {
  console.log(post.comments_sum_votes);
});
```

`loadCount` メソッドと同様に、これらのメソッドの遅延バージョンも利用できます。これらの追加の集計操作は、すでに取得した Sutando モデルで実行できます:

```ts
const post = await Post.query().first();
 
await post.loadSum('comments', 'votes');
```

これらの集計メソッドを `select` ステートメントと組み合わせる場合は、`select` メソッドの後に集計メソッドを呼び出すようにしてください:

```ts
const posts = await Post.query().select(['title', 'body'])
  .withExists('comments')
  .get();
```

## Eager ロード

Sutando リレーションをプロパティとしてアクセスすると、関連モデルは「遅延ロード」されます。これは、最初にプロパティにアクセスするまでリレーションのデータが実際にはロードされないことを意味します。ただし、Sutando は親モデルをクエリする時点でリレーションを「Eager ロード」できます。Eager ロードは `N + 1` クエリ問題を緩和します。`N + 1` クエリ問題を説明するために、`Author` モデルに「belongsTo」する `Book` モデルを考えてみましょう:

```ts
import { Model } from 'sutando';

class Book extends Model {
  relationAuthor() {
    return this.belongsTo(Author);
  }
}
```

次に、すべての書籍とその著者を取得しましょう:

```ts
import { Book } from './models';

const books = await Book.query().all();
books.map(async book => {
  const author = await book.getRelated('author');
  console.log(author.name);
});
```

このループは、データベーステーブル内のすべての書籍を取得するために 1 つのクエリを実行し、次に各書籍の著者を取得するために書籍ごとに別のクエリを実行します。したがって、25 冊の書籍がある場合、上記のコードは 26 個のクエリを実行します。1 つは元の書籍用、残りの 25 個は各書籍の著者を取得するための追加クエリです。

ありがたいことに、Eager ロードを使用してこの操作をわずか 2 つのクエリに削減できます。クエリを構築するときに、`with` メソッドを使用して Eager ロードするリレーションを指定できます:

```ts
const books = await Book.query().with('author').get();

books.map(book => {
  console.log(book.author.name);
});
```

この操作では、2 つのクエリのみが実行されます。1 つはすべての書籍を取得するクエリで、もう 1 つはすべての書籍のすべての著者を取得するクエリです:

```SQL
select * from books
 
select * from authors where id in (1, 2, 3, 4, 5, ...)
```

### 複数のリレーションの Eager ロード

複数の異なるリレーションを Eager ロードする必要がある場合があります。そのためには、リレーションの配列を `with` メソッドに渡すだけです:

```ts
const books = await Book.query().with(['author', 'publisher']).get();
```

### ネストした Eager ロード

リレーションのリレーションを Eager ロードするには、「ドット」構文を使用できます。たとえば、書籍のすべての著者と、著者のすべての個人連絡先を Eager ロードしましょう:

```ts
const books = await Book.query().with('author.contacts').get();
```

### 特定のカラムの Eager ロード

取得するリレーションのすべてのカラムが常に必要とは限りません。そのため、Sutando では取得したいリレーションのカラムを指定できます:

```ts
const books = await Book.query().with('author:id,name,book_id').get();
```

### Eager ロードの制約

リレーションを Eager ロードしつつ、Eager ロードクエリに追加のクエリ条件を指定したい場合があります。これは、`with` メソッドにリレーションの配列を渡すことで実現できます。オブジェクトのキーはリレーション名で、オブジェクトの値は Eager ロードクエリに追加の制約を加えるクロージャです:

```ts
const users = await User.query().with({
  posts: query => query.where('title', 'like', '%code%')
}).get();
// or
const users = await User.query().with('posts', query => {
  query.where('title', 'like', '%code%');
}).get();
```

この例では、Sutando は投稿の `title` カラムに code という単語が含まれる投稿のみを Eager ロードします。他のクエリビルダメソッドを呼び出して、Eager ロード操作をさらにカスタマイズできます:

```ts
const users = await User.query().with({
  posts: query => query.orderBy('created_at', 'desc')
}).get();
```

### 遅延 Eager ロード

親モデルをすでに取得した後にリレーションを Eager ロードする必要がある場合があります。たとえば、関連モデルをロードするかどうかを動的に決定する必要がある場合に便利です:

```ts
import { Book } from './models';
const books = await Book.query().all();
 
if (someCondition) {
  await books.load('author', 'publisher');
}
```

Eager ロードクエリに追加のクエリ制約を設定する必要がある場合は、ロードしたいリレーションをキーとするオブジェクトを渡します。オブジェクトの値は、クエリインスタンスを受け取るクロージャである必要があります:

```ts
await author.load({
  books: query => query.orderBy('published_date', 'asc')
});
```

## 関連モデルの挿入と更新 {#inserting-updating-related-models}

### `save` メソッド

Sutando は、リレーションに新しいモデルを追加するための便利なメソッドを提供します。たとえば、投稿に新しいコメントを追加する必要があるとします。`Comment` モデルに `post_id` 属性を手動で設定する代わりに、リレーションの `save` メソッドを使用してコメントを挿入できます:

```ts
import { Post, Comment } from './models';

const comment = new Comment({
  message: 'A new comment.'
});

const post = await Post.query().find(1);

await post.related('comments').save(comment);
```

`comments` リレーションに動的プロパティとしてアクセスしていないことに注意してください。代わりに、`related('comments')` メソッドを呼び出してリレーションのインスタンスを取得しました。`save` メソッドは、新しい `Comment` モデルに適切な `post_id` 値を自動的に追加します。

複数の関連モデルを保存する必要がある場合は、`saveMany` メソッドを使用できます:

```ts
await post.related('comments').saveMany([
  new Comment({ message: 'A new comment.' }),
  new Comment({ message: 'Another new comment.' }),
]);
```

`save` および `saveMany` メソッドは指定されたモデルインスタンスを永続化しますが、新しく永続化されたモデルを親モデルにすでにロードされているメモリ内のリレーションに追加しません。`save` または `saveMany` メソッドを使用した後にリレーションにアクセスする予定がある場合は、`refresh` メソッドを使用してモデルとそのリレーションを再ロードするとよいでしょう:

```ts
await post.related('comments').save(comment);
await post.refresh();
 
// All comments, including the newly saved comment...
post.comments;
```

#### モデルとリレーションの再帰的な保存 {#recursively-saving-models-relationships}

モデルとそのすべての関連リレーションを保存したい場合は、`push` メソッドを使用できます。この例では、`Post` モデルとそのコメント、およびコメントの著者が保存されます:

```ts
post.comments.get(0).message = 'Message';
post.comments.get(0).author.name = 'Author Name';
 
await post.push();
```

### `create` メソッド

`save` および `saveMany` メソッドに加えて、`create` メソッドも使用できます。これは属性のオブジェクトを受け取り、モデルを作成してデータベースに挿入します。`save` と `create` の違いは、`save` が完全な Sutando モデルインスタンスを受け取るのに対し、create はプレーンな `object` を受け取ることです。新しく作成されたモデルは `create` メソッドによって返されます:

```ts
import { Post } from './models';

const post = await Post.query().find(1);

const comment = await post.related('comments').create({
  message: 'A new comment.',
});
```

`createMany` メソッドを使用して複数の関連モデルを作成できます:

```ts
await post.related('comments').createMany([
  { message: 'A new comment.' },
  { message: 'Another new comment.' },
]);
```

`findOrNew`、`firstOrNew`、`firstOrCreate`、`updateOrCreate` メソッドを使用して、リレーション上のモデルを作成および更新することもできます。

### Belongs To リレーション

子モデルを新しい親モデルに割り当てたい場合は、`associate` メソッドを使用できます。この例では、`User` モデルが `Account` モデルへの `belongsTo` リレーションを定義しています。この `associate` メソッドは、子モデルに外部キーを設定します:

```ts
import { Account } from './models';

const account = await Account.query().find(10);
user.related('account').associate(account);

await user.save();
```

子モデルから親モデルを削除するには、`dissociate` メソッドを使用できます。このメソッドは、リレーションの外部キーを null に設定します:

```ts
user.related('account').dissociate();
 
await user.save();
```

### 多対多リレーション

#### アタッチ / デタッチ {#attaching-detaching}

Sutando は、多対多リレーションの操作をより便利にするメソッドも提供します。たとえば、ユーザーが多くのロールを持ち、ロールが多くのユーザーを持てるとします。attach メソッドを使用して、リレーションの中間テーブルにレコードを挿入することで、ユーザーにロールをアタッチできます:

```ts
import { User } from './models';

const user = await User.query().find(1);

await user.related('roles').attach(roleId);
```

リレーションをモデルにアタッチするときに、中間テーブルに挿入する追加データの配列を渡すこともできます:

```ts
await user.related('roles').attach(roleId, {
  expires: expires,
});
```

ユーザーからロールを削除する必要がある場合があります。多対多リレーションのレコードを削除するには、`detach` メソッドを使用します。`detach` メソッドは中間テーブルから該当するレコードを削除しますが、両方のモデルはデータベースに残ります:

```ts
// Detach a single role from the user...
await user.related('roles').detach(roleId);
 
// Detach all roles from the user...
await user.related('roles').detach();
```

便宜上、`attach` と `detach` は ID の配列も入力として受け取ります:

```ts
const user = await User.query().find(1);
 
await user.related('roles').detach([1, 2, 3]);
 
await user.related('roles').attach([1, 2]);
```

#### 関連の同期

`sync` メソッドを使用して多対多の関連を構築することもできます。`sync` メソッドは、中間テーブルに配置する ID の配列を受け取ります。指定された配列にない ID は中間テーブルから削除されます。したがって、この操作が完了すると、指定された配列内の ID のみが中間テーブルに存在します:

```ts
await user.related('roles').sync([1, 2, 3]);
```

ID とともに追加の中間テーブルの値を渡すこともできます:

```ts
await user.related('roles').sync({ 1: { expires: true }, 2: {}, 3: {} });
```

同期された各モデル ID に同じ中間テーブルの値を挿入したい場合は、`syncWithPivotValues` メソッドを使用できます:

```ts
await user.related('roles').syncWithPivotValues([1, 2, 3], { active: true });
```

指定された配列にない既存の ID をデタッチしたくない場合は、`syncWithoutDetaching` メソッドを使用できます:

```ts
await user.related('roles').syncWithoutDetaching([1, 2, 3]);
```

#### 中間テーブルのレコードの更新

リレーションの中間テーブルに既存の行を更新する必要がある場合は、`updateExistingPivot` メソッドを使用できます。このメソッドは、中間レコードの外部キーと更新する属性のオブジェクトを受け取ります:

```ts
await user.related('roles').updateExistingPivot(roleId, {
  active: false,
});
```
