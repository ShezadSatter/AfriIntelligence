const jwt = require("jsonwebtoken");
const User = require("../models/user");

const requireRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) return res.status(401).json({ error: "No token provided" });

      const token = authHeader.split(" ")[1];
      if (!token) return res.status(401).json({ error: "Invalid token" });

      const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
      const user = await User.findById(decoded.id);
      if (!user) return res.status(401).json({ error: "User not found" });

      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({ error: "Access denied" });
      }

      req.user = user;
      next();
    } catch (err) {
      console.error(err);
      res.status(401).json({ error: "Unauthorized" });
    }
  };
};

module.exports = requireRole;
