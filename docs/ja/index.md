---
layout: home

title: Sutando
titleTemplate: モダンな Node.js ORM

hero:
  name: Sutando
  text: モダンな Node.js ORM
  tagline: データベース操作をよりシンプルに.
  image:
    src: /code.png
    alt: Sutando
  actions:
    - theme: brand
      text: 始める
      link: /ja/guide/getting-started
    - theme: alt
      text: GitHub で見る
      link: https://github.com/sutandojs/sutando

features:
  - icon: ✨
    title: 複数データベース対応
    details: MySQL, PostgreSQL, SQLite, MariaDB などに対応.
  - icon: ⚡️
    title: クエリビルダー
    details: データベースクエリの作成と実行に便利なインターフェースを提供.
  - icon: 🛠️
    title: トランザクション
    details: 使いやすいトランザクションシステム.
  - icon: ⛓️
    title: モデルリレーション
    details: モデルリレーションで複雑なデータクエリと操作を簡単に処理.
  - icon: 🔩
    title: マイグレーション
    details: チームでデータベーススキーマの定義を共有可能.
  - icon: 🪝
    title: フック
    details: モデル操作の各段階でカスタムロジックを実行.
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
