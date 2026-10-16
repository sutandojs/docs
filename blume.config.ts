import { defineConfig } from "blume";
import type { AstroIntegration } from "astro";

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

export default defineConfig({
  title: "Sutando",
  description:
    "A modern Node.js ORM, support MySQL, PostgreSQL, SQLite, MariaDB, SQL Server, Oracle, and more",
  logo: "/logo.svg",

  github: {
    owner: "sutandojs",
    repo: "docs",
  },

  deployment: {
    site: "https://sutando.org",
  },

  integrations: [externalTabsInNewTab()],

  theme: {
    accent: "#646cff",
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
    // OG card generation fetches fonts from Google at build time; disabled while
    // the build machine cannot reach fonts.googleapis.com.
    og: { enabled: false },
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
    llmsTxt: true,
    catalog: true,
    skillMd: true,
  },

  markdown: {
    imageZoom: true,
  },
});
