# eduAssets

<div align="center">

<img src="frontend/assets/img/eduAssets_banner.png" alt="EduAssets banner" width="100%">

</div>

> **Status: Active Development.** This project is a work in progress. Core panels are functional with mock data; backend integration, responsive support, and several UI flows are still being built. Breaking changes should be expected between commits.

## Overview

eduAssets is a school equipment loan and inventory management system built as a portfolio project. It targets daily operational use by a small group of users (a system administrator and a handful of teachers), and its design decisions favor low-friction, high-frequency workflows over granular per-unit asset tracking, which is planned for a future version.

The system covers four core operations:

- Registering new equipment loans
- Processing returns
- Monitoring stock levels and loan history through a dashboard
- Tracking equipment issues (observations, maintenance, and broken units) through a dedicated control panel

## Tech Stack

**Frontend (current, v1)**
- Vanilla HTML, CSS, and JavaScript (ES Modules)
- [flatpickr](https://flatpickr.js.org/) for datetime input handling

**Frontend (planned migration)**
- React

**Backend (planned)**
- Node.js
- Prisma ORM
- PostgreSQL (Neon serverless)

**Hosting (planned)**
- Frontend: Vercel
- Backend: Render

## Current State

The frontend is being built panel by panel, using a static HTML shell with mock data. No backend is connected yet; all data currently lives inline in the DOM.

| Panel | Status | Notes |
|---|---|---|
| Novo Empréstimo | Complete | Loan registration form |
| Devoluções | Complete | Two-line card layout, professor as primary contact, SVG arrow separator |
| Dashboard | Complete | Estoque and Registros tabs, CSS Grid category cards, checkbox multi-select, edit modal, flatpickr filtering |
| Controle | In progress | Data table with four tabs (Observação, Manutenção, Quebrado, Resolvidos), single-row selection, "+Novo" toolbar dropdown. Pending: modals for creating and editing records |
| Cadastros | In progress | Modal-based CRUD scaffolding for equipment, staff, users, and categories |
| Exportar | UI complete | No export logic connected yet |
| Configurações / Sobre | Placeholder / static | |

Panel switching is implemented in `js/features/navigation/navigation.js` using `data-panel` attributes and `.active` class toggling. This currently switches instantaneously; a smooth transition system is under evaluation (CSS fade-in, crossfade via `transitionend`, or the native View Transitions API).

## Project Structure

```
/assets
  /icons
  /img
  /logos
/css
  /base          -> reset, design tokens (variables.css)
  /components    -> buttons, forms, modal, icons
  /layout        -> sidebar, panels-shell, footer
  /panels        -> one stylesheet per panel
  styles.css     -> entry point, imports all modules
/js
  /features
    /navigation
    /dashboard
    /controle
    /cadastros
  main.js        -> entry point, initializes feature modules
index.html
```

## Design System

Styling is driven by a CSS custom property token system defined in `css/base/variables.css`:

- A blue-tinted slate scale for neutrals
- Primary (blue) and secondary (violet) color scales
- Semantic aliases (`--primary-color`, `--text-primary`, `--border-color`, etc.)
- Surface tokens for layered backgrounds
- Feedback colors for success, warning, error, and info states

Button styles are consolidated into `css/components/buttons.css` using a base `.btn` class with modifiers (`.btn-primary`, `.btn-success`, `.btn-neutral`, `.btn-warning`, `.btn-danger`).

The sidebar is intentionally fixed and non-collapsible. This is a deliberate choice for a daily-use operational tool, consistent with the pattern used by Gmail, Notion, Linear, and Stripe Dashboard, rather than an oversight.

## Roadmap

- [ ] Finalize and implement the panel transition system
- [ ] Build modals for creating and editing records in the Controle panel
- [ ] Decide on responsive/mobile support for v1 vs. deferring to the React migration
- [ ] Finalize the product logo
- [ ] Replace mock HTML data with real API calls once the backend is connected
- [ ] Refactor index-based DOM access in dashboard JS (`spans[1]`, `spans[2]`) to use `data-col` attributes
- [ ] Migrate frontend to React
- [ ] Implement backend (Node.js, Prisma, PostgreSQL)
- [ ] Deploy (Vercel + Render)

## Known Limitations (v1)

- No backend or persistence layer; all data is hardcoded in `index.html`
- No authentication or access control
- No responsive/mobile layout
- Individual asset tracking (per-unit serial numbers) is out of scope for v1

## Running Locally

This is a static frontend with no build step required.

1. Clone the repository
2. Open `index.html` directly in a browser, or serve the directory with any static file server, e.g.:

```bash
npx serve .
```

## Author

Developed by Thiago da Silva.
