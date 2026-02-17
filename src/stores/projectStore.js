import { reactive } from 'vue'
import { initialData } from '../data/projectplan.js'
import { supabase } from '../services/supabase.js'
import * as api from '../services/projectService.js'

// ============================================================
// Internal ID mapping (integer ↔ UUID)
// ============================================================

const ticketLocalToUuid = new Map()   // local integer id → Supabase UUID
const ticketUuidToLocal = new Map()   // Supabase UUID → local integer id
const phaseNumberToUuid = new Map()   // phase number (1-4) → Supabase UUID
const criterionKeyToUuid = new Map()  // "1-1" criterion key → Supabase UUID
const purchaseLocalToUuid = new Map() // local purchase id → Supabase UUID

let projectUuid = null
let localIdCounter = 1000 // Start high to avoid collision with seed IDs

function registerTicketMapping(localId, uuid) {
  ticketLocalToUuid.set(localId, uuid)
  ticketUuidToLocal.set(uuid, localId)
}

function mapLocalIdsToUuids(localIds) {
  if (!localIds || !Array.isArray(localIds)) return []
  return localIds.map(id => ticketLocalToUuid.get(id)).filter(Boolean)
}

function mapUuidsToLocalIds(uuids) {
  if (!uuids || !Array.isArray(uuids)) return []
  return uuids.map(uuid => ticketUuidToLocal.get(uuid)).filter(id => id !== undefined)
}

// ============================================================
// Reactive store
// ============================================================

export const store = reactive({
  loading: true,
  error: null,
  project: { name: '', description: '', totalBudget: 0, currency: 'EUR' },
  phases: [],
  tickets: [],
  labels: [],
  nextTicketNumber: 1
})

// ============================================================
// Init — called from App.vue after auth
// ============================================================

export async function initStore() {
  store.loading = true
  store.error = null

  try {
    const project = await api.fetchProject()

    if (project) {
      projectUuid = project.id
      await hydrateFromSupabase(project)
    } else {
      await seedFromInitialData()
    }
  } catch (e) {
    console.error('Failed to init project store:', e)
    store.error = e.message
  } finally {
    store.loading = false
  }
}

// ============================================================
// Hydrate store from Supabase data
// ============================================================

async function hydrateFromSupabase(project) {
  const [phases, tickets] = await Promise.all([
    api.fetchPhases(project.id),
    api.fetchTickets(project.id)
  ])

  // Map project
  store.project = {
    name: project.name,
    description: project.description,
    totalBudget: project.total_budget || 0,
    currency: project.currency || 'EUR'
  }
  store.labels = project.labels || []
  store.nextTicketNumber = project.next_ticket_number || 1

  // Map phases
  phaseNumberToUuid.clear()
  criterionKeyToUuid.clear()
  purchaseLocalToUuid.clear()

  store.phases = phases.map(p => {
    phaseNumberToUuid.set(p.phase_number, p.id)

    const criteria = (p.phase_criteria || []).map(c => {
      criterionKeyToUuid.set(`${p.phase_number}-${c.criterion_key}`, c.id)
      // Also store just the criterion_key for lookup
      criterionKeyToUuid.set(c.criterion_key, c.id)
      return {
        id: c.criterion_key,
        _uuid: c.id,
        description: c.description,
        completed: c.completed
      }
    })

    const purchases = (p.phase_purchases || []).map(pp => {
      const localId = Date.now() + Math.random() * 1000 | 0
      purchaseLocalToUuid.set(localId, pp.id)
      return {
        id: localId,
        _uuid: pp.id,
        description: pp.description,
        amount: Number(pp.amount),
        date: pp.purchase_date
      }
    })

    return {
      id: p.phase_number,
      _uuid: p.id,
      name: p.name,
      description: p.description,
      goal: p.goal,
      targetDate: p.target_date,
      measurement: p.measurement,
      status: p.status,
      budget: p.budget ? Number(p.budget) : null,
      spent: 0, // computed from purchases
      noGoAction: p.no_go_action,
      goNoGoCriteria: criteria,
      purchases: purchases,
      goNoGoDecision: p.go_no_go_decision || null
    }
  })

  // Map tickets — first pass: build UUID mapping
  ticketLocalToUuid.clear()
  ticketUuidToLocal.clear()
  localIdCounter = 1000

  // Build phase UUID → number map for reverse lookup
  const phaseUuidToNumber = new Map()
  phases.forEach(p => phaseUuidToNumber.set(p.id, p.phase_number))

  // Assign local IDs and register mappings
  const ticketObjects = tickets.map(t => {
    const localId = localIdCounter++
    registerTicketMapping(localId, t.id)
    return { ...t, _localId: localId }
  })

  // Second pass: map dependencies (which reference UUIDs) to local IDs
  store.tickets = ticketObjects.map(t => ({
    id: t._localId,
    _uuid: t.id,
    ticketNumber: t.ticket_number,
    title: t.title,
    description: t.description || '',
    phaseId: phaseUuidToNumber.get(t.phase_id) || null,
    epic: t.epic,
    status: t.status,
    priority: t.priority,
    value: t.value || '',
    acceptanceCriteria: t.acceptance_criteria || '',
    estimatedHours: t.estimated_hours ? Number(t.estimated_hours) : null,
    plannedWeek: t.planned_week,
    dependsOn: mapUuidsToLocalIds(t.depends_on || []),
    blockedBy: mapUuidsToLocalIds(t.blocked_by || []),
    labels: t.labels || [],
    comments: t.comments || [],
    createdAt: t.created_at
  }))
}

