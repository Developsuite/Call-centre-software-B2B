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
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  ChevronRight,
  Filter,
  BarChart3
} from 'lucide-react'
import { startOfMonth, endOfMonth, eachDayOfInterval, format, subMonths, isSunday, startOfWeek, endOfWeek, subDays } from 'date-fns'
import Link from 'next/link'
import { EmployeeAttendanceModal } from "@/components/hr/EmployeeAttendanceModal"

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
          // Unmarked working day
          workingDays++
        }
      })

      const totalAttended = present + (halfDay * 0.5)
      const attendanceRate = workingDays > 0 ? Math.min(100, Math.round((totalAttended / workingDays) * 100)) : 0
      const totalHours = (present * 8) + (halfDay * 4) + (leave * 8)
      const totalHoursStr = `${totalHours} hrs`

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
          <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Attendance Reports">
      <div className="flex flex-col gap-5 max-w-[1240px] mx-auto w-full pb-12 px-4 md:px-0 font-sans text-slate-800 dark:text-slate-100">

        {/* Top Segmented Navigation Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl w-fit border border-slate-200 dark:border-slate-700 print:hidden">
          <Link 
            href="/hr/attendance" 
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-2"
          >
            <CalendarDays className="w-4 h-4" /> Daily Sheet
          </Link>
          <Link 
            href="/hr/attendance/reports" 
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" /> Monthly Reports
          </Link>
        </div>

        {/* Page Title & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm print:hidden">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Attendance Reports
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Monthly and custom range attendance statistics for active personnel.
            </p>
          </div>
          
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg h-9 px-4 transition-colors text-xs font-semibold cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 bg-slate-900 hover:bg-black dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 rounded-lg h-9 px-4 transition-colors text-xs font-semibold cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Report</span>
            </button>
          </div>
        </div>

        {/* Filters & Range Toolbar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 print:hidden">
          {/* Quick Presets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={handleSetThisMonth}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                !customRangeMode && selectedMonth === `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              This Month
            </button>
            <button
              onClick={handleSetLastMonth}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                !customRangeMode && selectedMonth === `${subMonths(new Date(), 1).getFullYear()}-${String(subMonths(new Date(), 1).getMonth() + 1).padStart(2, '0')}`
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Last Month
            </button>
            <button
              onClick={handleSetLast30Days}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                customRangeMode
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Last 30 Days
            </button>
            <button
              onClick={handleSetThisWeek}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              This Week
            </button>
          </div>

          {/* Month / Range Select */}
          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-end">
            {!customRangeMode ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Month:</span>
                <select
                  value={selectedMonth}
                  onChange={(e) => {
                    setCustomRangeMode(false)
                    setSelectedMonth(e.target.value)
                  }}
                  className="h-8.5 px-3 text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-1 focus:ring-slate-400 text-slate-800 dark:text-white cursor-pointer"
                >
                  {monthOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <button
                  onClick={() => setCustomRangeMode(true)}
                  className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline px-1 cursor-pointer"
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
                  className="h-8.5 px-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-white"
                />
                <span className="text-xs text-slate-400 font-medium">to</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="h-8.5 px-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-white"
                />
                <button
                  onClick={() => setCustomRangeMode(false)}
                  className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-white px-1 cursor-pointer"
                >
                  Monthly View
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Clean Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 print:hidden">
          {/* Average Attendance Rate */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">Avg Attendance</span>
            <div className="mt-1">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">{overallStats.avgRate}%</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Team score</span>
          </div>

          {/* Active Staff */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">Total Staff</span>
            <div className="mt-1">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">{reportData.length}</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">{nonOfficeBoyCount} Staff, {officeBoyCount} Boys</span>
          </div>

          {/* Total Present */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">Present Days</span>
            <div className="mt-1">
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{overallStats.totalPresent}</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">On time</span>
          </div>

          {/* Total Late */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">Late Arrivals</span>
            <div className="mt-1">
              <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">{overallStats.totalLate}</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Marked late</span>
          </div>

          {/* Total Absent */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">Absences</span>
            <div className="mt-1">
              <span className="text-2xl font-bold text-rose-600 dark:text-rose-400">{overallStats.totalAbsent}</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Unpaid</span>
          </div>

          {/* Total Leaves */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">Leaves</span>
            <div className="mt-1">
              <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{overallStats.totalLeave}</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Approved</span>
          </div>
        </div>

        {/* Search & Role Filter Bar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl shadow-sm flex items-center justify-between gap-3 flex-wrap print:hidden">
          <div className="flex items-center gap-3 flex-wrap flex-1">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search by name..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="h-8.5 pl-9 pr-3 w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-1 focus:ring-slate-400 text-slate-800 dark:text-white"
              />
            </div>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="h-8.5 px-3 text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-1 focus:ring-slate-400 text-slate-800 dark:text-white cursor-pointer"
            >
              <option value="All">All Roles ({tenantEmployees.length})</option>
              <option value="ALL_EMPLOYEES_EXCLUDE_OFFICE">Agents & Staff ({nonOfficeBoyCount})</option>
              <option value="OFFICE_BOYS_ONLY">Office Boys ({officeBoyCount})</option>
              <optgroup label="── Specific Roles ──">
                {uniqueRoles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </optgroup>
            </select>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Period: <span className="font-semibold text-slate-800 dark:text-white">{currentPeriodLabel}</span>
          </div>
        </div>

        {/* Print Header */}
        <div className="hidden print:block mb-6 border-b border-slate-300 pb-3">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-slate-900">{orgName}</h1>
              <h2 className="text-xs text-slate-600">Monthly Attendance Report</h2>
            </div>
            <div className="text-right text-xs text-slate-600">
              <p>Period: <strong>{currentPeriodLabel}</strong></p>
              <p>Generated: {new Date().toLocaleDateString('en-GB')}</p>
            </div>
          </div>
        </div>

        {/* Enterprise Data Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm print:border-none print:shadow-none">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold print:bg-slate-100 print:text-black">
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-3 py-3 text-center">Working Days</th>
                  <th className="px-3 py-3 text-center">Present</th>
                  <th className="px-3 py-3 text-center">Late</th>
                  <th className="px-3 py-3 text-center">Half Day</th>
                  <th className="px-3 py-3 text-center">Absent</th>
                  <th className="px-3 py-3 text-center">Leave</th>
                  <th className="px-3 py-3 text-center">Attendance %</th>
                  <th className="px-4 py-3 text-right">Hours</th>
                  <th className="px-4 py-3 text-right print:hidden">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {reportData.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-12 text-center text-slate-400">
                      No staff members match the selected filters.
                    </td>
                  </tr>
                ) : (
                  reportData.map((row) => (
                    <tr key={row.employee.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      {/* Employee Info */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 font-bold text-xs print:hidden">
                            {row.employee.avatar_url ? (
                              <img src={row.employee.avatar_url} className="w-full h-full rounded-lg object-cover" alt={row.employee.full_name} />
                            ) : (
                              row.employee.full_name.charAt(0)
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white print:text-black flex items-center gap-1.5">
                              <span>{row.employee.full_name}</span>
                              {row.employee.status === "Documents Missing" && (
                                <span className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800 print:hidden">
                                  Missing Docs
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 print:text-slate-600">
                              {row.employee.job_title || 'Unassigned'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Working Days */}
                      <td className="px-3 py-3 text-center text-slate-700 dark:text-slate-300 font-medium">
                        {row.workingDays}
                      </td>

                      {/* Present */}
                      <td className="px-3 py-3 text-center">
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          {row.present}
                        </span>
                      </td>

                      {/* Late */}
                      <td className="px-3 py-3 text-center">
                        <span className="font-semibold text-amber-600 dark:text-amber-400">
                          {row.late}
                        </span>
                      </td>

                      {/* Half Day */}
                      <td className="px-3 py-3 text-center">
                        <span className="font-semibold text-purple-600 dark:text-purple-400">
                          {row.halfDay}
                        </span>
                      </td>

                      {/* Absent */}
                      <td className="px-3 py-3 text-center">
                        <span className="font-semibold text-rose-600 dark:text-rose-400">
                          {row.absent}
                        </span>
                      </td>

                      {/* Leave */}
                      <td className="px-3 py-3 text-center">
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                          {row.leave}
                        </span>
                      </td>

                      {/* Attendance % */}
                      <td className="px-3 py-3 text-center">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {row.attendanceRate}%
                        </span>
                      </td>

                      {/* Total Logged Hours */}
                      <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400 font-medium">
                        {row.totalHours}
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3 text-right print:hidden">
                        <button 
                          onClick={() => setSelectedDetailEmployee(row.employee)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium transition-colors cursor-pointer"
                        >
                          <span>Details</span>
                          <ChevronRight className="w-3 h-3 text-slate-400" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Print Signatures */}
        <div className="hidden print:flex justify-between items-end mt-10 pt-4 border-t border-slate-300 text-xs text-slate-600">
          <div>Report generated from HR attendance system.</div>
          <div className="text-center">
            <div className="w-40 border-b border-slate-400 mb-1"></div>
            <p>HR Manager</p>
          </div>
          <div className="text-center">
            <div className="w-40 border-b border-slate-400 mb-1"></div>
            <p>Director</p>
          </div>
        </div>

      </div>

      {/* Employee Detail Modal */}
      {selectedDetailEmployee && (
        <EmployeeAttendanceModal 
          employee={selectedDetailEmployee} 
          onClose={() => setSelectedDetailEmployee(null)} 
        />
      )}
    </DashboardLayout>
  )
}
