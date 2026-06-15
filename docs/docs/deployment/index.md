---
title: Deployment
description: Install and configure the Nebari Nebi Pack on a Kubernetes or Nebari cluster.
sidebar_position: 1
---

import DocCardList from '@theme/DocCardList';

# Deployment

The Nebi Pack is a Helm chart that deploys [Nebi](https://github.com/nebari-dev/nebi) — a team environment management server built on [Pixi](https://pixi.sh) — on a Nebari or plain Kubernetes cluster. This section covers everything an operator needs to install, configure, and maintain the pack.

## Prerequisites

| Requirement | Notes |
|---|---|
| Kubernetes ≥ 1.27 | Any CNCF-conformant cluster |
| Helm ≥ 3.12 | |
| `nebari-operator` | Required when `nebariapp.enabled: true` (Nebari clusters only) |
| A dedicated namespace | Recommended: `nebi` |
| Persistent storage | Default StorageClass with RWO support; ~30 Gi total (20 Gi environments + 10 Gi PostgreSQL) |

<DocCardList />
