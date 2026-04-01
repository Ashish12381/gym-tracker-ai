import Exercise from "../models/Exercise.js";
import defaultExercises from "../data/defaultExercises.js";

export const getExercises = async (req, res) => {
  try {
    let exercises = await Exercise.find().sort({ muscleGroup: 1, name: 1 });

    if (exercises.length === 0) {
      exercises = await Exercise.insertMany(defaultExercises, { ordered: false });
    }

    res.json(exercises);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
