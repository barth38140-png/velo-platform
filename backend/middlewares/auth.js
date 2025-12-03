const jwt = require("jsonwebtoken");
const logger = require("../src/logger");
const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret";

module.exports = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) return res.status(401).json({ error: "No token provided" });

  const token = auth.split(" ")[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    logger.debug({ userId: payload.id, reqId: req.id }, 'auth middleware: token verified');
    req.user = payload;
    next();
    } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};
