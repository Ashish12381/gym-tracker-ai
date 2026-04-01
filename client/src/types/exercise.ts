export type ExerciseType =
  | "strength"
  | "bodyweight"
  | "cardio"
  | "time"
  | "distance"
  | "hybrid";

export interface Exercise {
  _id: string;
  name: string;
  muscleGroup: string;
  equipment?: string;
  type: ExerciseType;
}