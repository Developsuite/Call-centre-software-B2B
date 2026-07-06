"use client"

import { useState, use, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useAppContext, SaleStatus } from "@/store/AppContext"
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
  Calendar as CalendarIcon,
  Save
} from "lucide-react"

export default function EditSalePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const resolvedParams = use(params)
  const { sales, editSale, users, currentUser } = useAppContext()

  // Only get processors in the same tenant
  const activeProcessors = users.filter(u => u.role === "Processor" && u.status === "Active" && u.tenantId === currentUser?.tenantId);

  const sale = sales.find(s => s.id.toLowerCase() === resolvedParams.id.toLowerCase())
  
  const [accountType, setAccountType] = useState<"personal" | "business">("personal")
  const [formData, setFormData] = useState<any>({})
  const [notes, setNotes] = useState("")
  const [assignedTo, setAssignedTo] = useState("Unassigned")
  const [status, setStatus] = useState<SaleStatus | "">("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const usCities = [
    "New York, NY", "Los Angeles, CA", "Chicago, IL", "Houston, TX", "Phoenix, AZ",
    "Philadelphia, PA", "San Antonio, TX", "San Diego, CA", "Dallas, TX", "San Jose, CA",
    "Austin, TX", "Jacksonville, FL", "Fort Worth, TX", "Columbus, OH", "Charlotte, NC",
    "San Francisco, CA", "Indianapolis, IN", "Seattle, WA", "Denver, CO", "Washington, DC"
  ].sort();

  useEffect(() => {
    if (sale) {
      setAccountType(sale.accountType.toLowerCase() === "personal" ? "personal" : "business")
      setFormData(sale.formData || {})
      setNotes(sale.notes || "")
      setAssignedTo(sale.processor_id || "Unassigned")
      setStatus(sale.status)
    }
  }, [sale])

  if (!sale) {
    return (
      <DashboardLayout title="Sale Not Found">
        <div className="flex flex-col items-center justify-center h-[50vh]">
          <h2 className="text-2xl font-bold">Sale {resolvedParams.id} not found.</h2>
          <Link href="/">
            <Button className="mt-4">Back to Dashboard</Button>
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  const handleUpdate = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      const customerName = accountType === "personal" 
        ? `${formData.firstName || ''} ${formData.lastName || ''}`.trim() || sale.customer
        : formData.companyName || sale.customer;

      await editSale(sale.id, {
        customer: customerName,
        accountType: accountType === "personal" ? "Personal" : "Business",
        notes: notes,
        formData: { ...formData },
        status: status || sale.status, 
        assignedTo: assignedTo === "Unassigned" ? undefined : assignedTo
      })
      router.push(`/sales/${sale.id}`)
    } finally {
      setIsSubmitting(false);
    }
  }

  // Common input class for the thin orange outline
  const inputClass = "h-10 text-sm bg-slate-50/50 dark:bg-background border border-[#ff5a36]/30 hover:border-[#ff5a36]/60 rounded-lg text-slate-800 dark:text-white focus-visible:ring-1 focus-visible:ring-[#ff5a36] focus-visible:border-[#ff5a36] transition-all"

  return (
    <DashboardLayout title={`Editing Sale: ${resolvedParams.id.split('-')[0].toUpperCase()}`}>
      <div className="max-w-[98%] mx-auto w-full flex flex-col gap-5 relative pb-6 h-[calc(100vh-8rem)]">
        
        <div className="flex items-center justify-between z-20">
          <Link href={`/sales/${sale.id}`}>
            <Button variant="ghost" className="h-10 rounded-xl font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white px-4 cursor-pointer">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Cancel Editing
            </Button>
          </Link>
        </div>

        {/* Background glow */}
        <div className="absolute top-[30%] left-[50%] -translate-x-1/2 w-[60%] h-[40%] bg-[#ff5a36]/5 dark:bg-[#ff5a36]/10 blur-[120px] rounded-full pointer-events-none" />

        <fieldset disabled={isSubmitting} className={cn("grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10 h-full", isSubmitting && "opacity-70 pointer-events-none")}>
          
          {/* COLUMN 1: Basic Info */}
          <Card className="rounded-[1.5rem] border border-[#ff5a36]/10 shadow-[0_4px_20px_rgba(255,90,54,0.03)] bg-white dark:bg-card p-6 flex flex-col h-full">
            <div className="mb-6 flex items-center gap-3 shrink-0">
              <div className="w-8 h-8 rounded-full bg-[#ff5a36]/10 text-[#ff5a36] flex items-center justify-center">
                <Info className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">Customer Info</h2>
                <p className="text-xs text-slate-500 mt-0.5">Primary contact details</p>
              </div>
            </div>
            
            <div className="flex flex-col gap-5 overflow-y-auto pr-2 custom-scrollbar flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">First Name</label>
                  <Input 
                    placeholder="John" 
                    className={inputClass} 
                    value={formData.firstName || ''}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Last Name</label>
                  <Input 
                    placeholder="Doe" 
                    className={inputClass} 
                    value={formData.lastName || ''}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    type="email" 
                    placeholder="john.doe@example.com" 
                    className={cn(inputClass, "pl-9")}
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    type="tel" 
                    placeholder="+1 (555) 000-0000" 
                    className={cn(inputClass, "pl-9")}
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* COLUMN 2: Account Details */}
          <Card className="rounded-[1.5rem] border border-[#ff5a36]/10 shadow-[0_4px_20px_rgba(255,90,54,0.03)] bg-white dark:bg-card p-6 flex flex-col h-full">
            <div className="mb-6 flex flex-col 2xl:flex-row 2xl:items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#ff5a36]/10 text-[#ff5a36] flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white">Account Setup</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Select account type</p>
                </div>
              </div>
              
              {/* Account Type Toggle */}
              <div className="flex items-center bg-[#ff5a36]/5 dark:bg-background p-1 rounded-lg border border-[#ff5a36]/20 shrink-0 self-start 2xl:self-auto">
                <button 
                  onClick={() => setAccountType("personal")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all",
                    accountType === "personal" 
                      ? "bg-gradient-to-b from-[#ff7a5c] to-[#ff5a36] text-white shadow-sm" 
                      : "text-slate-500 hover:text-[#ff5a36]"
                  )}
                >
                  <User className="w-3.5 h-3.5" /> Personal
                </button>
                <button 
                  onClick={() => setAccountType("business")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all",
                    accountType === "business" 
                      ? "bg-gradient-to-b from-[#ff7a5c] to-[#ff5a36] text-white shadow-sm" 
                      : "text-slate-500 hover:text-[#ff5a36]"
                  )}
                >
                  <Building className="w-3.5 h-3.5" /> Business
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {accountType === "personal" ? (
                <div className="flex flex-col gap-5 animate-in fade-in duration-300">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Date of Birth</label>
                      <div className="relative flex items-center">
                        <Input 
                          type="text" 
                          placeholder="MM/DD/YYYY"
                          maxLength={10}
                          className={inputClass} 
                          value={formData.dob || ''}
                          onChange={(e) => {
                            let val = e.target.value.replace(/\D/g, '');
                            if (val.length > 8) val = val.substring(0, 8);
                            if (val.length > 4) {
                              val = val.substring(0, 2) + '/' + val.substring(2, 4) + '/' + val.substring(4);
                            } else if (val.length > 2) {
                              val = val.substring(0, 2) + '/' + val.substring(2);
                            }
                            setFormData({ ...formData, dob: val });
                          }}
                        />
                        <Popover>
                          <PopoverTrigger className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 hover:text-[#ff5a36] transition-colors p-1 rounded-md bg-transparent border-none">
                            <CalendarIcon className="w-4 h-4" />
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 z-50 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl shadow-xl" align="end">
                            <Calendar
                              mode="single"
                              selected={formData.dob ? new Date(formData.dob) : undefined}
                              onSelect={(date) => {
                                if (date) {
                                  const m = String(date.getMonth() + 1).padStart(2, '0');
                                  const d = String(date.getDate()).padStart(2, '0');
                                  const y = date.getFullYear();
                                  setFormData({ ...formData, dob: `${m}/${d}/${y}` });
                                }
                              }}
                              autoFocus
                              className="text-slate-800 dark:text-slate-200"
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">SSN</label>
                      <Input 
                        type="password" 
                        placeholder="XXX-XX-XXXX" 
                        className={inputClass} 
                        value={formData.ssn || ''}
                        onChange={(e) => setFormData({ ...formData, ssn: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Home Address</label>
                    <Input 
                      placeholder="123 Main St" 
                      className={inputClass} 
                      value={formData.homeAddress || ''}
                      onChange={(e) => setFormData({ ...formData, homeAddress: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">City / State</label>
                      <select 
                        className={cn(inputClass, "w-full px-3")}
                        value={formData.city || ''}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      >
                        <option value="">Select a city</option>
                        {usCities.map(city => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">ZIP Code</label>
                      <Input 
                        placeholder="10001" 
                        className={inputClass} 
                        value={formData.zipCode || ''}
                        onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-5 animate-in fade-in duration-300">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Company Name</label>
                    <Input 
                      placeholder="Acme Corp LLC" 
                      className={inputClass}
                      value={formData.companyName || ''}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Tax ID / EIN</label>
                      <Input 
                        placeholder="XX-XXXXXXX" 
                        className={inputClass} 
                        value={formData.taxId || ''}
                        onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Years Active</label>
                      <Input 
                        type="number" 
                        placeholder="5" 
                        className={inputClass} 
                        value={formData.yearsActive || ''}
                        onChange={(e) => setFormData({ ...formData, yearsActive: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Business Address</label>
                    <Input 
                      placeholder="456 Corporate Blvd" 
                      className={inputClass} 
                      value={formData.businessAddress || ''}
                      onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">City / State</label>
                      <select 
                        className={cn(inputClass, "w-full px-3")}
                        value={formData.city || ''}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      >
                        <option value="">Select a city</option>
                        {usCities.map(city => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">ZIP Code</label>
                      <Input 
                        placeholder="10001" 
                        className={inputClass} 
                        value={formData.zipCode || ''}
                        onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* COLUMN 3: Notes & Submit */}
          <Card className="rounded-[1.5rem] border border-[#ff5a36]/10 shadow-[0_4px_20px_rgba(255,90,54,0.03)] bg-white dark:bg-card p-6 flex flex-col h-full">
            <div className="mb-6 flex items-center gap-3 shrink-0">
              <div className="w-8 h-8 rounded-full bg-[#ff5a36]/10 text-[#ff5a36] flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">Update & Submit</h2>
                <p className="text-xs text-slate-500 mt-0.5">Revise application</p>
              </div>
            </div>
            
            <div className="flex flex-col flex-1">
              {/* Show Processor Note if Need Info */}
              {sale.processorNotes && (
                <div className="mb-4 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                  <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1">Processor Feedback</p>
                  <p className="text-xs text-amber-800 dark:text-amber-400 italic">"{sale.processorNotes}"</p>
                </div>
              )}

                <div className="space-y-1.5 flex flex-col mb-4">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Assign Processor</label>
                  <select
                    required
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="w-full h-12 px-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff5a36] focus:border-transparent transition-all text-sm font-medium cursor-pointer"
                  >
                    <option value="Unassigned">Unassigned (Global Pool)</option>
                    <option value="Self">⚡ Process Myself</option>
                    {activeProcessors.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (Processor)</option>
                    ))}
                  </select>
                </div>

                {/* Status Dropdown - Available to Processors/Admins OR the assigned Agent */}
                {(currentUser?.role === "SuperAdmin" || currentUser?.role === "Admin" || currentUser?.role === "Processor" || sale.processor_id === currentUser?.id) && (
                  <div className="space-y-1.5 flex flex-col mb-4">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Sale Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as SaleStatus)}
                      className="w-full h-12 px-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff5a36] focus:border-transparent transition-all text-sm font-medium cursor-pointer"
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Process">In Process</option>
                      <option value="Need Info">Need Info</option>
                      <option value="Processed">Processed</option>
                      <option value="Connected">Connected</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                )}

              <div className="space-y-1.5 flex-1 flex flex-col">
                <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Your Notes</label>
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Provide missing details or context for processor..." 
                  className="flex-1 w-full min-h-[100px] p-4 text-sm bg-slate-50/50 dark:bg-background border border-[#ff5a36]/30 hover:border-[#ff5a36]/60 rounded-xl text-slate-800 dark:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#ff5a36] focus-visible:border-[#ff5a36] transition-all resize-none" 
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-6 mt-6 border-t border-slate-100 dark:border-border flex flex-col gap-3 shrink-0">
                <button
                  onClick={handleUpdate}
                  disabled={isSubmitting}
                  className="w-full h-12 rounded-xl text-sm font-bold bg-gradient-to-b from-[#404040] to-[#111111] dark:from-[#3a414e] dark:to-[#0f172a] shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_4px_10px_rgba(0,0,0,0.3)] border border-[#2a2a2a] dark:border-border hover:brightness-110 text-white transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </Card>
        </fieldset>
      </div>
    </DashboardLayout>
  )
}
