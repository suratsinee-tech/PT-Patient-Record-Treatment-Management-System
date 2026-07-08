import React, { useRef, useState } from 'react';
import { Database, Download, Upload, RotateCcw, Trash2, ShieldCheck, RefreshCw } from 'lucide-react';
import { PatientRecord } from '../types';

interface BackupSettingsProps {
  onResetDb: () => Promise<void>;
  onClearDb: () => Promise<void>;
  onImportBackup: (records: PatientRecord[]) => Promise<void>;
  records: PatientRecord[];
  theme: 'teal' | 'pink';
  isAdmin: boolean;
  onVerifyAdmin: (action: () => void) => void;
}

export default function BackupSettings({
  onResetDb,
  onClearDb,
  onImportBackup,
  records,
  theme,
  isAdmin,
  onVerifyAdmin
}: BackupSettingsProps) {
  const isPink = theme === 'pink';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [isError, setIsError] = useState(false);

  // Trigger Reset
  const handleReset = () => {
    onVerifyAdmin(async () => {
      if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการรีเซ็ตฐานข้อมูลกลับไปเป็นค่าเริ่มต้น (9 รายการต้นฉบับ)? ข้อมูลปัจจุบันจะถูกเขียนทับทั้งหมด!')) {
        return;
      }
      
      setIsLoading(true);
      setStatusMsg('');
      try {
        await onResetDb();
        setIsError(false);
        setStatusMsg('รีเซ็ตฐานข้อมูลและเปิดใช้ 9 รายการต้นฉบับสำเร็จ!');
      } catch (e: any) {
        setIsError(true);
        setStatusMsg(e.message || 'รีเซ็ตข้อมูลล้มเหลว');
      } finally {
        setIsLoading(false);
      }
    });
  };

  // Trigger Clear
  const handleClear = () => {
    onVerifyAdmin(async () => {
      if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลทั้งหมดในระบบ? การดำเนินการนี้เป็นแบบถาวรและไม่สามารถกู้คืนได้!')) {
        return;
      }

      setIsLoading(true);
      setStatusMsg('');
      try {
        await onClearDb();
        setIsError(false);
        setStatusMsg('ล้างฐานข้อมูลระบบสำเร็จ!');
      } catch (e: any) {
        setIsError(true);
        setStatusMsg(e.message || 'ล้างข้อมูลล้มเหลว');
      } finally {
        setIsLoading(false);
      }
    });
  };

  // Trigger Download JSON Backup
  const handleDownloadBackup = () => {
    const jsonString = JSON.stringify(records, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `สำรองข้อมูล_กายภาพบำบัด_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Trigger Import JSON Backup
  const handleImportClick = () => {
    onVerifyAdmin(() => {
      fileInputRef.current?.click();
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setStatusMsg('');
    setIsError(false);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        
        if (!Array.isArray(parsed)) {
          throw new Error('รูปแบบไฟล์ไม่ถูกต้อง (ต้องเป็นรายการอาร์เรย์ของบันทึกผู้ป่วย)');
        }

        // Quick schema verification
        if (parsed.length > 0) {
          const first = parsed[0];
          if (!first.name || !first.chiefComplaint) {
            throw new Error('โครงสร้างบันทึกผู้ป่วยไม่ถูกต้อง ขาดฟิลด์สำคัญ (เช่น name, chiefComplaint)');
          }
        }

        await onImportBackup(parsed);
        setIsError(false);
        setStatusMsg(`กู้คืนข้อมูลสำเร็จ! นำเข้าข้อมูลจำนวน ${parsed.length} รายการ`);
      } catch (err: any) {
        setIsError(true);
        setStatusMsg(err.message || 'ไม่สามารถนำเข้าไฟล์ดังกล่าวได้ กรุณาตรวจสอบความถูกต้อง');
      } finally {
        setIsLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
        <div className={`p-3 rounded-2xl ${isPink ? 'bg-pink-50 text-[#FF5B8C]' : 'bg-teal-50 text-teal-600'}`}>
          <Database className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900 tracking-tight">
            ระบบสำรองข้อมูลและจัดการฐานข้อมูลทางคลินิก (Backup & Settings)
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            บันทึก สำรอง รีเซ็ต หรือกู้คืนฐานข้อมูลประวัติการรักษาผู้รับบริการกายภาพบำบัด เพื่อป้องกันการสูญหายของข้อมูล
          </p>
        </div>
      </div>

      {statusMsg && (
        <div className={`p-4 rounded-xl text-xs font-semibold border flex items-center gap-2 ${isError ? 'bg-red-50 border-red-100 text-red-600' : 'bg-green-50 border-green-100 text-green-700'}`}>
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Settings Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Panel 1: Database Operations */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between h-[230px]">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <Database className="w-5 h-5 text-gray-500" />
              <h3 className="text-sm font-bold text-gray-800">จัดการข้อมูลประวัติผู้ป่วย</h3>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed mb-4">
              คุณสามารถล้างฐานข้อมูลระบบทั้งหมดเพื่อเริ่มใช้งานเคสใหม่ หรือรีเซ็ตข้อมูลกลับไปเป็นแบบร่างเริ่มต้น 9 รายการจากเอกสารเขียนมือประวัติการรักษาปี 2569 เพื่อตรวจสอบการทำงาน
            </p>
          </div>

          <div className="flex gap-2.5">
            <button
              onClick={handleReset}
              disabled={isLoading}
              className={`flex-1 py-2.5 text-xs font-bold border rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 ${isPink ? 'text-pink-700 bg-pink-50 border-pink-100 hover:bg-pink-100' : 'text-teal-700 bg-teal-50 border-teal-100 hover:bg-teal-100'}`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              รีเซ็ต 9 รายการเดิม
            </button>
            <button
              onClick={handleClear}
              disabled={isLoading}
              className="flex-1 py-2.5 text-xs font-bold text-red-700 bg-red-50 border border-red-100 rounded-xl hover:bg-red-100 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              ล้างฐานข้อมูลทั้งหมด
            </button>
          </div>
        </div>

        {/* Panel 2: Backup & Restore */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between h-[230px]">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <Download className="w-5 h-5 text-gray-500" />
              <h3 className="text-sm font-bold text-gray-800">สำรองและกู้คืนฐานข้อมูล (.json)</h3>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed mb-4">
              ส่งออกข้อมูลเป็นไฟล์สำรอง .json เพื่อนำไปใช้กับอุปกรณ์อื่น หรือกู้คืนฐานข้อมูลการรักษาด้วยไฟล์ .json สำรองที่คุณบันทึกเก็บไว้ ระบบประมวลผลทันทีออฟไลน์อย่างสมบูรณ์แบบ
            </p>
          </div>

          <div className="flex gap-2.5">
            <button
              onClick={handleDownloadBackup}
              disabled={isLoading}
              className="flex-1 py-2.5 text-xs font-bold text-gray-700 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              ดาวน์โหลดไฟล์สำรอง
            </button>
            
            <button
              onClick={handleImportClick}
              disabled={isLoading}
              className="flex-1 py-2.5 text-xs font-bold text-gray-700 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              กู้คืนจากไฟล์สำรอง
            </button>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
          </div>
        </div>

      </div>

      {/* Safety Note banner */}
      <div className="bg-gray-50 p-4 border border-gray-100 rounded-xl flex gap-3">
        <ShieldCheck className={`w-5 h-5 shrink-0 ${isPink ? 'text-[#FF5B8C]' : 'text-teal-600'}`} />
        <div className="text-xs text-gray-500 leading-relaxed">
          <span className="font-bold text-gray-700 block mb-0.5">การจัดเก็บฐานข้อมูลคลินิกที่มีระบบความปลอดภัยสูง (Local + Server Persistence)</span>
          ประวัติการรักษาผู้รับบริการกายภาพบำบัดจะถูกจัดเก็บลงในระบบไฟล์เซิร์ฟเวอร์แบบถาวร เพื่อให้มั่นใจได้ว่าข้อมูลจะไม่เกิดการสูญหายเมื่อล้างแคชบราวเซอร์ สำหรับข้อมูลความลับผู้ป่วย กรุณาหมั่นสำรองข้อมูลแบบสม่ำเสมอ
        </div>
      </div>

    </div>
  );
}
