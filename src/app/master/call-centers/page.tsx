"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAppContext } from "@/store/AppContext";
import { Card } from "@/components/ui/card";
import { Building2, PlusCircle, Trash2, Download, Shield } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { exportToCSV } from "@/lib/export";
import { createTenant, deleteTenant, resetTenant } from "../actions";

export default function CallCentersPage() {
  const { currentUser, tenants, users, isLoaded } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success'|'error'} | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [newTenantName, setNewTenantName] = useState("");
  const [newTenantAvatarUrl, setNewTenantAvatarUrl] = useState("");

  const showToast = (message: string, type: 'success'|'error') => {
    setToast({message, type});
    setTimeout(() => setToast(null), 3000);
  }

  if (!isLoaded) {
    return (
      <DashboardLayout title="Call Centers">
        <div className="flex items-center justify-center h-[50vh]">
          <div className="w-6 h-6 border-2 border-[#ff5a36] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (currentUser?.role !== "SuperAdmin") {
    return (
      <DashboardLayout title="Access Denied">
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
          <Shield className="w-16 h-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Access Restricted</h2>
          <p className="text-slate-500 max-w-md">This area is strictly reserved for SuperAdmins.</p>
        </div>
      </DashboardLayout>
    );
  }

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenantName) return;
    setLoading(true);
    const res = await createTenant(newTenantName, newTenantAvatarUrl);
    if (res.error) showToast(res.error, 'error');
    else {
      showToast("Tenant Created!", 'success');
      setNewTenantName("");
      setNewTenantAvatarUrl("");
      window.location.reload(); 
    }
    setLoading(false);
  };

  const handleDeleteTenant = async (id: string, name: string) => {
    if(!confirm(`WARNING: Deleting '${name}' will PERMANENTLY wipe all of its users and sales. Continue?`)) return;
    setLoading(true);
    const res = await deleteTenant(id);
    if (res.error) showToast(res.error, 'error');
    else {
      showToast("Tenant Deleted", 'success');
      window.location.reload();
    }
    setLoading(false);
  };

  const handleResetTenant = async (id: string, name: string) => {
    if(!confirm(`FACTORY RESET: Are you absolutely sure you want to reset '${name}'?\n\nThis will permanently delete ALL sales, queue data, notifications, and support tickets for this call center. Users will remain intact.\n\nType OK to confirm.`)) return;
    setLoading(true);
    const res = await resetTenant(id);
    if (res.error) showToast(res.error, 'error');
    else {
      showToast("Tenant Factory Reset Complete", 'success');
      window.location.reload();
    }
    setLoading(false);
  };

  const handleExport = () => {
    const headers = ["Tenant ID", "Name", "Active Users"];
    const keys = ["id", "name", "userCount"];
    const rows = tenants.map(t => ({
      ...t,
      userCount: users.filter(u => u.tenantId === t.id).length
    }));
    exportToCSV(`Tenants_Report_${new Date().toISOString().split('T')[0]}.csv`, rows, headers, keys);
  };

  const filteredTenants = tenants.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.id.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <DashboardLayout title="Call Centers">
      <div className="flex flex-col gap-6 font-sans max-w-[1400px] mx-auto w-full pb-10">
        
        {toast && (
          <div className={cn("fixed top-4 right-4 z-50 px-6 py-3 rounded-xl text-white font-bold shadow-xl flex items-center gap-2", 
            toast.type === 'error' ? "bg-red-500" : "bg-emerald-500"
          )}>
            {toast.message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="rounded-[2rem] border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm bg-white dark:bg-card">
              <div className="flex flex-col p-6 border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/20 gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-[#ff5a36]" /> Call Centers Database
                  </h3>
                  
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <input 
                      type="text"
                      placeholder="Search call centers..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full sm:w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff5a36]/50"
                    />
                    <button 
                      onClick={handleExport}
                      className="w-full sm:w-auto px-4 py-2 text-sm font-bold text-[#ff5a36] bg-transparent border border-[#ff5a36]/30 hover:bg-[#ff5a36]/5 dark:hover:bg-[#ff5a36]/10 rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Export CSV
                    </button>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto min-h-[400px]">
                <table className="w-full text-sm text-left">
                  <thead className="text-[10px] uppercase text-slate-400 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 font-bold tracking-wider">
                    <tr>
                      <th className="py-4 px-6">Tenant ID</th>
                      <th className="py-4 px-6">Company Name</th>
                      <th className="py-4 px-4 text-center">Active Users</th>
                      <th className="py-4 px-4 text-center">Created Date</th>
                      <th className="py-4 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                    {filteredTenants.map(tenant => {
                      const userCount = users.filter(u => u.tenantId === tenant.id).length;
                      return (
                        <tr key={tenant.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                          <td className="py-4 px-6 font-mono text-xs font-bold text-slate-500" title={tenant.id}>
                            {tenant.id.split('-')[0].toUpperCase()}
                          </td>
                          <td className="py-4 px-6 font-bold text-slate-800 dark:text-white">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                {tenant.avatarUrl ? (
                                  <img src={tenant.avatarUrl} alt={tenant.name} className="w-full h-full object-cover" />
                                ) : (
                                  <Building2 className="w-4 h-4 text-slate-400" />
                                )}
                              </div>
                              {tenant.name}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center text-slate-800 dark:text-slate-300 font-bold">{userCount}</td>
                          <td className="py-4 px-4 text-center text-slate-500">{new Date(tenant.created_at || Date.now()).toLocaleDateString()}</td>
                          <td className="py-4 px-4 text-right opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            <button 
                              onClick={() => handleResetTenant(tenant.id, tenant.name)} 
                              title="Factory Reset Data"
                              className="p-2 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors mr-1"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                            </button>
                            <button 
                              onClick={() => handleDeleteTenant(tenant.id, tenant.name)} 
                              title="Delete Call Center"
                              className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                    {filteredTenants.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500">No call centers found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          <div className="flex flex-col gap-6">
            <Card className="rounded-[2rem] border-slate-200 dark:border-slate-800 p-6 bg-white dark:bg-card shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
                <PlusCircle className="w-4 h-4 text-[#ff5a36]" /> Onboard New Call Center
              </h3>
              <form onSubmit={handleCreateTenant} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Company Name</label>
                  <input 
                    type="text" 
                    value={newTenantName}
                    onChange={(e) => setNewTenantName(e.target.value)}
                    placeholder="e.g. Acme Corp Sales"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff5a36]/50"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Company Logo</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { src: "/avatars/org-01.png", label: "Skyscraper" },
                      { src: "/avatars/org-02.png", label: "Global Node" },
                      { src: "/avatars/org-03.png", label: "Diamond Shield" },
                    ].map((av) => (
                      <button
                        key={av.src}
                        type="button"
                        onClick={() => setNewTenantAvatarUrl(av.src)}
                        className={cn(
                          "relative rounded-lg overflow-hidden aspect-square border-2 transition-all duration-200 cursor-pointer",
                          newTenantAvatarUrl === av.src
                            ? "border-[#ff5a36] shadow-sm scale-105"
                            : "border-slate-200 dark:border-slate-700 hover:border-[#ff5a36]/50"
                        )}
                      >
                        <img src={av.src} alt={av.label} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  disabled={loading || !newTenantName}
                  type="submit" 
                  className="w-full bg-[#ff5a36] hover:bg-[#e04a29] text-white font-bold py-2.5 rounded-xl transition-colors flex justify-center items-center gap-2 shadow-lg shadow-orange-500/20 disabled:opacity-50"
                >
                  <PlusCircle className="w-4 h-4" /> Create Tenant
                </button>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