// ============================================================
// Seed from projectplan.js on first login
// ============================================================

async function seedFromInitialData() {
  const { data: { session } } = await supabase.auth.getSession()
  const userId = session.user.id

  // 1. Create project
  const project = await api.createProject({
    user_id: userId,
    name: initialData.project.name,
    description: initialData.project.description,
    total_budget: initialData.project.totalBudget || 0,
    currency: initialData.project.currency || 'EUR',
    labels: [
      { id: 'accounts', name: 'Accounts/inregelen', color: '#2563eb' },
      { id: 'content', name: 'Content (tekst/beeld)', color: '#7c3aed' },
      { id: 'dev', name: 'Dev actie', color: '#059669' }
    ],
    next_ticket_number: initialData.nextTicketNumber || 63
  })
  projectUuid = project.id

  // 2. Create phases (batch)
  const phasesInput = initialData.phases.map(p => ({
    project_id: project.id,
    phase_number: p.id,
    name: p.name,
    description: p.description,
    goal: p.goal,
    target_date: p.targetDate || null,
    measurement: p.measurement,
    status: p.status,
    budget: p.budget || null,
    no_go_action: p.noGoAction
  }))
  const dbPhases = await api.createPhases(phasesInput)

  // Build phase number → UUID map
  const seedPhaseMap = new Map()
  dbPhases.forEach(p => seedPhaseMap.set(p.phase_number, p.id))

  // 3. Create criteria (batch)
  const criteriaInput = []
  initialData.phases.forEach(p => {
    const phaseUuid = seedPhaseMap.get(p.id)
    ;(p.goNoGoCriteria || []).forEach(c => {
      criteriaInput.push({
        phase_id: phaseUuid,
        criterion_key: c.id,
        description: c.description,
        completed: c.completed || false
      })
    })
  })
  if (criteriaInput.length > 0) {
    await api.createCriteria(criteriaInput)
  }

  // 4. Create tickets (batch)
  const ticketsInput = initialData.tickets.map(t => ({
    project_id: project.id,
    phase_id: seedPhaseMap.get(t.phaseId) || null,
    ticket_number: t.ticketNumber,
    title: t.title,
    description: t.description || '',
    epic: t.epic || null,
    status: t.status || 'todo',
    priority: t.priority || 'should',
    estimated_hours: t.estimatedHours || null,
    planned_week: t.plannedWeek || null,
    value: '',
    acceptance_criteria: '',
    labels: [],
    comments: [],
    depends_on: [],
    blocked_by: []
  }))
  const dbTickets = await api.createTickets(ticketsInput)

  // Build local ID → UUID mapping for dependency resolution
  const seedTicketMap = new Map() // original local id → UUID
  dbTickets.forEach((dbT, i) => {
    seedTicketMap.set(initialData.tickets[i].id, dbT.id)
  })

  // 5. Update dependencies (only tickets that have them)
  const depUpdates = []
  initialData.tickets.forEach(t => {
    if ((t.dependsOn && t.dependsOn.length > 0) || (t.blockedBy && t.blockedBy.length > 0)) {
      depUpdates.push({
        uuid: seedTicketMap.get(t.id),
        depends_on: (t.dependsOn || []).map(id => seedTicketMap.get(id)).filter(Boolean),
        blocked_by: (t.blockedBy || []).map(id => seedTicketMap.get(id)).filter(Boolean)
      })
    }
  })
  if (depUpdates.length > 0) {
    await api.bulkUpdateTickets(depUpdates)
  }

  // 6. Hydrate store from what we just created
  await hydrateFromSupabase(project)
}

