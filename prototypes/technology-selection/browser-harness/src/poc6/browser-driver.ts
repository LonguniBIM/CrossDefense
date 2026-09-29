import {
  createPoc3BrowserApi,
  type Poc3BrowserApi,
} from '../poc3/durability';
import type {
  ScenarioDriver,
  ScenarioSnapshot,
} from './shared-scenario';

export function createBrowserScenarioDriver(
  api: Poc3BrowserApi = createPoc3BrowserApi(),
): ScenarioDriver {
  return {
    async reset() {
      await api.reset();
    },

    async collectBlueprint(request) {
      const result = await api.collectBlueprint(request);
      return {
        applied: result.applied,
      };
    },

    async snapshot(): Promise<ScenarioSnapshot> {
      const snapshot = await api.snapshot();

      return {
        blueprintCount: snapshot.workspace.blueprintCount,
        blueprintQuotaRemaining: snapshot.workspace.blueprintQuotaRemaining,
        operationCount: snapshot.operations.length,
      };
    },
  };
}
