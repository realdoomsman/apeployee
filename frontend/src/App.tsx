import { useCallback, useEffect, useState } from 'react';
import { api, sol } from './lib/api';
import type { Me, Pass, Rank, Status } from './lib/api';
import { Modal, PassCard, Spinner } from './ui';
import Landing from './views/Landing';
import Dashboard from './views/Dashboard';
import Jobs from './views/Jobs';
import ShillDesk from './views/ShillDesk';
import TrophyCase from './views/TrophyCase';
import Leaderboard from './views/Leaderboard';
import Vault from './views/Vault';

type View = 'dashboard' | 'jobs' | 'shills' | 'passes' | 'leaderboard' | 'vault';
const NAV: { key: View; label: string }[] = [
  { key: 'dashboard', label: 'My Desk' },
  { key: 'jobs', label: 'Jobs' },
  { key: 'shills', label: 'Shill Desk' },
  { key: 'passes', label: 'Trophy Case' },
  { key: 'leaderboard', label: 'Leaderboard' },
  { key: 'vault', label: 'Vault' },
];

export interface ViewProps {
  me: Me;
  status: Status;
  refreshMe: () => Promise<void>;
  toast: (msg: string, kind?: 'good' | 'bad') => void;
  celebrate: (pass: Pass) => void;
  rankUp: (rank: Rank) => void;
}

