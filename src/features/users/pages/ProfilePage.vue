<script setup>
import { computed, onMounted, ref } from 'vue'
import { Camera, Check, LoaderCircle, LockKeyhole, Mail, Save, UserRound } from 'lucide-vue-next'
import { useUsersStore } from '../states/usersStore'
import { useAuthStore } from '../../auth/states/authStore'
import { resolveAssetUrl, showErrorDialog, showSuccessDialog } from '../../../helpers/toolsHelper'

const users = useUsersStore()
const auth = useAuthStore()
const name = ref('')
const email = ref('')
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const error = ref('')
const initials = computed(() => (users.profile?.name || auth.user?.name || 'B').split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase())

async function loadProfile() {
  error.value = ''
  try {
    const profile = await users.fetchProfile()
    name.value = profile.name || ''
    email.value = profile.email || ''
    auth.updateUser(profile)
  } catch (requestError) {
    error.value = requestError.message
    name.value = auth.user?.name || ''
    email.value = auth.user?.email || ''
  }
}

onMounted(loadProfile)

async function saveProfile() {
  if (!name.value.trim() || !email.value.trim()) {
    await showErrorDialog('Nama dan email tidak boleh kosong.')
    return
  }
  try {
    const profile = await users.updateProfile({ name: name.value.trim(), email: email.value.trim() })
    auth.updateUser({ ...auth.user, ...profile, name: name.value.trim(), email: email.value.trim() })
    await showSuccessDialog('Profil berhasil diperbarui.')
  } catch (requestError) {
    await showErrorDialog(requestError)
  }
}

async function updatePhoto(event) {
  const file = event.target.files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    await showErrorDialog('Pilih file gambar yang valid.')
    event.target.value = ''
    return
  }
  try {
    const profile = await users.updatePhoto(file)
    auth.updateUser({ ...auth.user, ...profile })
    await showSuccessDialog('Foto profil berhasil diperbarui.')
  } catch (requestError) {
    await showErrorDialog(requestError)
  }
}

async function savePassword() {
  if (newPassword.value.length < 6 || newPassword.value !== confirmPassword.value) {
    await showErrorDialog('Kata sandi baru minimal 6 karakter dan konfirmasinya harus cocok.')
    return
  }
  try {
    await users.changePassword({
      password: currentPassword.value,
      new_password: newPassword.value,
      new_password_confirmation: confirmPassword.value,
    })
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
    await showSuccessDialog('Kata sandi berhasil diperbarui.')
  } catch (requestError) {
    await showErrorDialog(requestError)
  }
}
</script>

<template>
  <section class="profile-page">
    <div class="page-intro page-intro--profile"><span class="eyebrow"><UserRound :size="14" /> RUANG PERSONAL</span><h1>Profil <em>kamu.</em></h1><p>Atur informasi akun dan pastikan semuanya tetap terkini.</p></div>
    <div class="profile-layout">
      <aside class="profile-card">
        <div class="profile-card__banner"><span>MEMBER<br />BIDLY</span></div>
        <div class="profile-card__identity">
          <div class="profile-avatar">
            <img v-if="users.profile?.photo" :src="resolveAssetUrl(users.profile.photo)" :alt="name" />
            <span v-else>{{ initials }}</span>
            <label class="profile-avatar__upload" title="Ubah foto"><Camera :size="15" /><input type="file" accept="image/*" aria-label="Unggah foto profil" @change="updatePhoto" /></label>
          </div>
          <strong>{{ users.profile?.name || auth.user?.name || 'Akun Bidly' }}</strong>
          <span>{{ users.profile?.email || auth.user?.email }}</span>
          <small><Check :size="13" /> Anggota komunitas</small>
        </div>
        <div class="profile-card__meta"><span>AKUN TERDAFTAR</span><strong>{{ users.profile?.created_at ? new Date(users.profile.created_at).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) : 'Bidly member' }}</strong></div>
      </aside>
      <div class="profile-forms">
        <form class="settings-card" @submit.prevent="saveProfile">
          <header><div><span class="eyebrow">INFORMASI DASAR</span><h2>Detail akun</h2></div><UserRound :size="18" /></header>
          <label class="field-label">Nama lengkap<span class="input-with-icon"><UserRound :size="16" /><input v-model="name" autocomplete="name" required /></span></label>
          <label class="field-label">Alamat email<span class="input-with-icon"><Mail :size="16" /><input v-model="email" type="email" autocomplete="email" required /></span></label>
          <p v-if="error" class="field-hint">Informasi profil saat ini berasal dari sesi akun.</p>
          <button class="button button--primary" type="submit" :disabled="users.isSaving"><LoaderCircle v-if="users.isSaving" class="spin" :size="16" /><Save v-else :size="16" /> Simpan profil</button>
        </form>
        <form class="settings-card" @submit.prevent="savePassword">
          <header><div><span class="eyebrow">KEAMANAN AKUN</span><h2>Perbarui kata sandi</h2></div><LockKeyhole :size="18" /></header>
          <label class="field-label">Kata sandi saat ini<input v-model="currentPassword" class="form-control" type="password" autocomplete="current-password" required /></label>
          <div class="form-grid">
            <label class="field-label">Kata sandi baru<input v-model="newPassword" class="form-control" type="password" autocomplete="new-password" minlength="6" required /></label>
            <label class="field-label">Ulangi kata sandi baru<input v-model="confirmPassword" class="form-control" type="password" autocomplete="new-password" minlength="6" required /></label>
          </div>
          <button class="button button--secondary" type="submit">Ubah kata sandi <LockKeyhole :size="15" /></button>
        </form>
      </div>
    </div>
  </section>
</template>
