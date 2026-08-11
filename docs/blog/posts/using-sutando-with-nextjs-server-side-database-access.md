---
date: 2026-10-06
title: "Using Sutando with Next.js: Server-Side Database Access Made Easy"
tags: [Sutando, Next.js, React, Serverless, Node.js]
author: Dylan Yu
image: https://storage.sutando.org/og-1751395044936.jpg
---

![image](https://storage.sutando.org/og-1751395044936.jpg)

---

<PostDetail>

Next.js App Router makes server-side database access easier than ever. With Sutando, you can query your database from Server Components and Route Handlers using the same elegant Active Record API you'd use in any Node.js app.

## Setup

```bash
npx create-next-app@latest my-app
cd my-app
npm install sutando pg
```

## Database Configuration

Create a singleton connection that avoids creating multiple instances in development:

```ts
// lib/db.ts
import { sutando, Model } from 'sutando';

const globalForSutando = globalThis as unknown as { sutando?: typeof sutando };

if (!globalForSutando.sutando) {
  sutando.addConnection({
    client: 'pg',
    connection: {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    }
  });
  globalForSutando.sutando = sutando;
}

export { sutando, Model };
```

## Define Models

```ts
// lib/models.ts
import { Model } from './db';

class Post extends Model {
  table = 'posts';
  casts = { published: 'boolean' };
  relationAuthor() { return this.belongsTo(User, 'user_id'); }
  scopePublished(query) { return query.where('published', true); }
}

class User extends Model {
  table = 'users';
  relationPosts() { return this.hasMany(Post, 'user_id'); }
}

export { Post, User };
```

## Using in Server Components

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
      <h1>Blog</h1>
      {posts.map(post => (
        <article key={post.id}>
          <h2>{post.title}</h2>
          <p>By {post.author.name}</p>
          <p>{post.content.substring(0, 200)}...</p>
        </article>
      ))}
    </main>
  );
}
```

## Using in Route Handlers (API Routes)

```ts
// app/api/posts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Post } from '@/lib/models';

export async function GET() {
  const posts = await Post.query()
    .with('author')
    .published()
    .orderBy('created_at', 'desc')
    .limit(20)
    .get();
  return NextResponse.json(posts);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const post = await Post.create({
    ...body,
    published: false,
  });
  return NextResponse.json(post, { status: 201 });
}
```

## Dynamic Routes

```tsx
// app/blog/[slug]/page.tsx
import { Post } from '@/lib/models';
import { notFound } from 'next/navigation';

export default async function PostPage({ params }: { params: { slug: string } }) {
  const post = await Post.query()
    .with('author', 'comments')
    .where('slug', params.slug)
    .published()
    .first();

  if (!post) notFound();

  return (
    <article>
      <h1>{post.title}</h1>
      <p>By {post.author.name}</p>
      <div>{post.content}</div>
    </article>
  );
}
```

## Server Actions

```ts
// app/actions/posts.ts
'use server';
import { Post } from '@/lib/models';

export async function createPost(formData: FormData) {
  const post = await Post.create({
    title: formData.get('title'),
    content: formData.get('content'),
    user_id: 1, // from session
  });
  return post;
}
```

## Edge Runtime Considerations

Sutando works in Node.js runtime. For Edge runtime, use a driver adapter compatible with your database (e.g., `@neondatabase/serverless` for Neon PostgreSQL):

```ts
// For Neon serverless on Edge
sutando.addConnection({
  client: 'pg',
  connection: process.env.DATABASE_URL,
  pool: { min: 0, max: 1 },
});
```

## Conclusion

Sutando integrates seamlessly with Next.js App Router. Use it in Server Components for data fetching, Route Handlers for APIs, and Server Actions for mutations — all with the same Active Record API.

Learn more at [sutando.org](https://sutando.org/guide/getting-started.html).

</PostDetail>
