"use client"

import React, { useMemo, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card } from "@/components/ui/card"
import { useAppContext, UserRole } from "@/store/AppContext"
import { UsersRound, UserCheck, UserMinus, ShieldCheck, Banknote, Briefcase, Activity, ChevronRight, UserCircle, ArrowUpRight, Fingerprint, RefreshCw } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

const BASE_SALARIES: Record<UserRole, number> = {
  SuperAdmin: 0,
  Admin: 5000,
  HR: 4000,
  Processor: 3500,
  Agent: 3000
}

export default function HRDashboardPage() {
  const { hrEmployees, currentUser, isLoaded } = useAppContext()
  const [isSyncing, setIsSyncing] = useState(false)

  const handleSyncAttendance = async () => {
    if (!currentUser) return;
    try {
      setIsSyncing(true)
      toast.loading("Connecting to ZKTeco machine...")
      
      const response = await fetch('/api/attendance/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ip: "192.168.18.225",
          port: 4370,
          organization_id: currentUser.tenantId
        })
      })
      
      const data = await response.json()
      toast.dismiss()
      
      if (data.success) {
        toast.success(data.message)
      } else {
        toast.error(data.error || "Sync failed")
      }
    } catch (error) {
      toast.dismiss()
      toast.error("Failed to connect to machine")
    } finally {
      setIsSyncing(false)
    }
  }

  if (!isLoaded || !currentUser) {
    return (
      <DashboardLayout title="HR Command Center">
        <div className="flex items-center justify-center h-[50vh]">
          <div className="w-6 h-6 border-2 border-[#ff5a36] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    )
  }

  const tenantUsers = currentUser.role === "SuperAdmin" 
    ? hrEmployees 
    : hrEmployees.filter(u => u.organization_id === currentUser.tenantId)

  const totalEmployees = tenantUsers.length
  const activeEmployees = tenantUsers.filter(u => u.status === "Active").length
  const disabledEmployees = tenantUsers.filter(u => u.status === "Disabled").length
  
  const agentsCount = tenantUsers.filter(u => u.role === "Agent").length
  const processorsCount = tenantUsers.filter(u => u.role === "Processor").length
  const hrCount = tenantUsers.filter(u => u.role === "HR").length

  const activeStaff = tenantUsers.filter(u => u.status === "Active" && u.role !== "SuperAdmin");
  const totalMonthlyPayroll = activeStaff.reduce((sum, user) => sum + Number(user.base_salary || 0) + Number(user.bonus || 0), 0);

  const payrollData = useMemo(() => {
    return activeStaff.map(user => {
      return {
        ...user,
        totalCompensation: Number(user.base_salary || 0) + Number(user.bonus || 0)
      };
    }).sort((a, b) => b.totalCompensation - a.totalCompensation).slice(0, 4); // Top 4 earners
  }, [activeStaff])

  return (
    <DashboardLayout title="HR Command Center">
      <div className="flex flex-col gap-4 font-sans max-w-[1200px] mx-auto w-full pb-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white/50 dark:bg-card/50 p-4 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-md">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
                <UsersRound className="w-6 h-6 text-[#ff5a36]" />
                HR Command Center
              </h1>
            </div>
            <p className="text-slate-500 text-xs max-w-xl">
              Overview of your organization's human resources and payroll estimations.
            </p>
          </div>
          <div className="flex gap-2">
             <button 
                onClick={handleSyncAttendance} 
                disabled={isSyncing}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Fingerprint className="w-4 h-4" />}
                {isSyncing ? "Syncing..." : "Sync ZKTeco"}
              </button>
          </div>
        </div>

        {/* Global KPIs Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="rounded-[1.25rem] p-4 bg-white dark:bg-card border-none shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Headcount</span>
              <UsersRound className="w-4 h-4 text-[#ff5a36]" />
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{totalEmployees}</h3>
            </div>
          </Card>

          <Card className="rounded-[1.25rem] p-4 bg-white dark:bg-card border-none shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Active Staff</span>
              <UserCheck className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{activeEmployees}</h3>
            </div>
          </Card>

          <Card className="rounded-[1.25rem] p-4 bg-white dark:bg-card border-none shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Disabled</span>
              <UserMinus className="w-4 h-4 text-slate-400" />
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{disabledEmployees}</h3>
            </div>
          </Card>

          <Card className="rounded-[1.25rem] p-4 bg-gradient-to-br from-[#ff7a5c] to-[#ff5a36] text-white border-none shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-white/90 uppercase tracking-wider">Est. Monthly Payroll</span>
              <Banknote className="w-4 h-4 text-white" />
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-bold text-white">PKR {totalMonthlyPayroll.toLocaleString()}</h3>
            </div>
          </Card>
        </div>



        {/* Quick Overviews Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
          
          {/* Employee Directory Quick View */}
          <Card className="rounded-[1.5rem] border-none shadow-sm bg-white dark:bg-card overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-transparent">
              <div className="flex items-center gap-2">
                <UsersRound className="w-4 h-4 text-slate-500" />
                <h3 className="font-bold text-slate-800 dark:text-white text-sm">Recent Employees</h3>
              </div>
              <Link href="/hr/employees" className="text-[10px] font-bold text-[#ff5a36] hover:text-[#e04a29] flex items-center gap-1 transition-colors">
                View Directory <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="p-2 flex-1">
              <div className="flex flex-col">
                {tenantUsers.slice(0, 4).map((user, i) => (
                  <div key={user.id} className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors">
                    <div className="flex items-center gap-3">
                      <UserCircle className="w-8 h-8 text-slate-300" />
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-white leading-tight">{user.full_name}</p>
                        <p className="text-[10px] text-slate-500">{user.role} {user.team && `• ${user.team}`}</p>
                      </div>
                    </div>
                    <div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${user.status === 'Active' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>
                        {user.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Payroll Quick View */}
          <Card className="rounded-[1.5rem] border-none shadow-sm bg-white dark:bg-card overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-transparent">
              <div className="flex items-center gap-2">
                <Banknote className="w-4 h-4 text-slate-500" />
                <h3 className="font-bold text-slate-800 dark:text-white text-sm">Top Earners</h3>
              </div>
              <Link href="/hr/payroll" className="text-[10px] font-bold text-[#ff5a36] hover:text-[#e04a29] flex items-center gap-1 transition-colors">
                Full Payroll <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="p-2 flex-1">
              <div className="flex flex-col">
                {payrollData.map((user, i) => (
                  <div key={user.id} className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 font-bold text-xs">
                        #{i + 1}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-white leading-tight">{user.full_name}</p>
                        <p className="text-[10px] text-slate-500">{user.role}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-emerald-600">PKR {user.totalCompensation.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
                {payrollData.length === 0 && (
                  <div className="p-4 text-center text-slate-500 text-sm">No payroll data available.</div>
                )}
              </div>
            </div>
          </Card>

        </div>

      </div>
    </DashboardLayout>
  )
}
