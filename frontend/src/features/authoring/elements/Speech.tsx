import {
  addScalar,
  clamp,
  constructPartialPath,
  divide,
  expandBoxVerts,
  filterComponent,
  getBoxCenter,
  multiply,
  mutate,
  rotateMany,
  scale,
  subtract,
} from "../util";
import type { Component, SpeechComponent, Vec2 } from "../types";

interface Segment {
  grid: Vec2;
  sector: number;
}

const gridSize = 5;

function Speech(component: SpeechComponent) {
  const { bounds } = component;

  const center = getBoxCenter(bounds.verts);

  function getSegment() {
    const dims = mutate(subtract(bounds.verts[1], bounds.verts[0]), Math.abs);
    const dir = divide(subtract(bounds.verts[1], bounds.verts[0]), dims);
    const relative = multiply(
      subtract(bounds.verts[2], getBoxCenter(bounds.verts)),
      dir,
    );
    const grid = clamp(
      mutate(
        addScalar(scale(divide(relative, dims), gridSize), gridSize / 2),
        Math.floor,
      ),
      0,
      4,
    );
    const gradient = dims.y / dims.x;

    let sector;
    if (relative.y < -gradient * Math.abs(relative.x)) sector = 0;
    else if (relative.y > gradient * Math.abs(relative.x)) sector = 2;
    else sector = relative.x < 0 ? 3 : 1;

    return { grid, sector };
  }

  function constructPath() {
    const expanded = rotateMany(
      expandBoxVerts(bounds.verts),
      center,
      bounds.rotation,
    );
    const segment = getSegment();
    const tail = constructTail(segment);

    return (
      "M" +
      constructPartialPath(expanded.slice(0, segment.sector + 1)).slice(1) +
      tail +
      constructPartialPath(expanded.slice(segment.sector + 1)) +
      " Z"
    );
  }

  function constructTail(seg: Segment) {
    const segSize = scale(
      subtract(bounds.verts[1], bounds.verts[0]),
      1 / gridSize,
    );
    const offset = bounds.verts[0];
    const { sector, grid } = seg;
    const corners = [
      [
        { dx: 0, dy: 0 },
        { dx: 1, dy: 0 },
      ],
      [
        { dx: 1, dy: 0 },
        { dx: 1, dy: 1 },
      ],
      [
        { dx: 1, dy: 1 },
        { dx: 0, dy: 1 },
      ],
      [
        { dx: 0, dy: 1 },
        { dx: 0, dy: 0 },
      ],
    ];

    const tailPoints = [
      {
        x: (grid.x + corners[sector][0].dx) * segSize.x + offset.x,
        y: (grid.y + corners[sector][0].dy) * segSize.y + offset.y,
      },
      {
        x: (grid.x + corners[sector][1].dx) * segSize.x + offset.x,
        y: (grid.y + corners[sector][1].dy) * segSize.y + offset.y,
      },
    ];

    const verts = rotateMany(
      [tailPoints[0], bounds.verts[2], tailPoints[1]],
      center,
      bounds.rotation,
    );
    return constructPartialPath(verts);
  }

  return (
    <g>
      <path d={constructPath()} {...filterComponent(component)} />
    </g>
  );
}


export default Speech;
