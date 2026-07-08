import React, { useState, useEffect } from 'react';
import { Heart, Database, BarChart3, ListCollapse, Plus, HelpCircle, Loader2, Palette, Lock, Unlock } from 'lucide-react';
import { PatientRecord } from './types';
import Dashboard from './components/Dashboard';
import SpreadsheetLog from './components/SpreadsheetLog';
import BackupSettings from './components/BackupSettings';
import RecordModal from './components/RecordModal';
import AdminLoginModal from './components/AdminLoginModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<'spreadsheet' | 'dashboard' | 'backup'>('dashboard');
  const [records, setRecords] = useState<PatientRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // UI Theme state ('teal' | 'pink')
  const [theme, setTheme] = useState<'teal' | 'pink'>('teal');
  const isPink = theme === 'pink';

  // Admin authentication state
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingAdminAction, setPendingAdminAction] = useState<(() => void) | null>(null);

  // Modal control
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PatientRecord | null>(null);

  // Fetch all records on mount
  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/records');
      if (!response.ok) {
        throw new Error('ไม่สามารถดึงข้อมูลรายการรับบริการได้');
      }
      const data = await response.json();
      setRecords(data);
      setError('');
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  // Verify Admin Action helper
  const handleVerifyAdmin = (action: () => void) => {
    if (isAdmin) {
      action();
    } else {
      setPendingAdminAction(() => action);
      setShowLoginModal(true);
    }
  };

  // Open modal for new record
  const handleAddClick = () => {
    handleVerifyAdmin(() => {
      setEditingRecord(null);
      setIsModalOpen(true);
    });
  };

  // Open modal for editing record
  const handleEditClick = (record: PatientRecord) => {
    handleVerifyAdmin(() => {
      setEditingRecord(record);
      setIsModalOpen(true);
    });
  };

  // Save record (Create or Update)
  const handleSaveRecord = async (recordPayload: PatientRecord) => {
    try {
      let response;
      if (recordPayload.id) {
        // Update existing record
        response = await fetch(`/api/records/${recordPayload.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(recordPayload)
        });
      } else {
        // Create new record
        response = await fetch('/api/records', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(recordPayload)
        });
      }

      if (!response.ok) {
        throw new Error('บันทึกข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
      }

      // Close modal and reload
      setIsModalOpen(false);
      setEditingRecord(null);
      await fetchRecords();
    } catch (err: any) {
      alert(err.message || 'บันทึกข้อมูลล้มเหลว');
    }
  };

  // Delete a record
  const handleDeleteRecord = (id: string) => {
    handleVerifyAdmin(async () => {
      if (!confirm('คุณต้องการลบประวัติการรักษารายการนี้ใช่หรือไม่? ข้อมูลจะหายไปถาวร!')) {
        return;
      }

      try {
        const response = await fetch(`/api/records/${id}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          throw new Error('ลบข้อมูลไม่สำเร็จ');
        }

        await fetchRecords();
      } catch (err: any) {
        alert(err.message || 'ลบข้อมูลล้มเหลว');
      }
    });
  };

  // Reset database back to seed data
  const handleResetDb = async () => {
    const response = await fetch('/api/records/reset', {
      method: 'POST'
    });
    if (!response.ok) {
      throw new Error('รีเซ็ตฐานข้อมูลล้มเหลว');
    }
    const data = await response.json();
    setRecords(data.records);
  };

  // Clear database
  const handleClearDb = async () => {
    const response = await fetch('/api/records/clear', {
      method: 'POST'
    });
    if (!response.ok) {
      throw new Error('ล้างฐานข้อมูลล้มเหลว');
    }
    const data = await response.json();
    setRecords(data.records);
  };

  // Bulk import JSON backup
  const handleImportBackup = async (importedRecords: PatientRecord[]) => {
    const response = await fetch('/api/records/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(importedRecords)
    });
    if (!response.ok) {
      throw new Error('นำเข้าไฟล์กู้คืนล้มเหลว');
    }
    const data = await response.json();
    setRecords(data.records);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 text-gray-800 flex flex-col font-sans">
      
      {/* Top Clinical Header Banner */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          
          {/* Clinic Brand Title and Logo */}
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white transition-all duration-300 shrink-0 ${isPink ? 'bg-[#FF5B8C] shadow-pink-500/10' : 'bg-teal-600 shadow-teal-600/10'}`}>
              <Heart className="w-6 h-6 fill-current animate-pulse text-white" />
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-gray-900 tracking-tight leading-tight">
                  สหคลินิกเดชอุดม แลบ กายภาพบำบัด
                </h1>
                <span className={`px-2.5 py-0.5 text-[10px] font-bold border rounded-full transition-all duration-300 ${isPink ? 'bg-pink-50 text-pink-700 border-pink-100' : 'bg-teal-50 text-teal-700 border-teal-100'}`}>
                  {isPink ? 'สมุดบันทึกกายภาพ' : 'กายภาพบำบัด'}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1 font-medium">
                ระบบบันทึกและจัดการฐานข้อมูลประวัติการรักษาผู้เข้ารับบริการทางกายภาพบำบัด ประจำปี พ.ศ. 2569
              </p>
            </div>
          </div>

          {/* Quick Info & Action Controls */}
          <div className="flex flex-wrap items-center gap-3 self-stretch md:self-auto justify-between md:justify-end">
            
            {/* Database Capacity */}
            <div className="px-3.5 py-2 bg-gray-50 border border-gray-100 rounded-2xl flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full animate-ping ${isPink ? 'bg-[#FF5B8C]' : 'bg-emerald-500'}`}></span>
              <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">
                คลังข้อมูล: <span className={`font-bold font-mono transition-colors ${isPink ? 'text-pink-700' : 'text-teal-700'}`}>{records.length}</span> รายการ
              </span>
            </div>

            {/* Admin Authentication Status Badge */}
            {isAdmin ? (
              <button
                onClick={() => {
                  setIsAdmin(false);
                  alert('ออกจากระบบผู้ดูแลระบบสำเร็จ');
                }}
                className={`px-3.5 py-2 border rounded-2xl flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${isPink ? 'bg-pink-50 text-pink-700 border-pink-100 hover:bg-pink-100' : 'bg-teal-50 text-teal-700 border-teal-100 hover:bg-teal-100'}`}
                title="คลิกเพื่อออกจากระบบผู้ดูแลระบบ (Log out Admin)"
              >
                <Unlock className="w-3.5 h-3.5 shrink-0" />
                <span>ผู้ดูแลระบบ</span>
              </button>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="px-3.5 py-2 bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-600 rounded-2xl flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer"
                title="คลิกเพื่อลงชื่อเข้าใช้ผู้ดูแลระบบ (รหัสผ่าน: 123456)"
              >
                <Lock className="w-3.5 h-3.5 shrink-0" />
                <span>เข้าสู่ระบบ Admin</span>
              </button>
            )}

            {/* Dynamic Theme Changer Switcher Button */}
            <button
              onClick={() => setTheme(theme === 'teal' ? 'pink' : 'teal')}
              className={`px-3.5 py-2 text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition-all whitespace-nowrap ${isPink ? 'bg-teal-600 hover:bg-teal-700 shadow-teal-600/10' : 'bg-[#FF5B8C] hover:bg-[#E04D79] shadow-pink-500/10'}`}
              title="สลับธีมสี"
            >
              <Palette className="w-3.5 h-3.5 shrink-0" />
              <span>สลับเป็นธีม{isPink ? 'สีเขียว' : 'สีชมพู'}</span>
            </button>

            {/* Add Record Action Button */}
            <button
              onClick={handleAddClick}
              className={`px-4 py-2 text-white rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md whitespace-nowrap ${isPink ? 'bg-[#FF5B8C] hover:bg-[#E04D79] shadow-pink-500/10' : 'bg-teal-600 hover:bg-teal-700 shadow-teal-600/10'}`}
            >
              <Plus className="w-3.5 h-3.5" />
              เพิ่มรายการรับบริการ
            </button>
          </div>

        </div>
      </header>

      {/* Tabs Navigation Rail */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex gap-2">
            <button
              onClick={() => setActiveTab('spreadsheet')}
              className={`py-3.5 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${activeTab === 'spreadsheet' ? (isPink ? 'border-[#FF5B8C] text-[#FF5B8C]' : 'border-teal-600 text-teal-600') : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'}`}
            >
              <ListCollapse className="w-4 h-4" />
              สมุดบันทึกรายการ (Spreadsheet Log)
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-3.5 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${activeTab === 'dashboard' ? (isPink ? 'border-[#FF5B8C] text-[#FF5B8C]' : 'border-teal-600 text-teal-600') : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'}`}
            >
              <BarChart3 className="w-4 h-4" />
              สถิติ & สรุปภาพรวม (Dashboard)
            </button>
            <button
              onClick={() => setActiveTab('backup')}
              className={`py-3.5 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${activeTab === 'backup' ? (isPink ? 'border-[#FF5B8C] text-[#FF5B8C]' : 'border-teal-600 text-teal-600') : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'}`}
            >
              <Database className="w-4 h-4" />
              สำรองข้อมูล & ตั้งค่า (Backup & Controls)
            </button>
          </nav>
        </div>
      </div>

      {/* Main Container Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        
        {isLoading ? (
          <div className={`flex flex-col justify-center items-center py-24 gap-3 ${isPink ? 'text-[#FF5B8C]' : 'text-teal-600'}`}>
            <Loader2 className="w-10 h-10 animate-spin" />
            <span className="text-sm font-semibold text-gray-400">กำลังประมวลผลข้อมูลฐานข้อมูล...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-100 text-red-600 rounded-2xl p-6 text-center max-w-xl mx-auto my-12">
            <HelpCircle className="w-10 h-10 mx-auto text-red-500 mb-2" />
            <h3 className="font-bold mb-1">เกิดข้อผิดพลาดในการโหลดข้อมูล</h3>
            <p className="text-xs text-red-500 mb-4">{error}</p>
            <button 
              onClick={fetchRecords}
              className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition-all"
            >
              ลองใหม่อีกครั้ง
            </button>
          </div>
        ) : (
          <div>
            {activeTab === 'spreadsheet' && (
              <SpreadsheetLog
                records={records}
                onAddClick={handleAddClick}
                onEditClick={handleEditClick}
                onDeleteClick={handleDeleteRecord}
                theme={theme}
                isAdmin={isAdmin}
                onVerifyAdmin={handleVerifyAdmin}
              />
            )}

            {activeTab === 'dashboard' && (
              <Dashboard records={records} theme={theme} />
            )}

            {activeTab === 'backup' && (
              <BackupSettings
                records={records}
                onResetDb={handleResetDb}
                onClearDb={handleClearDb}
                onImportBackup={handleImportBackup}
                theme={theme}
                isAdmin={isAdmin}
                onVerifyAdmin={handleVerifyAdmin}
              />
            )}
          </div>
        )}

      </main>

      {/* Floating Intake Record Modal Popup */}
      {isModalOpen && (
        <RecordModal
          record={editingRecord}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveRecord}
          theme={theme}
        />
      )}

      {/* Floating Login Modal */}
      {showLoginModal && (
        <AdminLoginModal
          theme={theme}
          onClose={() => {
            setShowLoginModal(false);
            setPendingAdminAction(null);
          }}
          onSuccess={() => {
            setIsAdmin(true);
            if (pendingAdminAction) {
              pendingAdminAction();
              setPendingAdminAction(null);
            }
          }}
        />
      )}

      {/* Site Footer */}
      <footer className="bg-white border-t border-gray-100 px-6 py-5 mt-12 text-xs text-gray-400 font-medium">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
          <span>
            © 2026 สหคลินิกเดชอุดม แลบ กายภาพบำบัด. ระบบประมวลข้อมูลทางคลินิกแบบปลอดภัยความเสี่ยง
          </span>
          <span className="flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full inline-block animate-pulse ${isPink ? 'bg-[#FF5B8C]' : 'bg-teal-500'}`}></span>
            เทคโนโลยีจัดเก็บข้อมูลถาวรบนไฟล์เซิร์ฟเวอร์แบบปลอดภัย (Server File Persistence)
          </span>
        </div>
      </footer>

    </div>
  );
}
