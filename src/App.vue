<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { store, initStore, exportData } from './stores/projectStore.js'
import { supabase, signOut } from './services/supabase'

const route = useRoute()
const router = useRouter()
const user = ref(null)

const isLoginPage = computed(() => route.path === '/login')
const isHome = computed(() => route.path === '/')
const isRoadmapSection = computed(() =>
  ['/roadmap', '/fasen', '/tickets', '/planning'].includes(route.path) ||
  route.path.startsWith('/fasen/')
)

async function loadProjectData(session) {
  if (session?.user) {
    await initStore()
  }
}

onMounted(async () => {
  const { data: { session } } = await supabase.auth.getSession()
  user.value = session?.user || null
  await loadProjectData(session)

  supabase.auth.onAuthStateChange(async (_event, session) => {
    user.value = session?.user || null
    await loadProjectData(session)
  })
})

async function handleLogout() {
  await signOut()
  router.push('/login')
}
</script>

<template>
  <!-- Login page: full screen, geen navigatie -->
  <RouterView v-if="isLoginPage" />

  <!-- App layout met navigatie -->
  <div v-else class="app">
    <header class="header" v-if="!isHome">
      <div class="header-content">
        <RouterLink to="/" class="back-home">&larr; Home</RouterLink>

        <nav v-if="isRoadmapSection" class="nav">
          <RouterLink to="/roadmap" class="nav-link" exact-active-class="active">Overzicht</RouterLink>
          <RouterLink to="/fasen" class="nav-link">Objectives</RouterLink>
          <RouterLink to="/tickets" class="nav-link">Tickets</RouterLink>
          <RouterLink to="/planning" class="nav-link">Tijdlijn</RouterLink>
        </nav>

        <div class="header-actions">
          <button v-if="isRoadmapSection" class="export-btn" @click="exportData" title="Exporteer als JSON">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </button>
          <button class="logout-btn" @click="handleLogout" title="Uitloggen">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </div>
    </header>

    <!-- Home page: toon logout knop apart -->
    <div v-if="isHome" class="home-logout">
      <button class="logout-btn-text" @click="handleLogout">Uitloggen</button>
    </div>

    <main class="main" :class="{ 'main-home': isHome }">
      <div v-if="store.loading && isRoadmapSection" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Project laden...</p>
      </div>
      <div v-else-if="store.error && isRoadmapSection" class="error-state">
        <p>Fout bij laden: {{ store.error }}</p>
        <button @click="loadProjectData({ user: user })" class="retry-btn">Opnieuw proberen</button>
      </div>
      <RouterView v-else />
    </main>
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background: var(--color-primary);
  color: white;
  padding: 0.75rem 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: flex;
  align-items: center;
  gap: 2rem;
}

.back-home {
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
  font-weight: 500;
  font-size: 0.875rem;
  white-space: nowrap;
  transition: color 0.2s;
}

.back-home:hover {
  color: white;
}

.nav {
  display: flex;
  gap: 1.5rem;
  flex: 1;
}

.nav-link {
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  font-weight: 500;
  font-size: 0.875rem;
  padding: 0.5rem 0;
  transition: color 0.2s;
}

.nav-link:hover,
.nav-link.router-link-active,
.nav-link.active {
  color: white;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: auto;
}

.export-btn,
.logout-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.export-btn:hover,
.logout-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.home-logout {
  position: absolute;
  top: 1rem;
  right: 1.5rem;
  z-index: 10;
}

.logout-btn-text {
  background: none;
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
}

.logout-btn-text:hover {
  border-color: var(--color-danger);
  color: var(--color-danger);
}

.main {
  flex: 1;
  max-width: 1400px;
  margin: 0 auto;
  padding: 1.5rem;
  width: 100%;
}

.main-home {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1.5rem;
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 4rem 2rem;
  color: var(--color-text-secondary);
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.retry-btn {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
}

.retry-btn:hover {
  opacity: 0.9;
}

@media (max-width: 768px) {
  .header-content {
    flex-wrap: wrap;
    gap: 1rem;
  }

  .nav {
    order: 3;
    width: 100%;
    justify-content: space-between;
  }

  .nav-link {
    font-size: 0.8rem;
  }
}
</style>
