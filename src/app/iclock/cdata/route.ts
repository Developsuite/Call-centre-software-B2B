import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// ADMS GET: Machine connects to get configuration
export async function GET(request: Request) {
  const url = new URL(request.url);
  const sn = url.searchParams.get('SN');
  
  console.log(`[ZKTeco] Machine connected. Serial Number: ${sn}`);

  // This text configuration tells the machine to send logs in real-time.
  // TransFlag=1111000000 ensures it sends attendance logs automatically.
  const responseText = `GETOption=~SerialNumber
ErrorDelay=60
Delay=10
TransTimes=00:00;14:00
TransInterval=1
TransFlag=1111000000
Realtime=1
Encrypt=0`;

  return new NextResponse(responseText, {
    status: 200,
    headers: { 'Content-Type': 'text/plain' }
  });
}

// ADMS POST: Machine sends attendance records
export async function POST(request: Request) {
  const url = new URL(request.url);
  const sn = url.searchParams.get('SN');
  const table = url.searchParams.get('table');
  
  // Read the raw text body sent by the machine
  const bodyText = await request.text();
  
  if (table === 'ATTLOG') {
    console.log(`[ZKTeco] Received Attendance Log from ${sn}:`);
    
    // The logs come in as tab-separated lines
    const lines = bodyText.split('\n').filter(line => line.trim() !== '');
    
    for (const line of lines) {
      const parts = line.split('\t');
      if (parts.length >= 2) {
        const userId = parts[0];
        const timestamp = parts[1];
        const status = parts[2]; // 0: Check-In, 1: Check-Out, etc.
        const verifyMode = parts[3]; // 1: Fingerprint, 15: Face, etc.
        
        console.log(` ---> User ID: ${userId} | Time: ${timestamp} | Status: ${status}`);
        
        // TODO: In the future, we will insert this into Supabase here.
      }
    }
  } else {
    // If it's sending other types of data (like user data sync)
    console.log(`[ZKTeco] Received ${table} data from ${sn}`);
  }

  // Acknowledge receipt so the machine doesn't keep resending
  return new NextResponse("OK", {
    status: 200,
    headers: { 'Content-Type': 'text/plain' }
  });
}
