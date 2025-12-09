const bcrypt = require('bcryptjs');
const pool = require('../config/db');

const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS || '10', 10);

async function createDemoUsers() {
  try {
    // Données des utilisateurs de démo
    const demoUsers = [
      {
        email: 'client@demo.fr',
        password: 'demo123',
        name: 'Client Démo',
        phone: '0601020304',
        role: 'client'
      },
      {
        email: 'repairer@demo.fr',
        password: 'demo123',
        name: 'Réparateur Démo',
        phone: '0605060708',
        role: 'repairer'
      }
    ];

    for (const user of demoUsers) {
      // Vérifier si l'utilisateur existe
      const existing = await pool.query('SELECT id FROM users WHERE email = $1', [user.email]);
      
      if (existing.rows.length === 0) {
        const password_hash = await bcrypt.hash(user.password, SALT_ROUNDS);
        
        await pool.query(
          'INSERT INTO users (email, password_hash, name, phone, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, name, role',
          [user.email, password_hash, user.name, user.phone, user.role]
        );
        
        console.log(`✅ Utilisateur créé: ${user.email} (${user.role}) - Mot de passe: ${user.password}`);
      } else {
        console.log(`⏭️  Utilisateur existe déjà: ${user.email}`);
      }
    }

    console.log('\n📋 Comptes de démo disponibles:');
    console.log('Client:     client@demo.fr / demo123');
    console.log('Réparateur: repairer@demo.fr / demo123');

    await pool.end();
  } catch (err) {
    console.error('❌ Erreur:', err.message);
    process.exit(1);
  }
}

createDemoUsers();
