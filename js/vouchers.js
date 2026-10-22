// =============================================================
// vouchers.js — Vista "🎟️ Vouchers" del sistema interno.
// Se generan vouchers de productos (ej. "Merienda para 2") o de
// monto (ej. $15.000), regalados o vendidos, con el diseño de la
// tarjeta física (img/voucher-*.svg). Cada voucher tiene un código
// único con QR, vence a los 30 días (editable) y se usa UNA sola vez.
// En caja se escanea o se tipea el código para validarlo y canjearlo.
// Usa la misma cuenta del personal que el ⭐ Club
// (fidelizacion/staff/{uid}); las reglas de la base
// (database.rules.json → vouchers) aplican todos los controles.
// Usa globals de index.html: db, e(), toast(), closeModal(), menu,
// currentView, y Fidel (fidelizacion-comun.js).
// =============================================================

const Vouchers = (() => {
  const DIAS_VALIDEZ = 30;
  const POR_VENCER_DIAS = 7;
  const DAY_MS = 86400000;
  const TZ_MS = 3 * 3600000; // Argentina = UTC-3

  // Código: CND-XXXX-XXXX sin letras/números que se confunden (0 O 1 I L)
  const ALFABETO = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
  const RE_CODIGO = /^CND-[2-9A-HJKMNP-Z]{4}-[2-9A-HJKMNP-Z]{4}$/;

  const ENCABEZADO = { regalo: "¡Felicidades! Ganaste:", venta: "¡Te hicieron un regalo!" };
  const MOTIVOS = ["Sorteo", "Promoción", "Compensación", "Cortesía", "Cumpleaños"];
  const PAGOS = ["Efectivo", "Transferencia", "Mercado Pago", "Débito", "Crédito"];

  let user = null;
  let esStaff = false;
  let authListo = false;
  let escuchando = false;
  let vouchers = {};            // codigo -> voucher
  let cargados = false;
  let locales = {};
  let tab = "validar";
  let actual = null;            // código abierto en "Validar"
  let recienCreados = [];       // códigos del último "Generar"
  let filtro = "vigentes";
  let busqueda = "";
  let scanner = null;
  let pngs = {};                // codigo -> { blob, url } del dorso (para compartir al toque)

  const el = () => document.getElementById("vouchers-content");

  // ── Estilos propios ───────────────────────────────────────
  const css = `
  .vch-pad{padding:20px}
  .vch-bar{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
  .vch-search{display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end}
  .vch-search .fg{flex:1;min-width:200px}
  .vch-code{font-family:ui-monospace,Menlo,monospace;letter-spacing:1px;text-transform:uppercase}
  #vch-reader{width:100%;max-width:360px;margin:0 auto;border-radius:12px;overflow:hidden}
  .vch-estado{border-radius:12px;padding:16px 18px;margin-bottom:16px;display:flex;gap:14px;align-items:center}
  .vch-estado .ico{font-size:34px;line-height:1}
  .vch-estado b{display:block;font-size:22px;letter-spacing:.5px}
  .vch-estado span{font-size:13px;opacity:.85}
  .vch-vigente{background:#E7F6EC;color:#14532D}
  .vch-vencido{background:#FEF3C7;color:#92400E}
  .vch-canjeado{background:#EEECE6;color:#3a3836}
  .vch-anulado,.vch-noexiste{background:#FDE7E4;color:#9B2C1C}
  .vch-det{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);gap:20px;align-items:start}
  @media(max-width:760px){.vch-det{grid-template-columns:1fr}}
  .vch-prev{position:relative;border-radius:10px;overflow:hidden;box-shadow:0 10px 30px rgba(34,32,31,.16),0 2px 6px rgba(34,32,31,.08);line-height:0}
  .vch-prev canvas,.vch-prev img{width:100%;height:auto;display:block}
  .vch-sello{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) rotate(-14deg);border:4px solid currentColor;border-radius:10px;padding:6px 16px;font:800 28px/1 'Plus Jakarta Sans',sans-serif;letter-spacing:3px;background:rgba(255,255,255,.72);line-height:1}
  .vch-sello.canjeado{color:#3a3836}.vch-sello.anulado{color:#B42318}.vch-sello.vencido{color:#B45309}
  .vch-kv{display:grid;grid-template-columns:auto 1fr;gap:6px 14px;font-size:14px}
  .vch-kv dt{color:var(--gray);font-size:11px;text-transform:uppercase;letter-spacing:.8px;padding-top:3px}
  .vch-kv dd{margin:0}
  .vch-items{margin:0;padding-left:18px}
  .vch-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:16px}
  .vch-form{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:24px;align-items:start}
  @media(max-width:860px){.vch-form{grid-template-columns:1fr}}
  .vch-form .fg{margin-bottom:12px}
  .vch-row2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .vch-seg{display:flex;gap:6px;flex-wrap:wrap}
  .vch-seg label{border:1.5px solid var(--cream-dark);background:var(--white);border-radius:100px;padding:7px 14px;font-size:13px;cursor:pointer;user-select:none}
  .vch-seg input{display:none}
  .vch-seg input:checked+span{font-weight:700}
  .vch-seg label:has(input:checked){background:var(--black);color:var(--cream);border-color:var(--black)}
  .vch-item{display:grid;grid-template-columns:70px 1fr auto;gap:8px;margin-bottom:8px}
  .vch-sticky{position:sticky;top:12px}
  .vch-chips{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px}
  .vch-chip{border:1.5px solid var(--cream-dark);background:var(--white);border-radius:100px;padding:6px 14px;font:inherit;font-size:12px;cursor:pointer}
  .vch-chip.on{background:var(--black);color:var(--cream);border-color:var(--black)}
  .vch-tablewrap{overflow-x:auto}
  .vch-rowc{cursor:pointer}
  .vch-rowc:hover td{background:var(--cream)}
  .vch-badge{display:inline-block;border-radius:100px;padding:2px 10px;font-size:11px;font-weight:700;white-space:nowrap}
  .vch-warn{background:#FFF8E8;color:#8A5A00;border-radius:10px;padding:12px 14px;font-size:13px;margin-bottom:14px}
  .vch-lote{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;margin-top:14px}
  .vch-lote button{all:unset;cursor:pointer;display:block}
  .vch-lote .vch-code{font-size:12px;margin-top:6px;text-align:center}
  .vch-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:16px}
  .vch-stats b{display:block;font-size:24px;font-weight:700;letter-spacing:-.3px}
  .vch-stats span{font-size:10px;text-transform:uppercase;letter-spacing:.8px;color:var(--gray);font-weight:600}
  `;
  function inyectarCss() {
    if (document.getElementById("vch-css")) return;
    const s = document.createElement("style");
    s.id = "vch-css";
    s.textContent = css;
    document.head.appendChild(s);
  }

  // ── Sesión (misma cuenta del personal que el Club) ────────
  function init() {
    if (!db) return;
    inyectarCss();
    firebase.auth().onAuthStateChanged(async u => {
      authListo = true;
      user = u && !u.isAnonymous ? u : null;
      esStaff = false;
      if (user) {
        try { esStaff = !!(await db.ref(`fidelizacion/staff/${user.uid}`).once("value")).val(); }
        catch (err) { console.error(err); }
      }
      if (esStaff) escuchar(); else dejarDeEscuchar();
      if (currentView === "vouchers") render();
    });
  }

  function escuchar() {
    if (escuchando) return;
    escuchando = true;
    db.ref("vouchers").on("value", s => { vouchers = s.val() || {}; cargados = true; refrescar(); },
      err => { console.error(err); toast("⚠️ No se pudieron leer los vouchers. ¿Están publicadas las reglas?"); });
    db.ref("fidelizacion/locales").on("value", s => { locales = s.val() || Fidel.LOCALES_DEFAULT; });
  }
  function dejarDeEscuchar() {
    if (!escuchando) return;
    db.ref("vouchers").off();
    db.ref("fidelizacion/locales").off();
    escuchando = false; vouchers = {}; cargados = false; actual = null;
  }

  async function login(ev) {
    ev.preventDefault();
    const email = document.getElementById("vch-email").value.trim();
    const pass = document.getElementById("vch-pass").value;
    const btn = document.getElementById("vch-login-btn");
    const err = document.getElementById("vch-login-err");
    btn.disabled = true; btn.textContent = "Ingresando…"; err.textContent = "";
    try { await firebase.auth().signInWithEmailAndPassword(email, pass); }
    catch (e2) {
      console.error(e2);
      err.textContent = "Email o contraseña incorrectos.";
      btn.disabled = false; btn.textContent = "Ingresar";
    }
  }
  function logout() { detenerEscaner(); firebase.auth().signOut(); }

  // Llegaron datos nuevos: redibujar sin cortar el escáner ni lo que se está tipeando
  function refrescar() {
    if (currentView !== "vouchers") return;
    if (!document.getElementById("vch-tab")) return render();
    if (tab === "validar") return renderDetalle();
    if (tab === "listado") {
      const l = document.getElementById("vch-lista");
      if (l) { l.innerHTML = tablaListado(); return; }
    }
    if (tab === "generar" && recienCreados.length) return renderCreados();
  }

  // ── Render principal ──────────────────────────────────────
  function render() {
    const c = el();
    if (!c) return;
    if (!authListo) { c.innerHTML = `<div class="card vch-pad" style="text-align:center;color:var(--gray)">Cargando…</div>`; return; }
    if (!user) return renderLogin(c);
    if (!esStaff) return renderNoHabilitado(c);
    const tabs = [["validar", "🔎 Validar"], ["generar", "➕ Generar"], ["listado", "📋 Vouchers"]];
    c.innerHTML = `
      <div class="vch-bar mb16">
        <div class="cuadra-tabs" style="margin-bottom:0;border-bottom:none">
          ${tabs.map(([k, l]) => `<button class="ctab${tab === k ? " active" : ""}" onclick="Vouchers.setTab('${k}')">${l}</button>`).join("")}
        </div>
        <button class="btn btn-ghost btn-sm" onclick="Vouchers.logout()">Salir (${e(user.email || "")})</button>
      </div>
      <div id="vch-tab"></div>`;
    const t = document.getElementById("vch-tab");
    if (tab === "validar") renderValidar(t);
    if (tab === "generar") renderGenerar(t);
    if (tab === "listado") renderListado(t);
  }

  function setTab(t) { detenerEscaner(); tab = t; if (t === "generar") recienCreados = []; render(); }

  function renderLogin(c) {
    c.innerHTML = `
      <div class="card club-login">
        <div class="mtitle">🎟️ Vouchers</div>
        <div class="msub">Ingresá con la cuenta del personal (la misma del ⭐ Club) para generar y validar vouchers.</div>
        <form id="vch-login-form">
          <div class="fg mb12"><label class="fl" for="vch-email">Email</label><input class="fc" id="vch-email" type="email" autocomplete="username" required></div>
          <div class="fg mb12"><label class="fl" for="vch-pass">Contraseña</label><input class="fc" id="vch-pass" type="password" autocomplete="current-password" required></div>
          <div id="vch-login-err" style="color:#b83a25;font-size:13px;min-height:18px"></div>
          <button class="btn btn-primary btn-block" id="vch-login-btn" type="submit">Ingresar</button>
        </form>
      </div>`;
    document.getElementById("vch-login-form").addEventListener("submit", login);
  }

  function renderNoHabilitado(c) {
    c.innerHTML = `
      <div class="card club-login">
        <div class="mtitle">Cuenta no habilitada</div>
        <div class="msub">La cuenta <b>${e(user.email || "")}</b> todavía no tiene permiso de personal. En Firebase → Realtime Database, agregá este nodo:</div>
        <div class="fc" style="font-family:monospace;font-size:12px;word-break:break-all;user-select:all">fidelizacion/staff/${e(user.uid)} = true</div>
        <button class="btn btn-ghost btn-block mt12" onclick="location.reload()">Ya lo agregué, reintentar</button>
        <button class="btn btn-ghost btn-block mt12" onclick="Vouchers.logout()">Salir</button>
      </div>`;
  }

  // ── Fechas (hora argentina) ───────────────────────────────
  const ahora = () => Fidel.serverNow();
  function hoyIso(t = ahora()) { return new Date(t - TZ_MS).toISOString().slice(0, 10); }
  function sumarDiasIso(iso, dias) { return new Date(Date.parse(iso) + dias * DAY_MS).toISOString().slice(0, 10); }
  // Último milisegundo del día elegido, en hora argentina
  function finDelDia(iso) { return Date.parse(iso) + TZ_MS + DAY_MS - 1; }
  function fmtDia(ts) { return new Date(ts - TZ_MS).toISOString().slice(0, 10).split("-").reverse().join("/"); }
  function fmtDiaHora(ts) {
    return new Date(ts).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "America/Argentina/Buenos_Aires" });
  }
  const pesos = n => "$" + Number(n || 0).toLocaleString("es-AR", { maximumFractionDigits: 0 });

  // ── Código ────────────────────────────────────────────────
  function nuevoCodigo() {
    const r = crypto.getRandomValues(new Uint32Array(8));
    let s = "";
    for (const n of r) s += ALFABETO[n % ALFABETO.length];
    return `CND-${s.slice(0, 4)}-${s.slice(4)}`;
  }
  // Acepta "cnd7k3mq9xp", "CND-7K3M-Q9XP", "7k3m q9xp" o el texto del QR
  function normalizarCodigo(raw) {
    let s = String(raw || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (s.startsWith("CND")) s = s.slice(3);
    if (s.length !== 8) return null;
    const c = `CND-${s.slice(0, 4)}-${s.slice(4)}`;
    return RE_CODIGO.test(c) ? c : null;
  }

  // ── Estado ────────────────────────────────────────────────
  function estadoDe(v, now = ahora()) {
    if (v.estado === "canjeado") return "canjeado";
    if (v.estado === "anulado") return "anulado";
    if (now > v.vence) return "vencido";
    return "vigente";
  }
  const ESTADOS = {
    vigente:  { txt: "Vigente",  bg: "#E7F6EC", fg: "#14532D" },
    vencido:  { txt: "Vencido",  bg: "#FEF3C7", fg: "#92400E" },
    canjeado: { txt: "Usado",    bg: "#EEECE6", fg: "#3a3836" },
    anulado:  { txt: "Anulado",  bg: "#FDE7E4", fg: "#9B2C1C" },
  };
  const badge = est => `<span class="vch-badge" style="background:${ESTADOS[est].bg};color:${ESTADOS[est].fg}">${ESTADOS[est].txt}</span>`;
  const nombreLocal = k => (locales[k] && locales[k].nombre) || k || "—";

  function contenidoTxt(v) {
    if (v.tipo === "monto") return pesos(v.monto);
    return (v.items || []).filter(Boolean).map(i => `${i.cant} × ${i.nombre}`).join(", ");
  }

  // ══════════════════════════════════════════════════════════
  //  DIBUJO DEL VOUCHER (réplica del diseño de la tarjeta física)
  //  Coordenadas en puntos del PDF original (img/voucher-*.svg).
  //  Un solo dibujo sirve para la vista previa, la impresión y la
  //  imagen que se manda por WhatsApp.
  // ══════════════════════════════════════════════════════════
  const VB = { x: 0, y: 0.113, w: 255.238, h: 142.242 };
  const ESCALA = 6;                       // px por punto → 1531 × 853 px
  const ROJO = "#E34E44", CREMA = "#E8E8CA";
  const FUENTE = "Montserrat, 'Plus Jakarta Sans', sans-serif";
  const imgs = {};

  function cargarImg(src) {
    if (!imgs[src]) imgs[src] = new Promise((ok, fail) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = fail;
      i.src = src;
    });
    return imgs[src];
  }
  let fuentesListas = null;
  function cargarFuentes() {
    if (!fuentesListas) fuentesListas = Promise.all(["300", "500", "700"].map(w => document.fonts.load(`${w} 12px Montserrat`))).catch(() => {});
    return fuentesListas;
  }

  function prepararLienzo(canvas) {
    canvas.width = Math.round(VB.w * ESCALA);
    canvas.height = Math.round(VB.h * ESCALA);
    const ctx = canvas.getContext("2d");
    ctx.setTransform(ESCALA, 0, 0, ESCALA, -VB.x * ESCALA, -VB.y * ESCALA);
    return ctx;
  }

  // Achica la letra hasta que el texto entre en el ancho disponible
  function ajustar(ctx, texto, peso, tam, anchoMax, minimo) {
    let t = tam;
    for (;;) {
      ctx.font = `${peso} ${t}px ${FUENTE}`;
      if (ctx.measureText(texto).width <= anchoMax || t <= minimo) return t;
      t = Math.max(minimo, t - 0.25);
    }
  }

  function redondeado(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  async function dibujarDorso(canvas, v) {
    await cargarFuentes();
    const fondo = await cargarImg("img/voucher-dorso.svg");
    const ctx = prepararLienzo(canvas);
    ctx.drawImage(fondo, VB.x, VB.y, VB.w, VB.h);
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "left";
    ctx.fillStyle = ROJO;
    const X = 20.47, ANCHO = 136;   // hasta antes del recuadro del QR

    // "¡Felicidades! Ganaste:"
    ajustar(ctx, v.encabezado || "", 500, 7, ANCHO, 4);
    ctx.fillText(v.encabezado || "", X, 37.3);
    // "MERIENDA PARA 2"
    const titulo = String(v.titulo || "").toUpperCase();
    ajustar(ctx, titulo, 300, 12.75, ANCHO, 6);
    ctx.fillText(titulo, X, 57.94);
    // "GRATIS" / "$15.000"
    const dest = String(v.destacado || "").toUpperCase();
    ajustar(ctx, dest, 700, 32.4, ANCHO, 12);
    ctx.fillText(dest, X, 89.1);

    // Píldora "Cupón válido para canjear hasta el día 31/07/2026"
    const p1 = "Cupón válido para canjear hasta el día ", p2 = fmtDia(v.vence);
    const tam = 4.95;
    ctx.font = `300 ${tam}px ${FUENTE}`; const w1 = ctx.measureText(p1).width;
    ctx.font = `700 ${tam}px ${FUENTE}`; const w2 = ctx.measureText(p2).width;
    const PAD = 2.38, PY = 96.73, PH = 7.18;
    ctx.fillStyle = ROJO;
    redondeado(ctx, X, PY, w1 + w2 + PAD * 2, PH, PH / 2);
    ctx.fill();
    ctx.fillStyle = CREMA;
    ctx.font = `300 ${tam}px ${FUENTE}`; ctx.fillText(p1, X + PAD, 102.05);
    ctx.font = `700 ${tam}px ${FUENTE}`; ctx.fillText(p2, X + PAD + w1, 102.05);

    // Recuadro rojo (ya está en el fondo): leyenda, código y QR
    const CX = 205.12;
    ctx.textAlign = "center";
    ctx.fillStyle = CREMA;
    ajustar(ctx, "Presentalo en caja", 500, 5.5, 62, 3);
    ctx.fillText("Presentalo en caja", CX, 37.3);
    ajustar(ctx, v.codigo, 700, 5.9, 62, 3);
    ctx.fillText(v.codigo, CX, 43.28);

    const Q = { x: 173.17, y: 45.08, l: 64.03 };
    ctx.fillStyle = CREMA;
    ctx.fillRect(Q.x, Q.y, Q.l, Q.l);
    const qr = qrcode(0, "M");
    qr.addData(v.codigo);
    qr.make();
    const n = qr.getModuleCount(), margen = 2, m = Q.l / (n + 2 * margen);
    ctx.fillStyle = ROJO;
    ctx.beginPath();   // un solo trazado: sin rayitas entre los cuadraditos
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      if (qr.isDark(r, c)) ctx.rect(Q.x + (c + margen) * m, Q.y + (r + margen) * m, m, m);
    }
    ctx.fill("nonzero");
    return canvas;
  }

  async function dibujarFrente(canvas) {
    const fondo = await cargarImg("img/voucher-frente.svg");
    const ctx = prepararLienzo(canvas);
    ctx.drawImage(fondo, VB.x, VB.y, VB.w, VB.h);
    return canvas;
  }

  const aBlob = canvas => new Promise(ok => canvas.toBlob(ok, "image/png"));

  // Imagen del dorso lista de antemano: el celular solo deja compartir
  // si se llama justo al tocar el botón (sin esperas en el medio)
  async function prepararPng(codigo) {
    const v = vouchers[codigo];
    if (!v || pngs[codigo]) return pngs[codigo];
    try {
      const blob = await aBlob(await dibujarDorso(document.createElement("canvas"), v));
      pngs[codigo] = { blob, url: URL.createObjectURL(blob) };
    } catch (err) { console.error(err); }
    return pngs[codigo];
  }

  // ══════════════════════════════════════════════════════════
  //  VALIDAR
  // ══════════════════════════════════════════════════════════
  function renderValidar(t) {
    t.innerHTML = `
      <div class="card vch-pad">
        <div class="vch-search">
          <button class="btn btn-primary" onclick="Vouchers.escanear()">📷 Escanear voucher</button>
          <div class="fg"><label class="fl" for="vch-cod">o escribir el código</label>
            <input class="fc vch-code" id="vch-cod" placeholder="CND-XXXX-XXXX" autocomplete="off" autocapitalize="characters" spellcheck="false"
              onkeydown="if(event.key==='Enter')Vouchers.buscar()"></div>
          <button class="btn btn-outline" onclick="Vouchers.buscar()">Validar</button>
        </div>
        <div id="vch-reader-wrap"></div>
      </div>
      <div id="vch-detalle"></div>`;
    renderDetalle();
  }

  function buscar() {
    const raw = document.getElementById("vch-cod").value;
    const c = normalizarCodigo(raw);
    if (!c) return mostrarNoExiste(raw, "El código tiene que tener 8 letras/números, por ejemplo CND-7K3M-Q9XP.");
    abrir(c);
  }

  async function abrir(codigo) {
    actual = codigo;
    if (tab !== "validar") { detenerEscaner(); tab = "validar"; render(); } else renderDetalle();
    if (!vouchers[codigo] && cargados === false) {
      // Todavía no llegó la lista: buscarlo directo
      const s = await db.ref(`vouchers/${codigo}`).once("value");
      if (s.exists()) vouchers[codigo] = s.val();
      renderDetalle();
    }
  }

  function mostrarNoExiste(raw, txt) {
    actual = null;
    const box = document.getElementById("vch-detalle");
    if (!box) return;
    box.innerHTML = `
      <div class="card vch-pad">
        <div class="vch-estado vch-noexiste"><div class="ico">❌</div>
          <div><b>CÓDIGO INVÁLIDO</b><span>${e(raw ? `“${raw}”: ` : "")}${e(txt)}</span></div></div>
      </div>`;
  }

  function cerrar() { actual = null; const b = document.getElementById("vch-detalle"); if (b) b.innerHTML = ""; }

  function bannerEstado(v, est) {
    const now = ahora();
    if (est === "vigente") {
      const dias = Math.round((Date.parse(hoyIso(v.vence)) - Date.parse(hoyIso(now))) / DAY_MS);
      return `<div class="vch-estado vch-vigente"><div class="ico">✅</div><div><b>VIGENTE</b>
        <span>Se puede usar hasta el ${fmtDia(v.vence)} (${dias === 0 ? "vence hoy" : dias === 1 ? "vence mañana" : `quedan ${dias} días`}). Es de un solo uso.</span></div></div>`;
    }
    if (est === "vencido") return `<div class="vch-estado vch-vencido"><div class="ico">⏰</div><div><b>VENCIDO</b><span>Venció el ${fmtDia(v.vence)}. No se puede canjear.</span></div></div>`;
    if (est === "canjeado") {
      const c = v.canje || {};
      return `<div class="vch-estado vch-canjeado"><div class="ico">⛔</div><div><b>YA FUE USADO</b>
        <span>El ${fmtDiaHora(c.ts)} en ${e(nombreLocal(c.local))} (${e(c.staff || "")}).</span></div></div>`;
    }
    const a = v.anulado || {};
    return `<div class="vch-estado vch-anulado"><div class="ico">🚫</div><div><b>ANULADO</b>
      <span>El ${fmtDiaHora(a.ts)} por ${e(a.staff || "")}${a.motivo ? ` · ${e(a.motivo)}` : ""}.</span></div></div>`;
  }

  function fichaHtml(v, est) {
    const items = (v.items || []).filter(Boolean);
    const filas = [
      ["Voucher", `<b>${e(v.titulo)}</b> · ${e(v.destacado)}`],
      ["Incluye", v.tipo === "monto"
        ? `<b>${pesos(v.monto)}</b> para gastar en una sola compra`
        : `<ul class="vch-items">${items.map(i => `<li><b>${i.cant}</b> × ${e(i.nombre)}</li>`).join("")}</ul>`],
      ["Para", v.cliente ? `${e(v.cliente.nombre || "")}${v.cliente.telefono ? ` · <a href="https://wa.me/549${e(v.cliente.telefono)}" target="_blank" rel="noopener">📱 ${e(v.cliente.telefono)}</a>` : ""}` : "—"],
      ["Origen", v.origen === "venta"
        ? `💵 Vendido${v.precio != null ? ` · ${pesos(v.precio)}` : ""}${v.pago ? ` · ${e(v.pago)}` : ""}`
        : `🎁 Regalo${v.motivo ? ` · ${e(v.motivo)}` : ""}`],
      ["Emitido", `${fmtDiaHora(v.creado)} · ${e(v.creadoPor || "")}`],
      ["Vence", fmtDia(v.vence)],
    ];
    if (v.nota) filas.push(["Nota", e(v.nota)]);
    if (v.canje) filas.push(["Canjeado", `${fmtDiaHora(v.canje.ts)} · ${e(nombreLocal(v.canje.local))} · ${e(v.canje.staff || "")}${v.canje.nota ? ` · ${e(v.canje.nota)}` : ""}`]);
    return `<dl class="vch-kv">${filas.map(([k, val]) => `<dt>${k}</dt><dd>${val}</dd>`).join("")}</dl>`;
  }

  function renderDetalle() {
    const box = document.getElementById("vch-detalle");
    if (!box || !actual) return;
    const v = vouchers[actual];
    if (!v) {
      if (!cargados) { box.innerHTML = `<div class="card vch-pad" style="color:var(--gray)">Buscando…</div>`; return; }
      return mostrarNoExiste(actual, "No existe ningún voucher con ese código. Revisá que esté bien escrito.");
    }
    const est = estadoDe(v);
    box.innerHTML = `
      <div class="card vch-pad">
        <div style="display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:12px">
          <div class="vch-code" style="font-size:18px;font-weight:700">${e(v.codigo)}</div>
          <button class="btn btn-ghost btn-sm" onclick="Vouchers.cerrar()">✕</button>
        </div>
        ${bannerEstado(v, est)}
        <div class="vch-det">
          <div>
            <div class="vch-prev"><canvas id="vch-prev-det"></canvas>${est !== "vigente" ? `<div class="vch-sello ${est}">${ESTADOS[est].txt.toUpperCase()}</div>` : ""}</div>
          </div>
          <div>
            ${fichaHtml(v, est)}
            <div class="vch-actions">
              ${est === "vigente" ? `<button class="btn btn-primary" onclick="Vouchers.canjear('${v.codigo}')">✅ Canjear ahora</button>` : ""}
              ${est === "vigente" ? accionesEnvio(v.codigo) : ""}
              ${est === "vigente" ? `<button class="btn btn-ghost btn-sm" onclick="Vouchers.anular('${v.codigo}')">🚫 Anular</button>` : ""}
            </div>
          </div>
        </div>
      </div>`;
    const cv = document.getElementById("vch-prev-det");
    dibujarDorso(cv, v).catch(err => console.error(err));
    if (est === "vigente") prepararPng(v.codigo);
  }

  function accionesEnvio(codigo) {
    return `
      <button class="btn btn-outline btn-sm" onclick="Vouchers.imprimir(['${codigo}'])">🖨️ Imprimir</button>
      <button class="btn btn-outline btn-sm" onclick="Vouchers.enviar('${codigo}')">📲 WhatsApp</button>
      <button class="btn btn-ghost btn-sm" onclick="Vouchers.descargar('${codigo}')">⬇️ Imagen</button>`;
  }

  // ── Canjear (una sola vez) ────────────────────────────────
  function canjear(codigo) {
    const v = vouchers[codigo];
    if (!v || estadoDe(v) !== "vigente") return toast("⚠️ Este voucher ya no se puede usar");
    let localGuardado = "";
    try { localGuardado = localStorage.getItem("vch_local") || ""; } catch (_) {}
    const opciones = Object.entries(locales);
    document.getElementById("modal-root").innerHTML = `
      <div class="mbackdrop"><div class="modal">
        <div class="mtitle">✅ Canjear voucher</div>
        <div class="msub" style="font-size:14px;color:var(--black)">Entregá <b>${e(contenidoTxt(v))}</b>${v.cliente && v.cliente.nombre ? ` a <b>${e(v.cliente.nombre)}</b>` : ""}. Después de confirmar, el voucher <b>queda usado</b> y no se puede volver a canjear.</div>
        <div class="fg mb12"><label class="fl" for="vch-local">Local</label>
          <select class="fc" id="vch-local">${opciones.map(([k, l]) => `<option value="${e(k)}" ${k === localGuardado ? "selected" : ""}>${e(l.nombre)}</option>`).join("")}</select></div>
        <div class="fg mb12"><label class="fl" for="vch-canje-nota">Nota (opcional)</label>
          <input class="fc" id="vch-canje-nota" maxlength="120" placeholder="Ej: ticket 1234"></div>
        <div class="fxc" style="justify-content:flex-end">
          <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
          <button class="btn btn-primary" id="vch-canje-ok" onclick="Vouchers.confirmarCanje('${v.codigo}')">Sí, canjear</button>
        </div>
      </div></div>`;
  }

  async function confirmarCanje(codigo) {
    const local = document.getElementById("vch-local").value;
    const nota = document.getElementById("vch-canje-nota").value.trim();
    const btn = document.getElementById("vch-canje-ok");
    btn.disabled = true; btn.textContent = "Canjeando…";
    try { localStorage.setItem("vch_local", local); } catch (_) {}
    const canje = { ts: firebase.database.ServerValue.TIMESTAMP, staff: user.email, local };
    if (nota) canje.nota = nota;
    try {
      // Las reglas solo aceptan esto si el voucher sigue activo y sin vencer:
      // si dos cajas lo canjean a la vez, la segunda recibe un error.
      await db.ref(`vouchers/${codigo}`).update({ estado: "canjeado", canje });
      closeModal();
      toast(`✅ Voucher ${codigo} canjeado`);
    } catch (err) {
      console.error(err);
      closeModal();
      const s = await db.ref(`vouchers/${codigo}`).once("value").catch(() => null);
      if (s && s.exists()) vouchers[codigo] = s.val();
      renderDetalle();
      toast("⚠️ No se pudo canjear: ya fue usado, venció o se anuló");
    }
  }

  // ── Anular ────────────────────────────────────────────────
  function anular(codigo) {
    const v = vouchers[codigo];
    if (!v || estadoDe(v) !== "vigente") return;
    document.getElementById("modal-root").innerHTML = `
      <div class="mbackdrop"><div class="modal">
        <div class="mtitle">🚫 Anular voucher</div>
        <div class="msub" style="font-size:14px;color:var(--black)">El voucher <b>${e(codigo)}</b> (${e(v.titulo)}) deja de servir para siempre. Esto no se puede deshacer.</div>
        <div class="fg mb12"><label class="fl" for="vch-anular-motivo">Motivo</label>
          <input class="fc" id="vch-anular-motivo" maxlength="120" placeholder="Ej: se generó por error"></div>
        <div id="vch-anular-err" style="color:#b83a25;font-size:13px;min-height:18px"></div>
        <div class="fxc" style="justify-content:flex-end">
          <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
          <button class="btn btn-primary" onclick="Vouchers.confirmarAnular('${codigo}')">Anular</button>
        </div>
      </div></div>`;
    document.getElementById("vch-anular-motivo").focus();
  }

  async function confirmarAnular(codigo) {
    const motivo = document.getElementById("vch-anular-motivo").value.trim();
    if (motivo.length < 3) { document.getElementById("vch-anular-err").textContent = "Escribí el motivo."; return; }
    try {
      await db.ref(`vouchers/${codigo}`).update({ estado: "anulado", anulado: { ts: firebase.database.ServerValue.TIMESTAMP, staff: user.email, motivo } });
      closeModal();
      toast(`Voucher ${codigo} anulado`);
    } catch (err) { console.error(err); closeModal(); toast("⚠️ No se pudo anular"); }
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

  async function escanear() {
    detenerEscaner();
    const wrap = document.getElementById("vch-reader-wrap");
    if (!wrap) return;
    wrap.innerHTML = `<div id="vch-reader" class="mt12"></div><button class="btn btn-ghost btn-block mt12" onclick="Vouchers.detenerEscaner()">Cancelar</button>`;
    try {
      await cargarLibEscaner();
      scanner = new Html5Qrcode("vch-reader");
      await scanner.start({ facingMode: "environment" }, { fps: 10, qrbox: 220 }, texto => {
        if (Fidel.uidDeQr(texto)) { detenerEscaner(); return toast("Ese QR es una tarjeta del ⭐ Club, no un voucher"); }
        const c = normalizarCodigo(texto);
        detenerEscaner();
        if (!c) return mostrarNoExiste(texto, "Ese QR no es un voucher de Candela.");
        const inp = document.getElementById("vch-cod");
        if (inp) inp.value = c;
        abrir(c);
      }, () => {});
    } catch (err) {
      console.error(err);
      wrap.innerHTML = `<div class="vch-warn mt12">No se pudo abrir la cámara. Revisá que el navegador tenga permiso de cámara (y que el sistema esté abierto con https).</div>`;
    }
  }

  function detenerEscaner() {
    const s = scanner;
    scanner = null;
    if (s) s.stop().catch(() => {}).finally(() => { try { s.clear(); } catch (_) {} });
    const w = document.getElementById("vch-reader-wrap");
    if (w) w.innerHTML = "";
  }

  // ══════════════════════════════════════════════════════════
  //  GENERAR
  // ══════════════════════════════════════════════════════════
  let form = null;
  function formNuevo() {
    return {
      tipo: "productos", origen: "regalo",
      items: [{ cant: 2, nombre: "" }],
      monto: "", titulo: "", destacado: "GRATIS", encabezado: ENCABEZADO.regalo,
      motivo: "", precio: "", pago: "", clienteNombre: "", clienteTel: "", nota: "",
      vence: sumarDiasIso(hoyIso(), DIAS_VALIDEZ), cantidad: 1,
    };
  }

  function renderGenerar(t) {
    if (recienCreados.length) { t.innerHTML = `<div id="vch-creados"></div>`; return renderCreados(); }
    if (!form) form = formNuevo();
    const f = form;
    const productos = (typeof menu !== "undefined" ? menu : []).map(m => m.name);
    t.innerHTML = `
      <div class="vch-form">
        <div class="card vch-pad">
          <div class="fg"><span class="fl">Tipo de voucher</span>
            <div class="vch-seg">
              <label><input type="radio" name="vch-tipo" value="productos" ${f.tipo === "productos" ? "checked" : ""} onchange="Vouchers.campo('tipo',this.value)"><span>🥐 Productos</span></label>
              <label><input type="radio" name="vch-tipo" value="monto" ${f.tipo === "monto" ? "checked" : ""} onchange="Vouchers.campo('tipo',this.value)"><span>💲 Monto</span></label>
            </div></div>

          ${f.tipo === "productos" ? `
            <div class="fg"><span class="fl">Qué incluye</span>
              <datalist id="vch-productos">${productos.map(p => `<option value="${e(p)}">`).join("")}</datalist>
              <div id="vch-items">${f.items.map((it, i) => `
                <div class="vch-item">
                  <input class="fc" type="number" min="1" max="99" value="${e(String(it.cant))}" aria-label="Cantidad" oninput="Vouchers.item(${i},'cant',this.value)">
                  <input class="fc" list="vch-productos" maxlength="60" value="${e(it.nombre)}" placeholder="Ej: Café con leche" aria-label="Producto" oninput="Vouchers.item(${i},'nombre',this.value)">
                  <button class="btn btn-ghost btn-sm" type="button" onclick="Vouchers.quitarItem(${i})" ${f.items.length < 2 ? "disabled" : ""} aria-label="Quitar">✕</button>
                </div>`).join("")}</div>
              <button class="btn btn-ghost btn-sm" type="button" onclick="Vouchers.agregarItem()" style="align-self:flex-start">+ Agregar producto</button>
            </div>` : `
            <div class="fg"><label class="fl" for="vch-monto">Monto ($)</label>
              <input class="fc" id="vch-monto" type="number" min="1" step="1" inputmode="numeric" value="${e(String(f.monto))}" placeholder="15000" oninput="Vouchers.campo('monto',this.value)"></div>`}

          <div class="fl" style="margin:8px 0 8px">Lo que dice el voucher</div>
          <div class="fg"><label class="fl" for="vch-enc">Frase de arriba</label>
            <input class="fc" id="vch-enc" maxlength="40" value="${e(f.encabezado)}" oninput="Vouchers.campo('encabezado',this.value,true)"></div>
          <div class="fg"><label class="fl" for="vch-tit">Título</label>
            <input class="fc" id="vch-tit" maxlength="40" value="${e(f.titulo)}" placeholder="${f.tipo === "monto" ? "Gift card" : "Merienda para 2"}" oninput="Vouchers.campo('titulo',this.value,true)"></div>
          <div class="fg"><label class="fl" for="vch-dest">Texto grande</label>
            <input class="fc" id="vch-dest" maxlength="20" value="${e(f.destacado)}" oninput="Vouchers.campo('destacado',this.value,true)"></div>

          <div class="fg"><span class="fl">Origen</span>
            <div class="vch-seg">
              <label><input type="radio" name="vch-origen" value="regalo" ${f.origen === "regalo" ? "checked" : ""} onchange="Vouchers.campo('origen',this.value)"><span>🎁 Regalo</span></label>
              <label><input type="radio" name="vch-origen" value="venta" ${f.origen === "venta" ? "checked" : ""} onchange="Vouchers.campo('origen',this.value)"><span>💵 Venta</span></label>
            </div></div>
          ${f.origen === "regalo" ? `
            <div class="fg"><label class="fl" for="vch-motivo">Motivo</label>
              <input class="fc" id="vch-motivo" list="vch-motivos" maxlength="60" value="${e(f.motivo)}" placeholder="Ej: Sorteo de Instagram" oninput="Vouchers.campo('motivo',this.value,true)">
              <datalist id="vch-motivos">${MOTIVOS.map(m => `<option value="${m}">`).join("")}</datalist></div>` : `
            <div class="vch-row2">
              <div class="fg"><label class="fl" for="vch-precio">Cobrado ($)</label>
                <input class="fc" id="vch-precio" type="number" min="0" step="1" inputmode="numeric" value="${e(String(f.precio))}" oninput="Vouchers.campo('precio',this.value,true)"></div>
              <div class="fg"><label class="fl" for="vch-pago">Medio de pago</label>
                <select class="fc" id="vch-pago" onchange="Vouchers.campo('pago',this.value,true)">
                  <option value="">Elegí…</option>${PAGOS.map(p => `<option ${f.pago === p ? "selected" : ""}>${p}</option>`).join("")}</select></div>
            </div>`}

          <div class="vch-row2">
            <div class="fg"><label class="fl" for="vch-cli">Para (opcional)</label>
              <input class="fc" id="vch-cli" maxlength="60" value="${e(f.clienteNombre)}" placeholder="Nombre" oninput="Vouchers.campo('clienteNombre',this.value,true)"></div>
            <div class="fg"><label class="fl" for="vch-tel">WhatsApp (opcional)</label>
              <input class="fc" id="vch-tel" type="tel" inputmode="numeric" value="${e(f.clienteTel)}" placeholder="387 512 3456" oninput="Vouchers.campo('clienteTel',this.value,true)"></div>
          </div>
          <div class="vch-row2">
            <div class="fg"><label class="fl" for="vch-vence">Válido hasta</label>
              <input class="fc" id="vch-vence" type="date" min="${hoyIso()}" value="${e(f.vence)}" onchange="Vouchers.campo('vence',this.value,true)"></div>
            <div class="fg"><label class="fl" for="vch-cant">Cantidad de vouchers</label>
              <input class="fc" id="vch-cant" type="number" min="1" max="50" value="${e(String(f.cantidad))}" oninput="Vouchers.campo('cantidad',this.value,true)"></div>
          </div>
          <div class="fg"><label class="fl" for="vch-nota">Nota interna (opcional)</label>
            <input class="fc" id="vch-nota" maxlength="120" value="${e(f.nota)}" oninput="Vouchers.campo('nota',this.value,true)"></div>

          <div id="vch-gen-err" style="color:#b83a25;font-size:13px;min-height:18px"></div>
          <button class="btn btn-primary btn-block" id="vch-gen-btn" onclick="Vouchers.generar()">🎟️ Generar voucher</button>
        </div>
        <div class="vch-sticky">
          <div class="fl mb8">Vista previa</div>
          <div class="vch-prev"><canvas id="vch-prev-gen"></canvas></div>
          <div class="ss mt8">El código y el QR se crean al generar. Vence a los ${DIAS_VALIDEZ} días si no cambiás la fecha.</div>
        </div>
      </div>`;
    dibujarPrevia();
  }

  // El texto grande y la frase se completan solos hasta que alguien los edite
  let autoDest = "GRATIS", autoEnc = ENCABEZADO.regalo;
  function campo(k, val, sinRedibujar) {
    const f = form;
    f[k] = val;
    if (k === "tipo") {
      const nuevo = val === "monto" ? (f.monto ? pesos(f.monto) : "") : "GRATIS";
      if (f.destacado === autoDest) f.destacado = nuevo;
      autoDest = nuevo;
      if (val === "monto" && !f.titulo) f.titulo = "Gift card";
      if (val === "productos" && f.titulo === "Gift card") f.titulo = "";
    }
    if (k === "monto") {
      const nuevo = val ? pesos(val) : "";
      if (f.destacado === autoDest) { f.destacado = nuevo; const d = document.getElementById("vch-dest"); if (d) d.value = nuevo; }
      autoDest = nuevo;
      if (f.origen === "venta" && (f.precio === "" || f.precio === String(f._precioAuto))) {
        f.precio = val; f._precioAuto = val;
        const p = document.getElementById("vch-precio"); if (p) p.value = val;
      }
    }
    if (k === "origen") {
      const nuevo = ENCABEZADO[val];
      if (f.encabezado === autoEnc) f.encabezado = nuevo;
      autoEnc = nuevo;
      if (val === "venta" && f.tipo === "monto" && f.precio === "") { f.precio = f.monto; f._precioAuto = f.monto; }
    }
    if (sinRedibujar || k === "monto") return dibujarPrevia();
    render();
  }
  function item(i, k, val) { form.items[i][k] = val; }
  function agregarItem() { form.items.push({ cant: 1, nombre: "" }); render(); }
  function quitarItem(i) { form.items.splice(i, 1); render(); }

  // Voucher armado con lo que hay en el formulario (sin validar)
  function voucherDelForm(codigo) {
    const f = form;
    return {
      codigo, tipo: f.tipo,
      encabezado: f.encabezado.trim(),
      titulo: f.titulo.trim() || (f.tipo === "monto" ? "Gift card" : ""),
      destacado: f.destacado.trim(),
      vence: f.vence ? finDelDia(f.vence) : finDelDia(sumarDiasIso(hoyIso(), DIAS_VALIDEZ)),
    };
  }

  let previaPendiente = null;
  function dibujarPrevia() {
    clearTimeout(previaPendiente);
    previaPendiente = setTimeout(() => {
      const cv = document.getElementById("vch-prev-gen");
      const v = voucherDelForm("CND-XXXX-XXXX");
      if (!v.titulo) v.titulo = "Merienda para 2";
      if (cv) dibujarDorso(cv, v).catch(err => console.error(err));
    }, 120);
  }

  function validarForm() {
    const f = form;
    const v = voucherDelForm("");
    if (v.encabezado.length < 2) return "Completá la frase de arriba.";
    if (v.titulo.length < 2) return "Escribí el título del voucher (ej: Merienda para 2).";
    if (!v.destacado) return "Completá el texto grande (ej: GRATIS o $15.000).";
    if (f.tipo === "productos") {
      const items = f.items.map(i => ({ cant: parseInt(i.cant, 10), nombre: String(i.nombre || "").trim() })).filter(i => i.nombre);
      if (!items.length) return "Agregá al menos un producto.";
      if (items.some(i => !(i.cant >= 1 && i.cant <= 99))) return "Revisá las cantidades (de 1 a 99).";
    } else if (!(Number(f.monto) >= 1)) return "Escribí el monto del voucher.";
    if (f.origen === "venta" && f.precio !== "" && !(Number(f.precio) >= 0)) return "Revisá el importe cobrado.";
    if (!f.vence || finDelDia(f.vence) < ahora()) return "La fecha de vencimiento tiene que ser hoy o más adelante.";
    if (f.clienteTel && !Fidel.normalizarTelefono(f.clienteTel)) return "El WhatsApp tiene que tener 10 números: código de área sin 0 y número sin 15.";
    const n = parseInt(f.cantidad, 10);
    if (!(n >= 1 && n <= 50)) return "La cantidad tiene que ser de 1 a 50.";
    return null;
  }

  async function generar() {
    const err = validarForm();
    const errBox = document.getElementById("vch-gen-err");
    if (err) { errBox.textContent = err; return; }
    errBox.textContent = "";
    const f = form;
    const base = voucherDelForm("");
    delete base.codigo;
    const datos = {
      ...base,
      origen: f.origen,
      creado: firebase.database.ServerValue.TIMESTAMP,
      creadoPor: user.email,
      estado: "activo",
    };
    if (f.tipo === "productos") {
      datos.items = f.items.map(i => ({ cant: parseInt(i.cant, 10), nombre: String(i.nombre).trim() })).filter(i => i.nombre);
    } else datos.monto = Math.round(Number(f.monto));
    if (f.origen === "regalo" && f.motivo.trim()) datos.motivo = f.motivo.trim();
    if (f.origen === "venta") {
      if (f.precio !== "") datos.precio = Math.round(Number(f.precio));
      if (f.pago) datos.pago = f.pago;
    }
    if (f.clienteNombre.trim() || f.clienteTel) {
      datos.cliente = {};
      if (f.clienteNombre.trim()) datos.cliente.nombre = f.clienteNombre.trim();
      const tel = Fidel.normalizarTelefono(f.clienteTel);
      if (tel) datos.cliente.telefono = tel;
    }
    if (f.nota.trim()) datos.nota = f.nota.trim();
    const n = parseInt(f.cantidad, 10);
    if (n > 1) datos.lote = db.ref("vouchers").push().key;

    const btn = document.getElementById("vch-gen-btn");
    btn.disabled = true; btn.textContent = "Generando…";
    const creados = [];
    try {
      for (let i = 0; i < n; i++) {
        // Si por casualidad el código ya existe, las reglas rechazan la escritura y se prueba otro
        for (let intento = 0; ; intento++) {
          const codigo = nuevoCodigo();
          try {
            await db.ref(`vouchers/${codigo}`).set({ ...datos, codigo });
            creados.push(codigo);
            break;
          } catch (e2) { if (intento >= 2) throw e2; }
        }
      }
    } catch (e3) {
      console.error(e3);
      btn.disabled = false; btn.textContent = "🎟️ Generar voucher";
      errBox.textContent = creados.length
        ? `Se generaron ${creados.length} de ${n}. Revisá la conexión y volvé a intentar con el resto.`
        : "No se pudo generar. ¿Están publicadas las reglas de la base (database.rules.json)?";
      if (!creados.length) return;
    }
    toast(creados.length > 1 ? `✅ ${creados.length} vouchers generados` : `✅ Voucher ${creados[0]} generado`);
    form = null;
    recienCreados = creados;
    render();
  }

  function renderCreados() {
    const box = document.getElementById("vch-creados");
    if (!box) return;
    const lista = recienCreados.filter(c => vouchers[c]);
    if (!lista.length) { box.innerHTML = `<div class="card vch-pad" style="color:var(--gray)">Guardando…</div>`; return; }
    if (lista.length === 1) {
      const v = vouchers[lista[0]];
      box.innerHTML = `
        <div class="card vch-pad">
          <div class="vch-estado vch-vigente"><div class="ico">🎟️</div><div><b>VOUCHER GENERADO</b>
            <span>Código <b class="vch-code">${e(v.codigo)}</b> · válido hasta el ${fmtDia(v.vence)}</span></div></div>
          <div class="vch-det">
            <div class="vch-prev"><canvas id="vch-prev-new"></canvas></div>
            <div>
              ${fichaHtml(v, "vigente")}
              <div class="vch-actions">${accionesEnvio(v.codigo)}</div>
              <button class="btn btn-ghost btn-sm mt12" onclick="Vouchers.setTab('generar')">+ Generar otro</button>
            </div>
          </div>
        </div>`;
      dibujarDorso(document.getElementById("vch-prev-new"), v).catch(err => console.error(err));
      prepararPng(v.codigo);
      return;
    }
    box.innerHTML = `
      <div class="card vch-pad">
        <div class="vch-estado vch-vigente"><div class="ico">🎟️</div><div><b>${lista.length} VOUCHERS GENERADOS</b>
          <span>Cada uno tiene su propio código y se puede usar una sola vez. Tocá uno para verlo o mandarlo.</span></div></div>
        <div class="vch-actions">
          <button class="btn btn-primary" onclick="Vouchers.imprimir(${e(JSON.stringify(lista))})">🖨️ Imprimir todos</button>
          <button class="btn btn-ghost btn-sm" onclick="Vouchers.setTab('generar')">+ Generar otro</button>
        </div>
        <div class="vch-lote">${lista.map(c => `
          <button onclick="Vouchers.abrir('${c}')"><div class="vch-prev"><canvas data-vch="${c}"></canvas></div><div class="vch-code">${c}</div></button>`).join("")}</div>
      </div>`;
    box.querySelectorAll("canvas[data-vch]").forEach(cv => dibujarDorso(cv, vouchers[cv.dataset.vch]).catch(err => console.error(err)));
  }

  // ══════════════════════════════════════════════════════════
  //  LISTADO
  // ══════════════════════════════════════════════════════════
  const FILTROS = [
    ["vigentes", "Vigentes"], ["porvencer", `Vencen en ${POR_VENCER_DIAS} días`], ["canjeados", "Usados"],
    ["vencidos", "Vencidos"], ["anulados", "Anulados"], ["todos", "Todos"],
  ];

  function filtrados() {
    const now = ahora();
    const q = busqueda.trim().toLowerCase();
    return Object.values(vouchers).filter(v => {
      const est = estadoDe(v, now);
      if (filtro === "vigentes" && est !== "vigente") return false;
      if (filtro === "porvencer" && !(est === "vigente" && v.vence - now <= POR_VENCER_DIAS * DAY_MS)) return false;
      if (filtro === "canjeados" && est !== "canjeado") return false;
      if (filtro === "vencidos" && est !== "vencido") return false;
      if (filtro === "anulados" && est !== "anulado") return false;
      if (!q) return true;
      const txt = [v.codigo, v.titulo, v.destacado, v.motivo, v.cliente && v.cliente.nombre, v.cliente && v.cliente.telefono, contenidoTxt(v)].join(" ").toLowerCase();
      return txt.includes(q) || txt.replace(/-/g, "").includes(q.replace(/-/g, ""));
    }).sort((a, b) => (filtro === "vigentes" || filtro === "porvencer") ? a.vence - b.vence : b.creado - a.creado);
  }

  function renderListado(t) {
    const now = ahora();
    const todos = Object.values(vouchers);
    const cuenta = est => todos.filter(v => estadoDe(v, now) === est).length;
    const vendidos = todos.filter(v => v.origen === "venta");
    t.innerHTML = `
      <div class="vch-stats">
        <div class="scard"><b style="color:#14532D">${cuenta("vigente")}</b><span>Vigentes</span></div>
        <div class="scard"><b>${cuenta("canjeado")}</b><span>Usados</span></div>
        <div class="scard"><b style="color:#92400E">${cuenta("vencido")}</b><span>Vencidos sin usar</span></div>
        <div class="scard"><b>${pesos(vendidos.reduce((s, v) => s + (v.precio || 0), 0))}</b><span>Vendido en vouchers</span></div>
      </div>
      <div class="card vch-pad">
        <div class="vch-chips">${FILTROS.map(([k, l]) => `<button class="vch-chip${filtro === k ? " on" : ""}" onclick="Vouchers.setFiltro('${k}')">${l}</button>`).join("")}</div>
        <input class="fc mb12" style="width:100%" id="vch-busq" placeholder="Buscar por código, cliente o producto" value="${e(busqueda)}" oninput="Vouchers.setBusqueda(this.value)">
        <div id="vch-lista">${tablaListado()}</div>
      </div>`;
  }

  function tablaListado() {
    if (!cargados) return `<div style="color:var(--gray);padding:12px 0">Cargando…</div>`;
    const lista = filtrados();
    if (!lista.length) return `<div style="color:var(--gray);padding:12px 0">No hay vouchers para mostrar.</div>`;
    const now = ahora();
    return `<div class="vch-tablewrap"><table class="otbl"><thead><tr><th>Código</th><th>Voucher</th><th>Para</th><th>Origen</th><th>Vence</th><th>Estado</th></tr></thead>
      <tbody>${lista.map(v => {
        const est = estadoDe(v, now);
        return `<tr class="vch-rowc" onclick="Vouchers.abrir('${v.codigo}')">
          <td class="vch-code" style="white-space:nowrap">${e(v.codigo)}</td>
          <td><b>${e(v.titulo)}</b><br><span style="font-size:12px;color:var(--gray)">${e(contenidoTxt(v))}</span></td>
          <td>${e((v.cliente && v.cliente.nombre) || "—")}</td>
          <td>${v.origen === "venta" ? `💵 ${v.precio != null ? pesos(v.precio) : "Venta"}` : `🎁 ${e(v.motivo || "Regalo")}`}</td>
          <td style="white-space:nowrap">${fmtDia(v.vence)}</td>
          <td>${badge(est)}</td>
        </tr>`;
      }).join("")}</tbody></table></div>`;
  }

  function setFiltro(f) { filtro = f; render(); }
  function setBusqueda(v) {
    busqueda = v;
    const l = document.getElementById("vch-lista");
    if (l) l.innerHTML = tablaListado();
  }

  // ══════════════════════════════════════════════════════════
  //  IMPRIMIR / WHATSAPP / IMAGEN
  // ══════════════════════════════════════════════════════════
  // Hoja A4 con el tamaño real del voucher (90 × 50 mm): dorso y frente
  // uno al lado del otro. Se recorta el contorno y se dobla por la línea
  // del medio para que quede de doble faz.
  async function imprimir(codigos) {
    const lista = codigos.filter(c => vouchers[c]);
    if (!lista.length) return;
    const win = window.open("", "_blank");
    if (!win) return toast("⚠️ El navegador bloqueó la ventana de impresión");
    win.document.write(`<p style="font-family:sans-serif;padding:20px">Preparando vouchers…</p>`);
    try {
      const frente = (await dibujarFrente(document.createElement("canvas"))).toDataURL("image/png");
      const dorsos = [];
      for (const c of lista) dorsos.push((await dibujarDorso(document.createElement("canvas"), vouchers[c])).toDataURL("image/png"));
      const mmW = (VB.w * 25.4 / 72).toFixed(2), mmH = (VB.h * 25.4 / 72).toFixed(2);
      win.document.open();
      win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Vouchers Candela</title>
        <style>
          *{box-sizing:border-box;margin:0;padding:0}
          @page{size:A4;margin:10mm}
          body{font-family:sans-serif}
          .ayuda{font-size:9pt;color:#777;margin-bottom:5mm}
          .par{display:flex;margin-bottom:5mm;break-inside:avoid;width:max-content;outline:.2mm dashed #bbb}
          .par img{width:${mmW}mm;height:${mmH}mm;display:block}
          .par img+img{border-left:.2mm dashed #bbb}
          @media print{.ayuda{display:none}}
        </style></head><body>
        <div class="ayuda">Recortá por el contorno punteado y doblá por la línea del medio: queda el voucher de doble faz (${mmW} × ${mmH} mm).</div>
        ${dorsos.map(d => `<div class="par"><img src="${d}"><img src="${frente}"></div>`).join("")}
        </body></html>`);
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 500);
    } catch (err) {
      console.error(err);
      win.close();
      toast("⚠️ No se pudo preparar la impresión. Abrí el sistema desde su dirección web (no como archivo).");
    }
  }

  function mensaje(v) {
    const hola = v.cliente && v.cliente.nombre ? `¡Hola ${v.cliente.nombre}! ` : "¡Hola! ";
    return `${hola}Te enviamos tu voucher de Candela Café & Patisserie: ${v.titulo} ${v.destacado}. ` +
      `Código ${v.codigo}, válido hasta el ${fmtDia(v.vence)}. Presentalo en caja (se usa una sola vez).`;
  }

  function enviar(codigo) {
    const v = vouchers[codigo];
    if (!v) return;
    const png = pngs[codigo];
    const texto = mensaje(v);
    if (png && navigator.canShare) {
      const file = new File([png.blob], `voucher-${codigo}.png`, { type: "image/png" });
      if (navigator.canShare({ files: [file] })) {
        navigator.share({ files: [file], text: texto }).catch(err => { if (err.name !== "AbortError") console.error(err); });
        return;
      }
    }
    // Compu: se descarga la imagen y se abre WhatsApp con el mensaje para adjuntarla
    descargar(codigo);
    const tel = v.cliente && v.cliente.telefono ? `549${v.cliente.telefono}` : "";
    window.open(`https://wa.me/${tel}?text=${encodeURIComponent(texto)}`, "_blank", "noopener");
    toast("Se descargó la imagen del voucher: adjuntala en el chat de WhatsApp");
  }

  async function descargar(codigo) {
    const png = await prepararPng(codigo);
    if (!png) return toast("⚠️ No se pudo crear la imagen");
    const a = document.createElement("a");
    a.href = png.url;
    a.download = `voucher-${codigo}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  return {
    init, render, setTab, logout, buscar, abrir, cerrar, escanear, detenerEscaner,
    canjear, confirmarCanje, anular, confirmarAnular,
    campo, item, agregarItem, quitarItem, generar,
    setFiltro, setBusqueda, imprimir, enviar, descargar,
    // para pruebas
    _normalizarCodigo: normalizarCodigo, _nuevoCodigo: nuevoCodigo, _dibujarDorso: dibujarDorso, _dibujarFrente: dibujarFrente,
  };
})();
