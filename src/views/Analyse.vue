<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { supabase, activityDb, getHouseholds } from '../services/supabase'
import {
  toLocalDateKey,
  timeToMinutes,
  sumEventsInRange,
  cosineSimilarity,
  awakeDuration
} from '../composables/useDataQuality'

// ============================================================
// Household selector (admin-specifiek)
// ============================================================

const households = ref([])
const selectedHousehold = ref(null)
const selectedConfigId = computed(() => selectedHousehold.value?.config_id || null)
const householdsLoading = ref(true)

async function loadHouseholds() {
  householdsLoading.value = true
  try {
    const data = await getHouseholds()
    households.value = data
    if (data.length > 0 && !selectedHousehold.value) {
      selectedHousehold.value = data[0]
    }
  } catch (e) {
    console.error('Error loading households:', e)
  } finally {
    householdsLoading.value = false
  }
}

// ============================================================
// State
// ============================================================

const loading = ref(false)
const error = ref(null)
const selectedDate = ref(toLocalDateKey(new Date()))
const dayStats = ref(null)
const baselineStats = ref(null)
const dataQuality = ref(null)
const roomHourlyData = ref(null)
const baselineRoomByDate = ref({})
const baselineAvgHourlyPattern = ref(null)

function formatDateDisplay(dateStr) {
  const d = new Date(dateStr)
  const days = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag']
  const months = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`
}

function prevDay() {
  const d = new Date(selectedDate.value)
  d.setDate(d.getDate() - 1)
  selectedDate.value = toLocalDateKey(d)
}

function nextDay() {
  const d = new Date(selectedDate.value)
  d.setDate(d.getDate() + 1)
  const today = new Date()
  if (d <= today) selectedDate.value = toLocalDateKey(d)
}

const isToday = computed(() => selectedDate.value === toLocalDateKey(new Date()))

// ============================================================
// Feature definities: 18 features in 6 groepen
// ============================================================

const featureGroups = [
  {
    id: 'timing',
    label: 'Tijdstip',
    features: [
      { key: 'first_activity', label: 'Eerste activiteit', unit: 'min', isTime: true, weight: 1.0 },
      { key: 'last_activity', label: 'Laatste activiteit', unit: 'min', isTime: true, weight: 1.0 },
      { key: 'awake_duration', label: 'Wakkere duur', unit: 'min', isDerived: true, weight: 0.8 },
    ]
  },
  {
    id: 'volume',
    label: 'Volume',
    features: [
      { key: 'total_events', label: 'Totaal events', unit: '', weight: 1.0 },
      { key: 'active_hours', label: 'Actieve uren', unit: 'u', weight: 1.0 },
      { key: 'morning_events', label: 'Ochtend (06-12)', unit: '', isDerived: true, weight: 0.8 },
      { key: 'afternoon_events', label: 'Middag (12-18)', unit: '', isDerived: true, weight: 0.8 },
      { key: 'evening_events', label: 'Avond (18-23)', unit: '', isDerived: true, weight: 0.8 },
    ]
  },
  {
    id: 'gaps',
    label: 'Rust & nacht',
    features: [
      { key: 'longest_gap_minutes', label: 'Langste gap', unit: 'min', weight: 1.2 },
      { key: 'night_events', label: 'Nacht events', unit: '', weight: 1.0 },
      { key: 'night_active_hours', label: 'Nacht actieve uren', unit: 'u', weight: 0.8 },
    ]
  },
  {
    id: 'rooms',
    label: 'Ruimte',
    features: [
      { key: 'rooms_active', label: 'Actieve kamers', unit: '', weight: 0.8 },
      { key: 'room_ratio', label: 'Kamer ratio', unit: '', isDerived: true, weight: 0.6, isRoomFeature: true },
      { key: 'main_room_pct', label: 'Hoofdkamer %', unit: '%', isRoomData: true, weight: 0.6, isRoomFeature: true },
    ]
  },
  {
    id: 'devices',
    label: 'Sensor type',
    features: [
      { key: 'motion_events', label: 'Beweging events', unit: '', weight: 0.8 },
      { key: 'door_events', label: 'Deur events', unit: '', weight: 0.8 },
    ]
  },
  {
    id: 'patterns',
    label: 'Patroon',
    features: [
      { key: 'transition_count', label: 'Kamerwisselingen', unit: '', isRoomData: true, weight: 0.6, isRoomFeature: true },
      { key: 'activity_regularity', label: 'Regelmaat score', unit: '', isDerived: true, weight: 0.6 },
    ]
  },
]

const allFeatures = featureGroups.flatMap(g => g.features)

const activeFeatures = computed(() => {
  const roomsAvailable = dayStats.value?.rooms_available || 0
  return allFeatures.filter(f => f.isRoomFeature ? roomsAvailable > 1 : true)
})

const activeFeatureGroups = computed(() => {
  return featureGroups.map(group => ({
    ...group,
    features: group.features.filter(f => activeFeatures.value.includes(f))
  })).filter(group => group.features.length > 0)
})

function minutesToTime(minutes) {
  if (minutes === null || minutes === undefined) return '-'
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function calculateZScore(value, mean, stddev) {
  if (stddev === 0 || stddev === null || value === null || mean === null) return 0
  return (value - mean) / stddev
}

// ============================================================
// Feature value berekening
// ============================================================

function getTodayValue(feature) {
  if (!dayStats.value) return null
  const ds = dayStats.value
  switch (feature.key) {
    case 'first_activity':
    case 'last_activity':
      return timeToMinutes(ds[feature.key])
    case 'total_events':
    case 'active_hours':
    case 'longest_gap_minutes':
    case 'night_events':
    case 'night_active_hours':
    case 'rooms_active':
    case 'motion_events':
    case 'door_events':
      return ds[feature.key] ?? null
    case 'morning_events': return sumEventsInRange(ds.events_per_hour, 6, 11)
    case 'afternoon_events': return sumEventsInRange(ds.events_per_hour, 12, 17)
    case 'evening_events': return sumEventsInRange(ds.events_per_hour, 18, 22)
    case 'awake_duration': return awakeDuration(ds.first_activity, ds.last_activity)
    case 'room_ratio':
      if (!ds.rooms_available || ds.rooms_available === 0) return null
      return ds.rooms_active / ds.rooms_available
    case 'main_room_pct': return computeMainRoomPct(roomHourlyData.value)
    case 'transition_count': return computeTransitionCount(roomHourlyData.value)
    case 'activity_regularity':
      if (!ds.events_per_hour || !baselineAvgHourlyPattern.value) return null
      return cosineSimilarity(ds.events_per_hour, baselineAvgHourlyPattern.value)
    default: return null
  }
}

function getHistoricalValue(feature, day, roomData) {
  switch (feature.key) {
    case 'first_activity':
    case 'last_activity': {
      const v = timeToMinutes(day[feature.key])
      return (v === 0 && !day[feature.key]) ? null : v
    }
    case 'total_events':
    case 'active_hours':
    case 'longest_gap_minutes':
    case 'night_events':
    case 'night_active_hours':
    case 'rooms_active':
    case 'motion_events':
    case 'door_events':
      return day[feature.key] ?? null
    case 'morning_events': return sumEventsInRange(day.events_per_hour, 6, 11)
    case 'afternoon_events': return sumEventsInRange(day.events_per_hour, 12, 17)
    case 'evening_events': return sumEventsInRange(day.events_per_hour, 18, 22)
    case 'awake_duration': return awakeDuration(day.first_activity, day.last_activity)
    case 'room_ratio':
      if (!day.rooms_available || day.rooms_available === 0) return null
      return day.rooms_active / day.rooms_available
    case 'main_room_pct': return computeMainRoomPct(roomData || [])
    case 'transition_count': return computeTransitionCount(roomData || [])
    case 'activity_regularity':
      if (!day.events_per_hour || !baselineAvgHourlyPattern.value) return null
      return cosineSimilarity(day.events_per_hour, baselineAvgHourlyPattern.value)
    default: return null
  }
}

function computeMainRoomPct(roomData) {
  if (!roomData || roomData.length === 0) return null
  const roomTotals = {}
  for (const row of roomData) {
    roomTotals[row.room_name] = (roomTotals[row.room_name] || 0) + (row.total_events || 0)
  }
  const totals = Object.values(roomTotals)
  if (totals.length === 0) return null
  const maxRoom = Math.max(...totals)
  const totalAll = totals.reduce((a, b) => a + b, 0)
  if (totalAll === 0) return null
  return Math.round((maxRoom / totalAll) * 100)
}

function computeTransitionCount(roomData) {
  if (!roomData || roomData.length === 0) return null
  const sorted = [...roomData].sort((a, b) => new Date(a.hour) - new Date(b.hour))
  const hourGroups = {}
  for (const row of sorted) {
    if (!hourGroups[row.hour]) hourGroups[row.hour] = []
    hourGroups[row.hour].push(row)
  }
  const hourKeys = Object.keys(hourGroups).sort()
  const dominantRooms = hourKeys.map(hk => {
    const rows = hourGroups[hk]
    let maxRoom = null, maxEvents = 0
    for (const r of rows) {
      if ((r.total_events || 0) > maxEvents) { maxEvents = r.total_events || 0; maxRoom = r.room_name }
    }
    return maxRoom
  }).filter(Boolean)
  let transitions = 0
  for (let i = 1; i < dominantRooms.length; i++) {
    if (dominantRooms[i] !== dominantRooms[i - 1]) transitions++
  }
  return transitions
}

// ============================================================
// Score berekening
// ============================================================

const scoreBreakdown = computed(() => {
  if (!dayStats.value || !baselineStats.value) return []
  return activeFeatures.value.map(feature => {
    const todayValue = getTodayValue(feature)
    const avgKey = feature.isTime ? `avg_${feature.key}_minutes` : `avg_${feature.key}`
    const stdKey = feature.isTime ? `std_${feature.key}_minutes` : `std_${feature.key}`
    const baselineValue = baselineStats.value[avgKey]
    const stddevValue = baselineStats.value[stdKey]
    const zScore = calculateZScore(todayValue, baselineValue, stddevValue)
    const absZ = Math.abs(zScore)

    let displayValue
    if (todayValue === null || todayValue === undefined) displayValue = '-'
    else if (feature.isTime) displayValue = minutesToTime(todayValue)
    else if (feature.key === 'room_ratio' || feature.key === 'activity_regularity') displayValue = todayValue.toFixed(2)
    else displayValue = todayValue

    let displayBaseline
    if (baselineValue === null || baselineValue === undefined) displayBaseline = '-'
    else if (feature.isTime) displayBaseline = minutesToTime(baselineValue)
    else if (feature.key === 'room_ratio' || feature.key === 'activity_regularity') displayBaseline = baselineValue.toFixed(2)
    else displayBaseline = baselineValue?.toFixed(1)

    return {
      key: feature.key,
      label: feature.label,
      weight: feature.weight,
      todayValue: displayValue,
      baselineValue: displayBaseline,
      stddev: stddevValue?.toFixed(2) ?? '-',
      zScore,
      zScoreDisplay: zScore.toFixed(2),
      severity: absZ > 2 ? 'high' : absZ > 1 ? 'medium' : 'low'
    }
  })
})

const groupedBreakdown = computed(() => {
  const byKey = {}
  for (const row of scoreBreakdown.value) byKey[row.key] = row
  const result = {}
  for (const group of activeFeatureGroups.value) {
    result[group.id] = group.features.map(f => byKey[f.key]).filter(Boolean)
  }
  return result
})

const anomalyScore = computed(() => {
  if (scoreBreakdown.value.length === 0) return 0
  const validScores = scoreBreakdown.value.filter(s => s.zScore !== null && !isNaN(s.zScore))
  if (validScores.length === 0) return 0
  const maxAbsZ = Math.max(...validScores.map(s => Math.abs(s.zScore)))
  const totalWeight = validScores.reduce((sum, s) => sum + s.weight, 0)
  const weightedAvgZ = validScores.reduce((sum, s) => sum + Math.abs(s.zScore) * s.weight, 0) / totalWeight
  return Math.min(1, (0.6 * maxAbsZ + 0.4 * weightedAvgZ) / 3)
})

const anomalyLabel = computed(() => {
  const score = anomalyScore.value
  if (score < 0.33) return { text: 'Normaal', color: 'primary' }
  if (score < 0.66) return { text: 'Afwijkend', color: 'amber' }
  return { text: 'Sterk afwijkend', color: 'red' }
})

// ============================================================
// Data laden — met expliciete config_id filter (admin heeft geen RLS)
// ============================================================

async function loadDayStats() {
  if (!selectedConfigId.value) return
  try {
    const { data, error: fetchError } = await activityDb()
      .from('daily_activity_stats')
      .select('*')
      .eq('config_id', selectedConfigId.value)
      .eq('date', selectedDate.value)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      error.value = 'Kan dagstatistieken niet laden'
      return
    }
    dayStats.value = data || null
    error.value = null
  } catch (e) {
    error.value = 'Onverwachte fout bij laden dagstatistieken'
  }
}

async function loadRoomHourlyData() {
  if (!selectedConfigId.value) return
  try {
    const { data, error: fetchError } = await activityDb()
      .from('room_activity_hourly')
      .select('room_name, hour, motion_events, door_events, total_events')
      .eq('config_id', selectedConfigId.value)
      .gte('hour', `${selectedDate.value}T00:00:00`)
      .lte('hour', `${selectedDate.value}T23:59:59`)

    if (!fetchError) roomHourlyData.value = data || []
  } catch (e) {
    console.error('Error loading room hourly data:', e)
  }
}

async function loadBaselineStats() {
  if (!selectedConfigId.value) return
  try {
    const selected = new Date(selectedDate.value)
    const fourteenDaysAgo = new Date(selected)
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

    const { data: dailyData, error: dailyError } = await activityDb()
      .from('daily_activity_stats')
      .select('*')
      .eq('config_id', selectedConfigId.value)
      .gte('date', toLocalDateKey(fourteenDaysAgo))
      .lt('date', selectedDate.value)

    if (dailyError || !dailyData || dailyData.length === 0) {
      baselineStats.value = null
      return
    }

    const { data: roomData } = await activityDb()
      .from('room_activity_hourly')
      .select('room_name, hour, motion_events, door_events, total_events')
      .eq('config_id', selectedConfigId.value)
      .gte('hour', `${toLocalDateKey(fourteenDaysAgo)}T00:00:00`)
      .lt('hour', `${selectedDate.value}T00:00:00`)

    const hourlyPatterns = dailyData
      .filter(d => d.events_per_hour && d.events_per_hour.length === 24)
      .map(d => d.events_per_hour)

    if (hourlyPatterns.length > 0) {
      const avgPattern = Array(24).fill(0)
      for (const pattern of hourlyPatterns) {
        for (let h = 0; h < 24; h++) avgPattern[h] += (pattern[h] || 0)
      }
      baselineAvgHourlyPattern.value = avgPattern.map(v => v / hourlyPatterns.length)
    } else {
      baselineAvgHourlyPattern.value = null
    }

    const roomByDate = {}
    if (roomData) {
      for (const row of roomData) {
        const dateKey = row.hour.substring(0, 10)
        if (!roomByDate[dateKey]) roomByDate[dateKey] = []
        roomByDate[dateKey].push(row)
      }
    }
    baselineRoomByDate.value = roomByDate

    const stats = {}
    for (const feature of allFeatures) {
      const values = []
      for (const day of dailyData) {
        const value = getHistoricalValue(feature, day, roomByDate[day.date] || [])
        if (value !== null && value !== undefined && !isNaN(value)) values.push(value)
      }
      if (values.length > 0) {
        const mean = values.reduce((a, b) => a + b, 0) / values.length
        const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length
        const std = Math.sqrt(variance)
        const suffix = feature.isTime ? '_minutes' : ''
        stats[`avg_${feature.key}${suffix}`] = mean
        stats[`std_${feature.key}${suffix}`] = std || 1
        stats[`min_${feature.key}${suffix}`] = Math.min(...values)
        stats[`max_${feature.key}${suffix}`] = Math.max(...values)
      }
    }
    stats.daysCount = dailyData.length
    baselineStats.value = stats
  } catch (e) {
    console.error('Error loading baseline stats:', e)
  }
}

async function loadDataQuality() {
  if (!selectedConfigId.value) return
  try {
    const { data: allDays } = await activityDb()
      .from('daily_activity_stats')
      .select('date, total_events')
      .eq('config_id', selectedConfigId.value)
      .order('date', { ascending: false })
      .limit(30)

    const { data: sensors } = await supabase.schema('integrations')
      .from('hue_devices')
      .select('id, name, room_name, device_type, last_state_at')
      .eq('config_id', selectedConfigId.value)
      .in('device_type', ['motion_sensor', 'contact_sensor'])

    const now = new Date()
    const ninetyMinutesAgo = new Date(now.getTime() - 90 * 60 * 1000)
    const offlineSensors = (sensors || []).filter(s =>
      !s.last_state_at || new Date(s.last_state_at) < ninetyMinutesAgo
    )

    dataQuality.value = {
      totalDaysWithData: allDays?.length || 0,
      daysWithLowActivity: allDays?.filter(d => d.total_events < 10).length || 0,
      totalSensors: sensors?.length || 0,
      offlineSensors: offlineSensors.length,
      offlineSensorsList: offlineSensors.map(s => s.room_name || s.name),
    }
  } catch (e) {
    console.error('Error loading data quality:', e)
  }
}

async function loadAllData() {
  if (!selectedConfigId.value) return
  loading.value = true
  dayStats.value = null
  baselineStats.value = null
  dataQuality.value = null
  try {
    await Promise.all([
      loadDayStats(),
      loadRoomHourlyData(),
      loadBaselineStats(),
      loadDataQuality()
    ])
  } finally {
    loading.value = false
  }
}

watch(selectedDate, () => loadAllData())
watch(selectedHousehold, () => loadAllData())

onMounted(async () => {
  await loadHouseholds()
  if (selectedConfigId.value) loadAllData()
})
</script>

<template>
  <div class="space-y-6" style="max-width: 1400px;">
    <!-- Header -->
    <div class="flex items-center justify-between flex-wrap gap-3">
      <div>
        <div class="flex items-center gap-2">
          <h1 class="text-2xl font-bold text-gray-900">Anomaly Analyse</h1>
          <span class="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded">
            Admin
          </span>
        </div>
        <p class="text-gray-500">Z-score anomaly detection · 18 features · 6 groepen</p>
      </div>

      <!-- Household selector -->
      <div v-if="!householdsLoading">
        <label class="block text-xs text-gray-500 mb-1">Huishouden</label>
        <select
          v-model="selectedHousehold"
          class="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option v-for="h in households" :key="h.id" :value="h">
            {{ h.name }}
          </option>
        </select>
      </div>
      <div v-else class="text-sm text-gray-400">Huishoudens laden...</div>
    </div>

    <!-- Geen huishouden of geen config_id -->
    <div v-if="!selectedConfigId && !householdsLoading" class="bg-amber-50 border border-amber-200 rounded-lg p-4">
      <p class="text-amber-800">Geen Hue config gevonden voor dit huishouden. Selecteer een ander huishouden.</p>
    </div>

    <template v-else-if="selectedConfigId">
      <!-- Date Selector -->
      <div class="bg-white border border-gray-200 rounded-lg p-4">
        <div class="flex items-center justify-between">
          <button @click="prevDay" class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div class="text-center">
            <div class="text-lg font-semibold text-gray-900">{{ formatDateDisplay(selectedDate) }}</div>
            <div class="text-sm text-gray-500">{{ selectedDate }}</div>
          </div>
          <button @click="nextDay" :disabled="isToday" class="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
            <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="bg-white rounded-lg border p-12 text-center">
        <div class="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p class="text-gray-500">Data laden...</p>
      </div>

      <template v-else>
        <!-- Error -->
        <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
          <p class="text-red-800">{{ error }}</p>
        </div>

        <!-- No data -->
        <div v-else-if="!dayStats" class="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p class="text-amber-800">Geen data voor deze datum. Controleer of de hue-sync-state draait voor dit huishouden.</p>
        </div>

        <template v-else>
          <!-- Anomaly Score Card -->
          <div class="bg-white border border-gray-200 rounded-lg p-5">
            <h2 class="text-base font-semibold text-gray-900 mb-4">Anomaly Score</h2>
            <div class="flex items-center gap-4 mb-4">
              <div class="text-4xl font-bold" :class="{
                'text-green-600': anomalyLabel.color === 'primary',
                'text-amber-600': anomalyLabel.color === 'amber',
                'text-red-600': anomalyLabel.color === 'red'
              }">
                {{ (anomalyScore * 100).toFixed(0) }}%
              </div>
              <div>
                <div class="font-medium" :class="{
                  'text-green-700': anomalyLabel.color === 'primary',
                  'text-amber-700': anomalyLabel.color === 'amber',
                  'text-red-700': anomalyLabel.color === 'red'
                }">{{ anomalyLabel.text }}</div>
                <div class="text-sm text-gray-500">
                  {{ activeFeatures.length }} features · {{ baselineStats?.daysCount || 0 }} dagen baseline
                </div>
              </div>
            </div>
            <div class="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div class="h-full rounded-full transition-all duration-500"
                :class="{
                  'bg-green-500': anomalyLabel.color === 'primary',
                  'bg-amber-500': anomalyLabel.color === 'amber',
                  'bg-red-500': anomalyLabel.color === 'red'
                }"
                :style="{ width: `${anomalyScore * 100}%` }">
              </div>
            </div>
            <div class="flex justify-between text-xs text-gray-400 mt-1">
              <span>0 (normaal)</span><span>0.33</span><span>0.66</span><span>1.0 (afwijkend)</span>
            </div>
            <div class="mt-3 text-xs text-gray-400">
              Score = 0.6 × max(|z|) + 0.4 × gewogen gem(|z|), genormaliseerd naar 0–1
            </div>
          </div>

          <!-- Score Breakdown per groep -->
          <div class="bg-white border border-gray-200 rounded-lg p-5">
            <h2 class="text-base font-semibold text-gray-900 mb-4">
              Score Breakdown
              <span class="text-sm font-normal text-gray-500 ml-2">
                {{ activeFeatures.length }} features in {{ activeFeatureGroups.length }} groepen
              </span>
            </h2>

            <div v-for="group in activeFeatureGroups" :key="group.id" class="mb-5 last:mb-0">
              <div class="flex items-center gap-2 mb-2">
                <span class="text-xs font-semibold text-gray-500 uppercase tracking-wider">{{ group.label }}</span>
                <div class="flex-1 h-px bg-gray-100"></div>
              </div>
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead v-if="group === activeFeatureGroups[0]">
                    <tr class="text-left text-gray-500">
                      <th class="pb-2 font-medium">Feature</th>
                      <th class="pb-2 font-medium text-right">Vandaag</th>
                      <th class="pb-2 font-medium text-right">Baseline</th>
                      <th class="pb-2 font-medium text-right">Std</th>
                      <th class="pb-2 font-medium text-right">Z-score</th>
                      <th class="pb-2 font-medium w-28"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="row in groupedBreakdown[group.id]" :key="row.key" class="border-b border-gray-50 last:border-0">
                      <td class="py-2 font-medium text-gray-900">{{ row.label }}</td>
                      <td class="py-2 text-right font-mono text-sm">{{ row.todayValue }}</td>
                      <td class="py-2 text-right font-mono text-sm text-gray-500">{{ row.baselineValue }}</td>
                      <td class="py-2 text-right font-mono text-sm text-gray-400">{{ row.stddev }}</td>
                      <td class="py-2 text-right font-mono text-sm" :class="{
                        'text-green-600': row.severity === 'low',
                        'text-amber-600': row.severity === 'medium',
                        'text-red-600': row.severity === 'high'
                      }">{{ row.zScoreDisplay }}</td>
                      <td class="py-2 pl-3">
                        <div class="h-2 bg-gray-100 rounded-full overflow-hidden relative">
                          <div class="absolute left-1/2 top-0 bottom-0 w-px bg-gray-300"></div>
                          <div class="absolute top-0 bottom-0 rounded-full"
                            :class="{
                              'bg-green-500': row.severity === 'low',
                              'bg-amber-500': row.severity === 'medium',
                              'bg-red-500': row.severity === 'high'
                            }"
                            :style="{
                              left: `${50 + Math.max(-50, Math.min(50, row.zScore * 16.67))}%`,
                              width: '8px',
                              marginLeft: '-4px'
                            }">
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div class="mt-4 text-xs text-gray-400">
              Z-score: |z| &lt; 1 = normaal · 1–2 = afwijkend · &gt; 2 = sterk afwijkend
            </div>
          </div>

          <!-- Baseline Statistieken -->
          <div class="bg-white border border-gray-200 rounded-lg p-5">
            <h2 class="text-base font-semibold text-gray-900 mb-4">Baseline Statistieken</h2>
            <div v-if="!baselineStats" class="text-gray-500 text-center py-4">
              Onvoldoende historische data (min. 7 dagen nodig)
            </div>
            <div v-else class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="text-left text-gray-500 border-b">
                    <th class="pb-2 font-medium">Feature</th>
                    <th class="pb-2 font-medium text-right">Gemiddelde</th>
                    <th class="pb-2 font-medium text-right">Std</th>
                    <th class="pb-2 font-medium text-right">Min</th>
                    <th class="pb-2 font-medium text-right">Max</th>
                  </tr>
                </thead>
                <tbody>
                  <template v-for="group in activeFeatureGroups" :key="'bl-' + group.id">
                    <tr class="bg-gray-50">
                      <td colspan="5" class="py-1.5 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {{ group.label }}
                      </td>
                    </tr>
                    <tr v-for="feature in group.features" :key="'bl-' + feature.key" class="border-b border-gray-100 last:border-0">
                      <td class="py-2 font-medium text-gray-900">{{ feature.label }}</td>
                      <template v-if="feature.isTime">
                        <td class="py-2 text-right font-mono">{{ minutesToTime(baselineStats[`avg_${feature.key}_minutes`]) }}</td>
                        <td class="py-2 text-right font-mono text-gray-400">{{ baselineStats[`std_${feature.key}_minutes`]?.toFixed(0) || '-' }} min</td>
                        <td class="py-2 text-right font-mono text-gray-500">{{ minutesToTime(baselineStats[`min_${feature.key}_minutes`]) }}</td>
                        <td class="py-2 text-right font-mono text-gray-500">{{ minutesToTime(baselineStats[`max_${feature.key}_minutes`]) }}</td>
                      </template>
                      <template v-else>
                        <td class="py-2 text-right font-mono">{{ baselineStats[`avg_${feature.key}`]?.toFixed(1) || '-' }}</td>
                        <td class="py-2 text-right font-mono text-gray-400">{{ baselineStats[`std_${feature.key}`]?.toFixed(2) || '-' }}</td>
                        <td class="py-2 text-right font-mono text-gray-500">{{ baselineStats[`min_${feature.key}`]?.toFixed?.(1) ?? baselineStats[`min_${feature.key}`] ?? '-' }}</td>
                        <td class="py-2 text-right font-mono text-gray-500">{{ baselineStats[`max_${feature.key}`]?.toFixed?.(1) ?? baselineStats[`max_${feature.key}`] ?? '-' }}</td>
                      </template>
                    </tr>
                  </template>
                </tbody>
              </table>
            </div>
            <div class="mt-4 text-xs text-gray-400">
              Baseline: laatste 14 dagen ({{ baselineStats?.daysCount || 0 }} dagen met data)
            </div>
          </div>

          <!-- Data Quality -->
          <div class="bg-white border border-gray-200 rounded-lg p-5">
            <h2 class="text-base font-semibold text-gray-900 mb-4">Data Quality</h2>
            <div v-if="dataQuality" class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div class="bg-gray-50 rounded-lg p-4">
                <div class="text-2xl font-bold text-gray-900">{{ dataQuality.totalDaysWithData }}</div>
                <div class="text-sm text-gray-500">Dagen met data</div>
              </div>
              <div class="bg-gray-50 rounded-lg p-4">
                <div class="text-2xl font-bold" :class="dataQuality.daysWithLowActivity > 3 ? 'text-amber-600' : 'text-gray-900'">
                  {{ dataQuality.daysWithLowActivity }}
                </div>
                <div class="text-sm text-gray-500">Dagen lage activiteit (&lt;10)</div>
              </div>
              <div class="bg-gray-50 rounded-lg p-4">
                <div class="text-2xl font-bold text-gray-900">{{ dataQuality.totalSensors }}</div>
                <div class="text-sm text-gray-500">Totaal sensoren</div>
              </div>
              <div class="bg-gray-50 rounded-lg p-4">
                <div class="text-2xl font-bold" :class="dataQuality.offlineSensors > 0 ? 'text-red-600' : 'text-green-600'">
                  {{ dataQuality.offlineSensors }}
                </div>
                <div class="text-sm text-gray-500">Offline sensoren</div>
              </div>
            </div>
            <div v-if="dataQuality?.offlineSensors > 0" class="mt-4 p-3 bg-red-50 rounded-lg">
              <div class="text-sm text-red-700">
                <span class="font-medium">Offline:</span> {{ dataQuality.offlineSensorsList.join(', ') }}
              </div>
            </div>
          </div>

          <!-- Raw Data -->
          <div class="bg-white border border-gray-200 rounded-lg p-5">
            <h2 class="text-base font-semibold text-gray-900 mb-4">Raw Data</h2>
            <div class="bg-gray-900 rounded-lg p-4 overflow-x-auto">
              <pre class="text-sm text-green-400 font-mono whitespace-pre-wrap">{{ JSON.stringify(dayStats, null, 2) }}</pre>
            </div>
          </div>

          <!-- Events per uur -->
          <div class="bg-white border border-gray-200 rounded-lg p-5">
            <h2 class="text-base font-semibold text-gray-900 mb-4">Events per uur</h2>
            <div v-if="dayStats?.events_per_hour" class="flex items-end gap-1 h-32">
              <div v-for="(count, hour) in dayStats.events_per_hour" :key="hour" class="flex-1 flex flex-col items-center">
                <div class="w-full rounded-t transition-all"
                  :class="count > 0 ? 'bg-purple-500' : 'bg-gray-200'"
                  :style="{ height: `${Math.max(2, (count / Math.max(...dayStats.events_per_hour, 1)) * 100)}%` }">
                </div>
                <div class="text-xs text-gray-400 mt-1">{{ hour }}</div>
              </div>
            </div>
            <div v-else class="text-gray-500 text-center py-4">Geen events_per_hour data</div>
          </div>
        </template>
      </template>
    </template>
  </div>
</template>
