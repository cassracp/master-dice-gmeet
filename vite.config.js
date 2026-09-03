import { defineConfig } from 'vite';
import { resolve } from 'path';
import fs from 'fs';

export default defineConfig({
  server: {
    host: true, // Escuta em 0.0.0.0 (rede local para acesso via celular)
    port: 5173
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'esnext',
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/standalone/index.html'),
        injetor: resolve(__dirname, 'src/content/injetor.js'),
        'service-worker': resolve(__dirname, 'src/background/service-worker.js')
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'injetor') {
            return 'content/injetor.js';
          }
          if (chunkInfo.name === 'service-worker') {
            return 'background/service-worker.js';
          }
          return 'assets/[name]-[hash].js';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  },
  plugins: [
    {
      name: 'copiar-arquivos-extensao',
      closeBundle() {
        if (fs.existsSync('src/manifest.json')) {
          fs.copyFileSync('src/manifest.json', 'dist/manifest.json');
        }
        if (fs.existsSync('src/assets')) {
          fs.cpSync('src/assets', 'dist/assets', { recursive: true });
        }
        if (fs.existsSync('dist/src/standalone') && !fs.existsSync('dist/standalone')) {
          fs.renameSync('dist/src/standalone', 'dist/standalone');
        }
      }
    }
  ]
});