<script setup>
import { RouterLink } from 'vue-router'

const tiles = [
  {
    title: 'Roadmap',
    description: 'Fasen, tickets en planning',
    to: '/roadmap',
    icon: 'roadmap',
    color: '#3b82f6'
  },
  {
    title: 'Wachtlijst',
    description: 'Aanmeldingen beheren',
    to: '/wachtlijst',
    icon: 'waitlist',
    color: '#10b981'
  },
  {
    title: 'Marketing',
    description: 'Campagne statistieken',
    to: '/marketing',
    icon: 'marketing',
    color: '#8b5cf6'
  },
  {
    title: 'Huishoudens',
    description: 'Alle huishoudens beheren',
    to: '/huishoudens',
    icon: 'households',
    color: '#f59e0b'
  },
  {
    title: 'Anomaly Analyse',
    description: 'Z-score anomaly detection per huishouden',
    to: '/analyse',
    icon: 'analyse',
    color: '#8b5cf6'
  }
]
</script>

<template>
  <div class="home">
    <div class="home-header">
      <h1>GerustThuis Admin</h1>
      <p>Beheer je project, wachtlijst en huishoudens</p>
    </div>

    <div class="tile-grid">
      <RouterLink
        v-for="tile in tiles"
        :key="tile.to"
        :to="tile.to"
        class="tile"
        :style="{ '--tile-color': tile.color }"
      >
        <div class="tile-icon">
          <!-- Roadmap -->
          <svg v-if="tile.icon === 'roadmap'" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
            <line x1="4" y1="22" x2="4" y2="15"/>
          </svg>
          <!-- Wachtlijst -->
          <svg v-if="tile.icon === 'waitlist'" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <!-- Marketing -->
          <svg v-if="tile.icon === 'marketing'" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"/>
            <line x1="12" y1="20" x2="12" y2="4"/>
            <line x1="6" y1="20" x2="6" y2="14"/>
            <line x1="2" y1="20" x2="22" y2="20"/>
          </svg>
          <!-- Huishoudens -->
          <svg v-if="tile.icon === 'households'" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <!-- Analyse -->
          <svg v-if="tile.icon === 'analyse'" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
          </svg>
        </div>
        <div class="tile-content">
          <h2>{{ tile.title }}</h2>
          <p>{{ tile.description }}</p>
        </div>
        <div class="tile-arrow">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </div>
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

.home-header {
  text-align: center;
  padding: 1rem 0;
}

.home-header h1 {
  margin: 0;
  font-size: 1.75rem;
  color: var(--color-text);
}

.home-header p {
  margin: 0.5rem 0 0;
  color: var(--color-text-secondary);
  font-size: 0.95rem;
}

.tile-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.tile {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 1.5rem;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.2s ease;
  cursor: pointer;
  min-height: 100px;
}

.tile:hover {
  border-color: var(--tile-color);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.tile-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--tile-color) 10%, transparent);
  color: var(--tile-color);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.tile-content {
  flex: 1;
  min-width: 0;
}

.tile-content h2 {
  margin: 0;
  font-size: 1.1rem;
  color: var(--color-text);
  font-weight: 600;
}

.tile-content p {
  margin: 0.25rem 0 0;
  font-size: 0.8rem;
  color: var(--color-text-secondary);
}

.tile-arrow {
  color: var(--color-text-secondary);
  opacity: 0;
  transition: opacity 0.2s;
  flex-shrink: 0;
}

.tile:hover .tile-arrow {
  opacity: 1;
}

@media (max-width: 600px) {
  .tile-grid {
    grid-template-columns: 1fr;
  }

  .home-header h1 {
    font-size: 1.5rem;
  }
}
</style>
