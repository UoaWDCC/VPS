import { buildVisualScene } from "../authoring/pipeline";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "../../util/canvas";
import TextBox from "../authoring/elements/TextBox";
import Speech from "../authoring/elements/Speech";
import Ellipse from "../authoring/elements/Ellipse";
import Box from "../authoring/elements/Box";
import Image from "../authoring/elements/Image";
import Line from "../authoring/elements/Line";
import { resolveSceneBindings } from "../../components/Properties/componentBindings";
import { useMemo } from "react";
import Background from "../authoring/elements/Background";

const componentMap = {
  textbox: TextBox,
  speech: Speech,
  ellipse: Ellipse,
  box: Box,
  image: Image,
  line: Line,
};

function resolve(component) {
  const Fc = componentMap[component.type];
  if (Fc) return <Fc key={component.id} {...component} />;
  return null;
}

function injectProperties(scene, properties) {
  const props = properties ?? [];

  //legacy $$name$$ substitution resolves by name
  //chips resolve by id
  const varMap = new Map(props.map((v) => [v.name, v.value]));
  const valById = new Map(props.map((v) => [v.id, v.value]));
  const regex = /\$\$(.*?)\$\$/g;

  function resolveSpan(span) {
    if (!span.property) return span;
    const { property, ...rest } = span;
    return {
      ...rest,
      text: String(valById.get(property.id) ?? property.displayName),
    };
  }

  return {
    ...scene,
    components: Object.fromEntries(
      Object.entries(scene.components).map(([id, component]) => {
        if (component.type !== "textbox") return [id, component];

        const newBlocks = component.document.blocks.map((block) => {
          const spans = (block.spans ?? []).map(resolveSpan);
          if (spans.length === 0) return block;

          // join all span texts for full-block regex scanning
          const blockText = spans.map((s) => s.text ?? "").join("");

          // find matches across the whole block
          regex.lastIndex = 0;
          const matches = [];
          let m;
          while ((m = regex.exec(blockText)) !== null) {
            const variableName = m[1];
            const replacement = varMap.has(variableName)
              ? String(varMap.get(variableName))
              : null;
            matches.push({
              start: m.index,
              end: regex.lastIndex,
              original: m[0],
              replacement,
            });
          }

          if (matches.length === 0) return { ...block, spans };

          // map spans to absolute offsets in blockText
          const offsets = [];
          let acc = 0;
          for (const s of spans) {
            offsets.push(acc);
            acc += (s.text ?? "").length;
          }

          function findSpanIndexAt(pos) {
            for (let i = 0; i < spans.length; i++) {
              const start = offsets[i];
              const end = start + (spans[i].text ?? "").length;
              if (pos >= start && pos < end) return i;
            }
            return spans.length - 1;
          }

          const newSpans = [];

          // helper: push original range [start, end) keeping styles
          function pushOriginalRange(start, end) {
            let p = start;
            while (p < end) {
              const i = findSpanIndexAt(p);
              const spanStart = offsets[i];
              const spanEnd = spanStart + (spans[i].text ?? "").length;
              const overlapStart = Math.max(p, spanStart);
              const overlapEnd = Math.min(end, spanEnd);
              const sliceStart = overlapStart - spanStart;
              const textSlice = (spans[i].text ?? "").slice(
                sliceStart,
                sliceStart + (overlapEnd - overlapStart)
              );
              newSpans.push({ ...spans[i], text: textSlice });
              p = overlapEnd;
            }
          }

          // walk through matches and untouched ranges
          let cursor = 0;
          for (const match of matches) {
            if (match.start > cursor) {
              pushOriginalRange(cursor, match.start);
            }

            if (match.replacement !== null) {
              // replacement uses leftmost style
              const leftSpanIndex = findSpanIndexAt(match.start);
              newSpans.push({
                ...spans[leftSpanIndex],
                text: match.replacement,
              });
            } else {
              // keep original placeholder text
              pushOriginalRange(match.start, match.end);
            }

            cursor = match.end;
          }
          if (cursor < blockText.length) {
            pushOriginalRange(cursor, blockText.length);
          }

          // merge adjacent spans with identical style
          function sameStyle(a, b) {
            const aKeys = Object.keys(a)
              .filter((k) => k !== "text")
              .sort();
            const bKeys = Object.keys(b)
              .filter((k) => k !== "text")
              .sort();
            if (aKeys.length !== bKeys.length) return false;
            for (let i = 0; i < aKeys.length; i++) {
              if (aKeys[i] !== bKeys[i]) return false;
              if (JSON.stringify(a[aKeys[i]]) !== JSON.stringify(b[bKeys[i]]))
                return false;
            }
            return true;
          }

          const merged = [];
          for (const s of newSpans) {
            if (merged.length > 0 && sameStyle(merged[merged.length - 1], s)) {
              merged[merged.length - 1].text += s.text;
            } else {
              merged.push(s);
            }
          }

          return { ...block, spans: merged };
        });

        return [
          id,
          {
            ...component,
            document: { ...component.document, blocks: newBlocks },
          },
        ];
      })
    ),
  };
}

/**
 * This component displays the scene components on the screen when playing a scenario
 *
 * @component
 */

export default function PlayScenarioCanvas({
  scene,
  buttonPressed,
  properties,
}) {
  const sceneToRender = useMemo(() => {
    const boundScene = resolveSceneBindings(scene, properties);
    return injectProperties(boundScene, properties);
  }, [scene, properties]);

  const components = Object.values(buildVisualScene(sceneToRender).components)
    .sort((a, b) => a.zIndex - b.zIndex)
    .map((c) => {
      const resolved = resolve(c);
      if (c.clickable && (c.nextScene || c.stateOperations)) {
        return (
          <g
            key={c.id}
            className="cursor-pointer"
            onClick={() => buttonPressed(c)}
          >
            {resolved}
          </g>
        );
      }
      return resolved;
    });

  return (
    <div
      className="bg-canvas-surround"
      style={{ width: "100vw", height: "100vh" }}
    >
      <svg
        id="play-main"
        className="w-full h-full"
        viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
      >
        <rect
          x="0"
          y="0"
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          fill="var(--color-canvas)"
        />
        <Background background={sceneToRender.background ?? null} />
        {components}
      </svg>
    </div>
  );
}
