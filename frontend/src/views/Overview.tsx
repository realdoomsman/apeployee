import { useEffect, useState } from 'react';
import { ArrowRight, BadgeCheck, ExternalLink, FileText, Pickaxe, Banknote } from 'lucide-react';
import type { AppCtx } from '../App';
import { api, compact, sol, when } from '../lib/api';
import type { Feed, Stats } from '../lib/api';
import { Section, StatusTag } from '../ui';

const HERO_PASSES = [263, 61, 777, 42];
const SAMPLE_ROW = [7, 88, 133, 301, 404, 555, 678, 999];
const img = (id: number) => `/nft/images/${String(id).padStart(3, '0')}.png`;

export default function Overview({ me, status, setView, openSignIn }: AppCtx) {
  const [feed, setFeed] = useState<Feed | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    api<Feed>('/api/feed').then(setFeed).catch(() => {});
    api<Stats>('/api/stats').then(setStats).catch(() => {});
  }, []);

  return (
    <div className="space-y-8">
      {/* ticker strip */}
      <div className="panel px-4 py-2 flex flex-wrap gap-x-8 gap-y-1 font-mono text-[11px] uppercase tracking-wider">
        <span>Wages paid <b>{stats ? sol(stats.totalPaid, 2) : '—'}</b></span>
        <span>Owed to workers <b>{stats ? sol(stats.totalOwed, 2) : '—'}</b></span>
        <span>Passes mined <b>{stats ? `${stats.mined}/${stats.totalPasses}` : '—'}</b></span>
        <span>Workers on payroll <b>{stats?.workers ?? '—'}</b></span>
        <span className={status.payoutMode === 'live' ? 'text-green' : 'text-ink-soft'}>Vault {status.payoutMode === 'live' ? 'live' : 'pre-launch'}</span>
      </div>

      {/* hero */}
      <div className="grid lg:grid-cols-[1.15fr_1fr] gap-8 items-start">
        <div className="space-y-5">
          <div className="label">Employment bulletin · now hiring</div>
          <h1 className="font-display text-3xl md:text-4xl leading-[1.05] uppercase">
            The market is<br /><span className="text-green">waking up.</span><br />Everybody eats.
          </h1>
          <p className="text-ink-soft max-w-lg">
            New money is flooding into the space — and fresh traders need a bankroll to start.
            APEPLOYEE is the memecoin that <b className="text-ink">hires you to bring them in</b>:
            take a job, post about {status.ticker} on X, and earn SOL wages from creator fees.
            More traders, more fees, bigger bags. Win-win for the whole troop.
          </p>
          <ul className="space-y-2 text-sm max-w-lg">
            <li className="flex gap-2.5"><BadgeCheck className="text-green shrink-0 mt-0.5" size={16} /><span><b>No wallet connect, ever.</b> Your X account is your employee ID; wages go to whatever address you paste.</span></li>
            <li className="flex gap-2.5"><Pickaxe className="text-green shrink-0 mt-0.5" size={16} /><span>Every {status.mineEvery} shifts mines a Worker Pass from the 1000-piece registry — <b>wear one</b> to boost your pay up to 1.5x.</span></li>
            <li className="flex gap-2.5"><Banknote className="text-green shrink-0 mt-0.5" size={16} /><span>Public payroll: every payment is listed with its destination and transaction proof.</span></li>
          </ul>
          <div className="flex gap-3 flex-wrap">
            {me
              ? <button className="btn-ink" onClick={() => setView('shill')}>Go to your desk <ArrowRight size={15} /></button>
              : <button className="btn-ink" onClick={openSignIn}>Clock in — get hired</button>}
            <button className="btn-line" onClick={() => setView('payroll')}>Inspect the payroll</button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {HERO_PASSES.map((id) => (
            <div key={id} className="panel overflow-hidden">
              <div className="bg-brown text-paper-panel px-2 py-0.5 font-mono text-[8px] tracking-[0.2em]">APEPLOYEE·WORKER·PASS</div>
              <img src={img(id)} alt="Worker Pass" className="w-full aspect-square object-cover" />
            </div>
          ))}
        </div>
      </div>

      {/* how it works */}
      <Section title="How employment works">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            ['01', 'Apply', 'Pick one of 7 positions. Interviews are instant; your first job files a welcome Worker Pass.'],
            ['02', 'Shill', `Post about ${status.ticker} on X and submit the link. The office verifies the author and the mention.`],
            ['03', 'Mine', `Every ${status.mineEvery} verified shifts mines a numbered pass. Rarer tiers pay bigger boosts.`],
            ['04', 'Payday', 'Wages accrue per engagement × rank × pass boost, and pay out to your pasted address.'],
          ].map(([n, t, d]) => (
            <div key={n} className="panel-pad">
              <div className="font-mono text-ink-soft text-xs">{n}</div>
              <div className="font-display uppercase text-sm mt-1">{t}</div>
              <p className="text-sm text-ink-soft mt-1.5">{d}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* live records */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Section title="Latest shift records" right={<button className="label hover:text-ink" onClick={() => setView('workforce')}>Full workforce</button>}>
          <RecordsShills feed={feed} />
        </Section>
        <Section title="Latest payroll runs" right={<button className="label hover:text-ink" onClick={() => setView('payroll')}>Full payroll</button>}>
          <RecordsPayments feed={feed} />
        </Section>
      </div>

      {/* registry sample */}
      <Section title="Worker Pass registry" right={<button className="label hover:text-ink" onClick={() => setView('registry')}>Browse all 1000</button>}>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {SAMPLE_ROW.map((id) => (
            <button key={id} onClick={() => setView('registry')} className="panel overflow-hidden hover:border-ink transition-colors">
              <img src={img(id)} alt="" className="w-full aspect-square object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      </Section>
    </div>
  );
}

function RecordsShills({ feed }: { feed: Feed | null }) {
  if (!feed) return <div className="panel-pad text-sm text-ink-soft">Loading records…</div>;
  if (feed.shills.length === 0) return <div className="panel-pad text-sm text-ink-soft">No shifts filed yet. The clock is running.</div>;
  return (
    <div className="panel overflow-x-auto">
      <table className="w-full">
        <thead><tr><th className="th">Worker</th><th className="th">Post</th><th className="th text-right">Wage</th></tr></thead>
        <tbody>
          {feed.shills.slice(0, 6).map((s) => (
            <tr key={s.id}>
              <td className="td font-mono text-xs">@{s.handle}{s.verified && <BadgeCheck className="inline ml-1 text-green" size={12} />}</td>
              <td className="td">
                <a className="inline-flex items-center gap-1 text-sm hover:underline" href={s.url} target="_blank" rel="noreferrer">
                  <FileText size={13} className="text-ink-soft" /> {compact(s.likes)} likes · {compact(s.views)} views <ExternalLink size={11} className="text-ink-soft" />
                </a>
                {s.simulated && <span className="label ml-1.5">unverified</span>}
              </td>
              <td className="td font-mono text-xs text-right whitespace-nowrap">{sol(s.earned)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RecordsPayments({ feed }: { feed: Feed | null }) {
  if (!feed) return <div className="panel-pad text-sm text-ink-soft">Loading records…</div>;
  if (feed.payments.length === 0) return <div className="panel-pad text-sm text-ink-soft">No payouts yet. First payday pending.</div>;
  return (
    <div className="panel overflow-x-auto">
      <table className="w-full">
        <thead><tr><th className="th">Worker</th><th className="th">Amount</th><th className="th">Status</th><th className="th text-right">When</th></tr></thead>
        <tbody>
          {feed.payments.slice(0, 6).map((p) => (
            <tr key={p.id}>
              <td className="td font-mono text-xs">@{p.handle}</td>
              <td className="td font-mono text-xs whitespace-nowrap">{sol(p.amount)}</td>
              <td className="td">
                <StatusTag status={p.status} />
                {p.explorer && (
                  <a className="label ml-1.5 text-green hover:underline inline-flex items-center gap-0.5" href={p.explorer} target="_blank" rel="noreferrer">tx <ExternalLink size={10} /></a>
                )}
              </td>
              <td className="td font-mono text-[11px] text-right whitespace-nowrap text-ink-soft">{when(p.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
