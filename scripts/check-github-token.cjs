#!/usr/bin/env node
// Simple preflight check for GitHub token presence
// Electron Forge's GitHub publisher reads GITHUB_TOKEN or GH_TOKEN

const required = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
if (!required) {
  console.error("\n[publish] Missing GitHub token. Set GITHUB_TOKEN or GH_TOKEN.\n" +
    "- Create a token with repo/release permissions (or fine-grained with Releases write)\n" +
    "- Option 1 (PowerShell):  $env:GITHUB_TOKEN='YOUR_TOKEN'\n" +
    "- Option 2 (.env file):   GITHUB_TOKEN=YOUR_TOKEN\n");
  process.exit(1);
}

// Optional: basic sanity check for token shape (does not validate)
if (!/^gh[pousr]_|^github_pat_/.test(required)) {
  console.warn("[publish] Warning: token format is unusual. Proceeding anyway.");
}

console.log("[publish] GitHub token detected.");
