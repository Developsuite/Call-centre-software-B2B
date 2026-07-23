"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useAppContext } from "@/store/AppContext"
import { 
  User, 
  Phone, 
  Mail, 
  CheckCircle2,
  Info,
  CreditCard,
  Briefcase,
  Calendar as CalendarIcon,
  Upload,
  Image as ImageIcon,
  ArrowLeft,
  Loader2
} from "lucide-react"
import Link from "next/link"
import { createClient } from "@/utils/supabase/client"
import { toast } from "sonner"

export default function NewHREmployeePage() {
  const router = useRouter()
  const { addHREmployee, currentUser, teams } = useAppContext()

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    father_name: "",
    cnic_number: "",
    mobile_number: "",
    email: "",
    home_address: "",
    avatar_url: "",
    document_url: "",
    job_title: "",
    role: "Agent", // Default system role
    team: "",
    joining_date: "",
    employment_type: "Full-Time",
    base_salary: 3000,
    commission_per_sale: 50,
    status: "Active" as "Active" | "Disabled"
  })

  const tenantTeams = teams.filter(t => t.organization_id === currentUser?.tenantId);
  const supabase = createClient();
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, field: 'avatar_url' | 'document_url') => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (field === 'avatar_url') setIsUploadingPhoto(true);
    else setIsUploadingDoc(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `${currentUser?.tenantId}/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('hr-documents')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('hr-documents')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, [field]: publicUrl }));
      toast.success("File uploaded successfully");
    } catch (error: any) {
      toast.error(`Upload failed: ${error.message}`);
    } finally {
      if (field === 'avatar_url') setIsUploadingPhoto(false);
      else setIsUploadingDoc(false);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      await addHREmployee({
        ...formData,
        organization_id: currentUser?.tenantId || ""
      })
      router.push('/hr/employees')
    } catch (err) {
      console.error("Failed to add employee:", err);
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputClass = "h-10 text-sm bg-slate-50/50 dark:bg-background border border-[#ff5a36]/30 hover:border-[#ff5a36]/60 rounded-lg text-slate-800 dark:text-white focus-visible:ring-1 focus-visible:ring-[#ff5a36] focus-visible:border-[#ff5a36] transition-all"

  return (
    <DashboardLayout title="New Employee Onboarding">
      <div className="max-w-[98%] mx-auto w-full flex flex-col gap-5 relative pb-6 lg:h-[calc(100vh-8rem)] min-h-[calc(100vh-8rem)]">
        
        {/* Background glow */}
        <div className="absolute top-[30%] left-[50%] -translate-x-1/2 w-[60%] h-[40%] bg-[#ff5a36]/5 dark:bg-[#ff5a36]/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="flex items-center gap-2 mb-2">
            <Link href="/hr/employees">
                <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back to Directory
                </Button>
            </Link>
        </div>

        {/* 3-Column Grid Container */}
        <fieldset disabled={isSubmitting} className={cn("grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10 lg:h-[calc(100%-40px)]", isSubmitting && "opacity-70 pointer-events-none")}>
          
          {/* COLUMN 1: Personal Info */}
          <Card className="rounded-[1.5rem] border border-[#ff5a36]/10 shadow-[0_4px_20px_rgba(255,90,54,0.03)] bg-white dark:bg-card p-6 flex flex-col h-full overflow-y-auto custom-scrollbar">
            <div className="mb-6 flex items-center gap-3 shrink-0">
              <div className="w-8 h-8 rounded-full bg-[#ff5a36]/10 text-[#ff5a36] flex items-center justify-center">
                <Info className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">Personal Info</h2>
                <p className="text-xs text-slate-500 mt-0.5">Basic identity details</p>
              </div>
            </div>
            
            <div className="flex flex-col gap-5 flex-1">
                
              <div className="flex items-center gap-4 mb-2">
                 <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-400 overflow-hidden relative group">
                    {formData.avatar_url ? (
                        <img src={formData.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                        <ImageIcon className="w-6 h-6" />
                    )}
                    <label className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center cursor-pointer">
                        {isUploadingPhoto ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Upload className="w-4 h-4 text-white" />}
                        <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => handleFileUpload(e, 'avatar_url')}
                            disabled={isUploadingPhoto}
                        />
                    </label>
                 </div>
                 <div className="flex-1 space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Photo URL</label>
                    <Input 
                        placeholder="https://..." 
                        className={inputClass} 
                        value={formData.avatar_url}
                        onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                    />
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Full Name</label>
                  <Input 
                    placeholder="John Doe" 
                    className={inputClass} 
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Father's Name</label>
                  <Input 
                    placeholder="Richard Doe" 
                    className={inputClass} 
                    value={formData.father_name}
                    onChange={(e) => setFormData({ ...formData, father_name: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">CNIC Number</label>
                  <Input 
                    placeholder="XXXXX-XXXXXXX-X" 
                    className={inputClass} 
                    value={formData.cnic_number}
                    onChange={(e) => setFormData({ ...formData, cnic_number: e.target.value })}
                  />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                      type="email" 
                      placeholder="john@example.com" 
                      className={cn(inputClass, "pl-9")} 
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Mobile Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                      type="tel" 
                      placeholder="+1 234 567 890" 
                      className={cn(inputClass, "pl-9")} 
                      value={formData.mobile_number}
                      onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Home Address</label>
                <Input 
                  placeholder="123 Main St, City, Country" 
                  className={inputClass} 
                  value={formData.home_address}
                  onChange={(e) => setFormData({ ...formData, home_address: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">CNIC / Document Upload</label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center">
                        {isUploadingDoc ? <Loader2 className="w-4 h-4 text-slate-400 animate-spin" /> : <Upload className="w-4 h-4 text-slate-400" />}
                    </div>
                    <Input 
                      placeholder="Upload document..." 
                      className={cn(inputClass, "pl-9 cursor-pointer")} 
                      value={formData.document_url ? "Document Uploaded ✓" : ""}
                      readOnly
                    />
                    <input 
                        type="file" 
                        className="absolute inset-0 opacity-0 cursor-pointer" 
                        onChange={(e) => handleFileUpload(e, 'document_url')}
                        disabled={isUploadingDoc}
                    />
                  </div>
                  {formData.document_url && (
                    <a href={formData.document_url} target="_blank" rel="noreferrer" className="text-[10px] text-blue-500 hover:underline">
                        View Uploaded Document
                    </a>
                  )}
              </div>

            </div>
          </Card>

          {/* COLUMN 2: Employment Details */}
          <Card className="rounded-[1.5rem] border border-[#ff5a36]/10 shadow-[0_4px_20px_rgba(255,90,54,0.03)] bg-white dark:bg-card p-6 flex flex-col h-full overflow-y-auto custom-scrollbar">
            <div className="mb-6 flex flex-col 2xl:flex-row 2xl:items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#ff5a36]/10 text-[#ff5a36] flex items-center justify-center">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white">Employment</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Role and placement</p>
                </div>
              </div>
            </div>

            <div className="flex-1 mt-2 flex flex-col gap-5">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Job Title</label>
                    <Input 
                        placeholder="e.g. Senior Sales Rep, Trainer" 
                        className={inputClass}
                        value={formData.job_title}
                        onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">System Role</label>
                        <select 
                            className={cn(inputClass, "w-full px-3")}
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        >
                            <option value="Agent">Agent</option>
                            <option value="Processor">Processor</option>
                            <option value="HR">HR</option>
                            <option value="Admin">Admin</option>
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Team Placement</label>
                        <select 
                            className={cn(inputClass, "w-full px-3")}
                            value={formData.team}
                            onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                        >
                            <option value="">No Team</option>
                            {tenantTeams.map(t => (
                                <option key={t.id} value={t.name}>{t.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Joining Date</label>
                        <div className="relative flex items-center">
                            <Input 
                                type="text" 
                                placeholder="YYYY-MM-DD"
                                maxLength={10}
                                className={inputClass} 
                                value={formData.joining_date}
                                onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
                            />
                            <Popover>
                                <PopoverTrigger className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 hover:text-[#ff5a36] transition-colors p-1 rounded-md bg-transparent border-none">
                                <CalendarIcon className="w-4 h-4" />
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 z-50 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl shadow-xl" align="end">
                                <Calendar
                                    mode="single"
                                    selected={formData.joining_date ? new Date(formData.joining_date) : undefined}
                                    onSelect={(date) => {
                                        if (date) {
                                            const y = date.getFullYear();
                                            const m = String(date.getMonth() + 1).padStart(2, '0');
                                            const d = String(date.getDate()).padStart(2, '0');
                                            setFormData({ ...formData, joining_date: `${y}-${m}-${d}` });
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
                        <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Employment Type</label>
                        <select 
                            className={cn(inputClass, "w-full px-3")}
                            value={formData.employment_type}
                            onChange={(e) => setFormData({ ...formData, employment_type: e.target.value })}
                        >
                            <option value="Full-Time">Full-Time</option>
                            <option value="Part-Time">Part-Time</option>
                            <option value="Contract">Contract</option>
                            <option value="Internship">Internship</option>
                        </select>
                    </div>
                </div>

            </div>
          </Card>

          {/* COLUMN 3: Compensation & Submit */}
          <Card className="rounded-[1.5rem] border border-[#ff5a36]/10 shadow-[0_4px_20px_rgba(255,90,54,0.03)] bg-white dark:bg-card p-6 flex flex-col h-full overflow-y-auto custom-scrollbar">
            <div className="mb-6 flex items-center gap-3 shrink-0">
              <div className="w-8 h-8 rounded-full bg-[#ff5a36]/10 text-[#ff5a36] flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">Compensation</h2>
                <p className="text-xs text-slate-500 mt-0.5">Salary and status</p>
              </div>
            </div>
            
            <div className="flex flex-col flex-1 mt-2 gap-5">
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Basic Salary ($)</label>
                <Input 
                    type="number"
                    placeholder="3000" 
                    className={inputClass} 
                    value={formData.base_salary}
                    onChange={(e) => setFormData({ ...formData, base_salary: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Commission Per Connected Sale ($)</label>
                <Input 
                    type="number"
                    placeholder="50" 
                    className={inputClass} 
                    value={formData.commission_per_sale}
                    onChange={(e) => setFormData({ ...formData, commission_per_sale: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Employee Status</label>
                <select 
                    className={cn(inputClass, "w-full px-3", formData.status === 'Active' ? 'text-emerald-600 font-bold' : 'text-slate-500')}
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as "Active" | "Disabled" })}
                >
                    <option value="Active">Active</option>
                    <option value="Disabled">Inactive / Disabled</option>
                </select>
              </div>

              <div className="mt-auto pt-6 border-t border-slate-100 dark:border-border flex flex-col gap-3 shrink-0">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full h-12 rounded-xl text-sm font-bold bg-gradient-to-b from-[#404040] to-[#111111] dark:from-[#3a414e] dark:to-[#0f172a] shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_4px_10px_rgba(0,0,0,0.3)] border border-[#2a2a2a] dark:border-border hover:brightness-110 text-white transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving Employee...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Save Employee Record
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
