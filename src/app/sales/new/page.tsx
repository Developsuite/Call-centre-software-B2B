"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useAppContext } from "@/store/AppContext"
import { 
  User, 
  Building, 
  Phone, 
  Mail, 
  CheckCircle2,
  Save,
  Info,
  CreditCard,
  FileText,
  Calendar as CalendarIcon
} from "lucide-react"

export default function NewSalePage() {
  const router = useRouter()
  const { addSale, users, currentUser } = useAppContext()

  // Only get processors in the same tenant
  const activeProcessors = users.filter(u => u.role === "Processor" && u.status === "Active" && u.tenantId === currentUser?.tenantId);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    accountType: "personal" as "personal" | "business",
    firstName: "",
    lastName: "",
    companyName: "",
    email: "",
    phone: "",
    dob: "",
    ssn: "",
    homeAddress: "",
    taxId: "",
    yearsActive: "",
    businessAddress: "",
    city: "",
    zipCode: "",
    status: "Pending",
    assignedTo: "Unassigned",
    notes: ""
  })

  const usCities = [
    "New York, NY", "Los Angeles, CA", "Chicago, IL", "Houston, TX", "Phoenix, AZ",
    "Philadelphia, PA", "San Antonio, TX", "San Diego, CA", "Dallas, TX", "San Jose, CA",
    "Austin, TX", "Jacksonville, FL", "Fort Worth, TX", "Columbus, OH", "Charlotte, NC",
    "San Francisco, CA", "Indianapolis, IN", "Seattle, WA", "Denver, CO", "Washington, DC"
  ].sort();

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      const customerName = formData.accountType === "personal" 
        ? `${formData.firstName} ${formData.lastName}`.trim() || "New Customer"
        : formData.companyName || "New Customer";

      await addSale({
        customer: customerName,
        agent: currentUser?.name || "Unknown Agent",
        team: currentUser?.team || "No Team",
        accountType: formData.accountType === "personal" ? "Personal" : "Enterprise",
        status: formData.status as any,
        notes: formData.notes,
        formData: { ...formData }, // Store all dynamic data
        assignedTo: formData.assignedTo === "Unassigned" ? undefined : formData.assignedTo,
        tenantId: currentUser?.tenantId || "UNKNOWN"
      })
      router.push('/')
    } finally {
      setIsSubmitting(false);
    }
  }

  // Common input class for the thin orange outline
  const inputClass = "h-10 text-sm bg-slate-50/50 dark:bg-background border border-[#ff5a36]/30 hover:border-[#ff5a36]/60 rounded-lg text-slate-800 dark:text-white focus-visible:ring-1 focus-visible:ring-[#ff5a36] focus-visible:border-[#ff5a36] transition-all"

  return (
    <DashboardLayout title="New Sale Application">
      <div className="max-w-[98%] mx-auto w-full flex flex-col gap-5 relative pb-6 h-[calc(100vh-8rem)]">
        
        {/* Background glow */}
        <div className="absolute top-[30%] left-[50%] -translate-x-1/2 w-[60%] h-[40%] bg-[#ff5a36]/5 dark:bg-[#ff5a36]/10 blur-[120px] rounded-full pointer-events-none" />

        {/* 3-Column Grid Container - No Scrolling Required */}
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
            
            <div className="flex flex-col gap-5 flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">First Name</label>
                  <Input 
                    placeholder="John" 
                    className={inputClass} 
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Last Name</label>
                  <Input 
                    placeholder="Doe" 
                    className={inputClass} 
                    value={formData.lastName}
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
                    value={formData.email}
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
                    value={formData.phone}
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
                  onClick={() => setFormData({ ...formData, accountType: "personal" })}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all",
                    formData.accountType === "personal" 
                      ? "bg-gradient-to-b from-[#ff7a5c] to-[#ff5a36] text-white shadow-sm" 
                      : "text-slate-500 hover:text-[#ff5a36]"
                  )}
                >
                  <User className="w-3.5 h-3.5" /> Personal
                </button>
                <button 
                  onClick={() => setFormData({ ...formData, accountType: "business" })}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all",
                    formData.accountType === "business" 
                      ? "bg-gradient-to-b from-[#ff7a5c] to-[#ff5a36] text-white shadow-sm" 
                      : "text-slate-500 hover:text-[#ff5a36]"
                  )}
                >
                  <Building className="w-3.5 h-3.5" /> Business
                </button>
              </div>
            </div>

            <div className="flex-1 mt-2">
              {formData.accountType === "personal" ? (
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
                          value={formData.dob}
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
                      <PasswordInput 
                        placeholder="XXX-XX-XXXX" 
                        className={inputClass} 
                        value={formData.ssn}
                        onChange={(e) => setFormData({ ...formData, ssn: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Home Address</label>
                    <Input 
                      placeholder="123 Main St" 
                      className={inputClass} 
                      value={formData.homeAddress}
                      onChange={(e) => setFormData({ ...formData, homeAddress: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">City / State</label>
                      <select 
                        className={cn(inputClass, "w-full px-3")}
                        value={formData.city}
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
                        value={formData.zipCode}
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
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Tax ID / EIN</label>
                      <Input 
                        placeholder="XX-XXXXXXX" 
                        className={inputClass} 
                        value={formData.taxId}
                        onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Years Active</label>
                      <Input 
                        type="number" 
                        placeholder="5" 
                        className={inputClass} 
                        value={formData.yearsActive}
                        onChange={(e) => setFormData({ ...formData, yearsActive: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Business Address</label>
                    <Input 
                      placeholder="456 Corporate Blvd" 
                      className={inputClass} 
                      value={formData.businessAddress}
                      onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">City / State</label>
                      <select 
                        className={cn(inputClass, "w-full px-3")}
                        value={formData.city}
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
                        value={formData.zipCode}
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
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">Review & Submit</h2>
                <p className="text-xs text-slate-500 mt-0.5">Finalize application</p>
              </div>
            </div>
            
            <div className="flex flex-col flex-1 mt-2">
              <div className="space-y-1.5 flex flex-col mb-4">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Assign Processor</label>
                  <select
                    required
                    value={formData.assignedTo}
                    onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                    className="w-full h-12 px-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff5a36] focus:border-transparent transition-all text-sm font-medium cursor-pointer"
                  >
                    <option value="Unassigned">Unassigned (Global Pool)</option>
                    <option value="Self">⚡ Process Myself</option>
                    <optgroup label="Processors">
                      {activeProcessors.map(p => (
                        <option key={p.id} value={p.id}>{p.name} (Processor)</option>
                      ))}
                    </optgroup>
                  </select>
                </div>

              <div className="space-y-1.5 flex-1 flex flex-col">
                <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Processor Notes (Optional)</label>
                <textarea 
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Enter any special instructions or context for the processor..." 
                  className="flex-1 w-full min-h-[80px] p-4 text-sm bg-slate-50/50 dark:bg-background border border-[#ff5a36]/30 hover:border-[#ff5a36]/60 rounded-xl text-slate-800 dark:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#ff5a36] focus-visible:border-[#ff5a36] transition-all resize-none" 
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-6 mt-6 border-t border-slate-100 dark:border-border flex flex-col gap-3 shrink-0">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full h-12 rounded-xl text-sm font-bold bg-gradient-to-b from-[#404040] to-[#111111] dark:from-[#3a414e] dark:to-[#0f172a] shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_4px_10px_rgba(0,0,0,0.3)] border border-[#2a2a2a] dark:border-border hover:brightness-110 text-white transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Submit to Processor
                    </>
                  )}
                </button>

                <Button 
                  variant="outline" 
                  disabled={isSubmitting}
                  className="w-full h-10 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 border-[#ff5a36]/30 hover:bg-[#ff5a36]/5 hover:text-[#ff5a36]"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save as Draft
                </Button>
              </div>
            </div>
          </Card>
        </fieldset>
      </div>
    </DashboardLayout>
  )
}
