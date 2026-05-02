import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import api from '../api';

interface ProfileFormData {
  full_name: string;
  username: string;
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [successMsg, setSuccessMsg] = useState('');
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    defaultValues: {
      full_name: user?.full_name ?? '',
      username: user?.username ?? '',
      current_password: '',
      new_password: '',
      confirm_password: '',
    },
  });

  const newPassword = watch('new_password');

  const onSubmit = async (data: ProfileFormData) => {
    setServerError('');
    setSuccessMsg('');
    setLoading(true);

    const payload: Record<string, string> = {};
    if (data.full_name !== user?.full_name) payload.full_name = data.full_name;
    if (data.username !== user?.username) payload.username = data.username;
    if (data.new_password) {
      payload.new_password = data.new_password;
      payload.current_password = data.current_password;
    }

    if (Object.keys(payload).length === 0) {
      setLoading(false);
      return;
    }

    try {
      const res = await api.put('/auth/profile', payload);
      updateUser(res.data);
      setSuccessMsg('Profile updated successfully.');
      reset({
        full_name: res.data.full_name,
        username: res.data.username,
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
    } catch (err: any) {
      const msg =
        err.response?.data?.errors?.[0]?.msg ||
        err.response?.data?.error ||
        'Failed to update profile';
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl">
      <h1 className="text-lg font-bold text-slate-800 mb-6">My Profile</h1>

      {/* Current Profile Card */}
      <div className="card p-5 flex items-center gap-4 mb-6" style={{ background: 'linear-gradient(135deg, #f0f7ff 0%, #e0efff 100%)', borderColor: '#bfdbfe' }}>
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl font-bold text-white"
          style={{ background: 'linear-gradient(135deg, #1a3668 0%, #2563eb 100%)' }}
        >
          {user?.full_name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-base font-bold text-slate-800">{user?.full_name}</p>
          <p className="text-sm text-slate-500">@{user?.username}</p>
          <span className={`mt-1 badge ${user?.role === 'doctor' ? 'badge-blue' : 'badge-green'}`}>
            {user?.role}
          </span>
        </div>
      </div>

      {/* Edit Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {serverError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {serverError}
          </div>
        )}
        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {successMsg}
          </div>
        )}

        {/* Basic Info */}
        <div className="card p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-700 border-b border-slate-100 pb-2">
            Basic Information
          </h2>

          <div>
            <label className="label">Full Name</label>
            <input
              className={`input ${errors.full_name ? 'border-red-500' : ''}`}
              placeholder="Your full name"
              {...register('full_name', { required: 'Full name is required' })}
            />
            {errors.full_name && (
              <p className="mt-1 text-xs text-red-600">{errors.full_name.message}</p>
            )}
          </div>

          <div>
            <label className="label">Username</label>
            <input
              className={`input ${errors.username ? 'border-red-500' : ''}`}
              placeholder="Login username"
              {...register('username', { required: 'Username is required' })}
            />
            {errors.username && (
              <p className="mt-1 text-xs text-red-600">{errors.username.message}</p>
            )}
          </div>

          <div>
            <label className="label">Role</label>
            <input
              className="input opacity-60 cursor-not-allowed bg-slate-50"
              value={user?.role ?? ''}
              disabled
            />
            <p className="mt-1 text-xs text-slate-400">Role cannot be changed from this screen.</p>
          </div>
        </div>

        {/* Change Password */}
        <div className="card p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-700 border-b border-slate-100 pb-2">
            Change Password
            <span className="ml-2 text-xs font-normal text-slate-400">(leave blank to keep current)</span>
          </h2>

          <div>
            <label className="label">Current Password</label>
            <input
              className={`input ${errors.current_password ? 'border-red-500' : ''}`}
              type="password"
              placeholder="Enter current password"
              autoComplete="current-password"
              {...register('current_password', {
                validate: (value) =>
                  !newPassword || !!value || 'Current password is required to set a new one',
              })}
            />
            {errors.current_password && (
              <p className="mt-1 text-xs text-red-600">{errors.current_password.message}</p>
            )}
          </div>

          <div>
            <label className="label">New Password</label>
            <input
              className={`input ${errors.new_password ? 'border-red-500' : ''}`}
              type="password"
              placeholder="Min. 6 characters"
              autoComplete="new-password"
              {...register('new_password', {
                minLength: { value: 6, message: 'Password must be at least 6 characters' },
              })}
            />
            {errors.new_password && (
              <p className="mt-1 text-xs text-red-600">{errors.new_password.message}</p>
            )}
          </div>

          <div>
            <label className="label">Confirm New Password</label>
            <input
              className={`input ${errors.confirm_password ? 'border-red-500' : ''}`}
              type="password"
              placeholder="Re-enter new password"
              autoComplete="new-password"
              {...register('confirm_password', {
                validate: (value) =>
                  !newPassword || value === newPassword || 'Passwords do not match',
              })}
            />
            {errors.confirm_password && (
              <p className="mt-1 text-xs text-red-600">{errors.confirm_password.message}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="btn-primary"
            disabled={loading || !isDirty}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Saving...
              </span>
            ) : 'Save Changes'}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => reset()}
            disabled={loading || !isDirty}
          >
            Discard
          </button>
        </div>
      </form>
    </div>
  );
}
