import DefaultTheme from 'vitepress/theme'
import './styles/vars.css'
import './custom.css'

import AuthorDetail from './components/blog/AuthorDetail.vue'
import Post from './components/blog/Post.vue'
import PostAuthor from './components/blog/PostAuthor.vue'
import PostDetail from './components/blog/PostDetail.vue'
import Posts from './components/blog/Posts.vue'

export default {
  ...DefaultTheme,
  enhanceApp({ app }) {
    app.component('Posts', Posts)
    app.component('Post', Post)
    app.component('PostDetail', PostDetail)
    app.component('PostAuthor', PostAuthor)
    app.component('AuthorDetail', AuthorDetail)
  }
}
