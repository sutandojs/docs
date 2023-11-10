<script setup>
import { useRoute } from 'vitepress'

const route = useRoute()

if (typeof _hmt != "undefined") {
  if (route?.path) {
    window._hmt.push(['_trackPageview', route.path]);
  }
}
</script>

# 钩子

Sutando 模型触发几个事件，允许你挂接到模型生命周期的如下节点： `creating`, `created`, `updating`, `updated`, `saving`, `saved`, `deleting`, `deleted`, `restoring`, `restored`, `trashed`, `forceDeleting`, `forceDeleted`. 

以 `-ing` 结尾的事件名称在模型的任何更改被持久化之前被调度，而以 `-ed` 结尾的事件在对模型的更改被持久化之后被调度。

## 可用的钩子

|  钩子  |  介绍  |
|  ----  | ----  |
|  `creating`, `created`  |  第一次保存新模型时  |
|  `updating`, `updated`  |  当修改现有模型并调用 `save` 方法时  |
|  `saving`, `saved`  |  当创建或更新模型时 - 即使模型的属性没有改变  |
|  `deleting`, `deleted`  |  删除模型时，包括软删除  |
|  `restoring`, `restored`  |  恢复模型时  |
|  `trashed`  |  软删除后  |
|  `forceDeleteing`, `forceDeleted`  |  物理删除后  |

:::tip
在使用 Sutando 进行批量更新或删除查询时，受影响的模型不会触发 `saved`、`updated`、`deleting` 和 `deleted` 等事件。这是因为在执行批量更新或删除操作时，实际上没有检索到这些模型，所以也就不会触发这些事件。
:::

## 声明钩子

目前有两种方式添加钩子：

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

## 钩子与事务

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
