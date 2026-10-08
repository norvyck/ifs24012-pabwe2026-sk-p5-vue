import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [vue(), tailwindcss()],
    server: { port: Number(env.APP_PORT) || 3000 },
    preview: { port: Number(env.APP_PORT) || 3000 },
    define: {
      DELCOM_BASEURL: JSON.stringify(
        env.VITE_DELCOM_BASEURL || 'https://open-api.delcom.org/api/v1',
      ),
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/setupTests.js',
      exclude: ['**/node_modules/**', '**/dist/**', '**/*.integration.test.js'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html', 'lcov'],
        include: [
          'src/helpers/*.js',
          'src/hooks/*.js',
          'src/features/**/api/*.js',
          'src/features/**/states/*.js',
        ],
        exclude: ['**/*.test.js', '**/*.integration.test.js'],
        thresholds: { lines: 100, functions: 100, branches: 100, statements: 100 },
      },
    },
  }
})
