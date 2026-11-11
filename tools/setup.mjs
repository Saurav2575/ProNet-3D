import { spawnSync } from 'node:child_process';
import { existsSync, copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
for(const part of ['backend','frontend']){
  const child=spawnSync(process.platform==='win32'?'npm.cmd':'npm',['ci','--no-audit','--no-fund'],{cwd:path.join(root,part),stdio:'inherit',shell:process.platform==='win32'});
  if(child.status!==0) process.exit(child.status||1);
}
const env=path.join(root,'backend','.env');
if(!existsSync(env)){
  copyFileSync(path.join(root,'backend','.env.example'),env);
  writeFileSync(env,readFileSync(env,'utf8').replace('replace_with_a_random_secret_of_at_least_32_characters',randomBytes(48).toString('hex')));
}
console.log('Setup complete. Start MongoDB (and optionally Redis), then run npm run dev.');
