"use client"

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react"
import { createClient } from "@/utils/supabase/client"
import { toast } from "sonner"
import { sanitizeInput, sanitizeFormData } from "@/utils/sanitize"

export type SaleStatus = "Pending" | "In Process" | "Need Info" | "Processed" | "Rejected" | "Connected"
export type UserRole = "SuperAdmin" | "Admin" | "HR" | "Processor" | "Agent"

export interface Tenant {
  id: string
  name: string
  avatarUrl?: string
  created_at?: string
}

export interface Team {
  id: string
  name: string
  organization_id: string
  created_at: string
}

export interface User {
  id: string
  full_name: string
  role: UserRole
  organization_id: string | null
  team?: string
  team_id?: string | null
  status: "Active" | "Disabled"
  avatar_url?: string
  // Map our old 'name' and 'tenantId' fields so existing components don't break immediately
  name: string
  tenantId: string | null
  avatarUrl?: string
  isTeamLead: boolean
}

export interface Sale {
  id: string
  organization_id: string
  agent_id: string
  processor_id?: string | null
  customer: string // customer_name mapped to customer
  account_type: string
  status: SaleStatus
  notes?: string
  processor_notes?: string
  agent_name?: string
  team_name?: string
  team_id?: string | null
  processor_name?: string
  history_logs?: any[]
  created_at: string
  
  // Mapped old fields
  timeInQueue: string
  timestamp: number
  processorNotes?: string
  processorName?: string
  assignedTo?: string
  tenantId: string
  agent: string
  team: string
  accountType: string
  historyLogs: any[]
  formData?: any
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  read: boolean
  sale_id?: string
  created_at: string
  
  // Mapped old fields
  userId: string
  timestamp: number
  saleId?: string
}

export interface SupportTicket {
  id: string
  user_id: string
  user_name: string
  organization_id: string
  organization_name: string
  subject: string
  description: string
  status: "Open" | "Resolved"
  created_at: string
}

export interface HREmployee {
  id: string
  organization_id: string
  full_name: string
  email: string
  role: string
  team: string
  base_salary: number
  bonus: number
  status: "Active" | "Disabled"
  created_at: string
  avatar_url?: string
  father_name?: string
  cnic_number?: string
  mobile_number?: string
  home_address?: string
  job_title?: string
  joining_date?: string
  employment_type?: string
  commission_per_sale?: number
  document_url?: string
  probation_end_date?: string
}

interface AppContextType {
  // Sales State
  sales: Sale[]
  addSale: (sale: any) => Promise<void>
  updateSaleStatus: (id: string, newStatus: SaleStatus) => Promise<void>
  updateSaleProcessorNotes: (id: string, notes: string) => Promise<void>
  editSale: (id: string, updatedData: any) => Promise<void>
  deleteSale: (id: string) => Promise<void>

  // Multi-Tenant State
  tenants: Tenant[]
  addTenant: (name: string, avatarUrl?: string) => Promise<void>
  updateTenant: (id: string, updates: Partial<Tenant>) => Promise<void>
  
  users: User[]
  addUser: (userData: any) => Promise<void>
  deleteUser: (id: string) => Promise<void>
  updateUserStatus: (id: string, status: "Active" | "Disabled") => Promise<void>
  updateUser: (id: string, updates: Partial<User>) => Promise<void>
  updateUserTeamAndLeadStatus: (id: string, team: string, isTeamLead: boolean) => Promise<void>
  
  // Teams State
  teams: Team[]
  addTeam: (name: string, organizationId: string) => Promise<void>
  updateTeam: (id: string, name: string, organizationId: string) => Promise<void>
  deleteTeam: (id: string) => Promise<void>
  
  // Identity State
  currentUser: User | null
  setCurrentUser: (user: User) => void
  isLoaded: boolean

  // Notifications
  notifications: Notification[]
  markNotificationRead: (id: string) => Promise<void>
  markAllNotificationsRead: (userId: string) => Promise<void>

