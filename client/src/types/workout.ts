export interface WorkoutSet {
  weight?: number;
  reps?: number;
  distance?: number;
  duration?: number;
}

export interface WorkoutExercise {
  exercise: string;
  sets: WorkoutSet[];
}

export interface PreviousSet {
  weight?: number;
  reps?: number;
  distance?: number;
  duration?: number;
}

export interface PreviousExerciseData {
  exercise: {
    _id: string;
    name: string;
  };
  sets: PreviousSet[];
}

// 🔥 IMPORTANT (for Dashboard)
export interface ExerciseStats {
  maxWeight: number | null;
  maxRepsByWeight: Record<string, number>;
}

export interface Workout {
  _id: string;
  date: string;
  exercises: {
    exercise: {
      type: string;
      _id: string;
      name: string;
      muscleGroup: string;
    };
    sets: WorkoutSet[];
  }[];
}
