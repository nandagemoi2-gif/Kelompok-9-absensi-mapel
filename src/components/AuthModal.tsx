import React, { useState } from 'react';
import { ShieldCheck, UserCheck, KeyRound, Fingerprint, X, CheckCircle2 } from 'lucide-react';
import { UserProfile } from '../types/attendance';
import { INITIAL_USERS } from '../data/mockData';
import { pushNotificationService } from '../services/pushNotificationService';

interface AuthModalProps {
  currentUser: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (user: UserProfile) => void;
  onOpenBiometric: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  currentUser,
  isOpen,
  onClose,
  onSelectUser,
  onOpenBiometric,
}) => {
  const [selectedId, setSelectedId] = useState<string>(currentUser.id);
  const [password, setPassword] = useState<string>('••••••••');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = INITIAL_USERS.find((u) => u.id === selectedId);
    if (user) {
      onSelectUser(user);
      pushNotificationService.playAudioCue('success');
      setSuccessMessage(`Berhasil masuk sebagai ${user.name}`);
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 700);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-5 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-red-600 flex items-center justify-center text-white mx-auto shadow-md shadow-red-600/25">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Sistem Autentikasi SMK TELKOM LAMPUNG
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Pilih akun administrator kurikulum atau guru pengampu RPL, TKJ, Animasi, TJAT.
          </p>
        </div>

        {/* Role Account List */}
        <div className="space-y-2">
          <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            Pilih Akun Pengguna:
          </label>
          <div className="space-y-2">
            {INITIAL_USERS.map((user) => {
              const isSelected = selectedId === user.id;
              return (
                <div
                  key={user.id}
                  onClick={() => setSelectedId(user.id)}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-red-50/70 dark:bg-red-950/40 border-red-500 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-9 h-9 rounded-full object-cover ring-2 ring-red-500/30"
                    />
                    <div>
                      <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100">
                        {user.name}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        {user.role === 'admin' ? 'Administrator Kurikulum' : `Guru ${user.subject}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {user.hasBiometrics && (
                      <span title="Dukungan Biometrik Aktif" className="text-red-500">
                        <Fingerprint className="w-4 h-4" />
                      </span>
                    )}
                    <span
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? 'border-red-600 bg-red-600 text-white' : 'border-slate-300'
                      }`}
                    >
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Password input & Biometric trigger */}
        <form onSubmit={handleLogin} className="space-y-3 pt-1">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Kata Sandi Pengguna
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-red-500"
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs shadow-md shadow-red-600/25 transition-all cursor-pointer"
            >
              Masuk dengan Kata Sandi
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenBiometric();
              }}
              className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Fingerprint className="w-4 h-4 text-red-500" />
              <span>Biometrik</span>
            </button>
          </div>
        </form>

        {successMessage && (
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            <span>{successMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
};
