<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import {
  store,
  getPhaseById,
  getTicketsByPhase,
  toggleCriterion,
  updatePhase,
  recordGoNoGoDecision,
  getCriteriaProgress,
  addTicket,
  getPhaseSpent,
  addPurchase,
  deletePurchase
} from '../stores/projectStore.js'

const route = useRoute()
const router = useRouter()
const phaseId = computed(() => parseInt(route.params.id))
const phase = computed(() => getPhaseById(phaseId.value))
const tickets = computed(() => getTicketsByPhase(phaseId.value))
const phaseSpent = computed(() => getPhaseSpent(phaseId.value))

const showGoNoGoModal = ref(false)
const goNoGoDecision = ref('go')
const goNoGoNotes = ref('')

const showAddPurchase = ref(false)
const newPurchase = ref({
  description: '',
  amount: null,
  date: new Date().toISOString().split('T')[0]
})

const showQuickAdd = ref(false)
const quickAddTitle = ref('')

const allCriteriaComplete = computed(() => {
  if (!phase.value) return false
  return phase.value.goNoGoCriteria.every(c => c.completed)
})

function submitPurchase() {
  if (!newPurchase.value.description.trim() || !newPurchase.value.amount) return
  addPurchase(phaseId.value, newPurchase.value)
  newPurchase.value = {
    description: '',
    amount: null,
    date: new Date().toISOString().split('T')[0]
  }
  showAddPurchase.value = false
}

function removePurchase(purchaseId) {
  if (confirm('Weet je zeker dat je deze aankoop wilt verwijderen?')) {
    deletePurchase(phaseId.value, purchaseId)
  }
}

function setGoNoGoStatus() {
  updatePhase(phaseId.value, { status: 'go-no-go' })
}

function submitGoNoGoDecision() {
  recordGoNoGoDecision(phaseId.value, goNoGoDecision.value, goNoGoNotes.value)
  showGoNoGoModal.value = false
  goNoGoNotes.value = ''
}

function quickAddTicket() {
  if (!quickAddTitle.value.trim()) return
  addTicket({
    title: quickAddTitle.value,
    phaseId: phaseId.value,
    status: 'todo',
    priority: 'should'
  })
  quickAddTitle.value = ''
  showQuickAdd.value = false
}

function formatCurrency(amount) {
  if (amount === null || amount === undefined) return '-'
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(amount)
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('nl-NL')
}

function getStatusClass(status) {
  return {
    'actief': 'status-actief',
    'niet gestart': 'status-niet-gestart',
    'go-no-go': 'status-go-no-go',
    'afgerond': 'status-afgerond'
  }[status] || ''
}
</script>

