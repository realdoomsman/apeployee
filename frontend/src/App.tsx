import { useCallback, useEffect, useRef, useState } from 'react';
import { Banknote, Briefcase, CreditCard, FileText, LogOut, Megaphone, Monitor, User, Users } from 'lucide-react';
import { api, sol } from './lib/api';
import type { Me, Pass, Rank, Status } from './lib/api';
import { Modal, PassCard, Spinner } from './ui';
import Overview from './views/Overview';
import Jobs from './views/Jobs';
import Registry from './views/Registry';
import Payroll from './views/Payroll';
import Workforce from './views/Workforce';
import MyDesk from './views/MyDesk';
import ShillDesk from './views/ShillDesk';

export type View = 'welcome' | 'jobs' | 'registry' | 'payroll' | 'workforce' | 'desk' | 'shill';

export interface AppCtx {
  me: Me | null;
  status: Status;
  setView: (v: View) => void; // opens/focuses the window
  refreshMe: () => Promise<void>;
  toast: (msg: string, kind?: 'good' | 'bad') => void;
  celebrate: (pass: Pass) => void;
  rankUp: (rank: Rank) => void;
  openSignIn: () => void;
}

interface WinDef { title: string; icon: typeof FileText; w: number; h: number; authed?: boolean }
const WINDOWS: Record<View, WinDef> = {
  welcome: { title: 'WELCOME.TXT — APEPLOYEE', icon: FileText, w: 780, h: 560 },
  jobs: { title: 'JOBS.EXE — Ape Resources', icon: Briefcase, w: 830, h: 580 },
  registry: { title: 'PASS_REGISTRY.EXE — 1000 Worker Passes', icon: CreditCard, w: 900, h: 620 },
  payroll: { title: 'PAYROLL.EXE — Public Records', icon: Banknote, w: 860, h: 600 },
  workforce: { title: 'WORKFORCE.EXE — Employee Rankings', icon: Users, w: 700, h: 560 },
  desk: { title: 'MY_DESK.EXE — Employee File', icon: User, w: 820, h: 620, authed: true },
  shill: { title: 'SHILL_DESK.EXE — Clock Your Shifts', icon: Megaphone, w: 780, h: 580, authed: true },
};
const DESKTOP_ICONS: View[] = ['welcome', 'jobs', 'shill', 'registry', 'payroll', 'workforce', 'desk'];

interface WinState { open: boolean; min: boolean; x: number; y: number; z: number }

function playSound(type: 'click' | 'open' | 'close' | 'boot') {
  try {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctor();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine';
    const cfg = {
      click: [900, 900, 0.05, 0.04],
      open: [500, 740, 0.05, 0.09],
      close: [740, 500, 0.05, 0.09],
      boot: [420, 840, 0.06, 0.28],
    }[type];
    osc.frequency.value = cfg[0];
    gain.gain.value = cfg[2];
    osc.start();
    osc.frequency.linearRampToValueAtTime(cfg[1], ctx.currentTime + cfg[3]);
    osc.stop(ctx.currentTime + cfg[3] + 0.02);
  } catch { /* audio blocked — fine */ }
}

