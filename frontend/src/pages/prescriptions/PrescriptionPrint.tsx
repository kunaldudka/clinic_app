import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import api from '../../api';
import type { Prescription } from '../../types';
import { format, parseISO, differenceInYears } from 'date-fns';

type PrintMode = 'plain' | 'letterhead';

export default function PrescriptionPrint() {
  const { id } = useParams<{ id: string }>();
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [loading, setLoading] = useState(true);
  const [printMode, setPrintMode] = useState<PrintMode>('plain');
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Prescription-${id}`,
  });

  useEffect(() => {
    api.get(`/prescriptions/${id}`)
      .then(res => setPrescription(res.data))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!prescription) {
    return <div className="text-center text-slate-400 py-16">Prescription not found</div>;
  }

  const age = prescription.date_of_birth
    ? differenceInYears(new Date(), parseISO(prescription.date_of_birth))
    : null;

  const followUpDate = prescription.visit?.follow_up_date;

  return (
    <div>
      {/* ── Action bar (no-print) ── */}
      <div className="no-print flex flex-wrap items-center gap-3 mb-6">
        <Link to={`/patients/${prescription.patient_id}`} className="btn-ghost btn-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Patient
        </Link>

        {/* Print mode toggle */}
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
          <button
            onClick={() => setPrintMode('plain')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              printMode === 'plain'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Plain Paper
          </button>
          <button
            onClick={() => setPrintMode('letterhead')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              printMode === 'letterhead'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Letterhead
          </button>
        </div>

        <button onClick={handlePrint} className="btn-primary btn-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print / Save PDF
        </button>

        <span className="text-xs text-slate-400 italic">
          {printMode === 'letterhead'
            ? 'Letterhead mode — header will be hidden for pre-printed paper'
            : 'Plain paper mode — full header will be printed'}
        </span>
      </div>

      {/* ── Printable area ── */}
      <div ref={printRef} className="bg-white text-gray-900 max-w-2xl mx-auto rounded-xl overflow-hidden shadow-xl">

        {/* ── Header (hidden in letterhead mode) ── */}
        {printMode === 'plain' && (
          <div className="bg-white px-6 py-4 flex items-center justify-between gap-6 border-b-2" style={{ borderColor: '#1a3668' }}>
            <img
              src="/clinic-logo.png"
              alt="Dr. Chavan's Child Clinic"
              style={{ maxHeight: '90px', objectFit: 'contain' }}
            />
            <div className="text-right">
              <p className="text-base font-bold text-gray-800 leading-tight">Dr. Rohit R. Chavan</p>
              <p className="text-sm text-gray-600 leading-tight">M.D. Ayu. Balrog (Pediatrics)</p>
              <p className="text-sm text-gray-600 leading-tight">Child Health Specialist</p>
              <div className="mt-2 text-xs text-gray-500 space-y-0.5">
                <p>Date: {format(parseISO(prescription.created_at), 'dd/MM/yyyy')}</p>
                <p>Rx #{String(prescription.id).padStart(6, '0')}</p>
              </div>
            </div>
          </div>
        )}

        {/* Letterhead mode: blank space for pre-printed header + minimal Rx info */}
        {printMode === 'letterhead' && (
          <>
            {/* Blank space — matches typical clinic letterhead height (~132px on screen / ~36mm on print) */}
            <div
              style={{ height: '132px' }}
              className="letterhead-spacer"
              aria-hidden="true"
            />
            {/* Rx reference strip — sits just below the letterhead */}
            <div className="px-6 py-1.5 flex justify-end gap-6 border-b border-gray-200 text-[10px] text-gray-400">
              <span>Date: {format(parseISO(prescription.created_at), 'dd/MM/yyyy')}</span>
              <span>Rx #{String(prescription.id).padStart(6, '0')}</span>
            </div>
          </>
        )}

        {/* ── Patient Info strip ── */}
        <div className="px-6 py-3" style={{ backgroundColor: '#f8f9fb', borderBottom: '1px solid #e5e7eb' }}>
          <div className="flex items-baseline justify-between mb-1.5">
            <p className="text-sm font-bold text-gray-800">{prescription.patient_name}</p>
            <p className="text-[10px] font-mono text-gray-400">{prescription.patient_uid}</p>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {age !== null && (
              <span className="text-[11px] text-gray-500"><span className="font-medium text-gray-600">Age:</span> {age} yrs</span>
            )}
            {prescription.gender && (
              <span className="text-[11px] text-gray-500 capitalize"><span className="font-medium text-gray-600">Sex:</span> {prescription.gender}</span>
            )}
            {prescription.guardian_name && (
              <span className="text-[11px] text-gray-500"><span className="font-medium text-gray-600">Guardian:</span> {prescription.guardian_name}</span>
            )}
            {prescription.contact_number && (
              <span className="text-[11px] text-gray-500"><span className="font-medium text-gray-600">Ph:</span> {prescription.contact_number}</span>
            )}
            {prescription.visit?.diagnosis && (
              <span className="text-[11px] text-gray-500"><span className="font-medium text-gray-600">Prov. Dx:</span> {prescription.visit.diagnosis}</span>
            )}
          </div>
          {prescription.allergies && (
            <p className="mt-1.5 text-[10px] font-semibold text-red-500">⚠ Allergies: {prescription.allergies}</p>
          )}
        </div>

        {/* ── Medicines ── */}
        <div className="px-6 py-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg font-bold" style={{ color: '#1a3668' }}>℞</span>
            <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Medicines</span>
            <div className="flex-1 border-t border-dashed border-gray-200 ml-1" />
          </div>

          <table className="w-full text-xs border-collapse">
            <thead>
              <tr style={{ backgroundColor: '#1a3668' }}>
                <th className="text-left text-white font-semibold px-3 py-1.5 rounded-tl w-6">#</th>
                <th className="text-left text-white font-semibold px-3 py-1.5">Medicine</th>
                <th className="text-center text-white font-semibold px-3 py-1.5">Dose</th>
                <th className="text-center text-white font-semibold px-3 py-1.5">Frequency</th>
                <th className="text-center text-white font-semibold px-3 py-1.5 rounded-tr">Duration</th>
              </tr>
            </thead>
            <tbody>
              {prescription.items.map((item, idx) => (
                <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#f8f9fb' : '#ffffff' }}>
                  <td className="px-3 py-2 text-center font-bold text-gray-400">{idx + 1}</td>
                  <td className="px-3 py-2">
                    <p className="font-semibold text-gray-800">{item.medicine_name}</p>
                    {item.special_instructions && (
                      <p className="text-[10px] text-gray-400 italic mt-0.5">{item.special_instructions}</p>
                    )}
                  </td>
                  <td className="px-3 py-2 text-center text-gray-600">{item.dosage || '—'}</td>
                  <td className="px-3 py-2 text-center text-gray-600">{item.frequency || '—'}</td>
                  <td className="px-3 py-2 text-center text-gray-600">{item.duration || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {prescription.notes && (
            <div className="mt-3 flex items-start gap-2 bg-amber-50 border-l-2 border-amber-400 px-3 py-2 rounded-r">
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wide mt-0.5 flex-shrink-0">Note:</span>
              <p className="text-[11px] text-amber-800">{prescription.notes}</p>
            </div>
          )}
        </div>

        {/* ── Investigations ── */}
        {prescription.investigations && (
          <div className="px-6 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Investigations</span>
              <div className="flex-1 border-t border-dashed border-gray-200 ml-1" />
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
              <p className="text-xs text-blue-900 whitespace-pre-wrap">{prescription.investigations}</p>
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        <div className="border-t border-gray-200">
          <div className="px-8 pt-4 pb-4 flex justify-between items-end">
            {/* Follow-up */}
            <div>
              {followUpDate ? (
                <p className="text-[11px] font-semibold text-gray-700">
                  Follow-up: {format(parseISO(followUpDate), 'dd MMM yyyy')}
                </p>
              ) : (
                <p className="text-[11px] text-gray-400">Follow-up as advised</p>
              )}
            </div>
            {/* Signature */}
            <div className="text-right">
              <div className="w-32 border-t border-gray-400 mb-1 ml-auto" />
              <p className="text-xs font-semibold text-gray-700">
                {prescription.created_by_name || 'Dr. Rohit R. Chavan'}
              </p>
              <p className="text-[10px] text-gray-400">M.D. Ayu. Balrog (Pediatrics) · Child Health Specialist</p>
            </div>
          </div>
          {/* Contact banner — hidden in letterhead mode */}
          {printMode === 'plain' && (
            <div style={{ backgroundColor: '#1a3668' }} className="px-6 py-2 flex items-center justify-center gap-6">
              <span className="text-xs text-white font-medium">📞 90755 55955 / 88883 76267</span>
              <span className="text-blue-300 text-xs">|</span>
              <span className="text-xs text-blue-100">📍 Ganga complex, Neeta Park, Yerwada, Pune-06</span>
            </div>
          )}
        </div>
      </div>

      {/* Print-specific CSS */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          /* Letterhead spacer: ~36mm top margin for pre-printed header */
          .letterhead-spacer { height: 36mm !important; }
        }
      `}</style>
    </div>
  );
}
