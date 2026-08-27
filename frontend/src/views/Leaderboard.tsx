import { useEffect, useState } from 'react';
import type { ViewProps } from '../App';
import { api, sol } from '../lib/api';
import type { Leader } from '../lib/api';
import { Empty } from '../ui';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function Leaderboard({ me }: ViewProps) {
  const [leaders, setLeaders] = useState<Leader[] | null>(null);

  useEffect(() => {
    api<{ leaders: Leader[] }>('/api/leaderboard').then((r) => setLeaders(r.leaders)).catch(() => setLeaders([]));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">🏅 Employee of the Month board</h1>
        <p className="text-mute text-sm">Top earners across the troop. HR keeps receipts.</p>
      </div>

      {!leaders ? <div className="card-pad text-mute text-sm">tallying bananas…</div> :
        leaders.length === 0 ? <Empty emoji="🦗" title="Nobody has earned yet" hint="The top spot is wide open." /> : (
          <div className="card divide-y divide-line">
            {leaders.map((l) => (
              <div key={l.position} className={`p-4 flex items-center gap-4 ${l.handle === me.handle ? 'bg-banana/5' : ''}`}>
                <div className="w-9 text-center font-display font-bold text-lg shrink-0">
                  {MEDALS[l.position - 1] || l.position}
                </div>
                {l.avatar
                  ? <img src={l.avatar} alt="" className="w-11 h-11 rounded-xl border border-line object-cover shrink-0" loading="lazy" />
                  : <div className="w-11 h-11 rounded-xl bg-night-700 border border-line grid place-items-center shrink-0">🐒</div>}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">
                    @{l.handle} {l.verified && '✅'} {l.handle === me.handle && <span className="text-banana text-xs">(you)</span>}
                  </div>
                  <div className="text-xs text-mute">{l.rank.emoji} {l.rank.label} · {l.totalShills} shills · {l.passCount} pass{l.passCount === 1 ? '' : 'es'}</div>
                </div>
                <div className="font-display font-bold text-jungle shrink-0">{sol(l.lifetimeEarned)}</div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
