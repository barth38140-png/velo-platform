function requireRole(...allowedRoles) {
  return function (req, res, next) {
    const user = req.user;
    if (!user || !user.role) return res.status(401).json({ error: 'Not authenticated' });
    const role = user.role;
    if (allowedRoles.includes(role)) return next();
    // Return a clear, localized message indicating required role(s)
    return res.status(403).json({ error: `Forbidden: only users with role(s) [${allowedRoles.join(', ')}] can perform this action` });
  };
}

module.exports = { requireRole };
