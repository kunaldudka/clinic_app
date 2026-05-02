import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api';
import type { Patient, PaginatedResponse } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { format, parseISO } from 'date-fns';

export default function PatientList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState('created_at');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<PaginatedResponse<Patient>>('/patients', {
        params: { search, page, limit: 15, sortBy, order },
      });
      setPatients(res.data.patients);
      setTotalPages(res.data.pagination.totalPages);
      setTotal(res.data.pagination.total);
    } finally {
      setLoading(false);
    }
  }, [search, page, sortBy, order]);

  useEffect(() => {
    const t = setTimeout(fetchPatients, 300);
    return () => clearTimeout(t);
  }, [fetchPatients]);

  const handleSort = (field: string) => {
    if (sortBy === field) setOrder(o => o === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setOrder('asc'); }
    setPage(1);
  };

  const handleDelete = async (id: number) => {
    await api.delete(`/patients/${id}`);
    setDeleteId(null);
    fetchPatients();
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) return <span className="text-slate-300 ml-1">↕</span>;
    return <span className="text-blue-600 ml-1">{order === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            className="input pl-9"
            placeholder="Search by name, ID, or phone..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <Link to="/patients/new" className="btn-primary flex-shrink-0">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Patient
        </Link>
      </div>

      {/* Summary */}
      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
        <span>{total} patient{total !== 1 ? 's' : ''} found</span>
        {search && <span>· matching "<span className="text-slate-700 font-semibold">{search}</span>"</span>}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide cursor-pointer select-none"
                    onClick={() => handleSort('patient_id')}>
                  Patient ID <SortIcon field="patient_id" />
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide cursor-pointer select-none"
                    onClick={() => handleSort('full_name')}>
                  Name <SortIcon field="full_name" />
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Gender</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide cursor-pointer select-none"
                    onClick={() => handleSort('date_of_birth')}>
                  DOB <SortIcon field="date_of_birth" />
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Phone</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Guardian</th>
                <th className="text-center px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Visits</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide cursor-pointer select-none"
                    onClick={() => handleSort('created_at')}>
                  Registered <SortIcon field="created_at" />
                </th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr><td colSpan={9} className="text-center py-12 text-slate-400">
                  <div className="flex justify-center">
                    <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full" />
                  </div>
                </td></tr>
              )}
              {!loading && patients.length === 0 && (
                <tr><td colSpan={9} className="text-center py-12 text-slate-400">
                  {search ? 'No patients match your search' : 'No patients registered yet'}
                </td></tr>
              )}
              {!loading && patients.map(p => (
                <tr key={p.id} className="table-row-hover" onClick={() => navigate(`/patients/${p.id}`)}>
                  <td className="px-4 py-3 font-mono text-xs text-blue-600 font-semibold">{p.patient_id}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-blue-600">{p.full_name.charAt(0)}</span>
                      </div>
                      <span className="font-semibold text-slate-800">{p.full_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {p.gender ? (
                      <span className={`badge ${p.gender === 'male' ? 'badge-blue' : p.gender === 'female' ? 'badge-red' : 'badge-gray'}`}>
                        {p.gender}
                      </span>
                    ) : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {p.date_of_birth ? format(parseISO(p.date_of_birth), 'dd MMM yyyy') : '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{p.contact_number ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{p.guardian_name ?? '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="badge badge-blue">{p.visit_count ?? 0}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {format(parseISO(p.created_at), 'dd MMM yyyy')}
                  </td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      <Link to={`/patients/${p.id}`} className="btn-ghost btn-sm p-1.5 text-slate-500 hover:text-blue-600">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </Link>
                      <Link to={`/patients/${p.id}/edit`} className="btn-ghost btn-sm p-1.5 text-slate-500 hover:text-blue-600">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </Link>
                      {user?.role === 'doctor' && (
                        <button
                          className="btn-ghost btn-sm p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => setDeleteId(p.id)}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <p className="text-xs text-slate-500 font-medium">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                className="btn-secondary btn-sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >← Prev</button>
              <button
                className="btn-secondary btn-sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >Next →</button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirm Modal */}
      {deleteId !== null && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-base font-bold text-slate-800 mb-2">Archive Patient?</h3>
            <p className="text-sm text-slate-500 mb-5">
              The patient record will be archived. All existing data is retained.
            </p>
            <div className="flex gap-3 justify-end">
              <button className="btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn-danger" onClick={() => handleDelete(deleteId)}>Archive</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
