import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const MOCK_API_URL =
  process.env.JENKINS_MOCK_URL ||
  'https://coding-agent-demo-mock-258509337164.us-central1.run.app'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/jenkins': {
        target: MOCK_API_URL,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/jenkins/, ''),
      },
    },
  },
})
