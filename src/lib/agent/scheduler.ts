import { getRoutine, markRoutineRan, dueRoutines } from "../store";
import { enqueue } from "./loop";

/**
 * Routine runner adapted from grokbot-clone server/src/routines.ts (MIT).
 * grokbot uses croner. CNSTRCT stores a plain interval and a next_run_at
 * so the demo does not need a cron dependency. The label still reads like
 * a schedule ("Weekdays at 8:00"). Run now fires the same path.
 */

export async function runRoutine(id: string) {
  const routine = getRoutine(id);
  if (!routine || !routine.enabled) return;
  markRoutineRan(id, Date.now() + routine.intervalMs);
  return enqueue(routine.agentId, {
    type: "routine",
    routineId: routine.id,
    name: routine.name,
    prompt: routine.prompt,
  });
}

export function startScheduler() {
  const scope = globalThis as typeof globalThis & { __cnstrctScheduler?: ReturnType<typeof setInterval> };
  if (scope.__cnstrctScheduler) return;
  const timer = setInterval(() => {
    for (const routine of dueRoutines()) void runRoutine(routine.id);
  }, 30_000);
  timer.unref?.();
  scope.__cnstrctScheduler = timer;
}
