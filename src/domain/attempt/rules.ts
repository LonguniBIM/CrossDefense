/** Q9: launch/recovery only; no encounter or combat constants are invented. */
export const ATTEMPT_RULESET_VERSION = 'development-attempt-ruleset-v1';
export const DIFFICULTIES = ['Easy', 'Normal', 'Hard', 'Insane'] as const;
export type Difficulty = typeof DIFFICULTIES[number];
export const DEFAULT_DIFFICULTY: Difficulty = 'Normal';
export function isDifficulty(value: unknown): value is Difficulty { return typeof value === 'string' && (DIFFICULTIES as readonly string[]).includes(value); }
