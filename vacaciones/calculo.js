/* Cálculo de días de vacaciones — lo usan las dos páginas:
   - vacaciones/index.html (Gerencia: balance, pedidos, calendario)
   - vacaciones/pedido.html (el formulario que llena cada persona)
   Así las dos muestran siempre el mismo número. Si se suma o se saca a alguien, se cambia acá.

   Ley de Contrato de Trabajo:
   - Art. 150: 14 días corridos si la antigüedad al 31/12 del año no excede 5 años; 21 si no excede 10;
     28 si no excede 20; 35 si excede 20. "Exceder" = pasar el aniversario (5 años y 1 día ya son 21).
   - Art. 151: para el período completo hay que haber trabajado al menos la mitad del año. Con una
     semana de trabajo fija (6 días), la mitad de los días hábiles equivale a la mitad del año corrido.
   - Art. 153: si no llega, 1 día de vacaciones cada 20 días de trabajo EFECTIVO. Los francos no son
     trabajo efectivo: se cuentan DIAS_TRABAJO_SEMANA de cada 7 días corridos.
   - Las vacaciones que se toman durante un año corresponden al período (año) anterior: lo que se toma
     de noviembre 2026 a diciembre 2027 sale del período 2026. */
"use strict";

// fecha de ingreso de cada persona (aprox:true = fecha aproximada). Si la antigüedad reconocida es
// otra, se corrige desde el balance (✎ junto a "ingresó"), sin tocar esta lista.
const PEOPLE=[
  {n:"Lucía",ingreso:"2023-12-01"},
  {n:"Luciana",ingreso:"2023-12-01"},
  {n:"Gabriel",ingreso:"2024-06-01"},
  // Leandro Villagra, el barista — no confundir con Leandro Tolaba (producción/Cuadra, más abajo).
  {n:"Leandro Villagra",ingreso:"2026-06-15"},
  {n:"Leandro Tolaba",ingreso:"2024-08-01"},
  {n:"Mariano",ingreso:"2025-10-01"},
  {n:"Luis",ingreso:"2023-12-01"},
  {n:"Vanesa",ingreso:"2025-06-18"},
  {n:"Rodrigo",ingreso:"2024-01-01"},
  {n:"Lucas",ingreso:"2024-05-01"},
  {n:"Matías",ingreso:"2026-06-01",aprox:true},
  {n:"Lázaro",ingreso:"2025-01-01",aprox:true},
  {n:"Gonzalo",ingreso:"2025-01-01",aprox:true},
  {n:"Jhon",ingreso:"2026-06-01",aprox:true},
  {n:"Natalia",ingreso:"2019-11-21"},
  {n:"Javier",ingreso:"2019-11-21"},
  {n:"Aaron",ingreso:"2023-12-01"},
  {n:"Érica",ingreso:"2019-11-21"},
  {n:"Paula",ingreso:"2022-10-05"},
  {n:"Margarita",ingreso:"2023-01-01"},
  {n:"Brenda",ingreso:"2024-04-01"},
  {n:"Valentina",ingreso:"2024-08-08"},
  {n:"Guadalupe",ingreso:"2024-04-24"},
  {n:"Dana",ingreso:"2024-08-06"},
  {n:"Milagros",ingreso:"2023-12-01"},
  {n:"Zoe",ingreso:"2024-08-01"},
  {n:"Rebeca",ingreso:"2024-06-01"},
  // sumados desde la planilla de personal (RRHH)
  {n:"Hugo",ingreso:"2019-11-21"},
  {n:"Tamara",ingreso:"2022-10-16"},
  {n:"Magali",ingreso:"2023-02-13"},
  {n:"Juan",ingreso:"2025-07-17"},
  {n:"Laura",ingreso:"2022-02-02"},
  {n:"Tatiana",ingreso:"2023-10-01"},
  {n:"Walter",ingreso:"2022-02-23"},
];
const BY_NAME=Object.fromEntries(PEOPLE.map(p=>[p.n,p]));
const PRIMER_PERIODO=2025; // el balance arranca acá (saldo 2025/26 + lo que se va sumando)
const DIAS_TRABAJO_SEMANA=6; // 1 franco por semana, igual que en Cronogramas

