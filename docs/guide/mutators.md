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

# Mutators & Casting

Accessors, mutators allow you to transform Sutando attribute values when you retrieve or set them on model instances.

## Accessors & Mutators

### Defining An Accessor

To define an accessor, create a camelCase named `attribute{Attribute}` method in the model to represent the accessible attribute. This method name corresponds to the representation of the real underlying model attribute/database field.

In this example, we'll define an accessor for the `first_name` attribute. The accessor will automatically be called by Sutando when attempting to retrieve the value of the `first_name` attribute:

```js
const { Model, Attribute } = require('sutando');

class User extends Model {
  attributeFirstName() {
    return Attribute.make({
      get: value => value.toUpperCase()
    })
  }
}
```

All accessor methods return an `Attribute` instance that defines how to access the attribute and how to change the attribute. In this example we only define how to access the property. To do this, we provide the `get` parameter to the `Attribute` class constructor.

As you can see, the original value of the column is passed to the accessor, allowing you to manipulate and return the value. To access the value of the accessor, you may simply access the `first_name` attribute on a model instance:

```js
const user = await User.query().find(1);
 
const firstName = user.first_name;
```

:::tip
If you would like these computed values to be added to the Object / JSON representations of your model, [you will need to append them](serialization.html#appending-values-to-json).
:::

Sometimes your accessor may need to transform multiple model attributes into a single "value object". To do so, your get closure may accept a second argument of `attributes`, which will be automatically supplied to the closure and will contain a object of all of the model's current attributes:

```js
attributeFullName() {
  return Attribute.make({
    get: (value, attributes) => `${attributes.first_name} ${attributes.last_name}`
  })
}
```

### Defining A Mutator

To define a mutator, you may provide the `set` argument when defining your attribute. Let's define a mutator for the `first_name` attribute. This mutator will be automatically called when we attempt to set the value of the `first_name` attribute on the model:

```js
const { Model, Attribute } = require('sutando');

class User extends Model {
  attributeFirstName() {
    return Attribute.make({
      get: value => value.toUpperCase(),
      set: value => value.toLocalLowerCase()
    })
  }
}
```

The mutator will receive the value that is being set on the attribute, allowing you to manipulate the value and set the manipulated value on the Sutando model's internal `attributes` property. To use our mutator, we only need to set the `first_name` attribute on an Sutando model:

```js
const user = User.query().find(1);

user.first_name = 'Sally';
```

In this example, the `set` callback will be called with the value `Sally`. The mutator will then apply the `toLocalLowerCase` function to the name and set its resulting value in the model's internal `attributes`.

#### Mutating Multiple Attributes

Sometimes your mutator may need to set multiple attributes on the underlying model. To do so, you may return a object from the `set` closure. Each key in the object should correspond with an underlying attribute / database column associated with the model:

```js
attributeFullName() {
  return Attribute.make({
    get: (value, attributes) => `${attributes.first_name} ${attributes.last_name}`,
    set: (value) => ({
      first_name: value.split(' ')[0],
      last_name: value.split(' ')[1],
    }),
  });
}
```

## Attribute Casting

Attribute casting provides functionality similar to accessors and mutators without requiring you to define any additional methods on your model. Instead, your model's `casts` property provides a convenient method of converting attributes to common data types.

The `casts` property should be a obejct where the key is the name of the attribute being cast and the value is the type you wish to cast the column to. The supported cast types are:

- `integer` `int`
- `float` `double`
- `string`
- `boolean` `bool`
- `collection`
- `date`
- `datetime`
- `json` `object`

To demonstrate attribute casting, let's cast the `is_admin` attribute, which is stored in our database as an integer (`0` or `1`) to a boolean value:

```js
const { Model } = require('sutando');

class User extends Model {
  // The attributes that should be cast.
  casts = {
    is_admin: 'boolean',
  };
}
```

After defining the cast, the `is_admin` attribute will always be cast to a boolean when you access it, even if the underlying value is stored in the database as an integer:

```js
const user = await User.query().find(1);

if (user.is_admin) {
  // ...
}
```

:::tip
You should never define a cast (or an attribute) that has the same name as a relationship or assign a cast to the model's primary key.
:::

### JSON Casting

The json cast is particularly useful when working with columns that are stored as serialized `JSON`. For example, if your database has a `JSON` or `TEXT` field type that contains serialized JSON, adding the json cast to that attribute will automatically deserialize the attribute when you access it on your model:

```js
const { Model } = require('sutando');

class User extends Model {
    // The attributes that should be cast.
    casts = {
      options: 'json',
    };
}
```

Once the cast is defined, you may access the `options` attribute and it will automatically be deserialized from `JSON` into a object. When you set the value of the `options` attribute, the given object will automatically be serialized back into JSON for storage:

```js
const { Model } = require('sutando');

const user = await User.query().find(1);

const options = user.options;

options.key = value;

user.options = options;

await user.save();
```

:::tip
Directly modifying the attributes itself cannot update the model data, so the following usage is incorrect:

```js
const user = await User.query().find(1);

user.options.key = value;
```
:::

### Date Casting

By default, Sutando will cast the `created_at` and `updated_at` columns to instances of `Date`. You may cast additional date attributes by defining additional date casts within your model's `casts` property. Typically, dates should be cast using the `datetime` cast types.

When defining a `date` or `datetime` cast, you may also specify the date's format. This format will be used when the [model is serialized to a object or JSON](serialization):

```js
casts = {
  created_at: 'datetime:YYYY-MM-DD',
};
```

You may customize the default serialization format for all of your model's dates by defining a `serializeDate` method on your model. This method does not affect how your dates are formatted for storage in the database:

```js
const dayjs = require('dayjs');

class User extends Model {
  serializeDate(date) {
    return dayjs(date).format('YYYY-MM-DD');
  }
}
```

To specify the format that should be used when actually storing a model's dates within your database, you should define a `dateFormat` property on your model:

```js
class User extends Model {
  dateFormat = 'X'
}
```

List of all available formats

| Format | Output           | Description                           |
| ------ | ---------------- | ------------------------------------- |
| `YY`   | 18               | Two-digit year                        |
| `YYYY` | 2018             | Four-digit year                       |
| `M`    | 1-12             | The month, beginning at 1             |
| `MM`   | 01-12            | The month, 2-digits                   |
| `MMM`  | Jan-Dec          | The abbreviated month name            |
| `MMMM` | January-December | The full month name                   |
| `D`    | 1-31             | The day of the month                  |
| `DD`   | 01-31            | The day of the month, 2-digits        |
| `d`    | 0-6              | The day of the week, with Sunday as 0 |
| `dd`   | Su-Sa            | The min name of the day of the week   |
| `ddd`  | Sun-Sat          | The short name of the day of the week |
| `dddd` | Sunday-Saturday  | The name of the day of the week       |
| `H`    | 0-23             | The hour                              |
| `HH`   | 00-23            | The hour, 2-digits                    |
| `h`    | 1-12             | The hour, 12-hour clock               |
| `hh`   | 01-12            | The hour, 12-hour clock, 2-digits     |
| `m`    | 0-59             | The minute                            |
| `mm`   | 00-59            | The minute, 2-digits                  |
| `s`    | 0-59             | The second                            |
| `ss`   | 00-59            | The second, 2-digits                  |
| `SSS`  | 000-999          | The millisecond, 3-digits             |
| `Z`    | +05:00           | The offset from UTC, ±HH:mm           |
| `ZZ`   | +0500            | The offset from UTC, ±HHmm            |
| `A`    | AM PM            |                                       |
| `a`    | am pm            |                                       |
| `Q`    | 1-4              | Quarter                               |
| `Do`   | 1st 2nd ... 31st | Day of Month with ordinal             |
| `k`    | 1-24             | The hour, beginning at 1              |
| `kk`   | 01-24            | The hour, 2-digits, beginning at 1    |
| `X`    | 1360013296       | Unix Timestamp in second              |
| `x`    | 1360013296123    | Unix Timestamp in millisecond         |

#### Date Casting, Serialization, & Timezones

By default, the `date` and `datetime` casts will serialize dates to a UTC ISO-8601 date string (2012-12-12T12:25:36.000000Z), regardless of the timezone specified in your application's timezone configuration option.

If a custom format is applied to the `date` or `datetime` cast, such as `datetime:YYYYY-MM-DD HH:mm:ss`, the UTC timezone will be used during date serialization.

### Custom Casts

Sutando has a variety of built-in, helpful cast types; however, you may occasionally need to define your own cast types. All custom cast classes extend the `CastsAttributes`. Classes that implement this interface must define a `get` and `set` method. The `get` method is responsible for transforming a raw value from the database into a cast value, while the `set` method should transform a cast value into a raw value that can be stored in the database. As an example, we will re-implement the built-in `json` cast type as a custom cast type:

```js
// casts/json.js
const { Model, CastsAttributes } = require('sutando');

class Json extends CastsAttributes {
  // Cast the given value.
  get(model, key, value, attributes) {
    try {
      return JSON.parse(value);
    } catch (e) {
      return null;
    }
  }

  // Prepare the given value for storage.
  set(model, key, value, attributes) {
    return JSON.stringify(value);
  }
}
```

Once you have defined a custom cast type, you may attach it to a model attribute using its class:

```js
const Json = require('./casts/json');

class User extends Model {
  // The attributes that should be cast.
  casts = {
    options: Json,
  };
}
```