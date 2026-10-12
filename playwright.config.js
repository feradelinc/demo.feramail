import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'tests/ui',fullyParallel:false,timeout:90000,use:{baseURL:'http://127.0.0.1:4180',headless:true},webServer:{command:'npm run dev',url:'http://127.0.0.1:4180',reuseExistingServer:false},reporter:'list'});
