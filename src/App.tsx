import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ScannerView } from './components/ScannerView';
import { DashboardView } from './components/DashboardView';
import { RecordsView } from './components/RecordsView';
import { GoogleSheetsView } from './components/GoogleSheetsView';
import { NotificationView } from './components/NotificationView';
import { StudentCardsView } from './components/StudentCardsView';
import { AuthModal } from './components/AuthModal';
import { BiometricModal } from './components/BiometricModal';
import { storageService } from './services/storageService';
import { googleSheetsService } from './services/googleSheetsService';
import { emailService } from './services/emailService';
import { pushNotificationService } from './services/pushNotificationService';
import { 
  AttendanceRecord, 
  Student, 
  Subject, 
  GoogleSheetsConfig, 
  NotificationLog, 
  DailyScheduleReminder, 
  UserProfile 
} from './types/attendance';
import { Wifi, WifiOff, CheckCircle2, AlertTriangle, X } from 'lucide-react';

export default function App() {
  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => storageService.getTheme());

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<string>('scanner');

  // Core Data States
  const [records, setRecords] = useState<AttendanceRecord[]>(() => storageService.getRecords());
  const [students, setStudents] = useState<Student[]>(() => storageService.getStudents());
  const [subjects, setSubjects] = useState<Subject[]>(() => storageService.getSubjects());
  const [sheetsConfig, setSheetsConfig] = useState<GoogleSheetsConfig>(() => storageService.getSheetsConfig());
  const [notifications, setNotifications] = useState<NotificationLog[]>(() => storageService.getNotifications());
  const [reminders, setReminders] = useState<DailyScheduleReminder[]>(() => storageService.getReminders());
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => storageService.getCurrentUser());

  // Online / Offline state
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isBiometricModalOpen, setIsBiometricModalOpen] = useState<boolean>(false);

  // Toast banner
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'warning' | 'info' } | null>(null);

  // Filter pass-through from dashboard to records
  const [initialRecordFilter, setInitialRecordFilter] = useState<{ status?: string; subject?: string } | undefined>(undefined);

  // Apply dark mode class to <html>
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    storageService.saveTheme(theme);
  }, [theme]);

  // Network Online/Offline Listeners & Automatic Sync
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast('Koneksi internet terhubung kembali. Menjalankan sinkronisasi antrean ke Google Sheets...', 'success');
      handleSyncAll();
    };

    const handleOffline = () => {
      setIsOnline(false);
      showToast('Koneksi terputus. Mode darurat offline aktif: data presensi disimpan di antrean lokal.', 'warning');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [records, sheetsConfig]);

  const showToast = (message: string, type: 'success' | 'warning' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Toggle Theme
  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Add Attendance Record (handles offline queue, google sheets sync, email dispatch)
  const handleRecordAdded = async (newRecord: AttendanceRecord) => {
    const student = students.find((s) => s.id === newRecord.studentId);

    // If student is Alpa or Terlambat, trigger automated email dispatch
    if (student && (newRecord.status === 'alpa' || newRecord.status === 'terlambat')) {
      try {
        const { log, emailDetails } = await emailService.sendNotification(student, newRecord);
        newRecord.emailNotificationSent = true;
        newRecord.emailDetails = emailDetails;
        const updatedLogs = storageService.addNotification(log);
        setNotifications(updatedLogs);
      } catch (err) {
        console.warn('Email dispatch simulation notice:', err);
      }
    }

    // Save record to local storage
    const updatedRecords = storageService.addRecord(newRecord);
    setRecords(updatedRecords);

    // Auto-sync to Google Sheets if online and autoSync is enabled
    if (isOnline && sheetsConfig.autoSync) {
      try {
        await googleSheetsService.syncRecords([newRecord], sheetsConfig);
      } catch (err) {
        console.warn('Auto-sync note:', err);
      }
    }
  };

  // Sync All Pending Records to Google Sheets
  const handleSyncAll = async () => {
    const pending = records.filter((r) => !r.syncedToGoogleSheets);
    if (pending.length === 0) {
      showToast('Semua data presensi sudah tersinkron dengan Google Sheets!', 'info');
      return;
    }

    setIsSyncing(true);
    const result = await googleSheetsService.syncRecords(pending, sheetsConfig);
    setIsSyncing(false);

    if (result.success) {
      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const updated = records.map((r) => ({
        ...r,
        syncedToGoogleSheets: true,
        syncTimestamp: r.syncTimestamp || nowStr,
      }));
      setRecords(updated);
      storageService.saveRecords(updated);

      const newConfig = { ...sheetsConfig, lastSyncedAt: nowStr };
      setSheetsConfig(newConfig);
      storageService.saveSheetsConfig(newConfig);

      showToast(result.message, 'success');
      pushNotificationService.playAudioCue('success');
    } else {
      showToast(result.message, 'warning');
    }
  };

  // Update Record
  const handleUpdateRecord = (updatedRecord: AttendanceRecord) => {
    const updated = records.map((r) => (r.id === updatedRecord.id ? updatedRecord : r));
    setRecords(updated);
    storageService.saveRecords(updated);
  };

  // Delete Record
  const handleDeleteRecord = (id: string) => {
    const updated = records.filter((r) => r.id !== id);
    setRecords(updated);
    storageService.saveRecords(updated);
    showToast('Catatan presensi berhasil dihapus.', 'info');
  };

  // Update Sheets Config
  const handleUpdateConfig = (newConfig: GoogleSheetsConfig) => {
    setSheetsConfig(newConfig);
    storageService.saveSheetsConfig(newConfig);
    showToast('Konfigurasi Google Sheets berhasil diperbarui!', 'success');
  };

  // Update Reminders
  const handleUpdateReminders = (newReminders: DailyScheduleReminder[]) => {
    setReminders(newReminders);
    storageService.saveReminders(newReminders);
  };

  // Switch User Profile
  const handleSelectUser = (user: UserProfile) => {
    setCurrentUser(user);
    storageService.saveCurrentUser(user);
    showToast(`Beralih akun ke: ${user.name} (${user.role === 'admin' ? 'Admin' : user.subject || 'Guru'})`, 'success');
  };

  // Navigate to Records with predefined filter
  const handleOpenRecordsWithFilter = (filter: { status?: string; subject?: string }) => {
    setInitialRecordFilter(filter);
    setActiveTab('records');
  };

  const pendingSyncCount = records.filter((r) => !r.syncedToGoogleSheets).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors flex flex-col font-sans">
      {/* Top Header & Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onOpenLogin={() => setIsAuthModalOpen(true)}
        onOpenBiometric={() => setIsBiometricModalOpen(true)}
        isOnline={isOnline}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        pendingSyncCount={pendingSyncCount}
        sheetsConfig={sheetsConfig}
        onQuickSync={handleSyncAll}
        isSyncing={isSyncing}
      />

      {/* Toast Notification Banner */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-in slide-in-from-bottom-3 duration-300">
          <div
            className={`p-4 rounded-2xl shadow-2xl border flex items-center justify-between gap-3 text-xs ${
              toast.type === 'success'
                ? 'bg-emerald-900/95 text-emerald-100 border-emerald-700'
                : toast.type === 'warning'
                ? 'bg-amber-900/95 text-amber-100 border-amber-700'
                : 'bg-slate-900/95 text-slate-100 border-slate-700'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : toast.type === 'warning' ? (
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-red-400 shrink-0" />
              )}
              <p className="font-semibold">{toast.message}</p>
            </div>
            <button
              onClick={() => setToast(null)}
              className="p-1 rounded-lg hover:bg-white/10 text-white/70 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'scanner' && (
          <ScannerView
            students={students}
            subjects={subjects}
            records={records}
            currentUser={currentUser}
            onRecordAdded={handleRecordAdded}
            isOnline={isOnline}
          />
        )}

        {activeTab === 'dashboard' && (
          <DashboardView
            records={records}
            students={students}
            subjects={subjects}
            onOpenRecordsWithFilter={handleOpenRecordsWithFilter}
          />
        )}

        {activeTab === 'records' && (
          <RecordsView
            records={records}
            students={students}
            subjects={subjects}
            onUpdateRecord={handleUpdateRecord}
            onDeleteRecord={handleDeleteRecord}
            initialFilter={initialRecordFilter}
          />
        )}

        {activeTab === 'sheets' && (
          <GoogleSheetsView
            records={records}
            config={sheetsConfig}
            onUpdateConfig={handleUpdateConfig}
            onSyncAll={handleSyncAll}
            isSyncing={isSyncing}
            isOnline={isOnline}
          />
        )}

        {activeTab === 'notifications' && (
          <NotificationView
            notifications={notifications}
            reminders={reminders}
            onUpdateReminders={handleUpdateReminders}
            students={students}
          />
        )}

        {activeTab === 'cards' && (
          <StudentCardsView students={students} />
        )}
      </main>

      {/* Modals */}
      <AuthModal
        currentUser={currentUser}
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSelectUser={handleSelectUser}
        onOpenBiometric={() => setIsBiometricModalOpen(true)}
      />

      <BiometricModal
        currentUser={currentUser}
        isOpen={isBiometricModalOpen}
        onClose={() => setIsBiometricModalOpen(false)}
        onVerified={() => {
          showToast(`Otentikasi biometrik berhasil diverifikasi untuk ${currentUser.name}!`, 'success');
        }}
      />
    </div>
  );
}
