// =============================================================
// club-personal.js — Vista "⭐ Club" del sistema interno.
// El personal ingresa con una cuenta de Firebase (email y
// contraseña) habilitada en fidelizacion/staff/{uid}. Desde acá:
// buscar/escanear clientes, entregar premios, pasar tarjetas a
// otro celular, ver la base de clientes, imprimir los QR de mesa
// y configurar el programa.
// Usa globals de index.html: db, e(), toast(), closeModal().
// =============================================================

const Club = (() => {
  let user = null;
  let esStaff = false;
  let config = null;
  let locales = {};
  let tarjetas = {};           // uid -> tarjeta
  let tab = "atender";
  let filtro = "todos";
  let busqueda = "";
  let clienteUid = null;       // cliente abierto en "Atender"
  let visitasCliente = [];
  let escuchando = false;
  let scanner = null;
  let authListo = false;

  const el = () => document.getElementById("club-content");

  // ── Estilos propios ───────────────────────────────────────
  const css = `
  .club-login{max-width:380px;margin:0 auto;padding:28px}
  .club-login .fg{margin-bottom:12px}
  .club-bar{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
  .club-pad{padding:20px}
  .club-search{display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end}
  .club-search .fg{flex:1;min-width:200px}
  .club-cli-head{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:flex-start}
  .club-cli-name{font-size:22px;font-weight:700;letter-spacing:-.3px}
  .club-meta{color:var(--gray);font-size:13px;margin-top:2px}
  .club-stamps{display:flex;flex-wrap:wrap;gap:6px;margin:14px 0 6px}
  .club-stamp{width:28px;height:28px;border-radius:50%;border:2px dashed var(--cream-dark)}
  .club-stamp.on{border:none;background:var(--terra)}
  .club-premio{background:var(--black);color:var(--cream);border-radius:12px;padding:14px 16px;margin:12px 0;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}
  .club-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}
  .club-kv{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;margin-top:14px}
  .club-kv div{background:var(--cream);border-radius:10px;padding:10px 12px}
  .club-kv b{display:block;font-size:18px}
  .club-kv span{font-size:10px;text-transform:uppercase;letter-spacing:.8px;color:var(--gray)}
  .club-chips{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px}
  .club-chip{border:1.5px solid var(--cream-dark);background:var(--white);border-radius:100px;padding:6px 14px;font:inherit;font-size:12px;cursor:pointer}
  .club-chip.on{background:var(--black);color:var(--cream);border-color:var(--black)}
  .club-row{cursor:pointer}
  .club-row:hover td{background:var(--cream)}
  .club-tablewrap{overflow-x:auto}
  .club-qrs{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px}
  .club-qr{text-align:center;padding:20px}
  .club-qr svg{width:180px;height:180px}
  .club-qr .url{font-size:11px;color:var(--gray);word-break:break-all;margin-top:6px}
  .club-cfg{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px}
  #club-reader{width:100%;max-width:360px;margin:0 auto;border-radius:12px;overflow:hidden}
  .club-warn{background:#FFF8E8;color:#8A5A00;border-radius:10px;padding:12px 14px;font-size:13px;margin-bottom:14px}
  `;
  function inyectarCss() {
    if (document.getElementById("club-css")) return;
    const s = document.createElement("style");
    s.id = "club-css";
    s.textContent = css;
    document.head.appendChild(s);
  }

  // ── Sesión ────────────────────────────────────────────────
  function init() {
    if (!db) return; // Firebase no configurado: index.html ya muestra el error
    inyectarCss();
    Fidel.watchServerOffset(db);
    firebase.auth().onAuthStateChanged(async u => {
      authListo = true;
      user = u && !u.isAnonymous ? u : null;
      esStaff = false;
      if (user) {
        try {
          esStaff = !!(await db.ref(`fidelizacion/staff/${user.uid}`).once("value")).val();
        } catch (err) { console.error(err); }
      }
      if (esStaff) await cargarDatos();
      if (currentView === "club") render();
    });
  }

  async function login(ev) {
    ev.preventDefault();
    const email = document.getElementById("club-email").value.trim();
    const pass = document.getElementById("club-pass").value;
    const btn = document.getElementById("club-login-btn");
    const err = document.getElementById("club-login-err");
    btn.disabled = true; btn.textContent = "Ingresando…"; err.textContent = "";
    try {
      await firebase.auth().signInWithEmailAndPassword(email, pass);
    } catch (e2) {
      console.error(e2);
      err.textContent = "Email o contraseña incorrectos.";
      btn.disabled = false; btn.textContent = "Ingresar";
    }
  }

  function logout() {
    detenerEscaner();
    if (escuchando) {
      db.ref("fidelizacion/tarjetas").off();
      db.ref("fidelizacion/config").off();
      db.ref("fidelizacion/locales").off();
      escuchando = false;
    }
    tarjetas = {}; clienteUid = null;
    firebase.auth().signOut();
  }

  async function cargarDatos() {
    // Primera vez: crear configuración y locales por defecto
    const [cfg, loc] = await Promise.all([
      db.ref("fidelizacion/config").once("value"),
      db.ref("fidelizacion/locales").once("value"),
    ]);
    if (!cfg.exists()) await db.ref("fidelizacion/config").set(Fidel.CONFIG_DEFAULT);
    if (!loc.exists()) await db.ref("fidelizacion/locales").set(Fidel.LOCALES_DEFAULT);
    if (escuchando) return;
    escuchando = true;
    db.ref("fidelizacion/config").on("value", s => { config = s.val() || Fidel.CONFIG_DEFAULT; refrescar(); });
    db.ref("fidelizacion/locales").on("value", s => { locales = s.val() || {}; refrescar(); });
    db.ref("fidelizacion/tarjetas").on("value", s => { tarjetas = s.val() || {}; refrescar(); });
  }

  // Llegaron datos nuevos: redibujar sin cortar el escáner ni lo que se está tipeando
  function refrescar() {
    if (currentView !== "club") return;
    const t = document.getElementById("club-tab");
    if (!t) return render();
    const editando = document.activeElement && t.contains(document.activeElement);
    if (tab === "atender") return renderCliente();
    if (tab === "clientes" && editando) {
      const l = document.getElementById("club-lista");
      if (l) l.innerHTML = tablaClientes(clientesFiltrados());
      return;
    }
    if (tab === "config" && editando) return;
    render();
  }

  // ── Render principal ──────────────────────────────────────
  function render() {
    const c = el();
    if (!c) return;
    if (!authListo) { c.innerHTML = `<div class="card club-pad" style="text-align:center;color:var(--gray)">Cargando…</div>`; return; }
    if (!user) return renderLogin(c);
    if (!esStaff) return renderNoHabilitado(c);
    if (!config) { c.innerHTML = `<div class="card club-pad" style="text-align:center;color:var(--gray)">Cargando…</div>`; return; }

    const tabs = [["atender", "🔎 Atender"], ["clientes", "👥 Clientes"], ["qr", "🖨️ QR de mesas"], ["config", "⚙️ Configuración"]];
    c.innerHTML = `
      <div class="club-bar mb16">
        <div class="cuadra-tabs" style="margin-bottom:0;border-bottom:none">
          ${tabs.map(([k, l]) => `<button class="ctab${tab === k ? " active" : ""}" onclick="Club.setTab('${k}')">${l}</button>`).join("")}
        </div>
        <button class="btn btn-ghost btn-sm" onclick="Club.logout()">Salir (${e(user.email || "")})</button>
      </div>
      <div id="club-tab"></div>`;
    const t = document.getElementById("club-tab");
    if (tab === "atender") renderAtender(t);
    if (tab === "clientes") renderClientes(t);
    if (tab === "qr") renderQr(t);
    if (tab === "config") renderConfig(t);
  }

  function setTab(t) { detenerEscaner(); tab = t; render(); }

  function renderLogin(c) {
    c.innerHTML = `
      <div class="card club-login">
        <div class="mtitle">⭐ Club Candela</div>
        <div class="msub">Ingresá con la cuenta del personal para atender clientes del programa de beneficios.</div>
        <form id="club-login-form">
          <div class="fg"><label class="fl" for="club-email">Email</label><input class="fc" id="club-email" type="email" autocomplete="username" required></div>
          <div class="fg"><label class="fl" for="club-pass">Contraseña</label><input class="fc" id="club-pass" type="password" autocomplete="current-password" required></div>
          <div id="club-login-err" style="color:#b83a25;font-size:13px;min-height:18px"></div>
          <button class="btn btn-primary btn-block" id="club-login-btn" type="submit">Ingresar</button>
        </form>
      </div>`;
    document.getElementById("club-login-form").addEventListener("submit", login);
  }

  function renderNoHabilitado(c) {
    c.innerHTML = `
      <div class="card club-login">
        <div class="mtitle">Cuenta no habilitada</div>
        <div class="msub">La cuenta <b>${e(user.email || "")}</b> todavía no tiene permiso de personal. En Firebase → Realtime Database, agregá este nodo:</div>
        <div class="fc" style="font-family:monospace;font-size:12px;word-break:break-all;user-select:all">fidelizacion/staff/${e(user.uid)} = true</div>
        <button class="btn btn-ghost btn-block mt12" onclick="location.reload()">Ya lo agregué, reintentar</button>
        <button class="btn btn-ghost btn-block mt12" onclick="Club.logout()">Salir</button>
      </div>`;
  }

  // ── Atender: buscar / escanear / canjear ──────────────────
  function renderAtender(t) {
    t.innerHTML = `
      <div class="card club-pad">
        <div class="club-search">
          <button class="btn btn-primary" onclick="Club.escanear('buscar')">📷 Escanear código del cliente</button>
          <div class="fg"><label class="fl" for="club-tel">o buscar por WhatsApp</label>
            <input class="fc" id="club-tel" type="tel" inputmode="numeric" placeholder="387 512 3456" onkeydown="if(event.key==='Enter')Club.buscarTel()"></div>
          <button class="btn btn-outline" onclick="Club.buscarTel()">Buscar</button>
        </div>
        <div id="club-reader-wrap"></div>
      </div>
      <div id="club-cliente"></div>`;
    if (clienteUid) renderCliente();
  }

  function buscarTel() {
    const tel = Fidel.normalizarTelefono(document.getElementById("club-tel").value);
    if (!tel) return toast("⚠️ Escribí 10 números: código de área sin 0 y número sin 15");
    const hit = Object.entries(tarjetas).find(([, c]) => c.telefono === tel);
    if (!hit) return toast("No hay ninguna tarjeta con ese WhatsApp");
    abrirCliente(hit[0]);
  }

  async function abrirCliente(uid) {
    clienteUid = uid;
    visitasCliente = [];
    if (tab !== "atender") { tab = "atender"; render(); } else renderCliente();
    const s = await db.ref(`fidelizacion/visitas/${uid}`).limitToLast(15).once("value");
    visitasCliente = Object.values(s.val() || {}).sort((a, b) => b.ts - a.ts);
    renderCliente();
  }

  function renderCliente() {
    const box = document.getElementById("club-cliente");
    if (!box || !clienteUid) return;
    const c = tarjetas[clienteUid];
    if (!c) { box.innerHTML = `<div class="card club-pad" style="color:var(--gray)">Ese código no tiene tarjeta. Si es un celular nuevo del cliente, buscá su tarjeta por WhatsApp y usá “Pasar a otro celular”.</div>`; return; }
    const meta = config.sellosPremio;
    const premios = Math.floor(c.sellos / meta);
    const llenos = premios > 0 ? meta : c.sellos;
    const wa = `https://wa.me/549${c.telefono}`;
    box.innerHTML = `
      <div class="card club-pad">
        <div class="club-cli-head">
          <div>
            <div class="club-cli-name">${e(c.nombre)}</div>
            <div class="club-meta"><a href="${wa}" target="_blank" rel="noopener">📱 ${e(c.telefono)}</a> · 🎂 ${Fidel.fmtCumple(c.cumple)} · Socio desde ${Fidel.fmtFecha(c.creada)}</div>
          </div>
          <button class="btn btn-ghost btn-sm" onclick="Club.cerrarCliente()">✕</button>
        </div>
        <div class="club-stamps">${Array.from({ length: meta }, (_, i) => `<div class="club-stamp${i < llenos ? " on" : ""}"></div>`).join("")}</div>
        <div class="club-meta">${c.sellos} sello${c.sellos === 1 ? "" : "s"} · meta ${meta}</div>
        ${premios > 0 ? `
          <div class="club-premio">
            <div>🎁 <b>${premios > 1 ? premios + " premios" : "1 premio"} para canjear</b><div style="font-size:13px;opacity:.8">${e(config.premio)}</div></div>
            <button class="btn btn-primary" onclick="Club.canjear()">Entregar premio</button>
          </div>` : ""}
        <div class="club-kv">
          <div><b>${c.totalSellos}</b><span>Visitas totales</span></div>
          <div><b>${c.canjes}</b><span>Premios canjeados</span></div>
          <div><b>${c.sellosSemana && c.semana === Fidel.inicioSemana(Fidel.serverNow()) ? c.sellosSemana : 0}/${config.topeSemanal}</b><span>Sellos esta semana</span></div>
          <div><b>${c.ultimoSello ? Fidel.fmtFecha(c.ultimoSello) : "—"}</b><span>Última visita</span></div>
        </div>
        <div class="club-actions">
          <button class="btn btn-ghost btn-sm" onclick="Club.escanear('transferir')">📱 Pasar a otro celular</button>
        </div>
        ${visitasCliente.length ? `
          <div class="fl" style="margin:18px 0 8px">Últimas visitas</div>
          <div class="club-tablewrap"><table class="otbl"><thead><tr><th>Fecha y hora</th><th>Local</th></tr></thead>
          <tbody>${visitasCliente.map(v => `<tr><td>${Fidel.fmtFechaHora(v.ts)}</td><td>${e(locales[v.local]?.nombre || v.local)}</td></tr>`).join("")}</tbody></table></div>` : ""}
      </div>`;
  }

  function cerrarCliente() { clienteUid = null; const b = document.getElementById("club-cliente"); if (b) b.innerHTML = ""; }

  function canjear() {
    const c = tarjetas[clienteUid];
    const meta = config.sellosPremio;
    if (!c || c.sellos < meta) return;
    confirmar(`🎁 Entregar premio`, `¿Entregaste <b>${e(config.premio)}</b> a <b>${e(c.nombre)}</b>? Se descuentan ${meta} sellos de su tarjeta.`, "Sí, entregado", async () => {
      const uid = clienteUid;
      const cid = db.ref("fidelizacion/canjes").push().key;
      try {
        await db.ref("fidelizacion").update({
          [`tarjetas/${uid}/sellos`]: c.sellos - meta,
          [`tarjetas/${uid}/canjes`]: (c.canjes || 0) + 1,
          [`canjes/${cid}`]: { uid, ts: firebase.database.ServerValue.TIMESTAMP, staff: user.email || user.uid, sellosUsados: meta },
        });
        toast(`✅ Premio registrado para ${c.nombre}`);
      } catch (err) { console.error(err); toast("⚠️ No se pudo registrar el canje"); }
    });
  }

  async function transferir(nuevoUid) {
    const viejoUid = clienteUid;
    const c = tarjetas[viejoUid];
    if (!c || !nuevoUid || nuevoUid === viejoUid) return toast("⚠️ Ese es el mismo celular");
    if (tarjetas[nuevoUid]) return toast("⚠️ Ese celular ya tiene otra tarjeta");
    confirmar("📱 Pasar tarjeta", `¿Pasar la tarjeta de <b>${e(c.nombre)}</b> (${c.sellos} sellos) al celular que escaneaste? El celular anterior deja de tenerla.`, "Sí, pasar", async () => {
      try {
        const vs = (await db.ref(`fidelizacion/visitas/${viejoUid}`).once("value")).val() || null;
        await db.ref("fidelizacion").update({
          [`tarjetas/${nuevoUid}`]: c,
          [`tarjetas/${viejoUid}`]: null,
          [`telefonos/${c.telefono}`]: nuevoUid,
          [`visitas/${nuevoUid}`]: vs,
          [`visitas/${viejoUid}`]: null,
        });
        clienteUid = nuevoUid;
        toast(`✅ Tarjeta de ${c.nombre} pasada al nuevo celular. Que actualice la página.`);
        abrirCliente(nuevoUid);
      } catch (err) { console.error(err); toast("⚠️ No se pudo pasar la tarjeta"); }
    });
  }

  // ── Escáner de QR (cámara) ────────────────────────────────
  function cargarLibEscaner() {
    if (window.Html5Qrcode) return Promise.resolve();
    return new Promise((ok, fail) => {
      const s = document.createElement("script");
      s.src = "js/vendor/html5-qrcode.min.js";
      s.onload = ok; s.onerror = fail;
      document.head.appendChild(s);
    });
  }

  async function escanear(modo) {
    detenerEscaner();
    let wrap = document.getElementById("club-reader-wrap");
    if (modo === "transferir") {
      document.getElementById("modal-root").innerHTML = `
        <div class="mbackdrop"><div class="modal" style="text-align:center">
          <div class="mtitle">📱 Escaneá el celular nuevo</div>
          <div class="msub">En el celular nuevo, el cliente abre la tarjeta, pone su WhatsApp y le aparece un código para mostrar.</div>
          <div id="club-reader-wrap"></div>
          <button class="btn btn-ghost btn-block mt12" onclick="Club.detenerEscaner();closeModal()">Cancelar</button>
        </div></div>`;
      wrap = document.querySelector("#modal-root #club-reader-wrap");
    }
    wrap.innerHTML = `<div id="club-reader" class="mt12"></div>${modo === "buscar" ? `<button class="btn btn-ghost btn-block mt12" onclick="Club.detenerEscaner()">Cancelar</button>` : ""}`;
    try {
      await cargarLibEscaner();
      scanner = new Html5Qrcode("club-reader");
      await scanner.start({ facingMode: "environment" }, { fps: 10, qrbox: 220 }, texto => {
        const uid = Fidel.uidDeQr(texto);
        if (!uid) return;
        detenerEscaner();
        if (modo === "transferir") { closeModal(); transferir(uid); }
        else abrirCliente(uid);
      }, () => {});
    } catch (err) {
      console.error(err);
      wrap.innerHTML = `<div class="club-warn mt12">No se pudo abrir la cámara. Revisá que el navegador tenga permiso de cámara (y que el sistema esté abierto con https).</div>`;
    }
  }

  function detenerEscaner() {
    const s = scanner;
    scanner = null;
    if (s) s.stop().catch(() => {}).finally(() => { try { s.clear(); } catch (_) {} });
    const w = document.getElementById("club-reader-wrap");
    if (w) w.innerHTML = "";
  }

  // ── Clientes ──────────────────────────────────────────────
  function diasHastaCumple(mmdd, now) {
    if (!mmdd) return null;
    const hoy = new Date(Fidel.inicioDia(now) + 3 * 3600000); // 00:00 ART como fecha UTC
    const [m, d] = mmdd.split("-").map(Number);
    let prox = Date.UTC(hoy.getUTCFullYear(), m - 1, d);
    if (prox < hoy.getTime()) prox = Date.UTC(hoy.getUTCFullYear() + 1, m - 1, d);
    return Math.round((prox - hoy.getTime()) / 86400000);
  }

  function listaClientes() {
    const now = Fidel.serverNow();
    const meta = config.sellosPremio;
    return Object.entries(tarjetas).map(([uid, c]) => ({
      uid, ...c,
      premio: c.sellos >= meta,
      cumpleEn: diasHastaCumple(c.cumple, now),
      diasSinVenir: c.ultimoSello ? Math.floor((now - c.ultimoSello) / 86400000) : null,
    }));
  }

  const FILTROS = {
    todos:    ["Todos", () => true],
    premio:   ["🎁 Con premio", c => c.premio],
    cumple:   ["🎂 Cumple en 7 días", c => c.cumpleEn !== null && c.cumpleEn <= 7],
    inactivo: ["💤 30+ días sin venir", c => c.diasSinVenir !== null && c.diasSinVenir >= 30],
    nuevos:   ["🆕 Sin visitas", c => !c.ultimoSello],
  };

  function clientesFiltrados() {
    const q = busqueda.toLowerCase().trim();
    return listaClientes()
      .filter(FILTROS[filtro][1])
      .filter(c => !q || c.nombre.toLowerCase().includes(q) || c.telefono.includes(q.replace(/\D/g, "") || "~"))
      .sort((a, b) => filtro === "cumple" ? a.cumpleEn - b.cumpleEn : (b.ultimoSello || b.creada) - (a.ultimoSello || a.creada));
  }

  function renderClientes(t) {
    const todos = listaClientes();
    const n = f => todos.filter(FILTROS[f][1]).length;
    const lista = clientesFiltrados();
    t.innerHTML = `
      <div class="stats-row">
        ${[["Socios", todos.length], ["Premios por canjear", n("premio")], ["Cumples en 7 días", n("cumple")], ["30+ días sin venir", n("inactivo")]]
          .map(([l, v]) => `<div class="scard"><div class="fl" style="margin-bottom:4px">${l}</div><div style="font-size:26px;font-weight:800;color:var(--terra)">${v}</div></div>`).join("")}
      </div>
      <div class="club-bar mb16">
        <div class="club-chips" style="margin:0">${Object.entries(FILTROS).map(([k, [l]]) => `<button class="club-chip${filtro === k ? " on" : ""}" onclick="Club.setFiltro('${k}')">${l}</button>`).join("")}</div>
        <div class="fxc">
          <input class="fc" style="width:220px" placeholder="🔍 Nombre o teléfono" value="${e(busqueda)}" oninput="Club.setBusqueda(this.value)">
          <button class="btn btn-ghost btn-sm" onclick="Club.exportarCsv()">⬇️ CSV</button>
        </div>
      </div>
      <div class="card club-tablewrap" id="club-lista">${tablaClientes(lista)}</div>`;
  }

  function tablaClientes(lista) {
    if (!lista.length) return `<div class="club-pad" style="text-align:center;color:var(--gray)">${Object.keys(tarjetas).length ? "No hay clientes con ese filtro." : "Todavía no hay socios. Imprimí los QR de mesa desde la pestaña “QR de mesas”."}</div>`;
    return `<table class="otbl" style="margin:0"><thead><tr><th>Nombre</th><th>WhatsApp</th><th>Cumple</th><th>Sellos</th><th>Visitas</th><th>Última visita</th><th>Local</th></tr></thead><tbody>
      ${lista.map(c => `<tr class="club-row" onclick="Club.abrirCliente('${e(c.uid)}')">
        <td><b style="font-weight:600">${e(c.nombre)}</b>${c.premio ? " 🎁" : ""}</td>
        <td>${e(c.telefono)}</td>
        <td>${Fidel.fmtCumple(c.cumple)}${c.cumpleEn !== null && c.cumpleEn <= 7 ? ` <span class="badge b-pending">${c.cumpleEn === 0 ? "¡hoy!" : "en " + c.cumpleEn + "d"}</span>` : ""}</td>
        <td>${c.sellos}</td>
        <td>${c.totalSellos}</td>
        <td>${c.ultimoSello ? Fidel.fmtFecha(c.ultimoSello) + (c.diasSinVenir >= 30 ? ` <span class="badge b-producing">${c.diasSinVenir}d</span>` : "") : "—"}</td>
        <td>${e(locales[c.ultimoLocal]?.nombre || "—")}</td>
      </tr>`).join("")}</tbody></table>`;
  }

  function setFiltro(f) { filtro = f; render(); }
  function setBusqueda(v) {
    busqueda = v;
    const l = document.getElementById("club-lista");
    if (l) l.innerHTML = tablaClientes(clientesFiltrados());
  }

  function exportarCsv() {
    const lista = clientesFiltrados();
    const q = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const filas = [["Nombre", "WhatsApp", "Cumpleaños", "Sellos", "Visitas totales", "Premios canjeados", "Última visita", "Último local", "Socio desde"]]
      .concat(lista.map(c => [c.nombre, "549" + c.telefono, Fidel.fmtCumple(c.cumple), c.sellos, c.totalSellos, c.canjes,
        c.ultimoSello ? Fidel.fmtFecha(c.ultimoSello) : "", locales[c.ultimoLocal]?.nombre || "", Fidel.fmtFecha(c.creada)]));
    const blob = new Blob(["﻿" + filas.map(f => f.map(q).join(";")).join("\r\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `club-candela-${filtro}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  // ── QR de mesas ───────────────────────────────────────────
  function urlTarjeta(local) {
    const base = location.origin + location.pathname.replace(/[^/]*$/, "");
    return `${base}tarjeta.html?l=${encodeURIComponent(local)}`;
  }

  function renderQr(t) {
    const esArchivo = location.protocol === "file:";
    t.innerHTML = `
      ${esArchivo ? `<div class="club-warn">Estás abriendo el sistema como archivo. Para generar los QR, abrilo desde su dirección web publicada (por ejemplo, la de Netlify).</div>` : ""}
      <div class="ss mb16">Imprimí estos QR y ponelos en las mesas y el mostrador de cada local. Al escanearlo, el cliente se registra (la primera vez) y suma su sello del día.</div>
      <div class="club-qrs">
        ${Object.entries(locales).map(([k, l]) => `
          <div class="card club-qr">
            <div class="fl">${e(l.nombre)}</div>
            ${esArchivo ? "" : Fidel.qrSvg(urlTarjeta(k), 8)}
            <div class="url">${e(urlTarjeta(k))}</div>
            <button class="btn btn-primary btn-sm mt12" onclick="Club.imprimirQr('${e(k)}')" ${esArchivo ? "disabled" : ""}>🖨️ Imprimir</button>
          </div>`).join("")}
      </div>`;
  }

  function imprimirQr(local) {
    const l = locales[local];
    if (!l) return;
    const tarjeta = `
      <div class="t">
        <div class="h">Club Candela</div>
        <div class="s">Sumá un sello cada vez que venís</div>
        ${Fidel.qrSvg(urlTarjeta(local), 8)}
        <div class="p">Con ${config.sellosPremio} sellos: <b>${e(config.premio)}</b></div>
        <div class="l">${e(l.nombre)}</div>
      </div>`;
    const win = window.open("", "_blank");
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>QR ${e(l.nombre)}</title>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;700;800&display=swap" rel="stylesheet">
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Plus Jakarta Sans',sans-serif;display:grid;grid-template-columns:1fr 1fr;gap:8mm;padding:10mm}
        .t{border:1.5px dashed #bbb;border-radius:6mm;padding:8mm 6mm;text-align:center;break-inside:avoid}
        .h{font-size:20pt;font-weight:800;color:#E15D46}
        .s{font-size:11pt;margin:2mm 0 4mm}
        svg{width:55mm;height:55mm}
        .p{font-size:10pt;margin-top:3mm}
        .l{font-size:8pt;color:#888;margin-top:2mm;text-transform:uppercase;letter-spacing:1px}
        @page{size:A4;margin:0}
      </style></head><body>${tarjeta.repeat(4)}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 600);
  }

  // ── Configuración ─────────────────────────────────────────
  function renderConfig(t) {
    t.innerHTML = `
      <div class="card club-pad">
        <div class="mtitle" style="font-size:16px">Programa de sellos</div>
        <div class="club-cfg mt12">
          <div class="fg"><label class="fl">Sellos para el premio</label><input class="fc" id="cfg-meta" type="number" min="1" max="50" value="${config.sellosPremio}"></div>
          <div class="fg" style="grid-column:span 2"><label class="fl">Premio</label><input class="fc" id="cfg-premio" maxlength="120" value="${e(config.premio)}"></div>
          <div class="fg"><label class="fl">Máx. sellos por semana</label><input class="fc" id="cfg-tope" type="number" min="1" max="7" value="${config.topeSemanal}"></div>
          <div class="fg"><label class="fl">Horario desde (hora)</label><input class="fc" id="cfg-desde" type="number" min="0" max="23" value="${config.horaApertura}"></div>
          <div class="fg"><label class="fl">Horario hasta (hora)</label><input class="fc" id="cfg-hasta" type="number" min="1" max="24" value="${config.horaCierre}"></div>
        </div>
        <div class="ss mt12">Siempre se permite 1 sello por día por cliente. Fuera del horario no se suman sellos.</div>
        <button class="btn btn-primary mt12" onclick="Club.guardarConfig()">Guardar</button>
      </div>
      <div class="card club-pad">
        <div class="mtitle" style="font-size:16px">Locales</div>
        <div class="ss">Cada local tiene su propio QR de mesa.</div>
        <div class="club-cfg mt12">
          ${Object.entries(locales).map(([k, l]) => `<div class="fg"><label class="fl">${e(k)}</label><input class="fc" data-local="${e(k)}" value="${e(l.nombre)}"></div>`).join("")}
          <div class="fg"><label class="fl">Nuevo local (opcional)</label><input class="fc" id="cfg-nuevo" placeholder="Nombre del local"></div>
        </div>
        <button class="btn btn-primary mt12" onclick="Club.guardarLocales()">Guardar locales</button>
      </div>`;
  }

  async function guardarConfig() {
    const nuevo = {
      sellosPremio: parseInt(document.getElementById("cfg-meta").value, 10),
      premio: document.getElementById("cfg-premio").value.trim(),
      topeSemanal: parseInt(document.getElementById("cfg-tope").value, 10),
      horaApertura: parseInt(document.getElementById("cfg-desde").value, 10),
      horaCierre: parseInt(document.getElementById("cfg-hasta").value, 10),
    };
    if (!(nuevo.sellosPremio >= 1 && nuevo.sellosPremio <= 50)) return toast("⚠️ Sellos para el premio: entre 1 y 50");
    if (nuevo.premio.length < 2) return toast("⚠️ Escribí el premio");
    if (!(nuevo.topeSemanal >= 1 && nuevo.topeSemanal <= 7)) return toast("⚠️ Máximo semanal: entre 1 y 7");
    if (!(nuevo.horaApertura >= 0 && nuevo.horaCierre <= 24 && nuevo.horaCierre > nuevo.horaApertura)) return toast("⚠️ Revisá el horario");
    try { await db.ref("fidelizacion/config").set(nuevo); toast("✅ Configuración guardada"); }
    catch (err) { console.error(err); toast("⚠️ No se pudo guardar"); }
  }

  async function guardarLocales() {
    const upd = {};
    document.querySelectorAll("[data-local]").forEach(i => {
      const v = i.value.trim();
      if (v.length >= 2) upd[`${i.dataset.local}/nombre`] = v;
    });
    const nuevo = document.getElementById("cfg-nuevo").value.trim();
    if (nuevo) {
      const key = nuevo.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "").slice(0, 20);
      if (key.length < 2 || locales[key]) return toast("⚠️ Ese nombre de local no sirve o ya existe");
      upd[`${key}/nombre`] = nuevo;
    }
    try { await db.ref("fidelizacion/locales").update(upd); toast("✅ Locales guardados"); render(); }
    catch (err) { console.error(err); toast("⚠️ No se pudo guardar"); }
  }

  // ── Modal de confirmación ─────────────────────────────────
  let confirmarCb = null;
  function confirmar(titulo, html, okLabel, cb) {
    confirmarCb = cb;
    document.getElementById("modal-root").innerHTML = `
      <div class="mbackdrop"><div class="modal">
        <div class="mtitle">${titulo}</div>
        <div class="msub" style="font-size:14px;color:var(--black)">${html}</div>
        <div class="fxc" style="justify-content:flex-end">
          <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
          <button class="btn btn-primary" onclick="Club.confirmarOk()">${okLabel}</button>
        </div>
      </div></div>`;
  }
  function confirmarOk() { const cb = confirmarCb; confirmarCb = null; closeModal(); if (cb) cb(); }

  return {
    init, render, setTab, logout, buscarTel, abrirCliente, cerrarCliente, canjear,
    escanear, detenerEscaner, setFiltro, setBusqueda, exportarCsv, imprimirQr,
    guardarConfig, guardarLocales, confirmarOk,
  };
})();
