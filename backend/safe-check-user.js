require("dotenv").config();
const pool = require("./db/db");

(async () => {
  try {
    const res = await pool.query("SELECT id,email FROM users WHERE email=$1", ["test@example.com"]);
    console.log("rows:", res.rows);
  } catch (e) {
    console.error("ERROR:", e);
    process.exit(1);
  } finally {
    try { await pool.end(); } catch {
      // Error handled silently
    }
    process.exit(0);
  }
})();
