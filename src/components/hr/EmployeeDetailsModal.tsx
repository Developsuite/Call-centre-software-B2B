"use client"

import React from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { HREmployee } from "@/store/AppContext"
import { 
  UserCircle, 
  Briefcase, 
  CreditCard, 
  Mail, 
  Phone, 
  MapPin, 
  FileText,
  CalendarDays,
  Hash
} from "lucide-react"

interface EmployeeDetailsModalProps {
  employee: HREmployee | null
  isOpen: boolean
  onClose: () => void
}

export function EmployeeDetailsModal({ employee, isOpen, onClose }: EmployeeDetailsModalProps) {
  if (!employee) return null

  const avatarUrlToUse = employee.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.full_name || 'Employee')}&background=random&color=fff&size=150`

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        
        {/* Top Header Section */}
        <div className="relative bg-slate-50 dark:bg-slate-800/50 p-6 flex items-start gap-5 border-b border-slate-100 dark:border-slate-800">
          <img 
            src={avatarUrlToUse} 
            alt={employee.full_name} 
            className="w-20 h-20 rounded-2xl object-cover ring-4 ring-white dark:ring-slate-900 shadow-sm"
          />
          <div className="flex-1 min-w-0 pt-1">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white truncate">{employee.full_name}</h2>
            <p className="text-sm text-[#ff5a36] font-semibold mt-1 truncate">{employee.job_title || "Unassigned Role"}</p>
            
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold tracking-wide ${
                  employee.employment_type === "Training" || employee.employment_type === "Probation"
                  ? "bg-amber-50/80 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                  : "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400"
              }`}>
                  {employee.employment_type || "Full-Time"}
              </span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wide ${
                  employee.status === "Active" 
                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' 
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
              }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${employee.status === "Active" ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                  {employee.status === "Active" ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Personal Info */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <UserCircle className="w-4 h-4" /> Personal Information
              </h3>
              
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Email Address</p>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2 mt-0.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {employee.email || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Mobile Number</p>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2 mt-0.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {employee.mobile_number || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">CNIC Number</p>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2 mt-0.5">
                    <Hash className="w-3.5 h-3.5 text-slate-400" />
                    {employee.cnic_number || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Home Address</p>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {employee.home_address || "-"}
                  </p>
                </div>
              </div>
            </div>

            {/* Work & Documents */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Briefcase className="w-4 h-4" /> Work & Compensation
              </h3>
              
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Joining Date</p>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2 mt-0.5">
                    <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                    {employee.joining_date || "-"}
                  </p>
                </div>
                {(employee.employment_type === "Training" || employee.employment_type === "Probation") && employee.probation_end_date && (
                  <div>
                    <p className="text-[10px] text-[#ff5a36] uppercase font-semibold">Probation End Date</p>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2 mt-0.5">
                      <CalendarDays className="w-3.5 h-3.5 text-[#ff5a36]/60" />
                      {employee.probation_end_date}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Base Salary</p>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2 mt-0.5">
                    <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                    PKR {Number(employee.base_salary).toLocaleString()}
                  </p>
                </div>
                
                <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-3">
                    <FileText className="w-4 h-4" /> Documents
                  </h3>
                  
                  {employee.document_url ? (
                    <a 
                      href={employee.document_url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="inline-flex items-center justify-center w-full px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 dark:text-blue-400 rounded-xl text-sm font-semibold transition-colors"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      View Uploaded Document
                    </a>
                  ) : (
                    <div className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-center border border-dashed border-slate-200 dark:border-slate-700">
                      <p className="text-sm text-slate-400">No document uploaded</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>

      </DialogContent>
    </Dialog>
  )
}
