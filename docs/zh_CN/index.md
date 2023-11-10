---
layout: home

title: Sutando
titleTemplate: 现代 Node.js ORM

hero:
  name: Sutando
  text: 现代 Node.js ORM
  tagline: 与数据库交互变得更轻松.
  image:
    src: /code.png
    alt: Sutando
  actions:
    - theme: brand
      text: 开始
      link: /zh_CN/guide/getting-started
    - theme: alt
      text: 在 GitHub 上查看
      link: https://github.com/sutandojs/sutando

features:
  - icon: ✨
    title: 支持多种数据库
    details: 支持 MySQL, PostgreSQL, SQLite, MariaDB 等等.
  - icon: ⚡️
    title: 查询构造器
    details: 为创建和运行数据库查询提供了方便的接口.
  - icon: 🛠️
    title: 事务
    details: 易于使用的事务系统
  - icon: ⛓️
    title: 模型关联
    details: 模型关联，方便处理复杂的数据查询和操作.
  - icon: 🔩
    title: 数据迁移
    details: 稍后支持.
  - icon: 🪝
    title: 钩子
    details: 在不同的模型操作阶段执行自定义逻辑.
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