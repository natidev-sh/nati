# Nati v0.2.1

Small but solid quality-of-life release focused on the Preview Console experience and theming.

## Highlights

- **[Customize Terminal settings]**
  - New Settings section: “Customize Terminal”.
  - Controls for auto-scroll, font size, and colors.
  - One-click “Reset to default”.
- **[Console improvements]**
  - Auto-scrolls to the newest line.
  - Themed output using your customized background/foreground/font size.
  - Tabs toolbar: New Terminal, Rename, Tab Color, Close.
  - Tab colors honor `settings.console.theme.tabDefault` and `tabActive`.

## Changes

- **[UI/UX]**
  - `src/components/preview_panel/Console.tsx`: auto-scroll and theme support.
  - `src/components/preview_panel/PreviewPanel.tsx`: console tabs toolbar; tab color integration with settings.
  - `src/components/settings/CustomizeSettings.tsx`: new settings panel for console.
  - `src/pages/settings.tsx`: added the “Customize Terminal” section.

- **[Configuration]**
  - `src/lib/schemas.ts`: extended `UserSettings` with `console` preferences:
    - `autoScroll?: boolean`
    - `fontSize?: number` (8–24)
    - `theme?: { background?; foreground?; accent?; tabDefault?; tabActive? }`

- **[Hub (earlier recent work)]**
  - Local “Share to Hub” export flow that writes JSON into the app folder under `hub_submissions/`.
  - Hub page tabs and scope filters scaffolded (Templates wired; Prompts/Plugins placeholders).

## Breaking changes

- None.

## Upgrade notes

- No migration steps are required.
- After updating, open Settings → “Customize Terminal” to tune your console theme and behavior.

## Known issues

- Console tabs are UI-only; they currently show the same output stream and are not interactive terminals.
- If you change terminal colors while the console is open, styling updates live; no restart required.

## System requirements

- Node.js ≥ 20
- Windows/macOS/Linux supported (Electron 35.x)

## Install

- Download the installer/binaries from the Assets below.
- Windows: run the Squirrel installer.
- macOS: open the dmg and drag to Applications.
- Linux: use the appropriate package for your distro (deb/rpm) or the zip.

## Verification

- After installation:
  - Open Settings → “Customize Terminal”.
  - Toggle Auto-scroll and adjust Font size.
  - Change Background/Foreground/Tab colors and verify the Preview and Console reflect changes.
  - Use “Reset to default” if you want to revert.

## Contributors

- Thanks to everyone helping shape the console experience and theming.

## Assets

- Windows Installer (.exe)
- macOS (dmg)
- Linux (deb, rpm, zip)
