const { defineConfig } = require('vite');
const react = require('@vitejs/plugin-react');

// Production build config: ignores minor ESLint / TypeScript warnings
// Equivalent to eslint: { ignoreDuringBuilds: true }, typescript: { ignoreBuildErrors: true }
module.exports = defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  },
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  },
  build: {
    chunkSizeWarningLimit: 5000,
    rollupOptions: {
      onwarn(warning, warn) {
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE' || warning.code === 'EVAL') return;
        warn(warning);
      },
      output: {
        entryFileNames: 'assets/index.js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]'
      }
    }
  }
});