const MS_DIA=86400000;
function fecha(iso){return new Date(iso+"T00:00:00");}
function hoy(){return new Date();}
function diffDias(a,b){return Math.round((b-a)/MS_DIA);}
function sumarAnios(d,n){const x=new Date(d.getTime());x.setFullYear(x.getFullYear()+n);return x;}
function rangoDias(desdeISO,hastaISO){return diffDias(fecha(desdeISO),fecha(hastaISO))+1;}

// art. 150 — días según la antigüedad a una fecha (el 31/12 del período)
function tramoAl(ingreso,al){
  if(al>sumarAnios(ingreso,20))return 35;
  if(al>sumarAnios(ingreso,10))return 28;
  if(al>sumarAnios(ingreso,5))return 21;
  return 14;
}
function diasCorresponden(ingresoISO,anio){
  if(!ingresoISO)return{dias:0,proporcional:false,diasTrabajados:0,tramo:0};
  const ingreso=fecha(ingresoISO);
  const inicioAnio=fecha(anio+"-01-01");
  const finAnio=fecha(anio+"-12-31");
  if(ingreso>finAnio)return{dias:0,proporcional:false,diasTrabajados:0,tramo:0};
  const tramo=tramoAl(ingreso,finAnio);
  const desde=ingreso>inicioAnio?ingreso:inicioAnio;
  const diasTrabajados=diffDias(desde,finAnio)+1;          // corridos, desde el ingreso
  const diasAnio=diffDias(inicioAnio,finAnio)+1;           // 365 o 366
  if(2*diasTrabajados>=diasAnio)                            // art. 151: al menos la mitad del año
    return{dias:tramo,proporcional:false,anioIncompleto:ingreso>inicioAnio,diasTrabajados,tramo};
  const diasEfectivos=Math.floor(diasTrabajados*DIAS_TRABAJO_SEMANA/7); // art. 153: sin los francos
  return{dias:Math.floor(diasEfectivos/20),proporcional:true,diasTrabajados,diasEfectivos,tramo};
}

// Con el estado guardado (ajustes a mano y vacaciones cargadas). `st` es vacaciones/state.
function ingresoDe(st,name){
  const p=BY_NAME[name];if(!p)return null;
  return (st&&st.ingresos&&st.ingresos[name])||p.ingreso;
}
function correspondeCon(st,name,anio){
  if(!BY_NAME[name])return{dias:0,proporcional:false,manual:false};
  const o=st&&st.overrides&&st.overrides[name];
  if(o&&o[anio]!=null)return{dias:o[anio],proporcional:false,manual:true};
  return diasCorresponden(ingresoDe(st,name),anio);
}
function tomadoCalculadoCon(st,name,periodo){
  return ((st&&st.taken)||[]).filter(t=>t.n===name&&t.periodo===periodo).reduce((s,t)=>s+rangoDias(t.desde,t.hasta),0);
}
function tomadoCon(st,name,periodo){
  const o=st&&st.overridesTomado&&st.overridesTomado[name];
  if(o&&o[periodo]!=null)return{dias:o[periodo],manual:true};
  return{dias:tomadoCalculadoCon(st,name,periodo),manual:false};
}
function saldoCon(st,name,periodo){return correspondeCon(st,name,periodo).dias-tomadoCon(st,name,periodo).dias;}
// períodos que se llevan en el balance para esa persona, hasta `hasta` inclusive
function periodosDe(st,name,hasta){
  const ing=ingresoDe(st,name);if(!ing)return[];
  const arr=[];for(let y=Math.max(fecha(ing).getFullYear(),PRIMER_PERIODO);y<=hasta;y++)arr.push(y);
  return arr;
}
// lo que tiene para pedir en las vacaciones que se toman durante `anioGoce`: el período anterior más
// lo que le quede de períodos más viejos
function disponibleParaGoce(st,name,anioGoce){
  const periodo=anioGoce-1;
  const c=correspondeCon(st,name,periodo);
  const tomado=tomadoCon(st,name,periodo).dias;
  const anteriores=periodosDe(st,name,periodo-1).reduce((s,y)=>s+Math.max(0,saldoCon(st,name,y)),0);
  return{periodo,corresponde:c.dias,proporcional:!!c.proporcional,manual:!!c.manual,tomado,anteriores,
    total:Math.max(0,c.dias-tomado)+anteriores};
}
