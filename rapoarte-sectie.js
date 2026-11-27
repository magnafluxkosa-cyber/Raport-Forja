(function(root){
'use strict';
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
async function loadPlan(){try{const {data}=await sb.from('rf_documents').select('content').eq('doc_key','planificare-forja').maybeSingle();planRows=data?.content?.rows||null;if(t&&t.id==='DD-51')render();}catch(e){planRows=null;}}
function controls(){for(const id of ['save','new','export','print','template','date','name'])$(id).disabled=busy||(['export','print'].includes(id)?!perms.can_export:id==='new'||id==='template'?!perms.can_add:!canWrite());}
function changed(){dirty=true;message('Modificări nesalvate.');}
function render(){
 const data=current();if(t.id==='DD-51'&&!('C52' in changes)){const a=nextMpReper($('date').value);if(a)data.C52=a;}const width=t.widths.reduce((s,w)=>s+w*7+5,0),height=t.heights.reduce((s,h)=>s+h*4/3,0),scale=Math.min(724/width,1000/height),printScale=Math.min(718/width,1030/height);
 $('sheet').replaceChildren();$('sheet').style.width=width+'px';$('sheet').style.transform='scale('+scale+')';$('paper').style.height=(height*scale+36)+'px';$('paper').style.setProperty('--print-scale',printScale);
 const table=document.createElement('table');table.className='report';table.style.width=width+'px';const cg=document.createElement('colgroup');t.widths.forEach(w=>{const c=document.createElement('col');c.style.width=(w*7+5)+'px';cg.append(c);});table.append(cg);
 const hidden=new Set(),spans={};for(const [r,c,er,ec] of t.merges){spans[col(c)+r]=[er-r+1,ec-c+1];for(let y=r;y<=er;y++)for(let x=c;x<=ec;x++)if(x!==c||y!==r)hidden.add(col(x)+y);}
 for(let r=1;r<=t.rows;r++)for(let c=t.cols;c>=1;c--){const addr=col(c)+r;if(hidden.has(addr)||spans[addr]||addr===t.dateCell)continue;if(String(data[addr]??'').trim().length<=25)continue;let last=c;while(last<t.cols){const nx=col(last+1)+r;if(hidden.has(nx)||spans[nx]||String(data[nx]??'')!==''||t.cells[nx]?.formula)break;last++;}if(last>c){spans[addr]=[1,last-c+1];for(let x=c+1;x<=last;x++)hidden.add(col(x)+r);}}
 for(let r=1;r<=t.rows;r++){const tr=document.createElement('tr');tr.style.height=t.heights[r-1]*4/3+'px';for(let c=1;c<=t.cols;c++){const addr=col(c)+r;if(hidden.has(addr))continue;const cell=t.cells[addr],td=document.createElement('td');if(spans[addr])[td.rowSpan,td.colSpan]=spans[addr];td.style.background=cell.fill;for(const side of Object.keys(cell.border))td.style['border'+side[0].toUpperCase()+side.slice(1)]=cell.border[side]?'1px solid #222':'none';const div=document.createElement('div');div.className='text';div.textContent=data[addr];Object.assign(div.style,{fontSize:cell.font.size*4/3+'px',fontWeight:cell.font.bold?'bold':'normal',fontStyle:cell.font.italic?'italic':'normal',color:(addr in changes&&!reperAddr(addr))?'#1d4ed8':cell.font.color,fontFamily:(addr in changes&&!reperAddr(addr))?"'Segoe Print','Comic Sans MS',cursive":'',justifyContent:cell.align==='center'?'center':cell.align==='right'?'flex-end':'flex-start'});td.append(div);if(canWrite()&&addr!==t.dateCell){td.className='editable';td.tabIndex=0;td.setAttribute('aria-label','Completează '+(String(data[addr]||'câmp gol')));td.onclick=()=>{edit(addr);};td.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();edit(addr);}};}tr.append(td);}table.append(tr);}
 $('sheet').append(table);$('paper').style.setProperty('--print-height',(height*printScale+2)+'px');
 for(const im of t.images){const img=document.createElement('img');img.className='drawing';img.alt='Desen reper';img.src=im.data;Object.assign(img.style,{left:(t.widths.slice(0,im.col).reduce((s,w)=>s+w*7+5,0)+im.colOff)+'px',top:(t.heights.slice(0,im.row).reduce((s,h)=>s+h*4/3,0)+im.rowOff)+'px',width:im.width+'px',height:im.height+'px'});$('sheet').append(img);}
 controls();
}
function reperName(id){return String(id??'').trim().replace(/^FC-(FR-)?/,'');}
function reperAddr(addr){return t.id==='DD-51'&&/^B\d+$/.test(addr);}
function autocontrolFor(reper){const v=String(reper??'').trim();if(!v)return null;return templates.find(x=>x.id===v)||templates.find(x=>x.id.endsWith('-'+v))||null;}
function edit(addr){if(!canWrite()||busy)return;editKey=addr;$('value').value=current()[addr];$('computed').textContent=t.cells[addr].formula?'Acest câmp este calculat. Dacă îl completezi manual, valoarea introdusă va fi folosită în acest raport.':'';const reperMode=t.id==='DD-51'&&/^B\d+$/.test(addr);let sel=$('reperSel');if(!sel){sel=document.createElement('select');sel.id='reperSel';sel.style.cssText='width:100%;padding:8px;font:inherit;margin-top:6px';$('value').before(sel);}sel.hidden=!reperMode;$('value').hidden=reperMode;if(reperMode){sel.innerHTML='';sel.append(new Option('— alege reperul —',''));for(const x of templates.filter(x=>x.id!=='DD-51')){const n=reperName(x.id);sel.append(new Option(n,n));}const cur=reperName(current()[addr]);sel.value=[...sel.options].some(o=>o.value===cur)?cur:'';sel.onchange=()=>{$('value').value=sel.value;};$('value').value=sel.value;}$('editor').showModal();if(reperMode)sel.focus();else $('value').focus();}
function discard(){return !dirty||confirm('Există modificări nesalvate. Continui fără să le salvezi?');}
function fresh(){t=templates.find(x=>x.id===$('template').value);changes={};key=null;version=null;dirty=false;$('name').value=t.title;$('date').value=today();render();message('Raport nou. Completează și salvează pentru a-l păstra.');}
async function list(){const day=$('archiveDate').value;if(!day)return;const {data,error}=await sb.from('rf_documents').select('doc_key,content,updated_at').like('doc_key','rapoarte-sectie:maxipresa:%').eq('content->>date',day).order('updated_at',{ascending:false}).limit(200);if(error)throw error;archiveRows=data||[];$('archive').replaceChildren();archiveRows.forEach((row,i)=>{const o=document.createElement('option');o.value=i;o.textContent=(row.content.name||row.content.template)+' · '+new Date(row.updated_at).toLocaleTimeString('ro-RO')+' · '+(row.content.author||'');$('archive').append(o);});if(!archiveRows.length)$('archive').append(new Option('Niciun raport salvat în această zi',''));}
async function save(){if(!canWrite()||busy)return;if(!$('date').value)throw Error('Completează data raportului.');busy=true;controls();try{const content={schema:1,template:t.id,date:$('date').value,name:$('name').value.trim()||t.title,changes,author:auth.user.email,templateSnapshot:t};const updated_at=new Date().toISOString();let q;
 if(key)q=sb.from('rf_documents').update({content,updated_at}).eq('doc_key',key).eq('updated_at',version).select('doc_key,updated_at');
 else q=sb.from('rf_documents').insert({doc_key:'rapoarte-sectie:maxipresa:'+content.date+':'+crypto.randomUUID(),content,updated_at}).select('doc_key,updated_at');
 const {data,error}=await q;if(error)throw error;if(!data?.length)throw Error('Raportul a fost modificat între timp sau nu ai drept de salvare. Redeschide-l din arhivă.');key=data[0].doc_key;version=data[0].updated_at;dirty=false;message('Raport salvat în cloud.');$('archiveDate').value=content.date;await list();
 }finally{busy=false;controls();}}
