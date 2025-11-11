const jwt = require("jsonwebtoken");
const dotenv2 = require("dotenv");
dotenv2.config();

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

function authMiddleware(roleRequired = null) {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ error: "Missing or invalid Authorization header" });
    }
    const token = authHeader.split(" ")[1];
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      req.user = payload;
      if (roleRequired && payload.role !== roleRequired) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }
      next();
    } catch (err) {
      return res.status(401).json({ error: "Invalid token" });
    }
  };
}

module.exports = authMiddleware;
