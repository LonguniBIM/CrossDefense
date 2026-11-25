import type { ActiveRun } from '../../domain/run/run';
import type { CombatOutcome } from '../../domain/combat/collection';
import type { PilotEconomy, OutcomeSettlement, SettleOutcomeCommand } from '../../domain/results/settlement';
import type { CargoResolutionCommand } from '../../domain/results/salvageResolution';
import type { BuildContent } from '../../domain/content/contentPack';

export interface ResultsState {
  run: ActiveRun; economy: PilotEconomy;
  outcomes: Array<{ outcome: CombatOutcome; settlement: OutcomeSettlement | null }>;
}
/** One transaction publishes balances, entitlement, Run completion and receipts together. */
export interface ResultsRepository {
  getResults(pilotId: string): Promise<ResultsState>;
  getActiveRun(pilotId: string): Promise<ActiveRun | undefined>;
  settleOutcome(command: SettleOutcomeCommand): Promise<ResultsState>;
  resolveCargo(command: CargoResolutionCommand, content: BuildContent): Promise<ActiveRun>;
}
