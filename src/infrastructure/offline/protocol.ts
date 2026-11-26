declare const __APP_BUILD_ID__: string;

/** One build invocation shares this identity between application and worker. */
export const APP_BUILD_ID = typeof __APP_BUILD_ID__ === 'string' ? __APP_BUILD_ID__ : 'development';
export const MAX_CACHE_ENTRY_BYTES = 16 * 1024 * 1024;

export type OfflineRequest =
  | { type: 'CHECK_CACHE'; buildId?: string }
  | { type: 'ACTIVATE_UPDATE'; buildId: string }
  | { type: 'CLAIM_CURRENT'; buildId: string }
  | { type: 'REPAIR_CACHE'; buildId: string };

export interface CacheStatus {
  buildId: string;
  ready: boolean;
  missing: string[];
}

export interface UpdateActivationReply { activated: boolean; reason?: string; }
export interface CurrentClaimReply { claimed: boolean; reason?: string; }
