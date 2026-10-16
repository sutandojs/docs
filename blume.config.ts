import { defineConfig } from "blume";
import type { AstroIntegration } from "astro";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const interVariants = [
  "node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2",
  "node_modules/@fontsource-variable/inter/files/inter-latin-ext-wght-normal.woff2",
].map((src) => ({ src, weight: "100..900" }));

const inter = { name: "Inter Variable", variants: interVariants };

/**
 * Blume sets target="_blank" on header actions and CTA, but not on header tabs,
 * so the Examples and Changelog tabs would navigate readers off the docs.
 * ponytail: a page script, not a Header override — swap if Blume grows a
 * per-tab target option.
 */
const externalTabsInNewTab = (): AstroIntegration => ({
  name: "external-header-tabs",
  hooks: {
    "astro:config:setup": ({ injectScript }) => {
      injectScript(
        "page",
        `const openExternally = () => {
  for (const link of document.querySelectorAll("header a[href^='http']")) {
    link.target = "_blank";
    link.rel = "noreferrer";
  }
};
openExternally();
document.addEventListener("astro:page-load", openExternally);`,
      );
    },
  },
});

/**
 * The locale code doubles as the URL prefix, so "zh_CN" has to stay if the
 * Chinese URLs already in the index are to keep working — but it isn't a valid
 * BCP 47 tag, and Blume copies it into `<html lang>` and the hreflang
 * annotations as-is, where crawlers ignore it. Rewrite just those values in the
 * finished build; the URLs keep the underscore.
 */
const bcp47LocaleTags = (): AstroIntegration => ({
  name: "bcp47-locale-tags",
  hooks: {
    "astro:build:done": ({ dir }) => {
      const fix = (file: string) => {
        const before = readFileSync(file, "utf8");
        const after = before.replace(
          /\b(lang|hreflang)="([a-z]{2})_([A-Z]{2})"/g,
          '$1="$2-$3"',
        );
        if (after !== before) {
          writeFileSync(file, after);
        }
      };
      const walk = (path: string) => {
        for (const entry of readdirSync(path, { withFileTypes: true })) {
          const child = join(path, entry.name);
          if (entry.isDirectory()) {
            walk(child);
          } else if (/\.(html|xml)$/.test(entry.name)) {
            fix(child);
          }
        }
      };
      walk(fileURLToPath(dir));
    },
  },
});

