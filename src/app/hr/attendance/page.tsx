"use client"

import React, { useState, useMemo } from 'react'
import { useAppContext } from "@/store/AppContext"
import { TopBar } from "@/components/layout/topbar"
import { Sidebar } from "@/components/layout/sidebar"
import { Users, Clock, CalendarDays, CheckCircle, XCircle, AlertCircle, RefreshCw, Link as LinkIcon } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

export default function AttendancePage() {
  const { hrAttendance, hrEmployees, updateHREmployee, currentUser, isLoaded, fetchHRAttendance } = useAppContext()
  
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [mappingId, setMappingId] = useState<string | null>(null)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("")
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Map attendance logs to employees
  const processedData = useMemo(() => {
    // 1. Group punches by ZK User ID for the selected date
    const dailyPunches = hrAttendance.filter(att => {
      // Use date-fns format to get local date instead of UTC
      const punchDate = format(new Date(att.timestamp), 'yyyy-MM-dd');
      return punchDate === selectedDate;
    });

    const grouped: Record<string, any[]> = {};
    dailyPunches.forEach(punch => {
      if (!grouped[punch.zk_user_id]) grouped[punch.zk_user_id] = [];
      grouped[punch.zk_user_id].push(punch);
    });

    // 2. Build rows combining Employee data and Punch data
    const rows = [];
    for (const [zkId, punches] of Object.entries(grouped)) {
      // Find matching employee by zk_user_id
      const employee = hrEmployees.find(e => e.zk_user_id === zkId);
      
      // Sort punches chronologically
      punches.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      
      const firstPunch = punches[0];
      const lastPunch = punches[punches.length - 1];
      
      // Calculate work hours if they checked in and out
      let workedHours = "-";
      if (punches.length > 1) {
        const diffMs = new Date(lastPunch.timestamp).getTime() - new Date(firstPunch.timestamp).getTime();
        const hrs = Math.floor(diffMs / (1000 * 60 * 60));
        const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        workedHours = `${hrs}h ${mins}m`;
      }

      // Late calculation (Assuming 09:15 AM is late threshold for now)
      const firstPunchDate = new Date(firstPunch.timestamp);
      const isLate = firstPunchDate.getHours() > 9 || (firstPunchDate.getHours() === 9 && firstPunchDate.getMinutes() > 15);

      rows.push({
        zk_user_id: zkId,
        employee: employee,
        firstPunch: firstPunch.timestamp,
        lastPunch: punches.length > 1 ? lastPunch.timestamp : null,
        totalPunches: punches.length,
        workedHours,
        status: isLate ? 'Late' : 'On Time'
      });
    }

    // Sort by Late first, then on time
    return rows.sort((a, b) => a.status === 'Late' ? -1 : 1);
  }, [hrAttendance, hrEmployees, selectedDate]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchHRAttendance();
    toast.success("Attendance logs synchronized!");
    setIsRefreshing(false);
  }

  const handleSaveMapping = async () => {
    if (!mappingId || !selectedEmployeeId) {
      toast.error("Please select an employee to map.");
      return;
    }
    
    try {
      await updateHREmployee(selectedEmployeeId, { zk_user_id: mappingId });
      setMappingId(null);
      setSelectedEmployeeId("");
    } catch (e) {
      // error handled in context
    }
  }

  if (!isLoaded) return <div className="flex h-screen items-center justify-center bg-gray-900 text-white">Loading HR Systems...</div>

  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden selection:bg-indigo-500/30">
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800">
        <TopBar title="Attendance Dashboard" />
        
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar">
          
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-800/40 p-6 rounded-2xl border border-gray-700/50 backdrop-blur-sm">
              <div>
                <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Daily Attendance</h1>
                <p className="text-gray-400 text-sm mt-1">Monitor real-time machine fingerprints and check-ins.</p>
              </div>
              
              <div className="flex items-center gap-3">
                <input 
                  type="date" 
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
                <button 
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Sync Latest
                </button>
              </div>
            </div>

            {/* Attendance Table */}
            <div className="bg-gray-800/40 border border-gray-700/50 rounded-2xl overflow-hidden backdrop-blur-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-800/80 border-b border-gray-700/50 text-gray-400 text-xs uppercase tracking-wider">
                      <th className="px-6 py-4 font-medium">Employee</th>
                      <th className="px-6 py-4 font-medium">Check In</th>
                      <th className="px-6 py-4 font-medium">Check Out</th>
                      <th className="px-6 py-4 font-medium">Work Hours</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                      <th className="px-6 py-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/50">
                    {processedData.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                          <div className="flex flex-col items-center justify-center">
                            <CalendarDays className="w-12 h-12 text-gray-600 mb-3" />
                            <p className="text-lg font-medium text-gray-300">No punches found</p>
                            <p className="text-sm">There are no machine fingerprints recorded for {selectedDate}.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      processedData.map((row, idx) => (
                        <tr key={idx} className="hover:bg-gray-700/20 transition-colors group">
                          
                          {/* Employee Identity */}
                          <td className="px-6 py-4">
                            {row.employee ? (
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-lg">
                                  {row.employee.avatar_url ? (
                                    <img src={row.employee.avatar_url} className="w-full h-full rounded-full object-cover" />
                                  ) : (
                                    row.employee.full_name.charAt(0)
                                  )}
                                </div>
                                <div>
                                  <div className="font-semibold text-gray-100">{row.employee.full_name}</div>
                                  <div className="text-xs text-gray-400 flex items-center gap-1">
                                    Machine ID: {row.zk_user_id}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-gray-400">
                                  ?
                                </div>
                                <div>
                                  <div className="font-semibold text-rose-400 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" /> Unknown User
                                  </div>
                                  <div className="text-xs text-gray-400">
                                    Machine ID: {row.zk_user_id}
                                  </div>
                                </div>
                              </div>
                            )}
                          </td>

                          {/* Check In */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-emerald-400 font-medium">
                              <CheckCircle className="w-4 h-4" />
                              {format(new Date(row.firstPunch), 'hh:mm a')}
                            </div>
                          </td>

                          {/* Check Out */}
                          <td className="px-6 py-4">
                            {row.lastPunch ? (
                               <div className="flex items-center gap-2 text-rose-400 font-medium">
                               <XCircle className="w-4 h-4" />
                               {format(new Date(row.lastPunch), 'hh:mm a')}
                             </div>
                            ) : (
                              <span className="text-gray-500 text-sm italic">Missing</span>
                            )}
                          </td>

                          {/* Work Hours */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-gray-300">
                              <Clock className="w-4 h-4 text-gray-500" />
                              {row.workedHours}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-6 py-4">
                            {row.status === 'On Time' ? (
                              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20">
                                On Time
                              </span>
                            ) : (
                              <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-medium border border-amber-500/20">
                                Late
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4 text-right">
                            {!row.employee && mappingId !== row.zk_user_id && (
                              <button 
                                onClick={() => setMappingId(row.zk_user_id)}
                                className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors text-sm ml-auto bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20"
                              >
                                <LinkIcon className="w-4 h-4" /> Link Profile
                              </button>
                            )}
                            
                            {mappingId === row.zk_user_id && (
                              <div className="flex items-center gap-2 justify-end">
                                <select 
                                  value={selectedEmployeeId}
                                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                                  className="bg-gray-800 border border-gray-600 rounded-lg px-2 py-1.5 text-sm max-w-[150px] outline-none"
                                >
                                  <option value="">Select Employee...</option>
                                  {hrEmployees.filter(e => !e.zk_user_id).map(emp => (
                                    <option key={emp.id} value={emp.id}>{emp.full_name}</option>
                                  ))}
                                </select>
                                <button 
                                  onClick={handleSaveMapping}
                                  className="bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
                                >
                                  Save
                                </button>
                                <button 
                                  onClick={() => setMappingId(null)}
                                  className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            )}
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
    </div>
  )
}
