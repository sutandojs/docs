<script setup lang="ts">
import { useData } from 'vitepress'
import useAuthors from '../../composables/useAuthors'
import usePosts from '../../composables/usePosts'

const { site } = useData()

const { currentPost: post, prevPost, nextPost } = usePosts()
const { findByName } = useAuthors()
const author = findByName(post.value.author)
</script>

<template>
  <div>
    <div>
      <div class="text-4xl font-bold text-[color:var(--vp-c-text-light-1)] dark:text-[color:var(--vp-c-text-dark-1)]">
        <span>{{ post.title }}</span>
      </div>

      <div class="mt-6 flex justify-between items-center text-gray-500">
        <PostAuthor :author="author" />
        <span class="text-sm">{{ post.date.since }}</span>
      </div>

      <!-- <div class="flex justify-between items-center mt-2 text-gray-500">
        <a
          v-if="prevPost" :href="`${site.base}blog${prevPost.href}`"
          class="inline-flex items-center font-medium dark:text-white hover:text-[color:var(--vp-c-brand-dark)]"
        >
          <div class="i-bx:arrow-back mr-2" />
          <span>Previous Post</span>
        </a>
        <div v-if="!prevPost" />
        <a
          v-if="nextPost" :href="`${site.base}blog${nextPost.href}`"
          class="inline-flex items-center font-medium dark:text-white hover:text-[color:var(--vp-c-brand-dark)]"
        >
          <span>Next Post</span>
          <div class="i-bx:right-arrow-alt ml-2" />
        </a>
      </div> -->
    </div>
    <slot />
    <div class="flex items-center justify-start mt-16">
      <a class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 flex items-center gap-2" data-discover="true" href="/blog">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-left w-4 h-4"><path d="m12 19-7-7 7-7"></path><path d="M19 12H5"></path></svg>Back to Blog</a>
    </div>
  </div>
</template>

<style scoped>
.vp-doc h1, h2, h3, hr {
  margin: 12px 0 0 0;
}
.vp-doc a {
  color: var(--vp-c-brand-dark);
  text-decoration: none;
}
</style>
