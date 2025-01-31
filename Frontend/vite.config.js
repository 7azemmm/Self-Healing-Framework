import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ["@chakra-ui/react"],
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/],
    },
  },
})
