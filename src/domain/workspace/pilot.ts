export const STOCK_AVATARS = ['pilot-blue', 'pilot-gold', 'pilot-violet'] as const;

export type StockAvatarId = (typeof STOCK_AVATARS)[number];

export interface PilotProfile {
  pilotId: string;
  nickname: string;
  avatarId: StockAvatarId;
  createdAt: string;
  lastUsedAt: string;
}

export function requireNickname(value: string): string {
  const nickname = value.trim();
  if (nickname.length === 0) {
    throw new Error('Pilot nickname is required.');
  }
  return nickname;
}
