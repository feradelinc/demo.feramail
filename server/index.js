import 'dotenv/config';
import express from 'express';
import {createApp} from './app.js';
if(process.env.DEMO_MODE&&process.env.DEMO_MODE!=='live')throw Error('Only live mode is supported; fixtures are test-only');
const app=createApp();let vite;
if(process.argv.includes('--production'))app.use(express.static('dist'));
else {vite=await(await import('vite')).createServer({server:{middlewareMode:true},appType:'spa'});app.use(vite.middlewares);}
const server=app.listen(Number(process.env.PORT||4180),'127.0.0.1',()=>console.log(`FeraEmail Developer Studio: http://127.0.0.1:${process.env.PORT||4180} (live upstreams; preview never sends)`));
for(const sig of ['SIGINT','SIGTERM'])process.on(sig,async()=>{app.locals.close();await vite?.close();server.close(()=>process.exit(0));});
