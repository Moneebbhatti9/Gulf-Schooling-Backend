const jwt = require("jsonwebtoken");
const AllUsers = require("../models/Auth/allUsersModel");

exports.verifyToken = (req, res, next) => {

    const token = req.header("Authorization")?.split(" ")[1]; // Expecting "Bearer <token>"
    if (!token) {
        return res.status(401).json({ message: "Access Denied. No token provided." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Attach user info to request
        next();
    } catch (err) {
        res.status(403).json({ message: "Invalid token" });
    }
};

exports.isAdmin = async (req, res, next) => {
    try {
      const user = await AllUsers.findById(req.user.userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Access denied: Admins only" });
      }
      next();
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  }