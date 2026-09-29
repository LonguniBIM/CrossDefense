/**
 * CrossDefense Technology Selection PoC-6.
 *
 * Question: Can one shared scenario definition run through both a fast headless
 * adapter and a real-browser persistence adapter while producing the same
 * deterministic evidence and a reproducible diagnostic bundle?
 *
 * This is throwaway prototype code. It is not production implementation.
 */

export interface ScenarioSnapshot {
  blueprintCount: number;
  blueprintQuotaRemaining: number;
  operationCount: number;
}

export interface ScenarioDriver {
  reset(): Promise<void>;
  collectBlueprint(request: {
    operationId: string;
    payloadId: string;
  }): Promise<{ applied: boolean }>;
  snapshot(): Promise<ScenarioSnapshot>;
}

export interface ScenarioDiagnostic {
  scenarioId: 'poc6-shared-durability-scenario-v1';
  submittedOperations: string[];
  firstApplied: boolean;
  retryApplied: boolean;
  terminal: ScenarioSnapshot;
  digest: string;
}

function fnv1a(text: string): string {
  let hash = 0x811c9dc5;

  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }

  return hash.toString(16).padStart(8, '0');
}

export async function runSharedDurabilityScenario(
  driver: ScenarioDriver,
): Promise<ScenarioDiagnostic> {
  await driver.reset();

  const operationId = 'poc6-op-blueprint-1';
  const payloadId = 'poc6-payload-1';

  const first = await driver.collectBlueprint({
    operationId,
    payloadId,
  });

  const retry = await driver.collectBlueprint({
    operationId,
    payloadId,
  });

  const terminal = await driver.snapshot();

  const digestInput = {
    firstApplied: first.applied,
    retryApplied: retry.applied,
    terminal,
  };

  return {
    scenarioId: 'poc6-shared-durability-scenario-v1',
    submittedOperations: [operationId, operationId],
    firstApplied: first.applied,
    retryApplied: retry.applied,
    terminal,
    digest: fnv1a(JSON.stringify(digestInput)),
  };
}
