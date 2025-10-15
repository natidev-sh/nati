import { useEffect, useState } from "react";
import { useSettings } from "@/hooks/useSettings";
import { Shield, Users, FileText, AlertCircle, ExternalLink, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IpcClient } from "@/ipc/ipc_client";
import { useRouter } from "@tanstack/react-router";

export default function AdminPage() {
  const { settings } = useSettings();
  const { navigate } = useRouter();
  const [stats, setStats] = useState({ users: 0, posts: 0, publishedPosts: 0 });
  const [loading, setLoading] = useState(true);
  
  const natiUser = settings?.natiUser;
  const isAdmin = natiUser?.isAdmin;

  useEffect(() => {
    if (isAdmin && natiUser?.accessToken) {
      fetchAdminStats();
    }
  }, [isAdmin, natiUser?.accessToken]);

  async function fetchAdminStats() {
    if (!natiUser?.accessToken) return;
    
    setLoading(true);
    try {
      // Fetch user count
      const usersResponse = await fetch('https://cvsqiyjfqvdptjnxefbk.supabase.co/rest/v1/profiles?select=*&limit=0', {
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2c3FpeWpmcXZkcHRqbnhlZmJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwNDU5NTYsImV4cCI6MjA3NTYyMTk1Nn0.uc-wEsnkKtZjscmmJUIJ64qZJXGHQpp8cYwjEhWBivo',
          'Authorization': `Bearer ${natiUser.accessToken.value}`,
          'Prefer': 'count=exact',
        },
      });
      
      // Fetch posts count
      const postsResponse = await fetch('https://cvsqiyjfqvdptjnxefbk.supabase.co/rest/v1/posts?select=*&limit=0', {
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2c3FpeWpmcXZkcHRqbnhlZmJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwNDU5NTYsImV4cCI6MjA3NTYyMTk1Nn0.uc-wEsnkKtZjscmmJUIJ64qZJXGHQpp8cYwjEhWBivo',
          'Authorization': `Bearer ${natiUser.accessToken.value}`,
          'Prefer': 'count=exact',
        },
      });

      // Fetch published posts count
      const publishedPostsResponse = await fetch('https://cvsqiyjfqvdptjnxefbk.supabase.co/rest/v1/posts?select=*&published=eq.true&limit=0', {
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2c3FpeWpmcXZkcHRqbnhlZmJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwNDU5NTYsImV4cCI6MjA3NTYyMTk1Nn0.uc-wEsnkKtZjscmmJUIJ64qZJXGHQpp8cYwjEhWBivo',
          'Authorization': `Bearer ${natiUser.accessToken.value}`,
          'Prefer': 'count=exact',
        },
      });

      const userCount = parseInt(usersResponse.headers.get('content-range')?.split('/')[1] || '0');
      const postCount = parseInt(postsResponse.headers.get('content-range')?.split('/')[1] || '0');
      const publishedPostCount = parseInt(publishedPostsResponse.headers.get('content-range')?.split('/')[1] || '0');

      setStats({
        users: userCount,
        posts: postCount,
        publishedPosts: publishedPostCount,
      });
    } catch (error) {
      console.error('Failed to fetch admin stats:', error);
    } finally {
      setLoading(false);
    }
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4 max-w-md">
          <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-950/20 flex items-center justify-center mx-auto">
            <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Access Denied</h2>
          <p className="text-zinc-600 dark:text-zinc-400">
            You need administrator privileges to access this page.
          </p>
          <Button onClick={() => navigate({ to: "/" })} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Admin Panel</h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Manage your Nati.dev platform</p>
          </div>
        </div>
        <Button
          onClick={() => IpcClient.getInstance().openExternalUrl("https://natiweb.vercel.app/admin")}
          variant="outline"
          className="gap-2"
        >
          <ExternalLink className="h-4 w-4" />
          Full Admin Panel
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Total Users"
          value={stats.users}
          icon={<Users className="h-5 w-5" />}
          loading={loading}
          gradient="from-blue-500 to-indigo-600"
        />
        <StatCard
          title="Total Posts"
          value={stats.posts}
          icon={<FileText className="h-5 w-5" />}
          loading={loading}
          gradient="from-purple-500 to-pink-600"
        />
        <StatCard
          title="Published Posts"
          value={stats.publishedPosts}
          icon={<FileText className="h-5 w-5" />}
          loading={loading}
          gradient="from-green-500 to-emerald-600"
        />
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl p-6">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Quick Actions</h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <QuickActionButton
            label="Manage Users"
            description="View and manage user accounts"
            icon={<Users className="h-5 w-5" />}
            onClick={() => IpcClient.getInstance().openExternalUrl("https://natiweb.vercel.app/admin/users")}
          />
          <QuickActionButton
            label="Manage Posts"
            description="Create and edit blog posts"
            icon={<FileText className="h-5 w-5" />}
            onClick={() => IpcClient.getInstance().openExternalUrl("https://natiweb.vercel.app/admin/posts")}
          />
          <QuickActionButton
            label="Site Settings"
            description="Configure platform settings"
            icon={<Shield className="h-5 w-5" />}
            onClick={() => IpcClient.getInstance().openExternalUrl("https://natiweb.vercel.app/admin/settings")}
          />
        </div>
      </div>

      {/* Info Box */}
      <div className="rounded-xl border border-blue-200 dark:border-blue-800/50 bg-blue-50/50 dark:bg-blue-950/20 p-4">
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Embedded Admin Panel</h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              This is a simplified admin dashboard embedded in the desktop app. For full admin functionality, 
              use the "Full Admin Panel" button above to access the complete web interface.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  icon, 
  loading, 
  gradient 
}: { 
  title: string; 
  value: number; 
  icon: React.ReactNode; 
  loading: boolean;
  gradient: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl p-6">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{title}</p>
        <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-sm`}>
          {icon}
        </div>
      </div>
      {loading ? (
        <div className="h-8 w-20 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
      ) : (
        <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">{value.toLocaleString()}</p>
      )}
    </div>
  );
}

function QuickActionButton({ 
  label, 
  description, 
  icon, 
  onClick 
}: { 
  label: string; 
  description: string; 
  icon: React.ReactNode; 
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-start gap-3 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-left"
    >
      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white flex-shrink-0 shadow-sm">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-0.5">{label}</h3>
        <p className="text-xs text-zinc-600 dark:text-zinc-400">{description}</p>
      </div>
      <ExternalLink className="h-4 w-4 text-zinc-400 flex-shrink-0 mt-1" />
    </button>
  );
}
