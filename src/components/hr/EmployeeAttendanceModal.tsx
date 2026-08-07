import React, { useState, useMemo } from 'react'
import { X, CalendarDays, Clock, CheckCircle, XCircle } from 'lucide-react'
import { format, eachDayOfInterval, startOfMonth, endOfMonth } from 'date-fns'
import { useAppContext } from "@/store/AppContext"

export function EmployeeAttendanceModal({ employee, onClose }: { employee: any, onClose: () => void }) {
  const { hrAttendance } = useAppContext()
  
  const [fromDate, setFromDate] = useState<string>(startOfMonth(new Date()).toISOString().split('T')[0])
  const [toDate, setToDate] = useState<string>(endOfMonth(new Date()).toISOString().split('T')[0])

  const reportData = useMemo(() => {
    if (!employee) return []
    
    // Generate all dates in the range
    const start = new Date(fromDate)
    const end = new Date(toDate)
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return []
    
    const days = eachDayOfInterval({ start, end })
    
    return days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd')
      
      // Look for manual record first
      const manualRecord = hrAttendance.find(att => {
        const isEmp = (att.employee_id && att.employee_id === employee.id) || (employee.zk_user_id && att.zk_user_id === employee.zk_user_id)
        return isEmp && (att.timestamp.startsWith(dayStr) || att.timestamp.substring(0, 10) === dayStr)
      })

      if (manualRecord) {
        let st = 'Present'
        if (manualRecord.status === 0) st = 'Present'
        else if (manualRecord.status === 1) st = 'Late'
        else if (manualRecord.status === 2) st = 'Half Day'
        else if (manualRecord.status === 3) st = 'Absent'
        else if (manualRecord.status === 4) st = 'Leave'
        else if (manualRecord.status === 5) st = 'Off'

        return {
          date: dayStr,
          firstPunch: manualRecord.timestamp,
          lastPunch: null,
          workedHours: st === 'Present' ? '8h 00m' : st === 'Half Day' ? '4h 00m' : '-',
          status: st
        }
      }

      const shiftStart = new Date(`${dayStr}T18:00:00`)
      const shiftEnd = new Date(shiftStart.getTime() + 15 * 60 * 60 * 1000)
      
      const punches = hrAttendance.filter(att => {
        if (!employee.zk_user_id || att.zk_user_id !== employee.zk_user_id) return false
        const pDate = new Date(att.timestamp)
        return pDate >= shiftStart && pDate <= shiftEnd
      }).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      
      if (punches.length === 0) {
        return {
          date: dayStr,
          firstPunch: null,
          lastPunch: null,
          workedHours: "-",
          status: 'Absent'
        }
      }
      
      const firstPunch = punches[0]
      const lastPunch = punches[punches.length - 1]
      
      let workedHours = "-"
      if (punches.length > 1) {
        const diffMs = new Date(lastPunch.timestamp).getTime() - new Date(firstPunch.timestamp).getTime()
        const hrs = Math.floor(diffMs / (1000 * 60 * 60))
        const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
        workedHours = `${hrs}h ${mins}m`
      }
      
      const firstPunchDate = new Date(firstPunch.timestamp)
      const lateThreshold = new Date(shiftStart.getTime() + 2 * 60 * 60 * 1000 + 10 * 60 * 1000)
      const isLate = firstPunchDate > lateThreshold
      
      return {
        date: dayStr,
        firstPunch: firstPunch.timestamp,
        lastPunch: punches.length > 1 ? lastPunch.timestamp : null,
        workedHours,
        status: isLate ? 'Late' : 'Present'
      }
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // Newest first
  }, [hrAttendance, employee, fromDate, toDate])

  if (!employee) return null

  // calculate summary
  const totalPresent = reportData.filter(r => r.status === 'Present').length
  const totalLate = reportData.filter(r => r.status === 'Late').length
  const totalAbsent = reportData.filter(r => r.status === 'Absent').length

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden border border-slate-200 dark:border-gray-700 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
              {employee.avatar_url ? (
                <img src={employee.avatar_url} className="w-full h-full rounded-full object-cover" />
              ) : (
                employee.full_name.charAt(0)
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">{employee.full_name}</h2>
              <p className="text-sm text-slate-500 dark:text-gray-400">{employee.job_title} | ID: {employee.zk_user_id || 'Not Linked'}</p>
            </div>
          </div>
          
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-full transition-colors">
            <X className="w-6 h-6 text-slate-500 dark:text-gray-400" />
          </button>
        </div>
        
        {/* Body */}
        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50 dark:bg-gray-900/50">
          
          {/* Controls & Summary */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 bg-white dark:bg-gray-800 p-5 rounded-2xl border border-slate-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-gray-400 mb-1">From Date</label>
                <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="bg-slate-50 dark:bg-gray-900 border border-slate-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-gray-400 mb-1">To Date</label>
                <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="bg-slate-50 dark:bg-gray-900 border border-slate-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-white" />
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{totalPresent}</div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Present</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{totalLate}</div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Late</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">{totalAbsent}</div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Absent</div>
              </div>
            </div>
          </div>
          
          {/* Table */}
          <div className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-gray-800/80 border-b border-slate-200 dark:border-gray-700 text-slate-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-medium">Shift Date</th>
                  <th className="px-6 py-4 font-medium">Check In</th>
                  <th className="px-6 py-4 font-medium">Check Out</th>
                  <th className="px-6 py-4 font-medium">Work Hours</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-gray-700/50">
                {reportData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-gray-700/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-800 dark:text-gray-200 font-medium">
                        <CalendarDays className="w-4 h-4 text-indigo-500" />
                        {format(new Date(row.date), 'EEE, MMM d, yyyy')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {row.firstPunch ? (
                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
                          <CheckCircle className="w-4 h-4" />
                          {format(new Date(row.firstPunch), 'hh:mm a')}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {row.lastPunch ? (
                        <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-medium">
                          <XCircle className="w-4 h-4" />
                          {format(new Date(row.lastPunch), 'hh:mm a')}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-2 text-slate-700 dark:text-gray-300">
                         <Clock className="w-4 h-4 text-slate-400" />
                         {row.workedHours}
                       </div>
                    </td>
                    <td className="px-6 py-4">
                      {row.status === 'Present' ? (
                        <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-medium border border-emerald-200 dark:border-emerald-500/20">Present</span>
                      ) : row.status === 'Late' ? (
                        <span className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-medium border border-amber-200 dark:border-amber-500/20">Late</span>
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 text-xs font-medium border border-rose-200 dark:border-rose-500/20">Absent</span>
                      )}
                    </td>
                  </tr>
                ))}
                {reportData.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      No attendance data found for this date range.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
        </div>
      </div>
    </div>
  )
}
