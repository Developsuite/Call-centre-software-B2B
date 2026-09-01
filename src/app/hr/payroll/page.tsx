"use client"

import React, { useState, useMemo, useRef, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useAppContext, HREmployee } from "@/store/AppContext"
import { useSearchParams, useRouter } from "next/navigation"
import { 
  Search, 
  Banknote, 
  Download, 
  ArrowUpRight, 
  ChevronDown, 
  FileSpreadsheet, 
  FileText, 
  UserCircle, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  X, 
  Filter
} from "lucide-react"
import { toast } from "sonner"
import { EmployeeDetailsModal } from "@/components/hr/EmployeeDetailsModal"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

export default function HRPayrollPage() {
  const { hrEmployees, currentUser, isLoaded, formatCurrency, teams } = useAppContext()

  const searchParams = useSearchParams()
  const router = useRouter()
  const teamFilter = searchParams.get('team')
  const teamObj = teamFilter ? teams.find(t => t.id === teamFilter) : null

  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("All")
  const [sortOption, setSortOption] = useState<string>("salary_desc")
  const [showFilters, setShowFilters] = useState(true)

  const [selectedEmployee, setSelectedEmployee] = useState<HREmployee | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const [showExportMenu, setShowExportMenu] = useState(false)
  const exportMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSeeDetails = (employee: HREmployee) => {
    setSelectedEmployee(employee)
    setIsModalOpen(true)
  }

  // Isolate to current org
  const tenantUsers = currentUser?.role === "SuperAdmin" 
    ? hrEmployees 
    : hrEmployees.filter(u => u.organization_id === currentUser?.tenantId)

  // Filter out disabled or SuperAdmins from payroll (Active staff including Documents Missing)
  let activeStaff = tenantUsers.filter(u => u.status !== "Disabled" && u.role !== "SuperAdmin")

  // Apply team filter if present
  if (teamFilter) {
    activeStaff = activeStaff.filter(u => u.team_id === teamFilter)
  }

  // Extract unique roles
  const uniqueRoles = Array.from(new Set(activeStaff.map(u => u.job_title || u.role || 'Agent'))).filter(Boolean).sort()

  const officeBoysCount = activeStaff.filter(u => 
    (u.job_title || "").toLowerCase().includes("office boy") || (u.role || "").toLowerCase().includes("office boy")
  ).length

  const employeesCount = activeStaff.length - officeBoysCount

  // Filter and sort staff
  const filteredStaff = useMemo(() => {
    return activeStaff.map(user => {
      const baseSalary = Number(user.base_salary) || 0
      const isOfficeBoy = (user.job_title || "").toLowerCase().includes("office boy") || (user.role || "").toLowerCase().includes("office boy")
      const commissionRate = isOfficeBoy ? 0 : (Number(user.commission_per_sale) || 0)
      const totalCompensation = baseSalary // Base run estimation

      return {
        ...user,
        baseSalary,
        commissionRate,
        totalCompensation
      }
    }).filter(u => {
      const query = searchQuery.toLowerCase().trim()
      const matchesSearch = 
        (u.full_name || "").toLowerCase().includes(query) ||
        (u.email || "").toLowerCase().includes(query) ||
        (u.role || "").toLowerCase().includes(query) ||
        (u.job_title || "").toLowerCase().includes(query) ||
        (u.id || "").toLowerCase().includes(query)

      let matchesRole = true
      if (roleFilter === "All") {
        matchesRole = true
      } else if (roleFilter === "ALL_EMPLOYEES_EXCLUDE_OFFICE") {
        const isOfficeBoy = (u.job_title || "").toLowerCase().includes("office boy") || (u.role || "").toLowerCase().includes("office boy")
        matchesRole = !isOfficeBoy
      } else if (roleFilter === "OFFICE_BOYS_ONLY") {
        const isOfficeBoy = (u.job_title || "").toLowerCase().includes("office boy") || (u.role || "").toLowerCase().includes("office boy")
        matchesRole = isOfficeBoy
      } else {
        matchesRole = u.role === roleFilter || u.job_title === roleFilter
      }

      return matchesSearch && matchesRole
    }).sort((a, b) => {
      switch (sortOption) {
        case "salary_desc":
          return b.baseSalary - a.baseSalary
        case "salary_asc":
          return a.baseSalary - b.baseSalary
        case "comm_desc":
          return b.commissionRate - a.commissionRate
        case "comm_asc":
          return a.commissionRate - b.commissionRate
        case "name_asc":
          return (a.full_name || "").localeCompare(b.full_name || "")
        case "name_desc":
          return (b.full_name || "").localeCompare(a.full_name || "")
        default:
          return b.totalCompensation - a.totalCompensation
      }
    })
  }, [activeStaff, searchQuery, roleFilter, sortOption])

  const totalPayroll = filteredStaff.reduce((sum, item) => sum + item.totalCompensation, 0)

  const handleToggleColumnSort = (column: "name" | "salary" | "comm") => {
    setSortOption(prev => {
      if (column === "salary") return prev === "salary_desc" ? "salary_asc" : "salary_desc"
      if (column === "comm") return prev === "comm_desc" ? "comm_asc" : "comm_desc"
      if (column === "name") return prev === "name_asc" ? "name_desc" : "name_asc"
      return prev
    })
  }

  const hasActiveFilters = roleFilter !== "All" || searchQuery !== ""

  const clearAllFilters = () => {
    setSearchQuery("")
    setRoleFilter("All")
    setSortOption("salary_desc")
  }

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredStaff.length === 0) {
      toast.error("No staff to export with current filters.")
      return
    }

    const headers = [
      "Staff Member Name",
      "Job Title / Role",
      "Base Salary (PKR)",
      "Commission Rate (PKR/Sale)",
      "Total Base (PKR)",
      "Mobile Number",
      "Email"
    ]

    const csvRows = [
      headers.map(h => `"${h}"`).join(",")
    ]

    filteredStaff.forEach(u => {
      const row = [
        u.full_name || "",
        u.job_title || u.role || "Unassigned",
        u.baseSalary ? String(u.baseSalary) : "0",
        u.commissionRate ? String(u.commissionRate) : "0",
        u.totalCompensation ? String(u.totalCompensation) : "0",
        u.mobile_number || "N/A",
        u.email || "N/A"
      ]
      csvRows.push(row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
    })

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `Payroll_Export_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success(`Downloaded CSV with ${filteredStaff.length} staff member(s)!`)
  }

  // Export to PDF (Direct download)
  const handleExportPDF = () => {
    if (filteredStaff.length === 0) {
      toast.error("No staff to export with current filters.")
      return
    }

    try {
      const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" })

      // Top Header Background Bar (Slate-900)
      doc.setFillColor(15, 23, 42)
      doc.rect(0, 0, 842, 58, "F")

      // Emerald Accent Underline
      doc.setFillColor(16, 185, 129) // #10b981
      doc.rect(0, 56, 842, 3, "F")

      // Title
      doc.setFontSize(16)
      doc.setTextColor(255, 255, 255)
      doc.setFont("helvetica", "bold")
      doc.text("Voice Link — Payroll & Compensation Overview", 40, 32)

      // Timestamp subtitle
      doc.setFontSize(8.5)
      doc.setTextColor(148, 163, 184)
      doc.setFont("helvetica", "normal")
      const reportDate = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
      doc.text(`Generated: ${reportDate}  •  Active Filtered Records: ${filteredStaff.length} Staff Member(s)`, 40, 47)

      // Filter Info Badge / Summary Container
      doc.setFillColor(248, 250, 252)
      doc.setDrawColor(226, 232, 240)
      doc.roundedRect(40, 72, 762, 28, 4, 4, "FD")

      // Filter Info Text
      doc.setFontSize(8.5)
      doc.setTextColor(51, 65, 85)
      doc.setFont("helvetica", "bold")
      const roleLabel = roleFilter === "All" ? "All Staff" : roleFilter === "ALL_EMPLOYEES_EXCLUDE_OFFICE" ? "All Employees (Excl. Office Boys)" : roleFilter === "OFFICE_BOYS_ONLY" ? "Office Boys Only" : roleFilter
      doc.text(`Filter Applied: ${roleLabel}`, 50, 89)

      // Total Payroll Badge on Right
      const payrollSummaryText = `Total Estimated Run: PKR ${formatCurrency(totalPayroll)}`
      const payrollWidth = doc.getTextWidth(payrollSummaryText)
      doc.setTextColor(16, 185, 129)
      doc.text(payrollSummaryText, 792 - payrollWidth, 89)

      // Table Headers & Rows
      const tableHeaders = [
        ["Staff Member", "Job Title / Role", "Base Salary", "Comm. Rate", "Total Base", "Mobile Number"]
      ]

      const tableRows = filteredStaff.map(u => [
        u.full_name || "",
        u.job_title || u.role || "Unassigned",
        `PKR ${formatCurrency(u.baseSalary)}`,
        u.commissionRate > 0 ? `+PKR ${formatCurrency(u.commissionRate)}/sale` : "-",
        `PKR ${formatCurrency(u.totalCompensation)}`,
        u.mobile_number || "-"
      ])

      autoTable(doc, {
        head: tableHeaders,
        body: tableRows,
        startY: 110,
        theme: "striped",
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 8.5,
          cellPadding: 6
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [30, 41, 59],
          cellPadding: 5
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        columnStyles: {
          0: { fontStyle: "bold", textColor: [15, 23, 42] },
          2: { fontStyle: "bold" },
          3: { textColor: [16, 185, 129], fontStyle: "bold" },
          4: { fontStyle: "bold", textColor: [15, 23, 42] }
        },
        didDrawPage: (data: any) => {
          const pageCount = (doc as any).internal.getNumberOfPages()
          const currentPage = data.pageNumber
          doc.setFontSize(7.5)
          doc.setTextColor(148, 163, 184)
          doc.text(`Page ${currentPage} of ${pageCount}`, 40, 575)
          doc.text("Voice Link HR Payroll System — Confidential Internal Document", 802 - doc.getTextWidth("Voice Link HR Payroll System — Confidential Internal Document"), 575)
        },
        margin: { left: 40, right: 40, bottom: 40 }
      })

      const filename = `Payroll_Report_${new Date().toISOString().split('T')[0]}.pdf`
      doc.save(filename)
      toast.success(`Downloaded ${filename} successfully!`)
    } catch (err: any) {
      console.error("Payroll PDF Export Error:", err)
      toast.error("Failed to download PDF.")
    }
  }

  if (!isLoaded || !currentUser) {
    return (
      <DashboardLayout title="Payroll Overview">
        <div className="flex items-center justify-center h-[50vh]">
          <div className="w-6 h-6 border-2 border-[#ff5a36] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Payroll Overview">
      <div className="flex flex-col gap-5 font-sans max-w-[1400px] mx-auto w-full pb-10">

        {/* Team Breadcrumb */}
        {teamObj && (
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <a href="/hr/teams" className="hover:text-[#ff5a36] transition-colors">Teams</a>
            <span className="text-slate-300">›</span>
            <a href={`/hr/teams/${teamFilter}`} className="hover:text-[#ff5a36] transition-colors">{teamObj.name}</a>
            <span className="text-slate-300">›</span>
            <span className="text-slate-800 dark:text-white font-bold">Payroll</span>
          </div>
        )}
        
        {/* Top Header Card */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-gradient-to-br from-white/90 to-white/50 dark:from-slate-900/60 dark:to-slate-900/20 p-6 rounded-[1.5rem] border border-white/60 dark:border-slate-700/50 shadow-none relative z-30">
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-1">
              <div className="bg-emerald-500/10 dark:bg-emerald-500/20 p-2.5 rounded-2xl text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Banknote className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {teamObj ? `${teamObj.name} — Payroll` : 'Payroll Overview'}
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mt-0.5">
                  Real-time salary distribution, role tiers, and sales commission estimates
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap relative z-40">
            {/* Team Dropdown */}
            <select
              value={teamFilter || ""}
              onChange={(e) => {
                if (e.target.value) {
                  router.push(`/hr/payroll?team=${e.target.value}`)
                } else {
                  router.push(`/hr/payroll`)
                }
              }}
              className="h-9 pl-3 pr-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#ff5a36] appearance-none cursor-pointer"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 10px center'
              }}
            >
              <option value="">All Teams</option>
              {teams.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>

            {/* Search Input */}
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input 
                type="text" 
                placeholder="Search staff, role..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full h-9 text-xs focus-visible:ring-1 focus-visible:ring-[#ff5a36] shadow-none" 
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Filter Toggle Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 rounded-full h-9 px-3.5 border text-xs font-bold transition-all cursor-pointer shadow-none ${
                showFilters || hasActiveFilters
                  ? "bg-[#ff5a36] text-white border-[#ff5a36]"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-[#ff5a36]/50"
              }`}
              title="Toggle Filters"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filters</span>
              {hasActiveFilters && (
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              )}
            </button>

            {/* Export Dropdown */}
            <div className="relative z-50" ref={exportMenuRef}>
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-full h-9 px-3.5 shadow-none transition-all cursor-pointer font-bold text-xs"
                title="Export Filtered Payroll"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Export ({filteredStaff.length})</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${showExportMenu ? 'rotate-180' : ''}`} />
              </button>

              {showExportMenu && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-700 rounded-2xl shadow-2xl z-50 p-1.5 ring-1 ring-black/10 dark:ring-white/10 animate-in fade-in zoom-in-95 duration-150">
                  <button
                    onClick={() => {
                      setShowExportMenu(false)
                      handleExportCSV()
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:bg-emerald-500/20 rounded-xl transition-all text-left cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <div className="font-bold">Download CSV (.csv)</div>
                      <div className="text-[10px] text-slate-400 font-normal">Excel / Spreadsheet</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setShowExportMenu(false)
                      handleExportPDF()
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-rose-500/10 hover:text-rose-600 dark:hover:bg-rose-500/20 rounded-xl transition-all text-left cursor-pointer mt-1"
                  >
                    <FileText className="w-4 h-4 text-rose-500 shrink-0" />
                    <div>
                      <div className="font-bold">Download PDF (.pdf)</div>
                      <div className="text-[10px] text-slate-400 font-normal">Instant PDF File Download</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white/70 dark:bg-slate-900/40 backdrop-blur-2xl border border-slate-200/40 dark:border-slate-700/50 p-2.5 lg:p-3 rounded-2xl shadow-none animate-in fade-in slide-in-from-top-3 flex items-center justify-between gap-3 z-10 relative transition-all duration-300 flex-wrap xl:flex-nowrap">
            
            {/* Quick Filter Category Tabs */}
            <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
              {[
                { label: "All Active Staff", value: "All", count: activeStaff.length, dot: "bg-emerald-500" },
                { label: "All Employees", value: "ALL_EMPLOYEES_EXCLUDE_OFFICE", count: employeesCount, dot: "bg-indigo-500" },
                { label: "Office Boys", value: "OFFICE_BOYS_ONLY", count: officeBoysCount, dot: "bg-amber-500" },
              ].map(tab => {
                const isSelected = roleFilter === tab.value
                return (
                  <button
                    key={tab.value}
                    onClick={() => setRoleFilter(tab.value)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 border cursor-pointer ${
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

            {/* Inline Select Filters: Role & Sort */}
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              {/* Role Dropdown */}
              <div className="relative">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="h-8 pl-2.5 pr-7 text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-1 focus:ring-[#ff5a36]/50 transition-all text-slate-700 dark:text-slate-300 cursor-pointer appearance-none shadow-none min-w-[130px]"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 8px center'
                  }}
                >
                  <option value="All">All Roles ({activeStaff.length})</option>
                  <option value="ALL_EMPLOYEES_EXCLUDE_OFFICE">All Employees ({employeesCount})</option>
                  <option value="OFFICE_BOYS_ONLY">Office Boys Only ({officeBoysCount})</option>
                  <optgroup label="Specific Roles">
                    {uniqueRoles.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Sort Order Selector */}
              <div className="relative">
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="h-8 pl-2.5 pr-7 text-xs font-semibold bg-white dark:bg-slate-800 border border-[#ff5a36]/40 dark:border-[#ff5a36]/30 rounded-xl outline-none focus:ring-1 focus:ring-[#ff5a36] transition-all text-slate-800 dark:text-slate-200 cursor-pointer appearance-none shadow-none min-w-[160px]"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' viewBox='0 0 24 24' stroke='%23ff5a36' stroke-width='2.5'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 8px center'
                  }}
                  title="Adjust staff ordering"
                >
                  <option value="salary_desc">Sort: Salary (High → Low)</option>
                  <option value="salary_asc">Sort: Salary (Low → High)</option>
                  <option value="comm_desc">Sort: Commission (High → Low)</option>
                  <option value="comm_asc">Sort: Commission (Low → High)</option>
                  <option value="name_asc">Sort: Name (A → Z)</option>
                  <option value="name_desc">Sort: Name (Z → A)</option>
                </select>
              </div>

              {/* Active Filter Counter & Clear */}
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span className="text-[11px] whitespace-nowrap">
                  (<strong className="text-slate-800 dark:text-white font-bold">{filteredStaff.length}</strong>/{activeStaff.length})
                </span>

                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-500 hover:text-rose-600 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
                    title="Reset all filters"
                  >
                    <X className="w-3 h-3" /> Clear
                  </button>
                )}
              </div>
            </div>

          </div>
        )}

        {/* Main Payroll Table Card */}
        <Card className="rounded-[1.5rem] p-0 bg-white/70 dark:bg-slate-900/40 backdrop-blur-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-none overflow-hidden">
          
          {/* Card Header Summary */}
          <div className="p-6 border-b border-slate-200/60 dark:border-slate-800/80 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-gradient-to-r from-slate-50/80 to-transparent dark:from-slate-800/40">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-800 dark:text-white text-base">
                  Current Period Estimations
                </h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-500/20">
                  {filteredStaff.length} Listed
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Base salary + estimated sales commissions
              </p>
            </div>
            
            <div className="sm:text-right flex sm:flex-col items-center sm:items-end justify-between gap-1 bg-white/60 dark:bg-slate-800/60 sm:bg-transparent p-3 sm:p-0 rounded-xl border sm:border-none border-slate-200/60 dark:border-slate-700/50">
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider">
                Total Estimated Run
              </p>
              <h2 className="text-2xl lg:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">
                PKR {formatCurrency(totalPayroll)}
              </h2>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-white/40 dark:bg-slate-800/30 backdrop-blur-md border-b border-slate-200/70 dark:border-slate-700/50">
                <tr className="text-slate-500 font-medium text-xs uppercase tracking-wider">
                  <th 
                    onClick={() => handleToggleColumnSort("name")}
                    className="py-4 px-6 font-bold cursor-pointer select-none hover:text-[#ff5a36] transition-colors"
                    title="Sort by Staff Member"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Staff Member</span>
                      {sortOption === "name_asc" && <ArrowUp className="w-3.5 h-3.5 text-[#ff5a36]" />}
                      {sortOption === "name_desc" && <ArrowDown className="w-3.5 h-3.5 text-[#ff5a36]" />}
                      {!sortOption.startsWith("name") && <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60" />}
                    </div>
                  </th>
                  <th className="py-4 px-6 font-bold">Role</th>
                  <th 
                    onClick={() => handleToggleColumnSort("salary")}
                    className="py-4 px-6 font-bold text-right cursor-pointer select-none hover:text-[#ff5a36] transition-colors"
                    title="Sort by Base Salary"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Base Salary</span>
                      {sortOption === "salary_asc" && <ArrowUp className="w-3.5 h-3.5 text-[#ff5a36]" />}
                      {sortOption === "salary_desc" && <ArrowDown className="w-3.5 h-3.5 text-[#ff5a36]" />}
                      {!sortOption.startsWith("salary") && <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60" />}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleToggleColumnSort("comm")}
                    className="py-4 px-6 font-bold text-right text-emerald-600 dark:text-emerald-400 cursor-pointer select-none hover:text-[#ff5a36] transition-colors"
                    title="Sort by Commission Rate"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Comm. Rate</span>
                      {sortOption === "comm_asc" && <ArrowUp className="w-3.5 h-3.5 text-[#ff5a36]" />}
                      {sortOption === "comm_desc" && <ArrowDown className="w-3.5 h-3.5 text-[#ff5a36]" />}
                      {!sortOption.startsWith("comm") && <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60" />}
                    </div>
                  </th>
                  <th className="py-4 px-6 font-bold text-right">Total Base</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.map((item, i) => {
                  const isLast = i === filteredStaff.length - 1

                  return (
                    <tr 
                      key={item.id} 
                      onClick={() => handleSeeDetails(item)}
                      className={`group cursor-pointer hover:bg-[#ff5a36]/[0.03] dark:hover:bg-slate-800/60 transition-colors ${!isLast ? 'border-b border-white/30 dark:border-slate-700/30' : ''}`}
                      title="Click to view full employee profile"
                    >
                      {/* Staff Member */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          {item.avatar_url ? (
                            <img src={item.avatar_url} alt={item.full_name} className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 group-hover:border-[#ff5a36]/50 transition-colors" />
                          ) : (
                            <UserCircle className="w-8 h-8 text-slate-300 group-hover:text-[#ff5a36] transition-colors" />
                          )}
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800 dark:text-white group-hover:text-[#ff5a36] transition-colors flex items-center gap-2">
                              {item.full_name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono" title={item.id}>
                              {item.email || item.id.substring(0, 8) + "..."}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-4 px-6">
                        <span className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md text-xs font-semibold text-slate-600 dark:text-slate-300">
                          {item.job_title || item.role}
                        </span>
                      </td>

                      {/* Base Salary */}
                      <td className="py-4 px-6 text-right font-medium text-slate-600 dark:text-slate-400">
                        PKR {formatCurrency(item.baseSalary)}
                      </td>

                      {/* Commission Rate - Clean text without rectangle pill */}
                      <td className="py-4 px-6 text-right">
                        {item.commissionRate > 0 ? (
                          <span className="inline-flex items-center gap-1 font-bold text-xs text-emerald-600 dark:text-emerald-400">
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            PKR {formatCurrency(item.commissionRate)}/sale
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Total Base */}
                      <td className="py-4 px-6 text-right">
                        <span className="font-bold text-slate-800 dark:text-white text-base">
                          PKR {formatCurrency(item.totalCompensation)}
                        </span>
                      </td>
                    </tr>
                  )
                })}
                {filteredStaff.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      No staff members found matching your search or filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

      </div>

      {/* Employee Profile Details Modal */}
      {selectedEmployee && (
        <EmployeeDetailsModal
          employee={selectedEmployee}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedEmployee(null)
          }}
        />
      )}
    </DashboardLayout>
  )
}
