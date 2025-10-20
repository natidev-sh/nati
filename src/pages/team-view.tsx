import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import { 
  Users, Crown, Shield, Eye, Edit3, ArrowLeft, Save, Loader2, 
  Mail, AlertCircle, Folder, Activity, Home, Plus, ExternalLink, 
  Github, UserMinus, Trash2, Settings as SettingsIcon
} from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import { Button } from "@/components/ui/button";
import { createClient } from '@supabase/supabase-js';
import { toast } from "sonner";

const TABS = [
  { id: 'overview', label: 'Overview', icon: Home },
  { id: 'members', label: 'Members', icon: Users },
  { id: 'apps', label: 'Shared Apps', icon: Folder },
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

const getRoleConfig = (role: string) => {
  const configs: Record<string, any> = {
    owner: { icon: Crown, color: 'text-yellow-500', label: 'Owner' },
    admin: { icon: Shield, color: 'text-blue-500', label: 'Admin' },
    editor: { icon: Edit3, color: 'text-green-500', label: 'Editor' },
    viewer: { icon: Eye, color: 'text-gray-500', label: 'Viewer' },
  };
  return configs[role] || configs.viewer;
};

export default function TeamViewPage() {
  const { teamId } = useParams({ from: '/teams/$teamId' });
  const navigate = useNavigate();
  const { settings } = useSettings();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [sharedApps, setSharedApps] = useState<any[]>([]);
  const [myRole, setMyRole] = useState<string>('');

  const SUPABASE_URL = 'https://cvsqiyjfqvdptjnxefbk.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2c3FpeWpmcXZkcHRqbnhlZmJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwNDU5NTYsImV4cCI6MjA3NTYyMTk1Nn0.uc-wEsnkKtZjscmmJUIJ64qZJXGHQpp8cYwjEhWBivo';
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  useEffect(() => {
    async function initSession() {
      if (settings?.natiUser?.accessToken?.value) {
        try {
          await supabase.auth.setSession({
            access_token: settings.natiUser.accessToken.value,
            refresh_token: settings.natiUser.refreshToken?.value || '',
          });
        } catch (error) {
          console.warn('Failed to set session:', error);
        }
      }
      fetchTeamData();
    }
    initSession();
  }, [teamId, settings?.natiUser]);

  async function fetchTeamData() {
    setLoading(true);
    try {
      // Fetch team
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select('*')
        .eq('id', teamId)
        .single();

      if (teamError) throw teamError;
      setTeam(teamData);

      // Fetch members
      const { data: membersData, error: membersError } = await supabase
        .from('team_members')
        .select(`
          id,
          user_id,
          role,
          joined_at
        `)
        .eq('team_id', teamId)
        .eq('is_active', true);

      if (membersError) throw membersError;
      setMembers(membersData || []);

      // Find my role
      const userId = settings?.natiUser?.id;
      const me = membersData?.find((m: any) => m.user_id === userId);
      setMyRole(me?.role || '');

      // Fetch shared apps
      const { data: appsData } = await supabase
        .from('team_apps')
        .select(`
          shared_by,
          shared_at,
          user_apps!inner(id, name, path, github_repo)
        `)
        .eq('team_id', teamId);

      setSharedApps((appsData || []).map((item: any) => ({
        id: item.user_apps.id,
        name: item.user_apps.name,
        path: item.user_apps.path,
        github_repo: item.user_apps.github_repo,
        shared_by: item.shared_by,
        shared_at: item.shared_at,
      })));
    } catch (error) {
      console.error('Error fetching team:', error);
      toast.error('Failed to load team');
    } finally {
      setLoading(false);
    }
  }

  const canManage = myRole === 'owner' || myRole === 'admin';
  const roleConfig = getRoleConfig(myRole);
  const RoleIcon = roleConfig?.icon || Eye;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Team Not Found</h2>
          <Button onClick={() => navigate({ to: '/teams' })}>
            Back to Teams
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col glass-panel">
      {/* Header */}
      <div className="p-6 border-b glass-border">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate({ to: '/teams' })}
            className="glass-surface glass-hover"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold glass-contrast-text">{team.name}</h1>
              <div className="flex items-center gap-2 px-3 py-1 rounded-lg glass-surface">
                <RoleIcon className={`h-4 w-4 ${roleConfig.color}`} />
                <span className="text-sm font-medium capitalize">{myRole}</span>
              </div>
            </div>
            {team.description && (
              <p className="text-sm opacity-70 mt-1">{team.description}</p>
            )}
            <div className="flex items-center gap-4 mt-2 text-xs opacity-70">
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {members.length} {members.length === 1 ? 'member' : 'members'}
              </span>
              <span className="flex items-center gap-1">
                <Folder className="h-3.5 w-3.5" />
                {sharedApps.length} {sharedApps.length === 1 ? 'app' : 'apps'}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                  isActive
                    ? 'glass-surface text-primary glass-border border'
                    : 'hover:glass-surface opacity-70 hover:opacity-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'overview' && (
          <OverviewTab team={team} members={members} sharedApps={sharedApps} myRole={myRole} roleConfig={roleConfig} />
        )}
        {activeTab === 'members' && (
          <MembersTab members={members} canManage={canManage} />
        )}
        {activeTab === 'apps' && (
          <AppsTab sharedApps={sharedApps} />
        )}
        {activeTab === 'activity' && (
          <ActivityTab teamId={teamId} />
        )}
        {activeTab === 'settings' && (
          <SettingsTab team={team} canManage={canManage} />
        )}
      </div>
    </div>
  );
}

