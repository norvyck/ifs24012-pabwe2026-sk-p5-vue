<script setup>
import { computed, defineAsyncComponent, ref, watch } from 'vue'
import { X, ImagePlus, LoaderCircle } from 'lucide-vue-next'
import { formatRupiah, showErrorDialog } from '../../../helpers/toolsHelper'
import { useAucationsStore } from '../states/aucationsStore'

const MarkdownEditor = defineAsyncComponent(() => import('../components/MarkdownEditor.vue'))

const props = defineProps({
  open: Boolean,
  item: { type: Object, default: null },
})
const emit = defineEmits(['close', 'saved'])
const auctions = useAucationsStore()
const title = ref('')
const description = ref('')
const startBid = ref('')
const closedAt = ref('')
const coverFile = ref(null)
const coverPreview = ref('')
const isEditing = computed(() => Boolean(props.item))

watch(() => [props.open, props.item], () => {
  if (!props.open) return
  title.value = props.item?.title || ''
  description.value = props.item?.description || ''
  startBid.value = props.item?.start_bid || ''
  closedAt.value = props.item?.closed_at
    ? String(props.item.closed_at).replace(' ', 'T').slice(0, 16)
    : ''
  coverFile.value = null
  coverPreview.value = ''
}, { immediate: true })

function selectCover(event) {
  const file = event.target.files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    showErrorDialog('Pilih berkas gambar dengan format yang valid.')
    event.target.value = ''
    return
  }
  coverFile.value = file
  coverPreview.value = URL.createObjectURL(file)
}

async function submit() {
  if (!title.value.trim() || !description.value.trim() || Number(startBid.value) <= 0 || !closedAt.value) {
    await showErrorDialog('Lengkapi judul, deskripsi, harga awal, dan waktu penutupan.')
    return
  }
  try {
    const payload = {
      title: title.value.trim(),
      description: description.value,
      start_bid: Number(startBid.value),
      closed_at: closedAt.value.replace('T', ' ') + ':00',
    }
    if (isEditing.value) {
      await auctions.updateAucation(props.item.id, payload)
      if (coverFile.value) await auctions.uploadCover(props.item.id, coverFile.value)
    } else {
      const response = await auctions.addAucation(payload)
      const created = response?.data?.aucation || response?.data
      if (coverFile.value) {
        if (!created?.id) {
          throw new Error('Lelang berhasil dibuat, tetapi foto sampul belum terunggah karena ID lelang tidak diterima dari API. Unggah sampul melalui halaman ubah lelang.')
        }
        await auctions.uploadCover(created.id, coverFile.value)
      }
    }
    emit('saved')
  } catch (error) {
    await showErrorDialog(error)
  }
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="modal-backdrop" @click.self="emit('close')">
      <section class="modal-panel modal-panel--wide" role="dialog" aria-modal="true" aria-labelledby="auction-form-title">
        <header class="modal-header">
          <div><span class="eyebrow">BIDLY MARKETPLACE</span><h2 id="auction-form-title">{{ isEditing ? 'Perbarui lelang' : 'Mulai lelang baru' }}</h2></div>
          <button class="icon-button" type="button" aria-label="Tutup" @click="emit('close')"><X :size="19" /></button>
        </header>
        <form class="modal-form" @submit.prevent="submit">
          <label class="field-label">Nama barang
            <input v-model="title" class="form-control" maxlength="100" placeholder="Contoh: Kamera analog Canon AE-1" required />
          </label>
          <label class="field-label">Deskripsi barang</label>
          <MarkdownEditor v-model="description" />
          <div class="form-grid">
            <label class="field-label">Harga pembuka (Rupiah)
              <input v-model="startBid" class="form-control" type="number" min="1000" step="1000" placeholder="250000" required />
              <small v-if="startBid" class="field-hint">{{ formatRupiah(startBid) }}</small>
            </label>
            <label class="field-label">Lelang berakhir
              <input v-model="closedAt" class="form-control" type="datetime-local" required />
            </label>
          </div>
          <label class="field-label">Foto sampul <span class="optional-label">opsional</span>
            <span class="upload-zone">
              <img v-if="coverPreview" :src="coverPreview" alt="Pratinjau sampul" class="upload-preview" />
              <ImagePlus v-else :size="22" />
              <span>{{ coverFile?.name || 'Pilih gambar untuk sampul' }}</span>
              <input type="file" accept="image/*" @change="selectCover" />
            </span>
          </label>
          <footer class="modal-actions">
            <button class="button button--secondary" type="button" @click="emit('close')">Batal</button>
            <button class="button button--primary" type="submit" :disabled="auctions.isSaving">
              <LoaderCircle v-if="auctions.isSaving" class="spin" :size="17" />
              {{ auctions.isSaving ? 'Menyimpan...' : isEditing ? 'Simpan perubahan' : 'Terbitkan lelang' }}
            </button>
          </footer>
        </form>
      </section>
    </div>
  </Teleport>
</template>
