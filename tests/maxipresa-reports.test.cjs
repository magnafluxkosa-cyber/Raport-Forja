const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');
const {values,workbook}=require('../rapoarte-sectie.js');
const ExcelJS=require('../vendor/exceljs-4.4.0.min.js');
const templates=process.env.KAD_REPORT_TEMPLATES?JSON.parse(fs.readFileSync(process.env.KAD_REPORT_TEMPLATES,'utf8')):require('./maxipresa-synthetic-models.cjs');
(async()=>{
 assert.equal(templates.length,23);
 for(const t of templates){
  const covered=new Set();
  for(const [r,c,er,ec] of t.merges){assert(er<=t.rows&&ec<=t.cols);for(let y=r;y<=er;y++)for(let x=c;x<=ec;x++){const k=x+','+y;assert(!covered.has(k),'Overlapping merge '+t.id+' '+k);covered.add(k);}}
  const data=values(t,{},'2026-11-24');assert.equal(data[t.dateCell],'24.11.2026');
  const wb=await workbook(ExcelJS,t,data);const buffer=await wb.xlsx.writeBuffer();
  const restored=new ExcelJS.Workbook();await restored.xlsx.load(buffer);assert.equal(restored.worksheets.length,1);assert.equal(restored.worksheets[0].getCell(t.dateCell).value.toISOString(),'2026-11-24T00:00:00.000Z');
  assert.equal(restored.worksheets[0].pageSetup.fitToHeight,1);
 }
 const dd=templates.find(t=>t.id==='DD-51');assert.equal(values(dd,{H9:'Operator nou',B4:2},'2026-11-24').B5,'Operator nou');assert.equal(values(dd,{B4:2},'2026-11-24').A9,'MP-2500 SCH 2');assert.equal(values(dd,{},'2026-11-24').C9,'');
 const problems=templates.find(t=>t.id==='DD-03');assert.equal(values(problems,{B9:10,B10:25,G9:8},'2026-11-24').B26,35);assert.equal(values(problems,{G9:8},'2026-11-24').G26,8);
 const t=templates.find(t=>t.id==='417-3596');assert.equal(values(t,{C10:'PT-ABC'},'2026-11-24').C6,'ABC');
 console.log('23 templates: isolated first copies, dates, merged cells, Excel round trips, derived fields passed.');
})().catch(e=>{console.error(e);process.exit(1)});
