import mongoose from "mongoose";

const setSchema = new mongoose.Schema({
  weight: Number,
  reps: Number,
  distance: Number,
  duration: Number,
});

const workoutSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  date: { type: Date, required: true },
  exercises: [
    {
      exercise: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Exercise",
      },
      sets: [setSchema],
    },
  ],
});
const Workout = mongoose.model("Workout", workoutSchema);

export default Workout;
