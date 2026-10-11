import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
const require = createRequire('/root/DealOS-browser-tools/package.json');
const { chromium } = require('playwright');
const browser = await chromium.launch({ headless:true });
const output = `${process.env.GITHUB_WORKSPACE}/browser-evidence`;
mkdirSync(output,{recursive:true,mode:0o700});
const failures=[];
const results=[];
try {
  const context=await browser.newContext();
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',error=>errors.push(error.name));
  const categories=await (await fetch('http://127.0.0.1:3004/v1/categories')).json();
  const merchants=await (await fetch('http://127.0.0.1:3004/v1/merchants')).json();
  const paths=['/','/deals','/coupons','/clearance','/categories','/merchants','/search?q=sony','/about','/contact'];
  if(categories[0]?.slug) paths.push(`/categories/${encodeURIComponent(categories[0].slug)}`);
  if(merchants[0]?.slug) paths.push(`/merchants/${encodeURIComponent(merchants[0].slug)}`);
  for(const width of [320,375,768,1024,1440]) {
    await page.setViewportSize({width,height:900});
    for(const [index,path] of paths.entries()) {
      errors.length=0;
      const response=await page.goto(`http://127.0.0.1:3002${path}`,{waitUntil:'networkidle',timeout:30000});
      const dimensions=await page.evaluate(()=>({ viewport:innerWidth, document:document.documentElement.scrollWidth, body:document.body.scrollWidth }));
      const overflow=Math.max(dimensions.document,dimensions.body)>width+1;
      const result={width,path,status:response.status(),overflow,pageErrors:errors.length};
      results.push(result);
      if(response.status()!==200||overflow||errors.length) failures.push(result);
      await page.screenshot({path:`${output}/web-${width}-${index}.png`,fullPage:true});
    }
    await page.goto('http://127.0.0.1:3003/login',{waitUntil:'networkidle'});
    const adminOverflow=await page.evaluate(()=>Math.max(document.body.scrollWidth,document.documentElement.scrollWidth)>innerWidth+1);
    results.push({width,path:'Admin /login',overflow:adminOverflow});
    if(adminOverflow) failures.push({width,path:'Admin /login',overflow:true});
    await page.screenshot({path:`${output}/admin-login-${width}.png`,fullPage:true});
  }
  // Real UI interaction at mobile width: open navigation and use the search form.
  await page.setViewportSize({width:375,height:900});
  await page.goto('http://127.0.0.1:3002/',{waitUntil:'networkidle'});
  await page.getByRole('button',{name:'Toggle navigation menu'}).click();
  if(!await page.getByRole('link',{name:'Deals',exact:true}).last().isVisible()) throw new Error('Mobile navigation did not open');
  await page.screenshot({path:`${output}/navigation-open-375.png`,fullPage:true});
  await page.goto('http://127.0.0.1:3002/search',{waitUntil:'networkidle'});
  const input=page.getByPlaceholder('Search products, deals, coupons...');
  await input.fill('no-result-dealos-verification');
  await input.press('Enter');
  await page.getByText('No matching deals found',{exact:true}).waitFor({state:'visible',timeout:15000});
  await page.screenshot({path:`${output}/search-no-results-375.png`,fullPage:true});
  console.log(JSON.stringify({browser:'Chromium',results,failures,adminAuthenticatedBrowser:'deferred: Secure cookies require final HTTPS domain',affiliateRealLink:'unavailable: only existing link is expired and example destination'}));
  writeFileSync(`${output}/acceptance.json`,JSON.stringify({results,failures},null,2));
  if(failures.length) process.exitCode=1;
} finally { await browser.close(); }
