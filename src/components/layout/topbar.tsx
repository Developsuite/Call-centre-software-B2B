"use client";

import { Bell, Search, Info, ChevronDown, Check, CheckCircle2, LogOut, Key } from "lucide-react";
import { useAppContext } from "@/store/AppContext";
import { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";

export function TopBar({ title }: { title?: string }) {
  const { users, tenants, currentUser, setCurrentUser, notifications, markNotificationRead, markAllNotificationsRead } = useAppContext();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
      if (infoRef.current && !infoRef.current.contains(event.target as Node)) {
        setIsInfoOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getTenantName = (tenantId: string | null) => {
    if (!tenantId) return "Global";
    return tenants.find((t) => t.id === tenantId)?.name || "Unknown Tenant";
  };

  const allMenuItems = [
    { name: "Master Admin", href: "/master/dashboard", roles: ["SuperAdmin"] },
    { name: "Call Centers", href: "/master/call-centers", roles: ["SuperAdmin"] },
    { name: "Global Users", href: "/master/users", roles: ["SuperAdmin"] },
    { name: "Queries & Issues", href: "/master/support", roles: ["SuperAdmin"] },
    { name: "Admin Hub", href: "/admin", roles: ["Admin"] },
    { name: "Live Sales", href: "/admin/live-sales", roles: ["Admin"] },
    { name: "My Teams", href: "/admin/teams", roles: ["SuperAdmin", "Admin"] },
    { name: "All Agents", href: "/admin/agents", roles: ["Admin"] },
    { name: "All Processors", href: "/admin/processors", roles: ["Admin"] },
    { name: "Agent Dashboard", href: "/", roles: ["Agent"] },
    { name: "My Sales", href: "/sales", roles: ["Agent"] },
    { name: "Processor Dashboard", href: "/processor/queue", roles: ["Processor"] },
    { name: "All Sales", href: "/processor/sales", roles: ["Processor"] },
    { name: "Settings", href: "/settings", roles: ["SuperAdmin", "Admin", "Processor", "Agent"] },
  ];

  const topNav = allMenuItems.filter(item => {
    const currentRole = currentUser?.role;
    if (!currentRole) return false;
    return item.roles.includes(currentRole);
  });

  if (currentUser?.isTeamLead) {
    const insertIndex = topNav.findIndex(m => m.name === "Agent Dashboard" || m.name === "Processor Dashboard") + 1;
    topNav.splice(insertIndex > 0 ? insertIndex : 0, 0, { name: "My Team", href: "/team/dashboard", roles: [] });
  }

  const userNotifications = notifications.filter(n => n.userId === currentUser?.id).sort((a, b) => b.timestamp - a.timestamp);
  const unreadCount = userNotifications.filter(n => !n.read).length;

  return (
    <div className="flex items-center justify-between w-full mt-2 mb-6 z-40 relative">
      <div className="flex items-center gap-2 font-bold text-xl px-2">
        <span className="text-[#ff5a36]">Call</span>Center
      </div>

      <div className="hidden lg:flex items-center bg-white dark:bg-card rounded-full p-1.5 shadow-sm">
        {topNav.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "px-5 py-2 text-sm font-medium rounded-full transition-all duration-300",
              pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
                ? "bg-gradient-to-b from-[#404040] to-[#111111] dark:from-[#3a414e] dark:to-[#0f172a] shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_4px_10px_rgba(0,0,0,0.3)] text-white border border-[#2a2a2a] dark:border-border"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            )}
          >
            {item.name}
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center bg-white dark:bg-card rounded-full px-4 py-2 shadow-sm gap-4">
          
          <div className="flex items-center">
            <button 
              onClick={() => setIsSearchExpanded(!isSearchExpanded)}
              className={cn("transition-colors", isSearchExpanded ? "text-[#ff5a36]" : "text-slate-400 hover:text-slate-700 dark:hover:text-white")}
            >
              <Search className="h-5 w-5" />
            </button>
            <input 
              type="text" 
              placeholder="Global Search..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "bg-transparent border-none outline-none text-sm text-slate-700 dark:text-white transition-all duration-300 ease-in-out",
                isSearchExpanded ? "w-32 md:w-48 ml-2 opacity-100" : "w-0 opacity-0 pointer-events-none"
              )}
            />
          </div>
          
          <div className="relative" ref={notifRef}>
            <button 
              onClick={() => setNotifOpen(!notifOpen)}
              className={cn("transition-colors relative", notifOpen ? "text-[#ff5a36]" : "text-slate-400 hover:text-slate-700 dark:hover:text-white")}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 rounded-full bg-[#ff5a36] text-[9px] font-bold text-white items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-4 w-80 bg-white dark:bg-card rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 mb-1 flex justify-between items-center">
                  <p className="text-sm font-bold text-slate-800 dark:text-white">Notifications</p>
                  {unreadCount > 0 && (
                    <button 
                      onClick={() => currentUser && markAllNotificationsRead(currentUser.id)}
                      className="text-[10px] font-bold text-[#ff5a36] hover:text-[#e04a29]"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-[350px] overflow-y-auto">
                  {userNotifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-slate-500 text-xs">
                      No notifications yet.
                    </div>
                  ) : (
                    userNotifications.map(notif => (
                      <div 
                        key={notif.id}
                        onClick={() => {
                          if (!notif.read) markNotificationRead(notif.id);
                          if (notif.saleId) {
                            router.push(`/sales/${notif.saleId}`);
                            setNotifOpen(false);
                          }
                        }}
                        className={cn(
                          "w-full text-left px-4 py-3 border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer flex gap-3",
                          !notif.read ? "bg-orange-50/50 dark:bg-orange-900/10" : ""
                        )}
                      >
                        <div className="mt-1 shrink-0">
                          {!notif.read ? (
                            <span className="w-2 h-2 rounded-full bg-[#ff5a36] inline-block"></span>
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <p className={cn("text-xs mb-0.5", !notif.read ? "font-bold text-slate-800 dark:text-white" : "font-medium text-slate-600 dark:text-slate-300")}>
                            {notif.title}
                          </p>
                          <p className="text-[11px] text-slate-500 leading-tight">
                            {notif.message}
                          </p>
                          <p className="text-[9px] text-slate-400 mt-1">
                            {new Date(notif.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="relative" ref={infoRef}>
            <button 
              onClick={() => setIsInfoOpen(!isInfoOpen)}
              className={cn("transition-colors", isInfoOpen ? "text-[#ff5a36]" : "text-slate-400 hover:text-slate-700 dark:hover:text-white")}
            >
              <Info className="h-5 w-5" />
            </button>

            {isInfoOpen && (
              <div className="absolute right-0 mt-4 w-64 bg-white dark:bg-card rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-3 px-4 z-50">
                <p className="text-sm font-bold text-slate-800 dark:text-white mb-2">System Status</p>
                <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                  <p className="flex justify-between items-center"><span>Version:</span> <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">v1.0.0-beta</span></p>
                  <p className="flex justify-between items-center"><span>Database:</span> <span className="text-emerald-500 font-bold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>Connected</span></p>
                  <p className="flex justify-between items-center"><span>Environment:</span> <span>Production</span></p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
                  <Link href="/settings" onClick={() => setIsInfoOpen(false)} className="text-xs text-[#ff5a36] hover:underline font-bold">View Full Settings</Link>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center bg-white dark:bg-[#1e293b] rounded-full p-1.5 shadow-sm pr-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Avatar className="h-9 w-9 bg-slate-100 text-slate-700">
              {currentUser?.avatarUrl && <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} />}
              <AvatarFallback>{currentUser?.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="hidden md:flex flex-col ml-3 mr-3 items-start">
              <span className="text-sm font-bold text-slate-800 dark:text-white leading-tight">{currentUser?.name}</span>
              <span className="text-[10px] text-slate-500">
                {currentUser?.role} {currentUser?.tenantId && `• ${getTenantName(currentUser.tenantId)}`}
              </span>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-card rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 overflow-hidden">
              <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 mb-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Account</p>
              </div>
              <div className="flex flex-col p-2">
                <Link
                  href="/settings/password"
                  onClick={() => setDropdownOpen(false)}
                  className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/50 rounded-lg flex items-center gap-2 transition-colors mb-1"
                >
                  <Key className="w-4 h-4" />
                  Change Password
                </Link>
                <button
                  onClick={async () => {
                    setDropdownOpen(false);
                    window.dispatchEvent(new Event('signout'));
                    
                    const supabase = createClient();
                    await supabase.auth.signOut();
                    
                    setTimeout(() => {
                      router.push('/login');
                      router.refresh();
                    }, 1200);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
