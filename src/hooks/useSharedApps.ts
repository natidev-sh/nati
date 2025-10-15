import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useSettings } from './useSettings';

const SUPABASE_URL = 'https://cvsqiyjfqvdptjnxefbk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2c3FpeWpmcXZkcHRqbnhlZmJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwNDU5NTYsImV4cCI6MjA3NTYyMTk1Nn0.uc-wEsnkKtZjscmmJUIJ64qZJXGHQpp8cYwjEhWBivo';

export interface SharedApp {
  id: string;
  name: string;
  path: string;
  desktop_app_id: string;
  shared_by_user_id: string;
  shared_at: string;
  team_id: string;
  team_name: string;
}

export function useSharedApps() {
  const { settings } = useSettings();
  const [sharedApps, setSharedApps] = useState<SharedApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSharedApps();
  }, [settings?.natiUser?.id]);

  async function fetchSharedApps() {
    if (!settings?.natiUser?.id || !settings?.natiUser?.accessToken?.value) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

      // Set auth session
      await supabase.auth.setSession({
        access_token: settings.natiUser.accessToken.value,
        refresh_token: settings.natiUser.refreshToken?.value || '',
      });

      // Get teams the user is a member of
      const { data: teamMemberships, error: teamError } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', settings.natiUser.id)
        .eq('is_active', true);

      if (teamError) throw teamError;

      if (!teamMemberships || teamMemberships.length === 0) {
        setSharedApps([]);
        setLoading(false);
        return;
      }

      const teamIds = teamMemberships.map(tm => tm.team_id);

      // Get shared apps from those teams
      const { data: sharedData, error: sharedError } = await supabase
        .from('team_apps')
        .select(`
          team_id,
          shared_at,
          shared_by,
          user_apps!inner(
            id,
            name,
            path,
            desktop_app_id,
            user_id
          ),
          teams!inner(name)
        `)
        .in('team_id', teamIds);

      if (sharedError) throw sharedError;

      // Transform the data
      const apps: SharedApp[] = (sharedData || []).map((item: any) => ({
        id: item.user_apps.id,
        name: item.user_apps.name,
        path: item.user_apps.path,
        desktop_app_id: item.user_apps.desktop_app_id,
        shared_by_user_id: item.shared_by,
        shared_at: item.shared_at,
        team_id: item.team_id,
        team_name: item.teams.name,
      }));

      setSharedApps(apps);
      setError(null);
    } catch (err) {
      console.error('Error fetching shared apps:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch shared apps');
      setSharedApps([]);
    } finally {
      setLoading(false);
    }
  }

  return { sharedApps, loading, error, refetch: fetchSharedApps };
}
