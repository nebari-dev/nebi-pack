import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docsSidebar: [
    'introduction',
    {
      type: 'category',
      label: 'Deployment',
      link: { type: 'doc', id: 'deployment/index' },
      items: [
        'deployment/deploy',
        'deployment/with-data-science-pack',
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

export default sidebars;
