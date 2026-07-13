"use client";
import { useState } from "react";

import { 
  LayoutDashboard, 
  PlusCircle, 
  ListChecks, 
  BarChart3, 
  Settings, 
  LogOut,
  Briefcase,
  Sun,
  Moon,
  HelpCircle,
  Shield,
  Server,
  Building2,
  Users,
  ShieldCheck,
  Headset,
  Network,
  UsersRound,
  Activity
} from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";
import Link from "next/link";
import { useAppContext } from "@/store/AppContext";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function Sidebar({ isMobileMenuOpen, setIsMobileMenuOpen }: { isMobileMenuOpen?: boolean, setIsMobileMenuOpen?: (open: boolean) => void }) {
  const pathname = usePathname();
  const { currentUser, addTicket } = useAppContext();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const supabase = createClient();

  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketDescription, setTicketDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogout = async () => {
    // Show the "See you soon" full-screen overlay instantly
    window.dispatchEvent(new Event('signout'));
    
    // Sign out immediately so session clears while animation plays
    await supabase.auth.signOut();
    
    // Delay navigation slightly so they can appreciate the minimal UI
    setTimeout(() => {
      router.push("/login");
      toast.success("Logged out successfully");
      router.refresh();
    }, 1200);
  };

  const handleTicketSubmit = async () => {
    if (!ticketSubject.trim() || !ticketDescription.trim()) {
      toast.error("Please fill in both fields.");
      return;
    }
    setIsSubmitting(true);
    await addTicket(ticketSubject, ticketDescription);
    setIsSubmitting(false);
    setIsHelpModalOpen(false);
    setTicketSubject("");
    setTicketDescription("");
  };

  const allMenuItems = [
    { name: "Master Admin", href: "/master/dashboard", icon: Server, roles: ["SuperAdmin"] },
    { name: "Call Centers", href: "/master/call-centers", icon: Building2, roles: ["SuperAdmin"] },
    { name: "Global Users", href: "/master/users", icon: Users, roles: ["SuperAdmin"] },
    { name: "Queries & Issues", href: "/master/support", icon: HelpCircle, roles: ["SuperAdmin"] },
    { name: "Admin Hub", href: "/admin", icon: ShieldCheck, roles: ["Admin"] },
    { name: "Live Sales", href: "/admin/live-sales", icon: Activity, roles: ["Admin"] },
    { name: "My Teams", href: "/admin/teams", icon: Network, roles: ["SuperAdmin", "Admin"] },
    { name: "All Agents", href: "/admin/agents", icon: Headset, roles: ["Admin"] },
    { name: "All Processors", href: "/admin/processors", icon: Briefcase, roles: ["Admin"] },
    { name: "Agent Dashboard", href: "/", icon: LayoutDashboard, roles: ["Agent"] },
    { name: "My Sales", href: "/sales", icon: ListChecks, roles: ["Agent"] },
    { name: "Processor Dashboard", href: "/processor/queue", icon: Briefcase, roles: ["Processor"] },
    { name: "All Sales", href: "/processor/sales", icon: ListChecks, roles: ["Processor"] },
    { name: "Settings", href: "/settings", icon: Settings, roles: ["SuperAdmin", "Admin", "Processor", "Agent"] },
  ];

  const menuItems = allMenuItems.filter(item => {
    // If not loaded yet, assume Agent or just don't show restricted ones
    const currentRole = currentUser?.role;
    if (!currentRole) return false;
    return item.roles.includes(currentRole);
  });

  if (currentUser?.isTeamLead) {
    const insertIndex = menuItems.findIndex(m => m.name === "Agent Dashboard" || m.name === "Processor Dashboard") + 1;
    menuItems.splice(insertIndex > 0 ? insertIndex : 0, 0, { name: "My Team", href: "/team/dashboard", icon: UsersRound, roles: [] });
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] md:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen?.(false)}
        />
      )}

      <div className={cn(
        "flex flex-col gap-6 z-[101] md:z-50 transition-transform duration-300",
        "fixed md:sticky top-0 md:top-4 left-0 h-screen md:h-[calc(100vh-2rem)]",
        "w-64 md:w-[72px] bg-[#f3f4f6] md:bg-transparent dark:bg-background md:dark:bg-transparent p-4 md:p-0 border-r border-slate-200 md:border-none dark:border-slate-800",
        isMobileMenuOpen ? "translate-x-0 shadow-2xl md:shadow-none" : "-translate-x-full md:translate-x-0"
      )}>
        
        <div className="flex items-center justify-between md:hidden mb-2 px-2">
          <div className="font-bold text-xl"><span className="text-[#ff5a36]">Call</span>Suite</div>
          <button onClick={() => setIsMobileMenuOpen?.(false)} className="text-slate-500 hover:text-slate-800 p-1">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        {/* Top Pill: Theme Toggle */}
        <div className="flex md:flex-col items-center justify-center gap-2 bg-white dark:bg-card p-2 rounded-full shadow-sm">
          <button 
            onClick={() => setTheme("light")}
            className={cn("p-2 rounded-full transition-all duration-300", theme !== "dark" ? "bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.5),0_1px_2px_rgba(0,0,0,0.1)]" : "text-slate-400 hover:text-slate-700")}
          >
            <Sun className="h-5 w-5" strokeWidth={theme !== "dark" ? 2 : 1.5} />
          </button>
          <button 
            onClick={() => setTheme("dark")}
            className={cn("p-2 rounded-full transition-all duration-300", theme === "dark" ? "bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.5),0_1px_2px_rgba(0,0,0,0.1)]" : "text-slate-400 hover:text-slate-700")}
          >
            <Moon className="h-5 w-5" strokeWidth={theme === "dark" ? 2 : 1.5} />
          </button>
        </div>

        {/* Middle Pill: Navigation Icons */}
        <div className="flex flex-col items-stretch md:items-center gap-2 bg-white dark:bg-card p-2 rounded-[1.5rem] md:rounded-[2.5rem] shadow-sm w-full my-auto overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileMenuOpen?.(false)}
                className={cn(
                  "p-3 rounded-xl md:rounded-full transition-all duration-300 relative group flex items-center md:justify-center md:w-12 md:h-12 w-full",
                  isActive 
                    ? "bg-gradient-to-b from-[#404040] to-[#111111] dark:from-[#3a414e] dark:to-[#0f172a] shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_4px_10px_rgba(0,0,0,0.3)] text-white border border-[#2a2a2a] dark:border-border" 
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" strokeWidth={isActive ? 2 : 1.5} />
                
                <span className="md:hidden ml-3 font-medium text-sm">{item.name}</span>

                {/* Tooltip */}
                <div className="hidden md:block absolute left-full ml-5 top-1/2 -translate-y-1/2 -translate-x-2 px-3 py-1.5 bg-gradient-to-b from-[#ff7a5c] to-[#ff5a36] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_4px_10px_rgba(255,90,54,0.4)] border border-[#e04a29] text-white text-xs font-medium rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 whitespace-nowrap z-50">
                  {item.name}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Bottom Pill: Help & Logout */}
        <div className="flex md:flex-col items-center justify-center gap-2 bg-white dark:bg-card p-2 rounded-full shadow-sm mt-auto">
          <button 
            onClick={() => { setIsHelpModalOpen(true); setIsMobileMenuOpen?.(false); }}
            className="p-3 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors group relative rounded-full"
          >
            <HelpCircle className="h-5 w-5" strokeWidth={1.5} />
            {/* Tooltip */}
            <div className="hidden md:block absolute left-full ml-5 top-1/2 -translate-y-1/2 -translate-x-2 px-3 py-1.5 bg-gradient-to-b from-[#ff7a5c] to-[#ff5a36] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_4px_10px_rgba(255,90,54,0.4)] border border-[#e04a29] text-white text-xs font-medium rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 whitespace-nowrap z-50">
              Help
            </div>
          </button>
          <button 
            onClick={handleLogout}
            className="p-3 text-slate-400 hover:text-[#ff5a36] transition-colors group relative rounded-full"
          >
            <LogOut className="h-5 w-5" strokeWidth={1.5} />
            {/* Tooltip */}
            <div className="hidden md:block absolute left-full ml-5 top-1/2 -translate-y-1/2 -translate-x-2 px-3 py-1.5 bg-gradient-to-b from-[#ff7a5c] to-[#ff5a36] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_4px_10px_rgba(255,90,54,0.4)] border border-[#e04a29] text-white text-xs font-medium rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 whitespace-nowrap z-50">
              Logout
            </div>
          </button>
        </div>
      </div>

      {/* Help Modal */}
      {isHelpModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setIsHelpModalOpen(false)}>
          <div className="bg-white dark:bg-card w-full max-w-md rounded-3xl p-6 shadow-2xl relative border border-slate-100 dark:border-slate-800" onClick={e => e.stopPropagation()}>
            <div className="absolute top-4 right-4">
              <button onClick={() => setIsHelpModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                ✕
              </button>
            </div>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-[#ff5a36]/10 text-[#ff5a36] flex items-center justify-center">
                <HelpCircle className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">Need Help?</h2>
                <p className="text-sm text-slate-500">Submit a support ticket directly to the platform owners.</p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Issue Subject</label>
                <input 
                  type="text" 
                  value={ticketSubject}
                  onChange={e => setTicketSubject(e.target.value)}
                  placeholder="E.g. Cannot access sales dashboard"
                  className="w-full bg-slate-50 border-slate-200 dark:bg-slate-900/50 dark:border-slate-800 rounded-xl h-10 px-3 text-sm focus-visible:ring-1 focus-visible:ring-[#ff5a36] focus-visible:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Detailed Description</label>
                <textarea 
                  value={ticketDescription}
                  onChange={e => setTicketDescription(e.target.value)}
                  placeholder="Please describe the issue in detail..."
                  className="w-full bg-slate-50 border-slate-200 dark:bg-slate-900/50 dark:border-slate-800 rounded-xl p-3 text-sm min-h-[120px] resize-none focus-visible:ring-1 focus-visible:ring-[#ff5a36] focus-visible:outline-none custom-scrollbar"
                />
              </div>
              
              <button 
                onClick={handleTicketSubmit}
                disabled={isSubmitting}
                className="mt-2 w-full bg-[#ff5a36] hover:bg-[#e04a29] text-white font-bold h-12 rounded-xl transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Submitting..." : "Submit Support Ticket"}
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
}
