const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'..','plan-cell-notes.js'),'utf8');new vm.Script(source);
const model={window:{}};vm.runInNewContext(source,model);const api=model.window.KADPlanCellNotes;
const sample={data:{color:'#fff2cc',note:'Text <script>alert(1)</script>'},'machine:M1:reper':{color:'#d9ead3',note:'Test'}};
assert.deepEqual(JSON.parse(JSON.stringify(api.normalize(sample))),sample);
assert.equal(api.normalize({data:{color:'url(bad)',note:'a'.repeat(5000)}}).data.note.length,4000);
assert.equal(api.normalize({data:{color:'url(bad)',note:'x'}}).data.color,'');
assert.equal(Object.keys(api.normalize({unknown:{note:'x'}})).length,0);
assert.equal(api.cellKey(0,['M1']),'an');assert.equal(api.cellKey(3,['M1']),'machine:M1:reper');assert.equal(api.cellKey(5,['M1']),'machine:M1:realizat');
function extract(s,name){const start=s.indexOf('function '+name+'(');assert(start>=0,name);for(let end=s.indexOf('}',start);end>=0;end=s.indexOf('}',end+1)){const code=s.slice(start,end+1);try{new vm.Script('('+code+')');return code}catch{}}throw Error(name)}
for(let i=0;i<3;i++){
 const html=fs.readFileSync(path.join(__dirname,'..', ['planificare-forja.html','supabase/functions/rf-protected-page/pages/planificare-forja.html','supabase/functions/rf-protected-page-core/pages/planificare-forja.html'][i]),'utf8');
 for(const m of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);
 const c=vm.createContext({window:{KADPlanCellNotes:api},MACHINE_ORDER:['M1'],trimText:v=>String(v||'').trim(),toNumber:Number,displayToIso:v=>v,getMonthName:()=>'',getWeekdayLabel:()=>'',nowIso:()=>'',normalizePlanSlot:v=>v||{},state:{rows:[]}});
 for(const name of ['normalizeCellAnnotations','normalizePlanRow','buildPayload','clonePlanRows'])vm.runInContext(extract(html,name),c);
 const row={id:'r',an:2026,data:'2026-11-20',zi:'Vineri',slots:{M1:{reper:'X',planificat:10,realizat_seed:5}},cell_annotations:sample};
 c.state.rows=[c.normalizePlanRow(row,0)];const payload=c.buildPayload();assert.deepEqual(JSON.parse(JSON.stringify(payload.rows[0].cell_annotations)),sample);
 assert.deepEqual(JSON.parse(JSON.stringify(c.clonePlanRows(payload.rows)[0].cell_annotations)),sample);
 assert.equal(payload.rows[0].slots.M1.planificat,10);
}
class Element{
 constructor(tag){this.tag=tag;this.children=[];this.listeners={};this.attrs={};this.style={setProperty(k,v){this[k]=v},removeProperty(k){delete this[k]}};this.classes=new Set();this.classList={add:k=>this.classes.add(k),remove:k=>this.classes.delete(k),toggle:(k,v)=>v?this.classes.add(k):this.classes.delete(k)};this.dataset={};this.colSpan=1;this.isConnected=true}
 append(e){e.parent=this;this.children.push(e)}setAttribute(k,v){this.attrs[k]=v}addEventListener(k,f){(this.listeners[k]||=[]).push(f)}focus(){}showModal(){this.open=true}close(){this.open=false;this.fire('close')}
 fire(k,event={}){for(const fn of this.listeners[k]||[])fn(event)}remove(){if(this.parent)this.parent.children=this.parent.children.filter(e=>e!==this)}contains(e){return e===this||this.children.some(c=>c.contains(e))}
 closest(s){if(s==='td'&&this.tag==='td'||s==='tr[data-row-id]'&&this.tag==='tr'||s==='.plan-note-marker'&&this.className==='plan-note-marker')return this;return this.parent?.closest(s)||null}
 querySelectorAll(s){return this.children.flatMap(c=>[...(s==='tr[data-row-id]'&&c.tag==='tr'||s==='.plan-note-marker'&&c.className==='plan-note-marker'?[c]:[]),...c.querySelectorAll(s)])}
}
const head=new Element('head'),body=new Element('body'),table=new Element('tbody'),toolbar=new Element('div');body.append(table);body.append(toolbar);
const tr=new Element('tr');tr.dataset.rowId='r';table.append(tr);tr.cells=Array.from({length:6},(_,i)=>{const td=new Element('td');td.cellIndex=i;tr.append(td);return td});
let canEdit=true,saves=0;const rows=[{id:'r',data:'2026-11-20',cell_annotations:{}}];
const context={window:{},document:{head,body,createElement:t=>new Element(t)}};vm.runInNewContext(source,context);
const ui=context.window.KADPlanCellNotes.attach({body:table,toolbar,machines:['M1'],rows:()=>rows,canEdit:()=>canEdit,save:()=>saves++});ui.apply();
const dialog=body.children.find(e=>e.tag==='dialog'),mode=toolbar.children[0],palette=dialog.children.find(e=>e.className==='plan-note-palette'),text=dialog.children.find(e=>e.tag==='textarea'),actions=dialog.children.find(e=>e.className==='plan-note-actions');
mode.fire('click');table.fire('click',{target:tr.cells[3],preventDefault(){},stopImmediatePropagation(){}});assert.equal(dialog.open,true);
palette.children[1].fire('click');text.value='Notiță <img src=x>';actions.children[1].fire('click');assert.equal(saves,1);assert.equal(rows[0].cell_annotations['machine:M1:reper'].note,text.value);assert.equal(tr.cells[3].style['--plan-note-color'],'#fff2cc');assert.equal(dialog.open,false);
const marker=tr.cells[3].children[0];assert.equal(marker.attrs['aria-label'],'Deschide notița celulei');assert.equal(marker.title,undefined,'No note text on hover');
table.fire('click',{target:marker,preventDefault(){},stopImmediatePropagation(){}});assert.equal(text.value,'Notiță <img src=x>');text.value='Changed but cancelled';actions.children[0].fire('click');assert.equal(saves,1);
canEdit=false;ui.apply();table.fire('click',{target:tr.cells[3].children[0],preventDefault(){},stopImmediatePropagation(){}});assert(text.readOnly);assert(actions.children[1].hidden);actions.children[1].fire('click');assert.equal(saves,1);
console.log('PASS: all column keys, safe data, color/note save, cancel, click-only viewing, readonly permissions, persistence/reload and generator cloning across 3 page variants.');
