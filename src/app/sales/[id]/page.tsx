"use client"

import { use } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { 
  User, 
  Building, 
  Phone, 
  Mail, 
  Info,
  CreditCard,
  FileText,
  ArrowLeft,
  MessageSquare,
  Clock,
  Activity
} from "lucide-react"
import { useAppContext } from "@/store/AppContext"

export default function AgentSaleViewPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const saleId = resolvedParams.id || "Unknown"

  const { sales, currentUser } = useAppContext()
  const sale = sales.find(s => s.id.toLowerCase() === saleId.toLowerCase())
  const accountType = sale?.accountType.toLowerCase() === "personal" ? "personal" : "business"

  // Helper component for minimal data display
  const DataRow = ({ label, value, icon: Icon }: { label: string, value: string, icon?: any }) => (
    <div className="space-y-1">
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</label>
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-[#ff5a36]/70" />}
        <span className="text-sm font-bold text-slate-800 dark:text-white">{value}</span>
      </div>
    </div>
  )

  if (!sale) {
    return (
      <DashboardLayout title="Sale Not Found">
        <div className="flex flex-col items-center justify-center h-[50vh]">
          <h2 className="text-2xl font-bold">Sale {saleId} not found.</h2>
          <Link href="/">
            <Button className="mt-4">Back to Dashboard</Button>
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title={`Viewing Sale: ${saleId.split('-')[0].toUpperCase()}`}>
      <div className="max-w-[98%] mx-auto w-full flex flex-col gap-5 relative pb-6 min-h-[calc(100vh-8rem)]">
        
        {/* Top Header Row */}
        <div className="flex items-center justify-between z-20">
          <Link href="/">
            <Button variant="ghost" className="h-10 rounded-xl font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white px-4 cursor-pointer">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
            <div className="flex items-center gap-3 bg-white dark:bg-card px-4 py-2 rounded-xl shadow-[0_4px_15px_rgba(0,0,0,0.03)] border border-slate-100 dark:border-border">
              <span className="text-sm font-bold text-slate-500">Current Status:</span>
              <span className={cn(
                "text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wider",
                sale?.status === "Processed" ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" :
                sale?.status === "Connected" ? "bg-blue-500/10 text-blue-600 border border-blue-500/20" :
                sale?.status === "Rejected" ? "bg-red-500/10 text-red-600 border border-red-500/20" :
                sale?.status === "Need Info" ? "bg-amber-500/10 text-amber-600 border border-amber-500/20" :
                "bg-[#ff5a36]/10 text-[#ff5a36] border border-[#ff5a36]/20"
              )}>
                {sale?.status || "Pending"}
              </span>
            </div>
        </div>

        {/* Background glow */}
        <div className="absolute top-[30%] left-[50%] -translate-x-1/2 w-[60%] h-[40%] bg-[#ff5a36]/5 dark:bg-[#ff5a36]/10 blur-[120px] rounded-full pointer-events-none" />

        {/* 3-Column Grid Container */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
          
          {/* COLUMN 1: Basic Info (READ-ONLY) */}
          <Card className="rounded-[1.5rem] border border-slate-100 dark:border-border shadow-[0_4px_20px_rgba(0,0,0,0.03)] bg-white dark:bg-card p-6 flex flex-col h-full">
            <div className="mb-6 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#ff5a36]/10 text-[#ff5a36] flex items-center justify-center">
                  <Info className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white">Customer Info</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Contact details</p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar flex-1 pt-2">
              <div className="grid grid-cols-2 gap-6">
                <DataRow label="First Name" value={sale?.formData?.firstName || sale?.customer?.split(" ")[0] || "Not added"} />
                <DataRow label="Last Name" value={sale?.formData?.lastName || sale?.customer?.split(" ").slice(1).join(" ") || "Not added"} />
              </div>
              
              <DataRow label="Email Address" value={sale?.formData?.email || "Not added"} icon={Mail} />
              <DataRow label="Phone Number" value={sale?.formData?.phone || "Not added"} icon={Phone} />
            </div>
          </Card>

          {/* COLUMN 2: Account Details (READ-ONLY) */}
          <Card className="rounded-[1.5rem] border border-slate-100 dark:border-border shadow-[0_4px_20px_rgba(0,0,0,0.03)] bg-white dark:bg-card p-6 flex flex-col h-full">
            <div className="mb-6 flex flex-col 2xl:flex-row 2xl:items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#ff5a36]/10 text-[#ff5a36] flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white">Account Setup</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Account specifics</p>
                </div>
              </div>
              
              {/* Account Type Toggle */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800 shrink-0 self-start 2xl:self-auto">
                <button 
                  disabled
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all",
                    accountType === "personal" 
                      ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm border border-slate-200 dark:border-slate-700" 
                      : "text-slate-500"
                  )}
                >
                  <User className="w-3.5 h-3.5" /> Personal
                </button>
                <button 
                  disabled
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all",
                    accountType === "business" 
                      ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm border border-slate-200 dark:border-slate-700" 
                      : "text-slate-500"
                  )}
                >
                  <Building className="w-3.5 h-3.5" /> Business
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pt-2">
              {accountType === "personal" ? (
                <div className="flex flex-col gap-6 animate-in fade-in duration-300">
                  <div className="grid grid-cols-2 gap-6">
                    <DataRow label="Date of Birth" value={sale?.formData?.dob || "Not added"} />
                    <DataRow label="SSN" value={sale?.formData?.ssn || "Not added"} />
                  </div>
                  <DataRow label="Home Address" value={sale?.formData?.homeAddress || "Not added"} />
                  <div className="grid grid-cols-2 gap-6">
                    <DataRow label="City / State" value={sale?.formData?.city || "Not added"} />
                    <DataRow label="ZIP Code" value={sale?.formData?.zipCode || "Not added"} />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-6 animate-in fade-in duration-300">
                  <DataRow label="Company Name" value={sale?.formData?.companyName || sale?.customer || "Not added"} />
                  <div className="grid grid-cols-2 gap-6">
                    <DataRow label="Tax ID / EIN" value={sale?.formData?.taxId || "Not added"} />
                    <DataRow label="Years Active" value={sale?.formData?.yearsActive ? `${sale.formData.yearsActive} Years` : "Not added"} />
                  </div>
                  <DataRow label="Business Address" value={sale?.formData?.businessAddress || "Not added"} />
                  <div className="grid grid-cols-2 gap-6">
                    <DataRow label="City / State" value={sale?.formData?.city || "Not added"} />
                    <DataRow label="ZIP Code" value={sale?.formData?.zipCode || "Not added"} />
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* COLUMN 3: Processor Feedback Panel */}
          <Card className="rounded-[1.5rem] border-none shadow-[0_4px_20px_rgba(0,0,0,0.05)] bg-[#fff9f0] dark:bg-[#2a1c10] p-6 flex flex-col h-full relative overflow-hidden border border-amber-200 dark:border-amber-900/50">
            {/* Ambient background glow inside the feedback panel */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[60px] pointer-events-none -mr-20 -mt-20" />

            <div className="mb-6 flex items-center gap-3 shrink-0 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center border border-amber-500/30 shadow-inner">
                <MessageSquare className="w-5 h-5 text-amber-600 dark:text-amber-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-amber-900 dark:text-amber-500">Processor Feedback</h2>
                <p className="text-xs text-amber-700 dark:text-amber-700/80 mt-0.5">Notes and instructions</p>
              </div>
            </div>
            
            <div className="flex flex-col flex-1 relative z-10">
              {/* Agent's Original Notes */}
              {sale?.notes && (
                <div className="mb-6 space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Your Original Note</label>
                  <div className="p-4 rounded-xl bg-white/50 dark:bg-black/20 border border-slate-200 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-400 italic">
                    "{sale.notes}"
                  </div>
                </div>
              )}

              {/* Processor's Identity */}
              {sale?.processorName && (
                <div className="mb-4 flex items-center justify-between p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <User className="w-3 h-3 text-amber-700 dark:text-amber-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Assigned Processor</p>
                      <p className="text-sm font-bold text-amber-900 dark:text-amber-500">{sale.processor_id === currentUser?.id ? "Myself" : sale.processorName}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Processor's Notes */}
              <div className="space-y-2 flex-1 flex flex-col">
                <label className="text-[10px] font-bold text-amber-700 dark:text-amber-600 uppercase tracking-wider">Processor's Message</label>
                <div className="flex-1 w-full p-4 text-sm bg-white dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl text-amber-900 dark:text-amber-400 shadow-inner">
                  {sale?.processorNotes ? (
                    sale.processorNotes
                  ) : (
                    <span className="text-amber-900/40 dark:text-amber-400/40 italic">The processor has not added any notes yet.</span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 mt-6 border-t border-amber-200/50 dark:border-amber-900/50 shrink-0">
                <Link href={`/sales/${sale.id}/edit`}>
                  <Button 
                    className="w-full h-12 rounded-xl text-sm font-bold bg-[#ff5a36] hover:bg-[#e04a29] text-white transition-all cursor-pointer shadow-lg shadow-[#ff5a36]/20"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Edit Application
                  </Button>
                </Link>
              </div>
            </div>
          </Card>

        </div>

        {/* Activity Timeline Row */}
        <div className="relative z-10 mt-2">
          <Card className="rounded-[1.5rem] border border-slate-100 dark:border-border shadow-[0_4px_20px_rgba(0,0,0,0.03)] bg-white dark:bg-card p-6 flex flex-col">
            <div className="mb-6 flex items-center gap-3 shrink-0">
              <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">Activity Timeline</h2>
                <p className="text-xs text-slate-500 mt-0.5">Version history and audit log</p>
              </div>
            </div>

            <div className="flex flex-col gap-0 pl-4 relative">
              {/* Vertical line connecting timeline items */}
              <div className="absolute left-7 top-4 bottom-4 w-px bg-slate-200 dark:bg-slate-800"></div>

              {sale.historyLogs && sale.historyLogs.length > 0 ? (
                sale.historyLogs.map((log, index) => (
                  <div key={index} className="relative flex gap-6 pb-8 last:pb-0 group">
                    {/* Timeline Node */}
                    <div className="relative z-10 w-6 h-6 rounded-full bg-white dark:bg-card border-2 border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)] flex items-center justify-center shrink-0 mt-1">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    </div>
                    
                    {/* Timeline Content */}
                    <div className="flex flex-col flex-1 bg-slate-50/50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 transition-colors group-hover:bg-slate-50 dark:group-hover:bg-slate-900">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 uppercase tracking-wider">
                            {log.action}
                          </span>
                          <span className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            {log.by}
                          </span>
                        </div>
                        <span className="text-xs font-medium text-slate-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        {log.details}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="pl-10 text-sm text-slate-500 italic py-4">No history recorded yet.</div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
