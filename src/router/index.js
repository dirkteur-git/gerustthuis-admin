import { createRouter, createWebHistory } from 'vue-router'
import { supabase, isAllowedEmail } from '../services/supabase'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue')
  },
  {
    path: '/roadmap',
    name: 'Roadmap',
    component: () => import('../views/Dashboard.vue')
  },
  {
    path: '/fasen',
    name: 'Fasen',
    component: () => import('../views/Fasen.vue')
  },
  {
    path: '/fasen/:id',
    name: 'FaseDetail',
    component: () => import('../views/FaseDetail.vue')
  },
  {
    path: '/tickets',
    name: 'Tickets',
    component: () => import('../views/Tickets.vue')
  },
  {
    path: '/planning',
    name: 'Planning',
    component: () => import('../views/Planning.vue')
  },
  {
    path: '/wachtlijst',
    name: 'Wachtlijst',
    component: () => import('../views/Wachtlijst.vue')
  },
  {
    path: '/marketing',
    name: 'Marketing',
    component: () => import('../views/Marketing.vue')
  },
  {
    path: '/huishoudens',
    name: 'Huishoudens',
    component: () => import('../views/Huishoudens.vue')
  },
  {
    path: '/analyse',
    name: 'Analyse',
    component: () => import('../views/Analyse.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to) => {
  const requiresAuth = to.meta.requiresAuth !== false

  if (requiresAuth) {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session || !isAllowedEmail(session.user?.email)) {
        if (session) await supabase.auth.signOut().catch(() => {})
        return '/login'
      }
    } catch {
      return '/login'
    }
  }

  if (to.path === '/login') {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session && isAllowedEmail(session.user?.email)) {
        return '/'
      }
    } catch {
      // Negeer — toon gewoon de loginpagina
    }
  }
})

export default router
