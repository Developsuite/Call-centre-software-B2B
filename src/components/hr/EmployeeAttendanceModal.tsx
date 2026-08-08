"use client"

import React, { useState, useMemo } from 'react'
import { X, CalendarDays, Clock, CheckCircle, XCircle, AlertCircle, Edit2, Check, Sparkles } from 'lucide-react'
import { format, eachDayOfInterval, startOfMonth, endOfMonth, isSunday, isSaturday, isToday as isDateToday } from 'date-fns'
import { useAppContext, HREmployee } from "@/store/AppContext"
import { toast } from 'sonner'

export function EmployeeAttendanceModal({ employee, onClose }: { employee: HREmployee, onClose: () => void }) {
  const { hrAttendance, hrLeaves, markHRAttendance } = useAppContext()
  
  const [fromDate, setFromDate] = useState<string>(() => format(startOfMonth(new Date()), 'yyyy-MM-dd'))
  const [toDate, setToDate] = useState<string>(() => format(endOfMonth(new Date()), 'yyyy-MM-dd'))
  const [editingDate, setEditingDate] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)

  // Status mapping
  // 0: Present, 1: Late, 2: Half Day, 3: Absent, 4: Leave, 5: Off
  const getStatusLabel = (code: number | null, isOffDay = false) => {
    if (code === 0) return { label: 'Present', color: 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' }
    if (code === 1) return { label: 'Late', color: 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20' }
    if (code === 2) return { label: 'Half Day', color: 'bg-purple-100 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/20' }
    if (code === 3) return { label: 'Absent', color: 'bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20' }
    if (code === 4) return { label: 'Leave', color: 'bg-indigo-100 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20' }
    if (code === 5) return { label: 'Off Day', color: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700' }
    if (isOffDay) return { label: 'Sunday / Off', color: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700' }
    return { label: 'Not Marked', color: 'bg-slate-50 dark:bg-slate-800/50 text-slate-400 border-slate-200 dark:border-slate-700' }
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

      // Look for official leave record
      const leaveRecord = hrLeaves.find(l => {
        return l.employee_id === employee.id && l.leave_date === dayStr
      })

      let statusCode: number | null = null
      let statusText = 'Not Marked'
      let hoursWorked = '-'

      if (attRecord) {
        statusCode = typeof attRecord.status === 'number' ? attRecord.status : 0
        if (statusCode === 0) { statusText = 'Present'; hoursWorked = '8h 00m' }
        else if (statusCode === 1) { statusText = 'Late'; hoursWorked = '8h 00m' }
        else if (statusCode === 2) { statusText = 'Half Day'; hoursWorked = '4h 00m' }
        else if (statusCode === 3) { statusText = 'Absent'; hoursWorked = '0h 00m' }
        else if (statusCode === 4) { statusText = 'Leave'; hoursWorked = '8h 00m' }
        else if (statusCode === 5) { statusText = 'Off Day'; hoursWorked = '-' }
      } else if (leaveRecord) {
        statusCode = 4
        statusText = leaveRecord.is_paid ? 'Paid Leave' : 'Unpaid Leave'
        hoursWorked = leaveRecord.is_paid ? '8h 00m' : '0h 00m'
      } else if (isSun) {
        statusCode = 5
        statusText = 'Sunday (Off)'
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
        hoursWorked,
        recordId: attRecord?.id
      }
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // Newest first
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
    } catch (e: any) {
      // toast is in context
    } finally {
      setUpdating(false)
    }
  }

  if (!employee) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#ff5a36] to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
              {employee.avatar_url ? (
                <img src={employee.avatar_url} className="w-full h-full rounded-2xl object-cover" alt={employee.full_name} />
              ) : (
                employee.full_name.charAt(0)
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight">{employee.full_name}</h2>
                {employee.status === "Documents Missing" && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Docs Missing
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                {employee.job_title || 'Unassigned'} • CNIC: {employee.cnic_number || 'N/A'} • {employee.email || ''}
              </p>
            </div>
          </div>
          
          <button 
            onClick={onClose} 
            className="p-2.5 hover:bg-white/10 rounded-xl transition-colors cursor-pointer text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Body */}
        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50 dark:bg-slate-950/40 space-y-6">
          
          {/* Controls & Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Date Range Picker */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-center">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5 text-[#ff5a36]" /> Filter Period
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5 font-medium">From</span>
                  <input 
                    type="date" 
                    value={fromDate} 
                    onChange={e => setFromDate(e.target.value)} 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-[#ff5a36]/50 outline-none text-slate-800 dark:text-white" 
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5 font-medium">To</span>
                  <input 
                    type="date" 
                    value={toDate} 
                    onChange={e => setToDate(e.target.value)} 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-[#ff5a36]/50 outline-none text-slate-800 dark:text-white" 
                  />
                </div>
              </div>
            </div>

            {/* Attendance Rate Banner */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Attendance Score</p>
                <h3 className="text-3xl font-extrabold text-indigo-950 dark:text-white mt-1">{summary.attendanceRate}%</h3>
                <p className="text-[11px] text-indigo-600/80 dark:text-indigo-400/80 font-medium">
                  {summary.present} of {summary.workingDays} working days
                </p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 dark:bg-indigo-400/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Sparkles className="w-7 h-7" />
              </div>
            </div>

            {/* Status Breakdown Pills */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm grid grid-cols-3 gap-2 text-center">
              <div className="bg-emerald-50 dark:bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20">
                <p className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Present</p>
                <p className="text-base font-extrabold text-emerald-700 dark:text-emerald-300">{summary.present}</p>
              </div>
              <div className="bg-amber-50 dark:bg-amber-500/10 p-2 rounded-xl border border-amber-500/20">
                <p className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase">Late</p>
                <p className="text-base font-extrabold text-amber-700 dark:text-amber-300">{summary.late}</p>
              </div>
              <div className="bg-rose-50 dark:bg-rose-500/10 p-2 rounded-xl border border-rose-500/20">
                <p className="text-[9px] font-bold text-rose-600 dark:text-rose-400 uppercase">Absent</p>
                <p className="text-base font-extrabold text-rose-700 dark:text-rose-300">{summary.absent}</p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-500/10 p-2 rounded-xl border border-purple-500/20">
                <p className="text-[9px] font-bold text-purple-600 dark:text-purple-400 uppercase">Half Day</p>
                <p className="text-base font-extrabold text-purple-700 dark:text-purple-300">{summary.halfDay}</p>
              </div>
              <div className="bg-indigo-50 dark:bg-indigo-500/10 p-2 rounded-xl border border-indigo-500/20">
                <p className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">Leave</p>
                <p className="text-base font-extrabold text-indigo-700 dark:text-indigo-300">{summary.leave}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                <p className="text-[9px] font-bold text-slate-500 uppercase">Off</p>
                <p className="text-base font-extrabold text-slate-700 dark:text-slate-300">{summary.off}</p>
              </div>
            </div>
          </div>
          
          {/* Day-by-Day Sheet Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-3.5 bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Daily Attendance Breakdown ({reportData.length} Days)
              </h4>
              <span className="text-[11px] text-slate-400 font-medium">
                Click any row to adjust / manual mark status
              </span>
            </div>

            <div className="overflow-x-auto max-h-[420px] custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 text-slate-400 text-[10px] uppercase font-bold tracking-wider sticky top-0 backdrop-blur-md">
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Day</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Logged Work Hours</th>
                    <th className="px-5 py-3 text-right">Quick Edit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                  {reportData.map((row) => {
                    const statusMeta = getStatusLabel(row.statusCode, row.isSunday)
                    const isEditing = editingDate === row.date

                    return (
                      <tr 
                        key={row.date} 
                        className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                          row.isToday ? 'bg-indigo-50/30 dark:bg-indigo-950/15' : ''
                        } ${row.isSunday ? 'bg-slate-50/40 dark:bg-slate-900/40 opacity-75' : ''}`}
                      >
                        <td className="px-5 py-3 font-semibold text-slate-800 dark:text-slate-200">
                          <div className="flex items-center gap-2">
                            <span>{row.formattedDate}</span>
                            {row.isToday && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                                Today
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-slate-500 dark:text-slate-400 font-medium">
                          {row.dayName}
                        </td>
                        <td className="px-5 py-3">
                          {isEditing ? (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <button
                                onClick={() => handleUpdateStatus(row.date, 0)}
                                className="px-2 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-bold hover:bg-emerald-700 cursor-pointer"
                              >
                                Present
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(row.date, 1)}
                                className="px-2 py-1 rounded-lg bg-amber-500 text-white text-[11px] font-bold hover:bg-amber-600 cursor-pointer"
                              >
                                Late
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(row.date, 2)}
                                className="px-2 py-1 rounded-lg bg-purple-600 text-white text-[11px] font-bold hover:bg-purple-700 cursor-pointer"
                              >
                                Half Day
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(row.date, 3)}
                                className="px-2 py-1 rounded-lg bg-rose-600 text-white text-[11px] font-bold hover:bg-rose-700 cursor-pointer"
                              >
                                Absent
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(row.date, 4)}
                                className="px-2 py-1 rounded-lg bg-indigo-600 text-white text-[11px] font-bold hover:bg-indigo-700 cursor-pointer"
                              >
                                Leave
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(row.date, 5)}
                                className="px-2 py-1 rounded-lg bg-slate-600 text-white text-[11px] font-bold hover:bg-slate-700 cursor-pointer"
                              >
                                Off
                              </button>
                              <button
                                onClick={() => setEditingDate(null)}
                                className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[11px] font-bold border ${statusMeta.color}`}>
                              {statusMeta.label}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-slate-600 dark:text-slate-400 font-medium">
                          {row.hoursWorked}
                        </td>
                        <td className="px-5 py-3 text-right">
                          {!isEditing && (
                            <button
                              onClick={() => setEditingDate(row.date)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3 h-3" /> Edit
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                  {reportData.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                        No days found in this interval.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  )
}
