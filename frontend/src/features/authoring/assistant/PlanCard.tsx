import { TriangleAlertIcon } from "lucide-react";
import { applyTicked, discardPlan, setStepTicked } from "./controller";
import { describeStep } from "./plan";
import useAssistant from "./store";

/** The changes Plan mode proposes, to tick and apply. */
export function PlanCard() {
  const plan = useAssistant((state) => state.plan);
  const running = useAssistant((state) => state.running);
  if (!plan) return null;

  const chosen = new Set(plan.selected);

  return (
    <section
      aria-label="Proposed changes"
      className="rounded-sm border border-base-content/15 bg-base-100 p-3"
    >
      <h3 className="mb-2 text-sm font-semibold">
        Proposed changes
        <span className="ml-2 font-normal text-base-content/60">
          {plan.steps.length}
        </span>
      </h3>

      <ul className="mb-3 flex max-h-56 flex-col gap-1.5 overflow-y-auto">
        {plan.steps.map((step) => (
          <li key={step.id}>
            <label className="flex cursor-pointer items-start gap-2 text-xs">
              <input
                type="checkbox"
                className="checkbox checkbox-xs mt-0.5"
                checked={chosen.has(step.id)}
                disabled={running}
                onChange={(event) =>
                  setStepTicked(step.id, event.target.checked)
                }
              />
              <span className="min-w-0 flex-1 break-words">
                {describeStep(step)}
                {step.kind === "destructive" && (
                  <span className="badge badge-error badge-soft badge-xs ml-2">
                    Deletes
                  </span>
                )}
                {step.warnings?.map((warning, i) => (
                  <span key={i} className="mt-0.5 flex gap-1 text-warning">
                    <TriangleAlertIcon size={11} className="mt-0.5 flex-none" />
                    {warning}
                  </span>
                ))}
              </span>
            </label>
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="btn btn-primary btn-sm"
          disabled={running || chosen.size === 0}
          onClick={() => void applyTicked()}
        >
          Apply {chosen.size} {chosen.size === 1 ? "change" : "changes"}
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          disabled={running}
          onClick={discardPlan}
        >
          Discard
        </button>
      </div>
      <p className="mt-2 text-xs text-base-content/60">
        Applied together, so one undo takes them all back.
      </p>
    </section>
  );
}

/** The question the assistant asks before it deletes something. */
export function ConfirmCard() {
  const confirm = useAssistant((state) => state.confirm);
  if (!confirm) return null;

  return (
    <div
      role="alertdialog"
      aria-label="Confirm deleting"
      className="alert alert-warning alert-soft flex-col items-stretch gap-2 text-sm text-base-content"
    >
      <span className="break-words">{confirm.description}</span>
      <div className="flex gap-2">
        <button
          type="button"
          className="btn btn-error btn-sm"
          onClick={() => confirm.resolve(true)}
        >
          Delete
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => confirm.resolve(false)}
        >
          Skip
        </button>
      </div>
    </div>
  );
}
