import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// `npm run build` makes the normal site for Vercel.
// `npm run build:preview` makes one self-contained HTML file (in-memory routing) for sharing a quick preview.
export default defineConfig(({ mode }) => {
  const preview = mode === 'preview'
  return {
    plugins: [react(), tailwindcss(), ...(preview ? [viteSingleFile()] : [])],
    base: preview ? './' : '/',
    define: preview ? { 'import.meta.env.VITE_PREVIEW': JSON.stringify('1') } : {},
    build: preview ? { outDir: 'dist-preview', assetsInlineLimit: 100_000_000 } : {
      // Libraries in their own file: they change rarely, so returning visitors keep them cached between deploys.
      rollupOptions: { output: { manualChunks: (id: string) => (id.includes('node_modules') ? 'vendor' : undefined) } },
    },
  }
})
