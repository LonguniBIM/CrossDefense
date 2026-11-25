import { describe, expect, it } from 'vitest';
import { WorkspaceApplication } from '../../src/application/workspace/WorkspaceApplication';
import { InMemoryWorkspaceRepository } from '../../src/infrastructure/persistence/InMemoryWorkspaceRepository';

describe('Ticket 01 durable Pilot scenario', () => {
  it('creates one Pilot for a duplicated operation and can continue the same identity', async () => {
    const repository = new InMemoryWorkspaceRepository();
    const app = new WorkspaceApplication(repository, () => 'pilot-001');

    await app.bootstrap();
    const first = await app.createPilot({
      operationId: 'create-001',
      nickname: 'Nova',
      avatarId: 'pilot-blue',
    });
    const duplicate = await app.createPilot({
      operationId: 'create-001',
      nickname: 'Nova',
      avatarId: 'pilot-blue',
    });

    expect(first.pilot.pilotId).toBe('pilot-001');
    expect(duplicate.pilot.pilotId).toBe(first.pilot.pilotId);
    expect((await app.getPilotChooser()).pilots).toHaveLength(1);

    const continued = await app.continuePilot(first.pilot.pilotId);
    expect(continued.activePilot?.pilotId).toBe('pilot-001');

    const reloaded = new WorkspaceApplication(repository, () => 'pilot-002');
    const chooser = await reloaded.bootstrap();
    expect(chooser.pilots).toEqual([
      expect.objectContaining({ pilotId: 'pilot-001', nickname: 'Nova', avatarId: 'pilot-blue' }),
    ]);
  });
});
