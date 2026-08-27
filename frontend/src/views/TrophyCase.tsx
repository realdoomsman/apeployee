import { useEffect, useState } from 'react';
import type { ViewProps } from '../App';
import { api } from '../lib/api';
import type { Pass, RegistryTier } from '../lib/api';
import { Empty, PassCard, Section } from '../ui';

interface Registry { tiers: RegistryTier[]; recent: (Pass & { owner?: string })[] }

export default function TrophyCase({ me }: ViewProps) {
  const [passes, setPasses] = useState<Pass[] | null>(null);
  const [registry, setRegistry] = useState<Registry | null>(null);

  useEffect(() => {
    api<{ passes: Pass[] }>('/api/passes').then((r) => setPasses(r.passes)).catch(() => setPasses([]));
    api<Registry>('/api/passes/registry').then(setRegistry).catch(() => {});
  }, [me.passCount]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">🏆 Trophy Case</h1>
        <p className="text-mute text-sm">
          Worker Passes auto-mine while you work — every {me.mine.needed} shills, plus one for your first job.
          Your best pass sets your pay boost (currently <span className="text-banana font-bold">{me.nftBoost.toFixed(2)}x</span>).
        </p>
      </div>

      {registry && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {registry.tiers.map((t) => (
            <div key={t.tier} className={`card-pad text-center tier-${t.tier}`}>
              <div className={`font-display font-bold text-tier-${t.tier}`}>{t.tier}</div>
              <div className="text-sm text-mute mt-1"><b className="text-ink">{t.mined}</b> / {t.total} mined</div>
              <div className="progress-track mt-2"><div className="progress-fill" style={{ width: `${t.total ? Math.round((t.mined / t.total) * 100) : 0}%` }} /></div>
            </div>
          ))}
        </div>
      )}

      <Section title={`My passes ${passes ? `(${passes.length})` : ''}`}>
        {!passes ? <div className="card-pad text-mute text-sm">opening locker…</div> :
          passes.length === 0
            ? <Empty emoji="🔒" title="Locker's empty" hint="Get a job and clock some shills — the mine does the rest." />
            : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {passes.map((p) => <PassCard key={p.id} pass={p} />)}
              </div>
            )}
      </Section>

      {registry && registry.recent.length > 0 && (
        <Section title="⛏️ Recently mined across the troop">
          <div className="flex gap-3 overflow-x-auto pb-2">
            {registry.recent.map((p) => (
              <div key={p.id} className="shrink-0 w-36">
                <PassCard pass={p} size="sm" />
                {p.owner && <div className="text-xs text-mute mt-1 text-center truncate">@{p.owner}</div>}
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
