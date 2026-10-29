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
// `n` es la clave con la que se guarda todo (no cambiarla); `ap` es el apellido, solo para mostrar
// el nombre completo en el formulario y que nadie elija a otra persona por error.
// Fechas de ingreso: "Datos Personales de Empleados.xlsx" (Drive, carpeta Info de Personal).
const PEOPLE=[
  {n:"Lucía",ap:"Altamirano",ingreso:"2023-12-01"},
  {n:"Luciana",ap:"Maizares",ingreso:"2023-12-01"},
  {n:"Gabriel",ap:"Cruz",ingreso:"2024-06-01"},
  // (Leandro Villagra, el barista, dejó el equipo en oct 2026)
  {n:"Leandro Tolaba",ingreso:"2024-08-01"},
  {n:"Mariano",ap:"Martinegro",ingreso:"2025-10-01",aprox:true},
  {n:"Luis",ap:"Comune",ingreso:"2023-12-01"},
  {n:"Vanesa",ap:"Gerónimo",ingreso:"2025-06-18"},
  {n:"Rodrigo",ap:"Guaymas",ingreso:"2024-01-01"},
  {n:"Lucas",ap:"Ruiz",ingreso:"2024-05-01"},
  {n:"Matías",ap:"Copa",ingreso:"2026-06-04"},
  {n:"Lázaro",ap:"Liendro",ingreso:"2025-01-01",aprox:true},
  {n:"Gonzalo",ap:"Guaymas",ingreso:"2025-06-01"},
  {n:"Jhon",ingreso:"2026-06-01",aprox:true},
  {n:"Natalia",ap:"Geracaris",ingreso:"2019-11-21"},
  {n:"Javier",ap:"Borda",ingreso:"2019-11-21"},
  {n:"Aaron",ap:"Liendro",ingreso:"2023-12-01"},
  {n:"Érica",ap:"Ruiz",ingreso:"2019-11-21"},
  {n:"Paula",ap:"Escobar",ingreso:"2022-10-05"},
  {n:"Margarita",ap:"Rodríguez",ingreso:"2023-01-01"},
  {n:"Brenda",ap:"Ataco",ingreso:"2024-04-01"},
  {n:"Valentina",ap:"Nuñez",ingreso:"2024-08-08"},
  {n:"Guadalupe",ap:"Valencia",ingreso:"2024-04-24"},
  {n:"Dana",ap:"Villarroel",ingreso:"2024-08-01"},
  {n:"Milagros",ap:"Guantay",ingreso:"2023-12-01"},
  {n:"Zoe",ap:"Angel",ingreso:"2024-08-01"},
  {n:"Rebeca",ap:"Márquez",ingreso:"2024-06-01"},
  // sumados desde la planilla de personal (RRHH)
  {n:"Hugo",ap:"Yegro",ingreso:"2019-11-21"},
  {n:"Tamara",ap:"Yegro",ingreso:"2022-10-16"},
  {n:"Magali",ap:"Rasedo",ingreso:"2023-02-13"},
  {n:"Juan",ap:"Baracat",ingreso:"2025-07-17"},
  {n:"Laura",ap:"Mansilla",ingreso:"2022-02-02"},
  {n:"Tatiana",ap:"Yegro",ingreso:"2023-10-01"},
  {n:"Walter",ap:"Martínez",ingreso:"2022-02-23"},
];
const BY_NAME=Object.fromEntries(PEOPLE.map(p=>[p.n,p]));
// Puesto de cada uno (el mismo de Cronogramas), para ver en el planificador quiénes del MISMO
// puesto piden las mismas fechas. Quien no figura acá va a "Otros".
const PUESTOS={caja:"Caja",atencion:"Atención",barra:"Barra",cocina:"Cocina",ayudante:"Ayudante de cocina",compras:"Compras",
  pasteleria:"Pastelería",panaderia:"Panadería",administracion:"Administración",otros:"Otros"};
