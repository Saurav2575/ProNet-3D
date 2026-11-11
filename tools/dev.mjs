import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { existsSync } from 'node:fs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const required=['backend/node_modules/dotenv/package.json','frontend/node_modules/vite/package.json','backend/.env'];
if(required.some(file=>!existsSync(path.join(root,file)))){
  console.error('Setup is incomplete. From this project folder, run npm run setup (or open Setup-ProNet.cmd), then start MongoDB and try again.');
  process.exit(1);
}
const npm=process.platform==='win32'?'npm.cmd':'npm';
const children=['backend','frontend'].map(part=>spawn(npm,['run','dev'],{cwd:path.join(root,part),stdio:'inherit',shell:process.platform==='win32'}));
let stopping=false;
const stop=()=>{if(stopping)return;stopping=true;for(const child of children){if(process.platform==='win32')spawn('taskkill',['/pid',String(child.pid),'/T','/F']);else child.kill('SIGTERM');}};
for(const child of children){child.on('error',err=>{console.error(err.message);stop();process.exitCode=1;});child.on('exit',code=>{if(!stopping){stop();process.exitCode=code||0;}});}
process.on('SIGINT',stop);process.on('SIGTERM',stop);
