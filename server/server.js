import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authMiddleware from "./middleware/authMiddleware.js";
import authRoutes from "./routes/authRoutes.js";
import exerciseRoutes from "./routes/exerciseRoutes.js";
import workoutRoutes from "./routes/workoutRoutes.js";

dotenv.config();

const app = express();

connectDB();

const allowedOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
  })
);
app.use(express.json({ limit: "5mb" }));
app.use("/api/auth", authRoutes);

app.use("/api/exercises", authMiddleware, exerciseRoutes);
app.use("/api/workouts", authMiddleware, workoutRoutes);

app.get("/", (req, res) => {
  res.send("Gym Tracker API Running 💪");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
