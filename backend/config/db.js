const { Pool } = require("pg");
require("dotenv").config({ path: process.env.NODE_ENV === "test" ? ".env.test" : ".env" });

if (process.env.NODE_ENV === "test") {
  // DEBUG: Affiche la valeur du mot de passe pour diagnostiquer le problème
  // (Ne pas laisser ce log en production)
  console.log("[DEBUG] DB_PASSWORD:", JSON.stringify(process.env.DB_PASSWORD));
}

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

module.exports = pool;