  // Support Tickets
  tickets: SupportTicket[]
  addTicket: (subject: string, description: string) => Promise<void>
  resolveTicket: (id: string) => Promise<void>

  // HR Employees (Separate System)
  hrEmployees: HREmployee[]
  addHREmployee: (data: Partial<HREmployee>) => Promise<void>
  updateHREmployee: (id: string, updates: Partial<HREmployee>) => Promise<void>
  deleteHREmployee: (id: string) => Promise<void>
}

const AppContext = createContext<AppContextType | undefined>(undefined)

// Helper to map DB profile to UI User
const mapProfileToUser = (profile: any): User => ({
  ...profile,
  name: profile.full_name,
  tenantId: profile.organization_id,
  avatarUrl: profile.avatar_url,
  isTeamLead: profile.is_team_lead || false,
  team_id: profile.team_id
})

const mapDbTenantToTenant = (tenant: any): Tenant => ({
  ...tenant,
  avatarUrl: tenant.avatar_url
})

// Helper to map DB sale to UI Sale
const mapDbSaleToSale = (dbSale: any): Sale => ({
  ...dbSale,
  customer: dbSale.customer,
  accountType: dbSale.account_type,
  processorNotes: dbSale.processor_notes,
  processorName: dbSale.processor_name,
  assignedTo: dbSale.processor_name, // Mapping for backward compatibility
  tenantId: dbSale.organization_id,
  agent: dbSale.agent_name || 'Unknown',
  team: dbSale.team_name || '',
  team_id: dbSale.team_id || null,
  historyLogs: dbSale.history_logs || [],
  timeInQueue: "00m 00s", // we can calculate this dynamically in UI
  timestamp: new Date(dbSale.created_at).getTime(),
  formData: dbSale.form_data || {}
})

const mapDbNotifToNotif = (n: any): Notification => ({
  ...n,
  userId: n.user_id,
  saleId: n.sale_id,
  timestamp: new Date(n.created_at).getTime()
})

