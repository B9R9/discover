import type { Position } from './shapes';

export interface Box {
  west: number;
  south: number;
  east: number;
  north: number;
}

// Liang-Barsky: the part of segment [a, b] inside the box, or null.
function clipSegment(a: Position, b: Position, box: Box): [Position, Position] | null {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  let enter = 0;
  let exit = 1;
  const edges: [number, number][] = [
    [-dx, a[0] - box.west],
    [dx, box.east - a[0]],
    [-dy, a[1] - box.south],
    [dy, box.north - a[1]],
  ];
  for (const [p, q] of edges) {
    if (p === 0) {
      if (q < 0) return null;
      continue;
    }
    const r = q / p;
    if (p < 0) enter = Math.max(enter, r);
    else exit = Math.min(exit, r);
    if (enter > exit) return null;
  }
  return [
    [a[0] + enter * dx, a[1] + enter * dy],
    [a[0] + exit * dx, a[1] + exit * dy],
  ];
}

export function clipLine(line: readonly Position[], box: Box): Position[][] {
  const pieces: Position[][] = [];
  let current: Position[] = [];
  for (let i = 1; i < line.length; i++) {
    const [a, b] = [line[i - 1], line[i]];
    if (!a || !b) continue;
    const clipped = clipSegment(a, b, box);
    const last = current[current.length - 1];
    if (clipped && last && last[0] === clipped[0][0] && last[1] === clipped[0][1]) {
      current.push(clipped[1]);
      continue;
    }
    if (current.length > 1) pieces.push(current);
    current = clipped ? [...clipped] : [];
  }
  if (current.length > 1) pieces.push(current);
  return pieces;
}
