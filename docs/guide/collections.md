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

# Collections

All Sutando methods that return more than one model result will return instances of the `Collection` class, including results retrieved via the `get` method or accessed via a relationship. The Sutando collection object extends [collect.js](https://collect.js.org/) collection, so it naturally inherits dozens of methods used to fluently work with the underlying array of Sutando models. Be sure to review the Laravel collection documentation to learn all about these helpful methods!

All collections also serve as iterators, allowing you to loop over them as if they were arrays:

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

However, as previously mentioned, collections are much more powerful than arrays and expose a variety of map / reduce operations that may be chained using an intuitive interface. For example, we may remove all inactive models and then gather the first name for each remaining user:

```js
const names = (await User::all()).reject(user => {
  return user.active === false;
}).map(user => {
  return user.name;
});
```

## Available Methods

All Sutando collections extend the base `collect.js` object; therefore, they inherit all of the powerful methods provided by the base collection class.

In addition, the `Collection` class provides a superset of methods to aid with managing your model collections. Most methods return `Collection` instances; however, some methods, like `modelKeys`, return an `collect.js` instance.

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

The `contains` method may be used to determine if a given model instance is contained by the collection. This method accepts a primary key or a model instance:

```js
users.contains(1);

const user = await User.query().find(1);
users.contains(user);
```

#### diff(items)

The `diff` method returns all of the models that are not present in the given collection:

```js
const otherUsers = await User.query().whereIn('id', [1, 2, 3]).get()
const diffUsers = users.diff(otherUsers);
```

#### except(keys)

The `except` method returns all of the models that do not have the given primary keys:

```js
const exceptUsers = users.except([1, 2, 3]);
```

#### find(key)
The `find` method returns the model that has a primary key matching the given key. If `key` is a model instance, `find` will attempt to return a model matching the primary key. If key is an array of keys, `find` will return all models which have a primary key in the given array:

```js
const users = await User.query().all();
 
const user = users.find(1);
```

#### fresh(with = [])

The `fresh` method retrieves a fresh instance of each model in the collection from the database. In addition, any specified relationships will be eager loaded:

```js
const newUsers = await users.fresh();
 
const newUsers = await users.fresh('comments');
```

#### intersect(items)

The `intersect` method returns all of the models that are also present in the given collection:

```js
const otherUsers = await User.query().whereIn('id', [1, 2, 3]).get();
const newUsers = users.intersect(otherUsers);
```

#### load(relations)

The `load` method eager loads the given relationships for all models in the collection:

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

The `modelKeys` method returns the primary keys for all models in the collection:

```js
users.modelKeys();
 
// [1, 2, 3, 4, 5]
```

#### makeVisible(attributes)

The `makeVisible` method makes attributes visible that are typically "hidden" on each model in the collection:

```js
const newUsers = users.makeVisible(['address', 'phone_number']);
```

#### makeHidden(attributes)

The `makeHidden` method hides attributes that are typically "visible" on each model in the collection:

```js
const newUsers = users.makeHidden(['address', 'phone_number']);
```

#### only(keys)

The `only` method returns all of the models that have the given primary keys:

```js
const newUsers = users.only([1, 2, 3]);
```

#### toQuery()

The `toQuery` method returns an query builder instance containing a whereIn constraint on the collection model's primary keys:

```js
const { User } = require('./models');
 
const users = await User.query().where('status', 'VIP').get();
 
await users.toQuery().update([
  'status' => 'Administrator',
]);
```

#### unique(key = null, strict = false)

The `unique` method returns all of the unique models in the collection. Any models of the same type with the same primary key as another model in the collection are removed:

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
