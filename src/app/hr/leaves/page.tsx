"use client"

import React, { useState, useMemo } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card } from "@/components/ui/card"
import { useAppContext, HRLeave } from "@/store/AppContext"
import { CalendarOff, Plus, Trash2, CalendarDays, ShieldCheck, ShieldX, Filter } from "lucide-react"
import { toast } from "sonner"

export default function LeaveManagementPage() {
  const { hrEmployees, hrLeaves, currentUser, isLoaded, addHRLeave, deleteHRLeave } = useAppContext()

  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [filterEmployee, setFilterEmployee] = useState("All")
  const [filterType, setFilterType] = useState("All")

  // Add leave form state
  const [formEmployeeId, setFormEmployeeId] = useState("")
  const [formDate, setFormDate] = useState("")
  const [formType, setFormType] = useState<"Casual" | "Sick" | "Unpaid">("Casual")
  const [formReason, setFormReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)



  const tenantEmployees = currentUser?.role === "SuperAdmin"
    ? hrEmployees
    : hrEmployees.filter(e => e.organization_id === currentUser?.tenantId)

  const activeEmployees = tenantEmployees.filter(e => e.status === "Active")

  const [selectedYear, selectedMonthNum] = selectedMonth.split('-').map(Number)

  // Filter leaves for selected month
  const monthLeaves = hrLeaves.filter(l => {
    const d = new Date(l.leave_date)
    return d.getFullYear() === selectedYear && d.getMonth() + 1 === selectedMonthNum
  })

  // Filtered leaves
  const filteredLeaves = monthLeaves.filter(l => {
    const matchEmployee = filterEmployee === "All" || l.employee_id === filterEmployee
    const matchType = filterType === "All" || l.leave_type === filterType
    return matchEmployee && matchType
  }).sort((a, b) => new Date(b.leave_date).getTime() - new Date(a.leave_date).getTime())

  // Stats
  const totalLeaves = monthLeaves.length
  const paidLeaves = monthLeaves.filter(l => l.is_paid).length
  const unpaidLeaves = monthLeaves.filter(l => !l.is_paid).length

  const getEmployeeName = (id: string) => {
    return tenantEmployees.find(e => e.id === id)?.full_name || "Unknown"
  }

  // Check if employee already used paid leave this month
  const hasPaidLeaveThisMonth = (employeeId: string) => {
    return monthLeaves.some(l => l.employee_id === employeeId && l.is_paid)
  }

  const handleSubmitLeave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formEmployeeId || !formDate) {
      toast.error("Please select an employee and date.")
      return
    }

    setIsSubmitting(true)
    try {
      // Determine if this should be paid
      const leaveMonth = formDate.substring(0, 7)
      const existingPaidInMonth = hrLeaves.filter(l =>
        l.employee_id === formEmployeeId &&
        l.is_paid &&
        l.leave_date.startsWith(leaveMonth)
      )
      const isPaid = formType !== "Unpaid" && existingPaidInMonth.length === 0

      await addHRLeave({
        employee_id: formEmployeeId,
        leave_date: formDate,
        leave_type: formType,
        reason: formReason || undefined,
        is_paid: isPaid
      })

      setShowAddModal(false)
      setFormEmployeeId("")
      setFormDate("")
      setFormType("Casual")
      setFormReason("")
    } catch (err) {
      // handled in context
    }
    setIsSubmitting(false)
  }

  const handleDeleteLeave = async (leave: HRLeave) => {
    if (confirm(`Delete leave for ${getEmployeeName(leave.employee_id)} on ${leave.leave_date}?`)) {
      await deleteHRLeave(leave.id)
    }
  }

  // Generate month options
  const monthOptions = []
  const now = new Date()
  for (let i = -6; i <= 2; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleString('default', { month: 'long', year: 'numeric' })
    monthOptions.push({ value: val, label })
  }

  if (!isLoaded || !currentUser) {
    return (
      <DashboardLayout title="Leave Management">
        <div className="flex items-center justify-center h-[50vh]">
          <div className="w-6 h-6 border-2 border-[#ff5a36] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Leave Management">
      <div className="relative flex flex-col gap-5 font-sans max-w-[1200px] mx-auto w-full pb-10 min-h-screen overflow-x-hidden px-4 md:px-0">
        
        {/* Decorative Background */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-gradient-to-br from-[#ff5a36]/15 to-purple-500/15 rounded-full blur-[100px] pointer-events-none -z-10" />
        <div className="absolute bottom-[10%] right-[-10%] w-[40%] h-[40%] bg-gradient-to-br from-blue-500/15 to-emerald-500/15 rounded-full blur-[120px] pointer-events-none -z-10" />

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-gradient-to-br from-white/90 to-white/50 dark:from-slate-900/60 dark:to-slate-900/20 p-6 rounded-[1.5rem] border border-white/60 dark:border-slate-700/50 shadow-2xl shadow-[#ff5a36]/5 backdrop-blur-2xl relative overflow-hidden group transition-all duration-500 hover:shadow-[#ff5a36]/10">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full duration-1000 transition-transform pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-1">
              <div className="bg-amber-100 dark:bg-amber-500/10 p-2 rounded-xl text-amber-600">
                <CalendarOff className="w-5 h-5" />
              </div>
              <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Leave Management</h1>
            </div>
            <p className="text-slate-500 text-sm">Track and manage employee absences. 1 paid leave per month per employee.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 relative z-10">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="h-9 px-4 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full outline-none focus:ring-2 focus:ring-[#ff5a36]/50 transition-all text-slate-800 dark:text-white shadow-sm"
            >
              {monthOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-[#ff5a36] hover:bg-[#e04a29] text-white rounded-full h-9 px-4 shadow-[0_4px_10px_rgba(255,90,54,0.3)] transition-all text-sm font-bold"
            >
              <Plus className="w-4 h-4" /> Add Leave
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="rounded-[1.5rem] border-none shadow-lg p-5 bg-gradient-to-br from-slate-800 to-slate-900 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/10 to-transparent rounded-full -translate-y-8 translate-x-8" />
            <p className="text-[10px] font-bold text-white/70 uppercase tracking-wider mb-1">Total Leaves</p>
            <h3 className="text-3xl font-extrabold">{totalLeaves}</h3>
            <p className="text-xs text-white/50 mt-1">{new Date(selectedYear, selectedMonthNum - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
          </Card>
          <Card className="rounded-[1.5rem] border-none shadow-lg p-5 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/10 to-transparent rounded-full -translate-y-8 translate-x-8" />
            <p className="text-[10px] font-bold text-white/70 uppercase tracking-wider mb-1">Paid Leaves</p>
            <h3 className="text-3xl font-extrabold">{paidLeaves}</h3>
            <p className="text-xs text-white/50 mt-1">1 allowed per employee</p>
          </Card>
          <Card className="rounded-[1.5rem] border-none shadow-lg p-5 bg-gradient-to-br from-rose-500 to-rose-600 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/10 to-transparent rounded-full -translate-y-8 translate-x-8" />
            <p className="text-[10px] font-bold text-white/70 uppercase tracking-wider mb-1">Unpaid Leaves</p>
            <h3 className="text-3xl font-extrabold">{unpaidLeaves}</h3>
            <p className="text-xs text-white/50 mt-1">Salary deducted</p>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Employee</label>
            <select
              value={filterEmployee}
              onChange={(e) => setFilterEmployee(e.target.value)}
              className="w-full h-9 px-3 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-[#ff5a36]/50 transition-all text-slate-800 dark:text-white"
            >
              <option value="All">All Employees</option>
              {activeEmployees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.full_name}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Leave Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full h-9 px-3 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-[#ff5a36]/50 transition-all text-slate-800 dark:text-white"
            >
              <option value="All">All Types</option>
              <option value="Casual">Casual</option>
              <option value="Sick">Sick</option>
              <option value="Unpaid">Unpaid</option>
            </select>
          </div>
        </div>

        {/* Leave Table */}
        <Card className="rounded-[1.5rem] p-0 bg-white/70 dark:bg-slate-900/40 backdrop-blur-2xl border border-slate-200/30 dark:border-slate-700/50 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-white/30 dark:bg-slate-800/30 backdrop-blur-md border-b border-slate-200/70 dark:border-slate-700/50">
                <tr className="text-slate-500 font-medium text-xs uppercase tracking-wider">
                  <th className="py-4 px-6 font-bold">Employee</th>
                  <th className="py-4 px-6 font-bold">Date</th>
                  <th className="py-4 px-6 font-bold">Type</th>
                  <th className="py-4 px-6 font-bold text-center">Paid / Unpaid</th>
                  <th className="py-4 px-6 font-bold">Reason</th>
                  <th className="py-4 px-6 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeaves.map((leave, i) => {
                  const isLast = i === filteredLeaves.length - 1
                  return (
                    <tr key={leave.id} className={`group hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors ${!isLast ? 'border-b border-white/30 dark:border-slate-700/30' : ''}`}>
                      <td className="py-3 px-6">
                        <span className="font-bold text-slate-800 dark:text-white">{getEmployeeName(leave.employee_id)}</span>
                      </td>
                      <td className="py-3 px-6">
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                          <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(leave.leave_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </td>
                      <td className="py-3 px-6">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                          leave.leave_type === "Casual" ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400" :
                          leave.leave_type === "Sick" ? "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400" :
                          "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400"
                        }`}>
                          {leave.leave_type}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-center">
                        {leave.is_paid ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                            <ShieldCheck className="w-3 h-3" /> Paid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
                            <ShieldX className="w-3 h-3" /> Unpaid
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-6">
                        <span className="text-sm text-slate-500 dark:text-slate-400">{leave.reason || "-"}</span>
                      </td>
                      <td className="py-3 px-6 text-right">
                        <button
                          onClick={() => handleDeleteLeave(leave)}
                          className="p-1 text-rose-500 hover:text-rose-600 hover:scale-110 transform transition-all duration-200 opacity-0 group-hover:opacity-100"
                          title="Delete Leave"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
                {filteredLeaves.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <CalendarOff className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                      <p className="text-slate-500 font-medium">No leaves recorded for this month.</p>
                      <p className="text-sm text-slate-400">Click "Add Leave" to record an absence.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Add Leave Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 shadow-2xl relative border border-slate-100 dark:border-slate-800" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">✕</button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <CalendarOff className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">Record Leave</h2>
                <p className="text-sm text-slate-500">1 paid leave per employee per month.</p>
              </div>
            </div>

            <form onSubmit={handleSubmitLeave} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Employee</label>
                <select
                  value={formEmployeeId}
                  onChange={(e) => setFormEmployeeId(e.target.value)}
                  required
                  className="w-full h-10 px-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-[#ff5a36]/50 text-slate-800 dark:text-white"
                >
                  <option value="" disabled>Select Employee</option>
                  {activeEmployees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.full_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Leave Date</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  required
                  className="w-full h-10 px-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-[#ff5a36]/50 text-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Leave Type</label>
                <div className="flex gap-2">
                  {(["Casual", "Sick", "Unpaid"] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setFormType(t)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                        formType === t
                          ? "bg-[#ff5a36] text-white shadow-lg shadow-[#ff5a36]/30"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {formEmployeeId && formDate && (
                <div className={`p-3 rounded-xl text-xs font-bold ${
                  (() => {
                    const leaveMonth = formDate.substring(0, 7)
                    const hasPaid = hrLeaves.some(l => l.employee_id === formEmployeeId && l.is_paid && l.leave_date.startsWith(leaveMonth))
                    if (formType === "Unpaid") return "bg-rose-50 dark:bg-rose-500/10 text-rose-600"
                    if (hasPaid) return "bg-rose-50 dark:bg-rose-500/10 text-rose-600"
                    return "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600"
                  })()
                }`}>
                  {(() => {
                    const leaveMonth = formDate.substring(0, 7)
                    const hasPaid = hrLeaves.some(l => l.employee_id === formEmployeeId && l.is_paid && l.leave_date.startsWith(leaveMonth))
                    if (formType === "Unpaid") return "⚠ This will be marked as UNPAID leave. Salary will be deducted."
                    if (hasPaid) return "⚠ Paid leave already used this month. This will be UNPAID."
                    return "✓ This will be a PAID leave (1st of the month)."
                  })()}
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Reason (Optional)</label>
                <textarea
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  placeholder="E.g. Personal emergency..."
                  className="w-full p-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-[#ff5a36]/50 min-h-[80px] resize-none text-slate-800 dark:text-white"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 w-full bg-[#ff5a36] hover:bg-[#e04a29] text-white font-bold h-12 rounded-xl transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : "Record Leave"}
              </button>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
