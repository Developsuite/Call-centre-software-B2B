"use client"

import React, { useState, useMemo } from 'react'
import { useAppContext, HRCandidate } from "@/store/AppContext"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { 
  Users, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  
  LayoutGrid, 
  List, 
  Columns3,
  UserCheck, 
  Phone, 
  Mail, 
  Clock, 
  X, 
  Layers,
  ArrowRight,
  CheckCircle2,
  MessageSquare,
  Calendar,
  GraduationCap,
  PauseCircle,
  XCircle,
  Globe
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from "@/lib/utils"

export const STAGES = ['Interview', 'Training', 'On Hold', 'Hired', 'Rejected'] as const
export type PipelineStage = typeof STAGES[number]

export const ROLES = [
  'Fresher',
  'Senior Sales Rep',
  'Sales Agent',
  'Supervisor',
  'Processor',
  'Office Boy'
] as const

export const ENGLISH_LEVELS = [
  'Basic',
  'Intermediate',
  'Fluent',
  'Native / Bilingual'
] as const
export type EnglishLevel = typeof ENGLISH_LEVELS[number]

export const getEnglishLevelBadge = (level?: string) => {
  if (!level) return 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200/80 dark:border-slate-700/80'
  switch (level) {
    case 'Native / Bilingual':
    case 'Native':
      return 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200/80 dark:border-purple-800/80'
    case 'Fluent':
      return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/80'
    case 'Intermediate':
      return 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200/80 dark:border-blue-800/80'
    case 'Basic':
      return 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/80'
    default:
      return 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200/80 dark:border-slate-700/80'
  }
}

export const extractEnglishLevel = (candidate: HRCandidate): string | undefined => {
  if (candidate.english_level) return candidate.english_level
  if (candidate.notes) {
    const match = candidate.notes.match(/\[English:\s*([^\]]+)\]/i)
    if (match && match[1]) return match[1].trim()
  }
  return undefined
}

export const getCleanNotes = (notes?: string): string => {
  if (!notes) return ''
  return notes.replace(/\[English:\s*[^\]]+\]/gi, '').trim()
}

export const normalizeStage = (status?: string): PipelineStage => {
  if (!status) return 'Interview'
  if (status === 'New' || status === 'Interviewing') return 'Interview'
  if (status === 'Not Responding') return 'On Hold'
  if (STAGES.includes(status as any)) return status as PipelineStage
  return 'Interview'
}

// Dynamic Avatar Colors matching the screenshot (AA: amber, BI: olive, HA: orange, MA: blue, ZA: green)
const AVATAR_COLORS = [
  'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200',
  'bg-lime-200 text-lime-900 dark:bg-lime-900/50 dark:text-lime-200',
  'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200',
  'bg-sky-200 text-sky-900 dark:bg-sky-900/50 dark:text-sky-200',
  'bg-emerald-200 text-emerald-900 dark:bg-emerald-900/50 dark:text-emerald-200',
  'bg-purple-200 text-purple-900 dark:bg-purple-900/50 dark:text-purple-200',
  'bg-rose-200 text-rose-900 dark:bg-rose-900/50 dark:text-rose-200',
]

