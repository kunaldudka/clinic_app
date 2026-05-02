import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import type { DashboardData } from '../types';
import { format, parseISO } from 'date-fns';

function StatCard({ label, value, icon, gradient, iconBg }: {
  label: string; value: number; icon: React.ReactNode; gradient: string; iconBg: string;
}) {
  return (
    <div
      className="rounded-2xl p-5 text-white relative overflow-hidden"
      style={{ background: gradient, boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{label}</p>
          <p className="text-3xl font-bold mt-1">{value.toLocaleString()}</p>
        </div>
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: iconBg }}
        >
          {icon}
        </div>
      </div>
      {/* subtle decorative circle */}
      <div
        className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full pointer-events-none"
        style={{ background: 'rgba(255,255,255,0.08)' }}
      />
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/stats')
      .then(res => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Patients"
          value={data?.stats.totalPatients ?? 0}
          gradient="linear-gradient(135deg, #1a3668 0%, #2563eb 100%)"
          iconBg="rgba(255,255,255,0.18)"
          icon={
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
        <StatCard
          label="Today's Visits"
          value={data?.stats.todayVisits ?? 0}
          gradient="linear-gradient(135deg, #0369a1 0%, #0ea5e9 100%)"
          iconBg="rgba(255,255,255,0.18)"
          icon={
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
        <StatCard
          label="This Month"
          value={data?.stats.thisMonthVisits ?? 0}
          gradient="linear-gradient(135deg, #065f46 0%, #10b981 100%)"
          iconBg="rgba(255,255,255,0.18)"
          icon={
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />
        <StatCard
          label="Total Visits"
          value={data?.stats.totalVisits ?? 0}
          gradient="linear-gradient(135deg, #92400e 0%, #f59e0b 100%)"
          iconBg="rgba(255,255,255,0.18)"
          icon={
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Patients */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-700">Recent Patients</h2>
            <Link to="/patients" className="text-xs text-blue-600 hover:text-blue-700 font-semibold">View all →</Link>
          </div>
          <div className="divide-y divide-slate-100">
            {data?.recentPatients.length === 0 && (
              <p className="px-5 py-8 text-center text-sm text-slate-400">No patients yet</p>
            )}
            {data?.recentPatients.map(p => (
              <Link
                key={p.id}
                to={`/patients/${p.id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-blue-50/60 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-blue-600">
                      {p.full_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{p.full_name}</p>
                    <p className="text-xs text-slate-400 font-mono">{p.patient_id}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`badge ${p.gender === 'male' ? 'badge-blue' : p.gender === 'female' ? 'badge-red' : 'badge-gray'}`}>
                    {p.gender ?? 'N/A'}
                  </span>
                  <p className="text-xs text-slate-400 mt-1">{p.visit_count} visit{p.visit_count !== 1 ? 's' : ''}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Upcoming Follow-ups */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-700">Upcoming Follow-ups (7 days)</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {data?.upcomingFollowups.length === 0 && (
              <p className="px-5 py-8 text-center text-sm text-slate-400">No upcoming follow-ups</p>
            )}
            {data?.upcomingFollowups.map(f => (
              <Link
                key={f.visit_id}
                to={`/patients/${f.patient_id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-amber-50/60 transition-colors"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-800">{f.patient_name}</p>
                  <p className="text-xs text-slate-400">{f.patient_uid} · {f.contact_number ?? '—'}</p>
                </div>
                <div className="text-right">
                  <span className="badge badge-yellow">
                    {format(parseISO(f.follow_up_date), 'dd MMM')}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card p-5">
        <h2 className="text-sm font-bold text-slate-700 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link to="/patients/new" className="btn-primary btn-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Register Patient
          </Link>
          <Link to="/patients" className="btn-secondary btn-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Search Patients
          </Link>
        </div>
      </div>
    </div>
  );
}
