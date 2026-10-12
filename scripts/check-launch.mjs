import {spawn} from 'node:child_process';
for(const mode of ['development','production']){
  const port=mode==='development'?4191:4192;
  const child=spawn(process.execPath,['server/index.js',...(mode==='production'?['--production']:[])],{env:{...process.env,PORT:String(port)},stdio:'pipe'});
  let output='';child.stdout.on('data',x=>output+=x);child.stderr.on('data',x=>output+=x);
  try{
    let response;for(let i=0;i<80;i++){try{response=await fetch(`http://127.0.0.1:${port}`);if(response.ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
    if(!response?.ok||!(await response.text()).includes('root'))throw Error(`${mode} launch failed: ${output}`);
    const config=await fetch(`http://127.0.0.1:${port}/demo/config`);if(!config.ok)throw Error('Configuration endpoint unavailable');
    console.log(`${mode}: loopback application and configuration available; no upstream API or SMTP call`);
  }finally{child.kill();await new Promise(r=>child.once('exit',r));}
}
