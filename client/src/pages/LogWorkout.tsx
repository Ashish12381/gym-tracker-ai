import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  fetchExercises,
  getExerciseStats,
  saveWorkout,
} from "../services/workoutService";
import ExerciseSelector from "../components/workout/ExerciseSelector";
import type { Exercise } from "../types/exercise";
import type {
  ExerciseStats,
  WorkoutExercise,
  WorkoutSet,
} from "../types/workout";
import { Link } from "react-router-dom";
import { getTodayWorkout } from "../services/workoutService";
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

function LogWorkout() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [workout, setWorkout] = useState<WorkoutExercise[]>([]);
  const [hasWorkoutToday, setHasWorkoutToday] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [exerciseStats, setExerciseStats] = useState<
    Record<string, ExerciseStats>
  >({});
  const [cardioUnits, setCardioUnits] = useState<
    Record<string, { distance: DistanceUnit; duration: DurationUnit }>
  >({});

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  useEffect(() => {
    fetchExercises().then(setExercises);
  }, []);
  useEffect(() => {
  const checkTodayWorkout = async () => {
    const data = await getTodayWorkout();
    setHasWorkoutToday(!!data);
  };

  checkTodayWorkout();
}, []);

  useEffect(() => {
    const selectedExerciseIds = Array.from(
      new Set(
        workout
          .map((entry) => entry.exercise)
          .filter((exerciseId) =>
            exercises.some((exercise) => exercise._id === exerciseId)
          )
      )
    );

    const missingExerciseIds = selectedExerciseIds.filter(
      (exerciseId) => !exerciseStats[exerciseId]
    );

    if (missingExerciseIds.length === 0) {
      return;
    }

    const loadStats = async () => {
      const statsEntries = await Promise.all(
        missingExerciseIds.map(async (exerciseId) => [
          exerciseId,
          await getExerciseStats(exerciseId),
        ] as const)
      );

      setExerciseStats((prev) => ({
        ...prev,
        ...Object.fromEntries(statsEntries),
      }));
    };

    loadStats();
  }, [exerciseStats, exercises, workout]);

  // ➕ Add Exercise
  const addExercise = () => {
    setSaveMessage(null);
    setWorkout((prev) => [
      ...prev,
      { exercise: "", sets: [{} as WorkoutSet] },
    ]);
  };

  // 🔄 Update Exercise
  const updateExercise = (index: number, value: string) => {
    setSaveMessage(null);
    const updated = [...workout];
    updated[index].exercise = value;
    setWorkout(updated);
  };

  // ➕ Add Set
  const addSet = (index: number) => {
    setSaveMessage(null);
    const updated = [...workout];
    updated[index].sets.push({} as WorkoutSet);
    setWorkout(updated);
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

    setCardioUnits((prev) => ({
      ...prev,
      [key]: {
        ...getCardioUnitState(exIndex, setIndex, workout[exIndex]?.sets[setIndex] || {}),
        [field]: value,
      },
    }));
  };

  // 🔄 Update Set
  const updateSet = (
    exIndex: number,
    setIndex: number,
    field: keyof WorkoutSet,
    value: number | ""
  ) => {
    setSaveMessage(null);
    const updated = [...workout];

    updated[exIndex].sets[setIndex] = {
      ...updated[exIndex].sets[setIndex],
      [field]: value === "" ? undefined : value,
    };

    setWorkout(updated);
  };

  // 💾 Save Workout
  const handleSaveWorkout = async () => {
    if (isSaving) {
      return;
    }

    try {
      setIsSaving(true);
      setSaveMessage(null);

      const cleanedExercises = workout
        .map((ex) => ({
          exercise: ex.exercise,
          sets: ex.sets
            .filter(hasMeaningfulSetValues)
            .map((s) => ({
              weight: s.weight,
              reps: s.reps,
              distance: s.distance,
              duration: s.duration,
            })),
        }))
        .filter((ex) => ex.exercise && ex.sets.length > 0);

      if (cleanedExercises.length === 0) {
        setSaveMessage({
          type: "error",
          text: "Add at least one complete set before saving.",
        });
        return;
      }

      await saveWorkout({
        date: new Date(selectedDate).toISOString(),
        exercises: cleanedExercises,
      });

      setSaveMessage({
        type: "success",
        text: "Workout saved successfully.",
      });
      setWorkout([]);
      setHasWorkoutToday(true);
    } catch (err) {
      console.error(err);
      setSaveMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Error saving workout",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getMaxRepsForWeight = (
    stats: ExerciseStats | undefined,
    weight?: number
  ) => {
    if (!stats || typeof weight !== "number") {
      return null;
    }

    return stats.maxRepsByWeight[String(weight)] ?? null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050505] via-[#0f172a] to-black px-4 py-5 text-white sm:px-6 sm:py-6">
      <div className="mx-auto max-w-3xl space-y-5 sm:space-y-6">

        {/* HEADER */}
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold">💪 Log Workout</h1>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 sm:w-auto"
          />
        </div>

        {/* ADD EXERCISE */}
        <button
          onClick={addExercise}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 transition"
        >
          + Add Exercise
        </button>

        {/* EMPTY STATE */}
        {workout.length === 0 && (
          <div className="text-center text-gray-400 py-10">
            Start by adding your first exercise 🚀
          </div>
        )}

        {/* EXERCISE LIST */}
        <div className="space-y-4">
          {workout.map((ex, exIndex) => {
            const selectedExercise = exercises.find(
              (e) => e._id === ex.exercise
            );
            const stats = selectedExercise
              ? exerciseStats[selectedExercise._id]
              : undefined;

            return (
              <div
                key={exIndex}
                className="bg-white/5 border border-white/10 rounded-xl p-4"
              >
                <ExerciseSelector
                  exercises={exercises}
                  value={ex.exercise}
                  onChange={(v) => updateExercise(exIndex, v)}
                />

                {/* TYPE HINT */}
                {selectedExercise?.type && (
                  <p className="text-xs text-gray-400 mt-2">
                    {selectedExercise.type === "strength" &&
                      "Enter weight & reps"}
                    {selectedExercise.type === "bodyweight" &&
                      "Enter reps (weight optional)"}
                    {selectedExercise.type === "cardio" &&
                      "Enter distance and duration, then choose units"}
                  </p>
                )}

                {/* SETS */}
                <div className="mt-4 space-y-3">
                  {ex.sets.map((set, setIndex) => (
                    <motion.div
                      key={setIndex}
                      className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3"
                    >
                      {/* 🏋️ STRENGTH */}
                      {selectedExercise?.type === "strength" && (
                        <>
                          <input
                            type="number"
                            placeholder="Weight (kg)"
                            value={set.weight ?? ""}
                            className="p-3 bg-black/50 rounded-lg border border-white/10"
                            onChange={(e) =>
                              updateSet(
                                exIndex,
                                setIndex,
                                "weight",
                                e.target.value === ""
                                  ? ""
                                  : Number(e.target.value)
                              )
                            }
                          />

                          <input
                            type="number"
                            placeholder="Reps"
                            value={set.reps ?? ""}
                            className="p-3 bg-black/50 rounded-lg border border-white/10"
                            onChange={(e) =>
                              updateSet(
                                exIndex,
                                setIndex,
                                "reps",
                                e.target.value === ""
                                  ? ""
                                  : Number(e.target.value)
                              )
                            }
                          />
                        </>
                      )}

                      {/* 🤸 BODYWEIGHT */}
                      {selectedExercise?.type === "bodyweight" && (
                        <>
                          <input
                            type="number"
                            placeholder="Reps"
                            value={set.reps ?? ""}
                            className="p-3 bg-black/50 rounded-lg border border-white/10"
                            onChange={(e) =>
                              updateSet(
                                exIndex,
                                setIndex,
                                "reps",
                                e.target.value === ""
                                  ? ""
                                  : Number(e.target.value)
                              )
                            }
                          />

                          <input
                            type="number"
                            placeholder="Extra Weight"
                            value={set.weight ?? ""}
                            className="p-3 bg-black/50 rounded-lg border border-white/10"
                            onChange={(e) =>
                              updateSet(
                                exIndex,
                                setIndex,
                                "weight",
                                e.target.value === ""
                                  ? ""
                                  : Number(e.target.value)
                              )
                            }
                          />
                        </>
                      )}

                      {/* 🏃 CARDIO */}
                      {selectedExercise?.type === "cardio" && (
                        <>
                          <div className="grid grid-cols-[minmax(0,1fr)_88px] gap-3 sm:col-span-2 md:col-span-1">
                            <input
                              type="number"
                              step="any"
                              placeholder="Distance"
                              value={getDistanceInputValue(
                                set.distance,
                                getCardioUnitState(exIndex, setIndex, set).distance
                              )}
                              className="p-3 bg-black/50 rounded-lg border border-white/10"
                              onChange={(e) =>
                                updateSet(
                                  exIndex,
                                  setIndex,
                                  "distance",
                                  e.target.value === ""
                                    ? ""
                                    : normalizeDistanceForStorage(
                                        Number(e.target.value),
                                        getCardioUnitState(exIndex, setIndex, set).distance
                                      ) ?? ""
                                )
                              }
                            />
                            <select
                              value={getCardioUnitState(exIndex, setIndex, set).distance}
                              className="p-3 bg-black/50 rounded-lg border border-white/10"
                              onChange={(e) =>
                                updateCardioUnit(
                                  exIndex,
                                  setIndex,
                                  "distance",
                                  e.target.value as DistanceUnit
                                )
                              }
                            >
                              <option value="m">Meters</option>
                              <option value="km">KM</option>
                            </select>
                          </div>

                          <div className="grid grid-cols-[minmax(0,1fr)_88px] gap-3 sm:col-span-2 md:col-span-1">
                            <input
                              type="number"
                              step="any"
                              placeholder="Duration"
                              value={getDurationInputValue(
                                set.duration,
                                getCardioUnitState(exIndex, setIndex, set).duration
                              )}
                              className="p-3 bg-black/50 rounded-lg border border-white/10"
                              onChange={(e) =>
                                updateSet(
                                  exIndex,
                                  setIndex,
                                  "duration",
                                  e.target.value === ""
                                    ? ""
                                    : normalizeDurationForStorage(
                                        Number(e.target.value),
                                        getCardioUnitState(exIndex, setIndex, set).duration
                                      ) ?? ""
                                )
                              }
                            />
                            <select
                              value={getCardioUnitState(exIndex, setIndex, set).duration}
                              className="p-3 bg-black/50 rounded-lg border border-white/10"
                              onChange={(e) =>
                                updateCardioUnit(
                                  exIndex,
                                  setIndex,
                                  "duration",
                                  e.target.value as DurationUnit
                                )
                              }
                            >
                              <option value="sec">Seconds</option>
                              <option value="min">Minutes</option>
                            </select>
                          </div>
                        </>
                      )}

                      {/* FALLBACK */}
                      {!selectedExercise?.type && (
                        <div className="text-gray-500 text-sm col-span-full">
                          Select exercise to enter details
                        </div>
                      )}

                      {(selectedExercise?.type === "strength" ||
                        selectedExercise?.type === "bodyweight") && (
                        <div className="col-span-full text-xs text-gray-400">
                          <p>
                            {stats?.maxWeight !== null &&
                            stats?.maxWeight !== undefined
                              ? `Max weight: ${stats.maxWeight} kg`
                              : "Max weight: No previous record"}
                          </p>

                          {typeof set.weight === "number" && (
                            <p>
                              {getMaxRepsForWeight(stats, set.weight) !== null
                                ? `Max reps at ${set.weight} kg: ${getMaxRepsForWeight(
                                    stats,
                                    set.weight
                                  )}`
                                : `Max reps at ${set.weight} kg: No previous record`}
                            </p>
                          )}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>

                {/* ADD SET */}
                <button
                  onClick={() => addSet(exIndex)}
                  disabled={isSaving}
                  className="mt-3 text-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  + Add Set
                </button>
              </div>
            );
          })}
        </div>

        {saveMessage && (
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${
              saveMessage.type === "success"
                ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100"
                : "border-rose-400/20 bg-rose-500/10 text-rose-100"
            }`}
          >
            {saveMessage.text}
          </div>
        )}

        {isSaving && (
          <div className="rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
            Saving workout. Please wait...
          </div>
        )}

        {/* SAVE BUTTON */}
        {workout.length > 0 && (
          <button
            onClick={handleSaveWorkout}
            disabled={isSaving}
            className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 py-4 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            💾 Save Workout
          </button>
        )}

        {hasWorkoutToday && (
  <div className="mb-4 flex justify-stretch sm:justify-end">
    <Link
      to="/workout"
      className="group flex w-full items-center justify-center gap-2 px-4 py-3 rounded-xl 
      bg-white/5 border border-white/10 backdrop-blur 
      hover:bg-white/10 transition-all duration-300 sm:w-auto"
    >
      <span className="text-sm text-gray-300">
        View Today Workout
      </span>

      <span className="transform group-hover:translate-x-1 transition">
        →
      </span>
    </Link>
  </div>
)}
      </div>
    </div>
  );
}

export default LogWorkout;
