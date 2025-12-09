// Script Node.js pour générer un hash bcrypt pour 'admin123'
const bcrypt = require('bcrypt');
const password = 'admin123';
const saltRounds = 10;
bcrypt.hash(password, saltRounds, function(err, hash) {
  if (err) throw err;
  console.log('Hash bcrypt pour admin123 :', hash);
});
