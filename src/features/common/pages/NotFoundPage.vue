<script setup>
import { ArrowLeft, SearchX } from 'lucide-vue-next'
</script>

<template>
  <main class="not-found">
    <div class="not-found__icon"><SearchX :size="34" /></div>
    <span class="eyebrow">KESASAR DI MARKETPLACE?</span>
    <h1>Halaman ini tidak ditemukan.</h1>
    <p>Sepertinya alamat yang kamu tuju sudah berpindah atau tidak tersedia.</p>
    <RouterLink class="button button--primary" :to="{ name: 'home' }"><ArrowLeft :size="16" /> Kembali ke beranda</RouterLink>
  </main>
</template>
