<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { ArrowRight, ArrowUpRight, Gavel, Plus, Search, Sparkles, SlidersHorizontal, Trash2 } from 'lucide-vue-next'
import AucationCard from '../components/AucationCard.vue'
import AucationFormModal from '../modals/AucationFormModal.vue'
import { useAucationsStore } from '../states/aucationsStore'
import { useAuthStore } from '../../auth/states/authStore'
import { formatRupiah, showConfirmDialog, showErrorDialog, showSuccessDialog } from '../../../helpers/toolsHelper'

const auctions = useAucationsStore()
const auth = useAuthStore()
const activeTab = ref('all')
const search = ref('')
const modalOpen = ref(false)
const loadError = ref('')
const tabs = [
  { id: 'all', label: 'Semua lelang' },
  { id: 'mine', label: 'Lelang saya' },
  { id: 'open', label: 'Berlangsung' },
  { id: 'closed', label: 'Berakhir' },
]

const filteredAuctions = computed(() => {
  const term = search.value.trim().toLocaleLowerCase('id')
  return auctions.aucations.filter((item) => (
    !term || `${item.title || ''} ${item.description || ''}`.toLocaleLowerCase('id').includes(term)
  ))
})
const activeCount = computed(() => auctions.aucations.filter((item) => new Date(String(item.closed_at || '').replace(' ', 'T')) > new Date()).length)
const totalBids = computed(() => auctions.aucations.reduce((count, item) => count + (Array.isArray(item.bids) ? item.bids.length : 0), 0))

async function loadAuctions() {
  loadError.value = ''
  const filters = activeTab.value === 'mine'
    ? { is_me: 1 }
    : activeTab.value === 'open'
      ? { is_closed: 1 }
      : activeTab.value === 'closed'
        ? { is_closed: 0 }
        : {}
  try {
    await auctions.fetchAucations(filters)
  } catch (error) {
    loadError.value = error.message
  }
}

watch(activeTab, loadAuctions)
onMounted(loadAuctions)

