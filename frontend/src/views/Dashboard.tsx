import { useEffect, useState } from 'react';
import type { ViewProps } from '../App';
import { api, sol, compact } from '../lib/api';
import type { Payment, Shill } from '../lib/api';
import { Empty, Section, Spinner, Stat } from '../ui';

export default function Dashboard({ me, status, refreshMe, toast }: ViewProps) {
  const [shills, setShills] = useState<Shill[] | null>(null);
  const [payments, setPayments] = useState<Payment[] | null>(null);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    api<{ shills: Shill[] }>('/api/shills').then((r) => setShills(r.shills)).catch(() => setShills([]));
    api<{ payments: Payment[] }>('/api/payments').then((r) => setPayments(r.payments)).catch(() => setPayments([]));
  }, [me.totalShills, me.balance]);

  const requestPayout = async () => {
    setPaying(true);
    try {
      const r = await api<{ payment: Payment }>('/api/payout', { method: 'POST', body: JSON.stringify({}) });
      await refreshMe();
      toast(r.payment.status === 'COMPLETED'
        ? `Paid ${sol(r.payment.amount)} on-chain 💸`
        : `Payout recorded (${sol(r.payment.amount)}) — simulated, no vault key yet`);
    } catch (e) {
      toast((e as Error).message, 'bad');
    } finally {
      setPaying(false);
    }
  };

  const rankPct = me.nextRank
    ? Math.min(100, Math.round((me.totalShills / me.nextRank.shills) * 100))
    : 100;
  const minePct = Math.round((me.mine.current / me.mine.needed) * 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">gm, @{me.handle} {me.rank.emoji}</h1>
          <p className="text-mute text-sm">Your shift report. The bags aren't going to shill themselves.</p>
        </div>
        {me.jobs && me.jobs.length > 0 && (
          <div className="chip border-banana/50 text-banana bg-banana/10">
            {me.jobs[0].emoji} {me.jobs[0].title} — APELOYED
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Claimable balance" value={sol(me.balance)} accent sub="wages ready to pay out" />
        <Stat label="Lifetime earned" value={sol(me.lifetimeEarned)} sub="since you got apeloyed" />
        <Stat label="Shills clocked" value={me.totalShills} sub={`${status.dailyShillCap}/day cap`} />
        <Stat label="Pay multiplier" value={`${(me.rank.mult * me.nftBoost).toFixed(2)}x`} sub={`${me.rank.mult}x rank · ${me.nftBoost.toFixed(2)}x passes`} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card-pad space-y-3">
          <div className="flex justify-between text-sm font-semibold">
            <span>{me.rank.emoji} {me.rank.label}</span>
            {me.nextRank
              ? <span className="text-mute">{me.totalShills}/{me.nextRank.shills} shills to {me.nextRank.emoji} {me.nextRank.label}</span>
              : <span className="text-banana">MAX RANK — the jungle bows to you</span>}
          </div>
          <div className="progress-track"><div className="progress-fill" style={{ width: `${rankPct}%` }} /></div>
        </div>
        <div className="card-pad space-y-3">
          <div className="flex justify-between text-sm font-semibold">
            <span>⛏️ Next Worker Pass</span>
            <span className="text-mute">{me.mine.current}/{me.mine.needed} — {me.mine.remaining} shill{me.mine.remaining === 1 ? '' : 's'} to go</span>
          </div>
          <div className="progress-track"><div className="progress-fill" style={{ width: `${minePct}%` }} /></div>
        </div>
      </div>

      <Section
        title="💸 Payday"
        right={<button className="btn-primary" onClick={requestPayout} disabled={paying || me.balance < 5_000_000}>
          {paying ? <Spinner /> : `Request payout (${sol(me.balance)})`}
        </button>}
      >
        <div className="card-pad text-sm text-mute space-y-1.5">
          {!me.payoutAddress && <div className="text-banana font-semibold">Set a payout address first (click your avatar, top right). No wallet connection — just paste where the SOL should go.</div>}
          <div>Minimum payout 0.005 SOL{status.autopay ? ' · auto-pay runs daily' : ''}. {status.payoutMode === 'simulated' && 'Payouts are currently simulated (no vault key configured).'}</div>
          {payments && payments.length > 0 && (
            <div className="pt-2 space-y-1">
              {payments.slice(0, 5).map((p) => (
                <div key={p.id} className="flex justify-between gap-2 border-t border-line pt-1.5">
                  <span className="font-mono text-xs truncate">{p.address.slice(0, 4)}…{p.address.slice(-4)}</span>
                  <span className={`text-xs font-bold ${p.status === 'COMPLETED' ? 'text-jungle' : p.status === 'FAILED' ? 'text-red-400' : 'text-banana'}`}>{p.status}</span>
                  <span className="text-xs">{sol(p.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Section>

      <Section title="🧾 Recent shifts">
        {!shills ? <div className="card-pad text-mute text-sm">loading…</div> :
          shills.length === 0 ? <Empty emoji="🍃" title="No shills yet" hint="Head to the Shill Desk and clock your first post." /> : (
            <div className="card divide-y divide-line">
              {shills.slice(0, 6).map((s) => (
                <div key={s.id} className="p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{s.text || `post ${s.tweetId}`}</div>
                    <div className="text-xs text-mute mt-0.5">
                      ❤️ {compact(s.likes)} · 🔁 {compact(s.retweets)} · 👁 {compact(s.views)}
                      {s.simulated && <span className="text-banana"> · simulated</span>}
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
