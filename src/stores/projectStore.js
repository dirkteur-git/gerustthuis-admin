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

export function addTicket(ticket) {
  const newTicket = {
    id: Date.now(),
    title: ticket.title || '',
    description: ticket.description || '',
    phaseId: ticket.phaseId,
    status: ticket.status || 'todo',
    priority: ticket.priority || 'should',
    estimatedHours: ticket.estimatedHours || null,
    deadline: ticket.deadline || null,
    createdAt: new Date().toISOString()
  }
  store.tickets.push(newTicket)
  return newTicket
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
