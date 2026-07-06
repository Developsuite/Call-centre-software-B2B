"use client"

import React, { useState, useMemo } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card } from "@/components/ui/card"
import { useAppContext } from "@/store/AppContext"
import { 
  Users, 
  Briefcase, 
  TrendingUp, 
  TrendingDown,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  BarChart3,
  Trophy,
  ShieldCheck,
  CalendarDays,
  RefreshCw,
  Download,
  User
} from "lucide-react"
import { cn } from "@/lib/utils"
import { exportToCSV } from "@/lib/export"

export default function AdminDashboardPage() {
  const { sales, currentUser, isLoaded } = useAppContext()
  
  // Filter States
  const [filterType, setFilterType] = useState<"all" | "team" | "agent" | "processor">("all")
  const [filterValue, setFilterValue] = useState<string>("All")
  const [timeFilter, setTimeFilter] = useState<"all" | "today" | "week" | "month" | "past_month">("all")

  // Isolate sales to the current Tenant (SuperAdmins see all)
  const tenantSales = currentUser?.role === "SuperAdmin" 
    ? sales 
    : sales.filter(s => s.tenantId === currentUser?.tenantId)

  // Extract unique lists for dropdowns
  const uniqueTeams = Array.from(new Set(tenantSales.map(s => s.team).filter(Boolean)))
  const uniqueAgents = Array.from(new Set(tenantSales.map(s => s.agent).filter(Boolean)))
  const uniqueProcessors = Array.from(new Set(tenantSales.map(s => s.processorName).filter(Boolean)))

  // Handle changing filter type (reset value)
  const handleFilterTypeChange = (type: "all" | "team" | "agent" | "processor") => {
    setFilterType(type)
    setFilterValue(
      type === "all" ? "All" : 
      type === "team" ? (uniqueTeams[0] || "") : 
      type === "agent" ? (uniqueAgents[0] || "") : 
      (uniqueProcessors[0] || "")
    )
  }

  // 1. FILTER SALES based on selection and time
  const filteredSales = useMemo(() => {
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())).setHours(0,0,0,0)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
    const startOfPastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime()
    const endOfPastMonth = startOfMonth - 1

    return tenantSales.filter(sale => {
      // Time Filter
      if (timeFilter === "today" && sale.timestamp < startOfToday) return false
      if (timeFilter === "week" && sale.timestamp < startOfWeek) return false
      if (timeFilter === "month" && sale.timestamp < startOfMonth) return false
      if (timeFilter === "past_month" && (sale.timestamp < startOfPastMonth || sale.timestamp > endOfPastMonth)) return false

      // Entity Filter
      if (filterType === "all") return true
      if (filterType === "team") return sale.team === filterValue
      if (filterType === "agent") return sale.agent === filterValue
      if (filterType === "processor") return sale.processorName === filterValue
      return true
    })
  }, [tenantSales, filterType, filterValue, timeFilter])

  // 2. CALCULATE KPIs for the filtered dataset
  const totalVolume = filteredSales.length
  const connectedCount = filteredSales.filter(s => s.status === "Connected").length
  const rejectedCount = filteredSales.filter(s => s.status === "Rejected").length
  const pendingCount = filteredSales.filter(s => s.status === "Pending" || s.status === "In Process").length
  const needInfoCount = filteredSales.filter(s => s.status === "Need Info").length
  const convRate = totalVolume > 0 ? Math.round((connectedCount / totalVolume) * 100) : 0

  // 3. AGENT LEADERBOARD (Regardless of filter, but scoped if needed. Usually scoped to the filtered sales)
  const agentStatsMap = new Map<string, { total: number, connected: number, rejected: number, pending: number, needInfo: number }>()
  
  filteredSales.forEach(sale => {
    const current = agentStatsMap.get(sale.agent) || { total: 0, connected: 0, rejected: 0, pending: 0, needInfo: 0 }
    current.total += 1
    if (sale.status === "Connected") current.connected += 1
    if (sale.status === "Rejected") current.rejected += 1
    if (sale.status === "Pending" || sale.status === "In Process") current.pending += 1
    if (sale.status === "Need Info") current.needInfo += 1
    agentStatsMap.set(sale.agent, current)
  })

  const agentLeaderboard = Array.from(agentStatsMap.entries())
    .map(([agent, stats]) => ({
      agent,
      ...stats,
      convRate: stats.total > 0 ? Math.round((stats.connected / stats.total) * 100) : 0
    }))
    .sort((a, b) => b.connected - a.connected || b.total - a.total) // Sort by most connected, then most volume

  // 4. PROCESSOR STATS
  const processorStatsMap = new Map<string, { totalHandled: number, connected: number, rejected: number, needInfo: number }>()
  const selfProcessedStatsMap = new Map<string, { totalHandled: number, connected: number, rejected: number, needInfo: number }>()
  
  filteredSales.forEach(sale => {
    // Only track if a processor actually interacted with it (has a processorName)
    if (sale.processorName) {
      const isSelfProcessed = sale.processor_id === sale.agent_id;
      const targetMap = isSelfProcessed ? selfProcessedStatsMap : processorStatsMap;
      const keyName = isSelfProcessed ? `${sale.processorName} (Myself)` : sale.processorName;
      
      const current = targetMap.get(keyName) || { totalHandled: 0, connected: 0, rejected: 0, needInfo: 0 }
      current.totalHandled += 1
      if (sale.status === "Connected") current.connected += 1
      if (sale.status === "Rejected") current.rejected += 1
      if (sale.status === "Need Info") current.needInfo += 1
      targetMap.set(keyName, current)
    }
  })

  const processorStats = Array.from(processorStatsMap.entries())
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.totalHandled - a.totalHandled)

  const selfProcessedStats = Array.from(selfProcessedStatsMap.entries())
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.totalHandled - a.totalHandled)



  const handleExport = () => {
    const headers = ["Sale ID", "Date", "Customer", "Account Type", "Status", "Agent", "Team", "Processor"];
    const keys = ["id", "timestamp", "customer", "accountType", "status", "agent", "team", "processorName"];
    
    // Convert timestamp to readable date for export
    const rows = filteredSales.map(s => ({
      ...s,
      timestamp: new Date(s.timestamp).toLocaleString(),
      team: s.team || "None",
      processorName: s.processorName || "Unassigned"
    }));

    exportToCSV(`Sales_Report_${new Date().toISOString().split('T')[0]}.csv`, rows, headers, keys);
  };

  if (!isLoaded) {
    return (
      <DashboardLayout title="Manager & Admin Hub">
        <div className="flex items-center justify-center h-[50vh]">
          <div className="w-6 h-6 border-2 border-[#ff5a36] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!currentUser || (currentUser.role !== "Admin" && currentUser.role !== "SuperAdmin")) {
    return (
      <DashboardLayout title="Access Denied">
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
          <ShieldCheck className="w-16 h-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Access Restricted</h2>
          <p className="text-slate-500 max-w-md">This area is reserved for Local Admins to view their Call Centre analytics.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Manager & Admin Hub">
      <div className="flex flex-col gap-6 font-sans max-w-[1400px] mx-auto w-full pb-10">
        
        {/* Header & Interactive Filters */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white/50 dark:bg-card/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-md">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
                <ShieldCheck className="w-8 h-8 text-[#ff5a36]" />
                Performance Command Center
              </h1>
              <div className="flex items-center gap-2 ml-4">
                <button 
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold hover:bg-blue-200 dark:hover:bg-blue-500/20 transition-all shadow-sm"
                  title="Export currently filtered sales to CSV"
                >
                  <Download className="w-4 h-4" /> Export CSV
                </button>
              </div>
            </div>
            <p className="text-slate-500 text-sm max-w-xl">Monitor team performances, analyze individual employee outputs, and track processor efficiency across the entire platform.</p>
          </div>

          <div className="flex flex-col gap-2 shrink-0">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <CalendarDays className="w-3 h-3" /> Time Period
            </label>
            <select 
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value as any)}
                className="h-9 px-3 text-sm font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-1 focus:ring-[#ff5a36] text-slate-800 dark:text-white cursor-pointer w-full"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="past_month">Past Month</option>
            </select>
          </div>

          <div className="flex flex-col gap-2 shrink-0 border-l border-slate-200 dark:border-slate-700 pl-4">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="w-3 h-3" /> Entity Scope
            </label>
            <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl w-fit border border-slate-200 dark:border-slate-800">
              <button 
                onClick={() => handleFilterTypeChange("all")}
                className={cn("px-4 py-2 rounded-lg text-xs font-bold transition-all", filterType === "all" ? "bg-white dark:bg-slate-800 shadow-sm text-[#ff5a36]" : "text-slate-500 hover:text-slate-800 dark:hover:text-white")}
              >
                Company Wide
              </button>
              <button 
                onClick={() => handleFilterTypeChange("team")}
                className={cn("px-4 py-2 rounded-lg text-xs font-bold transition-all", filterType === "team" ? "bg-white dark:bg-slate-800 shadow-sm text-[#ff5a36]" : "text-slate-500 hover:text-slate-800 dark:hover:text-white")}
              >
                By Team
              </button>
              <button 
                onClick={() => handleFilterTypeChange("agent")}
                className={cn("px-4 py-2 rounded-lg text-xs font-bold transition-all", filterType === "agent" ? "bg-white dark:bg-slate-800 shadow-sm text-[#ff5a36]" : "text-slate-500 hover:text-slate-800 dark:hover:text-white")}
              >
                By Agent
              </button>
              <button 
                onClick={() => handleFilterTypeChange("processor")}
                className={cn("px-4 py-2 rounded-lg text-xs font-bold transition-all", filterType === "processor" ? "bg-white dark:bg-slate-800 shadow-sm text-[#ff5a36]" : "text-slate-500 hover:text-slate-800 dark:hover:text-white")}
              >
                By Processor
              </button>
            </div>

            {/* Dynamic Secondary Dropdown */}
            {filterType !== "all" && (
              <select 
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
                className="mt-2 h-9 px-3 text-sm font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-1 focus:ring-[#ff5a36] text-[#ff5a36] cursor-pointer w-full"
              >
                {filterType === "team" && uniqueTeams.map(t => <option key={t} value={t}>{t}</option>)}
                {filterType === "agent" && uniqueAgents.map(a => <option key={a} value={a}>{a}</option>)}
                {filterType === "processor" && uniqueProcessors.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            )}
          </div>
        </div>

        {/* Global KPIs Row */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="rounded-[1.5rem] p-5 bg-white dark:bg-card border-none shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Sales</span>
              <BarChart3 className="w-4 h-4 text-[#ff5a36]" />
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-bold text-slate-800 dark:text-white">{totalVolume}</h3>
              <p className="text-[10px] text-slate-400 font-medium mt-1">Submitted applications</p>
            </div>
          </Card>

          <Card className="rounded-[1.5rem] p-5 bg-gradient-to-br from-[#ff7a5c] to-[#ff5a36] text-white border-none shadow-[0_8px_20px_rgba(255,90,54,0.2)] flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-white/90 uppercase tracking-wider">Conv. Rate</span>
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-bold text-white">{convRate}%</h3>
              <p className="text-[10px] text-white/70 font-medium mt-1">Overall success rate</p>
            </div>
          </Card>

          <Card className="rounded-[1.5rem] p-5 bg-white dark:bg-card border-none shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Connected</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-bold text-slate-800 dark:text-white">{connectedCount}</h3>
              <p className="text-[10px] text-emerald-500 font-bold mt-1">Successfully processed</p>
            </div>
          </Card>

          <Card className="rounded-[1.5rem] p-5 bg-white dark:bg-card border-none shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rejected</span>
              <XCircle className="w-4 h-4 text-red-500" />
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-bold text-slate-800 dark:text-white">{rejectedCount}</h3>
              <p className="text-[10px] text-red-500 font-bold mt-1">Declined applications</p>
            </div>
          </Card>

          <Card className="rounded-[1.5rem] p-5 bg-white dark:bg-card border-none shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Queue Health</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-bold text-slate-800 dark:text-white">{pendingCount}</h3>
              <div className="flex gap-2 mt-1">
                <span className="text-[10px] text-amber-500 font-bold">+{needInfoCount} Need Info</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Dynamic CSS Bar Chart for Team Performance */}
        <Card className="rounded-[1.5rem] p-6 bg-white dark:bg-card border-none shadow-sm flex flex-col mb-4">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#ff5a36]" />
                Team Volume vs Connections
              </h3>
              <p className="text-xs text-slate-500 mt-1">Comparing total pipeline against successful conversions across active teams.</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">
                <span className="w-3 h-3 rounded bg-slate-200 dark:bg-slate-700"></span> Total Sales
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">
                <span className="w-3 h-3 rounded bg-[#ff5a36]"></span> Connected
              </div>
            </div>
          </div>
          
          <div className="h-64 flex items-end gap-12 justify-around px-8 pt-4 pb-2 border-b border-slate-100 dark:border-slate-800 relative">
            {/* Y-Axis guide lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-2">
              {[4, 3, 2, 1, 0].map(i => (
                <div key={i} className="w-full border-b border-dashed border-slate-100 dark:border-slate-800 flex items-center text-[10px] text-slate-400">
                  <span className="-ml-6 bg-white dark:bg-card px-1 absolute">{i === 0 ? 0 : 'Max'}</span>
                </div>
              ))}
            </div>

            {uniqueTeams.map((team, idx) => {
              const teamSales = filteredSales.filter(s => s.team === team);
              const teamConnected = teamSales.filter(s => s.status === "Connected").length;
              const teamVolume = teamSales.length;
              
              // Find max volume across all teams to calculate relative percentage height
              const allVolumes = uniqueTeams.map(t => filteredSales.filter(s => s.team === t).length);
              const maxVolume = Math.max(...allVolumes, 10); // Minimum scale of 10 to prevent 100% height for tiny numbers

              const volumeHeight = teamVolume > 0 ? (teamVolume / maxVolume) * 100 : 0;
              const connectedHeight = teamConnected > 0 ? (teamConnected / maxVolume) * 100 : 0;

              if (volumeHeight === 0 && connectedHeight === 0) return null; // Hide empty teams

              return (
                <div key={team} className="relative z-10 flex flex-col items-center gap-2 h-full justify-end w-full max-w-[80px] group">
                  <div className="flex items-end gap-1.5 w-full h-full justify-center">
                    {/* Total Sales Bar */}
                    <div className="w-1/2 bg-slate-200 dark:bg-slate-700 rounded-t-md relative flex flex-col justify-end transition-all duration-500 hover:brightness-95" style={{ height: `${volumeHeight}%` }}>
                      <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-slate-600 dark:text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        {teamVolume}
                      </span>
                    </div>
                    {/* Connected Bar */}
                    <div className="w-1/2 bg-[#ff5a36] rounded-t-md relative flex flex-col justify-end transition-all duration-500 hover:brightness-110 shadow-[0_0_15px_rgba(255,90,54,0.3)]" style={{ height: `${connectedHeight}%` }}>
                       <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-[#ff5a36] opacity-0 group-hover:opacity-100 transition-opacity">
                        {teamConnected}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300 text-center uppercase tracking-wider">{team}</span>
                </div>
              );
            })}
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2">
          
          {/* Agent Leaderboard */}
          <Card className="rounded-[2rem] border-none shadow-sm bg-white dark:bg-card flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-transparent">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#ff5a36]/10 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-[#ff5a36]" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white">Agent Leaderboard</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Ranked by Connections & Volume</p>
                </div>
              </div>
            </div>
            <div className="p-2 overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800 uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Rank</th>
                    <th className="py-3 px-4">Agent Name</th>
                    <th className="py-3 px-4 text-center">Volume</th>
                    <th className="py-3 px-4 text-center text-emerald-500">Conn.</th>
                    <th className="py-3 px-4 text-center text-red-500">Rej.</th>
                    <th className="py-3 px-4 text-right">Conv. Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {agentLeaderboard.length > 0 ? agentLeaderboard.map((agent, i) => (
                    <tr key={agent.agent} className="border-b border-slate-50 dark:border-slate-800/50 last:border-none hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4">
                        {i === 0 && <span className="w-6 h-6 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center text-xs font-bold">1</span>}
                        {i === 1 && <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold">2</span>}
                        {i === 2 && <span className="w-6 h-6 rounded-full bg-amber-100/50 text-amber-700 flex items-center justify-center text-xs font-bold">3</span>}
                        {i > 2 && <span className="text-slate-400 font-bold ml-2">{i + 1}</span>}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800 dark:text-white">{agent.agent}</td>
                      <td className="py-3 px-4 text-center font-medium text-slate-600 dark:text-slate-400">{agent.total}</td>
                      <td className="py-3 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400">{agent.connected}</td>
                      <td className="py-3 px-4 text-center font-medium text-red-400">{agent.rejected}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 font-bold text-xs">
                          {agent.convRate}%
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 text-sm italic">No agent data matches this filter.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Processor Efficiency & Output */}
          <Card className="rounded-[2rem] border-none shadow-sm bg-white dark:bg-card flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-transparent">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#ff5a36]/10 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-[#ff5a36]" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white">Processor Efficiency</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Output and action rates</p>
                </div>
              </div>
            </div>
            <div className="p-2 overflow-x-auto flex-1">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800 uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Processor Name</th>
                    <th className="py-3 px-4 text-center">Handled</th>
                    <th className="py-3 px-4 text-center text-emerald-500">Approved</th>
                    <th className="py-3 px-4 text-center text-amber-500">Need Info</th>
                    <th className="py-3 px-4 text-center text-red-500">Declined</th>
                  </tr>
                </thead>
                <tbody>
                  {processorStats.length > 0 ? processorStats.map((proc) => (
                    <tr key={proc.name} className="border-b border-slate-50 dark:border-slate-800/50 last:border-none hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Briefcase className="w-3 h-3 text-[#ff5a36]" />
                        {proc.name}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-800 dark:text-white">{proc.totalHandled}</td>
                      <td className="py-3 px-4 text-center font-medium text-emerald-600">{proc.connected}</td>
                      <td className="py-3 px-4 text-center font-medium text-amber-600">{proc.needInfo}</td>
                      <td className="py-3 px-4 text-center font-medium text-red-400">{proc.rejected}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 text-sm italic">No processor data matches this filter.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

        </div>

        {/* Self-Processing Agents */}
        {selfProcessedStats.length > 0 && (
          <Card className="rounded-[2rem] border-none shadow-sm bg-white dark:bg-card flex flex-col overflow-hidden mt-6">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-transparent">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-indigo-500" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white">Self-Processing Agents</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Agents who processed their own sales</p>
                </div>
              </div>
            </div>
            <div className="p-2 overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800 uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Agent Name</th>
                    <th className="py-3 px-4 text-center">Handled</th>
                    <th className="py-3 px-4 text-center text-emerald-500">Approved</th>
                    <th className="py-3 px-4 text-center text-amber-500">Need Info</th>
                    <th className="py-3 px-4 text-center text-red-500">Declined</th>
                  </tr>
                </thead>
                <tbody>
                  {selfProcessedStats.map((proc) => (
                    <tr key={proc.name} className="border-b border-slate-50 dark:border-slate-800/50 last:border-none hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <User className="w-3 h-3 text-indigo-500" />
                        {proc.name}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-800 dark:text-white">{proc.totalHandled}</td>
                      <td className="py-3 px-4 text-center font-medium text-emerald-600">{proc.connected}</td>
                      <td className="py-3 px-4 text-center font-medium text-amber-600">{proc.needInfo}</td>
                      <td className="py-3 px-4 text-center font-medium text-red-400">{proc.rejected}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
