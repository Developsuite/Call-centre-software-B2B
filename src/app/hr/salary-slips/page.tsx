"use client"

import React, { useState, useMemo, useRef } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card } from "@/components/ui/card"
import { useAppContext } from "@/store/AppContext"
import { FileText, Printer, ChevronDown, Building2, Search, Save } from "lucide-react"
import { toast } from "sonner"

export default function SalarySlipsPage() {
  const { hrEmployees, hrLeaves, currentUser, isLoaded, tenants, formatCurrency, saveSalaryRecords } = useAppContext()

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  // Manual overrides per employee: { [employeeId]: { connectedSales: number, loanDeduction: number, manualAbsences?: number } }
  const [overrides, setOverrides] = useState<Record<string, { connectedSales: number, loanDeduction: number, manualAbsences?: number }>>({})



  const tenantEmployees = currentUser?.role === "SuperAdmin"
    ? hrEmployees
    : hrEmployees.filter(e => e.organization_id === currentUser?.tenantId)

  const activeEmployees = tenantEmployees.filter(e => e.status === "Active" && e.role !== "SuperAdmin")

  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("All")

  const uniqueRoles = useMemo(() => {
    return Array.from(new Set(activeEmployees.map(e => e.job_title || "Unassigned"))).sort()
  }, [activeEmployees])

  const filteredEmployees = useMemo(() => {
    return activeEmployees.filter(e => {
      const matchesSearch = !searchQuery.trim() || e.full_name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesRole = roleFilter === "All" || (e.job_title || "Unassigned") === roleFilter
      return matchesSearch && matchesRole
    })
  }, [activeEmployees, searchQuery, roleFilter])

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
    return filteredEmployees.map(emp => {
      const baseSalary = Number(emp.base_salary) || 0
      const commissionRate = Number(emp.commission_per_sale) || 0

      // Count leaves for this month
      const empLeaves = hrLeaves.filter(l => {
        const d = new Date(l.leave_date)
        return l.employee_id === emp.id && d.getFullYear() === selectedYear && d.getMonth() + 1 === selectedMonthNum
      })

      // Get overrides or defaults
      const override = overrides[emp.id] || { connectedSales: 0, loanDeduction: 0 }
      
      const calcTotalAbsences = empLeaves.length
      const totalAbsences = override.manualAbsences !== undefined ? override.manualAbsences : calcTotalAbsences
      const paidLeaves = empLeaves.filter(l => l.is_paid).length
      const unpaidAbsences = override.manualAbsences !== undefined ? Math.max(0, totalAbsences - paidLeaves) : calcTotalAbsences - paidLeaves

      const perDaySalary = workingDays > 0 ? baseSalary / workingDays : 0
      const absenceDeduction = unpaidAbsences * perDaySalary

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
  }, [filteredEmployees, hrLeaves, selectedYear, selectedMonthNum, workingDays, overrides])

  const updateOverride = (employeeId: string, field: 'connectedSales' | 'loanDeduction' | 'manualAbsences', value: number | undefined) => {
    setOverrides(prev => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId] || { connectedSales: 0, loanDeduction: 0 },
        [field]: value
      }
    }))
  }

  const slipRefs = useRef<HTMLDivElement>(null)

  const [isSaving, setIsSaving] = useState(false)
  const handleSaveRecords = async () => {
    try {
      setIsSaving(true)
      const recordsToSave = slipData.map(slip => ({
        employee_id: slip.employee.id,
        month: selectedMonth,
        base_salary: slip.baseSalary,
        commission_earned: slip.commissionEarned,
        absence_deduction: slip.absenceDeduction,
        loan_deduction: slip.loanDeduction,
        gross_salary: slip.grossSalary,
        net_salary: slip.netSalary
      }))
      await saveSalaryRecords(recordsToSave)
      toast.success('Salary records saved successfully!')
    } catch (e: any) {
      // toast is handled in AppContext
    } finally {
      setIsSaving(false)
    }
  }

  const handlePrint = (slipsToPrint = slipData) => {
    const container = slipRefs.current
    if (!container) return

    const printWindow = window.open('', '_blank', 'width=800,height=1100')
    if (!printWindow) {
      // Fallback if popup blocked
      window.print()
      return
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Salary Slips - ${monthLabel}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 6mm 8mm;
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 9px;
            color: black;
            background: white;
          }
          .slip {
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            overflow: hidden;
            margin-bottom: 6mm;
            page-break-inside: avoid;
            break-inside: avoid;
            min-height: 86mm;
          }
          .slip:nth-child(3n) {
            page-break-after: always;
            break-after: page;
            margin-bottom: 0;
          }
          .slip:last-child {
            page-break-after: auto;
            break-after: auto;
          }
          .slip-header {
            background: #1e293b;
            color: white;
            padding: 8px 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .slip-header h3 { font-size: 14px; font-weight: 700; margin: 0; }
          .slip-header small { font-size: 10px; opacity: 0.8; }
          .slip-body { padding: 10px 16px; }
          .info-row {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 8px;
            margin-bottom: 8px;
          }
          .info-row label { font-size: 8px; text-transform: uppercase; font-weight: 700; color: #94a3b8; letter-spacing: 0.5px; }
          .info-row p { font-size: 11px; font-weight: 600; margin-top: 2px; margin-bottom: 0; }
          .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 8px; }
          .section-title { font-size: 9px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 6px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
          .earn-title { color: #059669; }
          .ded-title { color: #dc2626; }
          .row { display: flex; justify-content: space-between; font-size: 10px; padding: 3px 0; }
          .row.border-top { border-top: 1px dashed #e2e8f0; padding-top: 4px; margin-top: 2px; }
          .row .val { font-weight: 700; }
          .row .ded { font-weight: 700; color: #dc2626; }
          .summary-row {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
            margin-bottom: 10px;
          }
          .summary-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            text-align: center;
            padding: 4px;
          }
          .summary-box label { font-size: 8px; text-transform: uppercase; font-weight: 700; color: #64748b; }
          .summary-box .num { font-size: 13px; font-weight: 800; color: #0f172a; margin-top: 2px; }
          .net-bar {
            background: #1e293b;
            color: white;
            border-radius: 4px;
            padding: 6px 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 6px;
          }
          .net-bar .label { font-size: 11px; font-weight: 700; opacity: 0.8; }
          .net-bar .amount { font-size: 16px; font-weight: 800; }
          .sig-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            border-top: 1px dashed #cbd5e1;
            padding-top: 8px;
            margin-top: 8px;
          }
          .sig-row .date { font-size: 9px; color: #94a3b8; }
          .sig-box { text-align: center; }
          .sig-box .line { width: 120px; border-bottom: 1px solid #94a3b8; margin-bottom: 4px; }
          .sig-box label { font-size: 9px; color: #94a3b8; font-weight: 600; }
        </style>
      </head>
      <body>
        ${slipsToPrint.map((slip, idx) => `
          <div class="slip">
            <div class="slip-header">
              <div>
                <h3>${orgName}</h3>
                <small>Salary Slip — ${monthLabel}</small>
              </div>
              <small>Slip #${idx + 1}</small>
            </div>
            <div class="slip-body">
              <div class="info-row">
                <div><label>Employee</label><p>${slip.employee.full_name}</p></div>
                <div><label>Job Title</label><p>${slip.employee.job_title || 'N/A'}</p></div>
                <div><label>CNIC</label><p>${slip.employee.cnic_number || 'N/A'}</p></div>
                <div><label>Joining Date</label><p>${slip.employee.joining_date ? new Date(slip.employee.joining_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</p></div>
              </div>
              <div class="two-col">
                <div>
                  <div class="section-title earn-title">Earnings</div>
                  <div class="row"><span>Base Salary</span><span class="val">PKR ${formatCurrency(slip.baseSalary)}</span></div>
                  <div class="row"><span>Connected Sales ${slip.commissionRate > 0 ? `(${slip.connectedSales} × PKR ${slip.commissionRate})` : ''}</span><span class="val">${slip.commissionRate > 0 ? `PKR ${formatCurrency(Math.round(slip.commissionEarned))}` : 'N/A'}</span></div>
                  <div class="row border-top"><span><b>Gross Salary</b></span><span class="val">PKR ${formatCurrency(Math.round(slip.grossSalary))}</span></div>
                </div>
                <div>
                  <div class="section-title ded-title">Deductions</div>
                  <div class="row"><span>Absences (${slip.unpaidAbsences} unpaid of ${slip.totalAbsences})</span><span class="ded">-PKR ${formatCurrency(Math.round(slip.absenceDeduction))}</span></div>
                  <div class="row"><span>Loan / Advance / Penalty</span><span class="ded">-PKR ${formatCurrency(Math.round(slip.loanDeduction))}</span></div>
                  <div class="row border-top"><span><b>Total Deductions</b></span><span class="ded">-PKR ${formatCurrency(Math.round(slip.totalDeductions))}</span></div>
                </div>
              </div>
              <div class="summary-row">
                <div class="summary-box"><label>Working Days</label><div class="num">${slip.workingDays}</div></div>
                <div class="summary-box"><label>Total Absences</label><div class="num">${slip.totalAbsences}</div></div>
                <div class="summary-box"><label>Paid Leave</label><div class="num">${slip.paidLeaves}</div></div>
                <div class="summary-box"><label>Per Day</label><div class="num">PKR ${formatCurrency(Math.round(slip.perDaySalary))}</div></div>
              </div>
              <div class="net-bar">
                <span class="label">NET SALARY</span>
                <span class="amount">PKR ${formatCurrency(slip.netSalary)}</span>
              </div>
              <div class="sig-row">
                <div class="date">Generated: ${new Date().toLocaleDateString('en-GB')}</div>
                <div class="sig-box"><div class="line"></div><label>Employee Signature</label></div>
                <div class="sig-box"><div class="line"></div><label>HR Signature</label></div>
              </div>
            </div>
          </div>
        `).join('')}
      </body>
      </html>
    `)

    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 300)
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
          
          <div className="flex flex-col sm:flex-row items-center gap-3 relative z-10 flex-wrap justify-end mt-4 md:mt-0">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search employee..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="h-9 pl-9 pr-4 w-full sm:w-48 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full outline-none focus:ring-2 focus:ring-[#ff5a36]/50 transition-all text-slate-800 dark:text-white shadow-sm"
              />
            </div>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="h-9 px-4 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full outline-none focus:ring-2 focus:ring-[#ff5a36]/50 transition-all text-slate-800 dark:text-white shadow-sm"
            >
              <option value="All">All Roles</option>
              {uniqueRoles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>

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
              onClick={() => handlePrint(slipData)}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white rounded-full h-9 px-4 shadow-lg transition-all text-sm font-bold"
            >
              <Printer className="w-4 h-4" /> Print {slipData.length > 0 ? slipData.length : ''} Slips
            </button>

            <button
              onClick={handleSaveRecords}
              disabled={isSaving || slipData.length === 0}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50 text-white rounded-full h-9 px-4 shadow-lg transition-all text-sm font-bold"
            >
              <Save className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save Records'}
            </button>
          </div>
        </div>

        {/* Slips Container */}
        <div ref={slipRefs} className="salary-slips-container space-y-4 print:space-y-0">
          {slipData.map((slip, idx) => (
            <div
              key={slip.employee.id}
              className="salary-slip bg-white dark:bg-slate-900 rounded-[1.5rem] print:rounded-none border border-slate-200 dark:border-slate-700 shadow-lg print:shadow-none overflow-hidden print:border print:border-slate-300 print:break-inside-avoid print:mb-8"
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
                <div className="flex items-center gap-4 text-right">
                  <p className="text-[10px] text-slate-400 print:text-slate-300">Slip #{idx + 1}</p>
                  <button 
                    onClick={() => handlePrint([slip])} 
                    className="flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-md px-2 py-1 text-[10px] font-bold transition-all print:hidden"
                  >
                    <Printer className="w-3 h-3" /> Print
                  </button>
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
                      <div className="flex justify-between items-center text-sm print:text-[11px]">
                        <span className="text-slate-500 dark:text-slate-400 print:text-black">
                          Absences
                          <span className="text-[10px] text-slate-400 print:text-slate-600 ml-1">({slip.unpaidAbsences} unpaid of {slip.totalAbsences})</span>
                        </span>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={0}
                            placeholder={slip.totalAbsences.toString()}
                            value={overrides[slip.employee.id]?.manualAbsences ?? ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateOverride(slip.employee.id, 'manualAbsences', val === '' ? undefined : Number(val))
                            }}
                            className="w-14 h-7 text-center text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-1 focus:ring-rose-500 font-bold print:hidden"
                          />
                          <span className="hidden print:inline font-bold text-black">-PKR {formatCurrency(Math.round(slip.absenceDeduction))}</span>
                          <span className="font-bold text-rose-600 print:hidden min-w-[80px] text-right">-PKR {formatCurrency(Math.round(slip.absenceDeduction))}</span>
                        </div>
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
                <div className="bg-gradient-to-r from-slate-800 to-slate-900 dark:from-indigo-900/50 dark:to-slate-800/50 print:bg-slate-800 rounded-xl print:rounded-md px-5 py-3 print:px-3 print:py-2 flex items-center justify-between print:color-adjust-exact text-white">
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
