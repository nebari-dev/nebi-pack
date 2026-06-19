# nebari-nebi-pack
Nebi deployment pack for Nebari

## Install from Helm Repository

The chart is published to the central Nebari Helm repository:

```bash
helm repo add nebari https://raw.githubusercontent.com/nebari-dev/helm-repository/gh-pages/
helm repo update
helm install nebi nebari/nebari-nebi-pack
```

It is also available as an OCI artifact on quay.io (no `helm repo add` needed):

```bash
helm install nebi oci://quay.io/nebari/charts/nebari-nebi-pack --version <version>
```

> **Cutover note:** releases from `0.1.0-alpha.7` onward publish to the central
> repository above. The previous per-repo index at
> `https://nebari-dev.github.io/nebari-nebi-pack` is frozen; releases packaged
> there before the cutover remain installable from it, but new versions land
> only in the central repository.
