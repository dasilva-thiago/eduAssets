# eduAssets
 
<div align="center">
  <img src="frontend/public/assets/img/eduAssets_banner.png" alt="EduAssets banner" width="100%">
</div>
> **Status: Beta (v0.9.9).** Core functionality — including authentication, Guest Mode, Dark Mode, and data export — is implemented end-to-end across a fully TypeScript frontend and backend. The project is in final polish before its first public deployment. Minor adjustments and hardening are still expected before a stable 1.0 release.
 
## Overview
 
**eduAssets** is a school equipment loan and inventory management system built as a portfolio project. It targets daily operational use by a small group of users (a system administrator and a handful of teachers), and its design decisions favor low-friction, high-frequency workflows over granular per-unit asset tracking.
 
The system covers five core operations:
- Registering new equipment loans
- Processing returns
- Monitoring stock levels and loan history through a dashboard
- Tracking equipment issues (observations, maintenance, and broken units) through a dedicated control panel
- Exporting loan/return history and equipment inventory as CSV, Excel, or PDF reports
Since eduAssets is meant to be publicly accessible as a portfolio piece, it ships with a **Guest Mode**: anyone can open the live deployment and explore the full application in read-only mode, while all data-mutating actions are restricted to an authenticated administrator.
 
The interface also supports **Dark Mode**, with automatic detection of the operating system's color scheme, manual override (Light / Dark / System), and persistence of the chosen preference across sessions.
 
UI/UX decisions follow a set of internal design guidelines focused on functional minimalism: no decorative elements without informational value, no redundant content between panels, and no self-promotional copy.
 
## Tech Stack
 
