<script setup>
import { useRoute } from 'vitepress'

const route = useRoute()

if (typeof _hmt != "undefined") {
  if (route?.path) {
    window._hmt.push(['_trackPageview', route.path]);
  }
}
</script>

# Transactions

You may use the `transaction` method provided by the Sutando connection to run a set of operations within a database transaction. If an exception is thrown within the transaction closure, the transaction will automatically be rolled back and the exception is re-thrown. If the closure executes successfully, the transaction will automatically be committed. You don't need to worry about manually rolling back or committing while using the transaction method:

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

### Manually Using Transactions

If you would like to begin a transaction manually and have complete control over rollbacks and commits, you may use the `beginTransaction` method provided by the `sutando`:

```js
const { sutando } = require('sutando');

const db = sutando.connection();
const trx = await db.beginTransaction();
```

You can rollback the transaction via the `rollback` method:

```js
await trx.rollback();
```

Lastly, you can commit a transaction via the `commit` method:

```js
await trx.commit();
```

Here is a complete example:

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
