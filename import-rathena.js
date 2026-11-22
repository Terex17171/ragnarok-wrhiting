const fs=require('fs');
const path=require('path');
const YAML=require('yaml');
const base='https://raw.githubusercontent.com/rathena/rathena/master/db/';
async function load(rel){
  const response=await fetch(base+rel,{signal:AbortSignal.timeout(45000)});
  if(!response.ok)throw Error(`${rel}: HTTP ${response.status}`);
  const parsed=YAML.parse(await response.text());
  if(!Array.isArray(parsed?.Body))throw Error(`${rel}: missing Body`);
  return parsed.Body;
}
const clean=s=>String(s||'').replace(/_/g,' ').trim();
function mobs(rows){return [...new Map(rows.filter(x=>Number.isInteger(x.Id)&&x.Id>0&&clean(x.Name)).map(x=>[x.Id,{id:x.Id,name:clean(x.Name),region:'Other',kind:'monsters'}])).values()]}
function itemType(x){let t=String(x.Type||'').toLowerCase();if(t.includes('card'))return 'Cards';if(t.includes('weapon'))return 'Weapons';if(['armor','shadowgear'].includes(t))return 'Armor';if(['healing','usable','delayconsume','cash'].includes(t))return 'Consumables';return 'Etc'}
function items(rows){return [...new Map(rows.filter(x=>Number.isInteger(x.Id)&&x.Id>0&&clean(x.Name)).map(x=>[x.Id,{id:x.Id,name:clean(x.Name),type:itemType(x),kind:'items'}])).values()]}
async function main(){
 const pre=mobs(await load('pre-re/mob_db.yml'));
 const re=mobs(await load('re/mob_db.yml'));
 const paths=['pre-re/item_db_etc.yml','pre-re/item_db_equip.yml','pre-re/item_db_usable.yml'];
 const raw=(await Promise.all(paths.map(load))).flat();
 const its=items(raw);
 if(pre.length<500||re.length<500||its.length<1000)throw Error(`Catalog incomplete: pre=${pre.length}, renewal=${re.length}, items=${its.length}`);
 fs.writeFileSync(path.join(__dirname,'rathena-data.json'),JSON.stringify({source:'rAthena',monsters:pre,renewal:re,items:its}));
 console.log(`Imported rAthena: ${pre.length} Pre-Renewal monsters, ${re.length} Renewal monsters, ${its.length} Pre-Renewal items`);
}
main().catch(e=>{console.error('rAthena import FAILED; refusing to deploy old starter data:',e);process.exit(1)});
