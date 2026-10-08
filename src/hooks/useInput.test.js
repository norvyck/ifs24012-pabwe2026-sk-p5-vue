import { effectScope } from 'vue'
import { describe, expect, it } from 'vitest'
import { useInput } from './useInput'

describe('useInput', () => {
  it('exposes reactive value and two-way binding', () => {
    const scope = effectScope()
    const input = scope.run(() => useInput('first'))
    expect(input.value.value).toBe('first')
    expect(input.binding.value).toBe('first')
    input.binding.value = 'second'
    expect(input.value.value).toBe('second')
    input.value.value = 'third'
    expect(input.binding.value).toBe('third')
    scope.stop()
  })

  it('supports empty defaults and reset values', () => {
    const scope = effectScope()
    const input = scope.run(() => useInput())
    expect(input.value.value).toBe('')
    input.reset('restored')
    expect(input.binding.value).toBe('restored')
    input.reset()
    expect(input.value.value).toBe('')
    scope.stop()
  })
})
