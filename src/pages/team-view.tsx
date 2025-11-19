import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import { 
  Users, Crown, Shield, Eye, Edit3, ArrowLeft, Save, Loader2, 
  Mail, AlertCircle, Folder, Activity, Home, Plus, ExternalLink, 
  Github, UserMinus, Trash2, Settings as SettingsIcon, Upload, 
  Download, GitBranch, Star, MessageSquare, Clock, FileText,
  Share2, Copy, Check, UserPlus, Archive, Palette, Code, Image
} from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TABS = [
  { id: 'feed', label: 'Feed', icon: Activity },
  { id: 'apps', label: 'Shared Apps', icon: Folder },
  { id: 'repos', label: 'GitHub Repos', icon: Github },
  { id: 'files', label: 'Files', icon: FileText },
  { id: 'members', label: 'Members', icon: Users },
  { id: 'roles', label: 'Roles', icon: Shield },
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
  const [activeTab, setActiveTab] = useState('feed');
  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [sharedApps, setSharedApps] = useState<any[]>([]);
  const [myRole, setMyRole] = useState<string>('');
  const [activities, setActivities] = useState<any[]>([]);
  const [githubRepos, setGithubRepos] = useState<any[]>([]);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isRepoDialogOpen, setIsRepoDialogOpen] = useState(false);
  const [shareType, setShareType] = useState<'file' | 'repo'>('file');
  const [repoUrl, setRepoUrl] = useState('');
  const [repoDescription, setRepoDescription] = useState('');
  const [sharing, setSharing] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [newPost, setNewPost] = useState('');
  const [posting, setPosting] = useState(false);

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

      // Fetch members with user profiles
      const { data: membersData, error: membersError } = await supabase
        .from('team_members')
        .select(`
          id,
          user_id,
          role,
          joined_at,
          user:profiles!team_members_user_id_fkey(email, first_name, last_name, username, avatar_url)
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

      // Fetch GitHub repos
      const { data: reposData } = await supabase
        .from('team_github_repos')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false });

      setGithubRepos(reposData || []);

      // Fetch activity feed with user profiles
      const { data: activityData } = await supabase
        .from('team_activity')
        .select(`
          *,
          user:profiles!team_activity_user_id_fkey(email, first_name, last_name, username)
        `)
        .eq('team_id', teamId)
        .order('created_at', { ascending: false })
        .limit(50);

      setActivities(activityData || []);

      // Fetch posts
      const { data: postsData } = await supabase
        .from('team_posts')
        .select(`
          *,
          user:profiles!team_posts_user_id_fkey(email, first_name, last_name, username, avatar_url)
        `)
        .eq('team_id', teamId)
        .order('created_at', { ascending: false });

      setPosts(postsData || []);

      // Fetch files
      const { data: filesData } = await supabase
        .from('team_files')
        .select(`
          *,
          user:profiles!team_files_user_id_fkey(email, first_name, last_name, username)
        `)
        .eq('team_id', teamId)
        .order('created_at', { ascending: false });

      setFiles(filesData || []);

      // Fetch roles
      const { data: rolesData } = await supabase
        .from('team_roles')
        .select('*')
        .eq('team_id', teamId);

      setRoles(rolesData || []);
    } catch (error) {
      console.error('Error fetching team:', error);
      toast.error('Failed to load team');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreatePost() {
    if (!newPost.trim()) return;

    setPosting(true);
    try {
      const { error } = await supabase
        .from('team_posts')
        .insert({
          team_id: teamId,
          user_id: settings?.natiUser?.id,
          content: newPost,
        });

      if (error) throw error;

      // Log activity
      await supabase.from('team_activity').insert({
        team_id: teamId,
        user_id: settings?.natiUser?.id,
        action: 'created_post',
        details: { content: newPost.substring(0, 50) },
      });

      toast.success('Post created!');
      setNewPost('');
      fetchTeamData();
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
    } finally {
      setPosting(false);
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

  async function handleShareRepo() {
    if (!repoUrl.trim()) return;
    
    setSharing(true);
    try {
      // Parse GitHub URL
      const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
      if (!match) {
        toast.error('Invalid GitHub URL');
        return;
      }

      const [, owner, repo] = match;
      const repoFullName = `${owner}/${repo.replace('.git', '')}`;

      // Save to database
      const { error } = await supabase
        .from('team_github_repos')
        .insert({
          team_id: teamId,
          repo_url: repoUrl,
          repo_name: repoFullName,
          description: repoDescription,
          shared_by: settings?.natiUser?.id,
        });

      if (error) throw error;

      // Log activity
      await supabase.from('team_activity').insert({
        team_id: teamId,
        user_id: settings?.natiUser?.id,
        action: 'shared_repo',
        details: { repo: repoFullName },
      });

      toast.success('Repository shared successfully!');
      setIsRepoDialogOpen(false);
      setRepoUrl('');
      setRepoDescription('');
      fetchTeamData();
    } catch (error) {
      console.error('Error sharing repo:', error);
      toast.error('Failed to share repository');
    } finally {
      setSharing(false);
    }
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="p-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold">{team.name}</h1>
              <div className="flex items-center gap-2 px-3 py-1 rounded-lg border bg-muted/50">
                <RoleIcon className={`h-4 w-4 ${roleConfig.color}`} />
                <span className="text-sm font-medium capitalize">{myRole}</span>
              </div>
            </div>
            {team.description && (
              <p className="text-sm opacity-70 mt-1">{team.description}</p>
            )}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {members.length} {members.length === 1 ? 'member' : 'members'}
              </span>
              <span className="flex items-center gap-1">
                <Folder className="h-3.5 w-3.5" />
                {sharedApps.length} {sharedApps.length === 1 ? 'app' : 'apps'}
              </span>
              <span className="flex items-center gap-1">
                <Github className="h-3.5 w-3.5" />
                {githubRepos.length} {githubRepos.length === 1 ? 'repo' : 'repos'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsRepoDialogOpen(true)}
              size="sm"
              variant="outline"
            >
              <Github className="h-4 w-4 mr-2" />
              Share Repo
            </Button>
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
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted text-muted-foreground hover:text-foreground'
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
      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-6">
          {activeTab === 'feed' && (
            <FeedTab 
              posts={posts} 
              activities={activities} 
              members={members} 
              newPost={newPost}
              setNewPost={setNewPost}
              handleCreatePost={handleCreatePost}
              posting={posting}
            />
          )}
          {activeTab === 'members' && (
            <MembersTab members={members} canManage={canManage} />
          )}
          {activeTab === 'apps' && (
            <AppsTab sharedApps={sharedApps} teamId={teamId} />
          )}
          {activeTab === 'repos' && (
            <ReposTab githubRepos={githubRepos} />
          )}
          {activeTab === 'files' && (
            <FilesTab files={files} teamId={teamId} />
          )}
          {activeTab === 'roles' && (
            <RolesTab roles={roles} canManage={canManage} teamId={teamId} />
          )}
          {activeTab === 'settings' && (
            <SettingsTab team={team} canManage={canManage} />
          )}
        </div>
      </div>

      {/* Share Repo Dialog */}
      <Dialog open={isRepoDialogOpen} onOpenChange={setIsRepoDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Github className="h-5 w-5" />
              Share GitHub Repository
            </DialogTitle>
            <DialogDescription>
              Share a GitHub repository with your team members
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="repo-url">Repository URL</Label>
              <Input
                id="repo-url"
                placeholder="https://github.com/username/repo"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="repo-description">Description (optional)</Label>
              <Textarea
                id="repo-description"
                placeholder="What is this repository about?"
                value={repoDescription}
                onChange={(e) => setRepoDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRepoDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleShareRepo}
              disabled={sharing || !repoUrl.trim()}
            >
              {sharing ? 'Sharing...' : 'Share Repository'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Feed Tab
function FeedTab({ posts, activities, members, newPost, setNewPost, handleCreatePost, posting }: any) {
  const getUserName = (user: any) => {
    if (!user) return 'Someone';
    if (user.first_name || user.last_name) {
      return [user.first_name, user.last_name].filter(Boolean).join(' ');
    }
    if (user.username) return user.username;
    if (user.email) return user.email.split('@')[0];
    return 'Someone';
  };

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'shared_repo': return <Github className="h-4 w-4" />;
      case 'shared_app': return <Folder className="h-4 w-4" />;
      case 'member_joined': return <UserPlus className="h-4 w-4" />;
      case 'member_left': return <UserMinus className="h-4 w-4" />;
      case 'created_post': return <MessageSquare className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityText = (activity: any) => {
    // Get user name from the joined profile data
    const user = activity.user;
    let userName = 'Someone';
    
    if (user) {
      // Try to build a full name
      if (user.first_name || user.last_name) {
        userName = [user.first_name, user.last_name].filter(Boolean).join(' ');
      } else if (user.username) {
        userName = user.username;
      } else if (user.email) {
        userName = user.email.split('@')[0];
      }
    }
    
    switch (activity.action) {
      case 'shared_repo':
        return `${userName} shared repository ${activity.details?.repo}`;
      case 'shared_app':
        return `${userName} shared app ${activity.details?.app}`;
      case 'member_joined':
        return `${userName} joined the team`;
      case 'member_left':
        return `${userName} left the team`;
      default:
        return `${userName} performed an action`;
    }
  };

  return (
    <div className="space-y-4">
      {/* Post Creation */}
      <div className="p-4 rounded-xl border bg-card">
        <Textarea
          placeholder="Share an update with your team..."
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
          rows={3}
          className="resize-none mb-3"
        />
        <div className="flex justify-end">
          <Button onClick={handleCreatePost} disabled={posting || !newPost.trim()}>
            {posting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Posting...
              </>
            ) : (
              <>
                <MessageSquare className="h-4 w-4 mr-2" />
                Post
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Posts */}
      {posts.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold">Recent Posts</h3>
          {posts.map((post: any) => (
            <div key={post.id} className="p-4 rounded-xl border bg-card">
              <div className="flex items-start gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                  {getUserName(post.user).charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">{getUserName(post.user)}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(post.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              <p className="text-sm whitespace-pre-wrap">{post.content}</p>
            </div>
          ))}
        </div>
      )}

      {/* Activity Feed */}
      <div className="space-y-3">
        <h3 className="font-semibold">Team Activity</h3>
        {activities.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-xl">
            <Activity className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
            <h3 className="font-semibold mb-1">No activity yet</h3>
            <p className="text-sm text-muted-foreground">
              Team actions will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {activities.map((activity: any) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 rounded-lg border bg-card/50 hover:bg-accent/50 transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                  {getActivityIcon(activity.action)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{getActivityText(activity)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(activity.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Members Tab
function MembersTab({ members, canManage }: any) {
  const [changingRole, setChangingRole] = useState<string | null>(null);

  const getUserName = (member: any) => {
    const user = member.user;
    if (!user) return member.user_id?.substring(0, 8) || 'Unknown';
    if (user.first_name || user.last_name) {
      return [user.first_name, user.last_name].filter(Boolean).join(' ');
    }
    if (user.username) return user.username;
    if (user.email) return user.email.split('@')[0];
    return member.user_id?.substring(0, 8) || 'Unknown';
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    setChangingRole(memberId);
    try {

      const { error } = await supabase
        .from('team_members')
        .update({ role: newRole })
        .eq('id', memberId);

      if (error) throw error;

      toast.success('Role updated successfully!');
      window.location.reload();
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update role');
    } finally {
      setChangingRole(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Team Members ({members.length})</h2>
      </div>

      <div className="grid gap-3">
        {members.map((member: any) => {
          const roleConfig = getRoleConfig(member.role);
          const RoleIcon = roleConfig.icon;
          const userName = getUserName(member);
          return (
            <div
              key={member.id}
              className="flex items-center justify-between p-5 rounded-xl border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold">{userName}</p>
                  {member.user?.email && (
                    <p className="text-xs text-muted-foreground">{member.user.email}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Joined {new Date(member.joined_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {canManage && member.role !== 'owner' ? (
                <Select
                  value={member.role}
                  onValueChange={(value) => handleRoleChange(member.id, value)}
                  disabled={changingRole === member.id}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Admin
                      </div>
                    </SelectItem>
                    <SelectItem value="editor">
                      <div className="flex items-center gap-2">
                        <Edit3 className="h-4 w-4" />
                        Editor
                      </div>
                    </SelectItem>
                    <SelectItem value="viewer">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        Viewer
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1 rounded-lg border bg-muted/50">
                  <RoleIcon className={`h-4 w-4 ${roleConfig.color}`} />
                  <span className="text-sm font-medium capitalize">{member.role}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Apps Tab
function AppsTab({ sharedApps, teamId }: any) {
  const [cloningApp, setCloningApp] = useState<string | null>(null);

  const cloneAppToMyApps = async (app: any) => {
    if (!app.github_repo) {
      toast.error('This app is not connected to a GitHub repository');
      return;
    }

    setCloningApp(app.id);
    try {
      const IpcClient = (await import('@/ipc/ipc_client')).IpcClient;
      const ipcClient = IpcClient.getInstance();
      
      // Import the GitHub repo as a new app
      const result = await ipcClient.importGithubRepo({
        githubUrl: `https://github.com/${app.github_repo}`,
        appName: app.name,
      });

      if (result.appId) {
        toast.success(`Successfully cloned ${app.name} to your apps!`);
      }
    } catch (error: any) {
      console.error('Error cloning app:', error);
      toast.error(error.message || 'Failed to clone app');
    } finally {
      setCloningApp(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Shared Apps ({sharedApps.length})</h2>
        <Button size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Share App
        </Button>
      </div>

      {sharedApps.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-xl">
          <Folder className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
          <h3 className="font-semibold mb-1">No apps shared yet</h3>
          <p className="text-sm text-muted-foreground">
            Share apps from your apps list to collaborate with your team
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {sharedApps.map((app: any) => (
            <div
              key={app.id}
              className="p-5 rounded-xl border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                      {app.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{app.name}</h3>
                      <p className="text-xs text-muted-foreground truncate">{app.path}</p>
                    </div>
                  </div>
                  {app.github_repo && (
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <button
                        onClick={() => cloneAppToMyApps(app)}
                        disabled={cloningApp === app.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {cloningApp === app.id ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Cloning...
                          </>
                        ) : (
                          <>
                            <Download className="h-3.5 w-3.5" />
                            Clone to My Apps
                          </>
                        )}
                      </button>
                      <a
                        href={`https://github.com/${app.github_repo}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-background hover:bg-accent text-xs font-medium transition-colors"
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
                        <GitBranch className="h-3.5 w-3.5" />
                        Fork on GitHub
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

// Repos Tab
function ReposTab({ githubRepos }: any) {
  const [copiedRepo, setCopiedRepo] = useState<string | null>(null);
  const [cloningRepo, setCloningRepo] = useState<string | null>(null);

  const copyCloneCommand = (repoName: string) => {
    const command = `git clone https://github.com/${repoName}.git`;
    navigator.clipboard.writeText(command);
    setCopiedRepo(repoName);
    toast.success('Clone command copied!');
    setTimeout(() => setCopiedRepo(null), 2000);
  };

  const cloneToMyApps = async (repo: any) => {
    setCloningRepo(repo.id);
    try {
      const IpcClient = (await import('@/ipc/ipc_client')).IpcClient;
      const ipcClient = IpcClient.getInstance();
      
      // Import the GitHub repo as a new app
      const result = await ipcClient.importGithubRepo({
        githubUrl: repo.repo_url,
        appName: repo.repo_name.split('/')[1], // Use repo name as app name
      });

      // Result contains appId and chatId on success
      if (result.appId) {
        toast.success(`Successfully cloned ${repo.repo_name} to your apps!`);
        // Optionally navigate to the new app
        // navigate({ to: '/', search: { appId: result.appId } });
      }
    } catch (error: any) {
      console.error('Error cloning repo:', error);
      toast.error(error.message || 'Failed to clone repository');
    } finally {
      setCloningRepo(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">GitHub Repositories ({githubRepos.length})</h2>
      </div>

      {githubRepos.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-xl">
          <Github className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
          <h3 className="font-semibold mb-1">No repositories shared yet</h3>
          <p className="text-sm text-muted-foreground">
            Share GitHub repositories with your team to collaborate
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {githubRepos.map((repo: any) => (
            <div
              key={repo.id}
              className="p-5 rounded-xl border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white flex-shrink-0">
                  <Github className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg mb-1">{repo.repo_name}</h3>
                  {repo.description && (
                    <p className="text-sm text-muted-foreground mb-3">{repo.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => cloneToMyApps(repo)}
                      disabled={cloningRepo === repo.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {cloningRepo === repo.id ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Cloning...
                        </>
                      ) : (
                        <>
                          <Download className="h-3.5 w-3.5" />
                          Clone to My Apps
                        </>
                      )}
                    </button>
                    <a
                      href={repo.repo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-background hover:bg-accent text-xs font-medium transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      View on GitHub
                    </a>
                    <a
                      href={`${repo.repo_url}/fork`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-medium transition-colors"
                    >
                      <GitBranch className="h-3.5 w-3.5" />
                      Fork on GitHub
                    </a>
                    <button
                      onClick={() => copyCloneCommand(repo.repo_name)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-xs font-medium transition-colors"
                    >
                      {copiedRepo === repo.repo_name ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          Copy Clone Command
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Shared {new Date(repo.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Files Tab
function FilesTab({ files, teamId }: any) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { settings } = useSettings();
  const userId = settings?.natiUser?.id;

  const ALLOWED_EXTENSIONS = [
    // Archives
    '.zip', '.rar', '.7z', '.tar', '.gz',
    // Design files
    '.psd', '.ai', '.sketch', '.fig', '.xd', '.svg',
    // Programming files
    '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.h',
    '.css', '.scss', '.html', '.json', '.xml', '.yaml', '.yml',
    '.md', '.txt', '.sh', '.bat', '.sql', '.go', '.rs', '.php',
    // Documents
    '.pdf', '.doc', '.docx',
    // Images
    '.png', '.jpg', '.jpeg', '.gif', '.webp'
  ];

  const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = async (fileList: FileList) => {
    const file = fileList[0];
    
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`File size must be less than 20MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      return;
    }

    // Check file extension
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      toast.error(`File type ${ext} is not allowed. Please upload design, programming, or archive files.`);
      return;
    }

    setUploading(true);
    try {

      // Upload file to Supabase Storage
      const filePath = `${teamId}/${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('team-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('team-files')
        .getPublicUrl(filePath);

      // Save file metadata to database
      const { error: dbError } = await supabase
        .from('team_files')
        .insert({
          team_id: teamId,
          user_id: userId,
          file_name: file.name,
          file_path: publicUrl,
          file_size: file.size,
          file_type: file.type || ext,
        });

      if (dbError) throw dbError;

      toast.success(`File ${file.name} uploaded successfully!`);
      
      // Reload files
      window.location.reload();
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast.error(error.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Shared Files ({files.length})</h2>
      </div>

      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          dragActive 
            ? 'border-primary bg-primary/5' 
            : 'border-border hover:border-primary/50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleChange}
          accept={ALLOWED_EXTENSIONS.join(',')}
        />
        
        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="font-semibold mb-2">Drop files here or click to upload</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Max file size: 20MB
        </p>
        <div className="flex flex-wrap justify-center gap-2 mb-4">
          <span className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground">
            Archives (.zip, .rar)
          </span>
          <span className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground">
            Design (.psd, .ai, .fig)
          </span>
          <span className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground">
            Code (.js, .py, .ts)
          </span>
          <span className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground">
            Docs (.pdf, .md)
          </span>
        </div>
        <Button 
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          size="sm"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Select File
            </>
          )}
        </Button>
      </div>

      {files.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-xl">
          <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
          <h3 className="font-semibold mb-1">No files shared yet</h3>
          <p className="text-sm text-muted-foreground">
            Upload files to share with your team
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {files.map((file: any) => {
            const fileName = file.file_name || '';
            const ext = fileName.split('.').pop()?.toLowerCase() || '';
            let icon = FileText;
            let iconColor = 'from-gray-500 to-gray-600';
            
            // Determine icon based on file type
            if (ext && ['.zip', '.rar', '.7z', '.tar', '.gz'].includes('.' + ext)) {
              icon = Archive;
              iconColor = 'from-orange-500 to-red-600';
            } else if (ext && ['.psd', '.ai', '.sketch', '.fig', '.xd', '.svg'].includes('.' + ext)) {
              icon = Palette;
              iconColor = 'from-purple-500 to-pink-600';
            } else if (ext && ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.h', '.css', '.scss', '.html', '.json', '.xml', '.yaml', '.yml', '.md', '.sh', '.bat', '.sql', '.go', '.rs', '.php'].includes('.' + ext)) {
              icon = Code;
              iconColor = 'from-blue-500 to-indigo-600';
            } else if (ext && ['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes('.' + ext)) {
              icon = Image;
              iconColor = 'from-green-500 to-emerald-600';
            } else if (ext && ['.pdf', '.doc', '.docx'].includes('.' + ext)) {
              icon = FileText;
              iconColor = 'from-red-500 to-orange-600';
            }
            
            const Icon = icon;
            
            return (
              <div
                key={file.id}
                className="flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${iconColor} flex items-center justify-center text-white flex-shrink-0`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{fileName || 'Unnamed file'}</h3>
                    <p className="text-xs text-muted-foreground">
                      {file.file_size ? `${(file.file_size / 1024).toFixed(2)} KB` : 'Unknown size'} • 
                      Uploaded {file.created_at ? new Date(file.created_at).toLocaleDateString() : 'Unknown date'}
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Roles Tab
function RolesTab({ roles, canManage, teamId }: any) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [roleName, setRoleName] = useState('');
  const [roleColor, setRoleColor] = useState('#6366f1');
  const [permissions, setPermissions] = useState({
    can_post: true,
    can_share_files: true,
    can_share_apps: true,
    can_share_repos: true,
  });
  const [saving, setSaving] = useState(false);

  const handleCreateRole = async () => {
    if (!roleName.trim()) {
      toast.error('Role name is required');
      return;
    }

    setSaving(true);
    try {

      const { error } = await supabase
        .from('team_roles')
        .insert({
          team_id: teamId,
          name: roleName,
          color: roleColor,
          permissions: permissions,
        });

      if (error) throw error;

      toast.success('Role created successfully!');
      setIsCreateDialogOpen(false);
      setRoleName('');
      setRoleColor('#6366f1');
      setPermissions({
        can_post: true,
        can_share_files: true,
        can_share_apps: true,
        can_share_repos: true,
      });
      window.location.reload();
    } catch (error) {
      console.error('Error creating role:', error);
      toast.error('Failed to create role');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Team Roles ({roles.length})</h2>
          {canManage && (
            <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Role
            </Button>
          )}
        </div>

      {roles.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-xl">
          <Shield className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
          <h3 className="font-semibold mb-1">No custom roles yet</h3>
          <p className="text-sm text-muted-foreground">
            Create custom roles to organize your team
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {roles.map((role: any) => (
            <div
              key={role.id}
              className="p-5 rounded-xl border bg-card"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div 
                    className="h-10 w-10 rounded-lg flex items-center justify-center text-white"
                    style={{ backgroundColor: role.color || '#6366f1' }}
                  >
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{role.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {Object.keys(role.permissions || {}).length} permissions
                    </p>
                  </div>
                </div>
                {canManage && (
                  <Button size="sm" variant="ghost">
                    <Edit3 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(role.permissions || {}).map(([key, value]: any) => (
                  value && (
                    <span
                      key={key}
                      className="px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium"
                    >
                      {key.replace(/_/g, ' ').replace('can ', '')}
                    </span>
                  )
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      </div>

      {/* Create Role Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Custom Role</DialogTitle>
            <DialogDescription>
              Create a custom role with specific permissions for your team
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="role-name">Role Name</Label>
              <Input
                id="role-name"
                placeholder="e.g., Developer, Designer"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role-color">Role Color</Label>
              <div className="flex gap-2">
                <Input
                  id="role-color"
                  type="color"
                  value={roleColor}
                  onChange={(e) => setRoleColor(e.target.value)}
                  className="w-20 h-10"
                />
                <Input
                  value={roleColor}
                  onChange={(e) => setRoleColor(e.target.value)}
                  placeholder="#6366f1"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="space-y-2">
                {Object.entries(permissions).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={key}
                      checked={value}
                      onChange={(e) => setPermissions({ ...permissions, [key]: e.target.checked })}
                      className="rounded"
                    />
                    <label htmlFor={key} className="text-sm cursor-pointer">
                      {key.replace(/_/g, ' ').replace('can ', 'Can ')}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateRole} disabled={saving || !roleName.trim()}>
              {saving ? 'Creating...' : 'Create Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Settings Tab
function SettingsTab({ team, canManage }: any) {
  const [teamName, setTeamName] = useState(team.name);
  const [description, setDescription] = useState(team.description || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      // TODO: Implement save functionality
      toast.success('Settings saved successfully!');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-xl border bg-card">
        <h2 className="text-lg font-semibold mb-4">General Settings</h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="team-name" className="text-sm font-semibold mb-2">Team Name</Label>
            <Input
              id="team-name"
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              disabled={!canManage}
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="description" className="text-sm font-semibold mb-2">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={!canManage}
              rows={3}
              className="mt-2 resize-none"
            />
          </div>
          {canManage && (
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          )}
        </div>
      </div>

      {canManage && (
        <div className="p-6 rounded-xl border border-red-500/20 bg-red-500/5">
          <h2 className="text-lg font-semibold mb-2 text-red-600 dark:text-red-400">Danger Zone</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Permanently delete this team and all associated data. This action cannot be undone.
          </p>
          <Button variant="destructive" size="sm">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Team
          </Button>
        </div>
      )}
    </div>
  );
}
