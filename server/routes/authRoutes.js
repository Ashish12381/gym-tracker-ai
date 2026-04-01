import express from "express";
import {
  getCurrentUser,
  getRegistrationStatus,
  loginUser,
  logoutUser,
  registerUser,
  updateProfileImage,
} from "../controllers/authController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/status", getRegistrationStatus);
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", authMiddleware, getCurrentUser);
router.post("/logout", authMiddleware, logoutUser);
router.put("/profile-image", authMiddleware, updateProfileImage);

export default router;
