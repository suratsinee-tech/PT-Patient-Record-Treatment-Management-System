import React, { useState } from 'react';
import { Lock, X, Check, ShieldAlert } from 'lucide-react';

interface AdminLoginModalProps {
  onClose: () => void;
  onSuccess: () => void;
  theme: 'teal' | 'pink';
}

export default function AdminLoginModal({ onClose, onSuccess, theme }: AdminLoginModalProps) {
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '123456') {
      onSuccess();
      onClose();
    } else {
      setErrorMsg('รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
    }
  };

  const isPink = theme === 'pink';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className={`p-5 flex justify-between items-center ${isPink ? 'bg-[#FFF0F4] border-b border-pink-100' : 'bg-teal-50/60 border-b border-teal-50'}`}>
          <div className="flex items-center gap-2">
            <Lock className={`w-4 h-4 ${isPink ? 'text-[#FF5B8C]' : 'text-teal-600'}`} />
            <h3 className="text-sm font-bold text-gray-900">เข้าสู่ระบบผู้ดูแลระบบ (Admin)</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-xs text-gray-500 leading-relaxed">
            กรุณาป้อนรหัสผ่านผู้ดูแลระบบ (Admin Password) เพื่อดำเนินการ ปรับปรุง แก้ไข หรือลบข้อมูลในระบบ
          </p>

          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              รหัสผ่านผู้ดูแลระบบ
            </label>
            <input
              type="password"
              placeholder="ป้อนรหัสผ่าน 6 หลัก..."
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              autoFocus
              className={`w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 ${isPink ? 'focus:ring-pink-400' : 'focus:ring-teal-500'} focus:border-transparent transition-all font-mono`}
            />
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-semibold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-500 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className={`px-4 py-2 text-xs font-bold text-white rounded-xl transition-all shadow-sm flex items-center gap-1 cursor-pointer ${isPink ? 'bg-[#FF5B8C] hover:bg-[#E04D79]' : 'bg-teal-600 hover:bg-teal-700'}`}
            >
              <Check className="w-3.5 h-3.5" />
              ยืนยันรหัสผ่าน
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
