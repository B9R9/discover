import { routeDots } from './routeDots';

describe('routeDots', () => {
  it('starts and ends on the route ends', () => {
    const dots = routeDots(30);
    expect(dots).toHaveLength(30);
    expect(dots[0]).toEqual({ x: 30, y: 790 });
    const end = dots[29];
    expect(end?.x).toBeCloseTo(326);
    expect(end?.y).toBeCloseTo(392);
  });
});
