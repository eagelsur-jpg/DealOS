import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync, readFileSync, readlinkSync, renameSync, symlinkSync } from 'node:fs';
import { resolve } from 'node:path';
import { productionEnv } from './production-env.mjs';
const assert = (ok, message) => { if (!ok) throw new Error(message); };
const sha = execFileSync('git', ['rev-parse','HEAD'], { encoding: 'utf8' }).trim();
const release = `/root/DealOS-releases/${sha}`;
const node = '/root/.nvm/versions/node/v22.23.2/bin/node';
const appEnvs = Object.fromEntries(['api','web','admin'].map(app => [app,productionEnv(app)]));
assert(appEnvs.api.ADMIN_JWT_SECRET === appEnvs.admin.ADMIN_JWT_SECRET, 'API/Admin signing configuration mismatch');
const buildEnv = { ...appEnvs.api, ...appEnvs.web, ...appEnvs.admin };
const privateLog = `/root/DealOS-backups/production-${sha}.log`;
const run = (program, args, cwd, env = buildEnv, timeout = 900000) => {
  const result = spawnSync(program, args, { cwd, env, encoding: 'utf8', timeout, maxBuffer: 40*1024*1024 });
  writeFileSync(privateLog, `${program} ${args.join(' ')}\n${result.stdout ?? ''}${result.stderr ?? ''}\n`, { flag:'a',mode:0o600 });
  assert(result.status === 0, `${program} failed; private diagnostic log retained`);
  console.log(`PASS ${args.join(' ')}`);
  return result.stdout;
};
const listeners = () => execFileSync('ss',['-lntpH'],{encoding:'utf8'}).split('\n').filter(line => /:(3002|3003|3004)\s/.test(line));
const ownedPids = () => {
  const pids = new Set();
  for (const line of listeners()) for (const match of line.matchAll(/pid=(\d+)/g)) {
    const pid = Number(match[1]); const cwd = readlinkSync(`/proc/${pid}/cwd`);
    assert(/^\/root\/DealOS-review\/apps\/(web|admin|api)$/.test(cwd) || /^\/root\/DealOS-releases\/[a-f0-9]{40}\/apps\/(web|admin|api)$/.test(cwd), 'Port owner outside DealOS: refusing restart');
    pids.add(pid);
  }
  return pids;
};
const switchCurrent = path => {
  const tmp = `/root/DealOS-current-${process.pid}`;
  symlinkSync(path, tmp); renameSync(tmp, '/root/DealOS-current');
};
let switched = false;
const previous = existsSync('/root/DealOS-current') ? readlinkSync('/root/DealOS-current') : '/root/DealOS-review';
try {
  assert(!existsSync(release), 'Release already exists: review evidence before redeploy');
  mkdirSync('/root/DealOS-backups',{recursive:true,mode:0o700});
  mkdirSync(release,{recursive:true,mode:0o700});
  const archive = `/root/DealOS-backups/source-${sha}.tar`;
  run('git',['archive','--format=tar','--output',archive,'HEAD'],process.cwd());
  run('tar',['-xf',archive,'-C',release],process.cwd());
  run('pnpm',['install','--frozen-lockfile','--prod=false'],release);
  // Lifecycle UI fixes also require a complete live production acceptance cycle.
  // Every production cutover repeats all repository gates before stopping DealOS.
  for (const command of ['typecheck','lint','test','build']) run('pnpm',[command],release);
  // Validate again immediately before cutover; never terminate a shared process group.
  const pids = ownedPids();
  for (const app of ['api','web','admin']) {
    const unit = `[Unit]\nDescription=DealOS ${app} production\nAfter=network.target\n\n[Service]\nType=simple\nUser=root\nWorkingDirectory=/root/DealOS-current/apps/${app}\nExecStart=${node} ${release}/scripts/ops/start-service.mjs ${app}\nRestart=on-failure\nRestartSec=5\nTimeoutStopSec=30\nKillMode=control-group\nNoNewPrivileges=true\nPrivateTmp=true\nUMask=0077\n\n[Install]\nWantedBy=multi-user.target\n`;
    const path = `/etc/systemd/system/dealos-${app}.service`;
    if (existsSync(path)) writeFileSync(`/root/DealOS-backups/dealos-${app}-${sha}.service`,readFileSync(path),{mode:0o600});
    writeFileSync(path,unit,{mode:0o644});
  }
  run('systemctl',['daemon-reload'],release);
  if (!existsSync('/root/DealOS-current')) switchCurrent(previous);
  switched = true; // Any subsequent failure restores the previous release under systemd.
  for (const app of ['api','web','admin']) {
    if (spawnSync('systemctl',['is-active','--quiet',`dealos-${app}.service`]).status === 0)
      run('systemctl',['stop',`dealos-${app}.service`],release);
  }
  for (const pid of pids) { try { process.kill(pid,'SIGTERM'); } catch (error) { if(error.code !== 'ESRCH') throw error; } }
  for (let i=0; i<30 && listeners().length; i++) await new Promise(done=>setTimeout(done,1000));
  assert(listeners().length === 0,'DealOS ports not released; no forced kill');
  switchCurrent(release); switched = true;
  run('systemctl',['enable','--now','dealos-api.service','dealos-web.service','dealos-admin.service'],release);
  let ready = false;
  for(let i=0;i<45;i++) {
    try { const checks=await Promise.all(['http://127.0.0.1:3004/ready','http://127.0.0.1:3002/','http://127.0.0.1:3003/login'].map(url=>fetch(url,{signal:AbortSignal.timeout(2000)}))); ready=checks.every(r=>r.status===200); } catch {}
    if(ready) break; await new Promise(done=>setTimeout(done,1000));
  }
  assert(ready,'Production readiness failed');
  const verificationEnv={...buildEnv,VERIFY_CRUD:'true'};
  run('pnpm',['--filter','@dealos/api','exec','tsx','scripts/verify-live.ts'],release,verificationEnv);
  for(const app of ['api','web','admin']) run('systemctl',['is-active',`dealos-${app}.service`],release);
  writeFileSync('/root/DealOS-backups/deployment.json',JSON.stringify({sha,release,previous,services:['dealos-api','dealos-web','dealos-admin'],at:new Date().toISOString()},null,2),{mode:0o600});
  console.log(JSON.stringify({deploymentSha:sha,release,readiness:200,crud:'passed and verification rows archived',services:'active',unrelatedServicesModified:false}));
} catch(error) {
  console.error(JSON.stringify({failed:true,instruction:error.constructor===Error?error.message:undefined,code:error.code}));
  if(switched) {
    switchCurrent(previous);
    for(const app of ['api','web','admin']) spawnSync('systemctl',['restart',`dealos-${app}.service`]);
    console.error('DealOS current release reverted; verify previous readiness before retrying');
  }
  process.exitCode=1;
}
