"use client"

import React, { useMemo } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card } from "@/components/ui/card"
import { useAppContext, HREmployee } from "@/store/AppContext"
import {
  ArrowLeft,
  UserCheck,
  WalletCards,
  ReceiptText,
  Users,
  Network,
  ChevronRight,
  FolderOpen,
  UserCircle
} from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"

export default function TeamHubPage() {
  const params = useParams()
  const teamId = params?.teamId as string

  const {
    teams,
    hrEmployees,
    currentUser,
    isLoaded,
    formatCurrency
  } = useAppContext()

  // Find the team
  const team = useMemo(() => teams.find(t => t.id === teamId), [teams, teamId])

  // Team members
  const members = useMemo(() => {
    if (!currentUser || !teamId) return []
    const list = currentUser.role === "SuperAdmin"
      ? hrEmployees
      : hrEmployees.filter(u => u.organization_id === currentUser.tenantId)
    return list.filter(e => e.team_id === teamId && e.status !== "Disabled" && e.role !== "SuperAdmin")
      .sort((a, b) => a.full_name.localeCompare(b.full_name))
  }, [hrEmployees, currentUser, teamId])

  const totalPayroll = members.reduce((sum, m) => sum + (Number(m.base_salary) || 0), 0)

  if (!isLoaded || !currentUser) {
    return (
      <DashboardLayout title="Team">
        <div className="flex items-center justify-center h-[50vh]">
          <div className="w-6 h-6 border-2 border-[#ff5a36] border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  if (!team) {
    return (
      <DashboardLayout title="Team Not Found">
        <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
          <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl">
            <Network className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">Team Not Found</h2>
          <p className="text-sm text-slate-500">This team may have been deleted or doesn't exist.</p>
          <Link
            href="/hr/teams"
            className="flex items-center gap-2 text-sm font-bold text-[#ff5a36] hover:text-[#e04a29] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Teams
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  const folderCards = [
    {
      title: "Attendance",
      description: "Mark & view daily attendance for this team",
      icon: UserCheck,
      href: `/hr/attendance?team=${teamId}`,
      color: "from-blue-500/10 to-cyan-500/10 dark:from-blue-500/20 dark:to-cyan-500/20",
      iconColor: "text-blue-600 dark:text-blue-400",
      borderColor: "hover:border-blue-500/30 dark:hover:border-blue-500/20",
      stat: `${members.length} employees`,
      statIcon: Users
    },
    {
      title: "Payroll",
      description: "View salary distribution & compensation for this team",
      icon: WalletCards,
      href: `/hr/payroll?team=${teamId}`,
      color: "from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      borderColor: "hover:border-emerald-500/30 dark:hover:border-emerald-500/20",
      stat: `PKR ${formatCurrency(totalPayroll)}`,
      statIcon: WalletCards
    },
    {
      title: "Salary Slips",
      description: "Generate & print salary slips for this team",
      icon: ReceiptText,
      href: `/hr/salary-slips?team=${teamId}`,
      color: "from-violet-500/10 to-purple-500/10 dark:from-violet-500/20 dark:to-purple-500/20",
      iconColor: "text-violet-600 dark:text-violet-400",
      borderColor: "hover:border-violet-500/30 dark:hover:border-violet-500/20",
      stat: `${members.length} slips`,
      statIcon: ReceiptText
    }
  ]

  return (
    <DashboardLayout title={team.name}>
      <div className="relative flex flex-col gap-5 font-sans max-w-[1200px] mx-auto w-full pb-10 min-h-screen px-4 md:px-0">

        {/* Back + Header */}
        <div className="flex flex-col gap-4 bg-gradient-to-br from-white/90 to-white/50 dark:from-slate-900/60 dark:to-slate-900/20 p-6 rounded-[1.5rem] border border-white/60 dark:border-slate-700/50 shadow-none backdrop-blur-2xl relative overflow-hidden group transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full duration-1000 transition-transform pointer-events-none" />

          {/* Breadcrumb */}
          <div className="relative z-10 flex items-center gap-2 text-xs font-medium text-slate-500">
            <Link href="/hr/teams" className="hover:text-[#ff5a36] transition-colors flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" />
              Teams
            </Link>
            <ChevronRight className="w-3 h-3 text-slate-300" />
            <span className="text-slate-800 dark:text-white font-bold">{team.name}</span>
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-indigo-500/15 to-purple-500/15 dark:from-indigo-500/25 dark:to-purple-500/25 rounded-2xl border border-indigo-500/20">
                <FolderOpen className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {team.name}
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-0.5">
                  {members.length} member{members.length !== 1 ? "s" : ""} · PKR {formatCurrency(totalPayroll)} monthly payroll
                </p>
              </div>
            </div>

            {/* Member Avatars */}
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2.5">
                {members.slice(0, 6).map(m => (
                  <img
                    key={m.id}
                    src={m.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.full_name)}&background=random&color=fff&size=48`}
                    alt={m.full_name}
                    className="w-9 h-9 rounded-full border-[3px] border-white dark:border-slate-900 object-cover"
                    title={m.full_name}
                  />
                ))}
                {members.length > 6 && (
                  <div className="w-9 h-9 rounded-full border-[3px] border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-500">
                    +{members.length - 6}
                  </div>
                )}
              </div>
              <Link
                href="/hr/teams"
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-colors"
              >
                Manage →
              </Link>
            </div>
          </div>
        </div>

        {/* Folder Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {folderCards.map(card => (
            <Link key={card.title} href={card.href}>
              <Card className={`rounded-[1.5rem] bg-white/80 dark:bg-slate-900/50 backdrop-blur-2xl border border-slate-200/60 dark:border-slate-700/50 shadow-none overflow-hidden group/folder cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-slate-900/5 ${card.borderColor} h-full`}>
                <div className="p-6">
                  {/* Icon */}
                  <div className={`p-3.5 bg-gradient-to-br ${card.color} rounded-2xl w-fit mb-4 transition-transform duration-300 group-hover/folder:scale-110`}>
                    <card.icon className={`w-6 h-6 ${card.iconColor}`} />
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-extrabold text-slate-800 dark:text-white text-lg mb-1 group-hover/folder:text-indigo-600 dark:group-hover/folder:text-indigo-400 transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-4">
                    {card.description}
                  </p>

                  {/* Stat */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                      <card.statIcon className="w-3.5 h-3.5" />
                      {card.stat}
                    </div>
                    <div className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 opacity-0 group-hover/folder:opacity-100 transition-opacity">
                      Open <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {/* Team Members List */}
        <Card className="rounded-[1.5rem] bg-white/80 dark:bg-slate-900/50 backdrop-blur-2xl border border-slate-200/60 dark:border-slate-700/50 shadow-none overflow-hidden">
          <div className="p-5 border-b border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-slate-100/50 dark:bg-slate-800/50 rounded-lg">
                <Users className="w-4 h-4 text-slate-500" />
              </div>
              <h3 className="font-bold text-slate-800 dark:text-white text-base">Team Members</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                {members.length}
              </span>
            </div>
            <Link
              href="/hr/teams"
              className="text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1 transition-colors"
            >
              Manage <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {members.map((emp, i) => (
              <div
                key={emp.id}
                className="flex items-center justify-between px-5 py-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-slate-400 w-5 text-center">{i + 1}</span>
                  {emp.avatar_url ? (
                    <img src={emp.avatar_url} alt={emp.full_name} className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
                  ) : (
                    <UserCircle className="w-9 h-9 text-slate-300" />
                  )}
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-white">{emp.full_name}</p>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {emp.job_title || emp.role}
                      {emp.zk_user_id && ` · #${emp.zk_user_id}`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-800 dark:text-white">
                    PKR {formatCurrency(Number(emp.base_salary) || 0)}
                  </p>
                  <p className="text-[9px] text-slate-400 font-medium">Base Salary</p>
                </div>
              </div>
            ))}

            {members.length === 0 && (
              <div className="py-12 text-center">
                <Users className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                <p className="text-sm text-slate-400">No members in this team yet.</p>
                <Link href="/hr/teams" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-2 inline-block hover:underline">
                  Assign members →
                </Link>
              </div>
            )}
          </div>
        </Card>

      </div>
    </DashboardLayout>
  )
}
