import { NextResponse } from "next/server"
import { exec } from "child_process"
import path from "path"
import util from "util"

const execPromise = util.promisify(exec)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { organization_id } = body

    if (!organization_id) {
      return NextResponse.json({ error: "organization_id is required" }, { status: 400 })
    }

    console.log(`[ZK Sync] Running local SQLite Sync Script...`)
    
    // Path to the sync script in the root directory
    const scriptPath = path.join(process.cwd(), 'sync-attendance.js')
    
    // Execute the script
    const { stdout, stderr } = await execPromise(`node "${scriptPath}"`)
    
    console.log(`[ZK Sync Output]\n${stdout}`)
    if (stderr) {
      console.error(`[ZK Sync Errors]\n${stderr}`)
    }

    if (stdout.includes("ERROR:") || stderr.includes("ERROR:")) {
      return NextResponse.json({ 
        success: false, 
        error: "Script encountered an error. Please check server logs or ensure ZKBio Time is installed correctly." 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully synchronized attendance from ZKBio Time database!` 
    })

  } catch (error: any) {
    console.error("[ZK Sync] Error:", error)
    
    return NextResponse.json({ 
      success: false, 
      error: error.message || "Failed to run sync script" 
    }, { status: 500 })
  }
}
