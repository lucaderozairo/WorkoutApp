import { describe, expect, it } from 'vitest';
import { routeToSvgPoints } from './preview';

describe('route preview domain', () => {
  it('projects a route into bounded SVG points', () => {
    const points = routeToSvgPoints([[51.5, -0.1], [51.51, -0.12]], {
      width: 100,
      height: 50,
      padding: 5,
    });
    expect(points.split(' ')).toHaveLength(2);
    for (const pair of points.split(' ')) {
      const [x, y] = pair.split(',').map(Number);
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(100);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(50);
    }
  });
});
