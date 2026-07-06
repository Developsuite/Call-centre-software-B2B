"use client"

import React, { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card } from "@/components/ui/card"
import { useAppContext } from "@/store/AppContext"
import { 
  HelpCircle, 
  CheckCircle2, 
  Clock, 
  Building2, 
  User, 
  MessageSquare
} from "lucide-react"
import { cn } from "@/lib/utils"

export default function SuperAdminSupportPage() {
  const { tickets, resolveTicket, currentUser, isLoaded } = useAppContext()
  const [filter, setFilter] = useState<"All" | "Open" | "Resolved">("Open")

  if (!isLoaded) {
    return (
      <DashboardLayout title="Queries & Issues">
        <div className="flex items-center justify-center h-[50vh]">
          <div className="w-6 h-6 border-2 border-[#ff5a36] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (!currentUser || currentUser.role !== "SuperAdmin") {
    return (
      <DashboardLayout title="Access Denied">
        <div className="flex flex-col items-center justify-center h-[50vh] text-center">
          <HelpCircle className="w-16 h-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold">SuperAdmin Only</h2>
          <p className="text-slate-500 mt-2">You do not have permission to view support tickets.</p>
        </div>
      </DashboardLayout>
    )
  }

  const filteredTickets = tickets.filter(t => filter === "All" || t.status === filter)

  return (
    <DashboardLayout title="Queries & Issues">
      <div className="max-w-[98%] mx-auto w-full flex flex-col gap-6 relative pb-12 min-h-[calc(100vh-8rem)]">
        
        {/* Background ambient glow */}
        <div className="absolute top-[10%] left-[50%] -translate-x-1/2 w-[60%] h-[40%] bg-[#ff5a36]/5 dark:bg-[#ff5a36]/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="flex items-center justify-between relative z-10 bg-white dark:bg-card p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Support Tickets</h2>
              <p className="text-xs text-slate-500">Manage issues from all call centers.</p>
            </div>
          </div>
          
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            {["Open", "Resolved", "All"].map(status => (
              <button 
                key={status}
                onClick={() => setFilter(status as any)}
                className={cn(
                  "px-4 py-2 rounded-lg text-xs font-bold transition-all",
                  filter === status 
                    ? "bg-white dark:bg-slate-800 shadow-sm text-blue-600 dark:text-blue-400" 
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                )}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
          {filteredTickets.length === 0 ? (
            <div className="col-span-full py-20 text-center text-slate-500 flex flex-col items-center">
              <CheckCircle2 className="w-12 h-12 mb-4 text-slate-300 dark:text-slate-700" />
              <p>No {filter.toLowerCase()} tickets found.</p>
            </div>
          ) : (
            filteredTickets.map(ticket => (
              <Card key={ticket.id} className={cn(
                "rounded-[1.5rem] p-6 flex flex-col gap-4 shadow-sm border",
                ticket.status === "Open" ? "border-amber-200 dark:border-amber-900/30 bg-amber-50/30 dark:bg-amber-950/10" : "border-slate-100 dark:border-slate-800 bg-white dark:bg-card"
              )}>
                <div className="flex justify-between items-start">
                  <div className={cn(
                    "px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase flex items-center gap-1.5",
                    ticket.status === "Open" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  )}>
                    {ticket.status === "Open" ? <Clock className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                    {ticket.status}
                  </div>
                  <span className="text-[10px] font-medium text-slate-400">
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white text-base leading-tight mb-2">{ticket.subject}</h3>
                  <div className="p-3 bg-white/60 dark:bg-black/20 rounded-xl border border-slate-200/50 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-300">
                    {ticket.description}
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Building2 className="w-3.5 h-3.5" />
                    <span className="font-medium truncate">{ticket.organization_name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <User className="w-3.5 h-3.5" />
                    <span className="font-medium truncate">{ticket.user_name}</span>
                  </div>
                </div>

                {ticket.status === "Open" && (
                  <button 
                    onClick={() => resolveTicket(ticket.id)}
                    className="mt-4 w-full bg-[#ff5a36] hover:bg-[#e04a29] text-white font-bold h-10 rounded-xl text-sm transition-colors shadow-sm"
                  >
                    Mark as Resolved
                  </button>
                )}
              </Card>
            ))
          )}
        </div>

      </div>
    </DashboardLayout>
  )
}
