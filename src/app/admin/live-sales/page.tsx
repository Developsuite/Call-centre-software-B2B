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
        
        {/* Header section with live indicator */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/50 dark:bg-card/50 px-6 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-md">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-red-500/10 text-red-500">
                <span className="absolute w-2 h-2 bg-red-500 rounded-full animate-ping opacity-75"></span>
                <span className="relative w-2 h-2 bg-red-500 rounded-full"></span>
              </div>
              <h1 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
                Live Sales Feed
              </h1>
            </div>
            <p className="text-slate-500 text-sm ml-1">Real-time stream of incoming sales and updates.</p>
          </div>
          
          <div className="flex gap-4">
            <div className="bg-white dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center">
              <span className="text-[10px] uppercase font-bold text-slate-400">Today</span>
              <span className="text-lg font-bold text-slate-800 dark:text-white">{todaysSales.length}</span>
            </div>
            <div className="bg-white dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center">
              <span className="text-[10px] uppercase font-bold text-slate-400">Connected</span>
              <span className="text-lg font-bold text-emerald-500">{connectedToday}</span>
            </div>
            <div className="bg-white dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center">
              <span className="text-[10px] uppercase font-bold text-slate-400">Pending</span>
              <span className="text-lg font-bold text-amber-500">{pendingOverall}</span>
            </div>
          </div>
        </div>

        {/* Live Feed Container */}
        <div className="flex flex-col bg-white dark:bg-card border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          
          {tenantSales.length === 0 ? (
            <div className="py-20 text-center text-slate-500 flex flex-col items-center">
              <Zap className="w-12 h-12 mb-4 text-slate-300 dark:text-slate-700" />
              <p>Waiting for incoming sales...</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {tenantSales.slice(0, 50).map((sale) => (
                <div 
                  key={sale.id} 
                  className="group flex flex-col md:flex-row gap-4 items-start md:items-center p-4 hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors relative animate-in fade-in duration-500"
                >
                  {/* Hover Status Bar (Left Edge) */}
                  <div className={cn(
                    "absolute left-0 top-0 bottom-0 w-1 opacity-0 group-hover:opacity-100 transition-opacity",
                    sale.status === "Connected" ? "bg-emerald-500" :
                    sale.status === "Rejected" ? "bg-red-500" :
                    sale.status === "Need Info" ? "bg-amber-500" :
                    sale.status === "In Process" ? "bg-blue-500" :
                    "bg-slate-300 dark:bg-slate-700"
                  )} />

                  <div className="w-32 shrink-0 flex flex-col gap-1.5 pl-2">
                     <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {getRelativeTime(sale.timestamp)}
                     </span>
                     <div className={cn("px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase flex items-center gap-1 w-fit", getStatusBadgeStyle(sale.status))}>
                        {getStatusIcon(sale.status)}
                        {sale.status}
                      </div>
                  </div>

                  <div className="flex-1 flex flex-col pl-2 md:pl-0">
                    <h3 className="font-bold text-sm text-slate-800 dark:text-white leading-tight">
                      {sale.customer}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                      Account: {sale.accountType}
                    </p>
                  </div>

                  <div className="w-48 shrink-0 flex flex-col gap-1.5 pl-2 md:pl-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800 pt-3 md:pt-0">
                     <div className="flex items-center gap-2 text-xs">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-medium text-slate-700 dark:text-slate-300">{sale.agent}</span>
                     </div>
                     <div className="flex items-center gap-2 text-xs">
                        <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                        <span className={cn("font-medium", sale.processorName ? "text-slate-700 dark:text-slate-300" : "text-slate-400 italic")}>
                          {sale.processorName || "Unassigned"}
                        </span>
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
