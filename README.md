# Stylora Frontend

Angular 21 single-page application for **Stylora** — your personal AI stylist.
Discover your colour season with Armochromia analysis, manage a digital
wardrobe, chat with an AI stylist for outfit ideas, visualize outfits with
generative AI try-on, and shop a curated, palette-matched product feed.

---

## Table of Contents

- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Functionality](#functionality)
- [Configuration](#configuration)
- [Getting Started (Local Development)](#getting-started-local-development)
- [Building & Running with Docker](#building--running-with-docker)
- [Project Structure](#project-structure)

---

## Architecture

A standalone-component Angular SPA (no `NgModule`s), bootstrapped from
[`index.tsx`](index.tsx) with **zoneless change detection** and **hash-based
routing**:

```
index.tsx (bootstrap)
 ├─ provideZonelessChangeDetection()
 ├─ provideRouter(routes, withHashLocation())
 ├─ provideHttpClient(withInterceptors([credentialsInterceptor, refreshInterceptor]))
 ├─ provideApiConfiguration('')   ── relative "/api/..." calls
 └─ GOOGLE_CLIENT_ID  ← window.__STYLORA_GOOGLE_CLIENT_ID__ (set in index.html)
```

| Layer | Location | Responsibility |
|---|---|---|
| **Routing & shell** | `src/app.ts`, `src/app.html`, `src/app.routes.ts` | Sidebar/mobile nav shell, route table, view-state syncing |
| **Pages (routed components)** | `src/components/{dashboard,wardrobe,try-on,analysis,explore,profile,auth}` | One component per route |
| **Shared UI** | `src/components/ui/`, `src/components/welcome/`, `src/components/auth-forms/` | Icons, notifications, landing page, embedded login/register forms |
| **Services (state)** | `src/services/` | Signal-based app state: auth session, wardrobe/profile, explore cache, try-on, notifications |
| **Generated API client** | `src/openapi_generated/` | **Auto-generated** (`ng-openapi-gen`) typed Angular client for the Stylora backend — do not hand-edit |
| **Interceptors** | `src/interceptors/` | `credentialsInterceptor` (attaches JWT), `refreshInterceptor` (silent refresh on 401) |
| **Guards** | `src/guards/auth.guard.ts` | `authGuard` / `guestGuard` route protection |
| **Utils** | `src/utils/password-policy.ts` | Client-side mirror of the backend's password policy |

### Generated API client

`src/openapi_generated/` is produced by [`ng-openapi-gen`](https://github.com/cyclosproject/ng-openapi-gen)
from the **Stylora backend's** OpenAPI spec, providing a typed `Api` facade,
per-operation functions (`fn/<area>/<operation>.ts`), and request/response
models. Two configs select the spec source:

| Config | Spec source | Used by |
|---|---|---|
| `ng-openapi-gen.json` | `https://raw.githubusercontent.com/Stylora-App/Stylora-Backend/main/docs/openapi.yaml` (remote) | `npm run build`, `npm run generate:api` |
| `ng-openapi-gen.local.json` | `../stylora-backend/docs/openapi.yaml` (sibling repo, local) | `npm run dev` / `npm start`, `npm run generate:api:local` |

`ApiConfiguration.rootUrl` defaults to `http://localhost:8080` in the
generated code but is overridden to an **empty string** in `index.tsx`, so all
requests are made to relative `/api/...` paths — resolved by the dev-server
proxy locally, and by a reverse proxy / same-origin routing in production.

### Auth flow

- Email/password and Google Identity Services ("Sign in with Google", script
  loaded in `index.html`) both return a JWT access + refresh token pair from
  the Stylora backend.
- `TokenService` keeps the **access token in memory** and the **refresh token
  in `localStorage`**.
- `credentialsInterceptor` attaches `Authorization: Bearer <token>` to outgoing
  requests; `refreshInterceptor` transparently retries a request once after
  refreshing on a `401`, logging the user out if the refresh also fails.
- `authGuard` / `guestGuard` redirect based on `AuthService.isAuthenticated()`.

---

## Tech Stack

- **Angular 21** — standalone components, signals, `provideZonelessChangeDetection()`
- **TypeScript 5.9** (strict mode, `strictTemplates`)
- **RxJS 7**
- **Tailwind CSS 3** + PostCSS/Autoprefixer — utility-first styling, custom `display`/`sans` font families (Playfair Display / Inter)
- **ng-openapi-gen** — generates the typed backend API client
- **@angular/build** (Vite-based) — dev server & production bundler
- **Google Identity Services** — "Sign in with Google"

---

## Functionality

Routes use **hash-based routing** (e.g. `/#/dashboard`). Authenticated routes
are guarded by `authGuard`; unauthenticated visitors see the marketing
**Welcome** page (with embedded login/register forms) regardless of route.

| Route | Component | Description |
|---|---|---|
| `/` | — | Redirects to `/dashboard` |
| `/login` | `AuthComponent` (`guestGuard`) | Login / register / "Sign in with Google" |
| `/dashboard` | `DashboardComponent` | Home overview — profile snapshot, palette, quick links |
| `/wardrobe` | `WardrobeComponent` | View, add, validate, and delete digital wardrobe items (photo upload, CLIP-based validation feedback) |
| `/tryon` | `TryOnComponent` | Virtual try-on — combine a person photo with a wardrobe item or clothing photo/URL via Gemini-generated composite images |
| `/analysis` | `AnalysisComponent` | Armochromia colour/season analysis from a face photo (season, sub-season, palette, undertone, contrast, recommended metals) |
| `/explore` | `ExploreComponent` | Browse ASOS products filtered/sorted by the user's seasonal colour palette, with category/gender filters and pagination |
| `/profile` | `ProfileComponent` | View/edit profile (name, picture, style preference, season profile & palette) |
| `**` | — | Redirects to `/dashboard` |

The **AI Outfit Chat** feature is backed by `OutfitChatService`
(`POST /api/chat/outfit`), surfaced within the relevant pages.

A global `<app-notification>` component (via `NotificationService`) shows
toast-style success/error messages app-wide.

---

## Configuration

| Setting | Where | Notes |
|---|---|---|
| Google OAuth Client ID | `index.html` → `window.__STYLORA_GOOGLE_CLIENT_ID__`, read via the `GOOGLE_CLIENT_ID` injection token | Must match the backend's `GOOGLE_CLIENT_ID` |
| API base URL | `index.tsx` → `provideApiConfiguration('')` | Always relative (`/api/...`); see proxy config below |
| Dev proxy (`ng serve` default) | `proxy.conf.json` | `/api` → `http://localhost:8080` |
| Dev proxy (`npm run dev` / `npm start`) | `proxy.conf.local.json` | `/api` → `http://localhost:5214` (the backend's `dotnet run` port) |
| App name/description, camera permission | `metadata.json` | Used for PWA-style metadata; camera access is requested for photo capture (analysis/wardrobe/try-on) |

There is no separate `.env` file for the frontend — configuration is build-time
(proxy configs, `index.html`) rather than runtime environment variables.

---

## Getting Started (Local Development)

### Prerequisites

- Node.js 22.x and npm (matches the Docker build image)
- The `stylora-backend` repo running locally (for the default `dev`/`start`
  scripts, which proxy to `http://localhost:5214` and regenerate the API
  client from `../stylora-backend/docs/openapi.yaml` — clone it as a sibling
  directory)

### Install dependencies

```bash
npm install
```

### Run the dev server

```bash
npm run dev      # (same as `npm start`)
```

This runs `ng-openapi-gen --config ng-openapi-gen.local.json` (regenerating
`src/openapi_generated/` from the local sibling backend's OpenAPI spec), then
`ng serve --proxy-config proxy.conf.local.json`.

- App: `http://localhost:4200`
- API calls to `/api/*` are proxied to `http://localhost:5214` (the backend's
  `dotnet run` port)

> If you don't have `stylora-backend` checked out locally, either clone it as
> a sibling directory or run `npm run generate:api` instead (fetches the spec
> from GitHub) before `ng serve --proxy-config proxy.conf.json` (proxies to
> `:8080`, e.g. the backend's Docker port).

### Other scripts

| Script | Purpose |
|---|---|
| `npm run build` | Regenerates the API client from the **published** backend OpenAPI spec (GitHub, requires network), then `ng build` → `dist/` |
| `npm run preview` | Serves a production build configuration |
| `npm run generate:api` | Regenerate `src/openapi_generated/` from the remote backend spec |
| `npm run generate:api:local` | Regenerate `src/openapi_generated/` from `../stylora-backend/docs/openapi.yaml` |

---

## Building & Running with Docker

```bash
docker build -t stylora-frontend .
```

Multi-stage `Dockerfile`:

1. **build** (`node:22-alpine`) — `npm ci`, then `npm run build` (this
   regenerates the API client from the **remote** backend OpenAPI spec, so the
   build requires network access)
2. **runtime** (`nginx:alpine`) — serves `dist/` on port `80` with an SPA
   fallback (`try_files $uri $uri/ /index.html`)

```bash
docker run -p 3000:80 stylora-frontend
```

> The bundled nginx config only serves static files with SPA fallback — it
> does **not** proxy `/api`. In production (see `stylora-backend`'s
> `deploy/docker-compose.yml`), the frontend and backend containers are bound
> to `127.0.0.1` on separate ports, so an external reverse proxy (or
> same-origin DNS routing) is expected to route `/api/*` to the backend
> alongside the frontend's static assets.

---

## Project Structure

```
stylora-frontend/
├── index.html              # entry HTML — Google Identity script, Google Client ID, fonts
├── index.tsx                # bootstrapApplication — providers, routing, interceptors
├── metadata.json             # app name/description, requested permissions (camera)
├── angular.json               # Angular CLI project config (build/serve targets)
├── tailwind.config.js / postcss.config.js
├── proxy.conf.json / proxy.conf.local.json   # dev-server /api proxy targets
├── ng-openapi-gen.json / ng-openapi-gen.local.json  # API client generator configs
├── Dockerfile
└── src/
    ├── app.ts / app.html / app.css   # root shell component (sidebar, mobile nav)
    ├── app.routes.ts                  # route table + guards
    ├── tokens.ts                       # GOOGLE_CLIENT_ID injection token
    ├── components/
    │   ├── dashboard/ wardrobe/ try-on/ analysis/ explore/ profile/  # routed pages
    │   ├── auth/ auth-forms/ welcome/                                  # auth & landing
    │   └── ui/                                                         # icons, notifications
    ├── services/        # AuthService, TokenService, WardrobeService, GeminiService,
    │                     # ExploreService/ExploreStateService, OutfitChatService,
    │                     # TryOnStateService, NotificationService
    ├── guards/           # authGuard, guestGuard
    ├── interceptors/     # credentialsInterceptor, refreshInterceptor
    ├── utils/            # password-policy.ts
    └── openapi_generated/  # generated typed API client (DO NOT EDIT)
```
