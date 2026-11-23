---
name: FormO
description: Self-hosted form-to-email platform — developer-grade control in a calm zinc dashboard.
colors:
  paper: "#f1eee6"
  ink: "#130b00"
  surface-light: "#ffffff"
  surface-dark: "#09090b"
  surface-raised-dark: "#18181b"
  border-light: "#e4e4e7"
  border-dark: "#27272a"
  text-primary-light: "#18181b"
  text-primary-dark: "#f4f4f5"
  text-muted-light: "#52525b"
  text-muted-dark: "#a1a1aa"
  accent: "#ca8a04"
  danger: "#dc2626"
  danger-tint: "#fef2f2"
  success: "#16a34a"
typography:
  display:
    fontFamily: "General Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    letterSpacing: "-0.02em"
  title:
    fontFamily: "General Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    letterSpacing: "-0.02em"
  body:
    fontFamily: "General Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
  label:
    fontFamily: "General Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
  mono:
    fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontVariantNumeric: "tabular-nums"
rounded:
  sm: "6px"
  md: "8px"
  lg: "16px"
  xl: "24px"
  full: "9999px"
spacing:
  tight: "4px"
  sm: "8px"
  md: "12px"
  lg: "20px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.surface-light}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-primary-dark:
    backgroundColor: "{colors.surface-light}"
    textColor: "{colors.text-primary-light}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-secondary:
    backgroundColor: "{colors.surface-light}"
    textColor: "{colors.text-primary-light}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-danger:
    backgroundColor: "{colors.danger-tint}"
    textColor: "{colors.danger}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.text-primary-light}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  card:
    backgroundColor: "{colors.surface-light}"
    textColor: "{colors.text-primary-light}"
    rounded: "{rounded.lg}"
    padding: "20px"
  dialog:
    backgroundColor: "{colors.surface-light}"
    textColor: "{colors.text-primary-light}"
    rounded: "{rounded.lg}"
    padding: "20px"
---

# Design System: FormO

## Overview

**Creative North Star: "The Quiet Workbench."**

A quiet, neutral workspace where the tools recede and the work stays legible. The dashboard is an Operate surface: scanability and predictable controls outrank expression. Nothing shouts. Density is moderate — tight clusters of related controls inside generous containers — and every state change is legible at a glance.

The palette is a single zinc ladder with a black/white canvas and one amber accent reserved for icon badges and brand moments. Theme switching is an inversion, not a rebrand: light uses black controls on white, dark uses white controls on black. No warm or colored surfaces are introduced.

**Key Characteristics:**
- Black canvas in dark mode (`#000000`) and warm paper (`#f1eee6`) in light mode, with zinc surfaces inside.
- Inverting monochrome buttons; one amber accent, used sparingly.
- 8px controls, 16px cards, 24px panels; everything on the Tailwind 4/8/12/20 rhythm.
- One-pixel zinc borders plus soft `shadow-lg` / `shadow-xl` / `shadow-2xl` — depth is soft, never hard-offset.
- Lucide icons at 13–20px, `strokeWidth={2}`, usually inside a `rounded-full` tinted badge.

## Colors

A neutral-first system: zinc carries almost everything, amber marks identity, red/green mark consequence.

### Primary
- **Canvas** (`#000000` dark / `#f1eee6` light): the outer frame. Root background tokens; zinc chrome sits inside.
- **Amber Accent** (`#ca8a04`, yellow-600): icon badges (`bg-yellow-600/20 text-yellow-600`) and brand emphasis. Never used as a large fill.

### Neutral
- **Surface** (`#ffffff` light / `#09090b` zinc-950 dark): panels and overlays.
- **Raised Surface** (`#18181b` zinc-900 dark): cards and nested containers.
- **Border** (`#e4e4e7` zinc-200 light / `#27272a` zinc-800 dark): 1px separators and control outlines.
- **Primary Text** (`#18181b` zinc-900 light / `#f4f4f5` zinc-100 dark).
- **Muted Text** (`#52525b` zinc-600 light / `#a1a1aa` zinc-400 dark): descriptions, secondary copy, placeholders.

### Consequence
- **Danger** (`#dc2626` red-600 on `red-500/10` with a `red-500/30` border): destructive actions only.
- **Success** (`#16a34a` green-600): positive deltas and confirmations.

