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

# Models

Sutando has data models built on top of the active record pattern .

The data models layer of Sutando makes it super easy to perform CRUD operations, manage relationships between models.

We recommend using models extensively and reach for the standard query builder for particular use cases.

## Creating your first model

Let's examine a basic model class and discuss some of Sutando's key conventions:

```js
const { Model } = require('sutando');

class Flight extends Model {
  //
}
```

### Table Names

After glancing at the example above, you may have noticed that we did not tell Sutando which database table corresponds to our `Flight` model. By convention, the "snake case", plural name of the class will be used as the table name unless another name is explicitly specified. So, in this case, Sutando will assume the `Flight` model stores records in the `flights` table, while an `AirTrafficController` model would store records in an `air_traffic_controllers` table.

If your model's corresponding database table does not fit this convention, you may manually specify the model's table name by defining a table property on the model:

```js
const { Model } = require('sutando');

class Flight extends Model {
  // The table associated with the model.
  table = 'my_flights';
}
```

### Primary Keys

Sutando will also assume that each model's corresponding database table has a primary key column named `id`. If necessary, you may define a protected `primaryKey` property on your model to specify a different column that serves as your model's primary key:

```js
const { Model } = require('sutando');

class Flight extends Model {
  // The primary key associated with the table.
  primaryKey = 'flight_id';
}
```

If you wish to use a non-incrementing or a non-numeric primary key you must define a `incrementing` property on your model that is set to false:

```js
class Flight extends Model {
  // Indicates if the model's ID is auto-incrementing.
  incrementing = false;
}
```

If your model's primary key is not an integer, you should define a `keyType` property on your model. This property should have a value of string:

```js
class Flight extends Model {
  // The data type of the auto-incrementing ID.
  keyType = 'string';
}
```

### UUID & String Keys

You can choose to use a string instead of an auto-incrementing integer as the model's primary key. For example, use a UUID as the primary key by defining a `newUniqueId` method in the model:

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


### Timestamps

By default, Sutando expects `created_at` and `updated_at` columns to exist on your model's corresponding database table. Sutando will automatically set these column's values when models are created or updated. If you do not want these columns to be automatically managed by Sutando, you should define a `timestamps` property on your model with a value of false:

```js
const { Model } = require('sutando');

class Flight extends Model {
  // Indicates if the model should be timestamped.
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

If you need to customize the names of the columns used to store the timestamps, you may set `CREATED_AT` and `UPDATED_AT` properties pro on your model:

```js
const { Model } = require('sutando');

class Flight extends Model {
  static CREATED_AT = 'creation_date';
  static UPDATED_AT = 'updated_date';
}
```

### Database Connections
By default, all Sutando models will use the `default` database connection that is configured for your application. If you would like to specify a different connection that should be used when interacting with a particular model, you should define a `connection` property on the model:

```js
const { Model } = require('sutando');

class Flight extends Model {
  connection = 'sqlite';
}
```

### Default Attribute Values

By default, a newly instantiated model instance will not contain any attribute values. If you would like to define the default values for some of your model's attributes, you may define an `attributes` property on your model. Attribute values placed in the `attributes` should be in their raw, "storable" format as if they were just read from the database:

```js
const { Model } = require('sutando');

class Flight extends Model {
  attributes = {
    options: '[]',
    delayed: false,
  };
}
```

## Retrieving Models

Once you have created a model and its associated database table, you are ready to start retrieving data from your database. You can think of each Sutando model as a powerful query builder allowing you to fluently query the database table associated with the model. The model's all method will retrieve all of the records from the model's associated database table:

```js
const { Flight } = require('./models');

const flights = await Flight.query().all();

flights.map(flight => {
  console.log(flight.name)
})
```

#### Building Queries

The Sutando `all` method will return all of the results in the model's table. However, since each Sutando model serves as a query builder, you may add additional constraints to queries and then invoke the `get`/`first`/`find` method to retrieve the results:

```js
const flights = await Flight.query().where('active', 1)
  .orderBy('name')
  .take(10)
  .get();

const flight = await Flight.query().where('active', 1).first();

