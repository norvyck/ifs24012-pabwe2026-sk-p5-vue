<script setup>
import { computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { Gavel, LogOut } from 'lucide-vue-next'
import { useAuthStore } from '../../auth/states/authStore'
import { resolveAssetUrl } from '../../../helpers/toolsHelper'

const emit = defineEmits(['logout'])
const route = useRoute()
const auth = useAuthStore()
const userName = computed(() => auth.user?.name || auth.user?.email || 'Pengguna')
const initials = computed(() => userName.value.split(/\s+/).slice(0, 2).map((word) => word[0]).join('').toUpperCase())
const photo = computed(() => auth.user?.photo ? resolveAssetUrl(auth.user.photo) : '')
const links = [
  { label: 'Jelajahi lelang', name: 'home' },
  { label: 'Komunitas', name: 'users' },
  { label: 'Profil saya', name: 'profile' },
]
</script>

<template>
  <header class="topbar">
    <RouterLink class="topbar__mobile-brand" :to="{ name: 'home' }"><span class="brand-mark"><Gavel :size="16" /></span>bidly<span class="brand-period">.</span></RouterLink>
    <div class="topbar__crumb"><span>Marketplace</span><span class="crumb-separator">/</span><strong>{{ links.find((link) => link.name === route.name)?.label || 'Detail lelang' }}</strong></div>
    <div class="topbar__actions">
      <span class="topbar__welcome">Selamat datang kembali, <strong>{{ userName.split(' ')[0] }}</strong></span>
      <RouterLink class="topbar-avatar" :to="{ name: 'profile' }" :title="userName">
        <img v-if="photo" :src="photo" :alt="`Foto profil ${userName}`" />
        <span v-else>{{ initials }}</span>
      </RouterLink>
      <button class="icon-button icon-button--quiet topbar-logout" type="button" aria-label="Keluar" title="Keluar" @click="emit('logout')"><LogOut :size="16" /></button>
    </div>
  </header>
</template>
