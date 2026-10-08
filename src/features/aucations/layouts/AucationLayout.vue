<script setup>
import { useRoute, useRouter } from 'vue-router'
import { LayoutDashboard, UsersRound, UserRound } from 'lucide-vue-next'
import { useAuthStore } from '../../auth/states/authStore'
import { showConfirmDialog, showErrorDialog } from '../../../helpers/toolsHelper'
import NavbarComponent from '../components/NavbarComponent.vue'
import SidebarComponent from '../components/SidebarComponent.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const links = [
  { label: 'Jelajahi lelang', to: { name: 'home' }, icon: LayoutDashboard },
  { label: 'Komunitas', to: { name: 'users' }, icon: UsersRound },
  { label: 'Profil saya', to: { name: 'profile' }, icon: UserRound },
]

async function logout() {
  const answer = await showConfirmDialog('Keluar dari Bidly?', 'Sesi kamu akan diakhiri.', 'Keluar')
  if (!answer.isConfirmed) return
  try {
    await auth.logout()
    await router.replace({ name: 'login' })
  } catch (error) {
    await showErrorDialog(error)
  }
}
</script>

<template>
  <div class="app-shell">
    <SidebarComponent @logout="logout" />
    <div class="main-shell">
      <NavbarComponent @logout="logout" />
      <main class="page-content">
        <RouterView />
      </main>
      <nav class="mobile-nav" aria-label="Navigasi mobile">
        <RouterLink v-for="link in links" :key="link.label" :to="link.to" :class="{ 'is-active': route.name === link.to.name }">
          <component :is="link.icon" :size="19" /><span>{{ link.label }}</span>
        </RouterLink>
      </nav>
    </div>
  </div>
</template>