// ============================================================
// Background persist helpers
// ============================================================

function persistTicket(localId, updates) {
  const uuid = ticketLocalToUuid.get(localId)
  if (!uuid) return
  const dbUpdates = mapTicketUpdatesToDb(updates)
  api.updateTicket(uuid, dbUpdates).catch(e => {
    console.error('Failed to persist ticket:', e)
    store.error = 'Opslaan mislukt'
  })
}

function mapTicketUpdatesToDb(updates) {
  const db = {}
  if ('title' in updates) db.title = updates.title
  if ('description' in updates) db.description = updates.description
  if ('status' in updates) db.status = updates.status
  if ('priority' in updates) db.priority = updates.priority
  if ('epic' in updates) db.epic = updates.epic
  if ('estimatedHours' in updates) db.estimated_hours = updates.estimatedHours
  if ('plannedWeek' in updates) db.planned_week = updates.plannedWeek
  if ('value' in updates) db.value = updates.value
  if ('acceptanceCriteria' in updates) db.acceptance_criteria = updates.acceptanceCriteria
  if ('labels' in updates) db.labels = updates.labels
  if ('comments' in updates) db.comments = updates.comments
  if ('phaseId' in updates) db.phase_id = phaseNumberToUuid.get(updates.phaseId) || null
  if ('dependsOn' in updates) db.depends_on = mapLocalIdsToUuids(updates.dependsOn)
  if ('blockedBy' in updates) db.blocked_by = mapLocalIdsToUuids(updates.blockedBy)
  return db
}

// ============================================================
// Public API — same interface as before
// ============================================================

// --- Phase getters ---

export function getPhaseById(id) {
  return store.phases.find(p => p.id === id)
}

export function getPhaseProgress(phaseId) {
  const tickets = getTicketsByPhase(phaseId)
  if (tickets.length === 0) return 0
  const done = tickets.filter(t => t.status === 'done').length
  return Math.round((done / tickets.length) * 100)
}

export function getCriteriaProgress(phase) {
  if (!phase.goNoGoCriteria || phase.goNoGoCriteria.length === 0) return 0
  const completed = phase.goNoGoCriteria.filter(c => c.completed).length
  return Math.round((completed / phase.goNoGoCriteria.length) * 100)
}

// --- Phase mutations ---

export function updatePhase(id, updates) {
  const phase = store.phases.find(p => p.id === id)
  if (phase) {
    Object.assign(phase, updates)
    // Persist
    const uuid = phaseNumberToUuid.get(id)
    if (uuid) {
      const db = {}
      if ('name' in updates) db.name = updates.name
      if ('description' in updates) db.description = updates.description
      if ('goal' in updates) db.goal = updates.goal
      if ('targetDate' in updates) db.target_date = updates.targetDate
      if ('measurement' in updates) db.measurement = updates.measurement
      if ('status' in updates) db.status = updates.status
      if ('budget' in updates) db.budget = updates.budget
      if ('noGoAction' in updates) db.no_go_action = updates.noGoAction
      api.updatePhase(uuid, db).catch(e => {
        console.error('Failed to persist phase:', e)
        store.error = 'Opslaan mislukt'
      })
    }
  }
  return phase
}

export function toggleCriterion(phaseId, criterionId) {
  const phase = store.phases.find(p => p.id === phaseId)
  if (phase) {
    const criterion = phase.goNoGoCriteria.find(c => c.id === criterionId)
    if (criterion) {
      criterion.completed = !criterion.completed
      // Persist
      const uuid = criterion._uuid || criterionKeyToUuid.get(criterionId)
      if (uuid) {
        api.updateCriterion(uuid, {
          completed: criterion.completed,
          completed_at: criterion.completed ? new Date().toISOString() : null
        }).catch(e => {
          console.error('Failed to persist criterion:', e)
          store.error = 'Opslaan mislukt'
        })
      }
    }
  }
}

