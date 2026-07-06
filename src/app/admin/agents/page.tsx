"use client"

import React, { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useAppContext } from "@/store/AppContext"
import { Search, Headset, ChevronRight, UserCircle, LayoutGrid, List } from "lucide-react"
import Link from "next/link"

export default function AgentsListPage() {
  const { users, sales, currentUser, isLoaded } = useAppContext()
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"card" | "list">("card")

  if (!isLoaded || !currentUser) {
    return (
      <DashboardLayout title="All Agents">
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

  const agents = tenantUsers.filter(u => u.role === "Agent")

  const filteredAgents = agents.filter(agent => 
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (agent.team && agent.team.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <DashboardLayout title="All Agents">
      <div className="flex flex-col gap-6 font-sans max-w-[1000px] mx-auto w-full pb-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white/50 dark:bg-card/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-md">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-xl text-slate-500">
                <Headset className="w-5 h-5" />
              </div>
              <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">All Agents</h1>
            </div>
            <p className="text-slate-500 text-sm">View and analyze performance of all agents</p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input 
                type="text" 
                placeholder="Search Agents..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-full h-9 text-sm w-48 sm:w-64 shadow-sm focus-visible:ring-1 focus-visible:ring-[#ff5a36]" 
              />
            </div>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-full border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setViewMode("card")}
                className={`p-1.5 rounded-full transition-colors ${viewMode === "card" ? "bg-white dark:bg-slate-700 shadow-sm text-[#ff5a36]" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"}`}
                title="Card View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-full transition-colors ${viewMode === "list" ? "bg-white dark:bg-slate-700 shadow-sm text-[#ff5a36]" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"}`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {viewMode === "card" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAgents.map(agent => {
              const agentSales = tenantSales.filter(s => s.agent_id === agent.id || s.agent === agent.name)
              const total = agentSales.length
              const connected = agentSales.filter(s => s.status === "Connected").length
              const convRate = total > 0 ? Math.round((connected / total) * 100) : 0

              return (
                <Link key={agent.id} href={`/admin/agents/${encodeURIComponent(agent.name)}`}>
                  <Card className="rounded-[1.5rem] p-5 bg-white dark:bg-card border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer group flex flex-col h-full">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {agent.avatarUrl ? (
                          <img src={agent.avatarUrl} alt={agent.name} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <UserCircle className="w-10 h-10 text-slate-300" />
                        )}
                        <div>
                          <h3 className="font-bold text-slate-800 dark:text-white group-hover:text-[#ff5a36] transition-colors flex items-center gap-2">
                            {agent.name}
                            {agent.isTeamLead && (
                              <span className="bg-amber-100 text-amber-700 text-[9px] px-1.5 py-0.5 rounded-sm font-bold tracking-wider uppercase">Lead</span>
                            )}
                          </h3>
                          <p className="text-xs text-slate-500 font-medium">{agent.team || "No Team"}</p>
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
            {filteredAgents.length === 0 && (
              <div className="col-span-full py-10 text-center text-slate-500">
                No agents found matching your search.
              </div>
            )}
          </div>
        ) : (
          <Card className="rounded-[1.5rem] p-0 bg-white dark:bg-card border-none shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/50">
                  <tr className="text-slate-500 font-medium border-b border-slate-100 dark:border-slate-800 text-xs uppercase tracking-wider">
                    <th className="py-4 px-6 font-bold">Agent</th>
                    <th className="py-4 px-6 font-bold">Team</th>
                    <th className="py-4 px-6 font-bold">Total Sales</th>
                    <th className="py-4 px-6 font-bold">Conv. Rate</th>
                    <th className="py-4 px-6"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAgents.map((agent, i) => {
                    const agentSales = tenantSales.filter(s => s.agent_id === agent.id || s.agent === agent.name)
                    const total = agentSales.length
                    const connected = agentSales.filter(s => s.status === "Connected").length
                    const convRate = total > 0 ? Math.round((connected / total) * 100) : 0
                    const isLast = i === filteredAgents.length - 1

                    return (
                      <tr key={agent.id} className={`group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors ${!isLast ? 'border-b border-slate-50 dark:border-slate-800/50' : ''}`}>
                        <td className="py-3 px-6">
                          <div className="flex items-center gap-3">
                            {agent.avatarUrl ? (
                              <img src={agent.avatarUrl} alt={agent.name} className="w-8 h-8 rounded-full object-cover" />
                            ) : (
                              <UserCircle className="w-8 h-8 text-slate-300" />
                            )}
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800 dark:text-white">{agent.name}</span>
                              {agent.isTeamLead && (
                                <span className="bg-amber-100 text-amber-700 text-[9px] px-1.5 py-0.5 rounded-sm font-bold tracking-wider uppercase">Lead</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-6 text-slate-500 font-medium">
                          {agent.team ? (
                            <span className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md text-xs">{agent.team}</span>
                          ) : (
                            <span className="text-slate-400 italic text-xs">Unassigned</span>
                          )}
                        </td>
                        <td className="py-3 px-6 font-bold text-slate-700 dark:text-slate-300">
                          {total}
                        </td>
                        <td className="py-3 px-6">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full bg-[#ff5a36]" style={{ width: `${convRate}%` }}></div>
                            </div>
                            <span className="font-bold text-[#ff5a36] text-xs">{convRate}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-6 text-right">
                          <Link href={`/admin/agents/${encodeURIComponent(agent.name)}`}>
                            <button className="text-slate-400 hover:text-[#ff5a36] bg-slate-50 dark:bg-slate-800 hover:bg-[#ff5a36]/10 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
                              View Details
                            </button>
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                  {filteredAgents.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-slate-500">
                        No agents found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
