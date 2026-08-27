import type { ReactNode } from 'react';
import { ExternalLink } from 'lucide-react';
import type { Pass, TierName } from './lib/api';

export function TierText({ tier, className = '' }: { tier: TierName; className?: string }) {
  return <span className={`font-mono text-[11px] uppercase tracking-[0.14em] tier-text-${tier} ${className}`}>{tier}</span>;
}

export function PassCard({ pass, owner, dense = false }: { pass: Pass; owner?: string | null; dense?: boolean }) {
  const num = String(pass.id).padStart(4, '0');
  return (
    <div className="panel overflow-hidden">
      <div className="bg-brown text-paper-panel px-2.5 py-1 flex items-center justify-between">
        <span className="font-mono text-[9px] tracking-[0.22em]">APEPLOYEE·WORKER·PASS</span>
        <span className="font-mono text-[9px]">{num}</span>
      </div>
      <div className={`h-1 tier-bg-${pass.tier}`} />
      <img src={pass.image} alt={`Worker Pass ${num}`} className="w-full aspect-square object-cover" loading="lazy" />
      <div className={dense ? 'p-2' : 'p-3'}>
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-display text-base">#{num}</span>
          <TierText tier={pass.tier} />
        </div>
        <div className="label mt-1">Pay boost +{Math.round((pass.boost - 1) * 100)}%</div>
        {owner !== undefined && (
          <div className="label mt-0.5 truncate">{owner ? `Holder @${owner}` : 'Unmined'}</div>
        )}
        {!dense && (
          pass.mintSig
            ? <a className="label mt-0.5 flex items-center gap-1 text-green hover:underline" href={`https://solscan.io/tx/${pass.mintSig}?cluster=devnet`} target="_blank" rel="noreferrer">On-chain <ExternalLink size={10} /></a>
            : <div className="label mt-0.5">Off-chain · mints at launch</div>
        )}
        <div className="barcode mt-2" />
      </div>
    </div>
  );
}

export function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="panel-pad">
      <div className="label">{label}</div>
      <div className="font-mono font-semibold text-xl md:text-2xl mt-1 tracking-tight">{value}</div>
      {sub && <div className="text-xs text-ink-soft mt-1">{sub}</div>}
    </div>
  );
}

export function Section({ title, right, children }: { title: ReactNode; right?: ReactNode; children: ReactNode }) {
  return (
    <section className="space-y-2.5">
      <div className="flex items-end justify-between gap-3 border-b-2 border-ink/70 pb-1.5">
        <h2 className="font-display text-sm uppercase tracking-wider">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}

export function Modal({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50" onClick={onClose}>
      <div className="animate-pop max-w-sm w-full max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

export function Empty({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="panel-pad text-center py-10">
      <div className="font-display uppercase text-sm tracking-wider">{title}</div>
      {hint && <div className="text-sm text-ink-soft mt-1.5">{hint}</div>}
    </div>
  );
}

export function Spinner({ light = false }: { light?: boolean }) {
  return <span className={`inline-block w-4 h-4 border-2 rounded-full animate-spin align-middle ${light ? 'border-paper/40 border-t-paper' : 'border-ink/30 border-t-ink'}`} />;
}

export function StatusTag({ status }: { status: string }) {
  const cls =
    status === 'COMPLETED' ? 'text-green border-green/50 bg-green-soft' :
    status === 'FAILED' ? 'text-stampred border-stampred/50 bg-stampred/10' :
    'text-ink-soft border-line-dark bg-paper-deep';
  const text = status === 'SIMULATED' ? 'OFF-CHAIN' : status;
  return <span className={`font-mono text-[10px] tracking-wider border rounded px-1.5 py-0.5 ${cls}`}>{text}</span>;
}
