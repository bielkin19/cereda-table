import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Dev server for the demo app — not used in the library build.
export default defineConfig({
  plugins: [react()],
});
