import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import api from '../../api';
import type { PatientFormData } from '../../types';

export default function PatientForm() {
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<PatientFormData>({
    defaultValues: {
      full_name: '', date_of_birth: '', gender: '',
      contact_number: '', address: '', guardian_name: '',
      allergies: '', notes: '',
    },
  });

  useEffect(() => {
    if (isEdit && id) {
      api.get(`/patients/${id}`).then(res => {
        const p = res.data;
        reset({
          full_name: p.full_name ?? '',
          date_of_birth: p.date_of_birth ? p.date_of_birth.slice(0, 10) : '',
          gender: p.gender ?? '',
          contact_number: p.contact_number ?? '',
          address: p.address ?? '',
          guardian_name: p.guardian_name ?? '',
          allergies: p.allergies ?? '',
          notes: p.notes ?? '',
        });
      });
    }
  }, [isEdit, id, reset]);

  const onSubmit = async (data: PatientFormData) => {
    setServerError('');
    setLoading(true);
    try {
      const payload = {
        ...data,
        gender: data.gender || undefined,
        date_of_birth: data.date_of_birth || undefined,
      };
      if (isEdit) {
        await api.put(`/patients/${id}`, payload);
        navigate(`/patients/${id}`);
      } else {
        const res = await api.post('/patients', payload);
        navigate(`/patients/${res.data.id}`);
      }
    } catch (err: any) {
      setServerError(err.response?.data?.error || 'Something went wrong');
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
        <h1 className="text-lg font-bold text-slate-800">
          {isEdit ? 'Edit Patient' : 'Register New Patient'}
        </h1>
      </div>

      {serverError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Personal Info */}
        <div className="card p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-700 pb-2 border-b border-slate-100">
            Personal Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Full Name <span className="text-red-500">*</span></label>
              <input
                className={`input ${errors.full_name ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="Patient's full name"
                {...register('full_name', { required: 'Full name is required' })}
              />
              {errors.full_name && (
                <p className="mt-1 text-xs text-red-600">{errors.full_name.message}</p>
              )}
            </div>

            <div>
              <label className="label">Date of Birth</label>
              <input
                className="input"
                type="date"
                {...register('date_of_birth')}
              />
            </div>

            <div>
              <label className="label">Gender</label>
              <select className="input" {...register('gender')}>
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="label">Contact Number</label>
              <input
                className="input"
                type="tel"
                placeholder="+91 XXXXX XXXXX"
                {...register('contact_number')}
              />
            </div>

            <div>
              <label className="label">Guardian / Parent Name</label>
              <input
                className="input"
                placeholder="Father / Mother name"
                {...register('guardian_name')}
              />
            </div>
          </div>

          <div>
            <label className="label">Address</label>
            <textarea
              className="input h-20 resize-none"
              placeholder="Full address"
              {...register('address')}
            />
          </div>
        </div>

        {/* Medical Info */}
        <div className="card p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-700 pb-2 border-b border-slate-100">
            Medical Information
          </h2>

          <div>
            <label className="label">Known Allergies</label>
            <input
              className="input"
              placeholder="e.g. Penicillin, Sulfa drugs (leave blank if none)"
              {...register('allergies')}
            />
          </div>

          <div>
            <label className="label">Additional Notes</label>
            <textarea
              className="input h-24 resize-none"
              placeholder="Any relevant medical history or notes..."
              {...register('notes')}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="btn-primary"
            disabled={loading || (isEdit && !isDirty)}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Saving...
              </span>
            ) : isEdit ? 'Save Changes' : 'Register Patient'}
          </button>
          <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
