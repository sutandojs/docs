---
date: 2026-10-20
title: "Sutando プラグイン：ORM を拡張する"
type: blog
description: "Sutando はプラグインシステムで機能を拡張できます。独自のプラグインを作成して、モデルに新しいメソッドや機能を追加する方法を解説します。"
authors: ["Dylan Yu"]
mode: center
---


Sutando はプラグインシステムで機能を拡張できます。独自のプラグインを作成して、モデルに新しいメソッドや機能を追加する方法を解説します。

## プラグインの基本

Sutando のプラグインは、モデルにミックスインとして機能を追加します。

### シンプルなプラグイン

```ts
import { Model } from 'sutando';

// UUID プラグイン
const UUID = (Model) => {
  return class extends Model {
    static booted() {
      super.booted();
      
      this.creating((model) => {
        if (!model.id) {
          model.id = crypto.randomUUID();
        }
      });
    }
  };
};

// 使用例
class User extends UUID(Model) {
  table = 'users';
}
```

## 実践的なプラグイン例

### スラグ生成プラグイン

```ts
const Sluggable = (options = {}) => (Model) => {
  return class extends Model {
    static booted() {
      super.booted();
      
      const source = options.source || 'title';
      const target = options.target || 'slug';
      
      this.creating(async (model) => {
        if (!model[target]) {
          model[target] = model[source]
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-');
        }
      });
    }
  };
};

// 使用例
class Post extends Sluggable({ source: 'title' })(Model) {
  table = 'posts';
}
```

### 監査ログプラグイン

```ts
const Auditable = (Model) => {
  return class extends Model {
    static booted() {
      super.booted();
      
      this.creating((model) => {
        model.created_by = getCurrentUserId();
      });
      
      this.updating((model) => {
        model.updated_by = getCurrentUserId();
      });
    }
  };
};
```

## まとめ

Sutando のプラグインシステムを使えば、プロジェクト間で再利用可能な機能を簡単に作成できます。ミックスインパターンにより、柔軟にモデルを拡張できます。

[ドキュメント](https://sutando.org/ja/guide/plugin) でさらに詳しく。