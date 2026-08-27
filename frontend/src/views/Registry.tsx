import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { AppCtx } from '../App';
import { api } from '../lib/api';
import type { RegistryPage, RegistryTier, TierName } from '../lib/api';
import { PassCard, Spinner } from '../ui';

export default function Registry(_ctx: AppCtx) {
  const [tiers, setTiers] = useState<RegistryTier[] | null>(null);
  const [tier, setTier] = useState<TierName | ''>('');
  const [mined, setMined] = useState<'' | 'true' | 'false'>('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<RegistryPage | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api<{ tiers: RegistryTier[] }>('/api/passes/registry').then((r) => setTiers(r.tiers)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const q = new URLSearchParams({ page: String(page) });
    if (tier) q.set('tier', tier);
    if (mined) q.set('mined', mined);
    api<RegistryPage>(`/api/registry/passes?${q}`).then(setData).catch(() => {}).finally(() => setLoading(false));
  }, [tier, mined, page]);

  const pages = data ? Math.max(1, Math.ceil(data.total / data.perPage)) : 1;

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-soft">
        The full census of all 1000 Worker Passes. Every pass is numbered, tiered, and
        assigned to the worker who mined it. On-chain minting status is shown per pass.
      </p>

      {tiers && (
        <div className="grid grid-cols-5 gap-2">
          {tiers.map((t) => (
            <button
              key={t.tier}
              className={`panel p-2 text-center ${tier === t.tier ? 'outline outline-2 outline-xp' : ''}`}
              onClick={() => { setTier(tier === t.tier ? '' : t.tier); setPage(1); }}
            >
              <div className={`font-mono text-[10px] uppercase tracking-wider tier-text-${t.tier}`}>{t.tier}</div>
              <div className="font-mono text-xs mt-0.5">{t.mined}/{t.total}</div>
              <div className="bar-track !h-2 mt-1"><div className="bar-fill" style={{ width: `${t.total ? (t.mined / t.total) * 100 : 0}%` }} /></div>
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <span className="label">Filter</span>
        <select className="input !w-auto text-xs font-mono" value={mined} onChange={(e) => { setMined(e.target.value as typeof mined); setPage(1); }}>
          <option value="">All passes</option>
          <option value="true">Mined (assigned)</option>
          <option value="false">Unmined (available)</option>
        </select>
        {loading && <Spinner />}
        <span className="label ml-auto">{data ? `${data.total} matching` : ''}</span>
      </div>

      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {data.passes.map((p) => <PassCard key={p.id} pass={p} owner={p.owner} dense />)}
        </div>
      )}

      <div className="flex items-center justify-between">
        <button className="btn-ink" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft size={15} /> Prev</button>
        <span className="font-mono text-xs">page {page} / {pages}</span>
        <button className="btn-ink" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next <ChevronRight size={15} /></button>
      </div>

      <div className="statusbar">
        Passes mint as compressed NFTs (Metaplex Bubblegum) to the holder's payout address; passes mined before launch are held in vault custody until an address is filed.
      </div>
    </div>
  );
}
