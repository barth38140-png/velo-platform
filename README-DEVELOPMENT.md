Velo Platform — Development & E2E instructions

Quick start (local with Docker Compose):

- Build and start all services in background:

```powershell
docker-compose up -d --build
```

- Tail logs (frontend or cypress):

```powershell
docker-compose logs --tail=200 frontend

docker-compose logs --tail=200 cypress
```

- Run Cypress once (single-shot):

```powershell
docker-compose up --build --abort-on-container-exit cypress
```

Notes & troubleshooting:

- Host header issues: the dev `vite` server is configured to accept the Compose service host `frontend` and `host.docker.internal` where needed. Prefer using the Compose service name `http://frontend:3000` for internal requests.

- Native binaries (esbuild/rollup) must be built for Linux inside the image. If you see errors about `@esbuild/win32` or `@rollup/rollup-linux-x64-gnu`, regenerate `package-lock.json` within a Linux container and rebuild the image:

```powershell
# from repo root
# run a linux node container and regenerate lockfile
docker run --rm -v ${PWD}:/app -w /app node:20-bullseye-slim sh -c "rm -rf node_modules package-lock.json && cd frontend && npm install"

# then rebuild
docker-compose build --no-cache frontend
```

- Cypress tips: add `cy.intercept()` on critical API calls to reduce flakiness and wait on network events instead of fixed sleeps.

- Compose file: removed deprecated `version` attribute to avoid warnings from newer Docker Compose versions.

If you want, I can add a small `wait-for` script to make Cypress wait for the frontend healthcheck before starting; say so and I will add it.

Artifacts from last E2E run:

- Cypress videos were saved to `tests/artifacts/` (three `*.mp4` files for each spec).
- Any failing screenshots (if present) are also copied into `tests/artifacts/` for inspection.

Run commands used during development:

```powershell
# build, then run single-shot Cypress (recommended for CI):
docker-compose up --build --abort-on-container-exit cypress
```

Development workflows
---------------------

Lightweight dev compose (recommended for a reproducible containerized dev environment):

```powershell
# start frontend + backend with bind-mounts for hot-reload
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

Notes:
- The dev compose uses `frontend/Dockerfile.dev` which installs dependencies once and expects your source tree to be bind-mounted for fast edits.
- Vite will accept requests from other containers if `DEV_ALLOW_DOCKER` is set to `true` in the environment. The compose files set this for the frontend when running in Compose so E2E tests from the `cypress` service work reliably.

Run frontend locally (fast iteration):

```powershell
cd frontend
npm install
npm run dev
# point the frontend to the backend with env var if needed
$env:VITE_API_URL='http://localhost:3010'
```

CI wait helper
--------------

Use the included script to wait for a service to be ready before running tests in CI:

```powershell
./scripts/wait-for.sh http://frontend:3000 60
```
