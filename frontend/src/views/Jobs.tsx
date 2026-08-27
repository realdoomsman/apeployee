import { useEffect, useState } from 'react';
import type { ViewProps } from '../App';
import { api } from '../lib/api';
import type { Job, Pass } from '../lib/api';
import { Spinner } from '../ui';

export default function Jobs({ refreshMe, toast, celebrate }: ViewProps) {
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [applying, setApplying] = useState<string | null>(null);

  const load = () => api<{ jobs: Job[] }>('/api/jobs').then((r) => setJobs(r.jobs)).catch(() => setJobs([]));
  useEffect(() => { load(); }, []);

  const apply = async (job: Job) => {
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
      <div>
        <h1 className="font-display text-2xl font-bold">🧑‍💼 Ape Resources — open positions</h1>
        <p className="text-mute text-sm">Interviews are instant. Standards are low. Bags are heavy. Your first job comes with a welcome Worker Pass.</p>
      </div>

      {!jobs ? <div className="card-pad text-mute text-sm">loading job board…</div> : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map((j) => (
            <div key={j.id} className="card-pad flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <span className="text-4xl">{j.emoji}</span>
                <span className="chip border-line text-mute">{j.hired} hired</span>
              </div>
              <div>
                <div className="font-display font-bold text-lg">{j.title}</div>
                <p className="text-sm text-mute mt-1">{j.description}</p>
              </div>
              <div className="text-xs text-jungle font-semibold">🍌 Perk: {j.perk}</div>
              <div className="mt-auto pt-1">
                {j.myStatus === 'APELOYED' ? (
                  <div className="btn w-full bg-jungle/15 text-jungle border border-jungle/50 cursor-default">✅ APELOYED</div>
                ) : (
                  <button className="btn-primary w-full" onClick={() => apply(j)} disabled={applying !== null}>
                    {applying === j.id ? <Spinner /> : 'Apply now'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
