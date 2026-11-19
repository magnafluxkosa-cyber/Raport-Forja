const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
function extract(s,name){const start=s.search(new RegExp('(?:async )?function '+name+'\\('));assert(start>=0,name);for(let end=s.indexOf('}',start);end>=0;end=s.indexOf('}',end+1)){const code=s.slice(start,end+1);try{new vm.Script('('+code+')');return code}catch{}}throw Error(name)}
const path=require('node:path'); const root=path.join(__dirname,'..'); const authSource=fs.readFileSync(path.join(root,'auth-common.js'),'utf8'); const source=authSource.slice(authSource.indexOf('/* Login summary for saved action-tracking changes.')); const pages=['urmarire-actiuni-progres.html','supabase/functions/rf-protected-page/pages/urmarire-actiuni-progres.html','supabase/functions/rf-protected-page-4/pages/urmarire-actiuni-progres.html'];
const events=[{id:'a',sheet:'forja',author:'Ion <img src=x>',user_id:'other'},{id:'b',sheet:'prelucrari',author:'Ana',user_id:'other'}];
function environment({allowed=true,user='reader',events:items=events,store=new Map(),error=false}={}){
 let queried=0;const listeners={};
 class Element {constructor(tag){this.tag=tag;this.style={};this.children=[];this.listeners={};}setAttribute(){}append(...items){this.children.push(...items)}addEventListener(type,cb){this.listeners[type]=cb}remove(){this.removed=true}}
 const body=new Element('body');
 const query={select(){return this},in(){return this},order(){return this},async limit(){return {data:[{content:{action_changes:items}}],error}}};
 const context={location:{pathname:'/index.html'},document:{body,readyState:'complete',createElement:tag=>new Element(tag)},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},console,setTimeout:fn=>fn(),window:{ERPAuth:{getCurrentUserWithRole:async()=>user?{user:{id:user},role:'viewer'}:null,getPageAccess:async(key,options)=>{assert.equal(options.publish,false);return {allowed,permissions:{can_view:allowed}}},getSupabaseClient:()=>({from:()=>{queried++;return query}}),onAuthStateChange:fn=>listeners.auth=fn}}};
 vm.runInNewContext(source,context);return {body,store,listeners,queried:()=>queried};
}
async function flush(){for(let i=0;i<12;i++)await Promise.resolve()}
(async()=>{
 let e=environment();await flush();assert.equal(e.body.children.length,1);
 let panel=e.body.children[0];assert.equal(panel.children[1].children[0].textContent,'Forjă — modificări de la: Ion <img src=x>');
 assert.equal(panel.children[1].children[1].href,'urmarire-actiuni-progres.html?sheet=forja');
 assert.equal(panel.children[2].children[1].href,'urmarire-actiuni-progres.html?sheet=prelucrari');
 assert.equal(e.store.size,0,'Displaying does not acknowledge');
 panel.children.at(-1).listeners.click();assert(panel.removed);
 const same=environment({store:e.store});await flush();assert.equal(same.body.children.length,0);
 const other=environment({store:e.store,user:'another-reader'});await flush();assert.equal(other.body.children.length,1);
 for(const opts of [{allowed:false},{user:null},{error:true},{events:[]}]){const no=environment(opts);await flush();assert.equal(no.body.children.length,0);if(opts.allowed===false)assert.equal(no.queried(),0)}
 e=environment();await flush();e.body.children[0].children[1].children[1].listeners.click();
 const remaining=environment({store:e.store});await flush();assert.equal(remaining.body.children[0].children.length,3);assert(remaining.body.children[0].children[1].children[1].href.endsWith('sheet=prelucrari'));
 for(let i=0;i<3;i++){
  const html=fs.readFileSync(path.join(root,pages[i]),'utf8');
  for(const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(match[1]);
  const state={user:{id:'account',email:'ion@example.test'},activeSheet:'forja'};
  const ctx=vm.createContext({state,Date,randomId:()=>String(Math.random()),setBadge(){},persistLocal(){},scheduleAutoSave(){},dom:{}});
  for(const name of ['recordActionChange','markDirty'])vm.runInContext(extract(html,name),ctx);
  ctx.markDirty(undefined,'Ion');assert.equal(state.actionChanges[0].author,'Ion');assert.equal(state.actionChanges[0].sheet,'forja');
  ctx.markDirty('Cleanup','',false);assert.equal(state.actionChanges.length,1);
  state.activeSheet='prelucrari';ctx.markDirty();assert.equal(state.actionChanges[1].sheet,'prelucrari');assert.equal(state.actionChanges[1].author,'ion@example.test');
  assert(extract(html,'currentPayload').includes('action_changes: state.actionChanges'));
  assert(extract(html,'loadCloudDocument').includes('payload.action_changes'));
  assert(html.includes('new URLSearchParams(window.location.search).get("sheet")'));
 }
 const auth=authSource;new vm.Script(auth);
 const access=extract(auth,'getPageAccess');assert(access.includes('settings.publish === false'));assert(!access.includes('return publishPageAccess('));
 console.log('PASS: notification display, authors, safe text, both sheet links, acknowledgements, account isolation, permission denial, missing session, errors, event recording, cleanup exclusion and syntax.');
})().catch(e=>{console.error(e);process.exitCode=1});
