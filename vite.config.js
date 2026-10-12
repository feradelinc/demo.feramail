import {defineConfig} from 'vite';
export default defineConfig({server:{host:'127.0.0.1'},build:{outDir:'dist',rollupOptions:{output:{manualChunks:{react:['react','react-dom']}}}}});
