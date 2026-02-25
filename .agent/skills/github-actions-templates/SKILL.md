---
name: github-actions-templates
description: GitHub Actions CI/CD best practices and templates. Use when working with GitHub Actions workflows, deployment pipelines, CI/CD configuration, or when asked to "set up deployment", "fix the pipeline", "optimize CI", or "add GitHub Actions".
metadata:
  version: 1.0.0
---

# GitHub Actions Templates

Expert guidance for building efficient, secure CI/CD pipelines with GitHub Actions.

## Workflow Structure Best Practices

### File Organization
```
.github/
  workflows/
    ci.yml          # Lint, test, type-check on PR
    deploy.yml      # Deploy on push to main
    preview.yml     # Deploy preview on PR (optional)
```

### Naming & Triggers
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch:  # Manual trigger

concurrency:
  group: deploy-${{ github.ref }}
  cancel-in-progress: true
```

## Vite + React Deployment

### Build & Deploy to GitHub Pages
```yaml
name: Deploy

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: app/package-lock.json

      - name: Install dependencies
        run: npm ci
        working-directory: app

      - name: Build
        run: npm run build
        working-directory: app

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: app/dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

## Performance Optimization

### Caching
```yaml
- uses: actions/setup-node@v4
  with:
    node-version: 20
    cache: npm
    cache-dependency-path: '**/package-lock.json'
```

### Conditional Steps
```yaml
- name: Run tests
  if: github.event_name == 'pull_request'
  run: npm test
```

### Matrix Builds (for multi-environment)
```yaml
strategy:
  matrix:
    node-version: [18, 20, 22]
```

## Security Best Practices

1. **Pin action versions** — Use `@v4` not `@main`
2. **Use secrets** — `${{ secrets.MY_SECRET }}`
3. **Minimal permissions** — Only grant what's needed
4. **Never log secrets** — Use masking
5. **Use `npm ci`** not `npm install` — Ensures reproducible builds
6. **Set `concurrency`** — Prevent duplicate deploys

## Environment Variables

```yaml
env:
  VITE_API_URL: ${{ vars.API_URL }}
  VITE_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
  VITE_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
```

**CRITICAL**: Vite env vars must be prefixed with `VITE_` to be exposed to client code.

## Common Issues & Fixes

### SPA Routing on GitHub Pages
Add a `404.html` that redirects to `index.html`:
```yaml
- name: Copy index.html to 404.html
  run: cp dist/index.html dist/404.html
  working-directory: app
```

### Base Path Configuration
For repos deployed to `https://user.github.io/repo-name/`:
```ts
// vite.config.ts
export default defineConfig({
  base: '/repo-name/',
})
```

### Build Failures
- Check Node version matches local development
- Verify all env vars are set in GitHub Settings > Secrets
- Ensure `npm ci` works (check `package-lock.json` is committed)

## Debugging Workflows

```yaml
- name: Debug info
  run: |
    echo "Event: ${{ github.event_name }}"
    echo "Ref: ${{ github.ref }}"
    echo "SHA: ${{ github.sha }}"
    node --version
    npm --version
```

## Workflow Status Badge
Add to README:
```markdown
![Deploy](https://github.com/USER/REPO/actions/workflows/deploy.yml/badge.svg)
```
