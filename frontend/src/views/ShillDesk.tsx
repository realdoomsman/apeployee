import { useEffect, useState } from 'react';
import type { ViewProps } from '../App';
import { api, compact, sol } from '../lib/api';
import type { Pass, Rank, Shill, Me } from '../lib/api';
import { Empty, Section, Spinner } from '../ui';

export default function ShillDesk({ me, status, refreshMe, toast, celebrate, rankUp }: ViewProps) {
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [shills, setShills] = useState<Shill[] | null>(null);

  const load = () => api<{ shills: Shill[] }>('/api/shills').then((r) => setShills(r.shills)).catch(() => setShills([]));
  useEffect(() => { load(); }, []);

  const submit = async () => {
    setBusy(true);
    try {
      const r = await api<{ earned: number; minedPass: Pass | null; rankedUp: Rank | null; user: Me }>(
        '/api/shills', { method: 'POST', body: JSON.stringify({ url }) },
      );
      setUrl('');
      toast(`Shift clocked: +${sol(r.earned)} 🦍`);
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
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">📣 Shill Desk</h1>
        <p className="text-mute text-sm">Post about {status.ticker} on X, paste the link, get paid for the engagement. That's the job.</p>
      </div>

      <div className="card-pad space-y-3">
        {!hasJob && <div className="text-banana text-sm font-semibold">⚠️ You need a job first — swing by the Jobs board and get APELOYED.</div>}
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            className="input font-mono text-sm" placeholder={`https://x.com/${me.handle}/status/…`}
            value={url} onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && url && !busy && submit()}
          />
          <button className="btn-primary shrink-0" onClick={submit} disabled={busy || !url || !hasJob}>
            {busy ? <Spinner /> : 'Clock this shill'}
          </button>
        </div>
        <ul className="text-xs text-mute grid sm:grid-cols-2 gap-x-6 gap-y-1">
          <li>• Post must mention <b className="text-banana">{status.ticker}</b> — that's the whole job</li>
          <li>• Own posts only{me.verified ? ' (checked against your verified X account)' : ''}</li>
          <li>• Every post pays once — engagement re-checked for 48h, wages grow with it</li>
          <li>• Pay = ❤️/🔁/👁 × {me.rank.mult}x rank × {me.nftBoost.toFixed(2)}x pass boost · cap {status.dailyShillCap}/day</li>
        </ul>
        {status.xRead === 'simulated' && (
          <div className="text-xs text-banana">Demo shift: engagement is simulated until X API keys are configured — numbers grow over ~4h like a real post.</div>
        )}
      </div>

      <Section title={`🧾 Shift log ${shills ? `(${shills.length})` : ''}`}>
        {!shills ? <div className="card-pad text-mute text-sm">loading…</div> :
          shills.length === 0 ? <Empty emoji="📭" title="Nothing clocked yet" hint="Your first shill is one paste away." /> : (
            <div className="card divide-y divide-line">
              {shills.map((s) => (
                <div key={s.id} className="p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{s.text || `post ${s.tweetId}`}</div>
                    <div className="text-xs text-mute mt-0.5">
                      ❤️ {compact(s.likes)} · 🔁 {compact(s.retweets)} · 💬 {compact(s.replies)} · 👁 {compact(s.views)}
                      {s.simulated && <span className="text-banana"> · simulated</span>}
                      <span> · {new Date(s.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="text-jungle font-bold text-sm shrink-0">+{sol(s.earned)}</div>
                </div>
              ))}
            </div>
          )}
      </Section>
    </div>
  );
}
