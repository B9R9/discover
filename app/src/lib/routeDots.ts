export type Point = { x: number; y: number };

// The loading route, in the 390 x 844 space of the design. Each row is one cubic Bézier.
type Segment = { a: Point; b: Point; c: Point; d: Point };
const seg = (a: Point, b: Point, c: Point, d: Point): Segment => ({ a, b, c, d });

const SEGMENTS: readonly Segment[] = [
  seg({ x: 30, y: 790 }, { x: 110, y: 740 }, { x: 70, y: 660 }, { x: 150, y: 630 }),
  seg({ x: 150, y: 630 }, { x: 230, y: 600 }, { x: 290, y: 610 }, { x: 270, y: 550 }),
  seg({ x: 270, y: 550 }, { x: 250, y: 490 }, { x: 120, y: 530 }, { x: 170, y: 480 }),
  seg({ x: 170, y: 480 }, { x: 220, y: 430 }, { x: 300, y: 450 }, { x: 326, y: 392 }),
];

const FALLBACK = seg({ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 });

export const ROUTE_SPACE = { width: 390, height: 844 };

function bezier({ a, b, c, d }: Segment, t: number): Point {
  const u = 1 - t;
  const [wa, wb, wc, wd] = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
  return {
    x: wa * a.x + wb * b.x + wc * c.x + wd * d.x,
    y: wa * a.y + wb * b.y + wc * c.y + wd * d.y,
  };
}

// `count` points spread along the route, first at the start and last at the end.
export function routeDots(count: number): Point[] {
  const last = Math.max(count - 1, 1);
  return Array.from({ length: count }, (_, i) => {
    const along = (i / last) * SEGMENTS.length;
    const index = Math.min(Math.floor(along), SEGMENTS.length - 1);
    return bezier(SEGMENTS[index] ?? FALLBACK, along - index);
  });
}
