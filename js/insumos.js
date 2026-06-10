// =============================================================
// insumos.js — Supply order flow
//   • All roles (except compras): place supply orders for their area
//   • Compras: view pending supply orders, confirm/mark purchased
// =============================================================

const Insumos = (() => {
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

  function _arDate() {
    return new Date().toLocaleDateString("es-AR", {
      timeZone: "America/Argentina/Buenos_Aires",
      year: "numeric", month: "2-digit", day: "2-digit"
    }).split("/").reverse().join("-");
  }

  function _formatDate(isoDate) {
    if (!isoDate) return "";
    const [y, m, d] = isoDate.split("-");
    return `${d}/${m}/${y}`;
  }

  // ── SOLICITANTE VIEW (all non-compras roles) ──────────────

  function renderSolicitanteView(role, container) {
    _removeListeners();

    // Determine the area for catalog lookup
    // Stores (sla50, sanluis) don't have their own catalog; they pick an area
    const isStore = STORE_ROLES.includes(role);

    container.innerHTML = `
      <div class="page-header">
        <h2>Pedido de Insumos</h2>
        <p>${ROLE_NAMES[role]}</p>
      </div>
      ${isStore ? `
        <div class="form-group mb-2">
          <label for="insumos-area-select">Área a la que pertenece el pedido</label>
          <select id="insumos-area-select" class="form-control">
            <option value="">— Seleccioná un área —</option>
            ${PRODUCTION_ROLES.map(a => `<option value="${a}">${ROLE_NAMES[a]}</option>`).join("")}
          </select>
        </div>` : ""}
      <div id="insumos-form-container"></div>`;

    const formContainer = container.querySelector("#insumos-form-container");

    if (isStore) {
      const areaSelect = container.querySelector("#insumos-area-select");
      areaSelect.addEventListener("change", () => {
        if (areaSelect.value) {
          _renderInsumoForm(formContainer, role, areaSelect.value);
        } else {
          formContainer.innerHTML = "";
        }
      });
    } else {
      _renderInsumoForm(formContainer, role, role);
    }
  }

  function _renderInsumoForm(container, solicitante, area) {
    container.innerHTML = `<div class="spinner"></div>`;

    firebase.database().ref(`catalogo/insumos/${area}`).once("value", (snap) => {
      const catalog = snap.val() || {};
      const entries = Object.entries(catalog);

      // State for adhoc items
      let adhocItems = [{ nombre: "", cantidad: "", nota: "" }];

      const renderForm = () => {
        const catalogRows = entries.map(([id, item]) => `
          <div class="insumo-row">
            <div>
              <div class="insumo-name">${item.nombre}</div>
              <div class="insumo-unit">${item.unidad}</div>
            </div>
            <input type="number" class="qty-input catalog-qty" min="0" value="0"
              data-id="${id}" data-nombre="${item.nombre}" data-unidad="${item.unidad}" placeholder="0">
            <div style="grid-column:1/-1">
              <input type="text" class="insumo-note-input catalog-note"
                data-id="${id}" placeholder="Observación (opcional)..." maxlength="100">
            </div>
          </div>`).join("");

        const adhocRows = adhocItems.map((item, idx) => `
          <div class="adhoc-item" data-idx="${idx}">
            <input type="text" class="form-control adhoc-nombre" placeholder="Nombre del insumo"
              value="${item.nombre}" data-idx="${idx}" maxlength="80">
            <input type="number" class="qty-input adhoc-cant" min="0" placeholder="Cant."
              value="${item.cantidad}" data-idx="${idx}">
            <button type="button" class="adhoc-remove" data-idx="${idx}" title="Eliminar">✕</button>
          </div>
          <div style="margin-bottom:.5rem;padding:0 .25rem">
            <input type="text" class="insumo-note-input adhoc-nota"
              placeholder="Observación (opcional)..." value="${item.nota}" data-idx="${idx}" maxlength="100">
          </div>`).join("");

        container.innerHTML = `
          <div class="card">
            <div class="card-header">
              <h3>📋 Insumos — ${ROLE_NAMES[area]}</h3>
            </div>
            <div class="card-body">
              ${entries.length > 0 ? `
                <h4 class="text-small text-muted mb-1" style="text-transform:uppercase;letter-spacing:.05em">Catálogo</h4>
                <div class="product-list mb-2">${catalogRows}</div>` : ""}

              <div class="adhoc-section">
                <h4>➕ Ítems adicionales</h4>
                <div id="adhoc-list">${adhocRows}</div>
                <button type="button" class="btn btn-outline btn-sm mt-1" id="add-adhoc-btn">
                  + Agregar ítem
                </button>
              </div>

              <div class="mt-3">
                <button class="btn btn-primary btn-lg" id="submit-insumos-btn">
                  📤 Enviar pedido de insumos
                </button>
              </div>
            </div>
          </div>`;

        // qty highlight
        container.querySelectorAll(".catalog-qty").forEach(inp => {
          inp.addEventListener("input", () => {
            inp.classList.toggle("has-value", parseInt(inp.value || "0", 10) > 0);
          });
        });

        // adhoc events
        container.querySelector("#add-adhoc-btn").addEventListener("click", () => {
          adhocItems.push({ nombre: "", cantidad: "", nota: "" });
          renderForm();
        });

        container.querySelectorAll(".adhoc-remove").forEach(btn => {
          btn.addEventListener("click", () => {
            const idx = parseInt(btn.dataset.idx, 10);
            adhocItems.splice(idx, 1);
            if (adhocItems.length === 0) adhocItems = [{ nombre: "", cantidad: "", nota: "" }];
            renderForm();
          });
        });

        // Save state on change
        container.querySelectorAll(".adhoc-nombre").forEach(inp => {
          inp.addEventListener("input", () => {
            adhocItems[parseInt(inp.dataset.idx, 10)].nombre = inp.value;
          });
        });
        container.querySelectorAll(".adhoc-cant").forEach(inp => {
          inp.addEventListener("input", () => {
            adhocItems[parseInt(inp.dataset.idx, 10)].cantidad = inp.value;
          });
        });
        container.querySelectorAll(".adhoc-nota").forEach(inp => {
          inp.addEventListener("input", () => {
            adhocItems[parseInt(inp.dataset.idx, 10)].nota = inp.value;
          });
        });

        container.querySelector("#submit-insumos-btn").addEventListener("click", () => {
          _submitInsumos(container, solicitante, area, entries, adhocItems);
        });
      };

      renderForm();
    });
  }

  function _submitInsumos(container, solicitante, area, catalogEntries, adhocItems) {
    const items = [];

    // Catalog items
    catalogEntries.forEach(([id, item]) => {
      const qtyInput = container.querySelector(`.catalog-qty[data-id="${id}"]`);
      const noteInput = container.querySelector(`.catalog-note[data-id="${id}"]`);
      const qty = parseFloat(qtyInput?.value || "0");
      if (qty > 0) {
        items.push({
          id,
          nombre: item.nombre,
          unidad: item.unidad,
          cantidad: qty,
          nota: noteInput?.value?.trim() || ""
        });
      }
    });

    // Adhoc items
    adhocItems.forEach(item => {
      const qty = parseFloat(item.cantidad || "0");
      if (qty > 0 && item.nombre.trim()) {
        items.push({
          id: null,
          nombre: item.nombre.trim(),
          unidad: "",
          cantidad: qty,
          nota: item.nota?.trim() || ""
        });
      }
    });

    if (items.length === 0) {
      App.showToast("⚠️ Ingresá al menos un insumo con cantidad.", "warning");
      return;
    }

    const submitBtn = container.querySelector("#submit-insumos-btn");
    submitBtn.disabled = true;
    submitBtn.textContent = "Enviando...";

    const orderData = {
      solicitante,
      area,
      fecha:     _arDate(),
      timestamp: Date.now(),
      estado:    "pendiente",
      items
    };

    firebase.database().ref("pedidos_insumos").push(orderData)
      .then(() => {
        App.showToast("✅ Pedido de insumos enviado a Compras", "success");
        // Reset form
        container.querySelector(".card-body").innerHTML = `
          <div class="alert alert-success">
            <span class="alert-icon">✅</span>
            <div><strong>Pedido enviado correctamente.</strong><br>Compras recibirá la solicitud.</div>
          </div>
          <button class="btn btn-outline mt-2" id="reset-insumos-btn">Hacer otro pedido</button>`;
        container.querySelector("#reset-insumos-btn").addEventListener("click", () => {
          _renderInsumoForm(container, solicitante, area);
        });
      })
      .catch((err) => {
        console.error(err);
        App.showToast("❌ Error al enviar. Reintentá.", "danger");
        submitBtn.disabled = false;
        submitBtn.textContent = "📤 Enviar pedido de insumos";
      });
  }

  // ── COMPRAS VIEW ──────────────────────────────────────────

  function renderComprasView(container) {
    _removeListeners();

    container.innerHTML = `
      <div class="page-header">
        <h2>Pedidos de Insumos</h2>
        <p>Solicitudes pendientes de compra</p>
      </div>
      <div class="tabs mb-2">
        <button class="tab-btn active" data-tab="pendiente">Pendientes</button>
        <button class="tab-btn" data-tab="confirmado">Confirmados</button>
        <button class="tab-btn" data-tab="todos">Todos</button>
      </div>
      <div id="compras-insumos-container"><div class="spinner"></div></div>`;

    const comprasContainer = container.querySelector("#compras-insumos-container");
    let currentTab = "pendiente";

    const loadTab = (estado) => {
      currentTab = estado;
      _removeListeners();
      const ref = firebase.database().ref("pedidos_insumos");
      _listen(ref, (snap) => {
        const all = snap.val() || {};
        const filtered = {};
        Object.entries(all).forEach(([k, v]) => {
          if (estado === "todos" || v.estado === estado) filtered[k] = v;
        });
        _renderComprasInsumos(comprasContainer, filtered);
      });
    };

    container.querySelectorAll(".tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        container.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        loadTab(btn.dataset.tab);
      });
    });

    loadTab("pendiente");
  }

  function _renderComprasInsumos(container, orders) {
    const entries = Object.entries(orders)
      .sort(([, a], [, b]) => (b.timestamp || 0) - (a.timestamp || 0));

    if (entries.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">✅</span>
          <p>No hay pedidos en esta categoría.</p>
        </div>`;
      return;
    }

    const cards = entries.map(([key, order]) => {
      const itemsHtml = (order.items || []).map(item => `
        <tr>
          <td>${item.nombre}</td>
          <td style="text-align:center;font-weight:600">${item.cantidad} ${item.unidad || ""}</td>
          <td style="color:var(--color-text-muted);font-size:.8rem">${item.nota || "—"}</td>
        </tr>`).join("");

      const isPending = order.estado === "pendiente";

      return `
        <div class="card mb-2">
          <div class="card-header" style="${!isPending ? "background:linear-gradient(135deg,#235e33,#2E7D45)" : ""}">
            <div>
              <h3>${ROLE_NAMES[order.solicitante] || order.solicitante}
                ${order.area && order.area !== order.solicitante ? ` → ${ROLE_NAMES[order.area] || order.area}` : ""}
              </h3>
              <div class="text-small" style="opacity:.8;margin-top:.2rem">${_formatDate(order.fecha)}</div>
            </div>
            <span class="badge ${isPending ? "badge-pendiente" : "badge-confirmado"}">
              ${isPending ? "Pendiente" : "Confirmado"}
            </span>
          </div>
          <div class="card-body" style="padding:0">
            <table class="orders-table">
              <thead><tr><th>Insumo</th><th style="text-align:center">Cantidad</th><th>Nota</th></tr></thead>
              <tbody>${itemsHtml}</tbody>
            </table>
            ${isPending ? `
              <div style="padding:.875rem 1rem">
                <button class="btn btn-success btn-sm no-print" data-confirm-key="${key}">
                  ✅ Confirmar compra
                </button>
              </div>` : ""}
          </div>
        </div>`;
    }).join("");

    container.innerHTML = cards;

    container.querySelectorAll("[data-confirm-key]").forEach(btn => {
      btn.addEventListener("click", () => {
        btn.disabled = true;
        btn.textContent = "Confirmando...";
        firebase.database().ref(`pedidos_insumos/${btn.dataset.confirmKey}/estado`).set("confirmado")
          .then(() => App.showToast("✅ Compra confirmada", "success"))
          .catch(() => {
            App.showToast("❌ Error al confirmar.", "danger");
            btn.disabled = false;
            btn.textContent = "✅ Confirmar compra";
          });
      });
    });
  }

  return {
    renderSolicitanteView,
    renderComprasView,
    cleanup: _removeListeners
  };
})();
