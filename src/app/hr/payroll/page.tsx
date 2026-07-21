"use client"

import React, { useState, useMemo } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useAppContext, UserRole } from "@/store/AppContext"
import { Search, Banknote, Download, ArrowUpRight } from "lucide-react"

// Mock base salaries
const BASE_SALARIES: Record<UserRole, number> = {
  SuperAdmin: 0,
  Admin: 5000,
  HR: 4000,
  Processor: 3500,
  Agent: 3000
}

export default function HRPayrollPage() {
  const { users, sales, currentUser, isLoaded } = useAppContext()
  const [searchQuery, setSearchQuery] = useState("")

  if (!isLoaded || !currentUser) {
    return (
      <DashboardLayout title="Payroll Overview">
        <div className="flex items-center justify-center h-[50vh]">
          <div className="w-6 h-6 border-2 border-[#ff5a36] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    )
  }

  // Isolate to current org
  const tenantUsers = currentUser.role === "SuperAdmin" 
    ? users 
    : users.filter(u => u.tenantId === currentUser.tenantId)

  // Filter out disabled or SuperAdmins from payroll
  const activeStaff = tenantUsers.filter(u => u.status === "Active" && u.role !== "SuperAdmin")

  const payrollData = useMemo(() => {
    return activeStaff.map(user => {
      const baseSalary = BASE_SALARIES[user.role as UserRole] || 3000;
      let bonus = 0;

      // Simple mocked bonus calculation: $50 per connected sale
      if (user.role === "Agent") {
        const agentSales = sales.filter(s => s.agent_id === user.id && s.status === "Connected");
        bonus = agentSales.length * 50;
      } else if (user.role === "Processor") {
        const processorSales = sales.filter(s => s.processor_id === user.id && s.status === "Connected");
        bonus = processorSales.length * 20; // $20 per processed connection
      }

      const totalCompensation = baseSalary + bonus;

      return {
        ...user,
        baseSalary,
        bonus,
        totalCompensation
      };
    }).filter(u => 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => b.totalCompensation - a.totalCompensation);
  }, [activeStaff, sales, searchQuery])

  const totalPayroll = payrollData.reduce((sum, item) => sum + item.totalCompensation, 0);

  return (
    <DashboardLayout title="Payroll Overview">
      <div className="flex flex-col gap-6 font-sans max-w-[1200px] mx-auto w-full pb-10">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white/50 dark:bg-card/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-md">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="bg-emerald-100 dark:bg-emerald-500/10 p-2 rounded-xl text-emerald-600">
                <Banknote className="w-5 h-5" />
              </div>
              <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Payroll Overview</h1>
            </div>
            <p className="text-slate-500 text-sm">Estimated compensation including performance bonuses.</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input 
                type="text" 
                placeholder="Search staff..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-full h-9 text-sm w-48 sm:w-64 shadow-sm focus-visible:ring-1 focus-visible:ring-emerald-500" 
              />
            </div>
            
            <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all shadow-sm">
              <Download className="w-4 h-4" /> Export
            </button>
          </div>
        </div>

        <Card className="rounded-[1.5rem] p-0 bg-white dark:bg-card border-none shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-transparent">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white">Current Period Estimations</h3>
              <p className="text-[11px] text-slate-500 font-medium">Base salary + estimated sales commissions</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Total Estimated Run</p>
              <h2 className="text-2xl font-bold text-emerald-600">${totalPayroll.toLocaleString()}</h2>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-900/50">
                <tr className="text-slate-500 font-medium border-b border-slate-100 dark:border-slate-800 text-xs uppercase tracking-wider">
                  <th className="py-4 px-6 font-bold">Staff Member</th>
                  <th className="py-4 px-6 font-bold">Role</th>
                  <th className="py-4 px-6 font-bold text-right">Base Salary</th>
                  <th className="py-4 px-6 font-bold text-right text-emerald-500">Est. Bonus</th>
                  <th className="py-4 px-6 font-bold text-right">Total Comp.</th>
                </tr>
              </thead>
              <tbody>
                {payrollData.map((item, i) => {
                  const isLast = i === payrollData.length - 1

                  return (
                    <tr key={item.id} className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors ${!isLast ? 'border-b border-slate-50 dark:border-slate-800/50' : ''}`}>
                      <td className="py-4 px-6">
                        <span className="font-bold text-slate-800 dark:text-white block">{item.name}</span>
                        {item.team && <span className="text-[10px] text-slate-400">{item.team}</span>}
                      </td>
                      <td className="py-4 px-6">
                        <span className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md text-xs font-bold text-slate-600 dark:text-slate-300">
                          {item.role}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right font-medium text-slate-600 dark:text-slate-400">
                        ${item.baseSalary.toLocaleString()}
                      </td>
                      <td className="py-4 px-6 text-right">
                        {item.bonus > 0 ? (
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-md text-xs">
                            <ArrowUpRight className="w-3 h-3" />
                            ${item.bonus.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span className="font-bold text-slate-800 dark:text-white text-base">
                          ${item.totalCompensation.toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  )
                })}
                {payrollData.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-500">
                      No staff members found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
