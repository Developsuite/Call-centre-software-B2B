import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase URL or Service Role Key in .env.local")
  process.exit(1)
}

// Create a Supabase client with the service role key to bypass RLS and create Auth users
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const DEFAULT_PASSWORD = 'CallCenter@2026'

async function seed() {
  console.log("🌱 Starting database seed...")

  // 1. Create SuperAdmin Account
  console.log("Creating SuperAdmin...")
  const superAdminEmail = 'ma7535541@gmail.com'
  
  const { data: saAuth, error: saError } = await supabaseAdmin.auth.admin.createUser({
    email: superAdminEmail,
    password: DEFAULT_PASSWORD,
    email_confirm: true
  })

  if (saError && !saError.message.includes('already been registered')) {
    console.error("Error creating SuperAdmin auth:", saError.message)
    return
  }

  let saId = saAuth?.user?.id
  
  if (!saId) {
    // If user already exists, fetch their ID
    const { data: usersData } = await supabaseAdmin.auth.admin.listUsers()
    const existingSa = usersData.users.find(u => u.email === superAdminEmail)
    saId = existingSa?.id
  }

  if (saId) {
    // Upsert into profiles
    await supabaseAdmin.from('profiles').upsert({
      id: saId,
      full_name: 'Abbas (Owner)',
      role: 'SuperAdmin',
      status: 'Active'
    })
    console.log("✅ SuperAdmin created!")
  }

  // 2. Create Demo Organizations
  console.log("Creating Demo Organizations...")
  
  // Helper to get or create org
  async function getOrCreateOrg(name: string) {
    const { data: existing } = await supabaseAdmin.from('organizations').select().eq('name', name).single()
    if (existing) return existing

    const { data: newOrg, error } = await supabaseAdmin.from('organizations').insert({ name }).select().single()
    if (error) {
      console.error(`Error creating org ${name}:`, error)
      return null
    }
    return newOrg
  }

  const org1 = await getOrCreateOrg('NYC Sales Hub')
  const org2 = await getOrCreateOrg('Dallas Contact Center')

  if (!org1 || !org2) {
    return
  }

  console.log(`✅ Organizations created: ${org1.name}, ${org2.name}`)

  // Helper to create employee
  async function createEmployee(email: string, name: string, role: string, orgId: string, team?: string) {
    const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: DEFAULT_PASSWORD,
      email_confirm: true
    })

    let uid = authData?.user?.id
    if (authErr && authErr.message.includes('already been registered')) {
      const { data: uData } = await supabaseAdmin.auth.admin.listUsers()
      uid = uData.users.find(u => u.email === email)?.id
    } else if (authErr) {
      console.error(`Failed to create ${email}:`, authErr.message)
      return null
    }

    if (uid) {
      await supabaseAdmin.from('profiles').upsert({
        id: uid,
        full_name: name,
        role: role,
        organization_id: orgId,
        team: team,
        status: 'Active'
      })
      console.log(`   Created ${role}: ${name} (${email})`)
      return uid
    }
    return null
  }

  // 3. Create Demo Users for NYC
  console.log("Creating employees for NYC...")
  await createEmployee('admin@nyc.com', 'Harvey Specter', 'Admin', org1.id)
  await createEmployee('processor@nyc.com', 'Jane Doe', 'Processor', org1.id)
  const agent1Id = await createEmployee('agent1@nyc.com', 'Ali Khan', 'Agent', org1.id, 'ALPHA SQUAD')
  await createEmployee('agent2@nyc.com', 'Mike Ross', 'Agent', org1.id, 'BETA FORCE')

  // 4. Create Demo Users for Dallas
  console.log("Creating employees for Dallas...")
  await createEmployee('admin@dallas.com', 'Dallas Admin', 'Admin', org2.id)
  await createEmployee('processor@dallas.com', 'Dallas Proc', 'Processor', org2.id)
  await createEmployee('agent@dallas.com', 'Tex Ranger', 'Agent', org2.id, 'LONE STAR')

  console.log("🎉 Seed complete! You can now log in.")
  console.log(`Default password for all accounts: ${DEFAULT_PASSWORD}`)
}

seed().catch(console.error)