export default defineConfig({
  title: "Sutando",
  description:
    "A modern Node.js ORM, support MySQL, PostgreSQL, SQLite, MariaDB, SQL Server, Oracle, and more",
  // Also the browser tab icon: Blume picks up public/icon.svg by filename.
  logo: "/icon.svg",

  github: {
    owner: "sutandojs",
    repo: "docs",
  },

  deployment: {
    site: "https://sutando.org",
  },

  /**
   * Every URL the VitePress site published as `<route>.html`, taken from the
   * sitemap it served at https://sutando.org/sitemap.xml. A pattern cannot
   * express a `.html` suffix, so each one is an exact redirect; they are
   * historical URLs, so this list never has to follow the content.
   */
  redirects: [
    // Guide pages: published as /<locale>/guide/<page>.html in en and zh_CN.
    { from: "/guide/browser.html", to: "/guide/browser" },
    { from: "/zh_CN/guide/browser.html", to: "/zh_CN/guide/browser" },
    { from: "/guide/collections.html", to: "/guide/collections" },
    { from: "/zh_CN/guide/collections.html", to: "/zh_CN/guide/collections" },
    { from: "/guide/getting-started.html", to: "/guide/getting-started" },
    { from: "/zh_CN/guide/getting-started.html", to: "/zh_CN/guide/getting-started" },
    { from: "/guide/hooks.html", to: "/guide/hooks" },
    { from: "/zh_CN/guide/hooks.html", to: "/zh_CN/guide/hooks" },
    { from: "/guide/installation.html", to: "/guide/installation" },
    { from: "/zh_CN/guide/installation.html", to: "/zh_CN/guide/installation" },
    { from: "/guide/migrations.html", to: "/guide/migrations" },
    { from: "/zh_CN/guide/migrations.html", to: "/zh_CN/guide/migrations" },
    { from: "/guide/models.html", to: "/guide/models" },
    { from: "/zh_CN/guide/models.html", to: "/zh_CN/guide/models" },
    { from: "/guide/mutators.html", to: "/guide/mutators" },
    { from: "/zh_CN/guide/mutators.html", to: "/zh_CN/guide/mutators" },
    { from: "/guide/pagination.html", to: "/guide/pagination" },
    { from: "/zh_CN/guide/pagination.html", to: "/zh_CN/guide/pagination" },
    { from: "/guide/plugin-list.html", to: "/guide/plugin-list" },
    { from: "/zh_CN/guide/plugin-list.html", to: "/zh_CN/guide/plugin-list" },
    { from: "/guide/plugin.html", to: "/guide/plugin" },
    { from: "/zh_CN/guide/plugin.html", to: "/zh_CN/guide/plugin" },
    { from: "/guide/query-builder.html", to: "/guide/query-builder" },
    { from: "/zh_CN/guide/query-builder.html", to: "/zh_CN/guide/query-builder" },
    { from: "/guide/relationships.html", to: "/guide/relationships" },
    { from: "/zh_CN/guide/relationships.html", to: "/zh_CN/guide/relationships" },
    { from: "/guide/schema-builder.html", to: "/guide/migrations" },
    { from: "/zh_CN/guide/schema-builder.html", to: "/zh_CN/guide/migrations" },
    { from: "/guide/serialization.html", to: "/guide/serialization" },
    { from: "/zh_CN/guide/serialization.html", to: "/zh_CN/guide/serialization" },
    { from: "/guide/transactions.html", to: "/guide/transactions" },
    { from: "/zh_CN/guide/transactions.html", to: "/zh_CN/guide/transactions" },
    { from: "/guide/typescript.html", to: "/guide/typescript" },
    { from: "/zh_CN/guide/typescript.html", to: "/zh_CN/guide/typescript" },

    // Blog posts: published as /<locale>/blog/posts/<slug>.html in all three locales.
    { from: "/blog/posts/building-rest-api-with-sutando-and-express.html", to: "/blog/posts/building-rest-api-with-sutando-and-express" },
    { from: "/blog/posts/database-migrations-with-sutando-complete-guide.html", to: "/blog/posts/database-migrations-with-sutando-complete-guide" },
    { from: "/blog/posts/getting-started-with-sutando-build-your-first-nodejs-app.html", to: "/blog/posts/getting-started-with-sutando-build-your-first-nodejs-app" },
    { from: "/blog/posts/migrating-from-laravel-to-nodejs-with-sutando.html", to: "/blog/posts/migrating-from-laravel-to-nodejs-with-sutando" },
    { from: "/blog/posts/model-relationships-in-sutando-hasmany-belongsto-and-beyond.html", to: "/blog/posts/model-relationships-in-sutando-hasmany-belongsto-and-beyond" },
    { from: "/blog/posts/modern-alternative-to-bookshelfjs-migrating-to-sutando.html", to: "/blog/posts/modern-alternative-to-bookshelfjs-migrating-to-sutando" },
    { from: "/blog/posts/modern-alternative-to-objectionjs-migrating-to-sutando.html", to: "/blog/posts/modern-alternative-to-objectionjs-migrating-to-sutando" },
    { from: "/blog/posts/nodejs-active-record-orm-complete-guide.html", to: "/blog/posts/nodejs-active-record-orm-complete-guide" },
    { from: "/blog/posts/soft-deletes-hooks-and-scopes-in-sutando.html", to: "/blog/posts/soft-deletes-hooks-and-scopes-in-sutando" },
    { from: "/blog/posts/sutando-orm-the-laravel-eloquent-experience-for-nodejs.html", to: "/blog/posts/sutando-orm-the-laravel-eloquent-experience-for-nodejs" },
    { from: "/blog/posts/sutando-plugins-extending-your-orm.html", to: "/blog/posts/sutando-plugins-extending-your-orm" },
    { from: "/blog/posts/sutando-vs-drizzle-active-record-vs-sql-first.html", to: "/blog/posts/sutando-vs-drizzle-active-record-vs-sql-first" },
    { from: "/blog/posts/sutando-vs-prisma-which-nodejs-orm.html", to: "/blog/posts/sutando-vs-prisma-which-nodejs-orm" },
    { from: "/blog/posts/sutando-vs-typeorm-modern-active-record-alternative.html", to: "/blog/posts/sutando-vs-typeorm-modern-active-record-alternative" },
    { from: "/blog/posts/the-best-node.js-orms-to-watch-in-2026.html", to: "/blog/posts/the-best-node.js-orms-to-watch-in-2026" },
    { from: "/blog/posts/using-sutando-with-nextjs-server-side-database-access.html", to: "/blog/posts/using-sutando-with-nextjs-server-side-database-access" },
    // Blume strips the `2026-` ordering prefix from this page's route.
    {
      from: "/zh_CN/blog/posts/2026-nodejs-orm-selection-guide-prisma-vs-drizzle-vs-sutando.html",
      to: "/zh_CN/blog/posts/nodejs-orm-selection-guide-prisma-vs-drizzle-vs-sutando",
    },
    { from: "/zh_CN/blog/posts/building-rest-api-with-sutando-and-express.html", to: "/zh_CN/blog/posts/building-rest-api-with-sutando-and-express" },
    { from: "/zh_CN/blog/posts/database-migrations-with-sutando-complete-guide.html", to: "/zh_CN/blog/posts/database-migrations-with-sutando-complete-guide" },
    { from: "/zh_CN/blog/posts/getting-started-with-sutando-build-your-first-nodejs-app.html", to: "/zh_CN/blog/posts/getting-started-with-sutando-build-your-first-nodejs-app" },
    { from: "/zh_CN/blog/posts/migrate-from-laravel-to-nodejs-with-sutando.html", to: "/zh_CN/blog/posts/migrate-from-laravel-to-nodejs-with-sutando" },
    { from: "/zh_CN/blog/posts/migrating-from-laravel-to-nodejs-with-sutando.html", to: "/zh_CN/blog/posts/migrating-from-laravel-to-nodejs-with-sutando" },
    { from: "/zh_CN/blog/posts/model-relationships-in-sutando-hasmany-belongsto-and-beyond.html", to: "/zh_CN/blog/posts/model-relationships-in-sutando-hasmany-belongsto-and-beyond" },
    { from: "/zh_CN/blog/posts/modern-alternative-to-bookshelfjs-migrating-to-sutando.html", to: "/zh_CN/blog/posts/modern-alternative-to-bookshelfjs-migrating-to-sutando" },
    { from: "/zh_CN/blog/posts/modern-alternative-to-objectionjs-migrating-to-sutando.html", to: "/zh_CN/blog/posts/modern-alternative-to-objectionjs-migrating-to-sutando" },
    { from: "/zh_CN/blog/posts/nodejs-active-record-orm-complete-guide.html", to: "/zh_CN/blog/posts/nodejs-active-record-orm-complete-guide" },
    { from: "/zh_CN/blog/posts/nodejs-orm-beginner-tutorial-build-first-app-with-sutando.html", to: "/zh_CN/blog/posts/nodejs-orm-beginner-tutorial-build-first-app-with-sutando" },
    { from: "/zh_CN/blog/posts/soft-deletes-hooks-and-scopes-in-sutando.html", to: "/zh_CN/blog/posts/soft-deletes-hooks-and-scopes-in-sutando" },
    { from: "/zh_CN/blog/posts/sutando-orm-the-laravel-eloquent-experience-for-nodejs.html", to: "/zh_CN/blog/posts/sutando-orm-the-laravel-eloquent-experience-for-nodejs" },
    { from: "/zh_CN/blog/posts/sutando-plugins-extending-your-orm.html", to: "/zh_CN/blog/posts/sutando-plugins-extending-your-orm" },
    { from: "/zh_CN/blog/posts/sutando-vs-drizzle-active-record-vs-sql-first.html", to: "/zh_CN/blog/posts/sutando-vs-drizzle-active-record-vs-sql-first" },
    { from: "/zh_CN/blog/posts/sutando-vs-prisma-which-nodejs-orm.html", to: "/zh_CN/blog/posts/sutando-vs-prisma-which-nodejs-orm" },
    { from: "/zh_CN/blog/posts/sutando-vs-typeorm-modern-active-record-alternative.html", to: "/zh_CN/blog/posts/sutando-vs-typeorm-modern-active-record-alternative" },
    { from: "/zh_CN/blog/posts/the-best-node.js-orms-to-watch-in-2026.html", to: "/zh_CN/blog/posts/the-best-node.js-orms-to-watch-in-2026" },
    { from: "/zh_CN/blog/posts/using-sutando-with-nextjs-server-side-database-access.html", to: "/zh_CN/blog/posts/using-sutando-with-nextjs-server-side-database-access" },
    { from: "/ja/blog/posts/building-rest-api-with-sutando-and-express.html", to: "/ja/blog/posts/building-rest-api-with-sutando-and-express" },
    { from: "/ja/blog/posts/database-migrations-with-sutando-complete-guide.html", to: "/ja/blog/posts/database-migrations-with-sutando-complete-guide" },
    { from: "/ja/blog/posts/getting-started-with-sutando-build-your-first-nodejs-app.html", to: "/ja/blog/posts/getting-started-with-sutando-build-your-first-nodejs-app" },
    { from: "/ja/blog/posts/migrating-from-laravel-to-nodejs-with-sutando.html", to: "/ja/blog/posts/migrating-from-laravel-to-nodejs-with-sutando" },
    { from: "/ja/blog/posts/model-relationships-in-sutando-hasmany-belongsto-and-beyond.html", to: "/ja/blog/posts/model-relationships-in-sutando-hasmany-belongsto-and-beyond" },
    { from: "/ja/blog/posts/modern-alternative-to-bookshelfjs-migrating-to-sutando.html", to: "/ja/blog/posts/modern-alternative-to-bookshelfjs-migrating-to-sutando" },
    { from: "/ja/blog/posts/modern-alternative-to-objectionjs-migrating-to-sutando.html", to: "/ja/blog/posts/modern-alternative-to-objectionjs-migrating-to-sutando" },
    { from: "/ja/blog/posts/nodejs-active-record-orm-complete-guide.html", to: "/ja/blog/posts/nodejs-active-record-orm-complete-guide" },
    { from: "/ja/blog/posts/soft-deletes-hooks-and-scopes-in-sutando.html", to: "/ja/blog/posts/soft-deletes-hooks-and-scopes-in-sutando" },
    { from: "/ja/blog/posts/sutando-orm-the-laravel-eloquent-experience-for-nodejs.html", to: "/ja/blog/posts/sutando-orm-the-laravel-eloquent-experience-for-nodejs" },
    { from: "/ja/blog/posts/sutando-plugins-extending-your-orm.html", to: "/ja/blog/posts/sutando-plugins-extending-your-orm" },
    { from: "/ja/blog/posts/sutando-vs-drizzle-active-record-vs-sql-first.html", to: "/ja/blog/posts/sutando-vs-drizzle-active-record-vs-sql-first" },
    { from: "/ja/blog/posts/sutando-vs-prisma-which-nodejs-orm.html", to: "/ja/blog/posts/sutando-vs-prisma-which-nodejs-orm" },
    { from: "/ja/blog/posts/sutando-vs-typeorm-modern-active-record-alternative.html", to: "/ja/blog/posts/sutando-vs-typeorm-modern-active-record-alternative" },
    { from: "/ja/blog/posts/the-best-node.js-orms-to-watch-in-2026.html", to: "/ja/blog/posts/the-best-node.js-orms-to-watch-in-2026" },
    { from: "/ja/blog/posts/using-sutando-with-nextjs-server-side-database-access.html", to: "/ja/blog/posts/using-sutando-with-nextjs-server-side-database-access" },

    // The author pages went away with the VitePress theme.
    { from: "/blog/authors/dylan-yu.html", to: "/blog" },
  ],

  integrations: [externalTabsInNewTab(), bcp47LocaleTags()],

  theme: {
    // #646cff on white is only 4.09:1, below WCAG AA for the accent's text and
    // buttons; the light shade keeps the hue a shade deeper, dark keeps the
    // brand colour.
    accent: { light: "#5b62e8", dark: "#646cff" },
    radius: "md",
    // Self-hosted from node_modules: the build machine can't reach Google Fonts,
    // so the curated Google slugs would silently fall back to system fonts.
    fonts: {
      display: inter,
      body: inter,
      mono: {
        name: "IBM Plex Mono",
        variants: [400, 500, 600].map((weight) => ({
          src: `node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-${weight}-normal.woff2`,
          weight,
        })),
      },
    },
  },

  navigation: {
    tabs: [
      {
        label: { en: "Guide", zh_CN: "指南", ja: "ガイド" },
        path: "/guide",
        icon: "book-open",
      },
      {
        label: { en: "Blog", zh_CN: "博客", ja: "ブログ" },
        path: "/blog",
        icon: "newspaper",
      },
      {
        label: { en: "Examples", zh_CN: "示例", ja: "例" },
        path: "/examples",
        href: "https://github.com/sutandojs/sutando-examples",
        icon: "code",
      },
      {
        label: { en: "Changelog", zh_CN: "更新日志", ja: "更新履歴" },
        path: "/changelog",
        href: "https://github.com/sutandojs/sutando/releases",
        icon: "history",
      },
    ],
  },

  seo: {
    // Card generation fetches Google fonts at build time for the CJK titles;
    // disabled while the build machine can't reach fonts.googleapis.com. The
    // static default still gives every page an og:image — the VitePress site
    // pointed its own at sutandojs.org, which no longer resolves.
    og: { enabled: false, image: "/codeimg-twitter-instream-image.jpeg" },
  },

  i18n: {
    defaultLocale: "en",
    locales: [
      { code: "en", label: "English" },
      { code: "zh_CN", label: "简体中文" },
      { code: "ja", label: "日本語" },
    ],
  },

  agents: {
    // The llms.txt spec's "details" block: what an agent should know before it
    // picks a page — when to reach for Sutando, and how to install and drive it.
    llmsTxt: {
      details:
        "Sutando is a modern Node.js ORM with an Active Record API modelled on Laravel's Eloquent: models, relationships, a fluent query builder, migrations, transactions, hooks, and soft deletes, over MySQL, PostgreSQL, SQLite, MariaDB, SQL Server, or Oracle. Install it with `npm install sutando` plus the driver for your database; `npx sutando init` scaffolds a project and `npx sutando migrate:make` / `npx sutando migrate:run` handle migrations. The Guide below is the reference; the Blog covers comparisons and tutorials.",
    },
    catalog: true,
    skillMd: true,
  },

  markdown: {
    imageZoom: true,
  },
});
