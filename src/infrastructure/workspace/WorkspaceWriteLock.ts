const LOCK_NAME = 'crossdefense-workspace-write';
const META_KEY = 'crossdefense-workspace-owner';
const HEARTBEAT_MS = 2_000;

interface OwnerMeta {
  ownerId: string;
  heartbeatAt: number;
}

export type OwnershipResult =
  | { status: 'acquired'; previousOwnerId: string | null }
  | { status: 'blocked'; ownerId: string | null }
  | { status: 'unsupported' };

export class WorkspaceWriteLock {
  private owned = false;
  private releaseResolver: (() => void) | null = null;
  private heartbeatTimer: number | null = null;

  constructor(private readonly ownerId: string) {}

  async acquire(): Promise<OwnershipResult> {
    if (this.owned) {
      return { status: 'acquired', previousOwnerId: null };
    }
    if (!navigator.locks) {
      return { status: 'unsupported' };
    }

    const previous = this.readOwnerMeta();
    return new Promise<OwnershipResult>((resolve, reject) => {
      void navigator.locks.request(
        LOCK_NAME,
        { mode: 'exclusive', ifAvailable: true },
        async (lock) => {
          if (!lock) {
            resolve({ status: 'blocked', ownerId: previous?.ownerId ?? null });
            return;
          }

          this.owned = true;
          this.writeOwnerMeta();
          this.heartbeatTimer = window.setInterval(() => this.writeOwnerMeta(), HEARTBEAT_MS);
          resolve({
            status: 'acquired',
            previousOwnerId: previous && previous.ownerId !== this.ownerId ? previous.ownerId : null,
          });

          await new Promise<void>((release) => {
            this.releaseResolver = release;
          });

          if (this.heartbeatTimer !== null) {
            window.clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
          }
          this.removeOwnerMetaIfOwned();
          this.owned = false;
        },
      ).catch(reject);
    });
  }

  release(): void {
    const release = this.releaseResolver;
    this.releaseResolver = null;
    release?.();
  }

  private readOwnerMeta(): OwnerMeta | null {
    const raw = localStorage.getItem(META_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as OwnerMeta;
    } catch {
      return null;
    }
  }

  private writeOwnerMeta(): void {
    localStorage.setItem(META_KEY, JSON.stringify({ ownerId: this.ownerId, heartbeatAt: Date.now() }));
  }

  private removeOwnerMetaIfOwned(): void {
    if (this.readOwnerMeta()?.ownerId === this.ownerId) {
      localStorage.removeItem(META_KEY);
    }
  }
}
