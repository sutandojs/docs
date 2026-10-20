---
description: "Sutando が返す結果セットはすべて collect.js を継承した Collection です。多数の配列ヘルパーをモデルに対してチェーンして利用できます。"
---

# コレクション

複数のモデル結果を返すすべての Sutando メソッドは、`get` メソッドで取得した結果やリレーション経由でアクセスした結果も含めて、`Collection` クラスのインスタンスを返します。Sutando のコレクションオブジェクトは [collect.js](https://collect.js.org/) のコレクションを継承しているため、Sutando モデルの基になる配列を流暢に操作するための数十のメソッドを自然に受け継ぎます。これらの便利なメソッドのすべてについては、ぜひ [collect.js の API ドキュメント](https://collect.js.org/api.html) を確認してください。

また、すべてのコレクションはイテレーターとしても機能するため、配列のようにループできます。

```ts
import { User } from './models';
 
const users = await User.query().where('active', 1).get();

users.map(user => {
  console.log(user.name);
});
 
for (let user of users) {
  console.log(user.name);
}
```

ただし、前述のとおり、コレクションは配列よりもはるかに強力で、直感的なインターフェースでチェーンできるさまざまな map / reduce 操作を提供します。たとえば、非アクティブなモデルをすべて削除してから、残った各ユーザーの名前を集めることができます。

```ts
const names = (await User.query().all()).reject(user => {
  return user.active === false;
}).map(user => {
  return user.name;
});
```

## 利用可能なメソッド [#available-methods]

すべての Sutando コレクションは基底の `collect.js` オブジェクトを継承しているため、基底コレクションクラスが提供する強力なメソッドをすべて受け継ぎます。

さらに、`Collection` クラスはモデルコレクションの管理を助けるメソッドのスーパーセットを提供します。ほとんどのメソッドは `Collection` インスタンスを返しますが、`modelKeys` のようないくつかのメソッドは `collect.js` のインスタンスを返します。

- [contains](#contains-key-operator-null-value-null) 
- [diff](#diff-items) 
- [except](#except-keys) 
- [find](#find-key) 
- [fresh](#fresh-with) 
- [intersect](#intersect-items) 
- [load](#load-relations) 
- [loadCount / loadMax / loadMin / loadSum / loadAvg](#loadcount-loadmax-loadmin-loadsum-loadavg) 
- [modelKeys](#modelkeys) 
- [makeVisible](#makevisible-attributes) 
- [makeHidden](#makehidden-attributes) 
- [only](#only-keys) 
- [toQuery](#toquery) 
- [unique](#unique-key-null-strict-false) 
- [toData](#todata) 
- [toJson](#tojson) 

### contains(key, operator = null, value = null) {#contains-key-operator-null-value-null}

`contains` メソッドは、指定されたモデルインスタンスがコレクションに含まれているかを判定するために使用できます。このメソッドは主キーまたはモデルインスタンスを受け取ります。

```ts
users.contains(1);

const user = await User.query().find(1);
users.contains(user);
```

### diff(items) {#diff-items}

`diff` メソッドは、指定されたコレクションに存在しないすべてのモデルを返します。

```ts
const otherUsers = await User.query().whereIn('id', [1, 2, 3]).get()
const diffUsers = users.diff(otherUsers);
```

### except(keys) {#except-keys}

`except` メソッドは、指定された主キーを持たないすべてのモデルを返します。

```ts
const exceptUsers = users.except([1, 2, 3]);
```

### find(key) {#find-key}

`find` メソッドは、指定されたキーに一致する主キーを持つモデルを返します。`key` がモデルインスタンスの場合、`find` は主キーに一致するモデルを返そうとします。キーがキーの配列の場合、`find` は指定された配列に主キーが含まれるすべてのモデルを返します。

```ts
const users = await User.query().all();
 
const user = users.find(1);
```

### fresh(with = []) {#fresh-with}

`fresh` メソッドは、コレクション内の各モデルの新しいインスタンスをデータベースから取得します。さらに、指定されたリレーションは Eager ロードされます。

```ts
const newUsers = await users.fresh();
 
const newUsers = await users.fresh('comments');
```

### intersect(items) {#intersect-items}

`intersect` メソッドは、指定されたコレクションにも存在するすべてのモデルを返します。

```ts
const otherUsers = await User.query().whereIn('id', [1, 2, 3]).get();
const newUsers = users.intersect(otherUsers);
```

### load(relations) {#load-relations}

`load` メソッドは、コレクション内のすべてのモデルに対して指定されたリレーションを Eager ロードします。

```ts
await users.load(['comments', 'posts']);
 
await users.load('comments.author');
```

### loadCount / loadMax / loadMin / loadSum / loadAvg {#loadcount-loadmax-loadmin-loadsum-loadavg}

```ts
await users.loadCount(['comments', 'posts']);

await users.loadMax('posts', 'vote');

await users.loadMin('posts', 'vote');

await users.loadSum('posts', 'vote');

await users.loadAvg('posts', 'vote');
```

### modelKeys()

`modelKeys` メソッドは、コレクション内のすべてのモデルの主キーを返します。

```ts
users.modelKeys();
 
// [1, 2, 3, 4, 5]
```

### makeVisible(attributes) {#makevisible-attributes}

`makeVisible` メソッドは、コレクション内の各モデルで通常「非表示」になっている属性を可視にします。

```ts
const newUsers = users.makeVisible(['address', 'phone_number']);
```

### makeHidden(attributes) {#makehidden-attributes}

`makeHidden` メソッドは、コレクション内の各モデルで通常「表示」されている属性を非表示にします。

```ts
const newUsers = users.makeHidden(['address', 'phone_number']);
```

### only(keys) {#only-keys}

`only` メソッドは、指定された主キーを持つすべてのモデルを返します。

```ts
const newUsers = users.only([1, 2, 3]);
```

### toQuery()

`toQuery` メソッドは、コレクションモデルの主キーに対する whereIn 制約を含むクエリビルダインスタンスを返します。

```ts
import { User } from './models';
 
const users = await User.query().where('status', 'VIP').get();
 
await users.toQuery().update([
  'status' => 'Administrator',
]);
```

### unique(key = null, strict = false) {#unique-key-null-strict-false}

`unique` メソッドは、コレクション内のすべての一意なモデルを返します。コレクション内の別のモデルと同じ型で同じ主キーを持つモデルは削除されます。

```ts
const newUsers = users.unique();
```

### toData()

```ts
const users = await User.query().all();

return users.toData();
```

### toJson()

```ts
const users = await User.query().all();

return users.toJson();
```
