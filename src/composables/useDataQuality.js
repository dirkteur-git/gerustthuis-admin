/**
 * Shared data quality and activity calculation utilities
 * Used by Dashboard, Patronen, and Analyse views for consistent calculations
 */

// Minimum days of data required for reliable baseline analysis
export const MINIMUM_DAYS_REQUIRED = 7

// Day boundary constants
export const DAY_START_HOUR = 5  // Day starts at 05:00 for activity detection
export const NIGHT_START_HOUR = 23 // Night begins at 23:00
export const NIGHT_END_HOUR = 6   // Night ends at 06:00

/**
 * Calculate "day start" from events_per_hour array
 * Looks for first cluster of activity (≥2 events) after 05:00
 * with follow-up activity within 2 hours
 *
 * @param {number[]} eventsPerHour - Array of 24 hourly event counts
 * @returns {number|null} - Minutes since midnight, or null if no day start found
 */
export function calculateDayStart(eventsPerHour) {
  if (!eventsPerHour || eventsPerHour.length < 24) return null

  // Look for first activity cluster after 05:00 (until noon)
  for (let h = DAY_START_HOUR; h < 12; h++) {
    if (eventsPerHour[h] >= 2) {
      // Check if there's follow-up activity within 2 hours
      const hasFollowUp = (eventsPerHour[h + 1] || 0) > 0 || (eventsPerHour[h + 2] || 0) > 0
      if (hasFollowUp) {
        return h * 60 // minutes since midnight
      }
    }
  }

  // Fallback: first hour with any activity after 05:00
  for (let h = DAY_START_HOUR; h < 24; h++) {
    if (eventsPerHour[h] > 0) {
      return h * 60
    }
  }

  return null
}

/**
 * Calculate day events (between DAY_START_HOUR and NIGHT_START_HOUR)
 *
 * @param {number[]} eventsPerHour - Array of 24 hourly event counts
 * @returns {number} - Total events during day hours
 */
export function getDayEvents(eventsPerHour) {
  if (!eventsPerHour) return 0
  let total = 0
  for (let h = DAY_START_HOUR; h < NIGHT_START_HOUR; h++) {
    total += eventsPerHour[h] || 0
  }
  return total
}

/**
 * Calculate day events until a specific hour
 *
 * @param {number[]} eventsPerHour - Array of 24 hourly event counts
 * @param {number} untilHour - Hour to count until (exclusive)
 * @returns {number} - Total events during day hours until specified hour
 */
export function getDayEventsUntilHour(eventsPerHour, untilHour) {
  if (!eventsPerHour) return 0
  let total = 0
  const endHour = Math.min(untilHour, NIGHT_START_HOUR)
  for (let h = DAY_START_HOUR; h < endHour; h++) {
    total += eventsPerHour[h] || 0
  }
  return total
}

/**
 * Calculate active day hours (hours with ≥1 event between DAY_START_HOUR and NIGHT_START_HOUR)
 *
 * @param {number[]} eventsPerHour - Array of 24 hourly event counts
 * @returns {number} - Count of hours with activity
 */
export function getActiveDayHours(eventsPerHour) {
  if (!eventsPerHour) return 0
  let count = 0
  for (let h = DAY_START_HOUR; h < NIGHT_START_HOUR; h++) {
    if (eventsPerHour[h] > 0) count++
  }
  return count
}

/**
 * Calculate active day hours until a specific hour
 *
 * @param {number[]} eventsPerHour - Array of 24 hourly event counts
 * @param {number} untilHour - Hour to count until (exclusive)
 * @returns {number} - Count of hours with activity
 */
export function getActiveDayHoursUntilHour(eventsPerHour, untilHour) {
  if (!eventsPerHour) return 0
  let count = 0
  const endHour = Math.min(untilHour, NIGHT_START_HOUR)
  for (let h = DAY_START_HOUR; h < endHour; h++) {
    if (eventsPerHour[h] > 0) count++
  }
  return count
}

/**
 * Check if an hour is during night time (23:00-06:00)
 *
 * @param {number} hour - Hour (0-23)
 * @returns {boolean} - True if night hour
 */
export function isNightHour(hour) {
  return hour >= NIGHT_START_HOUR || hour < NIGHT_END_HOUR
}

/**
 * Format minutes since midnight to HH:MM string
 *
 * @param {number|null} minutes - Minutes since midnight
 * @returns {string|null} - Formatted time string or null
 */
export function formatMinutesToTime(minutes) {
  if (minutes === null || minutes === undefined) return null
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/**
 * Convert time string (HH:MM or HH:MM:SS) to minutes since midnight
 *
 * @param {string} time - Time string
 * @returns {number} - Minutes since midnight
 */
export function timeToMinutes(time) {
  if (!time) return 0
  const parts = time.split(':')
  return parseInt(parts[0]) * 60 + parseInt(parts[1])
}

/**
 * Convert Date to local date key string (YYYY-MM-DD)
 *
 * @param {Date} date - Date object
 * @returns {string} - Date string in YYYY-MM-DD format
 */
export function toLocalDateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Calculate average of array
 *
 * @param {number[]} arr - Array of numbers
 * @returns {number|null} - Average or null if empty
 */
export function avg(arr) {
  if (!arr || arr.length === 0) return null
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

/**
 * Calculate standard deviation of array
 *
 * @param {number[]} arr - Array of numbers
 * @returns {number} - Standard deviation (minimum 1 to avoid division by zero)
 */
export function stddev(arr) {
  if (!arr || arr.length < 2) return 1
  const mean = avg(arr)
  const squareDiffs = arr.map(v => Math.pow(v - mean, 2))
  return Math.sqrt(avg(squareDiffs)) || 1
}

/**
 * Sum events from events_per_hour array for a specific hour range
 *
 * @param {number[]} eventsPerHour - Array of 24 hourly event counts
 * @param {number} startHour - Start hour (inclusive, 0-23)
 * @param {number} endHour - End hour (inclusive, 0-23)
 * @returns {number} - Sum of events in the range
 */
export function sumEventsInRange(eventsPerHour, startHour, endHour) {
  if (!eventsPerHour || eventsPerHour.length < 24) return 0
  let sum = 0
  for (let h = startHour; h <= endHour; h++) {
    sum += eventsPerHour[h] || 0
  }
  return sum
}

/**
 * Cosine similarity between two numeric arrays
 * Returns 0-1 where 1 means identical pattern
 *
 * @param {number[]} a - First array
 * @param {number[]} b - Second array (same length)
 * @returns {number} - Cosine similarity (0-1)
 */
export function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0
  let dotProduct = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < a.length; i++) {
    dotProduct += (a[i] || 0) * (b[i] || 0)
    normA += (a[i] || 0) ** 2
    normB += (b[i] || 0) ** 2
  }
  if (normA === 0 || normB === 0) return 0
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

/**
 * Compute awake duration in minutes from first and last activity times
 *
 * @param {string} firstActivity - TIME string (HH:MM or HH:MM:SS)
 * @param {string} lastActivity - TIME string
 * @returns {number|null} - Duration in minutes, or null if inputs invalid
 */
export function awakeDuration(firstActivity, lastActivity) {
  if (!firstActivity || !lastActivity) return null
  const first = timeToMinutes(firstActivity)
  const last = timeToMinutes(lastActivity)
  if (first === 0 && last === 0) return null
  return Math.max(0, last - first)
}
