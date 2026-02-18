import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Schema-scoped helpers voor tabellen buiten public
export const activityDb = () => supabase.schema('activity')
export const planningDb = () => supabase.schema('planning')

// Alleen deze e-mailadressen hebben toegang tot het admin portaal
const ALLOWED_EMAILS = ['dirk.bakker@gmx.net']

export function isAllowedEmail(email) {
  return ALLOWED_EMAILS.includes(email?.toLowerCase())
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) throw error

  // Check of het e-mailadres toegang heeft
  if (!isAllowedEmail(data.user?.email)) {
    await supabase.auth.signOut()
    throw new Error('Geen toegang. Dit portaal is alleen beschikbaar voor beheerders.')
  }

  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// ============================================================
// Households
// ============================================================

export async function getHouseholds() {
  const { data, error } = await supabase
    .from('households')
    .select(`
      id, name, config_id, created_at, updated_at,
      hue_config ( id, user_email )
    `)
    .order('name')

  if (error) throw error
  return data || []
}

export async function getHouseholdMembers(householdId) {
  const { data, error } = await supabase
    .from('household_members')
    .select('id, household_id, user_id, role, created_at')
    .eq('household_id', householdId)

  if (error) throw error

  // Haal display names op uit user_profiles
  const userIds = (data || []).map(m => m.user_id).filter(Boolean)
  let profileMap = {}

  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, display_name')
      .in('id', userIds)

    profileMap = Object.fromEntries(
      (profiles || []).map(p => [p.id, p.display_name])
    )
  }

  return (data || []).map(m => ({
    ...m,
    display_name: profileMap[m.user_id] || null,
  }))
}

export async function getHouseholdInvitations(householdId) {
  const { data, error } = await supabase
    .from('household_invitations')
    .select('id, invited_email, role, expires_at, accepted_at, created_at')
    .eq('household_id', householdId)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

// ============================================================
// Activity / Heatmap
// ============================================================

export async function getRoomActivityHourly(configId, days = 7) {
  const since = new Date()
  since.setDate(since.getDate() - (days - 1))
  since.setHours(0, 0, 0, 0)

  const { data, error } = await activityDb()
    .from('room_activity_hourly')
    .select('room_name, hour, total_events')
    .eq('config_id', configId)
    .gte('hour', since.toISOString())

  if (error) throw error
  return data || []
}
