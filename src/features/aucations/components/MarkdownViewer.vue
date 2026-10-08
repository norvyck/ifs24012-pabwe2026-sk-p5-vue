<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import Editor from '@toast-ui/editor'

const props = defineProps({ content: { type: String, default: '' } })
const viewerElement = ref(null)
let viewer

onMounted(() => {
  viewer = Editor.factory({
    el: viewerElement.value,
    viewer: true,
    initialValue: props.content || 'Belum ada deskripsi untuk barang ini.',
    usageStatistics: false,
  })
})

watch(() => props.content, (value) => viewer?.setMarkdown(value || ''))
onBeforeUnmount(() => viewer?.destroy())
</script>

<template>
  <div ref="viewerElement" class="markdown-viewer" />
</template>
