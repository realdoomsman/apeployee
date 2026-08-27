import { useEffect, useState } from 'react';
import { api, compact, sol } from '../lib/api';
import type { Me, RegistryTier, Status, Vault } from '../lib/api';
import { Spinner } from '../ui';

// A spread of pass ids used as decorative art (all 1..1000 exist).
const ROW_A = [7, 42, 88, 133, 263, 301, 404, 555, 678, 777, 888, 999, 61, 150, 210];
const ROW_B = [23, 104, 320, 468, 512, 590, 640, 700, 810, 870, 930, 980, 350, 111, 250];

const passImg = (id: number) => `/nft/images/${String(id).padStart(3, '0')}.png`;

export default function Landing({ status, onAuthed }: { status: Status; onAuthed: (me: Me) => void }) {
  const [handle, setHandle] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [minedTotal, setMinedTotal] = useState<number | null>(null);
  const [paid, setPaid] = useState<number | null>(null);

  useEffect(() => {
    api<{ tiers: RegistryTier[] }>('/api/passes/registry')
      .then((r) => setMinedTotal(r.tiers.reduce((s, t) => s + t.mined, 0)))
      .catch(() => {});
    api<Vault>('/api/vault').then((v) => setPaid(v.totalPaid)).catch(() => {});
  }, []);

  const demoSignin = async () => {
    setBusy(true); setError('');
    try {
      const { user } = await api<{ user: Me }>('/api/auth/demo', { method: 'POST', body: JSON.stringify({ handle }) });
      onAuthed(user);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col overflow-hidden">
      <header className="max-w-6xl w-full mx-auto px-4 h-16 flex items-center gap-2.5">
        <img src="/favicon.svg" alt="" className="w-9 h-9" />
        <span className="font-display font-bold text-lg">APEPLOYEE <span className="text-banana">{status.ticker}</span></span>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 grid lg:grid-cols-2 gap-10 items-center py-10">
        <div className="space-y-6">
          <div className="chip border-jungle/50 text-jungle bg-jungle/10">🟢 NOW HIRING — {status.ticker} needs workers</div>
          <h1 className="font-display font-bold text-4xl md:text-6xl leading-[1.05] tracking-tight">
            The market is rough.<br />
            <span className="text-banana">People need work.</span>
          </h1>
          <p className="text-mute text-lg max-w-md">
            The first memecoin where the community gets <b className="text-ink">jobs</b>. Apply, get hired,
            shill {status.ticker} on X, and get <b className="text-ink">paid in SOL</b> from creator fees —
            while Worker Pass NFTs auto-mine to your locker and boost your pay.
          </p>
          <ul className="space-y-2 text-sm text-mute">
            <li>🪪 <b className="text-ink">No wallet connect.</b> Sign in with your X handle — paste an address only when you want paying.</li>
            <li>⛏️ Every {status.mineEvery} shifts mines you a Worker Pass NFT (1000 total, 5 tiers).</li>
            <li>📈 Engagement = wages. Rank up from Chimpanzee to Silverback for up to 3x pay.</li>
          </ul>

          <div className="card-pad max-w-md space-y-3">
            {status.xMode === 'live' ? (
              <a className="btn-primary w-full text-base" href="/api/auth/x/start">𝕏 Sign in with X — start your shift</a>
            ) : (
              <>
                <div className="font-display font-bold">Start your shift</div>
                <div className="flex gap-2">
                  <input
                    className="input" placeholder="your X handle, e.g. @doomsalt" value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handle && demoSignin()}
                  />
                  <button className="btn-primary shrink-0" onClick={demoSignin} disabled={busy || !handle}>
                    {busy ? <Spinner /> : 'Clock in'}
                  </button>
                </div>
                {error && <div className="text-red-400 text-sm">{error}</div>}
                <div className="text-xs text-mute">Demo mode — X verification turns on once API keys are configured.</div>
              </>
            )}
          </div>

          <div className="flex gap-6 text-sm">
            <div><div className="stat-num text-banana">{minedTotal === null ? '—' : compact(minedTotal)}</div><div className="text-mute">passes mined</div></div>
            <div><div className="stat-num text-banana">1000</div><div className="text-mute">Worker Passes</div></div>
            <div><div className="stat-num text-banana">{paid === null ? '—' : sol(paid, 2)}</div><div className="text-mute">wages paid</div></div>
          </div>
        </div>

        <div className="relative hidden lg:block">
          <div className="grid grid-cols-2 gap-4 rotate-2">
            {[263, 61, 777, 42].map((id, i) => (
              <img
                key={id} src={passImg(id)} alt="Worker Pass"
                className={`rounded-2xl border border-line shadow-2xl ${i % 2 ? 'translate-y-6' : ''} animate-floaty`}
                style={{ animationDelay: `${i * 0.7}s` }}
              />
            ))}
          </div>
          <div className="absolute -bottom-4 -left-4 card px-4 py-3 text-sm font-semibold rotate-[-3deg]">
            🪪 APEPLOYEE ID — <span className="text-banana">OFFICIALLY APELOYED</span>
          </div>
        </div>
      </main>

      {/* pass marquee */}
      <div className="space-y-3 pb-8 select-none" aria-hidden>
        <MarqueeRow ids={ROW_A} slow={false} />
        <MarqueeRow ids={ROW_B} slow />
      </div>
    </div>
  );
}

function MarqueeRow({ ids, slow }: { ids: number[]; slow: boolean }) {
  const doubled = [...ids, ...ids];
  return (
    <div className="overflow-hidden">
      <div className={`flex gap-3 w-max ${slow ? 'animate-marquee-slow' : 'animate-marquee'}`}>
        {doubled.map((id, i) => (
          <img key={i} src={passImg(id)} alt="" className="w-24 h-24 rounded-xl border border-line object-cover" loading="lazy" />
        ))}
      </div>
    </div>
  );
}
