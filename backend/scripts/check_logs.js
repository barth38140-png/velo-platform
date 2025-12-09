const fs = require('fs');
const path = require('path');
const logPath = path.join(__dirname, '../logs/app.log');

fs.readFile(logPath, 'utf8', (err, data) => {
  if (err) {
    console.error('Impossible de lire le fichier de logs:', err);
    process.exit(1);
  }
  const errors = data.match(/error|fatal|warn/gi);
  if (errors && errors.length > 0) {
    console.log(`⚠️  ${errors.length} erreurs/warnings détectés dans les logs.`);
    process.exit(2);
  } else {
    console.log('✅ Aucun problème détecté dans les logs.');
    process.exit(0);
  }
});
