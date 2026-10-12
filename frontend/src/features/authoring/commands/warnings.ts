import type { Scene } from "../types";
import {
  contains,
  framedComponents,
  getVisualFrame,
  intersectionArea,
  round,
} from "./geometry";
import { describeComponent } from "./resolve";
import { textFit } from "./text";

// Layout mistakes a model can't see but a person would at a glance. They come
// back with every write, so it can correct itself.

// two shapes overlapping a little is a mistake; a label sitting on its button
// (one inside the other) is the whole idea
const OVERLAP_THRESHOLD = 0.15;
// text only gets flagged when it clearly won't fit, since this is an estimate
const OVERFLOW_TOLERANCE = 1.15;

/**
 * Problems in a scene: components sticking out of the canvas, partly covering
 * each other, or holding more text than they have room for.
 *
 * @param focus - only report problems involving these components
 */
export function spatialIssues(
  scene: Scene,
  canvas: { width: number; height: number },
  focus?: string[]
) {
  const issues: string[] = [];
  const components = framedComponents(scene);
  const wanted = (id: string) => !focus || focus.includes(id);

  for (const component of components) {
    if (!wanted(component.id)) continue;

    const frame = getVisualFrame(component);
    const past: string[] = [];
    if (frame.x < 0) past.push(`${round(-frame.x)}px past the left edge`);
    if (frame.y < 0) past.push(`${round(-frame.y)}px past the top edge`);
    if (frame.x + frame.width > canvas.width)
      past.push(
        `${round(frame.x + frame.width - canvas.width)}px past the right edge`
      );
    if (frame.y + frame.height > canvas.height)
      past.push(
        `${round(frame.y + frame.height - canvas.height)}px past the bottom edge`
      );
    if (past.length)
      issues.push(`${describeComponent(component)} is ${past.join(" and ")}`);

    const fit = textFit(component);
    if (fit && fit.needed > fit.available * OVERFLOW_TOLERANCE)
      issues.push(
        `${describeComponent(component)} may not fit its text: it needs about ${fit.needed}px of height and has ${round(fit.available)}px`
      );
  }

  for (let i = 0; i < components.length; i++) {
    for (let j = i + 1; j < components.length; j++) {
      const a = components[i];
      const b = components[j];
      if (!wanted(a.id) && !wanted(b.id)) continue;

      const frameA = getVisualFrame(a);
      const frameB = getVisualFrame(b);
      if (contains(frameA, frameB) || contains(frameB, frameA)) continue;

      const overlap = intersectionArea(frameA, frameB);
      const smaller = Math.min(
        frameA.width * frameA.height,
        frameB.width * frameB.height
      );
      if (smaller > 0 && overlap / smaller > OVERLAP_THRESHOLD)
        issues.push(
          `${describeComponent(a)} and ${describeComponent(b)} overlap by ${round((overlap / smaller) * 100)}% of the smaller one`
        );
    }
  }

  return issues;
}
