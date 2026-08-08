"use client"

import React, { useState, useMemo } from 'react'
import { X, CalendarDays, Edit2 } from 'lucide-react'
import { format, eachDayOfInterval, startOfMonth, endOfMonth, isSunday, isToday as isDateToday } from 'date-fns'
import { useAppContext, HREmployee } from "@/store/AppContext"
import { toast } from 'sonner'

export function EmployeeAttendanceModal({ employee, onClose }: { employee: HREmployee, onClose: () => void }) {
  const { hrAttendance, hrLeaves, markHRAttendance } = useAppContext()
  
  const [fromDate, setFromDate] = useState<string>(() => format(startOfMonth(new Date()), 'yyyy-MM-dd'))
  const [toDate, setToDate] = useState<string>(() => format(endOfMonth(new Date()), 'yyyy-MM-dd'))
  const [editingDate, setEditingDate] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)

  // Status mapping
  const getStatusLabel = (code: number | null, isOffDay = false) => {
    if (code === 0) return { label: 'Present', color: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30' }
    if (code === 1) return { label: 'Late', color: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30' }
    if (code === 2) return { label: 'Half Day', color: 'text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30' }
    if (code === 3) return { label: 'Absent', color: 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30' }
    if (code === 4) return { label: 'Leave', color: 'text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30' }
    if (code === 5) return { label: 'Off Day', color: 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800' }
    if (isOffDay) return { label: 'Sunday (Off)', color: 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800' }
    return { label: 'Not Marked', color: 'text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/40' }
  }

  const reportData = useMemo(() => {
    if (!employee) return []
    
    const start = new Date(fromDate)
    const end = new Date(toDate)
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return []
    
    const days = eachDayOfInterval({ start, end })
    
    return days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd')
      const isSun = isSunday(day)
      
      // Look for manual attendance record
      const attRecord = hrAttendance.find(att => {
        const isEmp = (att.employee_id && att.employee_id === employee.id) || (employee.zk_user_id && att.zk_user_id === employee.zk_user_id)
        return isEmp && (att.timestamp.startsWith(dayStr) || att.timestamp.substring(0, 10) === dayStr)
      })

      // Look for leave record
      const leaveRecord = hrLeaves.find(l => l.employee_id === employee.id && l.leave_date === dayStr)

      let statusCode: number | null = null
      let statusText = 'Not Marked'
      let hoursWorked = '-'

      if (attRecord) {
        statusCode = typeof attRecord.status === 'number' ? attRecord.status : 0
        if (statusCode === 0) { statusText = 'Present'; hoursWorked = '8 hrs' }
        else if (statusCode === 1) { statusText = 'Late'; hoursWorked = '8 hrs' }
        else if (statusCode === 2) { statusText = 'Half Day'; hoursWorked = '4 hrs' }
        else if (statusCode === 3) { statusText = 'Absent'; hoursWorked = '0 hrs' }
        else if (statusCode === 4) { statusText = 'Leave'; hoursWorked = '8 hrs' }
        else if (statusCode === 5) { statusText = 'Off Day'; hoursWorked = '-' }
      } else if (leaveRecord) {
        statusCode = 4
        statusText = leaveRecord.is_paid ? 'Paid Leave' : 'Unpaid Leave'
        hoursWorked = leaveRecord.is_paid ? '8 hrs' : '0 hrs'
      } else if (isSun) {
        statusCode = 5
        statusText = 'Sunday'
        hoursWorked = '-'
      }

      return {
        date: dayStr,
        dayName: format(day, 'EEEE'),
        formattedDate: format(day, 'MMM d, yyyy'),
        isSunday: isSun,
        isToday: isDateToday(day),
        statusCode,
        statusText,
        hoursWorked
      }
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [hrAttendance, hrLeaves, employee, fromDate, toDate])

  // Summary counts
  const summary = useMemo(() => {
    let present = 0, late = 0, halfDay = 0, absent = 0, leave = 0, off = 0, workingDays = 0

    reportData.forEach(r => {
      if (r.statusCode === 0) { present++; workingDays++ }
      else if (r.statusCode === 1) { late++; present++; workingDays++ }
      else if (r.statusCode === 2) { halfDay++; workingDays++ }
      else if (r.statusCode === 3) { absent++; workingDays++ }
      else if (r.statusCode === 4) { leave++; workingDays++ }
      else if (r.statusCode === 5) { off++ }
      else if (!r.isSunday) { workingDays++ }
    })

    const attended = present + (halfDay * 0.5)
    const attendanceRate = workingDays > 0 ? Math.min(100, Math.round((attended / workingDays) * 100)) : 0

    return { present, late, halfDay, absent, leave, off, workingDays, attendanceRate }
  }, [reportData])

  const handleUpdateStatus = async (dateStr: string, newStatus: number | null) => {
    try {
      setUpdating(true)
      await markHRAttendance(employee.id, employee.zk_user_id || null, dateStr, newStatus)
      setEditingDate(null)
      toast.success(`Updated attendance for ${format(new Date(dateStr), 'MMM d')}`)
    } finally {
      setUpdating(false)
    }
  }

  if (!employee) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-4xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-white font-bold text-sm">
              {employee.avatar_url ? (
                <img src={employee.avatar_url} className="w-full h-full rounded-lg object-cover" alt={employee.full_name} />
              ) : (
                employee.full_name.charAt(0)
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold">{employee.full_name}</h2>
                {employee.status === "Documents Missing" && (
                  <span className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">
                    Missing Docs
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {employee.job_title || 'Unassigned'} • CNIC: {employee.cnic_number || 'N/A'}
              </p>
            </div>
          </div>
          
          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Modal Body */}
        <div className="p-5 flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50 dark:bg-slate-950/40 space-y-4 text-xs">
          
          {/* Controls & Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Filter Date */}
            <div className="bg-white dark:bg-slate-900 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col justify-center">
              <span className="text-[10px] font-medium text-slate-400 block mb-1.5">Period Filter</span>
              <div className="grid grid-cols-2 gap-1.5">
                <input 
                  type="date" 
                  value={fromDate} 
                  onChange={e => setFromDate(e.target.value)} 
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-xs outline-none text-slate-800 dark:text-white" 
                />
                <input 
                  type="date" 
                  value={toDate} 
                  onChange={e => setToDate(e.target.value)} 
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-xs outline-none text-slate-800 dark:text-white" 
                />
              </div>
            </div>

            {/* Attendance Rate */}
            <div className="bg-white dark:bg-slate-900 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
              <span className="text-[10px] font-medium text-slate-400">Attendance Score</span>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                {summary.attendanceRate}%
              </div>
              <span className="text-[10px] text-slate-400">{summary.present} of {summary.workingDays} working days</span>
            </div>

            {/* Summary Metrics */}
            <div className="bg-white dark:bg-slate-900 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 col-span-2 grid grid-cols-5 gap-2 text-center">
              <div>
                <span className="text-[10px] font-medium text-slate-400 block">Present</span>
                <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">{summary.present}</span>
              </div>
              <div>
                <span className="text-[10px] font-medium text-slate-400 block">Late</span>
                <span className="text-base font-bold text-amber-600 dark:text-amber-400">{summary.late}</span>
              </div>
              <div>
                <span className="text-[10px] font-medium text-slate-400 block">Half Day</span>
                <span className="text-base font-bold text-purple-600 dark:text-purple-400">{summary.halfDay}</span>
              </div>
              <div>
                <span className="text-[10px] font-medium text-slate-400 block">Absent</span>
                <span className="text-base font-bold text-rose-600 dark:text-rose-400">{summary.absent}</span>
              </div>
              <div>
                <span className="text-[10px] font-medium text-slate-400 block">Leave</span>
                <span className="text-base font-bold text-indigo-600 dark:text-indigo-400">{summary.leave}</span>
              </div>
            </div>
          </div>
          
          {/* Day Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Daily Log ({reportData.length} days)
              </span>
              <span className="text-[11px] text-slate-400">
                Click Edit to change status
              </span>
            </div>

            <div className="overflow-x-auto max-h-[380px] custom-scrollbar">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                    <th className="px-4 py-2.5">Date</th>
                    <th className="px-4 py-2.5">Day</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5">Hours</th>
                    <th className="px-4 py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {reportData.map((row) => {
                    const statusMeta = getStatusLabel(row.statusCode, row.isSunday)
                    const isEditing = editingDate === row.date

                    return (
                      <tr 
                        key={row.date} 
                        className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors ${
                          row.isToday ? 'bg-slate-50 dark:bg-slate-800/20' : ''
                        }`}
                      >
                        <td className="px-4 py-2.5 font-medium text-slate-800 dark:text-slate-200">
                          {row.formattedDate}
                        </td>
                        <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">
                          {row.dayName}
                        </td>
                        <td className="px-4 py-2.5">
                          {isEditing ? (
                            <div className="flex items-center gap-1 flex-wrap">
                              <button
                                onClick={() => handleUpdateStatus(row.date, 0)}
                                className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[11px] font-semibold hover:bg-emerald-700 cursor-pointer"
                              >
                                Present
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(row.date, 1)}
                                className="px-2 py-0.5 rounded bg-amber-600 text-white text-[11px] font-semibold hover:bg-amber-700 cursor-pointer"
                              >
                                Late
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(row.date, 2)}
                                className="px-2 py-0.5 rounded bg-purple-600 text-white text-[11px] font-semibold hover:bg-purple-700 cursor-pointer"
                              >
                                Half Day
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(row.date, 3)}
                                className="px-2 py-0.5 rounded bg-rose-600 text-white text-[11px] font-semibold hover:bg-rose-700 cursor-pointer"
                              >
                                Absent
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(row.date, 4)}
                                className="px-2 py-0.5 rounded bg-indigo-600 text-white text-[11px] font-semibold hover:bg-indigo-700 cursor-pointer"
                              >
                                Leave
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(row.date, 5)}
                                className="px-2 py-0.5 rounded bg-slate-600 text-white text-[11px] font-semibold hover:bg-slate-700 cursor-pointer"
                              >
                                Off
                              </button>
                              <button
                                onClick={() => setEditingDate(null)}
                                className="p-0.5 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold ${statusMeta.color}`}>
                              {statusMeta.label}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">
                          {row.hoursWorked}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          {!isEditing && (
                            <button
                              onClick={() => setEditingDate(row.date)}
                              className="px-2 py-0.5 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-medium cursor-pointer"
                            >
                              Edit
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  )
}
