import { defineConfig } from "vite";
import logseqDevPlugin from "vite-plugin-logseq";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [logseqDevPlugin(), react()],
  // Makes HMR available for development
  build: {
    target: "esnext",
    minify: "esbuild",
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('react') || id.includes('react-dom')) return 'vendor-react'
          if (id.includes('date-fns')) return 'vendor-date-fns'
          if (id.includes('date-holidays')) return 'vendor-date-holidays'
          if (id.includes('lunar-typescript')) return 'vendor-lunar'
          if (id.includes('sweetalert2')) return 'vendor-swal'
          if (id.includes('logseq-l10n')) return 'vendor-l10n'
          return 'vendor'
        }
      }
    }
  },
});
