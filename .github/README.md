# Exemple de pipeline CI/CD pour amélioration continue

Ce workflow GitHub Actions automatise les tests, la qualité et le déploiement du projet.

```yaml
name: CI/CD Velo Platform
on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  build-test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      - name: Install dependencies
        run: npm install --prefix backend && npm install --prefix frontend
      - name: Lint backend
        run: npm run lint --prefix backend
      - name: Lint frontend
        run: npm run lint --prefix frontend
      - name: Run backend tests
        run: npm test --prefix backend
      - name: Run frontend tests
        run: npm run test --prefix frontend
      - name: Run E2E tests (Cypress)
        run: npx cypress run --project frontend
      - name: Upload coverage
        uses: actions/upload-artifact@v3
        with:
          name: coverage-report
          path: backend/coverage/
      - name: Build Docker images
        run: docker-compose -f docker-compose.dev.yml build
      - name: Deploy (optionnel)
        if: github.ref == 'refs/heads/main'
        run: echo "Déploiement automatique ici (ex: vers Heroku, GCP, etc.)"
```

## Points clés
- Tests, lint et build automatisés à chaque push/PR
- Upload des rapports de couverture
- Déploiement automatique sur la branche principale
- Facile à enrichir (alertes, analyse de logs, auto-fix)

💡 Pour l'amélioration continue : ajoutez des étapes pour analyser les logs, créer des issues GitHub en cas d'échec, ou déclencher des auto-fixes.

➡️ Intégrez ce workflow dans `.github/workflows/ci-cd.yml`.