### Frontend
- **TypeScript** (fully migrated from the original vanilla JS codebase) compiled via [Vite](https://vitejs.dev/), ES Modules, no separate bundler config beyond `vite.config.js`
- **Feature-first architecture** (see [Architecture](#architecture) below) — already implemented, not just planned
- [flatpickr](https://flatpickr.js.org/) for datetime input handling
- [SheetJS (xlsx)](https://sheetjs.com/) and [jsPDF](https://github.com/parallax/jsPDF) + `jspdf-autotable`, loaded via CDN in `index.html`, for Excel and PDF export
- Material Symbols Outlined for iconography
- Theming implemented purely with CSS Custom Properties (`base/variables.css`), scoped via `html[data-theme]` — no component-level style duplication between Light and Dark
### Frontend (planned)
- Migrate to React + TypeScript (v2), building on the current feature-first, layered structure so the migration only touches the rendering layer
### Backend
- Node.js + **Express 5**
- **Prisma ORM** 6, PostgreSQL, hosted via Supabase (also used for Supabase Realtime, planned for cross-browser live updates)
- **TypeScript**, strict mode
- JWT-based authentication (`jsonwebtoken`), bcrypt password hashing
- **Security middleware**: `helmet` for HTTP security headers, `express-rate-limit` for both a global request limiter and a dedicated, stricter limiter on the login endpoint
- Zod schemas for request validation on every mutating route
- Centralized Prisma-aware error handler (`errorHandler.ts`) mapping known Prisma error codes to appropriate HTTP responses
### Hosting (planned)
- **Frontend:** Vercel
- **Backend:** Render
---
 
## Authentication & Guest Mode
 
eduAssets uses a binary access model:
 
- **Guest (default):** granted automatically on page load, no login required. Can view the Dashboard, Loan History, and inventory data, but cannot create, edit, or delete anything.
- **Administrator (authenticated):** full CRUD access across all panels, including Cadastros (equipment, staff, users, and categories) and Controle (occurrences), plus account management (password change).
Enforcement happens on both layers:
- **Frontend:** write-triggering controls are marked with a `data-requires-auth` hook that visually disables them in Guest Mode, and every mutating event handler calls a `bloquearSeConvidado()` guard before making an API call.
- **Backend:** every route that creates, updates, or deletes data is protected by a `requireAuth` middleware that validates a JWT sent via `Authorization: Bearer <token>`. Frontend restrictions exist only for UX — the backend is the actual security boundary.
Login is handled via `POST /auth/login` (rate-limited to prevent brute-force attempts), session persistence is validated on app boot via `GET /auth/me`, and the administrator can change their own password via `PATCH /auth/senha` (requires re-entering the current password), surfaced in the **Segurança** panel.
 
> **Note:** the Cadastros panel is treated as fully admin-only (including viewing and listing registered items).
 
---
 
## Dark Mode
 
Theme preference is treated as a device/person-level setting, not application data — it works identically for Guests and authenticated Administrators, and is never gated behind `bloquearSeConvidado()`.
 
- **Automatic detection:** on first visit, the theme follows the OS setting via `prefers-color-scheme`, and stays in sync live if the OS theme changes while the app is open.
- **Manual override:** a Light / Dark / System toggle is available in **Configurações → Aparência**.
- **Persistence:** the chosen preference is stored in `localStorage` and restored on every load.
- **No flash of incorrect theme:** an inline script in `index.html`'s `<head>` applies the saved/detected theme to `<html data-theme="...">` before first paint, ahead of the ES module bundle.
- **Single source of truth for color:** every theme value lives in `frontend/src/styles/base/variables.css`, scoped under `html[data-theme="dark"]`. All components consume semantic tokens (`--surface-white`, `--text-primary`, `--border-color`, feedback colors, etc.) rather than raw color values, so no component stylesheet needs theme-specific overrides.
- **State module:** `frontend/src/core/state/themeStore.ts` follows the same store pattern as the rest of the app's state (`subscribe` / `notify`), exposing `getPreferenciaTema()`, `getTemaResolvido()`, and `definirTema()`.
---
 
## Architecture
 
The frontend already follows the feature-first, layered architecture defined internally as the project's engineering standard:
 
- **`core/`** — infrastructure only, never business logic: API client + per-entity API modules, auth guards, layout (navigation, mobile nav), state stores, UI primitives (modal, toast, confirm, datepicker), reusable utilities, and framework-agnostic services (CSV/Excel/PDF export).
- **`features/`** — one folder per business screen (`dashboard`, `emprestimo`, `devolucao`, `controle`, `cadastros`, `exportar`, `config`, `seguranca`, `perfil`, `auth`), each internally split into `index.ts` (wiring), `events.ts`, `render.ts`, `templates.ts`, and `service.ts` where relevant. Templates only return HTML strings; events only orchestrate; business rules live in `service.ts`; state is the single source of truth and is never read back from the DOM.
- **`shared/`** — reusable UI building blocks not owned by any single feature (status badge, empty state, select options, DOM helpers).
- **`types/`** — centralized TypeScript interfaces for all entities, payloads, and UI-shaped data (`Loan`, `Equipamento`, `Ocorrencia`, etc.), imported across the whole app instead of being redefined per file.
All dynamic HTML goes through an XSS-safe, tagged-template `html\`\`` helper (`core/utils/html.ts`) that auto-escapes interpolated values, with an explicit `raw()` escape hatch for trusted, already-sanitized HTML fragments.
 
---
 
## Current State
 
### Frontend
 
| Panel | Status | Notes |
| :--- | :--- | :--- |
| **Início** | Complete | hero login button opens the auth modal |
| **Novo Empréstimo** | Complete | Loan registration form, multi-item support; write-protected in Guest Mode |
| **Devoluções** | Complete | Two-panel layout with persistent detail/edit sidebar; write-protected in Guest Mode |
| **Dashboard** | Complete | Estoque and Histórico tabs (publicly viewable), category detail panel (admin-only editing), loan history sourced from shared state, search/filter on both tabs |
| **Controle** | Complete | Four tabs (Observação, Manutenção, Quebrado, Resolvidos), create/edit modal with conditional "Medidas tomadas" field, row selection, Promise-based delete confirmation modal, search; all mutations write-protected |
| **Cadastros** | Complete, admin-only | Modal-based CRUD for equipment, staff, users, and categories, wired to the backend; entire panel restricted to authenticated administrators |
| **Exportar** | Complete | Exports Empréstimos/Devoluções or Equipamentos (with per-item selection) as CSV, Excel (SheetJS), or PDF (jsPDF + autotable), including detailed occurrence sections and optional notes |
| **Configurações** | Complete | Dark Mode toggle (Light / Dark / System) fully functional and persisted; notification preferences UI-only, save action write-protected |
| **Segurança** | Complete | Authenticated password change (current + new password, confirmation, min. 8 characters), write-protected |
| **Meu Perfil** | Complete | Read-only summary of the logged-in account (name, login, access level) |
| **Sobre** | Complete | |
| **Autenticação (Login/Guest)** | Complete | Login modal, sidebar auth status badge, session persistence via JWT |
 
> **Note:** State management (`core/state/loanStore.ts`) uses soft deletes (`status: 'DEVOLVIDO'` + `dataDevolucao`) instead of record deletion, preserving full loan history. Theme state follows the same lightweight store pattern (`subscribe`/`notify`) used across the rest of the app.
 
### Backend
- Prisma schema defined for `Categoria`, `Equipamento`, `Responsavel`, `Usuario`, `Emprestimo`, `ItemEmprestimo`, and `Ocorrencia`, with enums for access level, loan status, occurrence type, and occurrence status.
- `Usuario` extended with a `passwordHash` field to support authentication.
- Full CRUD endpoints implemented for all entities (`/categorias`, `/equipamentos`, `/responsaveis`, `/usuarios`, `/emprestimos`, `/ocorrencias`).
- `POST /auth/login`, `GET /auth/me`, and `PATCH /auth/senha` implemented for authentication, session validation, and self-service password changes.
- All mutating endpoints (`POST`/`PATCH`/`DELETE`) protected by a `requireAuth` JWT middleware; `GET` endpoints remain public to support Guest Mode.
- Loan and occurrence stock movements (creating/editing loans, returns, maintenance/broken registrations) run inside Prisma transactions with atomic, race-condition-safe stock decrements (`lib/estoque.ts`), raising a typed `EstoqueInsuficienteError` with per-item details on insufficient stock.
- `helmet` security headers applied globally; a global rate limiter (300 req / 15 min) and a stricter login-specific rate limiter (10 attempts / 15 min) protect the API.
- Centralized error handling middleware maps known Prisma error codes (not found, invalid reference, unique constraint) to the correct HTTP status.
- Seed script (`prisma/seed.ts`) is idempotent (safe to re-run) and provisions starter categories, equipment, responsáveis, and the initial administrator account, whose password is sourced from an environment variable rather than hardcoded.
- Frontend fully consumes the real API across all connected panels — no in-memory/mock state remains.
---
 
## Project Structure
 
```
eduAssets/
├── frontend/
│   ├── public/
│   │   ├── assets/
│   │   │   ├── icons/
│   │   │   ├── img/
│   │   │   └── logos/
│   ├── src/
│   │   ├── main.ts               # entry point: theme init, session bootstrap, feature init
│   │   ├── core/
│   │   │   ├── api/               # apiClient (auto-attaches JWT), per-entity API modules
│   │   │   ├── auth/               # guestGate — write-action guard for Guest Mode
│   │   │   ├── constants/          # breakpoints, etc.
│   │   │   ├── layout/             # navigation, mobile navigation
│   │   │   ├── services/           # csv.ts, excel.ts, pdf.ts (export services)
│   │   │   ├── state/               # stores: loans, equipment, occurrences, responsáveis, auth, token, theme
│   │   │   ├── ui/                  # toast, modal, confirm, datepicker
│   │   │   └── utils/                # escapeHtml, html`` tagged template, sanitize, misc helpers
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── cadastros/
│   │   │   ├── config/               # settings panel, incl. Dark Mode toggle
│   │   │   ├── controle/
│   │   │   ├── dashboard/
│   │   │   ├── devolucao/
│   │   │   ├── emprestimo/
│   │   │   ├── exportar/
│   │   │   ├── perfil/
│   │   │   └── seguranca/
│   │   ├── shared/
│   │   │   ├── components/          # statusBadge, emptyState, selectOptions
│   │   │   └── dom/                  # fillSelect, overlayPanel
│   │   ├── types/                     # centralized TypeScript interfaces
│   │   └── styles/
│   │       ├── base/                  # reset, design tokens + Light/Dark theme values
│   │       ├── components/
│   │       ├── layout/
│   │       ├── panels/
│   │       └── utils/
│   ├── index.html                     # includes inline anti-flash theme script + CDN libs
│   ├── vite.config.js
│   └── tsconfig.json
└── backend/
    ├── prisma/
    │   ├── schema.prisma
    │   ├── migrations/
    │   └── seed.ts
    ├── src/
    │   ├── lib/                       # jwt.ts, estoque.ts, validate.ts
    │   ├── middleware/                 # auth.ts (requireAuth), security.ts (helmet/rate limits), errorHandler.ts, notFound.ts
    │   ├── routes/                     # auth.ts + one router per entity
    │   ├── schemas/                     # zod validation schemas
    │   └── server.ts
    ├── prisma.ts
    ├── prisma.config.ts
    └── tsconfig.json
```
 
## Design System
 
Styling is driven by a CSS custom property token system defined in `frontend/src/styles/base/variables.css`:
- A blue-tinted slate scale for neutrals
- Primary (blue) and secondary (violet) color scales
- Semantic aliases (`--primary-color`, `--text-primary`, `--border-color`, etc.)
- Surface tokens for layered backgrounds
- Feedback colors for success, warning, error, and info states
- `--font-heading` (Poppins) and `--font-body` (Inter) via Google Fonts
- **Light and Dark themes** as a single set of token overrides scoped to `html[data-theme="dark"]`, layered on top of the same semantic aliases — components never branch on theme directly, so hierarchy (sidebar → page → card → nested surface) is preserved consistently across both modes
Button styles are consolidated into `styles/components/buttons.css` using a base `.btn` class with modifiers (`.btn-primary`, `.btn-success`, `.btn-neutral`, `.btn-warning`, `.btn-danger`).
 
The sidebar is intentionally fixed and non-collapsible on desktop (collapsing into an off-canvas drawer below the tablet breakpoint), a deliberate choice for a daily-use operational tool, and always renders on the darkest layer of the palette (`--bg-dark`) regardless of the active theme. Sidebar navigation styles are scoped to `.sidebar-nav .nav-link` to avoid leaking into other elements that reuse the `.nav-link` hook for JS navigation. The sidebar footer hosts the Guest/Administrator status badge and login/logout toggle.
 
Guest Mode restrictions are expressed declaratively: any control tagged `data-requires-auth` is automatically dimmed and disabled via a single `body.guest-mode [data-requires-auth]` CSS rule, so newly rendered elements (e.g. dynamically generated table rows) are covered without additional JavaScript.
 
---
 
## Roadmap
 
- [x] Build modals for creating and editing records in the Controle panel
- [x] Refactor loan state to soft deletes for full history
- [x] XSS sanitization across dynamic HTML rendering
- [x] Define Prisma schema and run initial migration
- [x] Implement remaining backend CRUD endpoints (Equipamento, Responsavel, Usuario, Emprestimo, Ocorrencia)
- [x] Replace in-memory/mock frontend state with real API calls
- [x] Implement JWT authentication and Guest Mode (read-only public access, admin-only mutations)
- [x] Implement Dark Mode with system detection, manual override, and persistence
- [x] Migrate the vanilla JS frontend to TypeScript
- [x] Refactor frontend into a feature-first, layered architecture (`core` / `features` / `shared` / `types`)
- [x] Add a "change password" flow for the administrator account
- [x] Connect the Exportar panel to real export logic (CSV/Excel/PDF)
- [x] Harden the API with security headers (`helmet`) and rate limiting
- [x] Make stock decrements race-condition-safe via atomic, transaction-scoped updates
- [ ] Accessibility improvements: focus trap in modals, `role="dialog"`
- [ ] Unit tests with Vitest for pure utility and service functions
- [ ] Properly configure CORS for production (currently a `TODO` in `server.ts`)
- [ ] First public deployment (Vercel + Render)
- [ ] Migrate to React + TypeScript (v2)
---
 
## Known Limitations (current)
 
- No password recovery flow yet ("Forgot password" in the login modal is not yet implemented); only an authenticated, in-session password change (Segurança panel) is available. The initial administrator password is set once via the seed script.
- Individual asset tracking (per-unit serial numbers) is out of scope for v1.
- Currently a single administrator role in practice; `nivelAcesso` already distinguishes `ADMINISTRADOR`/`EDITOR` at the schema level for future granular permissions, but the application currently treats any authenticated user as a full administrator.
- Dark Mode ships with a single alternate palette; the token structure supports additional themes in the future, but no theme picker beyond Light/Dark/System exists yet.
- CORS configuration is currently permissive by default when `CORS_ORIGIN` is unset — needs to be locked down before production deployment.
---
 
## Running Locally
 
### Frontend
1. Clone the repository
2. Navigate to the frontend directory:
```bash
   cd frontend
```
3. Install dependencies:
```bash
   npm install
```
4. (Optional) Create a `.env` file to point at a non-default backend URL:
```
   VITE_API_BASE_URL=http://localhost:3000
```
5. Start the dev server:
```bash
   npm run dev
```
> Vite serves the app on `http://localhost:5173` by default. Run `npm run build` to produce a production build in `dist/`, or `npm run typecheck` to run `tsc --noEmit`.
 
### Backend
1. Navigate to the backend directory:
```bash
   cd backend
```
2. Install dependencies:
```bash
   npm install
```
3. Create a `.env` file with the following variables:
```
   DATABASE_URL=<your Supabase Postgres connection string>
   DIRECT_URL=<your Supabase direct connection string>
   JWT_SECRET=<a long, random, unpredictable string — never reuse across environments>
   SEED_ADMIN_PASSWORD=<the password for the initial administrator account>
   CORS_ORIGIN=<comma-separated list of allowed frontend origins, e.g. http://localhost:5173>
```
4. Run migrations:
```bash
   npx prisma migrate dev
```
5. Seed the database (creates starter data and the initial administrator account):
```bash
   npx prisma db seed
```
6. Start the dev server:
```bash
   npm run dev
```
> The API runs on `http://localhost:3000` by default. Log in on the frontend using the login you defined via the seed (`admin@eduassets.com` by default) and the password set in `SEED_ADMIN_PASSWORD`.
 
---
 
## Author
Developed by Thiago da Silva.