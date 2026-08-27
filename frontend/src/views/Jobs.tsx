import { useEffect, useState } from 'react';
import { Briefcase, Calculator, Headphones, MessageSquare, Megaphone, Palette, TrendingUp } from 'lucide-react';
import type { AppCtx } from '../App';
import { api } from '../lib/api';
import type { Job, Pass } from '../lib/api';
import { Spinner } from '../ui';

const ROLE_ICON: Record<string, typeof Briefcase> = {
  BAG_WORKER: Briefcase,
  MEME_MAKER: Palette,
  SHILL_CAPTAIN: Megaphone,
  REPLY_GUY: MessageSquare,
  CHART_WATCHER: TrendingUp,
  VIBE_MANAGER: Headphones,
  BANANA_ACCOUNTANT: Calculator,
};

export default function Jobs({ me, refreshMe, toast, celebrate, openSignIn }: AppCtx) {
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [applying, setApplying] = useState<string | null>(null);

  const load = () => {
    // Job list needs auth for per-user status; fall back to the public shape when signed out.
    api<{ jobs: Job[] }>('/api/jobs')
      .then((r) => setJobs(r.jobs))
      .catch(() => api<{ jobs: Job[] }>('/api/jobs/public').then((r) => setJobs(r.jobs)).catch(() => setJobs([])));
  };
  useEffect(() => { load(); }, [me?.id]);

  const apply = async (job: Job) => {
    if (!me) return openSignIn();
    setApplying(job.id);
    try {
      const r = await api<{ message: string; minedPass: Pass | null }>(`/api/jobs/${job.id}/apply`, { method: 'POST', body: JSON.stringify({}) });
      toast(r.message);
      if (r.minedPass) celebrate(r.minedPass);
      await Promise.all([load(), refreshMe()]);
    } catch (e) {
      toast((e as Error).message, 'bad');
    } finally {
      setApplying(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b-2 border-ink/70 pb-3">
        <div className="label">Ape Resources · Department of Employment</div>
        <h1 className="font-display text-2xl uppercase mt-1">Open positions</h1>
        <p className="text-sm text-ink-soft mt-1">Interviews are instant. Standards are low. Bags are heavy. First hire is filed with a welcome Worker Pass.</p>
      </div>

      {!jobs ? <div className="panel-pad text-sm text-ink-soft">Posting the listings…</div> : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {jobs.map((j) => {
            const Icon = ROLE_ICON[j.role] || Briefcase;
            return (
              <div key={j.id} className="panel-pad flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <span className="p-2 rounded bg-paper-deep border border-line"><Icon size={18} /></span>
                  <span className="label">{j.hired} on staff</span>
                </div>
                <div>
                  <div className="font-display uppercase text-sm">{j.title}</div>
                  <p className="text-sm text-ink-soft mt-1.5">{j.description}</p>
                </div>
                <div className="label">Perk — {j.perk}</div>
                <div className="mt-auto pt-1">
                  {j.myStatus === 'APELOYED' ? (
                    <div className="text-center py-1"><span className="stamp">Apeloyed</span></div>
                  ) : (
                    <button className="btn-ink w-full" onClick={() => apply(j)} disabled={applying !== null}>
                      {applying === j.id ? <Spinner light /> : 'Apply'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
