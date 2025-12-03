/*
 controllers/index.js
 Re-export known controllers so require("../controllers/") works.
 Update exports as you add real controllers.
*/
module.exports = {
  userController: require('./userController')
};
