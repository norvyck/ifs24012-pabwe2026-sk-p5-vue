<template>
  <main class="auth-shell">
    <section class="auth-story">
      <RouterLink class="brand brand--light" :to="{ name: 'login' }">
        <span class="brand-mark"><Gavel :size="19" :stroke-width="2.6" /></span>
        <span>bidly<span class="brand-period">.</span></span>
      </RouterLink>
      <div class="auth-story__copy">
        <span class="auth-kicker"><Sparkles :size="15" /> LELANG DENGAN CERITA</span>
        <h2>Temukan sesuatu yang <em>istimewa.</em></h2>
        <p>Barang yang tepat selalu punya cerita. Temukan milikmu, dan berikan tawaran terbaik.</p>
        <div class="auth-story__stats">
          <div><strong>01</strong><span>Temukan barang favorit</span></div>
          <div><strong>02</strong><span>Ajukan tawaran terbaik</span></div>
          <div><strong>03</strong><span>Jadikan milikmu</span></div>
        </div>
      </div>
      <div class="auth-story__footer"><span>© 2026 Bidly Marketplace</span><span>Dibuat untuk para penemu.</span></div>
      <div class="auth-art auth-art--one" /><div class="auth-art auth-art--two" />
    </section>
    <section class="auth-form-area">
      <div class="auth-form-area__inner"><RouterView /></div>
      <div class="auth-mobile-brand">BIDLY MARKETPLACE · LELANG DENGAN CERITA</div>
    </section>
  </main>
</template>

<script setup>
import { Gavel, Sparkles } from 'lucide-vue-next'
</script>
