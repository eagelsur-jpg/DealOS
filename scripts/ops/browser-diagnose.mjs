import {readFileSync,existsSync} from 'node:fs';
const sha='e2a3f2775734834f11e97ee5003bcdea0dd02613';
const path=`/root/DealOS-browser-evidence/${sha}-38104363172/acceptance.json`;
if(existsSync(path)){const data=JSON.parse(readFileSync(path,'utf8'));console.log(JSON.stringify({cases:data.results.length,failures:data.failures}));}
const log=readFileSync(`/root/DealOS-backups/production-${sha}.log`,'utf8');
const safe=log.split('\n').filter(line=>/footerGridColumns|Error:|TimeoutError:|locator\.|getByRole|waiting for|strict mode|No matching|navigation/.test(line));
console.log(safe.slice(-35).join('\n'));
