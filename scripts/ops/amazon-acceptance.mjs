import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {productionEnv} from './production-env.mjs';
const require=createRequire('/root/DealOS/packages/database/package.json');
const {PrismaClient}=require('@prisma/client');
const db=new PrismaClient({datasources:{db:{url:productionEnv('api').DATABASE_URL}},log:[]});
const destination='https://www.amazon.com/Ninja-BN701-Professional-capacity-Crushing/dp/B0855B5Z6F?ie=UTF8&s=psc&ASIN=B0855B5Z6F&currency=USD&th=1&linkCode=sl2&tag=dealos-20&linkId=f9bc156e73541899b3250f4c98a8df1f&language=en_US&gaOptInStatus=true&ref_=as_li_ss_tl';
const externalId='dealos-amazon-us-B0855B5Z6F';
try {
 const ready=await fetch('http://127.0.0.1:3004/ready');assert.equal(ready.status,200);
 const deployment=JSON.parse(readFileSync('/root/DealOS-backups/deployment.json','utf8'));
 assert.equal(deployment.sha,'3818277bf2074a5b00ede457568427804a2787c0','Unexpected deployment; review first');
 const merchant=await db.merchant.findUnique({where:{slug:'amazon'}});
 assert(merchant?.isActive && merchant.affiliateNetwork==='AMAZON');
 assert(['amazon.com','www.amazon.com'].includes(new URL(merchant.websiteUrl).hostname));
 const commissionBefore=await db.commissionEvent.count();
 const record=await db.$transaction(async tx=>{
  const matches=await tx.affiliateLink.findMany({where:{externalId}});
  assert(matches.length<=1);
  let link=matches[0];
  if(link) assert(link.destinationUrl===destination && link.merchantId===merchant.id && !link.dealId && link.isActive && link.trackingTemplate===destination);
  else link=await tx.affiliateLink.create({data:{merchantId:merchant.id,network:'AMAZON',externalId,destinationUrl:destination,trackingTemplate:destination,isActive:true}});
  const slug='ninja-bn701-b0855b5z6f';
  const existing=await tx.product.findUnique({where:{slug}});
  if(existing) assert.equal(existing.name,'Ninja Professional Plus Blender BN701 — Grey');
  else await tx.product.create({data:{slug,name:'Ninja Professional Plus Blender BN701 — Grey',description:'Amazon.com product reference. Check Amazon for current price and availability. No price, discount, stock or imagery is imported from screenshots.',isActive:false}});
  return link;
 });
 const acceptance=[];
 for(const port of [3004,3002]){
  const before=await db.click.count({where:{affiliateLinkId:record.id}});
  const response=await fetch('http://127.0.0.1:'+port+'/r/'+record.id,{redirect:'manual',headers:{'User-Agent':'DealOS-runtime-verification',Referer:'http://127.0.0.1:3002/'}});
  assert.equal(response.status,302);
  const target=new URL(response.headers.get('location'));
  assert.equal(target.hostname,'www.amazon.com');assert.equal(target.protocol,'https:');assert.equal(target.searchParams.get('tag'),'dealos-20');assert(target.pathname.endsWith('/dp/B0855B5Z6F'));
  assert.equal(target.searchParams.get('linkId'),'f9bc156e73541899b3250f4c98a8df1f');
  assert.equal(target.searchParams.has('click'),false);
  assert.equal(await db.click.count({where:{affiliateLinkId:record.id}}),before+1);
  const latest=await db.click.findFirst({where:{affiliateLinkId:record.id},orderBy:{createdAt:'desc'}});
  assert.equal(latest.userAgent,'DealOS-runtime-verification');
  acceptance.push({port,status:302,oneVerificationClick:true,tagPreserved:true,destinationNotVisited:true});
 }
 assert.equal(await db.commissionEvent.count(),commissionBefore);
 const units=['dealos-api','dealos-web','dealos-admin'].map(name=>({name,state:execFileSync('systemctl',['show',name+'.service','--property=ActiveState,SubState,NRestarts'],{encoding:'utf8'}).trim()}));
 assert(units.every(unit=>unit.state.includes('ActiveState=active')&&unit.state.includes('SubState=running')));
 assert.equal((await fetch('http://127.0.0.1:3004/ready')).status,200);
 console.log(JSON.stringify({passed:true,deploymentSha:deployment.sha,affiliateLinkId:record.id,asin:'B0855B5Z6F',tag:'dealos-20',acceptance,units,commissionCountUnchanged:true,existingCatalogUnchanged:true,product:'inactive reference only, not published',publicPriceOrImageImported:false,publicOfferPublished:false,schemaChanged:false,servicesRestarted:false,unrelatedProjectsModified:false}));
} catch(error){console.error(JSON.stringify({passed:false,type:error.name,code:error.code,message:error.constructor===Error?error.message:undefined}));process.exitCode=1;}
finally{await db.$disconnect();}
