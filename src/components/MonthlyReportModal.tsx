import React, { useMemo } from 'react';
import { X, Printer, Download, Calendar, Activity, CreditCard, Award, User, Clock } from 'lucide-react';
import { PatientRecord } from '../types';
import { TREATMENT_LIST } from '../data';

interface MonthlyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: PatientRecord[];
  selectedMonth: string; // e.g. "2026-07"
  theme: 'teal' | 'pink';
}

export default function MonthlyReportModal({
  isOpen,
  onClose,
  records,
  selectedMonth,
  theme
}: MonthlyReportModalProps) {
  if (!isOpen) return null;

  const isPink = theme === 'pink';

  const thaiMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  const formatMonthLabel = (yearMonthStr: string) => {
    const [yearStr, monthStr] = yearMonthStr.split('-');
    const yearCE = parseInt(yearStr, 10);
    const yearBE = yearCE + 543;
    const monthIndex = parseInt(monthStr, 10) - 1;
    return `${thaiMonths[monthIndex]} พ.ศ. ${yearBE}`;
  };

  const monthLabel = formatMonthLabel(selectedMonth);

  // Filter records specifically for this month
  const monthRecords = useMemo(() => {
    return records.filter(r => r.date && r.date.startsWith(selectedMonth))
      .sort((a, b) => {
        // Sort by date ascending, then ptNo ascending
        const dateCompare = (a.date || '').localeCompare(b.date || '');
        if (dateCompare !== 0) return dateCompare;
        return (a.ptNo || '').localeCompare(b.ptNo || '');
      });
  }, [records, selectedMonth]);

  // Statistics calculations
  const totalRevenue = useMemo(() => {
    return monthRecords.reduce((sum, r) => sum + (r.fee || 0), 0);
  }, [monthRecords]);

  const totalServices = monthRecords.length;

  const newCases = useMemo(() => {
    return monthRecords.filter(r => r.serviceType === 'new').length;
  }, [monthRecords]);

  const followups = useMemo(() => {
    return monthRecords.filter(r => r.serviceType === 'followup').length;
  }, [monthRecords]);

  // Top Diagnoses
  const topDiagnoses = useMemo(() => {
    const counts: Record<string, number> = {};
    monthRecords.forEach(r => {
      if (r.ptDiagnosis) {
        const items = r.ptDiagnosis.split(',').map(s => s.trim()).filter(s => s.length > 0);
        items.forEach(item => {
          counts[item] = (counts[item] || 0) + 1;
        });
      }
    });

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [monthRecords]);

  // Top Treatments
  const topTreatments = useMemo(() => {
    const counts: Record<string, number> = {};
    const treatmentLabels: Record<string, string> = {
      'US': 'US (อัลตราซาวด์บำบัด)',
      'PMS': 'PMS (กระตุ้นแม่เหล็กระงับปวด)',
      'Hot Pack': 'Hot Pack (ประคบร้อน)',
      'Traction': 'Traction (เครื่องดึงคอ/หลัง)',
      'Exercise': 'Exercise (ออกกำลังกายบำบัด)',
      'Laser': 'Laser (เลเซอร์บำบัด)',
      'ES': 'ES (กระตุ้นไฟฟ้า)',
      'Manual Therapy': 'Manual Therapy (ขยับดัดดึงข้อต่อ)'
    };

    monthRecords.forEach(r => {
      if (r.treatments && Array.isArray(r.treatments)) {
        r.treatments.forEach(t => {
          counts[t] = (counts[t] || 0) + 1;
        });
      }
    });

    return Object.entries(counts)
      .map(([id, count]) => ({
        id,
        name: treatmentLabels[id] || id,
        count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [monthRecords]);

  // Handler to export report to CSV/Excel
  const handleExportExcel = () => {
    const headers = [
      'ลำดับ',
      'วันที่รับบริการ',
      'PT NO.',
      'ประเภทผู้ป่วย',
      'เลขบัตรประชาชน',
      'ชื่อ-นามสกุล',
      'เพศ',
      'อายุ (ปี)',
      'ที่อยู่',
      'เบอร์โทรศัพท์',
      'โรคประจำตัว',
      'อาการสำคัญ (CHIEF COMPLAINT)',
      'การวินิจฉัยกายภาพบำบัด (PT DIAGNOSIS)',
      'วิธีการรักษา (TREATMENTS)',
      'ค่าบริการ (บาท)',
      'หมายเหตุ'
    ];

    const rows = monthRecords.map((r, idx) => {
      // Format treatments to readable text
      const treatText = (r.treatments || []).join(', ') + (r.otherTreatment ? ` (${r.otherTreatment})` : '');
      const serviceText = r.serviceType === 'new' ? 'คนไข้ใหม่' : 'คนไข้เก่า';
      const genderText = r.gender === 'male' ? 'ชาย' : r.gender === 'female' ? 'หญิง' : '-';
      
      // format date to local BE style
      let dateText = r.date || '';
      if (dateText) {
        const parts = dateText.split('-');
        if (parts.length === 3) {
          const ceYear = parseInt(parts[0], 10);
          const beYearShort = (ceYear + 543) % 100;
          dateText = `${parseInt(parts[2], 10)}/${parseInt(parts[1], 10)}/${beYearShort}`;
        }
      }

      return [
        idx + 1,
        dateText,
        r.ptNo || '',
        serviceText,
        r.citizenId ? `="${r.citizenId}"` : '', // Wrap in ="..." to prevent Excel scientific notation
        r.name || '',
        genderText,
        r.age || '',
        r.address || '',
        r.phone ? `="${r.phone}"` : '',
        r.underlyingDisease || '',
        r.chiefComplaint || '',
        r.ptDiagnosis || '',
        treatText,
        r.fee || 0,
        r.remarks || ''
      ];
    });

    // Generate CSV content
    let csvContent = '\uFEFF'; // Add UTF-8 BOM for Excel Thai language support
    
    // Add Report Header lines
    csvContent += `"สหคลินิกเดชอุดม แลบ กายภาพบำบัด (แผนกกายภาพบำบัด)"\n`;
    csvContent += `"รายงานสรุปสถิติและเวชระเบียนประจำเดือน: ${monthLabel}"\n`;
    csvContent += `""\n`;
    csvContent += `"สรุปสถิติงานบริการ"\n`;
    csvContent += `"จำนวนการให้บริการรวม","${totalServices}","ครั้ง"\n`;
    csvContent += `"รายได้ค่าบริการรวม","${totalRevenue}","บาท"\n`;
    csvContent += `"ผู้ป่วยรายใหม่ (New Case)","${newCases}","ราย"\n`;
    csvContent += `"ผู้ป่วยรายเก่า (Follow-up)","${followups}","ราย"\n`;
    csvContent += `""\n`;

    // Add Top Diagnoses
    csvContent += `"5 อันดับวินิจฉัยอาการพบบ่อย (PT Diagnosis)"\n`;
    topDiagnoses.forEach((d, i) => {
      csvContent += `"${i + 1}. ${d.name}","${d.count}","ครั้ง"\n`;
    });
    csvContent += `""\n`;

    // Add table header
    csvContent += headers.map(h => `"${h.replace(/"/g, '""')}"`).join(',') + '\n';

    // Add table rows
    rows.forEach(row => {
      csvContent += row.map(cell => {
        const str = String(cell === null || cell === undefined ? '' : cell);
        return `"${str.replace(/"/g, '""')}"`;
      }).join(',') + '\n';
    });

    // Download file trigger
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `รายงานประจำเดือน_${selectedMonth}_สหคลินิกเดชอุดม.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto no-print-btn">
      
      {/* Dynamic style sheet for printing cleanly */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
            background: white !important;
          }
          #monthly-report-print-area, #monthly-report-print-area * {
            visibility: visible;
          }
          #monthly-report-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            display: block !important;
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 20px !important;
            background-color: white !important;
            color: black !important;
          }
          .no-print-btn {
            display: none !important;
          }
          /* Ensure table borders print correctly */
          table, th, td {
            border: 1px solid #ddd !important;
            border-collapse: collapse !important;
            color: black !important;
          }
          th {
            background-color: #f3f4f6 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>

      <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className={`px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-2xl no-print-btn`}>
          <div className="flex items-center gap-2">
            <span className={`p-2 rounded-lg ${isPink ? 'bg-pink-100 text-[#FF5B8C]' : 'bg-teal-100 text-teal-600'}`}>
              <Calendar className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-gray-900">ดูและออกรายงานสรุปประจำเดือน</h3>
              <p className="text-xs text-gray-500 mt-0.5">ประจำเดือน {monthLabel}</p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Controls Toolbar */}
        <div className="px-6 py-3.5 bg-white border-b border-gray-100 flex flex-wrap gap-2 justify-between items-center no-print-btn">
          <div className="text-xs text-gray-500 font-medium">
            มีรายการทั้งสิ้น <span className="font-bold text-gray-800">{totalServices}</span> รายการรับบริการในเดือนนี้
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleExportExcel}
              disabled={totalServices === 0}
              className={`px-4 py-2 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Download className="w-4 h-4" />
              ส่งออกรายงาน Excel (.CSV)
            </button>
            
            <button
              onClick={handlePrint}
              disabled={totalServices === 0}
              className={`px-4 py-2 rounded-lg text-xs font-bold text-white ${isPink ? 'bg-[#FF5B8C] hover:bg-pink-600' : 'bg-teal-600 hover:bg-teal-700'} transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Printer className="w-4 h-4" />
              พิมพ์รายงาน / บันทึก PDF
            </button>
          </div>
        </div>

        {/* Printable Report Document Body */}
        <div className="flex-1 overflow-y-auto p-8 bg-gray-50/50" id="monthly-report-print-area">
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-8 max-w-4xl mx-auto flex flex-col gap-8 text-gray-800 printable-sheet">
            
            {/* Clinical Letterhead Header */}
            <div className="flex flex-col items-center text-center border-b border-gray-200 pb-6 gap-2">
              <div className={`w-12 h-12 rounded-full ${isPink ? 'bg-pink-100 text-[#FF5B8C]' : 'bg-teal-100 text-teal-600'} flex items-center justify-center mb-1`}>
                <Award className="w-6 h-6" />
              </div>
              <h1 className="text-lg font-extrabold text-gray-900 tracking-tight">สหคลินิกเดชอุดม แลบ กายภาพบำบัด</h1>
              <p className="text-xs text-gray-500 max-w-md">
                118 ม.6 ต.เดชอุดม อ.เดชอุดม จ.อุบลราชธานี | โทรศัพท์ 045-XXX-XXX
              </p>
              <div className={`mt-3 px-4 py-1 text-xs font-bold rounded-full ${isPink ? 'bg-pink-50 text-[#FF5B8C]' : 'bg-teal-50 text-teal-700'} border ${isPink ? 'border-pink-100' : 'border-teal-100'}`}>
                รายงานสรุปสถิติประจำเดือน: {monthLabel}
              </div>
            </div>

            {/* Quick Metrics Statistics Section */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-center">
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">รายได้ค่าบริการรวม</span>
                <span className="block text-xl font-extrabold text-gray-900 mt-1 font-mono">{totalRevenue.toLocaleString()}</span>
                <span className="text-[10px] text-gray-500 font-semibold">บาท</span>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-center">
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">จำนวนการให้บริการ</span>
                <span className="block text-xl font-extrabold text-gray-900 mt-1 font-mono">{totalServices}</span>
                <span className="text-[10px] text-gray-500 font-semibold">ครั้ง</span>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-center">
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">คนไข้ใหม่ (NEW)</span>
                <span className="block text-xl font-extrabold text-[#FF5B8C] mt-1 font-mono">{newCases}</span>
                <span className="text-[10px] text-gray-500 font-semibold">ราย</span>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-center">
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">คนไข้เก่า (FOLLOW-UP)</span>
                <span className="block text-xl font-extrabold text-indigo-600 mt-1 font-mono">{followups}</span>
                <span className="text-[10px] text-gray-500 font-semibold">ราย</span>
              </div>
            </div>

            {/* Clinical Analytics: Top Diagnoses & Treatments */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Diagnoses */}
              <div className="border border-gray-100 rounded-xl p-4 bg-white shadow-sm flex flex-col gap-3">
                <h3 className="text-xs font-extrabold text-gray-800 border-b border-gray-100 pb-2 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-amber-500" />
                  กลุ่มอาการวินิจฉัยพบบ่อยที่สุด
                </h3>
                {topDiagnoses.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">ไม่มีข้อมูลโรคพบบ่อยในเดือนนี้</p>
                ) : (
                  <div className="space-y-2">
                    {topDiagnoses.map((d, index) => (
                      <div key={d.name} className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-gray-700">{index + 1}. {d.name}</span>
                        <span className="font-mono text-gray-500">{d.count} ครั้ง</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Treatments */}
              <div className="border border-gray-100 rounded-xl p-4 bg-white shadow-sm flex flex-col gap-3">
                <h3 className="text-xs font-extrabold text-gray-800 border-b border-gray-100 pb-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-500" />
                  วิธีการรักษาและเครื่องมือที่ใช้บ่อย
                </h3>
                {topTreatments.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">ไม่มีข้อมูลการรักษาในเดือนนี้</p>
                ) : (
                  <div className="space-y-2">
                    {topTreatments.map((t, index) => (
                      <div key={t.id} className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-gray-700">{index + 1}. {t.name}</span>
                        <span className="font-mono text-gray-500">{t.count} ครั้ง</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Detailed Registry Table */}
            <div className="flex flex-col gap-3">
              <h3 className="text-xs font-extrabold text-gray-800 border-b border-gray-100 pb-2">
                บัญชีรายชื่อคนไข้เข้ารับบริการกายภาพบำบัดประจำเดือน
              </h3>
              
              {monthRecords.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-400 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                  ไม่มีประวัติผู้รับบริการในเดือนนี้
                </div>
              ) : (
                <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-sm">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                        <th className="py-2.5 px-3 text-center w-12">ลำดับ</th>
                        <th className="py-2.5 px-2">วันที่</th>
                        <th className="py-2.5 px-2">PT NO.</th>
                        <th className="py-2.5 px-3">ชื่อ-นามสกุล</th>
                        <th className="py-2.5 px-2 text-center">เพศ</th>
                        <th className="py-2.5 px-2 text-center">อายุ</th>
                        <th className="py-2.5 px-3">การวินิจฉัยโรค (PT Diagnosis)</th>
                        <th className="py-2.5 px-2">เครื่องมือรักษา</th>
                        <th className="py-2.5 px-3 text-right">ค่าบริการ (บาท)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-700">
                      {monthRecords.map((r, index) => {
                        let formattedDate = r.date || '';
                        if (formattedDate) {
                          const parts = formattedDate.split('-');
                          if (parts.length === 3) {
                            const yearBE = (parseInt(parts[0], 10) + 543) % 100;
                            formattedDate = `${parseInt(parts[2], 10)}/${parseInt(parts[1], 10)}/${yearBE}`;
                          }
                        }

                        return (
                          <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="py-2 px-3 text-center font-semibold text-gray-400 font-mono">{index + 1}</td>
                            <td className="py-2 px-2 whitespace-nowrap font-mono">{formattedDate}</td>
                            <td className="py-2 px-2 font-mono font-bold text-gray-900">{r.ptNo}</td>
                            <td className="py-2 px-3 font-semibold text-gray-900 whitespace-nowrap">{r.name}</td>
                            <td className="py-2 px-2 text-center">{r.gender === 'male' ? 'ชาย' : 'หญิง'}</td>
                            <td className="py-2 px-2 text-center font-mono">{r.age}</td>
                            <td className="py-2 px-3">{r.ptDiagnosis || '-'}</td>
                            <td className="py-2 px-2">
                              <div className="flex flex-wrap gap-1">
                                {(r.treatments || []).map(t => (
                                  <span key={t} className="px-1 py-0.5 text-[9px] font-bold bg-gray-100 border border-gray-200 text-gray-600 rounded">
                                    {t}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="py-2 px-3 text-right font-bold font-mono text-gray-900">{(r.fee || 0).toLocaleString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Print Signature Footer Area */}
            <div className="mt-8 pt-8 border-t border-gray-100 grid grid-cols-2 text-xs">
              <div className="flex flex-col justify-end gap-1 text-gray-500">
                <p>รายงาน ณ วันที่: {new Date().toLocaleDateString('th-TH', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</p>
                <p>ผู้พิมพ์รายงาน: แผนกบริหารเวชระเบียนคลินิก</p>
              </div>
              <div className="flex flex-col items-center gap-1.5 justify-center text-center text-gray-700 ml-auto mr-12 mt-6">
                <p>ลงชื่อ..............................................................</p>
                <p className="font-semibold mt-1">( นักกายภาพบำบัดผู้ควบคุมรายงาน )</p>
                <p className="text-[10px] text-gray-400">ตำแหน่งนักกายภาพบำบัดประจำคลินิก</p>
              </div>
            </div>

          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2 rounded-b-2xl no-print-btn">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-200 text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all rounded-lg cursor-pointer bg-white"
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  );
}
