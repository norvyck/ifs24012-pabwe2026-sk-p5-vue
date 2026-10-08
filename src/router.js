import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from './features/auth/states/authStore'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/auth',
      component: () => import('./features/auth/layouts/AuthLayout.vue'),
      children: [
        { path: 'login', name: 'login', component: () => import('./features/auth/pages/LoginPage.vue') },
        { path: 'register', name: 'register', component: () => import('./features/auth/pages/RegisterPage.vue') },
      ],
    },
    {
      path: '/',
      component: () => import('./features/aucations/layouts/AucationLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        { path: '', name: 'home', component: () => import('./features/aucations/pages/HomePage.vue') },
        { path: 'aucations/:aucationId', name: 'aucation-detail', component: () => import('./features/aucations/pages/DetailPage.vue') },
        { path: 'users', name: 'users', component: () => import('./features/users/pages/UsersPage.vue') },
        { path: 'profile', name: 'profile', component: () => import('./features/users/pages/ProfilePage.vue') },
      ],
    },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('./features/common/pages/NotFoundPage.vue') },
  ],
})

router.afterEach((to) => {
  const canonical = document.querySelector('link[rel="canonical"]')
  if (canonical) canonical.href = new URL(to.path, window.location.origin).href
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isAuthenticated) return { name: 'login' }
  if (['login', 'register'].includes(String(to.name)) && auth.isAuthenticated) return { name: 'home' }
})

export default router
