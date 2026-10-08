<script setup>
import { ArrowUpRight, Clock3, Gavel, UserRound } from 'lucide-vue-next'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { formatRupiah, resolveAssetUrl } from '../../../helpers/toolsHelper'

const props = defineProps({ item: { type: Object, required: true } })
const now = ref(Date.now())
let timer
const closesAt = computed(() => new Date(String(props.item.closed_at || '').replace(' ', 'T')).getTime())
const closed = computed(() => Number.isFinite(closesAt.value) && closesAt.value <= now.value)
const timeRemaining = computed(() => {
  if (!Number.isFinite(closesAt.value)) return 'Waktu belum tersedia'
  const remaining = closesAt.value - now.value
  if (remaining <= 0) return 'Lelang selesai'
  const days = Math.floor(remaining / 86_400_000)
  const hours = Math.floor((remaining % 86_400_000) / 3_600_000)
  const minutes = Math.floor((remaining % 3_600_000) / 60_000)
  if (days) return `${days} hari lagi`
  if (hours) return `${hours} jam ${minutes} mnt`
  return `${Math.max(minutes, 1)} menit lagi`
})
const highestBid = computed(() => {
  const bids = Array.isArray(props.item.bids) ? props.item.bids : []
  return Math.max(0, ...bids.map((entry) => Number(entry?.bid) || 0))
})

onMounted(() => { timer = window.setInterval(() => { now.value = Date.now() }, 30_000) })
onBeforeUnmount(() => window.clearInterval(timer))
</script>

<template>
  <RouterLink :to="{ name: 'aucation-detail', params: { aucationId: item.id } }" class="auction-card">
    <div class="auction-card__image-wrap">
      <img
        v-if="item.cover"
        class="auction-card__image"
        :src="resolveAssetUrl(item.cover)"
        :alt="item.title"
        loading="lazy"
      />
      <div v-else class="auction-card__placeholder">
        <Gavel :size="34" :stroke-width="1.5" />
        <span>Bidly finds</span>
      </div>
      <span class="auction-card__status" :class="{ 'is-closed': closed }">
        <span class="status-dot" />{{ closed ? 'Berakhir' : 'Sedang berlangsung' }}
      </span>
      <span class="auction-card__image-link"><ArrowUpRight :size="17" /></span>
    </div>
    <div class="auction-card__content">
      <div class="auction-card__eyebrow"><span>LELANG PILIHAN</span><span>#{{ item.id }}</span></div>
      <h3>{{ item.title }}</h3>
      <div class="auction-card__seller">
        <span class="seller-avatar"><UserRound :size="13" /></span>
        <span>{{ item.author?.name || 'Komunitas Bidly' }}</span>
        <span class="seller-separator">·</span>
        <Clock3 :size="13" />
        <span>{{ timeRemaining }}</span>
      </div>
      <div class="auction-card__bottom">
        <div>
          <span class="price-label">Tawaran tertinggi</span>
          <strong>{{ formatRupiah(highestBid || item.start_bid) }}</strong>
        </div>
        <span class="bid-count"><Gavel :size="14" /> {{ Array.isArray(item.bids) ? item.bids.length : 0 }}</span>
      </div>
    </div>
  </RouterLink>
</template>
