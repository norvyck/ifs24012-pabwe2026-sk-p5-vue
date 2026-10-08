<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import Editor from '@toast-ui/editor'
import '@toast-ui/editor/dist/toastui-editor.css'

const props = defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, default: 'Editor Markdown' },
})
const emit = defineEmits(['update:modelValue'])
const editorElement = ref(null)
let editor
let toolbarObserver

function labelEditorControls() {
  editorElement.value?.querySelectorAll('textarea').forEach((field) => {
    field.setAttribute('aria-label', props.label)
  })
  editorElement.value?.querySelectorAll('button.more').forEach((button) => {
    button.setAttribute('aria-label', 'Pilihan toolbar lainnya')
  })
}

onMounted(() => {
  editor = new Editor({
    el: editorElement.value,
    height: '220px',
    initialValue: props.modelValue,
    initialEditType: 'markdown',
    previewStyle: 'vertical',
    usageStatistics: false,
    toolbarItems: [
      ['heading', 'bold', 'italic'],
      ['hr', 'quote'],
      ['ul', 'ol', 'task'],
      ['link', 'image'],
      ['code', 'codeblock'],
    ],
  })
  toolbarObserver = new MutationObserver(labelEditorControls)
  toolbarObserver.observe(editorElement.value, { childList: true, subtree: true })
  labelEditorControls()
  editor.on('change', () => emit('update:modelValue', editor.getMarkdown()))
})

watch(() => props.modelValue, (value) => {
  if (editor && editor.getMarkdown() !== value) editor.setMarkdown(value || '')
})

onBeforeUnmount(() => {
  toolbarObserver?.disconnect()
  editor?.destroy()
})
</script>

<template>
  <div ref="editorElement" class="markdown-editor" />
</template>
