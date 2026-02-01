<script setup>
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { store, getCriteriaProgress, getTotalSpent, getTicketById } from '../stores/projectStore.js'

const phaseColors = [
  '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899',
  '#06b6d4', '#84cc16', '#f97316', '#6366f1', '#14b8a6'
]

const activeView = ref('phases') // 'phases' or 'tickets'

function getPhaseColor(index) {
  return phaseColors[index % phaseColors.length]
}

function getStatusClass(status) {
  return {
    'actief': 'status-actief',
    'niet gestart': 'status-niet-gestart',
    'go-no-go': 'status-go-no-go',
    'afgerond': 'status-afgerond'
  }[status] || ''
}

function formatCurrency(amount) {
  if (!amount) return '-'
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount)
}

const totalSpent = computed(() => getTotalSpent())
const totalBudget = computed(() => store.project.totalBudget)

// Get current week number
function getCurrentWeek() {
  const now = new Date()
  const startOfYear = new Date(now.getFullYear(), 0, 1)
  return Math.ceil(((now - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7)
}

const currentWeek = getCurrentWeek()

// Get tickets grouped by planned week
const ticketsByWeek = computed(() => {
  const weeks = {}
  store.tickets.forEach(ticket => {
    if (ticket.plannedWeek) {
      if (!weeks[ticket.plannedWeek]) {
        weeks[ticket.plannedWeek] = []
      }
      weeks[ticket.plannedWeek].push(ticket)
    }
  })
  return weeks
})

// Get unplanned tickets
const unplannedTickets = computed(() => {
  return store.tickets.filter(t => !t.plannedWeek && t.status !== 'done')
})

// Get tickets with dependencies (chains)
const ticketChains = computed(() => {
  const chains = []
  const processedTickets = new Set()

  // Find root tickets (tickets that don't depend on anything or depend on done tickets)
  store.tickets.forEach(ticket => {
    if (processedTickets.has(ticket.id)) return

    // Check if this is a root of a chain
    const isRoot = !ticket.dependsOn || ticket.dependsOn.length === 0 ||
      ticket.dependsOn.every(depId => {
        const dep = getTicketById(depId)
        return !dep || dep.status === 'done'
      })

    if (isRoot && ticket.blockedBy && ticket.blockedBy.length > 0) {
      // This ticket has dependents, build the chain
      const chain = buildChain(ticket, processedTickets)
      if (chain.length > 1) {
        chains.push(chain)
      }
    }
  })

  return chains
})

function buildChain(ticket, processed) {
  if (processed.has(ticket.id)) return []
  processed.add(ticket.id)

  const chain = [ticket]

  if (ticket.blockedBy) {
    ticket.blockedBy.forEach(blockedId => {
      const blockedTicket = getTicketById(blockedId)
      if (blockedTicket && !processed.has(blockedId)) {
        chain.push(...buildChain(blockedTicket, processed))
      }
    })
  }

  return chain
}

// Get all weeks to display (current + 12 weeks)
const weeksToShow = computed(() => {
  const weeks = []
  for (let i = 0; i < 12; i++) {
    weeks.push(currentWeek + i)
  }
  return weeks
})

function getPhaseName(phaseId) {
  const phase = store.phases.find(p => p.id === phaseId)
  return phase ? phase.name : `Fase ${phaseId}`
}

function getTicketStatusClass(status) {
  return {
    'todo': 'ticket-todo',
    'in-progress': 'ticket-in-progress',
    'done': 'ticket-done'
  }[status] || ''
}
</script>

<template>
  <div class="planning">
    <div class="header">
      <div>
        <h1>Tijdlijn</h1>
        <p class="subtitle">Overzicht van projectfasen, tickets en dependencies</p>
      </div>
      <div class="header-right">
        <div class="view-toggle">
          <button :class="{ active: activeView === 'phases' }" @click="activeView = 'phases'">Fasen</button>
          <button :class="{ active: activeView === 'tickets' }" @click="activeView = 'tickets'">Tickets</button>
        </div>
        <div class="budget-summary">
          <span class="budget-label">Budget</span>
          <span class="budget-value">{{ formatCurrency(totalSpent) }} / {{ formatCurrency(totalBudget) }}</span>
        </div>
      </div>
    </div>

    <!-- Phases View -->
    <template v-if="activeView === 'phases'">
    <!-- Timeline -->
    <div class="timeline">
      <div class="timeline-track">
        <div
          v-for="(phase, index) in store.phases"
          :key="phase.id"
          class="timeline-node"
          :class="{ active: phase.status === 'actief', 'go-no-go': phase.status === 'go-no-go', done: phase.status === 'afgerond' }"
        >
          <div class="node-connector" v-if="index > 0"></div>
          <RouterLink :to="`/fasen/${phase.id}`" class="node-content">
            <div class="node-circle" :style="{ borderColor: getPhaseColor(index) }">
              <span v-if="phase.status === 'afgerond'" class="check-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </span>
              <span v-else>{{ phase.id }}</span>
            </div>
            <div class="node-info">
              <h3>{{ phase.name }}</h3>
              <p>{{ phase.description }}</p>
              <div class="node-meta">
                <span class="status-badge small" :class="getStatusClass(phase.status)">
                  {{ phase.status }}
                </span>
                <span class="criteria-progress">
                  {{ getCriteriaProgress(phase) }}% criteria
                </span>
                <span v-if="phase.budget" class="phase-budget">
                  {{ formatCurrency(phase.budget) }}
                </span>
              </div>
            </div>
          </RouterLink>
          <div v-if="phase.status === 'go-no-go'" class="go-no-go-indicator">
            Go/No-Go
          </div>
        </div>
      </div>
    </div>

    <!-- Phase Cards Grid -->
    <div class="phase-grid">
      <RouterLink
        v-for="(phase, index) in store.phases"
        :key="phase.id"
        :to="`/fasen/${phase.id}`"
        class="phase-card"
        :class="{ active: phase.status === 'actief', done: phase.status === 'afgerond' }"
      >
        <div class="card-header">
          <div class="phase-indicator" :style="{ backgroundColor: getPhaseColor(index) }">
            {{ phase.id }}
          </div>
          <span class="status-badge small" :class="getStatusClass(phase.status)">
            {{ phase.status }}
          </span>
        </div>
        <h3>{{ phase.name }}</h3>
        <div class="progress-row">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: getCriteriaProgress(phase) + '%', backgroundColor: getPhaseColor(index) }"></div>
          </div>
          <span class="progress-text">{{ getCriteriaProgress(phase) }}%</span>
        </div>
        <div class="card-footer">
          <span>{{ phase.goNoGoCriteria.filter(c => c.completed).length }}/{{ phase.goNoGoCriteria.length }} criteria</span>
          <span v-if="phase.budget">{{ formatCurrency(phase.budget) }}</span>
        </div>
      </RouterLink>
    </div>

    <!-- Legend -->
    <div class="legend">
      <div class="legend-item">
        <span class="legend-dot status-niet-gestart"></span>
        <span>Niet gestart</span>
      </div>
      <div class="legend-item">
        <span class="legend-dot status-actief"></span>
        <span>Actief</span>
      </div>
      <div class="legend-item">
        <span class="legend-dot status-go-no-go"></span>
        <span>Go/No-Go</span>
      </div>
      <div class="legend-item">
        <span class="legend-dot status-afgerond"></span>
        <span>Afgerond</span>
      </div>
    </div>
    </template>

    <!-- Tickets View -->
    <template v-if="activeView === 'tickets'">
      <!-- Dependency Chains -->
      <section v-if="ticketChains.length > 0" class="chains-section">
        <h2>Ticket Chains (Dependencies)</h2>
        <p class="section-subtitle">Tickets die van elkaar afhankelijk zijn</p>

        <div class="chains-list">
          <div v-for="(chain, chainIndex) in ticketChains" :key="chainIndex" class="chain">
            <div
              v-for="(ticket, ticketIndex) in chain"
              :key="ticket.id"
              class="chain-ticket"
              :class="getTicketStatusClass(ticket.status)"
            >
              <div class="chain-connector" v-if="ticketIndex > 0">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </div>
              <RouterLink :to="`/tickets?phase=${ticket.phaseId}`" class="chain-ticket-content">
                <span class="chain-ticket-number">{{ ticket.ticketNumber }}</span>
                <span class="chain-ticket-title">{{ ticket.title }}</span>
                <span class="chain-ticket-status">{{ ticket.status }}</span>
                <span v-if="ticket.plannedWeek" class="chain-ticket-week">W{{ ticket.plannedWeek }}</span>
              </RouterLink>
            </div>
          </div>
        </div>
      </section>

      <!-- Week Planning -->
      <section class="week-planning">
        <h2>Week Planning</h2>
        <p class="section-subtitle">Tickets per week (huidige week: {{ currentWeek }})</p>

        <div class="weeks-grid">
          <div
            v-for="week in weeksToShow"
            :key="week"
            class="week-column"
            :class="{ current: week === currentWeek }"
          >
            <div class="week-header">
              <span class="week-number">W{{ week }}</span>
              <span v-if="week === currentWeek" class="current-badge">Nu</span>
            </div>
            <div class="week-tickets">
              <RouterLink
                v-for="ticket in (ticketsByWeek[week] || [])"
                :key="ticket.id"
                :to="`/tickets?phase=${ticket.phaseId}`"
                class="week-ticket"
                :class="getTicketStatusClass(ticket.status)"
              >
                <span class="week-ticket-number">{{ ticket.ticketNumber }}</span>
                <span class="week-ticket-title">{{ ticket.title }}</span>
                <div class="week-ticket-meta">
                  <span class="week-ticket-phase">{{ getPhaseName(ticket.phaseId) }}</span>
                  <span v-if="ticket.dependsOn && ticket.dependsOn.length" class="dep-indicator">← {{ ticket.dependsOn.length }}</span>
                </div>
              </RouterLink>
              <div v-if="!ticketsByWeek[week] || ticketsByWeek[week].length === 0" class="empty-week">
                Geen tickets
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Unplanned Tickets -->
      <section v-if="unplannedTickets.length > 0" class="unplanned-section">
        <h2>Ongepland ({{ unplannedTickets.length }})</h2>
        <p class="section-subtitle">Tickets zonder geplande week</p>

        <div class="unplanned-list">
          <RouterLink
            v-for="ticket in unplannedTickets"
            :key="ticket.id"
            :to="`/tickets?phase=${ticket.phaseId}`"
            class="unplanned-ticket"
            :class="getTicketStatusClass(ticket.status)"
          >
            <span class="unplanned-ticket-number">{{ ticket.ticketNumber }}</span>
            <span class="unplanned-ticket-title">{{ ticket.title }}</span>
            <span class="unplanned-ticket-phase">{{ getPhaseName(ticket.phaseId) }}</span>
            <span class="unplanned-ticket-status">{{ ticket.status }}</span>
          </RouterLink>
        </div>
      </section>

      <!-- Ticket Legend -->
      <div class="legend">
        <div class="legend-item">
          <span class="legend-dot ticket-todo"></span>
          <span>Todo</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot ticket-in-progress"></span>
          <span>In Progress</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot ticket-done"></span>
          <span>Done</span>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.planning {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.header h1 {
  margin: 0;
  font-size: 1.5rem;
}

.subtitle {
  margin: 0.25rem 0 0;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
}

.header-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.75rem;
}

.view-toggle {
  display: flex;
  background: var(--color-border);
  border-radius: 6px;
  padding: 2px;
}

.view-toggle button {
  padding: 0.375rem 0.75rem;
  border: none;
  background: transparent;
  font-size: 0.8rem;
  cursor: pointer;
  border-radius: 4px;
  color: var(--color-text-secondary);
  transition: all 0.2s;
}

.view-toggle button.active {
  background: white;
  color: var(--color-text);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.budget-summary {
  text-align: right;
}

.budget-label {
  display: block;
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  text-transform: uppercase;
}

.budget-value {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text);
}

/* Timeline */
.timeline {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 1.5rem;
  overflow-x: auto;
}

.timeline-track {
  display: flex;
  flex-direction: column;
  gap: 0;
  position: relative;
}

.timeline-node {
  display: flex;
  align-items: flex-start;
  position: relative;
  padding-left: 2.5rem;
  padding-bottom: 1.5rem;
}

.timeline-node:last-child {
  padding-bottom: 0;
}

.node-connector {
  position: absolute;
  left: 15px;
  top: -1.5rem;
  bottom: 50%;
  width: 2px;
  background: var(--color-border);
}

.timeline-node.done .node-connector {
  background: #10b981;
}

.timeline-node.active .node-connector,
.timeline-node.go-no-go .node-connector {
  background: var(--color-primary);
}

.timeline-node::before {
  content: '';
  position: absolute;
  left: 15px;
  top: 15px;
  bottom: 0;
  width: 2px;
  background: var(--color-border);
}

.timeline-node:last-child::before {
  display: none;
}

.timeline-node.done::before {
  background: #10b981;
}

.timeline-node.active::before {
  background: linear-gradient(to bottom, var(--color-primary), var(--color-border));
}

.node-content {
  display: flex;
  gap: 1rem;
  text-decoration: none;
  flex: 1;
}

.node-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 3px solid var(--color-border);
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  flex-shrink: 0;
  position: absolute;
  left: 0;
}

