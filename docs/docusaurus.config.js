// @ts-check

const {themes: prismThemes} = require('prism-react-renderer');
const lightCodeTheme = prismThemes.github;
const darkCodeTheme = prismThemes.dracula;

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Nebari Nebi Pack',
  tagline: 'Environment management for Nebari',
  favicon: 'img/favicon.ico',

  url: 'https://nebari-nebi-pack.netlify.app',
  baseUrl: '/',

  organizationName: 'nebari-dev',
  projectName: 'nebari-nebi-pack',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  markdown: {
    mermaid: true,
  },
  themes: ['@docusaurus/theme-mermaid'],

  plugins: [
    [
      require.resolve('docusaurus-lunr-search'),
      {
        languages: ['en'],
      },
    ],
  ],

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          routeBasePath: '/',
          sidebarPath: require.resolve('./sidebars.js'),
          sidebarCollapsible: true,
          showLastUpdateTime: true,
          editUrl:
            'https://github.com/nebari-dev/nebari-nebi-pack/edit/main/docs/docs/',
        },
        blog: false,
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      colorMode: {
        defaultMode: 'light',
        disableSwitch: false,
        respectPrefersColorScheme: true,
      },
      docs: {
        sidebar: {
          hideable: true,
          autoCollapseCategories: true,
        },
      },
      navbar: {
        title: 'Nebari Nebi Pack',
        logo: {
          alt: 'Nebari logo',
          src: 'img/logo.svg',
        },
        items: [
          {
            href: 'https://github.com/nebari-dev/nebari-nebi-pack',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Docs',
            items: [
              {label: 'Deployment', to: '/deployment/'},
              {label: 'User Guide', to: '/user-guide/'},
              {label: 'Reference', to: '/reference/'},
            ],
          },
          {
            title: 'Source',
            items: [
              {
                label: 'GitHub',
                href: 'https://github.com/nebari-dev/nebari-nebi-pack',
              },
              {
                label: 'Nebari',
                href: 'https://nebari.dev',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Nebari contributors.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
        additionalLanguages: ['bash', 'yaml', 'toml', 'python'],
      },
    }),
};

module.exports = config;
