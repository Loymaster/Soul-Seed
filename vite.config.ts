import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import atelier from './outils/atelier/plugin.mjs';

export default defineConfig({
  plugins: [react(), atelier()],
  resolve: { alias: { '@': resolve(__dirname, 'src'), '@contenu': resolve(__dirname, 'contenu') } },
  build: {
    // « assets » est réservé aux images et sons du jeu (public/assets)
    assetsDir: 'build',
    rollupOptions: { input: { jeu: resolve(__dirname, 'index.html') } }
  },
  server: { port: 5173, watch: { ignored: ['**/contenu/generes/.cache-assets.json', '**/prototype-v0/**'] } }
});
