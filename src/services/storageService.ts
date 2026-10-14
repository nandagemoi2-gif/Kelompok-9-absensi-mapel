import { AttendanceRecord, Student, Subject, GoogleSheetsConfig, NotificationLog, DailyScheduleReminder, UserProfile } from '../types/attendance';
import { INITIAL_STUDENTS, INITIAL_SUBJECTS, INITIAL_RECORDS, INITIAL_USERS, INITIAL_REMINDERS, DEFAULT_SHEETS_CONFIG } from '../data/mockData';

const KEYS = {
  RECORDS: 'siap_telkom_lpg_records_v2',
  STUDENTS: 'siap_telkom_lpg_students_v2',
  SUBJECTS: 'siap_telkom_lpg_subjects_v2',
  SHEETS_CONFIG: 'siap_telkom_lpg_sheets_config_v2',
  NOTIFICATIONS: 'siap_telkom_lpg_notifications_v2',
  REMINDERS: 'siap_telkom_lpg_reminders_v2',
  CURRENT_USER: 'siap_telkom_lpg_current_user_v2',
  THEME: 'siap_telkom_lpg_theme_v2',
};

export const storageService = {
  getRecords(): AttendanceRecord[] {
    const data = localStorage.getItem(KEYS.RECORDS);
    if (!data) {
      localStorage.setItem(KEYS.RECORDS, JSON.stringify(INITIAL_RECORDS));
      return INITIAL_RECORDS;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_RECORDS;
    }
  },

  saveRecords(records: AttendanceRecord[]): void {
    localStorage.setItem(KEYS.RECORDS, JSON.stringify(records));
  },

  addRecord(record: AttendanceRecord): AttendanceRecord[] {
    const current = this.getRecords();
    const updated = [record, ...current];
    this.saveRecords(updated);
    return updated;
  },

  getStudents(): Student[] {
    const data = localStorage.getItem(KEYS.STUDENTS);
    if (!data) {
      localStorage.setItem(KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
      return INITIAL_STUDENTS;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_STUDENTS;
    }
  },

  saveStudents(students: Student[]): void {
    localStorage.setItem(KEYS.STUDENTS, JSON.stringify(students));
  },

  getSubjects(): Subject[] {
    const data = localStorage.getItem(KEYS.SUBJECTS);
    if (!data) {
      localStorage.setItem(KEYS.SUBJECTS, JSON.stringify(INITIAL_SUBJECTS));
      return INITIAL_SUBJECTS;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_SUBJECTS;
    }
  },

  getSheetsConfig(): GoogleSheetsConfig {
    const data = localStorage.getItem(KEYS.SHEETS_CONFIG);
    if (!data) {
      localStorage.setItem(KEYS.SHEETS_CONFIG, JSON.stringify(DEFAULT_SHEETS_CONFIG));
      return DEFAULT_SHEETS_CONFIG;
    }
    try {
      return JSON.parse(data);
    } catch {
      return DEFAULT_SHEETS_CONFIG;
    }
  },

  saveSheetsConfig(config: GoogleSheetsConfig): void {
    localStorage.setItem(KEYS.SHEETS_CONFIG, JSON.stringify(config));
  },

  getNotifications(): NotificationLog[] {
    const data = localStorage.getItem(KEYS.NOTIFICATIONS);
    if (!data) {
      const initialLogs: NotificationLog[] = [
        {
          id: 'notif-1',
          type: 'email',
          recipient: 'orangtua.bagaskara@gmail.com',
          title: 'Notifikasi Keterlambatan: Bagaskara Arya Nugroho',
          message: 'Tercatat terlambat 16 menit pada Mata Pelajaran Matematika Wajib.',
          timestamp: '2026-10-14 07:46:20',
          status: 'sent',
          studentName: 'Bagaskara Arya Nugroho',
          subjectName: 'Matematika Wajib',
        },
        {
          id: 'notif-2',
          type: 'email',
          recipient: 'orangtua.dimas@gmail.com',
          title: 'Surat Peringatan Alpa: Dimas Kevin Saputra',
          message: 'Tercatat Alpa (tanpa keterangan) pada Mata Pelajaran Matematika Wajib.',
          timestamp: '2026-10-14 08:00:10',
          status: 'sent',
          studentName: 'Dimas Kevin Saputra',
          subjectName: 'Matematika Wajib',
        },
        {
          id: 'notif-3',
          type: 'push',
          recipient: 'Budi Hartono, M.Pd',
          title: 'Pengingat Jadwal Absensi Hari Ini',
          message: 'Mata pelajaran Matematika Wajib kelas XI-MIPA 1 dimulai 5 menit lagi.',
          timestamp: '2026-10-14 07:25:00',
          status: 'sent',
          subjectName: 'Matematika Wajib',
        },
      ];
      localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(initialLogs));
      return initialLogs;
    }
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  saveNotifications(logs: NotificationLog[]): void {
    localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(logs));
  },

  addNotification(log: NotificationLog): NotificationLog[] {
    const logs = this.getNotifications();
    const updated = [log, ...logs];
    this.saveNotifications(updated);
    return updated;
  },

  getReminders(): DailyScheduleReminder[] {
    const data = localStorage.getItem(KEYS.REMINDERS);
    if (!data) {
      localStorage.setItem(KEYS.REMINDERS, JSON.stringify(INITIAL_REMINDERS));
      return INITIAL_REMINDERS;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_REMINDERS;
    }
  },

  saveReminders(reminders: DailyScheduleReminder[]): void {
    localStorage.setItem(KEYS.REMINDERS, JSON.stringify(reminders));
  },

  getCurrentUser(): UserProfile {
    const data = localStorage.getItem(KEYS.CURRENT_USER);
    if (!data) {
      // Default to Guru Matematika for instant preview
      localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(INITIAL_USERS[1]));
      return INITIAL_USERS[1];
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_USERS[1];
    }
  },

  saveCurrentUser(user: UserProfile): void {
    localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
  },

  getTheme(): 'light' | 'dark' {
    const data = localStorage.getItem(KEYS.THEME);
    if (data === 'dark' || data === 'light') return data;
    return 'light';
  },

  saveTheme(theme: 'light' | 'dark'): void {
    localStorage.setItem(KEYS.THEME, theme);
  },
};
