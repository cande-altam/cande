// =============================================================
// fidelizacion-comun.js — Helpers compartidos por tarjeta.html
// (cliente) e index.html (personal). Los cálculos de día/semana
// tienen que coincidir EXACTAMENTE con database.rules.json.
// =============================================================

const Fidel = (() => {
  const TZ_MS   = 3 * 3600000;     // Argentina = UTC-3, sin horario de verano
  const DAY_MS  = 86400000;
  const WEEK_MS = 7 * DAY_MS;

  const CONFIG_DEFAULT = {
    sellosPremio: 8,
    premio: "Un café + una medialuna",
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
    CONFIG_DEFAULT, LOCALES_DEFAULT,
    watchServerOffset, serverNow,
    inicioDia, inicioSemana, msDelDia,
    normalizarTelefono, motivoSinSello, tarjetaConSello,
    qrDeTarjeta, uidDeQr, qrSvg,
    fmtFecha, fmtFechaHora, fmtCumple,
  };
})();
