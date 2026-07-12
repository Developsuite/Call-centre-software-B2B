"use client"

import React, { useState, useEffect } from "react"
import { useAppContext, User, Team, Tenant } from "@/store/AppContext"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

interface TeamEditModalProps {
  isOpen: boolean
  onClose: () => void
  team: Team | null // null means we are creating a new team
}

export function TeamEditModal({ isOpen, onClose, team }: TeamEditModalProps) {
  const { addTeam, updateTeam, deleteTeam, tenants, users, updateUser, currentUser } = useAppContext()
  const [name, setName] = useState("")
  const [organizationId, setOrganizationId] = useState("")
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize state when modal opens
  useEffect(() => {
    if (isOpen) {
      if (team) {
        setName(team.name)
        setOrganizationId(team.organization_id)
        // Find users currently in this team
        const teamUsers = users.filter(u => u.team_id === team.id || u.team === team.name)
        setSelectedUserIds(teamUsers.map(u => u.id))
      } else {
        setName("")
        setOrganizationId(currentUser?.tenantId || "")
        setSelectedUserIds([])
      }
    }
  }, [isOpen, team, users, currentUser])

  // Filter users by the selected organization
  const orgUsers = users.filter(u => u.tenantId === organizationId && u.role !== 'SuperAdmin')

  const handleSubmit = async () => {
    if (!name || !organizationId) return
    setIsSubmitting(true)
    
    try {
      if (team) {
        // Update existing team
        await updateTeam(team.id, name, organizationId)
        
        // Update users assignment
        // 1. Remove users that were deselected
        const previouslySelected = users.filter(u => u.team_id === team.id || u.team === team.name)
        for (const user of previouslySelected) {
          if (!selectedUserIds.includes(user.id)) {
            await updateUser(user.id, { team: "", team_id: null })
          }
        }
        
        // 2. Add users that were newly selected
        for (const userId of selectedUserIds) {
          const user = users.find(u => u.id === userId)
          if (user && (user.team_id !== team.id || user.team !== name)) {
            await updateUser(userId, { team: name, team_id: team.id })
          }
        }
      } else {
        // Create new team
        await addTeam(name, organizationId)
        // Note: For a brand new team, we don't have the generated ID yet to assign users immediately in this simple flow.
        // In a more complex flow, addTeam would return the ID and we'd assign them.
        // For MVP, they can create the team then edit it to add users.
      }
      onClose()
    } catch (error) {
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (team && confirm("Are you sure you want to delete this team?")) {
      setIsSubmitting(true)
      try {
        // Unassign all users first
        const teamUsers = users.filter(u => u.team_id === team.id || u.team === team.name)
        for (const user of teamUsers) {
          await updateUser(user.id, { team: "", team_id: null })
        }
        await deleteTeam(team.id)
        onClose()
      } catch (error) {
        console.error(error)
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{team ? "Edit Team" : "Create New Team"}</DialogTitle>
          <DialogDescription>
            {team ? "Update team details and assigned users." : "Create a new team and assign it to a Call Centre."}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Team Name</Label>
            <Input 
              id="name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="e.g. Alpha Squad" 
            />
          </div>
          
          {currentUser?.role === 'SuperAdmin' && (
            <div className="grid gap-2">
              <Label>Call Centre (Tenant)</Label>
              <Select value={organizationId} onValueChange={(val) => setOrganizationId(val || "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a Call Centre">
                    {organizationId ? tenants.find(t => t.id === organizationId)?.name : "Select a Call Centre"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {tenants.map(tenant => (
                    <SelectItem key={tenant.id} value={tenant.id}>{tenant.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {team && (
            <div className="grid gap-2 mt-4">
              <Label>Team Members</Label>
              <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 max-h-[200px] overflow-y-auto space-y-3">
                {orgUsers.length === 0 ? (
                  <p className="text-sm text-slate-500">No available users in this Call Centre.</p>
                ) : (
                  orgUsers.map(user => (
                    <div key={user.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`user-${user.id}`} 
                        checked={selectedUserIds.includes(user.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedUserIds([...selectedUserIds, user.id])
                          } else {
                            setSelectedUserIds(selectedUserIds.filter(id => id !== user.id))
                          }
                        }}
                      />
                      <label 
                        htmlFor={`user-${user.id}`} 
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {user.name} <span className="text-slate-400 font-normal">({user.role})</span>
                      </label>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter className="flex items-center justify-between">
          {team ? (
            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
              Delete Team
            </Button>
          ) : <div></div>}
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
            <Button 
              className="bg-[#ff5a36] hover:bg-[#ff5a36]/90 text-white" 
              onClick={handleSubmit} 
              disabled={isSubmitting || !name || !organizationId}
            >
              {team ? "Save Changes" : "Create Team"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
