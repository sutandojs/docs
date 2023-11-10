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

# 模型

除了数据库查询构建器，Sutando 还拥有构建在 活动记录模式 (Active Record) 之上的数据模型。

Sutando 的数据模型层使执行 CRUD 操作、管理模型之间的关系和定义生命周期挂钩变得超级容易。

我们建议广泛使用模型，并针对特定用例使用标准查询构建器。

## 创建你的第一个模型

我们来看一个基本的模型示例，随后开始讨论 Eloquent 的一些关键约定。

```js
const { Model } = require('sutando');

class Flight extends Model {
  //
}
```

### 数据表名称

看过上面的示例，你可能留意到了我们没有为 Sutando 指明 `Flight` 模型要使用哪张数据表。除非明确指定使用其它数据表，否则将按照约定，使用类的复数形式「蛇形命名」来作为表名。因此，在这种情况下，Sutando 将认为 `Flight` 模型存储的是 `flights` 表中的数据，而 `AirTrafficController` 模型会将记录存储在 `air_traffic_controllers` 表中。 

如果模型的相应数据库表不符合此约定，可以通过在模型上定义 `table` 属性并指定模型的表名： 

```js
const { Model } = require('sutando');

class Flight extends Model {
  // 该表将与模型关联
  table = 'my_flights';
}
```

### 主键

Sutando 将假设模型有一个默认的主键列，该列为 `id` 。如果有必要，你可以定义一个字段 `primaryKey`，用来指定为模型的主键。 

```js
const { Model } = require('sutando');

class Flight extends Model {
  // 与表关联的主键
  primaryKey = 'flight_id';
}
```

此外，Sutando 默认有一个 int 值的主键，如果你的主键不是自增或者不是数字类型，你可以在你的模型上定义一个属性 `incrementing` ，并将其设置为 `false`：

```js
class Flight extends Model {
  // 指明模型的ID是否自动递增
  incrementing = false;
}
```

如果你的模型主键不是 int，应该定义一个 `keyType` 属性在模型上，其值应为 `string`：

```js
class Flight extends Model {
  // ID的数据类型
  keyType = 'string';
}
```

### UUID 主键 / 字符串主键

你可以选择使用字符串，而不是使用自动递增的整数作为模型的主键。例如使用 UUID 作为主键, 通过在模型中定义一个 `newUniqueId` 方法:

::: code-group

```sh [npm]
$ npm install uuid --save
```

```sh [yarn]
$ yarn add uuid
```

```sh [pnpm]
$ pnpm add uuid
```

:::

```js

const { Model, compose, HasUniqueIds } = require('sutando');
const uuid = require('uuid');

class Article extends compose(Model, HasUniqueIds) {
  newUniqueId() {
    return uuid.v4();
  }

  // ...
}

const article = await Article.create({
  title: 'Traveling to Europe'
});

article.id; // "8f8e8478-9035-4d23-b9a7-62f4d2612ce5"
```


### 时间戳（Timestamps）

默认情况下，Sutando 希望模型相应的数据库表中存在 `created_at` 和 `updated_at` 列。在创建或更新模型时，Sutando 将自动设置这些列的值。如果不希望这些列由 Sutando 自动管理，那么你应该在模型上定义一个 `timestamps` 属性并且值为 `false`： 

```js
const { Model } = require('sutando');

class Flight extends Model {
  // 是否主动维护时间戳
  timestamps = false;
}
```

<!-- If you need to customize the format of your model's timestamps, set the `dateFormat` property on your model. This property determines how date attributes are stored in the database as well as their format when the model is serialized to an array or JSON:

```js
const { Model } = require('sutando');

class Flight extends Model {
  // The storage format of the model's date columns.
  dateFormat = 'U';
}
``` -->

如果你需要自定义存储时间戳的字段名，可以在模型中设置 `CREATED_AT` 和 `UPDATED_AT` 常量的值来实现： 

```js
const { Model } = require('sutando');

class Flight extends Model {
  static CREATED_AT = 'creation_date';
  static UPDATED_AT = 'updated_date';
}
```

