const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');const path=require('node:path');
const base=process.env.KAD_REPO||path.join(__dirname,'..');
const pages=['imbunatatire-continua.html','supabase/functions/rf-protected-page/pages/imbunatatire-continua.html','supabase/functions/rf-protected-page-4/pages/imbunatatire-continua.html'];
function fn(source,name,next){return source.slice(source.indexOf('    '+name),source.indexOf('    '+next,source.indexOf('    '+name)));}
for(const file of pages){
 test(file+': ACL initialization and Add open the form without a missing fallback',async()=>{
  const source=fs.readFileSync(path.join(base,file),'utf8');const el=()=>({value:'',disabled:false,classList:{add(v){this[v]=true},toggle(){}},setAttribute(k,v){this[k]=v},focus(){}});const dom=new Proxy({},{get:(o,k)=>o[k]||(o[k]=el())});
  let acl={allowed:true,permissions:{can_view:true,can_add:true,can_edit:false,can_delete:false}};
  const context={state:{user:{id:'test'},role:'viewer',selectedId:null},dom,window:{ERPAuth:{getPageAccess:async(page)=>{assert.equal(page,'imbunatatire-continua');return acl;}},location:{}},alert(){},console:{error(){}},setBadge(){},currentDateString:()=> '25.11.2026',updateComputedFields(){},setTimeout(fn){fn()}};
  vm.createContext(context);vm.runInContext(fn(source,'function applyPermissionsToUi()','function updateSelectedRowUi()')+fn(source,'async function resolvePagePermissions()','function rowsFromPayload')+fn(source,'function openModal(','function closeModal()'),context);
  await context.resolvePagePermissions();assert.equal(dom.btnAdd.disabled,false);assert.equal(context.state.permissions.canEdit,false);assert.equal(context.state.permissions.canDelete,false);
  context.openModal();assert.equal(dom.editModal.classList.open,true);assert.equal(dom.editModal['aria-hidden'],'false');
  acl={allowed:true,permissions:{can_view:true,can_add:false,can_edit:false,can_delete:false}};await context.resolvePagePermissions();assert.equal(dom.btnAdd.disabled,true);
  acl={allowed:false,permissions:{can_view:true,can_add:true}};await context.resolvePagePermissions();assert.equal(dom.btnAdd.disabled,true);
  context.window.ERPAuth.getPageAccess=async()=>{throw Error('unavailable')};await context.resolvePagePermissions();assert.equal(dom.btnAdd.disabled,true);
 });
}
