// =============================================================
// app.js — Application shell, router, navigation, bootstrap
// =============================================================

const App = (() => {
  // ── State ─────────────────────────────────────────────────
  let _currentView = null;
  let _currentRole = null;

  // ── DOM refs (populated after DOMContentLoaded) ───────────
  let loginScreen, appNav, appMain;
  let loginRoleSelect, loginPasswordInput, loginBtn, loginError;
  let navBrand, navLinks, navLogout;
  let toastContainer;

  // ── Toast ─────────────────────────────────────────────────
  function showToast(message, type = "default") {
    const toast = document.createElement("div");
    toast.className = `toast${type !== "default" ? " toast-" + type : ""}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 3200);
  }

  // ── Navigation ────────────────────────────────────────────
  function _getNavConfig(role) {
    const isStore      = STORE_ROLES.includes(role);
    const isProd       = PRODUCTION_ROLES.includes(role);
    const isCompras    = role === "compras";
    const isAdmin      = role === "admin";

    const links = [];

    if (isStore) {
      links.push({ view: "mercaderia",  label: "🥖 Pedido" });
      links.push({ view: "insumos",     label: "🧾 Insumos" });
      links.push({ view: "historial",   label: "📋 Historial" });
    }

    if (isProd) {
      links.push({ view: "produccion",  label: "🔧 Producción" });
      links.push({ view: "insumos",     label: "🧾 Insumos" });
      links.push({ view: "historial",   label: "📋 Historial" });
    }

    if (isCompras) {
      links.push({ view: "despacho",    label: "🚚 Despacho" });
      links.push({ view: "compras-ins", label: "🧾 Insumos" });
    }

    if (isAdmin) {
      links.push({ view: "admin",       label: "⚙️ Admin" });
      links.push({ view: "mercaderia",  label: "🥖 Pedidos" });
      links.push({ view: "historial",   label: "📋 Historial" });
    }

    return links;
  }

  function _buildNav(role) {
    const links = _getNavConfig(role);
    navBrand.innerHTML = `<span>☕</span> Candela`;
    navLinks.innerHTML = links.map(l =>
      `<button class="nav-btn" data-view="${l.view}">${l.label}</button>`
    ).join("");

    navLinks.querySelectorAll(".nav-btn").forEach(btn => {
      btn.addEventListener("click", () => navigate(btn.dataset.view));
    });
  }

  function _setActiveNav(view) {
    navLinks.querySelectorAll(".nav-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.view === view);
    });
  }

  // ── Router ────────────────────────────────────────────────
  function navigate(view) {
    if (_currentView === view) return;
    _currentView = view;
    _setActiveNav(view);

    // Cleanup previous module listeners
    if (typeof Mercaderia !== "undefined") Mercaderia.cleanup();
    if (typeof Insumos    !== "undefined") Insumos.cleanup();
    if (typeof Admin      !== "undefined") Admin.cleanup();

    appMain.innerHTML = "";

    const role = _currentRole;

    switch (view) {
      case "mercaderia":
        // Admin sees it as a historial-like view
        if (role === "admin") {
          Mercaderia.renderHistorialView(role, appMain);
        } else {
          Mercaderia.renderStoreView(role, appMain);
        }
        break;

      case "produccion":
        Mercaderia.renderProductionView(role, appMain);
        break;

      case "despacho":
        Mercaderia.renderComprasView(appMain);
        break;

      case "historial":
        Mercaderia.renderHistorialView(role, appMain);
        break;

      case "insumos":
        Insumos.renderSolicitanteView(role, appMain);
        break;

      case "compras-ins":
        Insumos.renderComprasView(appMain);
        break;

      case "admin":
        Admin.render(appMain);
        break;

      default:
        appMain.innerHTML = `<div class="empty-state"><span class="empty-icon">🤔</span><p>Vista no encontrada.</p></div>`;
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ── Login ─────────────────────────────────────────────────
  function _handleLogin() {
    const role     = loginRoleSelect.value;
    const password = loginPasswordInput.value;

    if (!role) {
      loginError.textContent = "Seleccioná un rol.";
      loginError.classList.remove("hidden");
      return;
    }

    loginBtn.disabled    = true;
    loginBtn.textContent = "Ingresando...";
    loginError.classList.add("hidden");

    Auth.login(role, password)
      .then((loggedRole) => {
        if (loggedRole) {
          _startApp(loggedRole);
        } else {
          loginError.textContent = "Contraseña incorrecta. Intentá de nuevo.";
          loginError.classList.remove("hidden");
          loginBtn.disabled    = false;
          loginBtn.textContent = "Ingresar";
          loginPasswordInput.value = "";
          loginPasswordInput.focus();
        }
      })
      .catch((err) => {
        console.error(err);
        loginError.textContent = "Error de conexión. Verificá tu conexión a internet.";
        loginError.classList.remove("hidden");
        loginBtn.disabled    = false;
        loginBtn.textContent = "Ingresar";
      });
  }

  // ── App startup ───────────────────────────────────────────
  function _startApp(role) {
    _currentRole = role;

    loginScreen.classList.add("hidden");
    appNav.classList.remove("hidden");
    appMain.classList.remove("hidden");

    navLogout.textContent = `${ROLE_NAMES[role]} · Salir`;

    _buildNav(role);

    // Seed catalog if needed (run once per session, non-blocking)
    Catalogo.init().catch(console.warn);

    // Navigate to default view for role
    const firstLink = _getNavConfig(role)[0];
    if (firstLink) navigate(firstLink.view);
  }

  // ── Logout ────────────────────────────────────────────────
  function _logout() {
    if (typeof Mercaderia !== "undefined") Mercaderia.cleanup();
    if (typeof Insumos    !== "undefined") Insumos.cleanup();
    if (typeof Admin      !== "undefined") Admin.cleanup();

    Auth.logout();
    _currentRole = null;
    _currentView = null;

    appNav.classList.add("hidden");
    appMain.classList.add("hidden");
    loginScreen.classList.remove("hidden");

    loginRoleSelect.value    = "";
    loginPasswordInput.value = "";
    loginError.classList.add("hidden");
    appMain.innerHTML = "";
  }

  // ── Bootstrap ─────────────────────────────────────────────
  function init() {
    // Initialize Firebase
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }

    // Cache DOM refs
    loginScreen        = document.getElementById("login-screen");
    appNav             = document.getElementById("app-nav");
    appMain            = document.getElementById("app-main");
    loginRoleSelect    = document.getElementById("login-role");
    loginPasswordInput = document.getElementById("login-password");
    loginBtn           = document.getElementById("login-btn");
    loginError         = document.getElementById("login-error");
    navBrand           = document.getElementById("nav-brand");
    navLinks           = document.getElementById("nav-links");
    navLogout          = document.getElementById("nav-logout");
    toastContainer     = document.getElementById("toast-container");

    // Populate role selector
    loginRoleSelect.innerHTML = `<option value="">— Seleccioná tu rol —</option>` +
      Object.entries(ROLE_NAMES).map(([k, v]) =>
        `<option value="${k}">${v}</option>`
      ).join("");

    // Events
    loginBtn.addEventListener("click", _handleLogin);
    loginPasswordInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") _handleLogin();
    });
    navLogout.addEventListener("click", _logout);

    // Check existing session
    const savedRole = Auth.getCurrentRole();
    if (savedRole && ROLE_NAMES[savedRole]) {
      _startApp(savedRole);
    }
  }

  // Expose public API
  return { init, navigate, showToast };
})();

// Boot on DOM ready
document.addEventListener("DOMContentLoaded", App.init);
