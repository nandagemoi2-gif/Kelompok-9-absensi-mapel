import React from 'react';
import { 
  QrCode, 
  LayoutDashboard, 
  Table, 
  FileSpreadsheet, 
  Bell, 
  ContactRound, 
  Sun, 
  Moon, 
  Wifi, 
  WifiOff, 
  Fingerprint, 
  UserCheck, 
  LogOut,
  RefreshCw
} from 'lucide-react';
import { UserProfile, GoogleSheetsConfig } from '../types/attendance';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: UserProfile;
  onOpenLogin: () => void;
  onOpenBiometric: () => void;
  isOnline: boolean;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  pendingSyncCount: number;
  sheetsConfig: GoogleSheetsConfig;
  onQuickSync: () => void;
  isSyncing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onOpenLogin,
  onOpenBiometric,
  isOnline,
  theme,
  onToggleTheme,
  pendingSyncCount,
  sheetsConfig,
  onQuickSync,
  isSyncing,
}) => {
  const navItems = [
    { id: 'scanner', label: 'Scan QR Presensi', icon: QrCode },
    { id: 'dashboard', label: 'Dashboard & Analitik', icon: LayoutDashboard },
    { id: 'records', label: 'Rekap Presensi', icon: Table },
    { id: 'sheets', label: 'Google Sheets', icon: FileSpreadsheet, badge: pendingSyncCount > 0 ? pendingSyncCount : undefined },
    { id: 'notifications', label: 'Notifikasi & Pengingat', icon: Bell },
    { id: 'cards', label: 'Kartu QR Siswa', icon: ContactRound },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      {/* Top Banner & Quick Status */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & School Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 via-rose-600 to-red-700 flex items-center justify-center text-white shadow-md shadow-red-600/25">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-red-600 via-rose-600 to-slate-800 dark:from-red-400 dark:via-rose-400 dark:to-slate-200 bg-clip-text text-transparent">
                  SIAP-Mapel
                </span>
                <span className="text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-md bg-red-600 text-white shadow-sm">
                  SMK TELKOM LAMPUNG
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                Presensi QR Jurusan RPL • TKJ • Animasi • TJAT (Kelas 10, 11, 12)
              </p>
            </div>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Online / Offline & Google Sheets sync status badge */}
            <div className="flex items-center">
              {isOnline ? (
                <button
                  onClick={onQuickSync}
                  title="Klik untuk sinkronisasi paksa ke Google Sheets"
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:border-red-400 transition-all cursor-pointer"
                >
                  <Wifi className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                  <span className="hidden md:inline">Google Sheets Online</span>
                  {pendingSyncCount > 0 ? (
                    <span className="px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px] font-bold animate-pulse">
                      {pendingSyncCount} antrean
                    </span>
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block" />
                  )}
                  <RefreshCw className={`w-3 h-3 ml-0.5 ${isSyncing ? 'animate-spin' : ''}`} />
                </button>
              ) : (
                <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  <WifiOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Mode Offline ({pendingSyncCount} tersimpan)</span>
                </div>
              )}
            </div>

            {/* Dark / Light Toggle */}
            <button
              onClick={onToggleTheme}
              aria-label="Toggle Theme"
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            {/* Biometric trigger button */}
            <button
              onClick={onOpenBiometric}
              title="Verifikasi Sidik Jari / Biometrik"
              className="p-2 rounded-lg text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/60 hover:bg-red-100 dark:hover:bg-red-900/60 border border-red-200 dark:border-red-900 transition-all cursor-pointer"
            >
              <Fingerprint className="w-4 h-4" />
            </button>

            {/* User Profile / Switch Role button */}
            <button
              onClick={onOpenLogin}
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-red-400 dark:hover:border-red-500 bg-white dark:bg-slate-800 transition-all text-left cursor-pointer shadow-sm"
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-7 h-7 rounded-full object-cover ring-2 ring-red-500/40"
              />
              <div className="hidden lg:block">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[120px]">
                  {currentUser.name}
                </p>
                <div className="flex items-center gap-1">
                  <span className={`text-[10px] font-medium px-1.5 py-0.2 rounded ${
                    currentUser.role === 'admin' 
                      ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold' 
                      : 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 font-semibold'
                  }`}>
                    {currentUser.role === 'admin' ? 'Admin' : currentUser.subject || 'Guru'}
                  </span>
                  {currentUser.hasBiometrics && (
                    <span title="Biometrik Aktif">
                      <Fingerprint className="w-2.5 h-2.5 text-red-500" />
                    </span>
                  )}
                </div>
              </div>
              <UserCheck className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <nav className="flex space-x-1 overflow-x-auto no-scrollbar pb-1 border-t border-slate-100 dark:border-slate-800/60 pt-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-red-600 text-white shadow-sm shadow-red-600/30 font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-white text-red-700' : 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
