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

# Pagination

Sutando has inbuilt support for offset-based pagination. You can paginate the results of a query by chaining the `paginate` method.

The `paginate` method accepts the page number as the first argument and the rows to fetch as the second argument. Internally, we execute an additional query to count the total number of rows.

## Basic Usage

```js
const users = await db.table('users')
  .where('vote', '>', 1)
  .paginate(2, 15); // instanceof Paginator

const users = await User.query()
  .where('vote', '>', 1)
  .paginate(1, 15); // instanceof Paginator

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

If not specified, the number of lines per page defaults to 15. If using models, you can also set the `perPage` attribute as the default number of pages per model.

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

The `paginate` method returns an instance of the `Paginator` . It holds the meta data for the pagination, alongside the fetched rows.

Each paginator instance provides additional pagination information via the following methods:

|  Method | Description |
|  ----  | ----  |
| `paginator.count()` | Get the number of items for the current page. |
| `paginator.currentPage()` | Get the current page number. |
| `paginator.hasMorePages()` | Determine if there are more items in the data store. |
| `paginator.items()` | Get the items for the current page. |
| `paginator.lastPage()` | Get the page number of the last available page. |
| `paginator.perPage()` | The number of items to be shown per page. |
| `paginator.total()` | Determine the total number of matching items in the data store.  |


## Serializing to Object/JSON

You can also serialize the paginator results to Object/JSON by calling the `toData` or `toJson` method. It returns the key names in snake_case by default. However, you can pass a naming strategy to override the default convention.

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

### Custom Format

You can override the default format by calling the `Paginator.setFormatter` method.

```js
const { Paginator } = require('sutando');

Paginator.setFormatter((paginator) => {
  return {
    meta: {
      total: paginator.total(),
      per_page: paginator.perPage(),
      current_page: paginator.currentPage(),
      last_page: paginator.lastPage(),
    },
    data: paginator.items().toData(),
  };
});
```

The paginator will convert it to JSON when converting it to a string, so it can be used directly in the application's route or controller. Your express/Koa application will automatically serialize to JSON:

```js
const app = require('express')();

app.get('/', async (req, res) => {
  const users = await User.query().paginate(req.query.page || 1);

  res.send(users);
});
```



