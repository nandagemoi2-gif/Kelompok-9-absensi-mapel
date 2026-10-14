import React from 'react';
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  TrendingUp, 
  BookOpen, 
  School, 
  Mail, 
  Calendar,
  AlertTriangle,
  ArrowUpRight
} from 'lucide-react';
import { AttendanceRecord, Student, Subject } from '../types/attendance';

interface DashboardViewProps {
  records: AttendanceRecord[];
  students: Student[];
  subjects: Subject[];
  onOpenRecordsWithFilter: (filter: { status?: string; subject?: string }) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  records,
  students,
  subjects,
  onOpenRecordsWithFilter,
}) => {
  const totalRecords = records.length;
  const hadirCount = records.filter((r) => r.status === 'hadir').length;
  const terlambatCount = records.filter((r) => r.status === 'terlambat').length;
  const sakitCount = records.filter((r) => r.status === 'sakit').length;
  const izinCount = records.filter((r) => r.status === 'izin').length;
  const alpaCount = records.filter((r) => r.status === 'alpa').length;

  const attendanceRate = totalRecords > 0 ? Math.round(((hadirCount + terlambatCount) / totalRecords) * 100) : 0;

  // Average late minutes
  const lateRecords = records.filter((r) => r.status === 'terlambat' && r.minutesLate);
  const avgLateMinutes = lateRecords.length > 0 
    ? Math.round(lateRecords.reduce((acc, r) => acc + (r.minutesLate || 0), 0) / lateRecords.length)
    : 0;

  // Attendance by Subject
  const subjectStats = subjects.map((sub) => {
    const subRecords = records.filter((r) => r.subjectId === sub.id || r.subjectName === sub.name);
    const subHadir = subRecords.filter((r) => r.status === 'hadir' || r.status === 'terlambat').length;
    const rate = subRecords.length > 0 ? Math.round((subHadir / subRecords.length) * 100) : 100;
    return {
      id: sub.id,
      name: sub.name,
      teacher: sub.teacherName,
      color: sub.color,
      total: subRecords.length,
      hadir: subHadir,
      alpa: subRecords.filter((r) => r.status === 'alpa').length,
      rate,
    };
  });

  // Watchlist: students with chronic late or alpa
  const studentIssueMap: Record<string, { student: Student; alpa: number; terlambat: number }> = {};
  students.forEach((s) => {
    const sRecords = records.filter((r) => r.studentId === s.id);
    const alpas = sRecords.filter((r) => r.status === 'alpa').length;
    const lates = sRecords.filter((r) => r.status === 'terlambat').length;
    if (alpas > 0 || lates > 0) {
      studentIssueMap[s.id] = { student: s, alpa: alpas, terlambat: lates };
    }
  });

  const watchlist = Object.values(studentIssueMap).sort(
    (a, b) => b.alpa * 2 + b.terlambat - (a.alpa * 2 + a.terlambat)
  );

  return (
    <div className="space-y-6">
      {/* Top Banner Overview */}
      <div className="bg-gradient-to-r from-red-700 via-rose-700 to-slate-900 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-md">
              <TrendingUp className="w-3.5 h-3.5 text-red-200" />
              <span>SMK TELKOM LAMPUNG • Semester Ganjil 2026/2027</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Dashboard Monitoring Kehadiran Mapel
            </h2>
            <p className="text-xs sm:text-sm text-red-100 max-w-2xl">
              Pantau kedisiplinan dan absensi siswa jurusan RPL, TKJ, Animasi, dan TJAT (Kelas 10, 11, 12) dengan sinkronisasi real-time Google Sheets.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-center min-w-[160px]">
            <span className="text-xs text-red-200 block font-medium">Tingkat Kehadiran Total</span>
            <span className="text-3xl font-extrabold tracking-tight">{attendanceRate}%</span>
            <span className="text-[10px] text-white/90 block font-semibold mt-0.5">
              Standar Telkom: ≥ 92%
            </span>
          </div>
        </div>

        {/* Decorative backdrop elements */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-red-500/20 rounded-full blur-xl" />
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Presensi */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Total Presensi</span>
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">{totalRecords}</span>
            <span className="text-[11px] text-slate-400 block">data presensi mapel</span>
          </div>
        </div>

        {/* Hadir Tepat Waktu */}
        <div 
          onClick={() => onOpenRecordsWithFilter({ status: 'hadir' })}
          className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer hover:border-emerald-400 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Hadir Tepat Waktu</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{hadirCount}</span>
            <span className="text-[11px] text-slate-400 block">
              {totalRecords ? Math.round((hadirCount / totalRecords) * 100) : 0}% dari total
            </span>
          </div>
        </div>

        {/* Terlambat */}
        <div 
          onClick={() => onOpenRecordsWithFilter({ status: 'terlambat' })}
          className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer hover:border-amber-400 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Terlambat</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">{terlambatCount}</span>
            <span className="text-[11px] text-slate-400 block">
              rerata {avgLateMinutes} menit
            </span>
          </div>
        </div>

        {/* Sakit & Izin */}
        <div 
          onClick={() => onOpenRecordsWithFilter({ status: 'izin' })}
          className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer hover:border-blue-400 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Izin / Sakit</span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">{sakitCount + izinCount}</span>
            <span className="text-[11px] text-slate-400 block">
              Sakit: {sakitCount} | Izin: {izinCount}
            </span>
          </div>
        </div>

        {/* Alpa */}
        <div 
          onClick={() => onOpenRecordsWithFilter({ status: 'alpa' })}
          className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer hover:border-rose-400 transition-colors col-span-2 lg:col-span-1"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Alpa (Tanpa Ket.)</span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">{alpaCount}</span>
            <span className="text-[11px] text-rose-500 font-semibold block">
              Perlu tindak lanjut
            </span>
          </div>
        </div>
      </div>

      {/* Main Analytics Grid: Subject Performance & Watchlist */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Performa Kehadiran per Mata Pelajaran */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-red-600 dark:text-red-400" />
                <span>Tingkat Kehadiran per Mata Pelajaran (RPL, TKJ, Animasi, TJAT)</span>
              </h3>
              <p className="text-xs text-slate-400">Perbandingan rasio presensi siswa menurut mata pelajaran</p>
            </div>
          </div>

          <div className="space-y-4 pt-1">
            {subjectStats.map((sub) => (
              <div key={sub.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: sub.color }}
                    />
                    <span className="font-bold text-slate-800 dark:text-slate-200">{sub.name}</span>
                    <span className="text-slate-400 text-[11px]">({sub.teacher.split(',')[0]})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 text-[11px]">{sub.hadir} hadir / {sub.total} total</span>
                    <span className={`font-extrabold text-xs ${
                      sub.rate >= 90 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'
                    }`}>
                      {sub.rate}%
                    </span>
                  </div>
                </div>

                <div className="w-full bg-slate-100 dark:bg-slate-700/60 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${sub.rate}%`,
                      backgroundColor: sub.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Siswa Dalam Pantauan Khusus (Chronic Late / Alpa) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>Pantauan Disiplin Siswa</span>
              </h3>
              <p className="text-xs text-slate-400">Siswa dengan riwayat alpa & keterlambatan berulang</p>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[10px] font-bold">
              {watchlist.length} Siswa
            </span>
          </div>

          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {watchlist.length === 0 ? (
              <p className="text-center py-8 text-xs text-slate-400">
                Luar biasa! Tidak ada siswa dengan riwayat alpa atau terlambat tercatat.
              </p>
            ) : (
              watchlist.map(({ student, alpa, terlambat }) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-xs"
                >
                  <div>
                    <h5 className="font-bold text-slate-800 dark:text-slate-200">{student.name}</h5>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Kelas: {student.classId} | NISN: {student.nisn}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {alpa > 0 && (
                      <span className="px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold text-[10px]">
                        {alpa}x Alpa
                      </span>
                    )}
                    {terlambat > 0 && (
                      <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold text-[10px]">
                        {terlambat}x Telat
                      </span>
                    )}
                    <a
                      href={`mailto:${student.parentEmail}?subject=Konsultasi Presensi Siswa ${encodeURIComponent(student.name)}`}
                      title={`Kirim email ke ${student.parentEmail}`}
                      className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
