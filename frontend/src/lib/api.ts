// Thin typed client for the Apeployee API (same-origin via the Vite proxy).

export interface Status {
  app: string; ticker: string;
  xMode: 'verify' | 'oauth'; payoutMode: 'live' | 'simulated';
  mintMode?: string; feeMode?: string; cluster?: string;
  autopay: boolean; mineEvery: number; dailyShillCap: number;
}
export interface Rank { name: string; label: string; emoji: string; shills: number; mult: number }
export type TierName = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';
export interface Pass {
  id: number; tier: TierName; boost: number; image: string;
  background: string; fur: string; outfit: string; eyewear: string; headwear: string; item: string;
  minedAt?: string | null; mintSig?: string | null; equipped?: boolean;
}
export interface Stats { workers: number; mined: number; totalPasses: number; totalPaid: number; totalOwed: number }
export interface MyJob { role: string; title: string; emoji: string; status: string }
export interface Me {
  id: string; handle: string; verified: boolean; demo: boolean;
  payoutAddress: string | null; rank: Rank;
  nextRank: { label: string; emoji: string; shills: number } | null;
  totalShills: number; balance: number; lifetimeEarned: number; nftBoost: number;
  equippedPassId: number | null;
  mine: { current: number; needed: number; remaining: number };
  passCount?: number; topPass?: Pass | null; jobs?: MyJob[];
}
export interface Job {
  id: string; role: string; emoji: string; title: string; description: string;
  perk: string; hired: number; myStatus: string | null;
}
export interface Shill {
  id: string; tweetId: string; text: string | null; likes: number; retweets: number;
  replies: number; views: number; earned: number; simulated: boolean; createdAt: string;
}
export interface Leader {
  position: number; handle: string; verified: boolean; rank: Rank;
  lifetimeEarned: number; totalShills: number; passCount: number; avatar: string | null;
}
export interface RegistryTier { tier: TierName; total: number; mined: number }
export interface RegistryPass extends Pass { owner: string | null }
export interface RegistryPage { total: number; page: number; perPage: number; passes: RegistryPass[] }
export interface Payment {
  id: string; amount: number; address: string; status: string;
  signature: string | null; note: string | null; createdAt: string;
}
export interface FeedShill {
  id: string; handle: string; verified: boolean; tweetId: string; url: string;
  likes: number; retweets: number; replies: number; views: number;
  earned: number; simulated: boolean; createdAt: string;
}
export interface FeedPayment {
  id: string; handle: string; amount: number; address: string; status: string;
  signature: string | null; explorer: string | null; createdAt: string;
}
export interface Feed { shills: FeedShill[]; payments: FeedPayment[] }
export interface Vault {
  mode: 'live' | 'simulated'; address: string | null; balance: number | null;
  totalPaid: number; totalOwed: number;
  events: { id: string; type: string; amount: number; note: string | null; createdAt: string }[];
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || res.statusText);
  return data as T;
}

export const sol = (lamports: number, digits = 4) => `${(lamports / 1e9).toFixed(digits)} SOL`;
export const compact = (n: number) => Intl.NumberFormat('en', { notation: 'compact' }).format(n);
export const shortAddr = (a: string) => `${a.slice(0, 4)}…${a.slice(-4)}`;
export const when = (iso: string) => new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
