import React, { useState } from 'react';
import { Fingerprint, CheckCircle2, AlertTriangle, ShieldCheck, X } from 'lucide-react';
import { biometricService } from '../services/biometricService';
import { pushNotificationService } from '../services/pushNotificationService';
import { UserProfile } from '../types/attendance';

interface BiometricModalProps {
  currentUser: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onVerified: () => void;
}

export const BiometricModal: React.FC<BiometricModalProps> = ({
  currentUser,
  isOpen,
  onClose,
  onVerified,
}) => {
  const [status, setStatus] = useState<'idle' | 'scanning' | 'success' | 'failed'>('idle');
  const [message, setMessage] = useState<string>('Sentuh sensor sidik jari atau hadapkan wajah ke kamera');

  if (!isOpen) return null;

  const handleStartBiometric = async () => {
    setStatus('scanning');
    setMessage('Memverifikasi data biometrik perangkat...');

    try {
      const res = await biometricService.authenticateBiometric(currentUser.email);
      if (res.success) {
        setStatus('success');
        setMessage('Verifikasi biometrik berhasil! Akses pengguna telah diverifikasi.');
        pushNotificationService.playAudioCue('success');
        pushNotificationService.vibrate([100, 50, 100]);
        setTimeout(() => {
          onVerified();
          onClose();
          setStatus('idle');
        }, 1200);
      } else {
        setStatus('failed');
        setMessage(res.message);
        pushNotificationService.playAudioCue('error');
      }
    } catch {
      setStatus('failed');
      setMessage('Verifikasi dibatalkan atau tidak cocok.');
      pushNotificationService.playAudioCue('error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 text-center space-y-5 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1">
          <div className="inline-flex p-2.5 rounded-2xl bg-red-50 dark:bg-red-950/80 text-red-600 dark:text-red-400 mb-1">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Autentikasi Biometrik Pengguna
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {currentUser.name} ({currentUser.role === 'admin' ? 'Admin' : currentUser.subject || 'Guru'})
          </p>
        </div>

        {/* Fingerprint Scanner Interactive Circle */}
        <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
          {/* Animated ripple rings */}
          {status === 'scanning' && (
            <>
              <div className="absolute inset-0 rounded-full border-2 border-red-500 animate-ping opacity-40" />
              <div className="absolute -inset-2 rounded-full border border-red-400 animate-pulse-subtle" />
            </>
          )}

          <button
            onClick={handleStartBiometric}
            disabled={status === 'scanning' || status === 'success'}
            className={`w-24 h-24 rounded-full flex items-center justify-center shadow-lg transition-all cursor-pointer ${
              status === 'success'
                ? 'bg-emerald-600 text-white'
                : status === 'failed'
                ? 'bg-red-600 text-white'
                : status === 'scanning'
                ? 'bg-red-600 text-white'
                : 'bg-slate-100 dark:bg-slate-700 hover:bg-red-50 dark:hover:bg-slate-600 text-red-600 dark:text-red-400'
            }`}
          >
            {status === 'success' ? (
              <CheckCircle2 className="w-12 h-12 animate-in zoom-in" />
            ) : (
              <Fingerprint className={`w-12 h-12 ${status === 'scanning' ? 'animate-pulse' : ''}`} />
            )}
          </button>
        </div>

        <div className="space-y-3">
          <p className={`text-xs font-semibold ${
            status === 'success'
              ? 'text-emerald-600 dark:text-emerald-400'
              : status === 'failed'
              ? 'text-red-600 dark:text-red-400'
              : 'text-slate-600 dark:text-slate-300'
          }`}>
            {message}
          </p>

          {status === 'idle' && (
            <button
              onClick={handleStartBiometric}
              className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs shadow-md shadow-red-600/25 transition-all cursor-pointer"
            >
              Mulai Verifikasi Biometrik
            </button>
          )}

          {status === 'failed' && (
            <button
              onClick={handleStartBiometric}
              className="w-full py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs transition-colors cursor-pointer"
            >
              Coba Lagi
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