export function recordGoNoGoDecision(phaseId, decision, notes) {
  const phase = store.phases.find(p => p.id === phaseId)
  if (phase) {
    phase.goNoGoDecision = {
      decision,
      date: new Date().toISOString(),
      notes
    }
    if (decision === 'go') {
      phase.status = 'afgerond'
      const nextPhase = store.phases.find(p => p.id === phaseId + 1)
      if (nextPhase && nextPhase.status === 'niet gestart') {
        nextPhase.status = 'actief'
        // Persist next phase
        const nextUuid = phaseNumberToUuid.get(phaseId + 1)
        if (nextUuid) {
          api.updatePhase(nextUuid, { status: 'actief' }).catch(console.error)
        }
      }
    }
    // Persist current phase
    const uuid = phaseNumberToUuid.get(phaseId)
    if (uuid) {
      api.updatePhase(uuid, {
        status: phase.status,
        go_no_go_decision: phase.goNoGoDecision
      }).catch(console.error)
    }
  }
}

// --- Budget ---

export function addPurchase(phaseId, purchase) {
  const phase = store.phases.find(p => p.id === phaseId)
  if (phase) {
    if (!phase.purchases) phase.purchases = []
    const localId = Date.now()
    phase.purchases.push({
      id: localId,
      description: purchase.description,
      amount: purchase.amount,
      date: purchase.date || new Date().toISOString().split('T')[0]
    })
    // Persist
    const phaseUuid = phaseNumberToUuid.get(phaseId)
    if (phaseUuid) {
      api.createPurchase({
        phase_id: phaseUuid,
        description: purchase.description,
        amount: purchase.amount,
        purchase_date: purchase.date || new Date().toISOString().split('T')[0]
      }).then(dbPurchase => {
        purchaseLocalToUuid.set(localId, dbPurchase.id)
      }).catch(e => {
        console.error('Failed to persist purchase:', e)
        store.error = 'Opslaan mislukt'
      })
    }
  }
}

export function deletePurchase(phaseId, purchaseId) {
  const phase = store.phases.find(p => p.id === phaseId)
  if (phase && phase.purchases) {
    const index = phase.purchases.findIndex(p => p.id === purchaseId)
    if (index !== -1) {
      phase.purchases.splice(index, 1)
      const uuid = purchaseLocalToUuid.get(purchaseId)
      if (uuid) {
        api.deletePurchase(uuid).catch(console.error)
        purchaseLocalToUuid.delete(purchaseId)
      }
    }
  }
}

export function getPhaseSpent(phaseId) {
  const phase = store.phases.find(p => p.id === phaseId)
  if (!phase || !phase.purchases) return 0
  return phase.purchases.reduce((sum, p) => sum + (p.amount || 0), 0)
}

export function getTotalSpent() {
  return store.phases.reduce((sum, p) => {
    const phaseSpent = (p.purchases || []).reduce((pSum, purchase) => pSum + (purchase.amount || 0), 0)
    return sum + phaseSpent
  }, 0)
}

export function getTotalBudget() {
  return store.phases.reduce((sum, p) => sum + (p.budget || 0), 0)
}

// --- Ticket getters ---

export function getTicketsByPhase(phaseId) {
  return store.tickets.filter(t => t.phaseId === phaseId)
}

export function getTicketsByStatus(status) {
  return store.tickets.filter(t => t.status === status)
}

export function getTicketsByEpic(epic) {
  return store.tickets.filter(t => t.epic === epic)
}

export function getEpicsByPhase(phaseId) {
  const tickets = getTicketsByPhase(phaseId)
  return [...new Set(tickets.map(t => t.epic).filter(Boolean))]
}

export function getTicketById(id) {
  return store.tickets.find(t => t.id === id)
}

export function getTicketByNumber(ticketNumber) {
  return store.tickets.find(t => t.ticketNumber === ticketNumber)
}

export function getNextTicketNumber() {
  const num = store.nextTicketNumber || 1
  return `GT-${String(num).padStart(3, '0')}`
}

// --- Ticket mutations ---

