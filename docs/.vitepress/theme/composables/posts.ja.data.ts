import type { MarkdownRenderer } from 'vitepress'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { formatDistance } from 'date-fns'
import { ja } from 'date-fns/locale'
import { createMarkdownRenderer } from 'vitepress'
import useBlogFile from './useBlogFile'
import type { Post } from './posts.data'

let md: MarkdownRenderer
const { folderDir, readFrontMatter } = useBlogFile()

const dir = folderDir('posts', 'ja')

declare const data: Post[]
export { data }

async function load(): Promise<Post[]>
async function load() {
  md = md || (await createMarkdownRenderer(process.cwd()))
  const now = Date.now()
  return fs
    .readdirSync(dir)
    .map(file => getPost(file, dir))
    .filter(post => post.date.time <= now)
    .sort((a, b) => b.date.time - a.date.time)
}

export default {
  watch: path.join(dir, '*.md'),
  load,
}

const cache = new Map()

function getPost(file: string, postDir: string): Post {
  const fullPath = path.join(postDir, file)
  const timestamp = fs.statSync(fullPath).mtimeMs

  const { data, excerpt } = readFrontMatter(file, postDir, cache)

  const post: Post = {
    title: data.title,
    author: data.author ? data.author : 'Unknown',
    href: `/posts/${file.replace(/\.md$/, '.html')}`,
    date: formatDate(data.date),
    excerpt: excerpt && md.render(excerpt),
    data,
  }

  cache.set(fullPath, {
    timestamp,
    post,
  })
  return post
}

function formatDate(date: string | Date): Post['date'] {
  if (!(date instanceof Date))
    date = new Date(date)

  date.setUTCHours(12)

  return {
    time: +date,
    string: date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    since: formatDistance(date, new Date(), { addSuffix: true, locale: ja }),
  }
}
