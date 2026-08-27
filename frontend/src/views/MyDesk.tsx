import { useEffect, useState } from 'react';
import { BadgeCheck, ExternalLink } from 'lucide-react';
import type { AppCtx } from '../App';
import { api, compact, shortAddr, sol, when } from '../lib/api';
import type { Me, Pass, Payment, Shill } from '../lib/api';
import { Empty, PassCard, Section, Spinner, Stat, StatusTag } from '../ui';

export default function MyDesk({ me, status, refreshMe, toast }: AppCtx & { me: Me }) {
  const [payments, setPayments] = useState<Payment[] | null>(null);
  const [shills, setShills] = useState<Shill[] | null>(null);
  const [passes, setPasses] = useState<Pass[] | null>(null);
  const [address, setAddress] = useState(me.payoutAddress || '');
  const [saving, setSaving] = useState(false);
  const [paying, setPaying] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const loadPasses = () => api<{ passes: Pass[] }>('/api/passes').then((r) => setPasses(r.passes)).catch(() => setPasses([]));
  useEffect(() => {
    api<{ payments: Payment[] }>('/api/payments').then((r) => setPayments(r.payments)).catch(() => setPayments([]));
    api<{ shills: Shill[] }>('/api/shills').then((r) => setShills(r.shills)).catch(() => setShills([]));
    loadPasses();
  }, [me.totalShills, me.balance, me.passCount, me.equippedPassId]);

  // Keep the address field in sync when the profile refreshes elsewhere.
  useEffect(() => { setAddress(me.payoutAddress || ''); }, [me.payoutAddress]);

  const equip = async (passId: number | null) => {
    try {
      await api('/api/me/equip', { method: 'PUT', body: JSON.stringify({ passId }) });
      await Promise.all([refreshMe(), loadPasses()]);
      toast(passId ? 'Pass equipped — boost active.' : 'Pass removed — boost off.');
    } catch (e) {
      toast((e as Error).message, 'bad');
    }
  };

  const saveAddress = async () => {
    setSaving(true);
    try {
      await api('/api/me/payout', { method: 'PUT', body: JSON.stringify({ address }) });
      await refreshMe();
      toast(address ? 'Payout address filed.' : 'Payout address cleared.');
    } catch (e) {
      toast((e as Error).message, 'bad');
    } finally {
      setSaving(false);
    }
  };

  const syncWallet = async () => {
    setSyncing(true);
    try {
      const r = await api<{ synced: number }>('/api/me/sync', { method: 'POST', body: JSON.stringify({}) });
      await Promise.all([refreshMe(), loadPasses()]);
      toast(r.synced > 0 ? `Synced — ${r.synced} pass${r.synced === 1 ? '' : 'es'} claimed from your wallet.` : 'Wallet checked — no new passes found.');
    } catch (e) {
      toast((e as Error).message, 'bad');
    } finally {
      setSyncing(false);
    }
  };

  const requestPayout = async () => {
    setPaying(true);
    try {
      const r = await api<{ payment: Payment }>('/api/payout', { method: 'POST', body: JSON.stringify({}) });
      await refreshMe();
      toast(r.payment.status === 'COMPLETED' ? `Paid ${sol(r.payment.amount)} on-chain.` : `Payout of ${sol(r.payment.amount)} recorded — settles on-chain at launch.`);
    } catch (e) {
      toast((e as Error).message, 'bad');
    } finally {
      setPaying(false);
    }
  };

  const rankPct = me.nextRank ? Math.min(100, Math.round((me.totalShills / me.nextRank.shills) * 100)) : 100;
  const minePct = Math.round((me.mine.current / me.mine.needed) * 100);

  return (
    <div className="space-y-5">
      {/* employee file header */}
      <div className="panel-pad flex items-center gap-4 flex-wrap">
        {me.topPass
          ? <img src={me.topPass.image} alt="" className="w-16 h-16 rounded-sm border border-line-dark object-cover" />
          : <span className="w-16 h-16 rounded-sm border border-line-dark bg-paper-deep" />}
        <div className="flex-1 min-w-40">
          <div className="font-display text-lg">@{me.handle} {me.verified && <BadgeCheck size={16} className="inline text-green" />}</div>
          <div className="label mt-1">
            Title: {me.rank.label} · Employee since day one · {me.verified ? 'X verified' : 'verification at launch'}
          </div>
          <div className="label mt-0.5">Positions: {me.jobs?.length ? me.jobs.map((j) => j.title).join(', ') : 'unemployed — visit JOBS.EXE'}</div>
        </div>
        {(me.jobs?.length ?? 0) > 0
          ? <span className="stamp">Apeloyed</span>
          : <span className="stamp !text-ink-soft !border-ink-soft">Unhired</span>}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Claimable balance" value={sol(me.balance)} />
        <Stat label="Lifetime wages" value={sol(me.lifetimeEarned)} />
        <Stat label="Shifts clocked" value={me.totalShills} />
        <Stat label="Pay multiplier" value={`${(me.rank.mult * me.nftBoost).toFixed(2)}x`} sub={`${me.rank.mult}x rank × ${me.nftBoost.toFixed(2)}x passes`} />
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div className="panel-pad space-y-2">
          <div className="flex justify-between text-xs font-semibold">
            <span>{me.rank.label}</span>
            {me.nextRank ? <span className="text-ink-soft font-mono">{me.totalShills}/{me.nextRank.shills} to {me.nextRank.label}</span> : <span className="text-green">MAX RANK</span>}
          </div>
          <div className="bar-track"><div className="bar-fill" style={{ width: `${rankPct}%` }} /></div>
        </div>
        <div className="panel-pad space-y-2">
          <div className="flex justify-between text-xs font-semibold">
            <span>Next Worker Pass</span>
            <span className="text-ink-soft font-mono">{me.mine.current}/{me.mine.needed} shifts</span>
          </div>
          <div className="bar-track"><div className="bar-fill" style={{ width: `${minePct}%` }} /></div>
        </div>
      </div>

      <Section title="Payroll settings" right={
        <button className="btn-green" onClick={requestPayout} disabled={paying || me.balance < (status.minPayout ?? 5_000_000) || !me.payoutAddress} title={!me.payoutAddress ? 'Add a payout address first' : ''}>
          {paying ? <Spinner light /> : `Request payout (${sol(me.balance)})`}
        </button>
      }>
        <div className="panel-pad space-y-2">
          <div className="label">Payout address — wages are sent here. Paste it; nothing ever connects.</div>
          <div className="flex gap-2 flex-wrap">
            <input className="input font-mono text-xs flex-1 min-w-52" placeholder="your Solana address" value={address} onChange={(e) => setAddress(e.target.value)} />
            <button className="btn-ink" onClick={saveAddress} disabled={saving}>{saving ? <Spinner /> : 'File address'}</button>
            <button className="btn-line" onClick={syncWallet} disabled={syncing || !me.payoutAddress} title={!me.payoutAddress ? 'File a payout address first' : 'Check the chain for passes this wallet holds'}>
              {syncing ? <Spinner /> : 'Sync wallet'}
            </button>
          </div>
          <div className="label">Minimum payout {((status.minPayout ?? 5_000_000) / 1e9)} SOL{status.autopay ? ' · PAYDAY every 10 min: the vault pool is split across active workers — your cut = your shifts × the pass you are wearing' : ''}{status.payoutMode !== 'live' ? ' · settles on-chain at launch' : ''}</div>
          <div className="label">Bought a Worker Pass on Magic Eden or Tensor? File that wallet above, hit Sync — the pass and its boost become yours.</div>
        </div>
      </Section>

      <Section title="Payment history">
        {!payments ? <div className="panel-pad text-sm text-ink-soft">Loading…</div> :
          payments.length === 0 ? <Empty title="No payouts yet" hint="Clock shifts, then hit Request payout." /> : (
            <div className="panel overflow-x-auto !bg-white">
              <table className="w-full">
                <thead><tr><th className="th">When</th><th className="th">Amount</th><th className="th">Destination</th><th className="th">Status</th><th className="th">Proof</th></tr></thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <td className="td font-mono text-[11px] text-ink-soft whitespace-nowrap">{when(p.createdAt)}</td>
                      <td className="td font-mono text-xs whitespace-nowrap">{sol(p.amount)}</td>
                      <td className="td font-mono text-[11px]">{shortAddr(p.address)}</td>
                      <td className="td"><StatusTag status={p.status} /></td>
                      <td className="td">
                        {p.signature
                          ? <a className="font-mono text-[11px] text-green hover:underline inline-flex items-center gap-1" href={`https://solscan.io/tx/${p.signature}`} target="_blank" rel="noreferrer">{p.signature.slice(0, 8)}… <ExternalLink size={10} /></a>
                          : <span className="label">off-chain record</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </Section>

      <Section title={`My passes (${passes?.length ?? '…'})`} right={<span className="label">Wear one to earn its boost</span>}>
        {!passes ? <div className="panel-pad text-sm text-ink-soft">Opening locker…</div> :
          passes.length === 0 ? <Empty title="Locker empty" hint={`Every ${me.mine.needed} shifts mines a pass automatically.`} /> : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {passes.map((p) => (
                <div key={p.id} className="space-y-1.5">
                  <PassCard pass={p} />
                  {p.equipped
                    ? <button className="btn-green w-full text-xs" onClick={() => equip(null)}>★ Wearing — take off</button>
                    : <button className="btn-line w-full text-xs" onClick={() => equip(p.id)}>Wear (+{Math.round((p.boost - 1) * 100)}%)</button>}
                </div>
              ))}
            </div>
          )}
      </Section>

      <Section title="Recent shifts">
        {!shills ? <div className="panel-pad text-sm text-ink-soft">Loading…</div> :
          shills.length === 0 ? <Empty title="No shifts filed" hint="Open SHILL_DESK.EXE and clock your first post." /> : (
            <div className="panel !bg-white">
              {shills.slice(0, 6).map((s) => (
                <div key={s.id} className="px-3 py-2.5 flex items-center gap-3 border-b border-line last:border-0">
                  <a className="flex-1 min-w-0 text-sm truncate hover:underline" href={`https://x.com/i/web/status/${s.tweetId}`} target="_blank" rel="noreferrer">{s.text || `post ${s.tweetId}`}</a>
                  <span className="label shrink-0">{compact(s.likes)} likes · {compact(s.views)} views</span>
                  <span className="font-mono text-xs text-green shrink-0">+{sol(s.earned)}</span>
                </div>
              ))}
            </div>
          )}
      </Section>
    </div>
  );
}
