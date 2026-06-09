// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  docsSidebar: [
    'introduction',
    {
      type: 'category',
      label: 'Deployment',
      link: { type: 'doc', id: 'deployment/index' },
      items: [
        'deployment/deploy',
        'deployment/architecture',
        'deployment/values',
        'deployment/troubleshoot',
      ],
    },
    {
      type: 'category',
      label: 'User Guide',
      link: { type: 'doc', id: 'user-guide/index' },
      items: [
        'user-guide/use',
      ],
    },
    {
      type: 'category',
      label: 'Reference',
      link: { type: 'doc', id: 'reference/index' },
      items: [
        'reference/release-notes',
      ],
    },
  ],
};

module.exports = sidebars;
