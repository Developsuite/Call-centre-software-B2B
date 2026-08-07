"use client"

import React, { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useAppContext, HREmployee } from "@/store/AppContext"
import { Search, Users, Plus, Edit, UserMinus, UserCheck, Trash2, UserCircle, LayoutGrid, List, Eye, Filter, X, Briefcase, CheckCircle2, AlertCircle, Fingerprint, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { EmployeeDetailsModal } from "@/components/hr/EmployeeDetailsModal"

export default function HREmployeesPage() {
  const { hrEmployees, currentUser, isLoaded, updateHREmployee, deleteHREmployee, formatCurrency } = useAppContext()
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"list" | "card">("list")
  
  const [showFilters, setShowFilters] = useState(true)
  const [roleFilter, setRoleFilter] = useState("All")
  const [statusFilter, setStatusFilter] = useState("All")
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState("All")
  const [sortOption, setSortOption] = useState<string>("id_asc")

  const [selectedEmployee, setSelectedEmployee] = useState<HREmployee | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleSeeDetails = (employee: HREmployee) => {
    setSelectedEmployee(employee)
    setIsModalOpen(true)
  }

  const handleToggleColumnSort = (column: "id" | "joining" | "salary" | "name") => {
    if (column === "id") {
      setSortOption(prev => prev === "id_asc" ? "id_desc" : "id_asc")
    } else if (column === "joining") {
      setSortOption(prev => prev === "joining_desc" ? "joining_asc" : "joining_desc")
    } else if (column === "salary") {
      setSortOption(prev => prev === "salary_desc" ? "salary_asc" : "salary_desc")
    } else if (column === "name") {
      setSortOption(prev => prev === "name_asc" ? "name_desc" : "name_asc")
    }
  }

  // Auto-check and update probations
  useEffect(() => {
    if (!isLoaded || !currentUser) return
    
    const checkProbations = async () => {
      const today = new Date().toISOString().split('T')[0]
      const tenantUsers = currentUser.role === "SuperAdmin" 
        ? hrEmployees 
        : hrEmployees.filter(u => u.organization_id === currentUser.tenantId)
        
      for (const emp of tenantUsers) {
        if ((emp.employment_type === "Training" || emp.employment_type === "Probation") && 
            emp.probation_end_date && 
            emp.probation_end_date <= today) {
          try {
            await updateHREmployee(emp.id, { 
              employment_type: "Permanent", 
              probation_end_date: null as any 
            })
            toast.success(`🎉 ${emp.full_name}'s probation has ended. They are now a Permanent employee!`)
          } catch (err) {
            console.error("Failed to auto-update probation", err)
          }
        }
      }
    }
    
    checkProbations()
  }, [isLoaded]) // Intentionally relying mostly on isLoaded so it runs on mount when data is ready

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

  const filteredUsers = tenantUsers.filter(u => {
    const matchesSearch = u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (u.job_title && u.job_title.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (u.zk_user_id && u.zk_user_id.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (u.team && u.team.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesRole = roleFilter === "All" || (u.job_title || "Unassigned") === roleFilter
    const matchesStatus = statusFilter === "All" || u.status === statusFilter
    const matchesEmploymentType = employmentTypeFilter === "All" || (u.employment_type || "Full-Time") === employmentTypeFilter

    return matchesSearch && matchesRole && matchesStatus && matchesEmploymentType
  }).sort((a, b) => {
    switch (sortOption) {
      case "id_asc": {
        const numA = a.zk_user_id ? parseInt(a.zk_user_id, 10) : NaN
        const numB = b.zk_user_id ? parseInt(b.zk_user_id, 10) : NaN
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB
        if (!isNaN(numA)) return -1
        if (!isNaN(numB)) return 1
        return (a.zk_user_id || "").localeCompare(b.zk_user_id || "")
      }
      case "id_desc": {
        const numA = a.zk_user_id ? parseInt(a.zk_user_id, 10) : NaN
        const numB = b.zk_user_id ? parseInt(b.zk_user_id, 10) : NaN
        if (!isNaN(numA) && !isNaN(numB)) return numB - numA
        if (!isNaN(numA)) return -1
        if (!isNaN(numB)) return 1
        return (b.zk_user_id || "").localeCompare(a.zk_user_id || "")
      }
      case "joining_desc": {
        const dateA = a.joining_date ? new Date(a.joining_date).getTime() : 0
        const dateB = b.joining_date ? new Date(b.joining_date).getTime() : 0
        return dateB - dateA
      }
      case "joining_asc": {
        const dateA = a.joining_date ? new Date(a.joining_date).getTime() : 0
        const dateB = b.joining_date ? new Date(b.joining_date).getTime() : 0
        return dateA - dateB
      }
      case "salary_desc": {
        return (Number(b.base_salary) || 0) - (Number(a.base_salary) || 0)
      }
      case "salary_asc": {
        return (Number(a.base_salary) || 0) - (Number(b.base_salary) || 0)
      }
      case "name_desc": {
        return b.full_name.localeCompare(a.full_name)
      }
      case "name_asc":
      default: {
        return a.full_name.localeCompare(b.full_name)
      }
    }
  })

  // Get unique options for filters
  const uniqueRoles = Array.from(new Set(tenantUsers.map(u => u.job_title || "Unassigned"))).sort()
  const uniqueStatuses = Array.from(new Set(tenantUsers.map(u => u.status || "Active"))).sort()
  const uniqueEmploymentTypes = Array.from(new Set(tenantUsers.map(u => u.employment_type || "Full-Time"))).sort()

  const hasActiveFilters = searchQuery.trim() !== "" || roleFilter !== "All" || statusFilter !== "All" || employmentTypeFilter !== "All" || sortOption !== "id_asc"

  const clearAllFilters = () => {
    setSearchQuery("")
    setRoleFilter("All")
    setStatusFilter("All")
    setEmploymentTypeFilter("All")
    setSortOption("id_asc")
  }

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

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-gradient-to-br from-white/90 to-white/50 dark:from-slate-900/60 dark:to-slate-900/20 p-6 rounded-[1.5rem] border border-white/60 dark:border-slate-700/50 shadow-none backdrop-blur-2xl relative overflow-hidden group transition-all duration-300">
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
          
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input 
                type="text" 
                placeholder="Search employees..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-8 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-full h-9 text-sm w-full sm:w-64 shadow-none focus-visible:ring-1 focus-visible:ring-[#ff5a36]" 
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-full">
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`p-1.5 rounded-full transition-all relative ${showFilters ? "bg-white dark:bg-slate-700 shadow-none text-[#ff5a36]" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
                title="Toggle Quick Filters"
              >
                <Filter className="w-4 h-4" />
                {hasActiveFilters && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#ff5a36] ring-1 ring-white dark:ring-slate-800" />
                )}
              </button>
            </div>
            
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-full">
              <button 
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-full transition-all ${viewMode === "list" ? "bg-white dark:bg-slate-700 shadow-none text-slate-800 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode("card")}
                className={`p-1.5 rounded-full transition-all ${viewMode === "card" ? "bg-white dark:bg-slate-700 shadow-none text-slate-800 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
                title="Cards View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            <Link href="/hr/employees/new" className="w-full sm:w-auto">
              <Button 
                className="bg-[#ff5a36] hover:bg-[#e04a29] text-white rounded-full h-9 px-4 shadow-none w-full transition-all cursor-pointer font-bold text-xs"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Add Employee
              </Button>
            </Link>
          </div>
        </div>

        {/* Quick Filters Panel */}
        {showFilters && (
          <div className="bg-white/70 dark:bg-slate-900/40 backdrop-blur-2xl border border-slate-200/40 dark:border-slate-700/50 p-4 rounded-[1.5rem] shadow-none animate-in fade-in slide-in-from-top-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3 z-20 relative transition-all duration-300">
            
            {/* Quick Status Tabs with Badge Counters */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
              {[
                { label: "All Employees", value: "All", count: tenantUsers.length, dot: null },
                { label: "Active", value: "Active", count: tenantUsers.filter(u => u.status === "Active").length, dot: "bg-emerald-500" },
                { label: "Documents Missing", value: "Documents Missing", count: tenantUsers.filter(u => u.status === "Documents Missing").length, dot: "bg-amber-500" },
                { label: "Disabled", value: "Disabled", count: tenantUsers.filter(u => u.status === "Disabled").length, dot: "bg-slate-400" },
              ].map(tab => {
                const isSelected = statusFilter === tab.value
                return (
                  <button
                    key={tab.value}
                    onClick={() => setStatusFilter(tab.value)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 border cursor-pointer ${
                      isSelected
                        ? "bg-[#ff5a36] text-white border-[#ff5a36] shadow-sm shadow-[#ff5a36]/25"
                        : "bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700/80 hover:border-[#ff5a36]/50 hover:bg-white dark:hover:bg-slate-800"
                    }`}
                  >
                    {tab.dot && (
                      <span className={`w-2 h-2 rounded-full ${tab.dot} ${isSelected ? "ring-2 ring-white/60" : ""}`} />
                    )}
                    {tab.label}
                    <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-extrabold ${
                      isSelected
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Inline Select Filters: Role & Type */}
            <div className="flex items-center gap-2.5 shrink-0 flex-wrap justify-between lg:justify-end">
              {/* Role Selector */}
              <div className="relative">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="h-8.5 pl-3 pr-8 text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-1 focus:ring-[#ff5a36]/50 transition-all text-slate-700 dark:text-slate-300 cursor-pointer appearance-none shadow-none min-w-[130px]"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 10px center'
                  }}
                >
                  <option value="All">All Roles ({uniqueRoles.length})</option>
                  {uniqueRoles.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>

              {/* Employment Type Selector */}
              <div className="relative">
                <select
                  value={employmentTypeFilter}
                  onChange={(e) => setEmploymentTypeFilter(e.target.value)}
                  className="h-8.5 pl-3 pr-8 text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-1 focus:ring-[#ff5a36]/50 transition-all text-slate-700 dark:text-slate-300 cursor-pointer appearance-none shadow-none min-w-[130px]"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 10px center'
                  }}
                >
                  <option value="All">All Types ({uniqueEmploymentTypes.length})</option>
                  {uniqueEmploymentTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Sort Order Selector */}
              <div className="relative">
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="h-8.5 pl-3 pr-8 text-xs font-semibold bg-white dark:bg-slate-800 border border-[#ff5a36]/40 dark:border-[#ff5a36]/30 rounded-xl outline-none focus:ring-1 focus:ring-[#ff5a36] transition-all text-slate-800 dark:text-slate-200 cursor-pointer appearance-none shadow-none min-w-[170px]"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' viewBox='0 0 24 24' stroke='%23ff5a36' stroke-width='2.5'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 10px center'
                  }}
                  title="Adjust employee ordering"
                >
                  <option value="id_asc">Sort: ID Number (1 → 99)</option>
                  <option value="id_desc">Sort: ID Number (99 → 1)</option>
                  <option value="joining_desc">Sort: Hiring Date (Newest)</option>
                  <option value="joining_asc">Sort: Hiring Date (Oldest)</option>
                  <option value="name_asc">Sort: Name (A → Z)</option>
                  <option value="name_desc">Sort: Name (Z → A)</option>
                  <option value="salary_desc">Sort: Salary (High → Low)</option>
                  <option value="salary_asc">Sort: Salary (Low → High)</option>
                </select>
              </div>

              {/* Status and Active Filter Summary */}
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span className="text-[11px] whitespace-nowrap">
                  (<strong className="text-slate-800 dark:text-white font-bold">{filteredUsers.length}</strong>/{tenantUsers.length})
                </span>

                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-500 hover:text-rose-600 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 px-2.5 py-1 rounded-full transition-colors cursor-pointer"
                    title="Reset all filters"
                  >
                    <X className="w-3 h-3" /> Clear
                  </button>
                )}
              </div>
            </div>

          </div>
        )}

        {viewMode === "list" ? (
          <Card className="rounded-[1.5rem] p-0 bg-white/70 dark:bg-slate-900/40 backdrop-blur-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-none overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-white/30 dark:bg-slate-800/30 backdrop-blur-md border-b border-slate-200/70 dark:border-slate-700/50">
                  <tr className="text-slate-500 font-medium text-xs uppercase tracking-wider">
                    <th 
                      onClick={() => handleToggleColumnSort("name")}
                      className="py-4 px-6 font-bold cursor-pointer select-none hover:text-[#ff5a36] transition-colors"
                      title="Sort by Employee Name"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Employee</span>
                        {sortOption === "name_asc" && <ArrowUp className="w-3.5 h-3.5 text-[#ff5a36]" />}
                        {sortOption === "name_desc" && <ArrowDown className="w-3.5 h-3.5 text-[#ff5a36]" />}
                        {!sortOption.startsWith("name") && <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60" />}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleToggleColumnSort("id")}
                      className="py-4 px-6 font-bold cursor-pointer select-none hover:text-[#ff5a36] transition-colors"
                      title="Sort by Machine ID / ID Number"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Machine ID</span>
                        {sortOption === "id_asc" && <ArrowUp className="w-3.5 h-3.5 text-[#ff5a36]" />}
                        {sortOption === "id_desc" && <ArrowDown className="w-3.5 h-3.5 text-[#ff5a36]" />}
                        {!sortOption.startsWith("id") && <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60" />}
                      </div>
                    </th>
                    <th className="py-4 px-6 font-bold">Role</th>
                    <th className="py-4 px-6 font-bold">Type</th>
                    <th 
                      onClick={() => handleToggleColumnSort("salary")}
                      className="py-4 px-6 font-bold cursor-pointer select-none hover:text-[#ff5a36] transition-colors"
                      title="Sort by Basic Salary"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Basic Salary</span>
                        {sortOption === "salary_asc" && <ArrowUp className="w-3.5 h-3.5 text-[#ff5a36]" />}
                        {sortOption === "salary_desc" && <ArrowDown className="w-3.5 h-3.5 text-[#ff5a36]" />}
                        {!sortOption.startsWith("salary") && <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60" />}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleToggleColumnSort("joining")}
                      className="py-4 px-6 font-bold cursor-pointer select-none hover:text-[#ff5a36] transition-colors"
                      title="Sort by Hiring / Joining Date"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Joined</span>
                        {sortOption === "joining_asc" && <ArrowUp className="w-3.5 h-3.5 text-[#ff5a36]" />}
                        {sortOption === "joining_desc" && <ArrowDown className="w-3.5 h-3.5 text-[#ff5a36]" />}
                        {!sortOption.startsWith("joining") && <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60" />}
                      </div>
                    </th>
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
                          <span className="text-xs font-mono font-medium text-slate-700 dark:text-slate-300">
                            {user.zk_user_id ? `#${user.zk_user_id}` : "-"}
                          </span>
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
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              PKR {formatCurrency(Number(user.base_salary || 0))}
                            </span>
                            {Number(user.commission_per_sale) > 0 && (
                              <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                                +PKR {formatCurrency(Number(user.commission_per_sale))}/sale
                              </span>
                            )}
                          </div>
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
                              user.status === 'Active'
                                ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20" 
                                : user.status === 'Documents Missing'
                                ? "bg-amber-50 text-amber-600 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:hover:bg-amber-500/20"
                                : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                            }`}
                          >
                            {user.status === 'Active' ? <UserCheck className="w-3 h-3" /> : <UserMinus className="w-3 h-3" />}
                            {user.status || "Active"}
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
                      <td colSpan={8} className="py-10 text-center text-slate-500">
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
                  className="group relative rounded-[1.5rem] bg-white/70 dark:bg-slate-900/40 backdrop-blur-2xl border border-slate-200/60 dark:border-slate-700/50 p-6 flex flex-col transition-all hover:bg-white/90 dark:hover:bg-slate-800/60 shadow-none duration-300"
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
                      className="w-12 h-12 rounded-full object-cover bg-slate-100"
                  />

                  {/* Name & Title */}
                  <div className="mt-4 mb-6">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight leading-tight">
                      {user.full_name}
                    </h3>
                    <p className="text-[11px] font-medium text-slate-400 mt-1">
                      {user.job_title || "Unassigned"} • {user.employment_type || "Full-Time"} {user.zk_user_id ? `• #${user.zk_user_id}` : ''}
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
                          PKR {formatCurrency(Number(user.base_salary))}
                        </span>
                        {Number(user.commission_per_sale) > 0 && (
                          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 tracking-wide">
                            +PKR {formatCurrency(Number(user.commission_per_sale))}/s
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status Indicator */}
                    <div className="flex flex-col gap-2 items-end">
                      <span className={`text-[10px] font-bold flex items-center gap-1.5 ${user.status === 'Active' ? "text-emerald-500 dark:text-emerald-400" : user.status === 'Documents Missing' ? "text-amber-500 dark:text-amber-400" : "text-slate-500 dark:text-slate-400"}`}>
                        {user.status === 'Active' ? <UserCheck className="w-3.5 h-3.5" /> : <UserMinus className="w-3.5 h-3.5" />}
                        {user.status || "Active"}
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
