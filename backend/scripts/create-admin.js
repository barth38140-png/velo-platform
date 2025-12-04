const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://velo_user:velo_password@localhost:5432/velo_platform'
});

async function createAdminUser() {
  const client = await pool.connect();

  try {
    const email = 'admin@demo.fr';
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);

    // Vérifier si l'utilisateur existe
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      console.log('✅ L\'utilisateur admin existe déjà');
      console.log(`   Email: ${email}`);
      console.log(`   Mot de passe: ${password}`);
    } else {
      // Créer l'utilisateur admin
      await client.query(
        `INSERT INTO users (
          email, password, first_name, last_name, role, status, is_verified, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        [email, hashedPassword, 'Admin', 'Demo', 'admin', 'active', true]
      );

      console.log('✅ Compte admin créé avec succès');
      console.log(`   Email: ${email}`);
      console.log(`   Mot de passe: ${password}`);
    }
  } catch (err) {
    console.error('❌ Erreur lors de la création du compte admin:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

createAdminUser();
