# Deployment — dev/staging + production split

Two independent environments on **one server**, behind **Nginx Proxy Manager (NPM)**,
deployed via **Portainer stacks** that auto-pull pre-built images from GHCR.

> **Status: both environments are LIVE.** Phase A (dev/staging) and Phase B (production
> cutover) are complete. Prod runs `:latest` from `master` on the `holyland_postgres_data`
> volume; dev runs `:dev` from `dev` on `holyland_postgres_data_staging`. Each redeploys
> via Portainer GitOps on its own branch. The Phase A/B sections below are kept as the
> reference procedure (useful for rebuilds, disaster recovery, or a second environment).

| Environment | Branch   | Image tag | Hostname                                   | Stack file                      | Containers      | DB volume                       |
|-------------|----------|-----------|--------------------------------------------|---------------------------------|-----------------|---------------------------------|
| Production  | `master` | `:latest` | `https://holylandaward.iarc.org`           | `docker-compose.prod.yml`       | `*_prod`        | `holyland_postgres_data` (live) |
| Dev/staging | `dev`    | `:dev`    | `https://holyland-dev.116.203.98.92.sslip.io`| `docker-compose.dev-server.yml` | `*_dev`         | `holyland_postgres_data_staging`|

No DNS changes are required:
- **sslip.io** resolves `holyland-dev.116.203.98.92.sslip.io` → `116.203.98.92` automatically.
- The backend is **not** on a subdomain. The frontend's nginx serves the SPA and
  proxies `/api/*` → `backend:8000` on the same origin (`frontend/nginx.conf`).
  So `VITE_API_BASE_URL` is the relative path **`/api`** for **both** environments,
  and NPM only needs **one proxy host per environment**, pointing at the frontend
  container's port `80`.

---

## How requests flow

```
Browser ──HTTPS──> Nginx Proxy Manager ──http :80──> frontend (nginx)
                                                        ├── /            -> SPA (static)
                                                        └── /api/*       -> backend:8000  (internal network)
```

- NPM (`nginx_proxy-app-1`) reaches the **frontend** container over the shared
  `nginx_proxy_default` Docker network.
- The frontend reaches the **backend** over the private `holyland_network`.
- The backend is **not** published to the host and **not** on `nginx_proxy_default` — it
  is only reachable from the frontend. (Dev additionally publishes `1293:8000` for
  direct API debugging; prod publishes nothing.)

---

## One-time prerequisites

1. **Shared NPM network.** Both stacks attach the frontend to the external network
   **`nginx_proxy_default`** — the network NPM (`nginx_proxy-app-1`) is already on.
   Confirm it exists:
   ```bash
   docker network ls | grep nginx_proxy_default
   ```
   (NPM is currently *also* attached to the live stack's `holyland_award_holyland_network`;
   standardizing on `nginx_proxy_default` lets that legacy attachment be dropped after
   cutover.)

2. **GHCR pull access.** Portainer must be able to pull `ghcr.io/iarc-il/holylandaward/*`.
   If the packages are private, add registry credentials in Portainer
   (Registries → add GHCR with a PAT that has `read:packages`).

3. **Pre-create the staging DB volume** (fresh, empty — never the live one):
   ```bash
   docker volume create holyland_postgres_data_staging
   ```

4. **Live production volume — confirmed `holyland_postgres_data`.** The live
   `holyland_db_prod` mounts it at `/var/lib/postgresql/data`, and `docker-compose.prod.yml`
   is pinned to it, so prod reuses the live data as-is. (Re-verify any time with
   `docker volume ls | grep postgres`.) Note there is also a stale, unused
   `holyland_award_postgres_data` volume — **not** the live data; leave it alone.
   **Do not** point two running stacks at the same volume — Postgres allows only one writer.

---

## Secrets — where each value lives

| Value                          | Where it's set                              | Notes |
|--------------------------------|---------------------------------------------|-------|
| `POSTGRES_*`, `CLERK_SECRET_KEY`, `FRONTEND_URL` | Portainer stack env vars (per stack) | Runtime. See `.env.server.example`. |
| `VITE_API_BASE_URL`            | **GitHub Secret** (build-time)              | Must be `/api`. Baked into the bundle. |
| `VITE_CLERK_PUBLISHABLE_KEY`   | **GitHub Secret** (build-time, secret mount)| Injected via BuildKit secret, not in image layers. |
| `VITE_GOOGLE_MAPS_API_KEY`     | **GitHub Secret** (build-time, secret mount)| Referrer-restricted key; safe in the browser. |

The frontend `VITE_*` values are compiled into the static bundle by CI
(`.github/workflows/deploy-*.yml`); they are **not** runtime env vars and have no
effect if set on the server. Confirm the `VITE_API_BASE_URL` GitHub Secret is `/api`.

