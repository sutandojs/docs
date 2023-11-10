<script setup>
import { useRoute } from 'vitepress'

const route = useRoute()

if (typeof _hmt != "undefined") {
  if (route?.path) {
    window._hmt.push(['_trackPageview', route.path]);
  }
}
</script>

# 事务

您可以使用 Sutando 连接提供的 `transaction` 方法在数据库事务中运行一组操作。 如果在事务闭包中抛出异常，事务将自动回滚并重新抛出异常。 如果闭包成功执行，事务将自动提交。 在使用事务方法时，您无需担心手动回滚或提交：

```js
const { sutando } = require('sutando');

const db = sutando.connection();

await db.transaction(async (trx) => {
  await User.query().transacting(trx).create(/* ... */);
 
  await db.table('users').transacting(trx).insert(/* ... */);

  const user = new User;
  user.name = 'Sally';

  await user.save({
    client: trx,
  });
});
```

### 手动执行事务

如果您想手动开始事务并完全控制回滚和提交，您可以使用 `sutando` 提供的 `beginTransaction` 方法：

```js
const { sutando } = require('sutando');

const db = sutando.connection();
const trx = await db.beginTransaction();
```

您可以通过 `rollback` 方法回滚事务：

```js
await trx.rollback();
```

最后，您可以通过 `commit` 方法提交事务：

```js
await trx.commit();
```

下面是一个完整示例：

```js
const { sutando } = require('sutando');

const db = sutando.connection();
const trx = await db.beginTransaction();

try {
  const user = new User;
  user.name = 'Sally';

  await user.save({
    client: trx,
  });

  await trx.commit();
} catch (e) {
  await trx.rollback();

  console.log(e.stack);
}
```