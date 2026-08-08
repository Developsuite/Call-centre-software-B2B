"use client"

import React, { useState, useMemo } from 'react'
import { useAppContext, HREmployee } from "@/store/AppContext"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { 
  Users, 
  FileDown, 
  Printer, 
  CalendarDays, 
  Search, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  ChevronRight,
  Filter,
  Layers,
  Sparkles
} from 'lucide-react'
import { startOfMonth, endOfMonth, eachDayOfInterval, format, subMonths, isSunday, startOfWeek, endOfWeek, subDays } from 'date-fns'
import Link from 'next/link'
import { EmployeeAttendanceModal } from "@/components/hr/EmployeeAttendanceModal"
import { Card } from "@/components/ui/card"

export default function AttendanceReportsPage() {
  const { hrAttendance, hrLeaves, hrEmployees, currentUser, isLoaded, tenants } = useAppContext()
  
  // Date preset / range states
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  
  const [customRangeMode, setCustomRangeMode] = useState(false)
  const [fromDate, setFromDate] = useState<string>(() => format(startOfMonth(new Date()), 'yyyy-MM-dd'))
  const [toDate, setToDate] = useState<string>(() => format(endOfMonth(new Date()), 'yyyy-MM-dd'))
  
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("All")
  const [selectedDetailEmployee, setSelectedDetailEmployee] = useState<HREmployee | null>(null)

  // Active employees list
  const tenantEmployees = useMemo(() => {
    if (!currentUser) return []
    const list = currentUser.role === "SuperAdmin"
      ? hrEmployees
      : hrEmployees.filter(u => u.organization_id === currentUser.tenantId)

    return list.filter(u => u.status !== "Disabled" && u.role !== "SuperAdmin")
  }, [hrEmployees, currentUser])

  // Unique roles for dropdown filter
  const uniqueRoles = useMemo(() => {
    return Array.from(new Set(tenantEmployees.map(e => e.job_title || "Unassigned"))).sort()
  }, [tenantEmployees])

  const nonOfficeBoyCount = tenantEmployees.filter(e => !(e.job_title || "").toLowerCase().includes("office boy")).length
  const officeBoyCount = tenantEmployees.filter(e => (e.job_title || "").toLowerCase().includes("office boy")).length

  // Quick Preset Handlers
  const handleSetThisMonth = () => {
    setCustomRangeMode(false)
    const now = new Date()
    const val = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    setSelectedMonth(val)
  }

  const handleSetLastMonth = () => {
    setCustomRangeMode(false)
    const prev = subMonths(new Date(), 1)
    const val = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`
    setSelectedMonth(val)
  }

  const handleSetLast30Days = () => {
    setCustomRangeMode(true)
    const end = new Date()
    const start = subDays(end, 29)
    setFromDate(format(start, 'yyyy-MM-dd'))
    setToDate(format(end, 'yyyy-MM-dd'))
  }

  const handleSetThisWeek = () => {
    setCustomRangeMode(true)
    const now = new Date()
    const start = startOfWeek(now, { weekStartsOn: 1 })
    const end = endOfWeek(now, { weekStartsOn: 1 })
    setFromDate(format(start, 'yyyy-MM-dd'))
    setToDate(format(end, 'yyyy-MM-dd'))
  }

  // Active interval dates
  const intervalDates = useMemo(() => {
    let start: Date
    let end: Date

    if (customRangeMode) {
      start = new Date(fromDate)
      end = new Date(toDate)
    } else {
      const [year, month] = selectedMonth.split('-').map(Number)
      start = startOfMonth(new Date(year, month - 1, 1))
      end = endOfMonth(new Date(year, month - 1, 1))
    }

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
      return []
    }

    return eachDayOfInterval({ start, end })
  }, [customRangeMode, fromDate, toDate, selectedMonth])

  // Aggregate Report Data per Employee
  const reportData = useMemo(() => {
    if (tenantEmployees.length === 0 || intervalDates.length === 0) return []

    return tenantEmployees.map(employee => {
      let present = 0
      let late = 0
      let halfDay = 0
      let absent = 0
      let leave = 0
      let off = 0
      let workingDays = 0

      intervalDates.forEach(day => {
        const dayStr = format(day, 'yyyy-MM-dd')
        const isSun = isSunday(day)

        // Find manual attendance record
        const attRecord = hrAttendance.find(att => {
          const isEmp = (att.employee_id && att.employee_id === employee.id) || (employee.zk_user_id && att.zk_user_id === employee.zk_user_id)
          return isEmp && (att.timestamp.startsWith(dayStr) || att.timestamp.substring(0, 10) === dayStr)
        })

        // Find leave record
        const leaveRecord = hrLeaves.find(l => l.employee_id === employee.id && l.leave_date === dayStr)

        if (attRecord) {
          const code = typeof attRecord.status === 'number' ? attRecord.status : 0
          if (code === 0) { present++; workingDays++ }
          else if (code === 1) { late++; present++; workingDays++ }
          else if (code === 2) { halfDay++; workingDays++ }
          else if (code === 3) { absent++; workingDays++ }
          else if (code === 4) { leave++; workingDays++ }
          else if (code === 5) { off++ }
        } else if (leaveRecord) {
          leave++
          workingDays++
        } else if (isSun) {
          off++
        } else {
          // Unmarked past working day defaults as unmarked/working day
          workingDays++
        }
      })

      const totalAttended = present + (halfDay * 0.5)
      const attendanceRate = workingDays > 0 ? Math.min(100, Math.round((totalAttended / workingDays) * 100)) : 0
      const totalHours = (present * 8) + (halfDay * 4) + (leave * 8)
      const totalHoursStr = `${totalHours}h 00m`

      return {
        employee,
        isOfficeBoy: (employee.job_title || "").toLowerCase().includes("office boy") || (employee.role || "").toLowerCase().includes("office boy"),
        workingDays,
        present,
        late,
        halfDay,
        absent,
        leave,
        off,
        attendanceRate,
        totalHours: totalHoursStr
      }
    }).filter(item => {
      // Search query filter
      const matchesSearch = !searchQuery.trim() || 
        item.employee.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.employee.job_title && item.employee.job_title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.employee.email && item.employee.email.toLowerCase().includes(searchQuery.toLowerCase()))

      // Role filter
      let matchesRole = true
      if (roleFilter === "All") {
        matchesRole = true
      } else if (roleFilter === "ALL_EMPLOYEES_EXCLUDE_OFFICE") {
        matchesRole = !item.isOfficeBoy
      } else if (roleFilter === "OFFICE_BOYS_ONLY") {
        matchesRole = item.isOfficeBoy
      } else {
        matchesRole = (item.employee.job_title || "Unassigned") === roleFilter
      }

      return matchesSearch && matchesRole
    }).sort((a, b) => a.employee.full_name.localeCompare(b.employee.full_name))
  }, [tenantEmployees, intervalDates, hrAttendance, hrLeaves, searchQuery, roleFilter])

  // Overall KPIs
  const overallStats = useMemo(() => {
    let totalPresent = 0
    let totalLate = 0
    let totalHalfDay = 0
    let totalAbsent = 0
    let totalLeave = 0
    let totalWorkingDays = 0

    reportData.forEach(r => {
      totalPresent += r.present
      totalLate += r.late
      totalHalfDay += r.halfDay
      totalAbsent += r.absent
      totalLeave += r.leave
      totalWorkingDays += r.workingDays
    })

    const avgRate = reportData.length > 0
      ? Math.round(reportData.reduce((sum, r) => sum + r.attendanceRate, 0) / reportData.length)
      : 0

    return { totalPresent, totalLate, totalHalfDay, totalAbsent, totalLeave, totalWorkingDays, avgRate }
  }, [reportData])

  // Export to CSV
  const exportToCSV = () => {
    const periodLabel = customRangeMode 
      ? `${fromDate}_to_${toDate}` 
      : selectedMonth

    const headers = [
      "Employee Name",
      "Role / Job Title",
      "Status",
      "Working Days",
      "Present",
      "Late",
      "Half Day",
      "Absent",
      "Paid Leave",
      "Off Days",
      "Attendance Rate %",
      "Total Logged Hours"
    ]

    const rows = reportData.map(r => [
      `"${r.employee.full_name}"`,
      `"${r.employee.job_title || 'N/A'}"`,
      `"${r.employee.status}"`,
      r.workingDays,
      r.present,
      r.late,
      r.halfDay,
      r.absent,
      r.leave,
      r.off,
      `${r.attendanceRate}%`,
      `"${r.totalHours}"`
    ])

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n")
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `attendance_report_${periodLabel}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Print Handler
  const handlePrint = () => {
    window.print()
  }

  // Month options for dropdown
  const monthOptions = useMemo(() => {
    const opts = []
    const now = new Date()
    for (let i = -12; i <= 2; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = d.toLocaleString('default', { month: 'long', year: 'numeric' })
      opts.push({ value: val, label })
    }
    return opts
  }, [])

  const currentPeriodLabel = customRangeMode 
    ? `${format(new Date(fromDate), 'MMM d, yyyy')} – ${format(new Date(toDate), 'MMM d, yyyy')}`
    : (() => {
        const [y, m] = selectedMonth.split('-').map(Number)
        return new Date(y, m - 1).toLocaleString('default', { month: 'long', year: 'numeric' })
      })()

  const orgName = (() => {
    if (!currentUser?.tenantId) return "Dialixsale"
    const name = tenants.find(t => t.id === currentUser.tenantId)?.name || "Dialixsale"
    return name === "Ali's Call Centre" ? "Dialixsale" : name
  })()

  if (!isLoaded || !currentUser) {
    return (
      <DashboardLayout title="Attendance Reports">
        <div className="flex items-center justify-center h-[50vh]">
          <div className="w-6 h-6 border-2 border-[#ff5a36] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Attendance Reports">
      <div className="relative flex flex-col gap-6 font-sans max-w-[1240px] mx-auto w-full pb-12 min-h-screen overflow-x-hidden px-4 md:px-0">
        
        {/* Background Glows */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-gradient-to-br from-[#ff5a36]/10 to-indigo-500/10 rounded-full blur-[100px] pointer-events-none -z-10 print:hidden" />
        <div className="absolute bottom-[10%] right-[-10%] w-[40%] h-[40%] bg-gradient-to-br from-emerald-500/10 to-blue-500/10 rounded-full blur-[120px] pointer-events-none -z-10 print:hidden" />

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-200/60 dark:bg-slate-800/80 p-1.5 rounded-2xl w-fit border border-slate-200 dark:border-slate-700/60 backdrop-blur-md print:hidden">
          <Link 
            href="/hr/attendance" 
            className="px-5 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all flex items-center gap-2"
          >
            <CalendarDays className="w-4 h-4" /> Daily Sheet View
          </Link>
          <Link 
            href="/hr/attendance/reports" 
            className="px-5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm border border-slate-200/80 dark:border-slate-700 transition-all flex items-center gap-2"
          >
            <Layers className="w-4 h-4 text-[#ff5a36]" /> Aggregated Reports
          </Link>
        </div>

        {/* Header & Controls Bar */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-gradient-to-br from-white/90 to-white/50 dark:from-slate-900/70 dark:to-slate-900/30 p-6 rounded-[1.8rem] border border-white/60 dark:border-slate-800 shadow-2xl shadow-slate-900/5 backdrop-blur-2xl relative overflow-hidden group print:hidden">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="bg-[#ff5a36]/10 p-2.5 rounded-2xl text-[#ff5a36]">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">
                  Employee Attendance Report
                </h1>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Comprehensive presence, late arrivals, absences, and score breakdown for all active personnel.
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2.5 flex-wrap justify-end">
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-9 px-4 transition-all text-xs font-bold shadow-sm cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-slate-900 hover:bg-black dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl h-9 px-4 transition-all text-xs font-bold shadow-sm cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Report</span>
            </button>
          </div>
        </div>

        {/* Date Filter & Preset Controls */}
        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 print:hidden">
          {/* Quick Presets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={handleSetThisMonth}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                !customRangeMode && selectedMonth === `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              This Month
            </button>
            <button
              onClick={handleSetLastMonth}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                !customRangeMode && selectedMonth === `${subMonths(new Date(), 1).getFullYear()}-${String(subMonths(new Date(), 1).getMonth() + 1).padStart(2, '0')}`
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Last Month
            </button>
            <button
              onClick={handleSetLast30Days}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                customRangeMode
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Last 30 Days
            </button>
            <button
              onClick={handleSetThisWeek}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
            >
              This Week
            </button>
          </div>

          {/* Month / Custom Range Selector */}
          <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto justify-end">
            {!customRangeMode ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">Month:</span>
                <select
                  value={selectedMonth}
                  onChange={(e) => {
                    setCustomRangeMode(false)
                    setSelectedMonth(e.target.value)
                  }}
                  className="h-9 px-3.5 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-[#ff5a36]/50 transition-all text-slate-800 dark:text-white shadow-sm cursor-pointer"
                >
                  {monthOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <button
                  onClick={() => setCustomRangeMode(true)}
                  className="text-xs font-bold text-[#ff5a36] hover:underline px-2 cursor-pointer"
                >
                  Custom Range
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="h-9 px-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-800 dark:text-white font-medium"
                />
                <span className="text-xs text-slate-400 font-bold">to</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="h-9 px-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-800 dark:text-white font-medium"
                />
                <button
                  onClick={() => setCustomRangeMode(false)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white px-1.5 cursor-pointer"
                >
                  Monthly View
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Overall KPI Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3.5 print:hidden">
          {/* Average Attendance Rate */}
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-4 text-white shadow-lg shadow-indigo-500/10 flex flex-col justify-between col-span-2 md:col-span-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-100">Avg Attendance</span>
            <div className="my-1">
              <h3 className="text-2xl font-black">{overallStats.avgRate}%</h3>
              <p className="text-[10px] text-indigo-100 font-medium">Overall Team Score</p>
            </div>
            <div className="w-full bg-white/20 rounded-full h-1.5 overflow-hidden">
              <div className="bg-white h-full rounded-full" style={{ width: `${overallStats.avgRate}%` }}></div>
            </div>
          </div>

          {/* Active Staff */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Staff</span>
            <div>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white">{reportData.length}</h3>
              <p className="text-[10px] text-slate-400 font-medium">{nonOfficeBoyCount} Agents + {officeBoyCount} Boys</p>
            </div>
          </div>

          {/* Total Present */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Present
            </span>
            <div>
              <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{overallStats.totalPresent}</h3>
              <p className="text-[10px] text-slate-400 font-medium">Logged on time</p>
            </div>
          </div>

          {/* Total Late */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Late
            </span>
            <div>
              <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400">{overallStats.totalLate}</h3>
              <p className="text-[10px] text-slate-400 font-medium">Late arrivals</p>
            </div>
          </div>

          {/* Total Absent */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1">
              <XCircle className="w-3 h-3" /> Absences
            </span>
            <div>
              <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400">{overallStats.totalAbsent}</h3>
              <p className="text-[10px] text-slate-400 font-medium">Unpaid absence days</p>
            </div>
          </div>

          {/* Total Leaves */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Leaves
            </span>
            <div>
              <h3 className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{overallStats.totalLeave}</h3>
              <p className="text-[10px] text-slate-400 font-medium">Approved leaves</p>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3.5 rounded-2xl flex items-center justify-between gap-3 flex-wrap print:hidden">
          <div className="flex items-center gap-3 flex-wrap flex-1">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search staff..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="h-9 pl-9 pr-4 w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-[#ff5a36]/50 transition-all text-slate-800 dark:text-white"
              />
            </div>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="h-9 px-3.5 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-[#ff5a36]/50 transition-all text-slate-800 dark:text-white cursor-pointer"
            >
              <option value="All">All Staff ({tenantEmployees.length})</option>
              <option value="ALL_EMPLOYEES_EXCLUDE_OFFICE">Agents & Staff ({nonOfficeBoyCount})</option>
              <option value="OFFICE_BOYS_ONLY">Office Boys ({officeBoyCount})</option>
              <optgroup label="── Specific Roles ──">
                {uniqueRoles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </optgroup>
            </select>
          </div>

          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <span>Period: <strong className="text-slate-800 dark:text-white">{currentPeriodLabel}</strong></span>
          </div>
        </div>

        {/* Print Header */}
        <div className="hidden print:block mb-6 border-b border-slate-300 pb-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-black text-slate-900">{orgName}</h1>
              <h2 className="text-sm font-bold text-slate-600">Monthly Attendance Report</h2>
            </div>
            <div className="text-right text-xs text-slate-600">
              <p>Period: <strong>{currentPeriodLabel}</strong></p>
              <p>Generated: {new Date().toLocaleDateString('en-GB')}</p>
            </div>
          </div>
        </div>

        {/* Detailed Attendance Report Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[1.5rem] overflow-hidden shadow-sm print:border-none print:shadow-none">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-400 text-[10px] uppercase font-extrabold tracking-wider print:bg-slate-100 print:text-black">
                  <th className="px-5 py-4">Employee</th>
                  <th className="px-4 py-4 text-center">Working Days</th>
                  <th className="px-4 py-4 text-center">Present (P)</th>
                  <th className="px-4 py-4 text-center">Late (L)</th>
                  <th className="px-4 py-4 text-center">Half Day (HD)</th>
                  <th className="px-4 py-4 text-center">Absent (A)</th>
                  <th className="px-4 py-4 text-center">Leave (LV)</th>
                  <th className="px-4 py-4 text-center">Score %</th>
                  <th className="px-4 py-4 text-right">Work Hours</th>
                  <th className="px-5 py-4 text-right print:hidden">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                {reportData.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-14 text-center text-slate-400 font-medium">
                      No staff members match the selected filters or interval.
                    </td>
                  </tr>
                ) : (
                  reportData.map((row) => {
                    const isHigh = row.attendanceRate >= 90
                    const isMid = row.attendanceRate >= 75 && row.attendanceRate < 90

                    return (
                      <tr key={row.employee.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        {/* Employee Details */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#ff5a36] to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-sm print:hidden">
                              {row.employee.avatar_url ? (
                                <img src={row.employee.avatar_url} className="w-full h-full rounded-xl object-cover" alt={row.employee.full_name} />
                              ) : (
                                row.employee.full_name.charAt(0)
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-slate-800 dark:text-slate-200 print:text-black flex items-center gap-1.5">
                                <span>{row.employee.full_name}</span>
                                {row.employee.status === "Documents Missing" && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 print:hidden">
                                    Docs Missing
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 font-medium print:text-slate-600">
                                {row.employee.job_title || 'Unassigned'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Working Days */}
                        <td className="px-4 py-3.5 text-center font-bold text-slate-700 dark:text-slate-300 print:text-black">
                          {row.workingDays}
                        </td>

                        {/* Present */}
                        <td className="px-4 py-3.5 text-center">
                          <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold text-xs border border-emerald-500/20 print:border-none print:bg-transparent print:text-black">
                            {row.present}
                          </span>
                        </td>

                        {/* Late */}
                        <td className="px-4 py-3.5 text-center">
                          <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-2 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 font-extrabold text-xs border border-amber-500/20 print:border-none print:bg-transparent print:text-black">
                            {row.late}
                          </span>
                        </td>

                        {/* Half Day */}
                        <td className="px-4 py-3.5 text-center">
                          <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-2 rounded-lg bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 font-extrabold text-xs border border-purple-500/20 print:border-none print:bg-transparent print:text-black">
                            {row.halfDay}
                          </span>
                        </td>

                        {/* Absent */}
                        <td className="px-4 py-3.5 text-center">
                          <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-2 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 font-extrabold text-xs border border-rose-500/20 print:border-none print:bg-transparent print:text-black">
                            {row.absent}
                          </span>
                        </td>

                        {/* Leave */}
                        <td className="px-4 py-3.5 text-center">
                          <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-2 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-extrabold text-xs border border-indigo-500/20 print:border-none print:bg-transparent print:text-black">
                            {row.leave}
                          </span>
                        </td>

                        {/* Attendance Rate */}
                        <td className="px-4 py-3.5 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span className={`px-2 py-0.5 rounded-md text-[11px] font-extrabold border ${
                              isHigh 
                                ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30' 
                                : isMid
                                ? 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-500/30'
                                : 'bg-rose-100 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-500/30'
                            } print:border-none print:bg-transparent print:text-black`}>
                              {row.attendanceRate}%
                            </span>
                          </div>
                        </td>

                        {/* Total Logged Hours */}
                        <td className="px-4 py-3.5 text-right font-semibold text-slate-700 dark:text-slate-300 print:text-black">
                          {row.totalHours}
                        </td>

                        {/* Action */}
                        <td className="px-5 py-3.5 text-right print:hidden">
                          <button 
                            onClick={() => setSelectedDetailEmployee(row.employee)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-black dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-[11px] font-bold transition-all shadow-sm cursor-pointer"
                          >
                            <span>Daily Sheet</span>
                            <ChevronRight className="w-3 h-3 text-slate-400" />
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Print Signatures */}
        <div className="hidden print:flex justify-between items-end mt-12 pt-4 border-t border-dashed border-slate-400 text-xs text-slate-600">
          <div>Report generated automatically from HR attendance records.</div>
          <div className="text-center">
            <div className="w-44 border-b border-slate-400 mb-1"></div>
            <p>HR Manager Signature</p>
          </div>
          <div className="text-center">
            <div className="w-44 border-b border-slate-400 mb-1"></div>
            <p>Director Signature</p>
          </div>
        </div>

      </div>

      {/* Individual Employee Day-by-Day Sheet Modal */}
      {selectedDetailEmployee && (
        <EmployeeAttendanceModal 
          employee={selectedDetailEmployee} 
          onClose={() => setSelectedDetailEmployee(null)} 
        />
      )}
    </DashboardLayout>
  )
}