### Named Rules
- **The One Accent Rule.** Amber appears in circular icon badges and brand marks only. It never becomes a button, a card fill, or a text color for body copy.
- **The Inversion Rule.** Light and dark swap value, never hue. A primary button is black on light and white on dark; adding blue or amber in dark mode is a violation.
- **The Zinc Ladder Rule.** Every neutral — text, surface, border, placeholder — comes from one zinc step. Mixing slate, gray, or neutral families breaks the system.

## Typography

**Display/UI Font:** General Sans (self-hosted variable, 200–700) with `ui-sans-serif, system-ui` fallback.
**Mono Font:** JetBrains Mono for code, endpoints, counters and tabular data.

**Character:** General Sans is quiet and slightly geometric; it reads as a tool, not a campaign. Weights carry hierarchy — `font-semibold` for labels and headings, regular for body — rather than size jumps.

### Hierarchy
- **Display** (600, `1.5rem`/24px, `-0.02em`, balanced): page and card headings (`text-2xl`).
- **Title** (600, `1.125rem`/18px, `-0.02em`): modal headings (`text-lg`).
- **Body** (400, `0.875rem`/14px): primary copy (`text-sm`) and dense table text (`text-xs`).
- **Label** (600, `0.75rem`/12px, `capitalize`): field labels above inputs.
- **Mono** (JetBrains Mono, `tabular-nums`): endpoints, counts, IDs.

### Named Rules
- **The Weight Rule.** Hierarchy comes from weight and size step, never color intensity or letter-spacing below `-0.02em`.
- **The Label Rule.** Every input has a visible `font-semibold capitalize` label tied to its `id`.

## Layout

Single-column stacks (`grid grid-cols-1`) inside a `DeveloperShell` with a fixed icon rail. Related controls cluster at `gap-2`/`gap-3`; section groups separate at `gap-5`; panel padding is `p-5` or `p-6`. Tables are full-width with `px-5 py-4` cells and a `border-b` per row. Modals are `w-full max-w-md`, centered, with `sm:p-6`. Responsive behavior is conservative: `max-sm:px-3` on buttons, `max-sm:px-5` on chrome, `max-sm:grid-cols-1` where a multi-column layout would otherwise overflow.

## Elevation & Depth

Depth is soft and layered, never flat-hard. Cards use `shadow-lg`, hover raises to `shadow-xl`, and modal panels use `shadow-2xl`. A 1px zinc border accompanies the shadow on light surfaces; dark surfaces rely more on value contrast than shadow. Loading is conveyed by `bg-zinc-200 dark:bg-zinc-800 animate-pulse` blocks.

- **Card** (`box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1)`): resting containers.
- **Hover** (`box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1)`): interactive cards.
- **Dialog** (`box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25)`): the focused panel above an overlay.

### Named Rules
- **The Soft Shadow Rule.** Shadows always have blur. Hard offset shadows are not part of this system.
- **The Single Frame Rule.** One 1px border defines an edge; never stack multiple borders to fake depth.

## Shapes

- **Controls** — `rounded-md` (8px): buttons, inputs, selects, textareas.
- **Panels** — `rounded-2xl` (16px): cards, dialogs, table containers.
- **Large containers** — `rounded-3xl` (24px): analytics cards.
- **Badges** — `rounded-full` (9999px): icon chips, status pills, close button.
- Corners are never mixed within one component: a `rounded-2xl` panel contains `rounded-md` controls.

## Components

### Buttons
- **Shape:** `rounded-md` (8px), `px-4 py-2`, `text-sm font-semibold`, `flex items-center justify-center gap-2`.
- **Primary:** black on light, white on dark (`bg-black text-zinc-100 dark:bg-white dark:text-zinc-900`).
- **Secondary:** white with `border-zinc-300`, dark variant drops the border.
- **Danger:** `bg-red-500/10 text-red-600 border border-red-500/30`, hover `bg-red-500/20`.
- **Hover / Focus:** `duration-300` transitions; disabled is `opacity-40 cursor-not-allowed`; icons are 15–20px Lucide.
- **Voice:** the label names the action ("Delete template", "Save changes", "Add form").

