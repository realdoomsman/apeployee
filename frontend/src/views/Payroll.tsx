import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import type { AppCtx } from '../App';
import { api, shortAddr, sol, when } from '../lib/api';
import type { Feed, Vault } from '../lib/api';
import { Empty, Section, Stat, StatusTag } from '../ui';

export default function Payroll(_ctx: AppCtx) {
  const [vault, setVault] = useState<Vault | null>(null);
  const [feed, setFeed] = useState<Feed | null>(null);

  useEffect(() => {
    api<Vault>('/api/vault').then(setVault).catch(() => {});
    api<Feed>('/api/feed').then(setFeed).catch(() => {});
  }, []);

  return (
    <div className="space-y-5">
      <p className="text-sm text-ink-soft">
        The public payroll record. Wages come from pump.fun creator fees, land in the vault,
        and pay out to workers' pasted addresses. Every run is listed here with its proof.
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Vault" value={vault?.mode === 'live' ? 'LIVE' : 'PRE-LAUNCH'}
          sub={vault?.address
            ? <a className="font-mono text-green hover:underline inline-flex items-center gap-1" href={`https://solscan.io/account/${vault.address}${vault.mode === 'live' ? '' : '?cluster=devnet'}`} target="_blank" rel="noreferrer">{shortAddr(vault.address)} <ExternalLink size={10} /></a>
            : 'address appears once the vault key is loaded'} />
        <Stat label="Vault balance" value={vault?.balance != null ? sol(vault.balance, 3) : '—'} />
        <Stat label="Total wages paid" value={vault ? sol(vault.totalPaid, 3) : '—'} />
        <Stat label="Owed to workers" value={vault ? sol(vault.totalOwed, 3) : '—'} />
      </div>

      <Section title="Payroll runs">
        {!feed ? <div className="panel-pad text-sm text-ink-soft">Pulling records…</div> :
          feed.payments.length === 0 ? <Empty title="No payouts yet" hint="First payday pending." /> : (
            <div className="panel overflow-x-auto !bg-white">
              <table className="w-full">
                <thead><tr>
                  <th className="th">When</th><th className="th">Worker</th><th className="th">Amount</th>
                  <th className="th">Destination</th><th className="th">Status</th><th className="th">Proof</th>
                </tr></thead>
                <tbody>
                  {feed.payments.map((p) => (
                    <tr key={p.id}>
                      <td className="td font-mono text-[11px] whitespace-nowrap text-ink-soft">{when(p.createdAt)}</td>
                      <td className="td font-mono text-xs">@{p.handle}</td>
                      <td className="td font-mono text-xs whitespace-nowrap">{sol(p.amount)}</td>
                      <td className="td font-mono text-[11px]">{shortAddr(p.address)}</td>
                      <td className="td"><StatusTag status={p.status} /></td>
                      <td className="td">
                        {p.explorer
                          ? <a className="font-mono text-[11px] text-green hover:underline inline-flex items-center gap-1" href={p.explorer} target="_blank" rel="noreferrer">{p.signature!.slice(0, 8)}… <ExternalLink size={10} /></a>
                          : <span className="label">awaits chain launch</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </Section>

      <Section title="Vault ledger">
        {!vault || vault.events.length === 0 ? <Empty title="Ledger empty" hint="Entries appear as wages move." /> : (
          <div className="panel !bg-white">
            {vault.events.map((e) => (
              <div key={e.id} className="px-3 py-2 flex items-center gap-3 text-sm border-b border-line last:border-0">
                <span className="label w-24 shrink-0">{e.type}</span>
                <span className="flex-1 truncate text-ink-soft text-xs">{e.note}</span>
                <span className={`font-mono text-xs shrink-0 ${e.amount >= 0 ? 'text-green' : 'text-stampred'}`}>{e.amount >= 0 ? '+' : ''}{sol(e.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </Section>

      <div className="statusbar">
        Flow: pump.fun trade fees → creator-fee claim (signed by the creator key) → vault wallet → worker payouts. No middlemen, no wallet connections.
      </div>
    </div>
  );
}
