import React, { useState, useEffect } from 'react';
import { X, FileText, Activity, CreditCard, ChevronRight, Check } from 'lucide-react';
import { PatientRecord } from '../types';
import { TREATMENT_LIST, PT_DIAGNOSES } from '../data';

interface RecordModalProps {
  record?: PatientRecord | null; // If editing
  onClose: () => void;
  onSave: (record: PatientRecord) => void;
  theme: 'teal' | 'pink';
}

export default function RecordModal({ record, onClose, onSave, theme }: RecordModalProps) {
  const isPink = theme === 'pink';
  // Form states
  const [date, setDate] = useState('');
  const [ptNo, setPtNo] = useState('');
  const [serviceType, setServiceType] = useState<'new' | 'followup'>('new');
  const [citizenId, setCitizenId] = useState('');
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [birthYear, setBirthYear] = useState('');
  const [age, setAge] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [underlyingDisease, setUnderlyingDisease] = useState('');
  
  // Section 2
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [ptDiagnosis, setPtDiagnosis] = useState('');

  // Section 3
  const [selectedTreatments, setSelectedTreatments] = useState<string[]>([]);
  const [otherTreatment, setOtherTreatment] = useState('');
  const [fee, setFee] = useState<number>(0);
  const [remarks, setRemarks] = useState('');



  // Load record data if editing
  useEffect(() => {
    if (record) {
      setDate(record.date);
      setPtNo(record.ptNo || '');
      setServiceType(record.serviceType);
      setCitizenId(record.citizenId || '');
      setName(record.name || '');
      setGender(record.gender || 'male');
      setBirthYear(record.birthYear || '');
      setAge(record.age || '');
      setPhone(record.phone || '');
      setAddress(record.address || '');
      setUnderlyingDisease(record.underlyingDisease || '');
      setChiefComplaint(record.chiefComplaint || '');
      setPtDiagnosis(record.ptDiagnosis || '');
      setSelectedTreatments(record.treatments || []);
      setOtherTreatment(record.otherTreatment || '');
      setFee(record.fee || 0);
      setRemarks(record.remarks || '');
    } else {
      // Default to today's date in local YYYY-MM-DD
      const today = new Date();
      const localDate = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
      setDate(localDate);
      setPtNo('');
      setServiceType('new');
      setCitizenId('');
      setName('');
      setGender('male');
      setBirthYear('');
      setAge('');
      setPhone('');
      setAddress('');
      setUnderlyingDisease('');
      setChiefComplaint('');
      setPtDiagnosis('');
      setSelectedTreatments([]);
      setOtherTreatment('');
      setFee(0);
      setRemarks('');
    }
  }, [record]);

  // Handle BirthYear changes to auto-calculate Age
  // Year is BE (e.g. 2504), current year is 2569 (CE 2026)
  useEffect(() => {
    const yearNum = parseInt(birthYear, 10);
    if (!isNaN(yearNum) && yearNum > 2400 && yearNum < 2600) {
      const calculatedAge = 2569 - yearNum;
      setAge(String(calculatedAge));
    }
  }, [birthYear]);

  // Format ID card input: X-XXXX-XXXXX-XX-X
  const handleCitizenIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, '');
    let formatted = '';
    
    if (rawVal.length > 0) {
      formatted += rawVal.substring(0, 1);
    }
    if (rawVal.length > 1) {
      formatted += '-' + rawVal.substring(1, 5);
    }
    if (rawVal.length > 5) {
      formatted += '-' + rawVal.substring(5, 10);
    }
    if (rawVal.length > 10) {
      formatted += '-' + rawVal.substring(10, 12);
    }
    if (rawVal.length > 12) {
      formatted += '-' + rawVal.substring(12, 13);
    }
    
    setCitizenId(formatted);
  };

  // Toggle treatment selections
  const handleTreatmentToggle = (id: string) => {
    if (selectedTreatments.includes(id)) {
      setSelectedTreatments(selectedTreatments.filter(t => t !== id));
    } else {
      setSelectedTreatments([...selectedTreatments, id]);
    }
  };

  // Quick Diagnosis tag click
  const handleDiagnosisTagClick = (diag: string) => {
    if (ptDiagnosis.trim() === '') {
      setPtDiagnosis(diag);
    } else if (ptDiagnosis.includes(diag)) {
      // If already has it, do nothing or let user modify
    } else {
      setPtDiagnosis(prev => `${prev}, ${diag}`);
    }
  };



  // Form submit handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('กรุณากรอกชื่อ - นามสกุลผู้ป่วย');
      return;
    }
    if (!date) {
      alert('กรุณาระบุวันที่รับบริการ');
      return;
    }
    if (!chiefComplaint.trim()) {
      alert('กรุณากรอกอาการสำคัญ');
      return;
    }
    if (fee <= 0) {
      alert('กรุณาระบุค่าบริการรักษาพยาบาล');
      return;
    }

    const payload: PatientRecord = {
      id: record ? record.id : '',
      date,
      ptNo,
      serviceType,
      citizenId,
      name,
      gender,
      birthYear,
      age,
      phone,
      address,
      underlyingDisease,
      chiefComplaint,
      ptDiagnosis,
      treatments: selectedTreatments,
      otherTreatment,
      fee: Number(fee),
      remarks,
      createdAt: record ? record.createdAt : new Date().toISOString()
    };

    onSave(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto backdrop-blur-sm">
      <div className="relative w-full max-w-5xl my-8 bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className={`px-6 py-5 border-b border-gray-100 flex justify-between items-center ${isPink ? 'bg-[#FFF0F4]' : 'bg-gray-50/50'}`}>
          <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">
              {record ? 'แก้ไขบันทึกผู้รับบริการกายภาพบำบัด' : 'บันทึกผู้รับบริการกายภาพบำบัดใหม่'}
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              {isPink ? 'สมุดบันทึกรายการรับบริการ แผน กายภาพบำบัด' : 'สหคลินิกเดชอุดม แลบ กายภาพบำบัด (ปี พ.ศ. 2569)'}
            </p>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Section 1 */}
          <div className="space-y-4">
            <h3 className={`text-sm font-semibold border-b pb-2 flex items-center gap-1.5 ${isPink ? 'text-pink-600 border-pink-100' : 'text-teal-700 border-teal-100'}`}>
              <FileText className={`w-4 h-4 ${isPink ? 'text-[#FF5B8C]' : 'text-teal-600'}`} />
              1. ข้อมูลการรับบริการและรายละเอียดส่วนตัวผู้ป่วย
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">วันที่รับบริการ *</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 ${isPink ? 'focus:ring-pink-400' : 'focus:ring-teal-500'} focus:border-transparent text-sm`}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">PT NO. (เลขทะเบียนผู้ป่วยนอก)</label>
                <input
                  type="text"
                  placeholder="ระบุ หรือเว้นว่างเพื่อระบบสุ่มรหัส"
                  value={ptNo}
                  onChange={(e) => setPtNo(e.target.value)}
                  className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 ${isPink ? 'focus:ring-pink-400' : 'focus:ring-teal-500'} focus:border-transparent text-sm`}
                />
              </div>

              <div>
                <span className="block text-xs font-medium text-gray-700 mb-2">ประเภทการรับบริการ</span>
                <div className="flex gap-4 mt-1">
                  <label className="inline-flex items-center text-sm text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      checked={serviceType === 'new'}
                      onChange={() => setServiceType('new')}
                      className={`w-4 h-4 border-gray-300 focus:ring-2 ${isPink ? 'text-[#FF5B8C] focus:ring-pink-400' : 'text-teal-600 focus:ring-teal-500'}`}
                    />
                    <span className="ml-2">รายใหม่ (New Case)</span>
                  </label>
                  <label className="inline-flex items-center text-sm text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      checked={serviceType === 'followup'}
                      onChange={() => setServiceType('followup')}
                      className={`w-4 h-4 border-gray-300 focus:ring-2 ${isPink ? 'text-[#FF5B8C] focus:ring-pink-400' : 'text-teal-600 focus:ring-teal-500'}`}
                    />
                    <span className="ml-2">รายเก่า (Follow-up)</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">เลขประจำตัวผู้เสียภาษี/บัตรประชาชน (13 หลัก)</label>
                <input
                  type="text"
                  placeholder="X-XXXX-XXXXX-XX-X"
                  maxLength={17}
                  value={citizenId}
                  onChange={handleCitizenIdChange}
                  className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 ${isPink ? 'focus:ring-pink-400' : 'focus:ring-teal-500'} focus:border-transparent text-sm font-mono`}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">ชื่อ - นามสกุล *</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น นายจักรกริช ราชสิงห์"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 ${isPink ? 'focus:ring-pink-400' : 'focus:ring-teal-500'} focus:border-transparent text-sm`}
                />
              </div>

              <div>
                <span className="block text-xs font-medium text-gray-700 mb-2">เพศ</span>
                <div className="flex gap-4 mt-1">
                  <label className="inline-flex items-center text-sm text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      checked={gender === 'male'}
                      onChange={() => setGender('male')}
                      className={`w-4 h-4 border-gray-300 focus:ring-2 ${isPink ? 'text-[#FF5B8C] focus:ring-pink-400' : 'text-teal-600 focus:ring-teal-500'}`}
                    />
                    <span className="ml-1.5">ชาย</span>
                  </label>
                  <label className="inline-flex items-center text-sm text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      checked={gender === 'female'}
                      onChange={() => setGender('female')}
                      className={`w-4 h-4 border-gray-300 focus:ring-2 ${isPink ? 'text-[#FF5B8C] focus:ring-pink-400' : 'text-teal-600 focus:ring-teal-500'}`}
                    />
                    <span className="ml-1.5">หญิง</span>
                  </label>
                  <label className="inline-flex items-center text-sm text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      checked={gender === 'other'}
                      onChange={() => setGender('other')}
                      className={`w-4 h-4 border-gray-300 focus:ring-2 ${isPink ? 'text-[#FF5B8C] focus:ring-pink-400' : 'text-teal-600 focus:ring-teal-500'}`}
                    />
                    <span className="ml-1.5">อื่นๆ</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">ปีเกิด พ.ศ. (คำนวณอายุอัตโนมัติ)</label>
                <input
                  type="text"
                  placeholder="เช่น 2508"
                  maxLength={4}
                  value={birthYear}
                  onChange={(e) => setBirthYear(e.target.value.replace(/\D/g, ''))}
                  className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 ${isPink ? 'focus:ring-pink-400' : 'focus:ring-teal-500'} focus:border-transparent text-sm`}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">อายุ (ปี)</label>
                <input
                  type="text"
                  placeholder="คำนวณอัตโนมัติ หรือระบุเอง"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 ${isPink ? 'focus:ring-pink-400' : 'focus:ring-teal-500'} focus:border-transparent text-sm text-gray-600 bg-gray-50/50`}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">เบอร์โทรศัพท์ติดต่อ</label>
                <input
                  type="tel"
                  placeholder="เช่น 081-234-5678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 ${isPink ? 'focus:ring-pink-400' : 'focus:ring-teal-500'} focus:border-transparent text-sm`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">ที่อยู่ผู้รับบริการ</label>
                <input
                  type="text"
                  placeholder="ระบุ บ้านเลขที่, หมู่, ตำบล, อำเภอ, จังหวัด"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 ${isPink ? 'focus:ring-pink-400' : 'focus:ring-teal-500'} focus:border-transparent text-sm`}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">โรคประจำตัว / ข้อควรระวัง</label>
                <input
                  type="text"
                  placeholder="เช่น เบาหวาน, ความดันสูง, หรือระบุ '-'"
                  value={underlyingDisease}
                  onChange={(e) => setUnderlyingDisease(e.target.value)}
                  className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 ${isPink ? 'focus:ring-pink-400' : 'focus:ring-teal-500'} focus:border-transparent text-sm`}
                />
              </div>
            </div>
          </div>

          {/* Section 2 */}
          <div className="space-y-4">
            <div className={`flex justify-between items-center border-b pb-2 ${isPink ? 'border-pink-100' : 'border-teal-100'}`}>
              <h3 className={`text-sm font-semibold flex items-center gap-1.5 ${isPink ? 'text-pink-600' : 'text-teal-700'}`}>
                <Activity className={`w-4 h-4 ${isPink ? 'text-[#FF5B8C]' : 'text-teal-600'}`} />
                2. อาการสำคัญและการประเมินทาง clinical
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">อาการสำคัญ (Chief Complaint) *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="ระบุอาการสำคัญ เช่น ปวดไหล่ข้างขวาร้าวลงต้นแขน แขนอ่อนแรง ยกไหล่ไม่ขึ้นมา 2 สัปดาห์"
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 ${isPink ? 'focus:ring-pink-400' : 'focus:ring-teal-500'} focus:border-transparent text-sm`}
                />
              </div>

              <div className="flex flex-col h-full">
                <label className="block text-xs font-medium text-gray-700 mb-1">การวินิจฉัยโรคทางกายภาพบำบัด (PT Diagnosis)</label>
                <textarea
                  rows={2}
                  placeholder="เช่น Frozen Shoulder (ข้อไหล่ติด), MPS (กลุ่มอาการปวดกล้ามเนื้อ)"
                  value={ptDiagnosis}
                  onChange={(e) => setPtDiagnosis(e.target.value)}
                  className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 ${isPink ? 'focus:ring-pink-400' : 'focus:ring-teal-500'} focus:border-transparent text-sm flex-1`}
                />
                
                {/* Diagnosis Tags */}
                <div className="mt-2">
                  <span className="block text-[11px] font-medium text-gray-400 mb-1">คลิกเพื่อเลือกกลุ่มอาการ:</span>
                  <div className="flex flex-wrap gap-1 max-h-[100px] overflow-y-auto pr-1">
                    {PT_DIAGNOSES.map((diag) => (
                      <button
                        key={diag}
                        type="button"
                        onClick={() => handleDiagnosisTagClick(diag)}
                        className="px-2 py-0.5 text-[10px] text-gray-600 bg-gray-50 border border-gray-200 rounded hover:bg-gray-100 hover:text-gray-900 transition-all cursor-pointer font-sans"
                      >
                        {diag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3 */}
          <div className="space-y-4">
            <h3 className={`text-sm font-semibold border-b pb-2 flex items-center gap-1.5 ${isPink ? 'text-pink-600 border-pink-100' : 'text-teal-700 border-teal-100'}`}>
              <CreditCard className={`w-4 h-4 ${isPink ? 'text-[#FF5B8C]' : 'text-teal-600'}`} />
              3. แผนการรักษา (TREATMENTS) และค่าธรรมเนียมบริการ
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left Side: Treatment Selection */}
              <div>
                <span className="block text-xs font-medium text-gray-700 mb-2">
                  วิธีการรักษา / เครื่องมือกายภาพบำบัด (เลือกได้มากกว่า 1)
                </span>
                
                <div className="grid grid-cols-2 gap-2">
                  {TREATMENT_LIST.map((item) => {
                    const isChecked = selectedTreatments.includes(item.id);
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleTreatmentToggle(item.id)}
                        className={`p-3 border rounded-xl cursor-pointer flex items-start gap-2.5 transition-all select-none hover:shadow-sm ${isChecked ? (isPink ? 'bg-pink-50/50 border-[#FF5B8C] ring-1 ring-pink-400/50' : 'bg-teal-50/50 border-teal-500 ring-1 ring-teal-500/50') : 'bg-white border-gray-100'}`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // Controlled by card click
                          className={`w-4 h-4 border-gray-300 rounded focus:ring-2 mt-0.5 pointer-events-none ${isPink ? 'text-[#FF5B8C] focus:ring-pink-400' : 'text-teal-600 focus:ring-teal-500'}`}
                        />
                        <div className="text-left">
                          <span className="block text-xs font-bold text-gray-800 tracking-tight font-sans">
                            {item.label}
                          </span>
                          <span className="block text-[10px] text-gray-500 leading-tight">
                            {item.sub}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">การรักษาพิเศษ / เพิ่มเติมอื่นๆ</label>
                  <input
                    type="text"
                    placeholder="เช่น ดึงหลังด้วยมือ, ประคบเย็น, แผ่นรองส้นเท้า"
                    value={otherTreatment}
                    onChange={(e) => setOtherTreatment(e.target.value)}
                    className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 ${isPink ? 'focus:ring-pink-400' : 'focus:ring-teal-500'} focus:border-transparent text-sm`}
                  />
                </div>
              </div>

              {/* Right Side: Fees and Remarks */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">ค่าบริการรักษาพยาบาล (บาท) *</label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min={0}
                      placeholder="ปกติ 450, 500, 800"
                      value={fee || ''}
                      onChange={(e) => setFee(Number(e.target.value))}
                      className={`w-full pl-3 pr-12 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 ${isPink ? 'focus:ring-pink-400 text-pink-900' : 'focus:ring-teal-500 text-teal-900'} focus:border-transparent text-sm font-semibold`}
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-xs text-gray-400">
                      บาท
                    </div>
                  </div>
                  
                  {/* Quick Select Buttons */}
                  <div className="flex gap-2 mt-2">
                    {[450, 500, 800, 1000].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setFee(val)}
                        className={`px-3 py-1 text-xs border rounded-lg transition-all font-medium ${fee === val ? (isPink ? 'bg-[#FF5B8C] text-white border-[#FF5B8C]' : 'bg-teal-600 text-white border-teal-600') : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                      >
                        {val} บาท
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">หมายเหตุ / ผลการรักษา / ข้อเสนอแนะเพิ่มเติม</label>
                  <textarea
                    rows={4}
                    placeholder="เช่น หลังรักษารู้สึกเบาสบายมากขึ้น นัดครั้งหน้ามาทำ PMS ซ้ำ..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 ${isPink ? 'focus:ring-pink-400' : 'focus:ring-teal-500'} focus:border-transparent text-sm`}
                  />
                </div>
              </div>

            </div>
          </div>

        </form>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 items-center">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-sm text-gray-700 font-medium bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-all cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className={`px-6 py-2 text-sm font-bold text-white rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer ${isPink ? 'bg-[#FF5B8C] hover:bg-[#E04D79] shadow-pink-500/10' : 'bg-teal-600 hover:bg-teal-700 shadow-teal-600/10'}`}
          >
            <Check className="w-4 h-4" />
            บันทึกข้อมูลการรับบริการ
          </button>
        </div>

      </div>
    </div>
  );
}
