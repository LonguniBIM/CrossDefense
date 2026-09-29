import { z } from 'zod';

const PACK_STATE_KEY = 'crossdefense-poc4-pack-state';

const ContentPackSchema = z.object({
  contentVersion: z.string().min(1),
  schemaVersion: z.literal(1),
  compatibleRuleset: z.string().min(1),
  minimumAppVersion: z.string().min(1),
  audio: z.object({
    laser: z.string().min(1),
  }),
  words: z.array(z.string().min(1)).min(1),
});

export type ContentPack = z.infer<typeof ContentPackSchema>;

export interface PackState {
  activeVersion: string | null;
  lastKnownGoodVersion: string | null;
}

function readState(): PackState {
  const raw = localStorage.getItem(PACK_STATE_KEY);

  if (!raw) {
    return {
      activeVersion: null,
      lastKnownGoodVersion: null,
    };
  }

  return JSON.parse(raw) as PackState;
}

function writeState(state: PackState): void {
  localStorage.setItem(PACK_STATE_KEY, JSON.stringify(state));
}

export async function loadPack(version: string): Promise<ContentPack> {
  const response = await fetch(`/content/packs/${version}/manifest.json`);

  if (!response.ok) {
    throw new Error(`Content Pack request failed: ${response.status}`);
  }

  const json: unknown = await response.json();
  return ContentPackSchema.parse(json);
}

export async function activateCandidate(version: string): Promise<{
  activated: boolean;
  state: PackState;
  error?: string;
}> {
  const previous = readState();

  try {
    const pack = await loadPack(version);
    const next: PackState = {
      activeVersion: pack.contentVersion,
      lastKnownGoodVersion: pack.contentVersion,
    };
    writeState(next);

    return {
      activated: true,
      state: next,
    };
  } catch (error) {
    return {
      activated: false,
      state: previous,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function loadLaserAudio(version: string): Promise<{
  bytes: number;
  contentType: string;
}> {
  const pack = await loadPack(version);
  const response = await fetch(pack.audio.laser);

  if (!response.ok) {
    throw new Error(`Audio request failed: ${response.status}`);
  }

  const buffer = await response.arrayBuffer();

  return {
    bytes: buffer.byteLength,
    contentType: response.headers.get('content-type') ?? '',
  };
}

export function getPackState(): PackState {
  return readState();
}

export function resetPackState(): PackState {
  const state: PackState = {
    activeVersion: null,
    lastKnownGoodVersion: null,
  };

  writeState(state);
  return state;
}

export interface Poc4Api {
  activate(version: string): ReturnType<typeof activateCandidate>;
  load(version: string): ReturnType<typeof loadPack>;
  loadLaserAudio(version: string): ReturnType<typeof loadLaserAudio>;
  state(): PackState;
  reset(): PackState;
}

export function createPoc4Api(): Poc4Api {
  return {
    activate: activateCandidate,
    load: loadPack,
    loadLaserAudio,
    state: getPackState,
    reset: resetPackState,
  };
}
