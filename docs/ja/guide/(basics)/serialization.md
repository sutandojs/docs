---
description: "モデルとリレーションを配列や JSON に変換する方法と、hidden や visible プロパティで出力する属性を制御する方法を説明します。"
---

# シリアライズ

API を構築するときには、モデルとリレーションをオブジェクトや JSON に変換する必要がよくあります。Sutando には、こうした変換を行うための便利なメソッドと、モデルのシリアライズ表現に含める属性を制御するためのメソッドが用意されています。

## モデル & コレクションのシリアライズ {#serializing-models-collections}

### データオブジェクトへのシリアライズ

モデルとそのロード済みのリレーションを配列に変換するには、`toData` メソッドを使用します。このメソッドは再帰的であるため、すべての属性とすべてのリレーション（リレーションのリレーションも含む）がオブジェクトに変換されます。

```ts
const user = await User.query().with('roles').first();

return user.toData();
```

`attributesToData` メソッドは、モデルの属性をオブジェクトに変換しますが、リレーションは変換しません。

```ts
const user = await User.query().first();
 
return user.attributesToData();
```

コレクションインスタンスで `toData` メソッドを呼び出すことで、モデルのコレクション全体をデータオブジェクトに変換することもできます。

```ts
const users = await User.query().all();
 
return users.toData();
```

### JSON へのシリアライズ

モデルを JSON に変換するには、`toJson` メソッドを使用します。`toData` と同様に、`toJson` メソッドは再帰的であるため、すべての属性とリレーションが JSON に変換されます。Javascript がサポートする任意の JSON エンコードオプションを指定することもできます。

```ts
const user = await User.query().find(1);
 
return user.toJson();
 
return user.toJson(null, 2);
```

あるいは、モデルまたはコレクションを文字列にキャストすることもできます。その場合、モデルまたはコレクションの `toJson` メソッドが自動的に呼び出されます。

```ts
const user = await User.query().find(1);

return String(user);

return JSON.stringify(user);
```

モデルとコレクションは文字列にキャストされると JSON に変換されるため、Sutando のオブジェクトをルートから直接返すことができます。Sutando はモデルとコレクションを JSON にシリアライズするので、`c.json()` がそのまま出力します：

```ts
import { Hono } from 'hono';

const app = new Hono();

app.get('/', async (c) => {
  const user = await User.query().find(1);

  return c.json(user);
});
```

#### リレーション

Sutando モデルが JSON に変換されると、ロード済みのリレーションは自動的に JSON オブジェクトの属性として含まれます。

## JSON から属性を隠す

パスワードなど、モデルのデータオブジェクトまたは JSON 表現に含める属性を制限したい場合があります。そのためには、モデルに `hidden` プロパティを追加します。`hidden` プロパティの配列に列挙された属性は、モデルのシリアライズ表現に含まれません。

```ts
const { Model } = requre('sutando');

class User extends Model {
  hidden = ['password'];
}
```

あるいは、`visible` プロパティを使用して、モデルのデータオブジェクトと JSON 表現に含める属性の「許可リスト」を定義できます。`visible` 配列に存在しない属性はすべて、モデルがデータオブジェクトまたは JSON に変換されるときに非表示になります。

```ts
const { Model } = requre('sutando');

class User extends Model {
  visible = ['first_name', 'last_name'];
}
```

### 属性の可視性を一時的に変更する

特定のモデルインスタンスで、通常は非表示の属性を可視にしたい場合は、`makeVisible` メソッドを使用できます。`makeVisible` メソッドはモデルインスタンスを返します。

```ts
user.makeVisible('attribute').toData();

user.makeVisible(['attribute', 'another_attribute']).toData();
```

同様に、通常は表示される属性を非表示にしたい場合は、`makeHidden` メソッドを使用できます。

```ts
user.makeHidden('attribute').toData();

user.makeHidden(['attribute', 'another_attribute']).toData();
```

可視または非表示の属性をすべて一時的に上書きしたい場合は、それぞれ `setVisible` メソッドと `setHidden` メソッドを使用できます。

```ts
user.setVisible(['id', 'name']).toData();

user.setHidden(['email', 'password', 'remember_token']).toData();
```

## JSON への値の追加 [#appending-values-to-json]

モデルをデータオブジェクトや JSON に変換するときに、データベースに対応するカラムがない属性を追加したい場合があります。そのためには、まずその値のアクセサを定義します。

```ts
const { Model, Attribute } = requre('sutando');

class User extends Model {
  attributeIsAdmin() {
    return Attribute.make({
      get: (value, attributes) => (attributes.admin === 'yes')
    });
  }
}
```

アクセサを作成したら、モデルの appends プロパティにその属性名を追加します。アクセサのメソッドは「camelCase」で定義しますが、属性名は通常「snake_case」のシリアライズ表現で参照されることに注意してください。

```ts
const { Model } = requre('sutando');

class User extends Model {
  appends = ['is_admin'];
}
```

属性を appends リストに追加すると、モデルのデータオブジェクトと JSON 表現の両方に含まれます。appends 配列の属性は、モデルで設定された `visible` と `hidden` の設定にも従います。

### 実行時の追加

実行時に、`append` メソッドを使用してモデルインスタンスに追加の属性を追加するよう指示できます。または、`setAppends` メソッドを使用して、特定のモデルインスタンスの追加プロパティの配列全体を上書きできます。

```ts
user.append('is_admin').toData();
 
user.setAppends(['is_admin']).toData();
```
