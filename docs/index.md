---
layout: home

title: Sutando
titleTemplate: A modern Node.js ORM

hero:
  name: Sutando
  text: A modern Node.js ORM
  tagline: Makes it enjoyable to interact with your database.
  image:
    src: /code.png
    alt: Sutando
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/sutandojs/sutando

features:
  - icon: ✨
    title: Support Or Multiple Database
    details: MySQL, PostgreSQL, SQLite, MariaDB and other.
  - icon: ⚡️
    title: Query Builder
    details: A convenient, fluent interface to creating and running database queries.
  - icon: 🛠️
    title: Transactions
    details: Easy To Use Transactions.
  - icon: ⛓️
    title: Relationships
    details: Model relationships for handling complex data queries and operations.
  - icon: 🔩
    title: Migrations
    details: Allowing your team to define and share your application's database schema definition.
  - icon: 🪝
    title: Hooks
    details: Support for hooks to execute custom logic at different stages.
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