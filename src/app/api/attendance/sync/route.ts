import { NextResponse } from "next/server"
// @ts-expect-error - node-zklib does not have type definitions
import ZKLib from "node-zklib"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: Request) {
  let zkInstance: ZKLib | null = null;
  
  try {
    const body = await request.json()
    const { ip = "192.168.18.225", port = 4370, organization_id } = body

    if (!organization_id) {
      return NextResponse.json({ error: "organization_id is required" }, { status: 400 })
    }

    console.log(`[ZK Sync] Connecting to ${ip}:${port}...`)
    
    // Initialize ZKLib
    zkInstance = new ZKLib(ip, port, 10000, 4000)
    
    // Connect to the device
    await zkInstance.createSocket()
    console.log(`[ZK Sync] Connected successfully!`)
    
    // Get all attendances
    const attendances = await zkInstance.getAttendances()
    
    const records = attendances?.data || [];
    console.log(`[ZK Sync] Pulled ${records.length} total attendance records from device.`)

    if (records.length > 0) {
      // Map to Supabase format
      const recordsToInsert = records.map((log: any) => {
        // ZKLib returns recordTime as a Date object or parsable string
        const timestamp = new Date(log.recordTime).toISOString()
        
        return {
          organization_id,
          zk_user_id: String(log.deviceUserId),
          timestamp: timestamp,
          status: 0, // Fallback
          verify_mode: 0
        }
      })

      // We use upsert with conflict target to avoid duplicates
      // Supabase upsert requires unique constraint on (organization_id, zk_user_id, timestamp)
      const { error } = await supabase
        .from('hr_attendance')
        .upsert(recordsToInsert, { 
          onConflict: 'organization_id,zk_user_id,timestamp',
          ignoreDuplicates: true
        })

      if (error) {
        console.error("[ZK Sync] DB Insert Error:", error)
        throw error
      }
    }

    // Clean up
    await zkInstance.disconnect()

    return NextResponse.json({ 
      success: true, 
      message: `Successfully synced ${records.length} records.` 
    })

  } catch (error: any) {
    console.error("[ZK Sync] Error:", error)
    
    // Attempt disconnect if it fails midway
    if (zkInstance) {
      try { await zkInstance.disconnect() } catch (e) {}
    }

    return NextResponse.json({ 
      success: false, 
      error: error.message || "Failed to sync attendance" 
    }, { status: 500 })
  }
}