### 数据库连接

默认情况下，Sutando 模型将使用你的应用程序配置的默认数据库连接。如果你将要指定使用特殊的数据库链接在你的模型，你可以设置一个 `connection` 属性在你的模型： 

```js
const { Model } = require('sutando');

class Flight extends Model {
  connection = 'sqlite';
}
```

### 默认属性值

默认情况下，被实例化的模型不会包含任何属性值。如果你想为模型的某些属性定义默认值，可以在模型上定义一个 `attributes` 属性。放在 `attributes` 中的属性值应该是原始的，“可存储的” 格式，就像它们刚刚从数据库中读取一样：

```js
const { Model } = require('sutando');

class Flight extends Model {
  attributes = {
    options: '[]',
    delayed: false,
  };
}
```


## 模型检索

创建模型和它关联的数据库表后，你就可以从数据库中查询数据了。你可以将每个 Sutando 模型视为一个强大的 [查询构造器](./query-builder)，使你能够更快速地查询与该模型关联的数据库表。模型的 `all` 方法将从模型的关联数据库表中检索所有记录： 

```js
const { Flight } = require('./models');

const flights = await Flight.query().all();

flights.map(flight => {
  console.log(flight.name)
})
```

#### 附加约束

Sutando 的 `all` 方法会返回模型中所有的结果。由于每个 Sutando 模型都充当一个 [查询构造器](./query-builder) ，所以你也可以添加查询条件，然后使用 `get`/`first`/`find` 方法获取查询结果：

```js
const flights = await Flight.query().where('active', 1)
  .orderBy('name')
  .take(10)
  .get();

const flight = await Flight.query().where('active', 1).first();

const flight = await Flight.query().find(5);
```

#### 重新加载模型

你可以使用 `fresh` 和 `refresh` 重新加载从数据库中检索的 Sutando 模型实例。`fresh` 方法会重新从数据库中检索模型。现有的模型实例不受影响： 

```js
const flight = await Flight.query().where('number', 'FR 900').first();
 
const freshFlight = await flight.fresh();
```

`refresh` 方法会使用数据库中的新数据重新赋值现有的模型。此外，已经加载的关系也会被重新加载： 

```js
const flight = await Flight.query().where('number', 'FR 900').first();
 
flight.number = 'FR 456';
 
await flight.refresh();
 
flight.number; // "FR 900"
```

### 集合

Sutando 的 `all` 和 `get` 会从数据库中取得多个结果。然而，这些方法返回的不是数组，而是一个 [`Collection`](collections) 实例。 