const PUESTO_DE={
  Natalia:"caja",Javier:"caja",Aaron:"caja",
  "Érica":"atencion",Paula:"atencion",Margarita:"atencion",Brenda:"atencion",Valentina:"atencion",
  Guadalupe:"atencion",Dana:"atencion",Milagros:"atencion",Zoe:"atencion",Rebeca:"atencion",
  Luciana:"barra",Gabriel:"barra",Mariano:"barra","Lucía":"barra",
  Luis:"cocina",Vanesa:"cocina",Lucas:"cocina","Matías":"cocina",Gonzalo:"cocina",
  "Lázaro":"ayudante",Jhon:"ayudante",
  Rodrigo:"compras",
  "Leandro Tolaba":"pasteleria",Hugo:"pasteleria",Tatiana:"pasteleria",Tamara:"pasteleria",Laura:"pasteleria",
  Walter:"panaderia",Juan:"panaderia",
  Magali:"administracion",
};
function puestoDe(n){return PUESTO_DE[n]||"otros";}
function nombreCompleto(n){const p=BY_NAME[n];return p&&p.ap?`${n} ${p.ap}`:n;}
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
// días del período que se pagaron en vez de tomarse: no van al calendario pero sí descuentan
function pagadosCon(st,name,periodo){
  const p=st&&st.pagados&&st.pagados[name];
  return (p&&+p[periodo])||0;
}
function tomadoCalculadoCon(st,name,periodo){
  return ((st&&st.taken)||[]).filter(t=>t.n===name&&t.periodo===periodo).reduce((s,t)=>s+rangoDias(t.desde,t.hasta),0)
    +pagadosCon(st,name,periodo);
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

/* ---------------- PLANILLA "Vacaciones.xlsx" (Drive, carpeta Vacaciones, actualizada el 22/10/2026) ----------------
   Es el registro de Gerencia y manda sobre el cálculo de la ley cuando no coinciden:
   - Período 2025: lo que le corresponde a cada uno INCLUYE los días adeudados de años anteriores
     ("Dias Adeud") y los extra; los tramos son las fechas que se tomó y `pagados` los días que se
     pagaron en vez de tomarse.
   - Período 2026: solo se fija donde la planilla no coincide con la ley (28 días a quienes la empresa
     reconoce más antigüedad; 10 a quienes entraron en junio de 2026).
   Se aplica una sola vez sobre el estado guardado (queda marcado en `planillas`): lo que Gerencia
   corrija después a mano no se vuelve a pisar. Reemplaza las semillas viejas de 2025, que se habían
   armado desde calendarios escaneados. */
const PLANILLA_VAC={
  clave:"vacaciones-xlsx-2026-10-22",
  semillasViejas:["seed-2026-v1","seed-nov2025-abr2026-v1","seed-personal-adicional-v1"],
  p2025:{
    "Aaron":{c:14,t:[["2026-03-02","2026-03-15"]]},
    "Érica":{c:28,t:[["2026-10-10","2026-10-10"],["2026-11-17","2026-12-01"]],pag:12},
    "Hugo":{c:28,t:[["2026-03-02","2026-03-28"]]},
    "Javier":{c:57,t:[["2026-02-02","2026-03-01"],["2026-07-13","2026-07-26"]]},
    "Laura":{c:14,t:[["2025-12-09","2025-12-10"],["2026-02-01","2026-02-12"]]},
    "Magali":{c:14,t:[["2026-03-18","2026-03-28"]]},
    "Margarita":{c:15,t:[["2026-03-24","2026-04-07"]]},
    "Natalia":{c:28,t:[["2026-03-02","2026-03-29"]]},
    "Paula":{c:14,t:[["2026-02-01","2026-02-14"]]},
    "Tamara":{c:14,t:[["2026-03-16","2026-03-22"],["2026-10-21","2026-10-27"]]},
    "Vanesa":{c:14,t:[["2026-03-02","2026-03-15"]]},
    "Walter":{c:14,t:[["2026-02-26","2026-02-27"]],pag:12},
    "Guadalupe":{c:14,t:[["2026-10-29","2026-10-31"]],pag:7},
    "Juan":{c:14,t:[["2026-02-02","2026-02-15"]]},
    "Tatiana":{c:14,t:[["2026-07-13","2026-07-19"]]},
    "Leandro Tolaba":{c:14,t:[["2026-02-16","2026-02-17"]],pag:12},
    "Dana":{c:14,t:[["2026-04-13","2026-04-26"]]},
    "Valentina":{c:14,t:[["2026-03-30","2026-04-12"]]},
    "Luciana":{c:20,t:[["2026-02-24","2026-03-03"],["2026-09-03","2026-09-10"]]},
    "Zoe":{c:26,t:[["2026-03-10","2026-03-12"],["2026-06-01","2026-06-12"]]},
    "Gabriel":{c:20,t:[]},
    "Lucas":{c:14,t:[["2026-03-10","2026-03-12"]]},
    "Rodrigo":{c:15,t:[["2026-09-03","2026-09-10"]]},
    "Milagros":{c:22,t:[["2026-09-24","2026-09-29"]]},
    "Rebeca":{c:17,t:[["2026-04-06","2026-04-16"]]},
    "Lucía":{c:14,t:[]},
    "Luis":{c:14,t:[["2026-02-15","2026-02-25"],["2026-07-28","2026-07-29"]],pag:1},
    "Brenda":{c:14,t:[["2026-02-28","2026-03-01"],["2026-09-29","2026-10-06"]]},
    "Mariano":{c:5,t:[["2026-07-31","2026-08-04"]]},
    "Lázaro":{c:0,t:[]},
    "Gonzalo":{c:0,t:[]},
  },
  c2026:{"Natalia":28,"Érica":28,"Hugo":28,"Javier":28,"Matías":10,"Jhon":10},
};
function planillaAplicada(st){return !!(st&&st.planillas&&st.planillas[PLANILLA_VAC.clave]);}
// Aplica la planilla sobre `st` (lo modifica). Devuelve true si cambió algo.
function aplicarPlanilla(st){
  if(!st||planillaAplicada(st))return false;
  const P=PLANILLA_VAC;
  st.taken=Array.isArray(st.taken)?st.taken:[];
  st.overrides=st.overrides||{};st.overridesTomado=st.overridesTomado||{};st.pagados=st.pagados||{};
  const nombres=Object.keys(P.p2025);
  // fuera las semillas viejas de 2025 de estas personas (lo cargado a mano se queda)
  st.taken=st.taken.filter(t=>!(t.periodo===2025&&nombres.includes(t.n)&&P.semillasViejas.includes(t.seedTag)));
  const pisa=(n,d,h)=>st.taken.some(t=>t.n===n&&t.desde<=h&&t.hasta>=d);
  for(const n of nombres){
    const x=P.p2025[n];
    (st.overrides[n]=st.overrides[n]||{})[2025]=x.c;
    x.t.forEach(([d,h],i)=>{
      if(pisa(n,d,h))return; // ya estaba cargado a mano
      st.taken.push({id:`${P.clave}-${n}-${i}`,seedTag:P.clave,n,desde:d,hasta:h,periodo:2025,estado:"confirmada",nota:""});
    });
    if(x.pag)(st.pagados[n]=st.pagados[n]||{})[2025]=x.pag;
  }
  // los "tomado" fijos de la semilla vieja (Tatiana y Walter, 2 días) ahora salen de los tramos
  for(const n of ["Tatiana","Walter"]){
    const o=st.overridesTomado[n];
    if(o&&o[2025]===2){delete o[2025];if(!Object.keys(o).length)delete st.overridesTomado[n];}
  }
  for(const[n,c]of Object.entries(P.c2026))(st.overrides[n]=st.overrides[n]||{})[2026]=c;
  st.planillas=Object.assign({},st.planillas,{[P.clave]:true});
  return true;
}
// Copia con la planilla aplicada, para leer sin tocar el estado (pedido.html).
function conPlanilla(st){
  const copia=JSON.parse(JSON.stringify(st||{}));
  aplicarPlanilla(copia);
  return copia;
}
