import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on mode
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@scholar-ai/shared": path.resolve(__dirname, "../../packages/shared/src"),
      },
    },
    server: {
      port: 3000,
    },
    define: {
      __APP_ENV__: JSON.stringify(env.VITE_ENV || mode),
    },
  }
}) 