/**
 * Middleware pour échapper les champs sensibles lors de la création d'une demande de réparation
 * Place ce middleware avant le controller dans la route
 */
function escapeHtml(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/[&<>'"/]/g, function (s) {
    const entityMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '/': '&#x2F;'
    };
    return entityMap[s] || s;
  });
}

function sanitizeRepairFields(req, res, next) {
  if (req.body) {
    if (req.body.title) req.body.title = escapeHtml(req.body.title);
    if (req.body.description) req.body.description = escapeHtml(req.body.description);
    if (req.body.bike_type) req.body.bike_type = escapeHtml(req.body.bike_type);
    if (req.body.location_address) req.body.location_address = escapeHtml(req.body.location_address);
  }
  next();
}

module.exports = { sanitizeRepairFields };
