"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card } from "@/components/ui/card"
import { useAppContext } from "@/store/AppContext"
import { Building2, Search, FileText } from "lucide-react"
import { useState, useMemo } from "react"
import { HRSalaryRecord } from "@/store/AppContext"

export default function SalaryRecordsPage() {
  const { hrSalaryRecords, hrEmployees, tenants, currentUser, isLoaded, formatCurrency } = useAppContext()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMonth, setSelectedMonth] = useState('All')

  const orgName = useMemo(() => {
    if (!currentUser) return 'Organization'
    const org = tenants.find(t => t.id === currentUser.tenantId)
    return org ? org.name : 'Organization'
  }, [currentUser, tenants])

  // Get distinct months from records
  const uniqueMonths = useMemo(() => {
    const months = new Set<string>()
    hrSalaryRecords.forEach(r => months.add(r.month))
    return Array.from(months).sort().reverse() // Newest first
  }, [hrSalaryRecords])

  const filteredRecords = useMemo(() => {
    return hrSalaryRecords.filter(record => {
      const employee = hrEmployees.find(e => e.id === record.employee_id)
      
      const matchesSearch = employee 
        ? employee.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
          (employee.cnic_number && employee.cnic_number.includes(searchQuery))
        : false;

      const matchesMonth = selectedMonth === 'All' || record.month === selectedMonth;

      return matchesSearch && matchesMonth;
    }).sort((a, b) => b.month.localeCompare(a.month))
  }, [hrSalaryRecords, hrEmployees, searchQuery, selectedMonth])

  // Group by month for display
  const groupedRecords = useMemo(() => {
    const groups: Record<string, HRSalaryRecord[]> = {}
    filteredRecords.forEach(record => {
      if (!groups[record.month]) groups[record.month] = []
      groups[record.month].push(record)
    })
    return groups
  }, [filteredRecords])

  if (!isLoaded) {
    return (
      <DashboardLayout>
        <div className="flex h-screen items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
              <FileText className="w-8 h-8 text-indigo-500" />
              Salary Records History
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
              View previously saved salary data for {orgName}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search employee..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 h-9 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-slate-800 dark:text-white shadow-sm w-48 md:w-64"
              />
            </div>
            
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="h-9 px-4 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-slate-800 dark:text-white shadow-sm"
            >
              <option value="All">All Months</option>
              {uniqueMonths.map(month => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
          </div>
        </div>

        {Object.keys(groupedRecords).length === 0 ? (
          <Card className="p-12 text-center border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-3xl">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
              <FileText className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">No Records Found</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              {hrSalaryRecords.length === 0 
                ? "No salary records have been saved yet. Generate slips and click 'Save Records' to build history."
                : "No saved records match your search criteria."}
            </p>
          </Card>
        ) : (
          Object.entries(groupedRecords).map(([month, records]) => {
            const totalNet = records.reduce((sum, r) => sum + r.net_salary, 0);

            return (
              <Card key={month} className="overflow-hidden border-slate-200 dark:border-slate-800 shadow-sm rounded-3xl">
                <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
                  <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-indigo-500" /> {month}
                  </h3>
                  <div className="text-sm font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1 rounded-full">
                    Total: PKR {formatCurrency(totalNet)}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                    <thead className="text-xs uppercase bg-slate-50/50 dark:bg-slate-800/20 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                      <tr>
                        <th className="px-6 py-3 font-bold">Employee Name</th>
                        <th className="px-6 py-3 font-bold">Base Salary</th>
                        <th className="px-6 py-3 font-bold">Commissions</th>
                        <th className="px-6 py-3 font-bold text-rose-500">Deductions</th>
                        <th className="px-6 py-3 font-bold text-right text-emerald-500">Net Salary</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {records.map(record => {
                        const employee = hrEmployees.find(e => e.id === record.employee_id)
                        const totalDeductions = record.absence_deduction + record.loan_deduction
                        
                        return (
                          <tr key={record.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="px-6 py-3 font-medium text-slate-900 dark:text-white">
                              {employee?.full_name || 'Unknown Employee'}
                            </td>
                            <td className="px-6 py-3">PKR {formatCurrency(record.base_salary)}</td>
                            <td className="px-6 py-3 text-emerald-500">+PKR {formatCurrency(record.commission_earned)}</td>
                            <td className="px-6 py-3 text-rose-500">-PKR {formatCurrency(totalDeductions)}</td>
                            <td className="px-6 py-3 text-right font-bold text-slate-900 dark:text-white">
                              PKR {formatCurrency(record.net_salary)}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            )
          })
        )}
      </div>
    </DashboardLayout>
  )
}
