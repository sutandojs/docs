<script setup lang="ts">
import { useData } from 'vitepress'
import usePosts from '../../composables/usePosts'

const { allPosts: posts } = usePosts()

const { theme } = useData()
</script>

<template>
  <div class="mx-auto max-w-screen-xl lg:py-16 lg:px-6">
    <div class="mx-auto max-w-screen-sm text-center lg:mb-16 mb-8">
      <div class="mb-4 text-3xl lg:text-4xl tracking-tight font-extrabold text-[color:var(--vp-c-brand-light)] dark:text-[color:var(--vp-c-brand-dark)]">
        {{ theme.blog?.title }}
      </div>
      <p class="font-light sm:text-xl text-[color:var(--vp-c-text-light-1)] dark:text-[color:var(--vp-c-text-dark-1)]">
        {{ theme.blog?.description }}
      </p>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      <div v-for="post of posts" :key="post">
        <Post :post="post" />
      </div>
    </div>
  </div>
</template>
