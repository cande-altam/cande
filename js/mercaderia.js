// =============================================================
// mercaderia.js — Production order flow
//   • Stores (sla50, sanluis): place orders per area
//   • Production areas: view consolidated orders, update status
//   • Compras: dispatch ready orders
// =============================================================

const Mercaderia = (() => {
  // Active Firebase listeners to clean up on view change
  const _listeners = [];
  let _activeListeners = {};

  // ── helpers ──────────────────────────────────────────────

  function _arDate() {
    return new Date().toLocaleDateString("es-AR", {
      timeZone: "America/Argentina/Buenos_Aires",
      year: "numeric", month: "2-digit", day: "2-digit"
    }).split("/").reverse().join("-"); // YYYY-MM-DD
  }

  function _arHour() {
    return parseInt(
      new Date().toLocaleTimeString("es-AR", {
        timeZone: "America/Argentina/Buenos_Aires",
        hour: "2-digit", hour12: false
      }), 10
    );
  }

  function _formatDate(isoDate) {
    if (!isoDate) return "";
    const [y, m, d] = isoDate.split("-");
    return `${d}/${m}/${y}`;
  }

  function _estadoBadge(estado) {
    const map = {
      "cargado":           ["badge-cargado",    "Cargado"],
      "en producción":     ["badge-produccion",  "En producción"],
      "listo para despacho": ["badge-listo",     "Listo para despacho"],
      "despachado":        ["badge-despachado",  "Despachado"],
    };
    const [cls, label] = map[estado] || ["badge-cargado", estado];
    return `<span class="badge ${cls}">${label}</span>`;
  }

  function _areaIcon(area) {
    const icons = {
      panaderia: "🥖", pasteleria: "🎂",
      factureria: "🥧", especialidades: "🧇", sandwiches: "🥪"
    };
    return icons[area] || "🍽️";
  }

  function _removeListeners() {
    const db = firebase.database();
    Object.entries(_activeListeners).forEach(([path, handle]) => {
      db.ref(path).off("value", handle);
    });
    _activeListeners = {};
  }

  function _listen(ref, cb) {
    const handle = ref.on("value", cb);
    _activeListeners[ref.toString()] = handle;
    return handle;
  }

  // ── STORE VIEW ────────────────────────────────────────────

  function renderStoreView(role, container) {
    _removeListeners();
    const today = _arDate();

    container.innerHTML = `
      <div class="page-header">
        <h2>Pedido de Mercadería</h2>
        <p>${_formatDate(today)} — ${ROLE_NAMES[role]}</p>
      </div>
      <div id="store-status-section" class="mb-2"></div>
      <div class="tabs" id="area-tabs"></div>
      <div id="area-panel"></div>
    `;

    const tabsEl   = container.querySelector("#area-tabs");
    const panelEl  = container.querySelector("#area-panel");
    const statusEl = container.querySelector("#store-status-section");

    // Listen to today's orders for this store
    const ordersRef = firebase.database().ref(`pedidos_mercaderia/${today}`);
    _listen(ordersRef, (snap) => {
      const allOrders = snap.val() || {};
      // Filter for this store
      const myOrders = {};
      Object.entries(allOrders).forEach(([k, v]) => {
        if (v.local === role) myOrders[k] = v;
      });
      _renderStoreStatus(statusEl, myOrders, role, today, panelEl, tabsEl);
    });
  }

  function _renderStoreStatus(statusEl, myOrders, role, today, panelEl, tabsEl) {
    // Build per-area latest order map
    const areaLatest = {};
    Object.values(myOrders).forEach((o) => {
      if (!areaLatest[o.area] || o.timestamp > areaLatest[o.area].timestamp) {
        areaLatest[o.area] = o;
      }
    });

    statusEl.innerHTML = `
      <div class="card mb-2">
        <div class="card-header"><h3>Estado de pedidos de hoy</h3></div>
        <div class="card-body" style="padding:.875rem 1rem">
          <div class="area-status-grid">
            ${PRODUCTION_ROLES.map(area => {
              const o = areaLatest[area];
              const badge = o ? _estadoBadge(o.estado) : `<span class="badge badge-cargado" style="opacity:.5">Sin pedido</span>`;
              return `
                <div class="area-status-card" data-area="${area}" title="Ver / editar pedido a ${ROLE_NAMES[area]}">
                  <span class="area-icon">${_areaIcon(area)}</span>
                  <div class="area-name">${ROLE_NAMES[area]}</div>
                  <div class="area-badge">${badge}</div>
                </div>`;
            }).join("")}
          </div>
        </div>
      </div>`;

    // Click on card → navigate tab
    statusEl.querySelectorAll(".area-status-card").forEach(card => {
      card.addEventListener("click", () => {
        const area = card.dataset.area;
        tabsEl.querySelectorAll(".tab-btn").forEach(b => b.classList.toggle("active", b.dataset.area === area));
        _renderAreaOrderForm(panelEl, role, area, today);
      });
    });

    // Render tabs if not yet done
    if (!tabsEl.hasChildNodes()) {
      tabsEl.innerHTML = PRODUCTION_ROLES.map((area, i) =>
        `<button class="tab-btn${i === 0 ? " active" : ""}" data-area="${area}">${_areaIcon(area)} ${ROLE_NAMES[area]}</button>`
      ).join("");

      tabsEl.querySelectorAll(".tab-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          tabsEl.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
          btn.classList.add("active");
          _renderAreaOrderForm(panelEl, role, btn.dataset.area, today);
        });
      });

      // render first area by default
      _renderAreaOrderForm(panelEl, role, PRODUCTION_ROLES[0], today);
    }
  }

  function _renderAreaOrderForm(panelEl, role, area, today) {
    panelEl.innerHTML = `<div class="spinner"></div>`;

    const db = firebase.database();

    // Load catalog for area
    db.ref(`catalogo/productos/${area}`).once("value", (snap) => {
      const productos = snap.val() || {};

      // Load existing order for this store+area today
      db.ref(`pedidos_mercaderia/${today}`).orderByChild("local").equalTo(role).once("value", (oSnap) => {
        const allOrders = oSnap.val() || {};
        let existingOrder = null;
        let existingKey = null;
        Object.entries(allOrders).forEach(([k, v]) => {
          if (v.area === area) {
            if (!existingOrder || v.timestamp > existingOrder.timestamp) {
              existingOrder = v;
              existingKey = k;
            }
          }
        });

        // Check cutoff
        const cutoff = CUTOFF_TIMES[area];
        const currentHour = _arHour();
        const isFueraDeHorario = cutoff !== null && currentHour >= cutoff;

        const estadoDisabled = existingOrder &&
          (existingOrder.estado === "en producción" ||
           existingOrder.estado === "listo para despacho" ||
           existingOrder.estado === "despachado");

        let warningHtml = "";
        if (isFueraDeHorario) {
          warningHtml = `
            <div class="alert alert-warning">
              <span class="alert-icon">⚠️</span>
              <div>
                <strong>Fuera de horario</strong> — El horario de corte para ${ROLE_NAMES[area]} es las ${cutoff}:00 hs.
                El pedido se marcará como <em>fuera de horario</em>.
              </div>
            </div>`;
        }

        let statusHtml = "";
        if (existingOrder) {
          statusHtml = `
            <div class="alert alert-info mb-2">
              <span class="alert-icon">📋</span>
              <div>
                Último pedido: ${_estadoBadge(existingOrder.estado)}
                ${existingOrder.fuera_de_horario ? '<span class="badge badge-produccion" style="margin-left:.4rem">Fuera de horario</span>' : ""}
              </div>
            </div>`;
        }

        const productEntries = Object.entries(productos);

        if (productEntries.length === 0) {
          panelEl.innerHTML = `
            <div class="card">
              <div class="card-header">
                <h3>${_areaIcon(area)} ${ROLE_NAMES[area]}</h3>
              </div>
              <div class="card-body">
                <div class="empty-state"><span class="empty-icon">📭</span><p>No hay productos en el catálogo para esta área.</p></div>
              </div>
            </div>`;
          return;
        }

        const prevItems = existingOrder ? (existingOrder.items || {}) : {};

        panelEl.innerHTML = `
          ${warningHtml}
          ${statusHtml}
          <div class="card">
            <div class="card-header">
              <h3>${_areaIcon(area)} ${ROLE_NAMES[area]}</h3>
              ${existingOrder ? `<span class="text-small" style="opacity:.8">Podés reenviar el pedido</span>` : ""}
            </div>
            <div class="card-body">
              ${estadoDisabled ? `<div class="alert alert-success"><span class="alert-icon">✅</span><div>Este pedido ya fue tomado por producción. No se puede modificar.</div></div>` : ""}
              <div class="product-list" id="product-list-${area}">
                ${productEntries.map(([id, prod]) => {
                  const prevQty = prevItems[id] || 0;
                  return `
                    <div class="product-row">
                      <span class="product-name">${prod.nombre}</span>
                      <span class="product-unit">${prod.unidad}</span>
                      <div class="qty-stepper">
                        <button type="button" class="qty-step-btn" data-action="dec" data-id="${id}" ${estadoDisabled ? "disabled" : ""}>−</button>
                        <input type="number" class="qty-input${prevQty > 0 ? " has-value" : ""}" min="0" value="${prevQty}" data-id="${id}" data-area="${area}" ${estadoDisabled ? "disabled" : ""}>
                        <button type="button" class="qty-step-btn" data-action="inc" data-id="${id}" ${estadoDisabled ? "disabled" : ""}>+</button>
                      </div>
                    </div>`;
                }).join("")}
              </div>
              ${estadoDisabled ? "" : `
                <div class="mt-3">
                  <button class="btn btn-primary btn-lg" id="submit-order-btn">
                    📤 Hacer pedido a ${ROLE_NAMES[area]}
                  </button>
                </div>`}
            </div>
          </div>`;

        // Stepper events
        panelEl.querySelectorAll(".qty-step-btn").forEach(btn => {
          btn.addEventListener("click", () => {
            const id = btn.dataset.id;
            const action = btn.dataset.action;
            const input = panelEl.querySelector(`input[data-id="${id}"]`);
            let val = parseInt(input.value || "0", 10);
            if (action === "inc") val++;
            else if (action === "dec" && val > 0) val--;
            input.value = val;
            input.classList.toggle("has-value", val > 0);
          });
        });

        // Input direct change
        panelEl.querySelectorAll(".qty-input").forEach(inp => {
          inp.addEventListener("input", () => {
            inp.classList.toggle("has-value", parseInt(inp.value || "0", 10) > 0);
          });
        });

        // Submit
        const submitBtn = panelEl.querySelector("#submit-order-btn");
        if (submitBtn) {
          submitBtn.addEventListener("click", () => _submitOrder(role, area, today, panelEl, isFueraDeHorario));
        }
      });
    });
  }

  function _submitOrder(role, area, today, panelEl, isFueraDeHorario) {
    const inputs = panelEl.querySelectorAll(".qty-input");
    const items = {};
    let totalQty = 0;

    inputs.forEach(inp => {
      const qty = parseInt(inp.value || "0", 10);
      if (qty > 0) {
        items[inp.dataset.id] = qty;
        totalQty += qty;
      }
    });

    if (totalQty === 0) {
      App.showToast("⚠️ Ingresá al menos una cantidad antes de enviar.", "warning");
      return;
    }

    const submitBtn = panelEl.querySelector("#submit-order-btn");
    submitBtn.disabled = true;
    submitBtn.textContent = "Enviando...";

    const db = firebase.database();
    const orderData = {
      local:           role,
      area:            area,
      fecha:           today,
      timestamp:       Date.now(),
      estado:          "cargado",
      fuera_de_horario: isFueraDeHorario,
      items:           items
    };

    db.ref(`pedidos_mercaderia/${today}`).push(orderData)
      .then(() => {
        App.showToast(`✅ Pedido enviado a ${ROLE_NAMES[area]}`, "success");
        // Refresh the form
        _renderAreaOrderForm(panelEl, role, area, today);
      })
      .catch((err) => {
        console.error(err);
        App.showToast("❌ Error al enviar el pedido. Reintentá.", "danger");
        submitBtn.disabled = false;
        submitBtn.textContent = `📤 Hacer pedido a ${ROLE_NAMES[area]}`;
      });
  }

  // ── PRODUCTION AREA VIEW ──────────────────────────────────

  function renderProductionView(role, container) {
    _removeListeners();
    const today = _arDate();

    container.innerHTML = `
      <div class="page-header">
        <h2>${_areaIcon(role)} ${ROLE_NAMES[role]} — Pedidos de hoy</h2>
        <p>${_formatDate(today)}</p>
      </div>
      <div id="prod-orders-container">
        <div class="spinner"></div>
      </div>`;

    const ordersContainer = container.querySelector("#prod-orders-container");

    const ref = firebase.database().ref(`pedidos_mercaderia/${today}`);
    _listen(ref, (snap) => {
      const allOrders = snap.val() || {};
      // Filter orders for this area
      const areaOrders = {};
      Object.entries(allOrders).forEach(([k, v]) => {
        if (v.area === role) areaOrders[k] = v;
      });
      _renderProductionOrders(ordersContainer, role, areaOrders, today);
    });
  }

  function _renderProductionOrders(container, role, areaOrders, today) {
    if (Object.keys(areaOrders).length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">📭</span>
          <p>No hay pedidos para hoy todavía.</p>
        </div>`;
      return;
    }

    // Group by store
    const byStore = { sla50: {}, sanluis: {} };
    Object.entries(areaOrders).forEach(([k, v]) => {
      if (!byStore[v.local]) byStore[v.local] = {};
      // Keep latest per store
      if (!byStore[v.local][k] || v.timestamp > byStore[v.local][k].timestamp) {
        byStore[v.local] = { key: k, order: v };
      }
    });

    // Load catalog for totals
    firebase.database().ref(`catalogo/productos/${role}`).once("value", (cSnap) => {
      const catalog = cSnap.val() || {};

      // Build consolidated totals
      const totals = {};
      const storeData = {};

      STORE_ROLES.forEach(store => {
        const d = byStore[store];
        if (d && d.order) {
          storeData[store] = d;
          Object.entries(d.order.items || {}).forEach(([id, qty]) => {
            totals[id] = (totals[id] || 0) + qty;
          });
        }
      });

      // Overall status: use "worst" / latest state
      const allStatuses = Object.values(storeData).map(d => d.order.estado);
      const statusPriority = ["cargado", "en producción", "listo para despacho", "despachado"];
      const minStatus = allStatuses.reduce((acc, s) => {
        return statusPriority.indexOf(s) < statusPriority.indexOf(acc) ? s : acc;
      }, "despachado");

      const allKeys = Object.values(storeData).map(d => d.key);
      const hasFueraDeHorario = Object.values(storeData).some(d => d.order.fuera_de_horario);

      let actionsHtml = "";
      if (minStatus === "cargado") {
        actionsHtml = `<button class="btn btn-accent no-print" id="btn-en-produccion">🔧 Marcar en producción</button>`;
      } else if (minStatus === "en producción") {
        actionsHtml = `<button class="btn btn-success no-print" id="btn-listo">✅ Listo para despacho</button>`;
      } else if (minStatus === "listo para despacho" || minStatus === "despachado") {
        actionsHtml = `<span class="badge badge-listo" style="font-size:.875rem;padding:.5rem 1rem">${minStatus === "despachado" ? "✅ Despachado" : "✅ Listo para despacho"}</span>`;
      }

      const consolidatedRows = Object.entries(totals)
        .filter(([, qty]) => qty > 0)
        .map(([id, qty]) => {
          const prod = catalog[id] || { nombre: id, unidad: "" };
          const sla  = storeData["sla50"]  ? (storeData["sla50"].order.items[id]  || 0) : 0;
          const sl   = storeData["sanluis"] ? (storeData["sanluis"].order.items[id] || 0) : 0;
          return `
            <tr>
              <td>${prod.nombre}</td>
              <td style="text-align:center;color:var(--color-text-muted)">${sla > 0 ? sla : "—"}</td>
              <td style="text-align:center;color:var(--color-text-muted)">${sl > 0 ? sl : "—"}</td>
              <td>${qty} <small class="text-muted">${prod.unidad}</small></td>
            </tr>`;
        }).join("");

      const storeCardsHtml = STORE_ROLES.map(store => {
        const d = storeData[store];
        if (!d) return `
          <div class="card" style="opacity:.6">
            <div class="card-header"><h3>${ROLE_NAMES[store]}</h3></div>
            <div class="card-body"><p class="text-muted text-small">Sin pedido hoy.</p></div>
          </div>`;
        const o = d.order;
        const itemsHtml = Object.entries(o.items || {})
          .filter(([, qty]) => qty > 0)
          .map(([id, qty]) => {
            const prod = catalog[id] || { nombre: id, unidad: "" };
            return `<tr><td>${prod.nombre}</td><td style="text-align:right;font-weight:600">${qty} <small>${prod.unidad}</small></td></tr>`;
          }).join("");
        return `
          <div class="card">
            <div class="card-header" style="background:linear-gradient(135deg,#4E2A1E,#6B3A2A)">
              <h3>${ROLE_NAMES[store]}</h3>
              <div style="display:flex;gap:.5rem;align-items:center">
                ${o.fuera_de_horario ? '<span class="badge badge-produccion">⏰ Fuera horario</span>' : ""}
                ${_estadoBadge(o.estado)}
              </div>
            </div>
            <div class="card-body" style="padding:0">
              <table class="orders-table">
                <thead><tr><th>Producto</th><th style="text-align:right">Cantidad</th></tr></thead>
                <tbody>${itemsHtml || '<tr><td colspan="2" class="text-muted text-small text-center" style="padding:1rem">Sin ítems</td></tr>'}</tbody>
              </table>
            </div>
          </div>`;
      }).join("");

      container.innerHTML = `
        ${hasFueraDeHorario ? `
          <div class="alert alert-warning no-print">
            <span class="alert-icon">⚠️</span>
            <div>Uno o más pedidos fueron realizados <strong>fuera del horario de corte</strong>.</div>
          </div>` : ""}

        <div class="card mb-2">
          <div class="card-header">
            <h3>📊 Consolidado total</h3>
            <div style="display:flex;gap:.5rem;align-items:center">
              ${_estadoBadge(minStatus)}
              <button class="btn btn-outline btn-sm no-print" onclick="window.print()" style="border-color:rgba(255,255,255,.5);color:#FFF">🖨️ Imprimir</button>
            </div>
          </div>
          <div class="card-body" style="padding:0">
            <table class="orders-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th style="text-align:center">SLA 5.0</th>
                  <th style="text-align:center">San Luis</th>
                  <th style="text-align:right">Total</th>
                </tr>
              </thead>
              <tbody>${consolidatedRows}</tbody>
              <tfoot>
                <tr class="total-row">
                  <td colspan="3">Total ítems</td>
                  <td>${Object.values(totals).reduce((a, b) => a + b, 0)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div class="flex gap-2 mb-2 no-print" style="flex-wrap:wrap;align-items:center">
          ${actionsHtml}
        </div>

        <div style="display:grid;gap:1rem;grid-template-columns:repeat(auto-fit,minmax(280px,1fr))">
          ${storeCardsHtml}
        </div>`;

      // Action buttons
      const btnProd = container.querySelector("#btn-en-produccion");
      const btnListo = container.querySelector("#btn-listo");

      if (btnProd) {
        btnProd.addEventListener("click", () => _updateAllStatuses(allKeys, today, "en producción", btnProd));
      }
      if (btnListo) {
        btnListo.addEventListener("click", () => _updateAllStatuses(allKeys, today, "listo para despacho", btnListo));
      }
    });
  }

  function _updateAllStatuses(keys, today, newStatus, btn) {
    btn.disabled = true;
    btn.textContent = "Actualizando...";
    const db = firebase.database();
    const updates = {};
    keys.forEach(k => {
      updates[`pedidos_mercaderia/${today}/${k}/estado`] = newStatus;
    });
    db.ref().update(updates)
      .then(() => App.showToast(`✅ Estado actualizado: ${newStatus}`, "success"))
      .catch((err) => {
        console.error(err);
        App.showToast("❌ Error al actualizar estado.", "danger");
        btn.disabled = false;
      });
  }

  // ── COMPRAS VIEW ──────────────────────────────────────────

  function renderComprasView(container) {
    _removeListeners();
    const today = _arDate();

    container.innerHTML = `
      <div class="page-header">
        <h2>Despacho de Mercadería</h2>
        <p>Pedidos listos para despachar — ${_formatDate(today)}</p>
      </div>

      <div class="filter-bar no-print mb-2">
        <div class="form-group">
          <label for="compras-date-filter">Fecha</label>
          <input type="date" id="compras-date-filter" class="form-control" value="${today}">
        </div>
      </div>

      <div id="compras-orders-container"><div class="spinner"></div></div>`;

    const ordersContainer = container.querySelector("#compras-orders-container");
    const dateFilter = container.querySelector("#compras-date-filter");

    const loadOrders = (date) => {
      _removeListeners();
      const ref = firebase.database().ref(`pedidos_mercaderia/${date}`);
      _listen(ref, (snap) => {
        const allOrders = snap.val() || {};
        _renderComprasOrders(ordersContainer, allOrders, date);
      });
    };

    dateFilter.addEventListener("change", () => loadOrders(dateFilter.value));
    loadOrders(today);
  }

  function _renderComprasOrders(container, allOrders, date) {
    // Group by area, only "listo para despacho"
    const byArea = {};
    Object.entries(allOrders).forEach(([k, v]) => {
      if (v.estado === "listo para despacho") {
        if (!byArea[v.area]) byArea[v.area] = [];
        byArea[v.area].push({ key: k, ...v });
      }
    });

    if (Object.keys(byArea).length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">📭</span>
          <p>No hay pedidos listos para despachar en esta fecha.</p>
        </div>`;
      return;
    }

    const sectionsHtml = Object.entries(byArea).map(([area, orders]) => {
      const storeNames = orders.map(o => ROLE_NAMES[o.local]).join(" y ");
      const btns = orders.map(o =>
        `<button class="btn btn-primary btn-sm no-print" data-dispatch-key="${o.key}" data-dispatch-date="${date}">
          🚚 Despachar a ${ROLE_NAMES[o.local]}
        </button>`
      ).join("");

      const itemsSummary = orders.map(o => {
        const itemsHtml = Object.entries(o.items || {})
          .filter(([, qty]) => qty > 0)
          .map(([id, qty]) => `<span class="badge badge-cargado" style="margin:.15rem">${qty}× ${id}</span>`)
          .join(" ");
        return `<div class="mt-1 text-small"><strong>${ROLE_NAMES[o.local]}:</strong> ${itemsHtml || "—"}</div>`;
      }).join("");

      return `
        <div class="card despacho-section">
          <div class="card-header">
            <h3>${_areaIcon(area)} ${ROLE_NAMES[area]}</h3>
            <span class="badge badge-listo">Listo</span>
          </div>
          <div class="card-body">
            <p class="text-small text-muted mb-1">Pedidos de: <strong>${storeNames}</strong></p>
            ${itemsSummary}
            <div class="despacho-actions mt-2">${btns}</div>
          </div>
        </div>`;
    }).join("");

    // Load catalogs to show product names
    firebase.database().ref("catalogo/productos").once("value", (cSnap) => {
      const allCatalogs = cSnap.val() || {};

      const sectionsHtmlFull = Object.entries(byArea).map(([area, orders]) => {
        const catalog = allCatalogs[area] || {};
        const btns = orders.map(o =>
          `<button class="btn btn-primary btn-sm no-print" data-dispatch-key="${o.key}" data-dispatch-date="${date}">
            🚚 Despachar a ${ROLE_NAMES[o.local]}
          </button>`
        ).join("");

        const storeRows = orders.map(o => {
          const itemRows = Object.entries(o.items || {})
            .filter(([, qty]) => qty > 0)
            .map(([id, qty]) => {
              const prod = catalog[id] || { nombre: id, unidad: "" };
              return `<tr><td>${prod.nombre}</td><td style="text-align:right">${qty} ${prod.unidad}</td></tr>`;
            }).join("");
          return `
            <tr style="background:var(--color-bg)">
              <td colspan="2" style="font-weight:700;padding-top:.75rem;color:var(--color-primary)">
                ${ROLE_NAMES[o.local]}
                ${o.fuera_de_horario ? '<span class="badge badge-produccion" style="margin-left:.4rem">⏰ Fuera horario</span>' : ""}
              </td>
            </tr>
            ${itemRows}`;
        }).join("");

        return `
          <div class="card despacho-section">
            <div class="card-header">
              <h3>${_areaIcon(area)} ${ROLE_NAMES[area]}</h3>
              <span class="badge badge-listo">Listo para despacho</span>
            </div>
            <div class="card-body" style="padding:0">
              <table class="orders-table">
                <thead><tr><th>Producto</th><th style="text-align:right">Cant.</th></tr></thead>
                <tbody>${storeRows}</tbody>
              </table>
              <div style="padding:.875rem 1rem">
                <div class="despacho-actions">${btns}</div>
              </div>
            </div>
          </div>`;
      }).join("");

      container.innerHTML = sectionsHtmlFull;

      container.querySelectorAll("[data-dispatch-key]").forEach(btn => {
        btn.addEventListener("click", () => {
          const key  = btn.dataset.dispatchKey;
          const date = btn.dataset.dispatchDate;
          btn.disabled = true;
          btn.textContent = "Despachando...";
          firebase.database().ref(`pedidos_mercaderia/${date}/${key}/estado`).set("despachado")
            .then(() => App.showToast("✅ Pedido despachado", "success"))
            .catch(() => {
              App.showToast("❌ Error al despachar.", "danger");
              btn.disabled = false;
              btn.textContent = "🚚 Despachar";
            });
        });
      });
    });
  }

  // ── STORE HISTORY ─────────────────────────────────────────

  function renderHistorialView(role, container) {
    _removeListeners();
    const today = _arDate();
    const isStore = STORE_ROLES.includes(role);

    container.innerHTML = `
      <div class="page-header">
        <h2>Historial de Pedidos</h2>
      </div>
      <div class="filter-bar mb-2">
        <div class="form-group">
          <label for="hist-date">Fecha</label>
          <input type="date" id="hist-date" class="form-control" value="${today}">
        </div>
        ${!isStore ? `
        <div class="form-group">
          <label for="hist-local">Local</label>
          <select id="hist-local" class="form-control">
            <option value="">Todos</option>
            ${STORE_ROLES.map(s => `<option value="${s}">${ROLE_NAMES[s]}</option>`).join("")}
          </select>
        </div>` : ""}
      </div>
      <div id="historial-container"><div class="spinner"></div></div>`;

    const histContainer = container.querySelector("#historial-container");
    const dateInput = container.querySelector("#hist-date");
    const localSelect = container.querySelector("#hist-local");

    const loadHistorial = () => {
      const date = dateInput.value;
      const filterLocal = localSelect ? localSelect.value : role;
      _removeListeners();
      const ref = firebase.database().ref(`pedidos_mercaderia/${date}`);
      _listen(ref, (snap) => {
        let orders = snap.val() || {};
        // Filter
        const filtered = {};
        Object.entries(orders).forEach(([k, v]) => {
          const matchLocal = !filterLocal || v.local === filterLocal || (isStore && v.local === role);
          const matchArea  = (PRODUCTION_ROLES.includes(role)) ? v.area === role : true;
          if (matchLocal && matchArea) filtered[k] = v;
        });
        _renderHistorialTable(histContainer, filtered);
      });
    };

    dateInput.addEventListener("change", loadHistorial);
    if (localSelect) localSelect.addEventListener("change", loadHistorial);
    loadHistorial();
  }

  function _renderHistorialTable(container, orders) {
    const entries = Object.entries(orders);
    if (entries.length === 0) {
      container.innerHTML = `<div class="empty-state"><span class="empty-icon">📭</span><p>Sin pedidos en esta fecha.</p></div>`;
      return;
    }

    const rows = entries.map(([k, o]) => `
      <tr>
        <td>${ROLE_NAMES[o.local] || o.local}</td>
        <td>${ROLE_NAMES[o.area] || o.area}</td>
        <td>${new Date(o.timestamp).toLocaleTimeString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", hour: "2-digit", minute: "2-digit" })}</td>
        <td>${_estadoBadge(o.estado)}</td>
        <td>${o.fuera_de_horario ? '<span class="badge badge-produccion">⏰ Fuera horario</span>' : "—"}</td>
        <td style="text-align:right">${Object.values(o.items || {}).reduce((a, b) => a + b, 0)}</td>
      </tr>`).join("");

    container.innerHTML = `
      <div class="card">
        <div class="card-body" style="padding:0;overflow-x:auto">
          <table class="orders-table">
            <thead>
              <tr>
                <th>Local</th>
                <th>Área</th>
                <th>Hora</th>
                <th>Estado</th>
                <th>Horario</th>
                <th style="text-align:right">Ítems</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>`;
  }

  return {
    renderStoreView,
    renderProductionView,
    renderComprasView,
    renderHistorialView,
    cleanup: _removeListeners
  };
})();
