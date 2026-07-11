import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Plus, 
  Edit, 
  Trash2, 
  User, 
  Phone, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  X, 
  Search, 
  AlertCircle, 
  FileText,
  Bookmark,
  CalendarDays,
  ListTodo
} from 'lucide-react';
import { Appointment, PatientRecord } from '../types';
import { TREATMENT_LIST } from '../data';

interface AppointmentCalendarProps {
  records: PatientRecord[];
  theme: 'teal' | 'pink';
  isAdmin: boolean;
  onVerifyAdmin: (action: () => void) => void;
}

export default function AppointmentCalendar({
  records,
  theme,
  isAdmin,
  onVerifyAdmin
}: AppointmentCalendarProps) {
  const isPink = theme === 'pink';

  // State
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Navigation for Calendar View
  const [currentDate, setCurrentDate] = useState(new Date(2026, 6, 11)); // Initialize near July 2026 for demonstration
  const [selectedDateStr, setSelectedDateStr] = useState<string>('2026-07-11');
  
  // Modal states for creating/editing appointments
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null);
  
  // Form state
  const [formPatientName, setFormPatientName] = useState('');
  const [formPtNo, setFormPtNo] = useState('');
  const [formDate, setFormDate] = useState('2026-07-11');
  const [formTime, setFormTime] = useState('09:00');
  const [formTreatment, setFormTreatment] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRemarks, setFormRemarks] = useState('');
  const [formStatus, setFormStatus] = useState<'scheduled' | 'completed' | 'cancelled'>('scheduled');

  // Search filter for patient autocomplete
  const [searchPatientQuery, setSearchPatientQuery] = useState('');
  const [showPatientResults, setShowPatientResults] = useState(false);
  
  // Tab view within calendar component: 'calendar' (monthly grid) vs 'list' (all upcoming)
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch appointments from API
  const fetchAppointments = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/appointments');
      if (!response.ok) {
        throw new Error('ไม่สามารถโหลดข้อมูลคิวการนัดหมายได้');
      }
      const data = await response.json();
      setAppointments(data);
      setError('');
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการโหลดคิวนัดหมาย');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Format Helper: Thai Date & Months
  const thaiMonthNames = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  const formatMonthYear = (date: Date) => {
    const yearBE = date.getFullYear() + 543;
    const monthName = thaiMonthNames[date.getMonth()];
    return `${monthName} ${yearBE}`;
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  // Month navigation
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Build Calendar Days array
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const totalDays = getDaysInMonth(year, month);
    const startOffset = getFirstDayOfMonth(year, month);
    
    const days: { date: Date | null; dateStr: string | null; isCurrentMonth: boolean }[] = [];
    
    // Previous month padding
    for (let i = 0; i < startOffset; i++) {
      days.push({ date: null, dateStr: null, isCurrentMonth: false });
    }
    
    // Current month days
    for (let day = 1; day <= totalDays; day++) {
      const d = new Date(year, month, day);
      const yStr = d.getFullYear();
      const mStr = String(d.getMonth() + 1).padStart(2, '0');
      const dStr = String(day).padStart(2, '0');
      const dateStr = `${yStr}-${mStr}-${dStr}`;
      
      days.push({
        date: d,
        dateStr,
        isCurrentMonth: true
      });
    }
    
    return days;
  }, [currentDate]);

  // Appointments mapping for calendar grid dots
  const appointmentsByDate = useMemo(() => {
    const map: Record<string, Appointment[]> = {};
    appointments.forEach(appt => {
      if (!map[appt.date]) {
        map[appt.date] = [];
      }
      map[appt.date].push(appt);
    });
    return map;
  }, [appointments]);

  // Selected Day appointments
  const selectedDayAppointments = useMemo(() => {
    const dayAppts = appointmentsByDate[selectedDateStr] || [];
    // Sort by time ascending
    return [...dayAppts].sort((a, b) => a.time.localeCompare(b.time));
  }, [appointmentsByDate, selectedDateStr]);

  // Autocomplete suggestions based on existing patients
  const patientSuggestions = useMemo(() => {
    if (!searchPatientQuery.trim()) return [];
    const query = searchPatientQuery.toLowerCase();
    
    // Group records by PT No or Name to avoid duplicates
    const uniquePatientsMap = new Map<string, PatientRecord>();
    records.forEach(r => {
      const key = r.ptNo || r.name;
      if (!uniquePatientsMap.has(key)) {
        uniquePatientsMap.set(key, r);
      }
    });

    return Array.from(uniquePatientsMap.values())
      .filter(p => 
        (p.name && p.name.toLowerCase().includes(query)) ||
        (p.ptNo && p.ptNo.toLowerCase().includes(query)) ||
        (p.phone && p.phone.includes(query))
      )
      .slice(0, 5);
  }, [searchPatientQuery, records]);

  // Handle choosing a patient from autocomplete
  const handleSelectPatient = (p: PatientRecord) => {
    setFormPatientName(p.name);
    setFormPtNo(p.ptNo || '');
    setFormPhone(p.phone || '');
    setSearchPatientQuery('');
    setShowPatientResults(false);
  };

  // Open modal to add appointment
  const handleOpenAddModal = (dateStr?: string) => {
    const targetDate = dateStr || selectedDateStr;
    setEditingAppt(null);
    setFormPatientName('');
    setFormPtNo('');
    setFormDate(targetDate);
    setFormTime('09:00');
    setFormTreatment('');
    setFormPhone('');
    setFormRemarks('');
    setFormStatus('scheduled');
    setSearchPatientQuery('');
    setIsModalOpen(true);
  };

  // Open modal to edit appointment
  const handleOpenEditModal = (appt: Appointment) => {
    onVerifyAdmin(() => {
      setEditingAppt(appt);
      setFormPatientName(appt.patientName);
      setFormPtNo(appt.ptNo || '');
      setFormDate(appt.date);
      setFormTime(appt.time);
      setFormTreatment(appt.treatment);
      setFormPhone(appt.phone || '');
      setFormRemarks(appt.remarks || '');
      setFormStatus(appt.status);
      setSearchPatientQuery('');
      setIsModalOpen(true);
    });
  };

  // Save (Create/Update) Appointment
  const handleSaveAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPatientName.trim()) {
      alert('กรุณากรอกชื่อผู้ป่วย');
      return;
    }
    if (!formDate) {
      alert('กรุณาเลือกวันที่');
      return;
    }
    if (!formTime) {
      alert('กรุณากรอกเวลา');
      return;
    }

    const payload: Partial<Appointment> = {
      patientName: formPatientName,
      ptNo: formPtNo || undefined,
      date: formDate,
      time: formTime,
      treatment: formTreatment,
      phone: formPhone || undefined,
      remarks: formRemarks || undefined,
      status: formStatus
    };

    try {
      let response;
      if (editingAppt) {
        // Edit
        response = await fetch(`/api/appointments/${editingAppt.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        // Create
        response = await fetch('/api/appointments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (!response.ok) {
        throw new Error('เกิดข้อผิดพลาดในการบันทึกนัดหมาย');
      }

      setIsModalOpen(false);
      setEditingAppt(null);
      await fetchAppointments();
    } catch (err: any) {
      alert(err.message || 'บันทึกข้อมูลล้มเหลว');
    }
  };

  // Delete Appointment
  const handleDeleteAppointment = (id: string) => {
    onVerifyAdmin(async () => {
      if (!confirm('คุณต้องการยกเลิกและลบนัดหมายนี้ใช่หรือไม่?')) {
        return;
      }
      try {
        const response = await fetch(`/api/appointments/${id}`, {
          method: 'DELETE'
        });
        if (!response.ok) {
          throw new Error('ลบข้อมูลไม่สำเร็จ');
        }
        await fetchAppointments();
      } catch (err: any) {
        alert(err.message || 'ลบข้อมูลล้มเหลว');
      }
    });
  };

  // Change status instantly from dashboard
  const handleToggleStatus = async (appt: Appointment, newStatus: 'scheduled' | 'completed' | 'cancelled') => {
    onVerifyAdmin(async () => {
      try {
        const response = await fetch(`/api/appointments/${appt.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        });
        if (!response.ok) {
          throw new Error('ไม่สามารถเปลี่ยนสถานะได้');
        }
        await fetchAppointments();
      } catch (err: any) {
        alert(err.message || 'เกิดข้อผิดพลาด');
      }
    });
  };

  // Upcoming appointments list (for Search or List tab)
  const filteredAppointmentsList = useMemo(() => {
    let list = [...appointments];
    
    // Sort chronologically (date ascending, time ascending)
    list.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.time.localeCompare(b.time);
    });

    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      list = list.filter(appt => 
        appt.patientName.toLowerCase().includes(query) ||
        (appt.ptNo && appt.ptNo.toLowerCase().includes(query)) ||
        appt.treatment.toLowerCase().includes(query) ||
        (appt.phone && appt.phone.includes(query)) ||
        appt.date.includes(query)
      );
    }

    return list;
  }, [appointments, searchTerm]);

  // Thai date formatting for list cards
  const formatThaiDateFull = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const year = parseInt(parts[0], 10) + 543;
    const month = thaiMonthNames[parseInt(parts[1], 10) - 1];
    const day = parseInt(parts[2], 10);
    return `วันพฤหัสบดีที่ ${day} ${month} พ.ศ. ${year}`; // Just as standard readable string
  };

  const getThaiDayOfWeekLabel = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return '';
    const dateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    const daysThai = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'];
    return daysThai[dateObj.getDay()];
  };

  const formatThaiFriendlyDate = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const year = parseInt(parts[0], 10) + 543;
    const month = thaiMonthNames[parseInt(parts[1], 10) - 1];
    const day = parseInt(parts[2], 10);
    const dayOfWeek = getThaiDayOfWeekLabel(dateStr);
    return `${dayOfWeek}ที่ ${day} ${month} ${year}`;
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden mb-8 transition-all duration-300">
      
      {/* Tab bar header */}
      <div className={`px-6 py-5 border-b border-gray-100 ${isPink ? 'bg-pink-50/20' : 'bg-teal-50/20'} flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white ${isPink ? 'bg-[#FF5B8C]' : 'bg-teal-600'}`}>
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">ปฏิทินนัดหมายผู้รับบริการล่วงหน้า</h2>
            <p className="text-xs text-gray-500 font-medium">วางแผนนัดเวลาล่วงหน้า จัดตารางการรักษาและจองเครื่องมือฟิสิกส์กายภาพบำบัด</p>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex gap-1 bg-gray-100/80 p-1 rounded-xl self-stretch sm:self-auto">
          <button
            onClick={() => setViewMode('calendar')}
            className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${viewMode === 'calendar' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            ตารางปฏิทินรายเดือน
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
          >
            <ListTodo className="w-3.5 h-3.5" />
            รายการนัดทั้งหมด ({appointments.length})
          </button>
        </div>
      </div>

      {/* Main Grid View */}
      {isLoading ? (
        <div className="flex flex-col justify-center items-center py-24 gap-3 text-gray-400">
          <div className={`w-8 h-8 rounded-full border-4 border-t-transparent animate-spin ${isPink ? 'border-pink-500' : 'border-teal-500'}`}></div>
          <span className="text-xs font-semibold">กำลังดึงตารางนัดหมายล่วงหน้า...</span>
        </div>
      ) : error ? (
        <div className="p-8 text-center text-xs text-red-500 flex flex-col items-center gap-2">
          <AlertCircle className="w-8 h-8 text-red-400" />
          <p>{error}</p>
          <button onClick={fetchAppointments} className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-lg border border-red-200 transition-all cursor-pointer">
            ดึงข้อมูลใหม่อีกครั้ง
          </button>
        </div>
      ) : viewMode === 'calendar' ? (
        
        /* MONTHLY CALENDAR GRID LAYOUT */
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
          
          {/* 1. Left Side: Month Calendar Grid */}
          <div className="lg:col-span-7 p-6 flex flex-col">
            
            {/* Month Header Navigation */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <Bookmark className={`w-4 h-4 ${isPink ? 'text-[#FF5B8C]' : 'text-teal-600'}`} />
                {formatMonthYear(currentDate)}
              </h3>
              
              <div className="flex gap-1">
                <button
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition-all cursor-pointer bg-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentDate(new Date(2026, 6, 11))} // Back to July 2026
                  className="px-2 py-1 text-[10px] font-bold border border-gray-200 hover:bg-gray-50 text-gray-600 transition-all rounded-lg cursor-pointer bg-white"
                >
                  เดือนปัจจุบัน
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition-all cursor-pointer bg-white"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Days of Week Headers */}
            <div className="grid grid-cols-7 text-center text-[11px] font-bold text-gray-400 mb-2">
              <span className="text-red-500 py-1">อา.</span>
              <span className="py-1">จ.</span>
              <span className="py-1">อ.</span>
              <span className="py-1">พ.</span>
              <span className="py-1">พฤ.</span>
              <span className="py-1">ศ.</span>
              <span className="text-blue-500 py-1">ส.</span>
            </div>

            {/* Monthly Day Nodes */}
            <div className="grid grid-cols-7 gap-1.5 flex-1">
              {calendarDays.map((day, idx) => {
                if (!day.date || !day.dateStr) {
                  return (
                    <div 
                      key={`empty-${idx}`} 
                      className="aspect-square bg-gray-50/30 rounded-xl border border-transparent"
                    ></div>
                  );
                }

                const dateStr = day.dateStr;
                const isSelected = dateStr === selectedDateStr;
                const dailyAppts = appointmentsByDate[dateStr] || [];
                const hasAppts = dailyAppts.length > 0;
                
                // Colors based on status
                const activeScheduledCount = dailyAppts.filter(a => a.status === 'scheduled').length;
                const completedCount = dailyAppts.filter(a => a.status === 'completed').length;
                const cancelledCount = dailyAppts.filter(a => a.status === 'cancelled').length;
                
                const isToday = new Date().toDateString() === day.date.toDateString();

                return (
                  <button
                    key={`day-${dateStr}`}
                    onClick={() => setSelectedDateStr(dateStr)}
                    className={`aspect-square relative flex flex-col items-center justify-between p-1.5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? isPink 
                          ? 'bg-[#FF5B8C] border-[#FF5B8C] text-white shadow-lg shadow-pink-500/20' 
                          : 'bg-teal-600 border-teal-600 text-white shadow-lg shadow-teal-600/20'
                        : isToday
                        ? 'bg-slate-100 border-gray-400 text-gray-900 font-bold'
                        : 'bg-white border-gray-100 hover:border-gray-300 text-gray-800 hover:bg-gray-50/50'
                    }`}
                  >
                    {/* Day number */}
                    <span className="text-xs font-bold leading-none mt-1">
                      {day.date.getDate()}
                    </span>

                    {/* Indicators/Dots */}
                    <div className="flex gap-0.5 justify-center w-full pb-1 overflow-hidden">
                      {activeScheduledCount > 0 && (
                        <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-blue-500'}`} title={`${activeScheduledCount} คิวรอนัด`}></span>
                      )}
                      {completedCount > 0 && (
                        <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-emerald-500'}`} title={`${completedCount} เสร็จสิ้น`}></span>
                      )}
                      {cancelledCount > 0 && (
                        <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-red-400'}`} title={`${cancelledCount} ยกเลิก`}></span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Legend guide info */}
            <div className="mt-4 pt-4 border-t border-gray-50 flex flex-wrap gap-4 text-[10px] font-semibold text-gray-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
                รอนัดตรวจรักษา (Scheduled)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                เสร็จสิ้นแล้ว (Completed)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-400 inline-block"></span>
                ยกเลิกนัด (Cancelled)
              </span>
            </div>

          </div>

          {/* 2. Right Side: Daily Appointments Detail Panel */}
          <div className="lg:col-span-5 p-6 bg-slate-50/50 flex flex-col h-full min-h-[380px]">
            
            {/* Header for selected day */}
            <div className="flex justify-between items-center border-b border-gray-100 pb-3.5 mb-4">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">คิวนัดรักษาประจำวัน</span>
                <h4 className="text-sm font-bold text-gray-800 mt-0.5">
                  {formatThaiFriendlyDate(selectedDateStr)}
                </h4>
              </div>
              
              <button
                onClick={() => handleOpenAddModal(selectedDateStr)}
                className={`p-1.5 rounded-xl text-white flex items-center justify-center cursor-pointer transition-all hover:scale-105 shadow-md ${isPink ? 'bg-[#FF5B8C] hover:bg-pink-600' : 'bg-teal-600 hover:bg-teal-700'}`}
                title="เพิ่มนัดหมายสำหรับวันนี้"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* List of appointments */}
            <div className="flex-1 space-y-3 overflow-y-auto max-h-[320px] pr-1">
              {selectedDayAppointments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-dashed border-gray-200/60 rounded-2xl bg-white/50">
                  <Clock className="w-8 h-8 text-gray-300 mb-2 animate-pulse" />
                  <p className="text-xs font-bold text-gray-500">ไม่มีนัดหมายในวันนี้</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">สามารถคลิกปุ่มสีเขียวด้านบนเพื่อบันทึกคิวนัดล่วงหน้าใหม่ได้</p>
                </div>
              ) : (
                selectedDayAppointments.map(appt => {
                  return (
                    <div 
                      key={appt.id} 
                      className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-3.5 hover:shadow-md transition-all relative flex flex-col gap-2.5 ${
                        appt.status === 'completed' 
                          ? 'border-l-4 border-l-emerald-500' 
                          : appt.status === 'cancelled'
                          ? 'border-l-4 border-l-gray-300 bg-gray-50/30'
                          : isPink
                          ? 'border-l-4 border-l-pink-500'
                          : 'border-l-4 border-l-blue-500'
                      }`}
                    >
                      {/* Top section: Time & Patient Name & Actions */}
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded-lg font-mono text-[11px] font-extrabold ${
                            appt.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-700'
                              : appt.status === 'cancelled'
                              ? 'bg-gray-100 text-gray-500'
                              : 'bg-blue-50 text-blue-700'
                          }`}>
                            {appt.time} น.
                          </span>
                          
                          {/* PT No */}
                          {appt.ptNo && (
                            <span className="text-[10px] font-mono font-bold text-gray-400">
                              {appt.ptNo}
                            </span>
                          )}
                        </div>

                        {/* Dropdown status changer & Action buttons */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditModal(appt)}
                            className="p-1 text-gray-400 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-all cursor-pointer"
                            title="แก้ไขข้อมูลนัดรักษา"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteAppointment(appt.id)}
                            className="p-1 text-gray-400 hover:text-red-500 hover:bg-gray-100 rounded-lg transition-all cursor-pointer"
                            title="ลบคิวนัดหมาย"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Patient Name */}
                      <div>
                        <h5 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          {appt.patientName}
                        </h5>
                        
                        {appt.phone && (
                          <p className="text-[10px] text-gray-500 font-medium font-mono flex items-center gap-1.5 mt-0.5">
                            <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            {appt.phone}
                          </p>
                        )}
                      </div>

                      {/* Treatment details */}
                      <div className="bg-slate-50/50 p-2 rounded-xl text-[11px] font-medium text-gray-600 flex flex-col gap-1">
                        <span className="font-semibold text-gray-700">การรักษา:</span>
                        <span>{appt.treatment || 'ยังไม่ได้กำหนดวิธีการรักษา'}</span>
                        {appt.remarks && (
                          <div className="mt-1 pt-1 border-t border-gray-100 text-[10px] text-gray-400 italic">
                            หมายเหตุ: {appt.remarks}
                          </div>
                        )}
                      </div>

                      {/* Status select change bar */}
                      <div className="flex gap-1 border-t border-gray-50 pt-2 text-[10px] font-semibold text-gray-500 items-center justify-between">
                        <span>สถานะนัดหมาย:</span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleToggleStatus(appt, 'scheduled')}
                            className={`px-2 py-0.5 rounded-lg transition-all border cursor-pointer ${appt.status === 'scheduled' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white border-gray-200 text-gray-400'}`}
                          >
                            รอนัด
                          </button>
                          <button
                            onClick={() => handleToggleStatus(appt, 'completed')}
                            className={`px-2 py-0.5 rounded-lg transition-all border cursor-pointer ${appt.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white border-gray-200 text-gray-400'}`}
                          >
                            เสร็จสิ้น
                          </button>
                          <button
                            onClick={() => handleToggleStatus(appt, 'cancelled')}
                            className={`px-2 py-0.5 rounded-lg transition-all border cursor-pointer ${appt.status === 'cancelled' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-white border-gray-200 text-gray-400'}`}
                          >
                            ยกเลิก
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })
              )}
            </div>

          </div>

        </div>
      ) : (
        
        /* ALL UPCOMING APPOINTMENTS LIST VIEW */
        <div className="p-6">
          
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between mb-6">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ค้นหาตามชื่อผู้ป่วย, เลข PT, วิธีการรักษา, หรือวันที่ (YYYY-MM)..."
                className="w-full pl-10 pr-4 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            
            <button
              onClick={() => handleOpenAddModal()}
              className={`w-full sm:w-auto px-4 py-2 text-xs font-bold text-white rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer ${isPink ? 'bg-[#FF5B8C] hover:bg-pink-600' : 'bg-teal-600 hover:bg-teal-700'}`}
            >
              <Plus className="w-4 h-4" />
              เพิ่มคิวนัดหมายล่วงหน้า
            </button>
          </div>

          {/* List display */}
          {filteredAppointmentsList.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-gray-100 rounded-3xl bg-gray-50/20">
              <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-gray-500">ไม่พบคิวการนัดหมายตามเงื่อนไขค้นหา</p>
              <p className="text-xs text-gray-400 mt-1">กรุณาลองป้อนเงื่อนไขค้นหาอื่น หรือสร้างนัดหมายรายใหม่</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAppointmentsList.map(appt => {
                const dayLabel = formatThaiFriendlyDate(appt.date);
                
                return (
                  <div
                    key={appt.id}
                    className={`bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-all flex flex-col gap-3 relative ${
                      appt.status === 'completed'
                        ? 'border-l-4 border-l-emerald-500'
                        : appt.status === 'cancelled'
                        ? 'border-l-4 border-l-gray-300 bg-gray-50/40'
                        : isPink
                        ? 'border-l-4 border-l-pink-500'
                        : 'border-l-4 border-l-blue-500'
                    }`}
                  >
                    {/* Header: Date and Time */}
                    <div className="flex justify-between items-center pb-2 border-b border-gray-50">
                      <span className="text-[10px] font-bold text-gray-500 font-mono bg-gray-100 px-2 py-0.5 rounded">
                        {dayLabel}
                      </span>
                      <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-black ${
                        appt.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-700'
                          : appt.status === 'cancelled'
                          ? 'bg-gray-100 text-gray-400'
                          : 'bg-blue-50 text-blue-700'
                      }`}>
                        {appt.time} น.
                      </span>
                    </div>

                    {/* Patient Info */}
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-bold text-gray-900">{appt.patientName}</h4>
                        {appt.ptNo && (
                          <span className="text-[9px] font-mono font-extrabold text-gray-400 border px-1 py-0.2 rounded">
                            {appt.ptNo}
                          </span>
                        )}
                      </div>
                      
                      {appt.phone && (
                        <p className="text-[10px] text-gray-500 font-mono mt-0.5 flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          {appt.phone}
                        </p>
                      )}
                    </div>

                    {/* Treatment info */}
                    <div className="bg-slate-50/50 p-2.5 rounded-xl text-[10px] font-medium text-gray-600 flex flex-col gap-1 flex-1">
                      <span className="font-bold text-gray-700">แผนการรักษา:</span>
                      <span>{appt.treatment}</span>
                      {appt.remarks && (
                        <span className="text-[9px] text-gray-400 italic pt-1 border-t border-gray-100 mt-1">
                          นัดเพิ่มเติม: {appt.remarks}
                        </span>
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div className="flex justify-between items-center pt-2.5 border-t border-gray-50 mt-1">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${
                        appt.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : appt.status === 'cancelled'
                          ? 'bg-red-50 text-red-600 border-red-100'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {appt.status === 'completed' ? 'เสร็จสิ้นแล้ว' : appt.status === 'cancelled' ? 'ยกเลิก' : 'รอนัดตรวจรักษา'}
                      </span>

                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(appt)}
                          className="p-1 text-gray-400 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-all cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteAppointment(appt.id)}
                          className="p-1 text-gray-400 hover:text-red-500 hover:bg-gray-100 rounded-lg transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* APPOINTMENT FORM MODAL (CREATE OR EDIT) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-gray-100 flex flex-col">
            
            {/* Modal Header */}
            <div className={`px-6 py-4 border-b border-gray-100 flex justify-between items-center ${isPink ? 'bg-pink-50/30' : 'bg-teal-50/30'} rounded-t-3xl`}>
              <h3 className="text-sm font-bold text-gray-900">
                {editingAppt ? '📝 แก้ไขข้อมูลนัดหมายล่วงหน้า' : '🗓️ เพิ่มนัดหมายผู้รับบริการล่วงหน้า'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveAppointment} className="p-6 space-y-4">
              
              {/* Autocomplete Patient Search Block */}
              <div className="relative">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                  ค้นหาเชื่อมโยงคนไข้เดิม (ออโตคอมพลีต)
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchPatientQuery}
                    onChange={(e) => {
                      setSearchPatientQuery(e.target.value);
                      setShowPatientResults(true);
                    }}
                    onFocus={() => setShowPatientResults(true)}
                    placeholder="ป้อนชื่อคนไข้ หรือเลข PT เพื่อดึงประวัติเดิม..."
                    className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  {searchPatientQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchPatientQuery('')}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Suggestions dropdown */}
                {showPatientResults && patientSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-xl z-50 max-h-[160px] overflow-y-auto divide-y divide-gray-50">
                    {patientSuggestions.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectPatient(p)}
                        className="w-full text-left px-4 py-2 text-xs hover:bg-gray-50 flex items-center justify-between cursor-pointer"
                      >
                        <div>
                          <p className="font-semibold text-gray-800">{p.name}</p>
                          <p className="text-[10px] text-gray-400 font-mono">
                            {p.ptNo} {p.phone ? `| โทร: ${p.phone}` : ''}
                          </p>
                        </div>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Patient Name */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                  ชื่อ-นามสกุลผู้ป่วย <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formPatientName}
                  onChange={(e) => setFormPatientName(e.target.value)}
                  placeholder="ป้อนชื่อผู้ป่วย (เช่น นายจักรกริช ราชสิงห์)"
                  className="w-full px-3.5 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* PT NO. */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                  หมายเลขประจำตัวผู้ป่วย (PT NO.) ถ้ามี
                </label>
                <input
                  type="text"
                  value={formPtNo}
                  onChange={(e) => setFormPtNo(e.target.value)}
                  placeholder="เช่น PT69-001"
                  className="w-full px-3.5 py-2 text-xs font-semibold font-mono border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Date & Time fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                    วันที่นัดรักษา <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-semibold border border-gray-200 rounded-xl focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                    เวลานัดรักษา <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-semibold border border-gray-200 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              {/* Phone number */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                  เบอร์โทรศัพท์ติดต่อ
                </label>
                <input
                  type="text"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="ป้อนเบอร์โทรติดต่อผู้ป่วย"
                  className="w-full px-3.5 py-2 text-xs font-mono border border-gray-200 rounded-xl focus:outline-none"
                />
              </div>

              {/* Treatment Plans Selector */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                  เลือกหรือระบุ แผนเครื่องมือการรักษาฟิสิกส์กายภาพบำบัด
                </label>
                
                {/* Fast Select Grid */}
                <div className="grid grid-cols-2 gap-1.5 mb-2 max-h-[100px] overflow-y-auto border border-gray-50 p-2 rounded-xl bg-slate-50/50">
                  {TREATMENT_LIST.map(t => {
                    const isSelected = formTreatment.includes(t.label);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          const current = formTreatment ? formTreatment.split(',').map(x => x.trim()).filter(Boolean) : [];
                          if (current.includes(t.label)) {
                            // Remove
                            const updated = current.filter(x => x !== t.label).join(', ');
                            setFormTreatment(updated);
                          } else {
                            // Add
                            current.push(t.label);
                            setFormTreatment(current.join(', '));
                          }
                        }}
                        className={`px-2 py-1 rounded-lg text-[9px] font-bold border transition-all text-left cursor-pointer truncate ${
                          isSelected 
                            ? isPink 
                              ? 'bg-pink-100 border-[#FF5B8C] text-pink-700' 
                              : 'bg-teal-100 border-teal-500 text-teal-700'
                            : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {t.label} ({t.sub})
                      </button>
                    );
                  })}
                </div>

                <input
                  type="text"
                  value={formTreatment}
                  onChange={(e) => setFormTreatment(e.target.value)}
                  placeholder="ระบุวิธีการรักษาเพิ่มเติม..."
                  className="w-full px-3.5 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                  หมายเหตุนัดรักษา / อาการเพิ่มเติม
                </label>
                <textarea
                  value={formRemarks}
                  onChange={(e) => setFormRemarks(e.target.value)}
                  placeholder="ป้อนรายละเอียดหมายเหตุ เช่น ปวดร้าวต้นบ่า, นัดอัลตราซาวด์เพิ่ม"
                  rows={2}
                  className="w-full px-3.5 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Status Selector */}
              {editingAppt && (
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                    สถานะการนัดหมาย
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none"
                  >
                    <option value="scheduled">รอนัดตรวจรักษา (Scheduled)</option>
                    <option value="completed">เข้ารับรักษาสำเร็จแล้ว (Completed)</option>
                    <option value="cancelled">ยกเลิกนัดรักษา (Cancelled)</option>
                  </select>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2.5 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 border border-gray-200 text-xs font-bold text-gray-500 hover:bg-gray-50 rounded-xl transition-all cursor-pointer"
                >
                  ปิดหน้าต่าง
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-2 text-xs font-bold text-white rounded-xl shadow-md transition-all cursor-pointer ${isPink ? 'bg-[#FF5B8C] hover:bg-pink-600' : 'bg-teal-600 hover:bg-teal-700'}`}
                >
                  {editingAppt ? 'อัปเดตนัดหมาย' : 'บันทึกนัดหมาย'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
