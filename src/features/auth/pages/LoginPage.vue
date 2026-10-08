<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight, Eye, EyeOff, Gavel, LoaderCircle, LockKeyhole, Mail } from 'lucide-vue-next'
import { useAuthStore } from '../states/authStore'
import { showErrorDialog, showSuccessDialog } from '../../../helpers/toolsHelper'

const router = useRouter()
const auth = useAuthStore()
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const error = ref('')

async function submit() {
  error.value = ''
  if (!email.value.trim() || !password.value) {
    error.value = 'Masukkan email dan kata sandi kamu.'
    return
  }
  try {
    await auth.login({ email: email.value.trim(), password: password.value })
    await showSuccessDialog('Selamat datang di Bidly!')
    await router.replace({ name: 'home' })
  } catch (requestError) {
    error.value = requestError.message
    await showErrorDialog(requestError, 'Gagal masuk')
  }
}
</script>

<template>
  <div class="auth-card">
    <div class="auth-card__icon"><Gavel :size="21" /></div>
    <span class="eyebrow">SENANG MELIHATMU KEMBALI</span>
    <h2>Masuk ke akunmu</h2>
    <p class="auth-card__subtitle">Lanjutkan berburu barang istimewa.</p>
    <form class="auth-fields" @submit.prevent="submit">
      <label class="field-label">Alamat email
        <span class="input-with-icon"><Mail :size="17" /><input id="login-email-input" v-model="email" type="email" autocomplete="email" placeholder="nama@email.com" required /></span>
      </label>
      <label class="field-label">Kata sandi
        <span class="input-with-icon"><LockKeyhole :size="17" /><input id="login-password-input" v-model="password" :type="showPassword ? 'text' : 'password'" autocomplete="current-password" placeholder="Masukkan kata sandi" required /><button type="button" :aria-label="showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'" @click="showPassword = !showPassword"><EyeOff v-if="showPassword" :size="17" /><Eye v-else :size="17" /></button></span>
      </label>
      <p v-if="error" class="form-error" role="alert">{{ error }}</p>
      <button id="login-submit-button" class="button button--primary button--full" type="submit" :disabled="auth.isLoading">
        <LoaderCircle v-if="auth.isLoading" class="spin" :size="18" />
        {{ auth.isLoading ? 'Sedang masuk...' : 'Masuk ke Bidly' }}
        <ArrowRight v-if="!auth.isLoading" :size="17" />
      </button>
    </form>
    <p class="auth-switch">Belum punya akun? <RouterLink :to="{ name: 'register' }">Daftar gratis <ArrowRight :size="14" /></RouterLink></p>
    <div class="auth-footnote"><span class="auth-footnote__dot" /> Akses komunitas lelang yang penuh inspirasi.</div>
  </div>
</template>
