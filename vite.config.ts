import { createRequire } from 'node:module';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const require = createRequire(import.meta.url);
const { version } = require('./package.json') as { version: string };

// Dev server for the demo app — not used in the library build.
export default defineConfig({
  define: {
    __CEREDA_TABLE_VERSION__: JSON.stringify(version),
  },
  plugins: [react()],
});
