import type { RetainedCargo } from './cargo';
import type { AttemptEnvelope } from '../attempt/attempt';
import type { StarterTile } from '../preRun/salvage';
import type { ShipBuildState } from '../build/shipBuild';
import type { StarterObjective } from '../content/contentPack';
import type { SalvageState } from '../preRun/salvage';

export interface RunQuota {
  total: number;
  remaining: number;
}

export interface ActiveRun {
  runId: string;
  pilotId: string;
  phase: 'pre-run-salvage' | 'build' | 'attempt';
  /** Latest diagnostic Attempt; frozen startup inputs are never live Build state. */
  attempt?: AttemptEnvelope | undefined;
  /** Collected post-Attempt items awaiting explicit staged Keep/Discard. */
  salvageBuffer?: StarterTile[] | undefined;
  /** Explicit mutable retained ownership; original Pre-Run history remains immutable. */
  cargo?: RetainedCargo | undefined;
  /** Settlement boundaries invalidate layout history without changing positions. */
  economyRevision?: number | undefined;
  clearedMapIds?: string[] | undefined;
  rulesetVersion: string;
  contentVersion: string;
  quota: RunQuota;
  starterObjective: StarterObjective;
  startedAt: string;
  /** Absent only for a Run created before its first Pre-Run entry. */
  salvage?: SalvageState | undefined;
  /** Canonical tile positions only; words and Power are derived from pinned definitions. */
  shipBuild?: ShipBuildState | undefined;
}
