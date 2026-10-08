<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, CalendarClock, Clock3, Gavel, Pencil, Trash2, Upload, UserRound, X } from 'lucide-vue-next'
import MarkdownViewer from '../components/MarkdownViewer.vue'
import AucationFormModal from '../modals/AucationFormModal.vue'
import BidModal from '../modals/BidModal.vue'
import { useAucationsStore } from '../states/aucationsStore'
import { useAuthStore } from '../../auth/states/authStore'
import { formatDate, formatRupiah, resolveAssetUrl, showConfirmDialog, showErrorDialog, showSuccessDialog } from '../../../helpers/toolsHelper'

const route = useRoute()
const router = useRouter()
const auctions = useAucationsStore()
const auth = useAuthStore()
const error = ref('')
const editOpen = ref(false)
const bidOpen = ref(false)
const item = computed(() => auctions.aucation)
const isOwner = computed(() => item.value && String(item.value.user_id) === String(auth.user?.id))
const bids = computed(() => [...(item.value?.bids || [])].sort((a, b) => Number(b?.bid || b) - Number(a?.bid || a)))
const highestBid = computed(() => Math.max(Number(item.value?.start_bid) || 0, ...bids.value.map((bid) => Number(bid?.bid) || 0)))
const ended = computed(() => item.value && new Date(String(item.value.closed_at).replace(' ', 'T')) <= new Date())
const myBid = computed(() => item.value?.my_bid)

async function load() {
  error.value = ''
  try {
    const result = await auctions.fetchAucation(route.params.aucationId)
    if (!result) error.value = 'Barang lelang tersebut tidak ditemukan.'
  } catch (requestError) {
    error.value = requestError.message
  }
}

onMounted(load)

async function removeAuction() {
  const answer = await showConfirmDialog('Hapus lelang ini?', 'Barang dan seluruh riwayat terkait akan dihapus.', 'Hapus lelang')
  if (!answer.isConfirmed) return
  try {
    await auctions.deleteAucation(item.value.id)
    await showSuccessDialog('Lelang berhasil dihapus.')
    await router.replace({ name: 'home' })
  } catch (requestError) {
    await showErrorDialog(requestError)
  }
}

async function cancelBid() {
  const answer = await showConfirmDialog('Batalkan tawaranmu?', 'Kamu bisa mengajukan tawaran kembali selama lelang masih berlangsung.', 'Batalkan tawaran')
  if (!answer.isConfirmed) return
  try {
    await auctions.deleteBid(item.value.id)
    await load()
    await showSuccessDialog('Tawaran berhasil dibatalkan.')
  } catch (requestError) {
    await showErrorDialog(requestError)
  }
}
</script>

<template>
  <div class="detail-page">
    <button class="back-link" type="button" @click="router.push({ name: 'home' })"><ArrowLeft :size="16" /> Kembali ke lelang</button>
    <div v-if="error" class="state-card state-card--error"><h1>Lelang tidak dapat dibuka.</h1><span>{{ error }}</span><button class="button button--secondary" @click="load">Coba lagi</button></div>
    <div v-else-if="auctions.isLoading || !item" class="detail-skeleton"><span /><span /><span /></div>
    <template v-else>
      <div class="detail-layout">
        <section class="detail-main">
          <div class="detail-image">
            <img v-if="item.cover" :src="resolveAssetUrl(item.cover)" :alt="item.title" />
            <div v-else class="detail-image__placeholder"><Gavel :size="54" /><span>BIDLY FINDS</span></div>
            <span class="auction-card__status" :class="{ 'is-closed': ended }"><span class="status-dot" />{{ ended ? 'Lelang berakhir' : 'Lelang berlangsung' }}</span>
            <button v-if="isOwner && !ended" class="cover-change" type="button" @click="editOpen = true"><Upload :size="15" /> Ganti cover</button>
          </div>
          <div class="detail-title-row">
            <div><span class="eyebrow">LELANG #{{ item.id }} · BIDLY MARKETPLACE</span><h1>{{ item.title }}</h1></div>
            <div v-if="isOwner" class="detail-owner-actions">
              <button class="icon-button" type="button" title="Ubah lelang" @click="editOpen = true"><Pencil :size="17" /></button>
              <button class="icon-button icon-button--danger" type="button" title="Hapus lelang" @click="removeAuction"><Trash2 :size="17" /></button>
            </div>
          </div>
          <div class="detail-meta">
            <span><UserRound :size="15" /> {{ item.author?.name || 'Penjual Bidly' }}</span>
            <span><CalendarClock :size="15" /> Ditutup {{ formatDate(item.closed_at) }}</span>
            <span><Clock3 :size="15" /> {{ ended ? 'Selesai' : 'Masih terbuka' }}</span>
          </div>
          <section class="detail-description">
            <h2>Tentang barang ini</h2>
            <MarkdownViewer :content="item.description" />
          </section>
        </section>
        <aside class="detail-sidebar">
          <article class="bid-summary">
            <span class="eyebrow">PENAWARAN SAAT INI</span>
            <strong class="bid-summary__price">{{ formatRupiah(highestBid) }}</strong>
            <span class="bid-summary__label">{{ bids.length }} penawaran · Harga awal {{ formatRupiah(item.start_bid) }}</span>
            <div class="bid-summary__divider" />
            <div class="bid-summary__time"><CalendarClock :size="17" /><span>{{ ended ? 'Lelang telah selesai' : `Berakhir ${formatDate(item.closed_at)}` }}</span></div>
            <button v-if="myBid && !ended" class="button button--secondary button--full" type="button" @click="cancelBid"><X :size="16" /> Batalkan tawaran saya</button>
            <button v-else-if="!isOwner && !ended" class="button button--primary button--full" type="button" @click="bidOpen = true"><Gavel :size="17" /> Ajukan penawaran</button>
            <p v-else-if="isOwner" class="owner-note">Ini lelang milikmu. Kelola detail dari tombol di atas.</p>
            <p v-else class="owner-note">Lelang ini sudah ditutup dan tidak menerima penawaran baru.</p>
          </article>
          <article class="bid-history">
            <div class="bid-history__heading"><div><span class="eyebrow">KOMUNITAS</span><h2>Riwayat tawaran</h2></div><span class="bid-history__count">{{ bids.length }}</span></div>
            <div v-if="!bids.length" class="bid-history__empty"><Gavel :size="19" /><span>Belum ada penawaran.<br />Jadilah yang pertama!</span></div>
            <div v-for="(bid, index) in bids" :key="bid.id || index" class="bid-row">
              <span class="bid-row__avatar">{{ String(bid.user?.name || bid.author?.name || `B${index + 1}`).slice(0, 1).toUpperCase() }}</span>
              <div><strong>{{ bid.user?.name || bid.author?.name || `Penawar ${index + 1}` }}</strong><span>{{ bid.created_at ? formatDate(bid.created_at) : 'Penawaran terbaru' }}</span></div>
              <b>{{ formatRupiah(bid.bid || bid) }}</b>
            </div>
          </article>
        </aside>
      </div>
    </template>
    <AucationFormModal :open="editOpen" :item="item" @close="editOpen = false" @saved="async () => { editOpen = false; await load(); await showSuccessDialog('Lelang berhasil diperbarui.') }" />
    <BidModal v-if="item" :open="bidOpen" :item="item" @close="bidOpen = false" @saved="async () => { bidOpen = false; await load(); await showSuccessDialog('Penawaranmu sudah terkirim!') }" />
  </div>
</template>
