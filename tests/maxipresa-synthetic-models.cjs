// Public test fixtures contain no source workbook contents or operator identities.
module.exports=Array.from({length:23},(_,i)=>{
 const id=['DD-03','DD-51','417-3596'][i]||'TEST-'+i,cells={};
 for(let r=1;r<=58;r++)for(let c=1;c<=11;c++)cells[String.fromCharCode(64+c)+r]={v:'',font:{size:10,bold:false,color:'#000000'},fill:'#ffffff',align:'left',border:{top:true,bottom:true,left:true,right:true}};
 if(id==='DD-51'){cells.B5.formula='=H9';cells.A9.formula='SHIFT';cells.B4.v=1;}
 if(id==='DD-03'){cells.B26.formula='=SUM(B9:B25)';cells.G26.formula='=SUM(G9:G25)';cells.G1.formula='=B1';}
 if(id==='417-3596')cells.C6.formula='=RIGHT(C10,3)';
 return {id,title:'Formular test '+i,dateCell:id==='DD-03'?'B1':id==='DD-51'?'B3':'C1',rows:58,cols:11,widths:Array(11).fill(10),heights:Array(58).fill(15),cells,merges:[[56,10,56,11]],images:[]};
});