<template>
  <div v-if="phase" class="fase-detail">
    <!-- Header -->
    <div class="header">
      <RouterLink to="/fasen" class="back-link">Alle fasen</RouterLink>
      <div class="header-main">
        <div class="header-info">
          <span class="fase-number">Fase {{ phase.id }}</span>
          <h1>{{ phase.name }}</h1>
          <p>{{ phase.description }}</p>
        </div>
        <span class="status-badge large" :class="getStatusClass(phase.status)">
          {{ phase.status }}
        </span>
      </div>
    </div>

    <!-- Budget & Purchases Section -->
    <section class="budget-section">
      <div class="section-header">
        <h2>Budget en Aankopen</h2>
        <button class="add-btn" @click="showAddPurchase = true">+ Aankoop</button>
      </div>

      <div class="budget-stats">
        <div class="budget-stat">
          <span class="budget-label">Budget</span>
          <span class="budget-value">{{ formatCurrency(phase.budget) }}</span>
        </div>
        <div class="budget-stat">
          <span class="budget-label">Besteed</span>
          <span class="budget-value spent">{{ formatCurrency(phaseSpent) }}</span>
        </div>
        <div class="budget-stat">
          <span class="budget-label">Resterend</span>
          <span class="budget-value remaining" :class="{ warning: phase.budget && phaseSpent > phase.budget }">
            {{ formatCurrency((phase.budget || 0) - phaseSpent) }}
          </span>
        </div>
      </div>

      <!-- Purchase List -->
      <div v-if="phase.purchases && phase.purchases.length > 0" class="purchase-list">
        <h3>Aankopen</h3>
        <div class="purchase-table">
          <div class="purchase-row header">
            <span class="purchase-date">Datum</span>
            <span class="purchase-description">Omschrijving</span>
            <span class="purchase-amount">Bedrag</span>
            <span class="purchase-actions"></span>
          </div>
          <div
            v-for="purchase in phase.purchases"
            :key="purchase.id"
            class="purchase-row"
          >
            <span class="purchase-date">{{ formatDate(purchase.date) }}</span>
            <span class="purchase-description">{{ purchase.description }}</span>
            <span class="purchase-amount">{{ formatCurrency(purchase.amount) }}</span>
            <button class="delete-btn" @click="removePurchase(purchase.id)" title="Verwijderen">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <p v-else class="no-purchases">Nog geen aankopen geregistreerd</p>
    </section>

    <!-- Go/No-Go Criteria -->
    <section class="criteria-section">
      <div class="section-header">
        <h2>Go/No-Go Criteria</h2>
        <span class="progress-badge">{{ getCriteriaProgress(phase) }}% voltooid</span>
      </div>

      <div class="criteria-progress-bar">
        <div class="progress-fill" :style="{ width: getCriteriaProgress(phase) + '%' }"></div>
      </div>

      <ul class="criteria-list">
        <li
          v-for="criterion in phase.goNoGoCriteria"
          :key="criterion.id"
          class="criterion"
          :class="{ completed: criterion.completed }"
          @click="toggleCriterion(phase.id, criterion.id)"
        >
          <span class="checkbox">
            <svg v-if="criterion.completed" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </span>
          <span class="criterion-text">{{ criterion.description }}</span>
        </li>
      </ul>

      <div v-if="phase.noGoAction" class="no-go-action">
        <strong>Bij No-Go:</strong> {{ phase.noGoAction }}
      </div>

      <!-- Go/No-Go Actions -->
      <div v-if="phase.status === 'actief'" class="go-no-go-actions">
        <button
          class="btn-go-no-go"
          :disabled="!allCriteriaComplete"
          @click="setGoNoGoStatus"
        >
          Naar Go/No-Go beslissing
        </button>
        <p v-if="!allCriteriaComplete" class="criteria-warning">
          Alle criteria moeten voltooid zijn voor een Go/No-Go beslissing
        </p>
      </div>

      <div v-if="phase.status === 'go-no-go'" class="go-no-go-decision-box">
        <h3>Go/No-Go Beslissing</h3>
        <p>Alle criteria zijn voltooid. Neem een beslissing om door te gaan naar de volgende fase.</p>
        <div class="decision-buttons">
          <button class="btn-go" @click="showGoNoGoModal = true; goNoGoDecision = 'go'">
            GO - Doorgaan
          </button>
          <button class="btn-no-go" @click="showGoNoGoModal = true; goNoGoDecision = 'no-go'">
            NO-GO - Stoppen
          </button>
        </div>
      </div>

      <div v-if="phase.goNoGoDecision" class="decision-record">
        <div class="decision-badge" :class="phase.goNoGoDecision.decision">
          {{ phase.goNoGoDecision.decision.toUpperCase() }}
        </div>
        <div class="decision-info">
          <span class="decision-date">{{ new Date(phase.goNoGoDecision.date).toLocaleDateString('nl-NL') }}</span>
          <p v-if="phase.goNoGoDecision.notes">{{ phase.goNoGoDecision.notes }}</p>
        </div>
      </div>
    </section>

    <!-- Tickets -->
    <section class="tickets-section">
      <div class="section-header">
        <h2>Tickets ({{ tickets.length }})</h2>
        <button class="add-btn" @click="showQuickAdd = true">+ Ticket</button>
      </div>

      <div v-if="showQuickAdd" class="quick-add">
        <input
          v-model="quickAddTitle"
          type="text"
          placeholder="Ticket titel..."
          @keyup.enter="quickAddTicket"
          @keyup.esc="showQuickAdd = false"
          autofocus
        />
        <button @click="quickAddTicket">Toevoegen</button>
        <button class="cancel" @click="showQuickAdd = false">Annuleren</button>
      </div>

      <div v-if="tickets.length === 0" class="empty-tickets">
        <p>Nog geen tickets voor deze fase</p>
        <button @click="showQuickAdd = true">Voeg eerste ticket toe</button>
      </div>

      <div v-else class="ticket-list">
        <div
          v-for="ticket in tickets"
          :key="ticket.id"
          class="ticket-card"
          :class="ticket.status"
        >
          <span class="ticket-number">{{ ticket.ticketNumber }}</span>
          <span class="ticket-priority" :class="ticket.priority">{{ ticket.priority }}</span>
          <span class="ticket-title">{{ ticket.title }}</span>
          <span class="ticket-status">{{ ticket.status }}</span>
        </div>
      </div>

      <RouterLink v-if="tickets.length > 0" :to="`/tickets?phase=${phase.id}`" class="view-all-tickets">
        Beheer alle tickets in Kanban view
      </RouterLink>
    </section>

    <!-- Add Purchase Modal -->
    <div v-if="showAddPurchase" class="modal-overlay" @click.self="showAddPurchase = false">
      <div class="modal">
        <h3>Aankoop Toevoegen</h3>
        <div class="form-group">
          <label>Omschrijving *</label>
          <input
            v-model="newPurchase.description"
            type="text"
            placeholder="Bijv. Hue Bridge, Motion Sensor..."
            autofocus
          />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Bedrag *</label>
            <input
              v-model.number="newPurchase.amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
            />
          </div>
          <div class="form-group">
            <label>Datum</label>
            <input v-model="newPurchase.date" type="date" />
          </div>
        </div>
        <div class="modal-actions">
          <button @click="showAddPurchase = false">Annuleren</button>
          <button
            class="primary"
            @click="submitPurchase"
            :disabled="!newPurchase.description.trim() || !newPurchase.amount"
          >
            Toevoegen
          </button>
        </div>
      </div>
    </div>

    <!-- Go/No-Go Modal -->
    <div v-if="showGoNoGoModal" class="modal-overlay" @click.self="showGoNoGoModal = false">
      <div class="modal go-no-go-modal">
        <h3>{{ goNoGoDecision === 'go' ? 'GO Beslissing' : 'NO-GO Beslissing' }}</h3>
        <p v-if="goNoGoDecision === 'go'">
          Je staat op het punt om deze fase af te ronden en door te gaan naar de volgende fase.
        </p>
        <p v-else>
          Je staat op het punt om te stoppen. De no-go actie is: <strong>{{ phase.noGoAction }}</strong>
        </p>
        <div class="form-group">
          <label>Notities (optioneel)</label>
          <textarea v-model="goNoGoNotes" rows="3" placeholder="Voeg eventuele opmerkingen toe..."></textarea>
        </div>
        <div class="modal-actions">
          <button @click="showGoNoGoModal = false">Annuleren</button>
          <button
            :class="goNoGoDecision === 'go' ? 'btn-go' : 'btn-no-go'"
            @click="submitGoNoGoDecision"
          >
            Bevestig {{ goNoGoDecision.toUpperCase() }}
          </button>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="not-found">
    <p>Fase niet gevonden</p>
    <RouterLink to="/fasen">Terug naar overzicht</RouterLink>
  </div>
