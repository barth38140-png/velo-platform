const pool = require('./config/db');

pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position")
  .then(r => {
    console.log('Colonnes de la table users:');
    r.rows.forEach(row => console.log(`  - ${row.column_name} (${row.data_type})`));
    process.exit(0);
  })
  .catch(err => {
    console.error('Erreur:', err.message);
    process.exit(1);
  });
