"use client"

import React, { useState, useMemo } from 'react'
import { useAppContext } from "@/store/AppContext"
import { TopBar } from "@/components/layout/topbar"
import { Sidebar } from "@/components/layout/sidebar"
import { Users, Clock, CalendarDays, CheckCircle, XCircle, AlertCircle, RefreshCw, Link as LinkIcon, Upload } from 'lucide-react'
import { createClient } from "@/utils/supabase/client"
import { toast } from 'sonner'
import { format } from 'date-fns'
import Link from 'next/link'

import { EmployeeAttendanceModal } from "@/components/hr/EmployeeAttendanceModal"

export default function AttendancePage() {
  const { hrAttendance, hrEmployees, updateHREmployee, currentUser, isLoaded, fetchHRAttendance } = useAppContext()
  
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [mappingId, setMappingId] = useState<string | null>(null)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("")
  const [selectedDetailEmployee, setSelectedDetailEmployee] = useState<any>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [deviceIp, setDeviceIp] = useState("192.168.18.215")
  const supabase = createClient()
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Map attendance logs to employees
  const processedData = useMemo(() => {
    // 1. Define Night Shift Window (18:00 to 09:00 next day)
    const shiftStart = new Date(`${selectedDate}T18:00:00`);
    const shiftEnd = new Date(shiftStart.getTime() + 15 * 60 * 60 * 1000); // +15 hours = 09:00 next day
    
    // 2. Filter punches for this window
    const shiftPunches = hrAttendance.filter(att => {
      const punchDate = new Date(att.timestamp);
      return punchDate >= shiftStart && punchDate <= shiftEnd;
    });

    const grouped: Record<string, any[]> = {};
    shiftPunches.forEach(punch => {
      if (!grouped[punch.zk_user_id]) grouped[punch.zk_user_id] = [];
      grouped[punch.zk_user_id].push(punch);
    });

    // 3. Build rows for ALL known employees (Present or Absent)
    const rows: any[] = [];
    const processedZkIds = new Set<string>();

    hrEmployees.forEach(employee => {
      const zkId = employee.zk_user_id;
      const punches = zkId && grouped[zkId] ? grouped[zkId] : [];
      
      if (zkId) processedZkIds.add(zkId);
      
      if (punches.length === 0) {
        // Absent
        rows.push({
          zk_user_id: zkId || null,
          employee: employee,
          firstPunch: null,
          lastPunch: null,
          totalPunches: 0,
          workedHours: "-",
          status: 'Absent'
        });
      } else {
        // Present / Late
        punches.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        const firstPunch = punches[0];
        const lastPunch = punches[punches.length - 1];
        
        let workedHours = "-";
        if (punches.length > 1) {
          const diffMs = new Date(lastPunch.timestamp).getTime() - new Date(firstPunch.timestamp).getTime();
          const hrs = Math.floor(diffMs / (1000 * 60 * 60));
          const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
          workedHours = `${hrs}h ${mins}m`;
        }
        
        // Late logic: Night shift check-in is 20:00, grace 10 min -> 20:10
        const firstPunchDate = new Date(firstPunch.timestamp);
        const lateThreshold = new Date(shiftStart.getTime() + 2 * 60 * 60 * 1000 + 10 * 60 * 1000); // 18:00 + 2h 10m = 20:10
        const isLate = firstPunchDate > lateThreshold;
        
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
    });

    // 4. Add any unmapped ZK IDs (Unknown Users)
    for (const [zkId, punches] of Object.entries(grouped)) {
      if (!processedZkIds.has(zkId)) {
        punches.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        const firstPunch = punches[0];
        const lastPunch = punches[punches.length - 1];
        
        let workedHours = "-";
        if (punches.length > 1) {
          const diffMs = new Date(lastPunch.timestamp).getTime() - new Date(firstPunch.timestamp).getTime();
          const hrs = Math.floor(diffMs / (1000 * 60 * 60));
          const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
          workedHours = `${hrs}h ${mins}m`;
        }
        
        const firstPunchDate = new Date(firstPunch.timestamp);
        const lateThreshold = new Date(shiftStart.getTime() + 2 * 60 * 60 * 1000 + 10 * 60 * 1000); 
        const isLate = firstPunchDate > lateThreshold;

        rows.push({
          zk_user_id: zkId,
          employee: null,
          firstPunch: firstPunch.timestamp,
          lastPunch: punches.length > 1 ? lastPunch.timestamp : null,
          totalPunches: punches.length,
          workedHours,
          status: isLate ? 'Late' : 'On Time'
        });
      }
    }

    // 5. Sort: Late first, then On Time, then Absent
    return rows.sort((a, b) => {
      if (a.status === b.status) return 0;
      if (a.status === 'Absent') return 1;
      if (b.status === 'Absent') return -1;
      if (a.status === 'Late') return -1;
      if (b.status === 'Late') return 1;
      return 0;
    });
  }, [hrAttendance, hrEmployees, selectedDate]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (!currentUser?.organization_id) {
        throw new Error("Organization ID not found");
      }
      
      const res = await fetch('/api/attendance/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organization_id: currentUser.organization_id })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to sync device");
      }
      
      await fetchHRAttendance();
      toast.success(data.message || "Attendance logs synchronized!");
    } catch (error: any) {
      toast.error(error.message || "An error occurred during sync");
    } finally {
      setIsRefreshing(false);
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        if (!currentUser?.organization_id) throw new Error("Organization ID not found")
        
        const csvData = event.target?.result as string
        const lines = csvData.split('\n')
        const recordsToInsert = []
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim()
          if (!line) continue
          
          const cols = line.split(',')
          if (cols.length < 5) continue
          
          const empId = cols[0].trim()
          // Check if it's a valid ID and skip header rows
          if (isNaN(Number(empId)) || empId === "") continue 
          
          const timeStr = cols[3].trim()
          const dateStr = cols[4].trim()
          
          const punchDate = new Date(`${dateStr} ${timeStr}`)
          if (isNaN(punchDate.getTime())) continue
          
          recordsToInsert.push({
            organization_id: currentUser.organization_id,
            zk_user_id: empId,
            timestamp: punchDate.toISOString(),
            status: 0,
            verify_mode: 0
          })
        }
        
        if (recordsToInsert.length === 0) {
          toast.error("No valid records found in CSV")
          return
        }
        
        setIsRefreshing(true)
        
        for (let i = 0; i < recordsToInsert.length; i += 1000) {
          const chunk = recordsToInsert.slice(i, i + 1000)
          const { error } = await supabase
            .from('hr_attendance')
            .upsert(chunk, { 
              onConflict: 'organization_id,zk_user_id,timestamp',
              ignoreDuplicates: true
            })
            
          if (error) throw error
        }
        
        toast.success(`Successfully imported ${recordsToInsert.length} records!`)
        await fetchHRAttendance()
        
      } catch (err: any) {
        toast.error(err.message || "Failed to process CSV")
      } finally {
        setIsRefreshing(false)
        if (fileInputRef.current) fileInputRef.current.value = ""
      }
    }
    
    reader.readAsText(file)
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

  if (!isLoaded) return <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-gray-900 text-slate-800 dark:text-white">Loading HR Systems...</div>

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-gray-900 text-slate-800 dark:text-white overflow-hidden selection:bg-indigo-500/30">
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <TopBar title="Attendance Dashboard" />
        
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar">
          
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* Tabs */}
            <div className="flex space-x-1 bg-slate-200/50 dark:bg-gray-800 p-1 rounded-xl w-fit border border-slate-200 dark:border-gray-700/50">
              <Link href="/hr/attendance" className="px-6 py-2.5 rounded-lg text-sm font-medium bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm transition-all">
                Daily View
              </Link>
              <Link href="/hr/attendance/reports" className="px-6 py-2.5 rounded-lg text-sm font-medium text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-700/50 transition-all">
                Monthly Reports
              </Link>
            </div>
            
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-800/40 p-6 rounded-2xl border border-slate-200 dark:border-gray-700/50 shadow-sm dark:shadow-none backdrop-blur-sm">
              <div>
                <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-600 dark:from-indigo-400 dark:to-cyan-400">Daily Attendance</h1>
                <p className="text-slate-500 dark:text-gray-400 text-sm mt-1">Monitor real-time machine fingerprints and check-ins.</p>
              </div>
              
              <div className="flex items-center gap-3 flex-wrap">
                <input 
                  type="text" 
                  value={deviceIp}
                  onChange={(e) => setDeviceIp(e.target.value)}
                  placeholder="Device IP"
                  className="bg-white dark:bg-gray-800 border border-slate-300 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-800 dark:text-white w-36"
                  title="Biometric Device IP Address"
                />
                <input 
                  type="date" 
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-white dark:bg-gray-800 border border-slate-300 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-800 dark:text-white"
                />
                <button 
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Sync Latest
                </button>
                <input 
                  type="file" 
                  accept=".csv"
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isRefreshing}
                  className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-slate-300 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-700 text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  Upload CSV
                </button>
              </div>
            </div>

            {/* Attendance Table */}
            <div className="bg-white dark:bg-gray-800/40 border border-slate-200 dark:border-gray-700/50 rounded-2xl overflow-hidden shadow-sm dark:shadow-none backdrop-blur-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-gray-800/80 border-b border-slate-200 dark:border-gray-700/50 text-slate-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                      <th className="px-6 py-4 font-medium">Employee</th>
                      <th className="px-6 py-4 font-medium">Check In</th>
                      <th className="px-6 py-4 font-medium">Check Out</th>
                      <th className="px-6 py-4 font-medium">Work Hours</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                      <th className="px-6 py-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-gray-700/50">
                    {processedData.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-gray-400">
                          <div className="flex flex-col items-center justify-center">
                            <CalendarDays className="w-12 h-12 text-slate-300 dark:text-gray-600 mb-3" />
                            <p className="text-lg font-medium text-slate-700 dark:text-gray-300">No punches found</p>
                            <p className="text-sm">There are no machine fingerprints recorded for {selectedDate}.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      processedData.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-gray-700/20 transition-colors group">
                          
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
                                  <div className="font-semibold text-slate-800 dark:text-gray-100">{row.employee.full_name}</div>
                                  <div className="text-xs text-slate-500 dark:text-gray-400 flex items-center gap-1">
                                    Machine ID: {row.zk_user_id}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-gray-700 flex items-center justify-center text-slate-500 dark:text-gray-400">
                                  ?
                                </div>
                                <div>
                                  <div className="font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" /> Unknown User
                                  </div>
                                  <div className="text-xs text-slate-500 dark:text-gray-400">
                                    Machine ID: {row.zk_user_id}
                                  </div>
                                </div>
                              </div>
                            )}
                          </td>

                          {/* Check In */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
                              <CheckCircle className="w-4 h-4" />
                              {format(new Date(row.firstPunch), 'hh:mm a')}
                            </div>
                          </td>

                          {/* Check Out */}
                          <td className="px-6 py-4">
                            {row.lastPunch ? (
                               <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-medium">
                               <XCircle className="w-4 h-4" />
                               {format(new Date(row.lastPunch), 'hh:mm a')}
                             </div>
                            ) : (
                              <span className="text-slate-400 dark:text-gray-500 text-sm italic">Missing</span>
                            )}
                          </td>

                          {/* Work Hours */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-slate-700 dark:text-gray-300">
                              <Clock className="w-4 h-4 text-slate-400 dark:text-gray-500" />
                              {row.workedHours}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-6 py-4">
                            {row.status === 'On Time' ? (
                              <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-medium border border-emerald-200 dark:border-emerald-500/20">
                                Present
                              </span>
                            ) : row.status === 'Late' ? (
                              <span className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-medium border border-amber-200 dark:border-amber-500/20">
                                Late
                              </span>
                            ) : (
                              <span className="px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 text-xs font-medium border border-rose-200 dark:border-rose-500/20">
                                Absent
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4 text-right">
                            {!row.employee && mappingId !== row.zk_user_id && (
                              <button 
                                onClick={() => setMappingId(row.zk_user_id)}
                                className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors text-sm ml-auto bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-500/20"
                              >
                                <LinkIcon className="w-4 h-4" /> Link Profile
                              </button>
                            )}
                            
                            {mappingId === row.zk_user_id && (
                              <div className="flex items-center gap-2 justify-end">
                                <select 
                                  value={selectedEmployeeId}
                                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                                  className="bg-white dark:bg-gray-800 border border-slate-300 dark:border-gray-600 rounded-lg px-2 py-1.5 text-sm max-w-[150px] outline-none text-slate-800 dark:text-white"
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
                                  className="bg-slate-200 dark:bg-gray-700 hover:bg-slate-300 dark:hover:bg-gray-600 text-slate-800 dark:text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            )}

                            {row.employee && mappingId !== row.zk_user_id && (
                              <button 
                                onClick={() => setSelectedDetailEmployee(row.employee)}
                                className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-sm ml-auto bg-slate-100 dark:bg-gray-700 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-gray-600"
                              >
                                View Details
                              </button>
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

      {selectedDetailEmployee && (
        <EmployeeAttendanceModal 
          employee={selectedDetailEmployee} 
          onClose={() => setSelectedDetailEmployee(null)} 
        />
      )}
    </div>
  )
}
