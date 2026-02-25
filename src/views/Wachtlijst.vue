<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { getWaitlistSignups } from '../services/supabase'

const signups = ref([])
const loading = ref(true)
const error = ref(null)
const filter = ref('all') // all | confirmed | unconfirmed

onMounted(async () => {
  try {
    signups.value = await getWaitlistSignups()
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
})

// Stats
const stats = computed(() => {
  const all = signups.value
  const confirmed = all.filter(s => s.confirmed)
  const unconfirmed = all.filter(s => !s.confirmed)
  const synced = all.filter(s => s.synced_to_zoho)

  // Referral bronnen
  const sources = {}
  all.forEach(s => {
    const src = s.referral_source || 'Direct'
    sources[src] = (sources[src] || 0) + 1
  })

  return {
    total: all.length,
    confirmed: confirmed.length,
    unconfirmed: unconfirmed.length,
    synced: synced.length,
    sources: Object.entries(sources).sort((a, b) => b[1] - a[1]),
  }
})

// Signups per week (voor chart)
const weeklyData = computed(() => {
  const weeks = {}
  signups.value.forEach(s => {
    const d = new Date(s.created_at)
    // Maandag van de week
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(d.setDate(diff))
    const key = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`
    weeks[key] = (weeks[key] || 0) + 1
  })

  const entries = Object.entries(weeks).sort((a, b) => a[0].localeCompare(b[0]))
  const max = Math.max(...entries.map(e => e[1]), 1)
  return { entries, max }
})

// Gefilterde lijst
const filteredSignups = computed(() => {
  if (filter.value === 'confirmed') return signups.value.filter(s => s.confirmed)
  if (filter.value === 'unconfirmed') return signups.value.filter(s => !s.confirmed)
  return signups.value
})

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('nl-NL', {
    day: 'numeric', month: 'short', year: 'numeric'
  })
}

function formatWeekLabel(dateStr) {
  const d = new Date(dateStr)
  return `${d.getDate()} ${['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'][d.getMonth()]}`
}
</script>

<template>
  <div class="page">
    <div class="page-header">
      <RouterLink to="/" class="back-link">&larr; Home</RouterLink>
      <h1>Wachtlijst</h1>
      <p class="page-subtitle">Aanmeldingen, status en herkomst.</p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">Laden...</div>

    <!-- Error -->
    <div v-else-if="error" class="error-state">{{ error }}</div>

    <template v-else>
      <!-- Stats -->
      <div class="stats-row">
        <div class="stat-card">
          <span class="stat-value">{{ stats.total }}</span>
          <span class="stat-label">Totaal</span>
        </div>
        <div class="stat-card stat-confirmed">
          <span class="stat-value">{{ stats.confirmed }}</span>
          <span class="stat-label">Bevestigd</span>
        </div>
        <div class="stat-card stat-unconfirmed">
          <span class="stat-value">{{ stats.unconfirmed }}</span>
          <span class="stat-label">Onbevestigd</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ stats.synced }}</span>
          <span class="stat-label">Zoho sync</span>
        </div>
      </div>

      <!-- Weekly chart -->
      <div class="section" v-if="weeklyData.entries.length > 0">
        <h2>Aanmeldingen per week</h2>
        <div class="weekly-chart">
          <div
            v-for="[week, count] in weeklyData.entries"
            :key="week"
            class="chart-bar-group"
          >
            <span class="chart-count">{{ count }}</span>
            <div
              class="chart-bar"
              :style="{ height: Math.max(4, (count / weeklyData.max) * 120) + 'px' }"
            ></div>
            <span class="chart-label">{{ formatWeekLabel(week) }}</span>
          </div>
        </div>
      </div>

      <!-- Referral bronnen -->
      <div class="section" v-if="stats.sources.length > 0">
        <h2>Herkomst</h2>
        <div class="source-list">
          <div v-for="[source, count] in stats.sources" :key="source" class="source-row">
            <span class="source-name">{{ source }}</span>
            <div class="source-bar-wrap">
              <div
                class="source-bar"
                :style="{ width: (count / stats.total * 100) + '%' }"
              ></div>
            </div>
            <span class="source-count">{{ count }}</span>
          </div>
        </div>
      </div>

      <!-- Filter tabs -->
      <div class="section">
        <div class="section-header">
          <h2>Aanmeldingen ({{ filteredSignups.length }})</h2>
          <div class="filter-tabs">
            <button
              :class="{ active: filter === 'all' }"
              @click="filter = 'all'"
            >Alle</button>
            <button
              :class="{ active: filter === 'confirmed' }"
              @click="filter = 'confirmed'"
            >Bevestigd</button>
            <button
              :class="{ active: filter === 'unconfirmed' }"
              @click="filter = 'unconfirmed'"
            >Onbevestigd</button>
          </div>
        </div>

        <!-- Empty -->
        <div v-if="filteredSignups.length === 0" class="empty-state">
          Geen aanmeldingen gevonden.
        </div>

        <!-- Table -->
        <div v-else class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>E-mail</th>
                <th>Naam</th>
                <th>Postcode</th>
                <th>Herkomst</th>
                <th>Status</th>
                <th>Datum</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in filteredSignups" :key="s.id">
                <td>{{ s.email }}</td>
                <td>{{ s.name || '—' }}</td>
                <td>{{ s.postcode || '—' }}</td>
                <td>{{ s.referral_source || 'Direct' }}</td>
                <td>
                  <span class="badge" :class="s.confirmed ? 'badge-confirmed' : 'badge-pending'">
                    {{ s.confirmed ? 'Bevestigd' : 'Wacht' }}
                  </span>
                </td>
                <td>{{ formatDate(s.created_at) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.page {
  max-width: 960px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 1.5rem;
}

.back-link {
  display: inline-block;
  color: var(--color-primary);
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.75rem;
}

.back-link:hover {
  text-decoration: underline;
}

.page-header h1 {
  margin: 0;
  font-size: 1.5rem;
}

.page-subtitle {
  margin: 0.25rem 0 0;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

/* Stats */
.stats-row {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary);
}

.stat-confirmed .stat-value { color: #059669; }
.stat-unconfirmed .stat-value { color: #d97706; }

.stat-label {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  margin-top: 0.125rem;
}

/* Sections */
.section {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 1.25rem;
  margin-bottom: 1rem;
}

.section h2 {
  margin: 0 0 1rem;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-secondary);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.section-header h2 {
  margin: 0;
}

/* Weekly chart */
.weekly-chart {
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
  min-height: 140px;
  padding-top: 0.5rem;
}

.chart-bar-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.chart-count {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 0.25rem;
}

.chart-bar {
  width: 100%;
  max-width: 48px;
  background: #3b82f6;
  border-radius: 4px 4px 0 0;
  transition: height 0.3s ease;
}

.chart-label {
  font-size: 0.65rem;
  color: var(--color-text-secondary);
  margin-top: 0.375rem;
  white-space: nowrap;
}

/* Sources */
.source-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.source-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.85rem;
}

.source-name {
  width: 100px;
  flex-shrink: 0;
  color: var(--color-text);
  font-weight: 500;
}

.source-bar-wrap {
  flex: 1;
  height: 8px;
  background: #f3f4f6;
  border-radius: 4px;
  overflow: hidden;
}

.source-bar {
  height: 100%;
  background: #3b82f6;
  border-radius: 4px;
  min-width: 4px;
  transition: width 0.3s ease;
}

.source-count {
  width: 2rem;
  text-align: right;
  font-weight: 600;
  color: var(--color-text);
  font-size: 0.8rem;
}

/* Filter tabs */
.filter-tabs {
  display: flex;
  gap: 0.25rem;
  background: #f3f4f6;
  border-radius: 6px;
  padding: 2px;
}

.filter-tabs button {
  background: none;
  border: none;
  padding: 0.375rem 0.75rem;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  cursor: pointer;
  border-radius: 4px;
  font-family: inherit;
  transition: all 0.15s;
}

.filter-tabs button.active {
  background: white;
  color: var(--color-text);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
}

/* Table */
.table-wrap {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.data-table th {
  text-align: left;
  font-weight: 500;
  color: var(--color-text-secondary);
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--color-border);
  font-size: 0.8rem;
  white-space: nowrap;
}

.data-table td {
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid #f3f4f6;
  color: var(--color-text);
}

.data-table tr:last-child td {
  border-bottom: none;
}

/* Badges */
.badge {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.badge-confirmed {
  background: #d1fae5;
  color: #065f46;
}

.badge-pending {
  background: #fef3c7;
  color: #92400e;
}

/* States */
.loading-state,
.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--color-text-secondary);
}

.error-state {
  text-align: center;
  padding: 2rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 12px;
  color: var(--color-danger);
}

@media (max-width: 640px) {
  .stats-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .data-table {
    font-size: 0.8rem;
  }
}
</style>
