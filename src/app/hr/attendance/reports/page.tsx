"use client"

import React, { useState, useMemo } from 'react'
import { useAppContext } from "@/store/AppContext"
import { TopBar } from "@/components/layout/topbar"
import { Sidebar } from "@/components/layout/sidebar"
import { Users, FileDown, Printer, AlertCircle, CalendarDays } from 'lucide-react'
import { startOfMonth, endOfMonth, eachDayOfInterval, format } from 'date-fns'
import Link from 'next/link'
import { EmployeeAttendanceModal } from "@/components/hr/EmployeeAttendanceModal"

export default function AttendanceReportsPage() {
  const { hrAttendance, hrEmployees, isLoaded } = useAppContext()
  
  const [fromDate, setFromDate] = useState<string>(startOfMonth(new Date()).toISOString().split('T')[0])
  const [toDate, setToDate] = useState<string>(endOfMonth(new Date()).toISOString().split('T')[0])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDetailEmployee, setSelectedDetailEmployee] = useState<any>(null)

  // Calculate aggregated report data
  const reportData = useMemo(() => {
    if (!hrEmployees || hrEmployees.length === 0) return []

    const start = new Date(fromDate)
    const end = new Date(toDate)
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return []
    
    const days = eachDayOfInterval({ start, end })

    // Build stats per employee
    const stats = hrEmployees.map(employee => {
      let totalPresent = 0
      let totalLate = 0
      let totalAbsent = 0
      let totalMsWorked = 0

      days.forEach(day => {
        const dayStr = format(day, 'yyyy-MM-dd')
        
        // Manual record lookup
        const manualRecord = hrAttendance.find(att => {
          const isEmp = (att.employee_id && att.employee_id === employee.id) || (employee.zk_user_id && att.zk_user_id === employee.zk_user_id)
          return isEmp && (att.timestamp.startsWith(dayStr) || att.timestamp.substring(0, 10) === dayStr)
        })

        if (manualRecord) {
          if (manualRecord.status === 0) {
            totalPresent++
            totalMsWorked += 8 * 60 * 60 * 1000
          } else if (manualRecord.status === 1) {
            totalLate++
            totalMsWorked += 8 * 60 * 60 * 1000
          } else if (manualRecord.status === 2) {
            totalPresent++
            totalMsWorked += 4 * 60 * 60 * 1000
          } else if (manualRecord.status === 3) {
            totalAbsent++
          }
          return
        }

        if (employee.zk_user_id) {
          const shiftStart = new Date(`${dayStr}T18:00:00`)
          const shiftEnd = new Date(shiftStart.getTime() + 15 * 60 * 60 * 1000)

          const punches = hrAttendance.filter(att => {
            if (att.zk_user_id !== employee.zk_user_id) return false
            const pDate = new Date(att.timestamp)
            return pDate >= shiftStart && pDate <= shiftEnd
          }).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

          if (punches.length === 0) {
            totalAbsent++
          } else {
            const firstPunch = punches[0]
            const lastPunch = punches[punches.length - 1]
            
            const firstPunchDate = new Date(firstPunch.timestamp)
            const lateThreshold = new Date(shiftStart.getTime() + 2 * 60 * 60 * 1000 + 10 * 60 * 1000)
            if (firstPunchDate > lateThreshold) {
              totalLate++
            } else {
              totalPresent++
            }

            if (punches.length > 1) {
              totalMsWorked += new Date(lastPunch.timestamp).getTime() - new Date(firstPunch.timestamp).getTime()
            }
          }
        } else {
          totalAbsent++
        }
      })

      const hrs = Math.floor(totalMsWorked / (1000 * 60 * 60))
      const mins = Math.floor((totalMsWorked % (1000 * 60 * 60)) / (1000 * 60))
      const totalHoursStr = totalMsWorked > 0 ? `${hrs}h ${mins}m` : "-"

      return {
        employee,
        totalPresent,
        totalLate,
        totalAbsent,
        totalHours: totalHoursStr
      }
    })

    // Filter by search
    if (searchQuery.trim()) {
      return stats.filter(s => s.employee.full_name.toLowerCase().includes(searchQuery.toLowerCase()))
    }
    
    return stats.sort((a, b) => a.employee.full_name.localeCompare(b.employee.full_name))
  }, [hrAttendance, hrEmployees, fromDate, toDate, searchQuery])

  const exportToCSV = () => {
    const headers = ["Employee Name", "Machine ID", "Total Present", "Total Late", "Total Absent", "Total Work Hours"];
    const rows = reportData.map(r => [
      `"${r.employee.full_name}"`,
      r.employee.zk_user_id || 'N/A',
      r.totalPresent,
      r.totalLate,
      r.totalAbsent,
      r.totalHours
    ]);
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `attendance_report_${fromDate}_to_${toDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const exportToPDF = () => {
    window.print()
  }

  if (!isLoaded) return <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-gray-900 text-slate-800 dark:text-white">Loading HR Systems...</div>

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-gray-900 text-slate-800 dark:text-white overflow-hidden selection:bg-indigo-500/30">
      <div className="print:hidden">
        <Sidebar />
      </div>
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <div className="print:hidden">
          <TopBar title="Attendance Reports" />
        </div>
        
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar print:p-0">
          
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* Tabs */}
            <div className="flex space-x-1 bg-slate-200/50 dark:bg-gray-800 p-1 rounded-xl w-fit border border-slate-200 dark:border-gray-700/50 print:hidden">
              <Link href="/hr/attendance" className="px-6 py-2.5 rounded-lg text-sm font-medium text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-700/50 transition-all">
                Daily View
              </Link>
              <Link href="/hr/attendance/reports" className="px-6 py-2.5 rounded-lg text-sm font-medium bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm transition-all">
                Monthly Reports
              </Link>
            </div>
            
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-800/40 p-6 rounded-2xl border border-slate-200 dark:border-gray-700/50 shadow-sm dark:shadow-none backdrop-blur-sm print:hidden">
              <div>
                <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-600 dark:from-indigo-400 dark:to-cyan-400">Monthly Attendance Report</h1>
                <p className="text-slate-500 dark:text-gray-400 text-sm mt-1">Aggregated employee attendance over a date range.</p>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                <input 
                  type="date" 
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="bg-white dark:bg-gray-800 border border-slate-300 dark:border-gray-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  title="From Date"
                />
                <span className="text-slate-400">to</span>
                <input 
                  type="date" 
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="bg-white dark:bg-gray-800 border border-slate-300 dark:border-gray-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  title="To Date"
                />
                <input
                  type="text"
                  placeholder="Search employee..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="bg-white dark:bg-gray-800 border border-slate-300 dark:border-gray-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all w-48"
                />
                <div className="h-8 w-px bg-slate-200 dark:bg-gray-700 mx-1"></div>
                <button 
                  onClick={exportToCSV}
                  className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-sm"
                >
                  <FileDown className="w-4 h-4" /> CSV
                </button>
                <button 
                  onClick={exportToPDF}
                  className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-slate-300 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-700 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-sm"
                >
                  <Printer className="w-4 h-4" /> Print
                </button>
              </div>
            </div>

            {/* Print Header */}
            <div className="hidden print:block mb-8">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Attendance Report</h1>
              <p className="text-slate-600">Period: {format(new Date(fromDate), 'MMM d, yyyy')} - {format(new Date(toDate), 'MMM d, yyyy')}</p>
            </div>

            {/* Data Table */}
            <div className="bg-white dark:bg-gray-800/40 border border-slate-200 dark:border-gray-700/50 rounded-2xl overflow-hidden shadow-sm dark:shadow-none backdrop-blur-sm print:border-none print:shadow-none">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-gray-800/80 border-b border-slate-200 dark:border-gray-700/50 text-slate-500 dark:text-gray-400 text-xs uppercase tracking-wider print:bg-transparent">
                      <th className="px-6 py-4 font-medium">Employee</th>
                      <th className="px-6 py-4 font-medium text-center">Present</th>
                      <th className="px-6 py-4 font-medium text-center">Late</th>
                      <th className="px-6 py-4 font-medium text-center">Absent</th>
                      <th className="px-6 py-4 font-medium text-right">Total Hours</th>
                      <th className="px-6 py-4 font-medium text-right print:hidden">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-gray-700/50 print:divide-slate-300">
                    {reportData.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                          No employees found or no data available.
                        </td>
                      </tr>
                    ) : (
                      reportData.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-gray-700/20 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-sm print:hidden">
                                {row.employee.avatar_url ? (
                                  <img src={row.employee.avatar_url} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                  row.employee.full_name.charAt(0)
                                )}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-800 dark:text-gray-100 print:text-black">{row.employee.full_name}</div>
                                <div className="text-xs text-slate-500 dark:text-gray-400 print:text-slate-600">
                                  ID: {row.employee.zk_user_id || 'Not Linked'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center justify-center min-w-[2rem] h-8 px-2 rounded-lg bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-500/20 print:border-none print:bg-transparent print:text-black">
                              {row.totalPresent}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center justify-center min-w-[2rem] h-8 px-2 rounded-lg bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold border border-amber-200 dark:border-amber-500/20 print:border-none print:bg-transparent print:text-black">
                              {row.totalLate}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center justify-center min-w-[2rem] h-8 px-2 rounded-lg bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 font-bold border border-rose-200 dark:border-rose-500/20 print:border-none print:bg-transparent print:text-black">
                              {row.totalAbsent}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-medium text-slate-700 dark:text-gray-300 print:text-black">
                            {row.totalHours}
                          </td>
                          <td className="px-6 py-4 text-right print:hidden">
                            <button 
                              onClick={() => setSelectedDetailEmployee(row.employee)}
                              disabled={!row.employee.zk_user_id}
                              className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-gray-700 hover:bg-slate-200 dark:hover:bg-gray-600 text-slate-700 dark:text-slate-200 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </main>
      </div>

      {selectedDetailEmployee && (
        <EmployeeAttendanceModal 
          employee={selectedDetailEmployee} 
          onClose={() => setSelectedDetailEmployee(null)} 
        />
      )}
    </div>
  )
}
