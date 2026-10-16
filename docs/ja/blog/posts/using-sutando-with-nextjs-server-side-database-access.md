---
date: 2026-10-06
title: "Sutando と Next.js：サーバーサイドデータベースアクセス"
type: blog
description: "Next.js App Router と Sutando を組み合わせて、サーバーコンポーネントからデータベースに直接アクセスする方法を解説します。"
authors: ["Dylan Yu"]
mode: center
---


Next.js App Router と Sutando を組み合わせて、サーバーコンポーネントからデータベースに直接アクセスする方法を解説します。

## セットアップ

```bash
npx create-next-app@latest my-app --typescript
cd my-app
npm install sutando mysql2
```

## データベース設定

```ts
// lib/database.ts
import { sutando } from 'sutando';

sutando.addConnection({
  client: 'mysql2',
  connection: {
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'my_app'
  }
});

export default sutando;
```

## モデル定義

```ts
// lib/models.ts
import { Model } from 'sutando';
import './database';

class User extends Model {
  table = 'users';
  relationPosts() {
    return this.hasMany(Post, 'user_id');
  }
}

class Post extends Model {
  table = 'posts';
  casts = { published: 'boolean' };
  relationUser() {
    return this.belongsTo(User, 'user_id');
  }
  scopePublished(query) {
    return query.where('published', true);
  }
}

export { User, Post };
```

## サーバーコンポーネントでの使用

```tsx
// app/blog/page.tsx
import { Post } from '@/lib/models';

export default async function BlogPage() {
  const posts = await Post.query()
    .with('user')
    .published()
    .orderBy('created_at', 'desc')
    .limit(10)
    .get();

  return (
    <main>
      <h1>ブログ</h1>
      {posts.map(post => (
        <article key={post.id}>
          <h2>{post.title}</h2>
          <p>著者: {post.user.name}</p>
          <p>{post.content}</p>
        </article>
      ))}
    </main>
  );
}
```

## 記事詳細ページ

```tsx
// app/blog/[slug]/page.tsx
import { Post } from '@/lib/models';
import { notFound } from 'next/navigation';

export default async function PostPage({ params }: { params: { slug: string } }) {
  const post = await Post.query()
    .with('user', 'comments.user')
    .where('slug', params.slug)
    .first();

  if (!post) notFound();

  return (
    <article>
      <h1>{post.title}</h1>
      <p>著者: {post.user.name}</p>
      <div>{post.content}</div>
      
      <h2>コメント</h2>
      {post.comments.map(comment => (
        <div key={comment.id}>
          <p>{comment.user.name}</p>
          <p>{comment.content}</p>
        </div>
      ))}
    </article>
  );
}
```

## Route Handlers での使用

```ts
// app/api/posts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Post } from '@/lib/models';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = Number(searchParams.get('page')) || 1;
  
  const posts = await Post.query()
    .with('user')
    .published()
    .orderBy('created_at', 'desc')
    .paginate(15, page);
  
  return NextResponse.json(posts);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const post = await Post.create(body);
  return NextResponse.json(post, { status: 201 });
}
```

## まとめ

Next.js App Router と Sutando の組み合わせで、サーバーコンポーネントから直接データベースにアクセスできます。API ルートを別途用意する必要がなく、シンプルなアーキテクチャが実現できます。

[ドキュメント](https://sutando.org/ja/guide/getting-started) でさらに詳しく。