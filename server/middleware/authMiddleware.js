import crypto from "crypto";
import User from "../models/User.js";

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const authMiddleware = async (req, res, next) => {
  try {
    const header = req.headers.authorization;

    if (!header?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const token = header.slice(7);
    const tokenHash = hashToken(token);

    const user = await User.findOne({ authTokenHash: tokenHash }).select(
      "-passwordHash -passwordSalt -authTokenHash"
    );

    if (!user) {
      return res.status(401).json({ message: "Invalid token" });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export default authMiddleware;
