import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import api from '../../api';
import type { PrescriptionItem, Medicine } from '../../types';

interface PrescriptionFormData {
  notes: string;
  investigations: string;
  items: PrescriptionItem[];
}

const emptyItem = (): PrescriptionItem => ({
  medicine_name: '',
  dosage: '',
  frequency: '',
  duration: '',
  special_instructions: '',
});

const FREQUENCY_OPTIONS = [
  'Once daily', 'Twice daily', 'Three times daily', 'Four times daily',
  'Every 4 hours', 'Every 6 hours', 'Every 8 hours',
  'Once at bedtime', 'As needed (SOS)',
];

const DURATION_OPTIONS = [
  '1 day', '2 days', '3 days', '5 days', '7 days',
  '10 days', '14 days', '1 month', 'Until review',
];

export default function PrescriptionForm() {
  const { patientId, visitId } = useParams<{ patientId: string; visitId: string }>();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  // Per-row autocomplete state
  const [suggestions, setSuggestions] = useState<Record<number, Medicine[]>>({});
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [hints, setHints] = useState<Record<number, { description: string; dosage: string }>>({});
  const debounceTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenIdx(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const searchMedicines = (idx: number, q: string) => {
    clearTimeout(debounceTimers.current[idx]);
    if (!q.trim()) {
      setSuggestions(prev => ({ ...prev, [idx]: [] }));
      setOpenIdx(null);
      return;
    }
    debounceTimers.current[idx] = setTimeout(async () => {
      try {
        const res = await api.get<Medicine[]>('/medicines/search', { params: { q } });
        setSuggestions(prev => ({ ...prev, [idx]: res.data }));
        setOpenIdx(res.data.length > 0 ? idx : null);
      } catch {
        // silently ignore search errors
      }
    }, 250);
  };

  const selectMedicine = (idx: number, med: Medicine) => {
    // Fill the medicine_name field
    setValue(`items.${idx}.medicine_name`, med.name);
    // Store master reference hints (not submitted)
    setHints(prev => ({
      ...prev,
      [idx]: {
        description: med.description || '',
        dosage: med.dosage || '',
      },
    }));
    setSuggestions(prev => ({ ...prev, [idx]: [] }));
    setOpenIdx(null);
  };

  const clearHint = (idx: number) => {
    setHints(prev => {
      const next = { ...prev };
      delete next[idx];
      return next;
    });
  };

  const { register, handleSubmit, control, setValue, formState: { errors } } = useForm<PrescriptionFormData>({
    defaultValues: {
      notes: '',
      investigations: '',
      items: [emptyItem()],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const onSubmit = async (data: PrescriptionFormData) => {
    setServerError('');
    setLoading(true);
    try {
      const res = await api.post(`/visits/${visitId}/prescriptions`, data);
      navigate(`/prescriptions/${res.data.id}/print`);
    } catch (err: any) {
      setServerError(err.response?.data?.error || 'Failed to save prescription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="btn-ghost btn-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <h1 className="text-lg font-bold text-slate-800">New Prescription</h1>
      </div>

      {serverError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Medicines */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h2 className="text-sm font-bold text-slate-700">Medicines</h2>
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={() => append(emptyItem())}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Medicine
            </button>
          </div>

          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-600">Medicine #{index + 1}</span>
                  {fields.length > 1 && (
                    <button
                      type="button"
                      className="text-xs text-slate-400 hover:text-red-600 font-semibold transition-colors"
                      onClick={() => { remove(index); clearHint(index); }}
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="label">Medicine Name <span className="text-red-500">*</span></label>
                    {/* Autocomplete wrapper */}
                    <div className="relative" ref={openIdx === index ? dropdownRef : undefined}>
                      <input
                        className={`input ${errors.items?.[index]?.medicine_name ? 'border-red-500' : ''}`}
                        placeholder="Type to search or enter manually..."
                        autoComplete="off"
                        {...register(`items.${index}.medicine_name`, { required: 'Medicine name is required' })}
                        onChange={e => {
                          register(`items.${index}.medicine_name`).onChange(e);
                          clearHint(index);
                          searchMedicines(index, e.target.value);
                        }}
                        onFocus={e => {
                          if (e.target.value.trim()) searchMedicines(index, e.target.value);
                        }}
                      />
                      {openIdx === index && (suggestions[index]?.length ?? 0) > 0 && (
                        <div
                          ref={dropdownRef}
                          className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden"
                        >
                          {suggestions[index].map(med => (
                            <button
                              key={med.id}
                              type="button"
                              className="w-full px-3 py-2.5 text-left hover:bg-blue-50 transition-colors border-b border-slate-50 last:border-0"
                              onMouseDown={e => { e.preventDefault(); selectMedicine(index, med); }}
                            >
                              <p className="text-sm font-semibold text-slate-800">{med.name}</p>
                              {med.description && (
                                <p className="text-xs text-slate-400 truncate">{med.description}</p>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {errors.items?.[index]?.medicine_name && (
                      <p className="mt-1 text-xs text-red-600">{errors.items[index]?.medicine_name?.message}</p>
                    )}

                    {/* Doctor-only reference hints — NOT printed */}
                    {hints[index] && (hints[index].description || hints[index].dosage) && (
                      <div className="mt-2 px-3 py-2 bg-violet-50 border border-violet-200 rounded-lg space-y-0.5">
                        <p className="text-[10px] font-bold text-violet-400 uppercase tracking-wide">
                          Master Reference — not printed
                        </p>
                        {hints[index].description && (
                          <p className="text-xs text-violet-700">{hints[index].description}</p>
                        )}
                        {hints[index].dosage && (
                          <p className="text-xs text-violet-600 font-medium">
                            Typical dosage: {hints[index].dosage}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="label">Dosage</label>
                    <input
                      className="input"
                      placeholder="e.g. 5ml, 1 tablet, 2.5ml"
                      {...register(`items.${index}.dosage`)}
                    />
                  </div>

                  <div>
                    <label className="label">Frequency</label>
                    <select className="input" {...register(`items.${index}.frequency`)}>
                      <option value="">Select or type below</option>
                      {FREQUENCY_OPTIONS.map(o => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="label">Duration</label>
                    <select className="input" {...register(`items.${index}.duration`)}>
                      <option value="">Select or type below</option>
                      {DURATION_OPTIONS.map(o => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="label">Special Instructions</label>
                    <input
                      className="input"
                      placeholder="e.g. After food, with warm water"
                      {...register(`items.${index}.special_instructions`)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Investigations */}
        <div className="card p-5">
          <h2 className="text-sm font-bold text-slate-700 border-b border-slate-100 pb-2 mb-4">Investigations</h2>
          <label className="label">Recommended Tests / Scans (optional)</label>
          <textarea
            className="input h-20 resize-none"
            placeholder="e.g. CBC, CRP, Chest X-ray, USG Abdomen..."
            {...register('investigations')}
          />
        </div>

        {/* Notes */}
        <div className="card p-5">
          <label className="label">Additional Notes (optional)</label>
          <textarea
            className="input h-20 resize-none"
            placeholder="Dietary advice, special instructions for parents..."
            {...register('notes')}
          />
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Saving...
              </span>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Save & Print
              </>
            )}
          </button>
          <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