export default function App() {
  const [status, setStatus] = useState<Status | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [booting, setBooting] = useState(true);
  const [view, setView] = useState<View>('dashboard');
  const [toasts, setToasts] = useState<{ id: number; msg: string; kind: 'good' | 'bad' }[]>([]);
  const [minedPass, setMinedPass] = useState<Pass | null>(null);
  const [newRank, setNewRank] = useState<Rank | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const toast = useCallback((msg: string, kind: 'good' | 'bad' = 'good') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  const refreshMe = useCallback(async () => {
    try {
      const { user } = await api<{ user: Me }>('/api/me');
      setMe(user);
    } catch {
      setMe(null);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setStatus(await api<Status>('/api/status'));
        await refreshMe();
      } finally {
        setBooting(false);
      }
    })();
  }, [refreshMe]);

  if (booting || !status) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-center">
          <div className="text-5xl animate-floaty">🦍</div>
          <div className="font-display font-bold mt-3 text-mute">clocking in…</div>
        </div>
      </div>
    );
  }

  if (!me) return <Landing status={status} onAuthed={(u) => { setMe(u); setView('dashboard'); }} />;

  const viewProps: ViewProps = {
    me, status, refreshMe, toast,
    celebrate: (p) => setMinedPass(p),
    rankUp: (r) => setNewRank(r),
  };

  const simulated = status.payoutMode === 'simulated' || status.xRead === 'simulated';

  return (
    <div className="min-h-screen">
      {simulated && (
        <div className="bg-banana/10 border-b border-banana/25 text-banana text-xs text-center py-1.5 px-3 font-semibold">
          Demo shift — {status.xRead === 'simulated' ? 'X engagement is simulated' : ''}
          {status.xRead === 'simulated' && status.payoutMode === 'simulated' ? ' · ' : ''}
          {status.payoutMode === 'simulated' ? 'payouts are simulated (no vault key)' : ''} · add API keys in backend/.env to go live
        </div>
      )}

      <header className="sticky top-0 z-40 backdrop-blur-md bg-night-900/80 border-b border-line">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-3">
          <button className="flex items-center gap-2.5 shrink-0" onClick={() => setView('dashboard')}>
            <img src="/favicon.svg" alt="" className="w-9 h-9" />
            <span className="font-display font-bold text-lg tracking-tight hidden sm:block">
              APEPLOYEE <span className="text-banana">{status.ticker}</span>
            </span>
          </button>

          <nav className="flex-1 flex items-center gap-1 overflow-x-auto">
            {NAV.map((n) => (
              <button key={n.key} className={`navlink whitespace-nowrap ${view === n.key ? 'navlink-active' : ''}`} onClick={() => setView(n.key)}>
                {n.label}
              </button>
            ))}
          </nav>

          <div className="relative shrink-0 flex items-center gap-2.5">
            <span className="chip border-jungle/50 text-jungle bg-jungle/10 hidden md:inline-flex">💰 {sol(me.balance)}</span>
            <button className="flex items-center gap-2" onClick={() => setMenuOpen((o) => !o)}>
              {me.topPass
                ? <img src={me.topPass.image} alt="" className={`w-9 h-9 rounded-xl border-2 object-cover tier-${me.topPass.tier}`} />
                : <span className="w-9 h-9 rounded-xl bg-night-700 border border-line grid place-items-center">🐒</span>}
            </button>
            {menuOpen && <ProfileMenu me={me} refreshMe={refreshMe} toast={toast} close={() => setMenuOpen(false)} onSignout={() => setMe(null)} />}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {view === 'dashboard' && <Dashboard {...viewProps} />}
        {view === 'jobs' && <Jobs {...viewProps} />}
        {view === 'shills' && <ShillDesk {...viewProps} />}
        {view === 'passes' && <TrophyCase {...viewProps} />}
        {view === 'leaderboard' && <Leaderboard {...viewProps} />}
        {view === 'vault' && <Vault {...viewProps} />}
      </main>

      <footer className="max-w-6xl mx-auto px-4 py-8 text-center text-xs text-mute">
        The market is rough. People need work. — APEPLOYEE {status.ticker} · not financial advice, just employment 🦍
      </footer>

      {/* mined pass celebration */}
      {minedPass && (
        <Modal onClose={() => setMinedPass(null)}>
          <div className="card p-5 text-center space-y-3">
            <div className="font-display font-bold text-banana tracking-widest text-sm">⛏️ NEW WORKER PASS MINED</div>
            <PassCard pass={minedPass} />
            <p className="text-sm text-mute">Auto-mined for working your shift. Holding it boosts every future payout.</p>
            <button className="btn-primary w-full" onClick={() => setMinedPass(null)}>Back to work</button>
          </div>
        </Modal>
      )}

      {/* rank up */}
      {newRank && (
        <Modal onClose={() => setNewRank(null)}>
          <div className="card p-6 text-center space-y-3">
            <div className="text-6xl animate-floaty">{newRank.emoji}</div>
            <div className="font-display text-xl font-bold">PROMOTED TO {newRank.label.toUpperCase()}</div>
            <p className="text-sm text-mute">Pay multiplier is now <span className="text-banana font-bold">{newRank.mult}x</span>. HR says congrats.</p>
            <button className="btn-primary w-full" onClick={() => setNewRank(null)}>LFG</button>
          </div>
        </Modal>
      )}

      {/* toasts */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-xs">
        {toasts.map((t) => (
          <div key={t.id} className={`card px-4 py-3 text-sm font-semibold animate-pop ${t.kind === 'bad' ? 'border-red-500/60 text-red-300' : 'border-jungle/60'}`}>
            {t.msg}
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfileMenu({ me, refreshMe, toast, close, onSignout }: {
  me: Me; refreshMe: () => Promise<void>;
  toast: (m: string, k?: 'good' | 'bad') => void; close: () => void; onSignout: () => void;
}) {
  const [address, setAddress] = useState(me.payoutAddress || '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await api('/api/me/payout', { method: 'PUT', body: JSON.stringify({ address }) });
      await refreshMe();
      toast(address ? 'Payout address saved 🍌' : 'Payout address cleared');
      close();
    } catch (e) {
      toast((e as Error).message, 'bad');
    } finally {
      setSaving(false);
    }
  };

  const signout = async () => {
    await api('/api/auth/logout', { method: 'POST' });
    onSignout();
  };

  return (
    <div className="absolute right-0 top-12 w-80 card p-4 space-y-3 shadow-2xl">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-display font-bold">@{me.handle}</div>
          <div className="text-xs text-mute">
            {me.verified ? '✅ X verified' : me.demo ? '🎪 demo account' : 'unverified'} · {me.rank.emoji} {me.rank.label}
          </div>
        </div>
        <button className="text-mute hover:text-ink" onClick={close}>✕</button>
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-mute">Payout address (SOL is sent here — no wallet connection needed)</label>
        <input className="input text-xs font-mono" placeholder="paste your Solana address" value={address} onChange={(e) => setAddress(e.target.value)} />
        <button className="btn-green w-full" onClick={save} disabled={saving}>{saving ? <Spinner /> : 'Save address'}</button>
      </div>
      <button className="btn-ghost w-full" onClick={signout}>Clock out (sign out)</button>
    </div>
  );
}