</template>

<style scoped>
.fase-detail {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Header */
.header {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.back-link {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.header-main {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.fase-number {
  font-size: 0.75rem;
  text-transform: uppercase;
  color: var(--color-primary);
  font-weight: 600;
}

.header-info h1 {
  margin: 0.25rem 0;
  font-size: 1.75rem;
}

.header-info p {
  margin: 0;
  color: var(--color-text-secondary);
}

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: capitalize;
}

.status-badge.large {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

.status-actief { background: #dbeafe; color: #1d4ed8; }
.status-niet-gestart { background: #f3f4f6; color: #6b7280; }
.status-go-no-go { background: #fef3c7; color: #d97706; }
.status-afgerond { background: #d1fae5; color: #059669; }

/* Sections */
section {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 1.25rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.section-header h2 {
  margin: 0;
  font-size: 1rem;
}

.edit-btn, .add-btn {
  font-size: 0.875rem;
  padding: 0.375rem 0.75rem;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  cursor: pointer;
}

.edit-btn:hover, .add-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

/* Budget */
.budget-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.budget-stat {
  text-align: center;
}

.budget-label {
  display: block;
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  margin-bottom: 0.25rem;
}

.budget-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
}

.budget-value.spent { color: #f59e0b; }
.budget-value.remaining { color: #10b981; }
.budget-value.remaining.warning { color: #ef4444; }

/* Purchases */
.purchase-list h3 {
  margin: 0 0 0.75rem;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.purchase-table {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  overflow: hidden;
}

.purchase-row {
  display: grid;
  grid-template-columns: 100px 1fr 100px 40px;
  gap: 1rem;
  padding: 0.75rem 1rem;
  align-items: center;
  border-bottom: 1px solid var(--color-border);
}

.purchase-row:last-child {
  border-bottom: none;
}

.purchase-row.header {
  background: var(--color-background);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
}

.purchase-date {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.purchase-description {
  font-size: 0.875rem;
}

.purchase-amount {
  font-size: 0.875rem;
  font-weight: 600;
  text-align: right;
}

.delete-btn {
  background: transparent;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.delete-btn:hover {
  color: #ef4444;
  background: #fee2e2;
}

.no-purchases {
  text-align: center;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  padding: 1rem;
}

/* Criteria */
.progress-badge {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  background: var(--color-primary);
  color: white;
  border-radius: 4px;
}

.criteria-progress-bar {
  height: 8px;
  background: var(--color-border);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 1rem;
}

.criteria-progress-bar .progress-fill {
  height: 100%;
  background: var(--color-primary);
  transition: width 0.3s;
}

.criteria-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.criterion {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.criterion:hover {
  background: rgba(0, 0, 0, 0.04);
}

.criterion.completed {
  background: rgba(16, 185, 129, 0.05);
}

.checkbox {
  width: 20px;
  height: 20px;
  border: 2px solid var(--color-border);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.criterion.completed .checkbox {
  background: #10b981;
  border-color: #10b981;
  color: white;
}

.checkbox svg {
  width: 14px;
  height: 14px;
}

.criterion-text {
  font-size: 0.875rem;
  color: var(--color-text);
  line-height: 1.4;
}

.criterion.completed .criterion-text {
  color: var(--color-text-secondary);
}

.no-go-action {
  margin-top: 1rem;
  padding: 0.75rem;
  background: #fef3c7;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #92400e;
}

/* Go/No-Go Actions */
.go-no-go-actions {
  margin-top: 1.5rem;
  text-align: center;
}

.btn-go-no-go {
  background: var(--color-primary);
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
}

.btn-go-no-go:disabled {
  background: var(--color-border);
  color: var(--color-text-secondary);
  cursor: not-allowed;
}

.criteria-warning {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin-top: 0.5rem;
}

.go-no-go-decision-box {
  margin-top: 1.5rem;
  padding: 1.5rem;
  background: #fef3c7;
  border-radius: 8px;
  text-align: center;
}

.go-no-go-decision-box h3 {
  margin: 0 0 0.5rem;
  color: #92400e;
}

.go-no-go-decision-box p {
  margin: 0 0 1rem;
  color: #b45309;
  font-size: 0.875rem;
}

.decision-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.btn-go {
  background: #10b981;
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
}

.btn-no-go {
  background: #ef4444;
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
}

.decision-record {
  margin-top: 1.5rem;
  padding: 1rem;
  background: var(--color-background);
  border-radius: 8px;
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.decision-badge {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 700;
  font-size: 0.875rem;
}

.decision-badge.go {
  background: #d1fae5;
  color: #059669;
}

.decision-badge.no-go {
  background: #fee2e2;
  color: #dc2626;
}

.decision-info {
  flex: 1;
}

.decision-date {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.decision-info p {
  margin: 0.25rem 0 0;
  font-size: 0.875rem;
}

/* Tickets */
.quick-add {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.quick-add input {
  flex: 1;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 0.875rem;
}

.quick-add button {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
}

.quick-add button:first-of-type {
  background: var(--color-primary);
  color: white;
  border: none;
}

.quick-add button.cancel {
  background: transparent;
  border: 1px solid var(--color-border);
}

.empty-tickets {
  text-align: center;
  padding: 2rem;
  color: var(--color-text-secondary);
}

.empty-tickets button {
  margin-top: 0.5rem;
  background: var(--color-primary);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
}

.ticket-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.ticket-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 6px;
}

.ticket-number {
  font-family: monospace;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-primary);
}

.ticket-priority {
  font-size: 0.7rem;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  text-transform: uppercase;
  font-weight: 500;
}

.ticket-priority.must { background: #fee2e2; color: #dc2626; }
.ticket-priority.should { background: #fef3c7; color: #d97706; }
.ticket-priority.nice { background: #d1fae5; color: #059669; }

.ticket-title {
  flex: 1;
  font-size: 0.875rem;
}

.ticket-status {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  text-transform: capitalize;
}

.view-all-tickets {
  display: block;
  text-align: center;
  margin-top: 1rem;
  font-size: 0.875rem;
  color: var(--color-primary);
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
  max-width: 400px;
}

.modal h3 {
  margin: 0 0 1rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.5rem 0.75rem;
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
  justify-content: flex-end;
}

.modal-actions button {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
}

.modal-actions button:first-child {
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

.not-found {
  text-align: center;
  padding: 3rem;
}

@media (max-width: 600px) {
  .purchase-row {
    grid-template-columns: 80px 1fr 80px 32px;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
