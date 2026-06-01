# nebari-nebi-pack

Nebi deployment pack for Nebari.

## Runtime Theming

This chart supports runtime UI branding/theming through `theme.*` values. It renders a `ConfigMap` as `/app/public/config.json` and sets `NEBI_THEME_CONFIG_PATH=/app/public/config.json` on the Nebi container.

Example:

```bash
helm upgrade --install nebi . \
  --set theme.title="Acme Nebi" \
  --set theme.logoUrl="https://assets.example.com/acme-logo.svg" \
  --set theme.faviconUrl="https://assets.example.com/acme-favicon.ico" \
  --set theme.light.primary="#0b63f6" \
  --set theme.dark.primary="#8db0ff"
```
