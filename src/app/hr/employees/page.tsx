"use client"

import React, { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useAppContext, HREmployee } from "@/store/AppContext"
import { Search, Users, Plus, Edit, UserMinus, UserCheck, Trash2, UserCircle, LayoutGrid, List } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { EmployeeDetailsModal } from "@/components/hr/EmployeeDetailsModal"

export default function HREmployeesPage() {
  const { hrEmployees, currentUser, isLoaded, updateHREmployee, deleteHREmployee } = useAppContext()
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"list" | "card">("list")
  
  const [selectedEmployee, setSelectedEmployee] = useState<HREmployee | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleSeeDetails = (employee: HREmployee) => {
    setSelectedEmployee(employee)
    setIsModalOpen(true)
  }

  if (!isLoaded || !currentUser) {
    return (
      <DashboardLayout title="Employee Management">
        <div className="flex items-center justify-center h-[50vh]">
          <div className="w-6 h-6 border-2 border-[#ff5a36] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    )
  }

  // Isolate to current org
  const tenantUsers = currentUser.role === "SuperAdmin" 
    ? hrEmployees 
    : hrEmployees.filter(u => u.organization_id === currentUser.tenantId)

  const filteredUsers = tenantUsers.filter(u => 
    u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.team && u.team.toLowerCase().includes(searchQuery.toLowerCase()))
  ).sort((a, b) => a.full_name.localeCompare(b.full_name))



  const handleToggleStatus = async (employee: HREmployee) => {
    const newStatus = employee.status === "Active" ? "Disabled" : "Active"
    try {
      await updateHREmployee(employee.id, { status: newStatus })
      toast.success(`${employee.full_name} is now ${newStatus}`)
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleDelete = async (employee: HREmployee) => {
    if (confirm(`Are you sure you want to completely delete ${employee.full_name}? This action cannot be undone.`)) {
      try {
        await deleteHREmployee(employee.id)
      } catch (error) {
        // Error handled in context
      }
    }
  }

  const handleMakePermanent = async (employee: HREmployee) => {
    if (confirm(`Are you sure you want to make ${employee.full_name} a Permanent employee? This will set their joining date to today.`)) {
      try {
        await updateHREmployee(employee.id, { 
          employment_type: "Full-Time",
          probation_end_date: null as any,
          joining_date: new Date().toISOString().split('T')[0]
        })
        toast.success(`${employee.full_name} is now Permanent!`)
      } catch (error: any) {
        toast.error(error.message)
      }
    }
  }

  return (
    <DashboardLayout title="Employee Management">
      <div className="flex flex-col gap-6 font-sans max-w-[1200px] mx-auto w-full pb-10">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white/50 dark:bg-card/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-md">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-xl text-slate-500">
                <Users className="w-5 h-5" />
              </div>
              <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Employees</h1>
            </div>
            <p className="text-slate-500 text-sm">Add, update, disable or remove employee accounts.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input 
                type="text" 
                placeholder="Search employees..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-full h-9 text-sm w-full sm:w-64 shadow-sm focus-visible:ring-1 focus-visible:ring-[#ff5a36]" 
              />
            </div>
            
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-full">
              <button 
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-full transition-all ${viewMode === "list" ? "bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
              >
                <List className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode("card")}
                className={`p-1.5 rounded-full transition-all ${viewMode === "card" ? "bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            <Link href="/hr/employees/new" className="w-full sm:w-auto">
              <Button 
                className="bg-[#ff5a36] hover:bg-[#e04a29] text-white rounded-full h-9 px-4 shadow-[0_4px_10px_rgba(255,90,54,0.3)] w-full transition-all"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Employee
              </Button>
            </Link>
          </div>
        </div>

        {viewMode === "list" ? (
          <Card className="rounded-[1.5rem] p-0 bg-white dark:bg-card border-none shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/50">
                  <tr className="text-slate-500 font-medium border-b border-slate-100 dark:border-slate-800 text-xs uppercase tracking-wider">
                    <th className="py-4 px-6 font-bold">Employee</th>
                    <th className="py-4 px-6 font-bold">Role</th>
                    <th className="py-4 px-6 font-bold text-center">Status</th>
                    <th className="py-4 px-6 text-right font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user, i) => {
                    const isLast = i === filteredUsers.length - 1
                    const isActive = user.status === "Active"

                    return (
                      <tr key={user.id} className={`group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors ${!isLast ? 'border-b border-slate-50 dark:border-slate-800/50' : ''}`}>
                        <td className="py-3 px-6">
                          <div className="flex items-center gap-3">
                            {user.avatar_url ? (
                                <img src={user.avatar_url} alt="Avatar" className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
                            ) : (
                                <UserCircle className="w-8 h-8 text-slate-300" />
                            )}
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                {user.full_name}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono" title={user.id}>{user.job_title || "Unassigned"} • {user.email || user.id.substring(0,8) + "..."}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-6">
                          {user.employment_type && (
                              <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                                user.employment_type === "Training" || user.employment_type === "Probation" 
                                  ? "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
                                  : "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400"
                              }`}>
                                  {user.employment_type}
                              </span>
                          )}
                        </td>
                        <td className="py-3 px-6 text-center">
                          <button 
                            onClick={() => handleToggleStatus(user)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-colors ${
                              isActive 
                                ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20" 
                                : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                            }`}
                          >
                            {isActive ? <UserCheck className="w-3 h-3" /> : <UserMinus className="w-3 h-3" />}
                            {isActive ? "Active" : "Disabled"}
                          </button>
                        </td>
                        <td className="py-3 px-6 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {(user.employment_type === "Training" || user.employment_type === "Probation") && (
                              <button 
                                onClick={() => handleMakePermanent(user)}
                                className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-600 hover:text-white bg-amber-50 hover:bg-amber-500 dark:bg-amber-500/10 dark:text-amber-400 dark:hover:bg-amber-500 dark:hover:text-white rounded-lg transition-colors shadow-sm dark:shadow-none"
                                title="Make Permanent"
                              >
                                Make Permanent
                              </button>
                            )}
                            <Link href={`/hr/employees/${user.id}/edit`}>
                                <button 
                                  className="p-1.5 text-slate-400 hover:text-blue-500 bg-white dark:bg-transparent hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors shadow-sm dark:shadow-none"
                                  title="Edit Employee"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                            </Link>
                            <button 
                              onClick={() => handleDelete(user)}
                              className="p-1.5 text-slate-400 hover:text-red-500 bg-white dark:bg-transparent hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors shadow-sm dark:shadow-none"
                              title="Delete Employee"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-10 text-center text-slate-500">
                        No employees found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map((user) => {
              const isActive = user.status === "Active"
              const avatarUrlToUse = user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || 'Employee')}&background=random&color=fff&size=400`
              
              return (
                <div 
                  key={user.id} 
                  className="group relative rounded-[2rem] bg-white dark:bg-[#111111] border border-slate-200 dark:border-slate-800/80 overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1 flex flex-col"
                >
                  {/* Abstract Gradient Header */}
                  <div className="h-28 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-[#ff5a36] relative overflow-hidden">
                    <div className="absolute inset-0 bg-black/20" />
                    <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-[#111111] to-transparent opacity-90" />
                    
                    <div className="absolute top-4 right-4 z-10">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wide backdrop-blur-md border ${
                        isActive 
                          ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' 
                          : 'bg-slate-500/20 text-slate-700 dark:text-slate-300 border-slate-500/30'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
                        {isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  <div className="p-6 pt-0 flex flex-col flex-1 relative">
                    {/* Floating Avatar */}
                    <div className="relative -mt-12 mb-4 inline-block w-fit">
                      <img 
                          src={avatarUrlToUse} 
                          alt={user.full_name} 
                          className="w-24 h-24 object-cover rounded-[1.5rem] shadow-xl border-4 border-white dark:border-[#111111] bg-white dark:bg-[#111111] transition-transform duration-500 group-hover:scale-105 group-hover:rotate-3"
                      />
                    </div>

                    {/* Identity */}
                    <div className="flex flex-col">
                      <h3 className="font-bold text-slate-800 dark:text-white text-xl leading-tight truncate tracking-tight">{user.full_name}</h3>
                      <p className="text-sm font-medium text-[#ff5a36] mt-1 line-clamp-1">{user.job_title || "Unassigned Role"}</p>
                    </div>

                    {/* Badges */}
                    <div className="flex items-center gap-2 mt-4 flex-wrap">
                      <span className="flex items-center gap-1 bg-amber-50 dark:bg-amber-500/10 px-2 py-1 rounded-md">
                        <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-xs text-amber-700 dark:text-amber-400 font-bold">5.0</span>
                      </span>
                      <span className="text-xs text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-1 rounded-md font-bold">
                        {user.employment_type || "Full-Time"}
                      </span>
                    </div>

                    {/* Financials Block */}
                    <div className="mt-5 bg-slate-50 dark:bg-white/5 rounded-2xl p-4 border border-slate-100 dark:border-white/5 flex flex-col gap-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Base Salary</span>
                      <div className="flex items-end justify-between">
                        <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                          <span className="text-sm font-bold text-slate-500 dark:text-slate-400 mr-1">PKR</span>
                          {Number(user.base_salary).toLocaleString()}
                        </span>
                        {Number(user.commission_per_sale) > 0 && (
                            <span className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-200 dark:border-emerald-500/20 shadow-sm">
                                +{user.commission_per_sale}/sale
                            </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 mt-auto pt-6">
                      <button 
                        onClick={() => handleSeeDetails(user)}
                        className="flex-1 py-3 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-xl text-sm font-bold transition-all shadow-md hover:shadow-xl hover:-translate-y-0.5"
                      >
                        View Profile
                      </button>
                      
                      <div className="flex gap-2">
                        <Link href={`/hr/employees/${user.id}/edit`}>
                          <button 
                            className="w-12 h-full flex items-center justify-center bg-white dark:bg-[#1a1a1a] border-2 border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl transition-all"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </Link>
                        {(user.employment_type === "Training" || user.employment_type === "Probation") && (
                          <button 
                              onClick={() => handleMakePermanent(user)}
                              className="w-12 h-full flex items-center justify-center bg-white dark:bg-[#1a1a1a] border-2 border-amber-200 dark:border-amber-900 hover:border-amber-500 dark:hover:border-amber-500 text-amber-500 rounded-xl transition-all"
                              title="Make Permanent"
                          >
                              <UserCheck className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
            {filteredUsers.length === 0 && (
                <div className="col-span-full py-20 text-center text-slate-500">
                    No employees found matching your search.
                </div>
            )}
          </div>
        )}
      </div>

      <EmployeeDetailsModal 
        employee={selectedEmployee} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />

    </DashboardLayout>
  )
}
