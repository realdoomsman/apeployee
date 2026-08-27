import { useEffect, useState } from 'react';
import { BadgeCheck } from 'lucide-react';
import type { AppCtx } from '../App';
import { api, sol } from '../lib/api';
import type { Leader } from '../lib/api';
import { Empty } from '../ui';

export default function Workforce({ me }: AppCtx) {
  const [leaders, setLeaders] = useState<Leader[] | null>(null);

  useEffect(() => {
    api<{ leaders: Leader[] }>('/api/leaderboard').then((r) => setLeaders(r.leaders)).catch(() => setLeaders([]));
  }, []);

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-soft">Employee of the month standings, ranked by lifetime wages. HR keeps receipts.</p>
      {!leaders ? <div className="panel-pad text-sm text-ink-soft">Tallying…</div> :
        leaders.length === 0 ? <Empty title="Nobody on payroll yet" hint="The corner office is unclaimed." /> : (
          <div className="panel overflow-x-auto !bg-white">
            <table className="w-full">
              <thead><tr>
                <th className="th w-10">#</th><th className="th">Worker</th><th className="th">Title</th>
                <th className="th text-right">Shifts</th><th className="th text-right">Passes</th><th className="th text-right">Lifetime wages</th>
              </tr></thead>
              <tbody>
                {leaders.map((l) => (
                  <tr key={l.position} className={me && l.handle === me.handle ? 'outline outline-2 outline-banana -outline-offset-2' : ''}>
                    <td className="td font-mono text-xs">{l.position}</td>
                    <td className="td">
                      <span className="inline-flex items-center gap-2">
                        {l.avatar
                          ? <img src={l.avatar} alt="" className="w-8 h-8 rounded-sm border border-line-dark object-cover" loading="lazy" />
                          : <span className="w-8 h-8 rounded-sm border border-line-dark bg-paper-deep" />}
                        <span className="font-mono text-xs">@{l.handle}</span>
                        {l.verified && <BadgeCheck size={13} className="text-green" />}
                        {me && l.handle === me.handle && <span className="label">(you)</span>}
                      </span>
                    </td>
                    <td className="td text-xs">{l.rank.label}</td>
                    <td className="td font-mono text-xs text-right">{l.totalShills}</td>
                    <td className="td font-mono text-xs text-right">{l.passCount}</td>
                    <td className="td font-mono text-xs text-right whitespace-nowrap">{sol(l.lifetimeEarned)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </div>
  );
}
