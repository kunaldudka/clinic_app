import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function getBreadcrumb(pathname: string): string {
  if (pathname === '/') return 'Dashboard';
  if (pathname === '/patients') return 'Patients';
  if (pathname === '/patients/new') return 'New Patient';
  if (pathname === '/profile') return 'My Profile';
  if (pathname.match(/\/patients\/\d+\/edit/)) return 'Edit Patient';
  if (pathname.match(/\/patients\/\d+\/visits\/new/)) return 'New Visit';
  if (pathname.match(/\/patients\/\d+\/visits\/\d+\/prescriptions\/new/)) return 'New Prescription';
  if (pathname.match(/\/patients\/\d+/)) return 'Patient Details';
  if (pathname.match(/\/prescriptions\/\d+\/print/)) return 'Print Prescription';
  return 'Clinic';
}

export default function Header() {
  const location = useLocation();
  const { user } = useAuth();
  const title = getBreadcrumb(location.pathname);
  const now = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <header className="h-16 flex-shrink-0 flex items-center justify-between px-6 bg-white border-b border-slate-200" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div className="flex items-center gap-3">
        <div
          className="w-1 h-8 rounded-full"
          style={{ background: 'linear-gradient(180deg, #2563eb 0%, #1d4ed8 100%)' }}
        />
        <div>
          <h1 className="text-base font-bold text-slate-800">{title}</h1>
          <p className="text-xs text-slate-400">{now}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' }}
          >
            {user?.full_name.charAt(0).toUpperCase()}
          </div>
          <span className="text-xs text-slate-600 font-semibold">{user?.full_name}</span>
        </div>
        <span className={`badge ${user?.role === 'doctor' ? 'badge-blue' : 'badge-green'}`}>
          {user?.role}
        </span>
      </div>
    </header>
  );
}
