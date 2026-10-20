---
date: 2026-10-06
title: "在 Next.js 中使用 Sutando：轻松实现服务端数据库访问"
type: blog
description: "Next.js App Router 让服务端数据库访问比以往更简单。使用 Sutando，你可以在 Server Components 和 Route Handlers 中使用同样的 Active Record API 查询数据库。"
authors: ["Dylan Yu"]
mode: center
---


Next.js App Router 让服务端数据库访问比以往更简单。使用 Sutando，你可以在 Server Components 和 Route Handlers 中使用同样的 Active Record API 查询数据库。

## 安装

```bash
npx create-next-app@latest my-app
cd my-app
npm install sutando pg
```

## 数据库配置

创建单例连接，避免开发环境创建多个实例：

```ts
// lib/db.ts
import { sutando, Model } from 'sutando';

const globalForSutando = globalThis as unknown as { sutando?: typeof sutando };

if (!globalForSutando.sutando) {
  sutando.addConnection({
    client: 'pg',
    connection: { /* ... */ }
  });
  globalForSutando.sutando = sutando;
}

export { sutando, Model };
```

## 在 Server Components 中使用

```tsx
// app/blog/page.tsx
import { Post } from '@/lib/models';

export default async function BlogPage() {
  const posts = await Post.query()
    .with('author')
    .published()
    .orderBy('created_at', 'desc')
    .limit(20)
    .get();

  return (
    <main>
      <h1>博客</h1>
      {posts.map(post => (
        <article key={post.id}>
          <h2>{post.title}</h2>
          <p>作者：{post.author.name}</p>
        </article>
      ))}
    </main>
  );
}
```

## 在 API 路由中使用

```ts
// app/api/posts/route.ts
export async function GET() {
  const posts = await Post.query().with('author').published().get();
  return NextResponse.json(posts);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const post = await Post.query().create({ ...body, published: false });
  return NextResponse.json(post, { status: 201 });
}
```

## Server Actions

```ts
'use server';
export async function createPost(formData: FormData) {
  const post = await Post.query().create({
    title: formData.get('title'),
    content: formData.get('content'),
  });
  return post;
}
```

## 总结

Sutando 与 Next.js App Router 无缝集成。在 Server Components 中获取数据，在 Route Handlers 中处理 API，在 Server Actions 中处理数据变更——全部使用同一个 Active Record API。

了解更多请访问 [sutando.org](https://sutando.org/zh_CN/guide/getting-started)。