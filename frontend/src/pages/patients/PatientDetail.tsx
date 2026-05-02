import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../../api';
import type { Patient, Visit } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { format, parseISO, differenceInYears } from 'date-fns';

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <span className="text-xs text-slate-400 font-semibold w-28 flex-shrink-0">{label}</span>
      <span className="text-xs text-slate-700 flex-1">{value || '—'}</span>
    </div>
  );
}

export default function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeVisit, setActiveVisit] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      api.get(`/patients/${id}`),
      api.get(`/patients/${id}/visits`),
    ]).then(([pRes, vRes]) => {
      setPatient(pRes.data);
      setVisits(vRes.data);
      if (vRes.data.length > 0) setActiveVisit(vRes.data[0].id);
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!patient) {
    return <div className="text-center text-slate-400 py-16">Patient not found</div>;
  }

  const age = patient.date_of_birth
    ? differenceInYears(new Date(), parseISO(patient.date_of_birth))
    : null;

  const selectedVisit = visits.find(v => v.id === activeVisit);

  return (
    <div className="space-y-5">
      {/* Back + Actions */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/patients')} className="btn-ghost btn-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Patients
        </button>
        <div className="flex gap-2">
          <Link to={`/patients/${id}/edit`} className="btn-secondary btn-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </Link>
          {user?.role === 'doctor' && (
            <Link to={`/patients/${id}/visits/new`} className="btn-primary btn-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Visit
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Patient Info Card */}
        <div className="card p-5 space-y-4">
          <div className="flex items-start gap-3">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #1a3668 0%, #2563eb 100%)' }}
            >
              {patient.full_name.charAt(0)}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">{patient.full_name}</h2>
              <p className="text-xs font-mono text-blue-600 font-semibold">{patient.patient_id}</p>
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            {patient.gender && (
              <span className={`badge ${patient.gender === 'male' ? 'badge-blue' : patient.gender === 'female' ? 'badge-red' : 'badge-gray'}`}>
                {patient.gender}
              </span>
            )}
            {age !== null && (
              <span className="badge badge-gray">{age} yr{age !== 1 ? 's' : ''}</span>
            )}
            <span className="badge badge-blue">{visits.length} visit{visits.length !== 1 ? 's' : ''}</span>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <InfoRow label="Date of Birth"
              value={patient.date_of_birth ? format(parseISO(patient.date_of_birth), 'dd MMM yyyy') : null} />
            <InfoRow label="Contact" value={patient.contact_number} />
            <InfoRow label="Guardian" value={patient.guardian_name} />
            <InfoRow label="Address" value={patient.address} />
          </div>

          {patient.allergies && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-xs font-bold text-red-600 mb-1">⚠ Allergies</p>
              <p className="text-xs text-red-700">{patient.allergies}</p>
            </div>
          )}

          {patient.notes && (
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
              <p className="text-xs font-semibold text-slate-500 mb-1">Notes</p>
              <p className="text-xs text-slate-600">{patient.notes}</p>
            </div>
          )}

          <p className="text-xs text-slate-400">
            Registered {format(parseISO(patient.created_at), 'dd MMM yyyy')}
          </p>
        </div>

        {/* Visit History */}
        <div className="lg:col-span-2 space-y-4">
          {visits.length === 0 ? (
            <div className="card p-10 text-center">
              <p className="text-slate-400 mb-4">No visits recorded yet</p>
              {user?.role === 'doctor' && (
                <Link to={`/patients/${id}/visits/new`} className="btn-primary btn-sm">
                  Record First Visit
                </Link>
              )}
            </div>
          ) : (
            <>
              {/* Visit tabs */}
              <div className="flex gap-2 overflow-x-auto pb-1">
                {visits.map(v => (
                  <button
                    key={v.id}
                    onClick={() => setActiveVisit(v.id)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                      activeVisit === v.id
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600'
                    }`}
                  >
                    {format(parseISO(v.visit_date), 'dd MMM yy')}
                  </button>
                ))}
              </div>

              {/* Selected Visit Detail */}
              {selectedVisit && <VisitCard visit={selectedVisit} patientId={Number(id)} canEdit={user?.role === 'doctor'} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function VisitCard({ visit, patientId, canEdit }: { visit: Visit; patientId: number; canEdit?: boolean }) {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`/visits/${visit.id}/prescriptions`)
      .then(res => setPrescriptions(res.data))
      .catch(() => {});
  }, [visit.id]);

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-800">
            Visit — {format(parseISO(visit.visit_date), 'dd MMMM yyyy')}
          </h3>
          <p className="text-xs text-slate-400">by {visit.created_by_name}</p>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <Link
              to={`/patients/${patientId}/visits/${visit.id}/prescriptions/new`}
              className="btn-primary btn-sm"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Prescription
            </Link>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {visit.chief_complaints && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
            <p className="text-xs font-bold text-blue-700 mb-1 uppercase tracking-wide">Chief Complaints</p>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{visit.chief_complaints}</p>
          </div>
        )}
        {visit.diagnosis && (
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
            <p className="text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">Provisional Diagnosis</p>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{visit.diagnosis}</p>
          </div>
        )}
        {visit.observations && (
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 sm:col-span-2">
            <p className="text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">Observations / Notes</p>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{visit.observations}</p>
          </div>
        )}
        {visit.follow_up_date && (
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs text-amber-700 font-semibold">
              Follow-up: {format(parseISO(visit.follow_up_date), 'dd MMM yyyy')}
            </span>
          </div>
        )}
      </div>

      {/* Prescriptions */}
      {prescriptions.length > 0 && (
        <div className="border-t border-slate-100 pt-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
            Prescriptions ({prescriptions.length})
          </p>
          <div className="space-y-3">
            {prescriptions.map(rx => (
              <div key={rx.id} className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-slate-400">
                    {format(parseISO(rx.created_at), 'dd MMM yyyy, HH:mm')} · {rx.created_by_name}
                  </p>
                  <Link
                    to={`/prescriptions/${rx.id}/print`}
                    className="btn-secondary btn-sm text-xs gap-1"
                    target="_blank"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Print
                  </Link>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-slate-400 border-b border-slate-200">
                        <th className="text-left pr-3 pb-1.5 font-bold uppercase tracking-wide">Medicine</th>
                        <th className="text-left pr-3 pb-1.5 font-bold uppercase tracking-wide">Dosage</th>
                        <th className="text-left pr-3 pb-1.5 font-bold uppercase tracking-wide">Frequency</th>
                        <th className="text-left pr-3 pb-1.5 font-bold uppercase tracking-wide">Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rx.items.map((item: any, idx: number) => (
                        <tr key={idx} className="text-slate-700">
                          <td className="pr-3 py-1 font-semibold">{item.medicine_name}</td>
                          <td className="pr-3 py-1">{item.dosage || '—'}</td>
                          <td className="pr-3 py-1">{item.frequency || '—'}</td>
                          <td className="pr-3 py-1">{item.duration || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
