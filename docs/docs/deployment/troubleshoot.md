---
title: Troubleshooting
description: Solutions to common issues with the Nebari Nebi Pack.
sidebar_position: 5
---

# Troubleshooting

This page covers the Nebari/ArgoCD production deployment path.

## Diagnostic flow

Run these in order to locate the failure.

**1. Check pod status:**

```bash
kubectl get pods -n nebi
```

All pods should be `Running` with `READY 1/1`. Common problem states:

| State | Where to look next |
|---|---|
| `Pending` | [Pods stuck in Pending](#pods-stuck-in-pending) |
| `CrashLoopBackOff` | [Nebi pod CrashLoopBackOff](#nebi-pod-crashloopbackoff) |
| No pods at all | [PreSync Job failed](#presync-job-failed) |

**2. Check events on a problem pod:**

```bash
kubectl describe pod -n nebi <pod-name>
```

Scroll to the `Events` section at the bottom for the immediate cause.

**3. Check logs:**

```bash
# Nebi server
kubectl logs -n nebi deployment/nebi-pack-nebari-nebi-pack --tail=100

# PostgreSQL
kubectl logs -n nebi nebi-pack-nebari-nebi-pack-postgres-0 --tail=100
```

**4. Check NebariApp conditions:**

```bash
kubectl describe nebariapp -n nebi
```

Look for `RoutingReady`, `TLSReady`, and `AuthReady`. Any `False` condition will have a message explaining why.

**5. Check the ArgoCD sync status:**

In the ArgoCD UI, check the `nebi-pack` Application for sync errors. If the PreSync hook failed, the Job will still be present in the namespace (it self-deletes only on success):

```bash
kubectl get jobs -n nebi
```

If the Job is still present after a sync, see [PreSync Job failed](#presync-job-failed).

---

## PreSync Job failed

**Symptom:** No pods exist in the `nebi` namespace after an ArgoCD sync. `kubectl get jobs -n nebi` shows `nebi-pack-nebari-nebi-pack-secret-init` still present.

**Cause:** The PreSync Job creates the JWT signing key and PostgreSQL password Secret before any other resources are applied. If it fails, the Secret is never created and all pods fail to start.

**Fix:**

Check the Job logs:

```bash
kubectl logs -n nebi job/nebi-pack-nebari-nebi-pack-secret-init
```

Common causes:

- **Image pull failure** — the Job uses `bitnami/kubectl:latest`. If the node can't reach the registry, check image pull events on the Job pod with `kubectl describe pod -n nebi -l job-name=nebi-pack-nebari-nebi-pack-secret-init`.
- **RBAC error** — the Job's ServiceAccount needs `get` and `create` on Secrets in the `nebi` namespace. Verify the Role and RoleBinding were applied:
  ```bash
  kubectl get role,rolebinding -n nebi | grep secret-init
  ```
- **Namespace not created** — if the `nebi` namespace didn't exist before the hook ran, ensure `CreateNamespace=true` is present in syncOptions (already set in the recommended Application manifest in [Deploy the pack](./deploy.md)).

After fixing the root cause, re-sync the ArgoCD Application. The Job will re-run and create the Secret if it does not already exist.

---

## Pods stuck in Pending

**Symptom:** `kubectl get pods -n nebi` shows one or both pods in `Pending` indefinitely.

**Cause:** A PersistentVolumeClaim cannot bind. The Nebi pod requires a 20 Gi RWO environments PVC; PostgreSQL requires a 10 Gi RWO data PVC. Both need a StorageClass that supports `ReadWriteOnce`.

**Fix:**

Check PVC status:

```bash
kubectl get pvc -n nebi
kubectl describe pvc -n nebi <pvc-name>
```

The `Events` section will say why binding failed (e.g. `no persistent volumes available`, `storageclass not found`).

List available StorageClasses to find the right name:

```bash
kubectl get storageclasses
```

Then set the StorageClass explicitly in your ArgoCD Application values and re-sync:

```yaml
helm:
  values: |
    persistence:
      storageClassName: your-storage-class
    postgres:
      storage:
        storageClassName: your-storage-class
```

---

## Nebi pod CrashLoopBackOff

**Symptom:** `nebi-pack-nebari-nebi-pack-<hash>` cycles through `CrashLoopBackOff`. The PostgreSQL pod is `Running`.

**Cause:** Most commonly the Secret doesn't exist (PreSync Job failed on a previous sync), or the pod started before PostgreSQL finished initializing.

**Fix:**

Read the logs from the previous (crashed) container:

```bash
kubectl logs -n nebi deployment/nebi-pack-nebari-nebi-pack --previous
```

- **Secret missing** — logs will show a `secret not found` or missing key error. Verify the Secret exists:
  ```bash
  kubectl get secret nebi-pack-nebari-nebi-pack -n nebi
  ```
  If it doesn't, see [PreSync Job failed](#presync-job-failed).

- **Database connection refused** — logs will show a `connection refused` or `dial tcp` error pointing at the PostgreSQL address. PostgreSQL may still be initializing on first install. Once the postgres pod is `Ready`, restart the Nebi Deployment:
  ```bash
  kubectl rollout restart deployment/nebi-pack-nebari-nebi-pack -n nebi
  ```

---

## NebariApp not progressing

**Symptom:** `kubectl describe nebariapp -n nebi` shows `RoutingReady`, `TLSReady`, or `AuthReady` stuck at `False` or `Unknown`. The hostname returns 404.

**Cause A — Missing namespace label:** `nebari-operator` silently ignores NebariApp resources in namespaces that don't have the `nebari.dev/managed: "true"` label.

Check the label:

```bash
kubectl get ns nebi --show-labels
```

If `nebari.dev/managed=true` is absent, the `managedNamespaceMetadata` block is missing from your ArgoCD Application manifest. Add it and re-sync:

```yaml
syncPolicy:
  managedNamespaceMetadata:
    labels:
      nebari.dev/managed: "true"
```

ArgoCD will apply the label to the namespace and `nebari-operator` will begin reconciling.

**Cause B — `nebari-operator` not installed:**

```bash
kubectl get pods -n nebari-operator-system
```

If the namespace doesn't exist or the operator pod is not running, install `nebari-operator` before syncing the nebi-pack Application.

---

## ArgoCD sync failing

**Symptom:** ArgoCD reports a sync error containing `no matches for kind "NebariApp"` or a dry-run validation failure referencing the NebariApp resource.

**Cause:** `SkipDryRunOnMissingResource=true` is missing from syncOptions. ArgoCD performs a server-side dry-run before applying resources. If the `NebariApp` CRD isn't installed yet (e.g. `nebari-operator` hasn't synced first), the dry-run rejects the manifest and the sync fails.

**Fix:**

Add `SkipDryRunOnMissingResource=true` to the Application's `syncOptions` (already included in the recommended manifest in [Deploy the pack](./deploy.md)):

```yaml
syncOptions:
  - CreateNamespace=true
  - ServerSideApply=true
  - SkipDryRunOnMissingResource=true
```

Re-sync the Application after updating.

---

## Users have no admin access

**Symptom:** A user can authenticate but cannot perform admin actions in Nebi.

**Cause:** The user's Keycloak group is not listed in `auth.proxyAdminGroups`. The default value is `admin,nebi-admin`.

**Fix:**

Check the user's group membership in Keycloak, then add the group to `auth.proxyAdminGroups` in your ArgoCD Application values:

```yaml
helm:
  values: |
    auth:
      proxyAdminGroups: "admin,nebi-admin,your-group"
```

Commit the change and ArgoCD will roll out an updated Deployment.

---

## JupyterLab / data-science-pack integration

These issues apply when the nebi-pack and data-science-pack are deployed together. See [Deploy with the data-science-pack](./with-data-science-pack.md) for the expected configuration.

A quick end-to-end check — spawn a JupyterLab server and open a terminal:

```bash
nebi whoami          # should return your username without prompting for login
nebi workspace list  # should list workspaces from the nebi server
```

If either command fails, work through the sections below.

### `nebi whoami` fails with an auth error

**Symptom:** `nebi whoami` returns an authentication error, or `NEBI_AUTH_TOKEN` is empty inside the pod.

**Cause:** Token exchange between JupyterHub and Nebi failed. On pod spawn, JupyterHub uses RFC 8693 token exchange to convert its Keycloak access token into a Nebi JWT. This requires `tokenExchange.enabled: true` on the Nebi NebariApp and matching OIDC client IDs.

**Fix:**

Check hub logs for token-exchange errors:

```bash
kubectl logs -n data-science -l component=hub --tail=200 | grep -i "nebi\|token-exchange"
```

Verify `tokenExchange` is enabled on the NebariApp:

```bash
kubectl get nebariapp -n nebi -o yaml | grep -A3 tokenExchange
```

If not set, add it to the nebi-pack ArgoCD Application values and re-sync:

```yaml
nebariapp:
  auth:
    tokenExchange:
      enabled: true
```

Verify the client IDs in the data-science-pack values match the auto-provisioned Keycloak clients. The naming formula is `<namespace>-<release>-<chart-name>`:

```yaml
jupyterhub:
  custom:
    nebi-client-id: "nebi-nebi-pack-nebari-nebi-pack"
    jupyterhub-client-id: "data-science-data-science-pack-nebari-data-science-pack"
```

If you used non-default release names or namespaces, recalculate these using the formula in [Client IDs and auto-provisioned secrets](./with-data-science-pack.md#client-ids-and-auto-provisioned-secrets).

Verify the OIDC client secrets were provisioned by `nebari-operator`:

```bash
kubectl get secret -n nebi nebi-pack-nebari-nebi-pack-oidc-client
kubectl get secret -n data-science data-science-pack-nebari-data-science-pack-oidc-client
```

If either secret is missing, `nebari-operator` has not yet reconciled the NebariApp — see [NebariApp not progressing](#nebariapp-not-progressing).

### `nebi workspace list` fails / Nebi unreachable from JupyterLab

**Symptom:** `nebi workspace list` returns a connection error. `nebi whoami` succeeds.

**Cause A — Wrong `internalURL`:** The data-science-pack uses `nebi.internalURL` for in-cluster API calls. If this value doesn't match the actual Service name and namespace, all CLI calls from inside pods will fail.

Verify the Service name:

```bash
kubectl get svc -n nebi
```

The Service name follows the pattern `<release>-nebari-nebi-pack`. With the default release name `nebi-pack`, the correct `internalURL` is:

```
http://nebi-pack-nebari-nebi-pack.nebi.svc.cluster.local
```

Test reachability directly from inside the cluster:

```bash
kubectl run nebi-probe --rm -it --image=curlimages/curl --restart=Never -- \
  curl -sf http://nebi-pack-nebari-nebi-pack.nebi.svc.cluster.local/api/v1/health
```

**Cause B — `/api/` route not public:** The nebi-pack NebariApp must declare `/api/` and `/docs/` as public routes so that in-cluster service calls and CLI tools can reach the Nebi API without a browser session. Without this, the Envoy Gateway enforces OIDC on all paths.

Ensure `publicRoutes` is set in the nebi-pack ArgoCD Application values:

```yaml
nebariapp:
  routing:
    publicRoutes:
      - pathPrefix: /api/
        pathType: PathPrefix
      - pathPrefix: /docs/
        pathType: PathPrefix
```

**Cause C — NetworkPolicy blocking egress:** On clusters where kube-proxy DNAT's the LoadBalancer VIP before NetworkPolicy evaluation (common on Hetzner), singleuser pods need an explicit egress rule to reach the Nebi gateway hostname. See [Network egress for singleuser pods](./with-data-science-pack.md#network-egress-for-singleuser-pods) for the required NetworkPolicy configuration.

### `nebi` command not found in JupyterLab

**Symptom:** Running `nebi` in a JupyterLab terminal returns `command not found`.

**Cause:** The init container that copies the nebi binary into the singleuser pod failed or did not run.

**Fix:**

Find the singleuser pod name and check its init container logs:

```bash
kubectl get pods -n data-science
kubectl logs -n data-science <singleuser-pod-name> -c nebi-init
```

If the init container image couldn't be pulled or exited with an error, check events:

```bash
kubectl describe pod -n data-science <singleuser-pod-name>
```

A failed init container prevents the main container from starting — the pod will be stuck in `Init:Error` or `Init:CrashLoopBackOff`. After fixing the underlying cause, the user should stop and restart their JupyterLab server from the JupyterHub control panel.
