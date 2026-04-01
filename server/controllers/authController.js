import crypto from "crypto";
import User from "../models/User.js";

const hashPassword = (password, salt) =>
  crypto.scryptSync(password, salt, 64).toString("hex");

const createToken = () => crypto.randomBytes(32).toString("hex");

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  profileImage: user.profileImage || null,
});

const isValidImageDataUrl = (value) =>
  /^data:image\/(png|jpe?g|webp|gif);base64,[a-z0-9+/=]+$/i.test(value);

export const getRegistrationStatus = async (_req, res) => {
  try {
    res.json({ registrationOpen: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const salt = crypto.randomBytes(16).toString("hex");
    const passwordHash = hashPassword(password, salt);
    const token = createToken();
    const authTokenHash = hashToken(token);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      passwordSalt: salt,
      authTokenHash,
    });

    res.status(201).json({
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Email already in use" });
    }

    res.status(500).json({ message: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const passwordHash = hashPassword(password, user.passwordSalt);

    if (passwordHash !== user.passwordHash) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = createToken();
    user.authTokenHash = hashToken(token);
    await user.save();

    res.json({
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const logoutUser = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { authTokenHash: null });
    res.json({ message: "Logged out" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCurrentUser = async (req, res) => {
  res.json({ user: req.user });
};

export const updateProfileImage = async (req, res) => {
  try {
    const { profileImage } = req.body;

    if (!profileImage || typeof profileImage !== "string") {
      return res.status(400).json({ message: "Profile image is required" });
    }

    if (!isValidImageDataUrl(profileImage)) {
      return res.status(400).json({ message: "Unsupported image format" });
    }

    if (profileImage.length > 4_000_000) {
      return res.status(400).json({ message: "Profile image is too large" });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profileImage },
      { new: true }
    ).select("-passwordHash -passwordSalt -authTokenHash");

    res.json({
      user: sanitizeUser(user),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
