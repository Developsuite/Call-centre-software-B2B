"use client";

import React, { useState, useEffect } from "react";
import { HREmployee, useAppContext, UserRole } from "@/store/AppContext";
import { X, User as UserIcon, Mail, Briefcase, ShieldCheck, CheckCircle2, Banknote, Network } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: HREmployee | null; // If null, creating new. If provided, editing existing.
}

export function EmployeeModal({ isOpen, onClose, employee }: EmployeeModalProps) {
  const { addHREmployee, updateHREmployee } = useAppContext();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("Agent");
  const [team, setTeam] = useState("");
  const [baseSalary, setBaseSalary] = useState(0);
  const [bonus, setBonus] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (employee) {
      setName(employee.full_name || "");
      setEmail(employee.email || ""); 
      setRole(employee.role || "Agent");
      setTeam(employee.team || "");
      setBaseSalary(employee.base_salary || 0);
      setBonus(employee.bonus || 0);
    } else {
      setName("");
      setEmail("");
      setRole("Agent");
      setTeam("");
      setBaseSalary(0);
      setBonus(0);
    }
  }, [employee, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      toast.error("Please provide a name.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (employee) {
        // Edit mode
        await updateHREmployee(employee.id, {
          full_name: name,
          email,
          role,
          team,
          base_salary: Number(baseSalary),
          bonus: Number(bonus)
        });
      } else {
        // Create mode
        await addHREmployee({
          full_name: name,
          email,
          role,
          team,
          base_salary: Number(baseSalary),
          bonus: Number(bonus),
          status: "Active"
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
                {employee ? "Edit HR Record" : "Add HR Record"}
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                {employee ? "Update employee data" : "Create a new employee directory record"}
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

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Email Address (Optional)</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  type="email" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="e.g. jane@company.com"
                  className="pl-9 h-11 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Role</label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                  <select 
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    className="w-full pl-9 h-11 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium focus:ring-1 focus:ring-[#ff5a36] outline-none appearance-none cursor-pointer"
                  >
                    <option value="Agent">Agent</option>
                    <option value="Processor">Processor</option>
                    <option value="Admin">Admin</option>
                    <option value="HR">HR</option>
                    <option value="Manager">Manager</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Team</label>
                <div className="relative">
                  <Network className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                  <Input 
                    type="text" 
                    value={team}
                    onChange={e => setTeam(e.target.value)}
                    placeholder="e.g. Alpha"
                    className="pl-9 h-11 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-xl"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Base Salary ($)</label>
                <div className="relative">
                  <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    type="number" 
                    value={baseSalary}
                    onChange={e => setBaseSalary(Number(e.target.value))}
                    min={0}
                    className="pl-9 h-11 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-xl"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Bonus ($)</label>
                <div className="relative">
                  <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    type="number" 
                    value={bonus}
                    onChange={e => setBonus(Number(e.target.value))}
                    min={0}
                    className="pl-9 h-11 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-xl"
                  />
                </div>
              </div>
            </div>
            
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
            {employee ? "Save Record" : "Add Record"}
          </button>
        </div>
      </div>
    </div>
  );
}
