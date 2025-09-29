// components/SSRSeeds.tsx
// Server Component that generates per-request "seeds" and passes them
// to children via a render prop. No hydration mismatch—first paint matches SSR.
// Usage: see examples below.

import { ReactNode } from 'react';

/** Seed specification primitives */
export type SeedSpec =
  | 'u32'
  | 'bool'
  | { int: { min: number; max: number } }              // inclusive min/max
  | { float: { min: number; max: number } }            // [min, max)
  | { pick: readonly unknown[] };                       // pick one element

/** Maps a SeedSpec to its output value type */
export type SeedValue<S extends SeedSpec> =
  S extends 'u32' ? number :
  S extends 'bool' ? boolean :
  S extends { int: { min: number; max: number } } ? number :
  S extends { float: { min: number; max: number } } ? number :
  S extends { pick: readonly (infer T)[] } ? T :
  never;

/** Schema is a dict of named SeedSpecs */
export type SeedsSchema = Record<string, SeedSpec>;

/** Given a schema, compute the resulting seeds object type */
export type SeedsFromSchema<T extends SeedsSchema> = {
  [K in keyof T]: SeedValue<T[K]>;
};

type Props<T extends SeedsSchema | undefined = undefined> = {
  /**
   * Render prop that receives the generated seeds object.
   * - If `schema` is provided, the type is derived from it.
   * - If `schema` is omitted, you get a default object like { seed0, seed1, ... } of u32s.
   */
  children: (seeds: T extends SeedsSchema ? SeedsFromSchema<T> : Record<string, number>) => ReactNode;

  /**
   * Optional schema describing exactly what seeds to generate.
   * If omitted, `count` u32 seeds are created with the given `prefix`.
   */
  schema?: T;

  /** Number of default seeds to generate when no schema is provided. Default: 2 */
  count?: number;

  /** Prefix for default seeds when no schema is provided. Default: 'seed' => seed0, seed1, ... */
  prefix?: string;

  /**
   * Optional fixed seeds to override randomness (e.g., for screenshots).
   * Must match the shape you’d otherwise receive.
   */
  fixed?: T extends SeedsSchema ? SeedsFromSchema<T> : Record<string, number>;
};

/* ---------------- RNG helpers (server-safe) ---------------- */

function randU32(): number {
  // Prefer Web Crypto (Edge runtime). Fallback to Node crypto.
  if (typeof globalThis.crypto !== 'undefined' && 'getRandomValues' in globalThis.crypto) {
    const buf = new Uint32Array(1);
    globalThis.crypto.getRandomValues(buf);
    return buf[0] >>> 0;
  }
  // Node.js fallback
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { randomBytes } = require('node:crypto');
  return randomBytes(4).readUInt32BE(0) >>> 0;
}

function randFloat01(): number {
  // Map u32 to [0,1)
  return randU32() / 2 ** 32;
}

function randBool(): boolean {
  return (randU32() & 1) === 0;
}

function randIntInclusive(min: number, max: number): number {
  if (!Number.isFinite(min) || !Number.isFinite(max) || Math.floor(min) !== min || Math.floor(max) !== max || max < min) {
    throw new Error(`Invalid int range: [${min}, ${max}]`);
  }
  const span = max - min + 1;
  // This modulus is fine for seeds and visual randomness.
  return min + (randU32() % span);
}

function randFloat(min: number, max: number): number {
  if (!Number.isFinite(min) || !Number.isFinite(max) || max < min) {
    throw new Error(`Invalid float range: [${min}, ${max}]`);
  }
  return min + randFloat01() * (max - min);
}

function pickOne<T>(arr: readonly T[]): T {
  if (!Array.isArray(arr) || arr.length === 0) throw new Error('pickOne() requires a non-empty array');
  const idx = randIntInclusive(0, arr.length - 1);
  return arr[idx]!;
}

/* ---------------- generation ---------------- */

function generateFromSchema<T extends SeedsSchema>(schema: T): SeedsFromSchema<T> {
  const out: Record<string, unknown> = {};
  for (const [key, spec] of Object.entries(schema)) {
    if (spec === 'u32') out[key] = randU32();
    else if (spec === 'bool') out[key] = randBool();
    else if ('int' in spec) out[key] = randIntInclusive(spec.int.min, spec.int.max);
    else if ('float' in spec) out[key] = randFloat(spec.float.min, spec.float.max);
    else if ('pick' in spec) out[key] = pickOne(spec.pick);
    else throw new Error(`Unknown SeedSpec for key "${key}"`);
  }
  return out as SeedsFromSchema<T>;
}

function generateDefault(count = 2, prefix = 'seed'): Record<string, number> {
  const out: Record<string, number> = {};
  for (let i = 0; i < count; i++) out[`${prefix}${i}`] = randU32();
  return out;
}

/* ---------------- Server Component ---------------- */

export default function SSRSeeds<T extends SeedsSchema | undefined = undefined>({
  children,
  schema,
  count = 2,
  prefix = 'seed',
  fixed,
}: Props<T>) {
  // If fixed provided, trust it; otherwise generate per request.
  const seeds = (fixed as any) ?? (schema ? generateFromSchema(schema as SeedsSchema) : generateDefault(count, prefix));
  return <>{children(seeds)}</>;
}

/* ---------------- Optional: utility for non-component use ---------------- */

export function makeSeeds<T extends SeedsSchema>(schema: T): SeedsFromSchema<T> {
  return generateFromSchema(schema);
}
