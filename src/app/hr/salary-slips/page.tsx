"use client"

import React, { useState, useMemo, useRef } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card } from "@/components/ui/card"
import { useAppContext } from "@/store/AppContext"
import { FileText, Printer, ChevronDown, Building2 } from "lucide-react"

export default function SalarySlipsPage() {
  const { hrEmployees, hrLeaves, currentUser, isLoaded, tenants, formatCurrency } = useAppContext()

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  // Manual overrides per employee: { [employeeId]: { connectedSales: number, loanDeduction: number } }
  const [overrides, setOverrides] = useState<Record<string, { connectedSales: number, loanDeduction: number }>>({})



  const tenantEmployees = currentUser?.role === "SuperAdmin"
    ? hrEmployees
    : hrEmployees.filter(e => e.organization_id === currentUser?.tenantId)

  const activeEmployees = tenantEmployees.filter(e => e.status === "Active" && e.role !== "SuperAdmin")

  const [selectedYear, selectedMonthNum] = selectedMonth.split('-').map(Number)

  // Calculate working days in month (exclude weekends - Sat/Sun)
  const getWorkingDays = (year: number, month: number) => {
    const daysInMonth = new Date(year, month, 0).getDate()
    let workingDays = 0
    for (let d = 1; d <= daysInMonth; d++) {
      const day = new Date(year, month - 1, d).getDay()
      if (day !== 0) workingDays++ // Only exclude Sunday
    }
    return workingDays
  }

  const workingDays = getWorkingDays(selectedYear, selectedMonthNum)

  // Build slip data for each employee
  const slipData = useMemo(() => {
    return activeEmployees.map(emp => {
      const baseSalary = Number(emp.base_salary) || 0
      const commissionRate = Number(emp.commission_per_sale) || 0

      // Count leaves for this month
      const empLeaves = hrLeaves.filter(l => {
        const d = new Date(l.leave_date)
        return l.employee_id === emp.id && d.getFullYear() === selectedYear && d.getMonth() + 1 === selectedMonthNum
      })

      const totalAbsences = empLeaves.length
      const paidLeaves = empLeaves.filter(l => l.is_paid).length
      const unpaidAbsences = totalAbsences - paidLeaves

      const perDaySalary = workingDays > 0 ? baseSalary / workingDays : 0
      const absenceDeduction = unpaidAbsences * perDaySalary

      // Get overrides or defaults
      const override = overrides[emp.id] || { connectedSales: 0, loanDeduction: 0 }
      const connectedSales = override.connectedSales
      const commissionEarned = connectedSales * commissionRate
      const loanDeduction = override.loanDeduction

      const grossSalary = baseSalary + commissionEarned
      const totalDeductions = absenceDeduction + loanDeduction
      const netSalary = Math.max(0, Math.round(grossSalary - totalDeductions))

      return {
        employee: emp,
        baseSalary,
        commissionRate,
        workingDays,
        totalAbsences,
        paidLeaves,
        unpaidAbsences,
        perDaySalary,
        absenceDeduction,
        connectedSales,
        commissionEarned,
        loanDeduction,
        grossSalary,
        totalDeductions,
        netSalary
      }
    }).sort((a, b) => a.employee.full_name.localeCompare(b.employee.full_name))
  }, [activeEmployees, hrLeaves, selectedYear, selectedMonthNum, workingDays, overrides])

  const updateOverride = (employeeId: string, field: 'connectedSales' | 'loanDeduction', value: number) => {
    setOverrides(prev => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId] || { connectedSales: 0, loanDeduction: 0 },
        [field]: value
      }
    }))
  }

  const handlePrint = () => {
    window.print()
  }

  // Month options
  const monthOptions = []
  const now = new Date()
  for (let i = -6; i <= 2; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleString('default', { month: 'long', year: 'numeric' })
    monthOptions.push({ value: val, label })
  }

  const monthLabel = new Date(selectedYear, selectedMonthNum - 1).toLocaleString('default', { month: 'long', year: 'numeric' })

  const orgName = (() => {
    if (!currentUser?.tenantId) return "Dialixsale"
    const name = tenants.find(t => t.id === currentUser.tenantId)?.name || "Dialixsale"
    return name === "Ali's Call Centre" ? "Dialixsale" : name
  })()

  const totalNetPayroll = slipData.reduce((sum, s) => sum + Math.max(0, s.netSalary), 0)

  if (!isLoaded || !currentUser) {
    return (
      <DashboardLayout title="Salary Slips">
        <div className="flex items-center justify-center h-[50vh]">
          <div className="w-6 h-6 border-2 border-[#ff5a36] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Salary Slips">
      <div className="relative flex flex-col gap-5 font-sans max-w-[1200px] mx-auto w-full pb-10 min-h-screen overflow-x-hidden px-4 md:px-0">
        
        {/* Decorative Background */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-gradient-to-br from-[#ff5a36]/15 to-purple-500/15 rounded-full blur-[100px] pointer-events-none -z-10 print:hidden" />
        <div className="absolute bottom-[10%] right-[-10%] w-[40%] h-[40%] bg-gradient-to-br from-blue-500/15 to-emerald-500/15 rounded-full blur-[120px] pointer-events-none -z-10 print:hidden" />

        {/* Header - hidden during print */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-gradient-to-br from-white/90 to-white/50 dark:from-slate-900/60 dark:to-slate-900/20 p-6 rounded-[1.5rem] border border-white/60 dark:border-slate-700/50 shadow-2xl shadow-[#ff5a36]/5 backdrop-blur-2xl relative overflow-hidden group transition-all duration-500 hover:shadow-[#ff5a36]/10 print:hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full duration-1000 transition-transform pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-1">
              <div className="bg-indigo-100 dark:bg-indigo-500/10 p-2 rounded-xl text-indigo-600">
                <FileText className="w-5 h-5" />
              </div>
              <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Salary Slips</h1>
            </div>
            <p className="text-slate-500 text-sm">Generate, review, and print salary slips for all employees.</p>
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

            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full h-9 px-4 flex items-center text-sm font-bold text-emerald-600">
              Total: PKR {formatCurrency(totalNetPayroll)}
            </div>

            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white rounded-full h-9 px-4 shadow-lg transition-all text-sm font-bold"
            >
              <Printer className="w-4 h-4" /> Print All Slips
            </button>
          </div>
        </div>

        {/* Slips Container */}
        <div className="salary-slips-container space-y-4 print:space-y-0">
          {slipData.map((slip, idx) => (
            <div
              key={slip.employee.id}
              className="salary-slip bg-white dark:bg-slate-900 rounded-[1.5rem] print:rounded-none border border-slate-200 dark:border-slate-700 shadow-lg print:shadow-none overflow-hidden print:border print:border-slate-300"
            >
              {/* Slip Header */}
              <div className="bg-gradient-to-r from-slate-800 to-slate-900 dark:from-slate-700 dark:to-slate-800 text-white px-5 py-3 flex items-center justify-between print:bg-slate-800 print:py-2">
                <div className="flex items-center gap-3">
                  <Building2 className="w-4 h-4 text-slate-400 print:text-slate-300" />
                  <div>
                    <h3 className="font-bold text-sm print:text-xs">{orgName}</h3>
                    <p className="text-[10px] text-slate-400 print:text-slate-300">Salary Slip — {monthLabel}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 print:text-slate-300">Slip #{idx + 1}</p>
                </div>
              </div>

              {/* Slip Body */}
              <div className="p-5 print:p-3 print:text-[11px]">
                {/* Employee Info Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 print:mb-2 pb-3 print:pb-2 border-b border-slate-100 dark:border-slate-800 print:border-slate-300">
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Employee</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-white print:text-xs print:text-black">{slip.employee.full_name}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Job Title</p>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300 print:text-xs print:text-black">{slip.employee.job_title || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">CNIC</p>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300 print:text-xs print:text-black">{slip.employee.cnic_number || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Joining Date</p>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300 print:text-xs print:text-black">
                      {slip.employee.joining_date ? new Date(slip.employee.joining_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Earnings & Deductions side by side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:gap-2 mb-4 print:mb-2">
                  {/* Earnings */}
                  <div>
                    <h4 className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-2 print:mb-1">Earnings</h4>
                    <div className="space-y-1.5 print:space-y-0.5">
                      <div className="flex justify-between text-sm print:text-[11px]">
                        <span className="text-slate-500 dark:text-slate-400 print:text-black">Base Salary</span>
                        <span className="font-bold text-slate-800 dark:text-white print:text-black">PKR {formatCurrency(slip.baseSalary)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm print:text-[11px]">
                        <span className="text-slate-500 dark:text-slate-400 print:text-black">
                          Connected Sales
                          {slip.commissionRate > 0 && <span className="text-[10px] text-slate-400 print:text-slate-600"> (×PKR {slip.commissionRate})</span>}
                        </span>
                        <div className="flex items-center gap-2">
                          {slip.commissionRate > 0 ? (
                            <>
                              <input
                                type="number"
                                min={0}
                                placeholder="0"
                                value={slip.connectedSales === 0 ? '' : slip.connectedSales}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  updateOverride(slip.employee.id, 'connectedSales', val === '' ? 0 : Number(val))
                                }}
                                className="w-14 h-7 text-center text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 font-bold print:hidden"
                              />
                              <span className="hidden print:inline font-bold text-black">{slip.connectedSales}</span>
                              <span className="font-bold text-emerald-600 print:text-black min-w-[80px] text-right">PKR {formatCurrency(Math.round(slip.commissionEarned))}</span>
                            </>
                          ) : (
                            <span className="font-bold text-slate-400 dark:text-slate-500 print:text-slate-400 min-w-[80px] text-right uppercase text-xs">null</span>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between text-sm print:text-[11px] pt-1.5 print:pt-0.5 border-t border-slate-100 dark:border-slate-800 print:border-slate-300 font-bold">
                        <span className="text-slate-700 dark:text-slate-200 print:text-black">Gross Salary</span>
                        <span className="text-slate-800 dark:text-white print:text-black">PKR {formatCurrency(Math.round(slip.grossSalary))}</span>
                      </div>
                    </div>
                  </div>

                  {/* Deductions */}
                  <div>
                    <h4 className="text-[10px] font-bold text-rose-600 uppercase tracking-wider mb-2 print:mb-1">Deductions</h4>
                    <div className="space-y-1.5 print:space-y-0.5">
                      <div className="flex justify-between text-sm print:text-[11px]">
                        <span className="text-slate-500 dark:text-slate-400 print:text-black">
                          Absences ({slip.unpaidAbsences} unpaid)
                          <span className="text-[10px] text-slate-400 print:text-slate-600"> of {slip.totalAbsences} total</span>
                        </span>
                        <span className="font-bold text-rose-600 print:text-black">-PKR {formatCurrency(Math.round(slip.absenceDeduction))}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm print:text-[11px]">
                        <span className="text-slate-500 dark:text-slate-400 print:text-black">Loan / Advance / Penalty</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={0}
                            placeholder="0"
                            value={slip.loanDeduction === 0 ? '' : slip.loanDeduction}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateOverride(slip.employee.id, 'loanDeduction', val === '' ? 0 : Number(val))
                            }}
                            className="w-20 h-7 text-center text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-1 focus:ring-rose-500 font-bold print:hidden"
                          />
                          <span className="hidden print:inline font-bold text-black">-PKR {formatCurrency(Math.round(slip.loanDeduction))}</span>
                        </div>
                      </div>
                      <div className="flex justify-between text-sm print:text-[11px] pt-1.5 print:pt-0.5 border-t border-slate-100 dark:border-slate-800 print:border-slate-300 font-bold">
                        <span className="text-slate-700 dark:text-slate-200 print:text-black">Total Deductions</span>
                        <span className="text-rose-600 print:text-black">-PKR {formatCurrency(Math.round(slip.totalDeductions))}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Attendance Summary Row */}
                <div className="grid grid-cols-4 gap-2 mb-4 print:mb-2">
                  <div className="bg-slate-50 dark:bg-slate-800/50 print:bg-white print:border print:border-slate-300 rounded-xl print:rounded-md p-2 text-center">
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Working Days</p>
                    <p className="text-lg print:text-sm font-extrabold text-slate-800 dark:text-white print:text-black">{slip.workingDays}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 print:bg-white print:border print:border-slate-300 rounded-xl print:rounded-md p-2 text-center">
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Total Absences</p>
                    <p className="text-lg print:text-sm font-extrabold text-amber-600 print:text-black">{slip.totalAbsences}</p>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-500/5 print:bg-white print:border print:border-slate-300 rounded-xl print:rounded-md p-2 text-center">
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Paid Leave</p>
                    <p className="text-lg print:text-sm font-extrabold text-emerald-600 print:text-black">{slip.paidLeaves}</p>
                  </div>
                  <div className="bg-rose-50 dark:bg-rose-500/5 print:bg-white print:border print:border-slate-300 rounded-xl print:rounded-md p-2 text-center">
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Per Day</p>
                    <p className="text-lg print:text-sm font-extrabold text-slate-800 dark:text-white print:text-black">PKR {formatCurrency(Math.round(slip.perDaySalary))}</p>
                  </div>
                </div>

                {/* Net Salary */}
                <div className="bg-gradient-to-r from-slate-800 to-slate-900 dark:from-indigo-900/50 dark:to-slate-800/50 print:bg-slate-800 rounded-xl print:rounded-md px-5 py-3 print:px-3 print:py-2 flex items-center justify-between">
                  <span className="text-white/70 text-sm font-bold print:text-xs print:text-white">NET SALARY</span>
                  <span className="text-white text-2xl print:text-lg font-extrabold">PKR {formatCurrency(slip.netSalary)}</span>
                </div>

                {/* Signature Line - print only */}
                <div className="hidden print:flex justify-between items-end mt-4 pt-3 border-t border-dashed border-slate-300">
                  <div>
                    <p className="text-[9px] text-slate-400">Generated: {new Date().toLocaleDateString('en-GB')}</p>
                  </div>
                  <div className="text-center">
                    <div className="w-40 border-b border-slate-400 mb-1"></div>
                    <p className="text-[9px] text-slate-400">Employee Signature</p>
                  </div>
                  <div className="text-center">
                    <div className="w-40 border-b border-slate-400 mb-1"></div>
                    <p className="text-[9px] text-slate-400">HR Signature</p>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {slipData.length === 0 && (
            <Card className="rounded-[1.5rem] border-none shadow-lg p-16 bg-white dark:bg-slate-900 text-center print:hidden">
              <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No active employees found.</p>
              <p className="text-sm text-slate-400">Add employees to generate salary slips.</p>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
