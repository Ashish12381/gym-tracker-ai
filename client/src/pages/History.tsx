import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { getLast30DaysWorkouts } from "../services/workoutService";
import type { Workout, WorkoutSet } from "../types/workout";

type SafeWorkout = Workout & {
  exercises: Array<
    Workout["exercises"][number] & {
      exercise: NonNullable<Workout["exercises"][number]["exercise"]>;
    }
  >;
};

interface DayStatus {
  isoDate: string;
  label: string;
  shortLabel: string;
  status: "worked_out" | "missed";
  workout?: SafeWorkout;
}

function History() {
  const [workouts, setWorkouts] = useState<SafeWorkout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data: Workout[] = await getLast30DaysWorkouts();
        const normalized = data
          .map((workout) => ({
            ...workout,
            exercises: workout.exercises.filter(
              (
                exercise
              ): exercise is SafeWorkout["exercises"][number] =>
                Boolean(exercise.exercise) && exercise.sets.length > 0
            ),
          }))
          .filter((workout) => workout.exercises.length > 0)
          .sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );

        setWorkouts(normalized);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const formatDay = (date: Date) =>
    date.toLocaleDateString(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
    });

  const getIsoDay = (date: Date) => date.toISOString().split("T")[0];

  const calculateSetVolume = (set: WorkoutSet) =>
    (set.weight || 0) * (set.reps || 0);

  const workoutMap = useMemo(() => {
    const map = new Map<string, SafeWorkout>();

    workouts.forEach((workout) => {
      map.set(getIsoDay(new Date(workout.date)), workout);
    });

    return map;
  }, [workouts]);

  const last14Days: DayStatus[] = useMemo(() => {
    const days: DayStatus[] = [];

    for (let offset = 13; offset >= 0; offset -= 1) {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - offset);

      const isoDate = getIsoDay(date);
      const workout = workoutMap.get(isoDate);

      days.push({
        isoDate,
        label: formatDay(date),
        shortLabel: date.toLocaleDateString(undefined, {
          weekday: "short",
          day: "numeric",
        }),
        status: workout ? "worked_out" : "missed",
        workout,
      });
    }

    return days;
  }, [workoutMap]);

  const missedDays = last14Days.filter((day) => day.status === "missed");
  const completedDays = last14Days.filter((day) => day.status === "worked_out");

  const longestGap = useMemo(() => {
    let best = 0;
    let current = 0;

    last14Days.forEach((day) => {
      if (day.status === "missed") {
        current += 1;
        best = Math.max(best, current);
      } else {
        current = 0;
      }
    });

    return best;
  }, [last14Days]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.16),_transparent_22%),linear-gradient(135deg,_#020617_0%,_#0f172a_50%,_#020617_100%)] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-[28px] border border-white/10 bg-white/5 p-6 sm:p-8"
        >
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-300">
                Workout History
              </p>
              <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
                Your training timeline
              </h1>
              <p className="max-w-2xl text-sm text-slate-300 sm:text-base">
                Logged days, missed days, and workout details in one place.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5">
                <p className="text-sm text-emerald-200">Worked Out</p>
                <p className="mt-2 text-3xl font-semibold">{completedDays.length}</p>
                <p className="mt-2 text-sm text-emerald-100/80">Last 14 days</p>
              </div>
              <div className="rounded-3xl border border-amber-400/20 bg-amber-400/10 p-5">
                <p className="text-sm text-amber-200">Missed Days</p>
                <p className="mt-2 text-3xl font-semibold">{missedDays.length}</p>
                <p className="mt-2 text-sm text-amber-100/80">Last 14 days</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5">
                <p className="text-sm text-slate-400">Longest Gap</p>
                <p className="mt-2 text-3xl font-semibold">{longestGap} day{longestGap === 1 ? "" : "s"}</p>
                <p className="mt-2 text-sm text-slate-400">Last 14 days</p>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.42, delay: 0.05 }}
          className="rounded-[28px] border border-white/10 bg-white/5 p-6"
        >
          <div className="mb-5">
            <h2 className="text-2xl font-semibold">Last 14 days</h2>
            <p className="mt-2 text-sm text-slate-400">Green = workout, dark = missed.</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {last14Days.map((day) => (
              <div
                key={day.isoDate}
                className={[
                  "rounded-3xl border p-4 transition",
                  day.status === "worked_out"
                    ? "border-emerald-400/20 bg-emerald-400/10"
                    : "border-white/10 bg-slate-950/70",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{day.shortLabel}</p>
                    <p className="mt-1 text-xs text-slate-300">{day.label}</p>
                  </div>
                  <span
                    className={[
                      "rounded-full px-3 py-1 text-xs font-medium",
                      day.status === "worked_out"
                        ? "bg-emerald-500/15 text-emerald-200"
                        : "bg-white/5 text-slate-300",
                    ].join(" ")}
                  >
                    {day.status === "worked_out" ? "Worked out" : "Missed"}
                  </span>
                </div>

                {day.workout ? (
                  <div className="mt-4 space-y-2 text-sm text-slate-200">
                    <p>{day.workout.exercises.length} exercises logged</p>
                    <p>
                      {day.workout.exercises.reduce(
                        (sum, exercise) => sum + exercise.sets.length,
                        0
                      )}{" "}
                      sets completed
                    </p>
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-400">No workout logged</p>
                )}
              </div>
            ))}
          </div>
        </motion.section>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.44, delay: 0.08 }}
            className="rounded-[28px] border border-white/10 bg-white/5 p-6"
          >
            <div className="mb-5">
              <h2 className="text-2xl font-semibold">Workout timeline</h2>
              <p className="mt-2 text-sm text-slate-400">Tap a day to view details.</p>
            </div>

            {loading ? (
              <div className="rounded-3xl border border-dashed border-white/10 bg-slate-950/60 p-6 text-sm text-slate-400">
                Loading workout history...
              </div>
            ) : workouts.length > 0 ? (
              <div className="space-y-4">
                {workouts.map((workout, index) => {
                  const totalSetsForWorkout = workout.exercises.reduce(
                    (sum, exercise) => sum + exercise.sets.length,
                    0
                  );
                  const totalVolumeForWorkout = workout.exercises.reduce(
                    (sum, exercise) =>
                      sum +
                      exercise.sets.reduce(
                        (setTotal, set) => setTotal + calculateSetVolume(set),
                        0
                      ),
                    0
                  );

                  return (
                    <motion.details
                      key={workout._id}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.28, delay: index * 0.04 }}
                      className="group rounded-3xl border border-white/10 bg-slate-950/70 p-5"
                    >
                      <summary className="cursor-pointer list-none">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-lg font-semibold text-white">
                              {new Date(workout.date).toLocaleDateString(undefined, {
                                weekday: "long",
                                month: "long",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </p>
                            <p className="mt-2 text-sm text-slate-400">
                              {workout.exercises.length} exercises, {totalSetsForWorkout} sets,
                              {totalVolumeForWorkout > 0
                                ? ` ${totalVolumeForWorkout} kg total volume`
                                : " no weighted volume recorded"}
                            </p>
                          </div>

                          <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300">
                            View details
                          </span>
                        </div>
                      </summary>

                      <div className="mt-5 space-y-4 border-t border-white/10 pt-5">
                        {workout.exercises.map((exercise) => (
                          <div
                            key={`${workout._id}-${exercise.exercise._id}`}
                            className="rounded-2xl border border-white/10 bg-white/5 p-4"
                          >
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <h3 className="text-lg font-semibold text-white">
                                  {exercise.exercise.name}
                                </h3>
                                <p className="text-sm text-slate-400">
                                  {exercise.exercise.muscleGroup} • {exercise.exercise.type}
                                </p>
                              </div>
                              <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs text-cyan-200">
                                {exercise.sets.length} sets
                              </span>
                            </div>

                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                              {exercise.sets.map((set, setIndex) => (
                                <div
                                  key={setIndex}
                                  className="rounded-2xl border border-white/10 bg-slate-950/70 p-3 text-sm text-slate-200"
                                >
                                  <p className="font-medium text-white">Set {setIndex + 1}</p>
                                  <div className="mt-2 flex flex-wrap gap-2 text-sm text-slate-300">
                                    {typeof set.weight === "number" && (
                                      <span className="rounded-full bg-white/5 px-3 py-1">
                                        {set.weight} kg
                                      </span>
                                    )}
                                    {typeof set.reps === "number" && (
                                      <span className="rounded-full bg-white/5 px-3 py-1">
                                        {set.reps} reps
                                      </span>
                                    )}
                                    {typeof set.distance === "number" && (
                                      <span className="rounded-full bg-white/5 px-3 py-1">
                                        {set.distance} km
                                      </span>
                                    )}
                                    {typeof set.duration === "number" && (
                                      <span className="rounded-full bg-white/5 px-3 py-1">
                                        {set.duration} min
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.details>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-white/10 bg-slate-950/60 p-6 text-sm text-slate-400">
                No workouts found yet. Start logging to build your history.
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.46, delay: 0.1 }}
            className="rounded-[28px] border border-white/10 bg-white/5 p-6"
          >
            <div className="mb-5">
              <h2 className="text-2xl font-semibold">Missed day notes</h2>
              <p className="mt-2 text-sm text-slate-400">Recent gaps in your training.</p>
            </div>

            {missedDays.length > 0 ? (
              <div className="space-y-3">
                {missedDays
                  .slice()
                  .reverse()
                  .map((day) => (
                    <div
                      key={day.isoDate}
                      className="rounded-3xl border border-white/10 bg-slate-950/70 p-4"
                    >
                      <p className="text-sm font-semibold text-white">{day.label}</p>
                      <p className="mt-2 text-sm text-slate-400">No workout logged</p>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5 text-sm text-emerald-100">
                No missed days in the last 14 days.
              </div>
            )}
          </motion.div>
        </section>
      </div>
    </div>
  );
}

export default History;
