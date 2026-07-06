"use client"

import React from "react"
import { useParams } from "next/navigation"
import { EntityPerformanceView } from "@/components/admin/EntityPerformanceView"

export default function TeamDetailsPage() {
  const params = useParams()
  const teamName = decodeURIComponent(params.id as string)
  return <EntityPerformanceView entityType="Team" entityName={teamName} />
}
