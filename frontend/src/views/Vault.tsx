import { useEffect, useState } from 'react';
import type { ViewProps } from '../App';
import { api, sol } from '../lib/api';
import type { Vault as VaultData } from '../lib/api';
import { Section, Stat } from '../ui';

export default function Vault({ status }: ViewProps) {
  const [vault, setVault] = useState<VaultData | null>(null);

  useEffect(() => {
    api<VaultData>('/api/vault').then(setVault).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">🏦 The Banana Vault</h1>
        <p className="text-mute text-sm">
          Where wages come from: pump.fun creator fees sweep into the vault, the vault pays the workers. Transparent by design.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Vault mode" value={vault?.mode === 'live' ? '🟢 Live' : '🟡 Simulated'} sub={vault?.mode === 'live' ? 'signing real transfers' : 'no vault key configured'} />
        <Stat label="Vault balance" value={vault?.balance != null ? sol(vault.balance, 3) : '—'} sub={vault?.address ? `${vault.address.slice(0, 4)}…${vault.address.slice(-4)}` : 'address appears in live mode'} />
        <Stat label="Total wages paid" value={vault ? sol(vault.totalPaid, 3) : '—'} accent sub="completed + simulated payouts" />
        <Stat label="Owed to workers" value={vault ? sol(vault.totalOwed, 3) : '—'} sub="claimable balances right now" />
      </div>

      <div className="card-pad text-sm text-mute space-y-2">
        <div className="font-display font-bold text-ink">How the money flows</div>
        <ol className="list-decimal list-inside space-y-1">
          <li>Every {status.ticker} trade on pump.fun accrues <b className="text-ink">creator fees</b>.</li>
          <li>The fee sweeper claims them into the vault wallet (on-chain, signed by the creator key).</li>
          <li>Your shills earn wages by engagement × rank × pass boost — tracked here.</li>
          <li>Payouts go straight to whatever Solana address you pasted. <b className="text-ink">No wallet ever connects to this site.</b></li>
        </ol>
      </div>

      <Section title="📜 Vault ledger">
        {!vault || vault.events.length === 0 ? (
          <div className="card-pad text-mute text-sm">No vault events yet — the ledger fills as wages move.</div>
        ) : (
          <div className="card divide-y divide-line">
            {vault.events.map((e) => (
              <div key={e.id} className="p-3.5 flex items-center gap-3 text-sm">
                <span className="chip border-line text-mute shrink-0">{e.type}</span>
                <span className="flex-1 truncate text-mute">{e.note}</span>
                <span className={`font-bold shrink-0 ${e.amount >= 0 ? 'text-jungle' : 'text-red-400'}`}>
                  {e.amount >= 0 ? '+' : ''}{sol(e.amount)}
                </span>
                <span className="text-xs text-mute shrink-0">{new Date(e.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
