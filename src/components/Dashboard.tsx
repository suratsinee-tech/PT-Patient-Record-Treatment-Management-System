import React, { useState, useMemo } from 'react';
import { CreditCard, FileText, UserPlus, Users, Flame, Zap } from 'lucide-react';
import { PatientRecord } from '../types';

interface DashboardProps {
  records: PatientRecord[];
  theme: 'teal' | 'pink';
}

export default function Dashboard({ records, theme }: DashboardProps) {
  const isPink = theme === 'pink';

  // Available Months for dropdown (from all records)
  // Let's support Thai month names
  const thaiMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  // Derive unique months in the records
  const monthOptions = useMemo(() => {
    const monthsSet = new Set<string>();
    
    // Always guarantee '2026-04' (เมษายน 2569) and '2026-07' (กรกฎาคม 2569) in list
    monthsSet.add('2026-07');
    monthsSet.add('2026-04');
    monthsSet.add('2026-03');

    records.forEach(r => {
      if (r.date) {
        const parts = r.date.split('-');
        if (parts.length >= 2) {
          monthsSet.add(`${parts[0]}-${parts[1]}`);
        }
      }
    });

    return Array.from(monthsSet).sort().reverse(); // Show latest months first
  }, [records]);

  // Selected Month state
  // Default to July 2026 (2026-07) to match Image 1's "สรุปสถิติกายภาพบำบัด ประจำช่วงเวลา: กรกฎาคม พ.ศ. 2569"
  const [selectedMonth, setSelectedMonth] = useState('2026-07');

  const formatMonthLabel = (yearMonthStr: string) => {
    const [yearStr, monthStr] = yearMonthStr.split('-');
    const yearCE = parseInt(yearStr, 10);
    const yearBE = yearCE + 543;
    const monthIndex = parseInt(monthStr, 10) - 1;
    return `${thaiMonths[monthIndex]} พ.ศ. ${yearBE}`;
  };

  // Filter records based on selected month
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      if (!r.date) return false;
      return r.date.startsWith(selectedMonth);
    });
  }, [records, selectedMonth]);

  // Statistics calculations
  const totalRevenue = useMemo(() => {
    return filteredRecords.reduce((sum, r) => sum + (r.fee || 0), 0);
  }, [filteredRecords]);

  const totalServices = filteredRecords.length;

  const newCases = useMemo(() => {
    return filteredRecords.filter(r => r.serviceType === 'new').length;
  }, [filteredRecords]);

  const followups = useMemo(() => {
    return filteredRecords.filter(r => r.serviceType === 'followup').length;
  }, [filteredRecords]);

  const newCasePercent = totalServices > 0 ? Math.round((newCases / totalServices) * 100) : 0;
  const followupPercent = totalServices > 0 ? Math.round((followups / totalServices) * 100) : 0;

  // Top 5 Diagnosis Groups
  const topDiagnoses = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredRecords.forEach(r => {
      if (r.ptDiagnosis) {
        // split by comma if multiple are typed
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
  }, [filteredRecords]);

  // Top Treatment Methods
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

    filteredRecords.forEach(r => {
      if (r.treatments && Array.isArray(r.treatments)) {
        r.treatments.forEach(t => {
          counts[t] = (counts[t] || 0) + 1;
        });
      }
    });

    const totalTreatmentCount = Object.values(counts).reduce((sum, c) => sum + c, 0);

    return Object.entries(counts)
      .map(([id, count]) => ({
        id,
        name: treatmentLabels[id] || id,
        count,
        percent: totalTreatmentCount > 0 ? Math.round((count / filteredRecords.length) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredRecords]);

  return (
    <div className="space-y-6">
      
      {/* Month Filter Selector in Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full inline-block animate-pulse ${isPink ? 'bg-[#FF5B8C]' : 'bg-teal-500'}`}></span>
            สรุปสถิติกายภาพบำบัด ประจำช่วงเวลา: <span className={isPink ? 'text-[#FF5B8C]' : 'text-teal-600'}>{formatMonthLabel(selectedMonth)}</span>
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            ข้อมูลอัปเดตแบบเรียลไทม์จากระบบบันทึกฐานข้อมูล
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500">เลือกช่วงเวลา:</span>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className={`px-3 py-1.5 border border-gray-200 bg-gray-50 rounded-lg text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 ${isPink ? 'focus:ring-pink-400' : 'focus:ring-teal-500'} cursor-pointer hover:bg-gray-100/70 transition-all`}
          >
            {monthOptions.map(m => (
              <option key={m} value={m}>
                {formatMonthLabel(m)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats 4-Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Card 1: Total Revenue (Solid Accent) */}
        <div className={`relative overflow-hidden text-white rounded-2xl p-5 shadow-lg flex flex-col justify-between h-[115px] ${isPink ? 'bg-[#FF5B8C] shadow-pink-600/10' : 'bg-teal-600 shadow-teal-600/10'}`}>
          <div>
            <div className="flex justify-between items-center">
              <span className={`text-xs font-semibold ${isPink ? 'text-pink-100' : 'text-teal-100'}`}>รายได้ค่าบริการรวม</span>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isPink ? 'bg-pink-400/50' : 'bg-teal-500/50'}`}>
                <CreditCard className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline gap-1">
              <span className="text-2xl font-black tracking-tight">{totalRevenue.toLocaleString()}</span>
              <span className={`text-sm font-semibold ${isPink ? 'text-pink-100' : 'text-teal-100'}`}>บาท</span>
            </div>
          </div>
          <p className={`text-[10px] font-medium ${isPink ? 'text-pink-100/90' : 'text-teal-100/90'}`}>
            จากรายการรับบริการในระบบทั้งหมด
          </p>
          
          {/* Big Dollar Sign Watermark */}
          <div className={`absolute right-[-10px] bottom-[-20px] text-[100px] font-black select-none pointer-events-none font-sans ${isPink ? 'text-pink-400/20' : 'text-teal-500/20'}`}>
            $
          </div>
        </div>

        {/* Card 2: Number of Services */}
        <div className="relative overflow-hidden bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col justify-between h-[115px] hover:shadow-md transition-all">
          <div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-gray-400">จำนวนการรับบริการ</span>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isPink ? 'bg-pink-50' : 'bg-teal-50'}`}>
                <FileText className={`w-3.5 h-3.5 ${isPink ? 'text-[#FF5B8C]' : 'text-teal-600'}`} />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline gap-1">
              <span className="text-2xl font-black text-gray-900 tracking-tight">{totalServices}</span>
              <span className="text-sm font-semibold text-gray-500">ครั้ง</span>
            </div>
          </div>
          <p className="text-[10px] text-gray-400 font-medium">
            ยอดผู้เข้ารับบริการกายภาพบำบัด
          </p>

          {/* Icon Watermark */}
          <FileText className="absolute right-[-15px] bottom-[-15px] w-24 h-24 text-gray-50/70 pointer-events-none select-none" />
        </div>

        {/* Card 3: New Cases */}
        <div className="relative overflow-hidden bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col justify-between h-[115px] hover:shadow-md transition-all">
          <div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-gray-400">ผู้ป่วยรายใหม่ (NEW CASE)</span>
              <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center">
                <UserPlus className="w-3.5 h-3.5 text-blue-600" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline gap-1">
              <span className="text-2xl font-black text-gray-900 tracking-tight">{newCases}</span>
              <span className="text-sm font-semibold text-gray-500">ราย</span>
            </div>
          </div>
          <p className="text-[10px] text-gray-400 font-medium">
            คิดเป็น {newCasePercent}% ของผู้รับบริการ
          </p>

          {/* Icon Watermark */}
          <UserPlus className="absolute right-[-15px] bottom-[-15px] w-24 h-24 text-gray-50/70 pointer-events-none select-none" />
        </div>

        {/* Card 4: Follow Ups */}
        <div className="relative overflow-hidden bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col justify-between h-[115px] hover:shadow-md transition-all">
          <div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-gray-400">ผู้ป่วยรายเก่า (FOLLOW-UP)</span>
              <div className="w-6 h-6 rounded-full bg-purple-50 flex items-center justify-center">
                <Users className="w-3.5 h-3.5 text-purple-600" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline gap-1">
              <span className="text-2xl font-black text-gray-900 tracking-tight">{followups}</span>
              <span className="text-sm font-semibold text-gray-500">ราย</span>
            </div>
          </div>
          <p className="text-[10px] text-gray-400 font-medium">
            คิดเป็น {followupPercent}% ของผู้รับบริการ
          </p>

          {/* Icon Watermark */}
          <Users className="absolute right-[-15px] bottom-[-15px] w-24 h-24 text-gray-50/70 pointer-events-none select-none" />
        </div>

      </div>

      {/* Two visual analysis panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Left Panel: Top Diagnoses */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm min-h-[220px] flex flex-col">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5 border-b border-gray-50 pb-3 mb-4">
            <Zap className="w-4 h-4 text-amber-500" />
            5 อันดับกลุ่มอาการวินิจฉัย (PT Diagnosis)
          </h3>

          {topDiagnoses.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-sm text-gray-400 py-8 font-medium">
              ไม่มีข้อมูลกลุ่มอาการในช่วงเวลานี้
            </div>
          ) : (
            <div className="space-y-3.5 flex-1 flex flex-col justify-center">
              {topDiagnoses.map((item, idx) => {
                const maxCount = topDiagnoses[0]?.count || 1;
                const widthPercent = Math.max(5, Math.round((item.count / maxCount) * 100));
                
                // Color array for list elements
                const colors = isPink ? [
                  'bg-[#FF5B8C]', 'bg-pink-400', 'bg-rose-400', 'bg-indigo-400', 'bg-purple-400'
                ] : [
                  'bg-teal-500', 'bg-emerald-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-blue-500'
                ];
                const activeColor = colors[idx % colors.length];

                return (
                  <div key={item.name} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-gray-700">{item.name}</span>
                      <span className="font-mono text-gray-500 font-bold">{item.count} ครั้ง</span>
                    </div>
                    <div className="w-full bg-gray-50 h-2.5 rounded-full overflow-hidden border border-gray-100">
                      <div 
                        className={`h-full ${activeColor} rounded-full transition-all duration-500`}
                        style={{ width: `${widthPercent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Panel: Top Treatments */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm min-h-[220px] flex flex-col">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5 border-b border-gray-50 pb-3 mb-4">
            <Zap className="w-4 h-4 text-blue-500" />
            เครื่องมือและวิธีการรักษาที่ใช้บ่อยที่สุด
          </h3>

          {topTreatments.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-sm text-gray-400 py-8 font-medium">
              ไม่มีข้อมูลการรักษาในช่วงเวลานี้
            </div>
          ) : (
            <div className="space-y-3.5 flex-1 flex flex-col justify-center">
              {topTreatments.slice(0, 5).map((item, idx) => {
                const maxCount = topTreatments[0]?.count || 1;
                const widthPercent = Math.max(5, Math.round((item.count / maxCount) * 100));

                const colors = [
                  'bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-violet-500'
                ];
                const activeColor = colors[idx % colors.length];

                return (
                  <div key={item.id} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-gray-700">{item.name}</span>
                      <div className="flex gap-2 font-mono text-[10px] text-gray-400">
                        <span className="font-bold text-gray-600">{item.count} ครั้ง</span>
                        <span>({item.percent}%)</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-50 h-2.5 rounded-full overflow-hidden border border-gray-100">
                      <div 
                        className={`h-full ${activeColor} rounded-full transition-all duration-500`}
                        style={{ width: `${widthPercent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
