# -*- mode: Python -*-
# Tiltfile for nebari-nebi-pack local development
#
# References:
# - Tilt helm integration: https://docs.tilt.dev/helm.html
# - allow_k8s_contexts: https://docs.tilt.dev/api.html#api.allow_k8s_contexts

# Increase apply timeout for slow operations like image pulls
update_settings(k8s_upsert_timeout_secs=600)

# Safety: Only allow deployment to local k3d cluster
allow_k8s_contexts('k3d-nebari-dev')

# Deploy the Helm chart using helm() for templating
k8s_yaml(helm(
    '.',
    name='nebi',
    namespace='default',
    set=[
        # Disable NebariApp CRD for local dev (not running on Nebari)
        'nebariapp.enabled=false',
        # Use local-path storage class for k3d
        'persistence.storageClassName=local-path',
        'postgres.storage.storageClassName=local-path',
    ],
))

# Configure the nebi resource for port forwarding
k8s_resource(
    workload='nebi-nebari-nebi-pack',
    port_forwards=['8460:8460'],
    labels=['nebi'],
)

# Configure the postgres resource
k8s_resource(
    workload='nebi-nebari-nebi-pack-postgres',
    labels=['nebi'],
)
