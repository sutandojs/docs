---
outline: [2, 4]
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

# 插件

插件是一些独立的程序，可以给 Sutando 增加新功能和扩展已有功能

您可以加载多个插件来满足各类需求。

## 插件使用

例如 Sutando 自带了两个插件， `SoftDeletes` 可以让模型支持软删除，`HasUniqueIds` 则是提供字符串作为主键的功能。可以像这样使用插件：

```js
const { Model, compose, SoftDeletes, HasUniqueIds } = require('sutando');

class User extends SoftDeletes(Model) {}

class Post extends HasUniqueIds(SoftDeletes(Model)) {}
```

不过我们还是推荐使用 `compose` 助手函数来使用插件：

```js
const { Model, compose, SoftDeletes, HasUniqueIds } = require('sutando');

class User extends compose(Model, SoftDeletes) {}

class Post extends compose(Model, SoftDeletes, HasUniqueIds) {}
```

## 编写一个插件

如果可能，Sutando 插件应实现为 class mixin。`mixin` 只是一个以类作为参数并返回子类的函数。

```js
const SomeMixin = (Model) => {
  return class extends Model {
    // 你的插件代码
  }
}
```

为了更好地理解如何构建 Sutando 插件，我们可以试着写一个简单的插件，功能是为文章模型可以根据标题自动设置 `slug`。

建议在一个单独的文件中创建并导出它，以保证更好地管理逻辑，如下所示：

```js
// plugins/sutando-slug.js
const _ = require('lodash');

const HasSlug = (Model) => {
  return class extends Model {
    static booted() {
      // 执行父类的 booted
      Model.booted();

      // 设置 creating 钩子
      this.creating(model => {
        // 如果没有设置 slug，那么根据 title 属性自动生成
        if (model.slug === undefined) {
          model.slug = _.kebabCase(model.title);
        }
      });
    }
  }
}

module.exports = HasSlug;
```

这个例子之中使用了[钩子](hooks)，完成之后，可以这样使用插件：

```js
const { Model, compose } = require('sutando');
const HasSlug = require('./plugins/sutando-slug');

class Post extends compose(
  Model,
  HasSlug
) {
  // ...
}

const post = new Post;
post.title = 'The First Post Title';
await post.save();

console.log(post.slug); // the-first-post-title
```

那么有个问题，如果我的数据库字段名称不是 `slug`，而是 `slug_name`，或者其他名称呢？我们只需要调整一下插件，让它能够接受一个字段名参数：

```js{4,13,14,15}
// plugins/sutando-slug.js
const _ = require('lodash');

const HasSlug = ({ column }) => (Model) => {
  return class extends Model {
    static booted() {
      // 执行父类的 booted
      Model.booted();

      // 设置 creating 钩子
      this.creating(model => {
        // 如果没有设置 slug，那么根据 title 属性自动生成
        if (model[column] === undefined) {
          model[column] = _.kebabCase(model.title);
        }
      });
    }
  }
}

module.exports = HasSlug;
```

使用方式也会改变：

```js{6}
const { Model, compose } = require('sutando');
const HasSlug = require('./plugins/sutando-slug');

class Post extends compose(
  Model,
  HasSlug({ column: 'custom_slug' })
) {
  // ...
}

const post = new Post;
post.title = 'The First Post Title';
await post.save();

console.log(post.custom_slug); // the-first-post-title
```

### 添加资源

如果你将插件发布到 npm，而且它包含 [数据库迁移](migrations)，你可以将迁移文件放在包的 `migrations` 目录下。  
你的用户可以执行 `sutando migrate:publish <你的包名>` 将迁移文件复制到用户项目的迁移目录中。
