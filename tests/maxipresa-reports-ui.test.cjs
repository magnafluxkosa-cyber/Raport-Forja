const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const templates=process.env.KAD_REPORT_TEMPLATES?JSON.parse(fs.readFileSync(process.env.KAD_REPORT_TEMPLATES)):require('./maxipresa-synthetic-models.cjs');
class El{constructor(){this.children=[];this.style={setProperty(){}};this.value='';this.disabled=false;}append(...els){this.children.push(...els);if(!this.value&&els[0]?.value)this.value=els[0].value;}replaceChildren(){this.children=[];}setAttribute(){}showModal(){}close(){}focus(){}}
const els=new Map(),get=id=>{if(!els.has(id))els.set(id,new El());return els.get(id);};
let records=[],deny=false,fail=false;
function query(){let mode='select',payload,filters=[],models=false;const q={select(){return q},like(k,v){models=v.includes(':template:v1:');return q},eq(k,v){filters.push([k,v]);return q},order(){return q},limit(){return q},insert(p){mode='insert';payload=p;return q},update(p){mode='update';payload=p;return q},then(resolve){if(fail)return resolve({error:{message:'offline'}});if(models)return resolve({data:templates.map((t,i)=>({content:{...t,order:i}}))});if(mode==='insert'){records.push(payload);resolve({data:[payload]});}else if(mode==='update'){const r=records.find(r=>filters.every(([k,v])=>r[k]===v));if(r)Object.assign(r,payload);resolve({data:r?[r]:[]});}else resolve({data:records.map(r=>({...r}))});}};return q;}
const win={ERPAuth:{requireAuth:async()=>({user:{email:'test@local'},role:'admin'}),getPageAccess:async()=>({allowed:!deny,permissions:{can_add:true,can_edit:true,can_export:true}}),getSupabaseClient:()=>({from:query})},addEventListener(){}};
const context={window:win,document:{getElementById:get,createElement:()=>new El()},fetch:async()=>({ok:true,json:async()=>templates}),Intl,Date,URL,Blob,crypto:require('node:crypto').webcrypto,console,setTimeout,confirm:()=>true,Option:class extends El{constructor(t,v){super();this.textContent=t;this.value=v;}}};
vm.runInNewContext(fs.readFileSync(__dirname+'/../rapoarte-sectie.js','utf8'),context);
setTimeout(async()=>{try{
 assert.equal(get('template').children.length,23);assert.equal(get('loading').hidden,true);
 get('template').value='DD-51';get('template').onchange();
 get('name').value='Raport test';get('name').oninput();await get('save').onclick();assert.equal(records.length,1);assert.equal(records[0].content.name,'Raport test');
 get('name').value='Revizuit';get('name').oninput();await get('save').onclick();assert.equal(records.length,1);assert.equal(records[0].content.name,'Revizuit');
 get('new').onclick();get('archive').value='0';await get('open').onclick();assert.equal(get('name').value,'Revizuit');
 fail=true;get('name').value='Nesalvat';await get('save').onclick();assert.match(get('status').textContent,/offline/);assert.equal(records[0].content.name,'Revizuit');assert.equal(get('save').disabled,false);
 console.log('UI: initialization, new report, save, update, archive reopen and failed save passed.');
}catch(e){console.error(e);process.exitCode=1;}},30);
