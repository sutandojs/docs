<script setup lang='ts'>
import type { Post } from '../../composables/posts.data'
import { useData } from 'vitepress'
import useAuthors from '../../composables/useAuthors'
import PostAuthor from './PostAuthor.vue'

const props = defineProps<{
  post: Post
}>()
const { site } = useData()
const { findByName } = useAuthors()
const author = findByName(props.post.author)
</script>

<template>
  <div :key="post.id" class="group cursor-pointer flex flex-col gap-4">
    <div class="group overflow-hidden relative aspect-[2/1] rounded-lg transition-all">
      <a :href="`${site.base}blog${post.href}`">
        <div class="relative w-full h-full">
          <img
            :alt="`Blog Post Image of ${post.title}`"
            :title="`Blog Post Image of ${post.title}`"
            loading="lazy"
            decoding="async"
            data-nimg="fill"
            class="object-cover object-left image-scale absolute inset-0 w-full h-full"
            :src="post.data.image"
          />
          <div class="absolute left-2 bottom-2 opacity-100 transition-opacity duration-300">
            <div class="flex flex-wrap gap-1">
              <span v-for="tag of post.data.tags" :key="tag" class="text-xs font-medium text-white bg-black bg-opacity-50 px-2 py-1 rounded-md">
                {{ tag }}
              </span>
            </div>
          </div>
        </div>
      </a>
    </div>
    <div class="flex flex-col flex-grow">
      <div>
        <div class="text-lg font-medium">
          <a :href="`${site.base}blog${post.href}`">
            <span class="">
              {{ post.title }}
            </span>
          </a>
        </div>
      </div>
      <div class="mt-auto pt-4 flex items-center justify-between space-x-4 text-muted-foreground">
        <div class="flex items-center gap-2">
          <div class="relative h-5 w-5 flex-shrink-0">
            <img
              :alt="`avatar for ${author}`"
              loading="lazy"
              decoding="async"
              data-nimg="fill"
              class="rounded-full object-cover border absolute inset-0 w-full h-full"
              :src="`${author?.data?.avatar}`"
            />
          </div>
          <span class="truncate text-sm">{{ author?.name }}</span>
        </div>
        <time
          class="truncate text-sm"
          :datetime="post.date.since"
        >
          {{ post.date.since }}
        </time>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