### Google Maps & Clerk allow-lists
- **Google Maps key:** in the Google Cloud console, confirm the key has an
  **HTTP-referrer restriction** + **API restriction (Maps JS)**, and **add the dev
  host** `https://holyland-dev.116.203.98.92.sslip.io/*` to the allowed referrers
  (production `https://holylandaward.iarc.org/*` should already be allowed).
  Otherwise maps break on dev.
- **Clerk:** add the dev host to **allowed origins / redirect URLs** for the Clerk
  instance, alongside the production host.
- **Key rotation:** a hardcoded Maps key lives in `frontend/AreasUI/index.html`.
  `AreasUI/` is an unreachable prototype — it is never imported and is **not** in the
  Vite build output (`dist`), so it is not served by any environment, and the
  multi-stage Dockerfile keeps it out of the pushed image (only `dist` ships). But the
  key is still in the repo and its git history. If that key was ever usable **without**
  a referrer restriction, **rotate it** in the Google Cloud console.

---

## Changing the Clerk keys (production)

Clerk uses **two** keys that **must come from the same Clerk instance** — a mismatch
breaks auth:

| Key | Format | Used by | Where it's set |
|-----|--------|---------|----------------|
| Publishable key | `pk_test_…` / `pk_live_…` | frontend (browser) | **GitHub Secret** `VITE_CLERK_PUBLISHABLE_KEY` — **baked at build time** |
| Secret key      | `sk_test_…` / `sk_live_…` | backend            | **Portainer** stack env var `CLERK_SECRET_KEY` — **runtime** |

Get the new pair from **Clerk Dashboard → your instance → API Keys**. Then:

### Case A — both keys from the same instance (simple swap / rotation)
> ⚠️ The two deploy workflows currently read the **same repo-level** GitHub Secret
> `VITE_CLERK_PUBLISHABLE_KEY`, so changing it rebuilds **both** dev and prod with the
> new publishable key. Use this case when dev and prod share one Clerk instance. To keep
> them on different instances, use **Case B** instead.

1. **Update the publishable key (build-time):** GitHub → repo **Settings → Secrets and
   variables → Actions** → edit `VITE_CLERK_PUBLISHABLE_KEY` → paste the new `pk_…`.
2. **Rebuild `:latest`:** push any commit to `master`, or re-run the **Build & Deploy
   Production** workflow (Actions → that workflow → *Run workflow*). Wait until it's green
   so a new `frontend:latest` carrying the new key exists on GHCR.
3. **Update the secret key (runtime):** Portainer → Stacks → **`holyland_prod`** →
   *Editor* / *Environment variables* → set `CLERK_SECRET_KEY` to the new `sk_…`.
4. **Redeploy the stack** (Portainer → `holyland_prod` → *Update the stack*, with *re-pull
   image* on). This pulls the new `frontend:latest` **and** applies the new
   `CLERK_SECRET_KEY` together, so the publishable/secret pair stays in sync.
5. **Allowed origins:** in Clerk, ensure the instance lists
   `https://holylandaward.iarc.org` under **allowed origins / redirect URLs**.

> **Ordering matters.** Do step 2 (rebuild) *before* step 4 (redeploy), so the redeploy
> pulls the matching frontend at the same moment the new backend secret takes effect —
> this minimizes the window where the old `pk_…` and new `sk_…` (or vice-versa) coexist.

### Case B — give production its own Clerk instance (prod ≠ dev)
Use **GitHub Environments** so each branch's build bakes a different publishable key:
1. GitHub → **Settings → Environments** → create `production` and `development`.
2. Add an **environment-scoped** `VITE_CLERK_PUBLISHABLE_KEY` to each (live `pk_live_…`
   in `production`, test `pk_test_…` in `development`).
3. In `.github/workflows/deploy-prod.yml` add `environment: production` to the build job
   (and `environment: development` in `deploy-dev.yml`) so each job reads its own secret.
   The `secrets.VITE_CLERK_PUBLISHABLE_KEY` reference stays the same — it just resolves
   per-environment.
4. Set each stack's `CLERK_SECRET_KEY` in Portainer to the matching instance's `sk_…`
   (live for `holyland_prod`, test for `holyland_dev`).
5. Rebuild both branches and redeploy both stacks (as in Case A, steps 2 & 4).

> A `pk_…`/`sk_…` mismatch (frontend on one instance, backend on another) makes sign-in
> fail with token-verification errors. If login breaks after a change, that's the first
> thing to check.

---

## Phase A — stand up dev/staging (no impact on the live site)

