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
  this.s.mergeRanges.push({r:this.r,c:this.c,nr:this.nr,nc:this.nc});
  if(this.s.frozenCols>0 && this.c<=this.s.frozenCols && this.c+this.nc-1>this.s.frozenCols){
    errores.push(`${this.s.name}: merge en fila ${this.r} col ${this.c}-${this.c+this.nc-1} cruza el limite de columnas congeladas (${this.s.frozenCols})`);
  }
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
function Sheet(n){this.name=n;this.maxCols=MAXC_DEF;this.mergeRanges=[];this.frozenCols=0;this.maxR=0;this.maxC=0;this.filtros=0;this.hidden=false;this.merged=new Set();this.escrituras=0;}
Sheet.prototype.getRange=function(r,c,nr,nc){return new Range(this,r,c,nr===undefined?1:nr,nc===undefined?1:nc);};
Sheet.prototype.getMaxRows=()=>MAXR; Sheet.prototype.getMaxColumns=function(){return this.maxCols;};
Sheet.prototype.insertColumnsAfter=function(after,n){this.maxCols+=n;return this;};
Sheet.prototype.getName=function(){return this.name;};
Sheet.prototype.getLastRow=function(){return this.maxR;};
Sheet.prototype.getLastColumn=function(){return this.maxC;};
Sheet.prototype.setFrozenColumns=function(n){
  this.frozenCols=n;
  this.mergeRanges.forEach(m=>{
    if(m.c<=n && m.c+m.nc-1>n){
      errores.push(`${this.name}: setFrozenColumns(${n}) choca con un merge en fila ${m.r} col ${m.c}-${m.c+m.nc-1}`);
    }
  });
  return this;
};
['setRowHeight','setColumnWidth','setFrozenRows','setTabColor'].forEach(m=>
  Sheet.prototype[m]=function(a){
    if(m==='setColumnWidth'&&(a<1||a>this.maxCols)) errores.push(`${this.name}: setColumnWidth col ${a} fuera de rango`);
    return this;});
Sheet.prototype.hideSheet=function(){this.hidden=true;return this;};
Sheet.prototype.hideColumns=function(c,n){if(c<1||c>this.maxCols)errores.push(`${this.name}: hideColumns col ${c} fuera de rango`);return this;};

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
const src=require('fs').readFileSync(require('path').join(__dirname,'control_stock_v2.gs'),'utf8');
eval(src);

console.log('--- 1) construirTodo() sobre hoja con datos previos (payroll) ---');
hojas=[new Sheet('Hoja2'), new Sheet('Hoja3')];
try{ construirTodo(); }catch(e){ errores.push('EXCEPCION construirTodo (1a vez): '+e.message); }
console.log('pestanas:',hojas.length);
hojas.forEach(h=>console.log(`  ${h.name.padEnd(24)} filas ${String(h.getLastRow()).padStart(4)} cols ${String(h.getLastColumn()).padStart(2)} combinadas ${String(h.merged.size).padStart(3)}${h.hidden?' (oculta)':''}`));
if(hojas.some(h=>h.name==='Hoja2'||h.name==='Hoja3')) errores.push('quedaron pestanas viejas (Hoja2/Hoja3) sin borrar');
if(hojas.length!==20) errores.push('se esperaban 20 pestanas, hay '+hojas.length);

console.log('\n--- 2) construirTodo() de nuevo sobre el resultado (debe rehacer limpio) ---');
const antes = hojas.length;
try{ construirTodo(); }catch(e){ errores.push('EXCEPCION construirTodo (2a vez): '+e.message); }
console.log('  pestanas antes',antes,'-> despues',hojas.length);
if(hojas.length!==antes) errores.push(`2da corrida dejo ${hojas.length} pestanas, se esperaban ${antes}`);

console.log('\n--- 3) construirTodo() cancelado (no debe tocar nada) ---');
respuesta='NO'; const antes2=hojas.length;
try{ construirTodo(); }catch(e){ errores.push('EXCEPCION al cancelar: '+e.message); }
if(hojas.length!==antes2) errores.push('cancelar construirTodo igual modifico las pestanas');
else console.log('  cancelado sin tocar nada');

console.log('\nERRORES:',errores.length);
[...new Set(errores)].slice(0,20).forEach(e=>console.log('  -',e));
