export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ['@pinia/nuxt'],
  build: {
    extend(config, { isServer }) {
      if (isServer) {
        config.externals = {
          fs: 'commonjs fs',
        }
      }
    },
    vite: {
      optimizeDeps: {
        exclude: ['fs']
      },
      rollupOptions: {
        external: ['fs']
      }
    }
  }
})
