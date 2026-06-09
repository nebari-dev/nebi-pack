---
title: Deploy the pack
description: Step-by-step instructions for deploying the Nebari Nebi Pack.
sidebar_position: 1
---

# Deploy the pack

This guide is for **operators** installing the pack on a Kubernetes
cluster. End users connecting to an already-deployed cluster should read
[Use the pack](../user-guide/use) instead.

:::note[Defaults reflect chart v0.1.0-alpha.4]

Image tags and other defaults cited below match
[`Chart.yaml`](https://github.com/nebari-dev/nebari-nebi-pack/blob/main/Chart.yaml)
and [`values.yaml`](https://github.com/nebari-dev/nebari-nebi-pack/blob/main/values.yaml)
on `main`. Check the repo for the latest pinned versions before copying
examples verbatim.

:::

The pack deploys:

- **Nebi server** — a single-pod Deployment running `--mode=both` (API + background worker combined). Image: `quay.io/nebari/nebi`. Listens on port 8460.
- **PostgreSQL 16** — an embedded StatefulSet for application state and workspace metadata. 10 Gi persistent storage.
- **ClusterIP Service** — exposes the Nebi server on port 80 within the cluster.
- **Environments PVC** — 20 Gi RWO volume mounted at `/app/data/environments` for pixi workspace files.
- **Secret** — JWT signing key and PostgreSQL password, created once by a PreSync Job and never overwritten on upgrade.
- **NebariApp** *(Nebari clusters only)* — configures Envoy Gateway routing and provisions a Keycloak OIDC client automatically.
- **ServiceAccount** — bound to the Nebi Deployment.

See [Architecture](./architecture.md) for a full resource breakdown and request flow diagram.

## Prerequisites

| Requirement | Details |
|---|---|
| Kubernetes ≥ 1.27 | Any CNCF-conformant cluster; [k3d](https://k3d.io/) works for local dev |
| Helm ≥ 3.12 | |
| `nebari-operator` | Required when `nebariapp.enabled: true` (Nebari clusters only) |
| Persistent storage | Default StorageClass with RWO support; ~30 Gi total |
| ArgoCD | Required for the GitOps path only |

## Standalone install (no Nebari)

Use this path for local dev or clusters without `nebari-operator`. Skips
the NebariApp routing layer entirely. You are responsible for exposing
the service and handling authentication.

### From source

```bash
git clone https://github.com/nebari-dev/nebari-nebi-pack.git
cd nebari-nebi-pack

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

### Local dev loop (Tilt + k3d)

The [repo](https://github.com/nebari-dev/nebari-nebi-pack) ships a Tiltfile and `ctlptl-config.yaml` for an end-to-end
local dev loop. Prerequisites:
[Docker](https://docs.docker.com/get-docker/),
[ctlptl](https://github.com/tilt-dev/ctlptl),
[Tilt](https://docs.tilt.dev/install.html).

```bash
make up      # creates the k3d cluster and starts Tilt
# Tilt UI:  http://localhost:10350
# Nebi UI:  http://localhost:8460  (Tilt auto-forwards this port)
make down    # tear down cluster and Tilt
```

:::note
In the local dev loop, Tilt uses `nebi` as the Helm release name, so
resources are named `nebi-nebari-nebi-pack` (not `nebi-pack-nebari-nebi-pack`).
The `kubectl` commands in [Verifying the deployment](#verifying-the-deployment)
use the `nebi-pack` release name from the Helm/ArgoCD paths — adjust
accordingly if you are inspecting a Tilt-managed deployment.
:::



## Nebari install (ArgoCD + GitOps)

The recommended production deployment. The chart creates a `NebariApp`
resource that `nebari-operator` picks up to provision routing, TLS, and
Keycloak OIDC.

Save the following to `apps/nebi-pack.yaml` in your GitOps repo:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: nebi-pack
  namespace: argocd
  finalizers:
    - resources-finalizer.argocd.argoproj.io
spec:
  project: default
  source:
    repoURL: https://github.com/nebari-dev/nebari-nebi-pack.git
    path: .
    targetRevision: main
    helm:
      releaseName: nebi-pack
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
    managedNamespaceMetadata:
      labels:
        nebari.dev/managed: "true"
    syncOptions:
      - CreateNamespace=true
      - ServerSideApply=true
      - SkipDryRunOnMissingResource=true
    retry:
      limit: 5
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 3m
```

:::warning[`nebari.dev/managed: "true"` is required]

The `managedNamespaceMetadata` block applies the `nebari.dev/managed`
label to the namespace. **Without this label the nebari-operator will
silently ignore your NebariApp resource** — the hostname will return 404
and `kubectl describe nebariapp` will show no progress on conditions.

:::

**What happens on first sync:**

1. The PreSync Job runs before any other resources are applied. It creates a Kubernetes Secret containing a random JWT signing key and PostgreSQL password — only if the secret does not already exist.
2. The PostgreSQL StatefulSet starts and waits to become healthy.
3. The Nebi Deployment starts, connects to PostgreSQL, and begins serving on port 8460.
4. `nebari-operator` reconciles the `NebariApp` CRD, provisions a Keycloak OIDC client, and configures Envoy Gateway to enforce authentication.

The chart's PreSync hook handles secret creation idempotently — no manual
bootstrapping required. See [Architecture](./architecture.md#secret-bootstrap) for details.

## Configuration

Configuring the chart beyond the defaults — auth groups, OIDC, storage
size, resource limits, the landing page card — is covered in the
[values.yaml reference](./values.md).

## Verifying the deployment

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

If `nebariapp.enabled`, check the NebariApp conditions:

```bash
kubectl get nebariapp -n nebi
kubectl describe nebariapp -n nebi
```

You want `RoutingReady`, `TLSReady`, and `AuthReady` all `True`.

## Upgrade

```bash
helm upgrade nebi-pack . \
  --namespace nebi \
  --reuse-values \
  --set image.tag=sha-<new-tag>
```

The PreSync Job is idempotent — it skips secret creation if the secret
already exists.

## Uninstall

```bash
helm uninstall nebi-pack --namespace nebi
```

:::warning PVC retention
`helm uninstall` does **not** delete PersistentVolumeClaims. Environment
and database data is preserved. To permanently delete all data:

```bash
kubectl delete pvc -n nebi -l app.kubernetes.io/instance=nebi-pack
```
:::

## Operator troubleshooting

Recovery steps for common failures — pods not starting, NebariApp stuck
on conditions, secret bootstrap errors — live on the
[Troubleshoot](../user-guide/troubleshoot.md) page.

## Next steps

- **End users** → [Use the pack](../user-guide/use.md) — log in and manage environments.
- **Full chart reference** → [values.yaml reference](./values.md) — every option with type, default, and description.
- **How it fits together** → [Architecture](./architecture.md) — the Kubernetes resources the chart creates and how they interact.
- **Upstream docs** → [Nebi](https://github.com/nebari-dev/nebi), [Pixi](https://pixi.sh).
