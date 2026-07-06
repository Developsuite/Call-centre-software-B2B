"use server"

import { getAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { sanitizeInput } from '@/utils/sanitize'

const DEFAULT_PASSWORD = '123456'

// Verify if the caller is a SuperAdmin
async function verifySuperAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  
  const admin = getAdminClient()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  return profile?.role === 'SuperAdmin'
}

// ==========================================
// TENANT OPERATIONS
// ==========================================

export async function createTenant(rawName: string, avatarUrl?: string) {
  if (!(await verifySuperAdmin())) return { error: 'Unauthorized: SuperAdmin required' }
  const name = sanitizeInput(rawName, 100)
  const admin = getAdminClient()
  const { data, error } = await admin.from('organizations').insert({ name, avatar_url: avatarUrl }).select().single()
  if (error) return { error: error.message }
  revalidatePath('/master/dashboard')
  return { success: true, data }
}

export async function updateTenant(id: string, rawName: string) {
  if (!(await verifySuperAdmin())) return { error: 'Unauthorized: SuperAdmin required' }
  const name = sanitizeInput(rawName, 100)
  const admin = getAdminClient()
  const { error } = await admin.from('organizations').update({ name }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/master/dashboard')
  return { success: true }
}

export async function deleteTenant(id: string) {
  if (!(await verifySuperAdmin())) return { error: 'Unauthorized: SuperAdmin required' }
  const admin = getAdminClient()
  // Because of ON DELETE CASCADE, this will also delete profiles, sales, etc.
  const { error } = await admin.from('organizations').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/master/dashboard')
  return { success: true }
}

// ==========================================
// USER OPERATIONS
// ==========================================

export async function createUser(email: string, rawName: string, role: string, tenantId: string, rawTeam?: string) {
  if (!(await verifySuperAdmin())) return { error: 'Unauthorized: SuperAdmin required' }
  const name = sanitizeInput(rawName, 100)
  const team = sanitizeInput(rawTeam, 100)
  const admin = getAdminClient()
  
  // 1. Create Auth User
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password: DEFAULT_PASSWORD,
    email_confirm: true
  })

  if (authError) return { error: authError.message }

  const uid = authData.user.id

  // 2. Create Profile
  const { error: profileError } = await admin.from('profiles').upsert({
    id: uid,
    full_name: name,
    role: role,
    organization_id: tenantId,
    team: team || null,
    status: 'Active'
  })

  if (profileError) return { error: profileError.message }
  
  revalidatePath('/master/dashboard')
  return { success: true }
}

export async function updateUser(id: string, updates: { full_name?: string, role?: string, organization_id?: string, team?: string, status?: string }) {
  if (!(await verifySuperAdmin())) return { error: 'Unauthorized: SuperAdmin required' }
  
  const sanitizedUpdates: any = { ...updates }
  if (updates.full_name) sanitizedUpdates.full_name = sanitizeInput(updates.full_name, 100)
  if (updates.team) sanitizedUpdates.team = sanitizeInput(updates.team, 100)
  
  const admin = getAdminClient()
  const { error } = await admin.from('profiles').update(sanitizedUpdates).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/master/dashboard')
  return { success: true }
}

export async function resetUserPassword(id: string) {
  if (!(await verifySuperAdmin())) return { error: 'Unauthorized: SuperAdmin required' }
  const admin = getAdminClient()
  const { error } = await admin.auth.admin.updateUserById(id, { password: DEFAULT_PASSWORD })
  if (error) return { error: error.message }
  return { success: true }
}

export async function disableUser(id: string) {
  if (!(await verifySuperAdmin())) return { error: 'Unauthorized: SuperAdmin required' }
  const admin = getAdminClient()
  const { error } = await admin.from('profiles').update({ status: 'Disabled' }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/master/dashboard')
  return { success: true }
}

export async function deleteUser(id: string) {
  if (!(await verifySuperAdmin())) return { error: 'Unauthorized: SuperAdmin required' }
  const admin = getAdminClient()
  const { error } = await admin.auth.admin.deleteUser(id)
  if (error) return { error: error.message }
  revalidatePath('/master/dashboard')
  return { success: true }
}

export async function fetchUserEmails() {
  if (!(await verifySuperAdmin())) return []
  const admin = getAdminClient()
  const { data, error } = await admin.auth.admin.listUsers()
  if (error || !data?.users) return []
  return data.users.map(u => ({ id: u.id, email: u.email || '' }))
}

// ==========================================
// TEST DATA OPERATIONS
// ==========================================

export async function clearAllSalesData(): Promise<{ success?: boolean, error?: string }> {
  if (!(await verifySuperAdmin())) return { error: 'Unauthorized: SuperAdmin required' }
  const admin = getAdminClient()
  try {
    await admin.from('sales').delete().neq('id', '00000000-0000-0000-0000-000000000000') 
    await admin.from('notifications').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    revalidatePath('/')
    return { success: true }
  } catch(e: any) {
    return { error: e.message }
  }
}

export async function resetTenant(tenantId: string): Promise<{ success?: boolean, error?: string }> {
  if (!(await verifySuperAdmin())) return { error: 'Unauthorized: SuperAdmin required' }
  const admin = getAdminClient()
  try {
    // Check if the caller is a SuperAdmin (in a real app, verify auth here)
    
    // 1. Delete all sales for this tenant. 
    // This automatically cascades and deletes related notifications if `sale_id` is set.
    await admin.from('sales').delete().eq('organization_id', tenantId)

    // 2. Delete all support tickets for this tenant
    await admin.from('support_tickets').delete().eq('organization_id', tenantId)

    // 3. To delete any orphaned notifications (like status updates that aren't tied to a specific sale, if any),
    // we find all users in this tenant and delete their notifications.
    const { data: tenantUsers } = await admin.from('profiles').select('id').eq('organization_id', tenantId)
    if (tenantUsers && tenantUsers.length > 0) {
      const userIds = tenantUsers.map(u => u.id)
      await admin.from('notifications').delete().in('user_id', userIds)
    }

    revalidatePath('/master/call-centers')
    return { success: true }
  } catch(e: any) {
    return { error: e.message }
  }
}

export async function generateTestData() {
  if (!(await verifySuperAdmin())) return { error: 'Unauthorized: SuperAdmin required' }
  const admin = getAdminClient()
  
  // Fetch agents
  const { data: agents } = await admin.from('profiles').select('*').eq('role', 'Agent')
  if (!agents || agents.length === 0) return { error: 'No agents found to create sales for.' }

  const accountTypes = ["Checking", "Savings", "Credit", "Investment"]
  const statuses = ["Pending", "In Process", "Need Info", "Processed", "Rejected", "Connected"]

  const fakeSales = []
  
  // Generate 10 fake sales
  for (let i = 0; i < 10; i++) {
    const agent = agents[Math.floor(Math.random() * agents.length)]
    
    fakeSales.push({
      organization_id: agent.organization_id,
      agent_id: agent.id,
      customer: `Test Customer ${Math.floor(Math.random() * 9000) + 1000}`,
      account_type: accountTypes[Math.floor(Math.random() * accountTypes.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      agent_name: agent.full_name,
      team_name: agent.team,
      notes: "Generated by Test System"
    })
  }

  const { error } = await admin.from('sales').insert(fakeSales)
  if (error) return { error: error.message }

  return { success: true }
}
