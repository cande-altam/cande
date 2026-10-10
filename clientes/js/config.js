// =============================================================
// config.js — Firebase configuration & default role passwords
// =============================================================
// TODO: Replace the placeholder values below with your actual
//       Firebase project credentials.
//       Firebase Console → Project Settings → Your Apps → SDK setup
// =============================================================

const firebaseConfig = {
  apiKey: "TODO_YOUR_API_KEY",
  authDomain: "TODO_YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://TODO_YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
  projectId: "TODO_YOUR_PROJECT_ID",
  storageBucket: "TODO_YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "TODO_YOUR_MESSAGING_SENDER_ID",
  appId: "TODO_YOUR_APP_ID",
};

// Default passwords seeded into Firebase on first run.
// Admins can change these at any time from the Admin panel.
const DEFAULT_PASSWORDS = {
  sla50: "candela123",
  sanluis: "candela123",
  panaderia: "produccion123",
  pasteleria: "produccion123",
  factureria: "produccion123",
  especialidades: "produccion123",
  sandwiches: "produccion123",
  compras: "compras123",
  admin: "admin2024",
};

// Human-readable display names for every role
const ROLE_NAMES = {
  sla50: "SLA 5.0",
  sanluis: "San Luis",
  panaderia: "Panadería",
  pasteleria: "Pastelería",
  factureria: "Facturería",
  especialidades: "Especialidades",
  sandwiches: "Sandwiches",
  compras: "Compras",
  admin: "Admin",
};

// Which roles are "store" roles (place production orders)
const STORE_ROLES = ["sla50", "sanluis"];

// Which roles are "production area" roles
const PRODUCTION_ROLES = ["panaderia", "pasteleria", "factureria", "especialidades", "sandwiches"];

// Cut-off times (24h) per production area. null = no cutoff.
const CUTOFF_TIMES = {
  panaderia: 9,       // 09:00
  pasteleria: 16,     // 16:00
  factureria: null,
  especialidades: null,
  sandwiches: null,
};