const flight = await Flight.query().find(5);
```

#### Refreshing Models

If you already have an instance of an Sutando model that was retrieved from the database, you can "refresh" the model using the `fresh` and `refresh` methods. The `fresh` method will re-retrieve the model from the database. The existing model instance will not be affected:

```js
const flight = await Flight.query().where('number', 'FR 900').first();
 
const freshFlight = await flight.fresh();
```

The `refresh` method will re-hydrate the existing model using fresh data from the database. In addition, all of its loaded relationships will be refreshed as well:

```js
const flight = await Flight.query().where('number', 'FR 900').first();
 
flight.number = 'FR 456';
 
await flight.refresh();
 
flight.number; // "FR 900"
```

### Collections

As we have seen, Sutando methods like `all` and `get` retrieve multiple records from the database. However, these methods don't return a plain array. Instead, an instance of [Collection](collections) is returned.

The Sutando Collection class extends [`collect.js`](https://collect.js.org/) class, which provides a [variety of helpful methods](collections#available-methods) for interacting with data collections. For example, the reject method may be used to remove models from a collection based on the results of an invoked closure:

```js
const flights = await Flight.query().where('destination', 'Paris').get();
 
const newFlights = flights.reject(flight => {
  return flight.cancelled;
});
```

In addition to the methods provided by `collect.js`'s base collection class, the Sutando collection class provides [a few extra methods](collections#available-methods) that are specifically intended for interacting with collections of Sutando models.

Since all of Sutando collections implement Javascript's iterable interfaces, you may loop over collections as if they were an array:

```js
for (let flight of flights) {
  console.log(flight.name);
}
```

### Chunking Results

Your application may run out of memory if you attempt to load tens of thousands of Sutando records via the `all` or `get` methods. Instead of using these methods, the `chunk` method may be used to process large numbers of models more efficiently.

The `chunk` method will retrieve a subset of Sutando models, passing them to a closure for processing. Since only the current chunk of Sutando models is retrieved at a time, the `chunk` method will provide significantly reduced memory usage when working with a large number of models:

```js
const { Flight } = require('./models');
 
await Flight.query().chunk(200, flights => {
  flights.map(flight => {
    //
  });
});
```

## Retrieving Single Models / Aggregates

In addition to retrieving all of the records matching a given query, you may also retrieve single records using the `find` or `first` methods. Instead of returning a collection of models, these methods return a single model instance:

```js
const { Flight } = require('./modles');
 
// Retrieve a model by its primary key...
const flight = await Flight.query().find(1);
 
// Retrieve the first model matching the query constraints...
const flight = await Flight.query().where('active', 1).first();
```

### Not Found Errors

Sometimes you may wish to throw an exception if a model is not found. This is particularly useful in routes or controllers. The `findOrFail` and `firstOrFail` methods will retrieve the first result of the query; however, if no result is found, an `ModelNotFoundError` will be thrown:

```js
const { ModelNotFoundError } = requre('sutando');

try {
  const flight = await Flight.query().findOrFail(1);
  const flight = await Flight.query().where('legs', '>', 3).firstOrFail();
} catch (e) {
  e instanceof ModelNotFoundError;
}
```

With the framework capturing `ModelNotFoundError`, a 404 HTTP response can be automatically sent back to the client:

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

### Retrieving Or Creating Models

The `firstOrCreate` method will attempt to locate a database record using the given column / value pairs. If the model can not be found in the database, a record will be inserted with the attributes resulting from merging the first array argument with the optional second array argument:

The `firstOrNew` method, like `firstOrCreate`, will attempt to locate a record in the database matching the given attributes. However, if a model is not found, a new model instance will be returned. Note that the model returned by `firstOrNew` has not yet been persisted to the database. You will need to manually call the `save` method to persist it:

```js
const { Flight } = require('./modles');
 
// Retrieve flight by name or create it if it doesn't exist...
const flight = await Flight.query().firstOrCreate({
  name: 'London to Paris'
});
 
// Retrieve flight by name or create it with the name, delayed, and arrival_time attributes...
const flight = await Flight.query().firstOrCreate(
  { name: 'London to Paris' },
  { delayed: 1, arrival_time: '11:30' }
);
 
// Retrieve flight by name or instantiate a new Flight instance...
const flight = await Flight.query().firstOrNew({
  name: 'London to Paris'
});
 
