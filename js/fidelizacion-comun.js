// =============================================================
// fidelizacion-comun.js — Helpers compartidos por tarjeta.html
// (cliente) e index.html (personal). Los cálculos de día/semana
// tienen que coincidir EXACTAMENTE con database.rules.json.
// =============================================================

const Fidel = (() => {
  const TZ_MS   = 3 * 3600000;     // Argentina = UTC-3, sin horario de verano
  const DAY_MS  = 86400000;
  const WEEK_MS = 7 * DAY_MS;

  // La tarjeta física tiene 10 casilleros: el programa digital usa los mismos
  const CASILLEROS = 10;

  const CONFIG_DEFAULT = {
    sellosPremio: CASILLEROS,
    premio: "una merienda gratis",
    topeSemanal: 4,
    horaApertura: 7,
    horaCierre: 21,
  };

  const LOCALES_DEFAULT = {
    sanluis: { nombre: "San Luis" },
    sla:     { nombre: "SLA" },
  };

  // Offset entre el reloj del celular y el del servidor de Firebase
  let serverOffset = 0;
  function watchServerOffset(db) {
    db.ref(".info/serverTimeOffset").on("value", s => { serverOffset = s.val() || 0; });
  }
  function serverNow() { return Date.now() + serverOffset; }

  // Inicio del día actual (00:00 hora argentina), en ms UTC
  function inicioDia(t)    { return t - ((t - TZ_MS) % DAY_MS); }
  // Inicio de la semana (lunes 00:00 hora argentina). El epoch fue jueves → +3 días
  function inicioSemana(t) { return t - ((t - TZ_MS + 3 * DAY_MS) % WEEK_MS); }
  // Milisegundos transcurridos desde las 00:00 hora argentina
  function msDelDia(t)     { return (t - TZ_MS) % DAY_MS; }

  // Teléfono argentino: 10 dígitos (código de área sin 0 + número sin 15)
  function normalizarTelefono(raw) {
    let d = String(raw || "").replace(/\D/g, "");
    if (d.startsWith("54")) d = d.slice(2);
    if (d.length === 11 && d.startsWith("9")) d = d.slice(1);
    if (d.startsWith("0")) d = d.slice(1);
    return /^\d{10}$/.test(d) ? d : null;
  }

  // Revisa si hoy se puede sumar un sello. Devuelve null si se puede,
  // o un texto explicando por qué no. Las reglas de Firebase hacen el
  // mismo control del lado del servidor: esto es solo para avisar lindo.
  function motivoSinSello(card, config, now) {
    if (card.ultimoSello >= inicioDia(now)) return "Ya sumaste tu sello de hoy. ¡Te esperamos mañana!";
    const m = msDelDia(now);
    if (m < config.horaApertura * 3600000 || m >= config.horaCierre * 3600000) {
      return `Los sellos se suman en horario de atención (${config.horaApertura}:00 a ${config.horaCierre}:00).`;
    }
    const semana = inicioSemana(now);
    if (card.semana === semana && card.sellosSemana >= config.topeSemanal) {
      return `Llegaste al máximo de ${config.topeSemanal} sellos por semana. ¡El lunes seguís sumando!`;
    }
    return null;
  }

  // Tarjeta resultante de sumar un sello (ultimoSello lo pone el servidor)
  function tarjetaConSello(card, local, now) {
    const semana = inicioSemana(now);
    return {
      ...card,
      sellos: card.sellos + 1,
      totalSellos: card.totalSellos + 1,
      ultimoSello: firebase.database.ServerValue.TIMESTAMP,
      ultimoLocal: local,
      semana,
      sellosSemana: card.semana === semana ? card.sellosSemana + 1 : 1,
    };
  }

  // Contenido del QR personal de cada tarjeta (lo lee el personal)
  const QR_PREFIX = "CANDELA:";
  function qrDeTarjeta(uid) { return QR_PREFIX + uid; }
  function uidDeQr(text) {
    const t = String(text || "").trim();
    return t.startsWith(QR_PREFIX) ? t.slice(QR_PREFIX.length) : null;
  }

  // Dibuja un QR como SVG usando qrcode-generator (js/vendor/qrcode.js)
  function qrSvg(text, cellSize = 6) {
    const qr = qrcode(0, "M");
    qr.addData(text);
    qr.make();
    return qr.createSvgTag({ cellSize, margin: 2, scalable: true });
  }

  // QR con los colores de la marca (módulos rojos sobre crema)
  function qrSvgMarca(text) {
    const qr = qrcode(0, "M");
    qr.addData(text);
    qr.make();
    const n = qr.getModuleCount(), m = 1, t = n + 2 * m;
    let d = "";
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += `M${c + m} ${r + m}h1v1h-1z`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${t} ${t}" shape-rendering="crispEdges"><rect width="${t}" height="${t}" fill="#E8E7CA"/><path fill="#E34E44" d="${d}"/></svg>`;
  }

  // ── Tarjeta de fidelidad (réplica de la tarjeta física) ───
  // Coordenadas en puntos del PDF original (img/tarjeta-*.svg, viewBox 30.2 30.12 232.14 147.22)
  const T = { x: 30.2, y: 30.12, w: 232.14, h: 147.22 };
  const px = x => ((x - T.x) / T.w * 100).toFixed(3) + "%";
  const py = y => ((y - T.y) / T.h * 100).toFixed(3) + "%";
  const pw = w => (w / T.w * 100).toFixed(3) + "%";
  const ph = h => (h / T.h * 100).toFixed(3) + "%";
  const R = 11.325;                                   // radio de los casilleros
  const COLS = [204.365, 232.64];
  const FILAS = [51.665, 77.675, 103.685, 129.685, 155.695];
  const GIRO = [-8, 5, -3, 9, -6, 4, -10, 7, -2, 6];   // cada sello cae un poco torcido, como uno de goma

  const CSS_TARJETA = `
  .ftj{position:relative;width:100%;aspect-ratio:${T.w}/${T.h};perspective:1400px;container-type:inline-size;-webkit-tap-highlight-color:transparent}
  .ftj-in{position:absolute;inset:0;transition:transform .8s cubic-bezier(.3,1.2,.4,1);transform-style:preserve-3d}
  .ftj.frente .ftj-in{transform:rotateY(180deg)}
  .ftj-cara{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;border-radius:2.2cqw;overflow:hidden;box-shadow:0 10px 30px rgba(34,32,31,.18),0 2px 6px rgba(34,32,31,.10)}
  .ftj-cara>img{position:absolute;inset:0;width:100%;height:100%;display:block}
  .ftj-frente{transform:rotateY(180deg)}
  .ftj-ov{position:absolute}
  .ftj-nombre{left:${px(68.2)};top:${py(51.67)};width:${pw(126 - 68.2)};height:${ph(58.6 - 51.67)};display:flex;align-items:flex-end;color:#E8E7CA;font:500 2.7cqw/1 'Montserrat',sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-bottom:.35cqw}
  .ftj-texto{left:${px(88.7)};top:${py(118.2)};width:${pw(180 - 88.7)};color:#E34E44;font:400 2.62cqw/1.24 'Montserrat',sans-serif;letter-spacing:-.015em}
  .ftj-qr{left:${px(45.13)};top:${py(112.58)};width:${pw(85.05 - 45.13)};aspect-ratio:1;background:#E34E44;padding:.55cqw;border:none;cursor:zoom-in}
  .ftj-qr svg{display:block;width:100%;height:100%}
  .ftj-sello{width:${pw(2 * R)};aspect-ratio:1;border-radius:50%;background:#E8E7CA;display:flex;align-items:center;justify-content:center}
  .ftj-sello img{width:70%;height:70%;object-fit:contain;opacity:.94}
  .ftj-sello.nuevo img{animation:ftj-golpe .7s cubic-bezier(.2,1.5,.5,1) both;animation-delay:var(--d,0s)}
  @keyframes ftj-golpe{0%{transform:scale(2.4) rotate(var(--g));opacity:0}55%{transform:scale(.88) rotate(var(--g));opacity:1}100%{transform:scale(1) rotate(var(--g));opacity:.94}}
  `;
  function cssTarjeta() {
    if (document.getElementById("ftj-css")) return;
    const s = document.createElement("style");
    s.id = "ftj-css";
    s.textContent = CSS_TARJETA;
    document.head.appendChild(s);
  }

  // o = { nombre, sellos (0..10 a mostrar), premio, meta, qrText, nuevo (índice o -1), frente, id, qrClick }
  function tarjetaHtml(o) {
    cssTarjeta();
    const sellos = Array.from({ length: CASILLEROS }, (_, i) => {
      if (i >= o.sellos) return "";
      const cx = COLS[i % 2], cy = FILAS[Math.floor(i / 2)];
      const nuevo = i === o.nuevo;
      return `<div class="ftj-ov ftj-sello${nuevo ? " nuevo" : ""}" style="left:${px(cx - R)};top:${py(cy - R)};--g:${GIRO[i]}deg;${nuevo ? "--d:1.1s" : ""}">
        <img src="img/isotipo.svg" alt="" style="transform:rotate(${GIRO[i]}deg)"></div>`;
    }).join("");
    return `
      <div class="ftj${o.frente ? " frente" : ""}" id="${o.id || "ftj"}" role="img" aria-label="Tarjeta de fidelidad: ${o.sellos} de ${CASILLEROS} visitas">
        <div class="ftj-in">
          <div class="ftj-cara ftj-dorso">
            <img src="img/tarjeta-dorso.svg" alt="">
            <div class="ftj-ov ftj-nombre">${esc(o.nombre)}</div>
            <div class="ftj-ov ftj-texto">Completá ${o.meta} visitas, accedé a ${esc(o.premio)} y a más promociones exclusivas.</div>
            ${o.qrText ? `<button class="ftj-ov ftj-qr" type="button" aria-label="Agrandar código" ${o.qrClick ? `onclick="event.stopPropagation();${o.qrClick}"` : ""}>${qrSvgMarca(o.qrText)}</button>` : ""}
            ${sellos}
          </div>
          <div class="ftj-cara ftj-frente"><img src="img/tarjeta-frente.svg" alt="Tarjeta de Fidelidad Candela"></div>
        </div>
      </div>`;
  }

  function esc(s) {
    return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function fmtFecha(ts) {
    if (!ts) return "—";
    return new Date(ts).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit", timeZone: "America/Argentina/Buenos_Aires" });
  }
  function fmtFechaHora(ts) {
    if (!ts) return "—";
    return new Date(ts).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "America/Argentina/Buenos_Aires" });
  }
  function fmtCumple(mmdd) {
    if (!mmdd) return "—";
    const [m, d] = mmdd.split("-");
    return `${d}/${m}`;
  }

  return {
    CASILLEROS, CONFIG_DEFAULT, LOCALES_DEFAULT,
    watchServerOffset, serverNow,
    inicioDia, inicioSemana, msDelDia,
    normalizarTelefono, motivoSinSello, tarjetaConSello,
    qrDeTarjeta, uidDeQr, qrSvg, qrSvgMarca, tarjetaHtml,
    fmtFecha, fmtFechaHora, fmtCumple,
  };
})();
