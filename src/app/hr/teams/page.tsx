"use client"

import React, { useState, useMemo, useRef, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card } from "@/components/ui/card"
import { useAppContext, HREmployee, Team } from "@/store/AppContext"
import {
  Network,
  Plus,
  Users,
  Edit3,
  Trash2,
  X,
  Search,
  FolderOpen,
  UserPlus,
  UserMinus,
  Check,
  ChevronRight,
  Banknote,
  ClipboardList,
  FileText,
  Briefcase
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function HRTeamsPage() {
  const {
    teams,
    hrEmployees,
    currentUser,
    isLoaded,
    addTeam,
    updateTeam,
    deleteTeam,
    updateHREmployee,
    formatCurrency
  } = useAppContext()

  // Create / Edit modal
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [teamName, setTeamName] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  // Assign members panel
  const [assigningTeam, setAssigningTeam] = useState<Team | null>(null)
  const [memberSearch, setMemberSearch] = useState("")
  const [assigningIds, setAssigningIds] = useState<Set<string>>(new Set())

  // Delete confirm
  const [deletingTeam, setDeletingTeam] = useState<Team | null>(null)

  // Organization employees
  const tenantEmployees = useMemo(() => {
    if (!currentUser) return []
    return (currentUser.role === "SuperAdmin"
      ? hrEmployees
      : hrEmployees.filter(u => u.organization_id === currentUser.tenantId)
    ).filter(u => u.status !== "Disabled" && u.role !== "SuperAdmin")
  }, [hrEmployees, currentUser])

  // Organization teams
  const orgTeams = useMemo(() => {
    if (!currentUser) return []
    return currentUser.role === "SuperAdmin"
      ? teams
      : teams.filter(t => t.organization_id === currentUser.tenantId)
  }, [teams, currentUser])

  // Members per team
  const teamMembers = useMemo(() => {
    const map = new Map<string, HREmployee[]>()
    orgTeams.forEach(t => {
      map.set(t.id, tenantEmployees.filter(e => e.team_id === t.id))
    })
    return map
  }, [orgTeams, tenantEmployees])

  // Unassigned employees
  const unassignedEmployees = useMemo(() => {
    const teamIds = new Set(orgTeams.map(t => t.id))
    return tenantEmployees.filter(e => !e.team_id || !teamIds.has(e.team_id))
  }, [tenantEmployees, orgTeams])

  // Team payroll
  const getTeamPayroll = (teamId: string) => {
    const members = teamMembers.get(teamId) || []
    return members.reduce((sum, m) => sum + (Number(m.base_salary) || 0), 0)
  }

  // ─── Create / Edit handlers ───
  const handleOpenCreate = () => {
    setTeamName("")
    setEditingTeam(null)
    setShowCreateModal(true)
  }

  const handleOpenEdit = (team: Team) => {
    setTeamName(team.name)
    setEditingTeam(team)
    setShowCreateModal(true)
  }

  const handleSaveTeam = async () => {
    if (isSaving) return
    if (!teamName.trim()) {
      toast.error("Please enter a team name")
      return
    }
    if (!currentUser?.tenantId && currentUser?.role !== "SuperAdmin") return

    setIsSaving(true)
    try {
      const orgId = currentUser!.tenantId || ""
      if (editingTeam) {
        await updateTeam(editingTeam.id, teamName.trim(), editingTeam.organization_id)
        toast.success(`Team renamed to "${teamName.trim()}"`)
      } else {
        await addTeam(teamName.trim(), orgId)
      }
      setShowCreateModal(false)
      setTeamName("")
      setEditingTeam(null)
    } catch (err: any) {
      // toast handled in context
    } finally {
      setIsSaving(false)
    }
  }

  // ─── Delete handler ───
  const handleConfirmDelete = async () => {
    if (!deletingTeam) return
    try {
      // Unassign all members first
      const members = teamMembers.get(deletingTeam.id) || []
      for (const emp of members) {
        await updateHREmployee(emp.id, { team_id: null } as any)
      }
      await deleteTeam(deletingTeam.id)
      toast.success(`Team "${deletingTeam.name}" deleted`)
      setDeletingTeam(null)
    } catch (err: any) {
      toast.error("Failed to delete team")
    }
  }

  // ─── Assign members handlers ───
  const handleOpenAssign = (team: Team) => {
    const currentMembers = teamMembers.get(team.id) || []
    setAssigningIds(new Set(currentMembers.map(m => m.id)))
    setAssigningTeam(team)
    setMemberSearch("")
  }

  const handleToggleMember = (empId: string) => {
    setAssigningIds(prev => {
      const next = new Set(prev)
      if (next.has(empId)) {
        next.delete(empId)
      } else {
        next.add(empId)
      }
      return next
    })
  }

  const handleSaveAssignments = async () => {
    if (!assigningTeam) return
    setIsSaving(true)
    try {
      // Get current members
      const currentMembers = teamMembers.get(assigningTeam.id) || []
      const currentIds = new Set(currentMembers.map(m => m.id))

      // Find additions and removals
      const toAdd = [...assigningIds].filter(id => !currentIds.has(id))
      const toRemove = [...currentIds].filter(id => !assigningIds.has(id))

      // Apply changes
      for (const id of toAdd) {
        await updateHREmployee(id, { team_id: assigningTeam.id, team: assigningTeam.name } as any)
      }
      for (const id of toRemove) {
        await updateHREmployee(id, { team_id: null, team: "" } as any)
      }

      const totalChanges = toAdd.length + toRemove.length
      if (totalChanges > 0) {
        toast.success(`Updated ${totalChanges} member assignment(s)`)
      }
      setAssigningTeam(null)
    } catch (err: any) {
      toast.error("Failed to update assignments")
    } finally {
      setIsSaving(false)
    }
  }

  // Filtered employees for assignment panel
  const assignableEmployees = useMemo(() => {
    return tenantEmployees.filter(e => {
      if (!memberSearch.trim()) return true
      const q = memberSearch.toLowerCase()
      return e.full_name.toLowerCase().includes(q) ||
        (e.job_title || "").toLowerCase().includes(q) ||
        (e.zk_user_id || "").toLowerCase().includes(q)
    }).sort((a, b) => {
      // Show assigned first
      const aAssigned = assigningIds.has(a.id) ? 0 : 1
      const bAssigned = assigningIds.has(b.id) ? 0 : 1
      if (aAssigned !== bAssigned) return aAssigned - bAssigned
      return a.full_name.localeCompare(b.full_name)
    })
  }, [tenantEmployees, memberSearch, assigningIds])

  if (!isLoaded || !currentUser) {
    return (
      <DashboardLayout title="Teams">
        <div className="flex items-center justify-center h-[50vh]">
          <div className="w-6 h-6 border-2 border-[#ff5a36] border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Team Management">
      <div className="relative flex flex-col gap-5 font-sans max-w-[1200px] mx-auto w-full pb-10 min-h-screen px-4 md:px-0">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 bg-gradient-to-br from-white/90 to-white/50 dark:from-slate-900/60 dark:to-slate-900/20 p-6 rounded-[1.5rem] border border-white/60 dark:border-slate-700/50 shadow-none backdrop-blur-2xl relative overflow-hidden group transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full duration-1000 transition-transform pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2.5 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                <Network className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Teams
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mt-0.5">
                  Create teams and organize employees into groups. Click a team folder to manage attendance, payroll & salary slips separately.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 bg-[#ff5a36] hover:bg-[#e04a29] text-white rounded-full h-10 px-5 transition-all cursor-pointer font-bold text-sm shadow-lg shadow-[#ff5a36]/20 hover:shadow-[#ff5a36]/30 shrink-0"
          >
            <Plus className="w-4 h-4" />
            Create Team
          </button>
        </div>

        {/* Team Stats Bar */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="rounded-2xl p-4 bg-white/70 dark:bg-slate-900/40 backdrop-blur-2xl border border-slate-200/60 dark:border-slate-700/50 shadow-none flex items-center gap-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl">
              <Network className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Teams</p>
              <p className="text-xl font-extrabold text-slate-800 dark:text-white">{orgTeams.length}</p>
            </div>
          </Card>
          <Card className="rounded-2xl p-4 bg-white/70 dark:bg-slate-900/40 backdrop-blur-2xl border border-slate-200/60 dark:border-slate-700/50 shadow-none flex items-center gap-3">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl">
              <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assigned</p>
              <p className="text-xl font-extrabold text-slate-800 dark:text-white">{tenantEmployees.length - unassignedEmployees.length}</p>
            </div>
          </Card>
          <Card className="rounded-2xl p-4 bg-white/70 dark:bg-slate-900/40 backdrop-blur-2xl border border-slate-200/60 dark:border-slate-700/50 shadow-none flex items-center gap-3">
            <div className="p-2 bg-amber-50 dark:bg-amber-500/10 rounded-xl">
              <Users className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Unassigned</p>
              <p className="text-xl font-extrabold text-slate-800 dark:text-white">{unassignedEmployees.length}</p>
            </div>
          </Card>
        </div>

        {/* Teams Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orgTeams.map(team => {
            const members = teamMembers.get(team.id) || []
            const payroll = getTeamPayroll(team.id)

            return (
              <Card
                key={team.id}
                className="rounded-[1.5rem] bg-white/80 dark:bg-slate-900/50 backdrop-blur-2xl border border-slate-200/60 dark:border-slate-700/50 shadow-none overflow-hidden group/card hover:border-indigo-500/30 dark:hover:border-indigo-500/20 transition-all duration-300"
              >
                {/* Card Header */}
                <div className="p-5 pb-3">
                  <div className="flex items-start justify-between mb-3">
                    <Link href={`/hr/teams/${team.id}`} className="flex items-center gap-3 group/link min-w-0 flex-1">
                      <div className="p-2.5 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 rounded-xl group-hover/link:from-indigo-500/20 group-hover/link:to-purple-500/20 transition-colors shrink-0">
                        <FolderOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-800 dark:text-white text-base group-hover/link:text-indigo-600 dark:group-hover/link:text-indigo-400 transition-colors truncate">
                          {team.name}
                        </h3>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {members.length} member{members.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </Link>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={() => handleOpenAssign(team)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors"
                        title="Manage Members"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(team)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                        title="Rename Team"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingTeam(team)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
                        title="Delete Team"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Payroll & Member Avatars */}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex -space-x-2">
                      {members.slice(0, 5).map(m => (
                        <img
                          key={m.id}
                          src={m.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.full_name)}&background=random&color=fff&size=40`}
                          alt={m.full_name}
                          className="w-7 h-7 rounded-full border-2 border-white dark:border-slate-900 object-cover"
                          title={m.full_name}
                        />
                      ))}
                      {members.length > 5 && (
                        <div className="w-7 h-7 rounded-full border-2 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[9px] font-bold text-slate-500">
                          +{members.length - 5}
                        </div>
                      )}
                      {members.length === 0 && (
                        <span className="text-[11px] text-slate-400 italic">No members yet</span>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Monthly</p>
                      <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                        PKR {formatCurrency(payroll)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick Links Footer */}
                <Link
                  href={`/hr/teams/${team.id}`}
                  className="flex items-center justify-between px-5 py-3 bg-slate-50/80 dark:bg-slate-800/30 border-t border-slate-200/50 dark:border-slate-700/30 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <FolderOpen className="w-3.5 h-3.5" />
                    Open Team Folder
                  </span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </Card>
            )
          })}

          {/* Unassigned Employees Card */}
          {unassignedEmployees.length > 0 && (
            <Card className="rounded-[1.5rem] bg-white/80 dark:bg-slate-900/50 backdrop-blur-2xl border border-dashed border-slate-300/80 dark:border-slate-600/50 shadow-none overflow-hidden">
              <div className="p-5 pb-3">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl">
                    <Users className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-500 dark:text-slate-400 text-base">
                      Unassigned
                    </h3>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {unassignedEmployees.length} employee{unassignedEmployees.length !== 1 ? "s" : ""} without a team
                    </p>
                  </div>
                </div>

                <div className="flex -space-x-2 mt-2">
                  {unassignedEmployees.slice(0, 6).map(m => (
                    <img
                      key={m.id}
                      src={m.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.full_name)}&background=e2e8f0&color=64748b&size=40`}
                      alt={m.full_name}
                      className="w-7 h-7 rounded-full border-2 border-white dark:border-slate-900 object-cover opacity-60"
                      title={m.full_name}
                    />
                  ))}
                  {unassignedEmployees.length > 6 && (
                    <div className="w-7 h-7 rounded-full border-2 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[9px] font-bold text-slate-400">
                      +{unassignedEmployees.length - 6}
                    </div>
                  )}
                </div>
              </div>
              <div className="px-5 py-3 bg-slate-50/80 dark:bg-slate-800/30 border-t border-slate-200/30 dark:border-slate-700/30 text-[11px] text-slate-400 font-medium">
                Assign these employees to a team using the <UserPlus className="w-3 h-3 inline" /> button on any team card.
              </div>
            </Card>
          )}

          {/* Empty State */}
          {orgTeams.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-16">
              <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-4">
                <Network className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">No Teams Yet</h3>
              <p className="text-sm text-slate-500 mb-4 text-center max-w-sm">
                Create teams to organize your employees. Each team gets its own attendance sheet, payroll view, and salary slips.
              </p>
              <button
                onClick={handleOpenCreate}
                className="flex items-center gap-2 bg-[#ff5a36] hover:bg-[#e04a29] text-white rounded-full h-10 px-5 transition-all cursor-pointer font-bold text-sm"
              >
                <Plus className="w-4 h-4" />
                Create Your First Team
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* Create / Edit Modal */}
      {/* ═══════════════════════════════════════════════════════ */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => setShowCreateModal(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200/50 dark:border-slate-700/50"
            onClick={e => e.stopPropagation()}
          >
            <button onClick={() => setShowCreateModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl">
                {editingTeam ? <Edit3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> : <Plus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                  {editingTeam ? "Rename Team" : "Create New Team"}
                </h2>
                <p className="text-xs text-slate-500">
                  {editingTeam ? "Update the team name." : "Teams group employees together for separate attendance & payroll management."}
                </p>
              </div>
            </div>

            <div className="mb-6">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Team Name</label>
              <input
                type="text"
                value={teamName}
                onChange={e => setTeamName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSaveTeam()}
                placeholder="e.g. Sales Team Alpha, Night Shift, etc."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl h-11 px-4 text-sm font-medium text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                autoFocus
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 h-11 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTeam}
                disabled={isSaving || !teamName.trim()}
                className="flex-1 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? "Saving..." : editingTeam ? "Save Changes" : "Create Team"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* Delete Confirmation Modal */}
      {/* ═══════════════════════════════════════════════════════ */}
      {deletingTeam && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => setDeletingTeam(null)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200/50 dark:border-slate-700/50"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center mb-6">
              <div className="p-3 bg-rose-50 dark:bg-rose-500/10 rounded-2xl mb-3">
                <Trash2 className="w-6 h-6 text-rose-600 dark:text-rose-400" />
              </div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-1">Delete Team?</h2>
              <p className="text-sm text-slate-500">
                Are you sure you want to delete <strong>"{deletingTeam.name}"</strong>?
                All {(teamMembers.get(deletingTeam.id) || []).length} member(s) will become unassigned.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setDeletingTeam(null)}
                className="flex-1 h-11 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 h-11 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm transition-colors cursor-pointer"
              >
                Delete Team
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* Assign Members Slide-Over Panel */}
      {/* ═══════════════════════════════════════════════════════ */}
      {assigningTeam && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setAssigningTeam(null)} />

          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800">
            {/* Panel Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl">
                    <UserPlus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-800 dark:text-white">
                      Manage Members — {assigningTeam.name}
                    </h2>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {assigningIds.size} selected · Toggle employees to assign or remove them.
                    </p>
                  </div>
                </div>
                <button onClick={() => setAssigningTeam(null)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search employees..."
                  value={memberSearch}
                  onChange={e => setMemberSearch(e.target.value)}
                  className="w-full h-8 pl-8 pr-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700 dark:text-slate-200"
                />
              </div>
            </div>

            {/* Employee List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {assignableEmployees.map(emp => {
                const isAssigned = assigningIds.has(emp.id)
                const isInOtherTeam = emp.team_id && emp.team_id !== assigningTeam.id
                const otherTeam = isInOtherTeam ? orgTeams.find(t => t.id === emp.team_id) : null

                return (
                  <button
                    key={emp.id}
                    onClick={() => handleToggleMember(emp.id)}
                    className={`w-full flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-800/60 transition-colors text-left ${
                      isAssigned
                        ? "bg-indigo-50/50 dark:bg-indigo-500/5"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/30"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                        isAssigned
                          ? "border-indigo-600 bg-indigo-600 dark:border-indigo-500 dark:bg-indigo-500"
                          : "border-slate-300 dark:border-slate-600"
                      }`}>
                        {isAssigned && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <img
                        src={emp.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.full_name)}&background=random&color=fff&size=40`}
                        alt={emp.full_name}
                        className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800 dark:text-white truncate">
                          {emp.full_name}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium truncate">
                          {emp.job_title || emp.role}
                          {emp.zk_user_id && ` · #${emp.zk_user_id}`}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 ml-2">
                      {isAssigned ? (
                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-500/10 px-2 py-0.5 rounded-md">
                          Member
                        </span>
                      ) : otherTeam ? (
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-md">
                          {otherTeam.name}
                        </span>
                      ) : null}
                    </div>
                  </button>
                )
              })}

              {assignableEmployees.length === 0 && (
                <div className="py-12 text-center text-slate-400 text-sm">
                  No employees match your search.
                </div>
              )}
            </div>

            {/* Panel Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 shrink-0">
              <div className="flex items-center justify-between mb-3 text-[11px] text-slate-500">
                <span>
                  <strong className="text-indigo-600">{assigningIds.size}</strong> member{assigningIds.size !== 1 ? "s" : ""} selected
                </span>
                <span>
                  of {tenantEmployees.length} total
                </span>
              </div>
              <button
                onClick={handleSaveAssignments}
                disabled={isSaving}
                className="w-full h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Save Assignments
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
