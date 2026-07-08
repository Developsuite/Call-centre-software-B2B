"use client"

import React, { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useAppContext, Team } from "@/store/AppContext"
import { Search, Users, ChevronRight, LayoutGrid, Plus, Edit } from "lucide-react"
import Link from "next/link"
import { TeamEditModal } from "@/components/admin/TeamEditModal"

export default function TeamsListPage() {
  const { teams, users, sales, currentUser, isLoaded } = useAppContext()
  const [searchQuery, setSearchQuery] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)

  if (!isLoaded || !currentUser) {
    return (
      <DashboardLayout title="My Teams">
        <div className="flex items-center justify-center h-[50vh]">
          <div className="w-6 h-6 border-2 border-[#ff5a36] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    )
  }

  // SuperAdmins see all teams, others see teams matching their tenantId
  // The backend/AppContext already filters teams based on role, so `teams` is safe to use.
  
  const filteredTeams = teams.filter(t => 
    (t.name || "").toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => (a.name || "").localeCompare(b.name || ""))

  const handleEditClick = (e: React.MouseEvent, team: Team) => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedTeam(team)
    setIsModalOpen(true)
  }

  const handleCreateClick = () => {
    setSelectedTeam(null)
    setIsModalOpen(true)
  }

  return (
    <DashboardLayout title="My Teams">
      <div className="flex flex-col gap-6 font-sans max-w-[1000px] mx-auto w-full pb-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white/50 dark:bg-card/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-md">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-xl text-slate-500">
                <Users className="w-5 h-5" />
              </div>
              <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">My Teams</h1>
            </div>
            <p className="text-slate-500 text-sm">View and manage aggregate performance of all teams</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input 
                type="text" 
                placeholder="Search Teams..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-full h-9 text-sm w-64 shadow-sm focus-visible:ring-1 focus-visible:ring-[#ff5a36]" 
              />
            </div>
            
            {(currentUser.role === 'SuperAdmin' || currentUser.role === 'Admin') && (
              <Button 
                onClick={handleCreateClick}
                className="bg-[#ff5a36] hover:bg-[#ff5a36]/90 text-white rounded-full h-9 px-4 shadow-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Team
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTeams.map(team => {
            const teamSales = sales.filter(s => s.team_id === team.id || s.team === team.name || s.team_name === team.name)
            const teamMembers = users.filter(u => u.team_id === team.id || u.team === team.name)
            const total = teamSales.length
            const connected = teamSales.filter(s => s.status === "Connected").length
            const convRate = total > 0 ? Math.round((connected / total) * 100) : 0

            return (
              <Link key={team.id} href={`/admin/teams/${encodeURIComponent(team.name || "unknown")}`}>
                <Card className="rounded-[1.5rem] p-5 bg-white dark:bg-card border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow cursor-pointer group flex flex-col h-full relative">
                  {(currentUser.role === 'SuperAdmin' || currentUser.role === 'Admin') && (
                    <button 
                      onClick={(e) => handleEditClick(e, team)}
                      className="absolute top-4 right-4 bg-slate-100 dark:bg-slate-800 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-200 dark:hover:bg-slate-700 z-10"
                      title="Edit Team"
                    >
                      <Edit className="w-4 h-4 text-slate-500" />
                    </button>
                  )}
                  
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 pr-10">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                        <LayoutGrid className="w-5 h-5 text-slate-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 dark:text-white group-hover:text-[#ff5a36] transition-colors line-clamp-1">{team.name}</h3>
                        <p className="text-xs text-slate-500 font-medium">{teamMembers.length} Members</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-auto pt-4 border-t border-slate-100 dark:border-slate-800/50">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Total Sales</p>
                      <p className="font-bold text-lg text-slate-700 dark:text-slate-300">{total}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Conv. Rate</p>
                      <p className="font-bold text-lg text-[#ff5a36]">{convRate}%</p>
                    </div>
                  </div>
                </Card>
              </Link>
            )
          })}
          {filteredTeams.length === 0 && (
            <div className="col-span-full py-10 text-center text-slate-500">
              No teams found matching your search.
            </div>
          )}
        </div>
      </div>

      <TeamEditModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        team={selectedTeam} 
      />
    </DashboardLayout>
  )
}
