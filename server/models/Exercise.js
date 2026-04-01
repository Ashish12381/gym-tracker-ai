import mongoose from "mongoose";

const exerciseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    muscleGroup: {
      type: String,
      required: true,
    },
    equipment: {
      type: String,
      required: true,
    },

    // ✅ NEW FIELD (IMPORTANT)
    type: {
      type: String,
      enum: ["strength", "cardio", "bodyweight"],
      default: "strength", // 🔥 prevents breaking old data
    },
  },
  {
    timestamps: true,
  }
);

const Exercise = mongoose.model("Exercise", exerciseSchema);

export default Exercise;