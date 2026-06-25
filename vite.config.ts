import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => ({
  server: {
    host: "localhost",
    port: 3000,
    historyApiFallback: {
      index: "/index.html",
    },
  },
  plugins: [
    react(),
    {
      name: 'performance-monitor',
      generateBundle(options, bundle) {
        console.log('📊 Bundle Analysis:');
        let totalSize = 0;
        Object.entries(bundle).forEach(([fileName, chunk]) => {
          if (chunk.type === 'chunk') {
            const sizeKB = (chunk.code.length / 1024).toFixed(2);
            totalSize += chunk.code.length;
            console.log(`  ${fileName}: ${sizeKB} KB`);
          }
        });
        const totalSizeKB = (totalSize / 1024).toFixed(2);
        const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2);
        console.log(`  Total: ${totalSizeKB} KB (${totalSizeMB} MB)`);

        // Performance warnings
        Object.entries(bundle).forEach(([fileName, chunk]) => {
          if (chunk.type === 'chunk' && chunk.code.length > 500000) { // 500KB warning
            console.warn(`⚠️  Large chunk detected: ${fileName} (${(chunk.code.length / 1024).toFixed(2)} KB)`);
          }
        });
      }
    }
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            if (id.includes('react-router')) {
              return 'router';
            }
            if (id.includes('@radix-ui')) {
              return 'radix-ui';
            }
            if (id.includes('lucide')) {
              return 'icons';
            }
            if (id.includes('supabase')) {
              return 'supabase';
            }
            if (id.includes('date-fns')) {
              return 'date-utils';
            }
            return 'vendor';
          }

          // App chunks
          if (id.includes('src/pages/')) {
            return 'pages';
          }
          if (id.includes('src/components/')) {
            return 'components';
          }
          if (id.includes('src/hooks/')) {
            return 'hooks';
          }
          if (id.includes('src/lib/')) {
            return 'utils';
          }
        },
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop()?.replace(/\.[^.]*$/, '') : 'chunk';
          return `js/[name]-[hash].js`;
        },
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const name = assetInfo.name || '';
          const info = name.split('.');
          const ext = info[info.length - 1] || '';
          if (/\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/i.test(name)) {
            return `media/[name]-[hash].[ext]`;
          }
          if (/\.(png|jpe?g|gif|svg|ico|webp)(\?.*)?$/i.test(name)) {
            return `images/[name]-[hash].[ext]`;
          }
          if (/\.(woff2?|eot|ttf|otf)(\?.*)?$/i.test(name)) {
            return `fonts/[name]-[hash].[ext]`;
          }
          return `assets/[name]-[hash].[ext]`;
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    minify: 'esbuild' as const,
    sourcemap: mode === 'development',
    target: 'esnext',
    cssMinify: true,
    cssCodeSplit: true,
    // Additional optimizations
    modulePreload: {
      polyfill: true,
    },
    // Compression
    reportCompressedSize: true,
    // Dynamic imports optimization
    dynamicImportVars: true,
    // Tree shaking
    treeShake: true,
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@radix-ui/react-slot',
      'lucide-react',
      'date-fns',
      'clsx',
      'tailwind-merge',
      'class-variance-authority'
    ],
    exclude: [
      '@supabase/supabase-js'
    ]
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || mode),
    // Polyfill for Amazon Cognito Identity JS
    global: 'globalThis',
    // Remove console.log in production
    ...(mode === 'production' && {
      'console.log': 'undefined',
      'console.warn': 'undefined',
      'console.error': 'undefined'
    })
  },
  // Experimental features for better performance
  experimental: {
    renderBuiltUrl(filename, { hostType }) {
      if (hostType === 'js') {
        return { js: `/${filename}` };
      } else {
        return { relative: true };
      }
    },
  },
}));
