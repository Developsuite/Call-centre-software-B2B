"use client"
import React, { useState } from "react"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { 
  Search, 
  Filter, 
  Clock,
  ArrowRight,
  Briefcase,
  Activity,
  UserCheck,
  CheckCircle2,
  AlertCircle
} from "lucide-react"
import { useAppContext } from "@/store/AppContext"
import { cn } from "@/lib/utils"

export default function ProcessorQueuePage() {
  const { sales, users, currentUser, isLoaded } = useAppContext()
  
  // Find all active processors in the SAME tenant
  const activeProcessors = users.filter(u => u.role === "Processor" && u.status === "Active" && u.tenantId === currentUser?.tenantId)

  const [simulatedProcessor, setSimulatedProcessor] = useState("Loading...")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  
  React.useEffect(() => {
    if (isLoaded && currentUser) {
      if (currentUser.role === "Processor") {
        setSimulatedProcessor(currentUser.name);
      } else if (activeProcessors.length > 0) {
        setSimulatedProcessor(activeProcessors[0].name);
      } else {
        setSimulatedProcessor("Jane Doe");
      }
    }
  }, [isLoaded, currentUser?.id, currentUser?.role, activeProcessors.length]);
  
  // 1. First, isolate sales to the current Tenant (SuperAdmins see all)
  const tenantSales = currentUser?.role === "SuperAdmin" 
    ? sales 
    : sales.filter(s => s.tenantId === currentUser?.tenantId)

  // Logical Shift Date (Night shift 7pm to 5am -> offset by 5 hours)
  const getLogicalShiftDate = (timestamp: number) => {
    const d = new Date(timestamp - 5 * 60 * 60 * 1000);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const todayStr = getLogicalShiftDate(Date.now());

  // 2. Filter tasks assigned to this specific simulated processor that are ONLY Pending
  const visibleSales = tenantSales.filter(
    (sale) => (sale.assignedTo === simulatedProcessor || !sale.assignedTo || sale.assignedTo === "Unassigned") && sale.status === "Pending"
  )

  // 3. To match the "My Processed Sales" page, we need the total sales this processor has interacted with
  const processorPersonalSales = tenantSales.filter(s => {
    if (s.assignedTo === simulatedProcessor) return true;
    if (s.processorName === simulatedProcessor) return true;
    if (s.historyLogs && s.historyLogs.some((log: any) => log.by === simulatedProcessor)) return true;
    return false;
  });

  const pendingCount = visibleSales.filter(s => s.status === "Pending").length
  const inProcessCount = processorPersonalSales.filter(s => s.status === "In Process").length
  
  // Dashboard completed stats should reflect TODAY'S work to match default list view
  const connectedCount = processorPersonalSales.filter(s => s.status === "Connected" && getLogicalShiftDate(s.timestamp) === todayStr).length
  const processedCount = processorPersonalSales.filter(s => s.status === "Processed" && getLogicalShiftDate(s.timestamp) === todayStr).length

  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };
  if (!isLoaded) {
    return (
      <DashboardLayout title="Processor Action Queue">
        <div className="flex items-center justify-center h-[50vh]">
          <div className="w-6 h-6 border-2 border-[#ff5a36] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!currentUser || (currentUser.role !== "Processor" && currentUser.role !== "SuperAdmin")) {
    return (
      <DashboardLayout title="Access Denied">
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
          <Briefcase className="w-16 h-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Access Restricted</h2>
          <p className="text-slate-500 max-w-md">This area is strictly reserved for Processors to manage the active sales queue.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Live Processor Queue">
      <div className="flex flex-col gap-6 h-full pb-12 relative max-w-[98%] mx-auto w-full">
        
        {/* Mock Role Switcher */}
        <div className="flex items-center gap-4 z-20 relative bg-slate-100 dark:bg-slate-800/50 p-2 rounded-xl border border-slate-200 dark:border-slate-700 w-fit">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-2">Simulate Processor:</label>
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl w-fit border border-slate-200 dark:border-slate-800">
            {activeProcessors.map(p => (
              <button 
                key={p.id}
                onClick={() => setSimulatedProcessor(p.name)}
                className={cn(
                  "px-4 py-2 rounded-lg text-xs font-bold transition-all",
                  simulatedProcessor === p.name ? "bg-white dark:bg-slate-800 shadow-sm text-blue-600 dark:text-blue-400" : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                )}
              >
                {p.name}
              </button>
            ))}
            {activeProcessors.length === 0 && (
              <div className="px-4 py-2 text-xs text-slate-500">No processors in this tenant</div>
            )}
          </div>
        </div>

        {/* Background ambient glow */}
        <div className="absolute top-[10%] left-[50%] -translate-x-1/2 w-[60%] h-[40%] bg-[#ff5a36]/5 dark:bg-[#ff5a36]/10 blur-[120px] rounded-full pointer-events-none" />

        {/* Top Summary Bar - Compact Dashboard Match (Indigo Theme) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 relative z-10">
          
          {/* Main Hero Card (Left) */}
          <Card className="col-span-1 md:row-span-2 p-4 rounded-2xl bg-gradient-to-br from-[#0f172a] to-[#1e3a8a] border-none shadow-[0_4px_15px_rgba(30,58,138,0.2)] text-white flex flex-col justify-between relative overflow-hidden group">
            {/* Ambient background glow inside the card */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-500/20 rounded-full blur-[30px] group-hover:bg-blue-400/30 transition-all duration-500 pointer-events-none" />
            
            <div className="flex items-center justify-between relative z-10">
              <span className="text-xs font-medium text-white/80">Pending Queue</span>
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/10">
                <Briefcase className="w-4 h-4 text-white/90" />
              </div>
            </div>
            
            <div className="my-3 relative z-10 flex flex-col items-start gap-2">
              <span className="text-5xl leading-none font-bold tracking-tight">{pendingCount}</span>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 backdrop-blur-sm text-[10px] font-bold text-emerald-400">
                <CheckCircle2 className="w-3 h-3" />
                Live updates active
              </div>
            </div>
            
            <Button className="w-full bg-white/5 hover:bg-white/15 text-white border border-white/10 font-medium h-9 rounded-lg mt-1 transition-all shadow-none relative z-10 text-xs cursor-pointer">
              <Activity className="w-3 h-3 mr-1.5 text-white/60" />
              Start Processing
            </Button>
          </Card>

          {/* 4 Small Cards (Right 2x2 Grid) */}
          <Card className="col-span-1 p-4 rounded-2xl bg-white dark:bg-card border-none shadow-[0_4px_10px_rgba(0,0,0,0.02)] flex flex-col justify-between group hover:-translate-y-0.5 transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">In Process</span>
              <Clock className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800 dark:text-white leading-none">{inProcessCount}</div>
              <div className="text-[10px] font-bold text-blue-500 mt-1">Across 4 agents</div>
            </div>
          </Card>

          <Card className="col-span-1 p-4 rounded-2xl bg-white dark:bg-card border-none shadow-[0_4px_10px_rgba(0,0,0,0.02)] flex flex-col justify-between group hover:-translate-y-0.5 transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Processed</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800 dark:text-white leading-none">{processedCount}</div>
              <div className="text-[10px] font-bold text-emerald-500 mt-1">↑ 12% vs yesterday</div>
            </div>
          </Card>

          <Card className="col-span-1 p-4 rounded-2xl bg-white dark:bg-card border-none shadow-[0_4px_10px_rgba(0,0,0,0.02)] flex flex-col justify-between group hover:-translate-y-0.5 transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Connected</span>
              <Activity className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800 dark:text-white leading-none">{connectedCount}</div>
              <div className="text-[10px] font-bold text-blue-500 mt-1">Live active calls</div>
            </div>
          </Card>

          <Card className="col-span-1 p-4 rounded-2xl bg-white dark:bg-card border-none shadow-[0_4px_10px_rgba(0,0,0,0.02)] flex flex-col justify-between group hover:-translate-y-0.5 transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Avg Time</span>
              <Activity className="w-3.5 h-3.5 text-indigo-500" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800 dark:text-white leading-none">4m 12s</div>
              <div className="text-[10px] font-bold text-emerald-500 mt-1">↓ 30s faster</div>
            </div>
          </Card>

        </div>

        {/* Main Queue Table */}
        <Card className="rounded-[2rem] border border-[#ff5a36]/10 shadow-[0_8px_30px_rgba(255,90,54,0.04)] bg-white dark:bg-card flex-1 flex flex-col min-h-[500px] relative z-10 overflow-hidden mt-2">
          
          <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-transparent">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full border border-[#ff5a36]/30 flex items-center justify-center bg-transparent">
                <Briefcase className="w-5 h-5 text-[#ff5a36]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">Active Queue</h3>
                <p className="text-xs font-medium text-slate-500">Sales waiting for processor review</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative group">
                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#ff5a36] transition-colors" />
                <Input 
                  placeholder="Search Sale ID or Customer..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-11 h-10 w-[250px] bg-transparent border border-slate-200 dark:border-border rounded-xl text-sm focus-visible:ring-1 focus-visible:ring-[#ff5a36] transition-all"
                />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger className="flex h-10 items-center justify-center rounded-xl px-4 text-sm font-bold bg-transparent border border-slate-200 dark:border-border hover:border-[#ff5a36] hover:text-[#ff5a36] transition-all cursor-pointer outline-none">
                  <Filter className="w-4 h-4 mr-2" />
                  {statusFilter === "All" ? "Filters" : statusFilter}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuRadioGroup value={statusFilter} onValueChange={setStatusFilter}>
                    <DropdownMenuRadioItem value="All">All Statuses</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="Pending">Pending</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="Need Info">Need Info</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="In Process">In Process</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="Rejected">Rejected</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="flex-1 overflow-auto custom-scrollbar p-2">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="sticky top-0 bg-white/95 dark:bg-card/95 backdrop-blur-md z-10 rounded-t-xl">
                <tr className="text-slate-400 font-bold border-b border-slate-100 dark:border-border/50 uppercase tracking-widest text-[10px]">
                  <th className="py-4 px-6">Submitted</th>
                  <th className="py-4 px-6">Sale ID</th>
                  <th className="py-4 px-6">Customer</th>
                  <th className="py-4 px-6">Agent / Team</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="text-slate-600 dark:text-slate-300">
                {visibleSales
                  .filter(row => {
                    const matchesSearch = row.customer.toLowerCase().includes(searchQuery.toLowerCase()) || row.id.toLowerCase().includes(searchQuery.toLowerCase());
                    const matchesFilter = statusFilter === "All" || row.status === statusFilter;
                    return matchesSearch && matchesFilter;
                  })
                  .map((row) => {
                  
                  const statusColors: Record<string, string> = {
                    "Pending": "bg-transparent text-red-500 border border-red-500",
                    "Need Info": "bg-transparent text-amber-500 border border-amber-500",
                    "In Process": "bg-transparent text-blue-500 border border-blue-500",
                    "Rejected": "bg-transparent text-slate-500 border border-slate-500"
                  };
                  const color = statusColors[row.status] || statusColors["Pending"];

                  return (
                    <tr key={row.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-all duration-200 group border-b border-slate-50 dark:border-border/30 last:border-none cursor-pointer">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-white">
                          <Clock className="w-4 h-4 text-slate-400 group-hover:text-[#ff5a36] transition-colors" />
                          {formatDateTime(row.timestamp)}
                        </div>
                      </td>
                      <td className="py-4 px-6 font-mono font-medium text-slate-500">{row.id.split('-')[0].toUpperCase()}</td>
                      <td className="py-4 px-6 font-bold text-slate-800 dark:text-white">{row.customer}</td>
                      <td className="py-4 px-6">
                        <p className="font-bold text-slate-800 dark:text-white">{row.agent}</p>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{row.team}</p>
                      </td>
                      <td className="py-4 px-6">
                        <div className={`inline-flex items-center px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${color}`}>
                          {row.status}
                        </div>
                      </td>
                      <td className="py-5 px-6 text-right">
                        <Link href={`/processor/queue/${row.id.toLowerCase()}`}>
                          <Button 
                            className="
                              h-10 px-5 rounded-xl font-bold transition-all duration-300
                              bg-[#ff5a36] text-white border border-[#e04a25]
                              shadow-[0_4px_10px_rgba(255,90,54,0.4),inset_0_1px_0_rgba(255,255,255,0.3)]
                              hover:bg-transparent hover:text-[#ff5a36] hover:shadow-none hover:border-[#ff5a36]
                            "
                          >
                            Process
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>

      </div>
    </DashboardLayout>
  )
}
