import type { WorkoutSet } from "../types/workout";

export type DistanceUnit = "m" | "km";
export type DurationUnit = "sec" | "min";

export const getDefaultDistanceUnit = (distance?: number): DistanceUnit =>
  typeof distance === "number" && distance > 0 && distance < 1 ? "m" : "km";

export const getDefaultDurationUnit = (duration?: number): DurationUnit =>
  typeof duration === "number" && duration > 0 && duration < 1 ? "sec" : "min";

export const getDistanceInputValue = (
  distance: number | undefined,
  unit: DistanceUnit
) => {
  if (typeof distance !== "number") {
    return "";
  }

  return unit === "m" ? distance * 1000 : distance;
};

export const getDurationInputValue = (
  duration: number | undefined,
  unit: DurationUnit
) => {
  if (typeof duration !== "number") {
    return "";
  }

  return unit === "sec" ? duration * 60 : duration;
};

export const normalizeDistanceForStorage = (
  value: number | "",
  unit: DistanceUnit
) => {
  if (value === "") {
    return undefined;
  }

  return unit === "m" ? value / 1000 : value;
};

export const normalizeDurationForStorage = (
  value: number | "",
  unit: DurationUnit
) => {
  if (value === "") {
    return undefined;
  }

  return unit === "sec" ? value / 60 : value;
};

export const hasMeaningfulSetValues = (set: WorkoutSet) =>
  ["weight", "reps", "distance", "duration"].some((field) => {
    const value = set[field as keyof WorkoutSet];
    return typeof value === "number" && !Number.isNaN(value);
  });
