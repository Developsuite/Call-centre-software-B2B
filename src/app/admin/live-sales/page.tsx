"use client"

import React, { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { useAppContext, Sale } from "@/store/AppContext"
import { Card } from "@/components/ui/card"
import { 
  Activity, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle,
  User,
  Briefcase,
  ShieldCheck,
  Zap
} from "lucide-react"
import { cn } from "@/lib/utils"

export default function LiveSalesPage() {
  const { sales, currentUser, isLoaded } = useAppContext()
  const [mounted, setMounted] = useState(false)
  
  // Force a re-render every minute to keep relative times accurate
  const [, setTick] = useState(0)

  useEffect(() => {
    setMounted(true)
    const interval = setInterval(() => setTick(t => t + 1), 60000)
    return () => clearInterval(interval)
  }, [])

  if (!isLoaded || !mounted) {
    return (
      <DashboardLayout title="Live Sales">
        <div className="flex items-center justify-center h-[50vh]">
          <div className="w-6 h-6 border-2 border-[#ff5a36] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (!currentUser || (currentUser.role !== "Admin" && currentUser.role !== "SuperAdmin")) {
    return (
      <DashboardLayout title="Access Denied">
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
          <ShieldCheck className="w-16 h-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Access Restricted</h2>
          <p className="text-slate-500 max-w-md">This area is reserved for Local Admins to view their live analytics.</p>
        </div>
      </DashboardLayout>
    )
  }

  // Filter for the current tenant's sales
  const tenantSales = currentUser.role === "SuperAdmin" 
    ? sales 
    : sales.filter(s => s.tenantId === currentUser.tenantId)

  // Top metrics
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const todaysSales = tenantSales.filter(s => s.timestamp >= startOfToday)
  const connectedToday = todaysSales.filter(s => s.status === "Connected").length
  const pendingOverall = tenantSales.filter(s => s.status === "Pending" || s.status === "In Process").length

  // Helper for relative time
  const getRelativeTime = (timestamp: number) => {
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
    const diffInMs = timestamp - Date.now()
    const diffInMins = Math.round(diffInMs / (1000 * 60))
    const diffInHours = Math.round(diffInMins / 60)
    const diffInDays = Math.round(diffInHours / 24)

    if (Math.abs(diffInMins) < 1) return "Just now"
    if (Math.abs(diffInMins) < 60) return rtf.format(diffInMins, 'minute')
    if (Math.abs(diffInHours) < 24) return rtf.format(diffInHours, 'hour')
    return rtf.format(diffInDays, 'day')
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Connected": return <CheckCircle2 className="w-4 h-4 text-emerald-500" />
      case "Rejected": return <XCircle className="w-4 h-4 text-red-500" />
      case "Need Info": return <AlertCircle className="w-4 h-4 text-amber-500" />
      case "In Process": return <Activity className="w-4 h-4 text-blue-500" />
      default: return <Clock className="w-4 h-4 text-slate-400" />
    }
  }

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case "Connected": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
      case "Rejected": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
      case "Need Info": return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
      case "In Process": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
      default: return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
    }
  }

  return (
    <DashboardLayout title="Live Sales">
      <div className="flex flex-col gap-6 font-sans max-w-[1000px] mx-auto w-full pb-10">
        
        {/* Premium Header */}
        <div className="relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-950 px-8 py-8 rounded-[2rem] border border-slate-800 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)]">
          {/* Background Glow */}
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-[#ff5a36]/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-2">
              <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-black/50 border border-white/10 backdrop-blur-md shadow-inner">
                <span className="absolute w-3 h-3 bg-[#ff5a36] rounded-full animate-ping opacity-75 shadow-[0_0_15px_#ff5a36]"></span>
                <span className="relative w-3 h-3 bg-[#ff5a36] rounded-full shadow-[0_0_10px_#ff5a36]"></span>
              </div>
              <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight flex items-center gap-2">
                LIVE STREAM
              </h1>
            </div>
            <p className="text-slate-400 text-sm ml-2 font-medium">Monitoring real-time transaction packets.</p>
          </div>
          
          <div className="flex gap-4 relative z-10">
            <div className="bg-white/5 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10 shadow-lg flex flex-col items-center min-w-[100px]">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-1">Today</span>
              <span className="text-2xl font-black text-white">{todaysSales.length}</span>
            </div>
            <div className="bg-emerald-500/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)] flex flex-col items-center min-w-[100px]">
              <span className="text-[10px] uppercase font-bold text-emerald-500/70 tracking-widest mb-1">Connected</span>
              <span className="text-2xl font-black text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]">{connectedToday}</span>
            </div>
            <div className="bg-amber-500/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)] flex flex-col items-center min-w-[100px]">
              <span className="text-[10px] uppercase font-bold text-amber-500/70 tracking-widest mb-1">Pending</span>
              <span className="text-2xl font-black text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]">{pendingOverall}</span>
            </div>
          </div>
        </div>

        {/* Premium Data Stream Container */}
        <div className="flex flex-col gap-3 relative mt-2">
          
          {tenantSales.length === 0 ? (
            <div className="py-24 text-center text-slate-500 flex flex-col items-center bg-slate-950 rounded-[2rem] border border-white/5 shadow-2xl">
              <Zap className="w-16 h-16 mb-6 text-slate-800 animate-pulse" />
              <p className="text-lg font-medium tracking-wide">Awaiting Data Packets...</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {tenantSales.slice(0, 50).map((sale, index) => (
                <div 
                  key={sale.id} 
                  className="group flex flex-col md:flex-row gap-4 items-start md:items-center p-4 bg-transparent border-2 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-2xl transition-all duration-300 animate-in slide-in-from-right-8 fade-in shadow-none cursor-default"
                  style={{ animationFillMode: 'both', animationDelay: `${Math.min(index * 50, 500)}ms` }}
                >
                  <div className="w-40 shrink-0 flex flex-col gap-2 pl-2">
                     <span className="text-xs font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1.5 font-mono">
                        <Clock className="w-3.5 h-3.5" /> {getRelativeTime(sale.timestamp)}
                     </span>
                     <div className={cn("px-3 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase flex items-center gap-2 w-fit shadow-sm", getStatusBadgeStyle(sale.status))}>
                        {getStatusIcon(sale.status)}
                        {sale.status}
                      </div>
                  </div>

                  <div className="flex-1 flex flex-col pl-2 md:pl-0">
                    <h3 className="font-black text-lg text-slate-800 dark:text-white tracking-tight">
                      {sale.customer}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                        {sale.accountType}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 dark:text-slate-600">ID: {sale.id.substring(0,8)}</span>
                    </div>
                  </div>

                  <div className="flex flex-row gap-6 pl-2 md:pl-6 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 pt-3 md:pt-0 w-full md:w-auto shrink-0 items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                          <User className="w-4 h-4 text-indigo-500" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Agent</span>
                          <span className="font-bold text-slate-700 dark:text-slate-200 text-xs">{sale.agent}</span>
                        </div>
                     </div>
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-fuchsia-500/10 flex items-center justify-center border border-fuchsia-500/20">
                          <Briefcase className="w-4 h-4 text-fuchsia-500" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Processor</span>
                          <span className={cn("font-bold text-xs", sale.processorName ? "text-slate-700 dark:text-slate-200" : "text-slate-400 italic")}>
                            {sale.processorName || "None"}
                          </span>
                        </div>
                     </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  )
}
