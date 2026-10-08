<script setup>
import { computed, ref } from 'vue'
import { LoaderCircle, X } from 'lucide-vue-next'
import { formatRupiah, showErrorDialog } from '../../../helpers/toolsHelper'
import { useAucationsStore } from '../states/aucationsStore'

const props = defineProps({ open: Boolean, item: { type: Object, required: true } })
const emit = defineEmits(['close', 'saved'])
const auctions = useAucationsStore()
const amount = ref('')
const highestBid = computed(() => Math.max(
  Number(props.item.start_bid) || 0,
  ...(props.item.bids || []).map((bid) => Number(bid?.bid) || 0),
))

async function submit() {
  if (Number(amount.value) <= highestBid.value) {
    await showErrorDialog(`Tawaran harus lebih tinggi dari ${formatRupiah(highestBid.value)}.`)
    return
  }
  try {
    await auctions.addBid(props.item.id, Number(amount.value))
    emit('saved')
  } catch (error) {
    await showErrorDialog(error)
  }
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="modal-backdrop" @click.self="emit('close')">
      <section class="modal-panel" role="dialog" aria-modal="true" aria-labelledby="bid-modal-title">
        <header class="modal-header">
          <div><span class="eyebrow">AJUKAN PENAWARAN</span><h2 id="bid-modal-title">Buat tawaran</h2></div>
          <button class="icon-button" type="button" aria-label="Tutup" @click="emit('close')"><X :size="19" /></button>
        </header>
        <form class="modal-form" @submit.prevent="submit">
          <p class="modal-description">Kamu akan menawar untuk <strong>{{ item.title }}</strong>.</p>
          <div class="bid-current"><span>Tawaran tertinggi saat ini</span><strong>{{ formatRupiah(highestBid) }}</strong></div>
          <label class="field-label">Tawaran kamu
            <input v-model="amount" class="form-control form-control--large" type="number" :min="highestBid + 1" step="1000" required autofocus placeholder="Masukkan nominal" />
            <small class="field-hint">Masukkan harga yang lebih tinggi dari tawaran saat ini.</small>
          </label>
          <footer class="modal-actions">
            <button class="button button--secondary" type="button" @click="emit('close')">Batal</button>
            <button class="button button--primary" type="submit" :disabled="auctions.isSaving">
              <LoaderCircle v-if="auctions.isSaving" class="spin" :size="17" />
              {{ auctions.isSaving ? 'Mengirim...' : 'Kirim penawaran' }}
            </button>
          </footer>
        </form>
      </section>
    </div>
  </Teleport>
</template>
