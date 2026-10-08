<script setup>
import { computed, onMounted, ref } from 'vue'
import { Search, UserRound, UsersRound, ArrowUpRight } from 'lucide-vue-next'
import { useUsersStore } from '../states/usersStore'
import { formatDate, resolveAssetUrl } from '../../../helpers/toolsHelper'

const users = useUsersStore()
const query = ref('')
const error = ref('')
const filteredUsers = computed(() => users.users.filter((user) => `${user.name} ${user.email}`.toLocaleLowerCase('id').includes(query.value.toLocaleLowerCase('id'))))

async function loadUsers() {
  error.value = ''
  try {
    await users.fetchUsers()
  } catch (requestError) {
    error.value = requestError.message
  }
}

onMounted(loadUsers)
</script>

<template>
  <section class="users-page">
    <div class="page-intro page-intro--warm">
      <span class="eyebrow"><UsersRound :size="14" /> KOMUNITAS BIDLY</span>
      <h1>Orang-orang di balik <em>penemuan.</em></h1>
      <p>Kenali komunitas yang berburu, menawar, dan membagikan barang dengan cerita.</p>
      <div class="community-avatar-stack" aria-hidden="true"><span>B</span><span>A</span><span>N</span><b>+{{ users.users.length || '—' }}</b></div>
    </div>
    <div class="users-toolbar">
      <div><span class="eyebrow">DIREKTORI PENGGUNA</span><h2>Komunitas lelang</h2></div>
      <label class="search-box"><Search :size="17" /><input v-model="query" placeholder="Cari nama atau email..." aria-label="Cari pengguna" /></label>
    </div>
    <div v-if="error" class="state-card state-card--error"><strong>Komunitas belum dapat dimuat.</strong><span>{{ error }}</span><button class="button button--secondary" @click="loadUsers">Coba lagi</button></div>
    <div v-else-if="users.isLoading" class="users-grid"><div v-for="index in 6" :key="index" class="user-skeleton" /></div>
    <div v-else-if="!filteredUsers.length" class="state-card"><span class="state-card__icon"><UserRound :size="23" /></span><strong>Belum menemukan pengguna.</strong><span>Coba cari menggunakan nama atau alamat email berbeda.</span></div>
    <div v-else class="users-grid">
      <article v-for="(user, index) in filteredUsers" :key="user.id" class="user-card">
        <div class="user-card__cover" :class="`user-card__cover--${index % 4}`"><span class="user-card__star">✳</span><span class="user-card__number">MEMBER NO. {{ String(user.id).padStart(3, '0') }}</span></div>
        <div class="user-card__body">
          <img v-if="user.photo" class="user-card__avatar" :src="resolveAssetUrl(user.photo)" :alt="user.name" />
          <span v-else class="user-card__avatar user-card__avatar--fallback"><UserRound :size="22" /></span>
          <div class="user-card__name"><div><strong>{{ user.name }}</strong><span>{{ user.email }}</span></div><ArrowUpRight :size="16" /></div>
          <div class="user-card__foot"><span>Anggota Bidly</span><span>Bergabung {{ formatDate(user.created_at) }}</span></div>
        </div>
      </article>
    </div>
  </section>
</template>
