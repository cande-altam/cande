// =============================================================
// auth.js — Login / logout / session management
// =============================================================

const Auth = (() => {
  const SESSION_KEY = "candela_role";

  function getCurrentRole() {
    return sessionStorage.getItem(SESSION_KEY);
  }

  function setRole(role) {
    sessionStorage.setItem(SESSION_KEY, role);
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
  }

  // Fetch passwords from Firebase, compare, and return role or null
  async function login(role, password) {
    return new Promise((resolve, reject) => {
      const db = firebase.database();
      db.ref("config/passwords").once("value", async (snap) => {
        let passwords = snap.val();

        // If no passwords exist yet in Firebase, seed defaults
        if (!passwords) {
          await db.ref("config/passwords").set(DEFAULT_PASSWORDS);
          passwords = DEFAULT_PASSWORDS;
        }

        if (passwords[role] && passwords[role] === password) {
          setRole(role);
          resolve(role);
        } else {
          resolve(null);
        }
      }, (err) => reject(err));
    });
  }

  async function changePassword(role, newPassword) {
    const db = firebase.database();
    await db.ref(`config/passwords/${role}`).set(newPassword);
  }

  return { getCurrentRole, setRole, logout, login, changePassword };
})();
