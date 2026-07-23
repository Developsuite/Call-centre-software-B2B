"use client"

import React, { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useAppContext, HREmployee } from "@/store/AppContext"
import { Search, Users, Plus, Edit, UserMinus, UserCheck, Trash2, UserCircle } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function HREmployeesPage() {
  const { hrEmployees, currentUser, isLoaded, updateHREmployee, deleteHREmployee } = useAppContext()
  const [searchQuery, setSearchQuery] = useState("")

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

        <Card className="rounded-[1.5rem] p-0 bg-white dark:bg-card border-none shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-900/50">
                <tr className="text-slate-500 font-medium border-b border-slate-100 dark:border-slate-800 text-xs uppercase tracking-wider">
                  <th className="py-4 px-6 font-bold">Employee</th>
                  <th className="py-4 px-6 font-bold">Role</th>
                  <th className="py-4 px-6 font-bold">Team</th>
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
                            <span className="text-[10px] text-slate-400 font-mono" title={user.id}>{user.job_title || user.role} • {user.email || user.id.substring(0,8) + "..."}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-6">
                        <span className="bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 px-2.5 py-1 rounded-md text-xs font-bold">
                          {user.role}
                        </span>
                        {user.employment_type && (
                            <span className="ml-2 text-[10px] text-slate-500">{user.employment_type}</span>
                        )}
                      </td>
                      <td className="py-3 px-6 text-slate-500 font-medium">
                        {user.team ? (
                          <span className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md text-xs">{user.team}</span>
                        ) : (
                          <span className="text-slate-400 italic text-xs">Unassigned</span>
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
                    <td colSpan={5} className="py-10 text-center text-slate-500">
                      No employees found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>


    </DashboardLayout>
  )
}
