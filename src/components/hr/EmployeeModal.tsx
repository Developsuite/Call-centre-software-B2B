"use client";

import React, { useState, useEffect } from "react";
import { User, useAppContext, UserRole } from "@/store/AppContext";
import { X, User as UserIcon, Mail, Briefcase, Network, ShieldCheck, CheckCircle2, Lock } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: User | null; // If null, creating new. If provided, editing existing.
}

export function EmployeeModal({ isOpen, onClose, employee }: EmployeeModalProps) {
  const { addUser, updateUser, teams, currentUser } = useAppContext();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("Agent");
  const [teamId, setTeamId] = useState("");
  const [isTeamLead, setIsTeamLead] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (employee) {
      setName(employee.name || "");
      setEmail(""); // Email isn't usually editable directly via profile
      setPassword("");
      setRole(employee.role as UserRole);
      setTeamId(employee.team_id || "");
      setIsTeamLead(employee.isTeamLead || false);
    } else {
      setName("");
      setEmail("");
      setPassword("");
      setRole("Agent");
      setTeamId("");
      setIsTeamLead(false);
    }
  }, [employee, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || (!employee && (!email || !password))) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedTeam = teams.find(t => t.id === teamId);
      
      if (employee) {
        // Edit mode
        await updateUser(employee.id, {
          name,
          team: selectedTeam ? selectedTeam.name : null,
          team_id: teamId || null,
          is_team_lead: isTeamLead
          // Role isn't easily editable once set due to RLS, but if needed we add it here.
        });
      } else {
        // Create mode
        await addUser({
          email,
          password,
          full_name: name,
          role,
          organization_id: currentUser?.tenantId,
          team: selectedTeam ? selectedTeam.name : null,
          team_id: teamId || null,
          is_team_lead: isTeamLead
        });
      }
      onClose();
    } catch (error: any) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white dark:bg-card w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-transparent shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#ff5a36]/10 text-[#ff5a36] flex items-center justify-center">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white leading-tight">
                {employee ? "Edit Employee" : "Add Employee"}
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                {employee ? "Update employee details" : "Create a new employee account"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-6 flex-1 custom-scrollbar">
          <form id="employee-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  type="text" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Jane Doe"
                  className="pl-9 h-11 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-xl"
                  required
                />
              </div>
            </div>

            {!employee && (
              <>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                      type="email" 
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="e.g. jane@company.com"
                      className="pl-9 h-11 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Temporary Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                      type="password" 
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="pl-9 h-11 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-xl"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Role</label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                    <select 
                      value={role}
                      onChange={e => setRole(e.target.value as UserRole)}
                      className="w-full pl-9 h-11 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium focus:ring-1 focus:ring-[#ff5a36] outline-none appearance-none cursor-pointer"
                    >
                      <option value="Agent">Agent</option>
                      <option value="Processor">Processor</option>
                      {currentUser?.role === 'SuperAdmin' && <option value="Admin">Admin</option>}
                      <option value="HR">HR</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Assign Team (Optional)</label>
              <div className="relative">
                <Network className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                <select 
                  value={teamId}
                  onChange={e => setTeamId(e.target.value)}
                  className="w-full pl-9 h-11 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium focus:ring-1 focus:ring-[#ff5a36] outline-none appearance-none cursor-pointer"
                >
                  <option value="">No Team</option>
                  {teams.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {teamId && (
              <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer hover:border-[#ff5a36]/50 transition-colors">
                <input 
                  type="checkbox" 
                  checked={isTeamLead}
                  onChange={e => setIsTeamLead(e.target.checked)}
                  className="w-4 h-4 text-[#ff5a36] border-slate-300 rounded focus:ring-[#ff5a36] focus:ring-2 cursor-pointer"
                />
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Set as Team Lead</span>
              </label>
            )}
          </form>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 flex justify-end gap-3 shrink-0">
          <button 
            type="button" 
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-sm"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="employee-form"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-[#ff5a36] hover:bg-[#e04a29] text-white font-bold transition-all shadow-[0_4px_10px_rgba(255,90,54,0.3)] disabled:opacity-50 flex items-center gap-2 text-sm"
          >
            {isSubmitting ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            {employee ? "Save Changes" : "Create Employee"}
          </button>
        </div>
      </div>
    </div>
  );
}
