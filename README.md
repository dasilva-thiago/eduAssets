# eduAssets

<div align="center">
  <img src="frontend/assets/img/eduAssets_banner.png" alt="EduAssets banner" width="100%">
</div>

> **Status: Active Development.** Frontend panels are functionally complete with in-memory/mock state. Backend implementation has started (schema, migrations, and first endpoint in place). Breaking changes should be expected between commits.

## Overview

**eduAssets** is a school equipment loan and inventory management system built as a portfolio project. It targets daily operational use by a small group of users (a system administrator and a handful of teachers), and its design decisions favor low-friction, high-frequency workflows over granular per-unit asset tracking, which is planned for a future version.

The system covers four core operations:
- Registering new equipment loans
- Processing returns
- Monitoring stock levels and loan history through a dashboard
- Tracking equipment issues (observations, maintenance, and broken units) through a dedicated control panel

UI/UX decisions follow a set of internal design guidelines (`skills.md`) focused on functional minimalism: no decorative elements without informational value, no redundant content between panels, and no self-promotional copy.

## Tech Stack

### Frontend (current, v1)
- Vanilla HTML5, CSS3, and JavaScript (ES Modules), no build step
- [flatpickr](https://flatpickr.js.org/) for datetime input handling
- Material Symbols Outlined for iconography

### Frontend (planned migration path)
1. Migrate vanilla JS to TypeScript
2. Migrate to React + TypeScript (v2) — responsive/mobile design will be addressed at this stage

### Backend (in progress)
- Node.js + Express
- Prisma ORM
- TypeScript
- PostgreSQL, hosted via Supabase (also used for Supabase Realtime, planned for cross-browser live updates)

### Hosting (planned)
- **Frontend:** Vercel
- **Backend:** Render

---

## Current State

### Frontend

| Panel | Status | Notes |
| :--- | :--- | :--- |
| **Início** | Complete | Redesigned per `skills.md` guidelines |
| **Novo Empréstimo** | Complete | Loan registration form, multi-item support |
| **Devoluções** | Complete | Two-panel layout with persistent detail/edit sidebar |
| **Dashboard** | Complete | Estoque and Histórico tabs, category edit panel, loan history sourced from shared state |
| **Controle** | Complete (frontend) | Four tabs (Observação, Manutenção, Quebrado, Resolvidos), create/edit modal with conditional "Medidas tomadas" field, row selection, Promise-based delete confirmation modal |
| **Cadastros** | In progress | Modal-based CRUD scaffolding for equipment, staff, users, and categories; not yet wired to the backend |
| **Exportar** | UI complete | No export logic connected yet |
| **Configurações** | Complete (UI) | No persistence yet |
| **Sobre** | Complete | Redesigned per `skills.md` guidelines |

> **Note:** State management (`js/core/state/loans.js`) uses soft deletes (`status: 'devolvido'` + `dataDevolucao`) instead of record deletion, preserving full loan history. All dynamic HTML rendering goes through an XSS-safe `escapeHtml()` utility and a tagged-template `` html` ` `` helper (`js/core/utils/`) that auto-escapes interpolated values, with an explicit `raw()` escape hatch for trusted HTML.

### Backend
- Prisma schema defined for `Categoria`, `Equipamento`, `Responsavel`, `Usuario`, `Emprestimo`, `ItemEmprestimo`, and `Ocorrencia`, with enums for access level, loan status, occurrence type, and occurrence status.
- Initial migration applied against PostgreSQL (Supabase).
- Seed script (`prisma/seed.ts`) populates starter categories, equipment, and responsáveis.
- Express server scaffolded with a working `GET /categorias` endpoint.
- Remaining CRUD endpoints (equipment, responsáveis, usuários, empréstimos, ocorrências) and frontend integration are pending.

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
│   │   ├── components/    # buttons, forms, modal, icons, toast
│   │   ├── layout/        # sidebar, panels-shell, footer
│   │   ├── panels/        # one stylesheet per panel
│   │   └── styles.css     # entry point, imports all modules
│   ├── js/
│   │   ├── core/
│   │   │   ├── confirm/   # Promise-based delete confirmation modal
│   │   │   ├── datepicker/# flatpickr wrapper
│   │   │   ├── modal/     # generic modal open/close + close-button injection
│   │   │   ├── navigation/# sidebar panel switching
│   │   │   ├── state/     # in-memory loan state (soft-delete model)
│   │   │   ├── toast/     # toast notifications
│   │   │   └── utils/     # escapeHtml, html`` tagged template, raw()
│   │   ├── features/
│   │   │   ├── cadastros/
│   │   │   ├── config/
│   │   │   ├── controle/
│   │   │   ├── dashboard/
│   │   │   ├── devolucao/
│   │   │   ├── emprestimo/
│   │   │   └── exportar/
│   │   └── main.js        # entry point, initializes feature modules
│   └── index.html
└── backend/
    ├── prisma/
    │   ├── schema.prisma
    │   └── seed.ts
    ├── migrations/
    ├── src/
    │   ├── routes/        # categorias.ts (more pending)
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

The sidebar is intentionally fixed and non-collapsible, a deliberate choice for a daily-use operational tool. Sidebar navigation styles are scoped to `.sidebar-nav .nav-link` to avoid leaking into other elements that reuse the `.nav-link` hook for JS navigation.

---

## Roadmap

- [x] Build modals for creating and editing records in the Controle panel
- [x] Refactor loan state to soft deletes for full history
- [x] XSS sanitization across dynamic HTML rendering
- [x] Define Prisma schema and run initial migration
- [ ] Implement remaining backend CRUD endpoints (Equipamento, Responsavel, Usuario, Emprestimo, Ocorrencia)
- [ ] Replace in-memory/mock frontend state with real API calls
- [ ] Add Supabase Realtime for cross-browser live updates
- [ ] Migrate remaining JS files to the `html\` \`` tagged template pattern for consistency
- [ ] Accessibility improvements: focus trap in modals, `role="dialog"`
- [ ] Unit tests with Vitest for pure utility functions
- [ ] Migrate vanilla JS frontend to TypeScript
- [ ] Migrate to React + TypeScript (v2), addressing responsive/mobile support
- [ ] Deploy (Vercel + Render)

---

## Known Limitations (current)

- Backend is only partially connected (`Categoria` read endpoint only); most panels still run on in-memory/mock JS state.
- No authentication or access control.
- No responsive/mobile layout (deferred to the v2 React migration).
- Individual asset tracking (per-unit serial numbers) is out of scope for v1.

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
3. Create a `.env` file with `DATABASE_URL` and `DIRECT_URL` pointing to your Supabase Postgres instance.
4. Run migrations:
   ```bash
   npx prisma migrate dev
   ```
5. *(Optional)* Seed the database:
   ```bash
   npx prisma db seed
   ```
6. Start the dev server:
   ```bash
   npm run dev
   ```
> The API runs on `http://localhost:3000` by default.

---

## Author
Developed by Thiago da Silva.