// Retrieve flight by name or instantiate with the name, delayed, and arrival_time attributes...
const flight = await Flight.query().firstOrNew(
  { name: 'Tokyo to Sydney' },
  { delayed: 1, arrival_time: '11:30' }
);
```

### Retrieving Aggregates

When interacting with Sutando models, you may also use the `count`, `sum`, `max`, and other aggregate methods provided by the [query builder](./query-builder#aggregates). As you might expect, these methods return a scalar value instead of an Sutando model instance:

```js
const count = await Flight.query().where('active', 1).count(); // 100
 
const max = await Flight.query().where('active', 1).max('price'); // 104

const flight = await Flight.query().find(1); // flight instanceof Flight
```

## Inserting & Updating Models

### Inserts

Of course, when using Sutando, we don't only need to retrieve models from the database. We also need to insert new records. Thankfully, Sutando makes it simple. To insert a new record into the database, you should instantiate a new model instance and set attributes on the model. Then, call the `save` method on the model instance:

```js
// express
const { Flight } = require('./model');

app.post('/flights', async (req, res) => {
  // Validate the request...

  const flight = new Flight;
  flight.name = req.name;
  await flight.save();

  res.send(flight);
});
```

In this example, we assign the name field from the incoming HTTP request to the `name` attribute of the `Flight` model instance. When we call the `save` method, a record will be inserted into the database. The model's `created_at` and `updated_at` timestamps will automatically be set when the `save` method is called, so there is no need to set them manually.

Alternatively, you may use the `create` method to "save" a new model using a single PHP statement. The inserted model instance will be returned to you by the `create` method:

```js
const { Flight } = require('./model');

const flight = await Flight.query().create({
  name: 'London to Paris',
});
```

### Updates

The `save` method may also be used to `update` models that already exist in the database. To update a model, you should retrieve it and set any attributes you wish to update. Then, you should call the model's save method. Again, the `updated_at` timestamp will automatically be updated, so there is no need to manually set its value:

```js
const { Flight } = require('./model');

const flight = await Flight.query().find(1);
flight.name = 'Paris to London';
await flight.save();
```

#### Mass Updates

Updates can also be performed against models that match a given query. In this example, all flights that are `active` and have a `destination` of `San Diego` will be marked as delayed:

```js
await Flight.query().where('active', 1)
  .where('destination', 'San Diego')
  .update({
    delayed: 1,
  });
```

The `update` method expects an array of column and value pairs representing the columns that should be updated. The `update` method returns the number of affected rows.

:::tip
When issuing a mass update, the `saving`, `saved`, `updating`, and `updated` model events will not be fired for the updated models. This is because the models are never actually retrieved when issuing a mass update.
:::

#### Examining Attribute Changes

Sutando provides the `isDirty` methods to examine the internal state of your model and determine how its attributes have changed from when the model was originally retrieved.

The `isDirty` method determines if any of the model's attributes have been changed since the model was retrieved. You may pass a specific attribute name or an array of attributes to the `isDirty` method to determine if any of the attributes are "dirty". This method also accepts an optional attribute argument:

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

### Upserts

Occasionally, you may need to update an existing model or create a new model if no matching model exists. Like the `firstOrCreate` method, the `updateOrCreate` method persists the model, so there's no need to manually call the `save` method.

In the example below, if a flight exists with a departure location of Oakland and a destination location of San Diego, its `price` and `discounted` columns will be updated. If no such flight exists, a new flight will be created which has the attributes resulting from merging the first argument object with the second argument object:

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

## Deleting Models

To delete a model, you may call the `delete` method on the model instance:

```js
const { Flight } = require('./models');

const flight = await Flight.query().find(1);
await flight.delete();
```

#### Deleting An Existing Model By Its Primary Key

In the example above, we are retrieving the model from the database before calling the `delete` method. However, if you know the primary key of the model, you may delete the model without explicitly retrieving it by calling the `destroy` method. In addition to accepting the single primary key, the `destroy` method will accept multiple primary keys, an array of primary keys, or a `Collection` of primary keys:

```js
await Flight.query().destroy(1);
 
await Flight.query().destroy(1, 2, 3);
 
