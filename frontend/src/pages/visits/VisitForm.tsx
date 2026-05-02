import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import api from '../../api';
import type { VisitFormData } from '../../types';
import { format } from 'date-fns';

export default function VisitForm() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const today = format(new Date(), "yyyy-MM-dd'T'HH:mm");

  const { register, handleSubmit, formState: { errors } } = useForm<VisitFormData>({
    defaultValues: {
      visit_date: today,
      chief_complaints: '',
      diagnosis: '',
      observations: '',
      follow_up_date: '',
    },
  });

  const onSubmit = async (data: VisitFormData) => {
    setServerError('');
    setLoading(true);
    try {
      const res = await api.post(`/patients/${patientId}/visits`, {
        ...data,
        follow_up_date: data.follow_up_date || undefined,
      });
      navigate(`/patients/${patientId}`);
    } catch (err: any) {
      setServerError(err.response?.data?.error || 'Failed to save visit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="btn-ghost btn-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <h1 className="text-lg font-bold text-slate-800">Record New Visit</h1>
      </div>

      {serverError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="card p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-700 border-b border-slate-100 pb-2">
            Visit Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Visit Date & Time <span className="text-red-500">*</span></label>
              <input
                className="input"
                type="datetime-local"
                {...register('visit_date', { required: 'Visit date is required' })}
              />
            </div>
            <div>
              <label className="label">Follow-up Date</label>
              <input
                className="input"
                type="date"
                {...register('follow_up_date')}
              />
            </div>
          </div>

          <div>
            <label className="label">Chief Complaints / Symptoms</label>
            <textarea
              className="input h-24 resize-none"
              placeholder="What is the patient complaining about? (e.g., Fever, cough, running nose for 3 days)"
              {...register('chief_complaints')}
            />
          </div>

          <div>
            <label className="label">Provisional Diagnosis</label>
            <textarea
              className="input h-24 resize-none"
              placeholder="Clinical diagnosis (e.g., Acute URI, Viral fever, Tonsillitis)"
              {...register('diagnosis')}
            />
          </div>

          <div>
            <label className="label">Observations / Clinical Notes</label>
            <textarea
              className="input h-28 resize-none"
              placeholder="Vitals, examination findings, clinical observations..."
              {...register('observations')}
            />
          </div>
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
            ) : 'Save Visit'}
          </button>
          <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
