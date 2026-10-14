import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  Printer, 
  Download, 
  Search, 
  ContactRound, 
  Copy, 
  CheckCircle2, 
  GraduationCap, 
  Sparkles,
  QrCode
} from 'lucide-react';
import { Student } from '../types/attendance';

interface StudentCardsViewProps {
  students: Student[];
}

export const StudentCardsView: React.FC<StudentCardsViewProps> = ({ students }) => {
  const [selectedClass, setSelectedClass] = useState<string>('11 RPL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [qrCodeUrls, setQrCodeUrls] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Generate QR code data URLs for students
  useEffect(() => {
    const generateQrs = async () => {
      const urls: Record<string, string> = {};
      for (const s of students) {
        try {
          // Standard payload: "SIAP:NISN:Nama:Kelas"
          const payload = `SIAP:${s.nisn}:${s.name}:${s.classId}`;
          const url = await QRCode.toDataURL(payload, {
            width: 256,
            margin: 1.5,
            color: {
              dark: '#1e293b',
              light: '#ffffff',
            },
          });
          urls[s.id] = url;
        } catch (err) {
          console.error('Failed to generate QR:', err);
        }
      }
      setQrCodeUrls(urls);
    };
    generateQrs();
  }, [students]);

  const filteredStudents = students.filter((s) => {
    if (selectedClass !== 'all' && s.classId !== selectedClass) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return s.name.toLowerCase().includes(q) || s.nisn.includes(q);
    }
    return true;
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadQR = (student: Student) => {
    const url = qrCodeUrls[student.id];
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = `QR_${student.nisn}_${student.name.replace(/\s+/g, '_')}.png`;
    a.click();
  };

  const handleCopyPayload = (student: Student) => {
    const payload = `SIAP:${student.nisn}:${student.name}:${student.classId}`;
    navigator.clipboard.writeText(payload);
    setCopiedId(student.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner and Filter Bar (hidden on print) */}
      <div className="no-print bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-md shadow-red-600/25">
              <ContactRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Cetak Kartu Pelajar Ber-QR Code
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Kartu identitas resmi siswa SMK TELKOM LAMPUNG (RPL • TKJ • Animasi • TJAT) siap dipindai kamera.
              </p>
            </div>
          </div>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs shadow-md shadow-red-600/25 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Semua Kartu ({filteredStudents.length} Siswa)</span>
          </button>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-slate-700/60">
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Cari Siswa
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama atau NISN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Filter Kelas & Jurusan
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-red-500"
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
        </div>
      </div>

      {/* Cards Display Grid (Print friendly) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStudents.map((student) => {
          const qrUrl = qrCodeUrls[student.id];
          return (
            <div
              key={student.id}
              className="bg-white rounded-3xl p-5 shadow-md border-2 border-slate-200 dark:border-slate-700 flex flex-col justify-between relative overflow-hidden transition-all hover:border-red-500 group"
              style={{
                pageBreakInside: 'avoid',
              }}
            >
              {/* Card School Header */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white font-extrabold text-xs shadow-sm shadow-red-600/30">
                    TL
                  </div>
                  <div>
                    <h4 className="text-xs font-black tracking-tight text-slate-900 leading-tight">
                      SMK TELKOM LAMPUNG
                    </h4>
                    <p className="text-[9px] uppercase tracking-wider text-red-600 font-bold">
                      KARTU IDENTITAS PRESENSI SISWA
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-200">
                  {student.classId}
                </span>
              </div>

              {/* Student Info & QR Code */}
              <div className="flex items-center gap-4 py-4">
                {/* QR Code */}
                <div className="w-28 h-28 bg-white p-1 rounded-2xl border border-slate-200 shadow-inner flex items-center justify-center shrink-0">
                  {qrUrl ? (
                    <img
                      src={qrUrl}
                      alt={`QR Code ${student.name}`}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <QrCode className="w-8 h-8 text-slate-300 animate-spin" />
                  )}
                </div>

                {/* Details */}
                <div className="space-y-1 text-xs">
                  <div>
                    <span className="text-[9px] text-slate-400 font-semibold uppercase block">
                      Nama Lengkap
                    </span>
                    <h3 className="font-extrabold text-sm text-slate-900 leading-tight">
                      {student.name}
                    </h3>
                  </div>

                  <div>
                    <span className="text-[9px] text-slate-400 font-semibold uppercase block">
                      NISN / Nomor Induk
                    </span>
                    <span className="font-mono font-bold text-xs text-red-700 bg-red-50 px-1.5 py-0.5 rounded border border-red-100">
                      {student.nisn}
                    </span>
                  </div>

                  <div>
                    <span className="text-[9px] text-slate-400 font-semibold uppercase block">
                      Jenis Kelamin / Wali
                    </span>
                    <span className="text-[11px] text-slate-700 font-medium">
                      {student.gender === 'L' ? 'Laki-Laki' : 'Perempuan'} • {student.parentName.split(' ')[0]}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions (hidden in print) */}
              <div className="no-print pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <button
                  onClick={() => handleCopyPayload(student)}
                  className="flex items-center gap-1 text-slate-500 hover:text-red-600 font-medium cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedId === student.id ? 'Tersalin!' : 'Salin Kode'}</span>
                </button>

                <button
                  onClick={() => handleDownloadQR(student)}
                  className="flex items-center gap-1 text-red-600 hover:text-red-700 font-bold cursor-pointer"
                >
                  <Download className="w-3 h-3" />
                  <span>Unduh PNG</span>
                </button>
              </div>

              {/* Print-only footer */}
              <div className="print-only hidden pt-2 border-t border-slate-200 text-[8px] text-slate-500 text-center">
                SMK TELKOM LAMPUNG • RPL • TKJ • Animasi • TJAT (2026/2027) • Harap dibawa setiap jam praktikum/mapel
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
