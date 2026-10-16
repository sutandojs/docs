---
description: "ブラウザで Sutando を実行できます。ブラウザ版ではモデル、属性、リレーションが動作しますが、クエリビルダなどのデータベース機能は含まれません。"
---

# ブラウザサポート

Sutando はサーバーサイドでの使用に加えて、ブラウザ環境での実行もサポートしています。ブラウザ版はモデル、属性、リレーションなどのコア機能をサポートしますが、クエリビルダのようなデータベース関連の機能は含まれていません。

## フルスタックフレームワークでの使用

Next.js や Nuxt.js のようなフルスタックフレームワークで作業する場合、モデルを一度定義するだけで、フロントエンドとバックエンドの両方で使用できます。これによりコードの一貫性が保たれ、重複した定義が不要になります。

ただし、モデルで Node.js 固有の機能（ファイルシステム操作など）を使用する必要がある場合は、次のようにコードを整理することを推奨します：

1. フロントエンドとバックエンドの両方で共有するロジックを含むベースモデルクラスを作成する
2. Node.js 固有の機能のために、ベースモデルを継承したサーバーサイドのモデルクラスを作成する

```typescript
// models/base/user.js - Shared base model
export class BaseUser extends Model {
  // Shared properties and methods
}

// models/server/user.js - Server-only model
export class User extends BaseUser {
  // Node.js specific features
}
```

## 主要な機能

### make 関数

`make` 関数は API のレスポンスデータをモデルインスタンスに変換し、アクセサやミューテーターを含むすべてのモデル機能を使用できるようにします。

```typescript
import { make } from 'sutando';
const user = make(User, data);
```

### makeCollection 関数

`makeCollection` 関数は、API レスポンスデータの配列をモデルインスタンスのコレクションに変換します。

```typescript
import { makeCollection } from 'sutando';
const users = makeCollection(User, data);
```

### makePaginator 関数

`makePaginator` 関数は、ページネーションされた API レスポンスデータを Paginator インスタンスに変換します。

```typescript
import { makePaginator } from 'sutando';
const pageData = makePaginator(User, data);
```

## 使用例

```typescript
// Convert API response to model instance
const response = await fetch('/api/users/1');
const data = await response.json();
const user = make(User, data);

// Use model accessors and other features
console.log(user.full_name);  // Assuming a full_name accessor exists

// Handle list data
const usersResponse = await fetch('/api/users');
const usersData = await usersResponse.json();
const users = makeCollection(User, usersData);

// Handle paginated data
const pageResponse = await fetch('/api/users?page=1');
const pageData = await response.json();
const paginator = makePaginator(User, pageData);