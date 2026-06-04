---
title: Deploy the pack
description: Step-by-step instructions for deploying the Nebari Nebi Pack.
sidebar_position: 1
---

# Deploy the pack

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

### GitOps / ArgoCD

Point an ArgoCD `Application` at the chart repository:

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
