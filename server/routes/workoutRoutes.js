import express from "express";
import {
  createWorkout,
  getWorkouts,
  getLastWorkoutForExercise,
  getExerciseStats,
  getLast30DaysWorkouts,
  getTodayWorkout,
  updateWorkout,
} from "../controllers/workoutController.js";

const router = express.Router();

router.post("/", createWorkout);
router.get("/", getWorkouts);
router.get("/last", getLastWorkoutForExercise);
router.get("/stats", getExerciseStats);
router.get("/last30", getLast30DaysWorkouts);
router.get("/today", getTodayWorkout);
router.put("/:id", updateWorkout);
export default router;
