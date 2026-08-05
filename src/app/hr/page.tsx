"use client"

import React, { useMemo, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card } from "@/components/ui/card"
import { useAppContext, UserRole } from "@/store/AppContext"
import { UsersRound, UserCheck, UserMinus, ShieldCheck, Banknote, Briefcase, Activity, ChevronRight, UserCircle, ArrowUpRight, PieChart as PieChartIcon, BarChart3 } from "lucide-react"
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LabelList } from 'recharts'
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
  const { hrEmployees, currentUser, isLoaded, formatCurrency } = useAppContext()

  const tenantUsers = currentUser
    ? (currentUser.role === "SuperAdmin" 
      ? hrEmployees 
      : hrEmployees.filter(u => u.organization_id === currentUser.tenantId))
    : []

  const activeStaff = tenantUsers.filter(u => u.status === "Active" && u.role !== "SuperAdmin");

  const payrollData = useMemo(() => {
    return activeStaff.map(user => {
      return {
        ...user,
        totalCompensation: Number(user.base_salary || 0) + Number(user.bonus || 0)
      };
    }).sort((a, b) => b.totalCompensation - a.totalCompensation).slice(0, 4); // Top 4 earners
  }, [activeStaff])

  const topEarnersChartData = useMemo(() => {
    return activeStaff.map(user => {
      return {
        name: user.full_name,
        base: Number(user.base_salary || 0),
        bonus: Number(user.bonus || 0),
        total: Number(user.base_salary || 0) + Number(user.bonus || 0)
      };
    }).sort((a, b) => b.total - a.total).slice(0, 5);
  }, [activeStaff])

  if (!isLoaded || !currentUser) {
    return (
      <DashboardLayout title="HR Command Center">
        <div className="flex items-center justify-center h-[50vh]">
          <div className="w-6 h-6 border-2 border-[#ff5a36] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    )
  }

  const totalEmployees = tenantUsers.length
  const activeEmployees = tenantUsers.filter(u => u.status === "Active").length
  const disabledEmployees = tenantUsers.filter(u => u.status === "Disabled").length
  
  const totalMonthlyPayroll = activeStaff.reduce((sum, user) => sum + Number(user.base_salary || 0) + Number(user.bonus || 0), 0);

  const jobTitleCounts = tenantUsers.reduce((acc, user) => {
    const title = user.job_title || 'Unassigned';
    acc[title] = (acc[title] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const roleDistributionData = Object.entries(jobTitleCounts).map(([name, value], index) => {
    const colors = ['#ff5a36', '#ff7a5c', '#ff9a82', '#ff8a50', '#ff6b3b', '#e65100', '#f57c00'];
    return { name, value, color: colors[index % colors.length] };
  });

  const CustomTooltipLabel = (props: any) => {
    const { x, y, value } = props;
    if (value === undefined || y === undefined || x === undefined) return null;
    return (
      <g filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.1))">
        <path d={`M${x-16},${y-28} h32 c2,0 4,2 4,4 v14 c0,2 -2,4 -4,4 h-10 l-6,6 l-6,-6 h-10 c-2,0 -4,-2 -4,-4 v-14 c0,-2 2,-4 4,-4 z`} fill="white" />
        <text x={x} y={y - 13} fill="#000" fontSize="11" fontWeight="900" textAnchor="middle">{value}</text>
      </g>
    );
  };

  return (
    <DashboardLayout title={`Welcome, ${currentUser.name}`}>
      <div className="relative flex flex-col gap-5 font-sans max-w-[1200px] mx-auto w-full pb-10 min-h-screen overflow-x-hidden px-4 md:px-0">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-gradient-to-br from-white/90 to-white/50 dark:from-slate-900/60 dark:to-slate-900/20 p-6 rounded-[1.5rem] border border-white/60 dark:border-slate-700/50 shadow-none backdrop-blur-2xl relative overflow-hidden min-h-[120px] group transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full duration-1000 transition-transform pointer-events-none" />
          <div className="relative z-10 w-full sm:w-2/3">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl md:text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 tracking-tight flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-[#ff7a5c] to-[#ff5a36] rounded-xl shadow-none">
                  <UsersRound className="w-5 h-5 text-white" />
                </div>
                Welcome, {currentUser.name}
              </h1>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base font-medium max-w-xl mt-3">
              Overview of your organization's human resources and payroll estimations.
            </p>
          </div>
          
          <div className="absolute right-0 bottom-0 top-0 h-full w-1/3 hidden sm:flex items-center justify-end pr-8 pointer-events-none">
             <img 
                src="/images/hr/png.png" 
                alt="HR illustration" 
                className="h-[110%] w-auto object-contain transition-transform duration-500 group-hover:scale-105 group-hover:rotate-2" 
             />
          </div>
        </div>

        {/* Global KPIs Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="rounded-2xl p-4 bg-white/70 dark:bg-slate-900/40 backdrop-blur-2xl border border-slate-200/60 dark:border-slate-700/50 shadow-none flex flex-row justify-between items-center transition-all hover:bg-white/90 dark:hover:bg-slate-800/60 duration-300">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Total Headcount</span>
              <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white">{totalEmployees}</h3>
            </div>
            <div className="w-20 h-20 shrink-0 transition-transform group-hover:scale-105 duration-300">
              <img src="/images/cards_icons/5.png" alt="Total" className="w-full h-full object-contain" />
            </div>
          </Card>

          <Card className="rounded-2xl p-4 bg-white/70 dark:bg-slate-900/40 backdrop-blur-2xl border border-slate-200/60 dark:border-slate-700/50 shadow-none flex flex-row justify-between items-center transition-all hover:bg-white/90 dark:hover:bg-slate-800/60 duration-300">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Active Staff</span>
              <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white">{activeEmployees}</h3>
            </div>
            <div className="w-20 h-20 shrink-0 transition-transform group-hover:scale-105 duration-300">
              <img src="/images/cards_icons/6.png" alt="Active" className="w-full h-full object-contain" />
            </div>
          </Card>

          <Card className="rounded-2xl p-4 bg-white/70 dark:bg-slate-900/40 backdrop-blur-2xl border border-slate-200/60 dark:border-slate-700/50 shadow-none flex flex-row justify-between items-center transition-all hover:bg-white/90 dark:hover:bg-slate-800/60 duration-300">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Disabled</span>
              <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white">{disabledEmployees}</h3>
            </div>
            <div className="w-20 h-20 shrink-0 transition-transform group-hover:scale-105 duration-300">
              <img src="/images/cards_icons/7.png" alt="Disabled" className="w-full h-full object-contain" />
            </div>
          </Card>

          <Card className="rounded-2xl p-4 bg-gradient-to-br from-[#ff7a5c]/90 to-[#ff5a36]/90 backdrop-blur-xl border border-white/30 text-white shadow-none flex flex-col justify-center transition-all duration-300 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
            
            <div className="flex flex-col relative z-10">
              <span className="text-[10px] font-bold text-white/90 uppercase tracking-wider mb-1">Est. Monthly Payroll</span>
              <h3 className="text-3xl font-extrabold text-white">PKR {formatCurrency(totalMonthlyPayroll)}</h3>
            </div>
          </Card>
        </div>

        {/* Quick Overviews Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* Employee Directory Quick View */}
          <Card className="rounded-[1.5rem] bg-white/70 dark:bg-slate-900/40 backdrop-blur-2xl border border-slate-200/60 dark:border-slate-700/50 shadow-none overflow-hidden flex flex-col transition-all hover:bg-white/90 dark:hover:bg-slate-800/60 duration-300">
            <div className="p-5 border-b border-slate-200/50 dark:border-slate-700/50 flex justify-between items-center bg-white/30 dark:bg-transparent">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-slate-100/50 dark:bg-slate-800/50 rounded-lg backdrop-blur-md">
                  <UsersRound className="w-4 h-4 text-slate-500" />
                </div>
                <h3 className="font-bold text-slate-800 dark:text-white text-base">Recent Employees</h3>
              </div>
              <Link href="/hr/employees" className="text-[11px] font-extrabold text-[#ff5a36] hover:text-[#e04a29] flex items-center gap-1 transition-colors px-3 py-1.5 rounded-full">
                View Directory <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="p-3 flex-1">
              <div className="flex flex-col gap-1">
                {tenantUsers.slice(0, 4).map((user, i) => (
                  <div key={user.id} className="flex items-center justify-between p-3 hover:bg-white/50 dark:hover:bg-slate-800/50 rounded-[1rem] transition-colors cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img 
                          src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || 'User')}&background=random&color=fff&size=100`} 
                          alt={user.full_name} 
                          className="w-10 h-10 rounded-full object-cover bg-slate-100" 
                        />
                        {user.status === 'Active' && <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-white leading-tight group-hover:text-[#ff5a36] transition-colors">{user.full_name}</p>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5">{user.role} {user.team && `• ${user.team}`}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col text-right">
                        <span className="text-xs font-bold text-slate-800 dark:text-white">
                          PKR {formatCurrency(Number(user.base_salary || 0))}
                        </span>
                        <span className="text-[9px] text-slate-400 font-medium">Basic Salary</span>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${user.status === 'Active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'}`}>
                        {user.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Payroll Quick View */}
          <Card className="rounded-[1.5rem] bg-white/70 dark:bg-slate-900/40 backdrop-blur-2xl border border-slate-200/60 dark:border-slate-700/50 shadow-none overflow-hidden flex flex-col transition-all hover:bg-white/90 dark:hover:bg-slate-800/60 duration-300">
            <div className="p-5 border-b border-slate-200/50 dark:border-slate-700/50 flex justify-between items-center bg-white/30 dark:bg-transparent">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-slate-100/50 dark:bg-slate-800/50 rounded-lg backdrop-blur-md">
                  <Banknote className="w-4 h-4 text-slate-500" />
                </div>
                <h3 className="font-bold text-slate-800 dark:text-white text-base">Top Earners List</h3>
              </div>
              <Link href="/hr/payroll" className="text-[11px] font-extrabold text-[#ff5a36] hover:text-[#e04a29] flex items-center gap-1 transition-colors px-3 py-1.5 rounded-full">
                Full Payroll <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="p-3 flex-1">
              <div className="flex flex-col gap-1">
                {payrollData.map((user, i) => (
                  <div key={user.id} className="flex items-center justify-between p-3 hover:bg-white/50 dark:hover:bg-slate-800/50 rounded-[1rem] transition-colors cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-sm transition-colors ${i === 0 ? 'bg-[#ff5a36]/10 text-[#ff5a36] group-hover:bg-[#ff5a36]/20' : i === 1 ? 'bg-amber-100 text-amber-600 group-hover:bg-amber-200' : i === 2 ? 'bg-slate-100 text-slate-600 group-hover:bg-slate-200' : 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400'}`}>
                        #{i + 1}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-white leading-tight group-hover:text-[#ff5a36] transition-colors">{user.full_name}</p>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5">{user.role}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-extrabold text-emerald-600">PKR {formatCurrency(user.totalCompensation)}</p>
                    </div>
                  </div>
                ))}
                {payrollData.length === 0 && (
                  <div className="p-6 text-center text-slate-500 text-sm font-medium">No payroll data available.</div>
                )}
              </div>
            </div>
          </Card>

        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Activity Trend Chart */}
          <Card className="rounded-[1.5rem] bg-white/70 dark:bg-slate-900/40 backdrop-blur-2xl border border-slate-200/60 dark:border-slate-700/50 shadow-none flex flex-col p-6 transition-all hover:bg-white/90 dark:hover:bg-slate-800/60 duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-slate-100/50 dark:bg-slate-800/50 rounded-xl backdrop-blur-md">
                <Activity className="w-5 h-5 text-slate-500" />
              </div>
              <h3 className="font-bold text-slate-800 dark:text-white text-base">Role Distribution</h3>
            </div>
            <div className="flex-1 min-h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={roleDistributionData} margin={{ top: 40, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(226, 232, 240, 0.5)" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#ff5a36" 
                    strokeWidth={3} 
                    dot={{ r: 5, fill: '#ff5a36', strokeWidth: 2, stroke: '#ffffff' }}
                    activeDot={{ r: 7 }}
                  >
                    <LabelList content={<CustomTooltipLabel />} dataKey="value" position="top" />
                  </Line>
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Top Earners Bar Chart */}
          <Card className="rounded-[1.5rem] bg-white/70 dark:bg-slate-900/40 backdrop-blur-2xl border border-slate-200/60 dark:border-slate-700/50 shadow-none flex flex-col p-6 transition-all hover:bg-white/90 dark:hover:bg-slate-800/60 duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-slate-100/50 dark:bg-slate-800/50 rounded-xl backdrop-blur-md">
                <BarChart3 className="w-5 h-5 text-slate-500" />
              </div>
              <h3 className="font-bold text-slate-800 dark:text-white text-base">Top Earners Compensation</h3>
            </div>
            <div className="flex-1 min-h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topEarnersChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ff5a36" stopOpacity={1} />
                      <stop offset="100%" stopColor="#ff7a5c" stopOpacity={0.8} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(226, 232, 240, 0.5)" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }}
                    tickFormatter={(value) => `₨${value >= 1000 ? (value/1000) + 'k' : value}`}
                  />
                  <RechartsTooltip 
                    cursor={{ fill: 'rgba(255, 90, 54, 0.05)' }}
                    contentStyle={{ borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="total" name="Total Compensation" fill="url(#barGrad)" radius={[6, 6, 0, 0]} barSize={40}>
                    {topEarnersChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} style={{ filter: 'drop-shadow(0px 4px 6px rgba(255,90,54,0.3))' }} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

      </div>
    </DashboardLayout>
  )
}
