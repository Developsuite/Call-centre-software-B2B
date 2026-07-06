"use client"

import { EntityPerformanceView } from "@/components/admin/EntityPerformanceView"
import { useAppContext } from "@/store/AppContext"
import { DashboardLayout } from "@/components/layout/dashboard-layout"

export default function TeamDashboardPage() {
  const { currentUser, isLoaded } = useAppContext()

  if (!isLoaded) {
    return (
      <DashboardLayout title="My Team">
        <div className="flex items-center justify-center h-[50vh]">
          <div className="w-6 h-6 border-2 border-[#ff5a36] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (!currentUser) {
    return (
      <DashboardLayout title="My Team">
        <div className="flex flex-col items-center justify-center h-[50vh] text-center gap-4">
          <div className="text-4xl">⚠️</div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Profile Not Found</h2>
        </div>
      </DashboardLayout>
    )
  }

  if (!currentUser.isTeamLead) {
    return (
      <DashboardLayout title="My Team">
        <div className="flex flex-col items-center justify-center h-[50vh] text-center gap-4">
          <div className="text-4xl">🔒</div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Access Restricted</h2>
          <p className="text-slate-500 max-w-md text-sm">You must be a designated Team Lead to view this page.</p>
        </div>
      </DashboardLayout>
    )
  }

  if (!currentUser.team) {
    return (
      <DashboardLayout title="My Team">
        <div className="flex flex-col items-center justify-center h-[50vh] text-center gap-4">
          <div className="text-4xl">👥</div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">No Team Assigned</h2>
          <p className="text-slate-500 max-w-md text-sm">You are a Team Lead, but you have not been assigned to a specific team yet.</p>
        </div>
      </DashboardLayout>
    )
  }

  return <EntityPerformanceView entityType="Team" entityName={currentUser.team} />
}
