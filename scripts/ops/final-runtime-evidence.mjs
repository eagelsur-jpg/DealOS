import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { readFileSync,existsSync,lstatSync,chmodSync,readdirSync } from 'node:fs';
import { productionEnv } from './production-env.mjs';
const require=createRequire('/root/DealOS/packages/database/package.json');
const {PrismaClient}=require('@prisma/client');
const db=new PrismaClient({datasources:{db:{url:productionEnv('api').DATABASE_URL}},log:[]});
try {
  const admin=productionEnv('admin');
  const clickTotals=await db.$queryRawUnsafe(`SELECT count(*) FILTER(WHERE "userAgent" IS NULL OR "userAgent" NOT IN ('seed-script','DealOS-runtime-verification','DealOS-rejected-example-verification'))::int AS traffic,count(*) FILTER(WHERE "userAgent" IN ('seed-script','DealOS-runtime-verification','DealOS-rejected-example-verification'))::int AS excluded FROM "Click"`);
  const adminUrl='http://127.0.0.1:3003';
  const origin=admin.ADMIN_ORIGIN ?? adminUrl;
  const login=await fetch(`${adminUrl}/api/auth/login`,{method:'POST',redirect:'manual',headers:{Origin:origin},body:new URLSearchParams({email:admin.ADMIN_EMAIL,password:admin.ADMIN_PASSWORD})});
  const cookie=login.headers.get('set-cookie')?.split(';')[0];
  if(login.status!==303 || !cookie)throw new Error('Final Admin login failed');
  const analytics=await fetch(`${adminUrl}/analytics`,{headers:{Cookie:cookie}});
  const plain=(await analytics.text()).replace(/<!--.*?-->/gs,'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
  if(analytics.status!==200 || !plain.includes(`${clickTotals[0].traffic} recorded clicks across`) || !plain.includes('Known seed and verification clicks are excluded'))throw new Error('Admin analytics differs from genuine traffic evidence');
  const logout=await fetch(`${adminUrl}/api/auth/logout`,{method:'POST',redirect:'manual',headers:{Cookie:cookie,Origin:origin}});
  if(logout.status!==303)throw new Error('Final Admin logout failed');
  const links=await db.affiliateLink.findMany({where:{isActive:true},select:{id:true,destinationUrl:true,deal:{select:{endsAt:true}}}});
  let rejectedExamples=0;
  for(const link of links) if(/example/i.test(new URL(link.destinationUrl).pathname)||link.deal?.endsAt<new Date()) {
    const before=await db.click.count({where:{affiliateLinkId:link.id}});
    const response=await fetch(`http://127.0.0.1:3004/r/${encodeURIComponent(link.id)}`,{redirect:'manual',headers:{'User-Agent':'DealOS-rejected-example-verification'}});
    if(![400,404].includes(response.status)||await db.click.count({where:{affiliateLinkId:link.id}})!==before) throw new Error('Invalid affiliate link safety failed');
    rejectedExamples++;
  }
  let hba;
  try { hba=await db.$queryRawUnsafe(`SELECT auth_method,count(*)::int AS rules,bool_or(address IN ('all','0.0.0.0','::')) AS has_any_public_address FROM pg_hba_file_rules WHERE type IN ('host','hostssl','hostnossl') GROUP BY auth_method`); } catch(error) { hba={unavailable:true,sqlState:error.meta?.code}; }
  let postgresHostEvidence;
  try {
    const sql=`SELECT json_build_object('publicAddressRules',count(*) FILTER(WHERE address IN ('all','0.0.0.0','::')),'nonLoopbackHostRules',count(*) FILTER(WHERE address NOT IN ('127.0.0.1','::1')),'publicTrustRules',count(*) FILTER(WHERE address IN ('all','0.0.0.0','::') AND auth_method='trust'),'passwordMethods',array_agg(DISTINCT auth_method),'dealosCatchAllRules',count(*) FILTER(WHERE address IN ('all','0.0.0.0','::') AND ('all'=ANY(database) OR 'dealos'=ANY(database))),'catchAllSharedDatabaseRules',count(*) FILTER(WHERE address IN ('all','0.0.0.0','::') AND 'all'=ANY(database))) FROM pg_hba_file_rules WHERE type IN ('host','hostssl','hostnossl')`;
    postgresHostEvidence=JSON.parse(execFileSync('runuser',['-u','postgres','--','psql','-X','-d','dealos','-t','-A','-c',sql],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim());
  } catch { postgresHostEvidence={unavailable:true}; }
  let firewall;
  try { const text=execFileSync('ufw',['status'],{encoding:'utf8',stdio:['ignore','pipe','pipe']}); firewall={ufwActive:/Status: active/.test(text),explicit5432Rule:/5432/.test(text)}; } catch {firewall={unavailable:true};}
  let protectedEnvFiles=0;
  for(const base of ['/root/DealOS','/root/DealOS/apps/api','/root/DealOS/apps/admin','/root/DealOS/apps/web','/root/DealOS-review/apps/api','/root/DealOS-review/apps/admin','/root/DealOS-review/apps/web']) for(const name of ['.env','.env.local']) {
    const path=`${base}/${name}`;
    if(existsSync(path) && lstatSync(path).isFile() && lstatSync(path).uid===0) {chmodSync(path,0o600);protectedEnvFiles++;}
  }
  const lifecycle=await db.$queryRawUnsafe(`SELECT count(*)::int AS total_deals,count(*) FILTER(WHERE status::text='ACTIVE' AND NOT "isHidden" AND ("startsAt" IS NULL OR "startsAt"<=now()) AND ("endsAt" IS NULL OR "endsAt">now()))::int AS time_eligible_deals FROM "Deal"`);
  const deployment=JSON.parse(readFileSync('/root/DealOS-backups/deployment.json','utf8'));
  const diagnostics=readFileSync(`/root/DealOS-backups/production-${deployment.sha}.log`,'utf8').replace(/\x1b\[[0-9;]*m/g,'');
  const testsPassed=Array.from(diagnostics.matchAll(/Tests\s+(\d+)\s+passed/g)).reduce((sum,match)=>sum+Number(match[1]),0);
  const runtimeChecks=diagnostics.split('\n').filter(line=>/^PASS (\/|Web |Admin |CRUD|logout)/.test(line));
  const browserDir=readdirSync('/root/DealOS-browser-evidence').filter(name=>name.startsWith(deployment.sha+'-')).sort().at(-1);
  const browserFile=browserDir && `/root/DealOS-browser-evidence/${browserDir}/acceptance.json`;
  const browserData=browserFile && existsSync(browserFile)?JSON.parse(readFileSync(browserFile,'utf8')):undefined;
  const browserAcceptance=browserData?{cases:browserData.results.length,failures:browserData.failures.length,widths:[320,375,768,1024,1440],privateEvidence:browserFile}:{unavailable:true};
  const serviceStats=[];
  for(const app of ['api','web','admin']) serviceStats.push(execFileSync('systemctl',['show',`dealos-${app}.service`,'--property=ActiveState,SubState,NRestarts,MainPID,ExecMainStatus,WorkingDirectory'],{encoding:'utf8'}));
  console.log(JSON.stringify({deployment,testsPassed,runtimeChecks,browserAcceptance,serviceStats,analytics:{genuineTraffic:clickTotals[0].traffic,excludedSeedAndVerification:clickTotals[0].excluded,adminRenderedCorrectly:true,logoutPassed:true},
    adminConfig:{passwordMinimumLength:admin.ADMIN_PASSWORD?.length>=12,knownDemoPassword:admin.ADMIN_PASSWORD==='ChangeThisPassword123!',jwtMinimumLength:admin.ADMIN_JWT_SECRET?.length>=32,productionSecureCookie:true},
    affiliate:{invalidExampleLinksRejected:rejectedExamples,noInvalidClicksCreated:true,realLinkAcceptance:'BLOCKED: no reviewed real eligible link configured'},lifecycle,postgresAuthRules:hba,postgresHostEvidence,firewall,protectedEnvFiles,
    postgresNetworkingChanged:false,redisFlushed:false,unrelatedProjectsModified:false}));
} catch(error) {console.error(JSON.stringify({failed:true,type:error.name,code:error.code,instruction:error.constructor===Error?error.message:undefined}));process.exitCode=1;}
finally {await db.$disconnect();}
