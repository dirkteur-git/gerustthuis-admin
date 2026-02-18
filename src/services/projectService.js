import { supabase, planningDb } from './supabase.js'

// ============================================================
// Project
// ============================================================

export async function fetchProject() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', session.user.id)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function createProject(projectData) {
  const { data, error } = await supabase
    .from('projects')
    .insert(projectData)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateProject(projectUuid, updates) {
  const { error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', projectUuid)

  if (error) throw error
}

// ============================================================
// Phases
// ============================================================

export async function fetchPhases(projectId) {
  const { data, error } = await planningDb()
    .from('project_phases')
    .select(`
      *,
      phase_criteria ( * ),
      phase_purchases ( * )
    `)
    .eq('project_id', projectId)
    .order('phase_number')

  if (error) throw error
  return data || []
}

export async function createPhases(phasesArray) {
  const { data, error } = await planningDb()
    .from('project_phases')
    .insert(phasesArray)
    .select()

  if (error) throw error
  return data
}

export async function updatePhase(phaseUuid, updates) {
  const { error } = await planningDb()
    .from('project_phases')
    .update(updates)
    .eq('id', phaseUuid)

  if (error) throw error
}

// ============================================================
// Phase Criteria
// ============================================================

export async function createCriteria(criteriaArray) {
  const { data, error } = await planningDb()
    .from('phase_criteria')
    .insert(criteriaArray)
    .select()

  if (error) throw error
  return data
}

export async function updateCriterion(criterionUuid, updates) {
  const { error } = await planningDb()
    .from('phase_criteria')
    .update(updates)
    .eq('id', criterionUuid)

  if (error) throw error
}

// ============================================================
// Phase Purchases
// ============================================================

export async function createPurchase(purchaseData) {
  const { data, error } = await planningDb()
    .from('phase_purchases')
    .insert(purchaseData)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deletePurchase(purchaseUuid) {
  const { error } = await planningDb()
    .from('phase_purchases')
    .delete()
    .eq('id', purchaseUuid)

  if (error) throw error
}

// ============================================================
// Tickets
// ============================================================

export async function fetchTickets(projectId) {
  const { data, error } = await planningDb()
    .from('project_tickets')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at')

  if (error) throw error
  return data || []
}

export async function createTickets(ticketsArray) {
  const { data, error } = await planningDb()
    .from('project_tickets')
    .insert(ticketsArray)
    .select()

  if (error) throw error
  return data
}

export async function createTicket(ticketData) {
  const { data, error } = await planningDb()
    .from('project_tickets')
    .insert(ticketData)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateTicket(ticketUuid, updates) {
  const { error } = await planningDb()
    .from('project_tickets')
    .update(updates)
    .eq('id', ticketUuid)

  if (error) throw error
}

export async function deleteTicket(ticketUuid) {
  const { error } = await planningDb()
    .from('project_tickets')
    .delete()
    .eq('id', ticketUuid)

  if (error) throw error
}

// ============================================================
// Bulk update (for dependency arrays after seed)
// ============================================================

export async function bulkUpdateTickets(updates) {
  // updates = [{ uuid, depends_on, blocked_by }, ...]
  for (const u of updates) {
    await updateTicket(u.uuid, {
      depends_on: u.depends_on,
      blocked_by: u.blocked_by
    })
  }
}
