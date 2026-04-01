import { useEffect, useState } from "react";
import { getTodayWorkout, updateWorkout } from "../services/workoutService";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import type { Workout, WorkoutSet } from "../types/workout";
import {
  getDefaultDistanceUnit,
  getDefaultDurationUnit,
  getDistanceInputValue,
  getDurationInputValue,
  hasMeaningfulSetValues,
  normalizeDistanceForStorage,
  normalizeDurationForStorage,
  type DistanceUnit,
  type DurationUnit,
} from "../utils/cardioUnits";

function WorkoutPage() {
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [editableWorkout, setEditableWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  const [cardioUnits, setCardioUnits] = useState<
    Record<string, { distance: DistanceUnit; duration: DurationUnit }>
  >({});

  useEffect(() => {
    const load = async () => {
      const data = await getTodayWorkout();
      setWorkout(data);
      setEditableWorkout(data);
      setLoading(false);
    };
    load();
  }, []);

  // 🔥 TOTAL VOLUME
  const calculateTotalVolume = () => {
    if (!editableWorkout) return 0;

    return editableWorkout.exercises.reduce((total, ex) => {
      return (
        total +
        ex.sets.reduce((sum, s) => {
          if (s.weight && s.reps) {
            return sum + s.weight * s.reps;
          }
          return sum;
        }, 0)
      );
    }, 0);
  };

  // 🔄 UPDATE SET
  const updateSet = (
    exIndex: number,
    setIndex: number,
    field: keyof WorkoutSet,
    value: number | ""
  ) => {
    if (!editableWorkout) return;

    const updated = { ...editableWorkout };

    updated.exercises[exIndex].sets[setIndex] = {
      ...updated.exercises[exIndex].sets[setIndex],
      [field]: value === "" ? undefined : value,
    };

    setEditableWorkout(updated);
    setIsDirty(true);
  };

  const getCardioUnitKey = (exIndex: number, setIndex: number) =>
    `${exIndex}-${setIndex}`;

  const getCardioUnitState = (exIndex: number, setIndex: number, set: WorkoutSet) =>
    cardioUnits[getCardioUnitKey(exIndex, setIndex)] ?? {
      distance: getDefaultDistanceUnit(set.distance),
      duration: getDefaultDurationUnit(set.duration),
    };

  const updateCardioUnit = (
    exIndex: number,
    setIndex: number,
    field: "distance" | "duration",
    value: DistanceUnit | DurationUnit
  ) => {
    const key = getCardioUnitKey(exIndex, setIndex);
    const currentSet = editableWorkout?.exercises[exIndex]?.sets[setIndex] || {};

    setCardioUnits((prev) => ({
      ...prev,
      [key]: {
        ...getCardioUnitState(exIndex, setIndex, currentSet),
        [field]: value,
      },
    }));
  };

  // 🗑️ DELETE SET
  const deleteSet = (exIndex: number, setIndex: number) => {
    if (!editableWorkout) return;

    const updated = {
      ...editableWorkout,
      exercises: editableWorkout.exercises.map((exercise, index) =>
        index === exIndex
          ? {
              ...exercise,
              sets: exercise.sets.filter((_, idx) => idx !== setIndex),
            }
          : exercise
      ).filter((exercise) => exercise.sets.length > 0),
    };

    setEditableWorkout(updated);
    setIsDirty(true);
  };

  // ➕ ADD SET
  const addSet = (exIndex: number) => {
    if (!editableWorkout) return;

    const updated = {
      ...editableWorkout,
      exercises: editableWorkout.exercises.map((exercise, index) =>
        index === exIndex
          ? {
              ...exercise,
              sets: [...exercise.sets, {}],
            }
          : exercise
      ),
    };

    setEditableWorkout(updated);
    setIsDirty(true);
  };

  // 💾 SAVE
  const handleUpdateWorkout = async () => {
    if (!editableWorkout) return;

    const cleanedExercises = editableWorkout.exercises
      .map((ex) => ({
        exercise: ex.exercise._id,
        sets: ex.sets.filter(hasMeaningfulSetValues),
      }))
      .filter((ex) => ex.sets.length > 0);

    await updateWorkout(editableWorkout._id, {
      exercises: cleanedExercises,
    });

    const nextWorkout =
      cleanedExercises.length === 0
        ? {
            ...editableWorkout,
            exercises: [],
          }
        : {
            ...editableWorkout,
            exercises: editableWorkout.exercises.filter(
              (ex) => ex.sets.filter(hasMeaningfulSetValues).length > 0
            ),
          };

    setWorkout(nextWorkout);
    setEditableWorkout(nextWorkout);
    setIsDirty(false);

    alert("Workout updated 💪");
  };

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-[#050505] via-[#0f172a] to-black px-4 py-5 text-white sm:px-6 sm:py-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mx-auto max-w-4xl space-y-5 pb-28 sm:space-y-6 sm:pb-24">

        {/* HEADER */}
        <motion.div
          className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div>
            <h1 className="text-3xl font-bold">🏋️ Today's Workout</h1>
            <p className="text-gray-400 text-sm">
              {new Date().toDateString()}
            </p>
          </div>

          <Link
            to="/log-workout"
            className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-3 text-center font-medium sm:w-auto"
          >
            + Add Exercise
          </Link>
        </motion.div>

        {/* LOADING */}
        {loading && <div className="text-center py-20">Loading...</div>}

        {/* EMPTY */}
        {!loading && (!workout || workout.exercises.length === 0) && (
          <div className="text-center py-20">
            No workout today 😴
          </div>
        )}

        {/* WORKOUT */}
        {editableWorkout && (
          <>
            {/* TOTAL */}
            <motion.div
              className="p-6 rounded-2xl bg-gradient-to-r from-purple-600/30 to-blue-600/30"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <p>Total Volume</p>
              <h2 className="text-3xl font-bold">
                {calculateTotalVolume()} kg
              </h2>
            </motion.div>

            {/* EXERCISES */}
            <div className="space-y-5">
              {editableWorkout.exercises
                .map((ex, originalExIndex) => ({ ex, originalExIndex }))
                .filter(({ ex }) => ex.sets.length > 0)
                .map(({ ex, originalExIndex }, exIndex) => (
                <motion.div
                  key={originalExIndex}
                  className="bg-white/5 border border-white/10 rounded-2xl p-5"
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.6 + exIndex * 0.1, duration: 0.5 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <h3 className="text-lg font-semibold mb-3">
                    {ex.exercise.name}
                  </h3>

                  <div className="mb-3 flex justify-end">
                    <button
                      type="button"
                      className="rounded bg-blue-500/20 px-3 py-1 text-sm text-blue-300 hover:bg-blue-500/30"
                      onClick={() => addSet(originalExIndex)}
                    >
                      + Add Set
                    </button>
                  </div>

                  {/* SETS */}
                  {ex.sets.map((set, idx) => (
                    <motion.div
                      key={idx}
                      className="mb-3 rounded-xl bg-black/40 p-3"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.8 + exIndex * 0.1 + idx * 0.05, duration: 0.3 }}
                    >
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <span className="text-sm font-medium text-white">Set {idx + 1}</span>
                        <button
                          type="button"
                          className="rounded-lg bg-red-500/20 px-3 py-2 text-sm text-red-300 hover:bg-red-500/30"
                          onClick={() => deleteSet(originalExIndex, idx)}
                        >
                          Delete
                        </button>
                      </div>

                      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">

                        {/* 🏋️ STRENGTH */}
                        {ex.exercise.type === "strength" && (
                          <>
                            <input
                              type="number"
                              value={set.weight ?? ""}
                              placeholder="kg"
                              className="w-full rounded-lg bg-black/50 px-3 py-2 sm:w-24"
                              onChange={(e) =>
                                updateSet(
                                  originalExIndex,
                                  idx,
                                  "weight",
                                  e.target.value === ""
                                    ? ""
                                    : Number(e.target.value)
                                )
                              }
                            />

                            <input
                              type="number"
                              value={set.reps ?? ""}
                              placeholder="reps"
                              className="w-full rounded-lg bg-black/50 px-3 py-2 sm:w-24"
                              onChange={(e) =>
                                updateSet(
                                  originalExIndex,
                                  idx,
                                  "reps",
                                  e.target.value === ""
                                    ? ""
                                    : Number(e.target.value)
                                )
                              }
                            />
                          </>
                        )}

                        {/* 🏃 CARDIO */}
                        {ex.exercise.type === "cardio" && (
                          <>
                            <div className="grid w-full grid-cols-[minmax(0,1fr)_72px] gap-2 sm:w-auto sm:grid-cols-[96px_64px]">
                              <input
                                type="number"
                                step="any"
                                value={getDistanceInputValue(
                                  set.distance,
                                  getCardioUnitState(
                                    originalExIndex,
                                    idx,
                                    set
                                  ).distance
                                )}
                                placeholder="distance"
                                className="w-full rounded-lg bg-black/50 px-3 py-2"
                                onChange={(e) =>
                                  updateSet(
                                    originalExIndex,
                                    idx,
                                    "distance",
                                    e.target.value === ""
                                      ? ""
                                      : normalizeDistanceForStorage(
                                          Number(e.target.value),
                                          getCardioUnitState(
                                            originalExIndex,
                                            idx,
                                            set
                                          ).distance
                                        ) ?? ""
                                  )
                                }
                              />
                              <select
                                value={getCardioUnitState(
                                  originalExIndex,
                                  idx,
                                  set
                                ).distance}
                                className="rounded-lg bg-black/50 px-2 py-2"
                                onChange={(e) =>
                                  updateCardioUnit(
                                    originalExIndex,
                                    idx,
                                    "distance",
                                    e.target.value as DistanceUnit
                                  )
                                }
                              >
                                <option value="m">m</option>
                                <option value="km">km</option>
                              </select>
                            </div>

                            <div className="grid w-full grid-cols-[minmax(0,1fr)_72px] gap-2 sm:w-auto sm:grid-cols-[96px_64px]">
                              <input
                                type="number"
                                step="any"
                                value={getDurationInputValue(
                                  set.duration,
                                  getCardioUnitState(
                                    originalExIndex,
                                    idx,
                                    set
                                  ).duration
                                )}
                                placeholder="duration"
                                className="w-full rounded-lg bg-black/50 px-3 py-2"
                                onChange={(e) =>
                                  updateSet(
                                    originalExIndex,
                                    idx,
                                    "duration",
                                    e.target.value === ""
                                      ? ""
                                      : normalizeDurationForStorage(
                                          Number(e.target.value),
                                          getCardioUnitState(
                                            originalExIndex,
                                            idx,
                                            set
                                          ).duration
                                        ) ?? ""
                                  )
                                }
                              />
                              <select
                                value={getCardioUnitState(
                                  originalExIndex,
                                  idx,
                                  set
                                ).duration}
                                className="rounded-lg bg-black/50 px-2 py-2"
                                onChange={(e) =>
                                  updateCardioUnit(
                                    originalExIndex,
                                    idx,
                                    "duration",
                                    e.target.value as DurationUnit
                                  )
                                }
                              >
                                <option value="sec">sec</option>
                                <option value="min">min</option>
                              </select>
                            </div>
                          </>
                        )}

                        {/* 💪 BODYWEIGHT */}
                        {ex.exercise.type === "bodyweight" && (
                          <>
                            <input
                              type="number"
                              value={set.reps ?? ""}
                              placeholder="reps"
                              className="w-full rounded-lg bg-black/50 px-3 py-2 sm:w-24"
                              onChange={(e) =>
                                updateSet(
                                  originalExIndex,
                                  idx,
                                  "reps",
                                  e.target.value === ""
                                    ? ""
                                    : Number(e.target.value)
                                )
                              }
                            />

                            <input
                              type="number"
                              value={set.weight ?? ""}
                              placeholder="extra kg"
                              className="w-full rounded-lg bg-black/50 px-3 py-2 sm:w-24"
                              onChange={(e) =>
                                updateSet(
                                  originalExIndex,
                                  idx,
                                  "weight",
                                  e.target.value === ""
                                    ? ""
                                    : Number(e.target.value)
                                )
                              }
                            />
                          </>
                        )}

                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              ))}
            </div>
          </>
        )}

        {/* SAVE BUTTON */}
        {isDirty && (
          <motion.button
            onClick={handleUpdateWorkout}
            className="fixed inset-x-4 bottom-4 rounded-xl bg-green-600 px-6 py-3 font-semibold shadow-[0_16px_40px_rgba(22,163,74,0.35)] sm:inset-x-auto sm:bottom-6 sm:right-6"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            💾 Save Changes
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

export default WorkoutPage;
