"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAppContext } from "@/store/AppContext";
import { Card } from "@/components/ui/card";
import { Server, Building2, Users, PlusCircle, Shield, Briefcase, UserCircle, Download, MoreHorizontal, Pencil, Trash2, Power, RotateCcw, AlertTriangle, Eye, Printer } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { exportToCSV } from "@/lib/export";
import { 
  createTenant, updateTenant, deleteTenant, 
  createUser, updateUser, deleteUser, resetUserPassword, disableUser, 
  clearAllSalesData, generateTestData, fetchUserEmails
} from "../actions";

export default function MasterDashboard() {
  const { currentUser, tenants, users, isLoaded } = useAppContext();
  const [activeTab, setActiveTab] = useState<"tenants" | "users">("tenants");
  const [loading, setLoading] = useState(false);
  const isSavingRef = useRef(false);
  const [toast, setToast] = useState<{message: string, type: 'success'|'error'} | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [tenantFilter, setTenantFilter] = useState("All");
  
  const [showCredentials, setShowCredentials] = useState(false);
  const [userEmails, setUserEmails] = useState<Record<string, string>>({});

  useEffect(() => {
    if (currentUser?.role === 'SuperAdmin') {
      fetchUserEmails().then(emails => {
        const emailMap: Record<string, string> = {};
        emails.forEach(e => emailMap[e.id] = e.email);
        setUserEmails(emailMap);
      }).catch(console.error);
    }
  }, [currentUser]);

  // Modals & Forms
  const [newTenantName, setNewTenantName] = useState("");
  
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newUserRole, setNewUserRole] = useState<"Admin" | "Processor" | "Agent">("Agent");
  const [newUserTenant, setNewUserTenant] = useState("");
  const [newUserTeam, setNewUserTeam] = useState("");
  const [isNewTeam, setIsNewTeam] = useState(false);

  const showToast = (message: string, type: 'success'|'error') => {
    setToast({message, type});
    setTimeout(() => setToast(null), 3000);
  }

  useEffect(() => {
    if (isLoaded && currentUser && currentUser.role !== "SuperAdmin") {
      if (currentUser.role === "Agent") window.location.href = "/";
      else if (currentUser.role === "Admin") window.location.href = "/admin";
      else if (currentUser.role === "Processor") window.location.href = "/processor/queue";
    }
  }, [isLoaded, currentUser]);

  if (!isLoaded) {
    return (
      <DashboardLayout title="Master Admin Console">
        <div className="flex items-center justify-center h-[50vh]">
          <div className="w-6 h-6 border-2 border-[#ff5a36] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (currentUser?.role !== "SuperAdmin") {
    return null; // Will redirect via useEffect
  }

  // --- TENANT HANDLERS ---
  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenantName) return;
    setLoading(true);
    const res = await createTenant(newTenantName);
    if (res.error) showToast(res.error, 'error');
    else {
      showToast("Tenant Created!", 'success');
      setNewTenantName("");
      // Real app would refetch context, but revalidatePath triggers a page refresh
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

  // --- USER HANDLERS ---
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingRef.current) return;
    
    if (!newUserName || (!newUserEmail && !editingUserId) || !newUserTenant) {
      showToast("Missing fields", 'error');
      return;
    }
    
    isSavingRef.current = true;
    setLoading(true);
    
    try {
      if (editingUserId) {
        // Update
        const res = await updateUser(editingUserId, {
          full_name: newUserName,
          role: newUserRole,
          organization_id: newUserTenant,
          team: newUserRole === "Agent" ? newUserTeam : undefined
        });
        if (res.error) showToast(res.error, 'error');
        else {
          showToast("User Updated!", 'success');
          resetUserForm();
          window.location.reload();
        }
      } else {
        // Create
        const res = await createUser(newUserEmail, newUserName, newUserRole, newUserTenant, newUserRole === "Agent" ? newUserTeam : undefined);
        if (res.error) showToast(res.error, 'error');
        else {
          showToast("User Provisioned!", 'success');
          resetUserForm();
          window.location.reload();
        }
      }
    } finally {
      isSavingRef.current = false;
      setLoading(false);
    }
  };

  const resetUserForm = () => {
    setEditingUserId(null);
    setNewUserName("");
    setNewUserEmail("");
    setNewUserTeam("");
    setNewUserRole("Agent");
    setNewUserTenant("");
    setIsNewTeam(false);
  }

  const handleEditClick = (u: any) => {
    setEditingUserId(u.id);
    setNewUserName(u.name || "");
    setNewUserEmail("Cannot change email"); // Supabase auth emails are tricky to update easily here
    setNewUserRole(u.role as any);
    setNewUserTenant(u.tenantId || "");
    setNewUserTeam(u.team || "");
  }

  const handleDeleteUser = async (id: string, name: string) => {
    if(!confirm(`WARNING: Permanently delete user ${name}? This action CANNOT be undone.`)) return;
    setLoading(true);
    const res = await deleteUser(id);
    if (res.error) showToast(res.error, 'error');
    else {
      showToast("User Deleted", 'success');
      window.location.reload();
    }
    setLoading(false);
  }

  const handleResetPassword = async (id: string, name: string) => {
    if(!confirm(`Reset password to default (123456) for ${name}?`)) return;
    setLoading(true);
    const res = await resetUserPassword(id);
    if (res.error) showToast(res.error, 'error');
    else showToast("Password Reset to Default", 'success');
    setLoading(false);
  }

  const handleDisableUser = async (id: string, name: string) => {
    if(!confirm(`Disable user ${name}? They will no longer be able to log in.`)) return;
    setLoading(true);
    const res = await disableUser(id);
    if (res.error) showToast(res.error, 'error');
    else {
      showToast("User Disabled", 'success');
      window.location.reload();
    }
    setLoading(false);
  }

  // --- TEST DATA HANDLERS ---
  const handleWipeData = async () => {
    if(!confirm(`WARNING: This will permanently delete ALL sales and notifications across ALL tenants. Proceed?`)) return;
    setLoading(true);
    const res = await clearAllSalesData();
    if (res.error) showToast(res.error, 'error');
    else {
      showToast("All Data Wiped", 'success');
      window.location.reload();
    }
    setLoading(false);
  }

  const handleInjectTestData = async () => {
    setLoading(true);
    const res = await generateTestData();
    if (res.error) showToast(res.error, 'error');
    else showToast("10 Fake Sales Injected!", 'success');
    setLoading(false);
  }

  const existingTeams = Array.from(
    new Set(
      users
        .map(u => u.team)
        .filter((t): t is string => !!t && t.trim() !== "")
    )
  );

  const handleExport = () => {
    if (activeTab === "tenants") {
      const headers = ["Tenant ID", "Name", "Active Users"];
      const keys = ["id", "name", "userCount"];
      const rows = tenants.map(t => ({
        ...t,
        userCount: users.filter(u => u.tenantId === t.id).length
      }));
      exportToCSV(`Tenants_Report_${new Date().toISOString().split('T')[0]}.csv`, rows, headers, keys);
    } else {
      const headers = ["User ID", "Name", "Email/Login", "Role", "Team", "Status", "Tenant"];
      const keys = ["id", "name", "email", "role", "team", "status", "tenantName"];
      const rows = users.map(u => ({
        ...u,
        team: u.team || "None",
        tenantName: tenants.find(t => t.id === u.tenantId)?.name || "Global"
      }));
      exportToCSV(`Users_Report_${new Date().toISOString().split('T')[0]}.csv`, rows, headers, keys);
    }
  };

  return (
    <DashboardLayout title="Master Admin Console">
      <div className="flex flex-col gap-6 font-sans max-w-[1400px] mx-auto w-full pb-10">
        
        {/* Toast */}
        {toast && (
          <div className={cn("fixed top-4 right-4 z-50 px-6 py-3 rounded-xl text-white font-bold shadow-xl flex items-center gap-2", 
            toast.type === 'error' ? "bg-red-500" : "bg-emerald-500"
          )}>
            {toast.message}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white/50 dark:bg-card/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-md">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
              <Server className="w-8 h-8 text-[#ff5a36]" />
              SaaS Control Center
            </h1>
            <p className="text-slate-500 mt-2 text-sm max-w-xl">Manage your tenants (call centers) and oversee their active employees across the entire platform.</p>
          </div>
          <div className="flex gap-4">
            <div className="text-center px-6 py-2 bg-slate-100 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Total Tenants</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-white">{tenants.length}</p>
            </div>
            <div className="text-center px-6 py-2 bg-slate-100 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Active Users</p>
              <p className="text-2xl font-bold text-[#ff5a36]">{users.length}</p>
            </div>
          </div>
        </div>



        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="rounded-[2rem] border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm bg-white dark:bg-card">
              <div className="flex flex-col p-6 border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/20 gap-4">
                
                {/* Top Row: Tabs and Export */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setActiveTab("tenants")}
                      className={cn("px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2", 
                        activeTab === "tenants" ? "bg-white dark:bg-slate-800 text-[#ff5a36] shadow-sm border border-slate-200 dark:border-slate-700" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                      )}
                    >
                      <Building2 className="w-4 h-4" /> Call Centers
                    </button>
                    <button 
                      onClick={() => setActiveTab("users")}
                      className={cn("px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2", 
                        activeTab === "users" ? "bg-white dark:bg-slate-800 text-[#ff5a36] shadow-sm border border-slate-200 dark:border-slate-700" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                      )}
                    >
                      <Users className="w-4 h-4" /> Global Users
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    {activeTab === "tenants" && (
                      <input 
                        type="text"
                        placeholder="Search call centers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full sm:w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff5a36]/50"
                      />
                    )}
                    <button 
                      onClick={handleExport}
                      className="w-full sm:w-auto px-4 py-2 text-sm font-bold text-[#ff5a36] bg-transparent border border-[#ff5a36]/30 hover:bg-[#ff5a36]/5 dark:hover:bg-[#ff5a36]/10 rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Export {activeTab === "tenants" ? "Tenants" : "Users"} CSV
                    </button>
                  </div>
                </div>

                {/* Bottom Row: User Filters */}
                {activeTab === "users" && (
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <select 
                      value={roleFilter} 
                      onChange={(e) => setRoleFilter(e.target.value)}
                      className="flex-1 sm:flex-none sm:w-auto"
                    >
                      <option value="All">All Roles</option>
                      <option value="Agent">Agent</option>
                      <option value="Processor">Processor</option>
                      <option value="Admin">Admin</option>
                      <option value="SuperAdmin">SuperAdmin</option>
                    </select>
                    
                    <select 
                      value={tenantFilter} 
                      onChange={(e) => setTenantFilter(e.target.value)}
                      className="flex-1 sm:flex-none sm:w-auto sm:max-w-[200px]"
                    >
                      <option value="All">All Call Centers</option>
                      {tenants.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                    
                    <input 
                      type="text"
                      placeholder="Search name, team..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full sm:flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff5a36]/50"
                    />
                    
                    <button 
                      onClick={() => setShowCredentials(!showCredentials)}
                      className={cn("px-4 py-2 text-sm font-bold rounded-xl transition-colors flex items-center gap-2",
                        showCredentials ? "bg-indigo-50 text-indigo-600 border border-indigo-200" : "bg-transparent text-slate-500 border border-slate-200 hover:bg-slate-50"
                      )}
                    >
                      {showCredentials ? <Printer className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      {showCredentials ? "Print Mode On" : "Show Credentials"}
                    </button>
                  </div>
                )}
              </div>

              {/* Filtering Logic applied here before render */}
              {(() => {
                const filteredTenants = tenants.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.id.toLowerCase().includes(searchQuery.toLowerCase()));
                const filteredUsers = users.filter(user => {
                  const tenant = tenants.find(t => t.id === user.tenantId);
                  const searchStr = `${user.name} ${user.team || ""} ${user.status}`.toLowerCase();
                  const matchesSearch = searchStr.includes(searchQuery.toLowerCase());
                  const matchesRole = roleFilter === "All" || user.role === roleFilter;
                  const matchesTenant = tenantFilter === "All" || user.tenantId === tenantFilter;
                  return matchesSearch && matchesRole && matchesTenant;
                });

                return (
                  <div className="overflow-x-auto min-h-[400px]">
                <table className="w-full text-sm text-left">
                  <thead className="text-[10px] uppercase text-slate-400 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 font-bold tracking-wider">
                    {activeTab === "tenants" ? (
                      <tr>
                        <th className="py-4 px-6">Tenant ID</th>
                        <th className="py-4 px-6">Company Name</th>
                        <th className="py-4 px-4 text-center">Created Date</th>
                        <th className="py-4 px-4 text-right">Actions</th>
                      </tr>
                    ) : (
                      <tr>
                        <th className="py-4 px-6">User</th>
                        {showCredentials ? (
                          <>
                            <th className="py-4 px-6">Email Address</th>
                            <th className="py-4 px-4">Default Password</th>
                          </>
                        ) : (
                          <th className="py-4 px-6">Role & Tenant</th>
                        )}
                        {!showCredentials && (
                          <>
                            <th className="py-4 px-4">Status</th>
                            <th className="py-4 px-4 text-right">Actions</th>
                          </>
                        )}
                      </tr>
                    )}
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                    {activeTab === "tenants" && filteredTenants.map(tenant => (
                      <tr key={tenant.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                        <td className="py-4 px-6 font-mono text-xs font-bold text-slate-500" title={tenant.id}>
                          {tenant.id.split('-')[0].toUpperCase()}
                        </td>
                        <td className="py-4 px-6 font-bold text-slate-800 dark:text-white">{tenant.name}</td>
                        <td className="py-4 px-4 text-center text-slate-500">{new Date(tenant.created_at || Date.now()).toLocaleDateString()}</td>
                        <td className="py-4 px-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                           <button onClick={() => handleDeleteTenant(tenant.id, tenant.name)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))}
                    {activeTab === "users" && filteredUsers.map(user => {
                      const tenant = tenants.find(t => t.id === user.tenantId);
                      return (
                        <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-bold">
                                {user.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-bold text-slate-800 dark:text-white leading-none">{user.name}</p>
                                <p className="text-xs text-slate-500 mt-1">{showCredentials ? `${user.role} ${user.team ? `(${user.team})` : ''}` : user.id.substring(0,8)}</p>
                              </div>
                            </div>
                          </td>
                          {showCredentials ? (
                            <>
                              <td className="py-4 px-6 font-mono text-xs text-slate-600 dark:text-slate-300">
                                {userEmails[user.id] || "Loading..."}
                              </td>
                              <td className="py-4 px-4 font-mono text-xs text-[#ff5a36] font-bold">
                                123456
                              </td>
                            </>
                          ) : (
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-2">
                                {user.role === "SuperAdmin" ? <Server className="w-4 h-4 text-[#ff5a36]" /> :
                                 user.role === "Admin" ? <Shield className="w-4 h-4 text-blue-500" /> :
                                 user.role === "Processor" ? <Briefcase className="w-4 h-4 text-purple-500" /> :
                                 <UserCircle className="w-4 h-4 text-slate-400" />}
                                <div>
                                  <p className="font-bold text-slate-700 dark:text-slate-200 text-xs">
                                    {user.role} {user.team && <span className="font-normal text-slate-400">({user.team})</span>}
                                  </p>
                                  <p className="text-[10px] text-slate-500 truncate max-w-[120px]">{tenant?.name || "Global"}</p>
                                </div>
                              </div>
                            </td>
                          )}
                          {!showCredentials && (
                            <>
                              <td className="py-4 px-4">
                                <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold border", 
                                  user.status === "Active" ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-red-50 text-red-600 border-red-200"
                                )}>
                                  {user.status || "Active"}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-right opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                <button title="Edit User" onClick={() => handleEditClick(user)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"><Pencil className="w-4 h-4" /></button>
                                <button title="Reset Password" onClick={() => handleResetPassword(user.id, user.name)} className="p-2 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg"><RotateCcw className="w-4 h-4" /></button>
                                <button title="Disable Login" onClick={() => handleDisableUser(user.id, user.name)} className="p-2 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg"><Power className="w-4 h-4" /></button>
                                <button title="Permanently Delete User" onClick={() => handleDeleteUser(user.id, user.name)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                              </td>
                            </>
                          )}
                        </tr>
                      )
                    })}
                    
                    {activeTab === "tenants" && filteredTenants.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-500">No call centers found.</td>
                      </tr>
                    )}
                    {activeTab === "users" && filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-500">No users found matching your search.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              );
            })()}
            </Card>
          </div>

          <div className="flex flex-col gap-6">
            {/* Create Tenant Card */}
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
                <button 
                  disabled={loading || !newTenantName}
                  type="submit" 
                  className="w-full bg-[#ff5a36] hover:bg-[#e04a29] text-white font-bold py-2.5 rounded-xl transition-colors flex justify-center items-center gap-2 shadow-lg shadow-orange-500/20 disabled:opacity-50"
                >
                  <PlusCircle className="w-4 h-4" /> Create Tenant
                </button>
              </form>
            </Card>

            {/* Create / Edit User Card */}
            <Card className="rounded-[2rem] border-slate-200 dark:border-slate-800 p-6 bg-white dark:bg-card shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <UserCircle className="w-4 h-4 text-[#ff5a36]" /> {editingUserId ? "Edit User Account" : "Provision User Account"}
                </h3>
                {editingUserId && (
                  <button onClick={resetUserForm} className="text-xs text-blue-500 hover:underline">Cancel Edit</button>
                )}
              </div>
              <form onSubmit={handleSaveUser} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Full Name</label>
                    <input 
                      type="text" 
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff5a36]/50"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Email (Login)</label>
                    <input 
                      type="text" 
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      placeholder="jane@corp.com"
                      disabled={!!editingUserId}
                      className={cn("w-full border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff5a36]/50", editingUserId ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-slate-50 dark:bg-slate-900")}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Call Center (Tenant)</label>
                  <select 
                    value={newUserTenant}
                    onChange={(e) => setNewUserTenant(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff5a36]/50"
                  >
                    <option value="" disabled>Select Tenant</option>
                    {tenants.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Role</label>
                    <select 
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value as any)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff5a36]/50"
                    >
                      <option value="Agent">Agent</option>
                      <option value="Processor">Processor</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>
                  {newUserRole === "Agent" && (
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Team (Optional)</label>
                      {!isNewTeam ? (
                        <div className="flex gap-2">
                          <select
                            value={newUserTeam}
                            onChange={(e) => {
                              if (e.target.value === "__NEW__") {
                                setIsNewTeam(true);
                                setNewUserTeam("");
                              } else {
                                setNewUserTeam(e.target.value);
                              }
                            }}
                            className="w-full"
                          >
                            <option value="">No Team</option>
                            {existingTeams.map(team => (
                              <option key={team} value={team}>{team}</option>
                            ))}
                            <option value="__NEW__" className="text-[#ff5a36] font-bold dark:text-indigo-400">+ Create New Team...</option>
                          </select>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={newUserTeam}
                            onChange={(e) => setNewUserTeam(e.target.value)}
                            placeholder="Enter team name"
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff5a36]/50"
                          />
                          <button 
                            type="button"
                            onClick={() => {
                              setIsNewTeam(false);
                              setNewUserTeam("");
                            }}
                            className="px-2 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="bg-orange-50 dark:bg-orange-900/10 p-3 rounded-xl border border-orange-100 dark:border-orange-900/30 flex gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-orange-700 dark:text-orange-400 font-medium">
                    {editingUserId ? "Editing an existing user. Password will remain unchanged." : "New users receive a default password (123456). They must reset it upon first login."}
                  </p>
                </div>

                <button 
                  disabled={loading || !newUserName || (!newUserEmail && !editingUserId) || !newUserTenant}
                  className="w-full bg-[#ff5a36] hover:bg-[#e04a29] text-white py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" /> {editingUserId ? "Save Changes" : "Create User"}
                </button>
              </form>
            </Card>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