export default function App() {
  const [status, setStatus] = useState<Status | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [wins, setWins] = useState<Record<View, WinState>>(() => {
    const base = {} as Record<View, WinState>;
    (Object.keys(WINDOWS) as View[]).forEach((k, i) => {
      base[k] = { open: false, min: false, x: 90 + i * 26, y: 30 + i * 20, z: 1 };
    });
    base.welcome = { ...base.welcome, open: true, x: Math.max(30, (window.innerWidth - 780) / 2 - 120), y: 34, z: 2 };
    return base;
  });
  const zTop = useRef(10);
  const [drag, setDrag] = useState<{ id: View; dx: number; dy: number } | null>(null);
  const [signInOpen, setSignInOpen] = useState(false);
  const [startOpen, setStartOpen] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; msg: string; kind: 'good' | 'bad' }[]>([]);
  const [minedPass, setMinedPass] = useState<Pass | null>(null);
  const [newRank, setNewRank] = useState<Rank | null>(null);
  const [clock, setClock] = useState(new Date());
  const [pendingOpen, setPendingOpen] = useState<View | null>(null);

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
    api<Status>('/api/status').then(setStatus).catch(() => {});
    refreshMe();
    const t = setInterval(() => setClock(new Date()), 30_000);
    return () => clearInterval(t);
  }, [refreshMe]);

  // window dragging
  useEffect(() => {
    if (!drag) return;
    const move = (e: PointerEvent) => {
      setWins((w) => ({
        ...w,
        [drag.id]: {
          ...w[drag.id],
          x: Math.min(Math.max(e.clientX - drag.dx, -WINDOWS[drag.id].w + 120), window.innerWidth - 120),
          y: Math.min(Math.max(e.clientY - drag.dy, 0), window.innerHeight - 90),
        },
      }));
    };
    const up = () => setDrag(null);
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
    return () => { document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up); };
  }, [drag]);

  const focusWin = (id: View) => setWins((w) => ({ ...w, [id]: { ...w[id], z: ++zTop.current, min: false } }));

  const openWindow = useCallback((id: View) => {
    if (WINDOWS[id].authed && !me) { setPendingOpen(id); setSignInOpen(true); return; }
    playSound('open');
    setWins((w) => ({ ...w, [id]: { ...w[id], open: true, min: false, z: ++zTop.current } }));
    setStartOpen(false);
  }, [me]);

  // Open a window that was requested before sign-in, once `me` is populated.
  // Fixes the stale-closure bug where onAuthed's openWindow saw me === null.
  useEffect(() => {
    if (me && pendingOpen) {
      setWins((w) => ({ ...w, [pendingOpen]: { ...w[pendingOpen], open: true, min: false, z: ++zTop.current } }));
      setPendingOpen(null);
    }
  }, [me, pendingOpen]);

  // On logout, close employees-only windows so no stale placeholder lingers.
  useEffect(() => {
    if (!me) {
      setWins((w) => {
        const next = { ...w };
        (Object.keys(WINDOWS) as View[]).forEach((k) => { if (WINDOWS[k].authed) next[k] = { ...next[k], open: false }; });
        return next;
      });
    }
  }, [me]);

  const closeWindow = (id: View) => { playSound('close'); setWins((w) => ({ ...w, [id]: { ...w[id], open: false } })); };
  const minimizeWindow = (id: View) => { playSound('click'); setWins((w) => ({ ...w, [id]: { ...w[id], min: true } })); };

  if (!status) {
    return <div className="fixed inset-0 bliss grid place-items-center font-mono text-xs uppercase tracking-widest text-white/90">opening the office…</div>;
  }

  const ctx: AppCtx = {
    me, status, setView: openWindow, refreshMe, toast,
    celebrate: setMinedPass, rankUp: setNewRank, openSignIn: () => setSignInOpen(true),
  };

  const openList = (Object.keys(WINDOWS) as View[]).filter((k) => wins[k].open);
  const topWin = openList.filter((k) => !wins[k].min).sort((a, b) => wins[b].z - wins[a].z)[0];

  return (
    <div className="fixed inset-0 bliss overflow-hidden select-none">
      {/* desktop icons */}
      <div className="absolute inset-x-0 top-0 bottom-11 p-3 flex flex-col flex-wrap content-start gap-1 items-start">
        {DESKTOP_ICONS.map((id) => {
          const def = WINDOWS[id];
          const Icon = def.icon;
          return (
            <button key={id} className="desk-icon" onClick={() => openWindow(id)}>
              <span className="desk-icon-img"><Icon size={24} /></span>
              <span className="desk-icon-label">{def.title.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>

      {/* windows */}
      {openList.map((id) => {
        const def = WINDOWS[id];
        const st = wins[id];
        if (st.min) return null;
        return (
          <div
            key={id}
            className={`win ${topWin === id ? 'win-active' : 'win-inactive'} select-text`}
            style={{ left: st.x, top: st.y, width: def.w, height: def.h, zIndex: st.z, maxWidth: 'calc(100vw - 12px)', maxHeight: 'calc(100vh - 60px)' }}
            onPointerDown={() => focusWin(id)}
          >
            <div
              className="titlebar cursor-move"
              onPointerDown={(e) => { focusWin(id); setDrag({ id, dx: e.clientX - st.x, dy: e.clientY - st.y }); }}
            >
              <span className="font-mono tracking-wide">{def.title}</span>
              <span className="titlebar-btns" onPointerDown={(e) => e.stopPropagation()}>
                <button className="titlebar-btn" title="Minimize" onClick={() => minimizeWindow(id)} />
                <button className="titlebar-btn titlebar-btn-close" title="Close" onClick={() => closeWindow(id)} />
              </span>
            </div>
            <div className="win-body">
              {def.authed && !me ? (
                <div className="text-center py-14">
                  <div className="font-display uppercase text-sm tracking-wider">Employees only</div>
                  <button className="btn-xp mt-4" onClick={() => setSignInOpen(true)}>Clock in</button>
                </div>
              ) : (
                <>
                  {id === 'welcome' && <Overview {...ctx} />}
                  {id === 'jobs' && <Jobs {...ctx} />}
                  {id === 'registry' && <Registry {...ctx} />}
                  {id === 'payroll' && <Payroll {...ctx} />}
                  {id === 'workforce' && <Workforce {...ctx} />}
                  {id === 'desk' && me && <MyDesk {...ctx} me={me} />}
                  {id === 'shill' && me && <ShillDesk {...ctx} me={me} />}
                </>
              )}
            </div>
          </div>
        );
      })}

      {/* start menu */}
      {startOpen && (
        <div className="absolute bottom-11 left-1.5 z-50 w-64 window overflow-hidden">
          <div className="titlebar"><Monitor size={13} /> APEPLOYEE OS</div>
          <div className="bg-paper p-2 space-y-1">
            {(Object.keys(WINDOWS) as View[]).map((id) => {
              const Icon = WINDOWS[id].icon;
              return (
                <button key={id} className="w-full text-left px-2.5 py-1.5 rounded-[3px] text-sm hover:bg-xp hover:text-white flex items-center gap-2" onClick={() => openWindow(id)}>
                  <Icon size={15} /> {WINDOWS[id].title.split(' — ')[0]}
                </button>
              );
            })}
            <div className="border-t border-line pt-1 mt-1">
              {me ? (
                <button
                  className="w-full text-left px-2.5 py-1.5 rounded-[3px] text-sm hover:bg-stampred hover:text-white flex items-center gap-2"
                  onClick={async () => { await api('/api/auth/logout', { method: 'POST' }); setMe(null); setStartOpen(false); }}
                >
                  <LogOut size={15} /> Clock out (@{me.handle})
                </button>
              ) : (
                <button className="w-full text-left px-2.5 py-1.5 rounded-[3px] text-sm hover:bg-green hover:text-white flex items-center gap-2" onClick={() => { setSignInOpen(true); setStartOpen(false); }}>
                  <User size={15} /> Clock in
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* taskbar */}
      <div className="taskbar">
        <button className="start-btn" onClick={() => { playSound('click'); setStartOpen((o) => !o); }}>APE START</button>
        <div className="flex-1 flex items-center gap-1.5 overflow-x-auto">
          {openList.map((id) => (
            <button
              key={id}
              className={`task-btn ${topWin === id && !wins[id].min ? 'task-btn-active' : ''}`}
              onClick={() => (wins[id].min || topWin !== id ? focusWin(id) : minimizeWindow(id))}
            >
              {WINDOWS[id].title.split(' ')[0]}
            </button>
          ))}
        </div>
        <div className="tray shrink-0">
          {me && <span className="hidden sm:inline">@{me.handle} · {sol(me.balance)}</span>}
          <span className={status.payoutMode === 'live' ? 'text-green-grass' : 'text-white/70'}>{status.payoutMode === 'live' ? 'VAULT LIVE' : 'PRE-LAUNCH'}</span>
          <span>{clock.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      {/* sign-in */}
      {signInOpen && (
        <SignIn
          status={status}
          onClose={() => { setSignInOpen(false); setPendingOpen(null); }}
          onAuthed={(u) => { setMe(u); setSignInOpen(false); setPendingOpen((p) => p ?? 'desk'); }}
        />
      )}

      {/* mined pass */}
      {minedPass && (
        <Modal onClose={() => setMinedPass(null)}>
          <div className="window overflow-hidden">
            <div className="titlebar">MINING_REPORT.EXE<span className="titlebar-btns"><button className="titlebar-btn titlebar-btn-close" onClick={() => setMinedPass(null)} /></span></div>
            <div className="p-4 space-y-3 bg-paper">
              <div className="font-display text-center uppercase tracking-wider">Worker Pass Mined</div>
              <PassCard pass={minedPass} />
              <p className="text-sm text-ink-soft text-center">Filed to your locker. Holding it raises every future wage.</p>
              <button className="btn-xp w-full" onClick={() => setMinedPass(null)}>Back to work</button>
            </div>
          </div>
        </Modal>
      )}

      {/* promotion */}
      {newRank && (
        <Modal onClose={() => setNewRank(null)}>
          <div className="window overflow-hidden">
            <div className="titlebar">HR_NOTICE.EXE<span className="titlebar-btns"><button className="titlebar-btn titlebar-btn-close" onClick={() => setNewRank(null)} /></span></div>
            <div className="p-6 text-center space-y-4 bg-paper">
              <div className="stamp text-base">Promoted</div>
              <div className="font-display text-xl uppercase">{newRank.label}</div>
              <p className="text-sm text-ink-soft">Pay multiplier is now <span className="font-mono font-semibold text-ink">{newRank.mult}x</span>. HR has updated your file.</p>
              <button className="btn-xp w-full" onClick={() => setNewRank(null)}>Continue</button>
            </div>
          </div>
        </Modal>
      )}

      {/* toasts */}
      <div className="fixed bottom-14 right-3 z-50 space-y-2 max-w-xs">
        {toasts.map((t) => (
          <div key={t.id} className={`window overflow-hidden animate-pop`}>
            <div className={`px-3.5 py-2.5 text-sm font-medium bg-paper border-l-4 ${t.kind === 'bad' ? 'border-l-stampred' : 'border-l-green'}`}>{t.msg}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface BeginResp { verifyId: string; code: string; handle: string; tweetText: string; intent: string }

function SignIn({ status, onClose, onAuthed }: { status: Status; onClose: () => void; onAuthed: (me: Me) => void }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [handle, setHandle] = useState('');
  const [begun, setBegun] = useState<BeginResp | null>(null);
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const begin = async () => {
    setBusy(true); setError('');
    try {
      const r = await api<BeginResp>('/api/auth/verify/begin', { method: 'POST', body: JSON.stringify({ handle }) });
      setBegun(r); setStep(2);
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  };

  const confirm = async () => {
    if (!begun) return;
    setBusy(true); setError('');
    try {
      const { user } = await api<{ user: Me }>('/api/auth/verify/confirm', { method: 'POST', body: JSON.stringify({ verifyId: begun.verifyId, url }) });
      onAuthed(user);
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  };

  return (
    <Modal onClose={onClose}>
      <div className="window overflow-hidden">
        <div className="titlebar">VERIFY_X.EXE — Prove it's you<span className="titlebar-btns"><button className="titlebar-btn titlebar-btn-close" onClick={onClose} /></span></div>
        <div className="p-5 space-y-4 bg-paper">
          {status.xMode === 'oauth' && step === 1 && (
            <a className="btn-xp w-full" href="/api/auth/x/start">Continue with X (one click)</a>
          )}

          {step === 1 && (
            <div className="space-y-2">
              <p className="text-sm text-ink-soft">
                Your X account is your employee ID. We verify you really own it by having you
                post a one-time code — <b className="text-ink">no wallet connects, no passwords, no X login</b>.
              </p>
              <label className="label">Your X handle</label>
              <div className="flex gap-2">
                <input className="input font-mono" placeholder="@yourhandle" value={handle} autoFocus
                  onChange={(e) => setHandle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handle && !busy && begin()} />
                <button className="btn-xp shrink-0" onClick={begin} disabled={busy || !handle}>
                  {busy ? <Spinner light /> : 'Next'}
                </button>
              </div>
              {error && <div className="text-stampred text-sm">{error}</div>}
            </div>
          )}

          {step === 2 && begun && (
            <div className="space-y-3">
              <div className="sunken p-3 space-y-1">
                <div className="label">Step 1 — post this from @{begun.handle}</div>
                <div className="font-mono text-xs bg-paper-panel border border-line p-2 rounded-sm select-all">{begun.tweetText}</div>
                <a className="btn-xp w-full mt-1" href={begun.intent} target="_blank" rel="noreferrer">Open X to post it →</a>
              </div>
              <div className="space-y-1.5">
                <div className="label">Step 2 — paste the link to that post</div>
                <div className="flex gap-2">
                  <input className="input font-mono text-xs" placeholder="https://x.com/…/status/…" value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && url && !busy && confirm()} />
                  <button className="btn-green shrink-0" onClick={confirm} disabled={busy || !url}>
                    {busy ? <Spinner light /> : 'Verify'}
                  </button>
                </div>
              </div>
              {error && <div className="text-stampred text-sm">{error}</div>}
              <button className="label hover:text-ink" onClick={() => { setStep(1); setError(''); }}>← use a different handle</button>
            </div>
          )}

          <button className="btn-ink w-full" onClick={onClose}>Just browsing</button>
        </div>
      </div>
    </Modal>
  );
}
