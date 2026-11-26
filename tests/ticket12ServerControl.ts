import { expect, type APIRequestContext } from '@playwright/test';

export interface Ticket12ServerState {
  variant: 'a' | 'b';
  failPaths: string[];
  corruptPackPaths?: string[];
  redirectRoot?: boolean;
}

/** Actual owned-server fault/rollout input. The ephemeral token never enters the browser page. */
export async function setTicket12ServerState(request: APIRequestContext, state: Ticket12ServerState): Promise<void> {
  const token = process.env.CROSSDEFENSE_T12_CONTROL_TOKEN;
  if (!token) throw new Error('The owned Ticket12 server control token is unavailable.');
  const response = await request.post('/__ticket12_control', {
    headers: { Authorization: 'Bearer ' + token },
    data: state,
  });
  expect(response.status(), await response.text()).toBe(200);
  expect(await response.json()).toEqual(state);
}
