import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Users, Crown, Shield, Eye, Settings as SettingsIcon, Plus, Mail, UserPlus, Check, Copy, Github, ExternalLink, Folder } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from '@supabase/supabase-js';
import { toast } from "sonner";
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

// Placeholder for Supabase integration
const TEAMS_ENABLED = false; // Will be true when user is logged in with Pro

interface Team {
  id: string;
  name: string;
  myRole: string;
  members?: any[];
  apps?: number;
  keys?: number;
}

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  user?: {
    email: string;
  };
}

interface SharedApp {
  id: string;
  name: string;
  path: string;
  github_repo?: string;
  shared_by: string;
  shared_at: string;
}

export default function TeamsPage() {
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("editor");
  const [inviteLink, setInviteLink] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [sharedApps, setSharedApps] = useState<SharedApp[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);

  const isPro = settings?.natiUser?.isPro || false;
  const isAdmin = settings?.natiUser?.isAdmin || false;
  
  const SUPABASE_URL = 'https://cvsqiyjfqvdptjnxefbk.supabase.co'
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2c3FpeWpmcXZkcHRqbnhlZmJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwNDU5NTYsImV4cCI6MjA3NTYyMTk1Nn0.uc-wEsnkKtZjscmmJUIJ64qZJXGHQpp8cYwjEhWBivo'
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [inviting, setInviting] = useState(false)
  
  const canManageTeam = selectedTeam?.myRole === 'owner' || selectedTeam?.myRole === 'admin'
  
  // Initialize Supabase session
  useEffect(() => {
    async function initSession() {
      if (settings?.natiUser?.accessToken?.value) {
        await supabase.auth.setSession({
          access_token: settings.natiUser.accessToken.value,
          refresh_token: settings.natiUser.refreshToken?.value || '',
        })
      }
    }
    initSession()
  }, [settings?.natiUser])
  
  // Fetch team members when team is selected
  useEffect(() => {
    async function fetchMembers() {
      if (!selectedTeam) return
      
      try {
        const { data, error } = await supabase
          .from('team_members')
          .select(`
            id,
            user_id,
            role,
            user:profiles!team_members_user_id_fkey(email)
          `)
          .eq('team_id', selectedTeam.id)
          .eq('is_active', true)

        if (error) {
          console.error('Error fetching members:', error)
          return
        }
        
        // Transform the data to match our interface
        const transformedData = data?.map((member: any) => ({
          id: member.id,
          user_id: member.user_id,
          role: member.role,
          user: Array.isArray(member.user) ? member.user[0] : member.user
        })) || []
        
        setTeamMembers(transformedData)
      } catch (error) {
        console.error('Error loading members:', error)
      }
    }
    
    fetchMembers()
  }, [selectedTeam])
  
  // Fetch shared apps when team is selected
  useEffect(() => {
    async function fetchSharedApps() {
      if (!selectedTeam) return
      
      setLoadingApps(true)
      try {
        const { data, error } = await supabase
          .from('team_apps')
          .select(`
            shared_by,
            shared_at,
            user_apps!inner(id, name, path, github_repo)
          `)
          .eq('team_id', selectedTeam.id)
        
        if (error) throw error
        
        const apps: SharedApp[] = (data || []).map((item: any) => ({
          id: item.user_apps.id,
          name: item.user_apps.name,
          path: item.user_apps.path,
          github_repo: item.user_apps.github_repo,
          shared_by: item.shared_by,
          shared_at: item.shared_at
        }))
        
        setSharedApps(apps)
      } catch (error) {
        console.error('Error loading shared apps:', error)
      } finally {
        setLoadingApps(false)
      }
    }
    
    fetchSharedApps()
  }, [selectedTeam])
  
  // Fetch teams
  useEffect(() => {
    async function loadTeams() {
      if (!settings?.natiUser?.id) return
      
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('team_members')
          .select(`
            *,
            team:teams(*)
          `)
          .eq('user_id', settings.natiUser.id)
          .eq('is_active', true)

        if (error) {
          console.error('Error fetching teams:', error)
          return
        }
        
        const teamsData = data?.map((m: any) => ({
          ...m.team,
          myRole: m.role
        })) || []
        
        setTeams(teamsData)
        if (teamsData.length > 0 && !selectedTeam) {
          setSelectedTeam(teamsData[0])
        }
      } catch (error) {
        console.error('Error loading teams:', error)
      } finally {
        setLoading(false)
      }
    }
    
    if (isPro || isAdmin) {
      loadTeams()
    }
  }, [settings?.natiUser, isPro, isAdmin])
  
  async function handleCreateTeam() {
    if (!newTeamName.trim() || !settings?.natiUser?.id) return
    
    setCreating(true)
    try {
      const slug = newTeamName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      
      // Create team
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert({
          name: newTeamName,
          slug: slug,
          owner_id: settings.natiUser.id
        })
        .select()
        .single()

      if (teamError) {
        console.error('Team creation error:', teamError)
        throw new Error(teamError.message)
      }

      // Add owner as team member
      const { error: memberError } = await supabase.from('team_members').insert({
        team_id: team.id,
        user_id: settings.natiUser.id,
        role: 'owner',
        joined_at: new Date().toISOString()
      })

      if (memberError) {
        console.error('Member insertion error:', memberError)
        throw new Error(memberError.message)
      }

      toast.success('Team created successfully!')
      setIsCreateDialogOpen(false)
      setNewTeamName('')
      
      // Reload teams
      window.location.reload()
    } catch (error) {
      console.error('Error creating team:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create team')
    } finally {
      setCreating(false)
    }
  }

  async function handleInviteMember() {
    if (!inviteEmail.trim() || !selectedTeam || !settings?.natiUser?.id) return
    
    setInviting(true)
    try {
      const token = Math.random().toString(36).substring(2) + Date.now().toString(36)
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7) // 7 days expiry

      // Check if invite already exists
      const { data: existingInvite } = await supabase
        .from('team_invites')
        .select('id, token, status')
        .eq('team_id', selectedTeam.id)
        .eq('email', inviteEmail)
        .eq('status', 'pending')
        .single()

      let finalToken = token
      if (existingInvite) {
        // Use existing invite token
        finalToken = existingInvite.token
        toast.info('Invite already exists! Using existing link.')
      } else {
        // Create new invite
        const { error } = await supabase.from('team_invites').insert({
          team_id: selectedTeam.id,
          email: inviteEmail,
          role: inviteRole,
          invited_by: settings.natiUser.id,
          token: token,
          expires_at: expiresAt.toISOString()
        })

        if (error) {
          if (error.code === '23505') { // Unique constraint violation
            toast.error('This email is already invited to this team')
            return
          }
          throw error
        }
      }

      const link = `https://natiweb.vercel.app/invite/${finalToken}`
      setInviteLink(link)
      setInviteEmail('')
      toast.success('Invite link created!')
    } catch (error) {
      console.error('Error inviting member:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to send invite')
      setInviting(false)
    } finally {
      if (!inviteLink) setInviting(false)
    }
  }

  function copyInviteLink() {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink)
      setCopiedLink(true)
      toast.success('Link copied to clipboard!')
      setTimeout(() => setCopiedLink(false), 2000)
    }
  }

  function closeInviteDialog() {
    setIsInviteDialogOpen(false)
    setInviteLink('')
    setInviteEmail('')
    setInviting(false)
    setCopiedLink(false)
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case "admin":
        return <Shield className="h-4 w-4 text-blue-500" />;
      case "editor":
        return <SettingsIcon className="h-4 w-4 text-green-500" />;
      case "viewer":
        return <Eye className="h-4 w-4 text-gray-500" />;
      default:
        return null;
    }
  };

  if (!isPro && !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="max-w-md space-y-6">
          <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto">
            <Users className="h-12 w-12 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">Team Workspaces</h2>
            <p className="text-muted-foreground mb-6">
              Collaborate with your team in real-time, share apps, API keys, and prompts.
            </p>
          </div>
          <div className="p-4 rounded-lg border border-blue-500/20 bg-blue-500/10 text-left">
            <h3 className="font-semibold mb-2 text-sm">✨ Pro Feature</h3>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Invite up to 5 team members</li>
              <li>• Share apps and resources</li>
              <li>• Role-based access control</li>
              <li>• Real-time collaboration</li>
            </ul>
          </div>
          <Button
            onClick={() => {
              window.open("https://natidev.com/pro", "_blank");
            }}
            className="w-full"
          >
            Upgrade to Pro
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Team Workspaces</h1>
            <p className="text-xs text-muted-foreground">
              Collaborate with your team
            </p>
          </div>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Create Team
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : teams.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <Users className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Teams Yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create a team to start collaborating
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Team
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
            {/* Teams List */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground px-3 mb-2">
                Your Teams
              </h3>
              {teams.map((team: any) => (
                <button
                  key={team.id}
                  onClick={() => navigate({ to: '/teams/$teamId', params: { teamId: team.id } })}
                  className="w-full text-left p-3 rounded-lg border transition-colors border-border hover:bg-accent hover:border-primary"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold">{team.name}</h4>
                    {getRoleIcon(team.myRole)}
                  </div>
                  <p className="text-xs text-muted-foreground capitalize">
                    {team.myRole}
                  </p>
                </button>
              ))}
            </div>

            {/* Team Details */}
            {selectedTeam && (
              <div className="space-y-4">
                {/* Team Header */}
                <div className="p-6 rounded-lg border">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-bold">{selectedTeam.name}</h2>
                      <p className="text-sm text-muted-foreground capitalize">
                        Your role: {selectedTeam.myRole}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Team Members */}
                <div className="p-6 rounded-lg border">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">
                      Team Members ({teamMembers.length})
                    </h3>
                    {canManageTeam && (
                      <Button
                        onClick={() => setIsInviteDialogOpen(true)}
                        size="sm"
                        variant="outline"
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Invite
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {teamMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm">
                            {member.user?.email?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm">
                                {member.user?.email}
                              </p>
                              {member.user_id === settings?.natiUser?.id && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 font-medium">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              {getRoleIcon(member.role)}
                              <p className="text-xs text-muted-foreground capitalize">
                                {member.role}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Shared Apps Section */}
                <div className="p-6 rounded-lg border">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Folder className="h-4 w-4" />
                      Shared Apps ({sharedApps.length})
                    </h3>
                  </div>
                  
                  {loadingApps ? (
                    <div className="text-sm text-muted-foreground p-4 text-center">
                      Loading shared apps...
                    </div>
                  ) : sharedApps.length === 0 ? (
                    <div className="text-sm text-muted-foreground p-4 text-center border border-dashed rounded-lg">
                      No apps shared yet. Share apps from the web dashboard!
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {sharedApps.map((app) => (
                        <div
                          key={app.id}
                          className="p-4 rounded-lg border hover:bg-accent transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                                  {app.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-sm truncate">{app.name}</h4>
                                  <p className="text-xs text-muted-foreground truncate">{app.path}</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2 mt-2">
                                {app.github_repo && (
                                  <a
                                    href={`https://github.com/${app.github_repo}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-xs transition-colors"
                                  >
                                    <Github className="h-3 w-3" />
                                    View Repo
                                  </a>
                                )}
                                {app.github_repo && (
                                  <a
                                    href={`https://github.com/${app.github_repo}/fork`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs transition-colors"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                    Fork Repo
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pro Feature Notice */}
        <div className="mt-6 p-4 rounded-lg border border-blue-500/20 bg-blue-500/10">
          <p className="text-sm">
            <strong>⭐ Team Workspaces - Pro Feature:</strong> Create teams, invite members, and collaborate together. Visit{" "}
            <a
              href="https://natiweb.vercel.app/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              the web dashboard
            </a>{" "}
            for additional management features.
          </p>
        </div>
      </div>

      {/* Create Team Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Team</DialogTitle>
            <DialogDescription>
              Create a new team to collaborate with others
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="team-name">Team Name</Label>
              <Input
                id="team-name"
                placeholder="My Awesome Team"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateTeam}
              disabled={creating || !newTeamName.trim()}
            >
              {creating ? 'Creating...' : 'Create Team'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite Member Dialog */}
      <Dialog open={isInviteDialogOpen} onOpenChange={closeInviteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Invite Team Member
            </DialogTitle>
            <DialogDescription>
              {inviteLink ? 'Share this link with your teammate' : 'Send an invitation to collaborate'}
            </DialogDescription>
          </DialogHeader>
          
          {inviteLink ? (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-2">
                  <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <h4 className="font-semibold text-green-900 dark:text-green-100">
                    Invitation Created!
                  </h4>
                </div>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Share this link with your teammate to join the team.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>Invite Link</Label>
                <div className="flex gap-2">
                  <Input
                    value={inviteLink}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    onClick={copyInviteLink}
                    variant="outline"
                    size="icon"
                  >
                    {copiedLink ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              <DialogFooter>
                <Button onClick={closeInviteDialog} className="w-full">
                  Done
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invite-email">Email Address</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="teammate@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="invite-role">Role</Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger id="invite-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">👁️ Viewer - Read-only</SelectItem>
                    <SelectItem value="editor">✏️ Editor - Can edit</SelectItem>
                    <SelectItem value="admin">🛡️ Admin - Full access</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={closeInviteDialog}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleInviteMember}
                  disabled={inviting || !inviteEmail.trim()}
                >
                  {inviting ? 'Creating...' : 'Create Invite Link'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
