"use client"

import React from "react"
import { useParams } from "next/navigation"
import { EntityPerformanceView } from "@/components/admin/EntityPerformanceView"

export default function AgentDetailsPage() {
  const params = useParams()
  const agentName = decodeURIComponent(params.id as string)
  return <EntityPerformanceView entityType="Agent" entityName={agentName} />
}
