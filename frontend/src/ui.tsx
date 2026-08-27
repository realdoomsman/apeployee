import type { ReactNode } from 'react';
import type { Pass, TierName } from './lib/api';

export function TierChip({ tier }: { tier: TierName }) {
  return (
    <span className={`chip border-current text-tier-${tier}`}>
      {tier === 'Legendary' ? '👑' : tier === 'Epic' ? '💎' : tier === 'Rare' ? '🔷' : tier === 'Uncommon' ? '🍀' : '🪪'} {tier}
    </span>
  );
}

export function PassCard({ pass, size = 'md' }: { pass: Pass; size?: 'sm' | 'md' }) {
  return (
    <div className={`card overflow-hidden tier-${pass.tier} ${size === 'sm' ? 'w-36' : ''}`}>
      <img src={pass.image} alt={`Worker Pass #${pass.id}`} className="w-full aspect-square object-cover" loading="lazy" />
      <div className={size === 'sm' ? 'p-2' : 'p-3'}>
        <div className="flex items-center justify-between gap-2">
          <span className="font-display font-bold">#{String(pass.id).padStart(3, '0')}</span>
          <TierChip tier={pass.tier} />
        </div>
        <div className="text-xs text-mute mt-1">+{Math.round((pass.boost - 1) * 100)}% pay boost</div>
      </div>
    </div>
  );
}

export function Stat({ label, value, sub, accent }: { label: string; value: ReactNode; sub?: ReactNode; accent?: boolean }) {
  return (
    <div className="card-pad">
      <div className="text-xs uppercase tracking-widest text-mute font-semibold">{label}</div>
      <div className={`stat-num mt-1 ${accent ? 'text-banana' : ''}`}>{value}</div>
      {sub && <div className="text-xs text-mute mt-1">{sub}</div>}
    </div>
  );
}

export function Section({ title, right, children }: { title: ReactNode; right?: ReactNode; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-bold">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}

export function Modal({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="animate-pop max-w-sm w-full max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

export function Empty({ emoji, title, hint }: { emoji: string; title: string; hint?: string }) {
  return (
    <div className="card-pad text-center py-10">
      <div className="text-4xl">{emoji}</div>
      <div className="font-display font-bold mt-2">{title}</div>
      {hint && <div className="text-sm text-mute mt-1">{hint}</div>}
    </div>
  );
}

export function Spinner() {
  return <span className="inline-block w-4 h-4 border-2 border-night-900/40 border-t-night-900 rounded-full animate-spin align-middle" />;
}
