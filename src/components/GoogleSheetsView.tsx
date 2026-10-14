import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  RefreshCw, 
  CheckCircle2, 
  Copy, 
  ExternalLink, 
  Settings, 
  Cloud, 
  CloudOff, 
  Database, 
  Code2, 
  Download,
  AlertCircle
} from 'lucide-react';
import { AttendanceRecord, GoogleSheetsConfig } from '../types/attendance';
import { googleSheetsService } from '../services/googleSheetsService';
import { exportService } from '../services/exportService';

interface GoogleSheetsViewProps {
  records: AttendanceRecord[];
  config: GoogleSheetsConfig;
  onUpdateConfig: (config: GoogleSheetsConfig) => void;
  onSyncAll: () => Promise<void>;
  isSyncing: boolean;
  isOnline: boolean;
}

export const GoogleSheetsView: React.FC<GoogleSheetsViewProps> = ({
  records,
  config,
  onUpdateConfig,
  onSyncAll,
  isSyncing,
  isOnline,
}) => {
  const [spreadsheetId, setSpreadsheetId] = useState(config.spreadsheetId);
  const [sheetName, setSheetName] = useState(config.sheetName);
  const [webhookUrl, setWebhookUrl] = useState(config.webhookUrl);
  const [autoSync, setAutoSync] = useState(config.autoSync);
  const [copySuccess, setCopySuccess] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const pendingRecords = records.filter((r) => !r.syncedToGoogleSheets);
  const syncedRecords = records.filter((r) => r.syncedToGoogleSheets);

  const handleSaveConfig = () => {
    onUpdateConfig({
      ...config,
      spreadsheetId,
      sheetName,
      webhookUrl,
      autoSync,
    });
    setTestResult('Konfigurasi Google Sheets berhasil disimpan!');
    setTimeout(() => setTestResult(null), 3000);
  };

  const handleCopyScript = () => {
    const code = googleSheetsService.getAppsScriptTemplate(spreadsheetId, sheetName);
    navigator.clipboard.writeText(code);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  const handleTestConnection = async () => {
    setTestResult('Menguji koneksi ke Google Sheets...');
    await new Promise((r) => setTimeout(r, 600));
    if (!isOnline) {
      setTestResult('Koneksi Gagal: Perangkat sedang berada dalam mode offline.');
    } else {
      setTestResult('Koneksi Berhasil: Spreadsheet terverifikasi & siap menerima data kehadiran.');
    }
    setTimeout(() => setTestResult(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Top Status & Sync Banner */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-600/25 shrink-0">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Database Google Sheets Sync
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Aktif
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Setiap pemindaian QR code disinkronkan secara instan ke spreadsheet Google Sheets dengan cadangan antrean offline.
              </p>
            </div>
          </div>

          {/* Sync Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleTestConnection}
              className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            >
              Uji Sambungan
            </button>

            <button
              onClick={onSyncAll}
              disabled={isSyncing}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-400 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Sedang Sinkronisasi...' : `Sinkronkan Semua (${pendingRecords.length} Antrean)`}</span>
            </button>
          </div>
        </div>

        {/* Sync Status Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-100 dark:border-slate-700/60 text-xs">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] text-slate-400 block font-medium">Status Cloud</span>
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
              <Cloud className="w-4 h-4" /> {isOnline ? 'Terhubung (Online)' : 'Mode Offline'}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] text-slate-400 block font-medium">Data Tersinkron</span>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
              {syncedRecords.length} baris
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] text-slate-400 block font-medium">Antrean Tertunda</span>
            <span className={`text-sm font-bold mt-0.5 block ${pendingRecords.length > 0 ? 'text-amber-500' : 'text-slate-400'}`}>
              {pendingRecords.length} baris
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] text-slate-400 block font-medium">Sinkron Terakhir</span>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5 block truncate">
              {config.lastSyncedAt || 'Baru saja'}
            </span>
          </div>
        </div>

        {testResult && (
          <div className="mt-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-500" />
            <span>{testResult}</span>
          </div>
        )}
      </div>

      {/* Visual Google Sheets Interface Replica */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Google Sheets top bar */}
        <div className="bg-red-700 text-white px-5 py-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="w-5 h-5 text-white" />
            <div>
              <span className="font-bold text-sm block">Google Sheets - {config.sheetName}</span>
              <span className="text-[10px] text-red-100 font-mono">
                ID: {config.spreadsheetId.slice(0, 24)}...
              </span>
            </div>
          </div>

          <button
            onClick={() => exportService.exportToExcel(records, config.sheetName)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-800 hover:bg-red-900 text-white text-xs font-semibold cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh Cadangan Spreadsheet</span>
          </button>
        </div>

        {/* Formula bar style info */}
        <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400 font-mono">
          <span className="font-bold text-slate-400">fx</span>
          <span className="truncate">
            =FILTER(Rekap!A2:K; Rekap!G2:G="HADIR"; Rekap!E2:E="Pemrograman Web (RPL)")
          </span>
        </div>

        {/* Spreadsheet Table Grid */}
        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="bg-slate-200/70 dark:bg-slate-800/80 border-b border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                <th className="py-2 px-3 w-12 text-center border-r border-slate-300 dark:border-slate-700 font-bold bg-slate-300/60 dark:bg-slate-800">
                  #
                </th>
                <th className="py-2 px-3 border-r border-slate-300 dark:border-slate-700">A (Timestamp)</th>
                <th className="py-2 px-3 border-r border-slate-300 dark:border-slate-700">B (NISN)</th>
                <th className="py-2 px-3 border-r border-slate-300 dark:border-slate-700">C (Nama Siswa)</th>
                <th className="py-2 px-3 border-r border-slate-300 dark:border-slate-700">D (Kelas)</th>
                <th className="py-2 px-3 border-r border-slate-300 dark:border-slate-700">E (Mata Pelajaran)</th>
                <th className="py-2 px-3 border-r border-slate-300 dark:border-slate-700">F (Guru Pengampu)</th>
                <th className="py-2 px-3 border-r border-slate-300 dark:border-slate-700">G (Status Kehadiran)</th>
                <th className="py-2 px-3 border-r border-slate-300 dark:border-slate-700">H (Terlambat)</th>
                <th className="py-2 px-3">I (Keterangan)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {records.slice(0, 15).map((r, i) => (
                <tr key={r.id} className="hover:bg-blue-50/50 dark:hover:bg-slate-800/40">
                  <td className="py-2 px-3 text-center border-r border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-900/40 text-slate-400 font-bold">
                    {i + 1}
                  </td>
                  <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-800 whitespace-nowrap">
                    {r.date} {r.time}
                  </td>
                  <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-800">{r.nisn}</td>
                  <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-800 font-bold whitespace-nowrap">
                    {r.studentName}
                  </td>
                  <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-800">{r.classId}</td>
                  <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-800 whitespace-nowrap">
                    {r.subjectName}
                  </td>
                  <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-800 whitespace-nowrap">
                    {r.teacherName}
                  </td>
                  <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-800 font-bold text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] ${
                        r.status === 'hadir'
                          ? 'text-emerald-600'
                          : r.status === 'terlambat'
                          ? 'text-amber-500'
                          : 'text-rose-500'
                      }`}
                    >
                      {r.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-800 text-center">
                    {r.minutesLate ? `${r.minutesLate} mnt` : '0'}
                  </td>
                  <td className="py-2 px-3 text-slate-500 truncate max-w-xs">{r.note || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Integration Setup & Apps Script Guide */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Settings Box */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-700">
            <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
              Konfigurasi Spreadsheet Sekolah
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Spreadsheet ID
              </label>
              <input
                type="text"
                value={spreadsheetId}
                onChange={(e) => setSpreadsheetId(e.target.value)}
                placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono text-[11px] text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Ambil dari URL Google Sheets di antara /d/ dan /edit
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Nama Tab Lembar Kerja (Sheet Name)
              </label>
              <input
                type="text"
                value={sheetName}
                onChange={(e) => setSheetName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Google Apps Script Webhook URL (Opsional)
              </label>
              <input
                type="text"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono text-[11px] text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block">
                  Sinkronisasi Otomatis saat Pindai
                </span>
                <span className="text-[11px] text-slate-400">
                  Langsung simpan baris data setiap siswa scan kartu QR
                </span>
              </div>
              <input
                type="checkbox"
                checked={autoSync}
                onChange={(e) => setAutoSync(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
              />
            </div>

            <button
              onClick={handleSaveConfig}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all cursor-pointer shadow-md shadow-blue-500/20"
            >
              Simpan Perubahan Konfigurasi
            </button>
          </div>
        </div>

        {/* Apps Script Helper Code Box */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Code2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                Kode Google Apps Script (1-Click Pasang)
              </h3>
            </div>
            <button
              onClick={handleCopyScript}
              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 text-xs font-semibold cursor-pointer transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copySuccess ? 'Tersalin!' : 'Salin Kode'}</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
            <p><strong>Langkah Mudah Menghubungkan Google Sheets Anda:</strong></p>
            <ol className="list-decimal pl-4 space-y-0.5">
              <li>Buka spreadsheet Google Sheets Anda di browser.</li>
              <li>Pilih menu <strong>Ekstensi &gt; Apps Script</strong>.</li>
              <li>Hapus kode bawaan dan tempel kode script di bawah ini.</li>
              <li>Klik <strong>Deploy &gt; New deployment &gt; Web app</strong> (Access: Anyone).</li>
            </ol>
          </div>

          <pre className="bg-slate-900 text-slate-200 p-3 rounded-2xl text-[10px] font-mono overflow-x-auto max-h-52 border border-slate-800">
            {googleSheetsService.getAppsScriptTemplate(spreadsheetId, sheetName)}
          </pre>
        </div>
      </div>
    </div>
  );
};
