# Future Update Ideas

## Builder Flow and UX
- Command Palette (Ctrl/Cmd+K): quick-open apps, files, actions (backup, GitHub sync, open iOS/Android).
- One‑click “Scaffold + Run”: single CTA that scaffolds, installs, opens chat, runs app with progress HUD.
- Contextual Smart CTA: detect missing prerequisites (Node, PNPM, provider keys) and render fix cards with one‑tap actions.

## Collaboration & Git
- AI PR Assistant: summarize changes, generate PR body/labels, push branch, open PR URL.
- Visual Git Graph: inline commit graph with checkout/revert/squash.
- Branch Preview Environments: show Vercel preview + status in App Details.

## Quality & Code Intelligence
- AI Code Review on Sync: after “Sync to GitHub”, run lightweight review and show insights card.
- Tests & Coverage Nudges: generate smoke tests, run quick coverage; compact sparkline per app.
- Dependency Health Monitor: flag outdated/unsafe deps with “safe upgrade”.

## Data & Backend
- DB Browser + Seed Recipes: simple table viewer and seed scripts with reversible transactions.
- Migration Planner: visual diff of schema changes with apply/rollback (pairs with `portal_handlers.ts`).

## Mobile & Device
- Device Console + Live Reload HUD: live device logs and reload button when using Capacitor.
- Screenshot/Video Capture: trigger device screenshots/videos for PR feedback.

## Reliability & Safeguards
- Auto Backups Before Risky Actions: run `backup:create` before upgrades/force‑push/migrations; show “Restore” chip.
- Recovery Flow: “Restore recent backup” banner after a failure.

## Templates & Prompts
- Task‑driven Templates: ask “What are you building?” then map to curated templates/prompt chains.
- Prompt Library with Ratings: share/reuse prompts; star/favorite; integrates with `prompts:*` IPC.

## Observability
- App Health Card: Node/PNPM installed, Git connected, provider keys set, warnings count, last run time.
- Release Notes Digest: summarize key changes since last version with suggested features to try.

## Keyboard & Power-user
- Custom Keybindings: expand `settings.keyboard` to user-defined bindings with conflict detection.
- Macro Actions: user-defined multi‑step actions (e.g., backup → sync → open PR).

## Marketability/Pro
- Shareable Demo Export: package minimal runnable demo with README and preview link.
- Usage Insights (local, opt‑in): counts (apps created, runs, syncs) with tips unlocked at milestones.

## Home Page Alternatives
- Magic Input with Intent Detection: type goals; show 3 plan options (stack, template, integrations).
- Starter Trails: curated 3‑step checklists like “Build + Deploy”, “Mobile ready”, “Supabase data app”.
- Next Best Step: suggest smart actions for existing apps (wire GitHub, create backup, generate README).