async function deleteAll() {
  const answer = await showConfirmDialog(
    'Hapus semua lelang milikmu?',
    'Semua lelang dan penawaran terkait akan dihapus permanen.',
    'Hapus semuanya',
  )
  if (!answer.isConfirmed) return
  try {
    await auctions.deleteAllAucations()
    await loadAuctions()
    await showSuccessDialog('Semua lelang berhasil dihapus.')
  } catch (error) {
    await showErrorDialog(error)
  }
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <div class="home-page">
    <section class="welcome-banner">
      <div class="welcome-banner__content">
        <span class="welcome-tag"><Sparkles :size="14" /> PASARAN BARANG PILIHAN</span>
        <h1>Temukan <em>cerita</em> di balik setiap barang.</h1>
        <p>Berburu barang unik, temukan pemilik baru, dan ajukan tawaran yang tak terlupakan.</p>
        <button class="button button--light" type="button" @click="modalOpen = true">Mulai lelang <ArrowRight :size="17" /></button>
      </div>
      <div class="welcome-banner__art" aria-hidden="true">
        <span class="banner-orbit banner-orbit--one" /><span class="banner-orbit banner-orbit--two" />
        <div class="banner-ticket"><Gavel :size="32" /><span>BIDLY<br />AUCTION CLUB</span></div>
        <span class="banner-spark banner-spark--one">✳</span><span class="banner-spark banner-spark--two">✦</span>
        <span class="banner-stamp">GOOD<br />FINDS<br />ONLY</span>
      </div>
      <span class="banner-decor banner-decor--a" /><span class="banner-decor banner-decor--b" />
    </section>

    <section class="stats-row" aria-label="Ringkasan lelang">
      <article class="stat-card"><span class="stat-card__icon stat-card__icon--purple"><Gavel :size="17" /></span><div><strong>{{ auctions.aucations.length }}</strong><span>Lelang ditemukan</span></div><span class="stat-trend">di marketplace <ArrowUpRight :size="13" /></span></article>
      <article class="stat-card"><span class="stat-card__icon stat-card__icon--green"><span class="status-dot" /></span><div><strong>{{ activeCount }}</strong><span>Masih berlangsung</span></div><span class="stat-trend stat-trend--green">buru sebelum usai</span></article>
      <article class="stat-card"><span class="stat-card__icon stat-card__icon--orange"><Gavel :size="17" /></span><div><strong>{{ totalBids }}</strong><span>Total penawaran</span></div><span class="stat-trend">komunitas aktif</span></article>
    </section>

    <section class="auction-section">
      <header class="section-heading">
        <div><span class="eyebrow">PILIHAN KOMUNITAS</span><h2>Jelajahi lelang</h2><p>Barang menarik sedang menunggu pemilik berikutnya.</p></div>
        <div class="section-heading__actions">
          <button v-if="activeTab === 'mine' && auctions.aucations.length" class="button button--danger-ghost" type="button" @click="deleteAll"><Trash2 :size="15" /> Hapus semua</button>
          <button class="button button--primary" type="button" @click="modalOpen = true"><Plus :size="17" /> Buat lelang</button>
        </div>
      </header>

      <div class="auction-toolbar">
        <div class="filter-tabs" role="tablist" aria-label="Filter lelang">
          <button v-for="tab in tabs" :key="tab.id" class="filter-tab" :class="{ 'is-active': activeTab === tab.id }" type="button" role="tab" :aria-selected="activeTab === tab.id" @click="activeTab = tab.id">{{ tab.label }}</button>
        </div>
        <label class="search-box"><Search :size="17" /><input v-model="search" placeholder="Cari barang lelang..." aria-label="Cari barang lelang" /><kbd>⌘ K</kbd></label>
        <span class="icon-button toolbar-filter" aria-hidden="true" title="Filter"><SlidersHorizontal :size="17" /></span>
      </div>

      <div v-if="loadError" class="state-card state-card--error" role="alert">
        <strong>Belum berhasil memuat lelang.</strong><span>{{ loadError }}</span><button class="button button--secondary" type="button" @click="loadAuctions">Coba lagi</button>
      </div>
      <div v-else-if="auctions.isLoading" class="auction-grid">
        <div v-for="index in 6" :key="index" class="auction-skeleton"><span /><span /><span /></div>
      </div>
      <div v-else-if="!filteredAuctions.length" class="state-card">
        <span class="state-card__icon"><Gavel :size="25" /></span>
        <strong>{{ search ? 'Tidak ada hasil yang cocok.' : activeTab === 'mine' ? 'Lelangmu dimulai di sini.' : 'Belum ada lelang untuk ditampilkan.' }}</strong>
        <span>{{ search ? 'Coba kata kunci lain atau ubah filter.' : 'Jadilah yang pertama menawarkan barang unik di Bidly.' }}</span>
        <button v-if="!search" class="button button--primary" type="button" @click="modalOpen = true"><Plus :size="16" /> Buat lelang pertama</button>
      </div>
      <div v-else class="auction-grid">
        <AucationCard v-for="item in filteredAuctions" :key="item.id" :item="item" />
      </div>

      <div v-if="filteredAuctions.length" class="section-footer">
        <span>Menampilkan <strong>{{ filteredAuctions.length }}</strong> dari {{ auctions.aucations.length }} lelang</span>
        <button type="button" @click="scrollToTop">Kembali ke atas <ArrowUpRight :size="14" /></button>
      </div>
    </section>
    <AucationFormModal :open="modalOpen" @close="modalOpen = false" @saved="async () => { modalOpen = false; await loadAuctions(); await showSuccessDialog('Lelangmu berhasil diterbitkan!') }" />
    <span class="home-greeting" aria-hidden="true">Dibuat untuk {{ auth.user?.name || 'para penemu' }} <span>✦</span></span>
  </div>
</template>
