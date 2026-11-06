import { describe, expect, it } from "vitest";
import { bestTrialCaption } from "./hpo";

describe("bestTrialCaption", () => {
  it("keeps the highest feasible objective", () => {
    expect(
      bestTrialCaption([
        { trial_index: 1, objective: 0.2, feasible: true },
        { trial_index: 3, objective: 0.8, feasible: 1 },
        { trial_index: 4, objective: 0.9, feasible: false },
      ]),
    ).toBe("Best trial: #3  objective=0.8 (feasible)");
  });

  it("says when nothing is scored", () => {
    expect(bestTrialCaption([])).toBe("Best trial: (no trials)");
    expect(bestTrialCaption([{ trial_index: 1, objective: 1, feasible: false }])).toBe(
      "Best trial: (none scored/feasible yet)",
    );
  });
});
