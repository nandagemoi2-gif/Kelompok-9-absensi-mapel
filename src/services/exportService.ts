import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { AttendanceRecord } from '../types/attendance';

export const exportService = {
  /**
   * Export records to Excel (.xlsx) file
   */
  exportToExcel(
    records: AttendanceRecord[],
    fileName = 'Rekap_Absensi_Mapel',
    meta?: { subject?: string; classId?: string; month?: string }
  ): void {
    // 1. Prepare main attendance data
    const rows = records.map((r, index) => ({
      No: index + 1,
      Tanggal: r.date,
      Jam: r.time,
      NISN: r.nisn,
      'Nama Siswa': r.studentName,
      Kelas: r.classId,
      'Mata Pelajaran': r.subjectName,
      'Guru Pengampu': r.teacherName,
      'Status Kehadiran': r.status.toUpperCase(),
      'Keterlambatan (Menit)': r.minutesLate || 0,
      Keterangan: r.note || '-',
      'Sinkron Google Sheets': r.syncedToGoogleSheets ? 'Sudah (Synced)' : 'Antrean Lokal',
      'Notifikasi Email': r.emailNotificationSent ? 'Terkirim' : '-',
    }));

    // 2. Prepare summary statistics
    const total = records.length;
    const hadir = records.filter((r) => r.status === 'hadir').length;
    const terlambat = records.filter((r) => r.status === 'terlambat').length;
    const sakit = records.filter((r) => r.status === 'sakit').length;
    const izin = records.filter((r) => r.status === 'izin').length;
    const alpa = records.filter((r) => r.status === 'alpa').length;

    const summaryRows = [
      { Parameter: 'Total Presensi Tercatat', Nilai: total },
      { Parameter: 'Hadir Tepat Waktu', Nilai: `${hadir} (${total ? ((hadir / total) * 100).toFixed(1) : 0}%)` },
      { Parameter: 'Terlambat', Nilai: `${terlambat} (${total ? ((terlambat / total) * 100).toFixed(1) : 0}%)` },
      { Parameter: 'Sakit', Nilai: `${sakit} (${total ? ((sakit / total) * 100).toFixed(1) : 0}%)` },
      { Parameter: 'Izin', Nilai: `${izin} (${total ? ((izin / total) * 100).toFixed(1) : 0}%)` },
      { Parameter: 'Alpa (Tanpa Keterangan)', Nilai: `${alpa} (${total ? ((alpa / total) * 100).toFixed(1) : 0}%)` },
      { Parameter: 'Filter Mata Pelajaran', Nilai: meta?.subject || 'Semua Mapel' },
      { Parameter: 'Filter Kelas', Nilai: meta?.classId || 'Semua Kelas' },
      { Parameter: 'Waktu Ekspor', Nilai: new Date().toLocaleString('id-ID') },
    ];

    const wb = XLSX.utils.book_new();

    const wsRecords = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, wsRecords, 'Data Presensi');

    const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan Statistik');

    // Generate buffer & trigger download
    XLSX.writeFile(wb, `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  },

  /**
   * Export records to formal Indonesian School PDF report
   */
  exportToPDF(
    records: AttendanceRecord[],
    meta?: {
      subject?: string;
      classId?: string;
      monthName?: string;
      teacherName?: string;
    }
  ): void {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const primaryColor = [220, 38, 38]; // Telkom Red

    // Header / Kop Surat
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(71, 85, 105);
    doc.text('YAYASAN PENDIDIKAN TELKOM (YPT)', 105, 17, { align: 'center' });
    doc.setFontSize(16);
    doc.setTextColor(220, 38, 38); // Telkom Red
    doc.text('SMK TELKOM LAMPUNG', 105, 24, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Kompetensi Keahlian: RPL • TKJ • Animasi • TJAT', 105, 29, { align: 'center' });
    doc.text('Jl. Terusan Alamsyah Ratu Prawiranegara, Bandar Lampung | info@smktelkom-lpg.sch.id', 105, 33, { align: 'center' });

    // Decorative line
    doc.setDrawColor(220, 38, 38);
    doc.setLineWidth(0.8);
    doc.line(14, 36, 196, 36);
    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.2);
    doc.line(14, 37.2, 196, 37.2);

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text('LAPORAN REKAPITULASI KEHADIRAN MATA PELAJARAN', 105, 45, { align: 'center' });

    // Metadata details
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);

    const leftColX = 14;
    const rightColX = 120;
    let currentY = 53;

    doc.text(`Mata Pelajaran : ${meta?.subject || 'Semua Mata Pelajaran'}`, leftColX, currentY);
    doc.text(`Kelas / Jurusan: ${meta?.classId || 'Semua Kelas'}`, rightColX, currentY);
    currentY += 5;
    doc.text(`Guru Pengampu  : ${meta?.teacherName || 'Semua Guru'}`, leftColX, currentY);
    doc.text(`Periode Laporan: ${meta?.monthName || 'Bulan Berjalan 2026'}`, rightColX, currentY);
    currentY += 5;
    doc.text(`Tanggal Cetak  : ${new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}`, leftColX, currentY);
    doc.text(`Total Catatan  : ${records.length} Siswa`, rightColX, currentY);

    // Calculate metrics
    const total = records.length;
    const hadir = records.filter((r) => r.status === 'hadir').length;
    const terlambat = records.filter((r) => r.status === 'terlambat').length;
    const sakit = records.filter((r) => r.status === 'sakit').length;
    const izin = records.filter((r) => r.status === 'izin').length;
    const alpa = records.filter((r) => r.status === 'alpa').length;

    // Stat badge box
    currentY += 7;
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, currentY, 182, 10, 2, 2, 'F');
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(
      `Ringkasan: Hadir: ${hadir}  |  Terlambat: ${terlambat}  |  Sakit: ${sakit}  |  Izin: ${izin}  |  Alpa: ${alpa}  |  Presensi: ${total ? (((hadir + terlambat) / total) * 100).toFixed(1) : 0}%`,
      105,
      currentY + 6.5,
      { align: 'center' }
    );

    // Table
    const tableBody = records.map((r, i) => [
      i + 1,
      r.date,
      r.nisn,
      r.studentName,
      r.classId,
      r.subjectName,
      r.status.toUpperCase(),
      r.time.slice(0, 5),
      r.minutesLate ? `${r.minutesLate} mnt` : '-',
      r.note || '-',
    ]);

    autoTable(doc, {
      startY: currentY + 14,
      head: [
        ['No', 'Tanggal', 'NISN', 'Nama Siswa', 'Kelas', 'Mapel', 'Status', 'Waktu', 'Telat', 'Keterangan'],
      ],
      body: tableBody,
      theme: 'grid',
      headStyles: {
        fillColor: [220, 38, 38], // Telkom Red table header
        textColor: 255,
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'center',
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: 50,
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 8 },
        1: { halign: 'center', cellWidth: 18 },
        2: { halign: 'center', cellWidth: 20 },
        3: { cellWidth: 38 },
        4: { halign: 'center', cellWidth: 16 },
        5: { cellWidth: 26 },
        6: { halign: 'center', cellWidth: 16 },
        7: { halign: 'center', cellWidth: 12 },
        8: { halign: 'center', cellWidth: 12 },
        9: { cellWidth: 'auto' },
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 6) {
          const val = String(data.cell.raw).toLowerCase();
          if (val === 'hadir') {
            data.cell.styles.textColor = [16, 185, 129];
            data.cell.styles.fontStyle = 'bold';
          } else if (val === 'terlambat') {
            data.cell.styles.textColor = [245, 158, 11];
            data.cell.styles.fontStyle = 'bold';
          } else if (val === 'alpa') {
            data.cell.styles.textColor = [220, 38, 38];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      },
    });

    // Signature section on the last page
    const finalY = (doc as any).lastAutoTable?.finalY || 200;
    const signY = finalY > 230 ? 250 : finalY + 16;

    if (signY < 265) {
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);

      // Left signature
      doc.text('Mengetahui,', 30, signY);
      doc.text('Kepala SMK Telkom Lampung', 30, signY + 4);
      doc.text('M. Aditia Pratama, S.T., M.Kom', 30, signY + 24);
      doc.text('NIP. 198108152005011004', 30, signY + 28);

      // Right signature
      doc.text('Bandar Lampung, ' + new Date().toLocaleDateString('id-ID', { dateStyle: 'long' }), 140, signY);
      doc.text('Guru Mata Pelajaran,', 140, signY + 4);
      doc.text(meta?.teacherName || 'Budi Hartono, S.Kom', 140, signY + 24);
      doc.text('NIP. 198503152008041010', 140, signY + 28);
    }

    doc.save(`Laporan_Presensi_Mapel_${meta?.subject || 'All'}_${new Date().toISOString().slice(0, 10)}.pdf`);
  },
};
