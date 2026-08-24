const errores=[]; const MAXR=1000, MAXC_DEF=26;
function key(r,c){return r+':'+c;}
function Range(s,r,c,nr,nc){
  this.s=s;this.r=r;this.c=c;this.nr=nr;this.nc=nc;
  if(r<1||c<1) errores.push(`${s.name}: getRange (${r},${c}) invalido`);
  if(nr<1||nc<1) errores.push(`${s.name}: getRange con 0 filas/cols (${r},${c},${nr},${nc})`);
  if(r+nr-1>MAXR) errores.push(`${s.name}: excede ${MAXR} filas (${r+nr-1})`);
  if(c+nc-1>s.maxCols) errores.push(`${s.name}: excede ${s.maxCols} columnas (${c+nc-1})`);
  s.maxR=Math.max(s.maxR,r+nr-1); s.maxC=Math.max(s.maxC,c+nc-1);
}
['setBackground','setFontColor','setFontWeight','setFontSize','setVerticalAlignment',
 'setHorizontalAlignment','setWrap','setNumberFormat','setFontFamily','setBorder','setValue',
 'setFormula','setDataValidation','setFontStyle'].forEach(m=>Range.prototype[m]=function(){return this;});
Range.prototype.merge=function(){
  for(let r=this.r;r<this.r+this.nr;r++) for(let c=this.c;c<this.c+this.nc;c++){
    if(this.s.merged.has(key(r,c))) errores.push(`${this.s.name}: celda ${r},${c} combinada dos veces`);
    this.s.merged.add(key(r,c));
  }
  return this;
};
Range.prototype.setValues=function(v){
  if(!Array.isArray(v)||!Array.isArray(v[0])){errores.push(`${this.s.name}: setValues sin matriz 2D`);return this;}
  if(v.length!==this.nr) errores.push(`${this.s.name}: setValues filas ${v.length}!=${this.nr} en (${this.r},${this.c})`);
  if(v[0].length!==this.nc) errores.push(`${this.s.name}: setValues cols ${v[0].length}!=${this.nc} en (${this.r},${this.c})`);
  v.forEach((f,i)=>{if(f.length!==v[0].length)errores.push(`${this.s.name}: fila ${i} de setValues largo distinto`);});
  this.s.escrituras+=v.length;
  return this;
};
Range.prototype.setFormulas=function(v){
  if(v.length!==this.nr) errores.push(`${this.s.name}: setFormulas filas ${v.length}!=${this.nr}`);
  if(v[0].length!==this.nc) errores.push(`${this.s.name}: setFormulas cols ${v[0].length}!=${this.nc}`);
  return this;
};
Range.prototype.createFilter=function(){
  this.s.filtros++;
  if(this.s.filtros>1) errores.push(`${this.s.name}: mas de un filtro`);
  for(let c=this.c;c<this.c+this.nc;c++)
    if(this.s.merged.has(key(this.r,c)))
      errores.push(`${this.s.name}: FILTRO sobre celda combinada en la fila ${this.r}, col ${c}`);
  return this;
};
function Sheet(n){this.name=n;this.maxCols=MAXC_DEF;this.maxR=0;this.maxC=0;this.filtros=0;this.hidden=false;this.merged=new Set();this.escrituras=0;}
Sheet.prototype.getRange=function(r,c,nr,nc){return new Range(this,r,c,nr===undefined?1:nr,nc===undefined?1:nc);};
Sheet.prototype.getMaxRows=()=>MAXR; Sheet.prototype.getMaxColumns=function(){return this.maxCols;};
Sheet.prototype.insertColumnsAfter=function(after,n){this.maxCols+=n;return this;};
Sheet.prototype.getName=function(){return this.name;};
Sheet.prototype.getLastRow=function(){return this.maxR;};
Sheet.prototype.getLastColumn=function(){return this.maxC;};
['setRowHeight','setColumnWidth','setFrozenRows','setFrozenColumns','setTabColor'].forEach(m=>
  Sheet.prototype[m]=function(a){
    if(m==='setColumnWidth'&&(a<1||a>this.maxCols)) errores.push(`${this.name}: setColumnWidth col ${a} fuera de rango`);
    return this;});
Sheet.prototype.hideSheet=function(){this.hidden=true;return this;};

let hojas=[];
const ss={
  insertSheet(n){ if(hojas.some(h=>h.name===n)) errores.push(`pestana duplicada: ${n}`);
                  const h=new Sheet(n); hojas.push(h); return h; },
  getSheets(){return hojas.slice();},
  getSheetByName(n){return hojas.find(h=>h.name===n)||null;},
  deleteSheet(h){const i=hojas.indexOf(h); if(i<0){errores.push('deleteSheet de hoja inexistente');return;} hojas.splice(i,1);
                 if(hojas.length===0) errores.push('se borro la ultima hoja: Sheets no lo permite');},
  setActiveSheet(h){ if(!h) errores.push('setActiveSheet recibio null'); }
};
let respuesta='YES';
global.SpreadsheetApp={
  getActiveSpreadsheet:()=>ss,
  newDataValidation:()=>({requireValueInRange(r){if(!(r instanceof Range))errores.push('requireValueInRange sin Range');return this;},
    requireValueInList(l){if(!Array.isArray(l))errores.push('requireValueInList sin array');return this;},
    setAllowInvalid(){return this;},build(){return {};}}),
  BorderStyle:{SOLID:'solid'},
  getUi:()=>({alert(a,b,c){return respuesta;},ButtonSet:{YES_NO:'yn'},Button:{YES:'YES',NO:'NO'}})
};
const src=require('fs').readFileSync('/home/user/cande/planillas/crear_en_sheets.gs','utf8');
eval(src);

console.log('--- 1) crearPlanilla() en hoja vacia ---');
hojas=[new Sheet('Hoja 1')];
try{ crearPlanilla(); }catch(e){ errores.push('EXCEPCION crearPlanilla: '+e.message); }
console.log('pestanas:',hojas.length);
hojas.forEach(h=>console.log(`  ${h.name.padEnd(22)} filas ${String(h.getLastRow()).padStart(4)} cols ${String(h.getLastColumn()).padStart(2)} combinadas ${String(h.merged.size).padStart(3)}${h.hidden?' (oculta)':''}`));

console.log('\n--- 2) crearPlanilla() sobre una planilla ya creada (debe rechazar) ---');
let rechazo=false;
try{ crearPlanilla(); }catch(e){ rechazo=true; console.log('  rechazado correctamente'); }
if(!rechazo) errores.push('crearPlanilla NO rechazo una planilla ya existente');

console.log('\n--- 3) recrearPlanilla() (debe borrar y rehacer) ---');
const antes=hojas.length;
try{ recrearPlanilla(); }catch(e){ errores.push('EXCEPCION recrearPlanilla: '+e.message); }
console.log('  pestanas antes',antes,'-> despues',hojas.length);
if(hojas.length!==antes) errores.push(`recrearPlanilla dejo ${hojas.length} pestanas, se esperaban ${antes}`);

console.log('\n--- 4) recrearPlanilla() cancelado (no debe tocar nada) ---');
respuesta='NO'; const antes2=hojas.length;
try{ recrearPlanilla(); }catch(e){ errores.push('EXCEPCION al cancelar: '+e.message); }
if(hojas.length!==antes2) errores.push('cancelar recrearPlanilla igual modifico las pestanas');
else console.log('  cancelado sin tocar nada');

console.log('\nERRORES:',errores.length);
[...new Set(errores)].slice(0,20).forEach(e=>console.log('  -',e));
