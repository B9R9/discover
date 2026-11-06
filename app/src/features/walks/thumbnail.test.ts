import { thumbnailDots } from './thumbnail';

test('fits the walk in the square, north at the top', () => {
  const dots = thumbnailDots(
    [
      [0, 0],
      [0, 1],
    ],
    100,
    22,
    10,
  );
  expect(dots).toHaveLength(2);
  expect(dots[0]!.y).toBeCloseTo(90);
  expect(dots[1]!.y).toBeCloseTo(10);
  for (const dot of dots) {
    expect(dot.x).toBeGreaterThanOrEqual(0);
    expect(dot.x).toBeLessThanOrEqual(100);
  }
});

test('keeps at most `count` points and handles an empty walk', () => {
  const long = Array.from({ length: 500 }, (_, i): [number, number] => [i / 100, 44 + i / 200]);
  expect(thumbnailDots(long, 72, 22)).toHaveLength(22);
  expect(thumbnailDots([], 72)).toEqual([]);
});