export function addTicket(ticket) {
  const ticketNumber = getNextTicketNumber()
  const localId = Date.now()
  const newTicket = {
    id: localId,
    ticketNumber,
    title: ticket.title || '',
    description: ticket.description || '',
    phaseId: ticket.phaseId,
    epic: ticket.epic || null,
    status: ticket.status || 'todo',
    priority: ticket.priority || 'should',
    value: ticket.value || '',
    acceptanceCriteria: ticket.acceptanceCriteria || '',
    estimatedHours: ticket.estimatedHours || null,
    plannedWeek: ticket.plannedWeek || null,
    dependsOn: ticket.dependsOn || [],
    blockedBy: ticket.blockedBy || [],
    labels: ticket.labels || [],
    comments: [],
    createdAt: new Date().toISOString()
  }
  store.tickets.push(newTicket)
  store.nextTicketNumber = (store.nextTicketNumber || 1) + 1

  // Persist
  if (projectUuid) {
    api.createTicket({
      project_id: projectUuid,
      phase_id: phaseNumberToUuid.get(ticket.phaseId) || null,
      ticket_number: ticketNumber,
      title: newTicket.title,
      description: newTicket.description,
      epic: newTicket.epic,
      status: newTicket.status,
      priority: newTicket.priority,
      value: newTicket.value,
      acceptance_criteria: newTicket.acceptanceCriteria,
      estimated_hours: newTicket.estimatedHours,
      planned_week: newTicket.plannedWeek,
      labels: newTicket.labels,
      comments: [],
      depends_on: mapLocalIdsToUuids(newTicket.dependsOn),
      blocked_by: mapLocalIdsToUuids(newTicket.blockedBy)
    }).then(dbTicket => {
      registerTicketMapping(localId, dbTicket.id)
      newTicket._uuid = dbTicket.id
    }).catch(e => {
      console.error('Failed to persist new ticket:', e)
      store.error = 'Opslaan mislukt'
    })

    // Update next ticket number in project
    api.updateProject(projectUuid, {
      next_ticket_number: store.nextTicketNumber
    }).catch(console.error)
  }

  return newTicket
}

export function updateTicket(id, updates) {
  const ticket = store.tickets.find(t => t.id === id)
  if (ticket) {
    Object.assign(ticket, updates)
    persistTicket(id, updates)
  }
  return ticket
}

export function deleteTicket(id) {
  const index = store.tickets.findIndex(t => t.id === id)
  if (index !== -1) {
    store.tickets.splice(index, 1)
    const uuid = ticketLocalToUuid.get(id)
    if (uuid) {
      api.deleteTicket(uuid).catch(console.error)
      ticketLocalToUuid.delete(id)
      ticketUuidToLocal.delete(uuid)
    }
  }
}

// --- Dependencies ---

export function addDependency(ticketId, dependsOnId) {
  const ticket = store.tickets.find(t => t.id === ticketId)
  const dependsOnTicket = store.tickets.find(t => t.id === dependsOnId)
  if (ticket && dependsOnTicket) {
    if (!ticket.dependsOn) ticket.dependsOn = []
    if (!dependsOnTicket.blockedBy) dependsOnTicket.blockedBy = []

    if (!ticket.dependsOn.includes(dependsOnId)) {
      ticket.dependsOn.push(dependsOnId)
    }
    if (!dependsOnTicket.blockedBy.includes(ticketId)) {
      dependsOnTicket.blockedBy.push(ticketId)
    }

    // Persist both
    persistTicket(ticketId, { dependsOn: ticket.dependsOn })
    persistTicket(dependsOnId, { blockedBy: dependsOnTicket.blockedBy })
  }
}

export function removeDependency(ticketId, dependsOnId) {
  const ticket = store.tickets.find(t => t.id === ticketId)
  const dependsOnTicket = store.tickets.find(t => t.id === dependsOnId)
  if (ticket && ticket.dependsOn) {
    ticket.dependsOn = ticket.dependsOn.filter(id => id !== dependsOnId)
    persistTicket(ticketId, { dependsOn: ticket.dependsOn })
  }
  if (dependsOnTicket && dependsOnTicket.blockedBy) {
    dependsOnTicket.blockedBy = dependsOnTicket.blockedBy.filter(id => id !== ticketId)
    persistTicket(dependsOnId, { blockedBy: dependsOnTicket.blockedBy })
  }
}

