---
description: "プラグインは Sutando に新機能を追加したり既存機能を拡張したりする独立したパッケージです。複数を組み合わせて読み込むことができます。"
---

# プラグイン

プラグインは、Sutando に新しい機能を追加したり、既存の機能を拡張したりできる独立したプログラムです

さまざまなニーズに応えるために、複数のプラグインを読み込むことができます。

## 使い方

例えば、Sutando には 2 つのプラグインが同梱されています。`SoftDeletes` はモデルがソフトデリートをサポートできるようにし、`HasUniqueIds` は文字列を主キーとして使用する機能を提供します。プラグインはこのように使用できます：

```ts
import { Model, compose, SoftDeletes, HasUniqueIds } from 'sutando';

class User extends SoftDeletes(Model) {}

class Post extends HasUniqueIds(SoftDeletes(Model)) {}
```

ただし、プラグインを使用する際は `compose` ヘルパー関数の使用を推奨します：

```ts
import { Model, compose, SoftDeletes, HasUniqueIds } from 'sutando';

class User extends compose(Model, SoftDeletes) {}

class Post extends compose(Model, SoftDeletes, HasUniqueIds) {}
```

## プラグインの作成

可能であれば、Sutando のプラグインはクラスミックスインとして実装すべきです。`mixin` とは、クラスを引数に取り、そのサブクラスを返すだけの関数です。

```ts
const SomeMixin = (Model) => {
  return class extends Model {
    // Your code
  }
}
```

Sutando プラグインの作り方をよりよく理解するために、記事モデルのタイトルに基づいて `slug` を自動設定する簡単なプラグインを書いてみましょう。

ロジックを適切に管理するために、次のように別のファイルで作成してエクスポートすることを推奨します：

```ts
// plugins/sutando-slug.js
import _ from 'lodash';

const HasSlug = (Model) => {
  return class extends Model {
    static booted() {
      // Execute booted of the parent class
      Model.booted();

      // Set the creating hook
      this.creating(model => {
        // If slug is not set, it will be automatically generated based on the title attribute
        if (model.slug === undefined) {
          model.slug = _.kebabCase(model.title);
        }
      });
    }
  }
}

export default 
```

この例では[フック](hooks)を使用しています。完成したら、プラグインを次のように使用できます：

```ts
import { Model, compose } from 'sutando';
import HasSlug from './plugins/sutando-slug';

class Post extends compose(
  Model,
  HasSlug
) {
  // ...
}

const post = new Post;
post.title = 'The First Post Title';
await post.save();

console.log(post.slug); // the-first-post-title
```

そこで疑問が湧きます。データベースのフィールド名が `slug` ではなく `slug_name` やその他の名前だったらどうでしょうか？ その場合は、フィールド名のパラメータを受け取るようにプラグインを調整するだけです：

```ts
// plugins/sutando-slug.js
import _ from 'lodash';

const HasSlug = ({ column }) => (Model) => {
  return class extends Model {
    static booted() {
      // Execute booted of the parent class
      Model.booted();

      // Set the creating hook
      this.creating(model => {
        // If slug is not set, it will be automatically generated based on the title attribute
        if (model[column] === undefined) {
          model[column] = _.kebabCase(model.title);
        }
      });
    }
  }
}

export default 
```

使い方も変わります：

```ts
import { Model, compose } from 'sutando';
import HasSlug from './plugins/sutando-slug';

class Post extends compose(
  Model,
  HasSlug({ column: 'custom_slug' })
) {
  // ...
}

const post = new Post;
post.title = 'The First Post Title';
await post.save();

console.log(post.custom_slug); // the-first-post-title
```