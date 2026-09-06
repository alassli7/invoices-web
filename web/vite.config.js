import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // مسار نسبي حتى يعمل على أي استضافة (بما فيها GitHub Pages تحت مسار فرعي)
  base: "./",
  server: {
    host: true,
    port: 5173
  }
})