1. **Create the dev Portainer stack** from `docker-compose.dev-server.yml`.
   - Enable **"Re-pull image and redeploy"** / GHCR polling (offered at stack
     creation only) so Portainer picks up new `:dev` images within ~5 min.
   - Env vars (see `.env.server.example`):
     `POSTGRES_*`, `CLERK_SECRET_KEY`,
     `FRONTEND_URL=https://holyland-dev.116.203.98.92.sslip.io`.
   - Uses the fresh `holyland_postgres_data_staging` volume (created above).
2. **NPM proxy host:** add a proxy host
   - Domain: `holyland-dev.116.203.98.92.sslip.io`
   - Forward to: `holyland_frontend_dev` port `80` (scheme `http`)
   - Enable **Websockets**, **Block common exploits**, and request a
     **Let's Encrypt** certificate (HTTP-01 works — sslip.io resolves to the IP).
3. **Add the dev host** to the Maps key referrers and Clerk origins (above).
4. **Validate** (see Verification) before touching production.

> **Current live state (for reference).** The live site is the existing
> `holyland_award` compose stack: containers `holyland_frontend_prod` /
> `holyland_backend_prod` / `holyland_db_prod`, running the **`:dev`** images, on the
> `holyland_award_holyland_network` network, with the DB on `holyland_postgres_data`.
> NPM reaches it because it's attached to that same network.
>
> Phase A is safe alongside it: the dev stack uses different `*_dev` container names,
> the fresh `holyland_postgres_data_staging` volume, and a free host port (`1293`), so
> nothing collides. Leave the live `holyland_award` stack running until Phase B.

---

## Phase B — make `master` the production source on the live domain

Production tracks `master`'s `:latest` images. `master` must first contain the nginx
`/api` proxy + env-driven CORS that currently live on `dev`.

This is effectively an **in-place replacement** of the current `holyland_award` stack:
the new prod stack reuses the same `holyland_*_prod` container names and the same
`holyland_postgres_data` volume — it only swaps `:dev` → `:latest` images and moves the
frontend onto `nginx_proxy_default`.

1. **Merge `dev → master`** (after the in-flight feature branches land) so `:latest`
   images include the `/api` proxy and CORS-from-`FRONTEND_URL`.
2. **Stop and remove the old `holyland_award` stack first** (Portainer → that stack →
   Stop/Remove). This frees the `holyland_*_prod` container names and releases the
   `holyland_postgres_data` volume so exactly one stack writes it. The named volume is
   **not** deleted by removing the stack (it's external) — the data is preserved.
3. **Create the prod Portainer stack** from `docker-compose.prod.yml`:
   - Env vars: `POSTGRES_*`, `CLERK_SECRET_KEY`,
     `FRONTEND_URL=https://holylandaward.iarc.org`.
   - **Reuses the existing live `holyland_postgres_data` volume** — no migration.
   - Enable GHCR polling at stack creation.
4. **Repoint the live NPM proxy host** `holylandaward.iarc.org` to `holyland_frontend_prod`
   port `80` (now reachable via `nginx_proxy_default`). Afterwards you can drop NPM's
   legacy attachment to `holyland_award_holyland_network`.
5. **Decommission** the dev-serves-prod arrangement. `dev` now only feeds the sslip.io
   dev stack; `master`/`:latest` feeds production.

---

## Verification

1. **Dev up:** push to `dev` → CI builds `:dev` → Portainer re-pulls within ~5 min →
   `https://holyland-dev.116.203.98.92.sslip.io` loads the SPA over HTTPS. The Network
   tab shows `/api/...` calls succeeding (no CORS errors); maps render and Clerk
   login works (confirms the referrer/origin allow-lists).
2. **Isolation (during Phase A):** `docker ps` shows the new `*_dev` containers
   alongside the live `*_prod` ones with no host-port collisions; `docker volume ls`
   shows the `holyland_postgres_data_staging` volume separate from the live
   `holyland_postgres_data`; `docker network inspect nginx_proxy_default` shows NPM +
   the dev frontend attached.
3. **Prod cutover:** after `dev → master`, `:latest` builds, the prod stack
   redeploys, and `https://holylandaward.iarc.org` serves from `holyland_frontend_prod`
   with a working `/api`.
4. **Leak check:** `git grep -nE 'sk_live|pk_live'` returns nothing; pushed
   image layers carry no Clerk/Maps secret (`docker history <image>`). The only
   `AIza` hit is the unreachable `frontend/AreasUI/index.html` prototype (see the
   Maps key-rotation note above) — it is not built or served.

---

## Rollback

- **Dev:** harmless — delete the dev stack and its `_staging` volume; nothing live is affected.
- **Prod:** the live DB volume is reused, not migrated, so reverting is repointing the
  NPM `holylandaward.iarc.org` host back to the previous container and restarting the
  old stack. Keep the old stack defined (stopped) until the new prod stack is proven.
