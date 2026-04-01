import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getLast30DaysWorkouts } from "../services/workoutService";
import type { Workout, WorkoutSet } from "../types/workout";

interface DailyVolumePoint {
  date: string;
  volume: number;
}

interface ExerciseOption {
  name: string;
  type: string;
}

interface ExerciseProgressPoint {
  date: string;
  value: number;
}

interface MuscleSummary {
  muscle: string;
  totalVolume: number;
  sessions: number;
  topExercise: string;
}

interface RecentWorkoutSummary {
  id: string;
  date: string;
  exerciseCount: number;
  totalSets: number;
  summary: string;
}

interface InsightCard {
  title: string;
  value: string;
  description: string;
}

type SafeWorkout = Workout & {
  exercises: Array<
    Workout["exercises"][number] & {
      exercise: NonNullable<Workout["exercises"][number]["exercise"]>;
    }
  >;
};

function Dashboard() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [selectedExercise, setSelectedExercise] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data: Workout[] = await getLast30DaysWorkouts();
        const sorted = [...data].sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        setWorkouts(sorted);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const safeWorkouts: SafeWorkout[] = workouts.map((workout) => ({
    ...workout,
    exercises: workout.exercises.filter(
      (
        exercise
      ): exercise is SafeWorkout["exercises"][number] =>
        Boolean(exercise.exercise) && exercise.sets.length > 0
    ),
  }))
    .filter((workout) => workout.exercises.length > 0);

  const formatShortDate = (date: string) =>
    new Date(date).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });

  const calculateSetVolume = (set: WorkoutSet) =>
    (set.weight || 0) * (set.reps || 0);

  const dailyVolume: DailyVolumePoint[] = safeWorkouts.map((workout) => ({
    date: formatShortDate(workout.date),
    volume: workout.exercises.reduce(
      (total, exercise) =>
        total +
        exercise.sets.reduce((sum, set) => sum + calculateSetVolume(set), 0),
      0
    ),
  }));

  const totalWorkouts = safeWorkouts.length;
  const totalVolume = dailyVolume.reduce((sum, item) => sum + item.volume, 0);
  const totalSets = safeWorkouts.reduce(
    (sum, workout) =>
      sum +
      workout.exercises.reduce(
        (exerciseTotal, exercise) => exerciseTotal + exercise.sets.length,
        0
      ),
    0
  );
  const workoutDates = safeWorkouts.map((workout) => new Date(workout.date));

  const workoutDaysSet = new Set(
    safeWorkouts.map((workout) => new Date(workout.date).toDateString())
  );

  const last7Days = new Date();
  last7Days.setDate(last7Days.getDate() - 6);

  const workoutsLast7Days = workoutDates.filter((date) => date >= last7Days).length;

  let currentStreak = 0;
  const streakCursor = new Date();
  while (workoutDaysSet.has(streakCursor.toDateString())) {
    currentStreak += 1;
    streakCursor.setDate(streakCursor.getDate() - 1);
  }

  let strongestExercise = "No data yet";
  let strongestWeight = 0;

  safeWorkouts.forEach((workout) => {
    workout.exercises.forEach((exercise) => {
      exercise.sets.forEach((set) => {
        if ((set.weight || 0) > strongestWeight) {
          strongestWeight = set.weight || 0;
          strongestExercise = exercise.exercise.name;
        }
      });
    });
  });

  const exerciseMap = new Map<string, ExerciseOption>();
  safeWorkouts.forEach((workout) => {
    workout.exercises.forEach((exercise) => {
      if (!exerciseMap.has(exercise.exercise.name)) {
        exerciseMap.set(exercise.exercise.name, {
          name: exercise.exercise.name,
          type: exercise.exercise.type,
        });
      }
    });
  });

  const exerciseOptions = Array.from(exerciseMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  const selectedExerciseOption =
    exerciseOptions.find((exercise) => exercise.name === selectedExercise) ||
    null;

  const getExerciseMetric = (set: WorkoutSet, type: string) => {
    if (type === "cardio") {
      return set.distance || set.duration || 0;
    }

    if (type === "bodyweight") {
      return set.weight || set.reps || 0;
    }

    return set.weight || 0;
  };

  const getExerciseMetricLabel = (type: string) => {
    if (type === "cardio") return "Best distance / duration";
    if (type === "bodyweight") return "Best added weight / reps";
    return "Best weight";
  };

  const getExerciseMetricUnit = (type: string) => {
    if (type === "strength") return "kg";
    return "";
  };

  const exerciseProgress: ExerciseProgressPoint[] = selectedExerciseOption
    ? safeWorkouts
        .map((workout) => {
          let bestValue = 0;

          workout.exercises.forEach((exercise) => {
            if (exercise.exercise.name !== selectedExerciseOption.name) return;

            exercise.sets.forEach((set) => {
              bestValue = Math.max(
                bestValue,
                getExerciseMetric(set, selectedExerciseOption.type)
              );
            });
          });

          return bestValue > 0
            ? {
                date: formatShortDate(workout.date),
                value: bestValue,
              }
            : null;
        })
        .filter((entry): entry is ExerciseProgressPoint => entry !== null)
    : [];

  const bestExerciseValue =
    exerciseProgress.length > 0
      ? Math.max(...exerciseProgress.map((point) => point.value))
      : 0;

  const muscleSummaryMap = new Map<
    string,
    { totalVolume: number; sessions: number; exerciseCounts: Map<string, number> }
  >();

  safeWorkouts.forEach((workout) => {
    const sessionMuscles = new Set<string>();

    workout.exercises.forEach((exercise) => {
      const muscle = exercise.exercise.muscleGroup;
      const existing = muscleSummaryMap.get(muscle) || {
        totalVolume: 0,
        sessions: 0,
        exerciseCounts: new Map<string, number>(),
      };

      existing.totalVolume += exercise.sets.reduce(
        (sum, set) => sum + calculateSetVolume(set),
        0
      );

      existing.exerciseCounts.set(
        exercise.exercise.name,
        (existing.exerciseCounts.get(exercise.exercise.name) || 0) + 1
      );

      muscleSummaryMap.set(muscle, existing);
      sessionMuscles.add(muscle);
    });

    sessionMuscles.forEach((muscle) => {
      const existing = muscleSummaryMap.get(muscle);
      if (existing) {
        existing.sessions += 1;
      }
    });
  });

  const muscleSummaries: MuscleSummary[] = Array.from(
    muscleSummaryMap.entries()
  )
    .map(([muscle, data]) => {
      let topExercise = "No data";
      let topExerciseCount = 0;

      data.exerciseCounts.forEach((count, exerciseName) => {
        if (count > topExerciseCount) {
          topExerciseCount = count;
          topExercise = exerciseName;
        }
      });

      return {
        muscle,
        totalVolume: data.totalVolume,
        sessions: data.sessions,
        topExercise,
      };
    })
    .sort((a, b) => b.totalVolume - a.totalVolume)
    .slice(0, 4);

  const recentWorkouts: RecentWorkoutSummary[] = [...safeWorkouts]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)
    .map((workout) => {
      const exerciseNames = workout.exercises.map(
        (exercise) => exercise.exercise.name
      );

      return {
        id: workout._id,
        date: new Date(workout.date).toLocaleDateString(undefined, {
          weekday: "short",
          month: "short",
          day: "numeric",
        }),
        exerciseCount: workout.exercises.length,
        totalSets: workout.exercises.reduce(
          (sum, exercise) => sum + exercise.sets.length,
          0
        ),
        summary: exerciseNames.slice(0, 3).join(", "),
      };
    });

  const averageSetsPerWorkout =
    totalWorkouts > 0 ? Math.round((totalSets / totalWorkouts) * 10) / 10 : 0;

  const progressCards = [
    {
      label: "Workouts Logged",
      value: totalWorkouts,
      hint: "Total training sessions captured",
    },
    {
      label: "Strength Volume",
      value: `${totalVolume} kg`,
      hint: "Calculated as weight x reps",
    },
    {
      label: "Sets Completed",
      value: totalSets,
      hint: "Across all saved workouts",
    },
    {
      label: "Avg Sets / Workout",
      value: averageSetsPerWorkout,
      hint: "How long your sessions usually run",
    },
  ];

  const insightCards: InsightCard[] = [
    {
      title: "Consistency",
      value: `${workoutsLast7Days} workout${workoutsLast7Days === 1 ? "" : "s"} this week`,
      description:
        workoutsLast7Days > 0
          ? "You are building momentum with recent training sessions."
          : "No workouts logged in the last 7 days yet.",
    },
    {
      title: "Current Streak",
      value: currentStreak > 0 ? `${currentStreak} day${currentStreak === 1 ? "" : "s"}` : "No active streak",
      description:
        currentStreak > 0
          ? "Days in a row with at least one logged workout."
          : "Log a workout today to start a new streak.",
    },
    {
      title: "Strongest Recorded Lift",
      value: strongestWeight > 0 ? `${strongestExercise} - ${strongestWeight} kg` : "No weighted sets yet",
      description:
        strongestWeight > 0
          ? "Your highest recorded loaded set so far."
          : "Weighted exercises will appear here once logged.",
    },
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.15),_transparent_25%),linear-gradient(135deg,_#020617_0%,_#0f172a_45%,_#020617_100%)] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="overflow-hidden rounded-[28px] border border-white/10 bg-white/5"
        >
          <div className="grid gap-8 px-6 py-8 lg:grid-cols-[1.2fr_0.8fr] lg:px-8">
            <div className="space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
                Progress Dashboard
              </p>
              <div className="space-y-3">
                <h1 className="text-3xl font-semibold leading-tight text-white sm:text-4xl">
                  Understand your training progress at a glance
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                  This page focuses on the numbers that matter most: how often
                  you train, how much work you are doing, what is improving, and
                  which muscle groups are getting the most attention.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-5">
                <p className="text-sm text-cyan-200">Latest focus</p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {recentWorkouts[0]?.summary || "No workouts logged yet"}
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5">
                <p className="text-sm text-slate-400">Recent session</p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {recentWorkouts[0]?.date || "No data yet"}
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  {recentWorkouts[0]
                    ? `${recentWorkouts[0].totalSets} sets across ${recentWorkouts[0].exerciseCount} exercises`
                    : "Log your first workout to start seeing progress"}
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {progressCards.map((card, index) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: index * 0.06 }}
              className="rounded-[24px] border border-white/10 bg-white/5 p-5 shadow-[0_18px_60px_rgba(2,6,23,0.35)]"
            >
              <p className="text-sm text-slate-400">{card.label}</p>
              <p className="mt-3 text-3xl font-semibold text-white">
                {card.value}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                {card.hint}
              </p>
            </motion.div>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          {insightCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.08 + index * 0.06 }}
              className="rounded-[24px] border border-cyan-400/15 bg-slate-950/70 p-5"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
                {card.title}
              </p>
              <p className="mt-3 text-2xl font-semibold text-white">
                {card.value}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                {card.description}
              </p>
            </motion.div>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="rounded-[28px] border border-white/10 bg-white/5 p-6"
          >
            <div className="mb-6 flex flex-col gap-2">
              <h2 className="text-2xl font-semibold text-white">
                Daily strength volume
              </h2>
              <p className="text-sm leading-6 text-slate-400">
                This chart answers one simple question: on which days did you
                push the hardest? Bigger peaks usually mean heavier or longer
                lifting sessions.
              </p>
            </div>

            {dailyVolume.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={dailyVolume}>
                  <defs>
                    <linearGradient id="volumeFill" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor="#22d3ee"
                        stopOpacity={0.55}
                      />
                      <stop
                        offset="100%"
                        stopColor="#22d3ee"
                        stopOpacity={0.04}
                      />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    stroke="#94a3b8"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#020617",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "16px",
                      color: "#fff",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="volume"
                    stroke="#22d3ee"
                    strokeWidth={3}
                    fill="url(#volumeFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="rounded-3xl border border-dashed border-white/10 bg-slate-950/60 p-8 text-sm text-slate-400">
                No workout data yet. As soon as you log sessions, your progress
                trend will appear here.
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.42, delay: 0.05 }}
            className="rounded-[28px] border border-white/10 bg-white/5 p-6"
          >
            <div className="mb-5">
              <h2 className="text-2xl font-semibold text-white">
                Recent workouts
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Your latest sessions in plain language, so you can quickly see
                what you trained most recently without opening every workout.
              </p>
            </div>

            <div className="space-y-3">
              {recentWorkouts.length > 0 ? (
                recentWorkouts.map((workout) => (
                  <div
                    key={workout.id}
                    className="rounded-3xl border border-white/10 bg-slate-950/70 p-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-semibold text-white">
                        {workout.date}
                      </p>
                      <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300">
                        {workout.totalSets} sets
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-300">
                      {workout.exerciseCount} exercises
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      {workout.summary}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-white/10 bg-slate-950/60 p-6 text-sm text-slate-400">
                  No recent workouts found.
                </div>
              )}
            </div>
          </motion.div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="rounded-[28px] border border-white/10 bg-white/5 p-6"
          >
            <div className="mb-5 space-y-2">
              <h2 className="text-2xl font-semibold text-white">
                Exercise progress
              </h2>
              <p className="text-sm leading-6 text-slate-400">
                Pick an exercise and track its best result over time. This makes
                it easier to tell whether you are getting stronger, moving
                longer, or adding more weight.
              </p>
            </div>

            <select
              value={selectedExercise}
              onChange={(event) => setSelectedExercise(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
            >
              <option value="">Choose an exercise</option>
              {exerciseOptions.map((exercise) => (
                <option key={exercise.name} value={exercise.name}>
                  {exercise.name}
                </option>
              ))}
            </select>

            {selectedExerciseOption ? (
              <div className="mt-5 space-y-4">
                <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-4">
                  <p className="text-sm text-slate-400">
                    {getExerciseMetricLabel(selectedExerciseOption.type)}
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-white">
                    {bestExerciseValue > 0
                      ? `${bestExerciseValue} ${getExerciseMetricUnit(
                          selectedExerciseOption.type
                        )}`.trim()
                      : "No data"}
                  </p>
                  <p className="mt-2 text-sm text-slate-400">
                    {exerciseProgress.length > 0
                      ? `Based on ${exerciseProgress.length} logged workout day(s), this is your best recorded value so far.`
                      : "Start logging this exercise to see its trend."}
                  </p>
                </div>

                {exerciseProgress.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={exerciseProgress}>
                      <defs>
                        <linearGradient
                          id="exerciseFill"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#34d399"
                            stopOpacity={0.5}
                          />
                          <stop
                            offset="100%"
                            stopColor="#34d399"
                            stopOpacity={0.05}
                          />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="date"
                        stroke="#94a3b8"
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#94a3b8"
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#020617",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "16px",
                          color: "#fff",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#34d399"
                        strokeWidth={3}
                        fill="url(#exerciseFill)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="rounded-3xl border border-dashed border-white/10 bg-slate-950/60 p-6 text-sm text-slate-400">
                    No progress points available for this exercise yet.
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-5 rounded-3xl border border-dashed border-white/10 bg-slate-950/60 p-6 text-sm text-slate-400">
                Select an exercise to see a simple progress story instead of
                trying to decode raw workout logs.
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.05 }}
            className="rounded-[28px] border border-white/10 bg-white/5 p-6"
          >
            <div className="mb-5 space-y-2">
              <h2 className="text-2xl font-semibold text-white">
                Most trained muscle groups
              </h2>
              <p className="text-sm leading-6 text-slate-400">
                This section shows where most of your training effort is going,
                so you can quickly spot your strongest focus areas.
              </p>
            </div>

            <div className="space-y-3">
              {muscleSummaries.length > 0 ? (
                muscleSummaries.map((item) => (
                  <div
                    key={item.muscle}
                    className="rounded-3xl border border-white/10 bg-slate-950/70 p-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="text-lg font-semibold text-white">
                        {item.muscle}
                      </h3>
                      <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs text-cyan-200">
                        {item.sessions} sessions
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-slate-300">
                      Top exercise: {item.topExercise}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      Strength volume: {item.totalVolume} kg
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-white/10 bg-slate-950/60 p-6 text-sm text-slate-400">
                  Muscle group insights will appear after you log workouts.
                </div>
              )}
            </div>
          </motion.div>
        </section>

        {loading && (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-slate-400">
            Loading dashboard...
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