function action(fn){return async()=>{try{await fn();}catch(e){message('Nu s-a finalizat: '+(e.message||e));}};}
async function init(){
 auth=await root.ERPAuth.requireAuth({redirectToLogin:true,next:'rapoarte-sectie.html'});if(!auth)return;const access=await root.ERPAuth.getPageAccess('rapoarte-sectie',{user:auth.user,role:auth.role});if(!access?.allowed)throw Error(access?.message||'Nu ai acces la această pagină.');perms=access.permissions;sb=root.ERPAuth.getSupabaseClient();
 const {data:modelRows,error:modelError}=await sb.from('rf_documents').select('content').like('doc_key','rapoarte-sectie:maxipresa:template:v1:%');if(modelError)throw modelError;templates=(modelRows||[]).map(row=>expandTemplate(row.content)).sort((a,b)=>(a.order??99)-(b.order??99));if(!templates.length)throw Error('Modelele de raport nu sunt disponibile.');for(const x of templates)$('template').append(new Option(x.title,x.id));if(pageParam('embed'))document.body.classList.add('embed');if(pageParam('template')&&templates.some(x=>x.id===pageParam('template')))$('template').value=pageParam('template');$('archiveDate').value=today();$('app').hidden=false;$('loading').hidden=true;fresh();loadPlan();if(/^\d{4}-\d{2}-\d{2}$/.test(pageParam('date'))){$('date').value=pageParam('date');render();}
 $('template').onchange=()=>{if(discard())fresh();else $('template').value=t.id;};$('new').onclick=()=>{if(discard())fresh();};$('date').onchange=()=>{if(!$('date').value){$('date').value=today();}changed();render();};$('name').oninput=changed;
 $('apply').onclick=e=>{e.preventDefault();if(!canWrite())return;const v=$('value').value;changes[editKey]=/^-?\d+([.,]\d+)?$/.test(v)&&!/^0\d/.test(v)?Number(v.replace(',','.')):v;changed();$('editor').close();render();};
 $('save').onclick=action(save);$('reload').onclick=action(list);$('open').onclick=action(()=>{const row=archiveRows[Number($('archive').value)];if(!row||!discard())return;const d=row.content;if(d.schema!==1)throw Error('Versiune de raport necunoscută.');t=d.templateSnapshot||templates.find(x=>x.id===d.template);changes={...d.changes};key=row.doc_key;version=row.updated_at;$('template').value=t.id;$('date').value=d.date;$('name').value=d.name;dirty=false;render();message('Raport încărcat din cloud.');});
 $('print').onclick=()=>{if(perms.can_export)root.print();};$('export').onclick=action(async()=>{if(!perms.can_export)return;if(!root.ExcelJS)throw Error('Exportul Excel nu s-a încărcat. Reîncarcă pagina.');const wb=await workbook(root.ExcelJS,t,current()),buf=await wb.xlsx.writeBuffer(),url=URL.createObjectURL(new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));const a=document.createElement('a');a.href=url;a.download=('Maxipresa-'+t.id+'-'+$('date').value).replace(/[\\/:*?"<>|]/g,'-')+'.xlsx';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);message('Fișier Excel exportat.');});
 root.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});await list();
}
if(pageParam('embed')){const note=document.createElement('p');note.setAttribute('role','status');const info=()=>{if(!perms)return;const b=document.createElement('p');b.style.cssText='color:#b00020;font-weight:bold;margin:6px 0';b.textContent=canWrite()?'':'Fără drept de completare pe această fișă (can_add='+perms.can_add+', can_edit='+perms.can_edit+', key='+(key?'da':'nu')+')';if(b.textContent)$('app').prepend(b);};setTimeout(info,1500);}
init().catch(e=>{$('loading').hidden=false;$('loading').textContent=e.message||String(e);});
})(typeof window!=='undefined'?window:globalThis);
