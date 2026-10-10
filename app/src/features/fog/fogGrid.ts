import { difference, union, type MultiPolygon } from 'polygon-clipping';

import { clipLine, type Box } from './clipLine';
import type { Position, Ring } from './shapes';

// About 550 m x 400 m at our latitude: each union stays small, and a new point only recomputes the tiles it touches.
const TILE_DEGREES = 0.005;

// Web Mercator stops at ±85.05°: this box covers the whole visible map.
const WORLD: Ring = [
  [-180, -86],
  [180, -86],
  [180, 86],
  [-180, 86],
  [-180, -86],
];

interface Tile {
  shapes: Ring[];
  fog: MultiPolygon;
  edges: Position[][];
}

function tileBox(key: string): Box {
  const [x = 0, y = 0] = key.split(':').map(Number);
  return {
    west: x * TILE_DEGREES,
    south: y * TILE_DEGREES,
    east: (x + 1) * TILE_DEGREES,
    north: (y + 1) * TILE_DEGREES,
  };
}

function boxRing({ west, south, east, north }: Box): Ring {
  return [
    [west, south],
    [east, south],
    [east, north],
    [west, north],
    [west, south],
  ];
}

function keysTouching(shape: Ring): string[] {
  const lons = shape.map(([lon]) => lon);
  const lats = shape.map(([, lat]) => lat);
  const west = Math.min(...lons) / TILE_DEGREES;
  const east = Math.max(...lons) / TILE_DEGREES;
  const south = Math.min(...lats) / TILE_DEGREES;
  const north = Math.max(...lats) / TILE_DEGREES;
  const keys: string[] = [];
  for (let x = Math.floor(west); x < east; x++) {
    for (let y = Math.floor(south); y < north; y++) keys.push(`${x}:${y}`);
  }
  return keys;
}

// Inside a tile, the global revealed area equals the union of the shapes touching that tile, clipped to it.
// Fog and soft edges are therefore computed per tile, and tiles never touched are covered by `outside`.
export class FogGrid {
  private tiles = new Map<string, Tile>();
  private outside: MultiPolygon = [[WORLD]];

  add(shapes: readonly Ring[]): void {
    const dirty = new Set<string>();
    const tileCount = this.tiles.size;
    for (const shape of shapes) {
      for (const key of keysTouching(shape)) {
        const tile = this.tiles.get(key) ?? { shapes: [], fog: [], edges: [] };
        tile.shapes.push(shape);
        this.tiles.set(key, tile);
        dirty.add(key);
      }
    }
    for (const key of dirty) this.computeTile(key);
    if (this.tiles.size !== tileCount) {
      const boxes = [...this.tiles.keys()].map((key) => [boxRing(tileBox(key))]);
      this.outside = difference([WORLD], ...boxes);
    }
  }

  fog(): GeoJSON.MultiPolygon {
    const coordinates = [...this.outside];
    for (const tile of this.tiles.values()) coordinates.push(...tile.fog);
    return { type: 'MultiPolygon', coordinates };
  }

  edges(): GeoJSON.MultiLineString {
    const coordinates: Position[][] = [];
    for (const tile of this.tiles.values()) coordinates.push(...tile.edges);
    return { type: 'MultiLineString', coordinates };
  }

  private computeTile(key: string): void {
    const tile = this.tiles.get(key);
    const [first, ...rest] = tile?.shapes.map((ring) => [ring]) ?? [];
    if (!tile || !first) return;
    const box = tileBox(key);
    const revealed = union(first, ...rest);
    tile.fog = difference([boxRing(box)], revealed);
    tile.edges = revealed.flat().flatMap((ring) => clipLine(ring, box));
  }
}
