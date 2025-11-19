/* scripts/seed-add-bcrypt-password.js
   Met à jour demo+seed@example.com avec un password_hash bcrypt pour mot de passe "Password1!".
   Exécuter : node -r dotenv/config scripts/seed-add-bcrypt-password.js
*/
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

(async ()=>{
  const pool = new Pool({
    host: process.env.DB_HOST, port: Number(process.env.DB_PORT), user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, database: process.env.DB_NAME
  });
  try {
    const clearPass = 'Password1!';
    const hash = await bcrypt.hash(clearPass, 10);
    const res = await pool.query(
      `UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING id,email`,
      [hash, 'demo+seed@example.com']
    );
    if(res.rowCount === 0) {
      console.log('User not found, inserting user with bcrypt hash.');
      await pool.query(
        `INSERT INTO users (email,name,phone,role,password_hash) VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING`,
        ['demo+seed@example.com','Demo Seed','+33000000001','user',hash]
      );
    } else {
      console.log('Updated user:', res.rows[0]);
    }
    console.log('Password set for demo+seed@example.com => Password1!');
    process.exit(0);
  } catch(e){ console.error('ERR', e && e.stack || e); process.exit(2); } finally { await pool.end(); }
})();
