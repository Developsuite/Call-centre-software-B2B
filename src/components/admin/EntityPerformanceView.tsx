"use client"

import React, { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useAppContext, Sale } from "@/store/AppContext"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  BarChart3,
  TrendingUp,
  Briefcase,
  Eye,
  Zap,
  Pencil,
  Trash2,
  FileText,
  ChevronDown,
  CalendarDays
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface EntityPerformanceViewProps {
  entityType: "Agent" | "Processor" | "Team";
  entityName: string; // the name we filter by
}

export function EntityPerformanceView({ entityType, entityName }: EntityPerformanceViewProps) {
  const { sales, currentUser, isLoaded, deleteSale, users, updateUserTeamAndLeadStatus } = useAppContext()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [dateFilter, setDateFilter] = useState("This Month")
  const [customDate, setCustomDate] = useState("")
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  if (!isLoaded || !currentUser) {
    return (
      <DashboardLayout title={`${entityType} Details`}>
        <div className="flex items-center justify-center h-[50vh]">
          <div className="w-6 h-6 border-2 border-[#ff5a36] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    )
  }

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) newSet.delete(id)
      else newSet.add(id)
      return newSet
    })
  }

  // Logical Shift Date
  const getLogicalShiftDate = (timestamp: number) => {
    const d = new Date(timestamp - 5 * 60 * 60 * 1000)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const todayStr = getLogicalShiftDate(Date.now())
  const yesterdayStr = getLogicalShiftDate(Date.now() - 24 * 60 * 60 * 1000)

  // 1. Isolate to current org
  const tenantSales = currentUser.role === "SuperAdmin" 
    ? sales 
    : sales.filter(s => s.tenantId === currentUser.tenantId)

  // 2. Isolate to entity
  const entitySales = tenantSales.filter(s => {
    if (entityType === "Agent") return s.agent === entityName || s.agent_id === entityName
    if (entityType === "Processor") return s.processorName === entityName || s.processor_id === entityName
    if (entityType === "Team") return s.team === entityName || s.team_name === entityName
    return false
  })

  // 3. Date Filter
  const dateFilteredSales = entitySales.filter(sale => {
    let matchesDate = true
    const saleDateStr = getLogicalShiftDate(sale.timestamp)
    if (dateFilter === "Today") {
      matchesDate = saleDateStr === todayStr
    } else if (dateFilter === "Yesterday") {
      matchesDate = saleDateStr === yesterdayStr
    } else if (dateFilter === "This Week") {
      const daysDiff = (new Date(todayStr).getTime() - new Date(saleDateStr).getTime()) / (1000 * 3600 * 24)
      matchesDate = daysDiff >= 0 && daysDiff < 7
    } else if (dateFilter === "This Month") {
      matchesDate = saleDateStr.substring(0, 7) === todayStr.substring(0, 7)
    } else if (dateFilter === "Specific Date" && customDate) {
      matchesDate = saleDateStr === customDate
    }
    return matchesDate
  })

  // 4. Status and Search Filter
  const finalSales = dateFilteredSales
    .filter(sale => {
      const matchesSearch = sale.customer.toLowerCase().includes(searchQuery.toLowerCase()) || sale.id.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesFilter = statusFilter === "All" || sale.status === statusFilter
      return matchesSearch && matchesFilter
    })
    .sort((a, b) => b.timestamp - a.timestamp)

  // Compute Metrics
  const totalVolume = dateFilteredSales.length
  const connectedCount = dateFilteredSales.filter(s => s.status === "Connected").length
  const rejectedCount = dateFilteredSales.filter(s => s.status === "Rejected").length
  const convRate = totalVolume > 0 ? Math.round((connectedCount / totalVolume) * 100) : 0

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    })
  }

  return (
    <DashboardLayout title={`${entityType} Performance`}>
      <div className="flex flex-col gap-6 font-sans max-w-[1400px] mx-auto w-full pb-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 bg-white/50 dark:bg-card/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-md">
          <div className="flex flex-col gap-4 w-full">
            <div className="flex items-center gap-3">
              <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-xl text-slate-500">
                {entityType === "Agent" ? <HeadsetIcon className="w-5 h-5" /> : entityType === "Team" ? <UsersIcon className="w-5 h-5" /> : <Briefcase className="w-5 h-5" />}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
                  {entityName}
                  {users.find(u => u.name === entityName)?.isTeamLead && (
                    <span className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs px-2 py-0.5 rounded-full font-bold tracking-wider uppercase border border-amber-200 dark:border-amber-800/50">
                      Team Lead
                    </span>
                  )}
                </h1>
                <p className="text-slate-500 text-sm">{entityType} Performance Overview</p>
              </div>
            </div>

            {(entityType === "Agent" || entityType === "Processor") && (currentUser.role === "Admin" || currentUser.role === "SuperAdmin") && (() => {
              const profile = users.find(u => u.name === entityName);
              if (!profile) return null;
              
              const allTeams = Array.from(new Set(users.map(u => u.team).filter(Boolean))) as string[];
              
              return (
                <div className="mt-2 flex items-center gap-4 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm w-fit">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Team Lead:</label>
                    <button 
                      onClick={() => updateUserTeamAndLeadStatus(profile.id, profile.team || "", !profile.isTeamLead)}
                      className={cn(
                        "w-10 h-5 rounded-full transition-colors relative",
                        profile.isTeamLead ? "bg-[#ff5a36]" : "bg-slate-300 dark:bg-slate-700"
                      )}
                    >
                      <span className={cn(
                        "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all",
                        profile.isTeamLead ? "left-[22px]" : "left-0.5"
                      )} />
                    </button>
                  </div>
                  <div className="w-px h-6 bg-slate-200 dark:bg-slate-800"></div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Team:</label>
                    <select 
                      value={profile.team || ""}
                      onChange={(e) => {
                        let newTeam = e.target.value;
                        if (newTeam === "CREATE_NEW") {
                          newTeam = prompt("Enter new team name:") || profile.team || "";
                        }
                        if (newTeam) updateUserTeamAndLeadStatus(profile.id, newTeam, profile.isTeamLead);
                      }}
                      className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-sm px-2 py-1 outline-none focus:border-[#ff5a36]"
                    >
                      <option value="" disabled>Select Team...</option>
                      {allTeams.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                      <option value="CREATE_NEW" className="font-bold text-[#ff5a36]">+ Create New Team</option>
                    </select>
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="flex flex-col gap-2 shrink-0 md:items-end">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <CalendarDays className="w-3 h-3" /> Time Period
            </label>
            <DropdownMenu>
              <DropdownMenuTrigger className="h-9 px-4 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold shadow-sm flex items-center gap-2">
                {dateFilter === "All Time" ? "All Time" : dateFilter} <ChevronDown className="w-4 h-4 text-slate-400" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuRadioGroup value={dateFilter} onValueChange={setDateFilter}>
                  <DropdownMenuRadioItem value="All Time">All Time</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="Today">Today</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="Yesterday">Yesterday</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="This Week">This Week</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="This Month">This Month</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="Specific Date">Specific Date...</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Global KPIs Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="rounded-[1.5rem] p-5 bg-white dark:bg-card border-none shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Sales</span>
              <BarChart3 className="w-4 h-4 text-[#ff5a36]" />
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-bold text-slate-800 dark:text-white">{totalVolume}</h3>
            </div>
          </Card>

          <Card className="rounded-[1.5rem] p-5 bg-gradient-to-br from-[#ff7a5c] to-[#ff5a36] text-white border-none shadow-[0_8px_20px_rgba(255,90,54,0.2)] flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-white/90 uppercase tracking-wider">Conv. Rate</span>
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-bold text-white">{convRate}%</h3>
            </div>
          </Card>

          <Card className="rounded-[1.5rem] p-5 bg-white dark:bg-card border-none shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Connected</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-bold text-slate-800 dark:text-white">{connectedCount}</h3>
            </div>
          </Card>

          <Card className="rounded-[1.5rem] p-5 bg-white dark:bg-card border-none shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rejected</span>
              <XCircle className="w-4 h-4 text-red-500" />
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-bold text-slate-800 dark:text-white">{rejectedCount}</h3>
            </div>
          </Card>
        </div>

        {/* Detailed Table */}
        <Card className="rounded-[1.5rem] border-none shadow-sm p-5 flex flex-col flex-1">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h3 className="font-bold text-slate-800 dark:text-white text-lg">Sales History</h3>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input 
                  type="text" 
                  placeholder="Search ID or Customer" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-full h-9 text-sm w-48 shadow-sm focus-visible:ring-1 focus-visible:ring-[#ff5a36]" 
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar mb-4 shrink-0">
            {["All", "Pending", "In Process", "Need Info", "Processed", "Connected", "Rejected"].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border",
                  statusFilter === status 
                    ? "bg-[#ff5a36] text-white border-[#ff5a36] shadow-md shadow-[#ff5a36]/20" 
                    : "bg-white dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-[#ff5a36]/50 hover:bg-slate-50 dark:hover:bg-slate-800"
                )}
              >
                {status === "All" ? "All Sales" : status}
                <span className={cn(
                  "ml-2 px-1.5 py-0.5 rounded-md text-[10px]",
                  statusFilter === status 
                    ? "bg-white/20 text-white" 
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                )}>
                  {status === "All" ? dateFilteredSales.length : dateFilteredSales.filter(s => s.status === status).length}
                </span>
              </button>
            ))}
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-slate-400 font-medium border-b border-slate-100 dark:border-border">
                  <th className="pb-3 px-3 font-medium">Sale ID</th>
                  <th className="pb-3 px-3 font-medium">Customer</th>
                  {entityType !== "Agent" && <th className="pb-3 px-3 font-medium">Agent</th>}
                  {entityType !== "Processor" && <th className="pb-3 px-3 font-medium">Processor</th>}
                  <th className="pb-3 px-3 font-medium">Status</th>
                  <th className="pb-3 px-3 font-medium hidden sm:table-cell">Date</th>
                  <th className="pb-3 px-3"></th>
                </tr>
              </thead>
              <tbody>
                {finalSales.map((row, i) => {
                  const statusColors: Record<string, string> = {
                    "Pending": "bg-red-500", "In Process": "bg-yellow-400", "Processed": "bg-emerald-500", 
                    "Connected": "bg-blue-500", "Need Info": "bg-amber-500", "Rejected": "bg-slate-500"
                  }
                  const isLast = i === finalSales.length - 1
                  return (
                    <React.Fragment key={row.id}>
                      <tr className={cn(
                        "group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors",
                        (!isLast && !expandedRows.has(row.id)) && "border-b border-slate-50 dark:border-slate-800/50"
                      )}>
                        <td className="py-3.5 px-3 text-slate-500 font-medium">{row.id.split('-')[0].toUpperCase()}</td>
                        <td className="py-3.5 px-3 font-bold text-slate-800 dark:text-white">
                          <div className="flex items-center gap-2">
                            {row.customer}
                            {row.processorNotes && (
                              <button onClick={(e) => { e.stopPropagation(); toggleRow(row.id); }} className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400">
                                <ChevronDown className={cn("w-4 h-4 transition-transform", expandedRows.has(row.id) && "rotate-180")} />
                              </button>
                            )}
                          </div>
                        </td>
                        {entityType !== "Agent" && <td className="py-3.5 px-3">{row.agent}</td>}
                        {entityType !== "Processor" && <td className="py-3.5 px-3">{row.processor_id === row.agent_id ? `${row.processorName} (Myself)` : (row.processorName || "Unassigned")}</td>}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-2 font-medium text-slate-600 dark:text-slate-300 text-xs">
                            <span className={`w-2 h-2 rounded-full ${statusColors[row.status] || "bg-red-500"}`}></span>
                            {row.status}
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-slate-500 text-xs hidden sm:table-cell whitespace-nowrap">{formatDate(row.timestamp)}</td>
                        <td className="py-3.5 px-3 text-right flex justify-end gap-2">
                          <Link href={`/sales/${row.id}`}>
                            <button className="text-blue-400 hover:text-blue-600 p-2 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20"><Eye className="w-4 h-4" /></button>
                          </Link>
                        </td>
                      </tr>
                      {expandedRows.has(row.id) && row.processorNotes && (
                        <tr className={cn("bg-amber-50/50 dark:bg-amber-900/10", !isLast && "border-b border-slate-50 dark:border-slate-800/50")}>
                          <td colSpan={7} className="py-4 px-5 text-sm">
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-500">
                                <FileText className="w-4 h-4 shrink-0" />
                                <span className="font-bold text-xs uppercase tracking-wider">Note</span>
                              </div>
                              <span className="text-amber-900 dark:text-amber-400 italic ml-6">"{row.processorNotes}"</span>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
            {finalSales.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <FileText className="w-12 h-12 mb-4 opacity-50" />
                <p>No sales found.</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}

function HeadsetIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5Zm0 0a9 9 0 1 1 18 0m0 0v5a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3Z"/><path d="M21 16v2a4 4 0 0 1-4 4h-5"/></svg>
  )
}

function UsersIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  )
}
