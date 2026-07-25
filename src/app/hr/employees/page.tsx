"use client"

import React, { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useAppContext, HREmployee } from "@/store/AppContext"
import { Search, Users, Plus, Edit, UserMinus, UserCheck, Trash2, UserCircle, LayoutGrid, List, Eye } from "lucide-react"
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
      <div className="relative flex flex-col gap-5 font-sans max-w-[1200px] mx-auto w-full pb-10 min-h-screen overflow-x-hidden px-4 md:px-0">
        
        {/* Decorative Background Elements for Glassmorphism */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-gradient-to-br from-[#ff5a36]/20 to-purple-500/20 rounded-full blur-[100px] pointer-events-none -z-10" />
        <div className="absolute bottom-[10%] right-[-10%] w-[40%] h-[40%] bg-gradient-to-br from-blue-500/20 to-emerald-500/20 rounded-full blur-[120px] pointer-events-none -z-10" />
        <div className="absolute top-[30%] left-[30%] w-[30%] h-[30%] bg-gradient-to-tr from-amber-400/20 to-[#ff5a36]/20 rounded-full blur-[100px] pointer-events-none -z-10" />

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-gradient-to-br from-white/90 to-white/50 dark:from-slate-900/60 dark:to-slate-900/20 p-6 rounded-[1.5rem] border border-white/60 dark:border-slate-700/50 shadow-2xl shadow-[#ff5a36]/5 backdrop-blur-2xl relative overflow-hidden group transition-all duration-500 hover:shadow-[#ff5a36]/10">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full duration-1000 transition-transform pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-1">
              <div className="bg-[#ff5a36]/10 dark:bg-[#ff5a36]/20 p-2 rounded-xl text-[#ff5a36]">
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
          <Card className="rounded-[1.5rem] p-0 bg-white/70 dark:bg-slate-900/40 backdrop-blur-2xl border border-slate-200/30 dark:border-slate-700/50 shadow-xl shadow-slate-200/20 dark:shadow-black/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-white/30 dark:bg-slate-800/30 backdrop-blur-md border-b border-slate-200/70 dark:border-slate-700/50">
                  <tr className="text-slate-500 font-medium text-xs uppercase tracking-wider">
                    <th className="py-4 px-6 font-bold">Employee</th>
                    <th className="py-4 px-6 font-bold">Role</th>
                    <th className="py-4 px-6 font-bold">Type</th>
                    <th className="py-4 px-6 font-bold">Joined</th>
                    <th className="py-4 px-6 font-bold text-center">Status</th>
                    <th className="py-4 px-6 text-right font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user, i) => {
                    const isLast = i === filteredUsers.length - 1
                    const isActive = user.status === "Active"

                    return (
                      <tr key={user.id} className={`group hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors ${!isLast ? 'border-b border-white/30 dark:border-slate-700/30' : ''}`}>
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
                              <span className="text-[10px] text-slate-400 font-mono" title={user.id}>{user.email || user.id.substring(0,8) + "..."}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-6">
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            {user.job_title || "Unassigned"}
                          </span>
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
                        <td className="py-3 px-6">
                          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                            {user.joining_date ? new Date(user.joining_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                          </span>
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
                          <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            {(user.employment_type === "Training" || user.employment_type === "Probation") && (
                              <button 
                                onClick={() => handleMakePermanent(user)}
                                className="px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-amber-500 hover:text-amber-600 hover:scale-105 hover:-translate-y-0.5 transform transition-all duration-200 bg-transparent"
                                title="Make Permanent"
                              >
                                Make Permanent
                              </button>
                            )}
                            <button 
                              onClick={() => handleSeeDetails(user)}
                              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:scale-110 hover:-translate-y-0.5 transform transition-all duration-200 bg-transparent"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <Link href={`/hr/employees/${user.id}/edit`}>
                                <button 
                                  className="p-1 text-blue-500 hover:text-blue-600 hover:scale-110 hover:-translate-y-0.5 transform transition-all duration-200 bg-transparent"
                                  title="Edit Employee"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                            </Link>
                            <button 
                              onClick={() => handleDelete(user)}
                              className="p-1 text-rose-500 hover:text-rose-600 hover:scale-110 hover:-translate-y-0.5 transform transition-all duration-200 bg-transparent"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredUsers.map((user) => {
              const isActive = user.status === "Active"
              const avatarUrlToUse = user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || 'Employee')}&background=random&color=fff&size=400`
              
              return (
                <div 
                  key={user.id} 
                  className="group relative rounded-[1.5rem] bg-white/70 dark:bg-slate-900/40 backdrop-blur-2xl border border-slate-200/30 dark:border-slate-700/50 p-6 flex flex-col transition-all hover:bg-white/90 dark:hover:bg-slate-800/60 hover:-translate-y-1 hover:shadow-2xl shadow-xl shadow-slate-200/20 dark:shadow-black/20 duration-300"
                >
                  {/* Top Right Action Buttons */}
                  <div className="absolute top-4 right-4 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleSeeDetails(user)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:scale-110 transition-all duration-200"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <Link href={`/hr/employees/${user.id}/edit`}>
                      <button 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:scale-110 transition-all duration-200"
                        title="Edit Employee"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </Link>
                    <button 
                      onClick={() => handleDelete(user)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:scale-110 transition-all duration-200"
                      title="Delete Employee"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Avatar */}
                  <img 
                      src={avatarUrlToUse} 
                      alt={user.full_name} 
                      className="w-12 h-12 rounded-full object-cover shadow-sm bg-slate-100"
                  />

                  {/* Name & Title */}
                  <div className="mt-4 mb-6">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight leading-tight">
                      {user.full_name}
                    </h3>
                    <p className="text-[11px] font-medium text-slate-400 mt-1">
                      {user.job_title || "Unassigned"} • {user.employment_type || "Full-Time"}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 mt-1">
                      Joined: {user.joining_date ? new Date(user.joining_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                    </p>
                  </div>

                  {/* Bottom Columns */}
                  <div className="flex items-end justify-between gap-2 mt-auto">
                    {/* Salary (Mapped to Source) */}
                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] font-extrabold text-[#ff5a36] uppercase tracking-wider">Salary</span>
                      <div className="flex flex-col gap-1">
                        <span className="text-[12px] font-bold text-slate-600 dark:text-slate-300 tracking-wide">
                          PKR {Number(user.base_salary).toLocaleString()}
                        </span>
                        {Number(user.commission_per_sale) > 0 && (
                          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 tracking-wide">
                            +PKR {user.commission_per_sale}/s
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status Indicator */}
                    <div className="flex flex-col gap-2 items-end">
                      <span className={`text-[10px] font-bold flex items-center gap-1.5 ${isActive ? "text-emerald-500 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"}`}>
                        {isActive ? <UserCheck className="w-3.5 h-3.5" /> : <UserMinus className="w-3.5 h-3.5" />}
                        {isActive ? "Active" : "Disabled"}
                      </span>
                      <div className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-full flex gap-1 items-center">
                        <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-rose-400' : 'bg-slate-300 dark:bg-slate-600'}`} />
                        <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-orange-400' : 'bg-slate-300 dark:bg-slate-600'}`} />
                        <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-amber-400' : 'bg-slate-300 dark:bg-slate-600'}`} />
                        <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-slate-300 dark:bg-slate-600'}`} />
                        <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-slate-300 dark:bg-slate-600'}`} />
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
