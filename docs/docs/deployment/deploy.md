---
title: Deploy the pack
description: Step-by-step instructions for deploying the Nebari Nebi Pack.
sidebar_position: 1
---

# Deploy the pack

This guide is for **operators** installing the pack on a Kubernetes
cluster.

The pack deploys:

- **Nebi server** — a single-pod Deployment running `--mode=both` (API + background worker combined). Image: `quay.io/nebari/nebi`. Listens on port 8460.
- **PostgreSQL 16** — an embedded StatefulSet for application state and workspace metadata. 10 Gi persistent storage.
- **ClusterIP Service** — exposes the Nebi server on port 80 within the cluster.
- **Environments PVC** — 20 Gi RWO volume mounted at `/app/data/environments` for pixi workspace files.
- **Secret** — JWT signing key and PostgreSQL password, created once by a PreSync Job and never overwritten on upgrade.
- **NebariApp** *(Nebari clusters only)* — configures Envoy Gateway routing and provisions a Keycloak OIDC client automatically.
- **ServiceAccount** — bound to the Nebi Deployment.

See [Architecture](./architecture.md) for a full resource breakdown and request flow diagram.

:::note[Defaults reflect chart v0.1.0-alpha.4]

Image tags, subchart versions, and other defaults cited below match
[`Chart.yaml`](https://github.com/nebari-dev/nebari-nebi-pack/blob/main/Chart.yaml)
and [`values.yaml`](https://github.com/nebari-dev/nebari-nebi-pack/blob/main/values.yaml)
on `main`. Check the repo for the latest pinned versions before copying
examples verbatim.

:::

## Prerequisites

| Requirement | Notes |
|---|---|
| Kubernetes ≥ 1.27 | Any CNCF-conformant cluster |
| Helm ≥ 3.12 | |
| `nebari-operator` | Required when `nebariapp.enabled: true` (Nebari clusters only) |
| A dedicated namespace | Recommended: `nebi` |
| Persistent storage | Default StorageClass with RWO support; ~30 Gi total (20 Gi environments + 10 Gi PostgreSQL) |
| ArgoCD | Required for the GitOps path only |

### Local dev loop (Tilt + k3d)

The repo ships a Tiltfile and `ctlptl-config.yaml` for an end-to-end
local dev loop. Prerequisites:
[Docker](https://docs.docker.com/get-docker/),
[ctlptl](https://github.com/tilt-dev/ctlptl),
[Tilt](https://docs.tilt.dev/install.html).

```bash
make up          # k3d cluster + Tilt
# Tilt UI:      http://localhost:10350
# JupyterHub:   http://localhost:8000
make down        # tear down
```

## On Nebari (primary path)

This is the recommended path for Nebari clusters. The `NebariApp` CRD wires routing and Keycloak authentication automatically via `nebari-operator`.

Clone the chart repository and install:

```bash
git clone https://github.com/nebari-dev/nebari-nebi-pack.git
cd nebari-nebi-pack

helm install nebi-pack . \
  --namespace nebi \
  --create-namespace \
  --set nebariapp.hostname=nebi.your-cluster.example.com
```

**What happens on first install:**

1. The PreSync Job runs before any other resources are applied. It creates a Kubernetes Secret containing a random JWT signing key and PostgreSQL password — only if the secret does not already exist.
2. The PostgreSQL StatefulSet starts and waits to become healthy.
3. The Nebi Deployment starts, connects to PostgreSQL, and begins serving on port 8460.
4. `nebari-operator` reconciles the `NebariApp` CRD, provisions a Keycloak OIDC client, and configures Envoy Gateway to enforce authentication.

:::note
`nebari-operator` must be installed and running before the chart is applied. The `NebariApp` CRD is registered by the operator.
:::

### Nebari install (GitOps / ArgoCD)
The recommended production deployment. The chart creates a NebariApp resource that the nebari-operator picks up to provision routing, TLS, and Keycloak OIDC.

save the following to apps/nebi-pack.yaml in your GitOps repo to use as a starting point for configuring nebari:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: nebi-pack
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/nebari-dev/nebari-nebi-pack.git
    path: .
    targetRevision: main
    helm:
      values: |
        nebariapp:
          hostname: nebi.your-cluster.example.com
  destination:
    server: https://kubernetes.default.svc
    namespace: nebi
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
```

The chart includes an ArgoCD **PreSync hook Job** that handles secret creation idempotently. No manual secret bootstrapping is required. See [Architecture](./architecture.md#secret-bootstrap) for details.

## Standalone (without Nebari operator)

Set `nebariapp.enabled=false` to skip the `NebariApp` CRD. You are responsible for exposing the service and handling authentication.

```bash
helm install nebi-pack . \
  --namespace nebi \
  --create-namespace \
  --set nebariapp.enabled=false
```

Expose the service with an Ingress:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: nebi
  namespace: nebi
spec:
  rules:
    - host: nebi.your-cluster.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: nebi-pack-nebari-nebi-pack
                port:
                  number: 80
```

## Verify

Check that all pods are running:

```bash
kubectl get pods -n nebi
```

Expected output:

```
NAME                                          READY   STATUS    RESTARTS   AGE
nebi-pack-nebari-nebi-pack-<hash>             1/1     Running   0          2m
nebi-pack-nebari-nebi-pack-postgres-0         1/1     Running   0          2m
```

Check the health endpoint:

```bash
kubectl port-forward -n nebi svc/nebi-pack-nebari-nebi-pack 8460:80
curl http://localhost:8460/api/v1/health
```

Expected: `{"status":"ok"}` with HTTP 200.

## Upgrade

```bash
helm upgrade nebi-pack . \
  --namespace nebi \
  --reuse-values \
  --set image.tag=sha-<new-tag>
```

The PreSync Job is idempotent — it skips secret creation if the secret already exists.

## Uninstall

```bash
helm uninstall nebi-pack --namespace nebi
```

:::warning PVC retention
`helm uninstall` does **not** delete PersistentVolumeClaims. Environment and database data is preserved. To permanently delete all data:

```bash
kubectl delete pvc -n nebi -l app.kubernetes.io/instance=nebi-pack
```
:::
