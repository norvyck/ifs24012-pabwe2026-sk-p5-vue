<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Gavel, LayoutDashboard, LogOut, Sparkles, UserRound, UsersRound } from 'lucide-vue-next'
import { useAuthStore } from '../../auth/states/authStore'
import { resolveAssetUrl } from '../../../helpers/toolsHelper'

const emit = defineEmits(['logout'])
const route = useRoute()
const auth = useAuthStore()
const userName = computed(() => auth.user?.name || auth.user?.email || 'Pengguna')
const initials = computed(() => userName.value.split(/\s+/).slice(0, 2).map((word) => word[0]).join('').toUpperCase())
const photo = computed(() => auth.user?.photo ? resolveAssetUrl(auth.user.photo) : '')
const links = [
  { label: 'Jelajahi lelang', to: { name: 'home' }, icon: LayoutDashboard },
  { label: 'Komunitas', to: { name: 'users' }, icon: UsersRound },
  { label: 'Profil saya', to: { name: 'profile' }, icon: UserRound },
]
</script>

<template>
  <aside class="sidebar">
    <RouterLink class="brand" :to="{ name: 'home' }" aria-label="Bidly, jelajahi lelang">
      <span class="brand-mark"><Gavel :size="19" :stroke-width="2.6" /></span>
      <span>bidly<span class="brand-period">.</span></span>
    </RouterLink>
    <div class="sidebar-label">MENU UTAMA</div>
    <nav class="side-nav" aria-label="Navigasi utama">
      <RouterLink
        v-for="link in links"
        :key="link.label"
        :to="link.to"
        class="side-nav__link"
        :class="{ 'is-active': route.name === link.to.name }"
        :aria-label="link.label"
      >
        <component :is="link.icon" :size="18" :stroke-width="1.8" />
        <span>{{ link.label }}</span>
        <span v-if="link.to.name === 'home' && route.name === 'home'" class="nav-active-dot" />
      </RouterLink>
    </nav>
    <div class="sidebar-note">
      <div class="sidebar-note__icon"><Sparkles :size="17" /></div>
      <strong>Temukan yang kamu suka.</strong>
      <p>Barang unik, cerita baru, dan penawaran terbaik.</p>
      <RouterLink :to="{ name: 'home' }">Jelajahi sekarang <span>↗</span></RouterLink>
    </div>
    <div class="sidebar-bottom">
      <div class="sidebar-bottom__avatar">
        <img v-if="photo" :src="photo" :alt="`Foto profil ${userName}`" />
        <span v-else>{{ initials }}</span>
      </div>
      <div class="sidebar-bottom__user"><strong>{{ userName }}</strong><span>Akun Bidly</span></div>
      <button class="icon-button icon-button--quiet" type="button" aria-label="Keluar" title="Keluar" @click="emit('logout')"><LogOut :size="17" /></button>
    </div>
  </aside>
</template>
