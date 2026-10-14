import React, { useState } from 'react';
import { 
  Bell, 
  Mail, 
  Clock, 
  Plus, 
  Volume2, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Eye, 
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { NotificationLog, DailyScheduleReminder, Student } from '../types/attendance';
import { pushNotificationService } from '../services/pushNotificationService';

interface NotificationViewProps {
  notifications: NotificationLog[];
  reminders: DailyScheduleReminder[];
  onUpdateReminders: (reminders: DailyScheduleReminder[]) => void;
  students: Student[];
}

export const NotificationView: React.FC<NotificationViewProps> = ({
  notifications,
  reminders,
  onUpdateReminders,
  students,
}) => {
  const [selectedNotif, setSelectedNotif] = useState<NotificationLog | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(
    typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'
  );
  const [testStatus, setTestStatus] = useState<string | null>(null);

  // New Reminder Form State
  const [newSubject, setNewSubject] = useState('Matematika Wajib');
  const [newClass, setNewClass] = useState('XI-MIPA 1');
  const [newTime, setNewTime] = useState('07:25');

  const handleRequestPermission = async () => {
    const granted = await pushNotificationService.requestPermission();
    setPermissionGranted(granted);
    if (granted) {
      setTestStatus('Izin notifikasi browser berhasil diaktifkan!');
      pushNotificationService.sendNotification('SIAP-Mapel: Notifikasi Aktif!', {
        body: 'Pengingat jadwal absensi harian Anda siap dikirimkan.',
      });
      pushNotificationService.playAudioCue('bell');
    } else {
      setTestStatus('Izin notifikasi ditolak oleh browser.');
    }
    setTimeout(() => setTestStatus(null), 4000);
  };

  const handleTriggerTestPush = () => {
    pushNotificationService.playAudioCue('bell');
    pushNotificationService.vibrate([100, 50, 100]);
    pushNotificationService.sendNotification('⏰ Pengingat Absensi Mapel:', {
      body: 'Waktunya absensi Mata Pelajaran Matematika Wajib kelas XI-MIPA 1!',
    });
    setTestStatus('Notifikasi pengingat & audio bel berhasil dibunyikan!');
    setTimeout(() => setTestStatus(null), 3500);
  };

  const handleToggleReminder = (id: string) => {
    const updated = reminders.map((rem) =>
      rem.id === id ? { ...rem, isActive: !rem.isActive } : rem
    );
    onUpdateReminders(updated);
  };

  const handleAddReminder = (e: React.FormEvent) => {
    e.preventDefault();
    const newRem: DailyScheduleReminder = {
      id: `rem-${Date.now()}`,
      subjectName: newSubject,
      classId: newClass,
      time: newTime,
      teacherName: 'Guru Pengampu',
      isActive: true,
    };
    onUpdateReminders([...reminders, newRem]);
    setTestStatus(`Pengingat ${newSubject} pukul ${newTime} berhasil ditambahkan!`);
    setTimeout(() => setTestStatus(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-600/25 shrink-0">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Pusat Notifikasi Email & Pengingat Push Harian
                </h2>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                  permissionGranted 
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' 
                    : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                }`}>
                  {permissionGranted ? 'Push Aktif' : 'Izin Push Dibutuhkan'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Otomatisasi pengiriman email ke orang tua saat siswa absen/terlambat dan alarm pengingat jam masuk mapel guru.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {!permissionGranted && (
              <button
                onClick={handleRequestPermission}
                className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-md shadow-red-600/20 transition-all cursor-pointer"
              >
                Aktifkan Izin Browser
              </button>
            )}

            <button
              onClick={handleTriggerTestPush}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900 hover:bg-red-100 text-xs font-semibold transition-all cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Uji Bunyi Bel & Push</span>
            </button>
          </div>
        </div>

        {testStatus && (
          <div className="mt-4 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>{testStatus}</span>
          </div>
        )}
      </div>

      {/* Main Grid: Reminders on Left, Outbox on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Daily Schedule Reminders */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-red-600 dark:text-red-400" />
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                  Jadwal Pengingat Absensi Harian
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">
                {reminders.filter((r) => r.isActive).length} Aktif
              </span>
            </div>

            {/* List of Reminders */}
            <div className="space-y-2.5">
              {reminders.map((rem) => (
                <div
                  key={rem.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-950 flex items-center justify-center text-red-600 dark:text-red-400 font-bold font-mono text-xs">
                      {rem.time}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{rem.subjectName}</p>
                      <p className="text-[11px] text-slate-400">Kelas: {rem.classId}</p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rem.isActive}
                      onChange={() => handleToggleReminder(rem.id)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600"></div>
                  </label>
                </div>
              ))}
            </div>

            {/* Add New Reminder Form */}
            <form onSubmit={handleAddReminder} className="pt-2 border-t border-slate-100 dark:border-slate-700 space-y-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Tambah Alarm Pengingat Baru
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <input
                  type="text"
                  placeholder="Nama Mapel"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-red-500"
                  required
                />
                <input
                  type="text"
                  placeholder="Kelas (e.g. 11 RPL)"
                  value={newClass}
                  onChange={(e) => setNewClass(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-red-500"
                  required
                />
                <button
                  type="submit"
                  className="flex-1 py-2 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Pasang Alarm</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Automated Email Outbox & Audit Logs */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-red-600 dark:text-red-400" />
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                  Log Notifikasi Email Orang Tua (Terkirim Otomatis)
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                {notifications.filter((n) => n.type === 'email').length} Email
              </span>
            </div>

            {/* List of Sent Email Notifications */}
            <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
              {notifications.filter((n) => n.type === 'email').length === 0 ? (
                <p className="text-center py-10 text-xs text-slate-400">
                  Belum ada notifikasi email terkirim. Notifikasi otomatis dibuat saat siswa alpa atau terlambat.
                </p>
              ) : (
                notifications
                  .filter((n) => n.type === 'email')
                  .map((log) => (
                    <div
                      key={log.id}
                      onClick={() => setSelectedNotif(log)}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="font-bold text-slate-900 dark:text-white">
                            {log.studentName}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">{log.timestamp}</span>
                      </div>

                      <p className="text-slate-600 dark:text-slate-300 font-medium line-clamp-1">
                        {log.title}
                      </p>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                        <span>Penerima: {log.recipient}</span>
                        <span className="text-red-600 dark:text-red-400 font-semibold flex items-center gap-1">
                          <Eye className="w-3 h-3" /> Lihat Surat
                        </span>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Email Letter Preview Modal */}
      {selectedNotif && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  Pratinjau Surat Notifikasi Elektronik
                </span>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {selectedNotif.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedNotif(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="grid grid-cols-3 gap-1 pb-2 border-b border-slate-200 dark:border-slate-800">
                <span className="text-slate-400">Kepada:</span>
                <span className="col-span-2 font-semibold text-slate-800 dark:text-slate-200 font-mono">
                  {selectedNotif.recipient}
                </span>
                <span className="text-slate-400">Waktu Kirim:</span>
                <span className="col-span-2 font-mono">{selectedNotif.timestamp} WIB</span>
                <span className="text-slate-400">Status Server:</span>
                <span className="col-span-2 text-emerald-600 font-bold">Terkirim (SMTP 200 OK)</span>
              </div>

              <div className="pt-2 whitespace-pre-line text-xs font-serif leading-relaxed text-slate-800 dark:text-slate-200">
                {selectedNotif.message}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <a
                href={`mailto:${selectedNotif.recipient}?subject=${encodeURIComponent(
                  selectedNotif.title
                )}`}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Buka di Aplikasi Email</span>
              </a>
              <button
                onClick={() => setSelectedNotif(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