.timeline-node.active .node-circle,
.timeline-node.go-no-go .node-circle {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.timeline-node.done .node-circle {
  border-color: #10b981;
  background: #10b981;
  color: white;
}

.check-icon svg {
  width: 16px;
  height: 16px;
}

.node-info {
  flex: 1;
}

.node-info h3 {
  margin: 0;
  font-size: 1rem;
  color: var(--color-text);
}

.node-info p {
  margin: 0.25rem 0 0;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.node-meta {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.5rem;
  align-items: center;
}

.status-badge {
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 500;
  text-transform: capitalize;
}

.status-badge.small {
  font-size: 0.65rem;
}

.status-actief { background: #dbeafe; color: #1d4ed8; }
.status-niet-gestart { background: #f3f4f6; color: #6b7280; }
.status-go-no-go { background: #fef3c7; color: #d97706; }
.status-afgerond { background: #d1fae5; color: #059669; }

.criteria-progress {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.phase-budget {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.go-no-go-indicator {
  position: absolute;
  right: 0;
  top: 0;
  background: #fef3c7;
  color: #92400e;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

/* Phase Grid */
.phase-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.phase-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1rem;
  text-decoration: none;
  transition: all 0.2s;
}

.phase-card:hover {
  border-color: var(--color-primary);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.phase-card.active {
  border-color: var(--color-primary);
}

.phase-card.done {
  opacity: 0.7;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.phase-indicator {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 0.75rem;
}

.phase-card h3 {
  margin: 0 0 0.75rem;
  font-size: 0.875rem;
  color: var(--color-text);
}

.progress-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: var(--color-border);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s;
}

.progress-text {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  min-width: 2.5rem;
  text-align: right;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  margin-top: 0.75rem;
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

/* Legend */
.legend {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: var(--color-text-secondary);
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.legend-dot.status-niet-gestart { background: #9ca3af; }
.legend-dot.status-actief { background: #3b82f6; }
.legend-dot.status-go-no-go { background: #f59e0b; }
.legend-dot.status-afgerond { background: #10b981; }
.legend-dot.ticket-todo { background: #9ca3af; }
.legend-dot.ticket-in-progress { background: #3b82f6; }
.legend-dot.ticket-done { background: #10b981; }

/* Chains Section */
.chains-section,
.week-planning,
.unplanned-section {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 1.25rem;
}

.chains-section h2,
.week-planning h2,
.unplanned-section h2 {
  margin: 0;
  font-size: 1rem;
}

.section-subtitle {
  margin: 0.25rem 0 1rem;
  font-size: 0.8rem;
  color: var(--color-text-secondary);
}

.chains-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.chain {
  display: flex;
  align-items: center;
  gap: 0;
  overflow-x: auto;
  padding: 0.5rem;
  background: var(--color-background);
  border-radius: 8px;
}

.chain-ticket {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.chain-connector {
  width: 32px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
}

.chain-connector svg {
  width: 20px;
  height: 20px;
}

.chain-ticket-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: white;
  border: 2px solid var(--color-border);
  border-radius: 6px;
  text-decoration: none;
  font-size: 0.8rem;
  transition: all 0.2s;
}

.chain-ticket-content:hover {
  border-color: var(--color-primary);
}

.chain-ticket.ticket-todo .chain-ticket-content { border-left: 3px solid #9ca3af; }
.chain-ticket.ticket-in-progress .chain-ticket-content { border-left: 3px solid #3b82f6; }
.chain-ticket.ticket-done .chain-ticket-content { border-left: 3px solid #10b981; opacity: 0.7; }

.chain-ticket-number {
  font-family: monospace;
  font-weight: 600;
  color: var(--color-primary);
  font-size: 0.75rem;
}

.chain-ticket-title {
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--color-text);
}

.chain-ticket-status {
  font-size: 0.7rem;
  color: var(--color-text-secondary);
  text-transform: capitalize;
}

.chain-ticket-week {
  font-size: 0.7rem;
  background: #dbeafe;
  color: #1d4ed8;
  padding: 0.1rem 0.3rem;
  border-radius: 3px;
}

/* Week Planning */
.weeks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 0.75rem;
}

.week-column {
  background: var(--color-background);
  border-radius: 8px;
  overflow: hidden;
}

.week-column.current {
  border: 2px solid var(--color-primary);
}

.week-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background: var(--color-border);
  font-weight: 600;
  font-size: 0.8rem;
}

.week-column.current .week-header {
  background: var(--color-primary);
  color: white;
}

.current-badge {
  font-size: 0.65rem;
  background: white;
  color: var(--color-primary);
  padding: 0.1rem 0.35rem;
  border-radius: 3px;
}

.week-tickets {
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  min-height: 60px;
}

.week-ticket {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.5rem;
  background: white;
  border-radius: 4px;
  text-decoration: none;
  border-left: 3px solid var(--color-border);
  transition: all 0.2s;
}

.week-ticket:hover {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.week-ticket.ticket-todo { border-left-color: #9ca3af; }
.week-ticket.ticket-in-progress { border-left-color: #3b82f6; }
.week-ticket.ticket-done { border-left-color: #10b981; opacity: 0.7; }

.week-ticket-number {
  font-family: monospace;
  font-weight: 600;
  color: var(--color-primary);
  font-size: 0.7rem;
}

.week-ticket-title {
  font-size: 0.75rem;
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.week-ticket-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.65rem;
  color: var(--color-text-secondary);
}

.dep-indicator {
  background: #fef3c7;
  color: #d97706;
  padding: 0 0.25rem;
  border-radius: 2px;
}

.empty-week {
  text-align: center;
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  padding: 1rem 0.5rem;
}

/* Unplanned Section */
.unplanned-list {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.unplanned-ticket {
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  gap: 0.75rem;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background: var(--color-background);
  border-radius: 6px;
  text-decoration: none;
  font-size: 0.8rem;
  border-left: 3px solid var(--color-border);
}

.unplanned-ticket:hover {
  background: var(--color-border);
}

.unplanned-ticket.ticket-todo { border-left-color: #9ca3af; }
.unplanned-ticket.ticket-in-progress { border-left-color: #3b82f6; }

.unplanned-ticket-number {
  font-family: monospace;
  font-weight: 600;
  color: var(--color-primary);
  font-size: 0.75rem;
}

.unplanned-ticket-title {
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.unplanned-ticket-phase {
  font-size: 0.7rem;
  color: var(--color-text-secondary);
}

.unplanned-ticket-status {
  font-size: 0.65rem;
  text-transform: capitalize;
  color: var(--color-text-secondary);
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: 1rem;
  }

  .header-right {
    width: 100%;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }

  .budget-summary {
    text-align: left;
  }

  .weeks-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .unplanned-ticket {
    grid-template-columns: auto 1fr;
  }

  .unplanned-ticket-phase,
  .unplanned-ticket-status {
    display: none;
  }
}
</style>
