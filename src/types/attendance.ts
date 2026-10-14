export type AttendanceStatus = 'hadir' | 'terlambat' | 'izin' | 'sakit' | 'alpa';

export type UserRole = 'admin' | 'guru';

export interface UserProfile {
  id: string;
  name: string;
  nip: string;
  email: string;
  role: UserRole;
  subject?: string;
  avatar?: string;
  hasBiometrics?: boolean;
}

export interface Student {
  id: string;
  nisn: string;
  name: string;
  classId: string;
  gender: 'L' | 'P';
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  photoUrl?: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  teacherName: string;
  teacherNip: string;
  day: string;
  timeSlot: string;
  color: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  nisn: string;
  studentName: string;
  classId: string;
  subjectId: string;
  subjectName: string;
  teacherName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm:ss
  status: AttendanceStatus;
  note?: string;
  minutesLate?: number;
  syncedToGoogleSheets: boolean;
  syncTimestamp?: string;
  emailNotificationSent: boolean;
  emailDetails?: {
    recipient: string;
    sentAt: string;
    subject: string;
    body: string;
  };
}

export interface GoogleSheetsConfig {
  spreadsheetId: string;
  sheetName: string;
  webhookUrl: string;
  autoSync: boolean;
  lastSyncedAt?: string;
  isConnected: boolean;
}

export interface NotificationLog {
  id: string;
  type: 'email' | 'push' | 'system';
  recipient: string;
  title: string;
  message: string;
  timestamp: string;
  status: 'sent' | 'pending' | 'failed';
  studentName?: string;
  subjectName?: string;
}

export interface DailyScheduleReminder {
  id: string;
  subjectName: string;
  classId: string;
  time: string;
  teacherName: string;
  isActive: boolean;
}
