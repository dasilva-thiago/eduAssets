# eduAssets

<div align="center">
  <img src="frontend/assets/img/eduAssets_banner.png" alt="EduAssets banner" width="100%">
</div>

> **Status: Beta (v0.9.0).** Core functionality — including authentication and Guest Mode — is implemented end-to-end across frontend and backend. The project is in final polish before its first public deployment. Minor adjustments and hardening are still expected before a stable 1.0 release.

## Overview

**eduAssets** is a school equipment loan and inventory management system built as a portfolio project. It targets daily operational use by a small group of users (a system administrator and a handful of teachers), and its design decisions favor low-friction, high-frequency workflows over granular per-unit asset tracking, which is planned for a future version.

The system covers four core operations:
- Registering new equipment loans
- Processing returns
- Monitoring stock levels and loan history through a dashboard
- Tracking equipment issues (observations, maintenance, and broken units) through a dedicated control panel

Since eduAssets is meant to be publicly accessible as a portfolio piece, it ships with a **Guest Mode**: anyone can open the live deployment and explore the full application in read-only mode, while all data-mutating actions are restricted to an authenticated administrator.

UI/UX decisions follow a set of internal design guidelines focused on functional minimalism: no decorative elements without informational value, no redundant content between panels, and no self-promotional copy.

## Tech Stack