Sutando 的 `Collection` 继承自 [collect.js](https://collect.js.org/)，它提供了大量的辅助函数来与数据集交互。例如，`reject` 方法可以根据闭包中的结果从集合中删除模型： 

```js
const flights = await Flight.query().where('destination', 'Paris').get();
 
const newFlights = flights.reject(flight => {
  return flight.cancelled;
});
```

除了 `collect.js` 提供的函数外，Sutando 集合还提供了一些 [额外的函数](collections#available-methods)，这些函数专用于与 Sutando 模型集合进行交互。

由于 Sutando 的集合实现了可迭代接口，因此你可以像循环数组一样循环集合：

```js
for (let flight of flights) {
  console.log(flight.name);
}
```

### 结果分块

如果您想要尝试使用 `all` 或者 `get` 方法来加载成千上万的 Sutando 模型数据，那么您的应用程序可能会耗尽内存。为了避免出现这种情况，可以使用 `chunk` 方法来处理这些模型数据。

`chunk` 方法将会传递模型子集给一个闭包来进行处理。由于每次只获取 Sutando 模型当前块的数据，所以当处理大量模型数据的时候，`chunk` 方法将会明显减少内存的使用量：

```js
const { Flight } = require('./models');
 
await Flight.query().chunk(200, flights => {
  flights.map(flight => {
    //
  });
});
```

## 检索单个模型 / 聚合

除了检索与给定查询匹配的所有记录之外，您还可以使用 `find` 或 `first` 方法检索单个记录。 这些方法不返回模型集合，而是返回单个模型实例： 

```js
const { Flight } = require('./modles');
 
// 使用主键检索模型...
const flight = await Flight.query().find(1);
 
// 检索符合查询条件的第一个模型...
const flight = await Flight.query().where('active', 1).first();
```

### 未找到异常

有时，如果找不到模型，您可能希望抛出异常。 这在路由或控制器中特别有用。 `findOrFail` 和 `firstOrFail` 方法将检索查询的第一个结果； 但是，如果没有找到结果，将会抛出一个 `ModelNotFoundError`： 

```js
const { ModelNotFoundError } = requre('sutando');

try {
  const flight = await Flight.query().findOrFail(1);
  const flight = await Flight.query().where('legs', '>', 3).firstOrFail();
} catch (e) {
  e instanceof ModelNotFoundError;
}
```

配合框架捕获到 `ModelNotFoundError`，可以自动将 404 HTTP 响应发送回客户端：

```js
const app = require('express')();
require('express-async-errors');
const { ModelNotFoundError } = requre('sutando');

app.get('/users/:id', async (req, res) => {
  const user = await User.query().findOrFail(req.params.id);

  res.send(user);
});

app.use((err, req, res, next) => {
  if (err instanceof ModelNotFoundError) {
    return res.status(404).send(err.message);
  }

  next(err);
});
```

### 检索或创建模型

`firstOrCreate` 方法将尝试使用给定的键值对定位数据库记录。 如果在数据库中找不到模型，则会插入一条记录，其中包含将第一个数组参数与可选的第二个数组参数合并后的属性：

`firstOrNew` 方法与 `firstOrCreate` 一样，将尝试在数据库中查找与给定属性匹配的记录。 但是，如果找不到模型，则会返回一个新的模型实例。 请注意，`firstOrNew` 返回的模型尚未持久化到数据库中。 你需要手动调用 `save` 方法来持久化它：

```js
const { Flight } = require('./modles');
 
// 按名称检索航班或在它不存在时创建它...
const flight = await Flight.query().firstOrCreate({
  name: 'London to Paris'
});
 
// 按名称检索航班或使用名称、延迟和到达时间属性创建它...
const flight = await Flight.query().firstOrCreate(
  { name: 'London to Paris' },
  { delayed: 1, arrival_time: '11:30' }
);
 
// 按名称检索航班或实例化新的航班实例...
const flight = await Flight.query().firstOrNew({
  name: 'London to Paris'
});
 
// 按名称检索航班或使用名称、延迟和到达时间属性实例化...
const flight = await Flight.query().firstOrNew(
  { name: 'Tokyo to Sydney' },
  { delayed: 1, arrival_time: '11:30' }
);
```

### 聚合查询

在与 Sutando 模型交互时，您还可以使用 [查询构建器](./query-builder#聚合) 提供的 `count`、`sum`、`max` 和其他 聚合方法。 正如你所料，这些方法返回一个数值而不是一个 Sutando 模型实例： 

```js
const count = await Flight.query().where('active', 1).count(); // 100
 
const max = await Flight.query().where('active', 1).max('price'); // 104

const flight = await Flight.query().find(1); // flight instanceof Flight
```

## 插入及更新模型

### 插入

在使用 Sutando 时，我们不仅仅需要从数据库中检索模型。 我们还需要插入新记录。 幸运的是，Sutando 让它变得非常简单。 要将新记录插入数据库，您应该实例化一个新模型实例并在模型上设置属性。 然后，在模型实例上调用 `save` 方法即可： 

```js
// express
const { Flight } = require('./model');

app.post('/flights', async (req, res) => {
  // 验证请求...

  const flight = new Flight;
  flight.name = req.name;
  await flight.save();

  res.send(flight);
});
```

在此示例中，我们将传入 HTTP 请求中的 name 字段分配给 `Flight` 模型实例的 `name` 属性。 当我们调用 `save` 方法时，一条记录将被插入到数据库中。 模型的 `created_at` 和 `updated_at` 时间戳会在调用 `save` 方法时自动设置，因此无需手动设置。

或者，您可以使用 `create` 方法“保存” 新模型。 `create` 方法将返回新插入的模型实例： 

```js
const { Flight } = require('./model');

const flight = await Flight.query().create({
  name: 'London to Paris',
});
```

### 更新

`save` 方法也可以用来更新数据库中已经存在的模型。 要更新模型，您应该检索它并设置您希望更新的任何属性。 然后调用模型的 `save` 方法。 同样，`updated_at` 时间戳会自动更新，因此无需手动设置其值： 

```js
const { Flight } = require('./model');

const flight = await Flight.query().find(1);
flight.name = 'Paris to London';
await flight.save();
```

#### 批量更新

还可以批量更新与给定条件匹配的所有模型。 在此示例中，所有 `active` 且 `destination` 为 `San Diego` 的航班都将被标记为延迟：

```js
await Flight.query().where('active', 1)
  .where('destination', 'San Diego')
  .update({
    delayed: 1,
  });
```

`update` 方法需要一个表示应该更新的列的列和值对数组。 `update` 方法返回受影响的行数。

::: tip
批量更新时，不会触发模型的 `saving`、`saved`、`updating` 和 `updated` 模型事件。 这是因为在批量更新时从未真正检索到模型。
:::

#### 检查属性变更

Sutando 提供了 `isDirty` 方法，以检查模型的内部状态并确定其属性从最初加载时如何变化。

`isDirty` 方法确定自加载模型以来是否已更改任何属性。 您可以传递特定的属性名称来确定特定的属性是否变脏： 

```js
const { Flight } = require('./model');

const user = await User.query().create({
  first_name: 'Taylor',
  last_name: 'Otwell',
  title: 'Developer',
});
 
user.title = 'Painter';
 
user.isDirty(); // true
user.isDirty('title'); // true
user.isDirty('first_name'); // false
user.isDirty(['first_name', 'title']); // true
 
await user.save();
 
user.isDirty(); // false
```

### 新增或更新

有时，如果不存在匹配模型，您可能需要更新现有模型或创建新模型。 与 `firstOrCreate` 方法一样，`updateOrCreate` 方法将模型持久化，因此无需手动调用 `save` 方法。

在下面的示例中，如果存在具有 Oakland 的 departure 位置和 San Diego 的 destination 位置的航班，其 `price` 和 `discounted` 列将被更新。 如果不存在这样的航班，将创建一个新航班，该航班具有将第一个参数数组与第二个参数数组合并后的属性： 

```js
const flight = await Flight.query().updateOrCreate(
  {
    departure: 'Oakland',
    destination: 'San Diego'
  },
  {
    price: 99,
    discounted: 1
  }
);
```

## 删除模型

想删除模型，你可以调用模型实例的 `delete` 方法: 

```js
const { Flight } = require('./models');

const flight = await Flight.query().find(1);
await flight.delete();
```

#### 通过其主键删除现有模型

上面的示例中，我们先检索，再用 `delete` 删除。若知道主键，则用 `destroy` 直接删除。 `destroy` 可以接受一个主键、多个主键、一个主键数组或一个主键集合 collection: 

```js
await Flight.query().destroy(1);
 
await Flight.query().destroy(1, 2, 3);
 
await Flight.query().destroy([1, 2, 3]);
```
 
#### 使用查询删除模型

通过 Sutando 查询来删除所有符合查询条件的模型。 例如，我们将删除所有标记为无效的航班。像批量更新一样，批量删除将不会为已删除的模型调度模型事件： 

```js
const deleted = await Flight.query().where('active', 0).delete();
```

### 软删除

除了实际删除记录，还可以 “软删除”。 软删除不会从数据库中删除，而是在 `deleted_at` 属性中设置删除模型的日期和时间。要启用软删除，请在使用 `SoftDeletes` 插件和在相应数据表中添加 `deleted_at` 字段：

```js
const { Model, compose, SoftDeletes } = require('sutando');

class Flight extends compose(Model, SoftDeletes) {
  // ...
}
```

那现在，当你在模型实例上使用 `delete` 方法，当前日期时间会写入 `deleted_at` 字段。同时，查询出来的结果也会自动排除已被软删除的记录。 

你可以使用 `trashed` 方法来验证给定的模型实例是否已被软删除： 

```js
if (flight.trashed()) {
  //
}
```

#### 恢复软删除模型

有时会对软删除模型进行「撤销」，在已软删除的数据上使用 `restore` 方法即可恢复到有效状态。 `restore` 方法会将模型的 `deleted_at` 列设为 `null`: 

```js
await flight.restore();
```

你也可以在查询中使用 `restore` 方法，从而快速恢复多个模型。和其他「批量」操作一样，这个操作不会触发模型的任何事件： 

```js
await Flight.query().withTrashed()
  .where('airline_id', 1)
  .restore();
```

类似 `withTrashed` 方法，`restore` 方法也可以用在 [关联](./relationships) 上:

```js
await flight.related('history').restore();
```

#### 永久删除

有时你可能需要从数据库中真正删除模型。要从数据库中永久删除软删除的模型，请使用 `forceDelete` 方法： 

```js
await flight.forceDelete();
```

您也可以在模型关联上调用 `forceDelete` 方法: 

```js
await flight.related('history').forceDelete();
```

### 查询软删除模型  

  

#### 包含已软删除的模型

前面提到，查询结果会自动剔除已被软删除的结果。当然，你可以使用 `withTrashed` 方法来获取包括软删除模型在内的模型： 

```js
const { Flight } = require('./models');

const flights = await Flight.query().withTrashed()
  .where('account_id', 1)
  .get();
```

`withTrashed` 方法也可以用在 [关联](./relationships) 查询：

```js
await flight.related('history').withTrashed().get();
```

#### 只检索软删除模型

`onlyTrashed` 方法只获取已软删除的模型：

```js
const flights = await Flight.query().onlyTrashed()
  .where('airline_id', 1)
  .get();
```

## 查询作用域

作用域允许定义通用的约束集合以便在应用程序中重复使用。例如，你可能经常需要获取所有「流行」的用户。要定义这样一个范围，只需要在对应的 Sutando 模型方法前添加 `scope` 前缀。

作用域总是返回一个查询构造器实例：

```js
const { Model } = require('./models');

class User extends Model {
  scopePopular(query){
    return query.where('votes', '>', 100);
  }

  scopeActive(query){
    query.where('active', 1);
  }
}
```

### 使用作用域

一旦定义了作用域，就可以在查询该模型时调用作用域方法。不过，在调用这些方法时不必包含 `scope` 前缀。甚至可以链式调用多个作用域，例如：

```js
const { User } = require('./models');

const users = await User.query().popular().active().orderBy('created_at').get();
```

通过 `or` 查询运算符组合多个 Sutando 模型作用域可能需要使用闭包来实现正确的逻辑分组：

```js
const users = await User.query().popular().orWhere(query => {
  query.active();
}).get();
```

### 动态作用域

有时可能地希望定义一个可以接受参数的作用域。把额外参数传递给作用域就可以达到此目的。作用域参数要放在 `query` 参数之后： 


```js
const { Model } = require('./models');

class User extends Model {
  scopeOfType(query, type){
    return query.where('type', type);
  }
}
```

一旦将预期的参数添加到作用域方法的签名中，您就可以在调用作用域时传递参数： 

```js
const users = await User.query().ofType('admin').get();
```

## 模型比较

有时可能需要判断两个模型是否「相同」。`is` 和 `isNot` 方法可以用来快速校验两个模型是否拥有相同的主键、表和数据库连接：

```js
if (post.is(anotherPost)) {
  //
}
 
if (post.isNot(anotherPost)) {
  //
}
```