export function getTicketChain(ticketId, visited = new Set()) {
  if (visited.has(ticketId)) return []
  visited.add(ticketId)

  const ticket = store.tickets.find(t => t.id === ticketId)
  if (!ticket) return []

  const chain = [ticket]
  if (ticket.dependsOn) {
    ticket.dependsOn.forEach(depId => {
      chain.unshift(...getTicketChain(depId, visited))
    })
  }
  return chain
}

export function getBlockedTickets(ticketId) {
  const ticket = store.tickets.find(t => t.id === ticketId)
  if (!ticket || !ticket.blockedBy) return []
  return ticket.blockedBy.map(id => store.tickets.find(t => t.id === id)).filter(Boolean)
}

export function getDependencyTickets(ticketId) {
  const ticket = store.tickets.find(t => t.id === ticketId)
  if (!ticket || !ticket.dependsOn) return []
  return ticket.dependsOn.map(id => store.tickets.find(t => t.id === id)).filter(Boolean)
}

// --- Comments ---

export function addComment(ticketId, text) {
  const ticket = store.tickets.find(t => t.id === ticketId)
  if (ticket) {
    if (!ticket.comments) ticket.comments = []
    ticket.comments.push({
      id: Date.now(),
      text,
      createdAt: new Date().toISOString()
    })
    persistTicket(ticketId, { comments: ticket.comments })
  }
}

export function deleteComment(ticketId, commentId) {
  const ticket = store.tickets.find(t => t.id === ticketId)
  if (ticket && ticket.comments) {
    const index = ticket.comments.findIndex(c => c.id === commentId)
    if (index !== -1) {
      ticket.comments.splice(index, 1)
      persistTicket(ticketId, { comments: ticket.comments })
    }
  }
}

// --- Labels ---

export function addLabel(label) {
  if (!store.labels) store.labels = []
  store.labels.push({
    id: label.id || Date.now().toString(),
    name: label.name,
    color: label.color || '#6b7280'
  })
  // Persist labels on project
  if (projectUuid) {
    api.updateProject(projectUuid, { labels: store.labels }).catch(console.error)
  }
}

export function deleteLabel(labelId) {
  if (!store.labels) return
  store.labels = store.labels.filter(l => l.id !== labelId)
  store.tickets.forEach(ticket => {
    if (ticket.labels) {
      ticket.labels = ticket.labels.filter(id => id !== labelId)
      persistTicket(ticket.id, { labels: ticket.labels })
    }
  })
  if (projectUuid) {
    api.updateProject(projectUuid, { labels: store.labels }).catch(console.error)
  }
}

export function getLabelById(labelId) {
  if (!store.labels) return null
  return store.labels.find(l => l.id === labelId)
}

// --- Export / Import / Reset ---

export function exportData() {
  const dataStr = JSON.stringify(store, null, 2)
  const blob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `gerustthuis-admin-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export async function importData(jsonString) {
  try {
    const data = JSON.parse(jsonString)
    if (data.project && data.phases) {
      // Delete current project (cascades all child data)
      if (projectUuid) {
        await supabase.from('projects').delete().eq('id', projectUuid)
      }
      // Re-seed with imported data — reuse seed logic
      // First, map imported data to initialData format
      const importAsInitial = {
        project: data.project,
        phases: data.phases,
        tickets: data.tickets || [],
        nextTicketNumber: data.nextTicketNumber || 1
      }
      // Temporarily replace initialData reference
      const origPhases = initialData.phases
      const origTickets = initialData.tickets
      const origProject = initialData.project
      const origNext = initialData.nextTicketNumber
      Object.assign(initialData, importAsInitial)
      await seedFromInitialData()
      // Restore (in case someone resets later)
      initialData.phases = origPhases
      initialData.tickets = origTickets
      initialData.project = origProject
      initialData.nextTicketNumber = origNext
      return true
    }
  } catch (e) {
    console.error('Failed to import data:', e)
    store.error = 'Import mislukt'
  }
  return false
}

export async function resetData() {
  if (projectUuid) {
    await supabase.from('projects').delete().eq('id', projectUuid)
    projectUuid = null
  }
  await seedFromInitialData()
}
