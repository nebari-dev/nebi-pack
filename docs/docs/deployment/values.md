---
title: values.yaml reference
description: All chart values for the Nebari Nebi Pack with their defaults and descriptions.
sidebar_position: 3
---

# values.yaml reference

:::info Auto-generated
This page is generated from [`values.yaml`](https://github.com/nebari-dev/nebari-nebi-pack/blob/main/values.yaml).
To update it, edit `values.yaml` then run `make generate-docs` from the repo root and commit the result.
:::

## Values

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| auth | object | `{"oidc":{"clientID":"","clientSecretName":"","enabled":false,"issuerURL":""},"proxyAdminGroups":"admin,nebi-admin"}` | Authentication configuration passed to the Nebi server as environment variables. |
| auth.oidc | object | `{"clientID":"","clientSecretName":"","enabled":false,"issuerURL":""}` | Direct OIDC configuration. Enables Nebi to authenticate users against an OIDC provider independently of the NebariApp gateway auth. Not required when `nebariapp.auth.enabled` is `true` (gateway auth handles login). |
| auth.oidc.clientID | string | `""` | OIDC client ID. |
| auth.oidc.clientSecretName | string | `""` | Name of the Kubernetes Secret containing the OIDC client secret under key `client-secret`. |
| auth.oidc.enabled | bool | `false` | Enable direct OIDC authentication. |
| auth.oidc.issuerURL | string | `""` | OIDC issuer URL (e.g. `https://keycloak.example.com/realms/nebari`). |
| auth.proxyAdminGroups | string | `"admin,nebi-admin"` | Comma-separated list of Keycloak/OIDC group names whose members are granted the Nebi admin role. |
| fullnameOverride | string | `""` | Override the full name of Kubernetes resources. |
| image | object | `{"pullPolicy":"IfNotPresent","repository":"quay.io/nebari/nebi","tag":"sha-9408c34"}` | Container image for the Nebi server. |
| image.pullPolicy | string | `"IfNotPresent"` | Image pull policy. |
| image.repository | string | `"quay.io/nebari/nebi"` | Image repository. |
| image.tag | string | `"sha-9408c34"` | Image tag. Pin to a specific `sha-<hash>` tag for reproducible deployments. |
| log | object | `{"format":"json","level":"info"}` | Logging configuration. |
| log.format | string | `"json"` | Log output format. `json` for structured logs; `text` for human-readable. |
| log.level | string | `"info"` | Log verbosity level. One of `debug`, `info`, `warn`, `error`. |
| nameOverride | string | `""` | Override the name portion of Kubernetes resource names. |
| nebariapp | object | `{"auth":{"enabled":true,"provider":"keycloak","provisionClient":true,"redirectURI":"/oauth2/callback","scopes":["openid","profile","email","groups"]},"enabled":true,"hostname":"","landingPage":{"category":"Platform","description":"Manage and share Conda/Pip environments for your Nebari cluster","displayName":"Nebi","enabled":false,"healthCheck":{"enabled":false,"intervalSeconds":30,"path":"/api/v1/health","timeoutSeconds":5},"icon":"https://raw.githubusercontent.com/nebari-dev/nebi/main/docs/static/img/nebi-icon.png","priority":10},"routing":{"routes":[{"pathPrefix":"/"}]},"service":{"name":"","port":80}}` | Create a NebariApp CRD to configure routing and Keycloak auth via nebari-operator. Set to `false` when deploying outside of Nebari. |
| nebariapp.auth.enabled | bool | `true` | Enforce Keycloak authentication at the Envoy Gateway for this app. |
| nebariapp.auth.provider | string | `"keycloak"` | OIDC provider for authentication. |
| nebariapp.auth.provisionClient | bool | `true` | Automatically provision a Keycloak OIDC client for this NebariApp. |
| nebariapp.auth.redirectURI | string | `"/oauth2/callback"` | OAuth2 callback path. Must match the Envoy Gateway SecurityPolicy callback path. |
| nebariapp.auth.scopes | list | `["openid","profile","email","groups"]` | OIDC scopes to request. |
| nebariapp.enabled | bool | `true` | Create the NebariApp resource. |
| nebariapp.hostname | string | `""` (must be set explicitly) | Cluster hostname for the NebariApp route (e.g. `nebi.your-cluster.example.com`). **Required** when `nebariapp.enabled` is `true`. |
| nebariapp.landingPage | object | `{"category":"Platform","description":"Manage and share Conda/Pip environments for your Nebari cluster","displayName":"Nebi","enabled":false,"healthCheck":{"enabled":false,"intervalSeconds":30,"path":"/api/v1/health","timeoutSeconds":5},"icon":"https://raw.githubusercontent.com/nebari-dev/nebi/main/docs/static/img/nebi-icon.png","priority":10}` | Controls whether and how this service appears on the Nebari landing page portal. |
| nebariapp.landingPage.category | string | `"Platform"` | Category label for grouping on the landing page. |
| nebariapp.landingPage.description | string | `"Manage and share Conda/Pip environments for your Nebari cluster"` | Short description shown on the landing page card. |
| nebariapp.landingPage.displayName | string | `"Nebi"` | Display name shown on the landing page card. |
| nebariapp.landingPage.enabled | bool | `false` | Show this service on the Nebari landing page portal. |
| nebariapp.landingPage.healthCheck.enabled | bool | `false` | Enable health-check polling for the landing page card status indicator. |
| nebariapp.landingPage.healthCheck.intervalSeconds | int | `30` | Seconds between health-check polls. |
| nebariapp.landingPage.healthCheck.path | string | `"/api/v1/health"` | HTTP path polled for the health check. |
| nebariapp.landingPage.healthCheck.timeoutSeconds | int | `5` | Health-check timeout in seconds. |
| nebariapp.landingPage.icon | string | `"https://raw.githubusercontent.com/nebari-dev/nebi/main/docs/static/img/nebi-icon.png"` | Icon URL for the landing page card. |
| nebariapp.landingPage.priority | int | `10` | Sort priority on the landing page (lower numbers appear first). |
| nebariapp.service.name | string | `""` (defaults to Helm release fullname) | Name of the Kubernetes Service the NebariApp routes to. |
| nebariapp.service.port | int | `80` | Port on the Service to route traffic to. |
| persistence | object | `{"accessMode":"ReadWriteOnce","enabled":true,"mountPath":"/app/data/environments","size":"20Gi","storageClassName":""}` | Persistent storage for pixi workspace environment files. |
| persistence.accessMode | string | `"ReadWriteOnce"` | Access mode. `ReadWriteOnce` is sufficient for a single-replica deployment. |
| persistence.enabled | bool | `true` | Enable the environments PersistentVolumeClaim. |
| persistence.mountPath | string | `"/app/data/environments"` | Mount path inside the Nebi container where workspace environments are stored. |
| persistence.size | string | `"20Gi"` | Size of the environments PVC. |
| persistence.storageClassName | string | `""` (cluster default StorageClass) | StorageClass for the environments PVC. Leave empty to use the cluster default. |
| postgres | object | `{"enabled":true,"image":{"pullPolicy":"IfNotPresent","repository":"postgres","tag":"16"},"resources":{},"storage":{"size":"10Gi","storageClassName":""}}` | Embedded PostgreSQL StatefulSet. Disable to use an external database and provide the DSN via `NEBI_DATABASE_DSN`. |
| postgres.enabled | bool | `true` | Deploy the embedded PostgreSQL StatefulSet. |
| postgres.image | object | `{"pullPolicy":"IfNotPresent","repository":"postgres","tag":"16"}` | PostgreSQL container image. |
| postgres.image.pullPolicy | string | `"IfNotPresent"` | Image pull policy. |
| postgres.image.repository | string | `"postgres"` | Image repository. |
| postgres.image.tag | string | `"16"` | PostgreSQL version. |
| postgres.resources | object | `{}` (no limits) | Resource requests and limits for the PostgreSQL container. |
| postgres.storage.size | string | `"10Gi"` | Size of the PostgreSQL data PVC. |
| postgres.storage.storageClassName | string | `""` (cluster default StorageClass) | StorageClass for the PostgreSQL PVC. Leave empty to use the cluster default. |
| queue | object | `{"type":"memory"}` | Background job queue configuration. |
| queue.type | string | `"memory"` | Queue backend. `memory` is suitable for single-replica deployments (jobs are lost on pod restart). Use `valkey` with the upstream chart for multi-replica setups. |
| replicaCount | int | `1` | Number of Nebi pod replicas. A single replica is sufficient for most deployments because `--mode=both` runs API and worker in the same pod. |
| resources | object | `{}` (no limits set; recommended to set in production) | Resource requests and limits for the Nebi container. |
| server | object | `{"mode":"production","port":8460}` | HTTP server configuration. |
| server.mode | string | `"production"` | Nebi server run mode. |
| server.port | int | `8460` | Port the Nebi container listens on. |
| service | object | `{"port":80,"targetPort":8460,"type":"ClusterIP"}` | Kubernetes Service configuration. |
| service.port | int | `80` | Port the Service exposes. |
| service.targetPort | int | `8460` | Target port on the Nebi container. |
| service.type | string | `"ClusterIP"` | Service type. |
| serviceAccount | object | `{"annotations":{},"create":true,"name":""}` | ServiceAccount configuration. |
| serviceAccount.annotations | object | `{}` | Annotations to add to the ServiceAccount (e.g. for IAM role binding). |
| serviceAccount.create | bool | `true` | Create a Kubernetes ServiceAccount for the Nebi Deployment. |
| serviceAccount.name | string | `""` (defaults to release fullname) | Name of the ServiceAccount. Defaults to the Helm release fullname. |
| strategy | object | `{"type":"Recreate"}` | Deployment update strategy. `Recreate` is required to avoid Multi-Attach errors when the environments PVC uses `ReadWriteOnce`. |
