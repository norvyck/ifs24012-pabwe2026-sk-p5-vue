<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight, Eye, EyeOff, Gavel, LoaderCircle, LockKeyhole, Mail, UserRound } from 'lucide-vue-next'
import { useAuthStore } from '../states/authStore'
import { showErrorDialog, showSuccessDialog } from '../../../helpers/toolsHelper'

const router = useRouter()
const auth = useAuthStore()
const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const error = ref('')

async function submit() {
  error.value = ''
  if (password.value.length < 6) {
    error.value = 'Kata sandi minimal terdiri dari 6 karakter.'
    return
  }
  if (password.value !== confirmPassword.value) {
    error.value = 'Konfirmasi kata sandi belum cocok.'
    return
  }
  try {
    await auth.register({ name: name.value.trim(), email: email.value.trim(), password: password.value })
    await showSuccessDialog('Akun berhasil dibuat', 'Silakan masuk menggunakan akun barumu.')
    await router.replace({ name: 'login' })
  } catch (requestError) {
    error.value = requestError.message
    await showErrorDialog(requestError, 'Pendaftaran gagal')
  }
}
</script>

<template>
  <div class="auth-card auth-card--register">
    <div class="auth-card__icon"><Gavel :size="21" /></div>
    <span class="eyebrow">MULAI PERJALANANMU</span>
    <h1>Buat akun Bidly</h1>
    <p class="auth-card__subtitle">Satu akun untuk semua barang istimewa.</p>
    <form class="auth-fields" @submit.prevent="submit">
      <label class="field-label">Nama lengkap
        <span class="input-with-icon"><UserRound :size="17" /><input v-model="name" autocomplete="name" placeholder="Nama kamu" required /></span>
      </label>
      <label class="field-label">Alamat email
        <span class="input-with-icon"><Mail :size="17" /><input v-model="email" type="email" autocomplete="email" placeholder="nama@email.com" required /></span>
      </label>
      <label class="field-label">Kata sandi
        <span class="input-with-icon"><LockKeyhole :size="17" /><input v-model="password" :type="showPassword ? 'text' : 'password'" autocomplete="new-password" placeholder="Minimal 6 karakter" required /><button type="button" :aria-label="showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'" @click="showPassword = !showPassword"><EyeOff v-if="showPassword" :size="17" /><Eye v-else :size="17" /></button></span>
      </label>
      <label class="field-label">Ulangi kata sandi
        <span class="input-with-icon"><LockKeyhole :size="17" /><input v-model="confirmPassword" type="password" autocomplete="new-password" placeholder="Ulangi kata sandi" required /></span>
      </label>
      <p v-if="error" class="form-error" role="alert">{{ error }}</p>
      <button class="button button--primary button--full" type="submit" :disabled="auth.isLoading">
        <LoaderCircle v-if="auth.isLoading" class="spin" :size="18" />
        {{ auth.isLoading ? 'Membuat akun...' : 'Buat akun gratis' }}
        <ArrowRight v-if="!auth.isLoading" :size="17" />
      </button>
    </form>
    <p class="auth-switch">Sudah punya akun? <RouterLink :to="{ name: 'login' }">Masuk <ArrowRight :size="14" /></RouterLink></p>
  </div>
</template>
