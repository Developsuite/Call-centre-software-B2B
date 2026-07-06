"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAppContext } from "@/store/AppContext";
import { Card } from "@/components/ui/card";
import { Settings, User, Building2, Save, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { currentUser, updateUser, tenants, updateTenant } = useAppContext();
  const [activeTab, setActiveTab] = useState<"profile" | "organization">("profile");

  // Profile Form State
  const [name, setName] = useState("");
  const [team, setTeam] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [profileSaved, setProfileSaved] = useState(false);

  // Organization Form State
  const [tenantName, setTenantName] = useState("");
  const [orgAvatarUrl, setOrgAvatarUrl] = useState("");
  const [orgSaved, setOrgSaved] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name);
      setTeam(currentUser.team || "");
      setAvatarUrl(currentUser.avatarUrl || "");
      
      if (currentUser.tenantId) {
        const t = tenants.find(t => t.id === currentUser.tenantId);
        if (t) {
          setTenantName(t.name);
          setOrgAvatarUrl(t.avatarUrl || "");
        }
      }
    }
  }, [currentUser, tenants]);

  if (!currentUser) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser(currentUser.id, {
      name,
      team: currentUser.role === "Agent" ? team : undefined,
      avatarUrl
    });
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  const handleSaveOrganization = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser.tenantId) {
      updateTenant(currentUser.tenantId, { name: tenantName, avatarUrl: orgAvatarUrl });
      setOrgSaved(true);
      setTimeout(() => setOrgSaved(false), 3000);
    }
  };

  return (
    <DashboardLayout title="Settings">
      <div className="flex flex-col gap-6 font-sans max-w-[1000px] mx-auto w-full pb-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white/50 dark:bg-card/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-md">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
              <Settings className="w-8 h-8 text-[#ff5a36]" />
              Account Settings
            </h1>
            <p className="text-slate-500 mt-2 text-sm max-w-xl">Manage your personal profile and organization preferences.</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl w-fit border border-slate-200 dark:border-slate-800">
          <button 
            onClick={() => setActiveTab("profile")}
            className={cn("px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2", activeTab === "profile" ? "bg-white dark:bg-slate-800 shadow-sm text-[#ff5a36]" : "text-slate-500 hover:text-slate-800 dark:hover:text-white")}
          >
            <User className="w-4 h-4" /> My Profile
          </button>
          
          {(currentUser.role === "Admin" || currentUser.role === "SuperAdmin") && currentUser.tenantId && (
            <button 
              onClick={() => setActiveTab("organization")}
              className={cn("px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2", activeTab === "organization" ? "bg-white dark:bg-slate-800 shadow-sm text-[#ff5a36]" : "text-slate-500 hover:text-slate-800 dark:hover:text-white")}
            >
              <Building2 className="w-4 h-4" /> Organization
            </button>
          )}
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            {activeTab === "profile" ? (
              <Card className="rounded-[1.5rem] border-none shadow-sm p-6 bg-white dark:bg-slate-900">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Personal Information</h2>
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Full Name</label>
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full h-11 px-4 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-[#ff5a36]/50 transition-all text-slate-800 dark:text-white"
                      required
                    />
                  </div>

                  {currentUser.role === "Agent" && (
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Team Name</label>
                      <input 
                        type="text" 
                        value={team}
                        onChange={(e) => setTeam(e.target.value)}
                        className="w-full h-11 px-4 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-[#ff5a36]/50 transition-all text-slate-800 dark:text-white"
                        placeholder="e.g. ALPHA SQUAD"
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 block">Choose Your Avatar</label>
                    <div className="grid grid-cols-5 gap-3">
                      {[
                        { src: "/avatars/avatar-01.png", label: "Professional Man" },
                        { src: "/avatars/avatar-02.png", label: "Hijab Woman" },
                        { src: "/avatars/avatar-03.png", label: "Gen-Z Guy" },
                        { src: "/avatars/avatar-04.png", label: "Glasses Woman" },
                        { src: "/avatars/avatar-05.png", label: "Stylish Man" },
                        { src: "/avatars/avatar-06.png", label: "Red Hair Woman" },
                        { src: "/avatars/avatar-07.png", label: "Distinguished Man" },
                        { src: "/avatars/avatar-08.png", label: "Purple Hair Woman" },
                        { src: "/avatars/avatar-09.png", label: "Turban Man" },
                        { src: "/avatars/avatar-10.png", label: "Afro Woman" },
                      ].map((av) => (
                        <button
                          key={av.src}
                          type="button"
                          onClick={() => setAvatarUrl(av.src)}
                          className={cn(
                            "relative rounded-xl overflow-hidden aspect-square border-2 transition-all duration-200 hover:scale-105 hover:shadow-lg group cursor-pointer",
                            avatarUrl === av.src
                              ? "border-[#ff5a36] ring-2 ring-[#ff5a36]/30 shadow-lg scale-105"
                              : "border-slate-200 dark:border-slate-700 hover:border-[#ff5a36]/50"
                          )}
                          title={av.label}
                        >
                          <img src={av.src} alt={av.label} className="w-full h-full object-cover" />
                          {avatarUrl === av.src && (
                            <div className="absolute inset-0 bg-[#ff5a36]/10 flex items-center justify-center">
                              <div className="w-6 h-6 rounded-full bg-[#ff5a36] flex items-center justify-center shadow-lg">
                                <CheckCircle2 className="w-4 h-4 text-white" />
                              </div>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Or paste a custom URL</label>
                      <input 
                        type="url" 
                        value={avatarUrl.startsWith("/avatars/") ? "" : avatarUrl}
                        onChange={(e) => setAvatarUrl(e.target.value)}
                        className="w-full h-10 px-4 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-[#ff5a36]/50 transition-all text-slate-800 dark:text-white"
                        placeholder="https://example.com/your-photo.jpg"
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex items-center gap-4">
                    <button 
                      type="submit"
                      className="px-6 py-2.5 bg-[#ff5a36] hover:bg-[#e04a29] text-white text-sm font-bold rounded-xl transition-all flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" /> Save Profile
                    </button>
                    {profileSaved && (
                      <span className="text-emerald-500 text-sm font-bold flex items-center gap-1.5 animate-in fade-in slide-in-from-left-2">
                        <CheckCircle2 className="w-4 h-4" /> Saved Successfully!
                      </span>
                    )}
                  </div>
                </form>
              </Card>
            ) : (
              <Card className="rounded-[1.5rem] border-none shadow-sm p-6 bg-white dark:bg-slate-900">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Call Center Organization</h2>
                <form onSubmit={handleSaveOrganization} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Organization Name</label>
                    <input 
                      type="text" 
                      value={tenantName}
                      onChange={(e) => setTenantName(e.target.value)}
                      className="w-full h-11 px-4 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-[#ff5a36]/50 transition-all text-slate-800 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 block">Choose Organization Logo</label>
                    <div className="grid grid-cols-5 gap-3">
                      {[
                        { src: "/avatars/org-01.png", label: "Skyscraper" },
                        { src: "/avatars/org-02.png", label: "Global Node" },
                        { src: "/avatars/org-03.png", label: "Diamond Shield" },
                      ].map((av) => (
                        <button
                          key={av.src}
                          type="button"
                          onClick={() => setOrgAvatarUrl(av.src)}
                          className={cn(
                            "relative rounded-xl overflow-hidden aspect-square border-2 transition-all duration-200 hover:scale-105 hover:shadow-lg group cursor-pointer",
                            orgAvatarUrl === av.src
                              ? "border-[#ff5a36] ring-2 ring-[#ff5a36]/30 shadow-lg scale-105"
                              : "border-slate-200 dark:border-slate-700 hover:border-[#ff5a36]/50"
                          )}
                          title={av.label}
                        >
                          <img src={av.src} alt={av.label} className="w-full h-full object-cover" />
                          {orgAvatarUrl === av.src && (
                            <div className="absolute inset-0 bg-[#ff5a36]/10 flex items-center justify-center">
                              <div className="w-6 h-6 rounded-full bg-[#ff5a36] flex items-center justify-center shadow-lg">
                                <CheckCircle2 className="w-4 h-4 text-white" />
                              </div>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Or paste a custom URL</label>
                      <input 
                        type="url" 
                        value={orgAvatarUrl.startsWith("/avatars/") ? "" : orgAvatarUrl}
                        onChange={(e) => setOrgAvatarUrl(e.target.value)}
                        className="w-full h-10 px-4 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-[#ff5a36]/50 transition-all text-slate-800 dark:text-white"
                        placeholder="https://example.com/your-logo.png"
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex items-center gap-4">
                    <button 
                      type="submit"
                      className="px-6 py-2.5 bg-[#ff5a36] hover:bg-[#e04a29] text-white text-sm font-bold rounded-xl transition-all flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" /> Save Organization
                    </button>
                    {orgSaved && (
                      <span className="text-emerald-500 text-sm font-bold flex items-center gap-1.5 animate-in fade-in slide-in-from-left-2">
                        <CheckCircle2 className="w-4 h-4" /> Saved Successfully!
                      </span>
                    )}
                  </div>
                </form>
              </Card>
            )}
          </div>

          <div className="md:col-span-1">
            <Card className="rounded-[1.5rem] border-none shadow-sm p-6 bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f] dark:from-slate-800 dark:to-slate-900 text-white flex flex-col items-center text-center relative overflow-hidden">
              <div className="absolute top-0 w-full h-32 bg-gradient-to-b from-[#ff5a36]/20 to-transparent"></div>
              
              <div className="w-24 h-24 rounded-full border-4 border-[#2a2a2a] dark:border-slate-700 bg-slate-800 overflow-hidden relative z-10 mb-4 shadow-xl">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-slate-400">
                    {name.charAt(0)}
                  </div>
                )}
              </div>
              
              <h3 className="text-xl font-bold z-10">{name}</h3>
              <p className="text-slate-400 text-sm mb-4 z-10">{currentUser.role}</p>
              
              <div className="w-full bg-[#2a2a2a] dark:bg-slate-800 rounded-xl p-4 text-left z-10 space-y-3">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Status</p>
                  <p className="text-emerald-400 text-sm font-bold flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    {currentUser.status}
                  </p>
                </div>
                
                {currentUser.team && (
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Team</p>
                    <p className="text-slate-200 text-sm font-medium mt-0.5">{currentUser.team}</p>
                  </div>
                )}
                
                {tenantName && (
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Organization</p>
                    <p className="text-slate-200 text-sm font-medium mt-0.5">{tenantName}</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
