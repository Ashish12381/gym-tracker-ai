import mongoose from "mongoose";
import Workout from "../models/Workout.js";
import Exercise from "../models/Exercise.js";

const hasMeaningfulSetValues = (set) =>
  ["weight", "reps", "distance", "duration"].some(
    (field) => typeof set[field] === "number" && !Number.isNaN(set[field])
  );

const resolveExerciseId = async (exerciseValue) => {
  if (!exerciseValue || typeof exerciseValue !== "string") {
    return null;
  }

  if (mongoose.Types.ObjectId.isValid(exerciseValue)) {
    return exerciseValue;
  }

  const trimmedName = exerciseValue.trim();

  if (!trimmedName) {
    return null;
  }

  const existingExercise = await Exercise.findOne({
    name: { $regex: `^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
  });

  if (existingExercise) {
    return existingExercise._id.toString();
  }

  const createdExercise = await Exercise.create({
    name: trimmedName,
    muscleGroup: "Custom",
    equipment: "Custom",
    type: "strength",
  });

  return createdExercise._id.toString();
};

const normalizeExercises = async (exercises = []) => {
  const normalized = await Promise.all(
    exercises.map(async (exercise) => ({
      ...exercise,
      exercise: await resolveExerciseId(exercise.exercise),
      sets: (exercise.sets || []).filter(hasMeaningfulSetValues),
    }))
  );

  return normalized.filter((exercise) => exercise.exercise && exercise.sets.length > 0);
};

export const createWorkout = async (req, res) => {
  try {
    const { date, exercises } = req.body;
    const userId = req.user.id;
    const normalizedExercises = await normalizeExercises(exercises);

    if (normalizedExercises.length === 0) {
      return res.status(400).json({ message: "At least one valid set is required" });
    }

    // ✅ create range for same day
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);

    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    // 🔍 find existing workout of same day
    let workout = await Workout.findOne({
      user: userId,
      date: { $gte: start, $lte: end },
    });

    if (workout) {
      normalizedExercises.forEach((newEx) => {
        const existing = workout.exercises.find(
          (ex) => ex.exercise.toString() === newEx.exercise,
        );

        if (existing) {
          // ✅ merge sets
          existing.sets.push(...newEx.sets);
        } else {
          // ✅ new exercise
          workout.exercises.push(newEx);
        }
      });

      await workout.save();
    } else {
      // ✅ create new
      workout = await Workout.create({
        user: userId,
        date: start, // store normalized date
        exercises: normalizedExercises,
      });
    }

    res.status(201).json(workout);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const getWorkouts = async (req, res) => {
  try {
    const workouts = await Workout.find({ user: req.user.id })
      .populate("exercises.exercise")
      .sort({ date: -1 });

    res.json(workouts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const getLastWorkoutForExercise = async (req, res) => {
  try {
    const { exerciseId } = req.query;

    const workout = await Workout.findOne({
      user: req.user.id,
      "exercises.exercise": exerciseId,
    })
      .sort({ date: -1 })
      .populate("exercises.exercise");

    if (!workout) {
      return res.json(null);
    }

    const exerciseData = workout.exercises.find(
      (ex) => ex.exercise._id.toString() === exerciseId,
    );

    res.json(exerciseData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const getExerciseStats = async (req, res) => {
  try {
    const { exerciseId } = req.query;

    if (!exerciseId) {
      return res.status(400).json({ message: "exerciseId is required" });
    }

    const workouts = await Workout.find({
      user: req.user.id,
      "exercises.exercise": exerciseId,
    }).select("exercises");

    let maxWeight = null;
    const maxRepsByWeight = {};

    workouts.forEach((workout) => {
      workout.exercises.forEach((exerciseEntry) => {
        if (exerciseEntry.exercise.toString() !== exerciseId) {
          return;
        }

        exerciseEntry.sets.forEach((set) => {
          if (typeof set.weight === "number") {
            maxWeight =
              maxWeight === null ? set.weight : Math.max(maxWeight, set.weight);

            if (typeof set.reps === "number") {
              const weightKey = String(set.weight);
              maxRepsByWeight[weightKey] = Math.max(
                maxRepsByWeight[weightKey] || 0,
                set.reps,
              );
            }
          }
        });
      });
    });

    res.json({
      maxWeight,
      maxRepsByWeight,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const getLast30DaysWorkouts = async (req, res) => {
  try {
    const workouts = await Workout.find({ user: req.user.id }).populate(
      "exercises.exercise"
    );

    res.json(workouts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const getTodayWorkout = async (req, res) => {
  try {
    // Start of today
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    // End of today
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const workout = await Workout.findOne({
      user: req.user.id,
      date: { $gte: start, $lte: end },
    }).populate("exercises.exercise");

    if (!workout) {
      return res.status(200).json(null); // important for frontend
    }

    res.json(workout);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
export const updateWorkout = async (req, res) => {
  try {
    const { id } = req.params;
    const { exercises } = req.body;

    const workout = await Workout.findOne({ _id: id, user: req.user.id });

    if (!workout) {
      return res.status(404).json({ message: "Workout not found" });
    }

    workout.exercises = await normalizeExercises(exercises);

    await workout.save();

    res.json(workout);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
