/**
 * Release notes for each version
 * Update this file when creating a new release
 */

export interface ChangelogItem {
  type: 'feature' | 'bugfix' | 'improvement' | 'breaking';
  title: string;
  description: string;
}

export interface Changelog {
  version: string;
  date: string;
  features: ChangelogItem[];
  bugfixes: ChangelogItem[];
  improvements?: ChangelogItem[];
  breaking?: ChangelogItem[];
}

export const changelogs: Record<string, Changelog> = {
  '0.2.12-beta1': {
    version: '0.2.12-beta1',
    date: '2025-10-22',
    features: [
      {
        type: 'feature',
        title: 'GitHub Token Sync',
        description: 'Login via nati.dev automatically syncs your GitHub token to the desktop app',
      },
      {
        type: 'feature',
        title: 'Supabase Branching',
        description: 'Switch between main and preview branches directly from the Configure panel',
      },
      {
        type: 'feature',
        title: 'Import Dialog Improvements',
        description: 'GitHub repos now load automatically after Device Flow authentication',
      },
      {
        type: 'feature',
        title: 'What\'s New in Updates',
        description: 'Update modal now shows release notes inline',
      },
    ],
    bugfixes: [
      {
        type: 'bugfix',
        title: 'GitHub Device Flow UI',
        description: 'Fixed GitHub Device Flow not updating UI after successful authentication',
      },
      {
        type: 'bugfix',
        title: 'Database Migration',
        description: 'Added migration for Supabase branching columns',
      },
    ],
  },
  // Add previous versions here for reference
  '0.2.11': {
    version: '0.2.11',
    date: '2025-10-20',
    features: [
      {
        type: 'feature',
        title: 'MCP Server Support',
        description: 'Added Model Context Protocol server integration',
      },
    ],
    bugfixes: [],
  },
};

/**
 * Get changelog for a specific version
 */
export function getChangelog(version: string): Changelog | null {
  // Remove 'v' prefix if present
  const cleanVersion = version.replace(/^v/, '');
  return changelogs[cleanVersion] || null;
}

/**
 * Get the latest changelog
 */
export function getLatestChangelog(): Changelog | null {
  const versions = Object.keys(changelogs).sort((a, b) => {
    // Simple version comparison - you might want to use a proper semver library
    return b.localeCompare(a);
  });
  
  return versions.length > 0 ? changelogs[versions[0]] : null;
}
