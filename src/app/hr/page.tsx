"use client"

import React from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card } from "@/components/ui/card"
import { useAppContext } from "@/store/AppContext"
import { UsersRound, UserCheck, UserMinus, ShieldCheck, Banknote, Briefcase, Activity } from "lucide-react"

export default function HRDashboardPage() {
  const { users, currentUser, isLoaded } = useAppContext()

  if (!isLoaded || !currentUser) {
    return (
      <DashboardLayout title="HR Command Center">
        <div className="flex items-center justify-center h-[50vh]">
          <div className="w-6 h-6 border-2 border-[#ff5a36] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    )
  }

  // Filter to current organization, except for SuperAdmin
  const tenantUsers = currentUser.role === "SuperAdmin" 
    ? users 
    : users.filter(u => u.tenantId === currentUser.tenantId)

  const totalEmployees = tenantUsers.length
  const activeEmployees = tenantUsers.filter(u => u.status === "Active").length
  const disabledEmployees = tenantUsers.filter(u => u.status === "Disabled").length
  
  const agentsCount = tenantUsers.filter(u => u.role === "Agent").length
  const processorsCount = tenantUsers.filter(u => u.role === "Processor").length
  const hrCount = tenantUsers.filter(u => u.role === "HR").length

  // Simple payroll mock calculation
  const totalMonthlyPayroll = 
    (agentsCount * 3000) + 
    (processorsCount * 3500) + 
    (hrCount * 4000);

  return (
    <DashboardLayout title="HR Command Center">
      <div className="flex flex-col gap-6 font-sans max-w-[1200px] mx-auto w-full pb-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white/50 dark:bg-card/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-md">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
                <UsersRound className="w-8 h-8 text-[#ff5a36]" />
                HR Command Center
              </h1>
            </div>
            <p className="text-slate-500 text-sm max-w-xl">
              Overview of your organization's human resources, employee statuses, and high-level payroll estimations.
            </p>
          </div>
        </div>

        {/* Global KPIs Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="rounded-[1.5rem] p-5 bg-white dark:bg-card border-none shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Headcount</span>
              <UsersRound className="w-4 h-4 text-[#ff5a36]" />
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-bold text-slate-800 dark:text-white">{totalEmployees}</h3>
              <p className="text-[10px] text-slate-400 font-medium mt-1">Total registered users</p>
            </div>
          </Card>

          <Card className="rounded-[1.5rem] p-5 bg-white dark:bg-card border-none shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Staff</span>
              <UserCheck className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-bold text-slate-800 dark:text-white">{activeEmployees}</h3>
              <p className="text-[10px] text-emerald-500 font-bold mt-1">Currently active accounts</p>
            </div>
          </Card>

          <Card className="rounded-[1.5rem] p-5 bg-white dark:bg-card border-none shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Disabled</span>
              <UserMinus className="w-4 h-4 text-slate-400" />
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-bold text-slate-800 dark:text-white">{disabledEmployees}</h3>
              <p className="text-[10px] text-slate-400 font-bold mt-1">Revoked or suspended</p>
            </div>
          </Card>

          <Card className="rounded-[1.5rem] p-5 bg-gradient-to-br from-[#ff7a5c] to-[#ff5a36] text-white border-none shadow-[0_8px_20px_rgba(255,90,54,0.2)] flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-white/90 uppercase tracking-wider">Est. Monthly Payroll</span>
              <Banknote className="w-4 h-4 text-white" />
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-bold text-white">${totalMonthlyPayroll.toLocaleString()}</h3>
              <p className="text-[10px] text-white/70 font-medium mt-1">Based on base role salaries</p>
            </div>
          </Card>
        </div>

        {/* Roles Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
          <Card className="rounded-[2rem] border-none shadow-sm bg-white dark:bg-card p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center shrink-0">
              <Activity className="w-6 h-6 text-indigo-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Agents</p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{agentsCount}</h3>
            </div>
          </Card>

          <Card className="rounded-[2rem] border-none shadow-sm bg-white dark:bg-card p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center shrink-0">
              <Briefcase className="w-6 h-6 text-teal-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Processors</p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{processorsCount}</h3>
            </div>
          </Card>

          <Card className="rounded-[2rem] border-none shadow-sm bg-white dark:bg-card p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#ff5a36]/10 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-[#ff5a36]" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">HR & Admins</p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{hrCount + tenantUsers.filter(u => u.role === "Admin").length}</h3>
            </div>
          </Card>
        </div>

      </div>
    </DashboardLayout>
  )
}
