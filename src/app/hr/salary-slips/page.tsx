"use client"

import React, { useState, useMemo, useRef, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card } from "@/components/ui/card"
import { useAppContext } from "@/store/AppContext"
import { useSearchParams } from "next/navigation"
import { FileText, Printer, Building2, Search, Save } from "lucide-react"
import { toast } from "sonner"

export default function SalarySlipsPage() {
  const { hrEmployees, hrLeaves, hrAttendance, currentUser, isLoaded, tenants, formatCurrency, saveSalaryRecords, teams } = useAppContext()

  const searchParams = useSearchParams()
  const teamFilter = searchParams.get('team')
  const teamObj = teamFilter ? teams.find(t => t.id === teamFilter) : null

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  // Manual overrides per employee: { [employeeId]: { connectedSales: number, transferSales: number, teamSales?: number, loanDeduction: number, manualAbsences?: number } }
  const [overrides, setOverrides] = useState<Record<string, { connectedSales: number, transferSales: number, teamSales?: number, loanDeduction: number, manualAbsences?: number }>>({})

  // Multi-selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [hasInitializedSelection, setHasInitializedSelection] = useState(false)

  const tenantEmployees = currentUser?.role === "SuperAdmin"
    ? hrEmployees
    : hrEmployees.filter(e => e.organization_id === currentUser?.tenantId)

  const activeEmployees = tenantEmployees.filter(e => {
    const isActive = e.status !== "Disabled" && e.role !== "SuperAdmin"
    if (!isActive) return false
    if (teamFilter) return e.team_id === teamFilter
    return true
  })

  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("All")

  const uniqueRoles = useMemo(() => {
    return Array.from(new Set(activeEmployees.map(e => e.job_title || "Unassigned"))).sort()
  }, [activeEmployees])

  const nonOfficeBoyCount = activeEmployees.filter(e => !(e.job_title || "").toLowerCase().includes("office boy")).length
  const officeBoyCount = activeEmployees.filter(e => (e.job_title || "").toLowerCase().includes("office boy")).length

  const filteredEmployees = useMemo(() => {
    return activeEmployees.filter(e => {
      const matchesSearch = !searchQuery.trim() || e.full_name.toLowerCase().includes(searchQuery.toLowerCase())
      const isOfficeBoy = (e.job_title || "").toLowerCase().includes("office boy")
      const matchesRole = 
        roleFilter === "All" ? true :
        roleFilter === "All Employees" ? !isOfficeBoy :
        roleFilter === "Office Boy" ? isOfficeBoy :
        (e.job_title || "Unassigned") === roleFilter
      return matchesSearch && matchesRole
    })
  }, [activeEmployees, searchQuery, roleFilter])

  const [selectedYear, selectedMonthNum] = selectedMonth.split('-').map(Number)

  // Calculate working days in month (exclude Sundays)
  const getWorkingDays = (year: number, month: number) => {
    const daysInMonth = new Date(year, month, 0).getDate()
    let workingDays = 0
    for (let d = 1; d <= daysInMonth; d++) {
      const day = new Date(year, month - 1, d).getDay()
      if (day !== 0) workingDays++ // Only exclude Sunday
    }
    return workingDays
  }

  const monthWorkingDays = getWorkingDays(selectedYear, selectedMonthNum)

  // Build slip data for each employee
  const slipData = useMemo(() => {
    return filteredEmployees.map(emp => {
      const isOfficeBoy = (emp.job_title || "").toLowerCase().includes("office boy") || (emp.role || "").toLowerCase().includes("office boy")
      const isSupervisor = (emp.job_title || "").toLowerCase().includes("supervisor") || (emp.role || "").toLowerCase().includes("supervisor")
      
      let employeeWorkingDays = monthWorkingDays
      let isFutureJoin = false
      if (emp.joining_date) {
        const joinDate = new Date(emp.joining_date)
        if (joinDate.getFullYear() === selectedYear && (joinDate.getMonth() + 1) === selectedMonthNum) {
          const daysInMonth = new Date(selectedYear, selectedMonthNum, 0).getDate()
          const joinDay = joinDate.getDate()
          let wDays = 0
          for (let d = joinDay; d <= daysInMonth; d++) {
            const day = new Date(selectedYear, selectedMonthNum - 1, d).getDay()
            if (day !== 0) wDays++
          }
          employeeWorkingDays = wDays
        } else if (joinDate.getFullYear() > selectedYear || (joinDate.getFullYear() === selectedYear && (joinDate.getMonth() + 1) > selectedMonthNum)) {
          employeeWorkingDays = 0
          isFutureJoin = true
        }
      }

      const fullBaseSalary = Number(emp.base_salary) || 0
      const perDaySalary = monthWorkingDays > 0 ? Math.floor(fullBaseSalary / monthWorkingDays) : 0
      const baseSalary = isFutureJoin ? 0 : (employeeWorkingDays === monthWorkingDays ? fullBaseSalary : employeeWorkingDays * perDaySalary)
      
      // Commission rates: Connected Sales (e.g. 5,000 or custom) & Transfer Sales (2,500 / 2.5k)
      const commissionRate = isOfficeBoy ? 0 : (Number(emp.commission_per_sale) > 0 ? Number(emp.commission_per_sale) : 5000)
      const transferRate = isOfficeBoy ? 0 : 2500

      // Find attendance records for this month
      const empAttendance = (hrAttendance || []).filter(a => {
        const d = new Date(a.timestamp)
        return (a.employee_id === emp.id || (emp.zk_user_id && a.zk_user_id === emp.zk_user_id)) && 
               d.getFullYear() === selectedYear && (d.getMonth() + 1) === selectedMonthNum
      })

      // Count actual absences (status 3) and lates (status 1)
      const actualAbsences = empAttendance.filter(a => a.status === 3).length
      const totalLates = empAttendance.filter(a => a.status === 1).length

      // Rule: Every 4 lates = 1 absent
      const derivedAbsences = Math.floor(totalLates / 4)
      const rawTotalAbsences = actualAbsences + derivedAbsences
      
      // Rule: 1 absent is forgiven by the company
      const calculatedPenalizedAbsences = Math.max(0, rawTotalAbsences - 1)

      // Count leaves for this month
      const empLeaves = hrLeaves.filter(l => {
        const d = new Date(l.leave_date)
        return l.employee_id === emp.id && d.getFullYear() === selectedYear && (d.getMonth() + 1) === selectedMonthNum
      })

      // Get overrides or defaults
      const override = overrides[emp.id] || { connectedSales: 0, transferSales: 0, teamSales: 0, loanDeduction: 0 }
      
      const totalAbsences = override.manualAbsences !== undefined ? override.manualAbsences : calculatedPenalizedAbsences
      const paidLeaves = empLeaves.filter(l => l.is_paid).length
      const unpaidAbsences = Math.max(0, totalAbsences - paidLeaves)

      // Per-day calculation rounded DOWN (minimum) to minimize absence penalties for the employee
      const absenceDeduction = Math.floor(unpaidAbsences * perDaySalary)

      // Earnings calculations
      const connectedSales = override.connectedSales || 0
      const connectedCommissionEarned = connectedSales * commissionRate

      const transferSales = override.transferSales || 0
      const transferCommissionEarned = transferSales * transferRate

      const teamSales = override.teamSales || 0
      const teamCommissionRate = isSupervisor ? 5000 : 0
      const teamCommissionEarned = teamSales * teamCommissionRate

      const totalCommissionEarned = connectedCommissionEarned + transferCommissionEarned + teamCommissionEarned
      const loanDeduction = override.loanDeduction || 0

      const grossSalary = baseSalary + totalCommissionEarned
      const totalDeductions = absenceDeduction + loanDeduction
      
      // Net Salary rounded UP (maximum) to nearest 100 for maximum benefit to employee (no odd 2-digit decimals like 45, 63)
      const rawNetSalary = Math.max(0, grossSalary - totalDeductions)
      const netSalary = rawNetSalary > 0 ? Math.ceil(rawNetSalary / 100) * 100 : 0

      return {
        employee: emp,
        isOfficeBoy,
        isSupervisor,
        baseSalary,
        commissionRate,
        transferRate,
        workingDays: employeeWorkingDays,
        monthWorkingDays,
        actualAbsences,
        totalLates,
        derivedAbsences,
        rawTotalAbsences,
        calculatedPenalizedAbsences,
        totalAbsences,
        paidLeaves,
        unpaidAbsences,
        perDaySalary,
        absenceDeduction,
        connectedSales,
        connectedCommissionEarned,
        transferSales,
        transferCommissionEarned,
        teamSales,
        teamCommissionRate,
        teamCommissionEarned,
        totalCommissionEarned,
        loanDeduction,
        grossSalary,
        totalDeductions,
        netSalary
      }
    }).sort((a, b) => a.employee.full_name.localeCompare(b.employee.full_name))
  }, [filteredEmployees, hrLeaves, hrAttendance, selectedYear, selectedMonthNum, monthWorkingDays, overrides])

  // Select all slips initially once loaded
  useEffect(() => {
    if (slipData.length > 0 && !hasInitializedSelection) {
      setSelectedIds(slipData.map(s => s.employee.id))
      setHasInitializedSelection(true)
    }
  }, [slipData, hasInitializedSelection])

  // Toggle single employee selection
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  // Toggle select all filtered employees
  const isAllSelected = slipData.length > 0 && slipData.every(s => selectedIds.includes(s.employee.id))
  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([])
    } else {
      setSelectedIds(slipData.map(s => s.employee.id))
    }
  }

  // Filter selected slips
  const selectedSlips = useMemo(() => {
    return slipData.filter(s => selectedIds.includes(s.employee.id))
  }, [slipData, selectedIds])

  const totalNetPayroll = selectedSlips.reduce((sum, s) => sum + Math.max(0, s.netSalary), 0)

  const updateOverride = (employeeId: string, field: 'connectedSales' | 'transferSales' | 'teamSales' | 'loanDeduction' | 'manualAbsences', value: number | undefined) => {
    setOverrides(prev => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId] || { connectedSales: 0, transferSales: 0, teamSales: 0, loanDeduction: 0 },
        [field]: value
      }
    }))
  }

  const slipRefs = useRef<HTMLDivElement>(null)

  const [isSaving, setIsSaving] = useState(false)
  const handleSaveRecords = async () => {
    const slipsToSave = selectedSlips.length > 0 ? selectedSlips : slipData
    if (slipsToSave.length === 0) {
      toast.error("Please select at least one employee salary slip to save.")
      return
    }

    try {
      setIsSaving(true)
      const recordsToSave = slipsToSave.map(slip => ({
        employee_id: slip.employee.id,
        month: selectedMonth,
        base_salary: slip.baseSalary,
        commission_earned: slip.totalCommissionEarned,
        absence_deduction: slip.absenceDeduction,
        loan_deduction: slip.loanDeduction,
        gross_salary: slip.grossSalary,
        net_salary: slip.netSalary
      }))
      await saveSalaryRecords(recordsToSave)
      toast.success(`Saved ${recordsToSave.length} salary record(s) successfully!`)
    } catch (e: any) {
      // toast is handled in AppContext
    } finally {
      setIsSaving(false)
    }
  }

  const handlePrint = (slipsToPrint = selectedSlips) => {
    if (slipsToPrint.length === 0) {
      toast.error("Please select at least one employee salary slip to print.")
      return
    }

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
            padding: 8px 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-radius: 4px;
            margin-bottom: 8px;
          }
          .net-bar .label { font-size: 11px; font-weight: 700; opacity: 0.9; }
          .net-bar .amount { font-size: 16px; font-weight: 800; }
          .sig-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-top: 8px;
            padding-top: 6px;
            border-top: 1px dashed #cbd5e1;
            font-size: 8px;
            color: #64748b;
          }
          .sig-box { text-align: center; }
          .sig-box .line { width: 120px; border-bottom: 1px solid #94a3b8; margin-bottom: 3px; }
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
                <div><label>Joining Date</label><p>${slip.employee.joining_date ? new Date(slip.employee.joining_date).toLocaleDateString('en-GB') : 'N/A'}</p></div>
              </div>
              <div class="two-col">
                <div>
                  <div class="section-title earn-title">Earnings</div>
                  <div class="row"><span>Base Salary ${slip.workingDays < slip.monthWorkingDays ? '(Pro-rated)' : ''}</span><span class="val">PKR ${formatCurrency(slip.baseSalary)}</span></div>
                  <div class="row"><span>Connected Sales ${slip.commissionRate > 0 ? `(${slip.connectedSales} × PKR ${formatCurrency(slip.commissionRate)})` : ''}</span><span class="val">${slip.commissionRate > 0 ? `PKR ${formatCurrency(Math.round(slip.connectedCommissionEarned))}` : 'NULL'}</span></div>
                  <div class="row"><span>Transfer Sales ${slip.transferRate > 0 ? `(${slip.transferSales} × PKR ${formatCurrency(slip.transferRate)})` : ''}</span><span class="val">${slip.transferRate > 0 ? `PKR ${formatCurrency(Math.round(slip.transferCommissionEarned))}` : 'NULL'}</span></div>
                  ${slip.isSupervisor ? `<div class="row"><span>Team Sales (${slip.teamSales} × PKR ${formatCurrency(slip.teamCommissionRate)})</span><span class="val">PKR ${formatCurrency(Math.round(slip.teamCommissionEarned))}</span></div>` : ''}
                  <div class="row border-top"><span><b>Gross Salary</b></span><span class="val">PKR ${formatCurrency(Math.round(slip.grossSalary))}</span></div>
                </div>
                <div>
                  <div class="section-title ded-title">Deductions</div>
                  <div class="row" style="flex-direction: column; align-items: stretch; gap: 2px;">
                    <div style="display: flex; justify-content: space-between;">
                      <span>Absences (${slip.unpaidAbsences} unpaid of ${slip.totalAbsences})</span>
                      <span class="ded">-PKR ${formatCurrency(Math.round(slip.absenceDeduction))}</span>
                    </div>
                    ${overrides[slip.employee.id]?.manualAbsences === undefined ? `
                      <div style="font-size: 7px; color: #64748b; line-height: 1.2;">
                        [Actual: ${slip.actualAbsences}, Lates: ${slip.totalLates} (+${slip.derivedAbsences}), Forgiven: -${Math.min(1, slip.rawTotalAbsences)}]
                      </div>
                    ` : ''}
                  </div>
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

        {/* Team Breadcrumb */}
        {teamObj && (
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 print:hidden">
            <a href="/hr/teams" className="hover:text-[#ff5a36] transition-colors">Teams</a>
            <span className="text-slate-300">›</span>
            <a href={`/hr/teams/${teamFilter}`} className="hover:text-[#ff5a36] transition-colors">{teamObj.name}</a>
            <span className="text-slate-300">›</span>
            <span className="text-slate-800 dark:text-white font-bold">Salary Slips</span>
          </div>
        )}

        {/* Header - hidden during print */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-gradient-to-br from-white/90 to-white/50 dark:from-slate-900/60 dark:to-slate-900/20 p-6 rounded-[1.5rem] border border-white/60 dark:border-slate-700/50 shadow-2xl shadow-[#ff5a36]/5 backdrop-blur-2xl relative overflow-hidden group transition-all duration-500 hover:shadow-[#ff5a36]/10 print:hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full duration-1000 transition-transform pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-1">
              <div className="bg-indigo-100 dark:bg-indigo-500/10 p-2 rounded-xl text-indigo-600">
                <FileText className="w-5 h-5" />
              </div>
              <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">{teamObj ? `${teamObj.name} — Salary Slips` : 'Salary Slips'}</h1>
            </div>
            <p className="text-slate-500 text-sm">Select, review, and print individual or batch salary slips.</p>
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
              className="h-9 px-4 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full outline-none focus:ring-2 focus:ring-[#ff5a36]/50 transition-all text-slate-800 dark:text-white shadow-sm cursor-pointer"
            >
              <option value="All">All Roles ({activeEmployees.length})</option>
              <option value="All Employees">All Employees ({nonOfficeBoyCount})</option>
              <option value="Office Boy">Office Boys ({officeBoyCount})</option>
              <optgroup label="── Specific Roles ──">
                {uniqueRoles.filter(r => !r.toLowerCase().includes("office boy")).map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </optgroup>
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
          </div>
        </div>

        {/* Selection & Action Toolbar Bar */}
        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-slate-700/80 p-3.5 rounded-2xl flex items-center justify-between gap-3 flex-wrap print:hidden">
          <div className="flex items-center gap-4">
            {/* Standard Clean Select All Checkbox */}
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-slate-900 accent-slate-900 dark:accent-indigo-600 cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Select All
              </span>
            </label>

            {/* Selection Counter */}
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <span>(<strong>{selectedSlips.length}</strong> of {slipData.length} selected)</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Total Selected Payroll Amount */}
            <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-500/20 rounded-xl h-9 px-3.5 flex items-center text-xs font-bold text-emerald-600 dark:text-emerald-400">
              Selected Net: PKR {formatCurrency(totalNetPayroll)}
            </div>

            {/* Print Selected */}
            <button
              onClick={() => handlePrint(selectedSlips)}
              disabled={selectedSlips.length === 0}
              className="flex items-center gap-2 bg-slate-900 hover:bg-black dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl h-9 px-4 transition-all text-xs font-bold cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print ({selectedSlips.length}) Slips</span>
            </button>

            {/* Save Selected */}
            <button
              onClick={handleSaveRecords}
              disabled={isSaving || selectedSlips.length === 0}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl h-9 px-4 transition-all text-xs font-bold cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? "Saving..." : `Save (${selectedSlips.length}) Records`}</span>
            </button>
          </div>
        </div>

        {/* Slips Container */}
        <div ref={slipRefs} className="salary-slips-container space-y-4 print:space-y-0">
          {slipData.map((slip, idx) => {
            const isSelected = selectedIds.includes(slip.employee.id)

            return (
              <div
                key={slip.employee.id}
                className={`salary-slip bg-white dark:bg-slate-900 rounded-[1.5rem] print:rounded-none border shadow-md print:shadow-none overflow-hidden print:border print:border-slate-300 print:break-inside-avoid print:mb-8 transition-all duration-200 ${
                  isSelected 
                    ? "border-slate-300 dark:border-slate-700" 
                    : "border-slate-200 dark:border-slate-800 opacity-60 hover:opacity-90"
                }`}
              >
                {/* Slip Header */}
                <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    {/* Clean Checkbox for this slip */}
                    <label className="flex items-center gap-2 cursor-pointer select-none print:hidden" title="Include/Exclude this slip">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(slip.employee.id)}
                        className="w-4 h-4 rounded border-slate-400 text-slate-900 accent-slate-900 cursor-pointer"
                      />
                      <span className="text-xs font-semibold text-slate-200">
                        {isSelected ? "Selected" : "Exclude"}
                      </span>
                    </label>

                    <div className="h-4 w-[1px] bg-white/20 print:hidden" />

                    <div className="flex items-center gap-2.5">
                      <Building2 className="w-4 h-4 text-slate-400 print:text-slate-300" />
                      <div>
                        <h3 className="font-bold text-sm print:text-xs">{orgName}</h3>
                        <p className="text-[10px] text-slate-400 print:text-slate-300">Salary Slip — {monthLabel}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-right">
                    <span className="text-[10px] text-slate-400 print:text-slate-300 font-mono">#{idx + 1}</span>
                    <button 
                      onClick={() => handlePrint([slip])} 
                      className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all print:hidden cursor-pointer"
                      title="Print only this slip"
                    >
                      <Printer className="w-3 h-3" /> Print Slip
                    </button>
                  </div>
                </div>

                {/* Slip Body */}
                <div className="p-5 print:p-3 print:text-[11px]">
                  {/* Employee Info Row */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 print:mb-2 pb-3 print:pb-2 border-b border-slate-100 dark:border-slate-800 print:border-slate-300">
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Employee</p>
                      <p className="text-sm font-bold text-slate-800 dark:text-white print:text-xs print:text-black flex items-center gap-2">
                        {slip.employee.full_name}
                        {slip.employee.status === "Documents Missing" && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 print:hidden">
                            Docs Missing
                          </span>
                        )}
                      </p>
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
                        {/* Base Salary */}
                        <div className="flex justify-between text-sm print:text-[11px]">
                          <span className="text-slate-500 dark:text-slate-400 print:text-black">
                            Base Salary {slip.workingDays < slip.monthWorkingDays && <span className="text-[10px] text-slate-400"> (Pro-rated)</span>}
                          </span>
                          <span className="font-bold text-slate-800 dark:text-white print:text-black">PKR {formatCurrency(slip.baseSalary)}</span>
                        </div>
                        
                        {/* Connected Sales Commission */}
                        <div className="flex justify-between items-center text-sm print:text-[11px]">
                          <span className="text-slate-500 dark:text-slate-400 print:text-black">
                            Connected Sales
                            {slip.commissionRate > 0 && <span className="text-[10px] text-slate-400 print:text-slate-600"> (×PKR {formatCurrency(slip.commissionRate)})</span>}
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
                                <span className="font-bold text-emerald-600 print:text-black min-w-[80px] text-right">PKR {formatCurrency(Math.round(slip.connectedCommissionEarned))}</span>
                              </>
                            ) : (
                              <span className="font-bold text-slate-400 dark:text-slate-500 print:text-slate-400 min-w-[80px] text-right uppercase text-xs">null</span>
                            )}
                          </div>
                        </div>

                        {/* Transfer Sales Commission (2.5k / sale) */}
                        <div className="flex justify-between items-center text-sm print:text-[11px]">
                          <span className="text-slate-500 dark:text-slate-400 print:text-black">
                            Transfer Sales
                            {slip.transferRate > 0 && <span className="text-[10px] text-slate-400 print:text-slate-600"> (×PKR {formatCurrency(slip.transferRate)})</span>}
                          </span>
                          <div className="flex items-center gap-2">
                            {slip.transferRate > 0 ? (
                              <>
                                <input
                                  type="number"
                                  min={0}
                                  placeholder="0"
                                  value={slip.transferSales === 0 ? '' : slip.transferSales}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    updateOverride(slip.employee.id, 'transferSales', val === '' ? 0 : Number(val))
                                  }}
                                  className="w-14 h-7 text-center text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 font-bold print:hidden"
                                />
                                <span className="hidden print:inline font-bold text-black">{slip.transferSales}</span>
                                <span className="font-bold text-emerald-600 print:text-black min-w-[80px] text-right">PKR {formatCurrency(Math.round(slip.transferCommissionEarned))}</span>
                              </>
                            ) : (
                              <span className="font-bold text-slate-400 dark:text-slate-500 print:text-slate-400 min-w-[80px] text-right uppercase text-xs">null</span>
                            )}
                          </div>
                        </div>

                        {/* Team Sales Commission for Supervisors */}
                        {slip.isSupervisor && (
                          <div className="flex justify-between items-center text-sm print:text-[11px]">
                            <span className="text-slate-500 dark:text-slate-400 print:text-black">
                              Team Sales
                              <span className="text-[10px] text-slate-400 print:text-slate-600"> (×PKR {formatCurrency(slip.teamCommissionRate)})</span>
                            </span>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min={0}
                                placeholder="0"
                                value={slip.teamSales === 0 ? '' : slip.teamSales}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  updateOverride(slip.employee.id, 'teamSales', val === '' ? 0 : Number(val))
                                }}
                                className="w-14 h-7 text-center text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 font-bold print:hidden"
                              />
                              <span className="hidden print:inline font-bold text-black">{slip.teamSales}</span>
                              <span className="font-bold text-emerald-600 print:text-black min-w-[80px] text-right">PKR {formatCurrency(Math.round(slip.teamCommissionEarned))}</span>
                            </div>
                          </div>
                        )}

                        {/* Gross Salary */}
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
                        <div className="flex justify-between items-start text-sm print:text-[11px]">
                          <div className="flex flex-col">
                            <span className="text-slate-500 dark:text-slate-400 print:text-black">
                              Absences
                              <span className="text-[10px] text-slate-400 print:text-slate-600 ml-1">({slip.unpaidAbsences} unpaid of {slip.totalAbsences})</span>
                            </span>
                            {overrides[slip.employee.id]?.manualAbsences === undefined && (
                              <span className="text-[9px] text-slate-400 dark:text-slate-500 print:text-slate-500 mt-0.5 leading-tight max-w-[200px]">
                                [Actual: {slip.actualAbsences}, Lates: {slip.totalLates} (+{slip.derivedAbsences}), Forgiven: -{Math.min(1, slip.rawTotalAbsences)}]
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
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
                    <div className="bg-slate-50 dark:bg-slate-800/50 print:bg-white print:border print:border-slate-300 rounded-xl print:rounded-md p-2 text-center relative group">
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Total Absences</p>
                      <p className="text-lg print:text-sm font-extrabold text-amber-600 print:text-black">{slip.totalAbsences}</p>
                      {overrides[slip.employee.id]?.manualAbsences === undefined && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-[10px] rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 print:hidden text-left">
                          <p>Actual Absences: {slip.actualAbsences}</p>
                          <p>Lates Penalty (+): {slip.derivedAbsences} ({slip.totalLates} lates)</p>
                          <p>Company Forgiven (-): {Math.min(1, slip.rawTotalAbsences)}</p>
                          <p className="border-t border-slate-600 mt-1 pt-1 font-bold">Calculated: {slip.calculatedPenalizedAbsences}</p>
                        </div>
                      )}
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
            )
          })}

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
