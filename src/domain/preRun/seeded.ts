/** Reproducible gameplay variation, not a cryptographic random source. */
export function seedValue(seed: string): number {
  let value = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    value = Math.imul(value ^ seed.charCodeAt(index), 16777619) >>> 0;
  }
  return value || 1;
}

export function nextRandom(state: number): { state: number; value: number } {
  let value = state || 1;
  value ^= value << 13;
  value ^= value >>> 17;
  value ^= value << 5;
  value >>>= 0;
  return { state: value, value: value / 4294967296 };
}

export function shuffled<T>(items: readonly T[], seed: string): T[] {
  const result = [...items];
  let state = seedValue(seed);
  for (let index = result.length - 1; index > 0; index -= 1) {
    const sample = nextRandom(state);
    state = sample.state;
    const other = Math.floor(sample.value * (index + 1));
    [result[index], result[other]] = [result[other]!, result[index]!];
  }
  return result;
}
