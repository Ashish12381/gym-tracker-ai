import Exercise from "../models/Exercise.js";

export const getExercises = async (req, res) => {
  try {
    const exercises = await Exercise.find();

    res.json(exercises);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};