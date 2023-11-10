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

# 序列化

构建 JSON API 时，经常需要把模型和关联转化为对象或 JSON。针对这些操作，Sutando 提供了一些便捷方法，以及对序列化中的属性控制。 

## 序列化模型 & 集合

### 序列化为对象

要转化模型及其加载的关联为对象，可以使用 `toData` 方法。这是一个递归的方法，因此所有的属性和关联（包括关联的关联）都将转化成数组：

```js
const user = await User.query().with('roles').first();

return user.toData();
```

`attributesToData` 方法可用于将模型的属性转换为对象，但不会转换其关联：

```js
const user = await User.query().first();
 
return user.attributesToData();
```

你还可以通过调用集合实例上的 `toData` 方法，将模型的全部集合转换为对象： 

```js
const users = await User.query().all();
 
return users.toData();
```

### 序列化为 JSON

方法 `toJson` 可以把模型转化成 JSON。和方法 `toData` 一样， `toJson` 方法也是递归的，因此所有属性和关联都会转化成 JSON, 你还可以指定由 Javascript 支持的 JSON 选项： 

```js
const user = await User.query().find(1);
 
return user.toJson();
 
return user.toJson(null, 2);
```

或者，你也可以将模型或集合转换为字符串，模型或集合上的 `toJson` 方法会自动调用：

```js
const user = await User.query().find(1);

return String(user);

return JSON.stringify(user);
```

由于模型和集合在转化为字符串的时候会转成 JSON， 因此可以在应用的路由或控制器中直接返回 Sutando 对象。你的 `express`/`Koa` 应用会自动将 Sutando 模型和集合序列化为 JSON：

```js
const app = require('express')();

app.get('/', async (req, res) => {
  const user = await User.query().find(1);

  res.send(user);
});
```

#### 关联关系

当一个模型被转化为 JSON 的时候，它加载的关联关系也将自动转化为 JSON 对象被包含进来。同时，通过「小驼峰」定义的关联方法，关联的 JSON 属性将会是「蛇形」命名。

## 隐藏 JSON 属性

有时要将模型对象或 JSON 中的某些属性进行隐藏，比如密码。则可以在模型中添加 `hidden` 属性。模型序列化后，`hidden` 数组中列出的属性将不会被显示：

```js
const { Model } = requre('sutando');

class User extends Model {
  hidden = ['password'];
}
```

此外，也可以使用属性 `visible` 定义一个模型数组和 JSON 可见的「白名单」。转化后的数组或 JSON 不会出现其他的属性：

```js
const { Model } = requre('sutando');

class User extends Model {
  visible = ['first_name', 'last_name'];
}
```

#### 临时修改可见属性

如果你想要在一个模型实例中显示隐藏的属性，你可以使用 `makeVisible` 方法。`makeVisible` 方法返回模型实例： 

```js
user.makeVisible('attribute').toData();

user.makeVisible(['attribute', 'another_attribute']).toData();
```

相应地，如果你想要在一个模型实例中隐藏可见的属性，你可以使用 `makeHidden` 方法。

```js
user.makeHidden('attribute').toData();

user.makeHidden(['attribute', 'another_attribute']).toData();
```

如果你想临时覆盖所有可见或隐藏的属性，你可以分别使用 `setVisible` 和 `setHidden` 方法:

```js
user.setVisible(['id', 'name']).toData();

user.setHidden(['email', 'password', 'remember_token']).toData();
```

## 追加 JSON 值

有时，需要在模型转换为对象或 JSON 时添加一些数据库中不存在字段的对应属性。要实现这个功能，首先要定义一个访问器：

```js
const { Model, Attribute } = requre('sutando');

class User extends Model {
  attributeIsAdmin() {
    return Attribute.make({
      get: (value, attributes) => (attributes.admin === 'yes')
    });
  }
}
```

然后，在模型属性 `appends` 中添加该属性名。注意，尽管访问器使用「驼峰命名法」方式定义，但是属性名通常以「蛇形命名法」的方式来引用：

```js
const { Model } = requre('sutando');

class User extends Model {
  appends = ['is_admin'];
}
```

使用 `appends` 方法追加属性后，它将包含在模型的对象和 JSON 中。`appends` 数组中的属性也将遵循模型上配置的 `visible` 和 `hidden` 设置。

#### 运行时追加

你可以在单个模型实例上使用 `append` 方法来追加属性。或者，使用 `setAppends` 方法来重写整个追加属性的数组： 

```js
user.append('is_admin').toData();
 
user.setAppends(['is_admin']).toData();
```