/**
 * Middleware pour échapper le contenu des messages
 * Place ce middleware avant le controller dans la route d'envoi de message
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

function sanitizeMessageContent(req, res, next) {
  if (req.body && req.body.content) {
    req.body.content = escapeHtml(req.body.content);
  }
  next();
}

module.exports = { sanitizeMessageContent };
