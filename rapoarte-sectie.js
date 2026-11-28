(function(root){
'use strict';
const GROUP=root.RS_GROUP||'maxipresa';
const col=n=>String.fromCharCode(64+n);
// Compact templates (format 2): styles are named once and cells refer to them by name.
function expandTemplate(t){
 if(!t||t.format!==2)return t;
 const cells={},styles=t.styles||{};
 for(let r=1;r<=t.rows;r++)for(let c=1;c<=t.cols;c++)cells[col(c)+r]={v:'',font:{size:9,bold:false,italic:false,color:'#000000'},fill:'#ffffff',align:'left',border:{top:false,bottom:false,left:false,right:false}};
 for(const [addr,spec] of Object.entries(t.cells||{})){const cell=cells[addr];if(!cell)continue;const [v,name,f]=Array.isArray(spec)?spec:[spec];cell.v=v==null?'':String(v);if(f)cell.formula=f;const s=styles[name];if(s){cell.font=Object.assign({size:9,bold:false,italic:false,color:'#000000'},s.font);cell.fill=s.fill;cell.align=s.align;cell.border=Object.assign({top:false,bottom:false,left:false,right:false},s.border);}}
 return Object.assign({},t,{cells,images:t.images||[]});
}
function pageParam(k){const sp=(root.location&&root.location.search)||'';const m=sp.match(new RegExp('[?&]'+k+'=([^&]*)'));return m?decodeURIComponent(m[1]):'';}
function values(t,changes,date){
 const result={},busy=new Set();
 function get(key){
  if(Object.hasOwn(result,key))return result[key];
  if(Object.hasOwn(changes,key))return result[key]=changes[key];
  if(key===t.dateCell)return result[key]=date.split('-').reverse().join('.');
  const cell=t.cells[key];if(!cell)return '';
  if(busy.has(key))throw Error('Referință circulară în model.');busy.add(key);
  let v=cell.v,f=cell.formula;
  if(f){
   f=f.replace(/^=/,'');let m;
   if(f==='SHIFT')v='MP-2500 SCH '+get('B4');
   else if((m=f.match(/^RIGHT\(([A-Z]+\d+),(\d+)\)$/)))v=String(get(m[1])).slice(-Number(m[2]));
   else if((m=f.match(/^SUM\(([A-Z]+)(\d+):\1(\d+)\)$/))) {v=0;for(let r=+m[2];r<=+m[3];r++)v+=Number(get(m[1]+r))||0;}
   else if(/^[A-Z]+\d+$/.test(f))v=get(f);
   else if(f.includes('&'))v=f.split('&').map(x=>x.startsWith('"')?x.slice(1,-1):get(x)).join('');
   else if(/^[A-Z]+\d+(\+[A-Z]+\d+)+$/.test(f))v=f.split('+').reduce((s,k)=>s+(Number(get(k))||0),0);
   else if(/^\d+$/.test(f))v=Number(f);
   else if(!/^TODAY\(\)/.test(f))throw Error('Calcul nesuportat în '+key);
  }
  busy.delete(key);return result[key]=v;
 }
 Object.keys(t.cells).forEach(get);return result;
}
async function workbook(ExcelJS,t,data){
 const wb=new ExcelJS.Workbook();wb.creator='K.A.D';const ws=wb.addWorksheet(t.id.replace(/[\\/?*\[\]:]/g,'-').slice(0,31),{pageSetup:{paperSize:9,orientation:'portrait',fitToPage:true,fitToWidth:1,fitToHeight:1,margins:{left:.35,right:.35,top:.35,bottom:.35,header:0,footer:0}}});
 t.widths.forEach((v,i)=>ws.getColumn(i+1).width=v);t.heights.forEach((v,i)=>ws.getRow(i+1).height=v);
 for(const [key,c] of Object.entries(t.cells)){
  const d=ws.getCell(key);d.value=data[key]??'';
  if((key===t.dateCell||(t.id==='DD-03'&&key==='G1'))&&/^\d{2}\.\d{2}\.\d{4}$/.test(String(d.value))){const [day,month,year]=d.value.split('.').map(Number);d.value=new Date(Date.UTC(year,month-1,day));d.numFmt='dd.mm.yyyy';}
  d.font={name:'Arial',size:c.font.size,bold:c.font.bold,italic:c.font.italic,color:{argb:'FF'+c.font.color.slice(1)}};
  d.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF'+c.fill.slice(1)}};d.alignment={horizontal:['left','center','right'].includes(c.align)?c.align:'left',vertical:'middle',wrapText:true};
  d.border=Object.fromEntries(Object.entries(c.border).filter(([,yes])=>yes).map(([side])=>[side,{style:'thin',color:{argb:'FF000000'}}]));
 }
 t.merges.forEach(m=>ws.mergeCells(...m));
 for(const img of t.images){const id=wb.addImage({base64:img.data,extension:img.data.includes('image/png')?'png':'jpeg'});ws.addImage(id,{tl:{col:img.col+img.colOff/(t.widths[img.col]*7+5),row:img.row+img.rowOff/(t.heights[img.row]*4/3)},ext:{width:img.width,height:img.height}});}
 ws.pageSetup.printArea='A1:'+col(t.cols)+t.rows;return wb;
}
if(typeof module!=='undefined'&&module.exports){module.exports={values,workbook,expandTemplate};return;}
const $=id=>document.getElementById(id);let templates,t,changes={},auth,perms,sb,key=null,version=null,dirty=false,busy=false,archiveRows=[],editKey;
const today=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Bucharest'}).format(new Date());
const canWrite=()=>!!(key?perms.can_edit:perms.can_add);
const message=text=>$('status').textContent=text;
const current=()=>values(t,changes,$('date').value);
let planRows=null;
function nextMpReper(date){if(!planRows||!/^\d{4}-\d{2}-\d{2}$/.test(date||''))return '';const d=Date.parse(date+'T00:00:00Z');for(let i=1;i<=14;i++){const x=new Date(d+i*864e5).toISOString().slice(0,10);const rep=String(planRows.find(r=>r.data===x)?.slots?.MP?.reper??'').trim();if(rep)return rep;}return '';}
const DD03_SLOTS={'5T CH':'5 T CHINA','1,25 T':'1,25 T','2,5 T':'2,5 T','3T-BR':'3 T BR','3T ZR':'3 T ZR'};
const ZILE_RO=['Duminică','Luni','Marți','Miercuri','Joi','Vineri','Sâmbătă'];
const DD03_HOLIDAYS=new Set(['2026-01-01','2026-01-02','2026-01-24','2026-04-10','2026-04-13','2026-05-01','2026-06-01','2026-08-15','2026-11-30','2026-12-01','2026-12-25','2026-12-26','2027-01-01','2027-01-02','2027-01-24','2027-04-30','2027-05-01','2027-05-03','2027-06-01','2027-06-20','2027-06-21','2027-08-15','2027-11-30','2027-12-01','2027-12-25','2027-12-26']);
const dd03Workday=iso=>{const wd=new Date(iso+'T12:00:00').getDay();return wd>0&&wd<6&&!DD03_HOLIDAYS.has(iso);};
const dd03SlotPlanned=(r,k)=>{const x=r?.slots?.[k];return String(x?.reper||'').trim()!==''||Number(x?.planificat)>0;};
const dd03Planned=r=>Object.values(DD03_SLOTS).some(k=>dd03SlotPlanned(r,k));
let dd03Meta={};
const isDdLabel=addr=>!!(t&&t.id==='DD-03'&&addr[0]==='A'&&Object.keys(DD03_SLOTS).includes(String(t.cells?.[addr]?.v??'').trim()));
function dd03Fill(data){
 dd03Meta={};
 if(!planRows||!$('date').value)return;
 const dv=$('date').value;const iso=/^\d{4}-\d{2}-\d{2}$/.test(dv)?dv:dv.split('.').reverse().join('-');
 const rows=planRows.filter(r=>r&&r.data).sort((a,b)=>a.data.localeCompare(b.data));
 
 const target=rows.find(r=>r.data>iso&&dd03Workday(r.data)&&dd03Planned(r))||null;
 const dayLine=target?ZILE_RO[new Date(target.data+'T12:00:00').getDay()]+' '+target.data.split('-').reverse().join('.'):'';
 for(const [label,slot] of Object.entries(DD03_SLOTS)){
  const found=Object.keys(t.cells).find(a=>a[0]==='A'&&String(t.cells[a]?.v??'').trim()===label);
  if(!found)continue;
  const r=found.slice(1);const labelAddr='A'+r,contentAddr='B'+r;
  data[labelAddr]=t.cells[labelAddr]?.v??label;
  const tgt=String(target?.slots?.[slot]?.reper||'').trim();
  let prev='';for(let i=rows.length-1;target&&i>=0;i--){if(rows[i].data>=target.data)continue;const v=String(rows[i].slots?.[slot]?.reper||'').trim();if(v){prev=v;break;}}
  const warn=tgt&&prev&&prev!==tgt?'ATENȚIE: urmează schimbare de reper':'';
  const day=dayLine;
  dd03Meta[contentAddr]={reper:tgt,warn,day};
  if(!(contentAddr in changes))data[contentAddr]=[tgt,warn].filter(Boolean).join('\n');
 }
 const todayRow=rows.find(r=>r.data===iso)||null;
 const working=Object.entries(DD03_SLOTS).filter(([label,slot])=>todayRow&&dd03SlotPlanned(todayRow,slot)).map(([label])=>label);
 ['A20','A27','A34'].forEach((addr,i)=>{if(!(addr in changes))data[addr]=working[i]||'';});
}
async function loadPlan(){try{const {data,error}=await sb.from('rf_documents').select('content').eq('doc_key','planificare-forja').maybeSingle();if(error)throw error;planRows=data?.content?.rows||null;if(t&&(t.id==='DD-51'||t.id==='DD-03'))render();}catch(e){planRows=null;message('Planificarea forja nu s-a putut încărca: '+(e?.message||e));}}
function controls(){for(const id of ['save','new','export','print','template','date','name'])$(id).disabled=busy||(['export','print'].includes(id)?!perms.can_export:id==='new'||id==='template'?!perms.can_add:!canWrite());}
function changed(){dirty=true;stashDraft();message('Modificări nesalvate.');}
const draftKey=(id,d)=>'rapoarte-sectie:'+GROUP+':draft:'+id+':'+d;
let draftTimer=null;
function stashDraft(){if(!t||key||!canWrite())return;clearTimeout(draftTimer);const id=t.id,d=$('date').value,payload={changes:{...changes},name:$('name').value};draftTimer=setTimeout(()=>{writeDraft(id,d,payload).catch(()=>{});},600);}
async function writeDraft(id,d,payload){const doc_key=draftKey(id,d);const content={schema:'draft',template:id,date:d,changes:payload.changes||{},name:payload.name||''};const updated_at=new Date().toISOString();const {data,error}=await sb.from('rf_documents').update({content,updated_at}).eq('doc_key',doc_key).select('doc_key');if(error)throw error;if(!data?.length){const {error:insErr}=await sb.from('rf_documents').insert({doc_key,content,updated_at});if(insErr)throw insErr;}}
function clearDraft(){if(!t||!sb||!canWrite())return;clearTimeout(draftTimer);writeDraft(t.id,$('date').value,{changes:{},name:''}).catch(()=>{});}
async function loadDraft(){try{const {data}=await sb.from('rf_documents').select('content').eq('doc_key',draftKey(t.id,$('date').value)).maybeSingle();const c=data?.content;return Object.keys(c?.changes||{}).length?c:null;}catch(e){return null;}}
let cellEls={},editingAddr=null;
function parseAddr(a){const m=String(a).match(/^([A-Z])(\d+)$/);return m?{c:m[1].charCodeAt(0)-64,r:+m[2]}:null;}
function nextEditable(addr,dr,dc){const p=parseAddr(addr);if(!p)return null;let c=p.c,r=p.r;for(let i=0;i<400;i++){c+=dc;r+=dr;if(c<1||r<1||c>t.cols||r>t.rows)return null;const a=col(c)+r;if(cellEls[a])return a;}return null;}
function focusCell(addr){const el=addr&&cellEls[addr];if(el)el.focus();}
function commitInline(addr,raw,next){if(editingAddr!==addr)return;editingAddr=null;const v=String(raw??'').trim();if(v!==String(current()[addr]??'')){if(v==='')delete changes[addr];else changes[addr]=/^-?\d+([.,]\d+)?$/.test(v)&&!/^0\d/.test(v)?Number(v.replace(',','.')):v;changed();if(repCell(addr)){if(v==='')delete changes.E6;else fillNorma(v);}}render();focusCell(next||addr);}
function cancelInline(addr){if(editingAddr!==addr)return;editingAddr=null;render();focusCell(addr);}
let teamNames=[],teamNamesAt=0,reperNames=[],reperNamesAt=0;
async function fillNorma(reper){if(GROUP!=='forja'||!sb||!t)return;const utilaj=String(t.title||'').replace(/^DD-51\s*·\s*/,'').trim();try{const {data,error}=await sb.from('rf_norme_forja').select('norma').eq('utilaj',utilaj).eq('reper',reper).maybeSingle();if(error)throw error;if(!data||data.norma==null)return;if(String(changes.B8||'')!==reper)return;changes.E6=Number(data.norma);changed();if(!editingAddr)render();}catch(e){message('Norma nu s-a încărcat: '+(e.message||e));}}
function repCell(addr){return GROUP==='forja'&&addr==='B8'&&!!t&&t.id==='DD-51';}
async function loadReperNames(force){if(GROUP!=='forja'||!sb)return;if(!force&&reperNames.length&&Date.now()-reperNamesAt<60000)return;try{const {data,error}=await sb.from('rf_helper_repere_forjate').select('reper_forjat,is_active').eq('is_active',true);if(error)throw error;reperNames=[...new Set((data||[]).map(r=>String(r.reper_forjat||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ro',{numeric:true}));reperNamesAt=Date.now();}catch(e){message('Lista de repere nu s-a încărcat: '+(e.message||e));}}
function teamCell(addr){return GROUP==='forja'&&!!t&&!!t.cells[addr]&&/^\d+:$/.test(String(t.cells[addr].v||'').trim());}
function normName(x){return String(x).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().trim();}
async function loadTeamNames(force){if(GROUP!=='forja'||!sb)return;if(!force&&teamNames.length&&Date.now()-teamNamesAt<60000)return;try{const {data,error}=await sb.from('rf_documents').select('content').eq('doc_key','pontaj-forja').maybeSingle();if(error)throw error;const ops=(data&&data.content&&data.content.operators)||[];teamNames=[...new Set(ops.filter(o=>o&&o.department==='FORJA'&&!o.end_month&&o.name).map(o=>String(o.name).trim()))].sort((a,b)=>a.localeCompare(b,'ro'));teamNamesAt=Date.now();}catch(e){message('Lista de operatori nu s-a încărcat: '+(e.message||e));}}
async function startInline(addr,initial){if(editingAddr===addr||!canWrite()||reperAddr(addr))return;const td=cellEls[addr];if(!td)return;const team=teamCell(addr)||repCell(addr);editingAddr=addr;const div=td.querySelector('.text');if(div)div.style.display='none';const inp=document.createElement('input');inp.type='text';inp.className='cellInput';inp.value=initial!==undefined?initial:(team?(addr in changes?String(changes[addr]):''):String(current()[addr]??''));const align=t.cells[addr].align;inp.style.cssText='position:absolute;inset:0;width:100%;height:100%;border:0;outline:2px solid #267eb6;outline-offset:-2px;margin:0;padding:0 3px;background:#fff;color:#1d4ed8;font:bold 16px "Segoe Print","Comic Sans MS",cursive;box-sizing:border-box;text-align:'+(align==='center'?'center':align==='right'?'right':'left')+';';let sug=null,items=[],idx=0;const closeList=()=>{if(sug){sug.remove();sug=null;}items=[];};const paint=()=>{if(!team)return;const q=normName(inp.value);items=(repCell(addr)?reperNames:teamNames).filter(n=>normName(n).startsWith(q));if(idx>=items.length)idx=0;if(!items.length){closeList();return;}if(!sug){sug=document.createElement('div');sug.className='teamSug';sug.style.cssText='position:absolute;top:100%;left:0;min-width:100%;max-height:220px;overflow:auto;background:#fff;border:1px solid #267eb6;z-index:20;font:14px Arial,sans-serif;color:#000;box-shadow:0 4px 12px #0003;';td.append(sug);}sug.replaceChildren(...items.map((n,i)=>{const d=document.createElement('div');d.textContent=n;d.style.cssText='padding:4px 8px;cursor:pointer;background:'+(i===idx?'#dbeafe':'#fff')+';';d.onmousedown=e=>{e.preventDefault();commitInline(addr,n,addr);};return d;}));};inp.oninput=()=>{idx=0;paint();};inp.onkeydown=e=>{e.stopPropagation();const k=e.key;const open=!!(team&&sug&&items.length);if(open&&(k==='ArrowDown'||k==='ArrowUp')){e.preventDefault();idx=(idx+(k==='ArrowDown'?1:-1)+items.length)%items.length;paint();return;}if(open&&(k==='Enter'||k==='Tab')){e.preventDefault();const pick=items[idx];commitInline(addr,pick,k==='Tab'?nextEditable(addr,0,e.shiftKey?-1:1):nextEditable(addr,1,0));return;}if(open&&k==='Escape'){e.preventDefault();closeList();return;}if(k==='Enter'||k==='ArrowDown'){e.preventDefault();commitInline(addr,inp.value,nextEditable(addr,1,0));}else if(k==='ArrowUp'){e.preventDefault();commitInline(addr,inp.value,nextEditable(addr,-1,0));}else if(k==='Tab'){e.preventDefault();commitInline(addr,inp.value,nextEditable(addr,0,e.shiftKey?-1:1));}else if(k==='ArrowRight'&&inp.selectionStart===inp.value.length){e.preventDefault();commitInline(addr,inp.value,nextEditable(addr,0,1));}else if(k==='ArrowLeft'&&inp.selectionStart===0&&inp.selectionEnd===0){e.preventDefault();commitInline(addr,inp.value,nextEditable(addr,0,-1));}else if(k==='Escape'){e.preventDefault();cancelInline(addr);}};inp.onblur=()=>commitInline(addr,inp.value,null);td.append(inp);inp.focus();inp.setSelectionRange(inp.value.length,inp.value.length);if(team){await(repCell(addr)?loadReperNames(false):loadTeamNames(false));if(editingAddr===addr)paint();}}
function cellKey(e,addr){if(editingAddr===addr)return;const k=e.key;const dirs={ArrowDown:[1,0],ArrowUp:[-1,0],ArrowRight:[0,1],ArrowLeft:[0,-1]};if(dirs[k]){e.preventDefault();focusCell(nextEditable(addr,dirs[k][0],dirs[k][1]));return;}if(k==='Enter'){e.preventDefault();if(reperAddr(addr))edit(addr);else startInline(addr);return;}if(reperAddr(addr))return;if(k==='Delete'||k==='Backspace'){if(addr in changes){e.preventDefault();delete changes[addr];changed();render();focusCell(addr);}return;}if(k.length===1&&!e.ctrlKey&&!e.metaKey&&!e.altKey){e.preventDefault();startInline(addr,k);}}
function render(){cellEls={};editingAddr=null;
 const data=current();if(t.id==='DD-51'&&!('C52' in changes)){const a=nextMpReper($('date').value);if(a)data.C52=a;}if(t.id==='DD-03'&&GROUP==='forja')dd03Fill(data);const width=t.widths.reduce((s,w)=>s+w*7+5,0),height=t.heights.reduce((s,h)=>s+h*4/3,0),scale=Math.min(724/width,1000/height),printScale=Math.min(718/width,1044/height);
 $('sheet').replaceChildren();$('sheet').style.width=width+'px';$('sheet').style.zoom=scale;$('paper').style.height=(height*scale+36)+'px';$('paper').style.setProperty('--print-scale',printScale);$('sheet').style.setProperty('--print-left',Math.max(0,(718-width*printScale)/2)+'px');
 const table=document.createElement('table');table.className='report';table.style.width=width+'px';const cg=document.createElement('colgroup');t.widths.forEach(w=>{const c=document.createElement('col');c.style.width=(w*7+5)+'px';cg.append(c);});table.append(cg);
 const hidden=new Set(),spans={};for(const [r,c,er,ec] of t.merges){spans[col(c)+r]=[er-r+1,ec-c+1];for(let y=r;y<=er;y++)for(let x=c;x<=ec;x++)if(x!==c||y!==r)hidden.add(col(x)+y);}
 for(let r=1;r<=t.rows;r++)for(let c=t.cols;c>=1;c--){const addr=col(c)+r;if(hidden.has(addr)||spans[addr]||addr===t.dateCell)continue;if(String(data[addr]??'').trim().length<=25)continue;let last=c;while(last<t.cols){const nx=col(last+1)+r;if(hidden.has(nx)||spans[nx]||String(data[nx]??'')!==''||t.cells[nx]?.formula||t.cells[col(last)+r]?.border?.right||t.cells[nx]?.border?.left)break;last++;}if(last>c){spans[addr]=[1,last-c+1];for(let x=c+1;x<=last;x++)hidden.add(col(x)+r);}}
 for(let r=1;r<=t.rows;r++){const tr=document.createElement('tr');tr.style.height=t.heights[r-1]*4/3+'px';for(let c=1;c<=t.cols;c++){const addr=col(c)+r;if(hidden.has(addr))continue;const cell=t.cells[addr],td=document.createElement('td');if(spans[addr])[td.rowSpan,td.colSpan]=spans[addr];td.style.background=isDdLabel(addr)?'#FFFFFF':cell.fill;if(t.id==='DD-03'&&dd03Meta[addr]){const shown=(addr in changes)?String(changes[addr]??'').trim():String(dd03Meta[addr].reper||'').trim();td.style.background=shown?'#FFE699':'#FFFFFF';}const span=spans[addr]||[1,1];const eb={};for(const side of Object.keys(cell.border)){let on=!!cell.border[side];for(let y=r;y<r+span[0];y++)for(let x=c;x<c+span[1];x++){const edge=side==='right'?x===c+span[1]-1:side==='bottom'?y===r+span[0]-1:side==='left'?x===c:y===r;if(edge&&t.cells[col(x)+y]?.border?.[side])on=true;}eb[side]=on;}for(const side of Object.keys(eb))td.style['border'+side[0].toUpperCase()+side.slice(1)]=eb[side]?'1px solid #222':'none';const div=document.createElement('div');div.className='text';const isX=/^x$/i.test(String(data[addr]??'').trim());const isUtilajOre=t.id==='DD-51'&&/^K(9|1\d|2[0-6])$/.test(addr);const typed=(addr in changes)&&!reperAddr(addr)&&!isDdLabel(addr);const big=isX||isUtilajOre||typed;div.textContent=(teamCell(addr)&&(addr in changes))?String(t.cells[addr].v).trim()+' '+changes[addr]:data[addr];Object.assign(div.style,{fontSize:isX?'18px':(isUtilajOre||typed)?'16px':cell.font.size*4/3+'px',fontWeight:(big||cell.font.bold)?'bold':'normal',fontStyle:cell.font.italic?'italic':'normal',color:(addr in changes&&!reperAddr(addr)&&!isDdLabel(addr))?'#1d4ed8':String(data[addr]??'').includes('ATENȚIE')?'#c00000':cell.font.color,fontFamily:(addr in changes&&!reperAddr(addr)&&!isDdLabel(addr))?"'Segoe Print','Comic Sans MS',cursive":'',justifyContent:(isX||cell.align==='center')?'center':cell.align==='right'?'flex-end':'flex-start'});if(typed&&String(data[addr]??'').length){const hAlign=(isX||cell.align==='center')?'center':cell.align==='right'?'flex-end':'flex-start';Object.assign(div.style,{position:'static',inset:'',height:'auto',minHeight:'100%',overflow:'visible',padding:'1px 2px',boxSizing:'border-box',flexDirection:'column',justifyContent:'center',alignItems:hAlign});}if(t.id==='DD-03'&&dd03Meta[addr]&&!(addr in changes)&&(dd03Meta[addr].reper||dd03Meta[addr].warn||dd03Meta[addr].day)){const m=dd03Meta[addr];div.textContent='';Object.assign(div.style,{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'8px',padding:'2px 6px',boxSizing:'border-box'});const left=document.createElement('div');left.style.cssText='display:flex;flex-direction:column;';const r1=document.createElement('span');r1.textContent=m.reper;r1.style.cssText='font:bold 16px Arial,sans-serif;color:#000;';left.append(r1);if(m.warn){const w=document.createElement('span');w.textContent=m.warn;w.style.cssText='font:bold 11px Arial,sans-serif;color:#c00000;';left.append(w);}div.append(left);if(m.day){const right=document.createElement('span');right.textContent=m.day;right.style.cssText='font:bold 12px Arial,sans-serif;color:#000;white-space:nowrap;';div.append(right);}}td.append(div);if(canWrite()&&addr!==t.dateCell&&!isDdLabel(addr)){td.className='editable';td.tabIndex=0;td.setAttribute('aria-label','Completează '+(String(data[addr]||'câmp gol')));td.onclick=()=>{if(reperAddr(addr))edit(addr);else startInline(addr);};td.onkeydown=e=>cellKey(e,addr);cellEls[addr]=td;}tr.append(td);}table.append(tr);}
 $('sheet').append(table);
 if(GROUP==='forja'){
  for(const [addr,el] of Object.entries(cellEls)){
   const row=parseInt(addr.replace(/[A-Z]+/,''),10);
   if(row>8||!data[addr]||(addr in changes))continue;
   const txt=el.querySelector('.text');if(!txt)continue;
   txt.style.whiteSpace='nowrap';
   let fs=parseFloat(getComputedStyle(txt).fontSize);
   while(txt.scrollWidth>txt.clientWidth+1&&fs>7){fs-=0.5;txt.style.fontSize=fs+'px';}
  }
 }
 for(const txt of table.querySelectorAll('td .text')){
  if(txt.scrollHeight<=txt.clientHeight+1)continue;
  let fs=parseFloat(getComputedStyle(txt).fontSize);
  while(txt.scrollHeight>txt.clientHeight+1&&fs>6){fs-=0.5;txt.style.fontSize=fs+'px';}
 }
 $('paper').style.setProperty('--print-height',(height*printScale+2)+'px');
 for(const im of t.images){const img=document.createElement('img');img.className='drawing';img.alt='Desen reper';img.src=im.data;Object.assign(img.style,{left:(t.widths.slice(0,im.col).reduce((s,w)=>s+w*7+5,0)+im.colOff)+'px',top:(t.heights.slice(0,im.row).reduce((s,h)=>s+h*4/3,0)+im.rowOff)+'px',width:im.width+'px',height:im.height+'px'});$('sheet').append(img);}
 controls();
}
function reperName(id){return String(id??'').trim().replace(/^FC-(FR-)?/,'');}
function reperAddr(addr){return t.id==='DD-51'&&/^B(9|1\d|2[0-6])$/.test(addr);}
function autocontrolFor(reper){const v=String(reper??'').trim();if(!v)return null;return templates.find(x=>x.id===v)||templates.find(x=>x.id.endsWith('-'+v))||null;}
function edit(addr){if(!canWrite()||busy)return;editKey=addr;$('value').value=current()[addr];$('computed').textContent=t.cells[addr].formula?'Acest câmp este calculat. Dacă îl completezi manual, valoarea introdusă va fi folosită în acest raport.':'';const reperMode=reperAddr(addr);let sel=$('reperSel');if(!sel){sel=document.createElement('select');sel.id='reperSel';sel.style.cssText='width:100%;padding:8px;font:inherit;margin-top:6px';$('value').before(sel);}sel.hidden=!reperMode;$('value').hidden=reperMode;if(reperMode){sel.innerHTML='';sel.append(new Option('— alege reperul —',''));for(const x of templates.filter(x=>x.id!=='DD-51')){const n=reperName(x.id);sel.append(new Option(n,n));}const cur=reperName(current()[addr]);sel.value=[...sel.options].some(o=>o.value===cur)?cur:'';sel.onchange=()=>{$('value').value=sel.value;};$('value').value=sel.value;}$('editor').showModal();if(reperMode)sel.focus();else $('value').focus();}
function discard(){return !dirty||confirm('Există modificări nesalvate. Continui fără să le salvezi?');}
async function fresh(){t=templates.find(x=>x.id===$('template').value);key=null;version=null;dirty=false;$('date').value=today();const dr=await loadDraft();changes=dr?.changes||{};$('name').value=dr?.name||t.title;render();message(dr?'Am reluat modificările nesalvate pentru acest șablon.':'Raport nou. Completează și salvează pentru a-l păstra.');}
async function list(){const day=$('archiveDate').value;if(!day)return;const {data,error}=await sb.from('rf_documents').select('doc_key,content,updated_at').like('doc_key','rapoarte-sectie:'+GROUP+':%').not('doc_key','like','rapoarte-sectie:'+GROUP+':draft:%').eq('content->>date',day).order('updated_at',{ascending:false}).limit(200);if(error)throw error;archiveRows=data||[];$('archive').replaceChildren();archiveRows.forEach((row,i)=>{const o=document.createElement('option');o.value=i;o.textContent=(row.content.name||row.content.template)+' · '+new Date(row.updated_at).toLocaleTimeString('ro-RO')+' · '+(row.content.author||'');$('archive').append(o);});if(!archiveRows.length)$('archive').append(new Option('Niciun raport salvat în această zi',''));}
async function save(){if(!canWrite()||busy)return;if(!$('date').value)throw Error('Completează data raportului.');busy=true;controls();try{const content={schema:1,template:t.id,date:$('date').value,name:$('name').value.trim()||t.title,changes,author:auth.user.email,templateSnapshot:t};const updated_at=new Date().toISOString();let q;
 if(key)q=sb.from('rf_documents').update({content,updated_at}).eq('doc_key',key).eq('updated_at',version).select('doc_key,updated_at');
 else q=sb.from('rf_documents').insert({doc_key:'rapoarte-sectie:'+GROUP+':'+content.date+':'+crypto.randomUUID(),content,updated_at}).select('doc_key,updated_at');
 const {data,error}=await q;if(error)throw error;if(!data?.length)throw Error('Raportul a fost modificat între timp sau nu ai drept de salvare. Redeschide-l din arhivă.');key=data[0].doc_key;version=data[0].updated_at;clearDraft();dirty=false;message('Raport salvat în cloud.');$('archiveDate').value=content.date;await list();
 }finally{busy=false;controls();}}
function action(fn){return async()=>{try{await fn();}catch(e){message('Nu s-a finalizat: '+(e.message||e));}};}
async function init(){
 auth=await root.ERPAuth.requireAuth({redirectToLogin:true,next:'rapoarte-sectie.html'});if(!auth)return;const access=await root.ERPAuth.getPageAccess('rapoarte-sectie',{user:auth.user,role:auth.role});if(!access?.allowed)throw Error(access?.message||'Nu ai acces la această pagină.');perms=access.permissions;sb=root.ERPAuth.getSupabaseClient();
 let modelContents;if(GROUP==='forja'){const resp=await fetch('rapoarte-sectie-forja-modele.json?v=1',{cache:'no-cache'});if(!resp.ok)throw Error('Modelele Forja nu s-au încărcat.');modelContents=await resp.json();}else{const {data:modelRows,error:modelError}=await sb.from('rf_documents').select('content').like('doc_key','rapoarte-sectie:'+GROUP+':template:v1:%');if(modelError)throw modelError;modelContents=(modelRows||[]).map(row=>row.content);}templates=modelContents.map(c=>expandTemplate(c)).sort((a,b)=>(a.order??99)-(b.order??99));if(!templates.length)throw Error('Modelele de raport nu sunt disponibile.');for(const x of templates)$('template').append(new Option(x.title,x.id));if(pageParam('embed'))document.body.classList.add('embed');if(pageParam('template')&&templates.some(x=>x.id===pageParam('template')))$('template').value=pageParam('template');$('archiveDate').value=today();$('app').hidden=false;if(!perms.can_edit)$('delete').hidden=true;$('loading').hidden=true;fresh();loadPlan();loadTeamNames(true);loadReperNames(true);if(/^\d{4}-\d{2}-\d{2}$/.test(pageParam('date'))){$('date').value=pageParam('date');render();}
 $('template').onchange=()=>{if(!key||discard())fresh();else $('template').value=t.id;};$('new').onclick=()=>{if(discard())fresh();};$('date').onchange=()=>{if(!$('date').value){$('date').value=today();}changed();render();};$('name').oninput=changed;
 $('apply').onclick=e=>{e.preventDefault();if(!canWrite())return;const v=$('value').value;changes[editKey]=/^-?\d+([.,]\d+)?$/.test(v)&&!/^0\d/.test(v)?Number(v.replace(',','.')):v;changed();$('editor').close();render();};
 $('save').onclick=action(save);$('reload').onclick=action(list);$('delete').onclick=action(async()=>{const row=archiveRows[Number($('archive').value)];if(!row)throw Error('Alege un raport salvat.');if(!perms.can_edit)throw Error('Nu ai drept să ștergi rapoarte.');if(!confirm('Ștergi raportul „'+(row.content.name||row.content.template)+'”? Nu poate fi recuperat.'))return;const {error}=await sb.from('rf_documents').delete().eq('doc_key',row.doc_key);if(error)throw error;if(key===row.doc_key){key=null;version=null;changes={};dirty=false;fresh();}await list();message('Raport șters din cloud.');});
 $('open').onclick=action(()=>{const row=archiveRows[Number($('archive').value)];if(!row||!discard())return;const d=row.content;if(d.schema!==1)throw Error('Versiune de raport necunoscută.');t=d.templateSnapshot||templates.find(x=>x.id===d.template);changes={...d.changes};key=row.doc_key;version=row.updated_at;$('template').value=t.id;$('date').value=d.date;$('name').value=d.name;dirty=false;render();message('Raport încărcat din cloud.');});
 $('print').onclick=()=>{if(perms.can_export)root.print();};$('export').onclick=action(async()=>{if(!perms.can_export)return;if(!root.ExcelJS)throw Error('Exportul Excel nu s-a încărcat. Reîncarcă pagina.');const wb=await workbook(root.ExcelJS,t,current()),buf=await wb.xlsx.writeBuffer(),url=URL.createObjectURL(new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));const a=document.createElement('a');a.href=url;a.download=('Maxipresa-'+t.id+'-'+$('date').value).replace(/[\\/:*?"<>|]/g,'-')+'.xlsx';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);message('Fișier Excel exportat.');});
 root.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});await list();
}
if(pageParam('embed')){const note=document.createElement('p');note.setAttribute('role','status');const info=()=>{if(!perms)return;const b=document.createElement('p');b.style.cssText='color:#b00020;font-weight:bold;margin:6px 0';b.textContent=canWrite()?'':'Fără drept de completare pe această fișă (can_add='+perms.can_add+', can_edit='+perms.can_edit+', key='+(key?'da':'nu')+')';if(b.textContent)$('app').prepend(b);};setTimeout(info,1500);}
init().catch(e=>{$('loading').hidden=false;$('loading').textContent=e.message||String(e);});
})(typeof window!=='undefined'?window:globalThis);
