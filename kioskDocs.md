# Kiosk Documentation System — `kioskDocs.md`

## Purpose

Implement a complete in-app documentation system for **EduAssets** that works identically in both environments:

* **Raspberry Pi Kiosk Mode** (offline/local network, fullscreen SPA).
* **Hosted Web Version** (Vercel deployment).

Documentation **must never open a new browser tab, download a file, or navigate away from the application**. Every document is rendered inside EduAssets itself.

This document defines the architecture, UX, rendering behavior, file organization, and implementation requirements.

---

# Design Philosophy

The documentation is part of the application, not an external resource.

Goals:

* Single-page application experience.
* Works without internet when served locally.
* Easy to maintain.
* Markdown remains the source of truth.
* Visual presentation follows EduAssets Design System.
* Optimized for touchscreens and kiosk hardware.

---

# High-Level Architecture

```
frontend/
├── public/
│   └── docs/
│       ├── README.md
│       ├── ManualUsuario.md
│       ├── Architecture.md
│       ├── DatabaseModel.md
│       ├── Roadmap.md
│       ├── Changelog.md
│       └── assets/
│           ├── architecture.svg
│           ├── database.svg
│           ├── loan-flow.svg
│           └── ...
│
└── src/
    ├── core/
    │   └── docs/
    │       ├── markdownRenderer.ts
    │       ├── docsService.ts
    │       ├── toc.ts
    │       └── sanitize.ts
    │
    └── features/
        └── sobre/
            ├── documentationModal.ts
            ├── documentationSidebar.ts
            ├── documentationSearch.ts
            ├── documentationStyles.css
            └── index.ts
```

---

# Source of Truth

## All documentation remains in Markdown.

The following files are the canonical documentation:

| File               | Purpose                |
| ------------------ | ---------------------- |
| `README.md`        | Project overview       |
| `ManualUsuario.md` | User manual            |
| `Architecture.md`  | Technical architecture |
| `DatabaseModel.md` | Database explanation   |
| `Roadmap.md`       | Planned features       |
| `Changelog.md`     | Version history        |

**Do not duplicate documentation into HTML templates.**

Markdown is edited once and rendered everywhere.

---

# Documentation Modal

Replace individual document popups with **one reusable Documentation Center modal**.

## Behavior

Clicking any documentation card opens the same modal.

Inside the modal:

* Sidebar with all available documents.
* Search input.
* Scrollable content.
* Dynamic title.
* Table of contents.
* Close button.
* ESC closes modal.
* Clicking overlay closes modal.

No routing changes.

No URL changes.

No page refresh.

---

## Layout

```
 ---------------------------------------------------------
| Documentation Center                              [ X ] |
|---------------------------------------------------------|
| Sidebar              | Search...                        |
|                      |----------------------------------|
| ● User Manual        | Title                            |
| ○ README             |                                  |
| ○ Architecture       | Table of Contents                |
| ○ Database Model     |                                  |
| ○ Roadmap            |                                  |
| ○ Changelog          | Markdown content                 |
|                      |                                  |
|                      |                                  |
|                      |                                  |
|                      |                                  |
 ---------------------------------------------------------
```

---

# Sidebar Requirements

The sidebar contains every documentation file.

Features:

* Highlight current document.
* Keyboard accessible.
* Touch friendly.
* Icons matching sidebar icons already used by EduAssets.
* Instant switching without reopening modal.

---

# Markdown Rendering

Use a lightweight production-ready Markdown parser.

## Requirements

* Use **Marked**.
* Do NOT implement a custom Markdown parser.
* Sanitize generated HTML before rendering.
* Only allow safe tags and attributes.

Supported Markdown features:

* H1–H4 headings.
* Paragraphs.
* Bold / italic.
* Lists.
* Ordered lists.
* Tables.
* Inline code.
* Code blocks.
* Horizontal rules.
* Blockquotes.
* Images.
* Links.

---

# Markdown Enhancements

Support GitHub-style callouts.

Example Markdown:

```md
> [!TIP]
> Always connect the charger before storing the notebook.

> [!WARNING]
> Never disconnect the Raspberry Pi power supply while EduAssets is running.

> [!NOTE]
> Guest users cannot edit equipment.
```

Render visually as EduAssets callout cards.

Types:

* NOTE
* TIP
* WARNING
* IMPORTANT

Each has its own icon and accent color.

---

# Table of Contents (TOC)

Automatically generate a TOC from headings.

Rules:

* Include H2 and H3.
* Highlight current section while scrolling.
* Clicking an item scrolls smoothly.
* TOC remains sticky on desktop.
* TOC collapses into an accordion on small screens.

---

# Search

Add full-text search inside documentation.

Behavior:

* Searches every loaded document.
* Filters sidebar results.
* Highlights matching text.
* Opens the correct document automatically when selected.

Search should operate on cached Markdown content.

No network requests after initial load.

---

# Documentation Service

Create a centralized documentation service.

Responsibilities:

* Fetch Markdown files.
* Cache loaded documents.
* Parse Markdown once.
* Expose search API.
* Expose metadata.

Pseudo API

```ts
loadDocument(id)

getDocument(id)

getAllDocuments()

searchDocuments(query)

clearCache()
```

Cache lifetime:

* Entire SPA session.

---

# Preloading Strategy

When the **About** page loads:

* Begin fetching all Markdown documents in the background.
* Cache parsed HTML.
* Cache heading tree.

This makes modal opening instantaneous.

---

# Images and Diagrams

All diagrams must be SVG whenever possible.

Location:

```
public/docs/assets/
```

Examples:

* architecture.svg
* database.svg
* flow.svg

Requirements:

* Responsive.
* Preserve aspect ratio.
* Lazy-load large images.
* Click to zoom inside modal.

Do not embed Base64 SVG.

---

# Code Blocks

Render fenced code blocks with EduAssets styling.

Requirements:

* Monospace font.
* Rounded container.
* Horizontal scrolling.
* Copy button.
* Line wrapping disabled.

---

# Tables

Markdown tables should render using EduAssets table component styling.

Requirements:

* Responsive overflow.
* Zebra rows.
* Sticky header if table is long.

---

# Document Metadata

Every document displays metadata automatically.

Footer example:

```
Version: v1.0.0

Last Updated: 2026-08-25

Source: ManualUsuario.md
```

Metadata comes from a centralized configuration object.

---

# Document Registry

Create a registry describing every document.

Example structure:

```ts
{
  id,
  title,
  icon,
  file,
  category,
  version,
  updatedAt
}
```

The sidebar and modal use this registry.

No hardcoded buttons.

---

# Manual Styling

Although `ManualUsuario.md` remains Markdown, it receives richer styling.

Enhancements include:

* Large section headers.
* Accordion sections for long topics.
* Numbered procedure cards.
* Info banners.
* Screenshot placeholders.
* Hardware-specific notes.

The Markdown renderer should map these semantic blocks into EduAssets UI components.

---

# Scroll Behavior

Requirements:

* Preserve scroll position while switching TOC items.
* Reset scroll when opening a different document.
* Smooth scrolling.
* Scroll spy updates TOC.

---

# Kiosk Compatibility

Must fully support Raspberry Pi fullscreen kiosk mode.

Requirements:

* No `target="_blank"`.
* No downloads.
* No browser navigation.
* Works without internet.
* Touch scrolling.
* Large click targets.
* Escape key support for keyboards.

---

# Accessibility

* Keyboard navigation.
* Focus trap inside modal.
* Proper heading hierarchy.
* ARIA labels.
* Visible focus state.

---

# Performance

Requirements:

* Markdown parsed only once.
* HTML cached.
* SVG loaded lazily.
* Search indexes cached.
* No unnecessary DOM recreation.

Target behavior:

* Opening documentation feels instant after preload.

---

# Styling Guidelines

Follow EduAssets Design System.

Use existing variables for:

* Colors.
* Border radius.
* Shadows.
* Typography.
* Icons.
* Modal spacing.

Create documentation-specific CSS only when necessary.

New classes should use the `doc-` prefix.

Examples:

```
doc-layout

doc-sidebar

doc-content

doc-callout

doc-code

doc-toc

doc-search

doc-footer
```

Avoid inline styles.

---

# Future Extensibility

The system should support future documentation without additional code.

Adding a document should only require:

1. Create a new Markdown file in `public/docs/`.
2. Register it in the document registry.
3. (Optional) Add SVG assets.

Everything else (sidebar, search, TOC, metadata, rendering) should work automatically.

---

# Expected User Experience

1. User opens **About**.
2. Background preload begins.
3. User clicks **User Manual**.
4. Documentation Center opens instantly.
5. Sidebar shows all documents.
6. Search filters documentation.
7. TOC allows quick navigation.
8. Images and diagrams open inside the modal.
9. User closes modal and returns to the About page without leaving the application.

This documentation system is considered a core feature of EduAssets and must behave consistently across kiosk and hosted environments while remaining easy to maintain through Markdown-based documentation.
