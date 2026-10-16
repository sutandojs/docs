---
description: "接続が提供する transaction メソッドで一連の操作をデータベーストランザクション内で実行します。例外が発生すると全体がロールバックされます。"
---

# トランザクション

Sutando 接続が提供する `transaction` メソッドを使用すると、一連の操作をデータベーストランザクション内で実行できます。トランザクションのクロージャ内で例外がスローされると、トランザクションは自動的にロールバックされ、例外は再スローされます。クロージャが正常に実行されると、トランザクションは自動的にコミットされます。transaction メソッドを使用している間は、手動でのロールバックやコミットを気にする必要はありません：

```ts
import { sutando } from 'sutando';

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

## 手動でトランザクションを使用する

手動でトランザクションを開始し、ロールバックとコミットを完全に制御したい場合は、`sutando` が提供する `beginTransaction` メソッドを使用できます：

```ts
import { sutando } from 'sutando';

const db = sutando.connection();
const trx = await db.beginTransaction();
```

`rollback` メソッドでトランザクションをロールバックできます：

```ts
await trx.rollback();
```

最後に、`commit` メソッドでトランザクションをコミットできます：

```ts
await trx.commit();
```

以下は完全な例です：

```ts
import { sutando } from 'sutando';

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
