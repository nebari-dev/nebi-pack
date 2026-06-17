# nebari-nebi-pack

Nebi deployment pack for Nebari.

## Runtime Branding

This chart supports runtime branding through `branding.*` values. It renders a `ConfigMap` as `/app/public/config.json` and sets `NEBI_BRANDING_CONFIG_PATH=/app/public/config.json` on the Nebi container.

Example:

```bash
helm upgrade --install nebi . \
  --set branding.title="Acme Nebi" \
  --set branding.logoUrl="https://assets.example.com/acme-logo.svg" \
  --set branding.faviconUrl="https://assets.example.com/acme-favicon.ico" \
  --set branding.theme.light.primary="#0b63f6" \
  --set branding.theme.dark.primary="#8db0ff"
```