export default function RecruitmentPage() {
  const { 
    hrCandidates, 
    addHRCandidate, 
    updateHRCandidate, 
    deleteHRCandidate, 
    hrEmployees, 
    addHREmployee, 
    currentUser, 
    isLoaded 
  } = useAppContext()
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("")
  const [stageFilter, setStageFilter] = useState("All")
  const [roleFilter, setRoleFilter] = useState("All")
  const [viewMode, setViewMode] = useState<"board" | "list" | "card">("board")
  
  // Modal & Drawer State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState<HRCandidate | null>(null)
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false)
  
  // Form State
  const [fullName, setFullName] = useState("")
  const [roleApplied, setRoleApplied] = useState("")
  const [englishLevel, setEnglishLevel] = useState<string>("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<string>("Interview")
  const [notes, setNotes] = useState("")
  const [salaryPitch, setSalaryPitch] = useState("")
  const [commissionPitch, setCommissionPitch] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Drag & Drop State
  const [draggedOverStage, setDraggedOverStage] = useState<string | null>(null)

  // Extract unique roles for dropdown filter
  const uniqueRoles = useMemo(() => {
    return Array.from(new Set(hrCandidates.map(c => c.role_applied).filter(Boolean))).sort()
  }, [hrCandidates])

  // Filtered candidates
  const filteredCandidates = useMemo(() => {
    return hrCandidates.filter(c => {
      const currentStage = normalizeStage(c.status)
      const engLevel = extractEnglishLevel(c)
      const matchesSearch = !searchQuery.trim() || 
        c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.role_applied.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (engLevel && engLevel.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.phone && c.phone.includes(searchQuery)) ||
        c.id.toLowerCase().includes(searchQuery.toLowerCase())
        
      const matchesStage = stageFilter === "All" || currentStage === stageFilter
      const matchesRole = roleFilter === "All" || c.role_applied === roleFilter
      
      return matchesSearch && matchesStage && matchesRole
    })
  }, [hrCandidates, searchQuery, stageFilter, roleFilter])

  // Avatar generator
  const getInitials = (name: string) => {
    const parts = name.trim().split(" ")
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }

  const getAvatarColor = (id: string) => {
    let hash = 0
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash)
    }
    const index = Math.abs(hash) % AVATAR_COLORS.length
    return AVATAR_COLORS[index]
  }

  // Candidate Short ID tagline
  const getCandidateIdTag = (id: string) => {
    return id.replace(/-/g, '').slice(0, 8) + "..."
  }

  // Stage Text Styles (No background, clean vibrant text)
  const getStageTag = (stage: string) => {
    const s = normalizeStage(stage)
    switch (s) {
      case 'Interview':
        return 'text-amber-500 dark:text-amber-400'
      case 'Training':
        return 'text-blue-500 dark:text-blue-400'
      case 'On Hold':
        return 'text-orange-500 dark:text-orange-400'
      case 'Hired':
        return 'text-emerald-600 dark:text-emerald-400'
      case 'Rejected':
        return 'text-rose-500 dark:text-rose-400'
      default:
        return 'text-slate-500 dark:text-slate-400'
    }
  }

  // Helper to auto-create employee in directory when hired
  const autoAddCandidateToEmployees = async (candidate: {
    id?: string
    full_name: string
    role_applied: string
    phone?: string
    email?: string
    notes?: string
    status?: string
    [key: string]: any
  }) => {
    try {
      const orgId = currentUser?.tenantId || ""
      const alreadyExists = hrEmployees.some(emp => 
        (candidate.email && emp.email && emp.email.trim().toLowerCase() === candidate.email.trim().toLowerCase()) ||
        (emp.full_name.trim().toLowerCase() === candidate.full_name.trim().toLowerCase() && (!emp.organization_id || emp.organization_id === orgId))
      )

      if (alreadyExists) {
        toast.info(`${candidate.full_name} is already registered in the Employees directory.`)
        return
      }

      const todayDate = new Date().toISOString().split('T')[0]
      const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(candidate.full_name)}&background=random&color=fff&size=150`
      const emailToUse = candidate.email?.trim() || `${candidate.full_name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@company.local`

      const salaryToNum = Number(candidate.salary_pitch?.replace(/[^0-9.]/g, ''))
      const commissionToNum = Number(candidate.commission_pitch?.replace(/[^0-9.]/g, ''))

      const probationEnd = new Date()
      probationEnd.setDate(probationEnd.getDate() + 7)
      const probationEndDate = probationEnd.toISOString().split('T')[0]

      await addHREmployee({
        full_name: candidate.full_name,
        email: emailToUse,
        mobile_number: candidate.phone || "",
        job_title: candidate.role_applied || "Agent",
        role: "Agent",
        team: "",
        joining_date: todayDate,
        employment_type: "Probation",
        probation_end_date: probationEndDate,
        base_salary: !isNaN(salaryToNum) && salaryToNum > 0 ? salaryToNum : 30000,
        bonus: 0,
        commission_per_sale: !isNaN(commissionToNum) && commissionToNum > 0 ? commissionToNum : 50,
        status: "Documents Missing",
        avatar_url: avatarUrl,
        organization_id: orgId
      })

      toast.success(`🎉 ${candidate.full_name} has been hired and automatically added to Employees with joining date ${todayDate}!`)
    } catch (err: any) {
      console.error("Auto-add candidate to employees failed:", err)
    }
  }

  // Reset form
  const resetForm = () => {
    setFullName("")
    setRoleApplied("")
    setEnglishLevel("")
    setPhone("")
    setEmail("")
    setStatus("Interview")
    setNotes("")
    setSalaryPitch("")
    setCommissionPitch("")
    setSelectedCandidate(null)
  }

  // Modal Open Handlers
  const handleOpenAddModal = (presetStage: string = "Interview") => {
    resetForm()
    setStatus(normalizeStage(presetStage))
    setEnglishLevel("")
    setIsAddModalOpen(true)
  }

  const handleOpenEditModal = (candidate: HRCandidate) => {
    setSelectedCandidate(candidate)
    setFullName(candidate.full_name)
    setRoleApplied(candidate.role_applied)
    setEnglishLevel(candidate.english_level || extractEnglishLevel(candidate) || "")
    setPhone(candidate.phone || "")
    setEmail(candidate.email || "")
    setStatus(normalizeStage(candidate.status))
    setNotes(getCleanNotes(candidate.notes))
    setSalaryPitch(candidate.salary_pitch || "")
    setCommissionPitch(candidate.commission_pitch || "")
    setIsEditModalOpen(true)
  }

  const handleSeeDetails = (candidate: HRCandidate) => {
    setSelectedCandidate(candidate)
    setIsDetailDrawerOpen(true)
  }

  // Add Candidate
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim() || !roleApplied.trim()) {
      toast.error("Candidate name and role are required")
      return
    }

    setIsSubmitting(true)
    try {
      const candidatePayload = {
        full_name: fullName.trim(),
        role_applied: roleApplied.trim(),
        english_level: englishLevel.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        notes: notes.trim() || undefined,
        salary_pitch: salaryPitch.trim() || undefined,
        commission_pitch: commissionPitch.trim() || undefined,
        status: status || 'Interview'
      }

      await addHRCandidate(candidatePayload)

      if (status === 'Hired') {
        await autoAddCandidateToEmployees(candidatePayload)
      }

      setIsAddModalOpen(false)
      resetForm()
    } catch (err) {
      // Handled in context
    } finally {
      setIsSubmitting(false)
    }
  }

  // Edit Candidate
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCandidate || !fullName.trim() || !roleApplied.trim()) return

    setIsSubmitting(true)
    try {
      const updatedPayload = {
        full_name: fullName.trim(),
        role_applied: roleApplied.trim(),
        english_level: englishLevel.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        notes: notes.trim() || undefined,
        salary_pitch: salaryPitch.trim() || undefined,
        commission_pitch: commissionPitch.trim() || undefined,
        status: status
      }

      await updateHRCandidate(selectedCandidate.id, updatedPayload)

      if (status === "Hired" && normalizeStage(selectedCandidate.status) !== "Hired") {
        await autoAddCandidateToEmployees({ ...selectedCandidate, ...updatedPayload })
      }

      setIsEditModalOpen(false)
      resetForm()
    } catch (err) {
      // Handled in context
    } finally {
      setIsSubmitting(false)
    }
  }

  // Quick Advance Stage
  const handleAdvanceStage = async (candidate: HRCandidate) => {
    const current = normalizeStage(candidate.status)
    let nextStage: PipelineStage = 'Training'
    
    if (current === 'Interview') nextStage = 'Training'
    else if (current === 'Training') nextStage = 'Hired'
    else if (current === 'On Hold') nextStage = 'Interview'
    else if (current === 'Rejected') nextStage = 'Interview'
    else if (current === 'Hired') nextStage = 'Interview'

    await handleStatusChange(candidate.id, nextStage)
  }

  // Quick Status change
  const handleStatusChange = async (id: string, newStatus: string) => {
    const candidate = hrCandidates.find(c => c.id === id)
    const normalizedNewStatus = normalizeStage(newStatus)

    await updateHRCandidate(id, { status: normalizedNewStatus })
    toast.success(`${candidate?.full_name || 'Candidate'} moved to ${normalizedNewStatus}`)

    if (normalizedNewStatus === "Hired" && candidate && normalizeStage(candidate.status) !== "Hired") {
      await autoAddCandidateToEmployees({ ...candidate, status: "Hired" })
    }
  }

  // Delete Candidate
  const handleDelete = async (candidate: HRCandidate) => {
    if (confirm(`Are you sure you want to completely delete ${candidate.full_name}? This action cannot be undone.`)) {
      await deleteHRCandidate(candidate.id)
      if (selectedCandidate?.id === candidate.id) {
        setIsDetailDrawerOpen(false)
      }
    }
  }

  if (!isLoaded) {
    return (
      <DashboardLayout title="Recruitment Pipeline">
        <div className="flex items-center justify-center h-[50vh]">
          <div className="w-6 h-6 border-2 border-[#ff5a36] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Recruitment Pipeline">
      <div className="relative flex flex-col gap-5 font-sans w-full pb-10 min-h-screen overflow-x-hidden max-w-full">

        {/* =========================================================================
            HEADER CARD
            ========================================================================= */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-gradient-to-br from-white/90 to-white/50 dark:from-slate-900/60 dark:to-slate-900/20 p-6 rounded-[1.5rem] border border-white/60 dark:border-slate-700/50 shadow-none backdrop-blur-xl relative overflow-hidden group transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full duration-1000 transition-transform pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-1">
              <div className="bg-[#ff5a36]/10 dark:bg-[#ff5a36]/20 p-2 rounded-xl text-[#ff5a36]">
                <Users className="w-5 h-5" />
              </div>
              <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Recruitment Pipeline</h1>
            </div>
            <p className="text-slate-500 text-sm">Add, update, track, interview or hire candidate applicants.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Search Input */}
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input 
                type="text" 
                placeholder="Search candidates..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-full h-9 text-sm w-full sm:w-64 shadow-none focus-visible:ring-1 focus-visible:ring-[#ff5a36]" 
              />
            </div>
            
            {/* Compact Inline Filters */}
            <select 
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="h-9 px-3 pr-8 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full outline-none focus:ring-1 focus:ring-[#ff5a36]/50 transition-all text-slate-700 dark:text-slate-300 cursor-pointer appearance-none"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
            >
              <option value="All">All Stages</option>
              {STAGES.map(stage => (
                <option key={stage} value={stage}>{stage}</option>
              ))}
            </select>

            <select 
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-9 px-3 pr-8 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full outline-none focus:ring-1 focus:ring-[#ff5a36]/50 transition-all text-slate-700 dark:text-slate-300 cursor-pointer appearance-none max-w-[140px]"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
            >
              <option value="All">All Roles</option>
              {uniqueRoles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>

            {(stageFilter !== "All" || roleFilter !== "All") && (
              <button
                onClick={() => {
                  setStageFilter("All")
                  setRoleFilter("All")
                  setSearchQuery("")
                }}
                className="h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-slate-400 hover:text-rose-500 flex items-center justify-center transition-colors shrink-0"
                title="Clear Filters"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {/* View Mode Switcher */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-full">
              <button 
                onClick={() => setViewMode("board")}
                className={`p-1.5 rounded-full transition-all ${viewMode === "board" ? "bg-white dark:bg-slate-700 shadow-none text-slate-800 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
                title="Pipeline Board"
              >
                <Columns3 className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-full transition-all ${viewMode === "list" ? "bg-white dark:bg-slate-700 shadow-none text-slate-800 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
                title="Table List"
              >
                <List className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode("card")}
                className={`p-1.5 rounded-full transition-all ${viewMode === "card" ? "bg-white dark:bg-slate-700 shadow-none text-slate-800 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
                title="Cards Grid"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            {/* Add Candidate Button */}
            <Button 
              onClick={() => handleOpenAddModal("Interview")}
              className="bg-[#ff5a36] hover:bg-[#e04a29] text-white rounded-full h-9 px-4 shadow-none w-full sm:w-auto transition-all"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Candidate
            </Button>
          </div>
        </div>

        {/* =========================================================================
            VIEW 1: PIPELINE BOARD (Responsive 5-column layout without horizontal scroll)
            ========================================================================= */}
        {viewMode === "board" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5 w-full items-start">
            {STAGES.map(stage => {
              const stageCandidates = filteredCandidates.filter(c => normalizeStage(c.status) === stage)
              const isOver = draggedOverStage === stage
              const stageTagClass = getStageTag(stage)

              return (
                <div 
                  key={stage} 
                  className="w-full flex flex-col gap-3 min-w-0"
                  onDragOver={(e) => {
                    e.preventDefault()
                    setDraggedOverStage(stage)
                  }}
                  onDragLeave={() => {
                    setDraggedOverStage(null)
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    setDraggedOverStage(null)
                    const candidateId = e.dataTransfer.getData('candidateId')
                    if (candidateId) {
                      handleStatusChange(candidateId, stage)
                    }
                  }}
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between bg-white/80 dark:bg-slate-900/60 backdrop-blur-md p-3.5 rounded-[1.25rem] border border-slate-200/60 dark:border-slate-800 shadow-none">
                    <div className="flex items-center gap-2">
                      <span className={`text-[12px] font-extrabold tracking-tight ${stageTagClass}`}>
                        {stage}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold px-2 py-0.5 rounded-full border border-slate-200/60 dark:border-slate-700">
                        {stageCandidates.length}
                      </span>
                      <button
                        onClick={() => handleOpenAddModal(stage)}
                        className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-[#ff5a36] hover:text-white dark:hover:bg-[#ff5a36] flex items-center justify-center text-slate-500 transition-colors text-xs font-bold"
                        title={`Add applicant to ${stage}`}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Candidates Cards Column */}
                  <div className={cn(
                    "flex flex-col gap-3 min-h-[350px] p-1 rounded-[1.25rem] transition-all",
                    isOver ? "bg-orange-50/50 dark:bg-orange-950/20 border-2 border-dashed border-[#ff5a36]" : ""
                  )}>
                    {stageCandidates.map((candidate) => {
                      const avatarBg = getAvatarColor(candidate.id)
                      const initials = getInitials(candidate.full_name)
                      const normStatus = normalizeStage(candidate.status)
                      const engLevel = extractEnglishLevel(candidate)
                      const cleanNotes = getCleanNotes(candidate.notes)

                      return (
                        <div
                          key={candidate.id}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('candidateId', candidate.id)
                          }}
                          onClick={() => handleSeeDetails(candidate)}
                          className="group relative rounded-[1.25rem] bg-white/95 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 p-3.5 flex flex-col gap-2.5 transition-all hover:bg-white dark:hover:bg-slate-800/95 hover:border-slate-300 dark:hover:border-slate-700 shadow-none cursor-pointer select-none"
                        >
                          {/* Top: Avatar + Candidate Name & Role + Quick Actions */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <div className={`w-8 h-8 rounded-xl ${avatarBg} flex items-center justify-center font-bold text-xs shrink-0 shadow-none`}>
                                {initials}
                              </div>
                              
                              <div className="flex flex-col min-w-0 flex-1">
                                <h4 className="font-bold text-sm text-slate-800 dark:text-white group-hover:text-[#ff5a36] transition-colors truncate">
                                  {candidate.full_name}
                                </h4>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                                    {candidate.role_applied}
                                  </span>
                                  {engLevel && (
                                    <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full border", getEnglishLevelBadge(engLevel))}>
                                      {engLevel}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Quick Action Buttons on Hover */}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={e => e.stopPropagation()}>
                              <button 
                                onClick={() => handleOpenEditModal(candidate)}
                                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-blue-500 transition-colors"
                                title="Edit Candidate"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => handleDelete(candidate)}
                                className="p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 text-slate-400 hover:text-rose-500 transition-colors"
                                title="Delete Candidate"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Contact Info Pills */}
                          {(candidate.phone || candidate.email) && (
                            <div className="flex flex-col gap-1 text-[11px] text-slate-600 dark:text-slate-300">
                              {candidate.phone && (
                                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 truncate">
                                  <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span className="font-mono text-[10px] truncate">{candidate.phone}</span>
                                </div>
                              )}
                              {candidate.email && (
                                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 truncate">
                                  <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span className="text-[10px] truncate">{candidate.email}</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Interview Notes Preview snippet (only if clean user notes exist) */}
                          {cleanNotes && (
                            <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-600 dark:text-slate-300 italic line-clamp-2 leading-relaxed flex items-start gap-1.5">
                              <MessageSquare className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                              <span className="truncate flex-1">{cleanNotes}</span>
                            </div>
                          )}

                          {/* Footer: Date + Quick Advance / Action */}
                          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/80 mt-auto">
                            <div className="flex items-center gap-1 text-slate-400">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>
                                {new Date(candidate.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                              </span>
                            </div>

                            <div onClick={e => e.stopPropagation()}>
                              {normStatus === 'Interview' && (
                                <button
                                  onClick={() => handleStatusChange(candidate.id, 'Training')}
                                  className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 px-2 py-0.5 rounded-md transition-colors flex items-center gap-1"
                                  title="Move to Training stage"
                                >
                                  Training <ArrowRight className="w-2.5 h-2.5" />
                                </button>
                              )}
                              {normStatus === 'Training' && (
                                <button
                                  onClick={() => handleStatusChange(candidate.id, 'Hired')}
                                  className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 px-2 py-0.5 rounded-md transition-colors flex items-center gap-1"
                                  title="Hire candidate & add to Employees directory"
                                >
                                  Hire <CheckCircle2 className="w-2.5 h-2.5" />
                                </button>
                              )}
                              {normStatus === 'Hired' && (
                                <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md flex items-center gap-1">
                                  <CheckCircle2 className="w-2.5 h-2.5" /> In Employees
                                </span>
                              )}
                              {normStatus === 'On Hold' && (
                                <button
                                  onClick={() => handleStatusChange(candidate.id, 'Interview')}
                                  className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 px-2 py-0.5 rounded-md transition-colors flex items-center gap-1"
                                  title="Resume Interview"
                                >
                                  Interview <ArrowRight className="w-2.5 h-2.5" />
                                </button>
                              )}
                              {normStatus === 'Rejected' && (
                                <button
                                  onClick={() => handleStatusChange(candidate.id, 'Interview')}
                                  className="text-[10px] font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md transition-colors"
                                  title="Re-open candidate"
                                >
                                  Re-open
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}

                    {/* Empty Stage Placeholder */}
                    {stageCandidates.length === 0 && (
                      <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[1.25rem] h-32 flex flex-col items-center justify-center gap-1 text-xs text-slate-400 bg-white/30 dark:bg-slate-900/20 font-medium">
                        <Layers className="w-5 h-5 text-slate-300 dark:text-slate-700" />
                        Drop candidate here
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* =========================================================================
            VIEW 2: TABLE LIST
            ========================================================================= */}
        {viewMode === "list" && (
          <Card className="rounded-[1.75rem] border border-white/60 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 backdrop-blur-2xl overflow-hidden shadow-none">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/40 dark:border-slate-800/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/50 dark:bg-slate-800/40">
                    <th className="py-4 px-6 font-bold">Candidate</th>
                    <th className="py-4 px-6 font-bold">Role & Level</th>
                    <th className="py-4 px-6 font-bold">Stage</th>
                    <th className="py-4 px-6 font-bold">Applied</th>
                    <th className="py-4 px-6 font-bold text-center">Status</th>
                    <th className="py-4 px-6 text-right font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCandidates.map((candidate, i) => {
                    const isLast = i === filteredCandidates.length - 1
                    const avatarBg = getAvatarColor(candidate.id)
                    const initials = getInitials(candidate.full_name)
                    const idTag = getCandidateIdTag(candidate.id)
                    const normStatus = normalizeStage(candidate.status)
                    const stageTagClass = getStageTag(normStatus)
                    const engLevel = extractEnglishLevel(candidate)

                    return (
                      <tr 
                        key={candidate.id} 
                        className={`group hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors ${!isLast ? 'border-b border-white/30 dark:border-slate-700/30' : ''}`}
                      >
                        {/* Candidate Column: Avatar + Name + ID Tagline */}
                        <td className="py-3 px-6">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full ${avatarBg} flex items-center justify-center font-bold text-xs shrink-0 shadow-none`}>
                              {initials}
                            </div>
                            <div className="flex flex-col">
                              <span 
                                onClick={() => handleSeeDetails(candidate)}
                                className="font-bold text-slate-800 dark:text-white flex items-center gap-2 hover:text-[#ff5a36] cursor-pointer transition-colors"
                              >
                                {candidate.full_name}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono" title={candidate.id}>
                                {idTag}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Role Column */}
                        <td className="py-3 px-6">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                              {candidate.role_applied}
                            </span>
                            {engLevel && (
                              <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", getEnglishLevelBadge(engLevel))}>
                                {engLevel}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Stage / Type Badge Column */}
                        <td className="py-3 px-6">
                          <span className={`text-xs font-extrabold ${stageTagClass}`}>
                            {normStatus}
                          </span>
                        </td>

                        {/* Applied Date Column */}
                        <td className="py-3 px-6">
                          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                            {new Date(candidate.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        </td>

                        {/* Status Column */}
                        <td className="py-3 px-6 text-center">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                            <UserCheck className="w-3 h-3" />
                            Active
                          </span>
                        </td>

                        {/* Actions Column */}
                        <td className="py-3 px-6 text-right">
                          <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            {normStatus !== "Hired" && (
                              <button 
                                onClick={() => handleAdvanceStage(candidate)}
                                className="px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-amber-500 hover:text-amber-600 hover:scale-105 hover:-translate-y-0.5 transform transition-all duration-200 bg-transparent"
                                title="Advance Stage"
                              >
                                {normStatus === "Interview" ? "TRAINING" : normStatus === "Training" ? "HIRE" : "INTERVIEW"}
                              </button>
                            )}
                            <button 
                              onClick={() => handleSeeDetails(candidate)}
                              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:scale-110 hover:-translate-y-0.5 transform transition-all duration-200 bg-transparent"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleOpenEditModal(candidate)}
                              className="p-1 text-blue-500 hover:text-blue-600 hover:scale-110 hover:-translate-y-0.5 transform transition-all duration-200 bg-transparent"
                              title="Edit Candidate"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDelete(candidate)}
                              className="p-1 text-rose-500 hover:text-rose-600 hover:scale-110 hover:-translate-y-0.5 transform transition-all duration-200 bg-transparent"
                              title="Delete Candidate"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}

                  {filteredCandidates.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-500">
                        No candidates found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* =========================================================================
            VIEW 3: CARDS GRID
            ========================================================================= */}
        {viewMode === "card" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full">
            {filteredCandidates.map((candidate) => {
              const avatarBg = getAvatarColor(candidate.id)
              const initials = getInitials(candidate.full_name)
              const idTag = getCandidateIdTag(candidate.id)
              const normStatus = normalizeStage(candidate.status)
              const stageTagClass = getStageTag(normStatus)
              const engLevel = extractEnglishLevel(candidate)
              const cleanNotes = getCleanNotes(candidate.notes)

              return (
                <div 
                  key={candidate.id} 
                  onClick={() => handleSeeDetails(candidate)}
                  className="group relative rounded-[1.5rem] bg-white/80 dark:bg-slate-900/50 backdrop-blur-2xl border border-slate-200/60 dark:border-slate-700/50 p-5 flex flex-col gap-3.5 transition-all hover:bg-white dark:hover:bg-slate-800/80 shadow-none cursor-pointer select-none"
                >
                  {/* Top: Avatar + Name + Role + Actions */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`w-11 h-11 rounded-2xl ${avatarBg} flex items-center justify-center font-extrabold text-sm shadow-none shrink-0`}>
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-slate-800 dark:text-white tracking-tight group-hover:text-[#ff5a36] transition-colors truncate">
                          {candidate.full_name}
                        </h3>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                            {candidate.role_applied}
                          </p>
                          {engLevel && (
                            <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full border", getEnglishLevelBadge(engLevel))}>
                              {engLevel}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                      <button 
                        onClick={() => handleOpenEditModal(candidate)}
                        className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-blue-500 transition-colors"
                        title="Edit Candidate"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => handleDelete(candidate)}
                        className="p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 text-slate-400 hover:text-rose-500 transition-colors"
                        title="Delete Candidate"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="flex flex-col gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                    {candidate.phone && (
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-mono text-xs">{candidate.phone}</span>
                      </div>
                    )}
                    {candidate.email && (
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-xs truncate">{candidate.email}</span>
                      </div>
                    )}
                  </div>

                  {/* Interview Notes Preview snippet */}
                  {cleanNotes && (
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80 text-xs text-slate-600 dark:text-slate-300 italic line-clamp-2 leading-relaxed flex items-start gap-2">
                      <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="truncate flex-1">{cleanNotes}</span>
                    </div>
                  )}

                  {/* Footer: Applied Date + Stage Tag */}
                  <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-100 dark:border-slate-800/80 mt-auto">
                    <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {new Date(candidate.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                    <span className={`text-xs font-extrabold ${stageTagClass}`}>
                      {normStatus}
                    </span>
                  </div>
                </div>
              )
            })}

            {filteredCandidates.length === 0 && (
              <div className="col-span-full py-20 text-center text-slate-500">
                No candidates found matching your search.
              </div>
            )}
          </div>
        )}

      </div>

      {/* =========================================================================
          ADD CANDIDATE MODAL
          ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div 
            className="bg-white dark:bg-[#111928] w-full max-w-xl rounded-[2rem] p-6 shadow-2xl relative border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#ff5a36]/10 text-[#ff5a36] flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Add New Candidate</h3>
                  <p className="text-xs text-slate-500">Add an applicant into the recruitment pipeline</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Full Name *</label>
                <input 
                  type="text" 
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="e.g. Abbas Afzal"
                  required
                  className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 rounded-xl h-10 px-4 text-sm focus:ring-2 focus:ring-[#ff5a36] outline-none text-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Role Applied *</label>
                  <select
                    value={roleApplied}
                    onChange={e => setRoleApplied(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 rounded-xl h-10 px-3 text-sm focus:ring-2 focus:ring-[#ff5a36] outline-none text-slate-800 dark:text-white"
                  >
                    <option value="" disabled>Select Role</option>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">English Level</label>
                  <select
                    value={englishLevel}
                    onChange={e => setEnglishLevel(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 rounded-xl h-10 px-3 text-sm focus:ring-2 focus:ring-[#ff5a36] outline-none text-slate-800 dark:text-white"
                  >
                    <option value="">Not Specified</option>
                    {ENGLISH_LEVELS.map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Stage</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 rounded-xl h-10 px-3 text-sm focus:ring-2 focus:ring-[#ff5a36] outline-none text-slate-800 dark:text-white"
                  >
                    {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Phone Number</label>
                  <input 
                    type="tel" 
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+92 300 1234567"
                    className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 rounded-xl h-10 px-4 text-sm focus:ring-2 focus:ring-[#ff5a36] outline-none text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Email Address</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="candidate@example.com"
                    className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 rounded-xl h-10 px-4 text-sm focus:ring-2 focus:ring-[#ff5a36] outline-none text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Salary Pitch (Base)</label>
                  <input 
                    type="text" 
                    value={salaryPitch}
                    onChange={e => setSalaryPitch(e.target.value)}
                    placeholder="e.g. 50000"
                    className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 rounded-xl h-10 px-4 text-sm focus:ring-2 focus:ring-[#ff5a36] outline-none text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Commission Pitch</label>
                  <input 
                    type="text" 
                    value={commissionPitch}
                    onChange={e => setCommissionPitch(e.target.value)}
                    placeholder="e.g. 100 per sale"
                    className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 rounded-xl h-10 px-4 text-sm focus:ring-2 focus:ring-[#ff5a36] outline-none text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Interview Notes / Summary</label>
                <textarea 
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Experience, interview rating, skills..."
                  rows={2}
                  className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#ff5a36] outline-none text-slate-800 dark:text-white resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 mt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2 rounded-full text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 rounded-full text-xs font-bold bg-[#ff5a36] hover:bg-[#e04a29] text-white transition-all shadow-[0_4px_10px_rgba(255,90,54,0.3)] disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Add to Pipeline"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          EDIT CANDIDATE MODAL
          ========================================================================= */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div 
            className="bg-white dark:bg-[#111928] w-full max-w-xl rounded-[2rem] p-6 shadow-2xl relative border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#ff5a36]/10 text-[#ff5a36] flex items-center justify-center">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Edit Candidate</h3>
                  <p className="text-xs text-slate-500">Update candidate details and pipeline status</p>
                </div>
              </div>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Full Name *</label>
                <input 
                  type="text" 
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 rounded-xl h-10 px-4 text-sm focus:ring-2 focus:ring-[#ff5a36] outline-none text-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Role Applied *</label>
                  <select
                    value={roleApplied}
                    onChange={e => setRoleApplied(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 rounded-xl h-10 px-3 text-sm focus:ring-2 focus:ring-[#ff5a36] outline-none text-slate-800 dark:text-white"
                  >
                    <option value="" disabled>Select Role</option>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">English Level</label>
                  <select
                    value={englishLevel}
                    onChange={e => setEnglishLevel(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 rounded-xl h-10 px-3 text-sm focus:ring-2 focus:ring-[#ff5a36] outline-none text-slate-800 dark:text-white"
                  >
                    <option value="">Not Specified</option>
                    {ENGLISH_LEVELS.map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Stage</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 rounded-xl h-10 px-3 text-sm focus:ring-2 focus:ring-[#ff5a36] outline-none text-slate-800 dark:text-white"
                  >
                    {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Phone Number</label>
                  <input 
                    type="tel" 
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 rounded-xl h-10 px-4 text-sm focus:ring-2 focus:ring-[#ff5a36] outline-none text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Email Address</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 rounded-xl h-10 px-4 text-sm focus:ring-2 focus:ring-[#ff5a36] outline-none text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Salary Pitch (Base)</label>
                  <input 
                    type="text" 
                    value={salaryPitch}
                    onChange={e => setSalaryPitch(e.target.value)}
                    placeholder="e.g. 50000"
                    className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 rounded-xl h-10 px-4 text-sm focus:ring-2 focus:ring-[#ff5a36] outline-none text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Commission Pitch</label>
                  <input 
                    type="text" 
                    value={commissionPitch}
                    onChange={e => setCommissionPitch(e.target.value)}
                    placeholder="e.g. 100 per sale"
                    className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 rounded-xl h-10 px-4 text-sm focus:ring-2 focus:ring-[#ff5a36] outline-none text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Interview Notes / Summary</label>
                <textarea 
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Experience, interview rating, skills..."
                  rows={2}
                  className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#ff5a36] outline-none text-slate-800 dark:text-white resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 mt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-5 py-2 rounded-full text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 rounded-full text-xs font-bold bg-[#ff5a36] hover:bg-[#e04a29] text-white transition-all shadow-[0_4px_10px_rgba(255,90,54,0.3)] disabled:opacity-50"
                >
                  {isSubmitting ? "Updating..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          CANDIDATE DETAIL DRAWER
          ========================================================================= */}
      {isDetailDrawerOpen && selectedCandidate && (() => {
        const engLevel = extractEnglishLevel(selectedCandidate)
        const cleanNotes = getCleanNotes(selectedCandidate.notes)

        return (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-end">
            <div 
              className="bg-white dark:bg-[#111928] w-full max-w-md h-full p-6 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200"
              onClick={e => e.stopPropagation()}
            >
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                  <span className="font-mono text-xs font-bold text-[#ff5a36] bg-[#ff5a36]/10 px-2.5 py-1 rounded-full">
                    {getCandidateIdTag(selectedCandidate.id)}
                  </span>
                  <button
                    onClick={() => setIsDetailDrawerOpen(false)}
                    className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-4 mt-6">
                  <div className={`w-14 h-14 rounded-2xl ${getAvatarColor(selectedCandidate.id)} flex items-center justify-center font-extrabold text-xl shadow-md`}>
                    {getInitials(selectedCandidate.full_name)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{selectedCandidate.full_name}</h3>
                    <p className="text-sm font-semibold text-slate-500">{selectedCandidate.role_applied}</p>
                  </div>
                </div>

                {/* Status Selector */}
                <div className="mt-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Stage Status</label>
                  <div className="grid grid-cols-2 gap-2">
                    {STAGES.map(s => {
                      const isCurrent = normalizeStage(selectedCandidate.status) === s
                      return (
                        <button
                          key={s}
                          onClick={async () => {
                            await handleStatusChange(selectedCandidate.id, s)
                            setSelectedCandidate(prev => prev ? { ...prev, status: s } : null)
                          }}
                          className={cn(
                            "py-2 px-3 rounded-xl text-xs font-bold text-left transition-all flex items-center justify-between",
                            isCurrent
                              ? "bg-[#ff5a36] text-white shadow-sm shadow-[#ff5a36]/30"
                              : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600"
                          )}
                        >
                          {s}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Details List */}
                <div className="mt-6 space-y-4">
                  <div className="p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900/30 space-y-3">
                    {engLevel && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-medium">English Proficiency</span>
                        <span className={cn("text-[11px] font-bold px-2.5 py-0.5 rounded-full border", getEnglishLevelBadge(engLevel))}>
                          {engLevel}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">Phone</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-white">
                        {selectedCandidate.phone || "Not provided"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">Email</span>
                      <span className="font-semibold text-slate-800 dark:text-white truncate max-w-[200px]">
                        {selectedCandidate.email || "Not provided"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">Applied Date</span>
                      <span className="font-semibold text-slate-800 dark:text-white">
                        {new Date(selectedCandidate.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  {cleanNotes && (
                    <div className="p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Interviewer Notes</span>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic">
                        "{cleanNotes}"
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                <button
                  onClick={() => {
                    setIsDetailDrawerOpen(false)
                    handleOpenEditModal(selectedCandidate)
                  }}
                  className="flex-1 bg-[#18181b] hover:bg-black dark:bg-white dark:text-slate-900 text-white font-bold py-3 rounded-full text-xs transition-colors flex items-center justify-center gap-2"
                >
                  <Edit className="w-4 h-4 text-[#ff5a36]" />
                  Edit Candidate
                </button>
                <button
                  onClick={() => handleDelete(selectedCandidate)}
                  className="p-3 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/30 dark:hover:bg-rose-900/50 rounded-full transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )
      })()}

    </DashboardLayout>
  )
}
