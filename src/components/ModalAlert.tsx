import React from 'react';
import { useAuth } from '../context/AuthContext';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

export const ModalAlert: React.FC = () => {
  const { modalAlert, closeAlert } = useAuth();

  if (!modalAlert || !modalAlert.show) return null;

  const isError = modalAlert.type === 'error' || !modalAlert.type;
  const isSuccess = modalAlert.type === 'success';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 text-slate-800">
        <button
          onClick={closeAlert}
          className="absolute top-4 right-4 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-start gap-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
              isError
                ? 'bg-red-100 text-red-600'
                : isSuccess
                ? 'bg-emerald-100 text-emerald-600'
                : 'bg-blue-100 text-blue-600'
            }`}
          >
            {isError ? (
              <AlertTriangle className="h-6 w-6" />
            ) : isSuccess ? (
              <CheckCircle2 className="h-6 w-6" />
            ) : (
              <Info className="h-6 w-6" />
            )}
          </div>

          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-900 leading-snug">
              {modalAlert.title}
            </h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              {modalAlert.message}
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={closeAlert}
            className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-semibold text-sm text-white shadow-md transition transform active:scale-95 ${
              isError
                ? 'bg-gradient-to-r from-[#C1272D] to-red-700 hover:opacity-95'
                : isSuccess
                ? 'bg-gradient-to-r from-emerald-600 to-teal-700 hover:opacity-95'
                : 'bg-gradient-to-r from-[#1B3F8B] to-blue-700 hover:opacity-95'
            }`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
