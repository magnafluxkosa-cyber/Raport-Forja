const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=process.env.KAD_NOTICE_TEST_ROOT || path.join(__dirname,'..');
const code=fs.readFileSync(path.join(root,'kad-action-notifications-manual.js'),'utf8');new vm.Script(code);
function extract(name){const start=code.indexOf('function '+name+'(');assert(start>=0);for(let end=code.indexOf('}',start);end>=0;end=code.indexOf('}',end+1)){const s=code.slice(start,end+1);try{new vm.Script('('+s+')');return s}catch{}}}
const ctx=vm.createContext({Intl,Date});for(const name of ['dayInRomania','calendarDay','collectActionNotices'])vm.runInContext(extract(name),ctx);
assert.equal(ctx.dayInRomania('2026-11-18T22:30:00Z'),'2026-11-19');
assert.equal(ctx.calendarDay('31.02.2026'),'');assert.equal(ctx.calendarDay('19.11.2026'),'2026-11-19');
const row={id:'r',descriere_probleme:'Problemă',termen_prop:'19.11.2026',procent_realizat:25,responsabil_actiune:'Ion',observatii:'[19.11.2026 08:30] Ana: modificare stadiu'};
for(const sheet of ['forja','prelucrari']){
 const make=r=>({datasets:{[sheet]:[r]}});
 let notices=ctx.collectActionNotices(make(row),'2026-11-19');assert.equal(notices.length,2);assert(notices[0].detail.includes('Termen astăzi'));assert(notices[1].detail.includes('Autor: Ana'));
 assert.equal(ctx.collectActionNotices(make({...row,procent_realizat:100}),'2026-11-19').filter(n=>n.kind==='due').length,0);
 assert.equal(ctx.collectActionNotices(make({...row,termen_prop:'20.11.2026'}),'2026-11-19').filter(n=>n.kind==='due').length,0);
 assert.equal(ctx.collectActionNotices(make({...row,termen_prop:'18.11.2026'}),'2026-11-19').filter(n=>n.kind==='due').length,1);
 assert.equal(ctx.collectActionNotices(make({...row,termen_prop:'',observatii:'',data_constatare:'19.11.2026'}),'2026-11-19').length,1);
 assert.equal(ctx.collectActionNotices(make({...row,observatii:'[18.11.2026 11:00] Ion: ieri',termen_prop:''}),'2026-11-19').length,0);
 const next=ctx.collectActionNotices(make(row),'2026-11-20');assert.equal(next.length,1);assert.notEqual(next[0].id,notices[0].id);
}
assert.equal(ctx.collectActionNotices({action_changes:[{id:'e',sheet:'forja',at:'2026-11-19T10:00:00Z',author:'Ion'},{id:'old',sheet:'forja',at:'2026-11-18T10:00:00Z'}]},'2026-11-19').length,1);
function env({allowed=true,auth=true}={}){
 const nodes=[],listeners={},store=new Map();let payload={datasets:{forja:[row]}},reads=0;
 class El{constructor(tag){this.tag=tag;this.children=[];this.style={setProperty(k,v){this[k]=v}};this.hidden=false;this.listeners={}}append(e){e.remove();e.parent=this;e.removed=false;this.children.push(e)}appendChild(e){this.append(e)}setAttribute(){}remove(){this.removed=true;if(this.parent){this.parent.children=this.parent.children.filter(e=>e!==this);this.parent=null}}addEventListener(k,f){this.listeners[k]=f}}
 const body=new El('body');const q={select(){return this},in(){return this},order(){return this},async limit(){reads++;return {data:[{content:payload}]}}};
 const client={from:()=>q,auth:{getSession:async()=>({data:{session:{user:{id:'u'}}}}),onAuthStateChange:f=>{listeners.auth=f;return {}}}};
 const access=async()=>({allowed,permissions:{can_view:allowed}});
 const window={createRfSupabaseClient:()=>client,RF_ACL:{resolvePageAccess:access},addEventListener:(k,f)=>listeners[k]=f};
 if(auth)window.ERPAuth={getSupabaseClient:()=>client,getPageAccess:access};
 class Clock extends Date{constructor(v){super(v===undefined?'2026-11-19T10:00:00Z':v)}}
 const sandbox={window,Date:Clock,Intl,location:{pathname:'/index.html'},document:{body,readyState:'complete',createElement:t=>new El(t),addEventListener:(k,f)=>listeners[k]=f},localStorage:{getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)},console,setTimeout:f=>f(),setInterval:(f,ms)=>{assert.equal(ms,60000);listeners.poll=f}};
 vm.runInNewContext(code,sandbox);return {body,listeners,reads:()=>reads,setPayload:p=>payload=p};
}
async function flush(){for(let i=0;i<15;i++)await Promise.resolve()}
(async()=>{
 for(const auth of [true,false]){
  const e=env({auth});await flush();assert.equal(e.body.children.length,1,'Only bell exists on a new page');
  e.body.children[0].listeners.click();assert.equal(e.body.children.length,2);let panel=e.body.children[1];assert.equal(panel.hidden,false);assert.equal(panel.style.display,'block');
  panel.children[1].listeners.click();assert.equal(e.body.children.length,1,'Closing detaches panel');assert.equal(panel.style.display,'none');
  await e.listeners.poll();assert.equal(e.body.children.length,1);
  e.setPayload({datasets:{forja:[{...row,observatii:row.observatii+'\n[19.11.2026 11:00] Dan: nou'}]}});await e.listeners.poll();assert.equal(e.body.children.length,1,'New notes cannot mount panel');
  await e.listeners.focus();assert.equal(e.body.children.length,1,'Returning to page cannot mount panel');
  e.body.children[0].listeners.click();assert.equal(e.body.children.length,2,'Bell opens updated list');
  e.setPayload({datasets:{forja:[{...row,procent_realizat:100,observatii:''}]}});await e.listeners.poll();assert.equal(e.body.children.length,0);
  const anotherPage=env({auth});await flush();assert.equal(anotherPage.body.children.length,1,'Navigation starts with bell only');
  assert(e.reads()>=4);
 }
 const denied=env({allowed:false});await flush();assert.equal(denied.reads(),0);assert.equal(denied.body.children.length,0);
 console.log('PASS: daily existing notes, authors, today/overdue/future deadlines, 100% exclusion, Romania midnight, next-day reminders, dashboard without ERPAuth, polling, click-only opening, acknowledgement, resolved removal and ACL.');
})().catch(e=>{console.error(e);process.exitCode=1});
