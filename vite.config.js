import { defineConfig } from 'vite';
import { crx } from '@crxjs/vite-plugin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';

// Get directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import manifest
const manifest = JSON.parse(
  readFileSync(join(__dirname, 'manifest.json'), 'utf-8')
);

export default defineConfig({
  plugins: [crx({ manifest })],

  // Resolve aliases for cleaner imports
  resolve: {
    alias: {
      '@': resolve(__dirname, '.'),
      '@utils': resolve(__dirname, 'utils'),
      '@popup': resolve(__dirname, 'popup'),
      '@content': resolve(__dirname, 'content'),
      '@background': resolve(__dirname, 'background')
    }
  },

  // Build configuration
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: process.env.NODE_ENV === 'development',
    rollupOptions: {
      output: {
        // Ensure consistent chunk naming
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: '[name].js',
        assetFileNames: 'assets/[name]-[hash][extname]'
      }
    },
    // Target modern browsers (Chrome 88+ for MV3)
    target: 'es2020',
    minify: 'esbuild'
  },

  // Development server configuration
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5173
    }
  },

  // Optimize dependencies
  optimizeDeps: {
    include: []
  },

  // Define environment variables
  define: {
    'process.env.NODE_ENV': JSON.stringify(
      process.env.NODE_ENV || 'development'
    )
  }
});
