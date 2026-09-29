/**
 * CrossDefense Technology Selection PoC-5.
 *
 * Web Locks is authoritative for write ownership. localStorage heartbeat data
 * is diagnostic metadata only and is never allowed to override a live lock.
 *
 * This is throwaway prototype code, not production session-lock code.
 */

const LOCK_NAME = 'crossdefense-workspace-write';
const META_KEY = 'crossdefense-poc5-owner-meta';
const HEARTBEAT_MS = 250;

export interface OwnerMeta {
  ownerId: string;
  heartbeatAt: number;
}

export interface AcquireResult {
  acquired: boolean;
  staleRecoveredFrom: string | null;
}

export interface SessionLockState {
  ownerId: string | null;
  owned: boolean;
  lastLossReason: 'released' | 'lock-ended' | null;
  events: string[];
}

export interface Poc5SessionLock {
  acquire(ownerId: string): Promise<AcquireResult>;
  release(): Promise<void>;
  state(): SessionLockState;
  ownerMeta(): OwnerMeta | null;
}

function readMeta(): OwnerMeta | null {
  const raw = localStorage.getItem(META_KEY);
  return raw ? (JSON.parse(raw) as OwnerMeta) : null;
}

function writeMeta(meta: OwnerMeta): void {
  localStorage.setItem(META_KEY, JSON.stringify(meta));
}

function removeMetaIfOwned(ownerId: string): void {
  const current = readMeta();
  if (current?.ownerId === ownerId) {
    localStorage.removeItem(META_KEY);
  }
}

export function createPoc5SessionLock(): Poc5SessionLock {
  let ownerId: string | null = null;
  let owned = false;
  let releaseResolver: (() => void) | null = null;
  let heartbeatTimer: number | null = null;
  let lastLossReason: SessionLockState['lastLossReason'] = null;
  const events: string[] = [];

  async function acquire(requestedOwnerId: string): Promise<AcquireResult> {
    if (owned) {
      return {
        acquired: ownerId === requestedOwnerId,
        staleRecoveredFrom: null,
      };
    }

    const previousMeta = readMeta();

    let acquisitionResolver:
      | ((value: AcquireResult) => void)
      | null = null;

    const acquisition = new Promise<AcquireResult>((resolve) => {
      acquisitionResolver = resolve;
    });

    void navigator.locks
      .request(
        LOCK_NAME,
        { mode: 'exclusive', ifAvailable: true },
        async (lock) => {
          if (!lock) {
            acquisitionResolver?.({
              acquired: false,
              staleRecoveredFrom: null,
            });
            return;
          }

          ownerId = requestedOwnerId;
          owned = true;
          lastLossReason = null;
          events.push(`acquired:${requestedOwnerId}`);

          writeMeta({
            ownerId: requestedOwnerId,
            heartbeatAt: Date.now(),
          });

          heartbeatTimer = window.setInterval(() => {
            writeMeta({
              ownerId: requestedOwnerId,
              heartbeatAt: Date.now(),
            });
          }, HEARTBEAT_MS);

          acquisitionResolver?.({
            acquired: true,
            staleRecoveredFrom:
              previousMeta && previousMeta.ownerId !== requestedOwnerId
                ? previousMeta.ownerId
                : null,
          });

          await new Promise<void>((resolve) => {
            releaseResolver = resolve;
          });

          if (heartbeatTimer !== null) {
            window.clearInterval(heartbeatTimer);
            heartbeatTimer = null;
          }

          removeMetaIfOwned(requestedOwnerId);
          owned = false;
          ownerId = null;

          if (lastLossReason === null) {
            lastLossReason = 'lock-ended';
          }

          events.push(`lost:${lastLossReason}`);
        },
      )
      .catch((error: unknown) => {
        events.push(
          `error:${error instanceof Error ? error.message : String(error)}`,
        );

        acquisitionResolver?.({
          acquired: false,
          staleRecoveredFrom: null,
        });
      });

    return acquisition;
  }

  async function release(): Promise<void> {
    if (!owned || !releaseResolver) {
      return;
    }

    lastLossReason = 'released';
    const resolve = releaseResolver;
    releaseResolver = null;
    resolve();

    await new Promise((resolveTick) => {
      window.setTimeout(resolveTick, 0);
    });
  }

  return {
    acquire,
    release,
    state() {
      return {
        ownerId,
        owned,
        lastLossReason,
        events: [...events],
      };
    },
    ownerMeta: readMeta,
  };
}
