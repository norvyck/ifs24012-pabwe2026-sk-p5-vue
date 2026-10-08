<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import Editor from '@toast-ui/editor'
import '@toast-ui/editor/dist/toastui-editor.css'

const props = defineProps({ modelValue: { type: String, default: '' } })
const emit = defineEmits(['update:modelValue'])
const editorElement = ref(null)
let editor

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
  editor.on('change', () => emit('update:modelValue', editor.getMarkdown()))
})

watch(() => props.modelValue, (value) => {
  if (editor && editor.getMarkdown() !== value) editor.setMarkdown(value || '')
})

onBeforeUnmount(() => editor?.destroy())
</script>

<template>
  <div ref="editorElement" class="markdown-editor" />
</template>