### Inputs / Fields
- **Style:** `border border-zinc-300 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900/50`, `py-2 px-4 rounded-md w-full`, `outline-0`.
- **Focus:** border shifts to `zinc-900` (light) / `zinc-100` (dark) plus `focus:ring-3` at `zinc-600/50` / `zinc-300/40`.
- **Label:** `font-semibold capitalize` above the field with a small `gap-1`.
- **Error:** red text below the field, `text-xs`.

### Cards / Containers
- **Corner Style:** `rounded-2xl`; analytics use `rounded-3xl`.
- **Background:** `bg-zinc-50 dark:bg-zinc-950` with a soft `shadow-lg`.
- **Border:** `border-zinc-200 dark:border-zinc-900`, 1px.
- **Internal Padding:** `p-5`, `gap-5` between groups.

### Modal / Dialog
- **Overlay:** `fixed inset-0 z-50 p-5 bg-white/90 dark:bg-black/90`, scrollable, centered.
- **Panel:** `w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl dark:bg-zinc-950 sm:p-6`.
- **Semantics:** `role="dialog"`, `aria-modal="true"`, `aria-label` always present.
- **Close:** a circular button at `top-10 right-10`, `bg-zinc-100 dark:bg-zinc-900`, rounded-full, `Icon name="X" size={18}`.
- **Dismissal:** Escape closes; the first field is focused on open.
- **Rhythm:** heading, one-line explanation, fields, then a two-column action row via `grid grid-cols-2 gap-3`.

### Icon Badges
- `h-12 w-12 rounded-full bg-yellow-600/20 text-yellow-600`, Lucide `strokeWidth={2} size={18–20}`.

### Loading / Empty States
- Skeleton: `bg-zinc-200 dark:bg-zinc-800 animate-pulse`.
- Spinner: `<Icon name="Loader" className="animate-spin" />`.
- Empty: centered `text-zinc-500`, icon above, one sentence of guidance.

## Do's and Don'ts

### Do:
- **Do** use `FormButton`, `InputField`, `TextAreaField`, `SelectField` and `Layout` for new UI rather than rebuilding their class strings.
- **Do** pair every destructive action with a focused dialog that names the target and the consequence.
- **Do** use `aria-label` on icon-only buttons and `role="dialog"` / `aria-modal` on overlays.
- **Do** keep amber inside circular badges; let black/white carry primary actions.

### Don't:
- **Don't** use `window.confirm` or `window.alert` — they break the workbench and cannot be styled or focused.
- **Don't** introduce a second neutral family (slate, gray, neutral) alongside zinc.
- **Don't** use hard-offset shadows or gradient text.
- **Don't** put more than one primary button in a dialog.
- **Don't** change hue between light and dark; swap value only.

## Developer operations surface

The developer home, submissions inbox and settings share one read model and one
visual grammar: a short attention band, a list of real records, and explicit
loading, empty and error text. No card links to a route that does not exist.

- **Statuses** use one pill vocabulary across the inbox, detail view and logs:
  green `sent`, yellow `pending`/`retrying`, red `failed`/`dead_letter`, zinc `spam`.
- **Navigation** is the same information on desktop rail, header menu and mobile
  tab bar. The mobile bar is a single full-width floating group with enlarged
  tap targets; the active tab scales and transitions, and route changes use a
  short `page-enter` fade that is disabled under `prefers-reduced-motion`.
- **Retention** is a workspace setting, not a hidden job: leaving it unset keeps
  data forever, and only an explicit value (or `FORMO_SUBMISSION_RETENTION_DAYS`)
  causes the maintenance worker to prune old submissions.
- **Deletion** is always explicit and admin-only. Forms stay soft-deleted so an
  accidental click is recoverable, but their submissions remain visible in the
  inbox behind a "Form deleted" badge. Deleting a submission hard-deletes it and
  cascades to its delivery logs and events; the confirmation names the target and
  count, and the action is written to the audit log. Never auto-delete on form
  deletion.
- **Tooltips** are supplementary labels for icon-only controls only, built with
  `@heroui/react`'s `Tooltip` via `components/Global/Tooltip.tsx`. The trigger's
  `aria-label` remains the accessible name. Never use a tooltip for form errors,
  feedback or information required to complete a task — use a toast or visible
  text. No second tooltip library is installed.
