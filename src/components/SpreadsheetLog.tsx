import React, { useState, useMemo, useEffect } from 'react';
import { Search, Download, Plus, Edit, Trash2, RotateCcw, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { PatientRecord } from '../types';
import { TREATMENT_LIST } from '../data';

interface SpreadsheetLogProps {
  records: PatientRecord[];
  onAddClick: () => void;
  onEditClick: (record: PatientRecord) => void;
  onDeleteClick: (id: string) => void;
  theme: 'teal' | 'pink';
  isAdmin: boolean;
  onVerifyAdmin: (action: () => void) => void;
}

export default function SpreadsheetLog({
  records,
  onAddClick,
  onEditClick,
  onDeleteClick,
  theme,
  isAdmin,
  onVerifyAdmin
}: SpreadsheetLogProps) {
  const isPink = theme === 'pink';
  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedGender, setSelectedGender] = useState('all');
  const [selectedTreatment, setSelectedTreatment] = useState('all');

  // Helper Thai months
  const thaiMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  // Derive all 12 months for each year present in records (defaults to 2026 / 2569) to make it complete ("ปรับเดือนให้ครบถ้วน")
  const monthOptions = useMemo(() => {
    const years = new Set<number>([2026]); // Always include 2026 by default
    records.forEach(r => {
      if (r.date) {
        const parts = r.date.split('-');
        if (parts.length >= 1) {
          const y = parseInt(parts[0], 10);
          if (!isNaN(y)) {
            years.add(y);
          }
        }
      }
    });

    const sortedYears = Array.from(years).sort((a, b) => b - a);
    const allMonths: string[] = [];
    sortedYears.forEach(y => {
      for (let m = 12; m >= 1; m--) {
        const mStr = m.toString().padStart(2, '0');
        allMonths.push(`${y}-${mStr}`);
      }
    });
    return allMonths;
  }, [records]);

  const formatMonthLabel = (yearMonthStr: string) => {
    const [yearStr, monthStr] = yearMonthStr.split('-');
    const yearCE = parseInt(yearStr, 10);
    const yearBE = yearCE + 543;
    const monthIndex = parseInt(monthStr, 10) - 1;
    return `${thaiMonths[monthIndex]} ${yearBE}`;
  };

  // Filter records dynamically
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      // 1. Search Query
      const matchesSearch = 
        (r.name && r.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (r.ptNo && r.ptNo.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (r.citizenId && r.citizenId.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (r.chiefComplaint && r.chiefComplaint.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (r.ptDiagnosis && r.ptDiagnosis.toLowerCase().includes(searchQuery.toLowerCase()));

      // 2. Month Filter
      const matchesMonth = selectedMonth === 'all' || (r.date && r.date.startsWith(selectedMonth));

      // 3. Patient Type Filter
      const matchesType = selectedType === 'all' || r.serviceType === selectedType;

      // 4. Gender Filter
      const matchesGender = selectedGender === 'all' || r.gender === selectedGender;

      // 5. Treatment Filter
      const matchesTreatment = selectedTreatment === 'all' || (r.treatments && r.treatments.includes(selectedTreatment));

      return matchesSearch && matchesMonth && matchesType && matchesGender && matchesTreatment;
    });
  }, [records, searchQuery, selectedMonth, selectedType, selectedGender, selectedTreatment]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedMonth, selectedType, selectedGender, selectedTreatment]);

  // Compute pages
  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage) || 1;

  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * recordsPerPage;
    return filteredRecords.slice(startIndex, startIndex + recordsPerPage);
  }, [filteredRecords, currentPage]);

  // Page Summary values
  const totalRevenueOnPage = useMemo(() => {
    return paginatedRecords.reduce((sum, r) => sum + (r.fee || 0), 0);
  }, [paginatedRecords]);

  const totalNewOnPage = useMemo(() => {
    return paginatedRecords.filter(r => r.serviceType === 'new').length;
  }, [paginatedRecords]);

  // Reset all filters
  const resetFilters = () => {
    setSearchQuery('');
    setSelectedMonth('all');
    setSelectedType('all');
    setSelectedGender('all');
    setSelectedTreatment('all');
    setCurrentPage(1);
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
        pages.push(i);
      } else if (i === 2 && currentPage > 3) {
        pages.push('...');
      } else if (i === totalPages - 1 && currentPage < totalPages - 2) {
        pages.push('...');
      }
    }
    return pages.filter((item, index) => {
      if (item === '...') {
        return pages[index - 1] !== '...';
      }
      return true;
    });
  };

  // CSV Export handler
  const handleExportCSV = () => {
    if (filteredRecords.length === 0) {
      alert('ไม่มีข้อมูลสำหรับส่งออก');
      return;
    }

    // CSV Headers
    const headers = [
      'ลำดับ', 'วันที่รับบริการ', 'PT NO.', 'ประเภทผู้ป่วย', 'ID บัตรประชาชน', 
      'ชื่อ-นามสกุล', 'เพศ', 'อายุ', 'ที่อยู่', 'เบอร์โทรศัพท์', 
      'โรคประจำตัว', 'อาการสำคัญ (CHIEF COMPLAINT)', 'วินิจฉัย (PT DIAGNOSIS)', 
      'การรักษา (TREATMENTS)', 'ค่ารักษา'
    ];

    const rows = filteredRecords.map((r, index) => {
      // format date to BE representation e.g. 24/3/69
      let formattedDate = r.date;
      if (r.date) {
        const parts = r.date.split('-');
        if (parts.length === 3) {
          const yearBE = parseInt(parts[0], 10) + 543 - 2500; // e.g. 69
          formattedDate = `${parseInt(parts[2], 10)}/${parseInt(parts[1], 10)}/${yearBE}`;
        }
      }

      const treatmentsStr = r.treatments ? r.treatments.join(', ') : '';

      return [
        index + 1,
        formattedDate,
        r.ptNo || '',
        r.serviceType === 'new' ? 'รายใหม่' : 'รายเก่า',
        r.citizenId || '',
        r.name || '',
        r.gender === 'male' ? 'ชาย' : r.gender === 'female' ? 'หญิง' : 'อื่นๆ',
        r.age || '',
        r.address || '',
        r.phone || '',
        r.underlyingDisease || '',
        `"${(r.chiefComplaint || '').replace(/"/g, '""')}"`,
        `"${(r.ptDiagnosis || '').replace(/"/g, '""')}"`,
        `"${treatmentsStr}"`,
        r.fee || 0
      ];
    });

    // Generate CSV content
    const csvContent = "\uFEFF" + [
      headers.join(','),
      ...rows.map(e => e.join(','))
    ].join('\n');

    // Create file and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `รายงานผู้รับบริการกายภาพบำบัด_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
      
      {/* Header Area */}
      <div className="px-6 py-5 border-b border-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span className={`p-1.5 rounded-lg inline-block ${isPink ? 'bg-pink-50 text-[#FF5B8C]' : 'bg-teal-50 text-teal-600'}`}>
              <Plus className="w-4 h-4" />
            </span>
            สมุดบันทึกรายการรับบริการ (Spreadsheet Log)
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            กรอง ค้นหา และตรวจสอบรายงานสรุปค่าบริการทางกายภาพบำบัด
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className={`px-4 py-2 text-xs font-bold border rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${isPink ? 'text-pink-700 bg-pink-50/70 border-pink-100 hover:bg-pink-100/50' : 'text-teal-700 bg-teal-50/70 border-teal-100 hover:bg-teal-100/50'}`}
          >
            <Download className="w-3.5 h-3.5" />
            ส่งออกเป็น Excel / CSV
          </button>
          
          <button
            onClick={() => onVerifyAdmin(onAddClick)}
            className={`px-4 py-2 text-xs font-bold text-white rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${isPink ? 'bg-[#FF5B8C] hover:bg-[#E04D79]' : 'bg-teal-600 hover:bg-teal-700'}`}
          >
            <Plus className="w-3.5 h-3.5" />
            เพิ่มบันทึกผู้รับบริการ
          </button>
        </div>
      </div>

      {/* Filters Area */}
      <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-50 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหาชื่อ, PT NO., ID, อาการ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-9 pr-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 ${isPink ? 'focus:ring-pink-400' : 'focus:ring-teal-500'} focus:border-transparent transition-all`}
          />
        </div>

        {/* Month Dropdown */}
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className={`w-full px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-600 focus:outline-none focus:ring-2 ${isPink ? 'focus:ring-pink-400' : 'focus:ring-teal-500'} cursor-pointer hover:bg-gray-50 transition-all`}
        >
          <option value="all">📅 เดือนทั้งหมด</option>
          {monthOptions.map(m => (
            <option key={m} value={m}>
              📅 {formatMonthLabel(m)}
            </option>
          ))}
        </select>

        {/* Patient Type */}
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className={`w-full px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-600 focus:outline-none focus:ring-2 ${isPink ? 'focus:ring-pink-400' : 'focus:ring-teal-500'} cursor-pointer hover:bg-gray-50 transition-all`}
        >
          <option value="all">👥 ประเภทผู้ป่วยทั้งหมด</option>
          <option value="new">🆕 รายใหม่ (New Case)</option>
          <option value="followup">🔄 รายเก่า (Follow-up)</option>
        </select>

        {/* Gender */}
        <select
          value={selectedGender}
          onChange={(e) => setSelectedGender(e.target.value)}
          className={`w-full px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-600 focus:outline-none focus:ring-2 ${isPink ? 'focus:ring-pink-400' : 'focus:ring-teal-500'} cursor-pointer hover:bg-gray-50 transition-all`}
        >
          <option value="all">⚧️ เพศทั้งหมด</option>
          <option value="male">🙋‍♂️ ชาย</option>
          <option value="female">🙋‍♀️ หญิง</option>
          <option value="other">🌈 อื่นๆ</option>
        </select>

        {/* Treatments */}
        <div className="flex gap-2">
          <select
            value={selectedTreatment}
            onChange={(e) => setSelectedTreatment(e.target.value)}
            className={`flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-600 focus:outline-none focus:ring-2 ${isPink ? 'focus:ring-pink-400' : 'focus:ring-teal-500'} cursor-pointer hover:bg-gray-50 transition-all`}
          >
            <option value="all">🔌 เครื่องมือรักษาทั้งหมด</option>
            {TREATMENT_LIST.map(item => (
              <option key={item.id} value={item.id}>
                {item.id} - {item.sub}
              </option>
            ))}
          </select>

          {/* Reset Filters button */}
          {(searchQuery || selectedMonth !== 'all' || selectedType !== 'all' || selectedGender !== 'all' || selectedTreatment !== 'all') && (
            <button
              onClick={resetFilters}
              title="ล้างตัวกรองทั้งหมด"
              className={`p-1.5 bg-white border border-gray-200 rounded-xl transition-all cursor-pointer ${isPink ? 'text-gray-400 hover:text-[#FF5B8C] hover:border-pink-300' : 'text-gray-400 hover:text-teal-600 hover:border-teal-300'}`}
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>

      </div>

      {/* Spreadsheet Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1200px]">
          <thead>
            <tr className="bg-gray-100 text-[11px] font-bold text-gray-500 uppercase border-b border-gray-100">
              <th className="py-3.5 px-4 text-center w-[50px]">ลำดับ</th>
              <th className="py-3.5 px-3 w-[90px]">วันที่รับบริการ</th>
              <th className="py-3.5 px-3 w-[100px]">PT NO.</th>
              <th className="py-3.5 px-3 w-[100px]">ประเภทผู้ป่วย</th>
              <th className="py-3.5 px-3 w-[140px]">ID บัตรประชาชน</th>
              <th className="py-3.5 px-3 w-[150px]">ชื่อ-นามสกุล</th>
              <th className="py-3.5 px-3 w-[60px] text-center">เพศ</th>
              <th className="py-3.5 px-3 w-[60px] text-center">อายุ</th>
              <th className="py-3.5 px-3 w-[180px]">ที่อยู่ผู้ป่วย</th>
              <th className="py-3.5 px-3 w-[110px]">เบอร์โทรศัพท์</th>
              <th className="py-3.5 px-3 w-[100px]">โรคประจำตัว</th>
              <th className="py-3.5 px-3 min-w-[200px]">อาการสำคัญ (CHIEF COMPLAINT)</th>
              <th className="py-3.5 px-3 w-[150px]">วินิจฉัย (PT DIAGNOSIS)</th>
              <th className="py-3.5 px-3 w-[140px]">การรักษา (TREATMENTS)</th>
              <th className="py-3.5 px-3 w-[90px] text-right">ค่ารักษา</th>
              <th className="py-3.5 px-4 text-center w-[100px]">การจัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 text-xs text-gray-700">
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={16} className="py-12 text-center text-gray-400 font-medium">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <AlertCircle className="w-8 h-8 text-gray-300" />
                    <span>ไม่พบรายการรับบริการที่ตรงกับตัวกรอง</span>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedRecords.map((r, index) => {
                // format date to BE representation e.g. 24/3/69
                let formattedDate = r.date;
                if (r.date) {
                  const parts = r.date.split('-');
                  if (parts.length === 3) {
                    const yearBE = parseInt(parts[0], 10) + 543 - 2500; // e.g. 69
                    formattedDate = `${parseInt(parts[2], 10)}/${parseInt(parts[1], 10)}/${yearBE}`;
                  }
                }

                return (
                  <tr key={r.id} className={`transition-all even:bg-gray-50/30 ${isPink ? 'hover:bg-pink-50/20' : 'hover:bg-teal-50/20'}`}>
                    <td className="py-3 px-4 text-center font-semibold text-gray-400 font-mono">
                      {(currentPage - 1) * recordsPerPage + index + 1}
                    </td>
                    <td className="py-3 px-3 font-semibold text-gray-800 font-mono whitespace-nowrap">
                      {formattedDate}
                    </td>
                    <td className={`py-3 px-3 font-bold font-mono whitespace-nowrap ${isPink ? 'text-[#FF5B8C]' : 'text-teal-700'}`}>
                      {r.ptNo}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {r.serviceType === 'new' ? (
                        <span className="inline-flex px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                          รายใหม่
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 text-[10px] font-bold rounded-full bg-purple-50 text-purple-600 border border-purple-100">
                          รายเก่า
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono text-gray-500 whitespace-nowrap">
                      {r.citizenId || '-'}
                    </td>
                    <td className="py-3 px-3 font-semibold text-gray-900 whitespace-nowrap">
                      {r.name}
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {r.gender === 'male' ? 'ชาย' : r.gender === 'female' ? 'หญิง' : 'อื่นๆ'}
                    </td>
                    <td className="py-3 px-3 text-center font-semibold font-mono text-gray-800">
                      {r.age || '-'}
                    </td>
                    <td className="py-3 px-3 max-w-[180px] truncate" title={r.address}>
                      {r.address || '-'}
                    </td>
                    <td className="py-3 px-3 font-mono text-gray-500 whitespace-nowrap">
                      {r.phone || '-'}
                    </td>
                    <td className="py-3 px-3 max-w-[100px] truncate" title={r.underlyingDisease}>
                      {r.underlyingDisease || '-'}
                    </td>
                    <td className="py-3 px-3 max-w-[220px] truncate font-sans text-gray-600" title={r.chiefComplaint}>
                      {r.chiefComplaint}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="inline-block max-w-[140px] truncate font-semibold text-gray-800 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded" title={r.ptDiagnosis}>
                        {r.ptDiagnosis || '-'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex flex-wrap gap-1 max-w-[140px]">
                        {r.treatments && r.treatments.map(t => (
                          <span key={t} className={`px-1.5 py-0.5 text-[9px] font-bold rounded font-sans border ${isPink ? 'bg-pink-50 border-pink-100 text-[#FF5B8C]' : 'bg-teal-50 border-teal-100 text-teal-700'}`}>
                            {t}
                          </span>
                        ))}
                        {r.otherTreatment && (
                          <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-gray-50 border border-gray-100 text-gray-600 rounded">
                            {r.otherTreatment}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className={`py-3 px-3 text-right font-bold font-mono ${isPink ? 'text-pink-700' : 'text-teal-800'}`}>
                      {(r.fee || 0).toLocaleString()}
                    </td>
                    
                    {/* Action Controls */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex justify-center gap-1.5">
                        <button
                          onClick={() => onVerifyAdmin(() => onEditClick(r))}
                          title="แก้ไขประวัติ"
                          className="p-1 rounded text-blue-600 hover:bg-blue-50 transition-all cursor-pointer border border-transparent hover:border-blue-100"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onVerifyAdmin(() => onDeleteClick(r.id))}
                          title="ลบรายการ"
                          className="p-1 rounded text-red-500 hover:bg-red-50 transition-all cursor-pointer border border-transparent hover:border-red-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="px-6 py-3 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white">
          <div className="text-xs text-gray-500">
            แสดงรายการที่ <span className="font-semibold text-gray-700">{(currentPage - 1) * recordsPerPage + 1}</span> ถึง{' '}
            <span className="font-semibold text-gray-700">
              {Math.min(currentPage * recordsPerPage, filteredRecords.length)}
            </span>{' '}
            จากทั้งหมด <span className="font-semibold text-gray-700">{filteredRecords.length}</span> รายการ
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`p-1.5 rounded-lg border border-gray-200 transition-all cursor-pointer ${
                currentPage === 1
                  ? 'text-gray-300 bg-gray-50 cursor-not-allowed border-gray-100'
                  : isPink
                  ? 'text-gray-600 hover:text-[#FF5B8C] hover:border-pink-300 hover:bg-pink-50/20'
                  : 'text-gray-600 hover:text-teal-600 hover:border-teal-300 hover:bg-teal-50/20'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            {getPageNumbers().map((page, index) => {
              if (page === '...') {
                return (
                  <span key={`ellipsis-${index}`} className="px-1.5 text-xs text-gray-400">
                    ...
                  </span>
                );
              }
              
              const isActive = page === currentPage;
              return (
                <button
                  key={`page-${page}`}
                  onClick={() => setCurrentPage(Number(page))}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    isActive
                      ? isPink
                        ? 'bg-[#FF5B8C] text-white border-[#FF5B8C] shadow-sm'
                        : 'bg-teal-600 text-white border-teal-600 shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              );
            })}
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`p-1.5 rounded-lg border border-gray-200 transition-all cursor-pointer ${
                currentPage === totalPages
                  ? 'text-gray-300 bg-gray-50 cursor-not-allowed border-gray-100'
                  : isPink
                  ? 'text-gray-600 hover:text-[#FF5B8C] hover:border-pink-300 hover:bg-pink-50/20'
                  : 'text-gray-600 hover:text-teal-600 hover:border-teal-300 hover:bg-teal-50/20'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Spreadsheet Footer Summary Panel */}
      <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex gap-4 text-xs font-semibold text-gray-500">
          <span>แสดงผลทั้งหมด: <span className={isPink ? 'text-[#FF5B8C]' : 'text-teal-600'}>{filteredRecords.length}</span> รายการ</span>
          <span>|</span>
          <span>ยอดผู้รับบริการใหม่: <span className={isPink ? 'text-[#FF5B8C]' : 'text-teal-600'}>{totalNewOnPage}</span> ราย</span>
        </div>
        
        <div className={`px-4 py-1.5 border rounded-xl flex items-center gap-2 ${isPink ? 'bg-pink-50 border-pink-100' : 'bg-teal-50 border-teal-100'}`}>
          <span className={`text-xs font-bold ${isPink ? 'text-pink-700' : 'text-teal-800'}`}>ยอดเงินรวมในหน้านี้:</span>
          <span className={`text-sm font-black font-mono ${isPink ? 'text-pink-900' : 'text-teal-900'}`}>
            {totalRevenueOnPage.toLocaleString()}
          </span>
          <span className={`text-xs font-bold ${isPink ? 'text-pink-700' : 'text-teal-800'}`}>บาท</span>
        </div>
      </div>

    </div>
  );
}
