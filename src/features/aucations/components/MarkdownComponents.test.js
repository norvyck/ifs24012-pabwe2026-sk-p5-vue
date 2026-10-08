import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import MarkdownEditor from './MarkdownEditor.vue'
import MarkdownViewer from './MarkdownViewer.vue'

const editorMock = vi.hoisted(() => ({
  on: vi.fn(),
  getMarkdown: vi.fn(),
  setMarkdown: vi.fn(),
  destroy: vi.fn(),
  factory: vi.fn(),
}))

vi.mock('@toast-ui/editor', () => ({
  default: Object.assign(vi.fn(function () { return editorMock }), {
    factory: editorMock.factory,
  }),
}))

describe('Markdown components', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    editorMock.factory.mockReturnValue(editorMock)
    editorMock.getMarkdown.mockReturnValue('**updated**')
  })

  afterEach(() => vi.restoreAllMocks())

  it('creates the editor with the initial content and emits Markdown changes', async () => {
    const page = mount(MarkdownEditor, { props: { modelValue: '# Draft' } })
    await flushPromises()

    expect(editorMock.on).toHaveBeenCalledWith('change', expect.any(Function))
    const onChange = editorMock.on.mock.calls[0][1]
    onChange()
    expect(page.emitted('update:modelValue')).toEqual([['**updated**']])

    await page.setProps({ modelValue: '**external**' })
    expect(editorMock.setMarkdown).toHaveBeenCalledWith('**external**')
    await page.setProps({ modelValue: '**updated**' })
    expect(editorMock.setMarkdown).toHaveBeenCalledTimes(1)
    page.unmount()
    expect(editorMock.destroy).toHaveBeenCalledOnce()
  })

  it('creates and updates the Markdown viewer and uses a fallback for empty content', async () => {
    const page = mount(MarkdownViewer, { props: { content: '' } })
    expect(editorMock.factory).toHaveBeenCalledWith(expect.objectContaining({
      viewer: true,
      initialValue: 'Belum ada deskripsi untuk barang ini.',
      usageStatistics: false,
    }))

    await page.setProps({ content: 'Barang langka' })
    expect(editorMock.setMarkdown).toHaveBeenCalledWith('Barang langka')
    await page.setProps({ content: '' })
    expect(editorMock.setMarkdown).toHaveBeenLastCalledWith('')
    page.unmount()
    expect(editorMock.destroy).toHaveBeenCalledOnce()
  })
})
