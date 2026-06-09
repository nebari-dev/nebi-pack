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

| Key | Type | Description | Default |
|-----|------|-------------|---------|
| auth | object | Authentication configuration passed to the Nebi server as environment variables. | `{"oidc":{"clientID":"","clientSecretName":"","enabled":false,"issuerURL":""},"proxyAdminGroups":"admin,nebi-admin"}` |
| auth.oidc | object | Direct OIDC configuration. Enables Nebi to authenticate users against an OIDC provider independently of the NebariApp gateway auth. Not required when `nebariapp.auth.enabled` is `true` (gateway auth handles login). | `{"clientID":"","clientSecretName":"","enabled":false,"issuerURL":""}` |
| auth.oidc.clientID | string | OIDC client ID. | `""` |
| auth.oidc.clientSecretName | string | Name of the Kubernetes Secret containing the OIDC client secret under key `client-secret`. | `""` |
| auth.oidc.enabled | bool | Enable direct OIDC authentication. | `false` |
| auth.oidc.issuerURL | string | OIDC issuer URL (e.g. `https://keycloak.example.com/realms/nebari`). | `""` |
| auth.proxyAdminGroups | string | Comma-separated list of Keycloak/OIDC group names whose members are granted the Nebi admin role. | `"admin,nebi-admin"` |
| fullnameOverride | string | Override the full name of Kubernetes resources. | `""` |
| image | object | Container image for the Nebi server. | `{"pullPolicy":"IfNotPresent","repository":"quay.io/nebari/nebi","tag":"sha-9408c34"}` |
| image.pullPolicy | string | Image pull policy. | `"IfNotPresent"` |
| image.repository | string | Image repository. | `"quay.io/nebari/nebi"` |
| image.tag | string | Image tag. Pin to a specific `sha-<hash>` tag for reproducible deployments. | `"sha-9408c34"` |
| log | object | Logging configuration. | `{"format":"json","level":"info"}` |
| log.format | string | Log output format. `json` for structured logs; `text` for human-readable. | `"json"` |
| log.level | string | Log verbosity level. One of `debug`, `info`, `warn`, `error`. | `"info"` |
| nameOverride | string | Override the name portion of Kubernetes resource names. | `""` |
| nebariapp | object | Create a NebariApp CRD to configure routing and Keycloak auth via nebari-operator. Set to `false` when deploying outside of Nebari. | `{"auth":{"enabled":true,"provider":"keycloak","provisionClient":true,"redirectURI":"/oauth2/callback","scopes":["openid","profile","email","groups"]},"enabled":true,"hostname":"","landingPage":{"category":"Platform","description":"Manage and share Conda/Pip environments for your Nebari cluster","displayName":"Nebi","enabled":false,"healthCheck":{"enabled":false,"intervalSeconds":30,"path":"/api/v1/health","timeoutSeconds":5},"icon":"https://raw.githubusercontent.com/nebari-dev/nebi/main/docs/static/img/nebi-icon.png","priority":10},"routing":{"routes":[{"pathPrefix":"/"}]},"service":{"name":"","port":80}}` |
| nebariapp.auth.enabled | bool | Enforce Keycloak authentication at the Envoy Gateway for this app. | `true` |
| nebariapp.auth.provider | string | OIDC provider for authentication. | `"keycloak"` |
| nebariapp.auth.provisionClient | bool | Automatically provision a Keycloak OIDC client for this NebariApp. | `true` |
| nebariapp.auth.redirectURI | string | OAuth2 callback path. Must match the Envoy Gateway SecurityPolicy callback path. | `"/oauth2/callback"` |
| nebariapp.auth.scopes | list | OIDC scopes to request. | `["openid","profile","email","groups"]` |
| nebariapp.enabled | bool | Create the NebariApp resource. | `true` |
| nebariapp.hostname | string | Cluster hostname for the NebariApp route (e.g. `nebi.your-cluster.example.com`). **Required** when `nebariapp.enabled` is `true`. |  |
| nebariapp.landingPage | object | Controls whether and how this service appears on the Nebari landing page portal. | `{"category":"Platform","description":"Manage and share Conda/Pip environments for your Nebari cluster","displayName":"Nebi","enabled":false,"healthCheck":{"enabled":false,"intervalSeconds":30,"path":"/api/v1/health","timeoutSeconds":5},"icon":"https://raw.githubusercontent.com/nebari-dev/nebi/main/docs/static/img/nebi-icon.png","priority":10}` |
| nebariapp.landingPage.category | string | Category label for grouping on the landing page. | `"Platform"` |
| nebariapp.landingPage.description | string | Short description shown on the landing page card. | `"Manage and share Conda/Pip environments for your Nebari cluster"` |
| nebariapp.landingPage.displayName | string | Display name shown on the landing page card. | `"Nebi"` |
| nebariapp.landingPage.enabled | bool | Show this service on the Nebari landing page portal. | `false` |
| nebariapp.landingPage.healthCheck.enabled | bool | Enable health-check polling for the landing page card status indicator. | `false` |
| nebariapp.landingPage.healthCheck.intervalSeconds | int | Seconds between health-check polls. | `30` |
| nebariapp.landingPage.healthCheck.path | string | HTTP path polled for the health check. | `"/api/v1/health"` |
| nebariapp.landingPage.healthCheck.timeoutSeconds | int | Health-check timeout in seconds. | `5` |
| nebariapp.landingPage.icon | string | Icon URL for the landing page card. | `"https://raw.githubusercontent.com/nebari-dev/nebi/main/docs/static/img/nebi-icon.png"` |
| nebariapp.landingPage.priority | int | Sort priority on the landing page (lower numbers appear first). | `10` |
| nebariapp.service.name | string | Name of the Kubernetes Service the NebariApp routes to. |  |
| nebariapp.service.port | int | Port on the Service to route traffic to. | `80` |
| persistence | object | Persistent storage for pixi workspace environment files. | `{"accessMode":"ReadWriteOnce","enabled":true,"mountPath":"/app/data/environments","size":"20Gi","storageClassName":""}` |
| persistence.accessMode | string | Access mode. `ReadWriteOnce` is sufficient for a single-replica deployment. | `"ReadWriteOnce"` |
| persistence.enabled | bool | Enable the environments PersistentVolumeClaim. | `true` |
| persistence.mountPath | string | Mount path inside the Nebi container where workspace environments are stored. | `"/app/data/environments"` |
| persistence.size | string | Size of the environments PVC. | `"20Gi"` |
| persistence.storageClassName | string | StorageClass for the environments PVC. Leave empty to use the cluster default. |  |
| postgres | object | Embedded PostgreSQL StatefulSet. Disable to use an external database and provide the DSN via `NEBI_DATABASE_DSN`. | `{"enabled":true,"image":{"pullPolicy":"IfNotPresent","repository":"postgres","tag":"16"},"resources":{},"storage":{"size":"10Gi","storageClassName":""}}` |
| postgres.enabled | bool | Deploy the embedded PostgreSQL StatefulSet. | `true` |
| postgres.image | object | PostgreSQL container image. | `{"pullPolicy":"IfNotPresent","repository":"postgres","tag":"16"}` |
| postgres.image.pullPolicy | string | Image pull policy. | `"IfNotPresent"` |
| postgres.image.repository | string | Image repository. | `"postgres"` |
| postgres.image.tag | string | PostgreSQL version. | `"16"` |
| postgres.resources | object | Resource requests and limits for the PostgreSQL container. |  |
| postgres.storage.size | string | Size of the PostgreSQL data PVC. | `"10Gi"` |
| postgres.storage.storageClassName | string | StorageClass for the PostgreSQL PVC. Leave empty to use the cluster default. |  |
| queue | object | Background job queue configuration. | `{"type":"memory"}` |
| queue.type | string | Queue backend. `memory` is suitable for single-replica deployments (jobs are lost on pod restart). Use `valkey` with the upstream chart for multi-replica setups. | `"memory"` |
| replicaCount | int | Number of Nebi pod replicas. A single replica is sufficient for most deployments because `--mode=both` runs API and worker in the same pod. | `1` |
| resources | object | Resource requests and limits for the Nebi container. |  |
| server | object | HTTP server configuration. | `{"mode":"production","port":8460}` |
| server.mode | string | Nebi server run mode. | `"production"` |
| server.port | int | Port the Nebi container listens on. | `8460` |
| service | object | Kubernetes Service configuration. | `{"port":80,"targetPort":8460,"type":"ClusterIP"}` |
| service.port | int | Port the Service exposes. | `80` |
| service.targetPort | int | Target port on the Nebi container. | `8460` |
| service.type | string | Service type. | `"ClusterIP"` |
| serviceAccount | object | ServiceAccount configuration. | `{"annotations":{},"create":true,"name":""}` |
| serviceAccount.annotations | object | Annotations to add to the ServiceAccount (e.g. for IAM role binding). | `{}` |
| serviceAccount.create | bool | Create a Kubernetes ServiceAccount for the Nebi Deployment. | `true` |
| serviceAccount.name | string | Name of the ServiceAccount. Defaults to the Helm release fullname. |  |
| strategy | object | Deployment update strategy. `Recreate` is required to avoid Multi-Attach errors when the environments PVC uses `ReadWriteOnce`. | `{"type":"Recreate"}` |