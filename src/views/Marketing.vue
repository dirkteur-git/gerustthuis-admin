<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { getAnalyticsData } from '../services/supabase'

const analytics = ref(null)
const loading = ref(true)
const error = ref(null)
const notConfigured = ref(false)
const dateRange = ref('30')

async function loadData() {
  loading.value = true
  error.value = null
  notConfigured.value = false

  try {
    const res = await getAnalyticsData(dateRange.value)

    if (!res.success && res.error === 'NOT_CONFIGURED') {
      notConfigured.value = true
      return
    }

    if (!res.success) throw new Error(res.error)
    analytics.value = res.data
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

onMounted(loadData)

function switchRange(range) {
  dateRange.value = range
  loadData()
}

// Chart helpers
const chartMax = computed(() => {
  if (!analytics.value?.daily) return 1
  return Math.max(...analytics.value.daily.map(d => d.users), 1)
})

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

function formatDateLabel(yyyymmdd) {
  // "20260225" → "25 feb"
  const y = yyyymmdd.substring(0, 4)
  const m = parseInt(yyyymmdd.substring(4, 6)) - 1
  const d = parseInt(yyyymmdd.substring(6, 8))
  const months = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']
  return `${d} ${months[m]}`
}

function formatPercent(value) {
  return `${Math.round(value * 100)}%`
}
</script>

<template>
  <div class="page">
    <div class="page-header">
      <RouterLink to="/" class="back-link">&larr; Home</RouterLink>
      <h1>Marketing</h1>
      <p class="page-subtitle">Website bezoekers, pagina's en traffic bronnen.</p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">Analytics laden...</div>

    <!-- Not configured -->
    <div v-else-if="notConfigured" class="setup-card">
      <div class="setup-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
      </div>
      <h2>Google Analytics koppelen</h2>
      <p>Volg deze stappen om GA4 data in je admin portaal te zien:</p>
      <ol class="setup-steps">
        <li>Ga naar <a href="https://console.cloud.google.com" target="_blank">console.cloud.google.com</a></li>
        <li>Maak een project aan (of gebruik een bestaand project)</li>
        <li>Activeer de <strong>Google Analytics Data API</strong></li>
        <li>Ga naar <em>IAM &amp; Admin &gt; Service Accounts</em> en maak een service account aan</li>
        <li>Download de <strong>JSON key</strong></li>
        <li>Ga naar je GA4 property &gt; <em>Admin &gt; Property Access Management</em></li>
        <li>Voeg het service account e-mailadres toe als <strong>Viewer</strong></li>
        <li>Sla de JSON key op als Supabase secret:<br>
          <code>supabase secrets set GA4_SERVICE_ACCOUNT_KEY='{ ... }'</code></li>
        <li>Sla je GA4 property ID op:<br>
          <code>supabase secrets set GA4_PROPERTY_ID='123456789'</code></li>
        <li>Deploy de edge function:<br>
          <code>supabase functions deploy ga4-analytics</code></li>
      </ol>
      <p class="setup-note">Je GA4 property ID vind je in GA4 onder Admin &gt; Property Settings. Het is het nummer in de URL of het veld "Property ID".</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="error-state">{{ error }}</div>

    <!-- Analytics data -->
    <template v-else-if="analytics">
      <!-- Period selector -->
      <div class="period-tabs">
        <button :class="{ active: dateRange === '7' }" @click="switchRange('7')">7 dagen</button>
        <button :class="{ active: dateRange === '30' }" @click="switchRange('30')">30 dagen</button>
        <button :class="{ active: dateRange === '90' }" @click="switchRange('90')">90 dagen</button>
      </div>

      <!-- Stats -->
      <div class="stats-row">
        <div class="stat-card">
          <span class="stat-value">{{ analytics.totals.users.toLocaleString('nl-NL') }}</span>
          <span class="stat-label">Bezoekers</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ analytics.totals.sessions.toLocaleString('nl-NL') }}</span>
          <span class="stat-label">Sessies</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ analytics.totals.pageviews.toLocaleString('nl-NL') }}</span>
          <span class="stat-label">Pageviews</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ formatPercent(analytics.avgBounce) }}</span>
          <span class="stat-label">Bounce rate</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ formatDuration(analytics.avgDuration) }}</span>
          <span class="stat-label">Gem. sessieduur</span>
        </div>
      </div>

      <!-- Daily chart -->
      <div class="section" v-if="analytics.daily.length > 0">
        <h2>Bezoekers per dag</h2>
        <div class="daily-chart">
          <div
            v-for="day in analytics.daily"
            :key="day.date"
            class="chart-bar-group"
            :title="`${formatDateLabel(day.date)}: ${day.users} bezoekers, ${day.sessions} sessies`"
          >
            <span class="chart-count" v-if="day.users > 0">{{ day.users }}</span>
            <div
              class="chart-bar"
              :style="{ height: Math.max(2, (day.users / chartMax) * 120) + 'px' }"
            ></div>
            <span class="chart-label">{{ formatDateLabel(day.date) }}</span>
          </div>
        </div>
      </div>

      <!-- Top pages -->
      <div class="section" v-if="analytics.pages.length > 0">
        <h2>Top pagina's</h2>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Pagina</th>
                <th class="num">Views</th>
                <th class="num">Bezoekers</th>
                <th class="num">Gem. tijd</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="page in analytics.pages" :key="page.path">
                <td>
                  <span class="page-title">{{ page.title }}</span>
                  <span class="page-path">{{ page.path }}</span>
                </td>
                <td class="num">{{ page.views }}</td>
                <td class="num">{{ page.users }}</td>
                <td class="num">{{ formatDuration(page.avgDuration) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Traffic sources -->
      <div class="section" v-if="analytics.sources.length > 0">
        <h2>Traffic bronnen</h2>
        <div class="source-list">
          <div v-for="src in analytics.sources" :key="src.channel" class="source-row">
            <span class="source-name">{{ src.channel }}</span>
            <div class="source-bar-wrap">
              <div
                class="source-bar"
                :style="{ width: (src.sessions / analytics.totals.sessions * 100) + '%' }"
              ></div>
            </div>
            <span class="source-count">{{ src.sessions }}</span>
          </div>
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

/* Setup card */
.setup-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 2rem;
}

.setup-icon {
  color: #8b5cf6;
  margin-bottom: 1rem;
}

.setup-card h2 {
  margin: 0 0 0.5rem;
  font-size: 1.25rem;
}

.setup-card > p {
  color: var(--color-text-secondary);
  font-size: 0.9rem;
  margin: 0 0 1rem;
}

.setup-steps {
  margin: 0 0 1rem;
  padding-left: 1.25rem;
  line-height: 1.8;
  font-size: 0.9rem;
}

.setup-steps li {
  margin-bottom: 0.25rem;
}

.setup-steps code {
  font-size: 0.8rem;
  background: #f3f4f6;
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  display: inline-block;
  margin-top: 0.25rem;
}

.setup-steps a {
  color: var(--color-primary);
}

.setup-note {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  margin: 0;
  font-style: italic;
}

/* Period tabs */
.period-tabs {
  display: flex;
  gap: 0.25rem;
  background: #f3f4f6;
  border-radius: 6px;
  padding: 2px;
  width: fit-content;
  margin-bottom: 1.5rem;
}

.period-tabs button {
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

.period-tabs button.active {
  background: white;
  color: var(--color-text);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
}

/* Stats */
.stats-row {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.stat-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 100px;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary);
}

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

/* Daily chart */
.daily-chart {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  min-height: 140px;
  padding-top: 0.5rem;
  overflow-x: auto;
}

.chart-bar-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  min-width: 16px;
}

