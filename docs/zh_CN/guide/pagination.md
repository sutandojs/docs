<script setup>
import { useRoute } from 'vitepress'

const route = useRoute()

if (typeof _hmt != "undefined") {
  if (route?.path) {
    window._hmt.push(['_trackPageview', route.path]);
  }
}
</script>

# 分页

Sutando 内置了对基于偏移的分页的支持。 您可以通过链接 `paginate` 方法对查询结果进行分页。

`paginate` 方法接受要页码作为第一个参数，将每页行数作为第二个参数。 在内部，我们执行一个额外的查询来计算总行数。

## 基本用法

```js
const users = await db.table('users')
  .where('vote', '>', 1)
  .paginate(2, 15); // instanceof Paginator

const users = await User.query()
  .where('vote', '>', 1)
  .paginate(2); // instanceof Paginator

const users = await db.table('users')
  .where('vote', '>', 1)
  .forPage(2, 15)
  .get(); // instanceof Array

const users = await User.query()
  .where('vote', '>', 1)
  .forPage(1, 15)
  .get(); // instanceof Collection

users.map(user => {
  //
});
```

如果没有指定，每页行数默认为 15。如果使用模型，也可以通过设置 `perPage` 属性作为模型每页默认数量。

```js
class Post extends Model {}
class User extends Model {
  perPage = 20;
}

const posts = await Post.query().paginate();
console.log(posts.perPage()); // 15

const users = await User.query().paginate();
console.log(users.perPage()); // 20
```

`paginate` 方法返回一个 `Paginator` 实例。 它保存分页的元数据，以及获取的行。 

每个分页器实例通过以下方法提供额外的分页信息： 

|  方法 | 描述 |
|  ----  | ----  |
| `paginator.count()` | 获取当前页的数据总数 |
| `paginator.currentPage()` | 获取当前页码 |
| `paginator.hasMorePages()` | 是否有更多的页面可供展示 |
| `paginator.items()` | 获取当前页的数据项 |
| `paginator.lastPage()` | 获取最后一页的页码 |
| `paginator.perPage()` | 获取每一页显示的数量总数 |
| `paginator.total()` | 获取结果集中的数据总数 |


## 序列化为对象/JSON

您还可以通过调用 `toData` 或 `toJson` 方法将分页器结果序列化为 Object/JSON。 它默认返回「蛇形命名」中的键名。 

```JSON
{
  "total": 45,
  "per_page": 15,
  "current_page": 1,
  "last_page": 3,
  "count": 15,
  "data": [
    {
      // Record...
    },
    {
      // Record...
    }
  ],
}
```

分页器在转化为字符串的时候会转成 JSON， 因此可以在应用的路由或控制器中直接。你的 express/Koa 应用会自动序列化为 JSON：

```js
const app = require('express')();

app.get('/', async (req, res) => {
  const users = await User.query().paginate(req.query.page || 1);

  res.send(users);
});
```


