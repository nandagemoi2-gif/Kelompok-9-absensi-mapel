import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Calendar, 
  BookOpen, 
  GraduationCap, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  RefreshCw,
  Mail,
  ChevronDown
} from 'lucide-react';
import { AttendanceRecord, Subject, Student, AttendanceStatus } from '../types/attendance';
import { exportService } from '../services/exportService';

interface RecordsViewProps {
  records: AttendanceRecord[];
  students: Student[];
  subjects: Subject[];
  onUpdateRecord: (record: AttendanceRecord) => void;
  onDeleteRecord: (id: string) => void;
  initialFilter?: { status?: string; subject?: string };
}

export const RecordsView: React.FC<RecordsViewProps> = ({
  records,
  students,
  subjects,
  onUpdateRecord,
  onDeleteRecord,
  initialFilter,
}) => {
  // Filter States
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>(initialFilter?.subject || 'all');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>(initialFilter?.status || 'all');
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-10'); // YYYY-MM
  const [syncStatusFilter, setSyncStatusFilter] = useState<'all' | 'synced' | 'pending'>('all');

  // Month selector options
  const months = [
    { value: '2026-10', label: 'Oktober 2026 (Bulan Ini)' },
    { value: '2026-09', label: 'September 2026' },
    { value: '2026-08', label: 'Agustus 2026' },
    { value: '2026-07', label: 'Juli 2026' },
    { value: 'all', label: 'Semua Periode' },
  ];

  // Filtered dataset
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // Month
      if (selectedMonth !== 'all' && !r.date.startsWith(selectedMonth)) {
        return false;
      }
      // Subject
      if (selectedSubject !== 'all' && r.subjectId !== selectedSubject && r.subjectName !== selectedSubject) {
        return false;
      }
      // Class
      if (selectedClass !== 'all' && r.classId !== selectedClass) {
        return false;
      }
      // Status
      if (selectedStatus !== 'all' && r.status !== selectedStatus) {
        return false;
      }
      // Sync
      if (syncStatusFilter === 'synced' && !r.syncedToGoogleSheets) return false;
      if (syncStatusFilter === 'pending' && r.syncedToGoogleSheets) return false;
      // Search
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName = r.studentName.toLowerCase().includes(query);
        const matchesNisn = r.nisn.includes(query);
        const matchesTeacher = r.teacherName.toLowerCase().includes(query);
        if (!matchesName && !matchesNisn && !matchesTeacher) return false;
      }
      return true;
    });
  }, [records, selectedMonth, selectedSubject, selectedClass, selectedStatus, syncStatusFilter, searchTerm]);

  // Status metrics for filtered set
  const stats = {
    total: filteredRecords.length,
    hadir: filteredRecords.filter((r) => r.status === 'hadir').length,
    terlambat: filteredRecords.filter((r) => r.status === 'terlambat').length,
    sakit: filteredRecords.filter((r) => r.status === 'sakit').length,
    izin: filteredRecords.filter((r) => r.status === 'izin').length,
    alpa: filteredRecords.filter((r) => r.status === 'alpa').length,
  };

  // Export PDF Handler
  const handleExportPDF = () => {
    const currentSubjectObj = subjects.find((s) => s.id === selectedSubject);
    exportService.exportToPDF(filteredRecords, {
      subject: currentSubjectObj?.name || (selectedSubject === 'all' ? 'Semua Mata Pelajaran' : selectedSubject),
      classId: selectedClass === 'all' ? 'Semua Kelas' : selectedClass,
      monthName: months.find((m) => m.value === selectedMonth)?.label || 'Oktober 2026',
      teacherName: currentSubjectObj?.teacherName || 'Guru Mata Pelajaran',
    });
  };

  // Export Excel Handler
  const handleExportExcel = () => {
    const currentSubjectObj = subjects.find((s) => s.id === selectedSubject);
    exportService.exportToExcel(filteredRecords, `Rekap_Presensi_Mapel_${selectedClass}_${selectedSubject}`, {
      subject: currentSubjectObj?.name || selectedSubject,
      classId: selectedClass,
      month: selectedMonth,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header and Filter Controls */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-red-600 dark:text-red-400" />
              <span>Rekapitulasi Kehadiran Siswa</span>
            </h2>
            <p className="text-xs text-slate-400">
              Filter data kehadiran bulanan atau per mata pelajaran jurusan RPL, TKJ, Animasi, TJAT serta ekspor resmi PDF dan Excel.
            </p>
          </div>

          {/* Export Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold text-xs shadow-md shadow-slate-700/20 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Ekspor Excel (.xlsx)</span>
            </button>

            <button
              onClick={handleExportPDF}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs shadow-md shadow-red-600/25 transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Ekspor PDF Resmi (Kop Telkom)</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 pt-2 border-t border-slate-100 dark:border-slate-700/60">
          {/* Search Box */}
          <div className="lg:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Pencarian Siswa
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari nama atau NISN..."
                className="w-full text-xs pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          {/* Month Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Bulan Presensi
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-red-500"
            >
              {months.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Subject Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Mata Pelajaran
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-red-500"
            >
              <option value="all">Semua Mapel</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Class Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Kelas & Jurusan
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-red-500"
            >
              <option value="all">Semua Kelas</option>
              {[
                '10 RPL', '10 TKJ', '10 Animasi', '10 TJAT',
                '11 RPL', '11 TKJ', '11 Animasi', '11 TJAT',
                '12 RPL', '12 TKJ', '12 Animasi', '12 TJAT'
              ].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Status Kehadiran
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 capitalize"
            >
              <option value="all">Semua Status</option>
              <option value="hadir">Hadir</option>
              <option value="terlambat">Terlambat</option>
              <option value="sakit">Sakit</option>
              <option value="izin">Izin</option>
              <option value="alpa">Alpa</option>
            </select>
          </div>
        </div>

        {/* Filter Summary Badges */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="font-semibold text-slate-500 dark:text-slate-400">Hasil Filter:</span>
          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold">
            Total {stats.total} baris
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold">
            Hadir: {stats.hadir}
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-semibold">
            Terlambat: {stats.terlambat}
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold">
            Sakit/Izin: {stats.sakit + stats.izin}
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-semibold">
            Alpa: {stats.alpa}
          </span>
        </div>
      </div>

      {/* Main Records Table Card */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-semibold">
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">Tanggal & Waktu</th>
                <th className="py-3 px-4">NISN & Nama Siswa</th>
                <th className="py-3 px-4">Kelas</th>
                <th className="py-3 px-4">Mata Pelajaran</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Keterangan / Terlambat</th>
                <th className="py-3 px-4 text-center">Google Sheets</th>
                <th className="py-3 px-4 text-center">Email Ortu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Tidak ada data presensi yang sesuai dengan kriteria filter saat ini.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r, index) => (
                  <tr
                    key={r.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="py-3 px-4 text-center text-slate-400 font-mono">{index + 1}</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                        {r.date}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{r.time} WIB</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-800 dark:text-slate-100 block">
                        {r.studentName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">NISN: {r.nisn}</span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-700 dark:text-slate-300">
                      {r.classId}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                        {r.subjectName}
                      </span>
                      <span className="text-[10px] text-slate-400">{r.teacherName.split(',')[0]}</span>
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          r.status === 'hadir'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                            : r.status === 'terlambat'
                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                            : r.status === 'alpa'
                            ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                            : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {r.minutesLate ? (
                        <span className="text-amber-600 dark:text-amber-400 font-semibold block">
                          Terlambat {r.minutesLate} menit
                        </span>
                      ) : null}
                      <span>{r.note || '-'}</span>
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {r.syncedToGoogleSheets ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Synced</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Antrean</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {r.emailNotificationSent ? (
                        <span
                          title={r.emailDetails?.recipient ? `Terkirim ke ${r.emailDetails.recipient}` : 'Email Terkirim'}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span>Terkirim</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
