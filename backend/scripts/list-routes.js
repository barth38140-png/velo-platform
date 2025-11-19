const { app } = require('../src/index');
if (!app || !app._router) {
  console.error("app ou app._router introuvable");
  process.exit(1);
}
app._router.stack.forEach(r => {
  if (r.route && r.route.path) {
    const methods = Object.keys(r.route.methods).map(m => m.toUpperCase()).join(',');
    console.log(`${methods} ${r.route.path}`);
  } else if (r.name === 'router' && r.handle && r.handle.stack) {
    console.log(`<router> mounted at ${r.regexp ? r.regexp.source : '(unknown)'}`);
  }
});
