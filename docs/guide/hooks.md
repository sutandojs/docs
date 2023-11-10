<script setup>
import { useRoute } from 'vitepress'

const route = useRoute()

if (typeof _hmt != "undefined") {
  if (route?.path) {
    window._hmt.push(['_trackPageview', route.path]);
  }
}
</script>

# Hooks

Sutando models dispatch several events, allowing you to hook into the following moments in a model's lifecycle: `creating`, `created`, `updating`, `updated`, `saving`, `saved`, `deleting`, `deleted`, `restoring`, `restored`, `trashed`, `forceDeleting` and `forceDeleted`. 

Event names ending with `-ing` are dispatched before any changes to the model are persisted, while events ending with `-ed` are dispatched after the changes to the model are persisted.

## Available hooks

|  Hook  |  Description  |
|  ----  | ----  |
|  `creating`, `created`  |  When a new model is saved for the first time  |
|  `updating`, `updated`  |  When an existing model is modified and the `save` method is called  |
|  `saving`, `saved`  |  When a model is created or updated - even if the model's attributes have not been changed  |
|  `deleting`, `deleted`  |  When a model is deleted, include soft deletes  |
|  `restoring`, `restored`  |  When a model is restored  |
|  `trashed`  |  When a model is soft deleted  |
|  `forceDeleteing`, `forceDeleted`  |  When a model is hard deleted  |

:::tip
When issuing a mass update or delete query via Sutando, the `saved`, `updated`, `deleting`, and `deleted` model events will not be dispatched for the affected models. This is because the models are never actually retrieved when performing mass updates or deletes.
:::

## Declaring Hooks

There are currently two ways to programmatically add hooks:

```js
class User extends Model {}

User.creating(user => {
  //
});
```

```js
class User {
  static booted() {
    this.creating(user => {
      //
    });

    this.created(user => {
      //
    });
  }
}
```

## Hooks and Transactions

```js
User.deleted(async (user, { client }) => {
  const query = user.related('posts');

  if (client) {
    query.transacting(client);
  }

  await query.delete();
});

const trx = await sutando.beginTransaction();

await user.delete({
  client: trx
});

await trx.commit();
```