await Flight.query().destroy([1, 2, 3]);
```
 
#### Deleting Models Using Queries

Of course, you may build an Sutando query to delete all models matching your query's criteria. In this example, we will delete all flights that are marked as inactive. Like mass updates, mass deletes will not dispatch model events for the models that are deleted:

```js
const deleted = await Flight.query().where('active', 0).delete();
```

### Soft Deleting

In addition to actually removing records from your database, Sutando can also "soft delete" models. When models are soft deleted, they are not actually removed from your database. Instead, a `deleted_at` attribute is set on the model indicating the date and time at which the model was "deleted". To enable soft deletes for a model, use the `SoftDeletes` plugin and add the `deleted_at` field in the corresponding data table:

```js
const { Model, compose, SoftDeletes } = require('sutando');

class Flight extends compose(Model, SoftDeletes) {
  // ...
}
```

Now, when you call the `delete` method on the model, the `deleted_at` column will be set to the current date and time. However, the model's database record will be left in the table. When querying a model that uses soft deletes, the soft deleted models will automatically be excluded from all query results.

To determine if a given model instance has been soft deleted, you may use the `trashed` method:

```js
if (flight.trashed()) {
  //
}
```

#### Restoring Soft Deleted Models

Sometimes you may wish to "un-delete" a soft deleted model. To restore a soft deleted model, you may call the `restore` method on a model instance. The `restore` method will set the model's deleted_at column to null:

```js
await flight.restore();
```

You may also use the `restore` method in a query to restore multiple models. Again, like other "mass" operations, this will not dispatch any model events for the models that are restored:

```js
await Flight.query().withTrashed()
  .where('airline_id', 1)
  .restore();
```

The `restore` method may also be used when building relationship queries:

```js
await flight.related('history').restore();
```

#### Permanently Deleting Models

Sometimes you may need to truly remove a model from your database. You may use the `forceDelete` method to permanently remove a model from the database table:

```js
await flight.forceDelete();
```

You may also use the `forceDelete` method when building Sutando relationship queries:

```js
await flight.related('history').forceDelete();
```

### Querying Soft Deleted Models

#### Including Soft Deleted Models

As noted above, soft deleted models will automatically be excluded from query results. However, you may force soft deleted models to be included in a query's results by calling the `withTrashed` method on the query:

```js
const { Flight } = require('./models');

const flights = await Flight.query().withTrashed()
  .where('account_id', 1)
  .get();
```

The `withTrashed` method may also be called when building a relationship query:

```js
await flight.related('history').withTrashed().get();
```

#### Retrieving Only Soft Deleted Models

The `onlyTrashed` method will retrieve only soft deleted models:

```js
const flights = await Flight.query().onlyTrashed()
  .where('airline_id', 1)
  .get();
```

## Query Scopes

Scopes allow you to define common sets of query constraints that you may easily re-use throughout your application. For example, you may need to frequently retrieve all users that are considered "popular". To define a scope, prefix an Sutando model method with scope.

Scopes should always return the same query builder instance or void:

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

### Utilizing A Scope

Once the scope has been defined, you may call the scope methods when querying the model. However, you should not include the `scope` prefix when calling the method. You can even chain calls to various scopes:

```js
const { User } = require('./models');

const users = await User.query().popular().active().orderBy('created_at').get();
```

Combining multiple Sutando model scopes via an `or` query operator may require the use of closures to achieve the correct logical grouping:

```js
const users = await User.query().popular().orWhere(query => {
  query.active();
}).get();
```

### Dynamic Scopes

Sometimes you may wish to define a scope that accepts parameters. To get started, just add your additional parameters to your scope method's signature. Scope parameters should be defined after the `query` parameter:


```js
const { Model } = require('./models');

class User extends Model {
  scopeOfType(query, type){
    return query.where('type', type);
  }
}
```

Once the expected arguments have been added to your scope method's signature, you may pass the arguments when calling the scope:

```js
const users = await User.query().ofType('admin').get();
```

## Comparing Models

Sometimes you may need to determine if two models are the "same" or not. The `is` and `isNot` methods may be used to quickly verify two models have the same primary key, table, and database connection or not:

```js
if (post.is(anotherPost)) {
  //
}
 
if (post.isNot(anotherPost)) {
  //
}
```