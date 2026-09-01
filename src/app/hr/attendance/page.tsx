"use client"

import React, { useState, useMemo, useEffect, useRef } from "react"
import { useAppContext, HREmployee, HRAttendance } from "@/store/AppContext"
import { useSearchParams, useRouter } from "next/navigation"
import { TopBar } from "@/components/layout/topbar"
import { Sidebar } from "@/components/layout/sidebar"
import { 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Search, 
  Download, 
  CalendarDays,
  Users,
  Info,
  CheckCircle2,
  ClipboardList
} from "lucide-react"
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isToday as isDateToday, 
  isSunday, 
  isSaturday,
  addMonths, 
  subMonths 
} from "date-fns"
import { toast } from "sonner"
import Link from "next/link"
import { EmployeeAttendanceModal } from "@/components/hr/EmployeeAttendanceModal"

type AttendanceStatusCode = 0 | 1 | 2 | 3 | 4 | 5

export default function AttendancePage() {
  const { 
    hrAttendance, 
    hrEmployees, 
    currentUser, 
    isLoaded, 
    fetchHRAttendance,
    markHRAttendance,
    bulkMarkHRAttendance,
    teams
  } = useAppContext()

  const searchParams = useSearchParams()
  const router = useRouter()
  const teamFilter = searchParams.get('team')
  const teamObj = teamFilter ? teams.find(t => t.id === teamFilter) : null

  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDetailEmployee, setSelectedDetailEmployee] = useState<HREmployee | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // Cell popover
  const [activeCell, setActiveCell] = useState<{
    employeeId: string
    zkUserId: string | null
    dateStr: string
    x: number
    y: number
  } | null>(null)

  // Column action
  const [columnActionDate, setColumnActionDate] = useState<string | null>(null)

  // Daily marking panel
  const [showDailyPanel, setShowDailyPanel] = useState(false)
  const [dailyPanelDate, setDailyPanelDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [dailyMarks, setDailyMarks] = useState<Map<string, AttendanceStatusCode>>(new Map())
  const [dailySaving, setDailySaving] = useState(false)

  const popoverRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setActiveCell(null)
        setColumnActionDate(null)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Days in month
  const monthDays = useMemo(() => {
    return eachDayOfInterval({ start: startOfMonth(currentDate), end: endOfMonth(currentDate) })
  }, [currentDate])

  // Filtered employees
  const tenantEmployees = useMemo(() => {
    if (!currentUser) return []
    let list = (currentUser.role === "SuperAdmin"
      ? hrEmployees
      : hrEmployees.filter(u => u.organization_id === currentUser.tenantId)
    ).filter(u => u.status !== "Disabled" && u.role !== "SuperAdmin")

    // Apply team filter if present
    if (teamFilter) {
      list = list.filter(u => u.team_id === teamFilter)
    }

    return list
      .filter(emp => {
        if (!searchQuery.trim()) return true
        const q = searchQuery.toLowerCase()
        return emp.full_name.toLowerCase().includes(q) ||
          (emp.zk_user_id && emp.zk_user_id.toLowerCase().includes(q)) ||
          (emp.job_title && emp.job_title.toLowerCase().includes(q))
      })
      .sort((a, b) => a.full_name.localeCompare(b.full_name))
  }, [hrEmployees, currentUser, searchQuery])

  // Attendance lookup map
  const attendanceMap = useMemo(() => {
    const map = new Map<string, AttendanceStatusCode>()
    hrAttendance.forEach(record => {
      const dateStr = record.timestamp.split('T')[0]
      const statusCode = typeof record.status === 'number' ? (record.status as AttendanceStatusCode) : 0
      if (record.employee_id) map.set(`${record.employee_id}_${dateStr}`, statusCode)
      if (record.zk_user_id) map.set(`${record.zk_user_id}_${dateStr}`, statusCode)
    })
    return map
  }, [hrAttendance])

  // Get status: null means unrecorded / future (-)
  const getStatus = (emp: HREmployee, dateStr: string): AttendanceStatusCode | null => {
    if (attendanceMap.has(`${emp.id}_${dateStr}`)) return attendanceMap.get(`${emp.id}_${dateStr}`)!
    if (emp.zk_user_id && attendanceMap.has(`${emp.zk_user_id}_${dateStr}`)) return attendanceMap.get(`${emp.zk_user_id}_${dateStr}`)!
    return null
  }

  const getStatusText = (status: AttendanceStatusCode | null): string => {
    if (status === 0) return "P"
    if (status === 1) return "L"
    if (status === 2) return "HD"
    if (status === 3) return "A"
    if (status === 4) return "LV"
    if (status === 5) return "OFF"
    return "-"
  }

  const getStatusLabel = (status: AttendanceStatusCode | null): string => {
    if (status === 0) return "Present"
    if (status === 1) return "Late"
    if (status === 2) return "Half Day"
    if (status === 3) return "Absent"
    if (status === 4) return "Leave"
    if (status === 5) return "Off"
    return "Not Marked"
  }

  // Monthly stats
  const employeeMonthlyStats = useMemo(() => {
    const stats = new Map<string, { present: number; late: number; halfDay: number; absent: number; leave: number; off: number; rate: number }>()
    tenantEmployees.forEach(emp => {
      let p = 0, l = 0, hd = 0, a = 0, lv = 0, off = 0, markedWorkingDays = 0
      monthDays.forEach(day => {
        const dateStr = format(day, 'yyyy-MM-dd')
        const status = getStatus(emp, dateStr)
        if (status === 0) { p++; markedWorkingDays++ }
        else if (status === 1) { l++; p++; markedWorkingDays++ }
        else if (status === 2) { hd++; markedWorkingDays++ }
        else if (status === 3) { a++; markedWorkingDays++ }
        else if (status === 4) { lv++; markedWorkingDays++ }
        else if (status === 5) { off++ }
      })
      const attended = p + (hd * 0.5)
      const rate = markedWorkingDays > 0 ? Math.round((attended / markedWorkingDays) * 100) : 0
      stats.set(emp.id, { present: p, late: l, halfDay: hd, absent: a, leave: lv, off, rate })
    })
    return stats
  }, [tenantEmployees, monthDays, attendanceMap])

  // KPIs
  const overallKPIs = useMemo(() => {
    let totalP = 0, totalA = 0, totalL = 0, totalLV = 0, totalHD = 0
    employeeMonthlyStats.forEach(st => {
      totalP += st.present
      totalA += st.absent
      totalL += st.late
      totalLV += st.leave
      totalHD += st.halfDay
    })
    return { totalP, totalA, totalL, totalLV, totalHD }
  }, [employeeMonthlyStats])

  // Mark handler
  const handleMarkStatus = async (employeeId: string, zkUserId: string | null, dateStr: string, status: AttendanceStatusCode | null) => {
    try {
      await markHRAttendance(employeeId, zkUserId, dateStr, status)
      setActiveCell(null)
    } catch (e) { /* handled in context */ }
  }

  // Right-click cycle
  const handleCycleStatus = async (emp: HREmployee, dateStr: string) => {
    const current = getStatus(emp, dateStr)
    let next: AttendanceStatusCode | null = null
    if (current === null) next = 0
    else if (current === 0) next = 3
    else if (current === 3) next = 1
    else if (current === 1) next = 2
    else if (current === 2) next = 4
    else if (current === 4) next = 5
    else if (current === 5) next = null
    await markHRAttendance(emp.id, emp.zk_user_id || null, dateStr, next)
  }

  // Bulk mark column
  const handleMarkAllForDate = async (dateStr: string, status: AttendanceStatusCode) => {
    setIsProcessing(true)
    try {
      const records = tenantEmployees.map(emp => ({
        employeeId: emp.id,
        zkUserId: emp.zk_user_id || null,
        dateStr,
        status
      }))
      await bulkMarkHRAttendance(records)
      setColumnActionDate(null)
    } finally { setIsProcessing(false) }
  }

  const handleClearAllForDate = async (dateStr: string) => {
    setIsProcessing(true)
    try {
      for (const emp of tenantEmployees) {
        await markHRAttendance(emp.id, emp.zk_user_id || null, dateStr, null)
      }
      setColumnActionDate(null)
    } finally { setIsProcessing(false) }
  }

  // Mark Sundays OFF
  const handleMarkSundaysOff = async () => {
    setIsProcessing(true)
    try {
      const sundays = monthDays.filter(day => isSunday(day))
      const records: { employeeId: string; zkUserId: string | null; dateStr: string; status: number }[] = []
      sundays.forEach(sun => {
        const dateStr = format(sun, 'yyyy-MM-dd')
        tenantEmployees.forEach(emp => {
          records.push({ employeeId: emp.id, zkUserId: emp.zk_user_id || null, dateStr, status: 5 })
        })
      })
      if (records.length === 0) { toast.info("No Sundays found"); return }
      await bulkMarkHRAttendance(records)
    } finally { setIsProcessing(false) }
  }

  const handlePrevMonth = () => setCurrentDate(prev => subMonths(prev, 1))
  const handleNextMonth = () => setCurrentDate(prev => addMonths(prev, 1))
  const handleThisMonth = () => setCurrentDate(new Date())

  // ─── Daily Marking Panel Logic ───
  // When opening panel or changing date, load existing statuses
  const openDailyPanel = (dateStr?: string) => {
    const d = dateStr || format(new Date(), 'yyyy-MM-dd')
    setDailyPanelDate(d)
    // Load existing marks for this date (non-Present exceptions)
    const marks = new Map<string, AttendanceStatusCode>()
    tenantEmployees.forEach(emp => {
      const st = getStatus(emp, d)
      if (st !== null && st !== 0) {
        marks.set(emp.id, st)
      }
    })
    setDailyMarks(marks)
    setShowDailyPanel(true)
  }

  const toggleDailyMark = (empId: string, status: AttendanceStatusCode) => {
    setDailyMarks(prev => {
      const next = new Map(prev)
      if (next.get(empId) === status) {
        next.delete(empId) // toggle off = back to Present
      } else {
        next.set(empId, status)
      }
      return next
    })
  }

  const saveDailyMarks = async () => {
    setDailySaving(true)
    try {
      // In the backend, record all employees for that day:
      // Exceptions get their selected status (1=Late, 2=HD, 3=Absent, 4=Leave, 5=OFF), unmarked get 0 (Present)
      const records = tenantEmployees.map(emp => {
        const mark = dailyMarks.get(emp.id)
        const status = mark !== undefined ? mark : (0 as AttendanceStatusCode)
        return {
          employeeId: emp.id,
          zkUserId: emp.zk_user_id || null,
          dateStr: dailyPanelDate,
          status
        }
      })
      
      await bulkMarkHRAttendance(records)
      toast.success(`Attendance saved for ${format(new Date(dailyPanelDate + 'T12:00:00'), 'EEE, MMM d')}`)
      setShowDailyPanel(false)
    } catch (e) {
      toast.error("Failed to save attendance records")
    } finally {
      setDailySaving(false)
    }
  }

  // Export CSV
  const handleExportCSV = () => {
    const daysHeader = monthDays.map(d => format(d, 'dd')).join(",")
    const csvRows = [`"Name",${daysHeader},"P","L","HD","A","LV","OFF","%"`]
    tenantEmployees.forEach(emp => {
      const stats = employeeMonthlyStats.get(emp.id)
      const daysValues = monthDays.map(d => {
        const dateStr = format(d, 'yyyy-MM-dd')
        return getStatusText(getStatus(emp, dateStr))
      }).join(",")
      csvRows.push(`"${emp.full_name}",${daysValues},${stats?.present || 0},${stats?.late || 0},${stats?.halfDay || 0},${stats?.absent || 0},${stats?.leave || 0},${stats?.off || 0},${stats?.rate || 0}%`)
    })
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `Attendance_${format(currentDate, 'MMM_yyyy')}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (!isLoaded || !currentUser) {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-slate-950">
        <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 overflow-hidden">
      <div className="print:hidden md:p-4"><Sidebar /></div>
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="print:hidden"><TopBar title="Attendance" /></div>
        
        <main className="flex-1 overflow-y-auto p-3 lg:p-5 custom-scrollbar print:p-0">
          <div className="max-w-[1800px] mx-auto space-y-3">

            {/* Team Breadcrumb */}
            {teamObj && (
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500 print:hidden">
                <a href="/hr/teams" className="hover:text-[#ff5a36] transition-colors">Teams</a>
                <span className="text-slate-300">›</span>
                <a href={`/hr/teams/${teamFilter}`} className="hover:text-[#ff5a36] transition-colors">{teamObj.name}</a>
                <span className="text-slate-300">›</span>
                <span className="text-slate-800 dark:text-white font-bold">Attendance</span>
              </div>
            )}
            
            {/* Top bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 print:hidden">
              
              <div className="flex items-center gap-2 flex-wrap">
                <CalendarDays className="w-4 h-4 text-slate-400" />
                <select
                  value={teamFilter || ""}
                  onChange={(e) => {
                    if (e.target.value) {
                      router.push(`/hr/attendance?team=${e.target.value}`)
                    } else {
                      router.push(`/hr/attendance`)
                    }
                  }}
                  className="h-7 pl-1 pr-6 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-transparent border-none outline-none focus:ring-0 cursor-pointer appearance-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 4px center'
                  }}
                >
                  <option value="" className="text-slate-800">All Teams — Attendance</option>
                  {teams.map(t => (
                    <option key={t.id} value={t.id} className="text-slate-800">{t.name} — Attendance</option>
                  ))}
                </select>
                <span className="text-slate-300 dark:text-slate-600">|</span>
                
                <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg">
                  <button onClick={handlePrevMonth} className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-l-lg text-slate-500">
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 min-w-[110px] text-center border-x border-slate-200 dark:border-slate-700">
                    {format(currentDate, 'MMMM yyyy')}
                  </span>
                  <button onClick={handleNextMonth} className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-r-lg text-slate-500">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button onClick={handleThisMonth} className="px-2 py-1 text-[11px] font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md">
                  Today
                </button>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="h-7 pl-7 pr-2 text-[11px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-slate-400 dark:focus:border-slate-500 text-slate-700 dark:text-slate-200 w-36"
                  />
                </div>

                {/* Daily marking button */}
                <button onClick={() => openDailyPanel()}
                  className="h-7 px-3 text-[11px] font-semibold text-white bg-slate-800 dark:bg-slate-200 dark:text-slate-900 rounded-lg hover:bg-slate-700 dark:hover:bg-slate-300 inline-flex items-center gap-1.5">
                  <ClipboardList className="w-3 h-3" />
                  Mark Today
                </button>

                <button onClick={handleMarkSundaysOff} disabled={isProcessing}
                  className="h-7 px-2.5 text-[11px] font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40">
                  Sundays → OFF
                </button>

                <button onClick={handleExportCSV}
                  className="h-7 px-2.5 text-[11px] font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-1">
                  <Download className="w-3 h-3" /> Export
                </button>

                <Link href="/hr/attendance/reports"
                  className="h-7 px-2.5 text-[11px] font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center">
                  Reports →
                </Link>
              </div>
            </div>

            {/* Info strip */}
            <div className="text-[10px] text-slate-400 flex items-center justify-between gap-1.5 px-1 print:hidden flex-wrap">
              <div className="flex items-center gap-1.5">
                <Info className="w-3 h-3 shrink-0" />
                <span>Click <b>"Mark Today"</b> to save attendance for the day (unmarked employees default to Present). Future & unrecorded dates show <b>"-"</b>.</span>
              </div>
              <div className="inline-flex items-center gap-2 flex-wrap">
                <span className="text-green-600 font-semibold">P (Present)</span>
                <span className="text-red-500 font-semibold">A (Absent)</span>
                <span className="text-orange-500 font-semibold">L (Late)</span>
                <span className="text-blue-500 font-semibold">HD (Half Day)</span>
                <span className="text-violet-500 font-semibold">LV (Leave)</span>
                <span className="text-slate-400 font-semibold">OFF</span>
                <span className="text-slate-300 dark:text-slate-600 font-semibold">- (Unmarked)</span>
              </div>
            </div>

            {/* Table */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
              <div className="overflow-x-auto custom-scrollbar max-h-[calc(100vh-210px)]">
                <table className="w-full border-collapse text-[11px] select-none">
                  
                  <thead className="sticky top-0 z-30">
                    <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase">
                      <th className="py-2 px-1.5 text-center w-7 border-r border-slate-200 dark:border-slate-700 sticky left-0 z-40 bg-slate-50 dark:bg-slate-800">#</th>
                      <th className="py-2 px-2 text-left min-w-[150px] max-w-[180px] border-r border-slate-200 dark:border-slate-700 sticky left-7 z-40 bg-slate-50 dark:bg-slate-800">Name</th>

                      {monthDays.map(day => {
                        const dateStr = format(day, 'yyyy-MM-dd')
                        const isSun = isSunday(day)
                        const isTd = isDateToday(day)

                        return (
                          <th 
                            key={dateStr}
                            onClick={() => setColumnActionDate(columnActionDate === dateStr ? null : dateStr)}
                            className={`py-1 px-0 text-center w-[30px] min-w-[30px] border-r border-slate-100 dark:border-slate-800 cursor-pointer relative ${
                              isTd ? "bg-blue-50 dark:bg-blue-950/30" : isSun ? "bg-slate-100 dark:bg-slate-800/80" : "hover:bg-slate-100 dark:hover:bg-slate-700/40"
                            }`}
                            title={`${format(day, 'EEEE, MMM d')} — click for column actions`}
                          >
                            <div className="leading-none">
                              <div className={`text-[8px] font-normal ${isSun ? 'text-red-400' : 'text-slate-400'}`}>
                                {format(day, 'EEE').slice(0, 2)}
                              </div>
                              <div className={`text-[11px] font-bold mt-px ${isTd ? 'text-blue-600 dark:text-blue-400' : isSun ? 'text-red-400' : ''}`}>
                                {format(day, 'd')}
                              </div>
                            </div>

                            {columnActionDate === dateStr && (
                              <div 
                                ref={popoverRef}
                                onClick={e => e.stopPropagation()}
                                className="absolute top-full left-1/2 -translate-x-1/2 mt-1 z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg rounded-lg p-1 w-40 text-left font-normal"
                              >
                                <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 border-b border-slate-100 dark:border-slate-700 mb-0.5">
                                  {format(day, 'EEE, MMM d')}
                                </div>
                                <button 
                                  onClick={() => openDailyPanel(dateStr)}
                                  className="w-full px-2 py-1.5 text-[11px] rounded text-left hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5"
                                >
                                  <ClipboardList className="w-3 h-3" /> Mark This Day
                                </button>
                                <div className="border-t border-slate-100 dark:border-slate-700 my-0.5" />
                                {[
                                  { label: "All Present", code: 0 as AttendanceStatusCode, color: "text-green-600" },
                                  { label: "All Absent", code: 3 as AttendanceStatusCode, color: "text-red-600" },
                                  { label: "All Late", code: 1 as AttendanceStatusCode, color: "text-orange-600" },
                                  { label: "All OFF", code: 5 as AttendanceStatusCode, color: "text-slate-500" },
                                ].map(opt => (
                                  <button 
                                    key={opt.code}
                                    disabled={isProcessing}
                                    onClick={() => handleMarkAllForDate(dateStr, opt.code)}
                                    className={`w-full px-2 py-1 text-[11px] rounded text-left hover:bg-slate-50 dark:hover:bg-slate-700 font-medium ${opt.color} disabled:opacity-50`}
                                  >
                                    {opt.label}
                                  </button>
                                ))}
                                <div className="border-t border-slate-100 dark:border-slate-700 my-0.5" />
                                <button 
                                  onClick={() => handleClearAllForDate(dateStr)}
                                  disabled={isProcessing}
                                  className="w-full px-2 py-1 text-[11px] rounded text-left hover:bg-slate-50 dark:hover:bg-slate-700 font-medium text-slate-400 disabled:opacity-50"
                                >
                                  Clear Day (-)
                                </button>
                              </div>
                            )}
                          </th>
                        )
                      })}

                      <th className="py-2 px-1 text-center w-7 border-l border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-green-600" title="Present">P</th>
                      <th className="py-2 px-1 text-center w-7 border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-orange-500" title="Late">L</th>
                      <th className="py-2 px-1 text-center w-7 border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-red-500" title="Absent">A</th>
                      <th className="py-2 px-1 text-center w-7 border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-violet-500" title="Leave">LV</th>
                      <th className="py-2 px-1 text-center w-9 bg-slate-50 dark:bg-slate-800" title="Attendance %">%</th>
                    </tr>
                  </thead>

                  <tbody>
                    {tenantEmployees.length === 0 ? (
                      <tr>
                        <td colSpan={monthDays.length + 7} className="py-16 text-center text-slate-400 text-xs">
                          <Users className="w-6 h-6 mx-auto mb-1.5 text-slate-300" />
                          No employees found.
                        </td>
                      </tr>
                    ) : (
                      tenantEmployees.map((emp, idx) => {
                        const stats = employeeMonthlyStats.get(emp.id)
                        return (
                          <tr key={emp.id} className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 group/row">
                            
                            <td className="py-1 px-1.5 text-center text-[10px] text-slate-400 font-mono border-r border-slate-100 dark:border-slate-800 sticky left-0 z-20 bg-white dark:bg-slate-900 group-hover/row:bg-slate-50 dark:group-hover/row:bg-slate-800/50">
                              {idx + 1}
                            </td>

                            <td className="py-1 px-2 border-r border-slate-100 dark:border-slate-800 sticky left-7 z-20 bg-white dark:bg-slate-900 group-hover/row:bg-slate-50 dark:group-hover/row:bg-slate-800/50">
                              <button 
                                onClick={() => setSelectedDetailEmployee(emp)}
                                className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 truncate block max-w-[160px] text-left"
                                title={`${emp.full_name} — ${emp.job_title || 'Unassigned'}`}
                              >
                                {emp.full_name}
                              </button>
                            </td>

                            {monthDays.map(day => {
                              const dateStr = format(day, 'yyyy-MM-dd')
                              const status = getStatus(emp, dateStr)
                              const isSun = isSunday(day)
                              const isTd = isDateToday(day)
                              const text = getStatusText(status)

                              let cellClass = ""
                              let textClass = ""
                              
                              if (status === 0) {
                                // Present — green
                                textClass = "text-green-600 dark:text-green-500 font-semibold"
                              } else if (status === 3) {
                                cellClass = "bg-red-50 dark:bg-red-950/20"
                                textClass = "text-red-600 dark:text-red-400 font-bold"
                              } else if (status === 1) {
                                cellClass = "bg-orange-50 dark:bg-orange-950/20"
                                textClass = "text-orange-600 dark:text-orange-400 font-bold"
                              } else if (status === 2) {
                                cellClass = "bg-blue-50 dark:bg-blue-950/20"
                                textClass = "text-blue-600 dark:text-blue-400 font-bold"
                              } else if (status === 4) {
                                cellClass = "bg-violet-50 dark:bg-violet-950/20"
                                textClass = "text-violet-600 dark:text-violet-400 font-bold"
                              } else if (status === 5) {
                                cellClass = "bg-slate-100 dark:bg-slate-800"
                                textClass = "text-slate-400 dark:text-slate-500 font-semibold"
                              } else {
                                // Unmarked / Future (-)
                                textClass = "text-slate-300 dark:text-slate-600 font-normal"
                              }

                              return (
                                <td
                                  key={dateStr}
                                  onClick={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect()
                                    setActiveCell({
                                      employeeId: emp.id,
                                      zkUserId: emp.zk_user_id || null,
                                      dateStr,
                                      x: rect.left + rect.width / 2,
                                      y: rect.bottom + 2
                                    })
                                  }}
                                  onContextMenu={(e) => {
                                    e.preventDefault()
                                    handleCycleStatus(emp, dateStr)
                                  }}
                                  className={`py-0.5 px-0 text-center w-[30px] min-w-[30px] border-r border-slate-100 dark:border-slate-800/60 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950/20 ${cellClass} ${
                                    isTd && !cellClass ? "bg-blue-50/40 dark:bg-blue-950/10" : ""
                                  } ${isSun && !cellClass ? "bg-slate-50 dark:bg-slate-800/30" : ""}`}
                                  title={`${emp.full_name} — ${format(day, 'EEE, MMM d')}: ${getStatusLabel(status)}`}
                                >
                                  <span className={`text-[10px] font-mono ${textClass}`}>
                                    {text}
                                  </span>
                                </td>
                              )
                            })}

                            <td className="py-1 px-1 text-center text-[10px] font-semibold text-green-600 border-l border-r border-slate-200 dark:border-slate-700">
                              {stats?.present || 0}
                            </td>
                            <td className="py-1 px-1 text-center text-[10px] font-semibold text-orange-600 border-r border-slate-200 dark:border-slate-700">
                              {stats?.late || 0}
                            </td>
                            <td className="py-1 px-1 text-center text-[10px] font-semibold text-red-600 border-r border-slate-200 dark:border-slate-700">
                              {stats?.absent || 0}
                            </td>
                            <td className="py-1 px-1 text-center text-[10px] font-semibold text-violet-600 border-r border-slate-200 dark:border-slate-700">
                              {stats?.leave || 0}
                            </td>
                            <td className="py-1 px-1 text-center text-[10px] font-bold text-slate-700 dark:text-slate-200">
                              {stats?.rate || 0}%
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom summary */}
            <div className="flex items-center gap-4 text-[11px] text-slate-500 px-1 print:hidden flex-wrap">
              <span>{tenantEmployees.length} employees</span>
              <span>·</span>
              <span>Present: <b className="text-green-600">{overallKPIs.totalP}</b></span>
              <span>·</span>
              <span>Absent: <b className="text-red-600">{overallKPIs.totalA}</b></span>
              <span>·</span>
              <span>Late: <b className="text-orange-600">{overallKPIs.totalL}</b></span>
              <span>·</span>
              <span>Leave: <b className="text-violet-600">{overallKPIs.totalLV}</b></span>
              <span>·</span>
              <span>Half Day: <b className="text-blue-600">{overallKPIs.totalHD}</b></span>
            </div>

          </div>
        </main>
      </div>

      {/* ─── Cell popover ─── */}
      {activeCell && (
        <div 
          ref={popoverRef}
          style={{
            position: 'fixed',
            left: `${Math.min(Math.max(activeCell.x - 80, 8), window.innerWidth - 170)}px`,
            top: `${Math.min(activeCell.y, window.innerHeight - 200)}px`
          }}
          className="z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-lg rounded-lg p-1.5 w-[160px]"
        >
          <div className="text-[9px] font-semibold text-slate-400 uppercase px-1.5 pb-1 mb-1 border-b border-slate-100 dark:border-slate-800">
            {activeCell.dateStr}
          </div>

          <button
            onClick={() => handleMarkStatus(activeCell.employeeId, activeCell.zkUserId, activeCell.dateStr, 0)}
            className="w-full px-2 py-1 text-[11px] rounded text-green-600 hover:bg-green-50 dark:hover:bg-green-950/20 font-semibold text-left flex items-center justify-between"
          >
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3" /> Present
            </span>
            <span className="font-mono text-[10px]">P</span>
          </button>

          {[
            { code: 3 as AttendanceStatusCode, label: "Absent", short: "A", color: "text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30" },
            { code: 1 as AttendanceStatusCode, label: "Late", short: "L", color: "text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/30" },
            { code: 2 as AttendanceStatusCode, label: "Half Day", short: "HD", color: "text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30" },
            { code: 4 as AttendanceStatusCode, label: "Leave", short: "LV", color: "text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/30" },
            { code: 5 as AttendanceStatusCode, label: "Day Off", short: "OFF", color: "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800" },
          ].map(opt => (
            <button
              key={opt.code}
              onClick={() => handleMarkStatus(activeCell.employeeId, activeCell.zkUserId, activeCell.dateStr, opt.code)}
              className={`w-full px-2 py-1 text-[11px] rounded flex items-center justify-between font-semibold ${opt.color}`}
            >
              <span>{opt.label}</span>
              <span className="font-mono text-[10px]">{opt.short}</span>
            </button>
          ))}

          <div className="border-t border-slate-100 dark:border-slate-800 mt-1 pt-1">
            <button
              onClick={() => handleMarkStatus(activeCell.employeeId, activeCell.zkUserId, activeCell.dateStr, null)}
              className="w-full px-2 py-1 text-[11px] rounded text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium text-left flex items-center gap-1.5"
            >
              <X className="w-3 h-3" /> Clear / Unmark (-)
            </button>
          </div>
        </div>
      )}

      {/* ─── Daily Marking Panel (slide-over) ─── */}
      {showDailyPanel && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowDailyPanel(false)} />
          
          {/* Panel */}
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800">
            
            {/* Panel header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-sm font-bold text-slate-800 dark:text-white">Mark Attendance</h2>
                <div className="flex items-center gap-2 mt-1">
                  <input 
                    type="date" 
                    value={dailyPanelDate} 
                    onChange={e => {
                      setDailyPanelDate(e.target.value)
                      // Reload marks for new date
                      const marks = new Map<string, AttendanceStatusCode>()
                      tenantEmployees.forEach(emp => {
                        const st = getStatus(emp, e.target.value)
                        if (st !== null && st !== 0) marks.set(emp.id, st)
                      })
                      setDailyMarks(marks)
                    }}
                    className="text-xs border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none"
                  />
                  <span className="text-xs text-slate-400">
                    {format(new Date(dailyPanelDate + 'T12:00:00'), 'EEEE')}
                  </span>
                </div>
              </div>
              <button onClick={() => setShowDailyPanel(false)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Instructions */}
            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 shrink-0">
              Everyone is <b className="text-green-600">Present</b> by default. Select only those who are Absent, Late, etc.
            </div>

            {/* Employee list */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {tenantEmployees.map((emp, idx) => {
                const mark = dailyMarks.get(emp.id)
                const isPresent = mark === undefined
                
                return (
                  <div key={emp.id} className={`px-4 py-2 border-b border-slate-100 dark:border-slate-800/60 ${isPresent ? '' : 'bg-slate-50 dark:bg-slate-800/30'}`}>
                    
                    {/* Employee row */}
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[10px] text-slate-400 font-mono w-5 shrink-0">{idx + 1}</span>
                        <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-200 truncate">{emp.full_name}</span>
                        {emp.zk_user_id && (
                          <span className="text-[10px] text-slate-400 font-mono shrink-0">#{emp.zk_user_id}</span>
                        )}
                      </div>
                      {isPresent && (
                        <span className="text-[10px] font-semibold text-green-600 flex items-center gap-0.5">
                          <CheckCircle2 className="w-3 h-3" /> Present
                        </span>
                      )}
                    </div>
                    
                    {/* Status buttons */}
                    <div className="flex items-center gap-1 ml-7">
                      {[
                        { code: 3 as AttendanceStatusCode, label: "Absent", bg: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20", activeBg: "bg-red-500 text-white" },
                        { code: 1 as AttendanceStatusCode, label: "Late", bg: "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-500/20", activeBg: "bg-orange-500 text-white" },
                        { code: 2 as AttendanceStatusCode, label: "Half Day", bg: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20", activeBg: "bg-blue-500 text-white" },
                        { code: 4 as AttendanceStatusCode, label: "Leave", bg: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-500/20", activeBg: "bg-violet-500 text-white" },
                        { code: 5 as AttendanceStatusCode, label: "OFF", bg: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700", activeBg: "bg-slate-600 text-white dark:bg-slate-500" },
                      ].map(opt => {
                        const isActive = mark === opt.code
                        return (
                          <button
                            key={opt.code}
                            onClick={() => toggleDailyMark(emp.id, opt.code)}
                            className={`px-2.5 py-1 text-[10px] font-semibold rounded-md transition-colors ${
                              isActive ? opt.activeBg : opt.bg
                            }`}
                          >
                            {opt.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Panel footer — summary + save */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 shrink-0">
              <div className="flex items-center justify-between mb-3 text-[11px] text-slate-500">
                <span>
                  <b className="text-green-600">{tenantEmployees.length - dailyMarks.size}</b> Present
                </span>
                <span>
                  <b className="text-red-600">{Array.from(dailyMarks.values()).filter(v => v === 3).length}</b> Absent
                </span>
                <span>
                  <b className="text-orange-600">{Array.from(dailyMarks.values()).filter(v => v === 1).length}</b> Late
                </span>
                <span>
                  <b className="text-violet-600">{Array.from(dailyMarks.values()).filter(v => v === 4).length}</b> Leave
                </span>
              </div>
              <button 
                onClick={saveDailyMarks}
                disabled={dailySaving}
                className="w-full py-2 bg-slate-800 dark:bg-white text-white dark:text-slate-900 rounded-lg text-xs font-bold hover:bg-slate-700 dark:hover:bg-slate-100 disabled:opacity-50 transition-colors"
              >
                {dailySaving ? 'Saving...' : 'Save Attendance'}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedDetailEmployee && (
        <EmployeeAttendanceModal 
          employee={selectedDetailEmployee} 
          onClose={() => setSelectedDetailEmployee(null)} 
        />
      )}

      {/* Global Processing Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 z-[200] bg-black/20 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 shadow-2xl flex flex-col items-center gap-3">
            <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-800 dark:border-t-white rounded-full animate-spin" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Processing...</span>
          </div>
        </div>
      )}
    </div>
  )
}
