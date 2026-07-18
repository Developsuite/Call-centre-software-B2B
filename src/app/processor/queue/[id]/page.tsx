"use client"

import { useState, use } from "react"
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
  CheckCircle2,
  Info,
  CreditCard,
  FileText,
  ArrowLeft,
  Barcode,
  XCircle,
  AlertCircle,
  Save,
  Activity
} from "lucide-react"
import { useAppContext } from "@/store/AppContext"
import { useRouter } from "next/navigation"

export default function SaleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const saleId = resolvedParams.id || "Unknown"

  const { sales, updateSaleStatus, updateSaleProcessorNotes } = useAppContext()
  const router = useRouter()
  
  const sale = sales.find(s => s.id.toLowerCase() === saleId.toLowerCase())
  const [accountType, setAccountType] = useState<"personal" | "business">(sale?.accountType.toLowerCase() === "personal" ? "personal" : "business")
  const [processorNotes, setProcessorNotes] = useState(sale?.processorNotes || "")

  const handleStatusChange = (status: any) => {
    if (sale) {
      updateSaleProcessorNotes(sale.id, processorNotes)
      updateSaleStatus(sale.id, status)
      router.push("/processor/queue")
    }
  }

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

  return (
    <DashboardLayout title={`Processing Sale: ${saleId.split('-')[0].toUpperCase()}`}>
      <div className="max-w-[98%] mx-auto w-full flex flex-col gap-5 relative pb-6 lg:h-[calc(100vh-8rem)] min-h-[calc(100vh-8rem)]">
        
        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-20">
          <Link href="/processor/queue">
            <Button variant="ghost" className="h-10 rounded-xl font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white px-4 cursor-pointer">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Queue
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10 flex-1 lg:h-[calc(100%-4rem)]">
          
          {/* COLUMN 1: Basic Info (READ-ONLY) */}
          <Card className="rounded-[1.5rem] border border-slate-100 dark:border-border shadow-[0_4px_20px_rgba(0,0,0,0.03)] bg-white dark:bg-card p-6 flex flex-col h-full">
            <div className="mb-6 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#ff5a36]/10 text-[#ff5a36] flex items-center justify-center">
                  <Info className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white">Customer Info</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Read-only view</p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-4 flex-1 pt-2 overflow-y-auto custom-scrollbar pr-2 min-h-0">
              <div className="grid grid-cols-2 gap-4 shrink-0">
                <DataRow label="First Name" value={sale?.formData?.firstName || sale?.customer?.split(" ")[0] || "Not added"} />
                <DataRow label="Last Name" value={sale?.formData?.lastName || sale?.customer?.split(" ").slice(1).join(" ") || "Not added"} />
              </div>
              
              <DataRow label="Email Address" value={sale?.formData?.email || "Not added"} icon={Mail} />
              <DataRow label="Phone Number" value={sale?.formData?.phone || "Not added"} icon={Phone} />

              <div className="h-px w-full bg-slate-100 dark:bg-border my-2" />

              {/* Agent details (read-only) */}
              <div className="space-y-1 shrink-0">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Submitted By</label>
                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-white">{sale?.agent || "Mike Ross"}</p>
                    <p className="text-xs text-slate-400">{sale?.team || "Beta Force Team"}</p>
                  </div>
                  <Button variant="outline" size="sm" className="h-8 text-xs font-bold rounded-lg text-[#ff5a36] border-[#ff5a36]/30 hover:bg-[#ff5a36]/10 hover:text-[#ff5a36] cursor-pointer">Contact Agent</Button>
                </div>
              </div>

              {/* Agent's Internal Notes */}
              <div className="space-y-1 mt-2 shrink-0 pb-2">
                <label className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Agent's Notes</label>
                <div className="bg-amber-500/5 dark:bg-amber-500/10 p-3 rounded-xl border border-amber-500/20 text-sm text-slate-700 dark:text-slate-300 italic">
                  {sale?.notes ? `"${sale.notes}"` : <span className="text-slate-400 dark:text-slate-500 not-italic">No notes provided by agent.</span>}
                </div>
              </div>
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
                  <p className="text-xs text-slate-500 mt-0.5">Read-only view</p>
                </div>
              </div>
              
              {/* Account Type Toggle (Just for viewing different mock states) */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800 shrink-0 self-start 2xl:self-auto">
                <button 
                  onClick={() => setAccountType("personal")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer",
                    accountType === "personal" 
                      ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm border border-slate-200 dark:border-slate-700" 
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  )}
                >
                  <User className="w-3.5 h-3.5" /> Personal
                </button>
                <button 
                  onClick={() => setAccountType("business")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer",
                    accountType === "business" 
                      ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm border border-slate-200 dark:border-slate-700" 
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  )}
                >
                  <Building className="w-3.5 h-3.5" /> Business
                </button>
              </div>
            </div>

            <div className="flex-1 pt-2">
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

          {/* COLUMN 3: Processor Action Panel */}
          <Card className="rounded-[1.5rem] border-none shadow-[0_4px_20px_rgba(0,0,0,0.05)] bg-[#1e1b4b] dark:bg-[#1a2130] p-6 flex flex-col h-full relative overflow-hidden text-white">
            {/* Ambient background glow inside the action panel */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-[60px] pointer-events-none -mr-20 -mt-20" />

            <div className="mb-6 flex items-center gap-3 shrink-0 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10 shadow-inner backdrop-blur-sm">
                <FileText className="w-5 h-5 text-indigo-300" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Processor Actions</h2>
                <p className="text-xs text-indigo-200 mt-0.5">Finalize status & notes</p>
              </div>
            </div>
            
            <div className="flex flex-col flex-1 relative z-10">
              <div className="space-y-2 flex-1 flex flex-col">
                <label className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">Internal Processing Notes</label>
                <textarea 
                  value={processorNotes}
                  onChange={(e) => setProcessorNotes(e.target.value)}
                  placeholder="Type any internal notes to the agent here..." 
                  className="flex-1 w-full min-h-[80px] p-4 text-sm bg-white/5 border border-white/10 hover:border-white/30 rounded-xl text-white placeholder:text-indigo-300/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-400 focus-visible:border-indigo-400 transition-all resize-none shadow-inner backdrop-blur-sm" 
                />
              </div>

              {/* Action Buttons Grid */}
              <div className="pt-6 mt-6 border-t border-white/10 flex flex-col gap-3 shrink-0">
                
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    onClick={() => handleStatusChange("Processed")}
                    className="h-12 rounded-xl text-sm font-bold bg-emerald-500 hover:bg-emerald-600 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_4px_10px_rgba(16,185,129,0.3)] text-white transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Approve
                  </Button>

                  <Button 
                    onClick={() => handleStatusChange("Rejected")}
                    className="h-12 rounded-xl text-sm font-bold bg-red-500 hover:bg-red-600 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_4px_10px_rgba(239,68,68,0.3)] text-white transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    onClick={() => handleStatusChange("Need Info")}
                    variant="outline" 
                    className="h-12 rounded-xl text-sm font-bold text-amber-400 border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 cursor-pointer"
                  >
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Need Info
                  </Button>

                  <Button 
                    onClick={() => handleStatusChange("In Process")}
                    variant="outline" 
                    className="h-12 rounded-xl text-sm font-bold text-blue-400 border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 cursor-pointer"
                  >
                    <Activity className="w-4 h-4 mr-2" />
                    In Progress
                  </Button>
                </div>

                <div className="grid grid-cols-1">
                  <Button 
                    onClick={() => handleStatusChange("Connected")}
                    className="h-12 rounded-xl text-sm font-bold bg-gradient-to-r from-blue-600 to-indigo-600 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_4px_10px_rgba(79,70,229,0.4)] hover:brightness-110 text-white transition-all flex items-center justify-center gap-2 border border-blue-500/50 cursor-pointer"
                  >
                    <Barcode className="w-4 h-4 mr-2" />
                    Connected
                  </Button>
                </div>
                
                <Button 
                  onClick={() => {
                    if (sale) updateSaleProcessorNotes(sale.id, processorNotes);
                  }}
                  variant="ghost" 
                  className="w-full h-10 mt-2 rounded-xl text-sm font-bold text-indigo-300 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Edits (Without Status Change)
                </Button>
              </div>
            </div>
          </Card>

        </div>
      </div>
    </DashboardLayout>
  )
}
