// =============================================================
// admin.js — Admin panel
//   • Manage product catalog (add/edit/delete per area)
//   • Manage supply catalog (add/edit/delete per area)
//   • Manage role passwords
//   • View all orders with filters
// =============================================================

const Admin = (() => {
  let _activeListeners = {};

  function _removeListeners() {
    const db = firebase.database();
    Object.entries(_activeListeners).forEach(([path, handle]) => {
      try { db.ref(path).off("value", handle); } catch (_) {}
    });
    _activeListeners = {};
  }

  function _listen(ref, cb) {
    const handle = ref.on("value", cb);
    _activeListeners[ref.toString()] = handle;
    return handle;
  }

  function _formatDate(isoDate) {
    if (!isoDate) return "";
    const [y, m, d] = isoDate.split("-");
    return `${d}/${m}/${y}`;
  }

  function _areaIcon(area) {
    const icons = { panaderia: "🥖", pasteleria: "🎂", factureria: "🥧", especialidades: "🧇", sandwiches: "🥪" };
    return icons[area] || "🍽️";
  }

  function _estadoBadge(estado) {
    const map = {
      "cargado":             ["badge-cargado",   "Cargado"],
      "en producción":       ["badge-produccion", "En producción"],
      "listo para despacho": ["badge-listo",      "Listo para despacho"],
      "despachado":          ["badge-despachado", "Despachado"],
      "pendiente":           ["badge-pendiente",  "Pendiente"],
      "confirmado":          ["badge-confirmado", "Confirmado"],
    };
    const [cls, label] = map[estado] || ["badge-cargado", estado];
    return `<span class="badge ${cls}">${label}</span>`;
  }

  // ── MAIN RENDER ───────────────────────────────────────────

  function render(container) {
    _removeListeners();

    container.innerHTML = `
      <div class="page-header">
        <h2>⚙️ Panel de Administración</h2>
      </div>
      <div class="admin-tabs" id="admin-tabs">
        <button class="admin-tab-btn active" data-tab="catalogo-prod">📦 Catálogo Mercadería</button>
        <button class="admin-tab-btn" data-tab="catalogo-ins">🧾 Catálogo Insumos</button>
        <button class="admin-tab-btn" data-tab="passwords">🔑 Contraseñas</button>
        <button class="admin-tab-btn" data-tab="pedidos-all">📋 Todos los pedidos</button>
      </div>

      <div id="admin-panel-catalogo-prod" class="admin-tab-panel active"></div>
      <div id="admin-panel-catalogo-ins" class="admin-tab-panel"></div>
      <div id="admin-panel-passwords" class="admin-tab-panel"></div>
      <div id="admin-panel-pedidos-all" class="admin-tab-panel"></div>`;

    // Tab switching
    container.querySelectorAll(".admin-tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        container.querySelectorAll(".admin-tab-btn").forEach(b => b.classList.remove("active"));
        container.querySelectorAll(".admin-tab-panel").forEach(p => p.classList.remove("active"));
        btn.classList.add("active");
        container.querySelector(`#admin-panel-${btn.dataset.tab}`).classList.add("active");
        // Lazy render
        _renderTabContent(btn.dataset.tab, container);
      });
    });

    // Render default tab
    _renderTabContent("catalogo-prod", container);
  }

  function _renderTabContent(tab, container) {
    _removeListeners();
    const panel = container.querySelector(`#admin-panel-${tab}`);
    if (!panel || panel.dataset.loaded === tab) return;
    panel.dataset.loaded = tab;

    if (tab === "catalogo-prod")  _renderCatalogoPanel(panel, "productos");
    if (tab === "catalogo-ins")   _renderCatalogoPanel(panel, "insumos");
    if (tab === "passwords")      _renderPasswordPanel(panel);
    if (tab === "pedidos-all")    _renderAllOrdersPanel(panel);
  }

  // ── CATALOG PANEL ─────────────────────────────────────────

  function _renderCatalogoPanel(panel, type) {
    const label = type === "productos" ? "Mercadería" : "Insumos";
    panel.innerHTML = `
      <div class="tabs mb-2" id="cat-area-tabs-${type}">
        ${PRODUCTION_ROLES.map((area, i) =>
          `<button class="tab-btn${i === 0 ? " active" : ""}" data-area="${area}">${_areaIcon(area)} ${ROLE_NAMES[area]}</button>`
        ).join("")}
      </div>
      <div id="cat-area-content-${type}"></div>`;

    const contentEl = panel.querySelector(`#cat-area-content-${type}`);

    const loadArea = (area) => {
      _removeListeners();
      const ref = firebase.database().ref(`catalogo/${type}/${area}`);
      _listen(ref, (snap) => {
        _renderCatalogoArea(contentEl, type, area, snap.val() || {});
      });
    };

    panel.querySelectorAll(`#cat-area-tabs-${type} .tab-btn`).forEach(btn => {
      btn.addEventListener("click", () => {
        panel.querySelectorAll(`#cat-area-tabs-${type} .tab-btn`).forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        loadArea(btn.dataset.area);
      });
    });

    loadArea(PRODUCTION_ROLES[0]);
  }

  function _renderCatalogoArea(container, type, area, items) {
    const entries = Object.entries(items);
    const unidades = ["unidad", "docena", "kg", "litros", "porciones"];

    const rows = entries.map(([id, item]) => `
      <div class="catalog-item-row" data-id="${id}">
        <span class="item-name">${item.nombre}</span>
        <span class="item-unit">${item.unidad}</span>
        <div style="display:flex;gap:.4rem;margin-left:auto">
          <button class="btn btn-outline btn-sm cat-edit-btn no-print" data-id="${id}" data-nombre="${item.nombre}" data-unidad="${item.unidad}">✏️</button>
          <button class="btn btn-danger btn-sm cat-del-btn no-print" data-id="${id}">🗑️</button>
        </div>
      </div>`).join("");

    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3>${_areaIcon(area)} ${ROLE_NAMES[area]} — ${type === "productos" ? "Productos" : "Insumos"}</h3>
          <span class="text-small" style="opacity:.8">${entries.length} ítems</span>
        </div>
        <div class="card-body">
          ${entries.length === 0
            ? `<div class="empty-state"><span class="empty-icon">📭</span><p>Sin ítems. Agregá uno abajo.</p></div>`
            : `<div class="mb-2">${rows}</div>`}

          <div class="card" style="background:var(--color-bg);border-style:dashed;margin-top:.75rem">
            <div class="card-body">
              <h4 class="text-small text-muted mb-1" style="text-transform:uppercase;letter-spacing:.05em">Nuevo ítem</h4>
              <div style="display:flex;gap:.5rem;flex-wrap:wrap;align-items:flex-end">
                <div class="form-group" style="flex:1;min-width:160px;margin-bottom:0">
                  <label>Nombre</label>
                  <input type="text" id="new-item-name-${type}" class="form-control" placeholder="Ej: Facturas surtidas" maxlength="80">
                </div>
                <div class="form-group" style="min-width:120px;margin-bottom:0">
                  <label>Unidad</label>
                  <select id="new-item-unit-${type}" class="form-control">
                    ${unidades.map(u => `<option value="${u}">${u}</option>`).join("")}
                  </select>
                </div>
                <button class="btn btn-accent" id="add-item-btn-${type}">+ Agregar</button>
              </div>
            </div>
          </div>
        </div>
      </div>`;

    // Add item
    container.querySelector(`#add-item-btn-${type}`).addEventListener("click", () => {
      const nameInput = container.querySelector(`#new-item-name-${type}`);
      const unitInput = container.querySelector(`#new-item-unit-${type}`);
      const nombre = nameInput.value.trim();
      const unidad = unitInput.value;
      if (!nombre) { App.showToast("Ingresá un nombre para el ítem.", "warning"); return; }

      firebase.database().ref(`catalogo/${type}/${area}`).push({ nombre, unidad })
        .then(() => {
          nameInput.value = "";
          App.showToast("✅ Ítem agregado", "success");
        })
        .catch(() => App.showToast("❌ Error al agregar ítem.", "danger"));
    });

    // Delete
    container.querySelectorAll(".cat-del-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        if (!confirm("¿Eliminar este ítem?")) return;
        firebase.database().ref(`catalogo/${type}/${area}/${btn.dataset.id}`).remove()
          .then(() => App.showToast("🗑️ Ítem eliminado", "success"))
          .catch(() => App.showToast("❌ Error al eliminar.", "danger"));
      });
    });

    // Edit (inline modal)
    container.querySelectorAll(".cat-edit-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        _showEditModal(type, area, btn.dataset.id, btn.dataset.nombre, btn.dataset.unidad, unidades);
      });
    });
  }

  function _showEditModal(type, area, id, nombre, unidad, unidades) {
    const existing = document.querySelector(".modal-overlay");
    if (existing) existing.remove();

    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3>Editar ítem</h3>
          <button class="modal-close">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Nombre</label>
            <input type="text" id="edit-nombre" class="form-control" value="${nombre}" maxlength="80">
          </div>
          <div class="form-group">
            <label>Unidad</label>
            <select id="edit-unidad" class="form-control">
              ${unidades.map(u => `<option value="${u}"${u === unidad ? " selected" : ""}>${u}</option>`).join("")}
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline modal-cancel">Cancelar</button>
          <button class="btn btn-primary" id="save-edit-btn">Guardar</button>
        </div>
      </div>`;

    document.body.appendChild(overlay);

    overlay.querySelector(".modal-close").addEventListener("click", () => overlay.remove());
    overlay.querySelector(".modal-cancel").addEventListener("click", () => overlay.remove());
    overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });

    overlay.querySelector("#save-edit-btn").addEventListener("click", () => {
      const newNombre = overlay.querySelector("#edit-nombre").value.trim();
      const newUnidad = overlay.querySelector("#edit-unidad").value;
      if (!newNombre) { App.showToast("El nombre no puede estar vacío.", "warning"); return; }

      firebase.database().ref(`catalogo/${type}/${area}/${id}`).update({ nombre: newNombre, unidad: newUnidad })
        .then(() => {
          App.showToast("✅ Ítem actualizado", "success");
          overlay.remove();
        })
        .catch(() => App.showToast("❌ Error al guardar.", "danger"));
    });
  }

  // ── PASSWORD PANEL ────────────────────────────────────────

  function _renderPasswordPanel(panel) {
    panel.innerHTML = `<div class="spinner"></div>`;

    firebase.database().ref("config/passwords").once("value", (snap) => {
      let passwords = snap.val() || DEFAULT_PASSWORDS;

      const rows = Object.entries(ROLE_NAMES).map(([role, displayName]) => `
        <div class="password-row">
          <span class="password-role">${displayName}</span>
          <div class="password-input-wrap">
            <input type="text" class="form-control" id="pwd-${role}"
              value="${passwords[role] || ""}" placeholder="Nueva contraseña" maxlength="50" autocomplete="off">
            <button class="btn btn-primary btn-sm" data-role="${role}" id="pwd-save-${role}">
              💾 Guardar
            </button>
          </div>
        </div>`).join("");

      panel.innerHTML = `
        <div class="card">
          <div class="card-header"><h3>🔑 Contraseñas por rol</h3></div>
          <div class="card-body">
            <div class="alert alert-warning mb-2">
              <span class="alert-icon">⚠️</span>
              <div>Las contraseñas son visibles para el administrador. Son compartidas por rol, no individuales.</div>
            </div>
            ${rows}
          </div>
        </div>`;

      panel.querySelectorAll("[id^='pwd-save-']").forEach(btn => {
        btn.addEventListener("click", () => {
          const role = btn.dataset.role;
          const newPwd = document.getElementById(`pwd-${role}`).value.trim();
          if (!newPwd) { App.showToast("La contraseña no puede estar vacía.", "warning"); return; }

          Auth.changePassword(role, newPwd)
            .then(() => App.showToast(`✅ Contraseña actualizada para ${ROLE_NAMES[role]}`, "success"))
            .catch(() => App.showToast("❌ Error al guardar contraseña.", "danger"));
        });
      });
    });
  }

  // ── ALL ORDERS PANEL ──────────────────────────────────────

  function _arDate() {
    return new Date().toLocaleDateString("es-AR", {
      timeZone: "America/Argentina/Buenos_Aires",
      year: "numeric", month: "2-digit", day: "2-digit"
    }).split("/").reverse().join("-");
  }

  function _renderAllOrdersPanel(panel) {
    const today = _arDate();

    panel.innerHTML = `
      <div class="tabs mb-2">
        <button class="tab-btn active" data-order-tab="mercaderia">🥖 Mercadería</button>
        <button class="tab-btn" data-order-tab="insumos">🧾 Insumos</button>
      </div>

      <div class="filter-bar mb-2" id="admin-filter-bar">
        <div class="form-group">
          <label for="admin-date-filter">Fecha</label>
          <input type="date" id="admin-date-filter" class="form-control" value="${today}">
        </div>
        <div class="form-group" id="area-filter-wrap">
          <label for="admin-area-filter">Área</label>
          <select id="admin-area-filter" class="form-control">
            <option value="">Todas</option>
            ${PRODUCTION_ROLES.map(a => `<option value="${a}">${ROLE_NAMES[a]}</option>`).join("")}
          </select>
        </div>
        <div class="form-group" id="local-filter-wrap">
          <label for="admin-local-filter">Local</label>
          <select id="admin-local-filter" class="form-control">
            <option value="">Todos</option>
            ${STORE_ROLES.map(s => `<option value="${s}">${ROLE_NAMES[s]}</option>`).join("")}
          </select>
        </div>
        <div class="form-group" id="estado-filter-wrap">
          <label for="admin-estado-filter">Estado</label>
          <select id="admin-estado-filter" class="form-control">
            <option value="">Todos</option>
            <option value="cargado">Cargado</option>
            <option value="en producción">En producción</option>
            <option value="listo para despacho">Listo para despacho</option>
            <option value="despachado">Despachado</option>
          </select>
        </div>
      </div>

      <div id="admin-orders-content"><div class="spinner"></div></div>`;

    let currentOrderTab = "mercaderia";
    const ordersContent = panel.querySelector("#admin-orders-content");
    const dateFilter = panel.querySelector("#admin-date-filter");
    const areaFilter = panel.querySelector("#admin-area-filter");
    const localFilter = panel.querySelector("#admin-local-filter");
    const estadoFilter = panel.querySelector("#admin-estado-filter");

    const loadOrders = () => {
      _removeListeners();
      if (currentOrderTab === "mercaderia") {
        const date = dateFilter.value;
        const ref = firebase.database().ref(`pedidos_mercaderia/${date}`);
        _listen(ref, (snap) => {
          let orders = snap.val() || {};
          // Apply filters
          const area = areaFilter.value;
          const local = localFilter.value;
          const estado = estadoFilter.value;
          const filtered = {};
          Object.entries(orders).forEach(([k, v]) => {
            if (area && v.area !== area) return;
            if (local && v.local !== local) return;
            if (estado && v.estado !== estado) return;
            filtered[k] = v;
          });
          _renderAdminMercaderiaOrders(ordersContent, filtered);
        });
      } else {
        // Insumos
        const ref = firebase.database().ref("pedidos_insumos");
        _listen(ref, (snap) => {
          let orders = snap.val() || {};
          const area = areaFilter.value;
          const estado = estadoFilter.value;
          const filtered = {};
          Object.entries(orders).forEach(([k, v]) => {
            if (area && v.area !== area) return;
            if (estado) {
              const mappedEstado = estado === "cargado" ? "pendiente" : estado === "despachado" ? "confirmado" : estado;
              if (v.estado !== mappedEstado && v.estado !== estado) return;
            }
            filtered[k] = v;
          });
          _renderAdminInsumosOrders(ordersContent, filtered);
        });
      }
    };

    panel.querySelectorAll(".tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        panel.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentOrderTab = btn.dataset.orderTab;
        // Show/hide local filter (not relevant for insumos)
        const localWrap = panel.querySelector("#local-filter-wrap");
        const areaWrap = panel.querySelector("#area-filter-wrap");
        if (localWrap) localWrap.style.display = currentOrderTab === "insumos" ? "none" : "";
        // Reset estado options for insumos
        const estadoSel = panel.querySelector("#admin-estado-filter");
        if (currentOrderTab === "insumos") {
          estadoSel.innerHTML = `
            <option value="">Todos</option>
            <option value="pendiente">Pendiente</option>
            <option value="confirmado">Confirmado</option>`;
        } else {
          estadoSel.innerHTML = `
            <option value="">Todos</option>
            <option value="cargado">Cargado</option>
            <option value="en producción">En producción</option>
            <option value="listo para despacho">Listo para despacho</option>
            <option value="despachado">Despachado</option>`;
        }
        loadOrders();
      });
    });

    dateFilter.addEventListener("change", loadOrders);
    areaFilter.addEventListener("change", loadOrders);
    localFilter.addEventListener("change", loadOrders);
    estadoFilter.addEventListener("change", loadOrders);

    loadOrders();
  }

  function _renderAdminMercaderiaOrders(container, orders) {
    const entries = Object.entries(orders)
      .sort(([, a], [, b]) => (b.timestamp || 0) - (a.timestamp || 0));

    if (entries.length === 0) {
      container.innerHTML = `<div class="empty-state"><span class="empty-icon">📭</span><p>Sin pedidos con estos filtros.</p></div>`;
      return;
    }

    const rows = entries.map(([k, o]) => `
      <tr>
        <td>${ROLE_NAMES[o.local] || o.local}</td>
        <td>${_areaIcon(o.area)} ${ROLE_NAMES[o.area] || o.area}</td>
        <td>${new Date(o.timestamp).toLocaleTimeString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", hour: "2-digit", minute: "2-digit" })}</td>
        <td>${_estadoBadge(o.estado)}</td>
        <td style="text-align:center">${o.fuera_de_horario ? '<span class="badge badge-produccion">⏰</span>' : "—"}</td>
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
                <th style="text-align:center">Horario</th>
                <th style="text-align:right">Ítems</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>`;
  }

  function _renderAdminInsumosOrders(container, orders) {
    const entries = Object.entries(orders)
      .sort(([, a], [, b]) => (b.timestamp || 0) - (a.timestamp || 0));

    if (entries.length === 0) {
      container.innerHTML = `<div class="empty-state"><span class="empty-icon">📭</span><p>Sin pedidos de insumos con estos filtros.</p></div>`;
      return;
    }

    const cards = entries.map(([k, o]) => `
      <div class="card mb-1">
        <div class="card-header" style="padding:.6rem 1rem">
          <div>
            <span style="font-weight:700">${ROLE_NAMES[o.solicitante] || o.solicitante}</span>
            ${o.area && o.area !== o.solicitante ? ` <span class="text-muted">→ ${ROLE_NAMES[o.area] || o.area}</span>` : ""}
            <span class="text-small text-muted" style="margin-left:.5rem">${_formatDate(o.fecha)}</span>
          </div>
          ${_estadoBadge(o.estado)}
        </div>
        <div class="card-body" style="padding:.5rem 1rem;font-size:.85rem">
          ${(o.items || []).map(item =>
            `<span class="badge badge-cargado" style="margin:.15rem">${item.cantidad}× ${item.nombre}${item.nota ? ` (${item.nota})` : ""}</span>`
          ).join("")}
        </div>
      </div>`).join("");

    container.innerHTML = cards;
  }

  return { render, cleanup: _removeListeners };
})();
