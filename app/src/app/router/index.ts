import Vue from 'vue'
import VueRouter from 'vue-router'
import store from '@/store'

Vue.use(VueRouter)

const routes = [
  { path: '/', redirect: '/dashboard' },
  { path: '/login', name: 'Login', component: () => import('@/pages/login/index.vue'), meta: { guest: true } },
  { path: '/register', name: 'Register', component: () => import('@/pages/register/index.vue'), meta: { guest: true } },
  { path: '/dashboard', name: 'Dashboard', component: () => import('@/pages/dashboard/index.vue') },
  { path: '/clients', name: 'Clients', component: () => import('@/pages/clients/index.vue') },
  { path: '/tasks', name: 'Tasks', component: () => import('@/pages/tasks/index.vue') },
  { path: '/profile', name: 'Profile', component: () => import('@/pages/profile/index.vue') }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

router.beforeEach((to, _from, next) => {
  const authenticated = store.getters['auth/isAuthenticated']
  const guestOnly = to.matched.some((r) => r.meta?.guest)
  if (guestOnly && authenticated) {
    next('/dashboard')
    return
  }
  if (!guestOnly && !authenticated) {
    next('/login')
    return
  }
  next()
})

export default router
