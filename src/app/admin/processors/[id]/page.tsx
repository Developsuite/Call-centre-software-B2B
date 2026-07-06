"use client"

import React from "react"
import { useParams } from "next/navigation"
import { EntityPerformanceView } from "@/components/admin/EntityPerformanceView"

export default function ProcessorDetailsPage() {
  const params = useParams()
  const processorName = decodeURIComponent(params.id as string)
  return <EntityPerformanceView entityType="Processor" entityName={processorName} />
}