// Overview Tab
function OverviewTab({ team, members, sharedApps, myRole, roleConfig }: any) {
  const RoleIcon = roleConfig?.icon || Eye;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Stats */}
      <div className="p-6 rounded-xl glass-surface border glass-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-12 w-12 rounded-xl bg-blue-500 flex items-center justify-center">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold">{members.length}</p>
            <p className="text-sm opacity-70">Team Members</p>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-xl glass-surface border glass-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-12 w-12 rounded-xl bg-green-500 flex items-center justify-center">
            <Folder className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold">{sharedApps.length}</p>
            <p className="text-sm opacity-70">Shared Apps</p>
          </div>
        </div>
      </div>

      {/* Your Role */}
      <div className="p-6 rounded-xl glass-surface border glass-border md:col-span-2">
        <h3 className="font-semibold mb-4">Your Role</h3>
        <div className="flex items-start gap-4">
          <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center`}>
            <RoleIcon className="h-8 w-8 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-lg mb-1">{roleConfig?.label}</h4>
            <p className="text-sm opacity-70">You have {myRole} access to this team</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Members Tab
function MembersTab({ members, canManage }: any) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Team Members ({members.length})</h2>
      </div>

      <div className="grid gap-3">
        {members.map((member: any) => {
          const roleConfig = getRoleConfig(member.role);
          const RoleIcon = roleConfig.icon;
          return (
            <div
              key={member.id}
              className="flex items-center justify-between p-5 rounded-xl glass-surface border glass-border glass-hover transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
                  {member.user_id.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold">{member.user_id}</p>
                  <p className="text-xs opacity-70">
                    Joined {new Date(member.joined_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 px-3 py-1 rounded-lg glass-surface">
                <RoleIcon className={`h-4 w-4 ${roleConfig.color}`} />
                <span className="text-sm font-medium capitalize">{member.role}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Apps Tab
function AppsTab({ sharedApps }: any) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Shared Apps ({sharedApps.length})</h2>
      </div>

      {sharedApps.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-xl glass-border">
          <Folder className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <h3 className="font-semibold mb-1">No apps shared yet</h3>
          <p className="text-sm opacity-70">
            Share apps from your apps list to collaborate with your team
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {sharedApps.map((app: any) => (
            <div
              key={app.id}
              className="p-5 rounded-xl glass-surface border glass-border glass-hover transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                      {app.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold">{app.name}</h3>
                      <p className="text-xs opacity-70">{app.path}</p>
                    </div>
                  </div>
                  {app.github_repo && (
                    <div className="flex items-center gap-2 mt-3">
                      <a
                        href={`https://github.com/${app.github_repo}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-surface glass-hover text-xs font-medium transition-colors"
                      >
                        <Github className="h-3.5 w-3.5" />
                        View Repo
                      </a>
                      <a
                        href={`https://github.com/${app.github_repo}/fork`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-medium transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Fork Repo
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Activity Tab
function ActivityTab({ teamId }: any) {
  return (
    <div className="space-y-4">
      <div className="text-center py-12 border-2 border-dashed rounded-xl glass-border">
        <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <h3 className="font-semibold mb-1">Activity Feed Coming Soon</h3>
        <p className="text-sm opacity-70">
          Track team actions, app sharing, and member activity
        </p>
      </div>
    </div>
  );
}

// Settings Tab
function SettingsTab({ team, canManage }: any) {
  const [teamName, setTeamName] = useState(team.name);
  const [description, setDescription] = useState(team.description || '');

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-xl glass-surface border glass-border">
        <h2 className="text-lg font-semibold mb-4">General Settings</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold mb-2 block">Team Name</label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              disabled={!canManage}
              className="w-full px-4 py-3 rounded-xl glass-surface border glass-border disabled:opacity-50"
            />
          </div>
          <div>
            <label className="text-sm font-semibold mb-2 block">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={!canManage}
              rows={3}
              className="w-full px-4 py-3 rounded-xl glass-surface border glass-border disabled:opacity-50 resize-none"
            />
          </div>
          {canManage && (
            <Button className="glass-surface glass-hover">
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
