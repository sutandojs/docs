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

# 属性修改器

访问器、修改器允许您在模型实例上检索或设置 Sutando 属性值时对其进行转换。

## 访问器 & 修改器

### 定义一个访问器

若要定义一个访问器，请在模型中创建一个「驼峰式」命名的 `attribute{Attribute}` 方法来表示可访问属性。此方法名称对应到真正的底层模型 `属性/数据库字段` 的表示。

在这个示例中，我们将为 `first_name` 属性定义一个访问器。当 Sutando 尝试获取 `first_name` 属性时，将自动调用此访问器。 

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

所有访问器方法都返回一个 `Attribute` 实例，该实例定义了如何访问该属性以及如何改变该属性。 在此示例中，我们仅定义如何访问该属性。 为此，我们将 `get` 参数提供给 `Attribute` 类构造函数。

如你所见，字段的原始值被传递到访问器中，允许你对它进行处理并返回结果。如果想获取被修改后的值，你可以在模型实例上访问 `first_name` 属性： 

```js
const user = await User.query().find(1);
 
const firstName = user.first_name;
```

:::tip
如果要将这些计算值添加到模型的 Object / JSON 中表示，[你需要追加它们](serialization.html#追加-json-值).
:::

当然，你也可以通过已有的属性值，使用访问器返回新的计算值。你的 `get` 闭包可以接受 `attributes` 的第二个参数，该参数将自动提供给闭包，并将包含模型所有当前属性： 

```js
attributeFullName() {
  return Attribute.make({
    get: (value, attributes) => `${attributes.first_name} ${attributes.last_name}`
  })
}
```

### 定义一个修改器

修改器会在设置属性时生效。要定义修改器，可以在定义属性时提供 `set` 参数。让我们为 `first_name` 属性定义一个修改器。这个修改器将会在我们修改 `first_name` 属性的值时自动调用：

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

修改器会获取属性已经被设置的值，并允许你修改并且将其值设置到 Sutando 模型内部的 `attributes` 属性上。
使用修改器，我们只需要设置 Sutando 模型的 `first_name` 属性即可： 

```js
const user = User.query().find(1);

user.first_name = 'Sally';
```

在本例中，值 `Sally` 将会触发 `set` 回调。然后，修改器会使用 `toLocalLowerCase` 方法处理姓名，并将结果值设置在模型的 `attributes` 中。

#### 修改多个属性

有时你的修改器可能需要修改底层模型的多个属性。 为此，你的 `set` 闭包可以返回一个对象，对象中的每个键都应该与模型的属性 / 数据库列相对应：

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

## 属性转换

属性转换提供了类似于访问器和修改器的功能，且无需在模型上定义任何其他方法。模型中的 `casts` 属性提供了一个便利的方法来将属性转换为常见的数据类型。

`casts` 属性应是一个对象，且键是那些需要被转换的属性名称，值则是你希望转换的数据类型。支持转换的数据类型有：

- `integer` `int`
- `float` `double`
- `string`
- `boolean` `bool`
- `collection`
- `date`
- `datetime`
- `json` `object`

示例， 让我们把以整数（`0` 或 `1`）形式存储在数据库中的 `is_admin` 属性转成布尔值：

```js
const { Model } = require('sutando');

class User extends Model {
  // 类型转换。
  casts = {
    is_admin: 'boolean',
  };
}
```

现在当你访问 `is_admin` 属性时，虽然保存在数据库里的值是一个整数类型，但是返回值总是会被转换成布尔值类型：

```js
const user = await User.query().find(1);

if (user.is_admin) {
  // ...
}
```

:::tip
值属性将不会被转换。此外，禁止定义与关联同名的类型转换（或属性）。
:::

### JSON 转换

当你在数据库存储序列化的 `JSON` 的数据时， `json` 类型的转换非常有用。比如：如果你的数据库具有被序列化为 JSON 的 `JSON` 或 `TEXT` 字段类型，并且在 Sutando 模型中加入了 `json` 类型转换，那么当你访问的时候就会自动解析：

```js
const { Model } = require('sutando');

class User extends Model {
    // 类型转换。
    casts = {
      options: 'json',
    };
}
```

一旦定义了转换，你访问 `options` 属性时他会自动从 `JSON` 类型反序列化。当你设置了 `options` 属性的值时，给定的数据也会自动序列化为 JSON 类型存储：

```js
const { Model } = require('sutando');

const user = await User.query().find(1);

const options = user.options;

options.key = value;

user.options = options;

await user.save();
```

:::tip
直接修改属性本身不能更新模型数据，所以下面的用法是错误的：
```js
const user = await User.query().find(1);

user.options.key = value;
```
:::

### Date 转换

默认情况下，Sutando 会将 `created_at` 和 `updated_at` 列转换为 `Date` 的实例。您可以通过在模型的 `casts` 属性中定义其他日期转换来转换其他日期属性。通常，应使用 `datetime` 转换类型来转换日期。

定义 `date` 或 `datetime` 转换时，您还可以指定日期的格式。[当模型序列化为对象或 JSON 时](serialization)，将使用这个格式：

```js
casts = {
  created_at: 'datetime:YYYY-MM-DD',
};
```

通过在模型中定义 `serializeDate` 方法，你可以自定义所有模型日期的默认序列化格式。此方法不会影响日期在数据库中存储的格式：

```js
const dayjs = require('dayjs');

class User extends Model {
  serializeDate(date) {
    return dayjs(date).format('YYYY-MM-DD');
  }
}
```

要指定在数据库中实际存储模型日期时应使用的格式，您应该在模型上定义一个 `dateFormat` 属性：

```js
class User extends Model {
  dateFormat = 'X'
}
```

支持的格式化占位符列表

| 占位符 | 输出 | 详情 |
|  ----  | ----  | ----  |
| `YY` | 18 | 两位数的年份 |
| `YYYY` | 2018 | 四位数的年份 |
| `M` | 1-12 | 月份，从 1 开始 |
| `MM` | 01-12 | 月份，两位数 |
| `MMM` | Jan-Dec | 缩写的月份名称 |
| `MMMM` | January-December | 完整的月份名称 |
| `D` | 1-31 | 月份里的一天 |
| `DD` | 01-31 | 月份里的一天，两位数 |
| `d` | 0-6 | 一周中的一天，星期天是 0 |
| `dd` | Su-Sa | 最简写的星期几 |
| `ddd` | Sun-Sat | 简写的星期几 |
| `dddd` | Sunday-Saturday | 星期几 |
| `H` | 0-23 | 小时 |
| `HH` | 00-23 | 小时，两位数 |
| `h` | 1-12 | 小时, 12 小时制 |
| `hh` | 01-12 | 小时, 12 小时制, 两位数 |
| `m` | 0-59 | 分钟 |
| `mm` | 00-59 | 分钟，两位数 |
| `s` | 0-59 | 秒 |
| `ss` | 00-59 | 秒 两位数 |
| `SSS` | 000-999 | 毫秒 三位数 |
| `Z` | +05:00 | UTC 的偏移量，±HH:mm |
| `ZZ` | +0500 | UTC 的偏移量，±HHmm |
| `A` | AM PM |  |
| `a` | am pm |  |
| `Q` | 1-4 | 季度 |
| `Do` | 1st 2nd ... 31st | 带序数词的月份里的一天 |
| `k` | 1-24 | 时：由 1 开始 |
| `kk` | 01-24 | 时：由 1 开始，两位数 |
| `X` | 1360013296 | 秒为单位的 Unix 时间戳 |
| `x` | 1360013296123 | 毫秒单位的 Unix 时间戳 |

#### 日期转换，序列化，& 时区

默认情况下，`date` 和 `datetime` 会序列化为 UTC ISO-8601 格式的（ 2012-12-12T12:25:36.000000Z ）字符串，并不会受到应用的时区配置影响。

如果对 `date` 或 `datetime` 属性自定义了格式，例如 `datetime:YYYYY-MM-DD HH:mm:ss`，那么在日期序列化期间将使用 UTC 时区。

### 自定义类型转换

Sutando 有多种内置的、有用的类型转换； 如果需要自定义强制转换类型。要创建一个类型转换，转换类需要继承 `CastsAttributes` 类，并定义一个 `get` 和 `set` 方法。`get` 方法负责将数据库中的原始值转换为转换值，而 `set` 方法应将转换值转换为可以存储在数据库中的原始值。 作为示例，我们将内置的 `json` 类型转换重新实现为自定义类型：

```js
// casts/json.js
const { Model, CastsAttributes } = require('sutando');

class Json extends CastsAttributes {
  // 将取出的数据进行转换。
  static get(model, key, value, attributes) {
    try {
      return JSON.parse(value);
    } catch (e) {
      return null;
    }
  }

  // 转换成将要进行存储的值。
  static set(model, key, value, attributes) {
    return JSON.stringify(value);
  }
}
```

定义好自定义类型转换后，可以使用其类名称将其附加到模型属性里：

```js
const Json = require('./casts/json');

class User extends Model {
  // 应被强制转换的属性。
  casts = {
    options: Json,
  };
}
```