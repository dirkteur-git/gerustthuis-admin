import { reactive, watch } from 'vue'
import { initialData } from '../data/projectplan.js'

const STORAGE_KEY = 'gerustthuis-projectplan'

// Load from localStorage or use initial data
function loadData() {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch (e) {
      console.error('Failed to parse stored data:', e)
    }
  }
  return JSON.parse(JSON.stringify(initialData))
}

// Create reactive store
export const store = reactive(loadData())

// Migrate existing tickets without ticketNumber
function migrateTickets() {
  let needsMigration = false
  store.tickets.forEach(ticket => {
    if (!ticket.ticketNumber) {
      ticket.ticketNumber = `GT-${String(store.nextTicketNumber || 1).padStart(3, '0')}`
      store.nextTicketNumber = (store.nextTicketNumber || 1) + 1
      needsMigration = true
    }
    // Migrate deadline to plannedWeek if exists
    if (ticket.deadline && !ticket.plannedWeek) {
      // Convert date to week number
      const date = new Date(ticket.deadline)
      const startOfYear = new Date(date.getFullYear(), 0, 1)
      const weekNum = Math.ceil(((date - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7)
      ticket.plannedWeek = weekNum
      delete ticket.deadline
      needsMigration = true
    }
    // Initialize dependencies arrays if not present
    if (!ticket.dependsOn) {
      ticket.dependsOn = []
      needsMigration = true
    }
    if (!ticket.blockedBy) {
      ticket.blockedBy = []
      needsMigration = true
    }
  })
  if (needsMigration) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  }
}
migrateTickets()

// Auto-save to localStorage
watch(
  () => store,
  (newValue) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newValue))
  },
  { deep: true }
)

// Helper functions
export function getPhaseById(id) {
  return store.phases.find(p => p.id === id)
}

export function getTicketsByPhase(phaseId) {
  return store.tickets.filter(t => t.phaseId === phaseId)
}

export function getTicketsByStatus(status) {
  return store.tickets.filter(t => t.status === status)
}

export function getNextTicketNumber() {
  const num = store.nextTicketNumber || 1
  return `GT-${String(num).padStart(3, '0')}`
}

export function addTicket(ticket) {
  const ticketNumber = getNextTicketNumber()
  const newTicket = {
    id: Date.now(),
    ticketNumber,
    title: ticket.title || '',
    description: ticket.description || '',
    phaseId: ticket.phaseId,
    status: ticket.status || 'todo',
    priority: ticket.priority || 'should',
    estimatedHours: ticket.estimatedHours || null,
    plannedWeek: ticket.plannedWeek || null,
    dependsOn: ticket.dependsOn || [], // tickets that must be done before this one
    blockedBy: ticket.blockedBy || [], // tickets that are waiting for this one
    createdAt: new Date().toISOString()
  }
  store.tickets.push(newTicket)
  store.nextTicketNumber = (store.nextTicketNumber || 1) + 1
  return newTicket
}

export function getTicketById(id) {
  return store.tickets.find(t => t.id === id)
}

export function getTicketByNumber(ticketNumber) {
  return store.tickets.find(t => t.ticketNumber === ticketNumber)
}

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
  }
}

export function removeDependency(ticketId, dependsOnId) {
  const ticket = store.tickets.find(t => t.id === ticketId)
  const dependsOnTicket = store.tickets.find(t => t.id === dependsOnId)
  if (ticket && ticket.dependsOn) {
    ticket.dependsOn = ticket.dependsOn.filter(id => id !== dependsOnId)
  }
  if (dependsOnTicket && dependsOnTicket.blockedBy) {
    dependsOnTicket.blockedBy = dependsOnTicket.blockedBy.filter(id => id !== ticketId)
  }
}

export function getTicketChain(ticketId, visited = new Set()) {
  if (visited.has(ticketId)) return []
  visited.add(ticketId)

  const ticket = store.tickets.find(t => t.id === ticketId)
  if (!ticket) return []

  const chain = [ticket]

  // Get all tickets this depends on (predecessors)
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

export function updateTicket(id, updates) {
  const ticket = store.tickets.find(t => t.id === id)
  if (ticket) {
    Object.assign(ticket, updates)
  }
  return ticket
}

export function deleteTicket(id) {
  const index = store.tickets.findIndex(t => t.id === id)
  if (index !== -1) {
    store.tickets.splice(index, 1)
  }
}

export function updatePhase(id, updates) {
  const phase = store.phases.find(p => p.id === id)
  if (phase) {
    Object.assign(phase, updates)
  }
  return phase
}

export function toggleCriterion(phaseId, criterionId) {
  const phase = store.phases.find(p => p.id === phaseId)
  if (phase) {
    const criterion = phase.goNoGoCriteria.find(c => c.id === criterionId)
    if (criterion) {
      criterion.completed = !criterion.completed
    }
  }
}

export function recordGoNoGoDecision(phaseId, decision, notes) {
  const phase = store.phases.find(p => p.id === phaseId)
  if (phase) {
    phase.goNoGoDecision = {
      decision, // 'go' or 'no-go'
      date: new Date().toISOString(),
      notes
    }
    if (decision === 'go') {
      phase.status = 'afgerond'
      // Activate next phase if exists
      const nextPhase = store.phases.find(p => p.id === phaseId + 1)
      if (nextPhase && nextPhase.status === 'niet gestart') {
        nextPhase.status = 'actief'
      }
    }
  }
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

export function getTotalSpent() {
  return store.phases.reduce((sum, p) => {
    const phaseSpent = (p.purchases || []).reduce((pSum, purchase) => pSum + (purchase.amount || 0), 0)
    return sum + phaseSpent
  }, 0)
}

export function getPhaseSpent(phaseId) {
  const phase = store.phases.find(p => p.id === phaseId)
  if (!phase || !phase.purchases) return 0
  return phase.purchases.reduce((sum, p) => sum + (p.amount || 0), 0)
}

export function addPurchase(phaseId, purchase) {
  const phase = store.phases.find(p => p.id === phaseId)
  if (phase) {
    if (!phase.purchases) {
      phase.purchases = []
    }
    phase.purchases.push({
      id: Date.now(),
      description: purchase.description,
      amount: purchase.amount,
      date: purchase.date || new Date().toISOString().split('T')[0]
    })
  }
}

export function deletePurchase(phaseId, purchaseId) {
  const phase = store.phases.find(p => p.id === phaseId)
  if (phase && phase.purchases) {
    const index = phase.purchases.findIndex(p => p.id === purchaseId)
    if (index !== -1) {
      phase.purchases.splice(index, 1)
    }
  }
}

export function getTotalBudget() {
  return store.phases.reduce((sum, p) => sum + (p.budget || 0), 0)
}

export function exportData() {
  const dataStr = JSON.stringify(store, null, 2)
  const blob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `gerustthuis-projectplan-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function importData(jsonString) {
  try {
    const data = JSON.parse(jsonString)
    if (data.project && data.phases) {
      Object.assign(store, data)
      return true
    }
  } catch (e) {
    console.error('Failed to import data:', e)
  }
  return false
}

export function resetData() {
  const fresh = JSON.parse(JSON.stringify(initialData))
  Object.assign(store, fresh)
}
