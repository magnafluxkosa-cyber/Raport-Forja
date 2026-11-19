const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
function extract(s,name){const start=s.indexOf('function '+name+'(');assert(start>=0,name);for(let end=s.indexOf('}',start);end>=0;end=s.indexOf('}',end+1)){const code=s.slice(start,end+1);try{new vm.Script('('+code+')');return code}catch{}}throw Error(name)}
for(const file of ['kad-action-notifications-manual.js','kad-action-notifications.js']){
 const source=fs.readFileSync(path.join(__dirname,'..',file),'utf8');new vm.Script(source);
 const ctx=vm.createContext({Date,Intl});for(const name of ['dayInRomania','calendarDay','collectActionNotices'])vm.runInContext(extract(source,name),ctx);
 for(const sheet of ['forja','prelucrari']){
 const row={id:'id & /? test',procent_realizat:25,termen_prop:'19.11.2026',observatii:'[19.11.2026 10:00] Ion: modificare'};
 const payload={datasets:{[sheet]:[row]},action_changes:[{id:'change',sheet,row:row.id,at:'2026-11-19T10:00:00Z'}]};
 const notices=ctx.collectActionNotices(payload,'2026-11-19');assert.equal(notices.length,3);for(const notice of notices)assert.equal(notice.row,row.id);
 payload.action_changes[0].row='removed';assert.equal(ctx.collectActionNotices(payload,'2026-11-19').at(-1).row,'');
 }
 assert(source.includes('titleLink.href = destination'));assert(source.includes('encodeURIComponent(notice.row)'));
}
for(const file of ['urmarire-actiuni-progres.html','supabase/functions/rf-protected-page/pages/urmarire-actiuni-progres.html','supabase/functions/rf-protected-page-4/pages/urmarire-actiuni-progres.html']){
 const s=fs.readFileSync(path.join(__dirname,'..',file),'utf8');for(const match of s.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(match[1]);
 let focus=0,bottom=0;
 const state={focusRowId:'target',focusScrollDone:false,scrollToBottomOnNextRender:true,activeSheet:'forja',user:{}};
 const wrap={clientHeight:300,scrollHeight:1500,scrollTop:0,querySelector:()=>null,getBoundingClientRect:()=>({top:0,bottom:300})};
 const ctx=vm.createContext({state,dom:{tableWrap:wrap},startFocusRowScroll:()=>focus++,requestAnimationFrame:f=>{bottom++;f()},window:{innerHeight:900,scrollBy(){}},Date,randomId:()=> 'event'});
 vm.runInContext(extract(s,'scrollTableToBottomIfNeeded'),ctx);ctx.scrollTableToBottomIfNeeded();assert.equal(focus,1);assert.equal(bottom,0);assert.equal(state.scrollToBottomOnNextRender,false);
 vm.runInContext(extract(s,'centerFocusRow'),ctx);ctx.centerFocusRow({getBoundingClientRect:()=>({top:800,bottom:900,height:100})});assert.equal(wrap.scrollTop,700);
 vm.runInContext(extract(s,'recordActionChange'),ctx);ctx.recordActionChange('forja','Ion','target');assert.equal(state.actionChanges[0].row,'target');
 assert(s.includes('state.focusRowId === row.id ? "kad-focus-row"'));assert(s.includes('tbody tr.kad-focus-row'));assert(s.includes('get("row")'));
}
console.log('PASS: row IDs for both sheets, safely encoded links, deleted-row fallback, event metadata, target centering, no bottom jump, highlight and all script syntax.');
