import {fileURLToPath, URL} from 'node:url'
import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import {nodePolyfills} from 'vite-plugin-node-polyfills'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        vue(),
        nodePolyfills(),
        // basicSsl()
    ],

    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        }
    },
    build: {
        minify: 'terser',
        chunkSizeWarningLimit: 2000,
        brotliSize: false,
        rollupOptions: {
            output: {
                manualChunks: undefined,
            },
        },
    },
})
