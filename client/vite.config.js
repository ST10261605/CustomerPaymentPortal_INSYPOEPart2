import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
   server: {
    https: {
      key: fs.readFileSync(path.resolve('../server/ssl/privatekey.pem')),
      cert: fs.readFileSync(path.resolve('../server/ssl/certificate.pem'))
    },
    port: 5173
  }
})
