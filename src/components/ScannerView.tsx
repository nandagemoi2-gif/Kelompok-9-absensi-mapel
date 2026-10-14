import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import confetti from 'canvas-confetti';
import { 
  Camera, 
  CameraOff, 
  RefreshCw, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Sparkles, 
  UserPlus, 
  Volume2, 
  FileSpreadsheet, 
  Mail, 
  Info,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { Student, Subject, AttendanceRecord, AttendanceStatus, UserProfile } from '../types/attendance';
import { pushNotificationService } from '../services/pushNotificationService';

interface ScannerViewProps {
  students: Student[];
  subjects: Subject[];
  records: AttendanceRecord[];
  currentUser: UserProfile;
  onRecordAdded: (record: AttendanceRecord) => void;
  isOnline: boolean;
}

export const ScannerView: React.FC<ScannerViewProps> = ({
  students,
  subjects,
  records,
  currentUser,
  onRecordAdded,
  isOnline,
}) => {
  // Current active teaching session
  const defaultSubject = subjects.find(s => s.name === currentUser.subject) || subjects[0];
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(defaultSubject?.id || 'sub-rpl');
  const [selectedClassId, setSelectedClassId] = useState<string>('11 RPL');
  const [attendanceMode, setAttendanceMode] = useState<AttendanceStatus>('hadir');
  const [customNote, setCustomNote] = useState<string>('');

  // Camera scanner states
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [lastScannedRecord, setLastScannedRecord] = useState<AttendanceRecord | null>(null);
  const [lastScannedStudent, setLastScannedStudent] = useState<Student | null>(null);
  const [scanMessage, setScanMessage] = useState<{ text: string; type: 'success' | 'warning' | 'error' } | null>(null);

  // Manual entry modal state
  const [showManualModal, setShowManualModal] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const isScanningRef = useRef<boolean>(false);

  const activeSubject = subjects.find((s) => s.id === selectedSubjectId) || subjects[0];

  // Students belonging to current class
  const classStudents = students.filter((s) => s.classId === selectedClassId);

  // Today's attendance records for this subject & class
  const todayDate = new Date().toISOString().slice(0, 10);
  const todayRecords = records.filter(
    (r) => r.date === todayDate && r.subjectId === selectedSubjectId && r.classId === selectedClassId
  );

  // Start Camera
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setIsCameraActive(true);
        isScanningRef.current = true;
        requestScan();
      }
    } catch (err: any) {
      console.warn('Camera access issue:', err);
      setCameraError(
        'Kamera tidak dapat diakses atau izin belum diberikan. Anda tetap bisa menggunakan pemindaian file QR atau tombol uji cepat siswa.'
      );
      setIsCameraActive(false);
    }
  };

  // Stop Camera
  const stopCamera = () => {
    isScanningRef.current = false;
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  // Switch Camera between Front & Back
  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  useEffect(() => {
    if (isCameraActive) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  // Frame scanner loop
  const requestScan = () => {
    if (!isScanningRef.current) return;

    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });

          if (code && code.data) {
            handleScannedPayload(code.data);
            // Throttle consecutive scans
            setTimeout(() => {
              if (isScanningRef.current) {
                animationFrameId.current = requestAnimationFrame(requestScan);
              }
            }, 1800);
            return;
          }
        }
      }
    }
    animationFrameId.current = requestAnimationFrame(requestScan);
  };

  // Parse QR Payload and register attendance
  const handleScannedPayload = (payload: string) => {
    const trimmed = payload.trim();
    // Parse NISN from "SIAP:NISN:Name:Class" or plain NISN
    let extractedNisn = trimmed;
    if (trimmed.startsWith('SIAP:')) {
      const parts = trimmed.split(':');
      if (parts.length >= 2) {
        extractedNisn = parts[1];
      }
    }

    const student = students.find((s) => s.nisn === extractedNisn || s.name.toLowerCase() === trimmed.toLowerCase());

    if (!student) {
      pushNotificationService.playAudioCue('error');
      pushNotificationService.vibrate([100, 100, 100]);
      setScanMessage({
        text: `QR Code tidak dikenali sebagai NISN terdaftar (${trimmed}). Pastikan kode QR valid.`,
        type: 'error',
      });
      return;
    }

    recordStudentAttendance(student);
  };

  // Core attendance logger
  const recordStudentAttendance = (student: Student, overrideStatus?: AttendanceStatus, note?: string) => {
    const now = new Date();
    const timeStr = now.toTimeString().slice(0, 8);
    const dateStr = now.toISOString().slice(0, 10);

    // Check if already checked in today for this subject
    const existing = todayRecords.find((r) => r.studentId === student.id);
    if (existing) {
      pushNotificationService.playAudioCue('warning');
      setScanMessage({
        text: `${student.name} sudah tercatat presensi sebelumnya pada pukul ${existing.time} WIB (${existing.status.toUpperCase()}).`,
        type: 'warning',
      });
      setLastScannedRecord(existing);
      setLastScannedStudent(student);
      return;
    }

    // Determine status & minutes late
    const statusToUse = overrideStatus || attendanceMode;
    let minutesLate = 0;

    // Calculate late minutes if lesson start time is parsed
    if (statusToUse === 'terlambat') {
      minutesLate = 15;
    } else if (statusToUse === 'hadir' && activeSubject?.timeSlot) {
      const [startTimeStr] = activeSubject.timeSlot.split('-');
      if (startTimeStr) {
        const [startH, startM] = startTimeStr.trim().split(':').map(Number);
        const schedTime = new Date();
        schedTime.setHours(startH, startM, 0, 0);

        if (now.getTime() > schedTime.getTime() + 10 * 60 * 1000) {
          // Late by more than 10 minutes from schedule
          minutesLate = Math.round((now.getTime() - schedTime.getTime()) / (60 * 1000));
        }
      }
    }

    const finalStatus: AttendanceStatus = minutesLate > 10 && statusToUse === 'hadir' ? 'terlambat' : statusToUse;

    const newRecord: AttendanceRecord = {
      id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      studentId: student.id,
      nisn: student.nisn,
      studentName: student.name,
      classId: selectedClassId,
      subjectId: selectedSubjectId,
      subjectName: activeSubject.name,
      teacherName: activeSubject.teacherName || currentUser.name,
      date: dateStr,
      time: timeStr,
      status: finalStatus,
      minutesLate: minutesLate > 0 ? minutesLate : undefined,
      note: note || customNote || (finalStatus === 'terlambat' ? `Terlambat ${minutesLate || 15} menit` : undefined),
      syncedToGoogleSheets: isOnline,
      syncTimestamp: isOnline ? `${dateStr} ${timeStr}` : undefined,
      emailNotificationSent: finalStatus === 'alpa' || finalStatus === 'terlambat',
    };

    onRecordAdded(newRecord);
    setLastScannedRecord(newRecord);
    setLastScannedStudent(student);

    // Audio & sensory cues
    if (finalStatus === 'hadir') {
      pushNotificationService.playAudioCue('success');
      pushNotificationService.vibrate(120);
      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.8 },
        });
      } catch {}
      setScanMessage({
        text: `Presensi HADIR berhasil: ${student.name} (${student.nisn})`,
        type: 'success',
      });
    } else if (finalStatus === 'terlambat') {
      pushNotificationService.playAudioCue('warning');
      pushNotificationService.vibrate([150, 80, 150]);
      setScanMessage({
        text: `Presensi TERLAMBAT (${minutesLate || 15} mnt): ${student.name}. Notifikasi email otomatis dikirim ke ${student.parentEmail}.`,
        type: 'warning',
      });
    } else {
      pushNotificationService.playAudioCue('bell');
      setScanMessage({
        text: `Status ${finalStatus.toUpperCase()} tercatat untuk ${student.name}.`,
        type: 'warning',
      });
    }
  };

  // Upload QR code image from file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imgData.data, imgData.width, imgData.height);
          if (code && code.data) {
            handleScannedPayload(code.data);
          } else {
            pushNotificationService.playAudioCue('error');
            setScanMessage({
              text: 'Tidak dapat menemukan kode QR valid pada gambar yang diunggah.',
              type: 'error',
            });
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    // Reset file input
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Top Session Configuration Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                Sesi Presensi Mata Pelajaran Aktif
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Arahkan kartu QR siswa ke kamera atau gunakan simulasi uji cepat untuk memasukkan data kehadiran.
            </p>
          </div>

          {/* Subject & Class Selectors */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="flex-1 sm:flex-initial">
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Mata Pelajaran
              </label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
              >
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name} ({sub.teacherName.split(',')[0]})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 sm:flex-initial">
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Kelas & Jurusan
              </label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-red-500"
              >
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

            <div className="flex-1 sm:flex-initial">
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Mode Presensi Saat Ini
              </label>
              <div className="flex rounded-xl bg-slate-100 dark:bg-slate-900 p-0.5 border border-slate-200 dark:border-slate-700">
                {(['hadir', 'terlambat', 'izin', 'sakit', 'alpa'] as AttendanceStatus[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setAttendanceMode(mode)}
                    className={`px-2.5 py-1.5 text-xs font-medium rounded-lg capitalize transition-all cursor-pointer ${
                      attendanceMode === mode
                        ? mode === 'hadir'
                          ? 'bg-emerald-600 text-white font-bold shadow-sm'
                          : mode === 'terlambat'
                          ? 'bg-amber-500 text-white font-bold shadow-sm'
                          : mode === 'alpa'
                          ? 'bg-red-600 text-white font-bold shadow-sm'
                          : 'bg-slate-700 text-white font-bold shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Scanner Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Camera Viewport */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 dark:bg-black rounded-3xl p-4 shadow-xl border border-slate-800 text-white relative overflow-hidden">
            {/* Viewport Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-red-500" />
                <span className="font-semibold text-slate-200">
                  {isCameraActive ? 'Kamera Aktif - Siap Memindai QR Siswa' : 'Kamera Non-Aktif'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isCameraActive && (
                  <button
                    onClick={toggleFacingMode}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    title="Putar Kamera Depan / Belakang"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                )}
                <label className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer text-[11px] font-medium transition-colors">
                  <Upload className="w-3 h-3 text-red-400" />
                  <span>Unggah Gambar QR</span>
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            </div>

            {/* Video Viewport Area */}
            <div className="relative aspect-video sm:aspect-[4/3] rounded-2xl bg-slate-950 flex items-center justify-center overflow-hidden my-3 border border-slate-800/80">
              <video
                ref={videoRef}
                className={`w-full h-full object-cover ${isCameraActive ? 'block' : 'hidden'}`}
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Viewfinder Target & Laser Scan Line Animation */}
              {isCameraActive && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  {/* Square target corners */}
                  <div className="relative w-64 h-64 sm:w-72 sm:h-72 border-2 border-dashed border-red-500/60 rounded-2xl">
                    <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-red-600 rounded-tl-lg" />
                    <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-red-600 rounded-tr-lg" />
                    <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-red-600 rounded-bl-lg" />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-red-600 rounded-br-lg" />

                    {/* Laser line moving up and down */}
                    <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_12px_#ef4444] animate-scan-line" />
                  </div>
                </div>
              )}

              {/* Camera Off Placeholder */}
              {!isCameraActive && (
                <div className="text-center p-6 space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-slate-800/80 flex items-center justify-center mx-auto text-slate-400 border border-slate-700">
                    <CameraOff className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-200">Kamera Belum Dinyalakan</h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                      Nyalakan kamera untuk memindai kartu presensi siswa otomatis atau coba uji simulasi siswa di bawah.
                    </p>
                  </div>
                  <button
                    onClick={startCamera}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs transition-all shadow-lg shadow-red-600/30 cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Nyalakan Kamera Scanner</span>
                  </button>
                </div>
              )}

              {/* Camera Error banner */}
              {cameraError && (
                <div className="absolute bottom-2 left-2 right-2 p-3 bg-amber-950/90 border border-amber-800 rounded-xl text-amber-200 text-xs flex items-center gap-2 backdrop-blur-md">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                  <p>{cameraError}</p>
                </div>
              )}
            </div>

            {/* Viewport Control Footer */}
            <div className="flex items-center justify-between pt-1">
              {isCameraActive ? (
                <button
                  onClick={stopCamera}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600/20 text-rose-300 border border-rose-800 hover:bg-rose-600/30 text-xs font-medium cursor-pointer"
                >
                  <CameraOff className="w-3.5 h-3.5" />
                  <span>Matikan Kamera</span>
                </button>
              ) : (
                <div />
              )}

              <button
                onClick={() => setShowManualModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer border border-slate-700"
              >
                <UserPlus className="w-3.5 h-3.5 text-red-400" />
                <span>Input Presensi Manual</span>
              </button>
            </div>
          </div>

          {/* Quick Simulation Bar (Allows instant testing without scanning physically) */}
          <div className="bg-gradient-to-r from-red-50/50 via-slate-50 to-white dark:from-slate-800/90 dark:via-slate-800/60 dark:to-slate-900 rounded-2xl p-4 border border-red-100 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-red-600 dark:text-red-400" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Uji Cepat Simulasi Pemindaian QR (Siswa {selectedClassId})
                </span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Klik siswa untuk simulasi scan
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {classStudents.slice(0, 6).map((student) => {
                const isAlready = todayRecords.some((r) => r.studentId === student.id);
                return (
                  <button
                    key={student.id}
                    onClick={() => recordStudentAttendance(student)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      isAlready
                        ? 'bg-slate-200/80 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 opacity-60'
                        : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 hover:border-red-500 hover:shadow-sm'
                    }`}
                  >
                    <span>{student.name.split(' ')[0]}</span>
                    <span className="text-[10px] text-slate-400 font-mono">({student.nisn.slice(-4)})</span>
                    {isAlready && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Scan Result & Real-Time Classroom Progress */}
        <div className="lg:col-span-5 space-y-4">
          {/* Notification / Scan Message Banner */}
          {scanMessage && (
            <div
              className={`p-4 rounded-2xl border flex items-start gap-3 transition-all animate-in fade-in slide-in-from-top-2 ${
                scanMessage.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                  : scanMessage.type === 'warning'
                  ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200'
                  : 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
              }`}
            >
              {scanMessage.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              )}
              <div className="text-xs">
                <p className="font-semibold leading-relaxed">{scanMessage.text}</p>
              </div>
            </div>
          )}

          {/* Scanned Student Card Detail */}
          {lastScannedRecord && lastScannedStudent ? (
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Hasil Presensi Terakhir
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase ${
                    lastScannedRecord.status === 'hadir'
                      ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                      : lastScannedRecord.status === 'terlambat'
                      ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300'
                      : 'bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300'
                  }`}
                >
                  {lastScannedRecord.status}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-700 flex items-center justify-center text-white text-xl font-bold shadow-md shadow-red-600/20">
                  {lastScannedStudent.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-base text-slate-900 dark:text-white">
                    {lastScannedStudent.name}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    NISN: {lastScannedStudent.nisn} | Kelas: {lastScannedStudent.classId}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Waktu: {lastScannedRecord.time} WIB
                    {lastScannedRecord.minutesLate ? ` (${lastScannedRecord.minutesLate} mnt terlambat)` : ''}
                  </p>
                </div>
              </div>

              {/* Status Integration Badges */}
              <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <span className="block text-[10px] text-slate-400 font-medium">Google Sheets</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {lastScannedRecord.syncedToGoogleSheets ? 'Tersinkron' : 'Antrean Offline'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                  <Mail className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <div>
                    <span className="block text-[10px] text-slate-400 font-medium">Email Orang Tua</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {lastScannedRecord.emailNotificationSent ? 'Terkirim Otomatis' : 'Tidak Perlu'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 text-center border border-dashed border-slate-300 dark:border-slate-700">
              <ShieldCheck className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Belum ada siswa yang dipindai pada sesi ini
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Pindai kartu siswa atau gunakan tombol uji cepat di sebelah kiri
              </p>
            </div>
          )}

          {/* Today's Classroom Attendance List */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                  Kehadiran Kelas {selectedClassId}
                </h3>
                <p className="text-xs text-slate-400">
                  {todayRecords.length} dari {classStudents.length} siswa telah presensi
                </p>
              </div>

              {/* Progress Pill */}
              <div className="text-right">
                <span className="text-sm font-extrabold text-red-600 dark:text-red-400">
                  {classStudents.length ? Math.round((todayRecords.length / classStudents.length) * 100) : 0}%
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
              <div
                className="bg-red-600 h-full rounded-full transition-all duration-300"
                style={{
                  width: `${classStudents.length ? (todayRecords.length / classStudents.length) * 100 : 0}%`,
                }}
              />
            </div>

            {/* Recent records scroll list */}
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1 pt-1">
              {todayRecords.length === 0 ? (
                <p className="text-center py-6 text-xs text-slate-400">Belum ada data presensi hari ini.</p>
              ) : (
                todayRecords.map((rec) => (
                  <div
                    key={rec.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          rec.status === 'hadir'
                            ? 'bg-emerald-500'
                            : rec.status === 'terlambat'
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                      />
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{rec.studentName}</p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {rec.time} WIB {rec.minutesLate ? `• +${rec.minutesLate}m` : ''}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        rec.status === 'hadir'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                          : rec.status === 'terlambat'
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                          : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                      }`}
                    >
                      {rec.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Manual Entry Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Input Presensi Manual Siswa
              </h3>
              <button
                onClick={() => setShowManualModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pilih siswa dari kelas {selectedClassId} untuk mata pelajaran {activeSubject.name}.
            </p>

            <input
              type="text"
              placeholder="Cari nama atau NISN siswa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
            />

            <div className="max-h-60 overflow-y-auto space-y-2">
              {classStudents
                .filter(
                  (s) =>
                    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    s.nisn.includes(searchQuery)
                )
                .map((student) => {
                  const isRecorded = todayRecords.some((r) => r.studentId === student.id);
                  return (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800"
                    >
                      <div>
                        <p className="font-bold text-xs text-slate-800 dark:text-slate-200">{student.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">NISN: {student.nisn}</p>
                      </div>

                      {isRecorded ? (
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Sudah Presensi
                        </span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              recordStudentAttendance(student, 'hadir');
                              setShowManualModal(false);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px]"
                          >
                            Hadir
                          </button>
                          <button
                            onClick={() => {
                              recordStudentAttendance(student, 'terlambat');
                              setShowManualModal(false);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-white font-semibold text-[11px]"
                          >
                            Telat
                          </button>
                          <button
                            onClick={() => {
                              recordStudentAttendance(student, 'alpa');
                              setShowManualModal(false);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-[11px]"
                          >
                            Alpa
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
