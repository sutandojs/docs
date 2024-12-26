import { defineConfig } from 'vitepress'

const ogDescription = 'Next Generation Frontend Tooling'
const ogImage = 'https://sutandojs.org/og-image.png'
const ogTitle = 'Sutando'
const ogUrl = 'https://sutandojs.org'

// netlify envs
const deployURL = process.env.DEPLOY_PRIME_URL || ''
const commitRef = process.env.COMMIT_REF?.slice(0, 8) || 'dev'

const deployType = (() => {
  switch (deployURL) {
    case 'https://main--vite-docs-main.netlify.app':
      return 'main'
    case '':
      return 'local'
    default:
      return 'release'
  }
})()

export default defineConfig({
  title: `Sutando`,
  description: 'Next Generation Frontend Tooling',
  sitemap: {
    hostname: 'https://sutando.org'
  },
  lastUpdated: {
    text: 'Last updated',
  },
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: ogTitle }],
    ['meta', { property: 'og:image', content: ogImage }],
    ['meta', { property: 'og:url', content: ogUrl }],
    ['meta', { property: 'og:description', content: ogDescription }],
    ['meta', { name: 'theme-color', content: '#646cff' }],
    [
      'script',
      { async: true, src: 'https://www.googletagmanager.com/gtag/js?id=G-7FZTC6LCGT' }
    ],
    [
      'script',
      {},
      `window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
    
      gtag('config', 'G-7FZTC6LCGT');`
    ],
    [
      'script',
      { src: '//sdk.51.la/js-sdk-pro.min.js', id: 'LA_COLLECT' }
    ],
    [
      'script',
      {},
      `LA.init({id:"3GTDRxQc7dp6Mxt3",ck:"3GTDRxQc7dp6Mxt3",hashMode:true});`
    ],
    [
      'script',
      {},
      `var _hmt = _hmt || [];
      (function() {
        var hm = document.createElement("script");
        hm.src = "https://hm.baidu.com/hm.js?e115bdff9db487eb797f5e00b5b3d4e7";
        var s = document.getElementsByTagName("script")[0]; 
        s.parentNode.insertBefore(hm, s);
      })();`
    ]
  ],

  vue: {
    reactivityTransform: true
  },

  locales: {
    root: {
      label: 'English',
      lang: 'en'
    },
    zh_CN: {
      label: '中文',
      lang: 'zh_CN', // optional, will be added  as `lang` attribute on `html` tag
      link: '/zh_CN/', // default /fr/ -- shows on navbar translations menu, can be external

      themeConfig: {
        editLink: {
          text: '在 GitHub 上编辑此页面',
          pattern: 'https://github.com/sutandojs/docs/edit/main/docs/:path'
        },

        lastUpdated: {
          text: '最后更新于',
        },

        nav: [
          { text: '手册', link: '/zh_CN/guide/getting-started', activeMatch: '/zh_CN/guide/' },
          // { text: 'APIs', link: '/config/', activeMatch: '/api/' },
          { text: '示例', link: 'https://github.com/sutandojs/sutando-examples' },
          { text: '更新日志', link: 'https://github.com/sutandojs/sutando/releases' },
          // { text: 'Plugins', link: '/plugins/', activeMatch: '/plugins/' },
        ],
        sidebar: {
          '/zh_CN/guide/': [
            {
              text: '简介',
              items: [
                {
                  text: '开始',
                  link: '/zh_CN/guide/getting-started'
                },
                {
                  text: '安装',
                  link: '/zh_CN/guide/installation'
                }
              ]
            },
            {
              text: '基础',
              items: [
                {
                  text: '查询构造器',
                  link: '/zh_CN/guide/query-builder'
                },
                {
                  text: '模型',
                  link: '/zh_CN/guide/models'
                },
                {
                  text: '分页',
                  link: '/zh_CN/guide/pagination'
                },
                {
                  text: '模型关联',
                  link: '/zh_CN/guide/relationships'
                },
                {
                  text: '集合',
                  link: '/zh_CN/guide/collections'
                },
                {
                  text: '属性修改器',
                  link: '/zh_CN/guide/mutators'
                },
                {
                  text: '序列化',
                  link: '/zh_CN/guide/serialization'
                },
                {
                  text: '事务',
                  link: '/zh_CN/guide/transactions'
                },
                {
                  text: '数据迁移',
                  link: '/zh_CN/guide/migrations'
                },
                {
                  text: '钩子',
                  link: '/zh_CN/guide/hooks'
                },
                {
                  text: 'Typescript',
                  link: '/zh_CN/guide/typescript'
                },
              ]
            },
            {
              text: '插件',
              items: [
                {
                  text: '简介',
                  link: '/zh_CN/guide/plugin'
                },
                // {
                //   text: '示例',
                //   link: '/zh_CN/guide/transactions'
                // },
              ]
            }
          ],
        }
        // other locale specific properties...
      }
    }
  },

  themeConfig: {
    logo: '/logo.svg',

    socialLinks: [
      { icon: 'github', link: 'https://github.com/sutandojs/sutando' }
    ],

    search: {
      provider: 'local'
    },

    editLink: {
      text: 'Edit this page on GitHub',
      pattern: 'https://github.com/sutandojs/docs/edit/main/docs/:path'
    },

    localeLinks: {
      text: 'English',
      items: [
        { text: '简体中文', link: 'https://cn.sutando.org' },
      ]
    },

    footer: {
      message: `Released under the MIT License.`,
      copyright: 'Copyright © 2022-present Kidd Yu & Sutando contributors'
    },

    nav: [
      { text: 'Guide', link: '/guide/getting-started', activeMatch: '/guide/' },
      // { text: 'APIs', link: '/config/', activeMatch: '/api/' },
      { text: 'Examples', link: 'https://github.com/sutandojs/sutando-examples' },
      { text: 'Changelog', link: 'https://github.com/sutandojs/sutando/releases' },
      // { text: 'Plugins', link: '/plugins/', activeMatch: '/plugins/' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            {
              text: 'Getting Started',
              link: '/guide/getting-started'
            },
            {
              text: 'Installation',
              link: '/guide/installation'
            }
          ]
        },
        {
          text: 'Basics',
          items: [
            {
              text: 'Query Builder',
              link: '/guide/query-builder'
            },
            {
              text: 'Models',
              link: '/guide/models'
            },
            {
              text: 'Pagination',
              link: '/guide/pagination'
            },
            {
              text: 'Relationships',
              link: '/guide/relationships'
            },
            {
              text: 'Collections',
              link: '/guide/collections'
            },
            {
              text: 'Mutators',
              link: '/guide/mutators'
            },
            {
              text: 'Serialization',
              link: '/guide/serialization'
            },
            {
              text: 'Transactions',
              link: '/guide/transactions'
            },
            {
              text: 'Migrations',
              link: '/guide/migrations'
            },
            {
              text: 'Hooks',
              link: '/guide/hooks'
            },
            {
              text: 'Typescript',
              link: '/guide/typescript'
            },
          ]
        },
        {
          text: 'Plugin',
          items: [
            {
              text: 'Plugin',
              link: '/guide/plugin'
            }
          ]
        }
      ],
    }
  }
})