### Frontend (current, v1)
- Vanilla HTML5, CSS3, and JavaScript (ES Modules), no build step
- [flatpickr](https://flatpickr.js.org/) for datetime input handling
- Material Symbols Outlined for iconography

### Frontend (planned migration path)
1. Migrate vanilla JS to TypeScript
2. Migrate to React + TypeScript (v2)

### Backend
- Node.js + Express
- Prisma ORM
- TypeScript
- PostgreSQL, hosted via Supabase (also used for Supabase Realtime, planned for cross-browser live updates)
- JWT-based authentication, bcrypt password hashing

### Hosting (planned)
- **Frontend:** Vercel
- **Backend:** Render

---

## Authentication & Guest Mode

eduAssets uses a binary access model:

- **Guest (default):** granted automatically on page load, no login required. Can view the Dashboard, Loan History, and inventory data, but cannot create, edit, or delete anything.
- **Administrator (authenticated):** full CRUD access across all panels, including Cadastros (equipment, staff, users, and categories) and Controle (occurrences).

Enforcement happens on both layers:
- **Frontend:** write-triggering controls are marked with a `data-requires-auth` hook that visually disables them in Guest Mode, and every mutating event handler calls a `bloquearSeConvidado()` guard before making an API call.
- **Backend:** every route that creates, updates, or deletes data is protected by a `requireAuth` middleware that validates a JWT sent via `Authorization: Bearer <token>`. Frontend restrictions exist only for UX — the backend is the actual security boundary.

Login is handled via `POST /auth/login` (email + password, validated against a bcrypt hash), and session persistence is validated on app boot via `GET /auth/me` using a token stored in `localStorage`.

> **Note:** the Cadastros panel is treated as fully admin-only (including viewing and listing registered items).

---

## Current State

### Frontend

| Panel | Status | Notes |
| :--- | :--- | :--- |
| **Início** | Complete | Redesigned per `skills.md` guidelines; hero login button opens the auth modal |
| **Novo Empréstimo** | Complete | Loan registration form, multi-item support; write-protected in Guest Mode |
| **Devoluções** | Complete | Two-panel layout with persistent detail/edit sidebar; write-protected in Guest Mode |
| **Dashboard** | Complete | Estoque and Histórico tabs (publicly viewable), category edit panel (admin-only), loan history sourced from shared state |
| **Controle** | Complete (frontend) | Four tabs (Observação, Manutenção, Quebrado, Resolvidos), create/edit modal with conditional "Medidas tomadas" field, row selection, Promise-based delete confirmation modal; all mutations write-protected |
| **Cadastros** | Complete, admin-only | Modal-based CRUD for equipment, staff, users, and categories, wired to the backend; entire panel restricted to authenticated administrators |
| **Exportar** | UI complete | No export logic connected yet |
| **Configurações** | Complete (UI) | No persistence yet; save action write-protected |
| **Sobre** | Complete | Redesigned per `skills.md` guidelines |
| **Autenticação (Login/Guest)** | Complete | Login modal, sidebar auth status badge, session persistence via JWT + `localStorage` |

> **Note:** State management (`js/core/state/loans.js`) uses soft deletes (`status: 'devolvido'` + `dataDevolucao`) instead of record deletion, preserving full loan history. All dynamic HTML rendering goes through an XSS-safe `escapeHtml()` utility and a tagged-template `` html` ` `` helper (`js/core/utils/`) that auto-escapes interpolated values, with an explicit `raw()` escape hatch for trusted HTML.

### Backend
- Prisma schema defined for `Categoria`, `Equipamento`, `Responsavel`, `Usuario`, `Emprestimo`, `ItemEmprestimo`, and `Ocorrencia`, with enums for access level, loan status, occurrence type, and occurrence status.
- `Usuario` extended with a `passwordHash` field to support authentication.
- Full CRUD endpoints implemented for all entities (`/categorias`, `/equipamentos`, `/responsaveis`, `/usuarios`, `/emprestimos`, `/ocorrencias`).
- `POST /auth/login` and `GET /auth/me` implemented for authentication and session validation.
- All mutating endpoints (`POST`/`PATCH`/`DELETE`) protected by a `requireAuth` JWT middleware; `GET` endpoints remain public to support Guest Mode.
- Seed script (`prisma/seed.ts`) is idempotent (safe to re-run) and provisions starter categories, equipment, responsáveis, and the initial administrator account, whose password is sourced from an environment variable rather than hardcoded.
- Frontend fully migrated from in-memory/mock state to real API calls across all connected panels.

---

## Project Structure

```
eduAssets/
├── frontend/
│   ├── assets/
│   │   ├── icons/
│   │   ├── img/
│   │   └── logos/
│   ├── css/
│   │   ├── base/          # reset, design tokens (variables.css)
│   │   ├── components/    # buttons, forms, modal, icons, toast, auth
│   │   ├── layout/        # sidebar, panels-shell, footer, mobile-nav
│   │   ├── panels/        # one stylesheet per panel
│   │   └── styles.css     # entry point, imports all modules
│   ├── js/
│   │   ├── core/
│   │   │   ├── api/       # apiClient (auto-attaches JWT), per-entity API modules
│   │   │   ├── auth/      # guestGate — write-action guard for Guest Mode
│   │   │   ├── state/     # stores: loans, equipment, occurrences, responsáveis, auth, token
│   │   │   ├── ui/        # toast, modal, confirm, datepicker
│   │   │   └── utils/     # escapeHtml, html`` tagged template, raw()
│   │   ├── features/
│   │   │   ├── auth/      # login modal, session bootstrap, status badge
│   │   │   ├── cadastros/
│   │   │   ├── config/
│   │   │   ├── controle/
│   │   │   ├── dashboard/
│   │   │   ├── devolucao/
│   │   │   ├── emprestimo/
│   │   │   └── exportar/
│   │   └── main.js        # entry point, bootstraps session then initializes feature modules
│   └── index.html
└── backend/
    ├── prisma/
    │   ├── schema.prisma
    │   ├── migrations/
    │   └── seed.ts
    ├── src/
    │   ├── lib/            # jwt.ts (sign/verify helpers)
    │   ├── middleware/      # auth.ts (requireAuth), errorHandler.ts, notFound.ts
    │   ├── routes/          # auth.ts + one router per entity
    │   └── server.ts
    ├── prisma.ts
    ├── prisma.config.ts
    └── tsconfig.json
```

## Design System

Styling is driven by a CSS custom property token system defined in `frontend/css/base/variables.css`:
- A blue-tinted slate scale for neutrals
- Primary (blue) and secondary (violet) color scales
- Semantic aliases (`--primary-color`, `--text-primary`, `--border-color`, etc.)
- Surface tokens for layered backgrounds
- Feedback colors for success, warning, error, and info states
- `--font-heading` (Poppins) and `--font-body` (Inter) via Google Fonts

Button styles are consolidated into `css/components/buttons.css` using a base `.btn` class with modifiers (`.btn-primary`, `.btn-success`, `.btn-neutral`, `.btn-warning`, `.btn-danger`).

The sidebar is intentionally fixed and non-collapsible, a deliberate choice for a daily-use operational tool. Sidebar navigation styles are scoped to `.sidebar-nav .nav-link` to avoid leaking into other elements that reuse the `.nav-link` hook for JS navigation. The sidebar footer now also hosts the Guest/Administrator status badge and login/logout toggle.

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
- [ ] Add a "change password" flow for the administrator account
- [ ] Connect Exportar panel to real export logic (CSV/Excel/PDF)
- [ ] Migrate remaining JS files to the `html\` \`` tagged template pattern for consistency
- [ ] Accessibility improvements: focus trap in modals, `role="dialog"`
- [ ] Unit tests with Vitest for pure utility functions
- [ ] First public deployment (Vercel + Render)
- [ ] Migrate vanilla JS frontend to TypeScript
- [ ] Migrate to React + TypeScript (v2)

---

## Known Limitations (current)

- No password recovery or password-change flow yet; the administrator password is set once via the seed script.
- Individual asset tracking (per-unit serial numbers) is out of scope for v1.
- Export panel UI is complete but not yet wired to actual file generation.
- Currently a single administrator role in practice; `nivelAcesso` already distinguishes `ADMINISTRADOR`/`EDITOR` at the schema level for future granular permissions, but the application currently treats any authenticated user as a full administrator.

---

## Running Locally

### Frontend
Static, no build step required.
1. Clone the repository
2. Open `frontend/index.html` directly in a browser, or serve the directory with any static file server, e.g.:
```bash
npx serve frontend
```

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