# Tech Stack

- You are building a React application.
- Use TypeScript.
- Use React Router. KEEP the routes in src/App.tsx
- Always put source code in the src folder.
- Put pages into src/pages/
- Put components into src/components/
- The main page (default page) is src/pages/Index.tsx
- UPDATE the main page to include the new components. OTHERWISE, the user can NOT see any components!
- ALWAYS try to use the shadcn/ui library.
- Tailwind CSS: always use Tailwind CSS for styling components. Utilize Tailwind classes extensively for layout, spacing, colors, and other design aspects.

Available packages and libraries:

- The lucide-react package is installed for icons.
- You ALREADY have ALL the shadcn/ui components and their dependencies installed. So you don't need to install them again.
- You have ALL the necessary Radix UI components installed.
- Use prebuilt components from the shadcn/ui library after importing them. Note that these files shouldn't be edited, so make new components if you need to change them.

## NatiStyle UI/UX Guidelines

- **Glass baseline**
  - Surfaces (cards, popovers, dropdowns, chips) use `glass-surface`.
  - Add soft elevation with rings/borders: `ring-1 ring-white/30 dark:ring-white/10` and `rounded-xl` or `rounded-2xl`.
  - Hover interactions use `glass-hover`.

- **Brand accents**
  - Brand pill for active/"smart" states: `nati-pill`.
  - Optional subtle accent outline: `nati-ring`.

- **Typography & contrast**
  - Use `glass-contrast-text` for titles in glass containers.
  - Helper/descriptive text should be non-interactive and `select-none`.

- **Components**
  - Popovers/Dropdowns: `rounded-2xl glass-surface ring-1 ... select-none`.
  - Chips/Rows: `rounded-lg glass-surface ring-1 ... p-2`.
  - Empty states: `rounded-lg border border-dashed glass-surface p-4 text-center`.

- **Accessibility**
  - Preserve focus states: `focus-visible:ring` if you override focus.
  - Maintain color contrast across light/dark.

### Utilities available (defined in `src/globals.css`)

- `glass-surface` → frosted background, blur, subtle border.
- `glass-hover` → subtle hover color for glass.
- `glass-contrast-text` → balanced title text on glass.
- `nati-pill` → brand pill (bg/fg/ring) for status chips.
- `nati-ring` → thin brand outline.

### Defaults when creating components

- Wrap interactive containers in glass styling by default.
- Use `select-none` for labels, tips, and static copy to avoid accidental selections.
- Prefer shadcn/ui primitives; extend via custom components instead of editing the library files.

## When to use glass vs solid

- **Do not use glass everywhere.** Choose based on app type and hierarchy.
- **Primary work surfaces (forms, editors, data tables):** prefer solid backgrounds (`bg-card`/`bg-popover`, no glass) for readability.
- **Secondary/auxiliary UI (dropdowns, popovers, tooltips, chips):** glass is optional; use when it adds depth without hurting contrast.
- **Critical dialogs/modals:** prefer solid surfaces with clear borders; use glass sparingly (e.g., header or footer only).
- **High-density screens:** reduce blur/transparency; use solid surfaces with clear dividers.

### Presets by app type

- **Dashboard / Analytics**
  - Cards: solid (`bg-card`, `ring-1`) by default; optional `glass-surface` for summary tiles.
  - Tables/Filters/Sidebars: solid; popovers may use glass.

- **Data-heavy / CRUD tools**
  - Forms, editors, data lists: solid surfaces for maximum legibility.
  - Use glass only for lightweight overlays (quick actions, chips).

- **Marketing / Showcase**
  - Hero/tiles may use glass for visual appeal.
  - CTAs and forms remain solid for clarity.

- **Utilities / Widgets**
  - Lightweight panels and dropdowns can use glass.
  - Keep content areas solid if text density is high.

### Practical tips

- Always check contrast in both light/dark modes.
- If in doubt, start solid; add glass selectively to secondary UI.
- Keep border/ring subtle but present on both solid and glass.
