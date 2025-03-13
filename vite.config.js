import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    root: './frontend',
    base: './',
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        sourcemap: true,
        emptyOutDir: true,
        rollupOptions: {
            input: {
                main: './index.html',
                login: resolve(__dirname, 'frontend/login.html'),
                settings: './settings.html'
            }
        }
    },
    server: {
        port: 5173,
        strictPort: true,
        proxy: {
            '/api': {
                target: 'http://localhost:8080',
                changeOrigin: true,
                secure: false
            }
        }
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, './frontend/src')
        }
    }
}); 