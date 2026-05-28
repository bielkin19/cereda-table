import { createRequire } from 'node:module';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

const require = createRequire(import.meta.url);
const { version } = require('./package.json') as { version: string };

export default defineConfig({
  define: {
    __CEREDA_TABLE_VERSION__: JSON.stringify(version),
  },
  plugins: [
    react(),
    dts({
      include: ['src/shared/data-table'],
      tsconfigPath: './tsconfig.build.json',
      rollupTypes: true,
    }),
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/shared/data-table/index.ts'),
        locales: resolve(__dirname, 'src/shared/data-table/locales/index.ts'),
      },
      formats: ['es'],
      fileName: (_format, entryName) => `${entryName}.js`,
      cssFileName: 'style',
    },
    rollupOptions: {
      external: [
        'react',
        'react/jsx-runtime',
        'react-dom',
        '@tanstack/react-table',
        '@tanstack/react-virtual',
        '@dnd-kit/core',
        '@dnd-kit/sortable',
        '@dnd-kit/utilities',
        'lucide-react',
        '@radix-ui/react-checkbox',
        '@radix-ui/react-popover',
        '@radix-ui/react-scroll-area',
        '@radix-ui/react-select',
        'tslib',
      ],
    },
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
  },
});
