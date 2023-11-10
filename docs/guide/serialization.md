<script setup>
import { useRoute } from 'vitepress'

const route = useRoute()

if (typeof _hmt != "undefined") {
  if (route?.path) {
    window._hmt.push(['_trackPageview', route.path]);
  }
}
</script>

# Serialization

When building APIs you will often need to convert your models and relationships to object or JSON. Sutando includes convenient methods for making these conversions, as well as controlling which attributes are included in the serialized representation of your models.

## Serializing Models & Collections

### Serializing To Data Object

To convert a model and its loaded relationships to an array, you should use the `toData` method. This method is recursive, so all attributes and all relations (including the relations of relations) will be converted to object:

```js
const user = await User.query().with('roles').first();

return user.toData();
```

The `attributesToData` method may be used to convert a model's attributes to an object but not its relationships:

```js
const user = await User.query().first();
 
return user.attributesToData();
```

You may also convert entire collections of models to data object by calling the `toData` method on the collection instance:

```js
const users = await User.query().all();
 
return users.toData();
```

### Serializing To JSON

To convert a model to JSON, you should use the `toJson` method. Like `toData`, the `toJson` method is recursive, so all attributes and relations will be converted to JSON. You may also specify any JSON encoding options that are supported by Javascript:

```js
const user = await User.query().find(1);
 
return user.toJson();
 
return user.toJson(null, 2);
```

Alternatively, you may cast a model or collection to a string, which will automatically call the `toJson` method on the model or collection:

```js
const user = await User.query().find(1);

return String(user);

return JSON.stringify(user);
```

Since models and collections are converted to JSON when cast to a string, you can return Sutando objects directly from your `express`/`Koa` application. Sutando will automatically serialize your models and collections to JSON when they are returned from routes or controllers:

```js
const app = require('express')();

app.get('/', async (req, res) => {
  const user = await User.query().find(1);

  res.send(user);
});
```

#### Relationships

When an Sutando model is converted to JSON, its loaded relationships will automatically be included as attributes on the JSON object.

## Hiding Attributes From JSON

Sometimes you may wish to limit the attributes, such as passwords, that are included in your model's data object or JSON representation. To do so, add a `hidden` property to your model. In attributes that are listed in the `hidden` property's array will not be included in the serialized representation of your model:

```js
const { Model } = requre('sutando');

class User extends Model {
  hidden = ['password'];
}
```

Alternatively, you may use the `visible` property to define an "allow list" of attributes that should be included in your model's data objectt and JSON representation. All attributes that are not present in the `visible` array will be hidden when the model is converted to an data objectt or JSON:

```js
const { Model } = requre('sutando');

class User extends Model {
  visible = ['first_name', 'last_name'];
}
```

#### Temporarily Modifying Attribute Visibility

If you would like to make some typically hidden attributes visible on a given model instance, you may use the `makeVisible` method. The `makeVisible` method returns the model instance:

```js
user.makeVisible('attribute').toData();

user.makeVisible(['attribute', 'another_attribute']).toData();
```

Likewise, if you would like to hide some attributes that are typically visible, you may use the `makeHidden` method.

```js
user.makeHidden('attribute').toData();

user.makeHidden(['attribute', 'another_attribute']).toData();
```

If you wish to temporarily override all of the visible or hidden attributes, you may use the `setVisible` and `setHidden` methods respectively:

```js
user.setVisible(['id', 'name']).toData();

user.setHidden(['email', 'password', 'remember_token']).toData();
```

## Appending Values To JSON

Occasionally, when converting models to data object or JSON, you may wish to add attributes that do not have a corresponding column in your database. To do so, first define an accessor for the value:

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

After creating the accessor, add the attribute name to the appends property of your model. Note that attribute names are typically referenced using their "snake case" serialized representation, even though the accessor's method is defined using "camel case":

```js
const { Model } = requre('sutando');

class User extends Model {
  appends = ['is_admin'];
}
```

Once the attribute has been added to the appends list, it will be included in both the model's data object and JSON representations. Attributes in the appends array will also respect the `visible` and `hidden` settings configured on the model.

#### Appending At Run Time

At runtime, you may instruct a model instance to append additional attributes using the `append` method. Or, you may use the `setAppends` method to override the entire array of appended properties for a given model instance:

```js
user.append('is_admin').toData();
 
user.setAppends(['is_admin']).toData();
```