import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' → o build roda em qualquer subpasta ou direto do disco.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: { target: 'es2020', cssCodeSplit: false },
});
