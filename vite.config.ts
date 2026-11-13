import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// base './' keeps asset paths relative, so the build works on Vercel,
// GitHub Pages (any repo name) and when opened from a sub-folder.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  build: {
    // INLINE_ASSETS=1 embeds fonts in the CSS (used for sandboxed previews)
    assetsInlineLimit: process.env.INLINE_ASSETS ? 1_000_000 : 4096,
    chunkSizeWarningLimit: 1500,
  },
});
