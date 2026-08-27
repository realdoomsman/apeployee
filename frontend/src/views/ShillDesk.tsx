import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import type { AppCtx } from '../App';
import { api, compact, sol, when } from '../lib/api';
import type { Me, Pass, Rank, Shill } from '../lib/api';
import { Empty, Section, Spinner } from '../ui';

export default function ShillDesk({ me, status, refreshMe, toast, celebrate, rankUp, setView }: AppCtx & { me: Me }) {
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [shills, setShills] = useState<Shill[] | null>(null);

  const load = () => api<{ shills: Shill[] }>('/api/shills').then((r) => setShills(r.shills)).catch(() => setShills([]));
  useEffect(() => { load(); }, []);

  const submit = async () => {
    setBusy(true);
    try {
      const r = await api<{ earned: number; minedPass: Pass | null; rankedUp: Rank | null }>(
        '/api/shills', { method: 'POST', body: JSON.stringify({ url }) },
      );
      setUrl('');
      toast(`Shift clocked: +${sol(r.earned)}`);
      if (r.minedPass) celebrate(r.minedPass);
      if (r.rankedUp) rankUp(r.rankedUp);
      await Promise.all([load(), refreshMe()]);
    } catch (e) {
      toast((e as Error).message, 'bad');
    } finally {
      setBusy(false);
    }
  };

  const hasJob = (me.jobs?.length ?? 0) > 0;

  return (
    <div className="space-y-5">
      <p className="text-sm text-ink-soft">
        Post about {status.ticker} on X, paste the link, get paid for the engagement. That is the job.
      </p>

      <div className="panel-pad space-y-3">
        {!hasJob && (
          <div className="text-sm text-stampred font-semibold">
            You need a position first — <button className="underline" onClick={() => setView('jobs')}>open JOBS.EXE</button> and get hired.
          </div>
        )}
        <div className="flex gap-2 flex-col sm:flex-row">
          <input
            className="input font-mono text-xs" placeholder={`https://x.com/${me.handle}/status/…`}
            value={url} onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && url && !busy && hasJob && submit()}
          />
          <button className="btn-xp shrink-0" onClick={submit} disabled={busy || !url || !hasJob}>
            {busy ? <Spinner light /> : 'Clock this shift'}
          </button>
        </div>
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1">
          <div className="label">The post must mention {status.ticker}</div>
          <div className="label">Own posts only{me.verified ? ' — checked against your X account' : ''}</div>
          <div className="label">Each post pays once; engagement re-checked for 48h</div>
          <div className="label">Wage = engagement × {me.rank.mult}x rank × {me.nftBoost.toFixed(2)}x passes · cap {status.dailyShillCap}/day</div>
        </div>
      </div>

      <Section title={`Shift log${shills ? ` (${shills.length})` : ''}`}>
        {!shills ? <div className="panel-pad text-sm text-ink-soft">Loading…</div> :
          shills.length === 0 ? <Empty title="Nothing clocked yet" hint="Your first shift is one paste away." /> : (
            <div className="panel overflow-x-auto !bg-white">
              <table className="w-full">
                <thead><tr>
                  <th className="th">When</th><th className="th">Post</th><th className="th">Engagement</th><th className="th text-right">Wage</th>
                </tr></thead>
                <tbody>
                  {shills.map((s) => (
                    <tr key={s.id}>
                      <td className="td font-mono text-[11px] text-ink-soft whitespace-nowrap">{when(s.createdAt)}</td>
                      <td className="td max-w-56">
                        <a className="inline-flex items-center gap-1 text-sm hover:underline truncate max-w-full" href={`https://x.com/i/web/status/${s.tweetId}`} target="_blank" rel="noreferrer">
                          <span className="truncate">{s.text || `post ${s.tweetId}`}</span> <ExternalLink size={11} className="shrink-0 text-ink-soft" />
                        </a>
                      </td>
                      <td className="td font-mono text-[11px] whitespace-nowrap">
                        {compact(s.likes)} likes · {compact(s.retweets)} rt · {compact(s.views)} views{s.simulated && <span className="text-ink-soft"> · unverified</span>}
                      </td>
                      <td className="td font-mono text-xs text-green text-right whitespace-nowrap">+{sol(s.earned)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </Section>
    </div>
  );
}
