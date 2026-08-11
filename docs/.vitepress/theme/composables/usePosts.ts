import type { Ref } from 'vue'
import type { Post } from './posts.data'
import { useData, useRoute } from 'vitepress'
import { computed, ref } from 'vue'
import { data } from './posts.data'
import { data as zhData } from './posts.zh.data'

export default () => {
  const { site } = useData()

  const route = useRoute()

  const isZh = route.path.startsWith('/zh_CN/')

  const allPosts: Ref<Post[]> = ref(isZh ? zhData : data)

  const blogPrefix = isZh ? '/zh_CN/blog' : '/blog'

  const path = route.path

  function findCurrentIndex() {
    return allPosts.value.findIndex(p => `${site.value.base}${blogPrefix.slice(1)}${p.href}` === route.path)
  }

  const currentPost = computed(() => allPosts.value[findCurrentIndex()])
  const nextPost = computed(() => allPosts.value[findCurrentIndex() - 1])
  const prevPost = computed(() => allPosts.value[findCurrentIndex() + 1])

  return { allPosts, currentPost, nextPost, prevPost, path, blogPrefix }
}
