import { computed, ref } from 'vue'

export function useInput(initialValue = '') {
  const value = ref(initialValue)
  const binding = computed({
    get: () => value.value,
    set: (nextValue) => {
      value.value = nextValue
    },
  })

  function reset(nextValue = '') {
    value.value = nextValue
  }

  return { value, binding, reset }
}
