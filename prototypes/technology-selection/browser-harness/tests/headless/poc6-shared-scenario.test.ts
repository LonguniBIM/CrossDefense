import { describe, expect, test } from 'vitest';
import {
  runSharedDurabilityScenario,
  type ScenarioDriver,
  type ScenarioSnapshot,
} from '../../src/poc6/shared-scenario';

class MemoryScenarioDriver implements ScenarioDriver {
  private snapshotState: ScenarioSnapshot = {
    blueprintCount: 0,
    blueprintQuotaRemaining: 3,
    operationCount: 0,
  };

  private readonly operations = new Set<string>();

  async reset(): Promise<void> {
    this.snapshotState = {
      blueprintCount: 0,
      blueprintQuotaRemaining: 3,
      operationCount: 0,
    };
    this.operations.clear();
  }

  async collectBlueprint(request: {
    operationId: string;
    payloadId: string;
  }): Promise<{ applied: boolean }> {
    void request.payloadId;

    if (this.operations.has(request.operationId)) {
      return { applied: false };
    }

    this.operations.add(request.operationId);
    this.snapshotState = {
      blueprintCount: this.snapshotState.blueprintCount + 1,
      blueprintQuotaRemaining:
        this.snapshotState.blueprintQuotaRemaining - 1,
      operationCount: this.operations.size,
    };

    return { applied: true };
  }

  async snapshot(): Promise<ScenarioSnapshot> {
    return { ...this.snapshotState };
  }
}

describe('PoC-6 shared scenario', () => {
  test('runs headlessly through the shared public scenario contract', async () => {
    const diagnostic = await runSharedDurabilityScenario(
      new MemoryScenarioDriver(),
    );

    expect(diagnostic).toEqual({
      scenarioId: 'poc6-shared-durability-scenario-v1',
      submittedOperations: [
        'poc6-op-blueprint-1',
        'poc6-op-blueprint-1',
      ],
      firstApplied: true,
      retryApplied: false,
      terminal: {
        blueprintCount: 1,
        blueprintQuotaRemaining: 2,
        operationCount: 1,
      },
      digest: 'fce0ddb6',
    });
  });
});
