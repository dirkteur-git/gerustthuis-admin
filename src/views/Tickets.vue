<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { store, addTicket, updateTicket, deleteTicket, addDependency, removeDependency, getTicketById } from '../stores/projectStore.js'

const route = useRoute()

const filterPhase = ref(route.query.phase ? parseInt(route.query.phase) : 'all')
const filterPriority = ref(route.query.priority || 'all')

const filteredTickets = computed(() => {
  return store.tickets.filter(t => {
    if (filterPhase.value !== 'all' && t.phaseId !== filterPhase.value) return false
    if (filterPriority.value !== 'all' && t.priority !== filterPriority.value) return false
    return true
  })
})

const todoTickets = computed(() => filteredTickets.value.filter(t => t.status === 'todo'))
const inProgressTickets = computed(() => filteredTickets.value.filter(t => t.status === 'in-progress'))
const doneTickets = computed(() => filteredTickets.value.filter(t => t.status === 'done'))

const showAddModal = ref(false)
const showEditModal = ref(false)
const editingTicket = ref(null)

const newTicket = ref({
  title: '',
  description: '',
  phaseId: 0,
  priority: 'should',
  estimatedHours: null,
  plannedWeek: null
})

// Get current week number
function getCurrentWeek() {
  const now = new Date()
  const startOfYear = new Date(now.getFullYear(), 0, 1)
  return Math.ceil(((now - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7)
}

// Generate week options (current week + 26 weeks ahead)
const weekOptions = computed(() => {
  const current = getCurrentWeek()
  const options = []
  for (let i = 0; i < 26; i++) {
    const week = current + i
    options.push({ value: week, label: `Week ${week}` })
  }
  return options
})

// Get available tickets for dependency selection (excluding self)
function getAvailableTicketsForDependency(excludeId) {
  return store.tickets.filter(t => t.id !== excludeId)
}

// Add dependency to editing ticket
function addTicketDependency(dependsOnId) {
  if (!editingTicket.value.dependsOn) {
    editingTicket.value.dependsOn = []
  }
  if (!editingTicket.value.dependsOn.includes(dependsOnId)) {
    editingTicket.value.dependsOn.push(dependsOnId)
  }
}

// Remove dependency from editing ticket
function removeTicketDependency(dependsOnId) {
  if (editingTicket.value.dependsOn) {
    editingTicket.value.dependsOn = editingTicket.value.dependsOn.filter(id => id !== dependsOnId)
  }
}

// Get ticket info by id
function getTicketInfo(ticketId) {
  return getTicketById(ticketId)
}

// Drag and drop
const draggedTicket = ref(null)

function onDragStart(event, ticket) {
  draggedTicket.value = ticket
  event.dataTransfer.effectAllowed = 'move'
}

function onDragOver(event) {
  event.preventDefault()
  event.dataTransfer.dropEffect = 'move'
}

function onDrop(event, newStatus) {
  event.preventDefault()
  if (draggedTicket.value) {
    updateTicket(draggedTicket.value.id, { status: newStatus })
    draggedTicket.value = null
  }
}

function openAddModal() {
  newTicket.value = {
    title: '',
    description: '',
    phaseId: filterPhase.value !== 'all' ? filterPhase.value : 0,
    priority: 'should',
    estimatedHours: null,
    plannedWeek: null
  }
  showAddModal.value = true
}

function submitNewTicket() {
  if (!newTicket.value.title.trim()) return
  addTicket({
    ...newTicket.value,
    status: 'todo'
  })
  showAddModal.value = false
}

function openEditModal(ticket) {
  editingTicket.value = { ...ticket }
  showEditModal.value = true
}

function submitEditTicket() {
  if (!editingTicket.value.title.trim()) return
  updateTicket(editingTicket.value.id, editingTicket.value)
  showEditModal.value = false
  editingTicket.value = null
}

function confirmDeleteTicket() {
  if (confirm('Weet je zeker dat je dit ticket wilt verwijderen?')) {
    deleteTicket(editingTicket.value.id)
    showEditModal.value = false
    editingTicket.value = null
  }
}

function getPhaseName(phaseId) {
  const phase = store.phases.find(p => p.id === phaseId)
  return phase ? phase.name : `Fase ${phaseId}`
}
</script>

<template>
  <div class="tickets-page">
    <div class="header">
      <div>
        <h1>Tickets</h1>
        <p class="subtitle">{{ filteredTickets.length }} tickets</p>
      </div>
      <button class="add-btn" @click="openAddModal">+ Nieuw ticket</button>
    </div>

    <!-- Filters -->
    <div class="filters">
      <div class="filter-group">
        <label>Fase</label>
        <select v-model="filterPhase">
          <option value="all">Alle fasen</option>
          <option v-for="phase in store.phases" :key="phase.id" :value="phase.id">
            {{ phase.id }}. {{ phase.name }}
          </option>
        </select>
      </div>
      <div class="filter-group">
        <label>Prioriteit</label>
        <select v-model="filterPriority">
          <option value="all">Alle prioriteiten</option>
          <option value="must">Must have</option>
          <option value="should">Should have</option>
          <option value="nice">Nice to have</option>
        </select>
      </div>
    </div>

    <!-- Kanban Board -->
    <div class="kanban-board">
      <!-- Todo Column -->
      <div
        class="kanban-column"
        @dragover="onDragOver"
        @drop="onDrop($event, 'todo')"
      >
        <div class="column-header">
          <h3>Todo</h3>
          <span class="count">{{ todoTickets.length }}</span>
        </div>
        <div class="column-content">
          <div
            v-for="ticket in todoTickets"
            :key="ticket.id"
            class="ticket-card"
            draggable="true"
            @dragstart="onDragStart($event, ticket)"
            @click="openEditModal(ticket)"
          >
            <div class="ticket-header">
              <span class="ticket-number">{{ ticket.ticketNumber }}</span>
              <span class="priority-badge" :class="ticket.priority">{{ ticket.priority }}</span>
              <span class="phase-tag">{{ ticket.phaseId }}</span>
            </div>
            <h4>{{ ticket.title }}</h4>
            <p v-if="ticket.description">{{ ticket.description }}</p>
            <div class="ticket-meta">
              <span v-if="ticket.estimatedHours">{{ ticket.estimatedHours }}u</span>
              <span v-if="ticket.plannedWeek" class="week-badge">W{{ ticket.plannedWeek }}</span>
              <span v-if="ticket.dependsOn && ticket.dependsOn.length" class="dep-badge" title="Heeft dependencies">
                ← {{ ticket.dependsOn.length }}
              </span>
              <span v-if="ticket.blockedBy && ticket.blockedBy.length" class="blocked-badge" title="Blokkeert andere tickets">
                → {{ ticket.blockedBy.length }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- In Progress Column -->
      <div
        class="kanban-column"
        @dragover="onDragOver"
        @drop="onDrop($event, 'in-progress')"
      >
        <div class="column-header in-progress">
          <h3>In Progress</h3>
          <span class="count">{{ inProgressTickets.length }}</span>
        </div>
        <div class="column-content">
          <div
            v-for="ticket in inProgressTickets"
            :key="ticket.id"
            class="ticket-card"
            draggable="true"
            @dragstart="onDragStart($event, ticket)"
            @click="openEditModal(ticket)"
          >
            <div class="ticket-header">
              <span class="ticket-number">{{ ticket.ticketNumber }}</span>
              <span class="priority-badge" :class="ticket.priority">{{ ticket.priority }}</span>
              <span class="phase-tag">{{ ticket.phaseId }}</span>
            </div>
            <h4>{{ ticket.title }}</h4>
            <p v-if="ticket.description">{{ ticket.description }}</p>
            <div class="ticket-meta">
              <span v-if="ticket.estimatedHours">{{ ticket.estimatedHours }}u</span>
              <span v-if="ticket.plannedWeek" class="week-badge">W{{ ticket.plannedWeek }}</span>
              <span v-if="ticket.dependsOn && ticket.dependsOn.length" class="dep-badge" title="Heeft dependencies">
                ← {{ ticket.dependsOn.length }}
              </span>
              <span v-if="ticket.blockedBy && ticket.blockedBy.length" class="blocked-badge" title="Blokkeert andere tickets">
                → {{ ticket.blockedBy.length }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Done Column -->
      <div
        class="kanban-column"
        @dragover="onDragOver"
        @drop="onDrop($event, 'done')"
      >
        <div class="column-header done">
          <h3>Done</h3>
          <span class="count">{{ doneTickets.length }}</span>
        </div>
        <div class="column-content">
          <div
            v-for="ticket in doneTickets"
            :key="ticket.id"
            class="ticket-card done"
            draggable="true"
            @dragstart="onDragStart($event, ticket)"
            @click="openEditModal(ticket)"
          >
            <div class="ticket-header">
              <span class="ticket-number">{{ ticket.ticketNumber }}</span>
              <span class="priority-badge" :class="ticket.priority">{{ ticket.priority }}</span>
              <span class="phase-tag">{{ ticket.phaseId }}</span>
            </div>
            <h4>{{ ticket.title }}</h4>
            <p v-if="ticket.description">{{ ticket.description }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Modal -->
    <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
      <div class="modal">
        <h3>Nieuw Ticket</h3>
        <div class="form-group">
          <label>Titel *</label>
          <input v-model="newTicket.title" type="text" placeholder="Wat moet er gebeuren?" autofocus />
        </div>
        <div class="form-group">
          <label>Beschrijving</label>
          <textarea v-model="newTicket.description" rows="3" placeholder="Meer details..."></textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Fase</label>
            <select v-model="newTicket.phaseId">
              <option v-for="phase in store.phases" :key="phase.id" :value="phase.id">
                {{ phase.id }}. {{ phase.name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Prioriteit</label>
            <select v-model="newTicket.priority">
              <option value="must">Must have</option>
              <option value="should">Should have</option>
              <option value="nice">Nice to have</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Geschatte uren</label>
            <input v-model.number="newTicket.estimatedHours" type="number" min="0" placeholder="0" />
          </div>
          <div class="form-group">
            <label>Geplande week</label>
            <select v-model="newTicket.plannedWeek">
              <option :value="null">Niet gepland</option>
              <option v-for="week in weekOptions" :key="week.value" :value="week.value">
                {{ week.label }}
              </option>
            </select>
          </div>
        </div>
        <div class="modal-actions">
          <button @click="showAddModal = false">Annuleren</button>
          <button class="primary" @click="submitNewTicket" :disabled="!newTicket.title.trim()">
            Toevoegen
          </button>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <div v-if="showEditModal && editingTicket" class="modal-overlay" @click.self="showEditModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>Ticket Bewerken</h3>
          <span class="modal-ticket-number">{{ editingTicket.ticketNumber }}</span>
        </div>
        <div class="form-group">
          <label>Titel *</label>
          <input v-model="editingTicket.title" type="text" />
        </div>
        <div class="form-group">
          <label>Beschrijving</label>
          <textarea v-model="editingTicket.description" rows="3"></textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Fase</label>
            <select v-model="editingTicket.phaseId">
              <option v-for="phase in store.phases" :key="phase.id" :value="phase.id">
                {{ phase.id }}. {{ phase.name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Prioriteit</label>
            <select v-model="editingTicket.priority">
              <option value="must">Must have</option>
              <option value="should">Should have</option>
              <option value="nice">Nice to have</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Status</label>
            <select v-model="editingTicket.status">
              <option value="todo">Todo</option>
              <option value="in-progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>
          <div class="form-group">
            <label>Geschatte uren</label>
            <input v-model.number="editingTicket.estimatedHours" type="number" min="0" />
          </div>
        </div>
        <div class="form-group">
          <label>Geplande week</label>
          <select v-model="editingTicket.plannedWeek">
            <option :value="null">Niet gepland</option>
            <option v-for="week in weekOptions" :key="week.value" :value="week.value">
              {{ week.label }}
            </option>
          </select>
        </div>

        <!-- Dependencies Section -->
        <div class="dependencies-section">
          <label>Afhankelijk van (moet eerst af)</label>
          <div v-if="editingTicket.dependsOn && editingTicket.dependsOn.length" class="dependency-list">
            <div v-for="depId in editingTicket.dependsOn" :key="depId" class="dependency-item">
              <span class="dep-ticket-number">{{ getTicketInfo(depId)?.ticketNumber }}</span>
              <span class="dep-ticket-title">{{ getTicketInfo(depId)?.title }}</span>
              <button type="button" class="remove-dep" @click="removeTicketDependency(depId)">×</button>
            </div>
          </div>
          <div class="add-dependency">
            <select @change="(e) => { if(e.target.value) { addTicketDependency(parseInt(e.target.value)); e.target.value = ''; } }">
              <option value="">+ Voeg dependency toe...</option>
              <option
                v-for="ticket in getAvailableTicketsForDependency(editingTicket.id)"
                :key="ticket.id"
                :value="ticket.id"
                :disabled="editingTicket.dependsOn?.includes(ticket.id)"
              >
                {{ ticket.ticketNumber }} - {{ ticket.title }}
              </option>
            </select>
          </div>
        </div>

        <!-- Blocked By Section (read-only info) -->
        <div v-if="editingTicket.blockedBy && editingTicket.blockedBy.length" class="blocked-section">
          <label>Blokkeert (wacht op dit ticket)</label>
          <div class="dependency-list">
            <div v-for="blockedId in editingTicket.blockedBy" :key="blockedId" class="dependency-item readonly">
              <span class="dep-ticket-number">{{ getTicketInfo(blockedId)?.ticketNumber }}</span>
              <span class="dep-ticket-title">{{ getTicketInfo(blockedId)?.title }}</span>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button class="delete" @click="confirmDeleteTicket">Verwijderen</button>
          <div class="spacer"></div>
          <button @click="showEditModal = false">Annuleren</button>
          <button class="primary" @click="submitEditTicket">Opslaan</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tickets-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  height: calc(100vh - 120px);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
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

.add-btn {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: 0.625rem 1rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
}

/* Filters */
.filters {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.filter-group label {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  text-transform: uppercase;
}

.filter-group select {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 0.875rem;
  min-width: 180px;
}

/* Kanban Board */
.kanban-board {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  flex: 1;
  overflow: hidden;
}

.kanban-column {
  background: var(--color-background);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.column-header {
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid var(--color-border);
}

.column-header.in-progress {
  border-bottom-color: var(--color-primary);
}

.column-header.done {
  border-bottom-color: #10b981;
}

.column-header h3 {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
}

.column-header .count {
  background: var(--color-border);
  padding: 0.2rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.column-content {
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* Ticket Card */
.ticket-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 0.875rem;
  cursor: grab;
  transition: all 0.2s;
}

.ticket-card:hover {
  border-color: var(--color-primary);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.ticket-card:active {
  cursor: grabbing;
}

.ticket-card.done {
  opacity: 0.7;
}

.ticket-header {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 0.5rem;
}

.ticket-number {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--color-primary);
  font-family: monospace;
}

.priority-badge {
  font-size: 0.65rem;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  text-transform: uppercase;
  font-weight: 600;
}

.priority-badge.must { background: #fee2e2; color: #dc2626; }
.priority-badge.should { background: #fef3c7; color: #d97706; }
.priority-badge.nice { background: #d1fae5; color: #059669; }

.phase-tag {
  font-size: 0.7rem;
  color: var(--color-text-secondary);
  background: var(--color-background);
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  margin-left: auto;
}

.ticket-card h4 {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text);
}

.ticket-card p {
  margin: 0.5rem 0 0;
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.ticket-meta {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
  font-size: 0.7rem;
  color: var(--color-text-secondary);
  flex-wrap: wrap;
}

.week-badge {
  background: #dbeafe;
  color: #1d4ed8;
  padding: 0.1rem 0.35rem;
  border-radius: 3px;
  font-weight: 500;
}

.dep-badge {
  background: #fef3c7;
  color: #d97706;
  padding: 0.1rem 0.35rem;
  border-radius: 3px;
  font-weight: 500;
}

.blocked-badge {
  background: #fee2e2;
  color: #dc2626;
  padding: 0.1rem 0.35rem;
  border-radius: 3px;
  font-weight: 500;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal h3 {
  margin: 0;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
}

.modal-ticket-number {
  font-family: monospace;
  font-weight: 600;
  color: var(--color-primary);
  font-size: 0.875rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.375rem;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 0.875rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.modal-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1.5rem;
}

.modal-actions .spacer {
  flex: 1;
}

.modal-actions button {
  padding: 0.625rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
}

.modal-actions button:not(.primary):not(.delete) {
  background: transparent;
  border: 1px solid var(--color-border);
}

.modal-actions button.primary {
  background: var(--color-primary);
  color: white;
  border: none;
}

.modal-actions button.primary:disabled {
  background: var(--color-border);
  cursor: not-allowed;
}

.modal-actions button.delete {
  background: #fee2e2;
  color: #dc2626;
  border: none;
}

/* Dependencies Section */
.dependencies-section,
.blocked-section {
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: var(--color-background);
  border-radius: 8px;
}

.dependencies-section label,
.blocked-section label {
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin-bottom: 0.5rem;
}

.dependency-list {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  margin-bottom: 0.5rem;
}

.dependency-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.5rem;
  background: white;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-size: 0.8rem;
}

.dependency-item.readonly {
  background: var(--color-surface);
}

.dep-ticket-number {
  font-family: monospace;
  font-weight: 600;
  color: var(--color-primary);
  font-size: 0.75rem;
}

.dep-ticket-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.remove-dep {
  background: none;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  font-size: 1rem;
  padding: 0 0.25rem;
  line-height: 1;
}

.remove-dep:hover {
  color: #dc2626;
}

.add-dependency select {
  width: 100%;
  padding: 0.5rem;
  border: 1px dashed var(--color-border);
  border-radius: 4px;
  font-size: 0.8rem;
  background: white;
  color: var(--color-text-secondary);
}

@media (max-width: 900px) {
  .kanban-board {
    grid-template-columns: 1fr;
    overflow-y: auto;
  }

  .kanban-column {
    min-height: 200px;
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
