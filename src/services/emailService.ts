import { Student, AttendanceRecord, NotificationLog } from '../types/attendance';

export const emailService = {
  /**
   * Generates formatted email body and subject for attendance status
   */
  generateEmailContent(student: Student, record: AttendanceRecord): { subject: string; body: string } {
    const schoolName = 'SMK TELKOM LAMPUNG';
    const dateFormatted = new Date(record.date).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    if (record.status === 'alpa') {
      const subject = `[URGENT] Pemberitahuan Ketidakhadiran (Alpa): ${student.name} - ${record.subjectName}`;
      const body = `Yth. Bapak/Ibu ${student.parentName} (Orang Tua / Wali Murid),

Dengan hormat,
Kami dari pihak ${schoolName} ingin menginformasikan bahwa putra/putri Bapak/Ibu:

Nama Siswa : ${student.name}
NISN        : ${student.nisn}
Kelas       : ${student.classId}
Mata Pelajaran : ${record.subjectName}
Guru Pengampu  : ${record.teacherName}
Hari / Tanggal : ${dateFormatted}
Waktu Presensi : ${record.time} WIB
Status         : ALPA (Tanpa Keterangan)

Sampai jam pelajaran berakhir, ananda belum berada di dalam kelas dan belum ada keterangan resmi dari pihak keluarga. Mohon konfirmasi atau hubungi pihak sekolah/wali kelas bila ada kendala khusus.

Atas perhatian dan kerja sama Bapak/Ibu, kami ucapkan terima kasih.

Salam hormat,
Tim Kesiswaan & Kurikulum ${schoolName}`;
      return { subject, body };
    }

    if (record.status === 'terlambat') {
      const subject = `Pemberitahuan Keterlambatan Siswa: ${student.name} (${record.minutesLate || 15} Menit) - ${record.subjectName}`;
      const body = `Yth. Bapak/Ibu ${student.parentName},

Kami menginformasikan bahwa ananda:
Nama  : ${student.name}
Kelas : ${student.classId}
Mapel : ${record.subjectName}

Tercatat TERLAMBAT hadir di kelas selama ${record.minutesLate || 15} menit (pukul ${record.time} WIB) pada hari ${dateFormatted}. Catatan: ${record.note || 'Tidak ada catatan'}.

Diharapkan orang tua dapat mengingatkan kedisiplinan waktu belajar ananda. Terima kasih atas kerja samanya.

Salam hangat,
${record.teacherName} (Guru Pengampu)`;
      return { subject, body };
    }

    if (record.status === 'sakit') {
      const subject = `Konfirmasi Keterangan Sakit Siswa: ${student.name} - ${record.subjectName}`;
      const body = `Yth. Bapak/Ibu ${student.parentName},

Keterangan izin SAKIT untuk ananda ${student.name} pada mata pelajaran ${record.subjectName} tanggal ${dateFormatted} telah kami catat dalam sistem presensi. Catatan: ${record.note || '-'}.

Semoga ananda lekas sembuh dan dapat beraktivitas kembali di sekolah.

Salam hangat,
${schoolName}`;
      return { subject, body };
    }

    // Default izin
    const subject = `Konfirmasi Izin Siswa: ${student.name} - ${record.subjectName}`;
    const body = `Yth. Bapak/Ibu ${student.parentName},

Permohonan IZIN ananda ${student.name} pada mata pelajaran ${record.subjectName} tanggal ${dateFormatted} telah terverifikasi dalam sistem absensi. Catatan: ${record.note || '-'}.

Terima kasih.`;
    return { subject, body };
  },

  /**
   * Dispatches email notification (and logs it)
   */
  async sendNotification(
    student: Student,
    record: AttendanceRecord
  ): Promise<{ log: NotificationLog; emailDetails: NonNullable<AttendanceRecord['emailDetails']> }> {
    const { subject, body } = this.generateEmailContent(student, record);
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    // Simulated email dispatch latency
    await new Promise((resolve) => setTimeout(resolve, 300));

    const emailDetails = {
      recipient: student.parentEmail,
      sentAt: now,
      subject,
      body,
    };

    const log: NotificationLog = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      type: 'email',
      recipient: student.parentEmail,
      title: subject,
      message: body.slice(0, 120) + '...',
      timestamp: now,
      status: 'sent',
      studentName: student.name,
      subjectName: record.subjectName,
    };

    return { log, emailDetails };
  },
};
