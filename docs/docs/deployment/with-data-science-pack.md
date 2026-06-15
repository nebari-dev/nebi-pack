---
title: Deploy with the data-science-pack
description: How to deploy the Nebari Nebi Pack alongside the nebari-data-science-pack (JupyterHub) on a Nebari cluster.
sidebar_position: 2
---

# Deploy with the data-science-pack

This guide covers deploying the nebi-pack and the
[nebari-data-science-pack](https://github.com/nebari-dev/nebari-data-science-pack) together on the same
Nebari cluster, so JupyterHub users can select Nebi-managed pixi environments when spawning servers.

## How the integration works

```
Browser ──OIDC──► Envoy Gateway ──► JupyterHub (data-science-pack)
                                          │ token exchange (RFC 8693)
                                          ▼
                                    Nebi API (nebi-pack)
                                          │ pixi workspace
                                          ▼
                                    Environments PVC
```

On every pod spawn the data-science-pack:
1. Copies the `nebi` binary into the singleuser pod via an init container.
2. Exchanges the user's Keycloak token for a Nebi JWT and injects it as `NEBI_AUTH_TOKEN`, so `nebi` CLI commands work without re-authenticating.
3. Sets `NEBI_REMOTE_URL` so the nebi CLI knows which server to talk to.

For the **main JupyterLab session** there is no automatic pull — `nebi pull` is expected to be run
manually in a terminal. The nebi binary is pre-installed and pre-authenticated, so running it
requires no extra login step.

| Scenario | Behavior |
|---|---|
| Open main JupyterLab | nebi binary available + pre-authenticated; run `nebi pull <workspace>` yourself |
| Launch app via jhub-apps with workspace selected | init container auto-pulls and runs `pixi install` before the app starts |

Two values wire the packs together:

| Value (data-science-pack) | What it points to |
|---|---|
| `nebi.remoteURL` | External URL that **browsers** reach Nebi at (gateway hostname) |
| `nebi.internalURL` | In-cluster Service URL — pods call this directly, bypassing the gateway |

JupyterHub acquires environment metadata from `internalURL` (low-latency, no TLS). The user's browser
is redirected to `remoteURL` for the full Nebi UI.

**Automatic pull only happens for jhub-apps named servers.** When a user launches an app through
jhub-apps and selects a workspace in the environment selector, an additional init container runs
`nebi pull <workspace> && pixi install` before the app pod starts.

## Prerequisites

Everything in the [Deploy the pack prerequisites](./deploy.md#prerequisites), plus:

- An ArgoCD GitOps repository (the app-of-apps pattern shown below)
- `nebari-operator` running on the cluster
- The **nebi-pack** deployed and healthy before the data-science-pack syncs

## 1. Deploy the nebi-pack

### ArgoCD Application

Save this to `apps/nebi-pack.yaml` in your GitOps repo. The values below highlight the options that
differ from a standalone nebi-pack deployment:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: nebi-pack
  namespace: argocd
  labels:
    app.kubernetes.io/part-of: nebari-packs
  finalizers:
    - resources-finalizer.argocd.argoproj.io
spec:
  project: default
  source:
    repoURL: https://github.com/nebari-dev/nebari-nebi-pack.git
    path: .
    targetRevision: main         # pin to a release tag in production
    helm:
      releaseName: nebi-pack
      values: |
        nebariapp:
          hostname: nebi.your-cluster.example.com
          routing:
            routes:
              - pathPrefix: /
            # Nebi enforces its own JWT auth on the API — bypass gateway OIDC
            # for API and docs routes so CLI tools and the JupyterHub integration
            # can reach Nebi directly without a browser session.
            publicRoutes:
              - pathPrefix: /api/
                pathType: PathPrefix
              - pathPrefix: /docs/
                pathType: PathPrefix
          auth:
            enabled: true
            provider: keycloak
            provisionClient: true
            redirectURI: /oauth2/callback
            # Required: lets JupyterHub exchange its access token for a Nebi token
            # via RFC 8693 token exchange.
            tokenExchange:
              enabled: true
            # Required: enables OAuth 2.0 device authorization flow so notebook
            # cells and CLI tools can authenticate without a browser redirect.
            deviceFlowClient:
              enabled: true
          landingPage:
            enabled: true
            healthCheck:
              enabled: true
              path: /api/v1/health
        # Enable direct OIDC so Nebi can validate tokens from JupyterHub.
        # The client ID and secret are auto-provisioned by nebari-operator;
        # the deterministic name is described in the Client IDs section below.
        auth:
          oidc:
            enabled: true
            issuerURL: "https://keycloak.your-cluster.example.com/realms/nebari"
            clientID: nebi-nebi-pack-nebari-nebi-pack
            clientSecretName: nebi-pack-nebari-nebi-pack-oidc-client
        # Set if your cluster's default StorageClass does not support RWO,
        # or to pin to a specific class (e.g. hcloud-volumes on Hetzner).
        # persistence:
        #   storageClassName: hcloud-volumes
        # postgres:
        #   storage:
        #     storageClassName: hcloud-volumes
  destination:
    server: https://kubernetes.default.svc
    namespace: nebi
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    managedNamespaceMetadata:
      labels:
        nebari.dev/managed: "true"   # required — operator ignores apps without this
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

The `managedNamespaceMetadata` block applies `nebari.dev/managed: "true"` to the namespace.
**Without this label `nebari-operator` silently ignores the `NebariApp` resource** — the hostname
returns 404 and `kubectl describe nebariapp` shows no progress on conditions.

:::

## 2. Deploy the data-science-pack

### ArgoCD Application

Save this to `apps/data-science-pack.yaml` in your GitOps repo:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: data-science-pack
  namespace: argocd
  labels:
    app.kubernetes.io/part-of: nebari-packs
  finalizers:
    - resources-finalizer.argocd.argoproj.io
spec:
  project: default
  source:
    repoURL: https://github.com/nebari-dev/nebari-data-science-pack.git
    targetRevision: main         # pin to a release tag in production
    path: .
    helm:
      releaseName: data-science-pack
      values: |
        nebariapp:
          hostname: jupyter.your-cluster.example.com
          routing:
            routes:
              - pathPrefix: /
          auth:
            enabled: true
            provider: keycloak
            provisionClient: true
            # JupyterHub runs its own OAuth2 callback — do not enforce gateway OIDC.
            enforceAtGateway: false
            forwardAccessToken: false
            redirectURI: /hub/oauth_callback
          landingPage:
            enabled: true

        # Point the data-science-pack at the running nebi-pack.
        # remoteURL: what users' browsers reach (external gateway hostname)
        # internalURL: what pods call inside the cluster (bypasses gateway, faster)
        nebi:
          remoteURL: "https://nebi.your-cluster.example.com"
          internalURL: "http://nebi-pack-nebari-nebi-pack.nebi.svc.cluster.local"
          namespace: nebi

        # JupyterHub custom config for Nebi integration.
        # Client IDs here must match the auto-provisioned Keycloak clients —
        # see the Client IDs section below for the naming formula.
        jupyterhub:
          custom:
            nebi-remote-url: "https://nebi.your-cluster.example.com"
            nebi-internal-url: "http://nebi-pack-nebari-nebi-pack.nebi.svc.cluster.local"
            nebi-client-id: "nebi-nebi-pack-nebari-nebi-pack"
            jupyterhub-client-id: "data-science-data-science-pack-nebari-data-science-pack"
            nebi-environment-selector: true
          hub:
            config:
              JupyterHub:
                authenticator_class: generic-oauth
            extraEnv:
              # The OIDC client secret is auto-provisioned into this secret by
              # nebari-operator. The secret name follows the same deterministic
              # formula as the client ID (see Client IDs below).
              JUPYTERHUB_OIDC_CLIENT_SECRET:
                valueFrom:
                  secretKeyRef:
                    name: data-science-pack-nebari-data-science-pack-oidc-client
                    key: client-secret

        # Shared storage for per-group /shared/<group> directories.
        # Requires a ReadWriteMany StorageClass (e.g. longhorn, or NFS server below).
        sharedStorage:
          enabled: true
          size: 10Gi
          # Enable the in-cluster NFS server when no RWX StorageClass is available.
          # nfsServer:
          #   enabled: true
          #   storageClass: your-rwo-storage-class

        rbac:
          bootstrap:
            hubClientId: "data-science-data-science-pack-nebari-data-science-pack"

  destination:
    server: https://kubernetes.default.svc
    namespace: data-science
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
      - RespectIgnoreDifferences=true
    retry:
      limit: 5
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 3m
```

## Client IDs and auto-provisioned secrets

`nebari-operator` auto-provisions a Keycloak client for every `NebariApp` and stores the client
secret in a deterministic Kubernetes Secret.

The naming formulas are:

```
Keycloak client ID:  <namespace>-<helm-release-name>-<chart-name>
Secret name:         <helm-release-name>-<chart-name>-oidc-client
```

With the defaults used in this guide:

| Resource | Namespace | Helm release | Chart name | → |
|---|---|---|---|---|
| nebi-pack | `nebi` | `nebi-pack` | `nebari-nebi-pack` | client: `nebi-nebi-pack-nebari-nebi-pack` |
| data-science-pack | `data-science` | `data-science-pack` | `nebari-data-science-pack` | client: `data-science-data-science-pack-nebari-data-science-pack` |

:::note[Changing release names or namespaces]

If you use different Helm release names or deploy into different namespaces, recalculate the client
IDs using the formulas above and update the `nebi-client-id`, `jupyterhub-client-id`,
`auth.oidc.clientID`, and `rbac.bootstrap.hubClientId` values accordingly.

:::

Verify the secrets were created after the first sync:

```bash
kubectl get secret -n nebi nebi-pack-nebari-nebi-pack-oidc-client
kubectl get secret -n data-science data-science-pack-nebari-data-science-pack-oidc-client
```

## Shared storage

The data-science-pack mounts per-group directories at `/shared/<group>` inside singleuser pods.
This requires a **ReadWriteMany (RWX)** StorageClass.

| Cluster type | Recommended setup |
|---|---|
| NIC-managed Hetzner | Longhorn (`storageClass: longhorn`) provides RWX |
| Cluster without RWX class | Enable `sharedStorage.nfsServer.enabled: true` with any RWO class |
| Shared storage not needed | `sharedStorage.enabled: false` |

```yaml
sharedStorage:
  enabled: true
  size: 10Gi
  storageClass: longhorn           # RWX StorageClass
```

Or with the bundled NFS server:

```yaml
sharedStorage:
  enabled: true
  size: 10Gi
  nfsServer:
    enabled: true
    storageClass: hcloud-volumes   # any RWO class to back the NFS server
    installClient: true
    mountOptions:
      - nfsvers=3
      - proto=tcp
```

## Network egress for singleuser pods

On clusters where kube-proxy DNAT's the LoadBalancer VIP before NetworkPolicy evaluation (common
on Hetzner), singleuser pods need an explicit egress rule to reach Nebi via its external hostname.
Without it, the egress request is dropped at the NetworkPolicy layer before it reaches the gateway.

```yaml
jupyterhub:
  singleuser:
    networkPolicy:
      egress:
        - to:
            - namespaceSelector:
                matchLabels:
                  kubernetes.io/metadata.name: envoy-gateway-system
              podSelector:
                matchLabels:
                  gateway.envoyproxy.io/owning-gateway-name: nebari-gateway
          ports:
            - port: 10443
              protocol: TCP
```

This is not needed on clusters where pods can reach the external hostname directly (e.g. via a
cloud LoadBalancer that routes back into the cluster without kube-proxy DNAT).

## Verifying the integration

After both packs are synced and healthy:

**1. Check NebariApp conditions for both packs:**

```bash
kubectl get nebariapp -n nebi
kubectl get nebariapp -n data-science
kubectl describe nebariapp -n nebi
kubectl describe nebariapp -n data-science
```

`RoutingReady`, `TLSReady`, and `AuthReady` should all be `True`.

**2. Confirm Nebi is reachable from inside the cluster:**

```bash
kubectl run nebi-probe --rm -it --image=curlimages/curl --restart=Never -- \
  curl -sf http://nebi-pack-nebari-nebi-pack.nebi.svc.cluster.local/api/v1/health
```

Expected: `{"status":"healthy"}`.

**3. Verify the nebi binary and token injection in JupyterLab:**

Log in to JupyterHub, spawn a JupyterLab server, and open a terminal. The nebi binary should be
present and pre-authenticated:

```bash
nebi whoami          # should return your username without prompting for login
nebi workspace list  # should list workspaces from the nebi server
```

If `nebi whoami` fails or returns an auth error, check hub logs for token-exchange failures:

```bash
kubectl logs -n data-science -l component=hub --tail=100 | grep -i "nebi\|token-exchange"
```

## Next steps

- **Full nebi-pack chart reference** → [values.yaml reference](./values.md)
- **Troubleshooting** → [Troubleshoot](./troubleshoot.md)
- **nebari-data-science-pack upstream docs** → [GitHub](https://github.com/nebari-dev/nebari-data-science-pack)
