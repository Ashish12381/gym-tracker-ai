import API from "./api";
import type { ExerciseStats } from "../types/workout";

export interface SaveWorkoutPayload {
  date: string;
  exercises: {
    exercise: string;
    sets: {
      weight?: number;
      reps?: number;
      distance?: number;
      duration?: number;
    }[];
  }[];
}
export interface UpdateWorkoutPayload {
  exercises: {
    exercise: string;
    sets: {
      weight?: number;
      reps?: number;
      distance?: number;
      duration?: number;
    }[];
  }[];
}
export const fetchExercises = async () => {
  const res = await API.get("/exercises");
  return res.data;
};

export const getLastWorkout = async (exerciseId: string) => {
  const res = await API.get(`/workouts/last?exerciseId=${exerciseId}`);
  return res.data;
};

export const getExerciseStats = async (
  exerciseId: string
): Promise<ExerciseStats> => {
  const res = await API.get(`/workouts/stats?exerciseId=${exerciseId}`);
  return res.data;
};

export const saveWorkout = async (data: SaveWorkoutPayload) => {
  return API.post("/workouts", data); // ✅ FIXED (use API not axios)
};

export const getLast30DaysWorkouts = async () => {
  const res = await API.get("/workouts/last30");
  return res.data;
};
export const getTodayWorkout = async () => {
  const res = await API.get("/workouts/today");
  return res.data;
};
export const updateWorkout = async (
  id: string,
  data: UpdateWorkoutPayload
) => {
  const res = await API.put(`/workouts/${id}`, data);
  return res.data;
};