.chart-count {
  font-size: 0.6rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin-bottom: 2px;
}

.chart-bar {
  width: 100%;
  max-width: 32px;
  background: #8b5cf6;
  border-radius: 3px 3px 0 0;
  transition: height 0.3s ease;
}

.chart-label {
  font-size: 0.55rem;
  color: var(--color-text-secondary);
  margin-top: 0.25rem;
  white-space: nowrap;
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
}

.data-table th.num,
.data-table td.num {
  text-align: right;
}

.data-table td {
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid #f3f4f6;
  color: var(--color-text);
}

.data-table tr:last-child td {
  border-bottom: none;
}

.page-title {
  display: block;
  font-weight: 500;
}

.page-path {
  display: block;
  font-size: 0.75rem;
  color: var(--color-text-secondary);
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
  width: 140px;
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
  background: #8b5cf6;
  border-radius: 4px;
  min-width: 4px;
  transition: width 0.3s ease;
}

.source-count {
  width: 2.5rem;
  text-align: right;
  font-weight: 600;
  color: var(--color-text);
  font-size: 0.8rem;
}

/* States */
.loading-state {
  text-align: center;
  padding: 3rem;
  color: var(--color-text-secondary);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
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

  .daily-chart {
    gap: 1px;
  }

  .chart-label {
    display: none;
  }
}
</style>
