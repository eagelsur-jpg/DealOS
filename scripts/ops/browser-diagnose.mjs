import {createRequire} from 'node:module';
const require=createRequire('/root/DealOS-browser-tools/package.json');
const {chromium}=require('playwright');
const browser=await chromium.launch({headless:true});
try {
 const page=await browser.newPage({viewport:{width:320,height:900}});
 await page.goto('http://127.0.0.1:3002/',{waitUntil:'networkidle'});
 console.log(JSON.stringify(await page.evaluate(()=>Array.from(document.querySelectorAll('body *')).map(element=>({tag:element.tagName,class:typeof element.className==='string'?element.className:'',left:element.getBoundingClientRect().left,right:element.getBoundingClientRect().right,width:element.getBoundingClientRect().width})).filter(element=>element.right>321 ||element.left< -1).slice(0,30))));
} finally {await browser.close();}
