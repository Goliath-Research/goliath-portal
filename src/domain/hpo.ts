/** Highest feasible objective, matching HyperparamMonitorFrame.UpdateBestLabel. */
export function bestTrialCaption(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "Best trial: (no trials)";
  let best: { index: number; objective: number } | null = null;
  for (const row of rows) {
    if (row.objective == null || row.objective === "") continue;
    const objective = Number(row.objective);
    if (!Number.isFinite(objective)) continue;
    if (!isFeasible(row.feasible)) continue;
    const index = Number(row.trial_index);
    if (!best || objective > best.objective) best = { index: Number.isFinite(index) ? index : 0, objective };
  }
  if (!best) return "Best trial: (none scored/feasible yet)";
  return `Best trial: #${best.index}  objective=${Number(best.objective.toPrecision(6))} (feasible)`;
}

function isFeasible(value: unknown): boolean {
  if (value === true || value === 1) return true;
  const text = String(value ?? "").toLowerCase();
  return text === "true" || text === "t" || text === "1";
}
