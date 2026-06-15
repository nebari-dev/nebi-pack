---
title: values.yaml reference
description: All chart values for the Nebari Nebi Pack with their defaults and descriptions.
sidebar_position: 3
---

# values.yaml reference

:::info Auto-generated
This page is generated from [`values.yaml`](https://github.com/nebari-dev/nebari-nebi-pack/blob/main/values.yaml).
:::

## Values

| Key | Type | Description | Default |
|-----|------|-------------|---------|
| auth | object | Auth configuration (env vars on the Deployment) | `{"oidc":{"clientID":"","clientSecretName":"","discoveryURL":"","enabled":true,"issuerURL":""},"proxyAdminGroups":"admin,nebi-admin"}` |
| auth.oidc | object | OIDC integration. Enabled by default so a stock Nebari install authenticates against Keycloak with no extra values: issuerURL, clientID and clientSecretName are all derived to match the client the nebari-operator provisions for this NebariApp. Override any field to opt out of the convention. nebi still runs NEBI_AUTH_TYPE=basic and validates the gateway-forwarded OIDC token via the verifier wired in here. | `{"clientID":"","clientSecretName":"","discoveryURL":"","enabled":true,"issuerURL":""}` |
| auth.oidc.clientID | string | OIDC client ID. | `""` |
| auth.oidc.clientSecretName | string | Name of the Kubernetes Secret containing the OIDC client secret under key `client-secret`. | `""` |
| auth.oidc.enabled | bool | Enable direct OIDC authentication. | `true` |
| auth.oidc.issuerURL | string | OIDC issuer URL (e.g. `https://keycloak.example.com/realms/nebari`). | `""` |
| auth.proxyAdminGroups | string | Keycloak/OIDC groups that grant Nebi admin role | `"admin,nebi-admin"` |
| fullnameOverride | string | Override the full name of Kubernetes resources. | `""` |
| image | object | Container image for the Nebi server. | `{"pullPolicy":"IfNotPresent","repository":"quay.io/nebari/nebi","tag":"sha-f4b23ca"}` |
| image.pullPolicy | string | Image pull policy. | `"IfNotPresent"` |
| image.repository | string | Image repository. | `"quay.io/nebari/nebi"` |
| image.tag | string | Image tag. Pin to a specific `sha-<hash>` tag for reproducible deployments. | `"sha-f4b23ca"` |
| keycloak.hostname | string |  | `""` |
| log | object | Logging | `{"format":"json","level":"info"}` |
| log.format | string | Log output format. `json` for structured logs; `text` for human-readable. | `"json"` |
| log.level | string | Log verbosity level. One of `debug`, `info`, `warn`, `error`. | `"info"` |
| nameOverride | string | Override the name portion of Kubernetes resource names. | `""` |
| nebariapp | object | Creates a NebariApp CRD that configures routing and auth via nebari-operator. Set to `false` when deploying outside of Nebari. | `{"auth":{"enabled":true,"provider":"keycloak","provisionClient":true,"redirectURI":"/oauth2/callback","scopes":["openid","profile","email","groups"],"tokenExchange":{"enabled":true}},"enabled":true,"hostname":"","landingPage":{"category":"Platform","description":"Manage and share Conda/Pip environments for your Nebari cluster","displayName":"Nebi","enabled":true,"healthCheck":{"enabled":true,"intervalSeconds":30,"path":"/api/v1/health","timeoutSeconds":5},"icon":"https://raw.githubusercontent.com/nebari-dev/nebi/main/docs/static/img/nebi-icon.png","priority":10},"routing":{"publicRoutes":[{"pathPrefix":"/api/","pathType":"PathPrefix"},{"pathPrefix":"/docs/","pathType":"PathPrefix"}],"routes":[{"pathPrefix":"/"}]},"service":{"name":"","port":80}}` |
| nebariapp.auth.enabled | bool | Enforce Keycloak authentication at the Envoy Gateway for this app. | `true` |
| nebariapp.auth.provider | string | OIDC provider for authentication. | `"keycloak"` |
| nebariapp.auth.provisionClient | bool | Automatically provision a Keycloak OIDC client for this NebariApp. | `true` |
| nebariapp.auth.redirectURI | string | redirectURI must match the Envoy Gateway SecurityPolicy callback path. Nebi itself does NOT run an SSO proxy – auth is handled at the gateway (enforceAtGateway: true, the operator default), so oauth2-proxy's /oauth2/callback endpoint is what the IdP redirects back to. | `"/oauth2/callback"` |
| nebariapp.auth.scopes | list | OIDC scopes to request. | `["openid","profile","email","groups"]` |
| nebariapp.enabled | bool | Create the NebariApp resource. | `true` |
| nebariapp.hostname | string | Cluster hostname for the NebariApp route (e.g. `nebi.your-cluster.example.com`). **Required** when `nebariapp.enabled` is `true`. |  |
| nebariapp.landingPage | object | landingPage controls whether and how this service appears on the Nebari landing page portal (served by nebari-landing / nebari-webapi). | `{"category":"Platform","description":"Manage and share Conda/Pip environments for your Nebari cluster","displayName":"Nebi","enabled":true,"healthCheck":{"enabled":true,"intervalSeconds":30,"path":"/api/v1/health","timeoutSeconds":5},"icon":"https://raw.githubusercontent.com/nebari-dev/nebi/main/docs/static/img/nebi-icon.png","priority":10}` |
| nebariapp.landingPage.category | string | Category label for grouping on the landing page. | `"Platform"` |
| nebariapp.landingPage.description | string | Short description shown on the landing page card. | `"Manage and share Conda/Pip environments for your Nebari cluster"` |
| nebariapp.landingPage.displayName | string | Display name shown on the landing page card. | `"Nebi"` |
| nebariapp.landingPage.enabled | bool | Show this service on the Nebari landing page portal. | `true` |
| nebariapp.landingPage.healthCheck.enabled | bool | Enable health-check polling for the landing page card status indicator. | `true` |
| nebariapp.landingPage.healthCheck.intervalSeconds | int | Seconds between health-check polls. | `30` |
| nebariapp.landingPage.healthCheck.path | string | HTTP path polled for the health check. | `"/api/v1/health"` |
| nebariapp.landingPage.healthCheck.timeoutSeconds | int | Health-check timeout in seconds. | `5` |
| nebariapp.landingPage.icon | string | Icon URL for the landing page card. | `"https://raw.githubusercontent.com/nebari-dev/nebi/main/docs/static/img/nebi-icon.png"` |
| nebariapp.landingPage.priority | int | Sort priority on the landing page (lower numbers appear first). | `10` |
| nebariapp.service.name | string | Name of the Kubernetes Service the NebariApp routes to. |  |
| nebariapp.service.port | int | Port on the Service to route traffic to. | `80` |
| persistence | object | Storage for workspace environments | `{"accessMode":"ReadWriteOnce","enabled":true,"mountPath":"/app/data/environments","size":"20Gi","storageClassName":""}` |
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
| queue | object | Queue configuration (single pod = in-memory) | `{"type":"memory"}` |
| queue.type | string | Queue backend. `memory` is suitable for single-replica deployments (jobs are lost on pod restart). Use `valkey` with the upstream chart for multi-replica setups. | `"memory"` |
| replicaCount | int | Number of Nebi pod replicas. A single replica is sufficient for most deployments because `--mode=both` runs API and worker in the same pod. | `1` |
| resources | object | Resource requests and limits for the Nebi container. |  |
| server | object | Server configuration | `{"mode":"production","port":8460}` |
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
| strategy | object | Deployment strategy – Recreate avoids Multi-Attach errors on RWO volumes | `{"type":"Recreate"}` |