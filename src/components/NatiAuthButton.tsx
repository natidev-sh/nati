import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { IpcClient } from "@/ipc/ipc_client";
import { useSettings } from "@/hooks/useSettings";
import { useDeepLink } from "@/contexts/DeepLinkContext";
import { useUserBudgetInfo } from "@/hooks/useUserBudgetInfo";
import { LogIn, LogOut, User, Crown, Sparkles, Shield, Settings as SettingsIcon, Zap, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { createClient } from '@supabase/supabase-js';
import { useNavigate } from '@tanstack/react-router';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const SUPABASE_URL = 'https://cvsqiyjfqvdptjnxefbk.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2c3FpeWpmcXZkcHRqbnhlZmJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwNDU5NTYsImV4cCI6MjA3NTYyMTk1Nn0.uc-wEsnkKtZjscmmJUIJ64qZJXGHQpp8cYwjEhWBivo'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: false, // Disable auto-refresh to prevent 400 errors
    persistSession: false, // Don't persist session in desktop app
  }
})

interface UserProfile {
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
}

export function NatiAuthButton() {
  const { settings, refreshSettings } = useSettings();
  const { lastDeepLink } = useDeepLink();
  const { userBudget } = useUserBudgetInfo();
  const navigate = useNavigate();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const hasShownToast = useRef(false);
  
  const natiUser = settings?.natiUser;
  const isLoggedIn = !!natiUser?.id;

  // Initialize Pro and Admin status from stored settings
  useEffect(() => {
    if (natiUser?.isPro !== undefined) {
      setIsPro(natiUser.isPro);
    }
    if (natiUser?.isAdmin !== undefined) {
      setIsAdmin(natiUser.isAdmin);
    }
  }, [natiUser?.isPro, natiUser?.isAdmin]);

  // Ensure user is registered in LiteLLM when Pro is enabled
  useEffect(() => {
    const registerProUser = async () => {
      if (isPro && natiUser?.id && settings?.enableDyadPro) {
        try {
          await IpcClient.getInstance().ensureProUser(natiUser.id);
          console.log("Pro user registered in LiteLLM");
        } catch (error) {
          console.error("Failed to register Pro user:", error);
        }
      }
    };
    registerProUser();
  }, [isPro, natiUser?.id, settings?.enableDyadPro]);

  // Debug: Log budget info
  useEffect(() => {
    console.log("Budget Debug:", {
      isPro,
      userBudget,
      hasUserBudget: !!userBudget,
      enableDyadPro: settings?.enableDyadPro,
    });
  }, [isPro, userBudget, settings?.enableDyadPro]);

  // Fetch user profile from Supabase
  useEffect(() => {
    async function fetchProfile() {
      if (!natiUser?.id || !natiUser?.accessToken?.value) return;

      try {
        // Set auth session
        // Try to set session, but don't fail if tokens are invalid
        try {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: natiUser.accessToken.value,
            refresh_token: natiUser.refreshToken?.value || '',
          });
          
          if (sessionError) {
            console.warn('Session setup failed:', sessionError.message);
            // If tokens are expired, user needs to re-authenticate
            if (sessionError.message.includes('Invalid') || sessionError.message.includes('expired')) {
              console.warn('Tokens expired, user should re-authenticate');
            }
            // Don't throw, just log and continue
          }
        } catch (authError) {
          console.warn('Session setup failed, continuing anyway:', authError);
        }

        // Fetch profile (use maybeSingle to handle missing profiles)
        const { data, error } = await supabase
          .from('profiles')
          .select('first_name, last_name, avatar_url')
          .eq('id', natiUser.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching profile:', error);
          return;
        }

        // If profile exists, set it, otherwise use default
        if (data) {
          setProfile(data);
        } else {
          // Profile doesn't exist yet, set a default
          setProfile({
            first_name: natiUser.email?.split('@')[0] || 'User',
            last_name: '',
            avatar_url: null,
          });
        }
      } catch (error) {
        console.error('Error in profile fetch:', error);
      }
    }

    fetchProfile();
  }, [natiUser?.id, natiUser?.accessToken?.value]);

  useEffect(() => {
    const handleDeepLink = async () => {
      if (lastDeepLink?.type === "nati-auth-return" && !hasShownToast.current) {
        hasShownToast.current = true;
        await refreshSettings();
        toast.success("Successfully logged in!");
        setIsLoggingIn(false);
      }
    };
    handleDeepLink();
  }, [lastDeepLink, refreshSettings]);

  // Reset logging in state when user logs out
  useEffect(() => {
    if (!isLoggedIn) {
      setIsLoggingIn(false);
      setProfile(null);
    }
  }, [isLoggedIn]);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      // Open natiweb login page which will redirect back to the app
      await IpcClient.getInstance().openExternalUrl(
        "https://natiweb.vercel.app/desktop-auth?redirect=nati://nati-auth-return"
      );
      
      // Set a timeout to reset login state if auth doesn't complete in 5 minutes
      // This handles cases where user closes browser without completing auth
      setTimeout(() => {
        if (!isLoggedIn) {
          setIsLoggingIn(false);
        }
      }, 300000); // 5 minutes
    } catch (error) {
      console.error("Failed to open login page:", error);
      toast.error("Failed to open login page");
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      // Clear user data from settings
      await IpcClient.getInstance().logoutNatiUser();
      await refreshSettings();
      
      // Reset login state and clear profile
      setIsLoggingIn(false);
      setProfile(null);
      hasShownToast.current = false;
      
      toast.success("Successfully logged out");
    } catch (error) {
      console.error("Failed to logout:", error);
      
      // Reset login state even on error
      setIsLoggingIn(false);
      
      // Fallback: If IPC handler not available, show helpful message
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("Invalid channel")) {
        toast.error("Logout handler not ready. Please restart the app.");
      } else {
        toast.error("Failed to logout");
      }
    }
  };

  if (!isLoggedIn) {
    return (
      <Button
        onClick={handleLogin}
        disabled={isLoggingIn}
        variant="ghost"
        size="sm"
        className="h-8 px-2.5 flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        title="Login with Nati"
      >
        <User className="h-4 w-4" />
        <span className="text-xs font-medium hidden @sm:inline">
          {isLoggingIn ? "Logging in..." : "Login"}
        </span>
      </Button>
    );
  }

  const displayName = profile?.first_name && profile?.last_name
    ? `${profile.first_name} ${profile.last_name}`
    : natiUser.name || natiUser.email;

  const initials = profile?.first_name && profile?.last_name
    ? `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase()
    : natiUser.name
    ? natiUser.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : natiUser.email[0].toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className="h-8 px-2 flex items-center gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          title={`${natiUser.name || natiUser.email}${isPro ? ' (Pro)' : ''} - Click for options`}
        >
          <div className="relative">
            {profile?.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt={displayName}
                className="h-7 w-7 rounded-full object-cover shadow-sm ring-2 ring-white/20"
                onError={(e) => {
                  // Fallback to initials if image fails to load
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div className={`h-7 w-7 rounded-full flex items-center justify-center text-white font-semibold text-xs shadow-sm ${
              profile?.avatar_url ? 'hidden' : ''
            } ${
              isAdmin 
                ? 'bg-gradient-to-br from-purple-500 to-pink-600' 
                : 'bg-gradient-to-br from-blue-500 to-indigo-600'
            }`}>
              {initials}
            </div>
            {isAdmin ? (
              <div className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center shadow-sm">
                <Shield className="h-2 w-2 text-white" />
              </div>
            ) : isPro ? (
              <div className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
                <Crown className="h-2 w-2 text-white" />
              </div>
            ) : null}
          </div>
          <div className="hidden @md:flex flex-col items-start text-left">
            <div className="flex items-center gap-1">
              <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100 leading-tight">{displayName}</span>
              {isAdmin ? (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-sm">ADMIN</span>
              ) : isPro ? (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-sm">PRO</span>
              ) : null}
            </div>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-tight">{natiUser.email}</span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl shadow-lg">
        <DropdownMenuLabel className="font-semibold">
          <div className="flex items-center gap-3">
            {profile?.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt={displayName}
                className="h-10 w-10 rounded-full object-cover shadow-sm ring-2 ring-zinc-200 dark:ring-zinc-700"
              />
            ) : (
              <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm ${
                isAdmin 
                  ? 'bg-gradient-to-br from-purple-500 to-pink-600' 
                  : 'bg-gradient-to-br from-blue-500 to-indigo-600'
              }`}>
                {initials}
              </div>
            )}
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-sm">{displayName}</span>
              {isAdmin ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-sm flex items-center gap-1">
                  <Shield className="h-2.5 w-2.5" />
                  ADMIN
                </span>
              ) : isPro ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-sm flex items-center gap-1">
                  <Crown className="h-2.5 w-2.5" />
                  PRO
                </span>
              ) : null}
              </div>
              <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">{natiUser.email}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Credit Display */}
        {isPro && (
          <>
            <div className="px-2 py-2">
              <div className="p-3 rounded-lg bg-gradient-to-br from-zinc-100 to-zinc-50 dark:from-zinc-800 dark:to-zinc-900 border border-zinc-200 dark:border-zinc-700">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-blue-500" />
                    <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">AI Credits</span>
                  </div>
                  {userBudget ? (
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      {Math.round(userBudget.totalCredits - userBudget.usedCredits)}
                    </span>
                  ) : (
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">Loading...</span>
                  )}
                </div>
                {userBudget ? (
                  <>
                    <div className="h-1.5 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-700">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300"
                        style={{ 
                          width: `${Math.max(0, Math.min(100, ((userBudget.totalCredits - userBudget.usedCredits) / userBudget.totalCredits) * 100))}%` 
                        }}
                      />
                    </div>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">
                      Resets {new Date(userBudget.budgetResetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </>
                ) : (
                  <div className="h-1.5 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
                )}
              </div>
            </div>
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuItem
          onClick={() => IpcClient.getInstance().openExternalUrl("https://natiweb.vercel.app/dashboard")}
          className="cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
        >
          <User className="mr-2 h-4 w-4" />
          <span>Dashboard</span>
        </DropdownMenuItem>
        
        {isPro && (
          <DropdownMenuItem
            onClick={() => IpcClient.getInstance().openExternalUrl("https://natiweb.vercel.app/dashboard?tab=subscription")}
            className="cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <CreditCard className="mr-2 h-4 w-4" />
            <span>Manage Subscription</span>
          </DropdownMenuItem>
        )}
        
        <DropdownMenuItem
          onClick={() => navigate({ to: '/settings' })}
          className="cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
        >
          <SettingsIcon className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        {isAdmin && (
          <DropdownMenuItem
            onClick={() => window.location.href = '/#/admin'}
            className="cursor-pointer rounded-lg transition-all hover:scale-[1.02] bg-gradient-to-r from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 border border-purple-500/20"
          >
            <div className="flex items-center gap-2 w-full">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-sm">
                <Shield className="h-4 w-4 text-white" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-sm font-semibold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">Admin Panel</span>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400">Manage users & content</span>
              </div>
            </div>
          </DropdownMenuItem>
        )}
        {!isPro && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => IpcClient.getInstance().openExternalUrl("https://natiweb.vercel.app/download#pro-pricing")}
              className="cursor-pointer rounded-lg transition-all hover:scale-[1.02] bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 border border-amber-500/20"
            >
              <div className="flex items-center gap-2 w-full">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-semibold bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400 bg-clip-text text-transparent">Get Nati Pro</span>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400">Unlock premium features</span>
                </div>
              </div>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={handleLogout}
          className="cursor-pointer hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors text-red-600 dark:text-red-400"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
