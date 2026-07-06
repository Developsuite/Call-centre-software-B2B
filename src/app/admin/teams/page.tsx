"use client"

import React, { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useAppContext } from "@/store/AppContext"
import { Search, Users, ChevronRight, LayoutGrid } from "lucide-react"
import Link from "next/link"

export default function TeamsListPage() {
  const { users, sales, currentUser, isLoaded } = useAppContext()
  const [searchQuery, setSearchQuery] = useState("")

  if (!isLoaded || !currentUser) {
    return (
      <DashboardLayout title="My Teams">
        <div className="flex items-center justify-center h-[50vh]">
          <div className="w-6 h-6 border-2 border-[#ff5a36] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    )
  }

  // Isolate to current org
  const tenantUsers = currentUser.role === "SuperAdmin" 
    ? users 
    : users.filter(u => u.tenantId === currentUser.tenantId)

  const tenantSales = currentUser.role === "SuperAdmin" 
    ? sales 
    : sales.filter(s => s.tenantId === currentUser.tenantId)

  // Extract unique teams
  const teamNames = new Set<string>()
  tenantUsers.forEach(u => {
    if (u.team) teamNames.add(u.team)
  })
  tenantSales.forEach(s => {
    if (s.team) teamNames.add(s.team)
  })

  const uniqueTeams = Array.from(teamNames).sort()

  const filteredTeams = uniqueTeams.filter(t => 
    t.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
            <p className="text-slate-500 text-sm">View and analyze aggregate performance of all teams</p>
          </div>
          
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTeams.map(teamName => {
            const teamSales = tenantSales.filter(s => s.team === teamName || s.team_name === teamName)
            const teamMembers = tenantUsers.filter(u => u.team === teamName)
            const total = teamSales.length
            const connected = teamSales.filter(s => s.status === "Connected").length
            const convRate = total > 0 ? Math.round((connected / total) * 100) : 0

            return (
              <Link key={teamName} href={`/admin/teams/${encodeURIComponent(teamName)}`}>
                <Card className="rounded-[1.5rem] p-5 bg-white dark:bg-card border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer group flex flex-col h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <LayoutGrid className="w-5 h-5 text-slate-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 dark:text-white group-hover:text-[#ff5a36] transition-colors">{teamName}</h3>
                        <p className="text-xs text-slate-500 font-medium">{teamMembers.length} Members</p>
                      </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 p-1.5 rounded-lg group-hover:bg-[#ff5a36]/10 transition-colors">
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#ff5a36]" />
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
    </DashboardLayout>
  )
}
