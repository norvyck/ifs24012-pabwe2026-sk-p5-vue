import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import process from 'node:process'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [vue(), tailwindcss()],
    define: {
      DELCOM_BASEURL: JSON.stringify(
        env.VITE_DELCOM_BASEURL || 'https://open-api.delcom.org/api/v1',
      ),
      'import.meta.env.DELCOM_TEST_EMAIL': JSON.stringify(env.DELCOM_TEST_EMAIL || ''),
      'import.meta.env.DELCOM_TEST_PASSWORD': JSON.stringify(env.DELCOM_TEST_PASSWORD || ''),
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/setupTests.js',
      include: ['src/**/*.integration.test.js'],
      testTimeout: 20_000,
    },
  }
})
