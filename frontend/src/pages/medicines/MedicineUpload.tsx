import { useState, useRef, useEffect, useCallback } from 'react';
import api from '../../api';
import type { Medicine, MedicineListResponse } from '../../types';

interface UploadResult {
  inserted: number;
  updated: number;
  skipped: number;
  total: number;
}

export default function MedicineUpload() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [uploadError, setUploadError] = useState('');

  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loadingList, setLoadingList] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const fetchMedicines = useCallback(async (p = page, s = search) => {
    setLoadingList(true);
    try {
      const res = await api.get<MedicineListResponse>('/medicines', {
        params: { page: p, search: s || undefined },
      });
      setMedicines(res.data.medicines);
      setTotal(res.data.total);
    } catch {
      // silently fail — list will show empty
    } finally {
      setLoadingList(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchMedicines(page, search);
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      fetchMedicines(1, search);
    }, 350);
    return () => clearTimeout(t);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setSelectedFile(f);
    setUploadResult(null);
    setUploadError('');
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setUploadError('');
    setUploadResult(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await api.post<UploadResult>('/medicines/upload', formData);
      setUploadResult(res.data);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setPage(1);
      fetchMedicines(1, search);
    } catch (err: any) {
      setUploadError(err.response?.data?.error || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/medicines/${id}`);
      setDeleteConfirm(null);
      fetchMedicines(page, search);
    } catch {
      // no-op
    }
  };

  const handleDownloadTemplate = () => {
    const token = localStorage.getItem('token');
    const url = `${(api.defaults.baseURL ?? '/api')}/medicines/template`;
    // Create a temporary anchor to trigger download with auth header via fetch
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'medicines_template.xlsx';
        a.click();
        URL.revokeObjectURL(a.href);
      });
  };

  const totalPages = Math.ceil(total / 50);

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)' }}
        >
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-800">Medicines Master</h1>
          <p className="text-xs text-slate-500">Upload Excel to manage medicines used in prescriptions</p>
        </div>
      </div>

      {/* Upload Card */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-700">Upload Excel File</h2>
          <button
            onClick={handleDownloadTemplate}
            className="btn-secondary btn-sm gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Template
          </button>
        </div>

        <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 text-xs text-sky-700 space-y-1">
          <p className="font-semibold">Excel format: columns <code className="bg-sky-100 px-1 rounded">name</code> (required), <code className="bg-sky-100 px-1 rounded">description</code>, <code className="bg-sky-100 px-1 rounded">dosage</code></p>
          <p>Re-uploading will update existing medicines by name, and add new ones. No data is deleted.</p>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex-1">
            <div
              className={`border-2 border-dashed rounded-xl px-4 py-3 flex items-center gap-3 cursor-pointer transition-colors ${
                selectedFile
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/40'
              }`}
            >
              <svg className="w-5 h-5 flex-shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className={`text-sm truncate ${selectedFile ? 'text-blue-700 font-medium' : 'text-slate-400'}`}>
                {selectedFile ? selectedFile.name : 'Choose .xlsx or .xls file...'}
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="sr-only"
                onChange={handleFileChange}
              />
            </div>
          </label>

          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="btn-primary flex-shrink-0"
          >
            {uploading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Uploading...
              </span>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Upload
              </>
            )}
          </button>
        </div>

        {uploadError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {uploadError}
          </div>
        )}

        {uploadResult && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800 space-y-1">
            <p className="font-semibold">Upload successful!</p>
            <div className="flex gap-4 text-xs">
              <span className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                {uploadResult.inserted} added
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
                {uploadResult.updated} updated
              </span>
              {uploadResult.skipped > 0 && (
                <span className="flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-slate-400"></span>
                  {uploadResult.skipped} skipped (blank rows)
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Medicines List */}
      <div className="card p-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <h2 className="text-sm font-bold text-slate-700">
            Medicines List
            {total > 0 && <span className="ml-2 text-xs font-normal text-slate-400">({total} total)</span>}
          </h2>
          <div className="relative w-56">
            <svg className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              className="input pl-8 text-xs py-1.5 h-8"
              placeholder="Search medicines..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loadingList ? (
          <div className="flex justify-center py-8">
            <svg className="animate-spin h-6 w-6 text-blue-400" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
        ) : medicines.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <svg className="w-10 h-10 mx-auto mb-2 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            <p className="text-sm font-medium">No medicines yet</p>
            <p className="text-xs mt-1">Upload an Excel file to populate the list</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left text-xs font-semibold text-slate-500 pb-2 pr-4">Name</th>
                    <th className="text-left text-xs font-semibold text-slate-500 pb-2 pr-4">Description</th>
                    <th className="text-left text-xs font-semibold text-slate-500 pb-2 pr-4">Default Dosage</th>
                    <th className="text-right text-xs font-semibold text-slate-500 pb-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {medicines.map(med => (
                    <tr key={med.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 pr-4 font-medium text-slate-800">{med.name}</td>
                      <td className="py-2.5 pr-4 text-slate-500 text-xs max-w-xs truncate">{med.description || '—'}</td>
                      <td className="py-2.5 pr-4 text-slate-500 text-xs">{med.dosage || '—'}</td>
                      <td className="py-2.5 text-right">
                        {deleteConfirm === med.id ? (
                          <span className="inline-flex items-center gap-1.5">
                            <span className="text-xs text-slate-500">Delete?</span>
                            <button
                              onClick={() => handleDelete(med.id)}
                              className="text-xs font-semibold text-red-600 hover:text-red-700"
                            >Yes</button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="text-xs font-semibold text-slate-400 hover:text-slate-600"
                            >No</button>
                          </span>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(med.id)}
                            className="text-xs text-slate-300 hover:text-red-500 transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                <span className="text-xs text-slate-400">
                  Page {page} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="btn-secondary btn-sm disabled:opacity-40"
                  >Prev</button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="btn-secondary btn-sm disabled:opacity-40"
                  >Next</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
