---
outline: [2, 4]
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

# 集合

Sutando 模型返回的所有结果集都是 `Collection` 对象的实例，包括通过 `get` 方法检索或通过访问关联关系获取到的结果。 Sutando 的集合对象继承了 [collect.js](https://collect.js.org/)， 因此它自然也继承了数十种能优雅地处理 Sutando 模型底层数组的方法。

而且，所有的集合都可以作为迭代器，你可以像遍历简单的数组一样来遍历它们：

```js
const { User } = require('./models');
 
const users = await User.query().where('active', 1).get();

users.map(user => {
  console.log(user.name);
});
 
for (let user of users) {
  console.log(user.name);
}
```

不过，集合比数组更加强大，它通过更加直观的接口暴露出可链式调用的 map /reduce 等操作。例如，让我们移除所有未激活的用户并收集剩余用户的名字：

```js
const names = (await User.query().all()).reject(user => {
  return user.active === false;
}).map(user => {
  return user.name;
});
```

## 可用的方法

所有 Sutando 的集合都继承了 `collect.js` 对象；因此， 他们也继承了所有集合基类提供的强大的方法。

另外， `Collection` 类提供了一套上层的方法来帮你管理你的模型集合。大多数方法返回 `Collection` 实例；然而，也会有一些方法， 例如 `modelKeys`， 它们会返回一个数组。

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

#### contains(key, operator = null, value = null)

`contains` 方法可用于判断集合中是否包含指定的模型实例。这个方法接收一个主键或者模型实例：

```js
users.contains(1);

const user = await User.query().find(1);
users.contains(user);
```

#### diff(items)

`diff` 方法返回不在给定集合中的所有模型：

```js
const otherUsers = await User.query().whereIn('id', [1, 2, 3]).get()
const diffUsers = users.diff(otherUsers);
```

#### except(keys)

`except` 方法返回给定主键外的所有模型：

```js
const exceptUsers = users.except([1, 2, 3]);
```

#### find(key)

`find` 方法查找给定主键的模型。如果 `key` 是一个模型实例， `find` 将会尝试返回与主键匹配的模型。 如果 `key` 是一个关联数组， `find` 将返回所有数组主键匹配的模型:

```js
const users = await User.query().all();
 
const user = users.find(1);
```

#### fresh(with = [])

`fresh` 方法用于从数据库中检索集合中每个模型的新实例。此外，还将加载任何指定的关联关系：

```js
const newUsers = await users.fresh();
 
const newUsers = await users.fresh('comments');
```

#### intersect(items)

`intersect` 方法返回给定集合与当前模型的交集： 

```js
const otherUsers = await User.query().whereIn('id', [1, 2, 3]).get();
const newUsers = users.intersect(otherUsers);
```

#### load(relations)

`load` 方法为集合中的所有模型加载给定关联关系： 

```js
await users.load(['comments', 'posts']);
 
await users.load('comments.author');
```

#### loadCount / loadMax / loadMin / loadSum / loadAvg

```js
await users.loadCount(['comments', 'posts']);

await users.loadMax('posts', 'vote');

await users.loadMin('posts', 'vote');

await users.loadSum('posts', 'vote');

await users.loadAvg('posts', 'vote');
```

#### modelKeys()

`modelKeys` 方法返回集合中所有模型的主键： 

```js
users.modelKeys();
 
// [1, 2, 3, 4, 5]
```

#### makeVisible(attributes)

`makeVisible` 方法使模型上的隐藏属性可见： 

```js
const newUsers = users.makeVisible(['address', 'phone_number']);
```

#### makeHidden(attributes)

`makeHidden` 方法隐藏模型属性：

```js
const newUsers = users.makeHidden(['address', 'phone_number']);
```

#### only(keys)

`only` 方法返回具有给定主键的所有模型： 

```js
const newUsers = users.only([1, 2, 3]);
```

#### toQuery()

`toQuery` 方法返回一个查询生成器实例，该实例包含集合模型主键上的 whereIn 约束：

```js
const { User } = require('./models');
 
const users = await User.query().where('status', 'VIP').get();
 
await users.toQuery().update([
  'status' => 'Administrator',
]);
```

#### unique(key = null, strict = false)

`unique` 方法返回集合中所有不重复的模型，若模型在集合中存在相同类型且相同主键的另一模型，该模型将被删除。

```js
const newUsers = users.unique();
```

#### toData()

```js
const users = await User.query().all();

return users.toData();
```

#### toJson()

```js
const users = await User.query().all();

return users.toJson();
```