export function AppProvider({ children, serverUserId }: { children: ReactNode, serverUserId?: string | null }) {
  const supabase = useMemo(() => createClient(), [])
  
  const [sales, setSales] = useState<Sale[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [hrEmployees, setHrEmployees] = useState<HREmployee[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    let mounted = true;
    setIsLoaded(false);
    
    async function loadData() {
      // 1. Get Session
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        if (mounted) {
          setCurrentUser(null)
          setSales([])
          setTenants([])
          setUsers([])
          setNotifications([])
          setIsLoaded(true)
        }
        return
      }

      // 2. Get Current User Profile
      const { data: profile, error: profileError } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      
      if (profileError) {
        console.error("Failed to load profile:", profileError.message, profileError.details, profileError.hint)
      }

      let orgId = null;
      let currentUserRole = null;
      if (profile) {
        const user = mapProfileToUser(profile)
        if (mounted) setCurrentUser(user)
        orgId = user.tenantId
        currentUserRole = user.role
      }

      // 3. Fetch Data based on Role/Org
      let orgsQuery = supabase.from('organizations').select('*');
      let usersQuery = supabase.from('profiles').select('*');
      let teamsQuery = supabase.from('teams').select('*');
      
      let hrQuery = supabase.from('hr_employees').select('*');
      
      if (profile && profile.role !== 'SuperAdmin' && orgId) {
        orgsQuery = orgsQuery.eq('id', orgId);
        usersQuery = usersQuery.eq('organization_id', orgId);
        teamsQuery = teamsQuery.eq('organization_id', orgId);
        hrQuery = hrQuery.eq('organization_id', orgId);
      }

      const [orgsRes, usersRes, salesRes, notifRes, ticketsRes, teamsRes, hrRes] = await Promise.all([
        orgsQuery,
        usersQuery,
        supabase.from('sales').select('*').order('created_at', { ascending: false }).limit(500),
        supabase.from('notifications').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }).limit(100),
        supabase.from('support_tickets').select('*').order('created_at', { ascending: false }).limit(100),
        teamsQuery,
        hrQuery
      ])

      if (!mounted) return;

      if (orgsRes.data) setTenants(orgsRes.data.map(mapDbTenantToTenant))
      if (usersRes.data) setUsers(usersRes.data.map(mapProfileToUser))
      if (teamsRes.data) setTeams(teamsRes.data)
      if (hrRes.data) setHrEmployees(hrRes.data)
      if (salesRes.data) setSales(salesRes.data.map(mapDbSaleToSale))
      if (notifRes.data) setNotifications(notifRes.data.map(mapDbNotifToNotif))
      if (ticketsRes.data) setTickets(ticketsRes.data)
      setIsLoaded(true)

      // 4. Setup Realtime Subscriptions (only if still mounted)
      const salesSub = supabase.channel(`sales-changes-${session.user.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'sales' }, (payload) => {
          console.log("Realtime Sales Event:", payload.eventType, (payload as any).new?.id || (payload as any).old?.id);
          if (payload.eventType === 'INSERT') {
            setSales(prev => {
              // Prevent duplicates from optimistic updates
              if (prev.some(s => s.id === payload.new.id)) return prev;
              return [mapDbSaleToSale(payload.new), ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            setSales(prev => prev.map(s => s.id === payload.new.id ? mapDbSaleToSale(payload.new) : s))
          } else if (payload.eventType === 'DELETE') {
            setSales(prev => prev.filter(s => s.id !== payload.old.id))
          }
        })
        .subscribe()

      const notifSub = supabase.channel(`notif-changes-${session.user.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${session.user.id}` }, (payload) => {
          if (payload.eventType === 'INSERT') {
            setNotifications(prev => [mapDbNotifToNotif(payload.new), ...prev])
            toast.info(payload.new.title, {
              description: payload.new.message,
            })
          } else if (payload.eventType === 'UPDATE') {
            setNotifications(prev => prev.map(n => n.id === payload.new.id ? mapDbNotifToNotif(payload.new) : n))
          }
        })
        .subscribe()

      const ticketSub = supabase.channel(`ticket-changes-${session.user.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, (payload) => {
          if (payload.eventType === 'INSERT') {
            setTickets(prev => [payload.new as SupportTicket, ...prev])
            if (currentUserRole === "SuperAdmin") {
              toast.info(`New Support Ticket`, { description: payload.new.subject })
            }
          } else if (payload.eventType === 'UPDATE') {
            setTickets(prev => prev.map(t => t.id === payload.new.id ? payload.new as SupportTicket : t))
          }
        })
        .subscribe()

      const teamSub = supabase.channel(`team-changes-${session.user.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, (payload) => {
          if (payload.eventType === 'INSERT') {
            setTeams(prev => [payload.new as Team, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setTeams(prev => prev.map(t => t.id === payload.new.id ? payload.new as Team : t))
          } else if (payload.eventType === 'DELETE') {
            setTeams(prev => prev.filter(t => t.id !== payload.old.id))
          }
        })
        .subscribe()
    }

    loadData()

    return () => {
      mounted = false
      supabase.removeAllChannels()
    }
  }, [serverUserId])

  // ==========================================
  // Mutations
  // ==========================================

  const addSale = async (saleData: any) => {
    if (!currentUser) return;
    
    // saleData comes from UI which expects to pass customer, accountType, etc.
    const newSale: any = {
      organization_id: currentUser.tenantId,
      agent_id: currentUser.id,
      customer: sanitizeInput(saleData.customer, 200),
      account_type: sanitizeInput(saleData.accountType, 50),
      agent_name: currentUser.name,
      team_name: currentUser.team,
      status: 'Pending',
      notes: sanitizeInput(saleData.notes, 2000),
      form_data: sanitizeFormData(saleData.formData),
      history_logs: [{
        action: "Created",
        details: saleData.notes ? `Submitted: "${sanitizeInput(saleData.notes, 100)}"` : "Sale submitted by agent",
        by: currentUser.name,
        timestamp: Date.now()
      }]
    }

    let assignedId = saleData.assignedTo;
    if (assignedId === "Self") {
      assignedId = currentUser.id;
    }

    if (assignedId && assignedId !== "Unassigned") {
      newSale.processor_id = assignedId;
      // Find processor name for backward compatibility
      const processor = users.find(u => u.id === assignedId);
      if (processor) {
        newSale.processor_name = processor.name;
      }
    }

    const { data: insertedSale, error } = await supabase.from('sales').insert(newSale).select().single()
    if (error) {
      console.error("Failed to add sale:", error);
      toast.error("Failed to add sale: " + error.message);
    } else if (insertedSale) {
      
      // Optimistic state update so agent doesn't need to refresh
      setSales(prev => {
        if (prev.some(s => s.id === insertedSale.id)) return prev;
        return [mapDbSaleToSale(insertedSale), ...prev];
      });

      if (insertedSale.processor_id) {
        let notifTitle = 'New Sale Assigned';
        let notifMessage = `${currentUser.name} assigned a new sale to you for ${insertedSale.customer}`;
        
        if (insertedSale.processor_id === currentUser.id) {
          notifTitle = 'Self-Assigned Sale';
          notifMessage = `You assigned a new sale to yourself for ${insertedSale.customer}`;
        }

        await supabase.from('notifications').insert({
          user_id: insertedSale.processor_id,
          title: notifTitle,
          message: notifMessage,
          sale_id: insertedSale.id
        })
      }

      // Notify Admins of the same call center
      const tenantAdmins = users.filter(u => u.role === 'Admin' && u.tenantId === currentUser.tenantId);
      if (tenantAdmins.length > 0) {
        const adminNotifs = tenantAdmins.map(admin => ({
          user_id: admin.id,
          title: 'New Live Sale Added',
          message: `${currentUser.name} logged a new sale for ${insertedSale.customer}.`,
          sale_id: insertedSale.id
        }));
        await supabase.from('notifications').insert(adminNotifs);
      }
    }
  }

  const updateSaleStatus = async (id: string, newStatus: SaleStatus) => {
    if (!currentUser) return;

    // Fetch current sale to get old history logs
    const currentSale = sales.find(s => s.id === id);
    const newLog = {
      action: "Status Changed",
      details: `Changed to ${newStatus}`,
      by: currentUser.name,
      timestamp: Date.now()
    };
    const updatedHistory = [...(currentSale?.historyLogs || []), newLog];

    // Optimistic UI update
    setSales(prev => prev.map(s => s.id === id ? { ...s, status: newStatus, historyLogs: updatedHistory } : s))

    // DB update
    const { data: updatedSale } = await supabase.from('sales').update({ 
      status: newStatus,
      processor_id: currentUser.id,
      processor_name: currentUser.name,
      history_logs: updatedHistory
    }).eq('id', id).select().single()

    // Trigger Notification for the Agent
    if (updatedSale) {
      await supabase.from('notifications').insert({
        user_id: updatedSale.agent_id,
        title: 'Sale Status Updated',
        message: `Your sale for ${updatedSale.customer} was marked as ${newStatus}`,
        sale_id: id
      })
    }
  }

  const updateSaleProcessorNotes = async (id: string, rawNotes: string) => {
    if (!currentUser) return;
    const notes = sanitizeInput(rawNotes, 2000);

    const currentSale = sales.find(s => s.id === id);
    if (!currentSale) return;

    // If the note hasn't changed, do nothing (prevents blank/duplicate notifications)
    if ((currentSale.processorNotes || "") === notes) return;

    let actionLabel = "Note Added";
    let notifTitle = "New Processor Note";
    let notifMsg = `${currentUser.name} added a note: "${notes}"`;

    if (notes === "") {
      actionLabel = "Note Cleared";
      notifTitle = "Processor Note Cleared";
      notifMsg = `${currentUser.name} cleared the processor note.`;
    }

    const newLog = {
      action: actionLabel,
      details: notes,
      by: currentUser.name,
      timestamp: Date.now()
    };
    const updatedHistory = [...(currentSale.historyLogs || []), newLog];

    setSales(prev => prev.map(s => s.id === id ? { ...s, processorNotes: notes, processorName: currentUser.name, historyLogs: updatedHistory } : s))

    const { data: updatedSale } = await supabase.from('sales').update({ 
      processor_notes: notes,
      processor_id: currentUser.id,
      processor_name: currentUser.name,
      history_logs: updatedHistory
    }).eq('id', id).select().single()

    if (updatedSale) {
      await supabase.from('notifications').insert({
        user_id: updatedSale.agent_id,
        title: notifTitle,
        message: notifMsg,
        sale_id: id
      })
    }
  }

  const editSale = async (id: string, updatedData: any) => {
    if (!currentUser) return;
    const dbUpdates: any = {}
    if (updatedData.customer) dbUpdates.customer = sanitizeInput(updatedData.customer, 200)
    if (updatedData.accountType) dbUpdates.account_type = sanitizeInput(updatedData.accountType, 50)
    if (updatedData.notes !== undefined) dbUpdates.notes = sanitizeInput(updatedData.notes, 2000)
    if (updatedData.status) dbUpdates.status = updatedData.status
    if (updatedData.formData) dbUpdates.form_data = sanitizeFormData(updatedData.formData)
    
    if (updatedData.assignedTo === undefined) {
      dbUpdates.processor_name = null;
      dbUpdates.processor_id = null;
    } else if (updatedData.assignedTo) {
      let assignedId = updatedData.assignedTo;
      if (assignedId === "Self") {
        assignedId = currentUser.id;
      }
      dbUpdates.processor_id = assignedId;
      const processor = users.find(u => u.id === assignedId);
      if (processor) {
        dbUpdates.processor_name = processor.name;
      }
    }

    const currentSale = sales.find(s => s.id === id);
    const newLog = {
      action: "Edited",
      details: updatedData.notes ? `Updated with note: "${updatedData.notes}"` : "Sale data manually updated",
      by: currentUser.name,
      timestamp: Date.now()
    };
    const updatedHistory = [...(currentSale?.historyLogs || []), newLog];
    dbUpdates.history_logs = updatedHistory;

    // Optimistic UI update
    setSales(prev => prev.map(s => s.id === id ? { 
      ...s, 
      ...updatedData, 
      accountType: updatedData.accountType || s.accountType,
      processorName: updatedData.assignedTo !== undefined ? updatedData.assignedTo : s.processorName,
      assignedTo: updatedData.assignedTo !== undefined ? updatedData.assignedTo : s.assignedTo,
      historyLogs: updatedHistory
    } : s));
    
    const { data: updatedDbSale } = await supabase.from('sales').update(dbUpdates).eq('id', id).select().single()

    // Send notification if newly assigned or reassigned to a specific processor
    if (updatedDbSale && updatedDbSale.processor_id && updatedData.assignedTo && currentSale?.processorName !== updatedData.assignedTo) {
      let notifTitle = 'Sale Assigned To You';
      let notifMessage = `${currentUser.name} updated and assigned a sale to you for ${updatedDbSale.customer}`;
      
      if (updatedDbSale.processor_id === currentUser.id) {
        notifTitle = 'Self-Assigned Sale';
        notifMessage = `You updated and assigned a sale to yourself for ${updatedDbSale.customer}`;
      }

      await supabase.from('notifications').insert({
        user_id: updatedDbSale.processor_id,
        title: notifTitle,
        message: notifMessage,
        sale_id: id
      })
    }
  }

  const deleteSale = async (id: string) => {
    const { error } = await supabase.from('sales').delete().eq('id', id);
    if (error) {
      toast.error("Failed to delete sale: " + error.message);
    } else {
      setSales(prev => prev.filter(s => s.id !== id));
      toast.success("Sale deleted");
    }
  }

  const addTenant = async (name: string, avatarUrl?: string) => {
    const { data, error } = await supabase.from('organizations').insert([{ name, avatar_url: avatarUrl }]).select().single()
    if (data) setTenants(prev => [...prev, mapDbTenantToTenant(data)])
  }

  const updateTenant = async (id: string, updates: Partial<Tenant>) => {
    const dbUpdates: any = {}
    if (updates.name) dbUpdates.name = updates.name
    if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl
    
    setTenants(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))
    await supabase.from('organizations').update(dbUpdates).eq('id', id)
  }

  const addUser = async (userData: any) => {
    try {
      const response = await fetch('/api/hr/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create user');
      }

      // Refresh the users list after successful creation
      const { data } = await supabase.from('profiles').select('*');
      if (data) setUsers(data.map(mapProfileToUser));
      
      toast.success("User created successfully!");
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  }

  const deleteUser = async (id: string) => {
    try {
      const response = await fetch(`/api/hr/users?id=${id}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete user');
      }

      setUsers(prev => prev.filter(u => u.id !== id));
      toast.success("User deleted successfully!");
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  }

  const updateUserStatus = async (id: string, status: "Active" | "Disabled") => {
    await supabase.from('profiles').update({ status }).eq('id', id)
    const { data } = await supabase.from('profiles').select('*')
    if (data) setUsers(data.map(mapProfileToUser))
  }

  const updateUser = async (id: string, updates: any) => {
    const dbUpdates: any = {}
    if (updates.name) dbUpdates.full_name = updates.name
    if (updates.team !== undefined) dbUpdates.team = updates.team
    if (updates.team_id !== undefined) dbUpdates.team_id = updates.team_id
    if (updates.organization_id !== undefined) dbUpdates.organization_id = updates.organization_id
    if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl

    await supabase.from('profiles').update(dbUpdates).eq('id', id)
    
    if (currentUser?.id === id) {
      setCurrentUser(prev => prev ? { ...prev, ...updates } : prev)
    }

    const { data } = await supabase.from('profiles').select('*')
    if (data) setUsers(data.map(mapProfileToUser))
  }

  const addTeam = async (name: string, organizationId: string) => {
    const existingTeam = teams.find(t => t.name.toLowerCase() === name.toLowerCase() && t.organization_id === organizationId);
    if (existingTeam) {
      toast.error(`A team named "${name}" already exists in this Call Centre.`);
      throw new Error("Duplicate team");
    }
    
    const { data, error } = await supabase.from('teams').insert({ name, organization_id: organizationId }).select().single()
    if (error) {
      toast.error(error.message);
      throw error;
    }
    if (data) {
      setTeams(prev => [data, ...prev])
      toast.success(`Team "${name}" created successfully!`)
    }
  }

  const updateTeam = async (id: string, name: string, organizationId: string) => {
    setTeams(prev => prev.map(t => t.id === id ? { ...t, name, organization_id: organizationId } : t))
    await supabase.from('teams').update({ name, organization_id: organizationId }).eq('id', id)
    
    // Also update existing users and sales that might have the old string name for backward compatibility
    const oldTeam = teams.find(t => t.id === id)
    if (oldTeam && oldTeam.name !== name) {
      await supabase.from('profiles').update({ team: name }).eq('team_id', id)
      await supabase.from('sales').update({ team_name: name }).eq('team_id', id)
      
      const { data } = await supabase.from('profiles').select('*')
      if (data) setUsers(data.map(mapProfileToUser))
    }
  }

  const deleteTeam = async (id: string) => {
    setTeams(prev => prev.filter(t => t.id !== id))
    await supabase.from('teams').delete().eq('id', id)
  }

  const updateUserTeamAndLeadStatus = async (id: string, team: string, isTeamLead: boolean) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, team, isTeamLead } : u))
    if (currentUser?.id === id) {
      setCurrentUser(prev => prev ? { ...prev, team, isTeamLead } : prev)
    }
    await supabase.from('profiles').update({ team, is_team_lead: isTeamLead }).eq('id', id)
  }

  const markNotificationRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    await supabase.from('notifications').update({ read: true }).eq('id', id)
  }

  const markAllNotificationsRead = async (userId: string) => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    await supabase.from('notifications').update({ read: true }).eq('user_id', userId)
  }

  const addTicket = async (subject: string, description: string) => {
    if (!currentUser) return;
    const org = tenants.find(t => t.id === currentUser.tenantId);
    
    await supabase.from('support_tickets').insert({
      user_id: currentUser.id,
      user_name: currentUser.name,
      organization_id: currentUser.tenantId,
      organization_name: org ? org.name : 'SuperAdmin',
      subject: sanitizeInput(subject, 100),
      description: sanitizeInput(description, 5000),
      status: 'Open'
    });

    // Notify SuperAdmins about the new ticket
    const superAdmins = users.filter(u => u.role === 'SuperAdmin');
    if (superAdmins.length > 0) {
      const ticketNotifs = superAdmins.map(admin => ({
        user_id: admin.id,
        title: 'New Support Ticket',
        message: `${currentUser.name} (${org ? org.name : 'Global'}) submitted a new support ticket: ${subject}`
      }));
      await supabase.from('notifications').insert(ticketNotifs);
    }

    toast.success("Support ticket submitted successfully.");
  }

  const resolveTicket = async (id: string) => {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status: 'Resolved' } : t));
    await supabase.from('support_tickets').update({ status: 'Resolved' }).eq('id', id);
    toast.success("Ticket marked as resolved.");
  }

  const addHREmployee = async (data: Partial<HREmployee>) => {
    if (!currentUser?.tenantId && currentUser?.role !== 'SuperAdmin') return;
    const orgId = data.organization_id || currentUser?.tenantId;
    
    const { data: inserted, error } = await supabase.from('hr_employees').insert({
      ...data,
      organization_id: orgId
    }).select().single()
    
    if (error) {
      toast.error(error.message);
      throw error;
    }
    if (inserted) {
      setHrEmployees(prev => [inserted, ...prev])
      toast.success("Employee added successfully!");
    }
  }

  const updateHREmployee = async (id: string, updates: Partial<HREmployee>) => {
    const { data: updated, error } = await supabase.from('hr_employees').update(updates).eq('id', id).select().single()
    if (error) {
      toast.error(error.message);
      throw error;
    }
    if (updated) {
      setHrEmployees(prev => prev.map(e => e.id === id ? updated : e))
      toast.success("Employee updated successfully!");
    }
  }

  const deleteHREmployee = async (id: string) => {
    const { error } = await supabase.from('hr_employees').delete().eq('id', id)
    if (error) {
      toast.error(error.message);
      throw error;
    }
    setHrEmployees(prev => prev.filter(e => e.id !== id))
    toast.success("Employee deleted successfully!");
  }

  return (
    <AppContext.Provider value={{ 
      sales, addSale, updateSaleStatus, updateSaleProcessorNotes, editSale, deleteSale,
      tenants, addTenant, updateTenant,
      users, addUser, deleteUser, updateUserStatus, updateUser, updateUserTeamAndLeadStatus,
      teams, addTeam, updateTeam, deleteTeam,
      currentUser, setCurrentUser, isLoaded,
      notifications, markNotificationRead, markAllNotificationsRead,
      tickets, addTicket, resolveTicket,
      hrEmployees, addHREmployee, updateHREmployee, deleteHREmployee
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useAppContext() {
  const context = useContext(AppContext)
  if (context === undefined) throw new Error("useAppContext must be used within an AppProvider")
  return context
}
